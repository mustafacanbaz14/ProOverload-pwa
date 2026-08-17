import { parseNumber } from './number.js';
import { isWorkingSet, detectMuscleGroup } from './helpers.js';
import { SMALL_MUSCLE_GROUPS } from './constants.js';

/**
 * Gerçek dinlenme süresi ve etkisi.
 *
 * Uygulama dinlenme SÜRESİ ÖNERİYORDU ve kronometre çalıştırıyordu, ama ne
 * kadar dinlenildiğini hiç kaydetmiyordu. Dolayısıyla en sık sorulan
 * sorulardan birinin cevabı yoktu: "setler arası acele ettiğim için mi tekrar
 * düşüyor, yoksa gerçekten yorgun muyum".
 *
 * Artık her set kendinden önceki bekleme süresini taşıyor (`restBefore`,
 * saniye) ve bu modül iki şeyi ölçüyor:
 *
 *  1. Gerçekte ne kadar dinleniliyor, öneriye göre nerede duruyor.
 *  2. Kısa dinlenmelerin tekrar kaybıyla ilişkisi — aynı hareketin aynı
 *     ağırlıktaki setlerinde.
 *
 * İlişki NEDENSELLİK DİYE SUNULMUYOR: kısa dinlenen setlerde tekrar düşüyorsa
 * bu bir gözlem; kullanıcı bilerek kısa dinleniyor olabilir (metabolik
 * çalışma) ve bu bir kusur değil.
 */

// Bu süreden kısa bekleme "set arası" değil, aynı setin parçası (drop set,
// rest-pause) ya da kayıt hatası sayılıyor.
const MIN_REST = 10;
// Bu süreden uzun bekleme seansın kendisi değil, araya giren bir şey
// (telefon, sohbet, ekipman bekleme). Ortalamayı bozmasın diye dışarıda.
const MAX_REST = 15 * 60;
// Tekrar kaybı karşılaştırması için gereken en az set çifti.
const MIN_PAIRS = 4;

/** Büyük bileşke hareketlerde önerilen alt sınır daha uzun. */
const onerilenAlt = (muscle) => (SMALL_MUSCLE_GROUPS.includes(muscle) ? 60 : 120);

/** Kayıtlardan geçerli dinlenme örneklerini toplar. */
const ornekler = (workouts = [], { customExercises = [] } = {}) => {
  const out = [];
  (workouts || []).forEach(w => {
    (w.exercises || []).forEach(ex => {
      const { muscle } = detectMuscleGroup(ex?.name, customExercises);
      (ex.sets || []).forEach((s, i) => {
        if (i === 0 || !isWorkingSet(s)) return;
        const bekleme = parseNumber(s.restBefore);
        if (bekleme < MIN_REST || bekleme > MAX_REST) return;
        const onceki = (ex.sets || [])[i - 1];
        out.push({
          date: w.date,
          exercise: ex.name,
          muscle,
          rest: bekleme,
          reps: parseNumber(s.reps),
          weight: parseNumber(s.weight),
          prevReps: parseNumber(onceki?.reps),
          prevWeight: parseNumber(onceki?.weight),
          suggested: onerilenAlt(muscle),
        });
      });
    });
  });
  return out;
};

/**
 * Dinlenme raporu.
 *
 * @returns { hasData, median, shortShare, byMuscle, repCost, ... }
 */
export const buildRestReport = (workouts = [], { customExercises = [], sessions = 12 } = {}) => {
  // Son N seansla sınırlı: bir yıl önceki dinlenme alışkanlığı bugünkü
  // kararı değiştirmemeli.
  const sonSeanslar = [...(workouts || [])]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, sessions);

  const veri = ornekler(sonSeanslar, { customExercises });
  if (veri.length < MIN_PAIRS) {
    return { hasData: false, samples: veri.length };
  }

  const sirali = veri.map(x => x.rest).sort((a, b) => a - b);
  const ortanca = sirali[Math.floor(sirali.length / 2)];
  const kisalar = veri.filter(x => x.rest < x.suggested);

  // Kas bazında ortalama.
  const kasHarita = new Map();
  veri.forEach(x => {
    if (!kasHarita.has(x.muscle)) kasHarita.set(x.muscle, { muscle: x.muscle, toplam: 0, adet: 0, suggested: x.suggested });
    const k = kasHarita.get(x.muscle);
    k.toplam += x.rest;
    k.adet += 1;
  });
  const byMuscle = [...kasHarita.values()]
    .map(k => ({ muscle: k.muscle, average: Math.round(k.toplam / k.adet), suggested: k.suggested, samples: k.adet }))
    .sort((a, b) => a.average - b.average);

  /**
   * Tekrar kaybı: AYNI ağırlıkta yapılan ardışık setlerde, kısa dinlenilen
   * setlerle yeterli dinlenilenlerin tekrar farkı.
   *
   * Ağırlık eşitliği şart — yük değiştiğinde tekrar farkı dinlenmeden değil
   * ağırlıktan geliyor ve karşılaştırma anlamsızlaşıyor.
   */
  const ayniYuk = veri.filter(x => x.weight > 0 && x.weight === x.prevWeight && x.prevReps > 0);
  let repCost = null;
  if (ayniYuk.length >= MIN_PAIRS) {
    const kisa = ayniYuk.filter(x => x.rest < x.suggested);
    const yeterli = ayniYuk.filter(x => x.rest >= x.suggested);
    if (kisa.length >= 2 && yeterli.length >= 2) {
      const dusus = (liste) => liste.reduce((t, x) => t + (x.prevReps - x.reps), 0) / liste.length;
      const kisaDusus = Math.round(dusus(kisa) * 10) / 10;
      const yeterliDusus = Math.round(dusus(yeterli) * 10) / 10;
      repCost = {
        shortDrop: kisaDusus,
        adequateDrop: yeterliDusus,
        difference: Math.round((kisaDusus - yeterliDusus) * 10) / 10,
        shortSamples: kisa.length,
        adequateSamples: yeterli.length,
      };
    }
  }

  return {
    hasData: true,
    samples: veri.length,
    median: ortanca,
    shortShare: Math.round((kisalar.length / veri.length) * 100),
    byMuscle: byMuscle.slice(0, 8),
    repCost,
    // En çok acele edilen hareket: kısa dinlenmenin en yoğun olduğu yer.
    hastiest: (() => {
      const harita = new Map();
      kisalar.forEach(x => harita.set(x.exercise, (harita.get(x.exercise) || 0) + 1));
      const sirali2 = [...harita.entries()].sort((a, b) => b[1] - a[1]);
      return sirali2.length > 0 ? { name: sirali2[0][0], count: sirali2[0][1] } : null;
    })(),
  };
};

/** Koç kartı için tek satır. */
export const restCoachItem = (report) => {
  if (!report?.hasData || !report.repCost) return null;
  // Yalnızca kısa dinlenme GERÇEKTEN tekrar kaybettiriyorsa konuşuyor.
  // "Kısa dinleniyorsun" tek başına bir kusur değil.
  if (report.repCost.difference < 1) return null;
  return {
    key: 'rest-quality',
    tone: 'info',
    title: `Kısa dinlenme set başına ${report.repCost.difference} tekrara mal oluyor`,
    detail: `Aynı ağırlıkta, önerilen süreden kısa dinlendiğin setlerde tekrar ortalama ${report.repCost.shortDrop} düşüyor; yeterli dinlendiğinde ${report.repCost.adequateDrop}. Setlerinin %${report.shortShare}'i kısa dinlenmeyle yapılmış${report.hastiest ? ` — en çok ${report.hastiest.name} hareketinde` : ''}. Metabolik çalışma bilerek yapılıyorsa sorun yok; değilse yarım dakika daha beklemek set başına bir tekrar kazandırıyor.`,
  };
};
