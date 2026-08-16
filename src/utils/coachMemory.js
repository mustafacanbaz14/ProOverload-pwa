import { dayKey, toLocalDate } from './dates.js';

/**
 * Koç hafızası: erteleme, kapatma ve çelişki çözümü.
 *
 * Koç kartı iki yerde körelmişti.
 *
 *  1. TEKRAR. Aynı madde, kullanıcı onu okuyup bilinçli olarak görmezden
 *     gelmiş olsa bile her gün aynı yerde duruyordu. Bir süre sonra kart
 *     bütünüyle görünmez oluyor — hep aynı şeyi söyleyen bir uyarı, hiçbir şey
 *     söylemeyen bir uyarıdır.
 *  2. ÇELİŞKİ. Maddeler birbirinden habersiz üretiliyor ve aynı anda zıt iki
 *     şey söyleyebiliyorlardı: "deload zamanı geldi" ile "bu kaslara set ekle"
 *     yan yana durunca kullanıcı hangisini yapacağını bilmiyor ve koçun
 *     tamamına olan güveni düşüyor.
 *
 * Bu modül ikisini de çözüyor: erteleme/kapatma durumunu tutuyor ve üst
 * öncelikli bir maddeyle çelişen alt öncelikli maddeleri eleyip NEDENİNİ
 * kaydediyor — eleme sessiz olsaydı kullanıcı tavsiyenin kaybolduğunu sanardı.
 */

// Ertelenen madde bu kadar gün sonra geri geliyor. Kalıcı kapatmak ayrı bir
// eylem; erteleme "şimdi değil" demek, "asla" değil.
export const SNOOZE_DAYS = 7;

export const emptyCoachMemory = () => ({ snoozed: {}, dismissed: [] });

export const normalizeCoachMemory = (value) => ({
  snoozed: (value && typeof value.snoozed === 'object' && !Array.isArray(value.snoozed)) ? value.snoozed : {},
  dismissed: Array.isArray(value?.dismissed) ? value.dismissed : [],
});

/** Maddeyi belirli bir tarihe kadar erteler. */
export const snoozeCoachItem = (memory, key, today = dayKey(new Date()), days = SNOOZE_DAYS) => {
  const m = normalizeCoachMemory(memory);
  const bas = toLocalDate(today);
  if (!key || !bas) return m;
  const bitis = new Date(bas);
  bitis.setDate(bas.getDate() + Math.max(1, Math.round(days)));
  return { ...m, snoozed: { ...m.snoozed, [key]: dayKey(bitis) } };
};

/** Maddeyi kalıcı olarak kapatır. */
export const dismissCoachItem = (memory, key) => {
  const m = normalizeCoachMemory(memory);
  if (!key || m.dismissed.includes(key)) return m;
  return { ...m, dismissed: [...m.dismissed, key] };
};

/** Tek bir maddeyi ya da tüm hafızayı geri açar. */
export const restoreCoachItem = (memory, key = null) => {
  const m = normalizeCoachMemory(memory);
  if (!key) return emptyCoachMemory();
  const { [key]: _, ...kalanSnooze } = m.snoozed;
  return { snoozed: kalanSnooze, dismissed: m.dismissed.filter(k => k !== key) };
};

/**
 * Birbirini dışlayan madde grupları.
 *
 * Her satırda önce gelen kazanır. Ölçüt "hangisi daha önemli" değil, "hangisi
 * diğerini anlamsız kılıyor": deload haftasındayken hacim eklemek, ağrı
 * varken rekor denemek, plan uyumu düşükken program büyütmek — bunların
 * hepsinde ikinci tavsiye birincinin altında geçersiz kalıyor.
 */
export const CONFLICT_RULES = [
  {
    winner: 'deload-running',
    losers: ['volume-low', 'mesocycle', 'pr-watch', 'no-week', 'cardio-todo', 'rotation', 'standards'],
    reason: 'Deload haftasındasın; hacim ve rekor tavsiyeleri bu hafta geçerli değil.',
  },
  {
    winner: 'deload',
    losers: ['volume-low', 'mesocycle', 'pr-watch'],
    reason: 'Önce deload kararı; hacim eklemek toparlanma borcunu büyütür.',
  },
  {
    // Deload dönüşü sürerken hacim ve rotasyon tavsiyeleri erken: dönüş planı
    // zaten hacmi kademeli geri getiriyor.
    winner: 'deload-return',
    losers: ['volume-low', 'mesocycle', 'rotation', 'effort'],
    reason: 'Deload dönüşü sürüyor; hacim ve hareket değişikliği kararları dönüş tamamlanınca anlamlı.',
  },
  {
    winner: 'pain',
    losers: ['pr-watch', 'volume-low'],
    reason: 'Eklem ağrısı sürerken rekor denemek ve hacim eklemek riski büyütür.',
  },
  {
    winner: 'joint',
    losers: ['pr-watch'],
    reason: 'Son seansta eklem ağrısı yüksekti; bugün rekor denemesi sırası değil.',
  },
  {
    // Yüksek şiddet kardiyo ile bacak günü çakışması varken "bugün yüksek
    // şiddet kardiyoya uygun" demek kendi kendiyle çelişirdi.
    winner: 'cardio-balance',
    losers: ['cardio-todo'],
    reason: 'Önce kardiyo dağılımı düzeltilmeli; yeni seans eklemek dengesizliği büyütür.',
  },
  {
    winner: 'readiness-low',
    losers: ['pr-watch', 'volume-low', 'cardio-todo'],
    reason: 'Hazır oluşluk üst üste düşük; bugün maksimal deneme ya da hacim artışı işe yaramaz.',
  },
  {
    // Dinlenme nabzı sürdürülen biçimde yüksekken hacim artışı ve rekor
    // denemesi, ölçülen bir toparlanma açığının üstüne yük koymak olur.
    winner: 'resting-hr',
    losers: ['pr-watch', 'volume-low', 'mesocycle', 'cardio-todo'],
    reason: 'Dinlenme nabzı tabanın üstünde; ölçülen toparlanma açığının üstüne hacim eklemek yanlış bahis.',
  },
  {
    winner: 'sleep',
    losers: ['pr-watch'],
    reason: 'Uyku puanı düşükken maksimal güç ölçülebilir biçimde geriliyor.',
  },
  {
    winner: 'consistency',
    losers: ['mesocycle', 'volume-low'],
    reason: 'Plan uyumu düşükken hacmi büyütmek yapılmayan set üretir.',
  },
  {
    winner: 'dataHealth',
    losers: ['balance', 'pr-watch'],
    reason: 'Kayıtlarda hesapları bozan değerler var; bu sayılara dayanan tavsiyeler düzeltilene kadar güvenilmez.',
  },
];

/**
 * Hafıza ve çelişki kurallarını uygular.
 *
 * @returns { items, suppressed, hiddenCount } — `items` gösterilecekler,
 *   `suppressed` neden elendiğiyle birlikte gizlenenler.
 */
export const applyCoachMemory = (items = [], memory, today = dayKey(new Date())) => {
  const m = normalizeCoachMemory(memory);
  const bugun = toLocalDate(today);

  const gorunur = [];
  const suppressed = [];

  items.forEach(item => {
    if (m.dismissed.includes(item.key)) {
      suppressed.push({ ...item, hiddenBy: 'dismissed', hiddenReason: 'Kalıcı olarak kapatıldı.' });
      return;
    }
    const bitis = m.snoozed[item.key];
    const bitisTarih = bitis ? toLocalDate(bitis) : null;
    if (bitisTarih && bugun && bugun < bitisTarih) {
      suppressed.push({ ...item, hiddenBy: 'snoozed', hiddenReason: `${bitis} tarihine kadar ertelendi.` });
      return;
    }
    gorunur.push(item);
  });

  // Çelişki çözümü: kazanan görünürse kaybedenler elenir.
  const anahtarlar = new Set(gorunur.map(i => i.key));
  const elenen = new Map();
  CONFLICT_RULES.forEach(rule => {
    if (!anahtarlar.has(rule.winner)) return;
    rule.losers.forEach(key => {
      if (anahtarlar.has(key) && !elenen.has(key)) elenen.set(key, rule.reason);
    });
  });

  const sonuc = [];
  gorunur.forEach(item => {
    const sebep = elenen.get(item.key);
    if (sebep) suppressed.push({ ...item, hiddenBy: 'conflict', hiddenReason: sebep });
    else sonuc.push(item);
  });

  return {
    items: sonuc,
    suppressed,
    hiddenCount: suppressed.length,
    // Çelişki yüzünden elenenler ayrı sayılıyor: bunlar kullanıcının kapattığı
    // değil, koçun bilerek sustuğu maddeler ve arayüzde farklı anlatılıyorlar.
    conflictCount: suppressed.filter(s => s.hiddenBy === 'conflict').length,
  };
};
