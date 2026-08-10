import { parseNumber } from './number.js';
import { SMALL_MUSCLE_GROUPS } from './constants.js';
import { detectMuscleGroup } from './helpers.js';

/**
 * Set başına dinlenme süresi önerisi.
 *
 * Uygulama tek bir genel süre kullanıyordu (varsayılan 120 sn). Ama dinlenme
 * ihtiyacı setten sete büyük fark gösteriyor: ağır bir squat setinden sonra 2
 * dakika, bir sonraki sette tekrar kaybetmek demek; lateral raise'de 2 dakika
 * beklemek ise seansı gereksiz uzatıyor.
 *
 * Belirleyiciler ve gerekçeleri:
 *
 *  - BİLEŞİK / İZOLASYON: Birden fazla kası ve büyük kas kütlesini birlikte
 *    çalıştıran hareketlerde merkezi yorgunluk ve enerji sistemi toparlanması
 *    daha uzun sürüyor. Kaç kasa belirgin katkı verdiğine bakılıyor.
 *  - KAS BÜYÜKLÜĞÜ: Küçük kaslar (kol, omuz başları, baldır) hem daha az yük
 *    kaldırıyor hem daha hızlı toparlanıyor.
 *  - ŞİDDET (RIR): Tükenişe yakın setler sonraki setin performansını daha çok
 *    düşürüyor; RIR 0 ile RIR 3 aynı dinlenmeyi gerektirmiyor.
 *  - TEKRAR ARALIĞI: Düşük tekrarlı ağır setler sinir sistemi ağırlıklı,
 *    toparlanması uzun. Yüksek tekrarlı setler metabolik, daha kısa yetiyor.
 *  - SET TİPİ: Drop ve rest-pause setlerinde kısa ara tekniğin PARÇASI, dinlenme
 *    değil. Isınma setinden sonra da beklemeye gerek yok.
 *
 * Öneri bir tavsiye; kullanıcı sayacı istediği gibi değiştirebiliyor ve genel
 * süreyi ayarlardan kapatabiliyor.
 */

/** Öneri kademeleri — arayüzde renk ve etiket buradan geliyor. */
export const REST_TIERS = [
  { key: 'technique', label: 'Teknik arası', max: 30, text: 'text-purple-400' },
  { key: 'short', label: 'Kısa', max: 90, text: 'text-emerald-400' },
  { key: 'moderate', label: 'Orta', max: 150, text: 'text-cyan-400' },
  { key: 'long', label: 'Uzun', max: 240, text: 'text-amber-400' },
  { key: 'max', label: 'Tam toparlanma', max: Infinity, text: 'text-red-400' },
];

export const restTierOf = (seconds) =>
  REST_TIERS.find(t => seconds <= t.max) || REST_TIERS[REST_TIERS.length - 1];

// 15 saniyenin altındaki hassasiyet ne ölçülebilir ne de anlamlı.
const yuvarla = (sn) => Math.round(sn / 15) * 15;

/**
 * Kas kütlesi ağırlıkları.
 *
 * Katkı veren kas SAYISINI saymak yanıltıcıydı: squat'ın 0.5 ve üstü iki
 * katkısı var, bench press'in üç — sayıya bakınca squat daha hafif çıkıyordu,
 * oysa sistemik yükü belirgin şekilde daha yüksek. Dinlenme ihtiyacını
 * belirleyen şey kaç kasın çalıştığı değil, ne kadar kas kütlesinin yüklendiği.
 */
const MUSCLE_MASS = {
  Quadriceps: 3, Hamstring: 3, 'Kalça': 3,
  Kanat: 2.5, Bel: 2.5, 'Orta Sırt': 2.5,
  'Göğüs': 2,
  Trapez: 1.5, 'Ön Omuz': 1.5, 'Yan Omuz': 1.5, 'Arka Omuz': 1.5,
  Biseps: 1, Triseps: 1, 'Önkol': 1, 'Baldır': 1, 'Karın': 1,
};

/**
 * Hareketin sistemik yükü: yüklenen kas kütlesi × eklem sayısının etkisi.
 *
 * Çok eklemli olmak tek başına yetmiyor (lat pulldown), büyük kas olmak da tek
 * başına yetmiyor (leg extension tek eklemli ama quadriceps büyük). İkisi
 * çarpılıyor: squat ikisini birden taşıdığı için en üste, leg extension büyük
 * kasa rağmen orta banda düşüyor.
 */
export const systemicLoad = (contributions = {}) => {
  let kutle = 0;
  let belirgin = 0;
  Object.entries(contributions).forEach(([kas, katki]) => {
    kutle += katki * (MUSCLE_MASS[kas] ?? 1);
    if (katki >= 0.5) belirgin += 1;
  });
  const eklemCarpani = 1 + 0.15 * Math.max(0, belirgin - 1);
  return {
    score: Math.round(kutle * eklemCarpani * 100) / 100,
    mass: Math.round(kutle * 100) / 100,
    significantMuscles: belirgin,
  };
};

/**
 * @param exerciseName    hareket adı
 * @param set             { setType, rir, reps }
 * @param opts.customExercises kullanıcı kas eşlemeleri
 * @returns { seconds, tier, reason, isTechnique }
 */
export const suggestRestSeconds = (exerciseName, set = {}, { customExercises = [], supersetPending = false } = {}) => {
  const tip = set.setType || 'normal';

  // Süperset: eşleşen harekete geçilecekse dinlenme yok, geçiş var. Dinlenme
  // çiftin SONUNA ait; araya tam dinlenme koymak süperseti iki ayrı hareket
  // haline getirir ve yöntemin amacını ortadan kaldırır.
  if (supersetPending) {
    return {
      seconds: 20, tier: restTierOf(20), isTechnique: true,
      reason: 'Süperset: eşleşen harekete geç. Asıl dinlenme çiftin sonunda.',
    };
  }

  // Drop ve rest-pause'ta kısa ara tekniğin parçası: burada "dinlenme" demek
  // yanlış olur, o yüzden ayrı bir kademe ve ayrı bir gerekçe veriliyor.
  if (tip === 'drop') {
    return {
      seconds: 15, tier: restTierOf(15), isTechnique: true,
      reason: 'Drop set: ağırlığı düşürüp hemen devam et. Uzun bekleme drop setin amacını ortadan kaldırır.',
    };
  }
  if (tip === 'rest_pause') {
    return {
      seconds: 20, tier: restTierOf(20), isTechnique: true,
      reason: 'Rest-pause: 15-20 saniye bekleyip aynı ağırlıkla devam et.',
    };
  }
  if (tip === 'warmup') {
    return {
      seconds: 45, tier: restTierOf(45), isTechnique: false,
      reason: 'Isınma seti yorgunluk biriktirmemeli; kısa ara yeterli.',
    };
  }

  const { contributions } = detectMuscleGroup(exerciseName, customExercises);
  const yuk = systemicLoad(contributions);

  let saniye;
  let temel;
  if (yuk.score >= 6) {
    saniye = 210;
    temel = 'büyük kas kütlesini birlikte yükleyen bileşik hareket';
  } else if (yuk.score >= 4) {
    saniye = 180;
    temel = 'bileşik hareket';
  } else if (yuk.score >= 3) {
    saniye = 150;
    temel = 'orta yüklü hareket';
  } else if (yuk.score >= 2) {
    saniye = 120;
    temel = 'büyük kas izolasyonu';
  } else {
    saniye = 75;
    temel = 'küçük kas hareketi';
  }

  const nedenler = [temel];

  // Şiddet: tükenişe yakın set sonraki setin performansını daha çok düşürüyor.
  const rir = parseNumber(set.rir);
  const rirGirilmis = set.rir !== '' && set.rir !== null && set.rir !== undefined;
  if (tip === 'failure' || (rirGirilmis && rir <= 0)) {
    saniye *= 1.3;
    nedenler.push('tükenişe kadar gidildi');
  } else if (rirGirilmis && rir >= 3) {
    saniye *= 0.85;
    nedenler.push('yedekte tekrar bırakıldı');
  }

  // Tekrar aralığı: düşük tekrar sinir sistemi ağırlıklı, uzun toparlanma ister.
  const tekrar = parseNumber(set.reps);
  if (tekrar > 0 && tekrar <= 5) {
    saniye *= 1.2;
    nedenler.push('düşük tekrarlı ağır set');
  } else if (tekrar >= 15) {
    saniye *= 0.85;
    nedenler.push('yüksek tekrarlı set');
  }

  // Alt ve üst sınır: 45 sn'nin altı bileşikte anlamsız, 5 dk üstü pratikte
  // seansı bitirilemez hale getiriyor.
  const son = yuvarla(Math.min(300, Math.max(45, saniye)));
  return {
    seconds: son,
    tier: restTierOf(son),
    isTechnique: false,
    reason: `${nedenler.join(', ')} — ${Math.round(son / 15) * 15} sn öneriliyor.`,
  };
};

/**
 * Bir hareketin sıradaki seti için öneri.
 *
 * Sayaç, biten setin özelliklerine göre başlatılıyor: dinlenmeyi belirleyen şey
 * bir sonraki set değil, az önce yapılan setin bıraktığı yorgunluk.
 */
export const restForCompletedSet = (exerciseName, set, opts) =>
  suggestRestSeconds(exerciseName, set, opts);
