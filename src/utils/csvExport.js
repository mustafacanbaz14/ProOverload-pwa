import { parseNumber } from './number.js';
import { isWorkingSet, isWarmupSet, detectMuscleGroup, estimate1RM } from './helpers.js';
import { findActivity, findEffort } from './cardio.js';
import { summarizeSets } from './cardioSets.js';

/**
 * CSV dışa aktarma.
 *
 * JSON yedeği GERİ YÜKLEME için; tek satırda tüm uygulama durumu duruyor ve
 * elektronik tabloda açılamıyor. Bu modül farklı bir ihtiyaca bakıyor: veriyi
 * başka bir yerde analiz etmek. Her satır bir SET — pivot tablo, grafik ve
 * kendi hesaplarını kurmak için doğal biçim bu.
 */

/**
 * Bir hücreyi CSV için güvenli hale getirir.
 *
 * Hareket adlarında virgül olabiliyor ("Lateral Raise (Cable)"), notlarda
 * satır sonu ve tırnak olabiliyor. Kaçırılmazsa dosya sütun kayması yapıyor ve
 * bu sessizce oluyor — açan kişi yanlış sütundaki sayıyı doğru sanıyor.
 */
const cell = (value) => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const row = (cells) => cells.map(cell).join(';');

/**
 * Antrenman setlerini CSV'ye çevirir — satır başına bir set.
 *
 * Ayraç noktalı virgül: Türkçe yerelde Excel virgülü ondalık ayırıcı sayıyor ve
 * virgülle ayrılmış dosyayı tek sütuna yapıştırıyor. Ondalıklar da virgüle
 * çevriliyor ki hücreler sayı olarak tanınsın.
 */
export const workoutsToCsv = (workouts = [], {
  customExercises = [],
  resolveLoad = null,
} = {}) => {
  const basliklar = [
    'Tarih', 'Antrenman', 'Hareket', 'Birincil Kas', 'Set No', 'Set Tipi',
    'Agirlik (kg)', 'Gercek Yuk (kg)', 'Tekrar', 'RIR', 'Tempo', 'Form',
    'Hacim (kg)', 'Tahmini 1RM (kg)',
  ];

  // Ondalık ayırıcı: Türkçe Excel nokta yerine virgül bekliyor.
  const num = (n) => (Number.isFinite(n) ? String(Math.round(n * 100) / 100).replace('.', ',') : '');

  const satirlar = [];
  [...(workouts || [])]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(workout => {
      (workout.exercises || []).forEach(ex => {
        const { muscle } = detectMuscleGroup(ex.name, customExercises);
        let calismaSayaci = 0;

        (ex.sets || []).forEach(set => {
          const calisma = isWorkingSet(set);
          if (calisma) calismaSayaci += 1;

          const yazilan = parseNumber(set.weight);
          const yuk = resolveLoad ? resolveLoad(ex.name, set.weight, workout) : yazilan;
          const tekrar = parseNumber(set.reps);

          satirlar.push(row([
            workout.date,
            workout.name || '',
            ex.name,
            muscle,
            // Isınma setleri numaralandırılmıyor: hacme saymadıkları için
            // "3. set" demek yanıltıcı olurdu.
            calisma ? calismaSayaci : '',
            isWarmupSet(set) ? 'Isinma' : (set.setType || 'normal'),
            num(yazilan),
            num(yuk),
            tekrar || '',
            set.rir === '' || set.rir === undefined ? '' : num(parseNumber(set.rir)),
            set.tempo || '',
            set.formRating || '',
            calisma ? num(yuk * tekrar) : '',
            calisma ? num(estimate1RM(yuk, tekrar, set.rir)) : '',
          ]));
        });
      });
    });

  // BOM: Excel UTF-8'i ancak bu işaretle tanıyor, yoksa Türkçe karakterler bozuk açılıyor.
  return `\ufeff${[row(basliklar), ...satirlar].join('\r\n')}\r\n`;
};

/**
 * Kardiyo kayıtlarını CSV'ye çevirir — satır başına bir SET, defteri yoksa
 * bir kayıt.
 *
 * Set defteri (6.6) seansın yapısını tutuyor ama dışa aktarımda hiç yoktu:
 * yüzme seansı elektronik tabloya "45 dakika yüzme" olarak düşüyordu ve
 * stil/mesafe/tempo kayboluyordu. Defter varsa satırları açılıyor, yoksa tek
 * satır yazılıyor; ikisi de aynı sütun düzenini kullanıyor ki dosya tek bir
 * tablo olarak açılabilsin.
 */
export const cardioToCsv = (workouts = [], { poolLength = 25 } = {}) => {
  const basliklar = [
    'Tarih', 'Aktivite', 'Tempo', 'Set No', 'Tekrar', 'Mesafe (m)', 'Stil',
    'Set Tipi', 'Sure (sn)', 'Dinlenme (sn)', 'Tempo (sn/birim)', 'SWOLF',
    'Toplam Dakika', 'Ort. Nabiz', 'Not',
  ];
  const num = (n) => (Number.isFinite(n) ? String(Math.round(n * 100) / 100).replace('.', ',') : '');

  const satirlar = [];
  [...(workouts || [])]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(workout => {
      (workout.cardio || []).forEach(entry => {
        const aktivite = findActivity(entry?.type);
        const tempo = findEffort(entry?.effort);
        const ortak = [workout.date, aktivite?.label || entry?.type || '', tempo?.label || ''];

        const defter = summarizeSets(entry?.sets, entry?.type, { poolLength });
        if (defter.hasData) {
          defter.sets.forEach((r, i) => {
            satirlar.push(row([
              ...ortak, i + 1, r.reps, r.distance,
              r.stroke ? r.stroke.label : '', r.kind ? r.kind.label : '',
              r.seconds || '', r.restSeconds || '',
              r.paceSeconds ? num(r.paceSeconds) : '', r.swolf || '',
              // Toplam dakika yalnızca ilk satıra yazılıyor; her satıra
              // yazmak elektronik tabloda toplanınca seansı kat kat sayardı.
              i === 0 ? Math.round(defter.totalSeconds / 60) : '',
              i === 0 ? (parseNumber(entry.avgHeartRate) || '') : '',
              i === 0 ? (entry.note || '') : '',
            ]));
          });
          return;
        }

        satirlar.push(row([
          ...ortak, '', '', entry?.distanceKm ? Math.round(entry.distanceKm * 1000) : '',
          '', '', '', '', '', '',
          Math.round(parseNumber(entry?.minutes)) || '',
          parseNumber(entry?.avgHeartRate) || '',
          entry?.note || '',
        ]));
      });
    });

  return `\ufeff${[row(basliklar), ...satirlar].join('\r\n')}\r\n`;
};

/** Vücut ölçümlerini CSV'ye çevirir. */
export const metricsToCsv = (metricsHistory = []) => {
  const num = (n) => (Number.isFinite(n) && n > 0 ? String(Math.round(n * 100) / 100).replace('.', ',') : '');
  const basliklar = ['Tarih', 'Kilo (kg)', 'Yag Orani (%)', 'Boyun', 'Omuz', 'Gogus', 'Kol', 'Bel', 'Kalca', 'Uyluk', 'Baldir'];

  const satirlar = [...(metricsHistory || [])]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(m => row([
      m.date,
      num(parseNumber(m.weight)),
      num(parseNumber(m.bodyFat)),
      ...['neck', 'shoulder', 'chest', 'arm', 'waist', 'hip', 'thigh', 'calf']
        .map(k => num(parseNumber(m.measurements?.[k]))),
    ]));

  return `\ufeff${[row(basliklar), ...satirlar].join('\r\n')}\r\n`;
};

/** Beslenme günlerini CSV'ye çevirir — satır başına bir gün. */
export const nutritionToCsv = (nutritionHistory = [], dailyTotals) => {
  const num = (n) => (Number.isFinite(n) ? String(Math.round(n)) : '');
  const basliklar = ['Tarih', 'Kalori', 'Protein (g)', 'Karbonhidrat (g)', 'Yag (g)', 'Su (ml)', 'Adim'];

  const satirlar = [...(nutritionHistory || [])]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(n => {
      const t = dailyTotals(n);
      return row([
        n.date, num(t.calories), num(t.protein), num(t.carbs), num(t.fats),
        num(parseNumber(n.waterMl)), num(parseNumber(n.steps)),
      ]);
    });

  return `\ufeff${[row(basliklar), ...satirlar].join('\r\n')}\r\n`;
};
