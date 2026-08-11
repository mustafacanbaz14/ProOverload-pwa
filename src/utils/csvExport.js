import { parseNumber } from './number.js';
import { isWorkingSet, isWarmupSet, detectMuscleGroup, estimate1RM } from './helpers.js';

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
