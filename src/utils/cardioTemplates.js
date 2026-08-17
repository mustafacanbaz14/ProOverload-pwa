import { parseNumber } from './number.js';
import { findActivity } from './cardio.js';
import { summarizeSets } from './cardioSets.js';

/**
 * Kardiyo seans şablonları.
 *
 * Ağırlık antrenmanının şablonları vardı; kardiyonun yoktu. Oysa kardiyo
 * seansları en az onun kadar tekrar ediyor: aynı "8 × 100 m serbest, 20 sn
 * dinlenme" her hafta sıfırdan yazılıyordu ve set defteri (6.6) yazılacak
 * satır sayısını artırdığı için bu tekrar daha da can sıkıcı hale geldi.
 *
 * Şablon, defterin YAPISINI tutuyor: aktivite, tempo ve set satırları.
 * Süreler saklanıyor çünkü hedef tempo genelde sabit; kulaç sayısı ise
 * saklanmıyor — o ölçülen bir değer, plan değil.
 */

export const emptyCardioTemplate = () => ({
  id: '', name: '', type: 'swim', effort: 'moderate', sets: [], createdAt: '', useCount: 0, lastUsedAt: null,
});

/** Kaydedilecek satırlar: ölçüm alanları temizleniyor, plan alanları kalıyor. */
const planSatirlari = (rows = []) => (rows || [])
  .filter(r => parseNumber(r?.distance) > 0 || parseNumber(r?.seconds) > 0)
  .map(r => ({
    reps: Math.max(1, Math.round(parseNumber(r.reps) || 1)),
    distance: Math.max(0, parseNumber(r.distance)),
    stroke: r.stroke || 'free',
    kind: r.kind || 'work',
    // Hedef süre planın parçası; kulaç sayısı seansta ölçülen bir değer.
    seconds: parseNumber(r.seconds) > 0 ? parseNumber(r.seconds) : '',
    restSeconds: parseNumber(r.restSeconds) > 0 ? parseNumber(r.restSeconds) : '',
    strokeCount: '',
  }));

/**
 * Kardiyo kaydından şablon üretir.
 *
 * @returns şablon | null (defteri olmayan kayıttan şablon çıkmaz)
 */
export const templateFromEntry = (entry, name, generateId) => {
  const satirlar = planSatirlari(entry?.sets);
  if (satirlar.length === 0) return null;
  return {
    id: generateId(),
    name: String(name || '').trim() || findActivity(entry?.type)?.label || 'Kardiyo Şablonu',
    type: entry?.type || 'swim',
    effort: entry?.effort || 'moderate',
    sets: satirlar,
    createdAt: new Date().toISOString(),
    useCount: 0,
    lastUsedAt: null,
  };
};

export const addCardioTemplate = (list = [], template) => {
  if (!template?.id) return list;
  return [...(list || []), template];
};

export const removeCardioTemplate = (list = [], id) =>
  (list || []).filter(t => t.id !== id);

export const renameCardioTemplate = (list = [], id, name) =>
  (list || []).map(t => (t.id === id ? { ...t, name: String(name || '').trim() || t.name } : t));

/** Şablon kullanıldığında sayaç ve tarih güncelleniyor; sıralama buna göre. */
export const markCardioTemplateUsed = (list = [], id, date = new Date().toISOString()) =>
  (list || []).map(t => (t.id === id
    ? { ...t, useCount: Math.max(0, Math.round(parseNumber(t.useCount))) + 1, lastUsedAt: date }
    : t));

/**
 * Şablonun özeti: kaç metre, kaç dakika, hangi stiller.
 *
 * Süreler hedef olarak saklandığı için özet de bir HEDEF; gerçekleşen seans
 * bundan sapabilir ve bu normal.
 */
export const describeCardioTemplate = (template, { poolLength = 25 } = {}) => {
  const ozet = summarizeSets(template?.sets, template?.type, { poolLength });
  const aktivite = findActivity(template?.type);
  return {
    activity: aktivite,
    ...ozet,
    // Süre hedefi verilmemişse dakika 0 çıkıyor; "0 dk" yazmak yerine
    // yalnızca mesafe gösterilmesi için ayrı bayrak.
    hasTime: ozet.hasData && ozet.totalMinutes > 0,
    summaryLabel: ozet.hasData
      ? [
        ozet.totalDistance > 0 ? `${ozet.totalDistance} m` : null,
        ozet.totalMinutes > 0 ? `${ozet.totalMinutes} dk` : null,
        ozet.avgPaceLabel || null,
      ].filter(Boolean).join(' · ')
      : 'Boş şablon',
  };
};

/** Şablonu yeni bir kayda uygular; ölçüm alanları boş gelir. */
export const applyCardioTemplate = (template) => {
  if (!template) return null;
  return {
    type: template.type,
    effort: template.effort,
    sets: planSatirlari(template.sets),
  };
};

/** Aktiviteye göre şablonlar; en çok kullanılan üstte. */
export const templatesForActivity = (list = [], activityKey) =>
  (list || [])
    .filter(t => !activityKey || t.type === activityKey)
    .sort((a, b) => (parseNumber(b.useCount) - parseNumber(a.useCount))
      || String(b.lastUsedAt || '').localeCompare(String(a.lastUsedAt || '')));
