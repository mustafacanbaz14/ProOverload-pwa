import { parseNumber } from './number.js';
import { isCompletedWorkingSet, detectMuscleGroup } from './helpers.js';

/**
 * Set sayma yöntemleri: aynı seans, üç farklı sayı.
 *
 * Kullanıcının kafasını en çok karıştıran şey buydu ve uygulamanın hiçbir
 * yerinde açıklanmıyordu. Bench press yapan biri göğsüne kaç set yazmış olur?
 *
 *  DOĞRUDAN  — yalnızca o kası birincil hedefleyen setler. Bench göğse 1,
 *              tricepse 0.
 *  KESİRLİ   — dolaylı çalışma yarım sayılır. Bench göğse 1, tricepse 0.5.
 *  TOPLAM    — hareket o kası çalıştırıyorsa tam sayılır. Bench göğse 1,
 *              tricepse 1.
 *
 * Uygulama KESİRLİ sayıyor ve bu bilinçli bir tercih: Pelland ve ark. (2026)
 * üç yöntemi de meta-regresyona soktu ve kesirli yöntemin sonuçları en iyi
 * açıkladığını buldu. Uygulamanın katkı modeli (birincil 1, yardımcı 0.5,
 * hafif 0.25) zaten buydu.
 *
 * Ama internetteki tavsiyelerin ÇOĞU toplam sayıyor. "Haftada 30 set göğüs"
 * diyen biriyle uygulamanın "14 set" demesi çelişki gibi görünüyor; oysa
 * çoğunlukla aynı programı iki farklı birimle ölçüyorlar. Bu modül iki sayıyı
 * da üretiyor ki karşılaştırma yapılabilsin.
 */

export const COUNTING_METHODS = {
  direct: {
    key: 'direct', label: 'Doğrudan', short: 'doğrudan',
    hint: 'Yalnızca o kası birincil hedefleyen setler.',
  },
  fractional: {
    key: 'fractional', label: 'Kesirli', short: 'kesirli',
    hint: 'Dolaylı çalışma yarım sayılır. Uygulamanın kullandığı yöntem; meta-regresyonda en güçlü kanıt bunda.',
  },
  total: {
    key: 'total', label: 'Toplam', short: 'toplam',
    hint: 'Kası çalıştıran her set tam sayılır. Çevrimiçi tavsiyelerin çoğu bu birimde konuşuyor.',
  },
};

/**
 * Yarışmacı fizik sporcularının pratikte yaptığı haftalık hacim.
 *
 * Kaynak: 154 yarışmacı üzerinde yapılan anket (Frontiers, 2025). Sayılar
 * TOPLAM set birimindedir — uygulamanın kesirli sayılarıyla doğrudan
 * karşılaştırılamaz ve arayüzde bu her zaman yazılıyor.
 *
 * Bu tablo bir HEDEF değil, bir referans: bu hacimlerin gerekli olduğunu
 * gösteren doğrudan bir deneme yok, hatta 9 ile 36 kesirli seti karşılaştıran
 * denklik denemesi tersini bulmuş durumda. Yine de "insanlar gerçekte ne
 * yapıyor" sorusunun dürüst cevabı.
 */
export const PHYSIQUE_REFERENCE = {
  'Göğüs': [20, 32], 'Kanat': [24, 32], 'Orta Sırt': [20, 30],
  'Yan Omuz': [18, 34], 'Ön Omuz': [12, 22], 'Arka Omuz': [12, 22],
  'Biseps': [12, 19], 'Triseps': [12, 18],
  'Quadriceps': [16, 24], 'Hamstring': [14, 19], 'Kalça': [10, 20],
  'Baldır': [14, 20], 'Karın': [5, 15],
};

/** Bir hareketin bir kasa yazdığı set — seçilen yönteme göre. */
export const setWeight = (contribution, method = 'fractional') => {
  const w = parseNumber(contribution);
  if (!(w > 0)) return 0;
  if (method === 'total') return 1;
  if (method === 'direct') return w >= 1 ? 1 : 0;
  return w;
};

/**
 * Bir antrenman listesinden kas kas üç sayı.
 *
 * @returns { byMuscle: { [kas]: { direct, fractional, total } }, weeks, sessions }
 */
export const countWeeklySets = (workouts = [], {
  customExercises = [], weeks = 4, now = new Date(),
} = {}) => {
  const sinir = new Date(now);
  sinir.setDate(sinir.getDate() - weeks * 7);

  const pencere = (workouts || []).filter(w => w?.date && new Date(w.date) >= sinir);
  const byMuscle = {};

  pencere.forEach(w => (w.exercises || []).forEach(ex => {
    const setSayisi = (ex.sets || []).filter(isCompletedWorkingSet).length;
    if (setSayisi === 0) return;
    const { contributions } = detectMuscleGroup(ex.name, customExercises);
    Object.entries(contributions || {}).forEach(([kas, katki]) => {
      const kayit = byMuscle[kas] || { direct: 0, fractional: 0, total: 0 };
      kayit.direct += setSayisi * setWeight(katki, 'direct');
      kayit.fractional += setSayisi * setWeight(katki, 'fractional');
      kayit.total += setSayisi * setWeight(katki, 'total');
      byMuscle[kas] = kayit;
    });
  }));

  // Haftalığa çevir ve çeyrek sete yuvarla.
  const yuvarla = (v) => Math.round((v / Math.max(1, weeks)) * 4) / 4;
  Object.keys(byMuscle).forEach(kas => {
    byMuscle[kas] = {
      direct: yuvarla(byMuscle[kas].direct),
      fractional: yuvarla(byMuscle[kas].fractional),
      total: yuvarla(byMuscle[kas].total),
    };
  });

  return {
    byMuscle,
    weeks,
    sessions: pencere.length,
    hasData: pencere.length > 0,
    rows: Object.entries(byMuscle)
      .map(([muscle, v]) => ({
        muscle,
        ...v,
        reference: PHYSIQUE_REFERENCE[muscle] || null,
        // Toplam ile kesirli arasındaki oran: 1'e yakınsa o kas ağırlıklı
        // doğrudan çalışılıyor, 2'ye yakınsa neredeyse tamamı dolaylı geliyor.
        indirectRatio: v.fractional > 0 ? Math.round((v.total / v.fractional) * 100) / 100 : null,
      }))
      .filter(r => r.total > 0)
      .sort((a, b) => b.fractional - a.fractional),
  };
};

/** Kesirli ile toplam arasındaki farkın tek cümlelik açıklaması. */
export const describeGap = (row) => {
  if (!row || !(row.total > 0)) return '';
  if (row.indirectRatio === null || row.indirectRatio < 1.15) {
    return `${row.muscle} setlerinin neredeyse tamamı doğrudan; iki sayım da aynı sonucu veriyor.`;
  }
  const dolayli = Math.round((row.total - row.fractional) * 4) / 4;
  return `${row.muscle}: ${row.fractional} kesirli set — ama toplam sayımla ${row.total}.`
    + ` Aradaki ${dolayli} set dolaylı çalışmadan geliyor (başka hareketlerin bu kasa yazdığı yarım paylar).`
    + ' Çevrimiçi tavsiyelerin çoğu toplam birimde konuşuyor; karşılaştırırken sağdaki sayıya bak.';
};

/** Fizik sporcusu referansıyla karşılaştırma — birim uyarısıyla birlikte. */
export const compareToReference = (row) => {
  if (!row?.reference) return null;
  const [alt, ust] = row.reference;
  const konum = row.total < alt ? 'below' : row.total > ust ? 'above' : 'within';
  return {
    range: row.reference,
    total: row.total,
    position: konum,
    note: konum === 'within'
      ? `Toplam sayımla ${row.total} set — yarışmacı fizik sporcularının bildirdiği ${alt}-${ust} aralığında.`
      : konum === 'below'
        ? `Toplam sayımla ${row.total} set — yarışmacıların bildirdiği ${alt}-${ust} aralığının altında. Bu bir eksiklik değil: o hacimlerin gerekli olduğunu gösteren doğrudan bir deneme yok.`
        : `Toplam sayımla ${row.total} set — yarışmacıların bildirdiği ${alt}-${ust} aralığının da üstünde.`,
  };
};
