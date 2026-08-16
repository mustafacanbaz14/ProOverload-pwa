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
 * Bölge sınırlarının hesaplanma yöntemi.
 *
 * İki yaygın yöntem var ve aynı yüzde farklı atım veriyor:
 *
 *  - MAKS: sınır doğrudan maksimum nabzın yüzdesi. Basit ama dinlenme nabzını
 *    yok sayıyor; iyi antrenmanlı birinde zone 2 gereğinden düşük çıkıyor.
 *  - HRR (Karvonen): sınır, dinlenme ile maksimum arasındaki REZERVİN yüzdesi
 *    üstüne dinlenme nabzı eklenerek bulunuyor. Kişinin kendi tabanını hesaba
 *    kattığı için bireysel farkı daha iyi yakalıyor, ama dinlenme nabzı
 *    ölçümü gerektiriyor.
 *
 * Aradaki fark küçük değil: 30 yaşında, dinlenme nabzı 55 olan biri için
 * zone 2 üst sınırı maks yöntemiyle 131, Karvonen'le 147 çıkıyor. Bu yüzden
 * yöntem kullanıcıya bırakılıyor ve hangi yöntemin kullanıldığı arayüzde
 * yazıyor.
 */
export const ZONE_METHODS = [
  {
    key: 'max', label: '% Maks. Nabız', short: 'Maks',
    hint: 'Sınırlar doğrudan maksimum nabzın yüzdesi. Dinlenme nabzı gerekmez.',
  },
  {
    key: 'hrr', label: 'Karvonen (%HRR)', short: 'HRR',
    hint: 'Dinlenme ile maksimum arasındaki rezervin yüzdesi. Dinlenme nabzı gerekir; bireysel farkı daha iyi yakalar.',
  },
];

export const findZoneMethod = (key) => ZONE_METHODS.find(m => m.key === key) || ZONE_METHODS[0];

/**
 * Bir yüzdenin atım karşılığı.
 *
 * Karvonen seçiliyken dinlenme nabzı yoksa sessizce maks yöntemine düşülüyor:
 * eksik veriyle yanlış bir sayı üretmektense bilinen yöntemi kullanmak doğru.
 */
export const bpmForPercent = (percent, { age, restingHr = 0, method = 'max', maxHrManual = '' } = {}) => {
  const max = resolveMaxHr({ age, maxHrManual }).bpm;
  if (!max) return null;
  const dinlenme = parseNumber(restingHr);
  if (method === 'hrr' && dinlenme > 0 && dinlenme < max) {
    return Math.round(dinlenme + (max - dinlenme) * percent);
  }
  return Math.round(max * percent);
};

/** Seçili yöntemin gerçekten uygulanabilir olup olmadığı. */
export const effectiveZoneMethod = ({ age, restingHr = 0, method = 'max', maxHrManual = '' } = {}) => {
  const max = resolveMaxHr({ age, maxHrManual }).bpm;
  const dinlenme = parseNumber(restingHr);
  return (method === 'hrr' && max && dinlenme > 0 && dinlenme < max) ? 'hrr' : 'max';
};

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

/**
 * Kullanılacak maksimum nabız: elle girilen değer varsa O, yoksa tahmin.
 *
 * Tanaka formülü bir POPÜLASYON ortalaması ve kişiler arası sapma ±10-12
 * atım. Saha testiyle (ya da yarış sırasında görülen tepe nabızla) kendi
 * maksimumunu bilen biri için tahmini dayatmak, bütün bölge sınırlarını
 * sistematik olarak kaydırıyordu. Elle girilen değer her zaman kazanıyor.
 *
 * @returns { bpm, source: 'manual' | 'estimate' | 'none' }
 */
export const resolveMaxHr = ({ age = null, maxHrManual = '' } = {}) => {
  const elle = parseNumber(maxHrManual);
  // Üst sınır insani bir aralıkta tutuluyor; 300 gibi bir yazım hatası bütün
  // bölgeleri anlamsız yapardı.
  if (elle >= 120 && elle <= 230) return { bpm: Math.round(elle), source: 'manual' };
  const tahmin = estimateMaxHr(age);
  return tahmin ? { bpm: tahmin, source: 'estimate' } : { bpm: null, source: 'none' };
};

/**
 * Saha testinden maksimum nabız tahmini.
 *
 * Ölçmenin en yaygın pratik yolu: iyi ısındıktan sonra 3-5 dakikalık tam
 * çabayla çıkılan bir tırmanış/koşu ve o sırada görülen tepe nabız. Bu, tek
 * seferde ölçülen değer olduğu için formülden belirgin daha iyi ama tam
 * maksimumun biraz altında kalabiliyor — bu yüzden görülen tepe değerin
 * kendisi öneriliyor, üstüne pay eklenmiyor.
 */
export const MAX_HR_TEST_HINT = 'İyi ısındıktan sonra 3-5 dakika tam çabayla çık (yokuş, bant eğimi ya da bisiklet), son 30 saniyede hızlan ve o sırada gördüğün tepe nabzı yaz. Formül bir popülasyon ortalaması; kendi ölçümün her zaman daha doğru.';

/**
 * Bölgenin nabız aralığı (atım/dk); yaş bilinmiyorsa null.
 *
 * İkinci argüman geriye dönük uyum için hâlâ düz yaş kabul ediyor; nesne
 * verilirse yöntem ve dinlenme nabzı da okunuyor.
 */
export const zoneRange = (zoneKey, ageOrOpts) => {
  const opts = (ageOrOpts && typeof ageOrOpts === 'object') ? ageOrOpts : { age: ageOrOpts };
  const zone = findZone(zoneKey);
  if (!zone) return null;
  const alt = bpmForPercent(zone.min, opts);
  const ust = bpmForPercent(zone.max, opts);
  return (alt && ust) ? { min: alt, max: ust } : null;
};

/** Ölçülen nabzın hangi bölgeye düştüğü. */
export const zoneForHeartRate = (bpm, ageOrOpts) => {
  const opts = (ageOrOpts && typeof ageOrOpts === 'object') ? ageOrOpts : { age: ageOrOpts };
  const hr = parseNumber(bpm);
  if (!(hr > 0) || !resolveMaxHr(opts).bpm) return null;
  // Üstten aşağı taranıyor: bir nabız hem z4 hem z5 sınırına yakın
  // durabiliyor, yüksek olan kazanmalı.
  return [...HR_ZONES].reverse().find(z => hr >= bpmForPercent(z.min, opts)) || HR_ZONES[0];
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
export const zoneForEntry = (entry = {}, opts = {}) => {
  const olculen = zoneForHeartRate(entry.avgHeartRate, opts);
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
export const describeCardioEntry = (entry = {}, opts = {}) => {
  const { zone, source } = zoneForEntry(entry, opts);
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
export const paceTrend = (workouts = [], activityKey, { limit = 8, ...zoneOpts } = {}) => {
  const kayitlar = [];
  (workouts || []).forEach(w => {
    (w.cardio || []).forEach(entry => {
      if (entry?.type !== activityKey) return;
      const tempo = entryPace(entry);
      if (!tempo) return;
      const { intensity } = describeCardioEntry(entry, zoneOpts);
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

/**
 * Nabız tabanlı kalori tahmini (Keytel denklemi).
 *
 * MET tabanlı hesap aktivitenin TABLO değerini kullanıyor: aynı "45 dakika
 * bisiklet" herkes için aynı kaloriyi veriyor. Ortalama nabız girildiyse daha
 * iyisi mümkün — nabız, kişinin o seansta gerçekten ne kadar zorlandığının
 * doğrudan ölçüsü.
 *
 * Keytel ve arkadaşlarının regresyonu yaş, kilo, cinsiyet ve ortalama nabızdan
 * dakikalık enerji harcamasını tahmin ediyor. Sınırları var: düşük nabızlarda
 * (dinlenmeye yakın) güvenilirliği düşüyor ve ağırlık antrenmanı gibi
 * aralıklı işlerde nabız gecikmeli tepki verdiği için şişiyor. Bu yüzden
 * yalnızca süreklilik gerektiren kardiyoda ve nabız makul bir aralıktaysa
 * kullanılıyor; dışında MET hesabına dönülüyor.
 */
const HR_CALORIE_MIN_BPM = 90;
const HR_CALORIE_MAX_BPM = 210;

export const heartRateCalories = ({ avgHeartRate, minutes, weightKg, age, gender = 'male' } = {}) => {
  const hr = parseNumber(avgHeartRate);
  const dk = parseNumber(minutes);
  const kg = parseNumber(weightKg);
  const yas = parseNumber(age);
  if (!(hr >= HR_CALORIE_MIN_BPM) || hr > HR_CALORIE_MAX_BPM) return null;
  if (!(dk > 0) || !(kg > 0) || !(yas > 0)) return null;

  const dakikalik = gender === 'female'
    ? (-20.4022 + 0.4472 * hr - 0.1263 * kg + 0.074 * yas) / 4.184
    : (-55.0969 + 0.6309 * hr + 0.1988 * kg + 0.2017 * yas) / 4.184;

  // Negatif ya da absürt düşük çıkan tahminler kullanılmıyor: formül düşük
  // nabızda eksiye düşebiliyor ve "0 kalori yaktın" demek yanlış olurdu.
  if (!(dakikalik > 0.5)) return null;
  return Math.round(dakikalik * dk);
};

/**
 * Bir kaydın kalorisi ve hangi yöntemle bulunduğu.
 *
 * Yöntem arayüzde gösteriliyor: iki farklı sayı gören kullanıcı hangisinin
 * neden farklı olduğunu sorabilmeli.
 */
export const cardioCalories = (entry = {}, { weightKg, age, gender = 'male', metCalories = null } = {}) => {
  const nabiz = heartRateCalories({
    avgHeartRate: entry.avgHeartRate,
    minutes: entry.minutes,
    weightKg,
    age,
    gender,
  });
  if (nabiz !== null) return { kcal: nabiz, source: 'heartRate' };
  const met = parseNumber(metCalories);
  return { kcal: Math.round(met), source: 'met' };
};
