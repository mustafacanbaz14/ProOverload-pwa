import { parseNumber } from './number.js';
import { estimate1RM, isWorkingSet } from './helpers.js';
import { toLocalDate, dayKey } from './dates.js';

/**
 * Kuvvet standartları.
 *
 * Uygulama kuvveti hep KENDİ geçmişine göre değerlendiriyordu: 1RM eğilimi,
 * rekorlar, kuvvet dengesi. Bu doğru ama eksik bir çerçeve — "bench 100 kg"
 * cümlesinin ne anlama geldiğini söylemiyor. 60 kiloluk biri için olağanüstü
 * olan bir sayı, 110 kiloluk biri için başlangıç seviyesi.
 *
 * Standartlar VÜCUT AĞIRLIĞININ KATI olarak veriliyor; mutlak kilo yerine
 * oran kullanmak, farklı kilodaki insanları karşılaştırılabilir kılan tek
 * yol. Kadın ve erkek için ayrı katsayılar var: aynı vücut ağırlığında üst
 * gövde kuvvetinde belirgin, alt gövdede daha küçük bir fark var ve tek tablo
 * kullanmak kadınlarda her hareketi olduğundan kötü gösteriyordu.
 *
 * SAYILAR KESİN DEĞİL. Kaynaklar arasında %10-15 sapma normal ve yaş, kol
 * uzunluğu, teknik seçimi (duraklamalı mı, tam ROM mu) hepsini kaydırıyor.
 * Bu yüzden sonuç bir "not" değil bir konum: hangi bandın içindesin ve bir
 * sonraki banda ne kadar kaldı.
 */

export const STRENGTH_LEVELS = [
  { key: 'beginner', label: 'Yeni Başlayan', color: 'text-zinc-400', hint: 'İlk aylar; teknik oturuyor' },
  { key: 'novice', label: 'Acemi', color: 'text-cyan-400', hint: 'Düzenli antrenmanın ilk yılı' },
  { key: 'intermediate', label: 'Orta', color: 'text-emerald-400', hint: 'Birkaç yıllık tutarlı çalışma' },
  { key: 'advanced', label: 'İleri', color: 'text-amber-400', hint: 'Uzun süreli, planlı çalışma' },
  { key: 'elite', label: 'Elit', color: 'text-red-400', hint: 'Yarışmacı düzeye yakın' },
];

export const findLevel = (key) => STRENGTH_LEVELS.find(l => l.key === key) || STRENGTH_LEVELS[0];

/**
 * Hareket başına vücut ağırlığı katları.
 *
 * Sıra: yeni başlayan, acemi, orta, ileri, elit. Bir hareketin standardı
 * yoksa listede yer almıyor — uydurma bir tablo, tablo olmamasından kötü.
 */
export const STRENGTH_STANDARDS = [
  {
    key: 'squat', label: 'Squat',
    patterns: [/barbell back squat/i, /^back squat/i],
    male: [0.75, 1.25, 1.75, 2.25, 2.75],
    female: [0.5, 0.85, 1.25, 1.75, 2.2],
  },
  {
    key: 'bench', label: 'Bench Press',
    patterns: [/barbell bench press/i, /^bench press/i],
    male: [0.5, 0.85, 1.25, 1.75, 2.1],
    female: [0.3, 0.5, 0.75, 1.05, 1.4],
  },
  {
    key: 'deadlift', label: 'Deadlift',
    patterns: [/conventional deadlift/i, /sumo deadlift/i, /^deadlift/i],
    male: [1.0, 1.5, 2.25, 2.75, 3.25],
    female: [0.6, 1.0, 1.5, 2.0, 2.5],
  },
  {
    key: 'ohp', label: 'Overhead Press',
    patterns: [/overhead press/i, /\bohp\b/i],
    male: [0.35, 0.55, 0.8, 1.05, 1.35],
    female: [0.2, 0.35, 0.5, 0.7, 0.9],
  },
  {
    key: 'row', label: 'Barbell Row',
    patterns: [/barbell row/i, /pendlay row/i],
    male: [0.5, 0.75, 1.0, 1.3, 1.6],
    female: [0.3, 0.45, 0.65, 0.85, 1.1],
  },
  {
    key: 'pullup', label: 'Pull-up',
    // Barfikste standart, taşınan yük dahil toplam üzerinden okunuyor;
    // resolveLoad bunu zaten veriyor.
    patterns: [/^pull-?up$/i, /weighted pull-?up/i, /^chin-?up$/i],
    male: [0.9, 1.05, 1.25, 1.5, 1.8],
    female: [0.85, 1.0, 1.15, 1.35, 1.6],
  },
];

// Bu kadar günden eski en iyi kayıtlar güncel kuvveti temsil etmiyor.
const WINDOW_DAYS = 180;
// Tahminin güvenilir olması için tekrar sayısı sınırı.
const MAX_REPS_FOR_ESTIMATE = 10;
// En az bu kadar çalışma seti olmalı; tek set bir tahmin, seviye değil.
const MIN_SETS = 3;

/** Bir standardın hareketleri için penceredeki en iyi tahmini 1RM. */
const enIyi1RM = (workouts, patterns, { resolveLoad, since }) => {
  let best = null;
  let setSayisi = 0;

  (workouts || []).forEach(w => {
    if (since && w?.date) {
      const d = toLocalDate(w.date);
      if (d && d < since) return;
    }
    (w?.exercises || []).forEach(ex => {
      if (!ex?.name || !patterns.some(p => p.test(ex.name))) return;
      (ex.sets || []).forEach(set => {
        if (!isWorkingSet(set)) return;
        const tekrar = parseNumber(set.reps);
        if (!(tekrar > 0)) return;
        const yuk = resolveLoad ? parseNumber(resolveLoad(ex.name, set.weight, w)) : parseNumber(set.weight);
        if (!(yuk > 0)) return;
        setSayisi += 1;
        if (tekrar > MAX_REPS_FOR_ESTIMATE) return;
        const tahmin = estimate1RM(yuk, tekrar, set.rir);
        if (!(tahmin > 0)) return;
        if (best === null || tahmin > best.value) {
          best = {
            value: Math.round(tahmin * 10) / 10,
            exercise: ex.name, date: w.date, weight: yuk, reps: tekrar,
          };
        }
      });
    });
  });

  return (best && setSayisi >= MIN_SETS) ? best : null;
};

/** Oranın hangi banda düştüğü ve bir sonraki banda kalan. */
const seviyeBul = (oran, esikler) => {
  let index = -1;
  esikler.forEach((esik, i) => { if (oran >= esik) index = i; });

  const mevcut = index >= 0 ? STRENGTH_LEVELS[index] : null;
  const sonraki = index + 1 < STRENGTH_LEVELS.length ? STRENGTH_LEVELS[index + 1] : null;
  const sonrakiEsik = sonraki ? esikler[index + 1] : null;

  // Bant içindeki ilerleme: bir sonraki eşiğe ne kadar yaklaşıldığı.
  const alt = index >= 0 ? esikler[index] : 0;
  const ilerleme = sonrakiEsik && sonrakiEsik > alt
    ? Math.min(1, Math.max(0, (oran - alt) / (sonrakiEsik - alt)))
    : 1;

  return { level: mevcut, next: sonraki, nextRatio: sonrakiEsik, progress: ilerleme };
};

/**
 * Kuvvet standartları raporu.
 *
 * @returns { rows, hasData, overall }
 */
export const buildStrengthStandards = (workouts = [], {
  bodyWeightKg = 0,
  gender = 'male',
  resolveLoad = null,
  today = new Date(),
  windowDays = WINDOW_DAYS,
} = {}) => {
  const kilo = parseNumber(bodyWeightKg);
  const bugun = toLocalDate(dayKey(today));
  const since = bugun ? new Date(bugun) : null;
  if (since) since.setDate(bugun.getDate() - windowDays);

  if (!(kilo > 0)) {
    return { rows: [], hasData: false, missingWeight: true, overall: null, windowDays };
  }

  const rows = STRENGTH_STANDARDS.map(std => {
    const best = enIyi1RM(workouts, std.patterns, { resolveLoad, since });
    if (!best) return null;

    const esikler = gender === 'female' ? std.female : std.male;
    const oran = Math.round((best.value / kilo) * 100) / 100;
    const { level, next, nextRatio, progress } = seviyeBul(oran, esikler);

    return {
      key: std.key,
      label: std.label,
      best,
      ratio: oran,
      level,
      next,
      // Bir sonraki seviyeye kaç kilo kaldığı: oran soyut, kilo somut.
      kgToNext: nextRatio ? Math.max(0, Math.round((nextRatio * kilo - best.value) * 10) / 10) : 0,
      progress,
      thresholds: esikler.map(e => Math.round(e * kilo * 10) / 10),
    };
  }).filter(Boolean);

  // Genel seviye: en düşük ve en yüksek arasındaki fark, dengesizliğin
  // kendisi bir bilgi. Ortalama tek başına "her şey orta" diyerek bunu
  // gizliyordu.
  // Eşik altındaki hareket -1 sayılıyor, listeden DÜŞÜRÜLMÜYOR: ilk yazımda
  // seviyesi olmayan satırlar hesaba katılmıyordu ve en dengesiz durum —
  // bir hareketin ilk eşiğin bile altında kalması — fark aralığını sıfır
  // gösteriyordu.
  const index = (r) => (r.level ? STRENGTH_LEVELS.findIndex(l => l.key === r.level.key) : -1);
  const puanlar = rows.map(index);
  const overall = puanlar.length > 0
    ? {
      level: STRENGTH_LEVELS[Math.max(0, Math.round(puanlar.reduce((t, n) => t + n, 0) / puanlar.length))],
      weakest: rows.slice().sort((a, b) => index(a) - index(b))[0],
      strongest: rows.slice().sort((a, b) => index(b) - index(a))[0],
      spread: Math.max(...puanlar) - Math.min(...puanlar),
    }
    : null;

  return { rows, hasData: rows.length > 0, missingWeight: false, overall, windowDays, gender };
};

/** Kuvvet standartlarının günlük koç satırı. */
export const strengthStandardCoachItem = (report) => {
  if (!report?.hasData || !report.overall) return null;
  // Yalnızca belirgin bir dengesizlik varsa konuşuluyor; "orta seviyedesin"
  // bilgisi bir eylem üretmiyor.
  if (report.overall.spread < 2) return null;
  const z = report.overall.weakest;
  return {
    key: 'standards',
    title: `${z.label} diğer hareketlerin gerisinde`,
    detail: `${z.label} vücut ağırlığının ${z.ratio} katı (${z.level ? z.level.label.toLowerCase() : 'eşik altı'}), en güçlü hareketin ${report.overall.strongest.label} ise ${report.overall.strongest.level?.label.toLowerCase()}. Aradaki fark iki seviyeden fazla; geride kalan hareketi haftada bir fazladan çalışmak toplam kuvvete en çok katkıyı orada veriyor.`,
  };
};
