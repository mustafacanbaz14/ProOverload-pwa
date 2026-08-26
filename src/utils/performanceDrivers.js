import { parseNumber } from './number.js';
import { estimate1RM, isCompletedWorkingSet } from './helpers.js';
import { dayKey, toLocalDate } from './dates.js';
import { dailyTotals } from './nutritionStats.js';

/**
 * Performans sürücüleri.
 *
 * Uygulama uyku, hazır oluşluk, protein, dinlenme günü ve kiloyu ayrı ayrı
 * kaydediyordu; hepsinin gerekçesi "performansı etkiler" idi. Ama hangisinin
 * SENİN performansını etkilediği hiç ölçülmüyordu. Literatür ortalama bir
 * insanı anlatıyor; buradaki tek soru şu: bu kişide hangi sinyal gerçekten
 * seansın iyi ya da kötü geçmesiyle birlikte hareket ediyor.
 *
 * Zorluk, "iyi seans"ı tanımlamakta. Toplam tonaj işe yaramaz: bacak günü her
 * zaman kol gününden ağırdır ve bu bir performans farkı değil program farkı.
 * Burada her seans KENDİ HAREKETLERİNİN geçmişine göre puanlanıyor —
 * o günkü en iyi tahmini 1RM, aynı hareketin önceki seanslarının ortancasına
 * bölünüyor. 1.00 "her zamanki gibi", 1.05 "%5 daha iyi" demek. Böylece bacak
 * günü ile kol günü aynı ölçekte karşılaştırılabiliyor.
 *
 * Modül NEDENSELLİK İDDİA ETMİYOR ve bunu her çıktısında söylüyor. İyi uyunan
 * gün genellikle stresin de düşük olduğu gündür; hangisinin ölçülen farkı
 * ürettiği bu veriyle ayrılamaz. Ölçtüğü şey birlikte hareket etme.
 */

// Bir hareketin taban değeri için gereken önceki seans sayısı. Altında
// "her zamanki" diye bir şey yok, oran anlamsız.
const MIN_PRIOR_SESSIONS = 3;
// Bir sürücü hakkında konuşmak için gereken eşleşmiş seans sayısı.
const MIN_PAIRS = 8;
// Bu büyüklüğün altındaki ilişki gürültüden ayırt edilemiyor.
const MIN_R = 0.15;

const ortanca = (dizi) => {
  if (dizi.length === 0) return 0;
  const s = [...dizi].sort((a, b) => a - b);
  const o = Math.floor(s.length / 2);
  return s.length % 2 ? s[o] : (s[o - 1] + s[o]) / 2;
};

const ortalama = (dizi) => (dizi.length ? dizi.reduce((t, x) => t + x, 0) / dizi.length : 0);

const korelasyon = (ciftler) => {
  const n = ciftler.length;
  if (n < 3) return 0;
  const mx = ortalama(ciftler.map(p => p.x));
  const my = ortalama(ciftler.map(p => p.y));
  const pay = ciftler.reduce((t, p) => t + (p.x - mx) * (p.y - my), 0);
  const dx = Math.sqrt(ciftler.reduce((t, p) => t + (p.x - mx) ** 2, 0));
  const dy = Math.sqrt(ciftler.reduce((t, p) => t + (p.y - my) ** 2, 0));
  return dx && dy ? pay / (dx * dy) : 0;
};

/** Seansın kendi geçmişine göre göreli performansı. */
export const relativePerformance = (workout, gecmis, { resolveLoad = null } = {}) => {
  const oranlar = [];
  (workout?.exercises || []).forEach(ex => {
    const seri = gecmis.get(ex.name);
    if (!seri || seri.length < MIN_PRIOR_SESSIONS) return;
    const bugun = Math.max(0, ...(ex.sets || []).filter(isCompletedWorkingSet).map(s => {
      const yuk = resolveLoad ? resolveLoad(ex.name, s.weight, workout) : s.weight;
      return estimate1RM(yuk, s.reps, s.rir);
    }));
    if (bugun <= 0) return;
    const taban = ortanca(seri);
    if (taban <= 0) return;
    oranlar.push(bugun / taban);
  });
  return oranlar.length > 0
    ? { value: ortalama(oranlar), exercises: oranlar.length }
    : null;
};

/**
 * Sürücü tanımları.
 *
 * `higherIsBetter` yalnızca metni yazarken kullanılıyor; ilişkinin yönünü
 * veri söylüyor, tanım değil. Beklentiyle ters çıkan bir sonucu gizlemek,
 * ölçmenin bütün amacını ortadan kaldırırdı.
 */
export const DRIVERS = [
  { key: 'readiness', label: 'Hazır oluşluk', unit: '/100', higherIsBetter: true },
  { key: 'sleep', label: 'Uyku puanı', unit: '/100', higherIsBetter: true },
  { key: 'restDays', label: 'Önceki seanstan bu yana gün', unit: ' gün', higherIsBetter: true },
  { key: 'protein', label: 'Dünkü protein', unit: ' g', higherIsBetter: true },
  { key: 'carbs', label: 'Dünkü karbonhidrat', unit: ' g', higherIsBetter: true },
  { key: 'calories', label: 'Dünkü kalori', unit: ' kcal', higherIsBetter: true },
  { key: 'bodyWeight', label: 'Vücut ağırlığı', unit: ' kg', higherIsBetter: true },
  { key: 'jointPain', label: 'Eklem ağrısı', unit: '/10', higherIsBetter: false },
  { key: 'soreness', label: 'Kas ağrısı', unit: '/10', higherIsBetter: false },
];

const gucSeviyesi = (r) => {
  const m = Math.abs(r);
  if (m >= 0.45) return { key: 'strong', label: 'belirgin' };
  if (m >= 0.30) return { key: 'moderate', label: 'orta' };
  if (m >= MIN_R) return { key: 'weak', label: 'zayıf' };
  return { key: 'none', label: 'yok' };
};

const guvenSeviyesi = (n) => (n >= 20 ? 'high' : n >= 12 ? 'medium' : 'low');

/**
 * @param sources.workouts       antrenman kayıtları
 * @param sources.sleepScores    { '2026-08-01': 78 } — gün → uyku puanı
 * @param sources.nutrition      beslenme günleri
 * @param sources.metrics        ölçüm kayıtları (kilo için)
 * @param sources.resolveLoad    vücut ağırlığı taşıyan hareketler için yük çözücü
 */
export const buildPerformanceDrivers = ({
  workouts = [], sleepScores = {}, nutrition = [], metrics = [], resolveLoad = null,
} = {}) => {
  const sirali = [...(workouts || [])]
    .filter(w => w?.date && (w.exercises || []).length > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sirali.length < MIN_PAIRS + MIN_PRIOR_SESSIONS) {
    return { hasData: false, sessions: sirali.length, drivers: [], top: null, threshold: null };
  }

  const beslenmeGunleri = new Map((nutrition || []).map(d => [d.date, dailyTotals(d)]));
  const kiloKayitlari = [...(metrics || [])]
    .filter(m => parseNumber(m.weight) > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const kiloOlarak = (tarih) => {
    const hedef = toLocalDate(tarih);
    if (!hedef) return 0;
    let sonuc = 0;
    kiloKayitlari.forEach(m => {
      if (new Date(m.date) <= hedef) sonuc = parseNumber(m.weight);
    });
    return sonuc;
  };

  const oncekiGun = (tarih) => {
    const d = toLocalDate(tarih);
    if (!d) return '';
    const g = new Date(d);
    g.setDate(d.getDate() - 1);
    return dayKey(g);
  };

  // Hareket geçmişi seans seans büyütülüyor: bir seansın puanı yalnızca
  // KENDİNDEN ÖNCEKİ verilerle hesaplanmalı, yoksa gelecekten bilgi sızar ve
  // ilişki olduğundan güçlü görünür.
  const gecmis = new Map();
  const satirlar = [];

  sirali.forEach((w, i) => {
    const perf = relativePerformance(w, gecmis, { resolveLoad });

    (w.exercises || []).forEach(ex => {
      const en = Math.max(0, ...(ex.sets || []).filter(isCompletedWorkingSet).map(s => {
        const yuk = resolveLoad ? resolveLoad(ex.name, s.weight, w) : s.weight;
        return estimate1RM(yuk, s.reps, s.rir);
      }));
      // Taban penceresi kısa tutuluyor (son beş seans). Uzun pencerede
      // sürekli ilerleyen birinin oranı sistematik olarak 1'in üstüne çıkıyor
      // ve zamanla birlikte artan HER sinyalle (kilo, deneyim, mevsim) sahte
      // bir ilişki üretiyor. Kısa pencere tabanın trendi takip etmesini
      // sağlıyor; yine de uzun bir eğilim tamamen temizlenmiş olmuyor.
      if (en > 0) gecmis.set(ex.name, [...(gecmis.get(ex.name) || []), en].slice(-5));
    });

    if (!perf) return;

    const dun = beslenmeGunleri.get(oncekiGun(w.date)) || null;
    const onceki = i > 0 ? sirali[i - 1] : null;
    const bosluk = onceki
      ? Math.round((new Date(w.date) - new Date(onceki.date)) / 86400000)
      : null;

    satirlar.push({
      date: w.date,
      performance: perf.value,
      exercises: perf.exercises,
      readiness: parseNumber(w.readiness?.score) || null,
      sleep: parseNumber(sleepScores[w.date]) || null,
      restDays: bosluk !== null && bosluk >= 0 && bosluk <= 14 ? bosluk : null,
      protein: dun ? Math.round(dun.protein) : null,
      carbs: dun ? Math.round(dun.carbs) : null,
      calories: dun ? Math.round(dun.calories) : null,
      bodyWeight: kiloOlarak(w.date) || null,
      jointPain: parseNumber(w.readiness?.raw?.jointPain) || parseNumber(w.readiness?.jointPain) || null,
      soreness: parseNumber(w.readiness?.raw?.soreness) || parseNumber(w.readiness?.soreness) || null,
    });
  });

  const suruculer = DRIVERS.map(d => {
    const ciftler = satirlar
      .filter(r => r[d.key] !== null && Number.isFinite(r[d.key]))
      .map(r => ({ x: r[d.key], y: r.performance }));
    if (ciftler.length < MIN_PAIRS) {
      return { ...d, samples: ciftler.length, enough: false, r: 0, strength: gucSeviyesi(0) };
    }

    const r = korelasyon(ciftler);
    // Korelasyon katsayısı kimseye bir şey ifade etmiyor. Asıl anlaşılır olan
    // şu: en yüksek üçte birlik dilimde seanslar ortalama ne kadar iyi geçti.
    const sirali2 = [...ciftler].sort((a, b) => a.x - b.x);
    const dilim = Math.max(3, Math.floor(sirali2.length / 3));
    const alt = sirali2.slice(0, dilim);
    const ust = sirali2.slice(-dilim);
    const altOrt = ortalama(alt.map(p => p.y));
    const ustOrt = ortalama(ust.map(p => p.y));

    return {
      ...d,
      samples: ciftler.length,
      enough: true,
      r: Math.round(r * 100) / 100,
      strength: gucSeviyesi(r),
      confidence: guvenSeviyesi(ciftler.length),
      lowRange: [Math.round(alt[0].x * 10) / 10, Math.round(alt.at(-1).x * 10) / 10],
      highRange: [Math.round(ust[0].x * 10) / 10, Math.round(ust.at(-1).x * 10) / 10],
      lowPerformance: Math.round(altOrt * 1000) / 10,
      highPerformance: Math.round(ustOrt * 1000) / 10,
      spread: Math.round((ustOrt - altOrt) * 1000) / 10,
    };
  });

  const anlamli = suruculer
    .filter(d => d.enough && d.strength.key !== 'none')
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  return {
    hasData: satirlar.length >= MIN_PAIRS,
    sessions: satirlar.length,
    scored: satirlar,
    drivers: suruculer.filter(d => d.enough).sort((a, b) => Math.abs(b.r) - Math.abs(a.r)),
    weak: suruculer.filter(d => !d.enough),
    top: anlamli[0] || null,
    threshold: personalThreshold(satirlar, 'readiness'),
  };
};

/**
 * Kişisel eşik: performansın belirgin şekilde ayrıştığı kesme noktası.
 *
 * "Hazır oluşluk 60 altındaysa ağırlık artırma" gibi bir kural, herkes için
 * aynı yerde değil. Burada kesme noktası veriden aranıyor: iki tarafta da
 * yeterli örneklem kalacak şekilde farkı en büyüten nokta.
 */
export const personalThreshold = (rows = [], key = 'readiness') => {
  const veriler = rows.filter(r => Number.isFinite(r[key]));
  if (veriler.length < 12) return null;

  const degerler = [...new Set(veriler.map(r => r[key]))].sort((a, b) => a - b);
  let enIyi = null;
  degerler.forEach(kesme => {
    const alt = veriler.filter(r => r[key] < kesme).map(r => r.performance);
    const ust = veriler.filter(r => r[key] >= kesme).map(r => r.performance);
    if (alt.length < 4 || ust.length < 4) return;
    const fark = ortalama(ust) - ortalama(alt);
    if (!enIyi || fark > enIyi.gap) {
      enIyi = {
        key, cut: kesme, gap: fark,
        below: Math.round(ortalama(alt) * 1000) / 10,
        above: Math.round(ortalama(ust) * 1000) / 10,
        belowCount: alt.length,
        aboveCount: ust.length,
      };
    }
  });

  // Yüzde ikinin altındaki ayrışma her veri setinde bulunabilir; kural
  // yapılacak kadar büyük değil.
  if (!enIyi || enIyi.gap * 100 < 2) return null;
  return { ...enIyi, gap: Math.round(enIyi.gap * 1000) / 10 };
};

/** Koç kartı: yalnızca belirgin bir sürücü varsa. */
export const driverCoachItem = (report) => {
  const d = report?.top;
  if (!d || d.strength.key === 'none' || d.confidence === 'low') return null;
  // Hangi bandın daha iyi geçtiğini ÖLÇÜLEN fark söylüyor; katsayının işareti
  // değil. İkisi aynı şeyi anlatıyor ama cümleyi ölçülen farktan kurmak,
  // beklentiyle ters çıkan bir sonucun da doğru yazılmasını garanti ediyor.
  const yon = d.spread >= 0 ? 'yüksek' : 'düşük';
  return {
    key: 'perf-driver',
    tone: 'info',
    title: `${d.label} seans kalitenle birlikte hareket ediyor`,
    detail: `${d.samples} seansta ölçüldü: ${d.label.toLowerCase()} ${yon} olduğu günlerde performansın ortalama %${Math.abs(d.spread)} daha iyi. Bu bir neden-sonuç kanıtı değil, birlikte hareket etme; ama ${d.label.toLowerCase()} senin için izlemeye değer bir sinyal.`,
  };
};
