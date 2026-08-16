import { parseNumber } from './number.js';
import { detectMuscleGroup } from './helpers.js';
import { SMALL_MUSCLE_GROUPS } from './constants.js';

/**
 * Hareket bazlı tekrar aralığı.
 *
 * Tekrar aralığı tek bir genel ayardı (varsayılan 6-10) ve bütün hareketlere
 * aynı uygulanıyordu. Bu, uygulamanın verdiği her tavsiyeyi bozan bir
 * basitleştirmeydi: aynı 6-10 aralığı hem ağır çömelişe hem yan omuz
 * kaldırışına dayatılıyor, seans içi yük ayarı (autoregulation) lateral
 * raise'de "8 tekrar yaptın, ağırlığı artır" diyordu — oysa o hareket 15
 * tekrarda daha iyi çalışıyor.
 *
 * Üç katman var, en özelden genele:
 *
 *  1. Kullanıcının o hareket için yazdığı aralık
 *  2. Hareketin kas grubuna göre varsayılan aralık
 *  3. Ayarlardaki genel aralık
 *
 * İkinci katman olmadan özelliğin faydası, kullanıcının 250 hareketi tek tek
 * ayarlamasına bağlı kalırdı; kimse yapmaz. Varsayılanlar kutudan çıktığı
 * gibi doğru davranıyor, özel aralık yalnızca istisnalar için.
 */

/**
 * Kas grubuna göre varsayılan aralıklar.
 *
 * Küçük ve tek eklemli kaslar yüksek tekrarda daha iyi uyaran alıyor; ağır
 * bileşke hareketlerin taşıdığı kaslar düşük tekrarda hem daha güvenli hem
 * daha verimli. Bel bilinçli olarak en dar ve en yüksek aralıkta: erektörleri
 * düşük tekrarda tepe yüke sokmak, kazanca göre riski yüksek bir tercih.
 */
export const MUSCLE_REP_DEFAULTS = {
  'Göğüs': [6, 12],
  'Kanat': [8, 12],
  'Orta Sırt': [8, 12],
  'Trapez': [10, 20],
  'Ön Omuz': [8, 12],
  'Yan Omuz': [12, 20],
  'Arka Omuz': [12, 20],
  'Biseps': [8, 15],
  'Triseps': [8, 15],
  'Önkol': [12, 20],
  'Quadriceps': [6, 12],
  'Hamstring': [8, 12],
  'Kalça': [8, 15],
  'Baldır': [10, 20],
  'Karın': [10, 20],
  'Bel': [10, 15],
};

export const REP_RANGE_LIMITS = { min: 1, max: 50 };

/** Aralığı geçerli hale getirir: min <= max, sınırların içinde, tam sayı. */
export const normalizeRepRange = (min, max) => {
  const a = Math.round(parseNumber(min));
  const b = Math.round(parseNumber(max));
  if (!(a > 0) || !(b > 0)) return null;
  const alt = Math.min(Math.max(a, REP_RANGE_LIMITS.min), REP_RANGE_LIMITS.max);
  const ust = Math.min(Math.max(b, alt), REP_RANGE_LIMITS.max);
  return { min: alt, max: ust };
};

/**
 * Bir hareket için geçerli tekrar aralığı ve nereden geldiği.
 *
 * `source` arayüz için önemli: kullanıcı "bu sayı nereden geliyor" sorusunu
 * sorabilmeli, yoksa kendi yazdığı değerin uygulanıp uygulanmadığını
 * anlayamıyor.
 *
 * @returns { min, max, source: 'exercise' | 'muscle' | 'global', muscle }
 */
export const repRangeFor = (exerciseName, {
  overrides = {},
  customExercises = [],
  globalMin = 6,
  globalMax = 10,
} = {}) => {
  const genel = normalizeRepRange(globalMin, globalMax) || { min: 6, max: 10 };
  if (!exerciseName) return { ...genel, source: 'global', muscle: null };

  const ozel = normalizeRepRange(overrides?.[exerciseName]?.min, overrides?.[exerciseName]?.max);
  const { muscle } = detectMuscleGroup(exerciseName, customExercises);
  if (ozel) return { ...ozel, source: 'exercise', muscle };

  const kasVarsayilan = MUSCLE_REP_DEFAULTS[muscle];
  if (kasVarsayilan) {
    return { min: kasVarsayilan[0], max: kasVarsayilan[1], source: 'muscle', muscle };
  }

  return { ...genel, source: 'global', muscle };
};

/** Bir hareketin özel aralığını yazar; boş/geçersiz değer kaydı siler. */
export const setRepRangeOverride = (overrides = {}, exerciseName, min, max) => {
  const sonraki = { ...overrides };
  const aralik = normalizeRepRange(min, max);
  if (!exerciseName) return sonraki;
  if (!aralik) delete sonraki[exerciseName];
  else sonraki[exerciseName] = aralik;
  return sonraki;
};

/**
 * Hareketin yük artış adımı.
 *
 * Kas grubu büyüklüğüne bağlı; küçük kaslarda 2.5 kg'lık sıçrama tekrarları
 * aralığın dışına atıyor. helpers ve autoregulation aynı kuralı ayrı ayrı
 * yazıyordu, burada tek yerden okunuyor.
 */
export const loadStepFor = (exerciseName, customExercises = []) => {
  const { muscle } = detectMuscleGroup(exerciseName, customExercises);
  return SMALL_MUSCLE_GROUPS.includes(muscle) ? 1.25 : 2.5;
};
