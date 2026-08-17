import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';
import { detectMuscleGroup } from './helpers.js';
import { WEEKDAY_KEYS } from './programDraft.js';

/**
 * Üretilen program ile şu an aktif olan planın karşılaştırması.
 *
 * Sihirbaz kurulumdan önce üretilen programın raporunu gösteriyordu ama tek
 * başına. Oysa zaten bir programı olan biri için asıl soru "bu program iyi mi"
 * değil, "BUNA GEÇERSEM NE DEĞİŞİR" — hangi kas hacim kazanır, hangisi kaybeder,
 * haftada kaç gün ve kaç set fark eder. Bu cevabı vermeden kurmak, kullanıcıyı
 * bilmediği bir takasa sokuyordu.
 *
 * Karşılaştırma ÖLÇÜLEN hacim üzerinden: iki taraf da aynı katkı modelinden
 * geçiyor (detectMuscleGroup), yoksa iki farklı yöntemin farkı program farkı
 * gibi görünürdü.
 */

/** Şablon listesinden kas kas set hacmi. */
const sablonHacmi = (templates = [], customExercises = []) => {
  const byMuscle = {};
  (templates || []).forEach(t => {
    (t?.exercises || []).forEach(ex => {
      const setSayisi = (ex.sets || []).length;
      if (setSayisi === 0) return;
      const { contributions } = detectMuscleGroup(ex.name, customExercises);
      Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
        byMuscle[kas] = (byMuscle[kas] || 0) + setSayisi * agirlik;
      });
    });
  });
  return byMuscle;
};

/** Üretilen programın kas kas set hacmi. */
const uretilenHacim = (built, customExercises = []) => {
  const byMuscle = {};
  (built?.days || []).forEach(gun => {
    (gun.exercises || []).forEach(ex => {
      const { contributions } = detectMuscleGroup(ex.name, customExercises);
      Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
        byMuscle[kas] = (byMuscle[kas] || 0) + ex.sets * agirlik;
      });
    });
  });
  return byMuscle;
};

/**
 * Aktif planın haftada kaç antrenman günü içerdiği ve hangi şablonları
 * kullandığı.
 *
 * Plandaki slot bir şablona işaret ediyor; şablon silinmişse slot sayılmıyor
 * ama gün sayılıyor — kullanıcı o gün salona gidiyor, sadece programı bozuk.
 */
export const activePlanSummary = (plan, templates = []) => {
  if (!plan?.days) return null;
  const byId = new Map((templates || []).map(t => [t.id, t]));
  const kullanilan = [];
  let gunSayisi = 0;
  let bozukSlot = 0;

  WEEKDAY_KEYS.forEach(key => {
    const slotlar = (plan.days[key] || []).filter(x => x?.type === 'workout');
    if (slotlar.length === 0) return;
    gunSayisi += 1;
    slotlar.forEach(slot => {
      const t = byId.get(slot.templateId);
      if (t) kullanilan.push(t);
      else bozukSlot += 1;
    });
  });

  return { name: plan.name, daysPerWeek: gunSayisi, templates: kullanilan, brokenSlots: bozukSlot };
};

/**
 * İki programı kas kas karşılaştırır.
 *
 * @returns null — kıyaslanacak aktif plan yoksa (ilk program kuruluyor)
 */
export const compareWithActivePlan = (built, plan, templates = [], { customExercises = [], experienceLevel = 'intermediate' } = {}) => {
  const mevcut = activePlanSummary(plan, templates);
  if (!built || !mevcut || mevcut.templates.length === 0) return null;

  const yeniHacim = uretilenHacim(built, customExercises);
  const eskiHacim = sablonHacmi(mevcut.templates, customExercises);

  const rows = MUSCLE_GROUPS.map(kas => {
    const yeni = Math.round((yeniHacim[kas] || 0) * 4) / 4;
    const eski = Math.round((eskiHacim[kas] || 0) * 4) / 4;
    const { mev, mrv } = getVolumeLandmarks(kas, experienceLevel);
    return {
      muscle: kas,
      current: eski,
      next: yeni,
      delta: Math.round((yeni - eski) * 4) / 4,
      mev,
      mrv,
      // Eşiği geçme yönü: kullanıcı için asıl haber "sayı değişti" değil,
      // "koruma eşiğinin altına düştü" ya da "tavanı aştı".
      crossesBelowMev: eski >= mev && yeni > 0 && yeni < mev,
      crossesAboveMrv: eski <= mrv && yeni > mrv,
      rescuedFromBelow: eski > 0 && eski < mev && yeni >= mev,
    };
  }).filter(r => r.current > 0 || r.next > 0);

  const artan = rows.filter(r => r.delta > 0).sort((a, b) => b.delta - a.delta);
  const azalan = rows.filter(r => r.delta < 0).sort((a, b) => a.delta - b.delta);

  return {
    currentName: mevcut.name,
    currentDays: mevcut.daysPerWeek,
    nextDays: built.days.length,
    currentSets: Math.round(mevcut.templates.reduce(
      (t, x) => t + (x.exercises || []).reduce((s, e) => s + (e.sets || []).length, 0), 0)),
    nextSets: built.totalSets,
    rows: rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    increased: artan,
    decreased: azalan,
    // Uyarı sayılacak geçişler: eşiğin altına düşen ya da tavanı aşan kaslar.
    warnings: rows.filter(r => r.crossesBelowMev || r.crossesAboveMrv),
    rescued: rows.filter(r => r.rescuedFromBelow),
    brokenSlots: mevcut.brokenSlots,
  };
};
