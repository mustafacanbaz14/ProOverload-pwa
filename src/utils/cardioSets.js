import { parseNumber } from './number.js';

/**
 * Kardiyo set defteri.
 *
 * Kardiyo kaydı tek satırdı: aktivite, süre, tempo. Yürüyüş için yeterli ama
 * yüzme, interval koşu ve kürek gibi işler SET yapısında yapılıyor — "45
 * dakika yüzme" cümlesi, 8 × 100 m serbest ile 1500 m düz yüzmeyi aynı kefeye
 * koyuyor ve ikisi çok farklı seanslar.
 *
 * Set defteri o yapıyı kaydediyor: her set için mesafe, stil/tip, süre ve
 * dinlenme. Bundan hem toplam mesafe hem 100 m başına tempo hem de stil
 * dağılımı çıkıyor.
 *
 * Alanların hepsi İSTEĞE BAĞLI. Set defteri açmadan da kardiyo girilebiliyor
 * ve kalori hesabı her koşulda çalışıyor; defter yalnızca yapıyı kaydetmek
 * isteyene.
 */

/**
 * Yüzme stilleri.
 *
 * `met` çarpanı aktivitenin temel MET'ini ölçekliyor: kelebek serbestten
 * belirgin daha pahalı, sırtüstü daha ucuz. Değerler Compendium'daki yüzme
 * satırlarının birbirine oranından geliyor.
 */
export const SWIM_STROKES = [
  { key: 'free', label: 'Serbest', short: 'S', met: 1, hint: 'Kroul; en verimli ve en yaygın stil' },
  { key: 'back', label: 'Sırtüstü', short: 'Sı', met: 0.85, hint: 'Nefes serbest, omuz yükü düşük' },
  { key: 'breast', label: 'Kurbağalama', short: 'K', met: 1.15, hint: 'Kalça ve iç bacak yükü yüksek' },
  { key: 'fly', label: 'Kelebek', short: 'Ke', met: 1.45, hint: 'En pahalı stil; kısa setlerde kullanılır' },
  { key: 'medley', label: 'Karışık', short: 'KA', met: 1.15, hint: 'Dört stil sırayla' },
  { key: 'drill', label: 'Teknik/Drill', short: 'T', met: 0.75, hint: 'Teknik çalışması, düşük tempo' },
  { key: 'kick', label: 'Ayak', short: 'A', met: 0.9, hint: 'Tahta ile yalnızca bacak' },
  { key: 'pull', label: 'Kol', short: 'Ko', met: 0.9, hint: 'Şamandıra ile yalnızca kol' },
];

export const findStroke = (key) => SWIM_STROKES.find(s => s.key === key) || SWIM_STROKES[0];

/**
 * Koşu/kürek gibi işlerde set tipi.
 *
 * Yüzmede "stil" ne ise burada "tip" o: setin ne amaçla yapıldığı. İnterval
 * seansında ısınma ile ana setin aynı kefeye konması, tempo ortalamasını
 * anlamsız kılıyordu.
 */
export const SET_KINDS = [
  { key: 'work', label: 'Ana set', met: 1, hint: 'Seansın asıl işi' },
  { key: 'warmup', label: 'Isınma', met: 0.7, hint: 'Açılış; tempo hesabına girmez' },
  { key: 'cooldown', label: 'Soğuma', met: 0.7, hint: 'Kapanış; tempo hesabına girmez' },
  { key: 'recovery', label: 'Toparlanma', met: 0.75, hint: 'Setler arası aktif dinlenme' },
];

export const findSetKind = (key) => SET_KINDS.find(k => k.key === key) || SET_KINDS[0];

/** Bu aktivitelerde set defteri açılabiliyor. */
export const SET_LOG_ACTIVITIES = new Set([
  'swim', 'run', 'interval', 'zone2', 'rower', 'ski_erg', 'bike', 'spinning',
  'assault_bike', 'stair', 'jump_rope', 'hiit',
]);

export const supportsSetLog = (activityKey) => SET_LOG_ACTIVITIES.has(activityKey);
export const isSwim = (activityKey) => activityKey === 'swim';

/**
 * Havuz uzunlukları.
 *
 * SWOLF bir HAVUZ UZUNLUĞU için tanımlı: o uzunluğun süresi + o uzunlukta
 * atılan kulaç sayısı. İlk yazımda set mesafesi üzerinden hesaplanıyordu ve
 * 100 m'lik bir sette 133 gibi anlamsız bir sayı üretiyordu; SWOLF'un tipik
 * aralığı 25 m havuzda 30-45.
 */
export const POOL_LENGTHS = [
  { key: '25', meters: 25, label: '25 m' },
  { key: '50', meters: 50, label: '50 m' },
];

export const findPoolLength = (key) =>
  POOL_LENGTHS.find(p => p.key === String(key))?.meters || 25;

export const emptyCardioSet = (activityKey = 'swim') => ({
  reps: 1,
  distance: activityKey === 'swim' ? 100 : 400,
  stroke: 'free',
  kind: 'work',
  seconds: '',
  restSeconds: '',
  strokeCount: '',
});

/**
 * Tek bir set satırının türetilmiş değerleri.
 *
 * `reps` bir satırın kaç kez tekrarlandığı: "8 × 100 m" tek satırda tutuluyor,
 * sekiz ayrı satır açmak hem yazmayı hem okumayı zorlaştırıyordu.
 */
export const describeSet = (row = {}, activityKey = 'swim', { poolLength = 25 } = {}) => {
  const tekrar = Math.max(1, Math.round(parseNumber(row.reps) || 1));
  const mesafe = Math.max(0, parseNumber(row.distance));
  const saniye = Math.max(0, parseNumber(row.seconds));
  const dinlenme = Math.max(0, parseNumber(row.restSeconds));
  const kulac = Math.max(0, parseNumber(row.strokeCount));

  const toplamMesafe = tekrar * mesafe;
  const toplamSaniye = tekrar * saniye;
  const toplamDinlenme = Math.max(0, tekrar - 1) * dinlenme;

  const stil = isSwim(activityKey) ? findStroke(row.stroke) : null;
  const tip = findSetKind(row.kind);

  // Tempo: yüzmede 100 m, diğerlerinde 1 km başına.
  const birim = isSwim(activityKey) ? 100 : 1000;
  const tempoSaniye = (mesafe > 0 && saniye > 0) ? (saniye / mesafe) * birim : null;

  return {
    ...row,
    reps: tekrar,
    distance: mesafe,
    seconds: saniye,
    restSeconds: dinlenme,
    strokeCount: kulac,
    totalDistance: toplamMesafe,
    totalSeconds: toplamSaniye + toplamDinlenme,
    workSeconds: toplamSaniye,
    stroke: stil,
    kind: tip,
    paceSeconds: tempoSaniye,
    paceLabel: tempoSaniye ? formatSeconds(tempoSaniye) : '',
    paceUnit: isSwim(activityKey) ? '100 m' : 'km',
    // SWOLF: bir HAVUZ UZUNLUĞUNUN süresi + o uzunlukta atılan kulaç sayısı.
    // Yüzmede verimliliğin standart ölçüsü — aynı tempoyu daha az kulaçla
    // tutmak teknik gelişimi gösteriyor. Kulaç sayısı set için toplam
    // giriliyor, uzunluk başına bölünüyor.
    swolf: (() => {
      if (!isSwim(activityKey) || !(kulac > 0) || !(saniye > 0) || !(mesafe > 0)) return null;
      const uzunlukSayisi = mesafe / poolLength;
      if (!(uzunlukSayisi >= 1)) return null;
      return Math.round(saniye / uzunlukSayisi + kulac / uzunlukSayisi);
    })(),
    label: `${tekrar} × ${mesafe} m${stil ? ` ${stil.label.toLowerCase()}` : ''}`,
  };
};

/** sn -> m:ss */
export const formatSeconds = (totalSeconds) => {
  const s = Math.max(0, Math.round(parseNumber(totalSeconds)));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Set defterinin özeti.
 *
 * Tempo ortalaması yalnızca ANA setlerden çıkıyor: ısınma ve soğuma dahil
 * edilirse ortalama tempo her seansta olduğundan yavaş görünüyor ve gelişim
 * takibi bozuluyor.
 */
export const summarizeSets = (rows = [], activityKey = 'swim', opts = {}) => {
  const setler = (rows || [])
    .map(r => describeSet(r, activityKey, opts))
    .filter(r => r.totalDistance > 0 || r.workSeconds > 0);

  if (setler.length === 0) {
    return { sets: [], hasData: false, totalDistance: 0, totalMinutes: 0, byStroke: [], avgPace: null };
  }

  const toplamMesafe = setler.reduce((t, r) => t + r.totalDistance, 0);
  const toplamSaniye = setler.reduce((t, r) => t + r.totalSeconds, 0);

  const ana = setler.filter(r => r.kind.key === 'work' && r.paceSeconds);
  const anaMesafe = ana.reduce((t, r) => t + r.totalDistance, 0);
  const anaSaniye = ana.reduce((t, r) => t + r.workSeconds, 0);
  const birim = isSwim(activityKey) ? 100 : 1000;
  const ortTempo = (anaMesafe > 0 && anaSaniye > 0) ? (anaSaniye / anaMesafe) * birim : null;

  // Stil dağılımı yalnızca yüzmede anlamlı.
  const stilHarita = new Map();
  if (isSwim(activityKey)) {
    setler.forEach(r => {
      const k = r.stroke?.key || 'free';
      const kayit = stilHarita.get(k) || { stroke: r.stroke, distance: 0, sets: 0 };
      kayit.distance += r.totalDistance;
      kayit.sets += r.reps;
      stilHarita.set(k, kayit);
    });
  }
  const byStroke = [...stilHarita.values()]
    .map(x => ({ ...x, share: toplamMesafe > 0 ? Math.round((x.distance / toplamMesafe) * 100) : 0 }))
    .sort((a, b) => b.distance - a.distance);

  const swolfler = setler.map(r => r.swolf).filter(Boolean);

  return {
    sets: setler,
    hasData: true,
    totalDistance: toplamMesafe,
    totalDistanceKm: Math.round((toplamMesafe / 1000) * 1000) / 1000,
    totalSeconds: toplamSaniye,
    totalMinutes: Math.round(toplamSaniye / 60),
    workDistance: anaMesafe,
    avgPace: ortTempo,
    avgPaceLabel: ortTempo ? `${formatSeconds(ortTempo)} /${isSwim(activityKey) ? '100 m' : 'km'}` : '',
    byStroke,
    avgSwolf: swolfler.length > 0 ? Math.round(swolfler.reduce((t, n) => t + n, 0) / swolfler.length) : null,
    // MET çarpanı: stil ve set tipi ağırlıklı ortalama. Kelebek ağırlıklı bir
    // seans, aynı süredeki teknik çalışmasından belirgin daha pahalı.
    metMultiplier: (() => {
      const agirlikli = setler.reduce((t, r) => {
        const carpan = (isSwim(activityKey) ? (r.stroke?.met || 1) : 1) * (r.kind?.met || 1);
        return t + carpan * Math.max(1, r.totalSeconds);
      }, 0);
      const toplamAgirlik = setler.reduce((t, r) => t + Math.max(1, r.totalSeconds), 0);
      return toplamAgirlik > 0 ? Math.round((agirlikli / toplamAgirlik) * 100) / 100 : 1;
    })(),
  };
};

/**
 * Set defterinden kardiyo kaydının alanlarını üretir.
 *
 * Defter doldurulduğunda süre ve mesafe elle yazılmıyor; defterden çıkıyor ve
 * ikisinin ayrışması engelleniyor.
 */
export const entryFromSets = (rows = [], activityKey = 'swim', opts = {}) => {
  const ozet = summarizeSets(rows, activityKey, opts);
  if (!ozet.hasData) return null;
  return {
    minutes: Math.max(1, ozet.totalMinutes),
    distanceKm: ozet.totalDistanceKm > 0 ? ozet.totalDistanceKm : undefined,
    sets: rows,
    setSummary: {
      totalDistance: ozet.totalDistance,
      avgPace: ozet.avgPace,
      avgSwolf: ozet.avgSwolf,
      metMultiplier: ozet.metMultiplier,
    },
  };
};

/**
 * Geçmişteki set defterlerinden stil bazında tempo eğilimi.
 *
 * Yalnızca ANA setler ve aynı stil karşılaştırılıyor; kelebek temposuyla
 * serbest temposunu kıyaslamak gerileme gibi görünürdü.
 */
export const strokePaceTrend = (workouts = [], { activityKey = 'swim', limit = 10, ...opts } = {}) => {
  const kayitlar = new Map();

  (workouts || []).forEach(w => {
    (w.cardio || []).forEach(entry => {
      if (entry?.type !== activityKey || !Array.isArray(entry.sets)) return;
      summarizeSets(entry.sets, activityKey, opts).sets
        .filter(r => r.kind.key === 'work' && r.paceSeconds)
        .forEach(r => {
          const k = isSwim(activityKey) ? (r.stroke?.key || 'free') : 'work';
          const liste = kayitlar.get(k) || [];
          liste.push({ date: w.date, pace: r.paceSeconds, distance: r.totalDistance });
          kayitlar.set(k, liste);
        });
    });
  });

  return [...kayitlar.entries()].map(([key, liste]) => {
    const sirali = liste.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
    if (sirali.length < 2) return null;
    const yari = Math.ceil(sirali.length / 2);
    const ort = (l) => l.reduce((t, x) => t + x.pace, 0) / l.length;
    const fark = ort(sirali.slice(0, yari)) - ort(sirali.slice(yari));
    return {
      key,
      stroke: isSwim(activityKey) ? findStroke(key) : null,
      entries: sirali,
      latest: sirali[0],
      latestLabel: `${formatSeconds(sirali[0].pace)} /${isSwim(activityKey) ? '100 m' : 'km'}`,
      // Tempoda DÜŞÜŞ iyileşme: aynı mesafe daha kısa sürede.
      direction: fark <= -1 ? 'improving' : fark >= 1 ? 'declining' : 'flat',
      deltaSeconds: Math.round(fark),
    };
  }).filter(Boolean).sort((a, b) => b.entries.length - a.entries.length);
};
