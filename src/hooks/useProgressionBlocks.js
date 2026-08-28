import { useCallback, useMemo } from 'react';
import {
  activeProgressionBlocks,
  appendPredictionSnapshot,
  buildProgressionBlockReport,
  normalizeProgressionPlan,
  progressionPlanDefaults,
} from '../utils/progressionBlock.js';
import { generateId, getLocalDateString } from '../utils/helpers.js';

/**
 * Hareket bloklarının profil özeti, düzenleme akışı ve tahmin geçmişi tek yerde.
 * App yalnız reçeteyi tüketir; planın nasıl normalleştiğini yeniden uygulamaz.
 */
export const useProgressionBlocks = ({
  profileExercise,
  profileRepRange,
  exerciseProfile,
  defaultIncrement = 2.5,
  progressionPlans = {},
  workouts = [],
  resolveLoad,
  setSettings,
  showToast,
  today = getLocalDateString(),
}) => {
  const profilePlan = profileExercise ? progressionPlans?.[profileExercise] || null : null;

  const profileReport = useMemo(() => (
    profileExercise && profilePlan
      ? buildProgressionBlockReport(profileExercise, profilePlan, workouts, { today, resolveLoad })
      : null
  ), [profileExercise, profilePlan, workouts, today, resolveLoad]);

  const profileDefaults = useMemo(() => (
    profileExercise && profileRepRange
      ? progressionPlanDefaults(profileExercise, exerciseProfile, profileRepRange, defaultIncrement)
      : null
  ), [profileExercise, profileRepRange, exerciseProfile, defaultIncrement]);

  const blocks = useMemo(() => activeProgressionBlocks(
    progressionPlans, workouts, { today, resolveLoad },
  ), [progressionPlans, workouts, today, resolveLoad]);

  const prescriptionFor = useCallback((exerciseName, runtime = {}) => {
    const plan = progressionPlans?.[exerciseName];
    if (!plan?.active) return null;
    return buildProgressionBlockReport(exerciseName, plan, workouts, {
      today,
      resolveLoad,
      ...runtime,
    })?.nextPrescription || null;
  }, [progressionPlans, workouts, today, resolveLoad]);

  const saveBlock = useCallback((exerciseName, draft) => {
    const now = new Date().toISOString();
    const current = progressionPlans?.[exerciseName] || null;
    const restart = Boolean(draft?.restart);
    const planId = restart ? generateId() : current?.id || generateId();
    const normalized = normalizeProgressionPlan(exerciseName, {
      ...draft,
      id: planId,
      active: true,
      startDate: restart ? today : current?.startDate || today,
      createdAt: restart ? now : current?.createdAt || now,
      predictionHistory: restart ? [] : current?.predictionHistory,
    }, { today, id: planId, updatedAt: now });
    if (!normalized) return;
    setSettings(previous => ({
      ...previous,
      progressionPlans: { ...(previous.progressionPlans || {}), [exerciseName]: normalized },
    }));
    showToast?.(`${exerciseName}: ${restart ? 'yeni döngü başlatıldı' : `${normalized.weeks} haftalık ilerleme bloğu kaydedildi`}.`);
  }, [progressionPlans, setSettings, showToast, today]);

  const removeBlock = useCallback((exerciseName) => {
    setSettings(previous => {
      const plans = { ...(previous.progressionPlans || {}) };
      delete plans[exerciseName];
      return { ...previous, progressionPlans: plans };
    });
    showToast?.(`${exerciseName} ilerleme bloğu kaldırıldı.`);
  }, [setSettings, showToast]);

  /** Kaydedilen seansın dokunduğu bloklarda o günkü tahmin aralığını dondurur. */
  const captureAfterWorkout = useCallback((savedWorkout, nextWorkouts) => {
    const touched = (savedWorkout?.exercises || [])
      .filter(exercise => exercise?.progressionPrescription?.planId)
      .map(exercise => ({ name: exercise.name, planId: exercise.progressionPrescription.planId }));
    if (touched.length === 0) return;

    setSettings(previous => {
      const plans = { ...(previous.progressionPlans || {}) };
      let changed = false;
      touched.forEach(({ name, planId }) => {
        const plan = plans[name];
        if (!plan?.active || plan.id !== planId) return;
        const report = buildProgressionBlockReport(name, plan, nextWorkouts, {
          today: savedWorkout.date || today,
          resolveLoad,
        });
        const updated = appendPredictionSnapshot(plan, report?.eta, savedWorkout.date || today);
        if (updated !== plan) {
          plans[name] = updated;
          changed = true;
        }
      });
      return changed ? { ...previous, progressionPlans: plans } : previous;
    });
  }, [setSettings, resolveLoad, today]);

  return {
    profilePlan,
    profileReport,
    profileDefaults,
    blocks,
    prescriptionFor,
    saveBlock,
    removeBlock,
    captureAfterWorkout,
  };
};

