import { useCallback, useMemo } from 'react';
import { dayWorkoutCalories } from '../utils/cardio.js';
import {
  ACTIVITY_LEVELS,
  averageDailyExercise,
  dayEnergyBreakdown,
  estimateMacrosForTef,
  neatOptsForDay,
  thermicEffect,
} from '../utils/energyModel.js';
import {
  buildBodyContextSnapshot,
  buildEnergySnapshot,
  energyInputHash,
  readEnergySnapshot,
} from '../utils/historicalContext.js';
import {
  computeComposition,
  findMetricsForDate,
  getLocalDateString,
  mergeNutrition,
  parseNumber,
} from '../utils/helpers.js';
import { dailyTotals } from '../utils/nutritionStats.js';
import { dayMindCalories } from '../utils/wellness.js';

/** Tarihsel vücut, aktivite ve enerji bağlamının tek hesaplama kapısı. */
export const useHistoricalEnergy = ({
  metricsHistory = [],
  sortedMetrics = [],
  currentMetricsForm,
  computedComp,
  workouts = [],
  wellness = [],
  nutritionHistory = [],
  adaptiveTDEE,
  settings,
}) => {
  const latestWeight = useMemo(() => {
    const record = sortedMetrics.find(metric => parseNumber(metric.weight) > 0);
    return record ? parseNumber(record.weight) : 0;
  }, [sortedMetrics]);

  const bodyContextForDate = useCallback((dateStr) => {
    const metric = findMetricsForDate(metricsHistory, dateStr, currentMetricsForm);
    const composition = computeComposition(metric || currentMetricsForm);
    return {
      metric,
      metricDate: metric?.date || '',
      weight: parseNumber(metric?.weight) || latestWeight,
      bmr: parseNumber(composition?.bmr) || parseNumber(computedComp?.bmr),
      bodyFat: parseNumber(composition?.activeBF),
      ffm: parseNumber(composition?.ffm),
      ffmi: parseNumber(composition?.ffmi),
      height: parseNumber(metric?.height),
      age: parseNumber(metric?.age),
      gender: typeof metric?.gender === 'string' ? metric.gender : '',
    };
  }, [metricsHistory, currentMetricsForm, latestWeight, computedComp]);

  const dayCaloriesFor = useCallback((dateStr) => {
    const body = bodyContextForDate(dateStr);
    const workout = dayWorkoutCalories(workouts, dateStr, body.weight);
    const mind = dayMindCalories(wellness, dateStr, body.weight);
    return {
      ...workout,
      mind,
      total: workout.total + mind,
      weightAtTime: body.weight,
      bmrAtTime: body.bmr,
    };
  }, [workouts, bodyContextForDate, wellness]);

  const avgDailyExercise = useMemo(
    () => averageDailyExercise(dayCaloriesFor, 28),
    [dayCaloriesFor],
  );

  const maintenanceCalories = useMemo(() => {
    if (adaptiveTDEE?.tdee > 0) return Math.round(adaptiveTDEE.tdee);
    const bmr = parseNumber(computedComp?.bmr);
    if (!(bmr > 0)) return 0;
    const level = ACTIVITY_LEVELS.find(item => item.key === settings.activityLevel) || ACTIVITY_LEVELS[1];
    const neat = settings.neatMode === 'manual' && parseNumber(settings.neatManual) > 0
      ? parseNumber(settings.neatManual)
      : bmr * level.factor;
    const core = bmr + neat + avgDailyExercise;
    const estimatedMacros = estimateMacrosForTef(nutritionHistory, core);
    const macroCalories = parseNumber(estimatedMacros.protein) * 4
      + parseNumber(estimatedMacros.carbs) * 4
      + parseNumber(estimatedMacros.fats) * 9;
    const tefRate = macroCalories > 0
      ? Math.min(0.2, thermicEffect(estimatedMacros).total / macroCalories)
      : 0.1;
    return Math.round(core / (1 - tefRate));
  }, [adaptiveTDEE, computedComp, settings.activityLevel, settings.neatMode,
    settings.neatManual, avgDailyExercise, nutritionHistory]);

  const estimatedTefMacros = useMemo(
    () => estimateMacrosForTef(nutritionHistory, maintenanceCalories),
    [nutritionHistory, maintenanceCalories],
  );

  const neatOpts = useMemo(() => ({
    avgDailyExercise,
    neatMode: settings.neatMode || 'auto',
    activityLevel: settings.activityLevel || 'light',
    neatManual: settings.neatManual,
    weightKg: latestWeight,
    neatMultiplier: settings.neatMultiplier,
  }), [avgDailyExercise, settings.neatMode, settings.activityLevel,
    settings.neatManual, latestWeight, settings.neatMultiplier]);

  const calculateRecord = useCallback((record) => {
    const safeRecord = record || mergeNutrition({ date: getLocalDateString() });
    const body = bodyContextForDate(safeRecord.date);
    const exercise = dayCaloriesFor(safeRecord.date);
    const macros = dailyTotals(safeRecord);
    const currentBmr = parseNumber(computedComp?.bmr);
    const historicalMaintenanceFallback = maintenanceCalories > 0 && currentBmr > 0 && body.bmr > 0
      ? Math.round(maintenanceCalories * body.bmr / currentBmr)
      : maintenanceCalories;
    const maintenanceAtDate = parseNumber(safeRecord.maintenanceAtTheTime)
      || historicalMaintenanceFallback;
    const breakdown = dayEnergyBreakdown({
      maintenance: maintenanceAtDate,
      bmr: body.bmr,
      macros,
      estimatedMacros: estimatedTefMacros,
      lifting: exercise.lifting,
      cardio: exercise.cardio,
      activeRecovery: exercise.activeRecovery,
      recovery: exercise.mind,
      manual: safeRecord.activeCaloriesOut,
      steps: safeRecord.steps,
      ...neatOptsForDay({ ...neatOpts, weightKg: body.weight }, safeRecord),
    });
    return {
      safeRecord,
      body,
      exercise,
      macros,
      breakdown,
      maintenanceAtDate,
      inputHash: energyInputHash({ record: safeRecord, macros, exercise }),
    };
  }, [bodyContextForDate, dayCaloriesFor, computedComp, maintenanceCalories,
    estimatedTefMacros, neatOpts]);

  const captureEnergySnapshot = useCallback((record, capturedAt = new Date().toISOString()) => {
    const calculated = calculateRecord(record);
    const existing = readEnergySnapshot(calculated.safeRecord, calculated.inputHash);
    const snapshot = existing || buildEnergySnapshot(calculated.breakdown, {
      inputHash: calculated.inputHash,
      bodyContext: calculated.body,
      settingsContext: {
        ...neatOptsForDay({ ...neatOpts, weightKg: calculated.body.weight }, calculated.safeRecord),
        avgDailyExercise,
        maintenance: calculated.maintenanceAtDate,
      },
      exerciseContext: calculated.exercise,
      capturedAt,
    });
    return { ...calculated, snapshot };
  }, [calculateRecord, neatOpts, avgDailyExercise]);

  const energyForNutritionRecord = useCallback((record) => {
    const calculated = calculateRecord(record);
    const stored = readEnergySnapshot(calculated.safeRecord, calculated.inputHash);
    if (stored) {
      return {
        ...stored,
        bodyContext: stored._meta.bodyContext,
        historicalSource: 'snapshot',
      };
    }
    return {
      ...calculated.breakdown,
      bodyContext: buildBodyContextSnapshot(calculated.body),
      historicalSource: 'recalculated',
    };
  }, [calculateRecord]);

  return {
    latestWeight,
    bodyContextForDate,
    dayCaloriesFor,
    avgDailyExercise,
    maintenanceCalories,
    estimatedTefMacros,
    neatOpts,
    captureEnergySnapshot,
    energyForNutritionRecord,
  };
};
