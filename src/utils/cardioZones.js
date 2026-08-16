import { parseNumber } from './number.js';
import { findActivity, findEffort } from './cardio.js';

/**
 * Nabız bölgeleri ve kardiyo şiddet sınıflandırması.
 *
 * Uygulama kardiyoyu iki eksende tutuyordu: aktivite (MET) ve tempo (çarpan).
 * İkisi kalori için yeterli ama ANTRENMAN olarak ne yapıldığını söylemiyor.
 * "45 dakika koşu" cümlesi, zone 2 dayanıklılık koşusu ile interval seansını
 * aynı kefeye koyuyor; oysa ikisi farklı sistemleri geliştiriyor, farklı
 * yorgunluk bırakıyor ve ağırlık antrenmanıyla farklı biçimde çakışıyor.
 *
 * Bu modül her kaydı bir bölgeye oturtuyor. Nabız ölçümü yoksa bile
 * sınıflandırma yapılabiliyor: aktivite türü ve tempo birlikte, seansın hangi
 * bölgede geçtiğini yeterince iyi tahmin ediyor. Nabız girilirse tahmin
 * yerine ölçüm kullanılıyor.
 */

/**
 * Bölgeler.
 *
 * Sınırlar maksimum nabzın yüzdesi. Beş bölgeli model yaygın olanı; asıl
 * ayrım ikisi arasında: aerobik taban (zone 2) ile eşik üstü çalışma
 * (zone 4-5). Aradaki zone 3, "orta yoğunluk tuzağı" diye anılan bölge —
 * taban geliştirmek için fazla yorucu, üst uç geliştirmek için fazla hafif.
 */
export const HR_ZONES = [
  {
    key: 'z1', label: 'Zone 1', name: 'Toparlanma', min: 0.50, max: 0.60,
    color: 'text-zinc-400',
    purpose: 'Kan akışını artırır, yorgunluk eklemez. Ağır bacak gününün ertesinde en güvenli seçenek.',
  },
  {
    key: 'z2', label: 'Zone 2', name: 'Aerobik taban', min: 0.60, max: 0.70,
    color: 'text-emerald-400',
    purpose: 'Konuşabildiğin tempo. Mitokondri yoğunluğunu ve yağ oksidasyonunu geliştiren bölge; kardiyo hacminin çoğu burada olmalı.',
  },
  {
    key: 'z3', label: 'Zone 3', name: 'Tempo', min: 0.70, max: 0.80,
    color: 'text-amber-400',
    purpose: 'Cümle kurmak zorlaşıyor. Taban için fazla yorucu, üst uç için fazla hafif — kardiyonun tamamı burada geçerse hem yorgunluk birikir hem gelişim yavaşlar.',
  },
  {
    key: 'z4', label: 'Zone 4', name: 'Eşik', min: 0.80, max: 0.90,
    color: 'text-orange-400',
    purpose: 'Laktat eşiği civarı. Dayanıklılığın üst ucunu geliştirir; haftada bir iki seansı geçmemeli.',
  },
  {
    key: 'z5', label: 'Zone 5', name: 'Maksimal', min: 0.90, max: 1.0,
    color: 'text-red-400',
    purpose: 'VO2max bölgesi, kısa aralıklar. En yüksek uyaran ama en yüksek toparlanma maliyeti; hipertrofi döneminde dikkatli kullanılmalı.',
  },
];

export const findZone = (key) => HR_ZONES.find(z => z.key === key) || null;

/**
 * Yaşa göre tahmini maksimum nabız.
 *
 * Tanaka formülü (208 − 0.7 × yaş) kullanılıyor; klasik "220 − yaş" genç
 * yetişkinlerde fazla yüksek, ileri yaşta fazla düşük tahmin veriyor. Yine de
 * bir TAHMİN: kişiler arası sapma ±10-12 atım. Bu yüzden bölge sınırları
 * kesin eşik değil, yön gösterici olarak sunuluyor.
 */
export const estimateMaxHr = (age) => {
  const y = parseNumber(age);
  if (!(y > 0)) return null;
  return Math.round(208 - 0.7 * y);
};

/** Bölgenin nabız aralığı (atım/dk); yaş bilinmiyorsa null. */
export const zoneRange = (zoneKey, age) => {
  const max = estimateMaxHr(age);
  const zone = findZone(zoneKey);
  if (!max || !zone) return null;
  return { min: Math.round(max * zone.min), max: Math.round(max * zone.max) };
};

/** Ölçülen nabzın hangi bölgeye düştüğü. */
export const zoneForHeartRate = (bpm, age) => {
  const max = estimateMaxHr(age);
  const hr = parseNumber(bpm);
  if (!max || !(hr > 0)) return null;
  const oran = hr / max;
  // Üstten aşağı taranıyor: %92 hem z4 hem z5 aralığına yakın durabiliyor,
  // yüksek olan kazanmalı.
  return [...HR_ZONES].reverse().find(z => oran >= z.min) || HR_ZONES[0];
};

/**
 * Aktivitenin doğal bölgesi.
 *
 * Bir aktivite kendi başına bir şiddet taşıyor: yürüyüş zone 1-2, HIIT zone 5.
 * Tempo seçimi bunu yukarı ya da aşağı kaydırıyor. Nabız yoksa sınıflandırma
 * bu ikisinden çıkıyor ve pratikte yeterince doğru: kimse "Zone 2 Koşu"yu
 * maç temposunda yapmıyor.
 */
const ACTIVITY_BASE_ZONE = {
  walk: 1, treadmill_walk: 1, yoga: 1, pilates: 1, stationary_bike: 1,
  zone2: 2, walk_incline: 2, hike: 2, elliptical: 2, bike: 2, rower: 2, ski_erg: 2,
  swim: 3, run: 3, spinning: 3, stair: 3, dance: 2, basketball_half: 2,
  boxing: 3, climbing: 3, skiing: 2, volleyball: 2, tennis: 3, padel: 3,
  basketball: 3, football: 3,
  interval: 4, jump_rope: 3, burpee: 4,
  hiit: 5, assault_bike: 4,
};

// Tempo seçiminin bölgeyi kaç kademe kaydırdığı.
const EFFORT_SHIFT = { fun: -1, easy: -1, moderate: 0, hard: 1, match: 1, custom: 0 };

/**
 * Bir kardiyo kaydının bölgesi.
 *
 * Öncelik ölçüme veriliyor: ortalama nabız girilmişse tahmin kullanılmıyor.
 *
 * @returns { zone, source: 'heartRate' | 'estimate' }
 */
export const zoneForEntry = (entry = {}, { age = null } = {}) => {
  const olculen = zoneForHeartRate(entry.avgHeartRate, age);
  if (olculen) return { zone: olculen, source: 'heartRate' };

  const aktivite = findActivity(entry.type);
  const taban = ACTIVITY_BASE_ZONE[entry.type] ?? (aktivite && aktivite.met >= 8 ? 4 : aktivite && aktivite.met >= 6 ? 3 : 2);
  const kayma = EFFORT_SHIFT[entry.effort] ?? 0;
  const index = Math.min(5, Math.max(1, taban + kayma));
  return { zone: HR_ZONES[index - 1], source: 'estimate' };
};

/**
 * Antrenman amacına göre üç kaba sınıf.
 *
 * Haftalık dağılım kararı beş bölge üzerinden değil bu üçü üzerinden
 * veriliyor: literatürdeki "polarize" yaklaşım hacmin çoğunu düşük şiddete,
 * küçük bir kısmını yükseğe koymayı, ortayı ise sınırlı tutmayı öneriyor.
 */
export const INTENSITY_CLASSES = {
  low: { key: 'low', label: 'Düşük şiddet', zones: ['z1', 'z2'], color: 'text-emerald-400' },
  middle: { key: 'middle', label: 'Orta bölge', zones: ['z3'], color: 'text-amber-400' },
  high: { key: 'high', label: 'Yüksek şiddet', zones: ['z4', 'z5'], color: 'text-red-400' },
};

export const intensityClassOf = (zoneKey) => {
  if (zoneKey === 'z1' || zoneKey === 'z2') return INTENSITY_CLASSES.low;
  if (zoneKey === 'z3') return INTENSITY_CLASSES.middle;
  return INTENSITY_CLASSES.high;
};

/** Kaydın dakikası, bölgesi ve sınıfıyla birlikte zenginleştirilmiş hali. */
export const describeCardioEntry = (entry = {}, { age = null } = {}) => {
  const { zone, source } = zoneForEntry(entry, { age });
  const aktivite = findActivity(entry.type);
  const tempo = findEffort(entry.effort);
  return {
    ...entry,
    activity: aktivite,
    effortInfo: tempo,
    zone,
    zoneSource: source,
    intensity: intensityClassOf(zone.key),
    minutes: Math.max(0, Math.round(parseNumber(entry.minutes))),
  };
};

/**
 * Mesafe ölçmenin anlamlı olduğu aktiviteler.
 *
 * Her kardiyoda mesafe sorulmuyor: HIIT ya da boks için "kaç km" diye sormak
 * hem doldurulmayacak bir alan hem de anlamsız bir sayı üretir. Koşu, yüzme,
 * bisiklet ve kürekte ise mesafe, süreyle birlikte TEMPOYU veriyor — ve tempo,
 * kardiyoda gelişimin en doğrudan ölçüsü.
 */
export const DISTANCE_ACTIVITIES = new Set([
  'walk', 'walk_incline', 'zone2', 'run', 'interval', 'treadmill_walk',
  'bike', 'spinning', 'stationary_bike', 'rower', 'ski_erg', 'swim', 'hike',
]);

/** Yüzmede tempo 100 m başına, diğerlerinde kilometre başına okunuyor. */
export const paceUnitFor = (activityKey) => (activityKey === 'swim'
  ? { per: 0.1, label: '100 m' }
  : { per: 1, label: 'km' });

export const supportsDistance = (activityKey) => DISTANCE_ACTIVITIES.has(activityKey);

/**
 * Bir kaydın temposu.
 *
 * @returns { minutesPer, label, speedKmh } | null
 */
export const entryPace = (entry = {}) => {
  const km = parseNumber(entry.distanceKm);
  const dk = parseNumber(entry.minutes);
  if (!(km > 0) || !(dk > 0)) return null;

  const birim = paceUnitFor(entry.type);
  const dakikaBasi = (dk / km) * birim.per;
  const tam = Math.floor(dakikaBasi);
  const saniye = Math.round((dakikaBasi - tam) * 60);
  // 5:60 gibi bir çıktı olmasın diye taşma bir dakikaya devrediliyor.
  const dus = saniye === 60 ? { m: tam + 1, s: 0 } : { m: tam, s: saniye };

  return {
    minutesPer: Math.round(dakikaBasi * 100) / 100,
    label: `${dus.m}:${String(dus.s).padStart(2, '0')} /${birim.label}`,
    speedKmh: Math.round((km / (dk / 60)) * 10) / 10,
    distanceKm: km,
  };
};

/**
 * Bir aktivitenin tempo eğilimi.
 *
 * Yalnızca AYNI aktivite karşılaştırılıyor: koşu temposuyla bisiklet temposunu
 * kıyaslamak anlamsız. Ayrıca yalnızca aynı şiddet sınıfındaki kayıtlar
 * karşılaştırılıyor — zone 2 koşusunun temposu interval seansıyla kıyaslanınca
 * "gerileme" gibi görünüyordu, oysa iki farklı iş.
 */
export const paceTrend = (workouts = [], activityKey, { age = null, limit = 8 } = {}) => {
  const kayitlar = [];
  (workouts || []).forEach(w => {
    (w.cardio || []).forEach(entry => {
      if (entry?.type !== activityKey) return;
      const tempo = entryPace(entry);
      if (!tempo) return;
      const { intensity } = describeCardioEntry(entry, { age });
      kayitlar.push({ date: w.date, ...tempo, intensity: intensity.key });
    });
  });
  if (kayitlar.length < 2) return { hasData: false, entries: kayitlar };

  kayitlar.sort((a, b) => (a.date < b.date ? 1 : -1));
  const baskin = kayitlar[0].intensity;
  const ayniSinif = kayitlar.filter(k => k.intensity === baskin).slice(0, limit);
  if (ayniSinif.length < 2) return { hasData: false, entries: kayitlar.slice(0, limit) };

  const yari = Math.ceil(ayniSinif.length / 2);
  const yeni = ayniSinif.slice(0, yari);
  const eski = ayniSinif.slice(yari);
  const ort = (list) => list.reduce((t, x) => t + x.minutesPer, 0) / list.length;
  const fark = eski.length > 0 ? ort(yeni) - ort(eski) : 0;

  return {
    hasData: true,
    entries: ayniSinif,
    intensity: baskin,
    // Tempoda DÜŞÜŞ iyileşme demek: aynı mesafeyi daha kısa sürede.
    direction: fark <= -0.15 ? 'improving' : fark >= 0.15 ? 'declining' : 'flat',
    deltaMinutes: Math.round(fark * 100) / 100,
    latest: ayniSinif[0],
  };
};
