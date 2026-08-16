import { parseNumber } from './number.js';
import { estimate1RM, isWorkingSet, detectMuscleGroup } from './helpers.js';
import { toLocalDate, dayKey, formatDayRelative } from './dates.js';

/**
 * Hareket rotasyonu.
 *
 * Uygulama duraklamayı (plateau) hareket bazında zaten yakalıyordu ama tek
 * bir soruyu yanıtlamıyordu: bu hareketi NE KADAR SÜREDİR yapıyorsun?
 *
 * İkisi aynı şey değil. Sekiz haftadır yapılan ve duraklamış bir hareket,
 * yorgunluk ya da beslenme sorunu olabilir; kırk haftadır yapılan ve
 * duraklamış bir hareket, büyük olasılıkla o hareketten alınabilecek uyaranın
 * sonuna gelmiş demek. İlkinde çözüm programı düzeltmek, ikincisinde hareketi
 * değiştirmek.
 *
 * Modül rotasyonu ZORUNLU KILMIYOR. Hareket değiştirmenin bir bedeli var:
 * yeni harekette teknik oturana kadar birkaç seans kaybediliyor ve yük
 * karşılaştırılabilirliği bozuluyor. Bu yüzden öneri yalnızca iki koşul
 * birlikte sağlandığında çıkıyor — hareket yeterince eski VE ilerleme durmuş.
 */

// Bu haftadan eski hareketler "uzun süredir yapılıyor" sayılıyor. Sekiz-on
// haftalık bir blok normal; asıl mesele blokların üst üste binmesi.
const LONG_TENURE_WEEKS = 16;
// Duraklama penceresi: son bu kadar seans karşılaştırılıyor.
const RECENT_SESSIONS = 4;
// Bu orandan az ilerleme "durdu" sayılıyor (tahmini 1RM üzerinden).
const STALL_RATIO = 0.015;
// En az bu kadar seans olmadan eğilim okunmuyor.
const MIN_SESSIONS = 5;

/** Bir hareketin seans seans en iyi tahmini 1RM'i, yeniden eskiye. */
const seansSerisi = (workouts, name, resolveLoad) => {
  const seri = [];
  (workouts || []).forEach(w => {
    let best = null;
    (w?.exercises || []).forEach(ex => {
      if (ex?.name !== name) return;
      (ex.sets || []).forEach(set => {
        if (!isWorkingSet(set)) return;
        const tekrar = parseNumber(set.reps);
        if (!(tekrar > 0) || tekrar > 12) return;
        const yuk = resolveLoad ? parseNumber(resolveLoad(name, set.weight, w)) : parseNumber(set.weight);
        if (!(yuk > 0)) return;
        const tahmin = estimate1RM(yuk, tekrar, set.rir);
        if (tahmin > 0 && (best === null || tahmin > best)) best = tahmin;
      });
    });
    if (best !== null) seri.push({ date: w.date, e1rm: Math.round(best * 10) / 10 });
  });
  return seri.sort((a, b) => (a.date < b.date ? 1 : -1));
};

/**
 * Hareket bazında yaş ve ilerleme durumu.
 *
 * @returns { rows, candidates, hasData }
 */
export const buildRotationReport = (workouts = [], {
  today = new Date(),
  resolveLoad = null,
  customExercises = [],
  minSessions = MIN_SESSIONS,
} = {}) => {
  const bugun = toLocalDate(dayKey(today));

  const adlar = new Set();
  (workouts || []).forEach(w => (w.exercises || []).forEach(ex => { if (ex?.name) adlar.add(ex.name); }));

  const rows = [...adlar].map(name => {
    const seri = seansSerisi(workouts, name, resolveLoad);
    if (seri.length < minSessions) return null;

    const ilk = toLocalDate(seri[seri.length - 1].date);
    const son = toLocalDate(seri[0].date);
    if (!ilk || !son || !bugun) return null;

    const haftaYasi = Math.floor((bugun - ilk) / (7 * 86400000));
    const gunSessiz = Math.floor((bugun - son) / 86400000);

    // İlerleme: son seansların en iyisi ile ondan önceki dönemin en iyisi.
    const yeni = seri.slice(0, RECENT_SESSIONS);
    const eski = seri.slice(RECENT_SESSIONS);
    if (eski.length === 0) return null;
    const enYeni = Math.max(...yeni.map(x => x.e1rm));
    const enEski = Math.max(...eski.map(x => x.e1rm));
    const degisim = enEski > 0 ? (enYeni - enEski) / enEski : 0;

    const durum = degisim > STALL_RATIO ? 'progressing'
      : degisim < -STALL_RATIO ? 'declining' : 'stalled';

    return {
      name,
      muscle: detectMuscleGroup(name, customExercises).muscle,
      sessions: seri.length,
      weeks: haftaYasi,
      firstDate: seri[seri.length - 1].date,
      lastDate: seri[0].date,
      lastLabel: formatDayRelative(seri[0].date, 'short'),
      daysSince: gunSessiz,
      bestRecent: enYeni,
      bestEarlier: enEski,
      changePercent: Math.round(degisim * 1000) / 10,
      status: durum,
      // Rotasyon adayı: hem eski hem durmuş. İkisinden biri eksikse öneri yok.
      rotationCandidate: haftaYasi >= LONG_TENURE_WEEKS && durum !== 'progressing',
    };
  }).filter(Boolean);

  rows.sort((a, b) => b.weeks - a.weeks);

  const candidates = rows.filter(r => r.rotationCandidate);

  return {
    rows,
    candidates,
    hasData: rows.length > 0,
    longTenureWeeks: LONG_TENURE_WEEKS,
  };
};

/** Rotasyonun günlük koç satırı. */
export const rotationCoachItem = (report) => {
  if (!report?.hasData || report.candidates.length === 0) return null;
  const ilk = report.candidates[0];
  return {
    key: 'rotation',
    exercise: ilk.name,
    title: `${ilk.name} ${ilk.weeks} haftadır programda ve ilerlemiyor`,
    detail: `Son ${RECENT_SESSIONS} seansın en iyisi ${ilk.bestRecent} kg, öncesinde ${ilk.bestEarlier} kg (${ilk.changePercent > 0 ? '+' : ''}${ilk.changePercent}%). Bu kadar uzun süredir yapılan ve durmuş bir hareket genelde verebileceği uyaranın sonuna gelmiştir. Aynı kası benzer açıdan çalıştıran bir varyanta geçmek — hareketi bırakmak değil, değiştirmek — çoğu zaman birkaç blok daha ilerleme açıyor.`,
  };
};
