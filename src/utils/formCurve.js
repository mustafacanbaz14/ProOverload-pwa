import { parseNumber } from './number.js';
import { isWorkingSet } from './helpers.js';

/**
 * Fitness–yorgunluk modeli (form eğrisi).
 *
 * Uygulama yükü tek bir sayı olarak görüyordu: bu haftanın hacmi. Ama
 * antrenmanın etkisi iki zıt bileşenden oluşuyor ve ikisi FARKLI HIZDA
 * sönüyor:
 *
 *  FITNESS   yavaş birikiyor, yavaş sönüyor (haftalar). Uzun vadeli kazanç.
 *  YORGUNLUK hızlı birikiyor, hızlı sönüyor (günler). Kısa vadeli bastırıcı.
 *
 * FORM = fitness − yorgunluk. Bu yüzden ağır bir haftadan sonra performans
 * düşük görünüyor ama birkaç gün hafifleyince beklenenden yükseğe çıkıyor:
 * yorgunluk söndü, fitness kaldı. Deload'un neden işe yaradığının modeli bu.
 *
 * Model üstel sönümlü impulse-response (Banister). Kesin bir tahmin aracı
 * değil — sabitler kişiye göre değişiyor ve burada literatürün yaygın
 * değerleri kullanılıyor. İşe yarayan tarafı mutlak sayı değil EĞİLİM: form
 * yükseliyor mu düşüyor mu, ve ağır bir haftanın etkisi ne zaman geçiyor.
 */

// Sönüm süreleri (gün). Fitness yavaş, yorgunluk hızlı.
const FITNESS_TAU = 42;
const FATIGUE_TAU = 7;
// Yorgunluğun ağırlığı: aynı yük yorgunluğa fitness'tan daha çok katkı
// veriyor, yoksa ağır haftalar hiç bastırmazdı.
const FATIGUE_GAIN = 1.8;
// Eğilim için gereken en az kayıt günü.
const MIN_DAYS = 14;

/** Bir seansın yük puanı: etkili set × ortalama efor. */
export const sessionLoad = (workout) => {
  const setler = (workout?.exercises || [])
    .flatMap(ex => (ex.sets || []).filter(s => isWorkingSet(s) && parseNumber(s.reps) > 0));
  if (setler.length === 0) return 0;

  // Efor çarpanı RIR'dan: tükenişe yakın setler daha çok yorgunluk üretiyor.
  // RIR 0 → 1.0, RIR 3 → 0.7, RIR 5+ → 0.5.
  const toplam = setler.reduce((t, s) => {
    const rir = Math.max(0, Math.min(5, parseNumber(s.rir)));
    return t + Math.max(0.5, 1 - rir * 0.1);
  }, 0);
  return Math.round(toplam * 10) / 10;
};

/**
 * Gün gün fitness / yorgunluk / form.
 *
 * @returns { hasData, days, today, trend, peak }
 */
export const buildFormCurve = (workouts = [], { today = new Date(), windowDays = 120 } = {}) => {
  const kayitlar = (workouts || []).filter(w => w?.date);
  if (kayitlar.length === 0) return { hasData: false, days: [] };

  const gunYuku = new Map();
  kayitlar.forEach(w => {
    const y = sessionLoad(w);
    if (y > 0) gunYuku.set(w.date, (gunYuku.get(w.date) || 0) + y);
  });
  if (gunYuku.size === 0) return { hasData: false, days: [] };

  const tarihler = [...gunYuku.keys()].sort();
  const ilk = new Date(`${tarihler[0]}T00:00:00`);
  const son = new Date(today);
  son.setHours(0, 0, 0, 0);

  const toplamGun = Math.round((son - ilk) / 86400000);
  if (toplamGun < MIN_DAYS) {
    return { hasData: false, days: [], reason: 'insufficient', dayCount: toplamGun, needed: MIN_DAYS };
  }

  const gunler = [];
  let fitness = 0;
  let yorgunluk = 0;

  for (let i = 0; i <= toplamGun; i += 1) {
    const d = new Date(ilk);
    d.setDate(ilk.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const yuk = gunYuku.get(key) || 0;

    // Önce sönüm, sonra o günün yükü: aynı gün yapılan antrenman o günün
    // formunu düşürüyor, yükseltmiyor.
    fitness = fitness * Math.exp(-1 / FITNESS_TAU) + yuk;
    yorgunluk = yorgunluk * Math.exp(-1 / FATIGUE_TAU) + yuk * FATIGUE_GAIN;

    gunler.push({
      date: key,
      load: yuk,
      fitness: Math.round(fitness * 10) / 10,
      fatigue: Math.round(yorgunluk * 10) / 10,
      form: Math.round((fitness - yorgunluk) * 10) / 10,
    });
  }

  const pencere = gunler.slice(-windowDays);
  const bugun = gunler[gunler.length - 1];
  const birHaftaOnce = gunler[gunler.length - 8] || gunler[0];

  // Eğilim: son yedi günde form yönü.
  const fark = bugun.form - birHaftaOnce.form;

  return {
    hasData: true,
    days: pencere,
    today: bugun,
    trend: {
      delta: Math.round(fark * 10) / 10,
      direction: fark > 1 ? 'rising' : fark < -1 ? 'falling' : 'flat',
    },
    peak: pencere.reduce((best, d) => (d.form > best.form ? d : best), pencere[0]),
    // Form pozitif ve yükseliyorsa ağır iş için iyi bir pencere.
    readyForHeavy: bugun.form > 0 && fark >= 0,
    // Yorgunluk fitness'ın belirgin üstündeyse toparlanma önceliği.
    overreached: bugun.fatigue > bugun.fitness * 1.15,
  };
};

/**
 * Formun önümüzdeki günlerde nereye gideceği — antrenman YAPILMAZSA.
 *
 * "Kaç gün dinlenirsem toparlanırım" sorusunun cevabı. Yorgunluk hızlı
 * söndüğü için form birkaç günde belirgin yükseliyor; fitness da sönüyor ama
 * çok daha yavaş, o yüzden kısa dinlenme net kazanç.
 */
export const projectRest = (curve, { days = 10 } = {}) => {
  if (!curve?.hasData) return [];
  let fitness = curve.today.fitness;
  let yorgunluk = curve.today.fatigue;
  const out = [];
  for (let i = 1; i <= days; i += 1) {
    fitness *= Math.exp(-1 / FITNESS_TAU);
    yorgunluk *= Math.exp(-1 / FATIGUE_TAU);
    out.push({
      dayOffset: i,
      form: Math.round((fitness - yorgunluk) * 10) / 10,
      fitness: Math.round(fitness * 10) / 10,
      fatigue: Math.round(yorgunluk * 10) / 10,
    });
  }
  return out;
};

/** Koç kartı: yalnızca aşırı yüklenme ya da belirgin taze pencere varsa. */
export const formCoachItem = (curve) => {
  if (!curve?.hasData) return null;

  if (curve.overreached) {
    const tahmin = projectRest(curve, { days: 7 });
    const pozitif = tahmin.find(d => d.form >= 0);
    return {
      key: 'form-overreached',
      tone: 'warn',
      title: 'Yorgunluk birikmiş durumda',
      detail: `Yorgunluk göstergesi fitness göstergesinin üstünde; bu, performansın olduğundan düşük görüneceği bir dönem. Yorgunluk fitness'tan çok daha hızlı söndüğü için kısa bir hafifleme net kazanç: ${pozitif ? `${pozitif.dayOffset} gün hafif çalışmayla form artıya dönüyor` : 'birkaç gün hafif çalışmak dengeyi geri getiriyor'}. Bu bir tahmin modeli, kesin bir ölçüm değil — eğilime bak, sayıya değil.`,
    };
  }

  if (curve.readyForHeavy && curve.trend.direction === 'rising') {
    return {
      key: 'form-peak',
      tone: 'good',
      title: 'Ağır iş için iyi bir pencere',
      detail: `Form göstergesi son bir haftada ${curve.trend.delta > 0 ? '+' : ''}${curve.trend.delta} yükseldi ve artıda. Yorgunluk sönmüş, fitness durmuş demektir — rekor denemesi ya da ağır bir seans için uygun dönem.`,
    };
  }

  return null;
};
