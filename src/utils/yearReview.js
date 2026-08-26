import { parseNumber } from './number.js';
import { isWorkingSet, estimate1RM, detectMuscleGroup } from './helpers.js';
import { formatDay } from './dates.js';

/**
 * Yıl özeti.
 *
 * Uygulama her şeyi hafta ve blok ölçeğinde anlatıyor; en uzun pencere on iki
 * hafta. Ama bir yıl antrenman yapmış birinin gerçekten merak ettiği şey o
 * ölçekte değil: kaç seans, ne kadar ağırlık, hangi hareket ne kadar ilerledi,
 * en uzun seri neydi.
 *
 * Bu sayılar zaten kayıtta duruyor ama hiçbir yerde toplanmıyordu. Toplanınca
 * ortaya çıkan şey bir istatistik listesi değil, sürekliliğin kanıtı — ve
 * sürdürmenin en zor olduğu yerde en çok işe yarayan şey o.
 *
 * Yıl TAKVİM YILI değil, verilen tarihten geriye 12 ay: ocak ayında "bu yıl
 * 3 seans yaptın" demek anlamsız olurdu.
 */

export const buildYearReview = (workouts = [], {
  today = new Date(), resolveLoad = null, customExercises = [], months = 12,
} = {}) => {
  const bitis = new Date(today);
  bitis.setHours(23, 59, 59, 999);
  const baslangic = new Date(bitis);
  baslangic.setMonth(baslangic.getMonth() - months);
  const basStr = `${baslangic.getFullYear()}-${String(baslangic.getMonth() + 1).padStart(2, '0')}-${String(baslangic.getDate()).padStart(2, '0')}`;

  const donem = (workouts || [])
    .filter(w => w?.date && w.date >= basStr)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  if (donem.length === 0) return { hasData: false, sessions: 0 };

  let toplamSet = 0;
  let toplamTekrar = 0;
  let toplamTonaj = 0;
  let toplamDakika = 0;
  const hareketSayaci = new Map();
  const kasHacmi = new Map();
  const ayHarita = new Map();
  const enIyiler = new Map();
  const ilkler = new Map();

  donem.forEach(w => {
    toplamDakika += parseNumber(w.duration);
    const ay = w.date.slice(0, 7);
    ayHarita.set(ay, (ayHarita.get(ay) || 0) + 1);

    (w.exercises || []).forEach(ex => {
      if (!ex?.name) return;
      const calisma = (ex.sets || []).filter(s => isWorkingSet(s) && parseNumber(s.reps) > 0);
      if (calisma.length === 0) return;

      toplamSet += calisma.length;
      hareketSayaci.set(ex.name, (hareketSayaci.get(ex.name) || 0) + calisma.length);
      if (!ilkler.has(ex.name)) ilkler.set(ex.name, w.date);

      const { contributions } = detectMuscleGroup(ex.name, customExercises);
      Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
        kasHacmi.set(kas, (kasHacmi.get(kas) || 0) + calisma.length * parseNumber(agirlik));
      });

      calisma.forEach(s => {
        const yuk = resolveLoad ? parseNumber(resolveLoad(ex.name, s.weight, w)) : parseNumber(s.weight);
        toplamTekrar += parseNumber(s.reps);
        toplamTonaj += yuk * parseNumber(s.reps);
        const e = estimate1RM(yuk, s.reps, s.rir);
        if (e <= 0) return;
        const mevcut = enIyiler.get(ex.name);
        if (!mevcut) enIyiler.set(ex.name, { first: e, best: e, firstDate: w.date, bestDate: w.date });
        else if (e > mevcut.best) enIyiler.set(ex.name, { ...mevcut, best: e, bestDate: w.date });
      });
    });
  });

  // En çok gelişen hareketler: ilk ve en iyi tahmini 1RM arasındaki oran.
  // Mutlak fark kullanılsaydı ağır hareketler her zaman kazanırdı; 20 kg'lık
  // bir yan kaldırışın 5 kg artması, 150 kg'lık çömelişin 5 kg artmasından
  // çok daha büyük bir gelişim.
  const gelisenler = [...enIyiler.entries()]
    .filter(([name]) => (hareketSayaci.get(name) || 0) >= 6)
    .map(([name, v]) => ({
      name,
      from: Math.round(v.first * 10) / 10,
      to: Math.round(v.best * 10) / 10,
      gain: Math.round((v.best - v.first) * 10) / 10,
      percent: v.first > 0 ? Math.round(((v.best - v.first) / v.first) * 1000) / 10 : 0,
      bestDate: v.bestDate,
    }))
    .filter(x => x.gain > 0)
    .sort((a, b) => b.percent - a.percent);

  // En uzun kesintisiz hafta serisi.
  const haftalar = new Set(donem.map(w => {
    const d = new Date(`${w.date}T00:00:00`);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }));
  const haftaListesi = [...haftalar].sort();
  let enUzunSeri = 0;
  let simdiki = 0;
  let onceki = null;
  haftaListesi.forEach(h => {
    if (onceki) {
      const fark = Math.round((new Date(h) - new Date(onceki)) / 86400000);
      simdiki = fark === 7 ? simdiki + 1 : 1;
    } else simdiki = 1;
    enUzunSeri = Math.max(enUzunSeri, simdiki);
    onceki = h;
  });

  const aylar = [...ayHarita.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const enYogunAy = aylar.reduce((best, x) => (x[1] > best[1] ? x : best), aylar[0]);

  return {
    hasData: true,
    from: donem[0].date,
    to: donem[donem.length - 1].date,
    sessions: donem.length,
    sets: toplamSet,
    reps: toplamTekrar,
    tonnage: Math.round(toplamTonaj),
    minutes: Math.round(toplamDakika),
    hours: Math.round(toplamDakika / 60),
    exercises: hareketSayaci.size,
    newExercises: [...ilkler.entries()].filter(([, d]) => d >= basStr).length,
    topExercises: [...hareketSayaci.entries()]
      .map(([name, sets]) => ({ name, sets }))
      .sort((a, b) => b.sets - a.sets)
      .slice(0, 5),
    topMuscles: [...kasHacmi.entries()]
      .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5),
    mostImproved: gelisenler.slice(0, 5),
    streakWeeks: enUzunSeri,
    activeWeeks: haftaListesi.length,
    busiestMonth: enYogunAy ? { month: enYogunAy[0], sessions: enYogunAy[1] } : null,
    monthly: aylar.map(([month, sessions]) => ({ month, sessions })),
    averagePerWeek: haftaListesi.length > 0
      ? Math.round((donem.length / haftaListesi.length) * 10) / 10
      : 0,
    label: `${formatDay(donem[0].date, 'medium')} – ${formatDay(donem[donem.length - 1].date, 'medium')}`,
  };
};
