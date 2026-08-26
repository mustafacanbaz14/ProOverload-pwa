import { parseNumber } from './number.js';
import { isCompletedWorkingSet } from './helpers.js';

/**
 * Kademeli etkili set.
 *
 * Uygulama etkili seti ikili bir kuralla sayıyordu: `RIR ≤ 3` ise 1, değilse 0.
 * Bu kural iki yerde birden yanlış davranıyor.
 *
 *  - RIR 3 ile RIR 0 aynı sayılıyor. Oysa yakınlık meta-regresyonu (Robinson,
 *    Refalo ve ark., 2024) hipertrofinin yetmezliğe yaklaştıkça ARTTIĞINI
 *    buluyor — düzleşen ama tek yönlü bir eğri.
 *  - RIR 4 hiç sayılmıyor. Oysa dört tekrar kalarak biten bir set sıfır uyaran
 *    vermiyor; yalnızca daha az veriyor.
 *
 * Bu, özellikle DÜŞÜK HACİMLİ çalışan biri için önemli. Az set ama yetmezliğe
 * yakın çalışan birinin toplam uyaranı, ikili kuralla "az set" görünüyordu;
 * kademeli ağırlıkla gerçek konumu ortaya çıkıyor.
 *
 * Ağırlıklar eğrinin şeklinden geliyor, ölçülmüş katsayılar değil — ve bu
 * arayüzde yazıyor. Kesin bir dönüşüm tablosu iddia etmek, kaynakta olmayan
 * bir çözünürlük uydurmak olurdu.
 *
 * ESKİ ÖLÇÜ KALDIRILMIYOR. Geçmiş sayılarının bir gecede değişmesi kullanıcıyı
 * şaşırtır; yeni ölçü ayarla açılıyor ve iki sayı yan yana gösteriliyor.
 */

/** RIR → uyaran ağırlığı. Ara değerler doğrusal ara değerlemeyle. */
export const PROXIMITY_WEIGHTS = [
  { rir: 0, weight: 1 },
  { rir: 1, weight: 1 },
  { rir: 2, weight: 0.95 },
  { rir: 3, weight: 0.85 },
  { rir: 4, weight: 0.6 },
  { rir: 5, weight: 0.3 },
  { rir: 6, weight: 0.15 },
];

// Bu RIR'ın ötesinde ağırlık sıfır: yedi tekrar kalarak bitirilen bir set
// ısınma sayılır.
const ZERO_ABOVE = 6;

export const weightForRir = (rir) => {
  const r = Math.max(0, parseNumber(rir));
  if (r > ZERO_ABOVE) return 0;
  const ust = PROXIMITY_WEIGHTS.find(p => p.rir >= r);
  if (!ust) return 0;
  if (ust.rir === r) return ust.weight;
  const alt = [...PROXIMITY_WEIGHTS].reverse().find(p => p.rir <= r) || PROXIMITY_WEIGHTS[0];
  const aralik = ust.rir - alt.rir;
  if (aralik <= 0) return ust.weight;
  const oran = (r - alt.rir) / aralik;
  return Math.round((alt.weight + (ust.weight - alt.weight) * oran) * 100) / 100;
};

/** Eski ikili kural — karşılaştırma için korunuyor. */
export const binaryEffectiveSets = (exercises = []) =>
  (exercises || []).reduce((t, ex) => t + (ex.sets || [])
    .filter(s => isCompletedWorkingSet(s) && parseNumber(s.rir) <= 3).length, 0);

/** Kademeli ölçü. */
export const gradedEffectiveSets = (exercises = []) =>
  Math.round((exercises || []).reduce((t, ex) => t + (ex.sets || [])
    .filter(isCompletedWorkingSet)
    .reduce((s, set) => s + weightForRir(set.rir), 0), 0) * 4) / 4;

/**
 * İki ölçüyü birlikte döndürür.
 *
 * `delta` pozitifse kademeli ölçü daha yüksek: setler yetmezliğe yakın
 * çalışılmış ve ikili kural bunu görmüyordu. Negatifse tersi: RIR 3'e yığılmış
 * setler ikili kuralda tam sayılıyordu.
 */
export const compareEffectiveSets = (exercises = []) => {
  const ikili = binaryEffectiveSets(exercises);
  const kademeli = gradedEffectiveSets(exercises);
  const setler = (exercises || []).flatMap(ex => (ex.sets || []).filter(isCompletedWorkingSet));
  const rirler = setler.map(s => parseNumber(s.rir)).filter(Number.isFinite);
  const ortalamaRir = rirler.length
    ? Math.round((rirler.reduce((t, r) => t + r, 0) / rirler.length) * 10) / 10
    : null;

  return {
    binary: ikili,
    graded: kademeli,
    delta: Math.round((kademeli - ikili) * 4) / 4,
    sets: setler.length,
    meanRir: ortalamaRir,
    hasData: setler.length > 0,
    // Farkın YÖNÜ hangi setlerin nerede toplandığını söylüyor ve ikisi de
    // sezgiye ters okunabiliyor:
    //   kademeli > ikili → RIR 3'ün ÖTESİNDE setler var. İkili kural onları
    //     tamamen atıyordu; kademeli ölçü kısmi değer veriyor.
    //   kademeli < ikili → setler RIR 2-3 bandında yığılmış. İkili kural
    //     hepsini tam sayıyordu; kademeli ölçü yakınlığa göre indiriyor.
    note: !setler.length
      ? 'Kayıtlı çalışma seti yok.'
      : kademeli > ikili
        ? 'İkili kural RIR 3\'ün ötesindeki setleri tamamen atıyordu; kademeli ölçü onlara kısmi değer veriyor. Yani hacmin göründüğünden biraz fazla, ama o setler yetmezliğe uzak.'
        : kademeli < ikili
          ? 'Setlerin RIR 2-3 bandında yığılmış. İkili kural bunları tam sayıyordu; kademeli ölçü yetmezliğe uzaklığa göre indiriyor. Aynı set sayısıyla daha çok uyaran istiyorsan kaldıraç burada.'
          : 'İki ölçü aynı sonucu veriyor: setlerin yetmezliğe yeterince yakın.',
  };
};

/** Bir kasın hacmini seçilen ölçüye göre ağırlıklandırır. */
export const weightedSetCount = (sets = [], graded = false) => {
  const calisma = (sets || []).filter(isCompletedWorkingSet);
  if (!graded) return calisma.length;
  return calisma.reduce((t, s) => t + weightForRir(s.rir), 0);
};
