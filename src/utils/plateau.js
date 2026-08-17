import { parseNumber } from './number.js';
import { isWorkingSet, estimate1RM, detectMuscleGroup } from './helpers.js';

/**
 * Durgunluk (plato) tespiti.
 *
 * Uygulama tek tek seansları değerlendiriyordu — bu seans geçen seferden iyi
 * miydi, rekor kırıldı mı. Ama hipertrofide asıl karar noktası daha yavaş bir
 * ölçekte: bir hareket haftalardır ilerlemiyorsa yapılacak şey daha çok
 * denemek değil, DEĞİŞTİRMEK. Bu kararı verecek veri kayıtlarda vardı ama
 * kimse sormuyordu.
 *
 * Ölçüt tahmini 1RM eğilimi. Tonaj değil: tonaj set sayısıyla oynadığında
 * yanıltıyor (üç set yerine dört yapmak "ilerleme" gibi görünüyor). Tekrar
 * da değil: ağırlık değişince kıyaslanamaz hale geliyor. Tahmini 1RM ikisini
 * tek sayıda birleştiriyor.
 *
 * Plato İDDİA DEĞİL GÖZLEM: "şu tarihten beri en iyi tahminin şu" diyor,
 * sebebini söylemiyor — sebep uyku, kalori ya da programın kendisi olabilir
 * ve bunu uygulama bilemez.
 */

// Bir hareketin değerlendirilebilmesi için en az bu kadar seans gerekiyor.
// Altında kalan veriden eğilim çıkarmak gürültüyü yorumlamak olurdu.
const MIN_SESSIONS = 4;
// Bu kadar seanstır en iyi değeri geçemiyorsa durgun sayılıyor.
const STALL_SESSIONS = 3;
// Gerileme eşiği: en iyiden yüzde kaç aşağıda.
const REGRESSION_PCT = 0.05;

/** Bir hareketin seans seans en iyi tahmini 1RM'i, yeniden eskiye. */
export const exerciseTrend = (exerciseName, workouts = [], { resolveLoad = null } = {}) => {
  const noktalar = [];

  (workouts || []).forEach(w => {
    (w.exercises || []).forEach(ex => {
      if (ex?.name !== exerciseName) return;
      const calisma = (ex.sets || []).filter(s => isWorkingSet(s) && parseNumber(s.reps) > 0);
      if (calisma.length === 0) return;

      let enIyi = 0;
      let enIyiSet = null;
      calisma.forEach(s => {
        const yuk = resolveLoad ? parseNumber(resolveLoad(exerciseName, s.weight, w)) : parseNumber(s.weight);
        const e = estimate1RM(yuk, s.reps, s.rir);
        if (e > enIyi) { enIyi = e; enIyiSet = { weight: yuk, reps: parseNumber(s.reps), rir: parseNumber(s.rir) }; }
      });
      if (enIyi > 0) {
        noktalar.push({
          date: w.date,
          e1rm: Math.round(enIyi * 10) / 10,
          best: enIyiSet,
          sets: calisma.length,
        });
      }
    });
  });

  return noktalar.sort((a, b) => String(b.date).localeCompare(String(a.date)));
};

/**
 * Tek hareket için durgunluk değerlendirmesi.
 *
 * @returns { status, sessions, ... } — status: 'progressing' | 'stalling' | 'regressing' | 'insufficient'
 */
export const assessExercise = (exerciseName, workouts = [], opts = {}) => {
  const seri = exerciseTrend(exerciseName, workouts, opts);
  if (seri.length < MIN_SESSIONS) {
    return { name: exerciseName, status: 'insufficient', sessions: seri.length, series: seri };
  }

  const enIyi = seri.reduce((best, x) => (x.e1rm > best.e1rm ? x : best), seri[0]);
  const sonuncu = seri[0];
  // En iyi değerden bu yana kaç seans geçti.
  const enIyiIndex = seri.findIndex(x => x.date === enIyi.date && x.e1rm === enIyi.e1rm);
  const sonrakiSeans = enIyiIndex;

  const dususOrani = enIyi.e1rm > 0 ? (enIyi.e1rm - sonuncu.e1rm) / enIyi.e1rm : 0;

  let status = 'progressing';
  if (dususOrani >= REGRESSION_PCT) status = 'regressing';
  else if (sonrakiSeans >= STALL_SESSIONS) status = 'stalling';

  return {
    name: exerciseName,
    status,
    sessions: seri.length,
    series: seri,
    best: enIyi,
    latest: sonuncu,
    // En iyi değerden sonra kaç seans geçti — durgunluğun "yaşı".
    sessionsSinceBest: sonrakiSeans,
    dropPercent: Math.round(dususOrani * 1000) / 10,
  };
};

/**
 * Durgunluktan çıkış önerileri.
 *
 * Öneriler SIRALI: en ucuz müdahale önce. Hareket değiştirmek en pahalısı
 * çünkü yeni harekette teknik öğrenme süresi var ve o süre boyunca sayılar
 * zaten düşük görünür.
 */
export const plateauAdvice = (assessment, { muscle = null } = {}) => {
  if (!assessment || assessment.status === 'progressing' || assessment.status === 'insufficient') return [];

  const oneriler = [];
  const gerileme = assessment.status === 'regressing';

  if (gerileme) {
    oneriler.push({
      key: 'recovery',
      title: 'Önce toparlanmaya bak',
      detail: `En iyi değerinin %${assessment.dropPercent} altındasın. Gerileme çoğunlukla programın değil toparlanmanın işareti: uyku, kalori ve haftalık toplam hacim. Bunlar yerindeyse bir sonraki adıma geç.`,
    });
  }

  oneriler.push({
    key: 'deload',
    title: 'Bir hafta yükü geri çek',
    detail: `${assessment.sessionsSinceBest} seanstır en iyi değerini geçemiyorsun. Yükü %10 azaltıp bir hafta çalışmak biriken yorgunluğu boşaltıyor; çoğu durgunluk bundan sonra kendiliğinden açılıyor.`,
  });

  oneriler.push({
    key: 'reprange',
    title: 'Tekrar aralığını değiştir',
    detail: 'Aynı harekette 6-10 yerine 12-15 (ya da tersi) çalışmak, kasa alışmadığı bir uyaran veriyor. Ağırlık düşer ama bu gerileme değil — farklı bir aralıkta çalışıyorsun.',
  });

  oneriler.push({
    key: 'variation',
    title: 'Varyanta geç',
    detail: `${muscle ? `${muscle} için ` : ''}aynı kası farklı bir açıyla yükleyen bir varyant seç. Hareketi tamamen bırakmak yerine varyanta geçmek, kazandığın gücü koruyup uyaranı tazeliyor. Birkaç blok sonra eski harekete dönebilirsin.`,
  });

  return oneriler;
};

/**
 * Bütün hareketler için tarama.
 *
 * Yalnızca YETERİ KADAR veri olan hareketler değerlendiriliyor ve sonuç
 * durgunluk derecesine göre sıralanıyor. Liste kısa tutuluyor: on beş
 * hareketlik bir uyarı yığını okunmaz.
 */
export const scanPlateaus = (workouts = [], { resolveLoad = null, customExercises = [], limit = 6 } = {}) => {
  const adlar = new Set();
  (workouts || []).forEach(w => (w.exercises || []).forEach(ex => { if (ex?.name) adlar.add(ex.name); }));

  const degerlendirmeler = [...adlar]
    .map(ad => assessExercise(ad, workouts, { resolveLoad }))
    .filter(a => a.status === 'stalling' || a.status === 'regressing')
    .map(a => ({
      ...a,
      muscle: detectMuscleGroup(a.name, customExercises).muscle,
      advice: plateauAdvice(a, { muscle: detectMuscleGroup(a.name, customExercises).muscle }),
    }))
    // Gerileyenler durgunlardan önce; ikisi de varsa daha uzun süredir
    // takılan önce.
    .sort((a, b) => (Number(b.status === 'regressing') - Number(a.status === 'regressing'))
      || (b.sessionsSinceBest - a.sessionsSinceBest));

  return {
    items: degerlendirmeler.slice(0, limit),
    total: degerlendirmeler.length,
    hasData: degerlendirmeler.length > 0,
    regressing: degerlendirmeler.filter(a => a.status === 'regressing').length,
  };
};

/** Koç kartı için tek satırlık özet. */
export const plateauCoachItem = (report) => {
  if (!report?.hasData) return null;
  const ilk = report.items[0];
  return {
    key: 'plateau',
    tone: ilk.status === 'regressing' ? 'warn' : 'info',
    title: ilk.status === 'regressing'
      ? `${ilk.name} en iyisinin %${ilk.dropPercent} altında`
      : `${ilk.name} ${ilk.sessionsSinceBest} seanstır ilerlemiyor`,
    detail: `${ilk.advice[0]?.title}: ${ilk.advice[0]?.detail}`
      + (report.total > 1 ? ` Toplam ${report.total} harekette durgunluk var.` : ''),
  };
};
