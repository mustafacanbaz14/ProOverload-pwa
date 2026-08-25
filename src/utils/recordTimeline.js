import { parseNumber } from './number.js';
import { isWorkingSet, estimate1RM, detectMuscleGroup } from './helpers.js';
import { formatDay } from './dates.js';

/**
 * Rekor zaman çizelgesi.
 *
 * Uygulama rekorları hareket başına tutuyordu: bir hareketin profilini açınca
 * en iyisini görüyordun. Ama "son üç ayda kaç rekor kırdım", "hangi kas
 * ilerliyor, hangisi durdu" soruları için on beş profili tek tek açmak
 * gerekiyordu. Rekorların tamamını zaman sırasına dizmek bunu tek ekrana
 * indiriyor.
 *
 * Rekor tanımı: O ANA KADARKİ en iyi tahmini 1RM'in aşılması. Yani liste
 * geriye dönük değil ileriye doğru kuruluyor — bir set, yapıldığı gün rekor
 * olduysa rekor sayılıyor, sonradan geçilmiş olması onu listeden düşürmüyor.
 * Bu, "o gün ne başardım" sorusunun doğru cevabı; bugünün gözünden bakıp
 * geçmişteki başarıları silmek olmazdı.
 *
 * Isınma setleri ve 15 toplam tekrarın üstü sayılmıyor: Epley o bölgede
 * güvenilir değil ve yüksek tekrarlı bir set uydurma bir rekor üretirdi.
 */

const MIN_GAIN = 0.5;

/**
 * Bütün rekorlar, yeniden eskiye.
 *
 * @returns { items, hasData, byMuscle, recentCount }
 */
export const buildRecordTimeline = (workouts = [], {
  resolveLoad = null, customExercises = [], recentDays = 90, today = new Date(), limit = 40,
} = {}) => {
  // Eskiden yeniye gezilmeli: "o gün rekor muydu" sorusu ancak kronolojik
  // sırada cevaplanabiliyor.
  const sirali = [...(workouts || [])]
    .filter(w => w?.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const enIyiler = new Map();
  const kayitlar = [];

  sirali.forEach(w => {
    (w.exercises || []).forEach(ex => {
      if (!ex?.name) return;
      let gunlukEnIyi = null;
      (ex.sets || []).forEach(s => {
        if (!isWorkingSet(s)) return;
        const yuk = resolveLoad ? parseNumber(resolveLoad(ex.name, s.weight, w)) : parseNumber(s.weight);
        const e = estimate1RM(yuk, s.reps, s.rir);
        if (e <= 0) return;
        if (!gunlukEnIyi || e > gunlukEnIyi.e1rm) {
          gunlukEnIyi = { e1rm: e, weight: yuk, reps: parseNumber(s.reps), rir: parseNumber(s.rir) };
        }
      });
      if (!gunlukEnIyi) return;

      const onceki = enIyiler.get(ex.name);
      if (!onceki || gunlukEnIyi.e1rm > onceki + MIN_GAIN) {
        kayitlar.push({
          date: w.date,
          label: formatDay(w.date, 'short'),
          exercise: ex.name,
          muscle: detectMuscleGroup(ex.name, customExercises).muscle,
          weight: gunlukEnIyi.weight,
          reps: gunlukEnIyi.reps,
          e1rm: Math.round(gunlukEnIyi.e1rm * 10) / 10,
          previous: onceki ? Math.round(onceki * 10) / 10 : null,
          gain: onceki ? Math.round((gunlukEnIyi.e1rm - onceki) * 10) / 10 : null,
          first: !onceki,
        });
        enIyiler.set(ex.name, gunlukEnIyi.e1rm);
      }
    });
  });

  const sinir = new Date(today);
  sinir.setDate(sinir.getDate() - recentDays);
  const sinirStr = `${sinir.getFullYear()}-${String(sinir.getMonth() + 1).padStart(2, '0')}-${String(sinir.getDate()).padStart(2, '0')}`;

  const yakinlar = kayitlar.filter(k => k.date >= sinirStr);

  // Kas bazında dağılım: hangi bölge ilerliyor.
  const kasSayaci = new Map();
  yakinlar.forEach(k => {
    if (!k.muscle) return;
    kasSayaci.set(k.muscle, (kasSayaci.get(k.muscle) || 0) + 1);
  });

  const tersSirali = [...kayitlar].reverse();

  return {
    items: tersSirali.slice(0, limit),
    total: kayitlar.length,
    hasData: kayitlar.length > 0,
    recentCount: yakinlar.length,
    recentDays,
    // İlk kez yapılan hareketler rekor listesini şişirebiliyor; ayrı sayılıyor.
    firstTimeCount: yakinlar.filter(k => k.first).length,
    byMuscle: [...kasSayaci.entries()]
      .map(([muscle, count]) => ({ muscle, count }))
      .sort((a, b) => b.count - a.count),
    // Son rekorun üstünden kaç gün geçti: durgunluğun en basit göstergesi.
    daysSinceLast: (() => {
      if (kayitlar.length === 0) return null;
      const son = new Date(`${tersSirali[0].date}T00:00:00`);
      const bugun = new Date(today);
      bugun.setHours(0, 0, 0, 0);
      return Math.max(0, Math.round((bugun - son) / 86400000));
    })(),
  };
};
