import { parseNumber } from './number.js';
import { dayKey, toLocalDate, formatDay } from './dates.js';

/**
 * Eklem ve bağ dokusu ağrısı takibi.
 *
 * Hazır oluşluk formu seans başına tek bir "eklem ağrısı" puanı alıyordu ve o
 * puan seansın hesabına girip kayboluyordu. Oysa bu verinin asıl değeri
 * zamanda: "omzum üç haftadır ağrıyor ve hep bench gününden sonra" cümlesini
 * kurabilmek, tek bir 7/10 puanından çok daha işe yarar.
 *
 * İki şey ekleniyor:
 *
 *  1. BÖLGE. Ağrının nerede olduğu kaydediliyor. Diz ağrısıyla omuz ağrısı
 *     aynı sayıya düşerse hiçbir örüntü görünmüyor.
 *  2. İLİŞKİLENDİRME. Ağrılı günlerde hangi hareketlerin yapıldığı sayılıyor.
 *     Bu bir NEDENSELLİK iddiası değil — modül bunu asla söylemiyor — ama
 *     "hangi hareketi elemeyi deneyeyim" sorusunun başlangıç noktası.
 */

export const PAIN_REGIONS = [
  { key: 'shoulder', label: 'Omuz', hint: 'Basış ve baş üstü hareketlerde en sık' },
  { key: 'elbow', label: 'Dirsek', hint: 'Triseps ve biseps yüklenmesinde' },
  { key: 'wrist', label: 'Bilek', hint: 'Basış, önkol ve tutuş yüklenmesinde' },
  { key: 'lowBack', label: 'Bel', hint: 'Çömeliş, kalça menteşesi ve taşımalarda' },
  { key: 'hip', label: 'Kalça', hint: 'Derin çömeliş ve kalça menteşesinde' },
  { key: 'knee', label: 'Diz', hint: 'Çömeliş, lunge ve diz uzatmada' },
  { key: 'ankle', label: 'Ayak Bileği', hint: 'Derin çömeliş ve baldır yüklenmesinde' },
  { key: 'neck', label: 'Boyun', hint: 'Trapez ve baş üstü çalışmada' },
];

export const findRegion = (key) => PAIN_REGIONS.find(r => r.key === key) || null;

// Bu puanın altı "takibe değmez" sayılıyor. Her küçük rahatsızlığı kayda
// geçirmek listeyi gürültüyle dolduruyor ve asıl sinyali görünmez kılıyor.
const TRACK_THRESHOLD = 3;
// Bu puandan itibaren "yüksek": hareket değiştirmeyi düşündüren seviye.
const HIGH_THRESHOLD = 7;
// Bir bölge bu kadar gün içinde tekrar ağrıdıysa "sürüyor" sayılıyor.
const PERSISTENT_WINDOW_DAYS = 21;
const PERSISTENT_MIN_ENTRIES = 3;

/** Tek bir ağrı kaydı. */
export const painEntry = ({ date, region, severity, note = '', exercise = '' }) => ({
  date: dayKey(date),
  region,
  severity: Math.min(10, Math.max(1, Math.round(parseNumber(severity)))),
  note: String(note || '').slice(0, 240),
  exercise: String(exercise || ''),
});

/**
 * Kayıtları listeye ekler; aynı gün + aynı bölge tek satırda kalır.
 *
 * Aynı gün iki kez giriş yapmak bir hata değil (sabah farklı, akşam farklı
 * hissedilebiliyor) ama iki satır bırakmak trendi şişiriyor. Sonuncusu
 * kazanıyor: en son verilen puan o günün nihai değerlendirmesi.
 */
export const upsertPainEntry = (log = [], entry) => {
  if (!entry?.region || !entry?.date) return log;
  const digerleri = log.filter(x => !(x.date === entry.date && x.region === entry.region));
  return [...digerleri, entry].sort((a, b) => (a.date < b.date ? 1 : -1));
};

export const removePainEntry = (log = [], date, region) =>
  log.filter(x => !(x.date === date && x.region === region));

/**
 * Bölge bölge ağrı özeti.
 *
 * `trend` son iki eşit pencerenin ortalamasını karşılaştırıyor. Tek kayıtla
 * trend hesaplamak anlamsız olduğu için en az iki kayıt aranıyor; yoksa
 * 'unknown' dönüyor ve arayüz ok göstermiyor.
 */
export const buildPainReport = (log = [], { workouts = [], today = new Date(), days = 90 } = {}) => {
  const bugun = toLocalDate(dayKey(today));
  const sinir = new Date(bugun);
  sinir.setDate(bugun.getDate() - days);

  const gecerli = (log || [])
    .filter(x => x?.region && x?.date && parseNumber(x.severity) >= TRACK_THRESHOLD)
    .filter(x => {
      const d = toLocalDate(x.date);
      return d && d >= sinir && d <= bugun;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  // Ağrılı günlerde yapılan hareketler. Gün bazında eşleşiyor çünkü ağrı
  // genelde seansın kendisinde değil ertesinde fark ediliyor; aynı günün
  // antrenmanı en yakın aday.
  const gunlukHareket = new Map();
  (workouts || []).forEach(w => {
    if (!w?.date) return;
    const liste = gunlukHareket.get(w.date) || [];
    (w.exercises || []).forEach(ex => { if (ex?.name) liste.push(ex.name); });
    gunlukHareket.set(w.date, liste);
  });

  const bolgeler = PAIN_REGIONS.map(bolge => {
    const kayitlar = gecerli.filter(x => x.region === bolge.key);
    if (kayitlar.length === 0) return null;

    const puanlar = kayitlar.map(x => parseNumber(x.severity));
    const ortalama = Math.round((puanlar.reduce((t, n) => t + n, 0) / puanlar.length) * 10) / 10;
    const enYuksek = Math.max(...puanlar);
    const sonuncu = kayitlar[0];

    // Trend: kayıtlar tarihe göre yeni->eski sıralı, ilk yarı "son dönem".
    let trend = 'unknown';
    if (kayitlar.length >= 2) {
      const yari = Math.ceil(kayitlar.length / 2);
      const yeni = puanlar.slice(0, yari);
      const eski = puanlar.slice(yari);
      if (eski.length > 0) {
        const ortYeni = yeni.reduce((t, n) => t + n, 0) / yeni.length;
        const ortEski = eski.reduce((t, n) => t + n, 0) / eski.length;
        const fark = ortYeni - ortEski;
        trend = fark <= -0.75 ? 'improving' : fark >= 0.75 ? 'worsening' : 'flat';
      }
    }

    // Sürüyor mu: son üç haftada en az üç kayıt.
    const pencere = new Date(bugun);
    pencere.setDate(bugun.getDate() - PERSISTENT_WINDOW_DAYS);
    const yakin = kayitlar.filter(x => {
      const d = toLocalDate(x.date);
      return d && d >= pencere;
    });
    const persistent = yakin.length >= PERSISTENT_MIN_ENTRIES;

    // Ağrılı günlerde en sık geçen hareketler.
    const sayac = new Map();
    kayitlar.forEach(k => {
      // Kullanıcı hareketi elle işaretlediyse o ağır basıyor.
      if (k.exercise) sayac.set(k.exercise, (sayac.get(k.exercise) || 0) + 2);
      (gunlukHareket.get(k.date) || []).forEach(ad => sayac.set(ad, (sayac.get(ad) || 0) + 1));
    });
    const suspects = [...sayac.entries()]
      .map(([name, hits]) => ({ name, hits }))
      // Tek kez denk gelen hareket rastlantı; en az iki ağrılı günde görünmeli.
      .filter(x => x.hits >= 2)
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 4);

    return {
      region: bolge.key,
      label: bolge.label,
      entries: kayitlar,
      count: kayitlar.length,
      average: ortalama,
      peak: enYuksek,
      latest: sonuncu,
      latestLabel: formatDay(sonuncu.date, 'short', { weekday: true }),
      trend,
      persistent,
      high: enYuksek >= HIGH_THRESHOLD,
      suspects,
    };
  }).filter(Boolean);

  bolgeler.sort((a, b) => (b.persistent - a.persistent) || b.average - a.average);

  return {
    regions: bolgeler,
    hasData: bolgeler.length > 0,
    activeCount: bolgeler.filter(r => r.persistent || r.high).length,
    windowDays: days,
  };
};

/** Ağrı takibinin günlük koç satırı. */
export const painCoachItem = (report) => {
  if (!report?.hasData) return null;
  const oncelikli = report.regions.find(r => r.persistent || r.high);
  if (!oncelikli) return null;

  const sebep = oncelikli.persistent
    ? `son üç haftada ${oncelikli.entries.length} kez kaydedildi`
    : `en yüksek ${oncelikli.peak}/10`;
  const suphe = oncelikli.suspects.length > 0
    ? ` Ağrılı günlerde en sık yapılan hareket ${oncelikli.suspects[0].name}; bir blok boyunca ağrısız bir varyantla değiştirmeyi deneyebilirsin.`
    : '';

  return {
    region: oncelikli.region,
    title: `${oncelikli.label} ağrısı sürüyor`,
    detail: `${oncelikli.label} bölgesinde ortalama ${oncelikli.average}/10 (${sebep}). Eklem ağrısı kas ağrısıyla aynı sinyal değildir: kas ağrısı geçer, eklem ağrısı yüklenmeye devam edilirse büyür.${suphe}`,
  };
};
