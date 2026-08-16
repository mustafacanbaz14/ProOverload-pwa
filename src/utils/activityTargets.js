import { parseNumber } from './number.js';
import { findActivity } from './cardio.js';
import { supportsDistance, paceUnitFor } from './cardioZones.js';

/**
 * Aktivite seans hedefleri.
 *
 * Haftalık kardiyo hedefi (cardioGoals) "ne kadar" sorusunu yanıtlıyor ama
 * SEANSIN İÇİNİ boş bırakıyor. Havuza giden biri "bu hafta 90 dakika düşük
 * şiddet" bilgisiyle suya girmiyor; aklında "8 × 100 m, aralarda 30 saniye"
 * gibi somut bir plan var ve bu plan çoğu zaman unutuluyor.
 *
 * Bu modül aktivite başına küçük bir hedef tutuyor: set sayısı, set mesafesi,
 * toplam mesafe ve süre. Hepsi İSTEĞE BAĞLI — yüzmede set ve mesafe anlamlı,
 * bisiklette yalnızca süre ve mesafe anlamlı olabiliyor. Boş bırakılan alan
 * hedef sayılmıyor, karşılaştırmaya da girmiyor.
 *
 * Hedef koymak zorunlu DEĞİL: kardiyo kaydı hedefsiz de girilebiliyor ve
 * kalori hesabı her koşulda çalışıyor. Hedef yalnızca hatırlatma ve
 * karşılaştırma için.
 */

export const TARGET_FIELDS = [
  { key: 'sets', label: 'Set', unit: 'set', hint: 'Kaç tekrar bloğu (örn. 8 × 100 m yüzme)' },
  { key: 'setDistance', label: 'Set mesafesi', unit: 'm', hint: 'Bir bloğun mesafesi, metre' },
  { key: 'distanceKm', label: 'Toplam mesafe', unit: 'km', hint: 'Seansın toplam mesafesi' },
  { key: 'minutes', label: 'Süre', unit: 'dk', hint: 'Hedeflenen toplam süre' },
  { key: 'restSeconds', label: 'Set arası', unit: 'sn', hint: 'Bloklar arası dinlenme, saniye' },
];

export const emptyActivityTarget = () => ({
  sets: '', setDistance: '', distanceKm: '', minutes: '', restSeconds: '', note: '',
});

/** Bir alanın hedef olarak sayılıp sayılmayacağı: boş ve sıfır hedef değil. */
const dolu = (v) => parseNumber(v) > 0;

/** Hedefte en az bir alan doldurulmuş mu. */
export const hasTarget = (target) =>
  Boolean(target) && (TARGET_FIELDS.some(f => dolu(target[f.key])) || String(target.note || '').trim().length > 0);

export const normalizeActivityTarget = (target) => {
  const t = { ...emptyActivityTarget(), ...(target || {}) };
  TARGET_FIELDS.forEach(f => {
    const n = parseNumber(t[f.key]);
    t[f.key] = n > 0 ? n : '';
  });
  t.note = String(t.note || '').slice(0, 160);
  return t;
};

/** Hedefi ayarlara yazar; tamamen boşalırsa kaydı siler. */
export const setActivityTarget = (targets = {}, activityKey, target) => {
  const next = { ...targets };
  if (!activityKey) return next;
  const temiz = normalizeActivityTarget(target);
  if (!hasTarget(temiz)) delete next[activityKey];
  else next[activityKey] = temiz;
  return next;
};

export const getActivityTarget = (targets = {}, activityKey) =>
  (activityKey && targets?.[activityKey]) ? normalizeActivityTarget(targets[activityKey]) : null;

/**
 * Hedefin okunabilir özeti.
 *
 * Set ve set mesafesi birlikte varsa "8 × 100 m" biçiminde birleştiriliyor;
 * ayrı ayrı yazmak ("8 set", "100 m") hedefin ne olduğunu bulanıklaştırıyor.
 */
export const describeTarget = (target, activityKey) => {
  const t = normalizeActivityTarget(target);
  if (!hasTarget(t)) return '';
  const parcalar = [];

  if (dolu(t.sets) && dolu(t.setDistance)) parcalar.push(`${t.sets} × ${t.setDistance} m`);
  else if (dolu(t.sets)) parcalar.push(`${t.sets} set`);
  else if (dolu(t.setDistance)) parcalar.push(`${t.setDistance} m/set`);

  if (dolu(t.distanceKm)) {
    // Yüzmede kilometre okunaksız; metre daha doğal.
    parcalar.push(activityKey === 'swim' ? `${Math.round(t.distanceKm * 1000)} m toplam` : `${t.distanceKm} km`);
  }
  if (dolu(t.minutes)) parcalar.push(`${t.minutes} dk`);
  if (dolu(t.restSeconds)) parcalar.push(`${t.restSeconds} sn dinlenme`);

  return parcalar.join(' · ');
};

/**
 * Kaydı hedefle karşılaştırır.
 *
 * Yalnızca hedefte DOLU olan alanlar karşılaştırılıyor. Karşılaştırma
 * "başarısız" damgası vurmuyor: kardiyoda planın altında kalmak çoğu zaman
 * doğru karar (yorgunluk, zaman, hava). Sonuç yön olarak sunuluyor.
 */
export const compareToTarget = (entry = {}, target) => {
  const t = target ? normalizeActivityTarget(target) : null;
  if (!hasTarget(t)) return null;

  const satirlar = [];
  const ekle = (label, hedef, gerceklesen, unit) => {
    if (!dolu(hedef)) return;
    const g = parseNumber(gerceklesen);
    satirlar.push({
      label,
      target: parseNumber(hedef),
      actual: g,
      unit,
      // %5 tolerans: 29 dakikalık bir seansı 30 dakikalık hedefin altında
      // saymak, sayıyı anlamsız derecede hassas kılıyor.
      status: !(g > 0) ? 'missing'
        : g >= parseNumber(hedef) * 0.95 ? 'met' : 'under',
    });
  };

  ekle('Süre', t.minutes, entry.minutes, 'dk');
  const toplamMetre = parseNumber(entry.distanceKm) * 1000;
  if (dolu(t.distanceKm)) {
    ekle('Mesafe', t.distanceKm, entry.distanceKm, 'km');
  } else if (dolu(t.sets) && dolu(t.setDistance)) {
    // Set × mesafe verilmişse toplam mesafeden karşılaştırılıyor: kimse set
    // sayısını ayrıca kaydetmiyor, ama toplam mesafe kaydediliyor.
    ekle('Toplam mesafe', t.sets * t.setDistance, toplamMetre, 'm');
  }

  return {
    rows: satirlar,
    summary: describeTarget(t, entry.type),
    met: satirlar.length > 0 && satirlar.every(r => r.status === 'met'),
    note: t.note,
  };
};

/**
 * Hedefi olan aktiviteler, hatırlatma listesi için.
 *
 * Ölçüt hedefin varlığı; son ne zaman yapıldığı çağıran taraftan geliyor
 * çünkü "unutmamak için" listesinin asıl bilgisi o.
 */
export const targetedActivities = (targets = {}, workouts = []) => {
  const sonKullanim = new Map();
  (workouts || []).forEach(w => {
    (w.cardio || []).forEach(e => {
      if (!e?.type) return;
      const mevcut = sonKullanim.get(e.type);
      if (!mevcut || String(w.date) > mevcut) sonKullanim.set(e.type, String(w.date));
    });
  });

  return Object.entries(targets || {})
    .filter(([, t]) => hasTarget(t))
    .map(([key, t]) => ({
      key,
      activity: findActivity(key),
      target: normalizeActivityTarget(t),
      summary: describeTarget(t, key),
      lastDate: sonKullanim.get(key) || null,
      supportsDistance: supportsDistance(key),
      paceUnit: paceUnitFor(key),
    }))
    .filter(x => x.activity)
    .sort((a, b) => String(b.lastDate || '').localeCompare(String(a.lastDate || '')));
};
