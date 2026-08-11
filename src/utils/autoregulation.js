import { parseNumber } from './number.js';
import { isWorkingSet } from './helpers.js';

/**
 * Seans içi yük ayarı.
 *
 * Uygulama seanslar ARASINDA hedef veriyordu (suggestNextTarget) ve seans
 * içinde yorgunluk düşüşünü gösteriyordu — ama gösterip bırakıyordu: "%28 güç
 * kaybı" yazıyor, ne yapılacağını söylemiyordu. Karar anı tam da orası: sıradaki
 * seti aynı ağırlıkla mı yoksa düşürerek mi yapacaksın.
 *
 * Burası son yapılan setlere bakıp SIRADAKİ set için somut bir sayı veriyor.
 *
 * Neye bakıyor:
 *  - Hedef tekrar aralığının altına düşüldü mü ve RIR sıfırlandı mı? Yük fazla.
 *  - Aralığın üstüne çıkıldı ve hâlâ yedek tekrar var mı? Yük az.
 *  - Setler arası düşüş sert mi? Yorgunluk birikiyor; ağırlığı korumak sonraki
 *    setleri hedef aralığın dışına atar.
 *
 * Öneri bir zorunluluk değil; kullanıcı yine istediğini yazıyor.
 */

/** En küçük anlamlı ayar. Küçük kaslarda 2.5 kg zaten büyük bir sıçrama. */
const STEP_SMALL = 1.25;
const STEP_LARGE = 2.5;

/**
 * @param sets           hareketin şu ana kadarki setleri
 * @param opts.repRangeMin / repRangeMax  hedef tekrar aralığı
 * @param opts.isSmallMuscle küçük kas grubu mu (artış adımı için)
 * @returns null | { action, weight, delta, reason, tone }
 */
export const sessionAdvice = (sets = [], {
  repRangeMin = 6,
  repRangeMax = 10,
  isSmallMuscle = false,
} = {}) => {
  const calisma = (sets || []).filter(s =>
    isWorkingSet(s) && parseNumber(s.reps) > 0 && parseNumber(s.weight) > 0);

  // Tek set üzerinden yorum yapmak erken: ilk set ısınmanın devamı olabiliyor.
  if (calisma.length < 1) return null;

  const son = calisma[calisma.length - 1];
  const agirlik = parseNumber(son.weight);
  const tekrar = parseNumber(son.reps);
  const rirGirilmis = son.rir !== '' && son.rir !== null && son.rir !== undefined;
  const rir = parseNumber(son.rir);
  const adim = isSmallMuscle ? STEP_SMALL : STEP_LARGE;

  // Aralığın belirgin altına düşüp tükenildiyse yük fazla.
  if (tekrar < repRangeMin && rirGirilmis && rir <= 0) {
    const yeni = Math.max(adim, Math.round((agirlik * 0.9) / adim) * adim);
    return {
      action: 'decrease',
      weight: yeni,
      delta: Math.round((yeni - agirlik) * 10) / 10,
      tone: 'warn',
      reason: `${tekrar} tekrarda tükendin, hedef alt sınır ${repRangeMin}. Sıradaki sette ${yeni} kg ile aralığa dön.`,
    };
  }

  // Aralığın üstünde ve hâlâ yedek varsa yük az.
  if (tekrar > repRangeMax && rirGirilmis && rir >= 2) {
    const yeni = agirlik + adim;
    return {
      action: 'increase',
      weight: yeni,
      delta: adim,
      tone: 'good',
      reason: `${tekrar} tekrar ve RIR ${rir}: aralığın üstündesin. Sıradaki sette ${yeni} kg dene.`,
    };
  }

  // Setler arası düşüş: ilk setin tekrarına göre son set ne kadar geriledi.
  if (calisma.length >= 2) {
    const ilk = calisma[0];
    const ilkTekrar = parseNumber(ilk.reps);
    const ayniAgirlik = Math.abs(parseNumber(ilk.weight) - agirlik) < 0.01;
    const dususOran = ilkTekrar > 0 ? (ilkTekrar - tekrar) / ilkTekrar : 0;

    // Aynı ağırlıkta %30'dan fazla tekrar kaybı, sıradaki setin hedef aralığın
    // altına düşeceğini gösteriyor.
    if (ayniAgirlik && dususOran >= 0.3 && tekrar <= repRangeMin) {
      const yeni = Math.max(adim, Math.round((agirlik * 0.925) / adim) * adim);
      return {
        action: 'decrease',
        weight: yeni,
        delta: Math.round((yeni - agirlik) * 10) / 10,
        tone: 'warn',
        reason: `İlk sette ${ilkTekrar}, son sette ${tekrar} tekrar. Ağırlığı ${yeni} kg'a çekmek kalan setleri hedef aralıkta tutar.`,
      };
    }
  }

  // Aralık içindeyse söylenecek bir şey yok; her sete yorum yapmak gürültü.
  return null;
};
