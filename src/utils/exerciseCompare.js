import { parseNumber } from './number.js';
import { isWorkingSet, estimate1RM, detectMuscleGroup } from './helpers.js';
import { lengthBias, LENGTH_BIAS_LABEL } from './selectionAudit.js';

/**
 * İki hareketi yan yana karşılaştırma.
 *
 * Hareket profili tek bir hareketi ayrıntılı anlatıyordu ama en pratik soru
 * karşılaştırmalı: "bench mi incline mı daha iyi gidiyor", "kabloya geçtiğim
 * hareket eskisinden daha mı iyi ilerliyor", "hangisini bırakayım". Bu
 * cevaplar iki profili açıp göz kararı kıyaslamayı gerektiriyordu.
 *
 * Karşılaştırma İDDİA ÜRETMİYOR: hangi hareketin "daha iyi" olduğunu
 * söylemiyor, çünkü bu kişiye, ekipmana ve hedefe bağlı. Ölçülebilir olanı
 * yan yana koyuyor — ilerleme hızı, hacim payı, sıklık, gerilme özelliği —
 * ve yorumu kullanıcıya bırakıyor.
 */

const MIN_SESSIONS = 3;

/** Bir hareketin karşılaştırılabilir istatistikleri. */
export const exerciseStats = (exerciseName, workouts = [], { resolveLoad = null, customExercises = [] } = {}) => {
  const noktalar = [];
  let toplamSet = 0;
  let toplamTonaj = 0;

  (workouts || []).forEach(w => {
    (w.exercises || []).forEach(ex => {
      if (ex?.name !== exerciseName) return;
      const calisma = (ex.sets || []).filter(s => isWorkingSet(s) && parseNumber(s.reps) > 0);
      if (calisma.length === 0) return;

      let enIyi = 0;
      calisma.forEach(s => {
        const yuk = resolveLoad ? parseNumber(resolveLoad(exerciseName, s.weight, w)) : parseNumber(s.weight);
        toplamTonaj += yuk * parseNumber(s.reps);
        const e = estimate1RM(yuk, s.reps, s.rir);
        if (e > enIyi) enIyi = e;
      });
      toplamSet += calisma.length;
      if (enIyi > 0) noktalar.push({ date: w.date, e1rm: enIyi });
    });
  });

  noktalar.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const { muscle, contributions, mechanics } = detectMuscleGroup(exerciseName, customExercises);

  // İlerleme: ilk ve son tahmini 1RM arasındaki HAFTALIK değişim. Toplam fark
  // kullanılsaydı iki yıldır yapılan hareket, iki aydır yapılanı her zaman
  // yenerdi — o bir ilerleme farkı değil, süre farkı.
  let haftalikArtis = null;
  if (noktalar.length >= 2) {
    const ilk = noktalar[0];
    const son = noktalar[noktalar.length - 1];
    const gun = (new Date(`${son.date}T00:00:00`) - new Date(`${ilk.date}T00:00:00`)) / 86400000;
    if (gun >= 14) haftalikArtis = Math.round(((son.e1rm - ilk.e1rm) / (gun / 7)) * 100) / 100;
  }

  return {
    name: exerciseName,
    muscle,
    mechanics,
    contributions,
    bias: lengthBias(exerciseName),
    biasLabel: LENGTH_BIAS_LABEL[lengthBias(exerciseName)],
    sessions: noktalar.length,
    sets: toplamSet,
    tonnage: Math.round(toplamTonaj),
    best: noktalar.length > 0 ? Math.max(...noktalar.map(p => p.e1rm)) : null,
    latest: noktalar.length > 0 ? noktalar[noktalar.length - 1].e1rm : null,
    first: noktalar.length > 0 ? noktalar[0].e1rm : null,
    firstDate: noktalar[0]?.date || null,
    lastDate: noktalar[noktalar.length - 1]?.date || null,
    weeklyGain: haftalikArtis,
    series: noktalar,
    enough: noktalar.length >= MIN_SESSIONS,
  };
};

/**
 * İki hareketin karşılaştırması.
 *
 * @returns { a, b, rows, sharedMuscles, note }
 */
export const compareExercises = (nameA, nameB, workouts = [], opts = {}) => {
  if (!nameA || !nameB || nameA === nameB) return null;
  const a = exerciseStats(nameA, workouts, opts);
  const b = exerciseStats(nameB, workouts, opts);

  const ortakKaslar = Object.keys(a.contributions || {})
    .filter(k => (b.contributions || {})[k] > 0);

  const satir = (label, av, bv, { unit = '', higherBetter = true, format = null } = {}) => {
    const bicim = format || ((v) => (v === null || v === undefined ? '—' : `${v}${unit}`));
    const kazanan = av === null || bv === null || av === bv
      ? null
      : (higherBetter ? (av > bv ? 'a' : 'b') : (av < bv ? 'a' : 'b'));
    return { label, a: bicim(av), b: bicim(bv), winner: kazanan };
  };

  const rows = [
    satir('Seans', a.sessions, b.sessions),
    satir('Toplam set', a.sets, b.sets),
    satir('En iyi 1RM', a.best, b.best, { unit: ' kg' }),
    satir('Şu anki 1RM', a.latest, b.latest, { unit: ' kg' }),
    satir('Haftalık artış', a.weeklyGain, b.weeklyGain, { unit: ' kg' }),
    satir('Toplam tonaj', a.tonnage, b.tonnage, { unit: ' kg' }),
    {
      label: 'Boy yüklenmesi',
      a: a.biasLabel,
      b: b.biasLabel,
      // Gerilmede yüklenme bir "kazanan" değil bir özellik; ikisi de değerli
      // ve program ikisini birden içermeli.
      winner: null,
    },
  ];

  return {
    a,
    b,
    rows,
    sharedMuscles: ortakKaslar,
    // Aynı kası çalıştırmıyorlarsa karşılaştırma sayıları yan yana koyuyor
    // ama "hangisi daha iyi" sorusu zaten anlamsız.
    comparable: ortakKaslar.length > 0,
    enoughData: a.enough && b.enough,
    minSessions: MIN_SESSIONS,
  };
};
