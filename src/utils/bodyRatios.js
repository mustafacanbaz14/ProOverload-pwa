import { parseNumber } from './number.js';
import { formatDay } from './dates.js';

/**
 * Vücut oranları.
 *
 * Uygulama her çevre ölçüsünü tek tek izliyordu: kol 38'den 39'a çıktı, bel
 * 84'te sabit. Bu doğru ama görüntünün nasıl değiştiğini söylemiyor — estetik
 * algı mutlak santimlerden değil ORANLARDAN geliyor. Omuzu 5 cm büyütmekle
 * beli 5 cm inceltmek, omuz-bel oranında benzer etki yaratıyor ve ikisi de
 * aynı görsel sonuca çıkıyor.
 *
 * İki tür oran var ve karıştırılmamalı:
 *
 *  - ESTETİK oranlar (omuz/bel, göğüs/bel): görünümü tarif ediyorlar ve
 *    hedeflenebiliyorlar.
 *  - GENETİK REFERANS oranları (kol/bilek, baldır/bilek): bilek çevresi
 *    iskelet yapısının değişmeyen bir göstergesi olduğu için, kolun kendi
 *    çerçevesine göre nerede olduğunu söylüyorlar. Bunlar hedef değil, bağlam.
 *
 * Hiçbir oran "ideal" diye sunulmuyor. Referans bantları literatürde ve
 * klasik vücut geliştirme kaynaklarında yaygın kullanılan aralıklar; iskelet
 * yapısı, boy ve kalça genişliği kişiden kişiye kaydırıyor.
 */

export const BODY_RATIOS = [
  {
    key: 'shoulderWaist', label: 'Omuz / Bel', of: 'shoulder', to: 'waist',
    kind: 'aesthetic',
    male: { low: 1.4, high: 1.7 }, female: { low: 1.3, high: 1.5 },
    note: 'Üst gövde genişliğinin en belirleyici oranı. Yükseltmenin iki yolu var ve ikisi de işe yarıyor: yan deltoid ile kanat hacmini artırmak, ya da bel çevresini düşürmek.',
  },
  {
    key: 'chestWaist', label: 'Göğüs / Bel', of: 'chest', to: 'waist',
    kind: 'aesthetic',
    male: { low: 1.25, high: 1.45 }, female: { low: 1.15, high: 1.3 },
    note: 'Göğüs kafesi ve sırt kalınlığının bele göre konumu. Omuz/bel ile birlikte okunmalı; ikisi birden düşükse sorun bel tarafında olabilir.',
  },
  {
    key: 'armWrist', label: 'Kol / Bilek', of: 'arm', to: 'wrist',
    kind: 'frame',
    male: { low: 2.0, high: 2.4 }, female: { low: 1.8, high: 2.2 },
    note: 'Bilek çevresi iskelet yapısının değişmeyen göstergesi. Bu oran kolun MUTLAK büyüklüğünü değil, kendi çerçevesine göre gelişimini söylüyor — ince bilekli birinde 38 cm kol, kalın bilekli birinde 41 cm kola denk geliyor.',
  },
  {
    key: 'calfArm', label: 'Baldır / Kol', of: 'calf', to: 'arm',
    kind: 'symmetry',
    male: { low: 0.95, high: 1.1 }, female: { low: 0.95, high: 1.1 },
    note: 'Klasik simetri ölçütü: baldır ile kol çevresinin yakın olması. Baldır en inatçı kas gruplarından biri olduğu için bu oran çoğu kişide düşük çıkıyor ve bu bir kusur değil, bilgi.',
  },
  {
    key: 'thighWaist', label: 'Uyluk / Bel', of: 'thigh', to: 'waist',
    kind: 'aesthetic',
    male: { low: 0.6, high: 0.75 }, female: { low: 0.65, high: 0.85 },
    note: 'Alt gövde gelişiminin bele göre konumu. Düşükse bacak hacmini artırmak, yüksekse üst gövdeye ağırlık vermek dengeyi toplar.',
  },
];

const durum = (oran, bant) => {
  if (oran < bant.low) return 'below';
  if (oran > bant.high) return 'above';
  return 'inRange';
};

/**
 * Ölçüm kaydından oranlar.
 *
 * Eksik ölçü olan oran ATLANIYOR: eksik veriden oran üretmek, uydurma bir
 * sayıyı gerçek gibi göstermek olurdu. Hangi ölçünün eksik olduğu ayrıca
 * bildiriliyor ki kullanıcı neyi girmesi gerektiğini bilsin.
 */
export const buildBodyRatios = (metrics, { gender = 'male', previous = null } = {}) => {
  const olc = (kayit, key) => parseNumber(kayit?.measurements?.[key]);

  const rows = [];
  const missing = new Set();

  BODY_RATIOS.forEach(tanim => {
    const a = olc(metrics, tanim.of);
    const b = olc(metrics, tanim.to);
    if (!(a > 0) || !(b > 0)) {
      if (!(a > 0)) missing.add(tanim.of);
      if (!(b > 0)) missing.add(tanim.to);
      return;
    }

    const bant = gender === 'female' ? tanim.female : tanim.male;
    const oran = Math.round((a / b) * 1000) / 1000;

    // Önceki ölçümle karşılaştırma: oranın yönü, tek bir ölçünün yönünden
    // daha bilgilendirici.
    let delta = null;
    if (previous) {
      const pa = olc(previous, tanim.of);
      const pb = olc(previous, tanim.to);
      if (pa > 0 && pb > 0) {
        const onceki = pa / pb;
        delta = Math.round((oran - onceki) * 1000) / 1000;
      }
    }

    rows.push({
      key: tanim.key,
      label: tanim.label,
      kind: tanim.kind,
      ratio: oran,
      values: { of: a, to: b },
      band: bant,
      status: durum(oran, bant),
      delta,
      direction: delta === null ? null : delta > 0.005 ? 'up' : delta < -0.005 ? 'down' : 'flat',
      note: tanim.note,
    });
  });

  return {
    rows,
    hasData: rows.length > 0,
    missing: [...missing],
    date: metrics?.date || null,
    dateLabel: metrics?.date ? formatDay(metrics.date, 'short', { weekday: true }) : '',
    gender,
  };
};

/** Vücut oranlarının günlük koç satırı. */
export const bodyRatioCoachItem = (report) => {
  if (!report?.hasData) return null;
  // Yalnızca estetik oranlarda bant altı olanlar konuşuluyor; çerçeve
  // oranları hedef değil bağlam ve simetri oranı çoğu kişide düşük.
  const dusuk = report.rows.find(r => r.kind === 'aesthetic' && r.status === 'below');
  if (!dusuk) return null;
  return {
    key: 'ratio',
    title: `${dusuk.label} oranı ${dusuk.ratio}`,
    detail: `Yaygın bandın (${dusuk.band.low}–${dusuk.band.high}) altında. ${dusuk.note} Oranlar iskelet yapısına göre kayar; bu bir hedef değil, hacmi nereye koyacağına dair bir işaret.`,
  };
};
