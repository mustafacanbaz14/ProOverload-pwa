import { parseNumber } from './number.js';
import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';

/**
 * Kas bazında kişisel haftalık hacim hedefi.
 *
 * MEV/MAV/MRV değerleri LİTERATÜR ORTALAMASI ve deneyim seviyesine göre
 * ölçekleniyor. Doğru bir başlangıç noktası ama kişisel değil: aynı seviyedeki
 * iki kişinin aynı kastaki toparlanma kapasitesi belirgin farklı olabiliyor ve
 * bunu kişi birkaç blok sonra kendi verisinden öğreniyor. "Benim omzum 22 sette
 * iyi topluyor" bilgisi uygulamada tutulacak bir yer bulamıyordu.
 *
 * Bu modül varsayılanların ÜSTÜNE yazıyor, yerine geçmiyor: yazılmayan her kas
 * literatür değerini kullanmaya devam ediyor. Böylece tek bir kası ayarlamak
 * için on altı kası elle girmek gerekmiyor.
 *
 * Değerler sıralı olmak zorunda (MEV ≤ MAV ≤ MRV); sıralamayı bozan giriş
 * sessizce düzeltiliyor, çünkü MRV'si MEV'inden küçük bir kas hacim
 * çözümleyicisinde anlamsız sonuçlar üretirdi.
 */

// Makul sınırlar: sıfır set bir hedef değil, 60 set haftalık tek kas hacmi
// hiçbir kişide toparlanmıyor. Yazım hatasına karşı koruma.
export const VOLUME_TARGET_LIMITS = { min: 1, max: 60 };

const kirp = (n) => Math.max(
  VOLUME_TARGET_LIMITS.min,
  Math.min(VOLUME_TARGET_LIMITS.max, Math.round(parseNumber(n))),
);

/** Üç değeri sıraya sokar; bozuk giriş düzeltiliyor. */
export const normalizeVolumeTarget = (mev, mav, mrv) => {
  const a = kirp(mev);
  const b = Math.max(a, kirp(mav));
  const c = Math.max(b, kirp(mrv));
  return { mev: a, mav: b, mrv: c };
};

/**
 * Bir kasın geçerli hedefleri: kişisel varsa o, yoksa literatür.
 *
 * @returns { mev, mav, mrv, source } — source: 'custom' | 'default'
 */
export const targetsFor = (muscle, { overrides = {}, experienceLevel = 'intermediate' } = {}) => {
  const kisisel = (overrides || {})[muscle];
  if (kisisel && parseNumber(kisisel.mrv) > 0) {
    return { ...normalizeVolumeTarget(kisisel.mev, kisisel.mav, kisisel.mrv), source: 'custom' };
  }
  return { ...getVolumeLandmarks(muscle, experienceLevel), source: 'default' };
};

export const setVolumeTarget = (overrides = {}, muscle, values) => {
  const sonraki = { ...(overrides || {}) };
  if (!muscle || !MUSCLE_GROUPS.includes(muscle)) return sonraki;
  // Boş değer kaydı siliyor: "varsayılana dön" ayrı bir düğme istemesin.
  if (!values || parseNumber(values.mrv) <= 0) {
    delete sonraki[muscle];
    return sonraki;
  }
  sonraki[muscle] = normalizeVolumeTarget(values.mev, values.mav, values.mrv);
  return sonraki;
};

/**
 * Kişisel hedef önerisi: kullanıcının kendi geçmişinden.
 *
 * Ölçüt, kasın İYİ TOPARLADIĞI en yüksek hacim. "İyi toparlama" tanımı
 * dolaylı: o haftadan sonraki seansta o kasın hareketlerinde performans
 * düşmemişse hafta sindirilmiş demektir.
 *
 * Öneri bir DAYATMA DEĞİL: literatür değerinden çok uzaksa bile gösteriliyor
 * ama uygulanması kullanıcının kararı. Az veriyle öneri üretilmiyor.
 */
export const suggestVolumeTarget = (muscle, weeklyVolumes = [], { experienceLevel = 'intermediate' } = {}) => {
  const gecerli = (weeklyVolumes || [])
    .filter(w => parseNumber(w?.volume) > 0)
    .map(w => ({ volume: parseNumber(w.volume), recovered: w.recovered !== false }));

  // Dört haftadan az veriyle kişisel tavan çıkarmak, gürültüyü kural sanmak.
  if (gecerli.length < 4) return null;

  const varsayilan = getVolumeLandmarks(muscle, experienceLevel);
  const toparlanan = gecerli.filter(w => w.recovered).map(w => w.volume);
  if (toparlanan.length === 0) return null;

  const enYuksekIyi = Math.max(...toparlanan);
  const ortalama = toparlanan.reduce((t, n) => t + n, 0) / toparlanan.length;

  // Tavan: iyi toparlanan en yüksek hafta. Verimli bandın üst ucu onun biraz
  // altına, koruma eşiği ortalamanın yarısına yerleşiyor.
  const mrv = kirp(enYuksekIyi);
  const mav = kirp(Math.min(mrv, enYuksekIyi * 0.85));
  const mev = kirp(Math.min(mav, ortalama * 0.5));

  return {
    ...normalizeVolumeTarget(mev, mav, mrv),
    weeks: gecerli.length,
    recoveredWeeks: toparlanan.length,
    defaults: varsayilan,
    // Literatürden belirgin sapma varsa kullanıcı bunu bilerek seçsin.
    deviates: Math.abs(mrv - varsayilan.mrv) >= 4,
  };
};

/** Kişisel hedefi olan kaslar, tabloda ayırt edilsin diye. */
export const customTargetMuscles = (overrides = {}) =>
  MUSCLE_GROUPS.filter(m => (overrides || {})[m]);

/**
 * Kas bazında haftalık hacim geçmişi — hedef önerisinin girdisi.
 *
 * "İyi toparladı mı" sorusu doğrudan ölçülemiyor; dolaylı bir ölçüt
 * kullanılıyor: o haftadan SONRAKİ haftada aynı kasın en iyi tahmini gücü
 * düşmemişse hafta sindirilmiş sayılıyor. Kusursuz değil (uyku, kalori, stres
 * de etkiler) ama uygulamanın elindeki en iyi sinyal ve öneri zaten bir
 * dayatma değil, bir başlangıç noktası.
 *
 * Son hafta değerlendirilmiyor: ardından gelen bir hafta olmadığı için
 * toparlanıp toparlanmadığı henüz bilinemez.
 */
export const buildWeeklyVolumeHistory = (workouts = [], {
  customExercises = [], detectMuscle = null, estimate = null, weeks = 16,
} = {}) => {
  if (!detectMuscle || !estimate) return {};

  const haftalar = new Map();
  (workouts || []).forEach(w => {
    if (!w?.date) return;
    const key = haftaBasi(w.date);
    if (!key) return;
    if (!haftalar.has(key)) haftalar.set(key, { weekStart: key, byMuscle: {}, strengthByMuscle: {} });
    const hafta = haftalar.get(key);

    (w.exercises || []).forEach(ex => {
      const calisma = (ex.sets || []).filter(s => parseNumber(s?.reps) > 0 && s?.setType !== 'warmup');
      if (calisma.length === 0) return;
      const { contributions, muscle } = detectMuscle(ex.name, customExercises);
      Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
        hafta.byMuscle[kas] = (hafta.byMuscle[kas] || 0) + calisma.length * agirlik;
      });
      // Kasın o haftaki gücü: birincil kası bu hareket olan setlerin en iyisi.
      let enIyi = 0;
      calisma.forEach(s => { enIyi = Math.max(enIyi, estimate(s.weight, s.reps, s.rir)); });
      if (enIyi > 0 && muscle) {
        hafta.strengthByMuscle[muscle] = Math.max(hafta.strengthByMuscle[muscle] || 0, enIyi);
      }
    });
  });

  const sirali = [...haftalar.values()]
    .sort((a, b) => String(a.weekStart).localeCompare(String(b.weekStart)))
    .slice(-weeks);

  const out = {};
  sirali.forEach((hafta, i) => {
    const sonraki = sirali[i + 1];
    Object.entries(hafta.byMuscle).forEach(([muscle, volume]) => {
      if (!(volume > 0)) return;
      if (!out[muscle]) out[muscle] = [];
      const buGuc = parseNumber(hafta.strengthByMuscle[muscle]);
      const sonrakiGuc = parseNumber(sonraki?.strengthByMuscle?.[muscle]);
      const evaluated = Boolean(sonraki && buGuc > 0 && sonrakiGuc > 0);
      out[muscle].push({
        weekStart: hafta.weekStart,
        volume: Math.round(volume * 4) / 4,
        // Sonraki hafta ya da güç verisi yoksa "toparlandı" DENMİYOR: iyimser
        // varsaymak, kullanıcıya toparlayamadığı bir hacmi hedef olarak
        // önermek olurdu.
        recovered: Boolean(evaluated && sonrakiGuc >= buGuc * 0.98),
        // Son haftanın ardından ölçüm yoksa false "toparlanamadı" anlamına
        // gelmez. Yeni kişisel hacim modeli bu alanla bilinmeyeni başarısızdan
        // ayırır; eski `recovered` alanı geriye uyumluluk için korunur.
        evaluated,
      });
    });
  });

  return out;
};

/** Tarihin ait olduğu haftanın pazartesisi (YYYY-AA-GG). */
const haftaBasi = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const kaydir = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - kaydir);
  const ay = String(d.getMonth() + 1).padStart(2, '0');
  const gun = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${ay}-${gun}`;
};
