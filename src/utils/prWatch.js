import { parseNumber } from './number.js';
import { estimate1RM, isWorkingSet } from './helpers.js';
import { toLocalDate, dayKey, formatDay } from './dates.js';

/**
 * Rekor eşiği.
 *
 * Uygulama rekoru ancak KIRILDIKTAN sonra kutluyordu (seans raporu, konfeti).
 * Oysa rekorun asıl işe yaradığı an öncesi: "bugün bench'te 122.5 kg × 5
 * yaparsan rekor" cümlesi, sete girerken verilen kararı değiştiriyor.
 *
 * Eşik tahmini 1RM üzerinden kuruluyor, ham ağırlık üzerinden değil: 100×8 ile
 * 110×5 arasında hangisinin daha iyi olduğunu ham ağırlık söyleyemiyor.
 * Kullanıcıya ise SOMUT bir hedef veriliyor — "şu ağırlıkta şu tekrar" — çünkü
 * "1RM'ini 2 kg artır" salonda uygulanabilir bir cümle değil.
 */

// Bu kadar günden eski rekorlar "yakın" saymaya uygun değil: aradan geçen
// sürede form değişmiş olabilir ve eski bir rekoru bugünkü hedef diye sunmak
// yanıltıcı olur.
const RECORD_WINDOW_DAYS = 240;
// Rekora bu orandan daha uzaksa gösterilmiyor. %92 bilinçli olarak yüksek:
// ulaşılabilir olmayan bir hedef motive etmiyor, gürültü yapıyor.
const NEAR_RATIO = 0.92;
// Barda uygulanabilir en küçük artış. Plaka envanteri ayarı hareket bazında
// bilinmediği için tek bir güvenli adım kullanılıyor.
const STEP_KG = 2.5;

/** Bir hareketin son penceredeki en iyi tahmini 1RM'i ve o seti. */
const enIyiSet = (workouts, name, since, resolveLoad = null) => {
  let best = null;
  (workouts || []).forEach(w => {
    if (since && w?.date) {
      const d = toLocalDate(w.date);
      if (d && d < since) return;
    }
    (w?.exercises || []).forEach(ex => {
      if (ex?.name !== name) return;
      (ex.sets || []).forEach(set => {
        if (!isWorkingSet(set)) return;
        const tekrar = parseNumber(set.reps);
        // Vücut ağırlıklı hareketlerde yazılan değer ek yük; gerçek yükü
        // resolveLoad veriyor. Ham değerle rekor kıyaslamak barfikste hep
        // "0 kg" görürdü.
        const yuk = resolveLoad ? parseNumber(resolveLoad(name, set.weight, w)) : parseNumber(set.weight);
        if (!(tekrar > 0) || !(yuk > 0) || tekrar > 12) return;
        const e1rm = estimate1RM(yuk, tekrar, set.rir);
        if (!(e1rm > 0)) return;
        if (best === null || e1rm > best.e1rm) {
          best = { e1rm: Math.round(e1rm * 10) / 10, weight: yuk, reps: tekrar, date: w.date };
        }
      });
    });
  });
  return best;
};

/**
 * Verilen ağırlıkta rekoru geçmek için gereken tekrar sayısı.
 *
 * Epley'in tersi: e1rm = w * (1 + r/30) → r = 30 * (hedef/w - 1).
 *
 * Yukarı yuvarlanıyor ama tam sayı çıkan durumlar bir üste itilmiyor: hedefi
 * "geçmek" için gereken payı çağıran taraf hedefe ekliyor (rekor + 0.1).
 * Burada ayrıca pay eklemek 6 tekrarlık bir hedefi 7 gösteriyordu. Küçük
 * negatif tolerans yalnızca kayan nokta hatasına karşı.
 */
export const repsNeededFor = (targetE1rm, weight) => {
  const w = parseNumber(weight);
  const hedef = parseNumber(targetE1rm);
  if (!(w > 0) || !(hedef > 0)) return null;
  if (w >= hedef) return 1;
  const r = Math.ceil(30 * (hedef / w - 1) - 1e-9);
  return r > 0 ? r : 1;
};

/**
 * Bugünkü seansta rekora yakın hareketler.
 *
 * @param exerciseNames bugün planlanan/yapılan hareket adları
 * @returns { targets, hasData }
 */
export const buildPrWatch = (exerciseNames = [], workouts = [], {
  today = new Date(),
  resolveLoad = null,
  limit = 3,
} = {}) => {
  const bugun = toLocalDate(dayKey(today));
  const since = bugun ? new Date(bugun) : null;
  if (since) since.setDate(bugun.getDate() - RECORD_WINDOW_DAYS);

  const benzersiz = [...new Set((exerciseNames || []).filter(Boolean))];

  const targets = benzersiz.map(name => {
    const rekor = enIyiSet(workouts, name, since, resolveLoad);
    if (!rekor) return null;

    // Son seansta o harekette ulaşılan en iyi tahmin: "yakınlık" bunun rekora
    // oranı. Rekorun kendisiyle kıyaslamak her hareketi %100 gösterirdi.
    const sonSeans = (workouts || [])
      .filter(w => (w.exercises || []).some(e => e.name === name))
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const sonEnIyi = sonSeans ? enIyiSet([sonSeans], name, null, resolveLoad) : null;
    if (!sonEnIyi) return null;

    const yakinlik = sonEnIyi.e1rm / rekor.e1rm;
    if (yakinlik < NEAR_RATIO) return null;

    // Somut hedef: en son çalışılan ağırlıkta kaç tekrar gerekiyor, ve bir
    // kademe üstünde kaç tekrar gerekiyor.
    const ayniYukTekrar = repsNeededFor(rekor.e1rm + 0.1, sonEnIyi.weight);
    const ustYuk = Math.round((sonEnIyi.weight + STEP_KG) * 2) / 2;
    const ustYukTekrar = repsNeededFor(rekor.e1rm + 0.1, ustYuk);

    return {
      name,
      record: rekor,
      recordLabel: `${rekor.weight} kg × ${rekor.reps} · ${formatDay(rekor.date, 'short')}`,
      last: sonEnIyi,
      closeness: Math.round(yakinlik * 100),
      // İki uygulanabilir yol: aynı ağırlıkta bir tekrar fazla, ya da bir
      // kademe ağır. Hangisi kolaysa kullanıcı seçiyor.
      options: [
        { weight: sonEnIyi.weight, reps: ayniYukTekrar },
        { weight: ustYuk, reps: ustYukTekrar },
      ].filter(o => o.reps && o.reps <= 15),
    };
  }).filter(t => t && t.options.length > 0);

  targets.sort((a, b) => b.closeness - a.closeness);

  return {
    targets: targets.slice(0, limit),
    hasData: targets.length > 0,
  };
};

/** Rekor eşiğinin günlük koç satırı. */
export const prWatchCoachItem = (report) => {
  if (!report?.hasData) return null;
  const ilk = report.targets[0];
  const yol = ilk.options[0];
  return {
    exercise: ilk.name,
    title: `${ilk.name}: rekora %${ilk.closeness}`,
    detail: `Kayıtlı en iyi ${ilk.recordLabel}. Bugün ${yol.weight} kg ile ${yol.reps} tekrar yaparsan geçersin${ilk.options[1] ? `; ${ilk.options[1].weight} kg ile ${ilk.options[1].reps} tekrar da yeter` : ''}. Rekor denemesi ısınma tamamlandıktan sonraki ilk çalışma setinde yapılır — yorulduktan sonra değil.`,
  };
};
