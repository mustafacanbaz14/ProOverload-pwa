import { parseNumber } from './number.js';

/**
 * Doz-yanıt hacim modeli.
 *
 * Uygulama hacmi 2017 dönemi MEV/MAV/MRV üçlüsüyle modelliyordu: her kas için
 * üç kesin sayı ve tavanın üstünde kırmızı bir bölge. Bu modelin üç sorunu var
 * ve üçü de güncel literatürden geliyor.
 *
 * 1. KESİN EŞİK YOK. Meta-regresyonlar hacim–hipertrofi ilişkisini azalan
 *    verimli ama PLATOSUZ buluyor. MEV/MAV/MRV gibi evrensel kesme noktaları
 *    hiçbir çalışmada belirlenmedi.
 * 2. TAVANIN ÜSTÜ "ZARARLI" DEĞİL. Setlerin aniden işe yaramaz hale geldiği
 *    bir uç yok; yalnızca ek faydanın ölçülemez hale geldiği bir nokta var.
 * 3. ASIL MESELE: İKİ KANIT HATTI ÇELİŞİYOR. Ve uygulama bu çelişkiden
 *    habersiz tek bir sayı gösteriyordu.
 *
 * İki hat şu:
 *
 *  A — META-REGRESYONLAR. Pelland ve ark. (2026, 67 çalışma, 2058 katılımcı):
 *      hacim arttıkça kazanç artıyor, azalan verimle; ~12 sette set başına
 *      %0.24 kas artışı, ek faydanın ölçülemez hale geldiği nokta ~31 kesirli
 *      set/hafta.
 *  B — DOĞRUDAN DENEYLER. Çok merkezli RCT (n=87, 12 hafta) haftada 9 kesirli
 *      set ile 36 kesirli seti karşılaştırdı ve İSTATİSTİKSEL DENKLİK buldu.
 *      Enes 2024 mevcut hacmin üstüne set eklemenin, hacmi korumaktan daha iyi
 *      olmadığını gösterdi. Androulakis-Korakakis 2020: haftada iki-üç kez tek
 *      set yetmezliğe kadar, antrenmanlı erkeklerde anlamlı 1RM artışı.
 *
 * Neden çelişiyorlar: meta-regresyonlar ağırlıklı olarak antrenmansız ve kısa
 * çalışmaları topluyor, doğrudan denklik denemeleri antrenmanlı kişilerde fark
 * bulmuyor. Set başına tahmini etki (%0.24) bir bireyde ölçüm hatasının altında.
 *
 * BU MODÜLÜN CEVABI: taraf tutmamak. Eğri tek çizgi değil ŞERİT — alt kenarı
 * B hattı (erken doyan), üst kenarı A hattı (yavaş doyan). Gerçek cevabın bu
 * ikisi arasında olduğu, hangisine yakın olduğunu kimsenin bilmediği her
 * çıktıda söyleniyor. Kullanıcı bir felsefe seçebiliyor ama uygulama hangisinin
 * doğru olduğunu bildiğini iddia etmiyor.
 *
 * BİRİM: bütün sayılar KESİRLİ set. Dolaylı çalışma yarım sayılıyor — bench
 * press göğse 1, tricepse 0.5. Bu tesadüf değil: Pelland ve ark. üç sayım
 * yöntemini karşılaştırdı ve kesirli yöntem en güçlü kanıta sahip çıktı.
 * Uygulamanın katkı modeli (1 / 0.5 / 0.25) zaten buydu.
 */

/**
 * Referans sayılar (kesirli set/hafta, orta seviye, ölçek katsayısı 1).
 *
 * `MED` ve `EFFECTIVE_END` iki kanıt hattının da anlaştığı yer — tartışma bu
 * bandın nerede bittiğinde değil, ÜSTÜNDE ne olduğunda.
 */
export const REFERENCE = {
  // Minimum etkili doz. Altında ölçülebilir uyaran beklenmiyor.
  med: 4,
  // Yüksek verim bandının üst ucu. Denklik denemesinin düşük kolu (9 kesirli
  // set) bu bandın hemen üstünde duruyor.
  effectiveEnd: 10,
  // A hattının ek faydayı ölçemez hale geldiği nokta.
  contestedEnd: 31,
};

/**
 * Seans başına tavan: bir kas için ~11 kesirli set.
 *
 * Ayrı bir meta-regresyondan geliyor ve HAFTALIK hacimden bağımsız bir kısıt:
 * haftalık toplam doğru olsa bile tek seansa yığılınca kayboluyor. Kas başına
 * ölçeklenmiyor çünkü kaynak çalışma kas ayrımı yapmıyor — ölçekleseydik
 * kaynakta olmayan bir kesinlik uydurmuş olurduk.
 */
export const SESSION_CEILING = 11;

export const VOLUME_BANDS = [
  {
    key: 'below', label: 'Eşik altı', tone: 'warn',
    note: 'Ölçülebilir bir uyaran için yetersiz. İki kanıt hattı da burada anlaşıyor.',
  },
  {
    key: 'effective', label: 'Yüksek verim', tone: 'good',
    note: 'Set başına kazancın en yüksek olduğu bant. Hem meta-regresyonlar hem doğrudan denemeler buranın işe yaradığında anlaşıyor.',
  },
  {
    key: 'contested', label: 'Tartışmalı bölge', tone: 'info',
    note: 'Meta-regresyonlar küçük bir ek kazanç öngörüyor; doğrudan denklik denemeleri fark bulamadı. Burada olmak yanlış değil, ama ek setlerin karşılığı belirsiz.',
  },
  {
    key: 'unevidenced', label: 'Kanıtsız bölge', tone: 'muted',
    note: 'Bu hacimde ek fayda gösteren doğrudan bir deneme yok. Zararlı olduğu da gösterilmedi — yalnızca karşılığı bilinmiyor.',
  },
];

export const findBand = (key) => VOLUME_BANDS.find(b => b.key === key) || VOLUME_BANDS[1];

/**
 * Hacim felsefesi.
 *
 * Literatür bölünmüş olduğu için varsayılan tek bir sayı dayatmak yerine
 * kullanıcıya kanıt hattını seçtiriyoruz. Felsefe yalnızca HEDEFİ kaydırıyor;
 * eşiği ve seans tavanını değiştirmiyor çünkü onlar tartışmalı değil.
 */
export const VOLUME_PHILOSOPHIES = {
  minimal: {
    key: 'minimal', label: 'Minimum Etkili Doz', short: 'Minimum',
    // Hedef: verimli bandın alt çeyreği.
    target: 0.25, targetBand: 'effective',
    summary: 'Az set, yetmezliğe yakın. Hacmi artırmak yerine yakınlık ve yük ilerlemesi kullanılır.',
    evidence: 'Haftada 9 ile 36 kesirli seti karşılaştıran çok merkezli denklik denemesi fark bulamadı; tek set × 2-3 gün yetmezliğe kadar antrenmanlı erkeklerde anlamlı 1RM artışı üretti.',
  },
  balanced: {
    key: 'balanced', label: 'Dengeli', short: 'Dengeli',
    target: 0.6, targetBand: 'effective',
    summary: 'Verimli bandın ortası. İki kanıt hattının kesiştiği yer.',
    evidence: 'Meta-regresyonların "en verimli" dediği 5-10 kesirli set bandı ile doğrudan denemelerin yeterli bulduğu hacim burada örtüşüyor.',
  },
  high: {
    key: 'high', label: 'Yüksek Hacim', short: 'Yüksek',
    // Hedef: tartışmalı bandın ilk kısmı.
    target: 0.4, targetBand: 'contested',
    summary: 'Verimli bandın üstü. Meta-regresyonun öngördüğü küçük ek kazancı hedefler; bedeli zaman ve yorgunluk.',
    evidence: 'Pelland 2026 meta-regresyonu bu bantta hâlâ pozitif eğim buluyor; yarışmacı fizik sporcuları pratikte bu aralıkta çalışıyor. Doğrudan denemeler bu ek kazancı doğrulayamadı.',
  },
};

export const findPhilosophy = (key) => VOLUME_PHILOSOPHIES[key] || VOLUME_PHILOSOPHIES.balanced;

/**
 * Deneyim seviyesi: bandı KAYDIRIR ve GENİŞLETİR.
 *
 * Eskiden üç sınıra da tek bir çarpan uygulanıyordu (0.7 / 1.0 / 1.2). Bu,
 * seviyeler arasındaki farkı yanlış modelliyor: acemide eğri erken doyuyor
 * (az setle çok kazanç), ileri seviyede verimli bant hem yukarı kayıyor hem
 * GENİŞLİYOR. Genişleme aynı zamanda dürüst bir ifade: ileri seviyede doğru
 * cevabın nerede olduğu daha belirsiz.
 */
export const LEVEL_SCALES = {
  beginner: { threshold: 0.6, width: 0.7, shift: 0.65 },
  intermediate: { threshold: 1, width: 1, shift: 1 },
  advanced: { threshold: 1.15, width: 1.4, shift: 1.25 },
};

const levelScale = (level) => LEVEL_SCALES[level] || LEVEL_SCALES.intermediate;

/**
 * Kas ölçek katsayısı.
 *
 * Literatür kas başına ayrı bir minimum doz vermiyor; mevcut tablodaki kas
 * farkları uzman görüşü. Farkı tamamen silmek de doğru değil — küçük kaslar
 * dolaylı iş alıyor ve daha az kütle taşıyor. Bu yüzden fark KORUNUYOR ama
 * 1'e doğru sıkıştırılıyor: kaynakta olmayan bir çözünürlük iddia etmemek için.
 */
export const muscleScale = (landmarks) => {
  const mav = parseNumber(landmarks?.mav);
  if (!(mav > 0)) return 1;
  return Math.round((0.5 + 0.5 * (mav / 14)) * 100) / 100;
};

/**
 * Bir kasın bant sınırları.
 *
 * @param landmarks eski tablo satırı — yalnızca ölçek katsayısı için
 * @returns { threshold, effectiveEnd, contestedEnd, scale }
 */
export const bandsFor = (landmarks, level = 'intermediate') => {
  const s = muscleScale(landmarks);
  const L = levelScale(level);

  const threshold = REFERENCE.med * s * L.threshold;
  // Genişlik çarpanı UÇ NOKTAYA değil BANDIN GENİŞLİĞİNE uygulanıyor. Uç
  // noktaya uygulasaydık acemide verimli bant eşiğin altına düşebilirdi.
  const width = (REFERENCE.effectiveEnd - REFERENCE.med) * s * L.width;
  const effectiveEnd = threshold + width;
  const contestedEnd = Math.max(effectiveEnd + 1, REFERENCE.contestedEnd * s * L.shift);

  return {
    threshold: Math.round(threshold * 10) / 10,
    effectiveEnd: Math.round(effectiveEnd * 10) / 10,
    contestedEnd: Math.round(contestedEnd * 10) / 10,
    scale: s,
  };
};

export const bandOf = (sets, landmarks, level = 'intermediate') => {
  const v = parseNumber(sets);
  const b = bandsFor(landmarks, level);
  if (!(v > 0)) return 'none';
  if (v < b.threshold) return 'below';
  if (v <= b.effectiveEnd) return 'effective';
  if (v <= b.contestedEnd) return 'contested';
  return 'unevidenced';
};

// Doyma sabiti: verilen noktada payın %95 olmasını sağlayan k.
const kFor = (saturationPoint) => -Math.log(0.05) / Math.max(0.5, saturationPoint);

/**
 * Belirli bir hacimde tahmini uyaran payı (0-1).
 *
 * @returns { directTrial, metaReg, mid, spread }
 *   `directTrial` — B hattı: doğrudan denklik denemeleri. Erken doyuyor, yani
 *      aynı hacimde DAHA YÜKSEK bir pay veriyor ("zaten yeterlisin").
 *   `metaReg`    — A hattı: meta-regresyon. Geç doyuyor, aynı hacimde daha
 *      düşük pay veriyor ("daha eklenebilir").
 *
 * Alanlar hattın adıyla anılıyor, `low`/`high` ile değil: sayısal olarak
 * `directTrial` her zaman büyük olan taraf ve iki isimlendirmeyi karıştırmak
 * metinlerde ters cümle kurmaya çok açıktı.
 *
 * Tek sayı DÖNMÜYOR. Ortalama vermek olmayan bir uzlaşıyı varmış gibi
 * göstermek olurdu; `mid` yalnızca sıralama ve grafik için var ve arayüzde
 * daima aralıkla birlikte gösteriliyor.
 */
export const stimulusAt = (sets, landmarks, level = 'intermediate') => {
  const v = Math.max(0, parseNumber(sets));
  const b = bandsFor(landmarks, level);
  const directTrial = 1 - Math.exp(-kFor(b.effectiveEnd) * v);
  const metaReg = 1 - Math.exp(-kFor(b.contestedEnd) * v);
  return {
    directTrial: Math.round(directTrial * 1000) / 1000,
    metaReg: Math.round(metaReg * 1000) / 1000,
    mid: Math.round(((directTrial + metaReg) / 2) * 1000) / 1000,
    // Şeridin genişliği belirsizliğin kendisi: dar olduğu yerde iki hat
    // anlaşıyor, geniş olduğu yerde cevap bilinmiyor.
    spread: Math.round((directTrial - metaReg) * 1000) / 1000,
  };
};

/** Bir set daha eklemenin getirisi — yüzde puan olarak, aralıklı. */
export const marginalGain = (sets, landmarks, level = 'intermediate') => {
  const su = stimulusAt(sets, landmarks, level);
  const sonra = stimulusAt(parseNumber(sets) + 1, landmarks, level);
  return {
    directTrial: Math.round((sonra.directTrial - su.directTrial) * 1000) / 10,
    metaReg: Math.round((sonra.metaReg - su.metaReg) * 1000) / 10,
  };
};

/** Verilen payı yakalamak için gereken set sayısı. */
export const setsForShare = (share, landmarks, level = 'intermediate', line = 'metaReg') => {
  const b = bandsFor(landmarks, level);
  const k = kFor(line === 'directTrial' ? b.effectiveEnd : b.contestedEnd);
  const p = Math.min(0.999, Math.max(0.01, parseNumber(share)));
  return Math.round((-Math.log(1 - p) / k) * 10) / 10;
};

/** Seçilen felsefenin hedef hacmi. */
export const targetFor = (landmarks, level = 'intermediate', philosophyKey = 'balanced') => {
  const b = bandsFor(landmarks, level);
  const f = findPhilosophy(philosophyKey);
  const [alt, ust] = f.targetBand === 'contested'
    ? [b.effectiveEnd, b.contestedEnd]
    : [b.threshold, b.effectiveEnd];
  return Math.round((alt + (ust - alt) * f.target) * 2) / 2;
};

/**
 * Seans başı yığılma denetimi.
 *
 * @param perSession [{ muscle, sets }] — tek seansın kas kas kesirli hacmi
 */
export const sessionCeilingAudit = (perSession = []) => {
  const asanlar = (perSession || [])
    .filter(r => parseNumber(r?.sets) > SESSION_CEILING)
    .map(r => ({
      muscle: r.muscle,
      sets: Math.round(parseNumber(r.sets) * 10) / 10,
      excess: Math.round((parseNumber(r.sets) - SESSION_CEILING) * 10) / 10,
    }))
    .sort((a, b) => b.excess - a.excess);

  return {
    ceiling: SESSION_CEILING,
    items: asanlar,
    ok: asanlar.length === 0,
    // Bölünce ne olacağı: aynı hacim iki güne yayılırsa tavanın altına iner mi.
    splittable: asanlar.filter(r => r.sets / 2 <= SESSION_CEILING).map(r => r.muscle),
  };
};

/** Bir hacmin insan okunur özeti — daima aralıkla. */
export const describeVolume = (sets, landmarks, level = 'intermediate') => {
  const v = parseNumber(sets);
  if (!(v > 0)) return 'Bu kas için kayıtlı set yok.';
  const b = bandsFor(landmarks, level);
  const band = findBand(bandOf(v, landmarks, level));
  const s = stimulusAt(v, landmarks, level);
  return `${v} kesirli set — ${band.label}. Tahmini uyaran payı`
    + ` %${Math.round(s.metaReg * 100)}–%${Math.round(s.directTrial * 100)}`
    + ` (alt sınır meta-regresyon, üst sınır doğrudan denemeler; gerçek değerin`
    + ` hangisine yakın olduğu bilinmiyor). Eşik ${b.threshold}, verimli bandın`
    + ` üstü ${b.effectiveEnd} set.`;
};
