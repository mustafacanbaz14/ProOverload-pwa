import { parseNumber } from './number.js';
import { dayKey, toLocalDate, formatDay } from './dates.js';

/**
 * Dinlenme nabzı takibi.
 *
 * Dinlenme nabzı tek bir ayar değeriydi ve yalnızca Karvonen hesabında
 * kullanılıyordu. Oysa asıl değeri ZAMAN İÇİNDEKİ değişiminde: sabah
 * dinlenme nabzının kendi ortalamasının belirgin üstüne çıkması, toparlanma
 * borcunun en erken ve en ucuz göstergelerinden biri. Uygulamanın toparlanma
 * sinyalleri (uyku, hazır oluşluk, ACWR) hep BİLDİRİLEN ya da TÜRETİLEN
 * verilerdi; bu ÖLÇÜLEN bir sayı.
 *
 * Yorum bilerek temkinli. Tek bir yüksek sabah kahve, geç yemek ya da kötü
 * uyku olabilir; anlamlı olan taban çizgisinden SÜRDÜRÜLEN sapma.
 */

// Taban çizgisi bu kadar günün ortalaması.
const BASELINE_DAYS = 28;
// Taban çizgisi kurulması için en az bu kadar ölçüm gerekiyor.
const MIN_BASELINE_ENTRIES = 7;
// Tabanın bu kadar atım üstü "yüksek" sayılıyor.
const ELEVATED_DELTA = 5;
// Üst üste bu kadar yüksek gün "sürüyor" demek.
const SUSTAINED_DAYS = 3;

export const emptyRestingLog = () => [];

/** Kayıt ekler; aynı güne ikinci giriş öncekini değiştirir. */
export const upsertRestingHr = (log = [], date, bpm) => {
  const gun = dayKey(date);
  const deger = Math.round(parseNumber(bpm));
  if (!gun || !(deger >= 25) || deger > 140) return log;
  const digerleri = (log || []).filter(x => x.date !== gun);
  return [...digerleri, { date: gun, bpm: deger }].sort((a, b) => (a.date < b.date ? 1 : -1));
};

export const removeRestingHr = (log = [], date) =>
  (log || []).filter(x => x.date !== dayKey(date));

/**
 * Taban çizgisi ve sapma.
 *
 * @returns { hasData, latest, baseline, delta, status, streak, entries }
 */
export const buildRestingHrReport = (log = [], { today = new Date(), days = BASELINE_DAYS } = {}) => {
  const bugun = toLocalDate(dayKey(today));
  const sinir = bugun ? new Date(bugun) : null;
  if (sinir) sinir.setDate(bugun.getDate() - days);

  const kayitlar = (log || [])
    .filter(x => x?.date && parseNumber(x.bpm) > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const pencere = kayitlar.filter(x => {
    const d = toLocalDate(x.date);
    return d && (!sinir || d >= sinir);
  });

  if (kayitlar.length === 0) {
    return { hasData: false, entries: [], latest: null, baseline: null, needed: MIN_BASELINE_ENTRIES };
  }

  const son = kayitlar[0];

  // Taban çizgisi SON ÖLÇÜMÜ dışarıda bırakıyor: bugünün değerini kendi
  // ortalamasının içine katmak sapmayı sistematik olarak küçültürdü.
  const tabanKayitlari = pencere.slice(1);
  const yeterli = tabanKayitlari.length >= MIN_BASELINE_ENTRIES;
  const taban = yeterli
    ? Math.round((tabanKayitlari.reduce((t, x) => t + parseNumber(x.bpm), 0) / tabanKayitlari.length) * 10) / 10
    : null;

  const fark = taban !== null ? Math.round((parseNumber(son.bpm) - taban) * 10) / 10 : null;

  // Üst üste kaç gün yüksek: en yeniden geriye.
  let streak = 0;
  if (taban !== null) {
    for (const k of kayitlar) {
      if (parseNumber(k.bpm) - taban >= ELEVATED_DELTA) streak += 1;
      else break;
    }
  }

  let status = 'unknown';
  if (taban !== null) {
    if (streak >= SUSTAINED_DAYS) status = 'sustainedHigh';
    else if (fark >= ELEVATED_DELTA) status = 'high';
    else if (fark <= -ELEVATED_DELTA) status = 'low';
    else status = 'normal';
  }

  return {
    hasData: true,
    entries: pencere,
    latest: { ...son, label: formatDay(son.date, 'short', { weekday: true }) },
    baseline: taban,
    baselineCount: tabanKayitlari.length,
    needed: MIN_BASELINE_ENTRIES,
    delta: fark,
    streak,
    status,
    days,
  };
};

/** Dinlenme nabzının günlük koç satırı. */
export const restingHrCoachItem = (report) => {
  if (!report?.hasData || report.baseline === null) return null;

  if (report.status === 'sustainedHigh') {
    return {
      key: 'resting-hr',
      title: `Dinlenme nabzı ${report.streak} gündür yüksek`,
      detail: `Son ölçüm ${report.latest.bpm}, ${report.days} günlük tabanın ${report.baseline}. Sürdürülen yükseklik toparlanma borcunun en erken göstergelerinden biri — hastalık, uyku borcu ya da biriken antrenman yükü. Bu hafta hacmi artırmak yerine korumak, gerekirse boşaltmaya geçmek daha iyi bir bahis.`,
    };
  }
  if (report.status === 'low') {
    return {
      key: 'resting-hr',
      title: `Dinlenme nabzı tabanın altında (${report.latest.bpm})`,
      detail: `${report.days} günlük taban ${report.baseline}. Düşen dinlenme nabzı genelde iyileşen aerobik uygunluk ya da iyi toparlanma demek; hacmi artırmak için uygun bir pencere.`,
    };
  }
  return null;
};
