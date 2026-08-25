import { parseNumber } from './number.js';
import { isWorkingSet, estimate1RM } from './helpers.js';
import { roundToLoadable, smallestPlateOf, AVAILABLE_PLATES } from './plates.js';
import { detectEquipment } from './substitution.js';

/**
 * Tek tekrar maksimum (1RM) test protokolü.
 *
 * Uygulama 1RM'i her yerde TAHMİN ediyor (Epley) ve bu tahmin çoğu iş için
 * yeterli. Ama tahmin, tekrar sayısı arttıkça sapıyor ve kuvvet standartları
 * gibi karşılaştırmalar gerçek bir maksimuma dayandığında çok daha anlamlı.
 * Gerçek maksimumu ölçmek isteyen kişi için uygulamada hiçbir rehber yoktu:
 * ne ısınma merdiveni, ne deneme seçimi, ne de sonucu kaydedecek bir yer.
 *
 * Protokol muhafazakâr: az sayıda deneme, aralarında uzun dinlenme. Çok
 * deneme yapmak yorgunluk biriktiriyor ve gerçek maksimumu OLDUĞUNDAN DÜŞÜK
 * ölçtürüyor — testin kendisi sonucu bozuyor.
 *
 * Bu bir tavsiye değil bir araç: maksimum testi her blokta yapılacak bir şey
 * değil ve modül bunu açıkça söylüyor.
 */

// Denemeler arası dinlenme (saniye). Kısası sonucu düşürüyor.
export const ATTEMPT_REST_SECONDS = 300;
// En fazla deneme sayısı. Üçten fazlası yorgunlukla maksimumu bastırıyor.
export const MAX_ATTEMPTS = 3;

/**
 * Isınma merdiveni + deneme planı.
 *
 * Başlangıç tahmini nereden geliyor: kullanıcının verdiği hedef, yoksa
 * geçmişin en iyi tahmini 1RM'i. İkisi de yoksa plan kurulmuyor — neye
 * yükseleceğini bilmeden maksimum denemek güvenli değil.
 *
 * @returns { warmups, attempts, estimate, restSeconds } | null
 */
export const buildMaxTestPlan = (exerciseName, {
  estimate1RM: hedefTahmin = 0, history = [], barWeight = 20, plates = null, resolveLoad = null,
} = {}) => {
  if (!exerciseName) return null;

  let taban = parseNumber(hedefTahmin);
  if (taban <= 0) {
    let enIyi = 0;
    (history || []).forEach(w => {
      (w.exercises || []).forEach(ex => {
        if (ex?.name !== exerciseName) return;
        (ex.sets || []).forEach(s => {
          if (!isWorkingSet(s)) return;
          const yuk = resolveLoad ? parseNumber(resolveLoad(exerciseName, s.weight, w)) : parseNumber(s.weight);
          const e = estimate1RM(yuk, s.reps, s.rir);
          if (e > enIyi) enIyi = e;
        });
      });
    });
    taban = enIyi;
  }
  if (taban <= 0) return { reason: 'no-estimate' };

  const ekipman = detectEquipment(exerciseName);
  const bar = ekipman?.key === 'barbell' ? barWeight : 0;
  const envanter = plates || AVAILABLE_PLATES;
  const adim = smallestPlateOf(envanter);
  const yuvarla = (raw) => roundToLoadable(raw, bar, adim);

  // Isınma: tekrar sayısı düşerken yük artıyor. Son ısınma %90'ın altında
  // kalıyor — maksimumdan önce sinir sistemini yormamak için.
  const warmups = [
    { pct: 0.5, reps: 5 },
    { pct: 0.7, reps: 3 },
    { pct: 0.85, reps: 1 },
  ]
    .map(({ pct, reps }) => ({ weight: yuvarla(taban * pct), reps, label: `%${Math.round(pct * 100)}` }))
    .filter((w, i, dizi) => w.weight > bar && dizi.findIndex(x => x.weight === w.weight) === i);

  // Denemeler: tahminin biraz altından başlayıp üstüne çıkıyor. İlk deneme
  // KESİN kaldırılabilecek bir yük olmalı; başarısız bir ilk deneme hem
  // güveni hem kalan denemeleri harcıyor.
  const attempts = [
    { pct: 0.95, label: '1. deneme', note: 'Kesin kaldıracağın yük. Teknik provası.' },
    { pct: 1.0, label: '2. deneme', note: 'Tahmini maksimumun. Buraya kadar temiz gelmeliydin.' },
    { pct: 1.03, label: '3. deneme', note: 'Yalnızca ikincisi rahat geçtiyse. Geçmezse test yine başarılı sayılır.' },
  ].map(a => ({ ...a, weight: yuvarla(taban * a.pct) }));

  return {
    exercise: exerciseName,
    estimate: Math.round(taban * 10) / 10,
    warmups,
    attempts: attempts.slice(0, MAX_ATTEMPTS),
    restSeconds: ATTEMPT_REST_SECONDS,
    barWeight: bar,
    reason: null,
  };
};

/**
 * Test sonucunu seansa yazılabilir setlere çevirir.
 *
 * Başarılı denemeler `normal` set olarak, ısınmalar `warmup` olarak giriyor.
 * Başarısız deneme HİÇ yazılmıyor: sıfır tekrarlı bir set hacim
 * hesaplarında ve rekor tespitinde anlamsız bir kayıt olurdu — denemenin
 * yapıldığı bilgisi ise seans notuna ait.
 */
export const maxTestToSets = (plan, results = [], generateId) => {
  if (!plan?.attempts?.length) return [];

  const setler = (plan.warmups || []).map(w => ({
    id: generateId(),
    weight: String(w.weight),
    reps: String(w.reps),
    rir: 5,
    tempo: '',
    formRating: 8,
    setType: 'warmup',
  }));

  plan.attempts.forEach((a, i) => {
    if (!results[i]?.success) return;
    setler.push({
      id: generateId(),
      weight: String(a.weight),
      reps: '1',
      rir: 0,
      tempo: '',
      formRating: 8,
      setType: 'normal',
    });
  });

  return setler;
};

/** Testin sonucu: en ağır başarılı deneme. */
export const maxTestResult = (plan, results = []) => {
  if (!plan?.attempts?.length) return null;
  const basarili = plan.attempts.filter((_, i) => results[i]?.success);
  if (basarili.length === 0) {
    return { success: false, best: null, estimate: plan.estimate };
  }
  const enAgir = Math.max(...basarili.map(a => a.weight));
  return {
    success: true,
    best: enAgir,
    attempts: basarili.length,
    estimate: plan.estimate,
    // Gerçek maksimum tahminden ne kadar saptı: tahminin bu kişide ne kadar
    // güvenilir olduğunu gösteriyor.
    delta: Math.round((enAgir - plan.estimate) * 10) / 10,
  };
};
