import { parseNumber } from './number.js';
import { isWorkingSet, detectMuscleGroup } from './helpers.js';

/**
 * Kapalı döngü dinlenme uyarlaması.
 *
 * `rest.js` dinlenme süresi ÖNERİYOR: harekete, efora ve kas büyüklüğüne
 * bakıp bir sayı veriyor. Doğru bir başlangıç ama açık döngü — önerinin işe
 * yarayıp yaramadığı hiç ölçülmüyordu.
 *
 * 7.2'den beri her set kendinden önceki gerçek beklemeyi taşıyor
 * (`restBefore`). Bu, döngüyü kapatmayı mümkün kılıyor: aynı harekette aynı
 * ağırlıkta, farklı dinlenme sürelerinden sonra kaç tekrar yapıldığına
 * bakıp KİŞİYE ÖZEL bir süre çıkarılabiliyor.
 *
 * Ölçüt tekrar KAYBI: bir setten diğerine düşen tekrar sayısı. Yeterli
 * dinlenmede kayıp küçük, yetersizde büyük. Kaybın kabul edilebilir seviyeye
 * indiği en KISA süre aranıyor — daha uzun dinlenmek kayıp azaltmıyorsa
 * yalnızca seansı uzatıyor.
 */

// Kabul edilebilir tekrar kaybı. Bunun altındaki düşüş normal yorgunluk.
const ACCEPTABLE_DROP = 1.5;
// Bir süre kovasının değerlendirilebilmesi için gereken en az örnek.
const MIN_SAMPLES = 3;
// Süre kovaları (saniye). Dar kovalar örneklem başına birkaç set bırakıyor.
const BUCKETS = [
  { key: 'short', min: 30, max: 75, label: '30-75 sn' },
  { key: 'medium', min: 75, max: 135, label: '75-135 sn' },
  { key: 'long', min: 135, max: 210, label: '135-210 sn' },
  { key: 'extended', min: 210, max: 420, label: '210+ sn' },
];

const bucketFor = (sn) => BUCKETS.find(b => sn >= b.min && sn < b.max) || null;

/**
 * Bir hareket için ölçülmüş dinlenme–performans ilişkisi.
 *
 * Yalnızca AYNI AĞIRLIKTAKİ ardışık setler karşılaştırılıyor: yük değişince
 * tekrar farkı dinlenmeden değil ağırlıktan gelir.
 */
export const restResponseFor = (exerciseName, workouts = [], { minSamples = MIN_SAMPLES } = {}) => {
  const ornekler = [];

  (workouts || []).forEach(w => {
    (w.exercises || []).forEach(ex => {
      if (exerciseName && ex?.name !== exerciseName) return;
      const setler = ex.sets || [];
      setler.forEach((s, i) => {
        if (i === 0 || !isWorkingSet(s)) return;
        const onceki = setler[i - 1];
        if (!isWorkingSet(onceki)) return;
        const bekleme = parseNumber(s.restBefore);
        const yuk = parseNumber(s.weight);
        if (bekleme <= 0 || yuk <= 0 || yuk !== parseNumber(onceki.weight)) return;
        const tekrar = parseNumber(s.reps);
        const oncekiTekrar = parseNumber(onceki.reps);
        if (tekrar <= 0 || oncekiTekrar <= 0) return;
        const kova = bucketFor(bekleme);
        if (!kova) return;
        ornekler.push({
          exercise: ex.name,
          bucket: kova.key,
          rest: bekleme,
          drop: oncekiTekrar - tekrar,
        });
      });
    });
  });

  if (ornekler.length === 0) return { hasData: false, buckets: [], samples: 0 };

  const kovalar = BUCKETS.map(b => {
    const alt = ornekler.filter(x => x.bucket === b.key);
    if (alt.length < minSamples) return { ...b, samples: alt.length, enough: false };
    const ortDusus = alt.reduce((t, x) => t + x.drop, 0) / alt.length;
    return {
      ...b,
      samples: alt.length,
      enough: true,
      averageDrop: Math.round(ortDusus * 10) / 10,
      averageRest: Math.round(alt.reduce((t, x) => t + x.rest, 0) / alt.length),
    };
  });

  const yeterli = kovalar.filter(b => b.enough);
  // Kaybın kabul edilebilir olduğu EN KISA kova. Daha uzunu kayıp
  // azaltmıyorsa yalnızca seansı uzatıyor.
  const onerilen = yeterli.find(b => b.averageDrop <= ACCEPTABLE_DROP)
    // Hiçbiri eşiği tutmuyorsa en az kayıp vereni.
    || yeterli.slice().sort((a, b) => a.averageDrop - b.averageDrop)[0]
    || null;

  return {
    hasData: yeterli.length >= 2,
    exercise: exerciseName || null,
    buckets: kovalar,
    samples: ornekler.length,
    recommended: onerilen,
    // İki kova arasında anlamlı fark var mı: yoksa dinlenmeyi uzatmanın
    // ölçülebilir bir faydası yok demektir.
    meaningful: yeterli.length >= 2
      && Math.max(...yeterli.map(b => b.averageDrop)) - Math.min(...yeterli.map(b => b.averageDrop)) >= 1,
    threshold: ACCEPTABLE_DROP,
  };
};

/**
 * Kas grubu bazında kişisel dinlenme önerisi.
 *
 * Hareket bazında örneklem çoğu kullanıcıda yetersiz kalıyor; kas grubunda
 * setler birikiyor ve öneri daha erken güvenilir hale geliyor.
 */
export const restProfileByMuscle = (workouts = [], { customExercises = [] } = {}) => {
  const kasHarita = new Map();

  (workouts || []).forEach(w => {
    (w.exercises || []).forEach(ex => {
      if (!ex?.name) return;
      const { muscle } = detectMuscleGroup(ex.name, customExercises);
      if (!muscle) return;
      if (!kasHarita.has(muscle)) kasHarita.set(muscle, []);
      kasHarita.get(muscle).push({ ...w, exercises: [ex] });
    });
  });

  const rows = [...kasHarita.entries()]
    .map(([muscle, kayitlar]) => ({ muscle, ...restResponseFor(null, kayitlar) }))
    .filter(r => r.hasData && r.meaningful && r.recommended)
    .map(r => ({
      muscle: r.muscle,
      recommended: r.recommended.averageRest,
      label: r.recommended.label,
      drop: r.recommended.averageDrop,
      samples: r.samples,
    }))
    .sort((a, b) => b.samples - a.samples);

  return { rows, hasData: rows.length > 0 };
};

/** Koç kartı: ölçüm öneriden belirgin farklıysa. */
export const adaptiveRestCoachItem = (profile, currentDefault = 120) => {
  if (!profile?.hasData) return null;
  const aday = profile.rows.find(r => Math.abs(r.recommended - currentDefault) >= 45);
  if (!aday) return null;
  const yon = aday.recommended > currentDefault ? 'uzatmak' : 'kısaltmak';
  return {
    key: 'adaptive-rest',
    tone: 'info',
    title: `${aday.muscle} için ölçülen dinlenme ${aday.recommended} sn`,
    detail: `Kendi kayıtlarında ${aday.samples} set karşılaştırıldı: bu süreden sonra tekrar kaybı ortalama ${aday.drop}. Ayarlı varsayılan ${currentDefault} sn, yani bu kas için süreyi ${yon} ölçüme daha uygun. Yalnızca aynı ağırlıktaki ardışık setler karşılaştırıldı — yük değişince tekrar farkı dinlenmeden değil ağırlıktan gelir.`,
  };
};
