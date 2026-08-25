import { parseNumber } from './number.js';

/**
 * Su takibi.
 *
 * Beslenme tarafı kalori ve makroyu ayrıntılı izliyordu ama suyu hiç
 * saymıyordu. Oysa performansa etkisi doğrudan ve hızlı: vücut ağırlığının
 * yaklaşık %2'si kadar sıvı kaybı kuvvet çıktısını ölçülebilir biçimde
 * düşürüyor, ve antrenman günlerinde kayıp dinlenme gününden belirgin yüksek.
 *
 * Hedef vücut ağırlığından türetiliyor, sabit "2 litre" değil: 55 kiloluk
 * biriyle 100 kiloluk birinin ihtiyacı aynı olamaz. Antrenman günü ve sıcak
 * hava için ek pay veriliyor.
 *
 * Kayıt GÜN BAZINDA toplam olarak tutuluyor, her bardak ayrı satır değil:
 * amaç günün toplamını bilmek ve her yudumu kaydetmek kimsenin sürdüremediği
 * bir alışkanlık.
 */

// Vücut ağırlığı başına temel ihtiyaç (ml/kg). Sağlıklı yetişkin için yaygın
// kullanılan aralığın ortası.
const BASE_ML_PER_KG = 33;
// Antrenman günü eki: terle kaybedilenin kabaca karşılığı.
const TRAINING_BONUS_ML = 700;
// Sıcak hava eki, kullanıcı işaretlerse.
const HEAT_BONUS_ML = 500;

export const QUICK_AMOUNTS = [200, 330, 500, 750];

/**
 * Günlük hedef.
 *
 * @returns { ml, base, trainingBonus, heatBonus, perKg }
 */
export const dailyWaterTarget = (weightKg, { training = false, heat = false } = {}) => {
  const kg = parseNumber(weightKg);
  // Kilo bilinmiyorsa ortalama bir yetişkin varsayılıyor; hedefsiz bırakmak
  // özelliği kullanılamaz yapardı ama sayının nereden geldiği söyleniyor.
  const taban = Math.round((kg > 0 ? kg : 75) * BASE_ML_PER_KG);
  const antrenman = training ? TRAINING_BONUS_ML : 0;
  const sicak = heat ? HEAT_BONUS_ML : 0;
  return {
    ml: taban + antrenman + sicak,
    base: taban,
    trainingBonus: antrenman,
    heatBonus: sicak,
    perKg: BASE_ML_PER_KG,
    estimatedWeight: kg <= 0,
  };
};

/** Bir günün kaydını okur. */
export const waterFor = (log = {}, dateKey) => Math.max(0, parseNumber((log || {})[dateKey]));

/** Miktar ekler; negatif toplam oluşmuyor ve makul bir tavan var. */
export const addWater = (log = {}, dateKey, deltaMl) => {
  if (!dateKey) return log || {};
  const mevcut = waterFor(log, dateKey);
  // Günlük 10 litre üstü bir yazım hatası; kabul etmek grafikleri bozardı.
  const sonraki = Math.max(0, Math.min(10000, Math.round(mevcut + parseNumber(deltaMl))));
  const out = { ...(log || {}) };
  if (sonraki === 0) delete out[dateKey];
  else out[dateKey] = sonraki;
  return out;
};

/**
 * Son N günün özeti.
 *
 * Hedefe ulaşılan gün oranı, ortalama ve bugünün durumu.
 */
export const waterSummary = (log = {}, { days = 7, target = 2500, todayKey } = {}) => {
  const anahtarlar = Object.keys(log || {}).sort().slice(-days);
  const degerler = anahtarlar.map(k => waterFor(log, k));
  const bugun = todayKey ? waterFor(log, todayKey) : 0;

  return {
    today: bugun,
    target,
    remaining: Math.max(0, target - bugun),
    percent: target > 0 ? Math.min(100, Math.round((bugun / target) * 100)) : 0,
    days: anahtarlar.map((k, i) => ({ date: k, ml: degerler[i] })),
    average: degerler.length > 0
      ? Math.round(degerler.reduce((t, v) => t + v, 0) / degerler.length)
      : 0,
    metDays: degerler.filter(v => v >= target).length,
    trackedDays: degerler.length,
    hasData: degerler.length > 0,
  };
};

/** Koç kartı: yalnızca düzenli takip varken ve belirgin geride kalınca. */
export const waterCoachItem = (summary) => {
  if (!summary?.hasData || summary.trackedDays < 4) return null;
  // Ortalama hedefin dörtte üçünün altındaysa konuşuyor. Tek bir düşük gün
  // uyarı sebebi değil; su alımı günden güne dalgalanıyor.
  if (summary.average >= summary.target * 0.75) return null;
  return {
    key: 'hydration',
    tone: 'info',
    title: `Günlük su ortalaman ${(summary.average / 1000).toFixed(1)} L, hedef ${(summary.target / 1000).toFixed(1)} L`,
    detail: `Son ${summary.trackedDays} günün ${summary.metDays} tanesinde hedefe ulaşılmış. Vücut ağırlığının yaklaşık %2'si kadar sıvı kaybı kuvvet çıktısını ölçülebilir biçimde düşürüyor; antrenman günlerinde kayıp dinlenme gününden belirgin yüksek. Hedef kilona göre hesaplanıyor, sabit bir sayı değil.`,
  };
};
