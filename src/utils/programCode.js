import { parseNumber } from './number.js';

/**
 * Program paylaşım kodu.
 *
 * Şablonlar cihazda kilitliydi. QR kodu yedeğin tamamını taşıyor — bir
 * arkadaşına tek bir programı vermek için bütün verini paylaşmak gerekiyordu,
 * ki bu makul değil. Metin kodu tek bir programı taşıyor ve her yerden
 * geçiyor: mesaj, not, e-posta.
 *
 * Biçim İNSAN OKUNUR bir gövdenin base64'ü: bozulmuş bir kodun neden
 * bozulduğunu anlamak mümkün olsun diye. Sıkıştırma yok — bir program birkaç
 * yüz bayt ve sıkıştırma, kodu okunamaz yapmanın yanında bir de kütüphane
 * bağımlılığı getirirdi.
 *
 * Kod SÜRÜMLÜ: biçim değişirse eski kodlar tanınmaya devam etsin ve
 * tanınmayan sürüm sessizce yanlış veri üretmek yerine açıkça reddedilsin.
 */

const PREFIX = 'PO1';
const SEP = '\u0001';
const FIELD = '\u0002';

/** UTF-8 güvenli base64 — Türkçe karakterler bozulmasın. */
const encode = (text) => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/=+$/, '');
};

const decode = (b64) => {
  const pad = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(pad);
  const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/**
 * Şablonu paylaşılabilir koda çevirir.
 *
 * Setlerin AĞIRLIK ve TEKRAR değerleri taşınmıyor: onlar kişinin kendi
 * yükleri ve başkasının programına yazılması yanlış bir başlangıç değeri
 * önermek olurdu. Taşınan şey programın YAPISI.
 */
export const templateToCode = (template) => {
  if (!template?.exercises?.length) return null;
  const satirlar = template.exercises.map(ex => [
    ex.name,
    (ex.sets || []).length,
    ex.supersetId ? '1' : '',
    ex.repRange ? `${ex.repRange.min}-${ex.repRange.max}` : '',
    ex.plannedTechnique || '',
    ex.backup || '',
  ].join(FIELD));

  const govde = [
    template.name || 'Program',
    template.emphasis || '',
    ...satirlar,
  ].join(SEP);

  return `${PREFIX}.${encode(govde)}`;
};

/**
 * Kodu şablona çevirir.
 *
 * @returns { ok, template } | { ok: false, reason }
 */
export const codeToTemplate = (code, generateId) => {
  const temiz = String(code || '').trim().replace(/\s+/g, '');
  if (!temiz) return { ok: false, reason: 'empty' };
  if (!temiz.startsWith(`${PREFIX}.`)) {
    return { ok: false, reason: 'prefix' };
  }

  let govde;
  try {
    govde = decode(temiz.slice(PREFIX.length + 1));
  } catch {
    return { ok: false, reason: 'decode' };
  }

  const parcalar = govde.split(SEP);
  if (parcalar.length < 2) return { ok: false, reason: 'structure' };

  const [ad, vurgu, ...satirlar] = parcalar;
  const exercises = satirlar
    .map(satir => {
      const [name, setStr, superset, aralik, teknik, yedek] = satir.split(FIELD);
      if (!name || !name.trim()) return null;
      const adet = Math.max(1, Math.min(20, parseNumber(setStr) || 3));
      const [min, max] = String(aralik || '').split('-').map(n => parseNumber(n));
      return {
        name: name.trim(),
        supersetId: superset === '1' ? 'ss-import' : null,
        ...(min > 0 && max > 0 ? { repRange: { min, max } } : {}),
        ...(teknik ? { plannedTechnique: teknik } : {}),
        ...(yedek ? { backup: yedek } : {}),
        sets: Array.from({ length: adet }, () => ({
          id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal',
        })),
      };
    })
    .filter(Boolean);

  if (exercises.length === 0) return { ok: false, reason: 'empty-program' };

  // Süperset kimlikleri kod içinde yalnızca "bağlı mı" bilgisi taşıyor.
  // Komşu bağlı hareketler aynı gruba alınıyor; bağ komşuluk demek.
  let grup = 0;
  exercises.forEach((ex, i) => {
    if (ex.supersetId !== 'ss-import') return;
    const oncekiBagli = i > 0 && exercises[i - 1].supersetId?.startsWith('ss-imp-');
    if (!oncekiBagli) grup += 1;
    ex.supersetId = `ss-imp-${grup}`;
    const sonraki = exercises[i + 1];
    if (sonraki && sonraki.supersetId === 'ss-import') sonraki.supersetId = `ss-imp-${grup}`;
  });

  return {
    ok: true,
    template: {
      id: generateId(),
      name: (ad || 'Paylaşılan Program').trim(),
      createdAt: new Date().toISOString(),
      favorite: false,
      lastUsedAt: null,
      useCount: 0,
      ...(vurgu ? { emphasis: vurgu } : {}),
      exercises,
    },
  };
};

/** Kod hatasının insan okunur karşılığı. */
export const describeCodeError = (reason) => ({
  empty: 'Kod boş.',
  prefix: 'Bu bir ProOverload program kodu değil. Kodlar PO1. ile başlar.',
  decode: 'Kod bozulmuş — kopyalarken bir kısmı eksik kalmış olabilir.',
  structure: 'Kod okunabildi ama içinde program yok.',
  'empty-program': 'Kodda hiç hareket yok.',
}[reason] || 'Kod tanınmadı.');
