import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { APP_VERSION, LATEST_RELEASE_NOTES, DEFAULT_EXERCISES, getVolumeLandmarks, BACKUP_KEYS } from '../src/utils/constants.js';
import { buildCoachActions } from '../src/utils/coach.js';
import {
  nextTargetByRule, setProgressionRule, progressionFor, buildNextSessionTargets, PROGRESSION_RULES,
} from '../src/utils/progression.js';
import { assessExercise, scanPlateaus, plateauCoachItem, exerciseTrend } from '../src/utils/plateau.js';
import { repRecordsFor, isRepRecord, REP_BANDS } from '../src/utils/repRecords.js';
import { buildRestReport, restCoachItem } from '../src/utils/restQuality.js';
import { buildTimeOfDayReport, timeOfDayCoachItem, slotForHour } from '../src/utils/timeOfDay.js';
import { buildTechniqueReport, techniqueCoachItem, techniqueInfo } from '../src/utils/setTechniques.js';
import {
  SESSION_LENGTHS, findSessionLength, scheduleFromWeekdays, auditSchedule,
} from '../src/utils/programBuilder.js';
import { compareWithActivePlan, activePlanSummary } from '../src/utils/programCompare.js';
import { exercisesLoadingPain } from '../src/utils/painGuard.js';
import { findMergeCandidates, previewExerciseMerge, applyExerciseMerge, exerciseFootprint } from '../src/utils/exerciseMerge.js';
import {
  draftSupersetIds, draftFlagsFromSupersetIds, moveDraftExerciseToEdge,
  moveDraftExerciseToDay, draftWeeklyVolume, draftFromStarterProgram,
} from '../src/utils/programDraft.js';
import { findStarterProgram } from '../src/utils/starterPrograms.js';
import { regionsLoadedBy, activePainRegions, painWarningFor, scanSessionForPain } from '../src/utils/painGuard.js';
import { buildSessionPace, compareSessions, findComparableSessions } from '../src/utils/sessionPace.js';
import { templateFromEntry, addCardioTemplate, removeCardioTemplate, markCardioTemplateUsed, templatesForActivity, applyCardioTemplate, describeCardioTemplate } from '../src/utils/cardioTemplates.js';
import { cardioToCsv } from '../src/utils/csvExport.js';
import { suggestSubstitutes } from '../src/utils/substitution.js';
import { analyzeDayConflicts } from '../src/utils/interference.js';
import { computeWeekPlan } from '../src/utils/weekPlan.js';
import { findActivity } from '../src/utils/cardio.js';
import { suggestRestSeconds } from '../src/utils/rest.js';
import { effectiveLoad, bodyweightFactorOf, describeSetLoad, bodyweightBasisFor } from '../src/utils/bodyweight.js';
import { auditBodyweightEntries, normalizeBodyweightEntries } from '../src/utils/bodyweightAudit.js';
import { calculatePlates, generateWarmup, normalizePlates, AVAILABLE_PLATES } from '../src/utils/plates.js';
import { buildSessionReport, buildPlanAdherence, snapshotTemplatePlan } from '../src/utils/sessionReport.js';
import { rankTemplateRecommendations } from '../src/utils/templateRecommendation.js';
import { buildExerciseProfile } from '../src/utils/exerciseProfile.js';
import { buildWeeklyReview, lastCompletedWeekStart } from '../src/utils/weeklyReview.js';
import { computeReadiness } from '../src/utils/readiness.js';
import { dayEnergyBreakdown, theoreticalWeek, estimateMacrosForTef, groupByWeek, buildEnergySeries, neatOptsForDay } from '../src/utils/energyModel.js';
import { calorieDashboard, deriveGoalSet } from '../src/utils/goals.js';
import { mergeWellnessDay, computeSleepScore } from '../src/utils/wellness.js';
import { migrateWeekPlans, removeTemplateFromPlans } from '../src/utils/planMigration.js';
import { suggestNextTarget, estimate1RM, mergeWorkout, findMetricsForDate, resetDayNeatOverride, calcTonnage, buildPersonalRecords } from '../src/utils/helpers.js';
import { dailyTotals, nutritionDayScore } from '../src/utils/nutritionStats.js';
import {
  createDayTemplate, createMealTemplate, createRecipeTemplate,
  instantiateDayTemplate, instantiateMealTemplate,
} from '../src/utils/nutritionTemplates.js';
import { buildPlateauInsights, buildNutritionPerformanceInsight } from '../src/utils/insights.js';
import { resolvePlannedCardioMinutes, isActiveRecoveryCardioDay, isActiveRecoveryEntry, cardioEntryCalories, workoutCalories, dayWorkoutCalories } from '../src/utils/cardio.js';
import { groupIntoWeeks, groupWeeksIntoMonths } from '../src/utils/dates.js';
import { deloadState } from '../src/utils/deload.js';
import { buildStrengthStandards, strengthStandardCoachItem, STRENGTH_LEVELS } from '../src/utils/strengthStandards.js';
import { buildEffortDistribution, effortCoachItem } from '../src/utils/effortDistribution.js';
import { buildRotationReport, rotationCoachItem } from '../src/utils/exerciseRotation.js';
import { buildBodyRatios, bodyRatioCoachItem } from '../src/utils/bodyRatios.js';
import { buildWarmupRoutine } from '../src/utils/warmupRoutine.js';
import { buildDeloadReturn, returnSets, deloadReturnCoachItem } from '../src/utils/deloadReturn.js';
import { buildPeriNutrition, periNutritionCoachItem } from '../src/utils/periNutrition.js';
import { estimateMaxHr, zoneForEntry, intensityClassOf, HR_ZONES, entryPace, paceTrend, supportsDistance,
  zoneRange, zoneForHeartRate, effectiveZoneMethod, cardioCalories, heartRateCalories, resolveMaxHr } from '../src/utils/cardioZones.js';
import { setActivityTarget, emptyActivityTarget, describeTarget, compareToTarget } from '../src/utils/activityTargets.js';
import { buildCardioReport, cardioSuggestionForToday, cardioCoachItem } from '../src/utils/cardioGoals.js';
import { summarizeSets, entryFromSets } from '../src/utils/cardioSets.js';
import { buildRestingHrReport, upsertRestingHr, restingHrCoachItem } from '../src/utils/restingHrLog.js';
import { buildCardioRecords } from '../src/utils/cardioRecords.js';
import { findRestAlertIntensity } from '../src/lockScreen.js';
import { applyCoachMemory, snoozeCoachItem, dismissCoachItem, restoreCoachItem, emptyCoachMemory } from '../src/utils/coachMemory.js';
import { buildWeekProjection, projectionCoachItem } from '../src/utils/weekProjection.js';
import { buildPrWatch, prWatchCoachItem, repsNeededFor } from '../src/utils/prWatch.js';
import { buildRirCalibration, rirCoachItem } from '../src/utils/rirCalibration.js';
import { auditSessionQuality, sessionQualityCoachItem } from '../src/utils/sessionQuality.js';
import { painEntry, upsertPainEntry, buildPainReport, painCoachItem } from '../src/utils/painLog.js';
import { buildStrengthBalance, strengthBalanceCoachItem } from '../src/utils/strengthBalance.js';
import { buildConsistency, buildAdherence } from '../src/utils/consistency.js';
import { auditWorkoutData, removeEmptyWorkouts } from '../src/utils/dataHealth.js';
import { repRangeFor, setRepRangeOverride } from '../src/utils/exerciseTargets.js';
import { toggleDraftSuperset } from '../src/utils/programDraft.js';
import { mesocycleState, muscleTarget, weeklyTargets, targetInstructions, mesocycleCoachItem } from '../src/utils/mesocycle.js';
import { lengthBias, auditExerciseSelection } from '../src/utils/selectionAudit.js';
import {
  buildProgram, instantiateProgram, EQUIPMENT_PROFILES,
  SPLIT_PRESETS, findSplitPreset, getSplitOptions,
} from '../src/utils/programBuilder.js';
import { detectEquipment } from '../src/utils/substitution.js';
import { buildCycleSummary, mergeCycleDay } from '../src/utils/cycle.js';
import { analyzeTemplate } from '../src/utils/templateAssistant.js';
import { sortExercisesForMuscle } from '../src/utils/exerciseSort.js';
import { removeById, restoreAtIndex, removeCardioEntry, restoreCardioEntry } from '../src/utils/undo.js';
import { inspectBackupPayload, mergeImportedRecords, backupImportSummary } from '../src/utils/backupImport.js';
import {
  addExercisesToDraftDay, draftFromGeneratedProgram, duplicateDraftDay,
  instantiateDraftProgram, suggestedWeekdays,
} from '../src/utils/programDraft.js';
import { buildEmergencyBackup } from '../src/utils/emergencyBackup.js';
import { createBackupPayload, migrateBackupPayload, DATA_SCHEMA_VERSION } from '../src/utils/dataSchema.js';
import { buildFrequencyReport, frequencyCoachItem } from '../src/utils/frequency.js';
import { workoutsToCsv, metricsToCsv } from '../src/utils/csvExport.js';
import { STARTER_PROGRAMS, instantiateStarterProgram } from '../src/utils/starterPrograms.js';
import { sessionAdvice } from '../src/utils/autoregulation.js';
import { buildSessionAdaptation, adaptationModeFor } from '../src/utils/sessionAdaptation.js';
import {
  buildCoachProtocol, isCoachProtocolActive, archiveCoachProtocol,
} from '../src/utils/coachProtocol.js';
import {
  duplicateTemplate, markTemplateUsed, organizeTemplates, toggleTemplateFavorite,
} from '../src/utils/templateLibrary.js';

const tests = [];
const test = (name, run) => tests.push({ name, run });

const coachReviewFixture = (overrides = {}) => ({
  startKey: '2026-08-03', endKey: '2026-08-09', range: '3–9 Ağustos', hasData: true,
  training: {
    sessions: 3, days: 3, plannedDays: 4, adaptedSessions: 2,
    recoverySessions: 1, effectiveSets: 24, previousEffectiveSets: 22,
  },
  recovery: { nights: 4, sleepMinutes: 410, sleepScore: 72, readiness: 45, readinessEntries: 3 },
  energy: { days: 6, balance: -1400, kg: -0.18 },
  volume: {
    over: [], optimal: [{ muscle: 'Göğüs', volume: 12 }], under: [],
    statuses: [
      { muscle: 'Göğüs', volume: 12, mev: 8, mav: 16, mrv: 22, status: 'optimal', change: 1 },
      { muscle: 'Kanat', volume: 7, mev: 10, mav: 18, mrv: 25, status: 'under', change: -1 },
    ],
  },
  ...overrides,
});

test('6.0 koç protokolü yeterli veride haftalık toparlanma kararını üretir', () => {
  const protocol = buildCoachProtocol(coachReviewFixture(), 'bulk', {
    now: new Date('2026-08-15T12:00:00'), id: 'p-1',
  });
  assert.equal(protocol.mode, 'recovery');
  assert.equal(protocol.canApply, true);
  assert.equal(protocol.validFrom, '2026-08-10');
  assert.equal(protocol.validUntil, '2026-08-16');
  assert.ok(protocol.confidence.score >= 75);
  assert.ok(protocol.reasons.some(reason => reason.includes('hazır oluşluk')));
});

test('düşük veri güveni koç protokolünü aktive ettirmez', () => {
  const review = coachReviewFixture({
    training: { sessions: 1, days: 1, plannedDays: 0, adaptedSessions: 0 },
    recovery: { nights: 0, sleepMinutes: null, readiness: null, readinessEntries: 0 },
    energy: null,
  });
  const protocol = buildCoachProtocol(review, 'maintain', { now: new Date('2026-08-15T12:00:00') });
  assert.ok(protocol.confidence.score < 35);
  assert.equal(protocol.canApply, false);
  assert.ok(protocol.confidence.missing.length >= 3);
});

test('aktif haftalık toparlanma protokolü yükü uydurmadan setleri azaltır', () => {
  const protocol = {
    id: 'p-1', active: true, mode: 'recovery', label: 'Toparlanmayı Öncele',
    validFrom: '2026-08-10', validUntil: '2026-08-16',
  };
  const template = {
    name: 'Üst', exercises: [{ name: 'Bench Press', sets: [
      { setType: 'warmup', weight: '40', reps: 8, rir: 4 },
      ...Array.from({ length: 4 }, (_, i) => ({ setType: 'normal', weight: '100', reps: 8, rir: i ? 2 : 3 })),
    ] }],
  };
  const adapted = buildSessionAdaptation(template, { score: 80, jointPain: 1, carbs: 6 }, {
    coachProtocol: protocol, date: '2026-08-15',
  });
  assert.equal(adapted.mode.key, 'consolidate');
  assert.equal(adapted.changes.originalWorkingSets, 4);
  assert.equal(adapted.changes.adaptedWorkingSets, 3);
  assert.equal(adapted.template.exercises[0].sets[0].setType, 'warmup');
  assert.equal(adapted.template.exercises[0].sets[1].weight, '100');
  assert.ok(adapted.template.exercises[0].sets.slice(1).every(set => Number(set.rir) >= 3));
  assert.equal(template.exercises[0].sets.length, 5, 'orijinal şablon değişmemeli');
});

test('kritik günlük hazır oluşluk haftalık protokolden daha korumacı davranır', () => {
  const protocol = { active: true, mode: 'recovery', validFrom: '2026-08-10', validUntil: '2026-08-16' };
  const template = { exercises: [{ name: 'Squat', sets: Array.from({ length: 4 }, () => ({ setType: 'normal', weight: '100', rir: 1 })) }] };
  const adapted = buildSessionAdaptation(template, { score: 30, jointPain: 1, carbs: 5 }, {
    coachProtocol: protocol, date: '2026-08-15',
  });
  assert.equal(adapted.mode.key, 'recovery');
  assert.equal(adapted.changes.adaptedWorkingSets, 2);
  assert.equal(adapted.template.exercises[0].sets[0].weight, '85');
});

test('koç karar hafızası aynı protokolü çoğaltmaz ve sınırı korur', () => {
  const history = Array.from({ length: 12 }, (_, i) => ({ id: `p-${i}`, mode: 'hold' }));
  const next = archiveCoachProtocol(history, { id: 'p-3', mode: 'progress' });
  assert.equal(next.length, 12);
  assert.equal(next[0].mode, 'progress');
  assert.equal(next.filter(item => item.id === 'p-3').length, 1);
  assert.equal(isCoachProtocolActive({ active: true, validFrom: '2026-08-10', validUntil: '2026-08-16' }, '2026-08-15'), true);
  assert.equal(isCoachProtocolActive({ active: true, validFrom: '2026-08-10', validUntil: '2026-08-16' }, '2026-08-17'), false);
});

test('günlük koç aktif haftalık protokolü ilgili merkeze bağlar', () => {
  const actions = buildCoachActions({
    coachProtocol: {
      active: true, mode: 'recovery', label: 'Toparlanmayı Öncele',
      validUntil: '2026-08-16', confidence: { score: 82 }, summary: 'Setler kontrollü azalır.',
    },
  }, new Date('2026-08-12T12:00:00'));
  const item = actions.find(action => action.key === 'coach-protocol');
  assert.equal(item.action, 'coach');
  assert.ok(item.detail.includes('82/100'));
});

test('akıllı şablon sıralaması tavanı dolu kas yerine hacim açığını seçer', () => {
  const sets = count => Array.from({ length: count }, () => ({ setType: 'normal' }));
  const ranked = rankTemplateRecommendations([
    { id: 'push', name: 'Göğüs', exercises: [{ name: 'Bench Press', sets: sets(4) }] },
    { id: 'pull', name: 'Kanat', exercises: [{ name: 'Lat Pulldown', sets: sets(4) }] },
  ], {
    currentVolume: { Göğüs: getVolumeLandmarks('Göğüs').mrv, Kanat: 0, Biseps: 0 },
    workouts: [],
    today: '2026-08-15',
  });
  assert.equal(ranked[0].template.id, 'pull');
  assert.ok(ranked[0].reasons.some(reason => reason.includes('Kanat')));
  assert.ok(ranked.find(item => item.template.id === 'push').risks.some(reason => reason.includes('Göğüs')));
});

test('şablon anlık görüntüsü sonradan düzenlenen şablondan etkilenmez', () => {
  const template = {
    name: 'Üst A',
    exercises: [{ name: 'Bench Press', sets: Array.from({ length: 3 }, () => ({ setType: 'normal' })) }],
  };
  const snapshot = snapshotTemplatePlan(template);
  template.exercises[0].sets.push({ setType: 'normal' });
  assert.equal(snapshot.exercises[0].sets, 3);
});

test('seans plan uyumu atlanan ve eklenen hareketleri ayırır', () => {
  const done = count => Array.from({ length: count }, () => ({ setType: 'normal', reps: 8, weight: 50 }));
  const adherence = buildPlanAdherence({
    name: 'Üst A',
    plannedTemplate: { name: 'Üst A', exercises: [{ name: 'Bench Press', sets: 3 }, { name: 'Row', sets: 3 }] },
    exercises: [{ name: 'Bench Press', sets: done(3) }, { name: 'Lateral Raise', sets: done(2) }],
  });
  assert.equal(adherence.percent, 50);
  assert.deepEqual(adherence.missedExercises, ['Row']);
  assert.deepEqual(adherence.extraExercises, ['Lateral Raise']);
  assert.equal(adherence.extraSets, 2);
});

test('kısmi şablon seansında boş set yuvaları gerçek hacme yazılmaz', () => {
  const report = buildSessionReport({
    id: 'partial', date: '2026-08-15', name: 'Kısmi', duration: 20,
    exercises: [
      { name: 'Barbell Back Squat', sets: [{ setType: 'normal', weight: 100, reps: 8, rir: 2 }, { setType: 'normal', weight: '', reps: '', rir: 2 }] },
      { name: 'Barbell Bench Press', sets: [{ setType: 'normal', weight: '', reps: '', rir: 2 }] },
    ],
  });
  assert.deepEqual(report.exercises.map(exercise => exercise.name), ['Barbell Back Squat']);
  assert.equal(report.byMuscle.Göğüs, undefined);
  assert.equal(report.byMuscle.Quadriceps, 1);
});

test('hareket profili geçmiş trendi, hedefi ve şablon kullanımını birleştirir', () => {
  const workouts = [
    { id: 'new', date: '2026-08-10', name: 'Üst', exercises: [{ name: 'Bench Press', sets: [{ setType: 'normal', weight: 85, reps: 8, rir: 2 }] }] },
    { id: 'old', date: '2026-07-20', name: 'Üst', exercises: [{ name: 'Bench Press', sets: [{ setType: 'normal', weight: 80, reps: 8, rir: 2 }] }] },
  ];
  const profile = buildExerciseProfile('Bench Press', workouts, {
    templates: [{ name: 'Push A', exercises: [{ name: 'Bench Press' }] }],
    settings: { repRangeMin: 6, repRangeMax: 10 },
  });
  assert.equal(profile.sessionCount, 2);
  assert.equal(profile.trend.direction, 'up');
  assert.ok(profile.target);
  assert.deepEqual(profile.templateNames, ['Push A']);
});

test('şablon kütüphanesi favori ve kullanım tarihine göre düzenlenir', () => {
  const list = organizeTemplates([
    { id: 'old', name: 'Eski', createdAt: '2026-01-01', exercises: [] },
    { id: 'used', name: 'Son', lastUsedAt: '2026-08-10', exercises: [{ name: 'Bench Press' }] },
    { id: 'fav', name: 'Favori', favorite: true, createdAt: '2025-01-01', exercises: [] },
  ]);
  assert.deepEqual(list.map(item => item.id), ['fav', 'used', 'old']);
  assert.deepEqual(organizeTemplates(list, { query: 'bench' }).map(item => item.id), ['used']);
  assert.deepEqual(organizeTemplates(list, { favoritesOnly: true }).map(item => item.id), ['fav']);
});

test('şablon favorisi ve kullanım sayacı diğer kayıtları değiştirmez', () => {
  const source = [{ id: 'a', favorite: false, useCount: 1 }, { id: 'b', favorite: false }];
  const favored = toggleTemplateFavorite(source, 'a');
  const used = markTemplateUsed(favored, 'a', '2026-08-15T10:00:00.000Z');
  assert.equal(used[0].favorite, true);
  assert.equal(used[0].useCount, 2);
  assert.equal(used[0].lastUsedAt, '2026-08-15T10:00:00.000Z');
  assert.deepEqual(used[1], source[1]);
});

test('şablon kopyası bağımsız kimliklerle ve sıfır kullanım bilgisiyle oluşur', () => {
  let id = 0;
  const copy = duplicateTemplate({
    id: 't1', name: 'Üst A', favorite: true, useCount: 8,
    exercises: [{ id: 'e1', name: 'Bench Press', sets: [{ id: 's1', reps: 8 }] }],
  }, () => `new-${++id}`, '2026-08-15T12:00:00.000Z');
  assert.equal(copy.name, 'Üst A (kopya)');
  assert.equal(copy.favorite, false);
  assert.equal(copy.useCount, 0);
  assert.notEqual(copy.exercises[0].id, 'e1');
  assert.notEqual(copy.exercises[0].sets[0].id, 's1');
});

test('program taslağı günleri dengeli haftaya dağıtır', () => {
  assert.deepEqual(suggestedWeekdays(3), ['mon', 'wed', 'fri']);
  assert.deepEqual(suggestedWeekdays(4), ['mon', 'tue', 'thu', 'fri']);
});

test('çoklu hareket seçimi mevcut hareketi çoğaltmaz', () => {
  let id = 0;
  const day = { exercises: [{ uid: 'old', name: 'Squat', sets: 3 }] };
  const next = addExercisesToDraftDay(day, ['Squat', 'Bench Press', 'Lat Pulldown'], () => `id-${++id}`, 4);
  assert.deepEqual(next.exercises.map(ex => [ex.name, ex.sets]), [
    ['Squat', 3], ['Bench Press', 4], ['Lat Pulldown', 4],
  ]);
});

test('program günü kopyalanınca hareket kimlikleri ve hafta günü ayrışır', () => {
  let id = 0;
  const days = [{ name: 'Push', weekday: 'mon', exercises: [{ uid: 'e1', name: 'Bench', sets: 3 }] }];
  const next = duplicateDraftDay(days, 0, () => `copy-${++id}`);
  assert.equal(next.length, 2);
  assert.equal(next[1].weekday, 'tue');
  assert.notEqual(next[1].uid, next[0].uid);
  assert.notEqual(next[1].exercises[0].uid, 'e1');
});

test('sihirbaz çıktısı kurmadan önce düzenlenebilir taslağa dönüşür', () => {
  let id = 0;
  const draft = draftFromGeneratedProgram({
    split: { name: 'Üst Alt', schedule: { mon: 0, thu: 1 } },
    days: [
      { name: 'Üst', exercises: [{ name: 'Bench', sets: 3 }] },
      { name: 'Alt', exercises: [{ name: 'Squat', sets: 4 }] },
    ],
  }, () => `draft-${++id}`);
  assert.equal(draft.name, 'Üst Alt');
  assert.deepEqual(draft.days.map(day => day.weekday), ['mon', 'thu']);
  assert.equal(draft.days[1].exercises[0].sets, 4);
});

test('elle program tek işlemde şablon ve haftalık plan üretir', () => {
  let id = 0;
  const result = instantiateDraftProgram('Benim Programım', [
    { name: 'Push', weekday: 'mon', exercises: [{ name: 'Bench', sets: 3 }] },
    { name: 'Pull', weekday: 'thu', exercises: [{ name: 'Row', sets: 4 }] },
  ], () => `program-${++id}`, '2026-08-12T00:00:00.000Z');
  assert.equal(result.templates.length, 2);
  assert.equal(result.plan.days.mon[0].templateId, result.templates[0].id);
  assert.equal(result.plan.days.thu[0].templateId, result.templates[1].id);
  assert.equal(result.templates[1].exercises[0].sets.length, 4);
});

test('yedek incelemesi boş ve bozuk dosyayı reddeder', () => {
  assert.equal(inspectBackupPayload({}).valid, false);
  assert.equal(inspectBackupPayload({ workouts: 'bozuk' }).valid, false);
  assert.equal(inspectBackupPayload([]).valid, false);
});

test('yedek incelemesi eski kısa anahtarları ve özeti tanır', () => {
  const inspection = inspectBackupPayload({ version: '2.5', w: [{ id: 'w1' }], m: [{ id: 'm1' }], s: { theme: 'dark' } });
  assert.equal(inspection.valid, true);
  assert.equal(inspection.total, 2);
  assert.match(backupImportSummary(inspection), /1 antrenman/);
});

test('yedek birleştirmede aynı anahtarın yedek sürümü kazanır ve yerel eşsiz kayıt korunur', () => {
  const current = [{ id: 'a', value: 'yerel' }, { id: 'b', value: 'koru' }];
  const incoming = [{ id: 'a', value: 'yedek' }, { id: 'c', value: 'yeni' }];
  assert.deepEqual(mergeImportedRecords(current, incoming), [
    { id: 'a', value: 'yedek' },
    { id: 'c', value: 'yeni' },
    { id: 'b', value: 'koru' },
  ]);
});

test('şema v4 tüm kalıcı yedek koleksiyonlarını tek çıktıda korur', () => {
  const backup = createBackupPayload({
    workouts: [{ id: 'w1' }],
    mealTemplates: [{ id: 'meal-1', name: 'Kahvaltı' }],
    dayTemplates: [{ id: 'day-1', name: 'Antrenman Günü' }],
    settings: { theme: 'dark' },
  }, { version: APP_VERSION, exportedAt: '2026-08-15T10:00:00.000Z' });
  assert.equal(backup.schemaVersion, DATA_SCHEMA_VERSION);
  assert.equal(backup.mealTemplates[0].id, 'meal-1');
  assert.equal(backup.dayTemplates[0].id, 'day-1');
  BACKUP_KEYS.forEach(key => assert.ok(Object.hasOwn(backup, key), `yedekte ${key} eksik`));
  assert.equal(inspectBackupPayload(backup).valid, true);
});

test('eski yedek şema v4 biçimine idempotent taşınır', () => {
  const old = { schemaVersion: 3, version: '5.2', workouts: [{ id: 'w1' }], settings: {} };
  const first = migrateBackupPayload(old);
  const second = migrateBackupPayload(first.payload);
  assert.equal(first.payload.schemaVersion, DATA_SCHEMA_VERSION);
  assert.deepEqual(first.payload.mealTemplates, []);
  assert.deepEqual(first.payload.dayTemplates, []);
  assert.equal(first.applied.length, 1);
  assert.equal(second.applied.length, 0);
  assert.deepEqual(second.payload, first.payload);
});

test('silinen kayıt aynı sıraya geri alınır ve ikinci kez çoğalmaz', () => {
  const source = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const snapshot = removeById(source, 'b');
  assert.deepEqual(snapshot.next.map(item => item.id), ['a', 'c']);
  const restored = restoreAtIndex(snapshot.next, snapshot);
  assert.deepEqual(restored.map(item => item.id), ['a', 'b', 'c']);
  assert.equal(restoreAtIndex(restored, snapshot).length, 3);
});

test('tek kardiyolu boş seans silinip eksiksiz geri alınır', () => {
  const source = [{ id: 'w1', date: '2026-08-10', exercises: [], cardio: [{ id: 'c1', minutes: 30 }] }];
  const removed = removeCardioEntry(source, 'w1', 'c1');
  assert.equal(removed.next.length, 0);
  assert.deepEqual(restoreCardioEntry(removed.next, removed.snapshot), source);
});

test('çoklu kardiyo seansında geri alma diğer kaydı korur', () => {
  const source = [{ id: 'w1', exercises: [], cardio: [{ id: 'c1' }, { id: 'c2' }] }];
  const removed = removeCardioEntry(source, 'w1', 'c1');
  const changed = [{ ...removed.next[0], notes: 'sonradan değişti' }];
  const restored = restoreCardioEntry(changed, removed.snapshot);
  assert.deepEqual(restored[0].cardio.map(item => item.id), ['c1', 'c2']);
  assert.equal(restored[0].notes, 'sonradan değişti');
});

test('acil yedek en yeni kayıt yoksa eski depolama sürümüne düşer', () => {
  const values = new Map([
    ['po_workouts_v16', JSON.stringify([{ id: 'legacy-workout' }])],
    ['po_metrics_v17', '{bozuk-json'],
    ['po_metrics_v15', JSON.stringify([{ id: 'safe-metric' }])],
    ['po_meal_templates_v17', JSON.stringify([{ id: 'meal-safe' }])],
    ['po_day_templates_v17', JSON.stringify([{ id: 'day-safe' }])],
  ]);
  const backup = buildEmergencyBackup({ getItem: key => values.get(key) ?? null }, '2026-08-06T12:00:00.000Z');
  assert.equal(backup.version, APP_VERSION);
  assert.equal(backup.workouts[0].id, 'legacy-workout');
  assert.equal(backup.metricsHistory[0].id, 'safe-metric');
  assert.equal(backup.mealTemplates[0].id, 'meal-safe');
  assert.equal(backup.dayTemplates[0].id, 'day-safe');
  assert.equal(backup.schemaVersion, DATA_SCHEMA_VERSION);
  assert.equal(backup.emergencyRecovery, true);
});

test('kas filtresi yüzde 100 izolasyonu bileşik ve yardımcı hareketten önce sıralar', () => {
  const map = {
    Curl: { Biseps: 1, Önkol: 0.25 },
    Chinup: { Kanat: 1, Biseps: 0.5 },
    Row: { Biseps: 0.5, 'Orta Sırt': 1 },
  };
  const result = sortExercisesForMuscle(['Row', 'Chinup', 'Curl'], 'Biseps', name => map[name]);
  assert.deepEqual(result, ['Curl', 'Chinup', 'Row']);
});

test('döngü tahmini başlangıç, bitiş ve gelecek üç dönemi üretir', () => {
  const result = buildCycleSummary([
    { date: '2026-06-01', bleeding: 'medium' },
    { date: '2026-06-29', bleeding: 'medium' },
    { date: '2026-07-27', bleeding: 'medium' },
  ], '2026-08-03', { cycleLength: 28, periodLength: 5 });
  assert.equal(result.nextPeriodStart, '2026-08-24');
  assert.equal(result.nextPeriodEnd, '2026-08-28');
  assert.equal(result.futurePeriods.length, 3);
});

test('saat girmeden 100 üzerinden hızlı uyku puanı kullanılabilir', () => {
  const result = computeSleepScore({ quickScore: 75 });
  assert.equal(result.score, 75);
  assert.equal(result.quick, true);
});

test('kardiyo kaydındaki tarihsel kilo yeni kilodan etkilenmez', () => {
  const entry = { type: 'zone2', minutes: 30, effort: 'moderate', weightAtTime: 70 };
  assert.equal(cardioEntryCalories(entry, 100), cardioEntryCalories(entry, 70));
});

test('ağırlık antrenmanı kalorisi kayıt anındaki kiloyu kullanır', () => {
  const workout = { duration: 3600, weightAtTime: 70, exercises: [] };
  assert.deepEqual(workoutCalories(workout, 100), workoutCalories(workout, 70));
});

test('gün toplamı kayıt snapshotı yerine o tarihin çözülmüş kilosunu kullanır', () => {
  const workout = { date: '2026-07-20', duration: 60, weightAtTime: 100, exercises: [] };
  assert.deepEqual(
    dayWorkoutCalories([workout], '2026-07-20', 70),
    { ...workoutCalories({ ...workout, weightAtTime: 70 }, 70), activeRecovery: false },
  );
});

test('geçmiş gün için gelecekteki değil o tarihte bilinen son ölçüm seçilir', () => {
  const metric = findMetricsForDate([
    { date: '2026-07-01', weight: 70 },
    { date: '2026-08-01', weight: 80 },
  ], '2026-07-20', { weight: 90 });
  assert.equal(Number(metric.weight), 70);
});

test('enerji serisi eski snapshot yerine tarih-doğru hesaplayıcıyı kullanır', () => {
  const snapshot = { total: 2400, isRestDay: true, parts: [] };
  const recalculated = dayEnergyBreakdown({ bmr: 1700, neatMode: 'manual', neatManual: 300 });
  const series = buildEnergySeries([{
    date: new Date().toISOString().slice(0, 10),
    meals: [{ calories: 2000, protein: 100, carbs: 200, fats: 60 }],
    energySnapshot: snapshot,
  }], { maintenance: 4000, bmr: 2500, energyForRecord: () => recalculated });
  assert.equal(series[0].out, recalculated.total);
  assert.notEqual(series[0].out, snapshot.total);
});

test('genel mod seçiliyken kayıtta kalmış alt NEAT alanları ayarı ezmez', () => {
  const base = { neatMode: 'manual', neatManual: 350, activityLevel: 'light', neatMultiplier: 1 };
  const result = neatOptsForDay(base, {
    neatModeOverride: '', activityLevelOverride: 'high', neatManualOverride: 1200,
  });
  assert.deepEqual(result, base);
});

test('günlük NEAT istisnası komşu tarihin genel ayarını değiştirmez', () => {
  const base = { neatMode: 'level', activityLevel: 'light', neatMultiplier: 0.9 };
  const special = neatOptsForDay(base, { date: '2026-07-20', neatMultiplier: 1.4 });
  const normal = neatOptsForDay(base, { date: '2026-07-21' });
  assert.equal(special.neatMultiplier, 1.4);
  assert.deepEqual(normal, base);
});

test('günlük NEAT sıfırlama yalnız istisna alanlarını ve eski snapshotı temizler', () => {
  const result = resetDayNeatOverride({
    date: '2026-07-20', caloriesIn: 2200, steps: 8000,
    neatModeOverride: 'manual', neatManualOverride: 900, neatMultiplier: 1.4,
    energySnapshot: { total: 4000 },
  });
  assert.equal(result.date, '2026-07-20');
  assert.equal(result.caloriesIn, 2200);
  assert.equal(result.steps, 8000);
  assert.equal(result.neatModeOverride, '');
  assert.equal(result.neatManualOverride, '');
  assert.equal(result.neatMultiplier, '');
  assert.equal(result.energySnapshot, null);
});

test('yüksek eklem ağrısı Zirve tavsiyesini engeller', () => {
  const result = computeReadiness({ sleep: 10, stress: 1, soreness: 1, jointPain: 7, carbs: 10 });
  assert.equal(result.rawScore, 87);
  assert.equal(result.score, 59);
  assert.equal(result.zone.key, 'moderate');
  assert.ok(result.safetyReason);
});

test('şiddetli eklem ağrısı Kritik seviyeyi aşamaz', () => {
  const result = computeReadiness({ sleep: 10, stress: 1, soreness: 1, jointPain: 10, carbs: 10 });
  assert.equal(result.score, 39);
  assert.equal(result.zone.key, 'critical');
});

test('orta hazır oluşluk şablonu mutasyonsuz kontrollü seansa çevirir', () => {
  const template = {
    id: 'push', name: 'Push A', exercises: [{ name: 'Bench Press', sets: [
      { setType: 'warmup', weight: '50', reps: 8, rir: 5 },
      ...Array.from({ length: 4 }, () => ({ setType: 'normal', weight: '100', reps: 8, rir: 1 })),
    ] }],
  };
  const result = buildSessionAdaptation(template, { score: 52, jointPain: 2, carbs: 6 });
  assert.equal(result.mode.key, 'reduced');
  assert.equal(result.changes.originalWorkingSets, 4);
  assert.equal(result.changes.adaptedWorkingSets, 3);
  assert.equal(result.template.exercises[0].sets[0].setType, 'warmup');
  assert.ok(result.template.exercises[0].sets.slice(1).every(set => set.weight === '95' && set.rir === 3));
  assert.equal(template.exercises[0].sets.length, 5);
  assert.equal(template.exercises[0].sets[1].weight, '100');
});

test('kritik hazır oluşluk çalışma setlerini ikiyle ve yükü yüzde on beş azaltır', () => {
  const template = { name: 'Lower', exercises: [{ name: 'Squat', sets: Array.from(
    { length: 5 }, () => ({ setType: 'normal', weight: '100', reps: 8, rir: 1 })) }] };
  const result = buildSessionAdaptation(template, { score: 35, jointPain: 3 });
  assert.equal(result.mode.key, 'recovery');
  assert.equal(result.template.exercises[0].sets.length, 2);
  assert.ok(result.template.exercises[0].sets.every(set => set.weight === '85' && set.rir === 4));
  assert.equal(result.changes.removedSets, 3);
});

test('iyi hazır oluşlukta sistem sırf skor yüksek diye yük uydurmaz', () => {
  const template = { name: 'Upper', exercises: [{ name: 'Row', sets: [
    { setType: 'normal', weight: '', reps: '', rir: 2 },
    { setType: 'normal', weight: '80', reps: 8, rir: 2 },
  ] }] };
  const result = buildSessionAdaptation(template, { score: 78, jointPain: 1 });
  assert.equal(adaptationModeFor({ score: 78, jointPain: 1 }).key, 'normal');
  assert.equal(result.recommended, false);
  assert.deepEqual(result.template.exercises, template.exercises);
});

test('yüksek eklem ağrısı toplam skor iyi olsa da kontrollü moda geçer', () => {
  assert.equal(adaptationModeFor({ score: 90, jointPain: 7 }).key, 'reduced');
  assert.equal(adaptationModeFor({ score: 90, jointPain: 9 }).key, 'recovery');
});

test('seans uyarlaması yedekten geçerken korunur', () => {
  const workout = mergeWorkout({
    date: '2026-08-15', name: 'Push', exercises: [],
    adaptation: {
      mode: 'reduced', label: 'Kontrollü Seans', originalWorkingSets: 16,
      adaptedWorkingSets: 12, removedSets: 4, loadPercent: 5,
    },
  });
  assert.equal(workout.adaptation.mode, 'reduced');
  assert.equal(workout.adaptation.adaptedWorkingSets, 12);
  assert.equal(workout.adaptation.loadPercent, 5);
});

test('adaptif TDEE içindeki ortalama egzersiz iki kez sayılmaz', () => {
  const result = dayEnergyBreakdown({
    maintenance: 3000,
    bmr: 1900,
    lifting: 300,
    // Ortalama egzersiz EPOC dahil 321; bugünkü 300 + 21 EPOC bunun yerini alır.
    avgDailyExercise: 321,
    neatMode: 'auto',
  });
  assert.equal(result.neat, 779);
  assert.equal(result.total, 3000);
});

test('besin girilmediyse termik etki tahmini olarak işaretlenir', () => {
  const estimated = estimateMacrosForTef([], 2500);
  const result = dayEnergyBreakdown({ maintenance: 2500, bmr: 1700, estimatedMacros: estimated });
  assert.equal(result.tefEstimated, true);
  assert.ok(result.tef.total > 0);
  assert.ok(result.parts.find(part => part.key === 'tef').label.includes('Tahmini'));
  assert.equal(result.parts.find(part => part.key === 'tef').source, 'Geçici makro tahmini');
});

test('teorik rutin TDEE içindeki ortalama egzersizi ikinci kez saymaz ve kardiyoyu gün sayar', () => {
  const result = theoreticalWeek([
    { key: 'mon', label: 'Pazartesi', kcal: 0, cardioKcal: 300 },
    ...['tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(key => ({ key, label: key, kcal: 0, cardioKcal: 0 })),
  ], { maintenance: 3000, plannedCardioKcal: 300, avgDailyExercise: 309 });
  assert.equal(result.trainingDays, 1);
  assert.equal(result.restDays, 6);
  assert.equal(result.days[0].total, 3000);
  assert.equal(result.restDayKcal, 2691);
});

test('boş kardiyo süresi aynı aktivitenin arşiv ortalamasından çözülür', () => {
  const workouts = [
    { date: '2026-07-20', cardio: [{ type: 'zone2', minutes: 20, effort: 'easy' }] },
    { date: '2026-07-27', cardio: [{ type: 'zone2', minutes: 40, effort: 'moderate' }] },
  ];
  const result = resolvePlannedCardioMinutes({ activity: 'zone2', minutes: '' }, workouts, 80);
  assert.equal(result.minutes, 30);
  assert.equal(result.source, 'history');
});

test('elle girilen plan süresi arşiv ortalamasının önüne geçer', () => {
  const workouts = [{ date: '2026-07-20', cardio: [{ type: 'zone2', minutes: 20 }] }];
  const result = resolvePlannedCardioMinutes({ activity: 'zone2', minutes: 55 }, workouts, 80);
  assert.equal(result.minutes, 55);
  assert.equal(result.source, 'manual');
});

test('yalnız eğlence temposu kardiyo aktif off day sayılır ama kalorisi korunur', () => {
  assert.equal(isActiveRecoveryCardioDay(0, [{ type: 'zone2', minutes: 30, effort: 'fun' }]), true);
  assert.equal(isActiveRecoveryCardioDay(1, [{ type: 'zone2', minutes: 30, effort: 'fun' }]), false);
  assert.equal(isActiveRecoveryCardioDay(0, [
    { type: 'zone2', minutes: 30, effort: 'fun' },
    { type: 'zone2', minutes: 30, effort: 'moderate' },
  ]), false);
});

test('aktif off day enerji harcamasını korurken dinlenme olarak etiketlenir', () => {
  const result = dayEnergyBreakdown({ maintenance: 2400, bmr: 1700, cardio: 180, activeRecovery: true });
  assert.equal(result.cardio, 180);
  assert.equal(result.isRestDay, true);
  assert.equal(result.isActiveRest, true);
});

test('kalori panosu günlük toplamı enerji motorundan kullanır', () => {
  const result = calorieDashboard({
    intake: 2400,
    burnedAuto: 300,
    maintenance: 3000,
    targetIntake: 2500,
    totalOut: 3021,
  });
  assert.equal(result.totalOut, 3021);
  assert.equal(result.adjustedTarget, 2521);
  assert.equal(result.balance, -621);
  assert.equal(result.vsTarget, -121);
});

test('eski haftalık plan yeni biçime kayıpsız göçer', () => {
  const migrated = migrateWeekPlans({ weekPlan: { mon: 'push', fri: 'legs' } });
  assert.equal(migrated.plans.length, 1);
  assert.equal(migrated.plans[0].days.mon[0].templateId, 'push');
  assert.equal(migrated.plans[0].days.fri[0].templateId, 'legs');
});

test('şablon silinince bütün program slotlarından kalkar', () => {
  const plans = [{
    id: 'p1', name: 'Plan', days: {
      mon: [{ id: 'a', type: 'workout', templateId: 'gone' }, { id: 'b', type: 'cardio' }],
      tue: [{ id: 'c', type: 'workout', templateId: 'keep' }],
    },
  }];
  const cleaned = removeTemplateFromPlans(plans, 'gone');
  assert.deepEqual(cleaned[0].days.mon.map(s => s.id), ['b']);
  assert.deepEqual(cleaned[0].days.tue.map(s => s.id), ['c']);
});

test('toparlanma yedeği eksik alanlarla güvenli birleşir', () => {
  const day = mergeWellnessDay({ date: '2026-08-01', sleep: { bedTime: '23:30' }, mind: [{ minutes: 12 }] }, () => 'id');
  assert.equal(day.sleep.bedTime, '23:30');
  assert.equal(day.sleep.refreshed, 6);
  assert.equal(day.mind[0].minutes, 12);
});

test('bağlantılı hedefler kilo ve yağ oranından türetilir', () => {
  const result = deriveGoalSet({ goalWeight: 90, goalBodyFat: 15 }, 180);
  assert.equal(result.values.goalFFM, 76.5);
  assert.equal(result.values.goalFFMI, 23.6);
  assert.equal(result.inconsistent, false);
});

test('akıllı progresyon iki başarılı seanstan sonra yük artırır', () => {
  const sets = [{ weight: 100, reps: 10, rir: 2, setType: 'normal' }];
  const target = suggestNextTarget(sets, { repRangeMin: 6, repRangeMax: 10 }, 'Göğüs', {
    history: [{ sets }, { sets }],
    readiness: { score: 75, jointPain: 1 },
  });
  assert.equal(target.weight, 102.5);
  assert.equal(target.reps, 6);
  assert.equal(target.strategy, 'load');
  assert.equal(target.confidence, 'high');
});

test('düşük hazır oluşluk progresyon yerine toparlanma yükü verir', () => {
  const target = suggestNextTarget(
    [{ weight: 100, reps: 8, rir: 2, setType: 'normal' }],
    { repRangeMin: 6, repRangeMax: 10 },
    'Göğüs',
    { readiness: { score: 35, jointPain: 2 } },
  );
  assert.equal(target.weight, 90);
  assert.equal(target.strategy, 'recovery');
});

test('beslenme toplamı mikro değerleri ve öğünleri birlikte toplar', () => {
  const totals = dailyTotals({ meals: [
    { calories: 500, protein: 35, carbs: 55, fats: 15, fiber: 7, sodium: 0.4 },
    { calories: 300, protein: 20, carbs: 30, fats: 8, fiber: 4, sodium: 0.2 },
  ] });
  assert.equal(totals.calories, 800);
  assert.equal(totals.protein, 55);
  assert.equal(totals.fiber, 11);
  assert.ok(Math.abs(totals.sodium - 0.6) < 0.0001);
});

test('öğün şablonu her kullanımda bağımsız kimlik ve kaynak üretir', () => {
  let id = 0;
  const template = createMealTemplate(
    { id: 'old', name: 'Kahvaltı', calories: 500, protein: 35, carbs: 50, fats: 18 },
    'Standart Kahvaltı',
    () => `id-${id += 1}`,
    '2026-08-15T00:00:00.000Z',
  );
  const first = instantiateMealTemplate(template, () => `id-${id += 1}`);
  const second = instantiateMealTemplate(template, () => `id-${id += 1}`);
  assert.notEqual(first.id, second.id);
  assert.equal(first.source.label, 'Öğün şablonu');
  first.protein = 99;
  assert.equal(template.meal.protein, 35);
});

test('tarif toplamı porsiyon sayısına bölünür', () => {
  let id = 0;
  const recipe = createRecipeTemplate('Fırın Yulaf', [
    { name: 'Yulaf', calories: 600, protein: 20, carbs: 100, fats: 12 },
    { name: 'Yoğurt', calories: 300, protein: 30, carbs: 20, fats: 8 },
  ], 3, () => `id-${id += 1}`, '2026-08-15T00:00:00.000Z');
  assert.equal(recipe.meal.calories, 300);
  assert.equal(recipe.meal.protein, 16.7);
  assert.equal(recipe.servings, 3);
});

test('gün şablonu eski tarihin NEAT ve enerji alanlarını yeni güne taşımaz', () => {
  let id = 0;
  const template = createDayTemplate({
    date: '2026-08-08', entryMode: 'meals', waterMl: 2500,
    neatMultiplier: 1.4, activeCaloriesOut: 700, energySnapshot: { total: 4200 },
    meals: [{ id: 'old', name: 'Öğün', calories: 800, protein: 50, carbs: 90, fats: 25 }],
  }, 'Antrenman Günü', () => `id-${id += 1}`, '2026-08-15T00:00:00.000Z');
  const day = instantiateDayTemplate(template, '2026-08-15', () => `id-${id += 1}`);
  assert.equal(day.date, '2026-08-15');
  assert.equal(day.meals.length, 1);
  assert.equal(day.neatMultiplier, undefined);
  assert.equal(day.activeCaloriesOut, undefined);
  assert.equal(day.energySnapshot, undefined);
  assert.equal(day.meals[0].source.label, 'Gün şablonu');
});

test('günlük beslenme uyumu hedef ve suya göre puanlanır', () => {
  const score = nutritionDayScore({
    totals: { calories: 2450, protein: 150, fiber: 25 },
    targetCalories: 2500,
    targetProtein: 150,
    waterMl: 2800,
    weightKg: 80,
  });
  assert.equal(score.score, 98);
  assert.equal(score.waterTarget, 2800);
  assert.deepEqual(score.next, []);
});

test('plato taraması tek kötü seansta alarm üretmez', () => {
  const workout = (date, weight) => ({ date, exercises: [{ name: 'Bench', sets: [{ weight, reps: 8, rir: 2 }] }] });
  const result = buildPlateauInsights([
    workout('2026-06-01', 100), workout('2026-06-08', 100),
    workout('2026-06-22', 100), workout('2026-06-29', 99),
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Bench');
});

test('beslenme performans ilişkisi altı eşleşmeden önce kesin hüküm vermez', () => {
  const workoutsForInsight = Array.from({ length: 5 }, (_, index) => ({
    date: `2026-07-0${index + 1}`, readiness: { score: 60 + index },
  }));
  const nutritionForInsight = workoutsForInsight.map((workout, index) => ({
    date: workout.date, meals: [{ carbs: 200 + index * 10 }],
  }));
  const result = buildNutritionPerformanceInsight(workoutsForInsight, nutritionForInsight, 80);
  assert.equal(result.enough, false);
  assert.equal(result.samples, 5);
});

test('yedekten gelen kardiyo tempo, plan ve not alanlarını korur', () => {
  const workout = mergeWorkout({
    date: '2026-07-12',
    cardio: [{
      id: 'cardio-1', type: 'zone2', minutes: 42, effort: 'easy',
      plannedEffort: 'moderate', plannedMinutes: 35, note: 'Parkur', manualEntry: true,
    }],
  });
  assert.deepEqual(workout.cardio[0], {
    id: 'cardio-1', type: 'zone2', minutes: 42, effort: 'easy',
    plannedEffort: 'moderate', plannedMinutes: 35, note: 'Parkur', manualEntry: true,
  });
});

test('düşük-yük yürüyüş off dayi korur, eğimli yürüyüş ve HIIT korumaz', () => {
  assert.equal(isActiveRecoveryEntry({ type: 'walk', minutes: 45, effort: 'hard' }), true);
  assert.equal(isActiveRecoveryEntry({ type: 'walk_incline', minutes: 45, effort: 'moderate' }), false);
  assert.equal(isActiveRecoveryEntry({ type: 'hiit', minutes: 20, effort: 'fun' }), false);
  assert.equal(isActiveRecoveryEntry({ type: 'walk', minutes: 120, effort: 'easy' }), false);
  assert.equal(isActiveRecoveryCardioDay(0, [
    { type: 'walk', minutes: 30, effort: 'moderate' },
    { type: 'yoga', minutes: 20, effort: 'easy' },
  ]), true);
});

test('özel tempo katsayısı kalori, yorgunluk ve aktif toparlanmayı hesaplar', () => {
  const swimEntry = { type: 'swim', minutes: 30, effort: 'custom', customEffortMultiplier: 0.52 };
  assert.equal(isActiveRecoveryEntry(swimEntry), true);

  const hardSwim = { type: 'swim', minutes: 30, effort: 'custom', customEffortMultiplier: 1.2 };
  assert.equal(isActiveRecoveryEntry(hardSwim), false);
});

test('ilk kısmi hafta ilk kayıttan pazar gününe kadar etiketlenir', () => {
  const groups = groupIntoWeeks([
    { date: '2026-07-23' },
    { date: '2026-07-21' },
  ]);
  assert.equal(groups[0].partial, true);
  assert.ok(groups[0].label.includes('21'));
  assert.ok(groups[0].label.includes('26'));

  const rows = ['2026-07-21', '2026-07-23'].map(date => ({
    date, intake: 2000, out: 2400, balance: -400, isRestDay: true,
    breakdown: { lifting: 0, cardio: 0, tef: { total: 150 }, epoc: 0 },
  }));
  const energyWeeks = groupByWeek(rows);
  assert.ok(energyWeeks[0].rangeLabel.includes('21'));
  assert.ok(energyWeeks[0].rangeLabel.includes('26'));
});

test('arşiv haftaları başlangıç ayına tek kez yerleşir', () => {
  const weeks = groupIntoWeeks([
    { date: '2026-08-02' },
    { date: '2026-07-27' },
    { date: '2026-07-20' },
  ]);
  const months = groupWeeksIntoMonths(weeks);
  assert.equal(months.length, 1);
  assert.equal(months[0].key, '2026-07');
  assert.equal(months[0].weeks.length, 2);
  assert.equal(months[0].itemCount, 3);
});

test('döngü tavsiyesi takvim fazından değil günlük belirti yükünden değişir', () => {
  const empty = buildCycleSummary([], '2026-08-03');
  assert.equal(empty.severity, 'none');
  assert.equal(empty.hasEntry, false);
  const records = [
    mergeCycleDay({ date: '2026-07-28', bleeding: 'medium', pain: 2, energy: 7 }, () => 'a'),
    mergeCycleDay({ date: '2026-08-03', pain: 8, energy: 2, symptoms: ['fatigue'] }, () => 'b'),
  ];
  const summary = buildCycleSummary(records, '2026-08-03', { cycleLength: 28, periodLength: 5 });
  assert.equal(summary.hasData, true);
  assert.equal(summary.severity, 'high');
  assert.ok(summary.advice.training.includes('%20'));
});

test('şablon asistanı çekiş günündeki bölgesel boşluğu yakalar', () => {
  const result = analyzeTemplate([
    { name: 'Lat Pulldown', sets: Array.from({ length: 4 }, (_, index) => ({ id: index, setType: 'normal' })) },
    { name: 'Barbell Curl', sets: Array.from({ length: 3 }, (_, index) => ({ id: index, setType: 'normal' })) },
  ]);
  assert.equal(result.focusKey, 'pull');
  assert.ok(result.additions.some(item => item.muscle === 'Orta Sırt'));
});

test('deload süresi gün gün ilerler ve süresi dolunca hesaplarda kapanır', () => {
  const active = deloadState({ active: true, startDate: '2026-07-20', days: 7, preset: 'balanced' }, '2026-07-23');
  assert.equal(active.active, true);
  assert.equal(active.dayIndex, 4);
  assert.equal(active.loadScale, 0.9);
  const expired = deloadState({ active: true, startDate: '2026-07-20', days: 7, preset: 'balanced' }, '2026-07-27');
  assert.equal(expired.active, false);
  assert.equal(expired.expired, true);
});

/* ------------------------------------------------------------------ *
 *  SÜRÜM
 * ------------------------------------------------------------------ */

test('ekrandaki sürüm package.json ile aynı', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  // İkisi ayrışınca sürüm notları açılmıyor ve yedek dosyası eski sürümü
  // yazıyordu; sessiz kaldığı için de fark edilmiyordu.
  assert.equal(APP_VERSION, pkg.version);
  // Projenin yayın kuralı iki parçalıdır: her yayın MINOR'u bir artırır.
  assert.match(pkg.version, /^\d+\.\d+$/);
  assert.equal(LATEST_RELEASE_NOTES.version, pkg.version);
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages?.['']?.version, pkg.version);
});

test('lüks görsel sistem uygulama kabuğu ve ana navigasyonda etkin', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const nav = readFileSync(new URL('../src/components/Navbar.jsx', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  assert.match(app, /className="luxury-app /);
  assert.match(app, /className="luxury-frame /);
  assert.match(nav, /className="luxury-nav"/);
  assert.match(nav, /luxury-nav-item/);
  assert.match(css, /--luxury-gold:/);
  assert.match(css, /:root\[data-theme='light'\]/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('PWA manifesti yeni premium ikonları ve obsidyen açılış rengini kullanır', () => {
  const vite = readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(vite, /theme_color: '#080806'/);
  assert.match(vite, /pwa-v5-192x192\.png/);
  assert.match(vite, /pwa-v5-512x512\.png/);
  assert.match(html, /apple-touch-icon-v5\.png/);
});

/* ------------------------------------------------------------------ *
 *  KOÇ
 * ------------------------------------------------------------------ */

test('koç maddeleri önceliğe göre sıralanır ve bugünü değiştiren en üste çıkar', () => {
  const items = buildCoachActions({
    lastReadiness: { jointPain: 8 },
    daysSinceMetric: 20,
    macros: { protein: 60 },
    targetProtein: 180,
  });
  assert.equal(items[0].key, 'joint');
  assert.ok(items.every((item, i) => i === 0 || item.priority >= items[i - 1].priority));
});

test('hafta hiç başlamadıysa koç bütün kasları tek tek saymaz', () => {
  // Perşembe ve sonrası: hacim uyarısı bu günden itibaren anlamlı.
  const items = buildCoachActions({ muscleVolume: {} }, new Date('2026-08-07T12:00:00'));
  const hacim = items.filter(i => i.key === 'volume' || i.key === 'no-week');
  assert.equal(hacim.length, 1);
  assert.equal(hacim[0].key, 'no-week');
});

test('sinyal yoksa koç sessiz kalmaz, durumu onaylar', () => {
  // Uyku kaydı da veriliyor: eksik uyku kendi başına bir madde üretiyor ve
  // testin ölçmek istediği şey "hiç sinyal yokken ne oluyor".
  const items = buildCoachActions(
    { muscleVolume: { 'Göğüs': 12 }, sleep: { score: 82, asleep: 460 } },
    new Date('2026-08-03T12:00:00'));
  assert.deepEqual(items.map(i => i.key), ['clear']);
});

/* ------------------------------------------------------------------ *
 *  HAREKET İKAMESİ
 * ------------------------------------------------------------------ */

test('ikame önerileri ekipman sınıfı başına sınırlanır', () => {
  const list = suggestSubstitutes('Barbell Bench Press', DEFAULT_EXERCISES, { limit: 8 });
  assert.ok(list.length > 0);
  const perEquipment = new Map();
  list.forEach(item => {
    const key = item.equipment?.key || 'other';
    perEquipment.set(key, (perEquipment.get(key) || 0) + 1);
  });
  // Filtresiz listede tek ekipman sınıfı listeyi doldurmamalı; yoksa öneri
  // "dört farklı makine göğüs presi" olup seçim sunmuyor.
  assert.ok([...perEquipment.values()].every(count => count <= 2));
  assert.ok(perEquipment.size >= 2);
});

test('ikame listesi hareketin kendisini önermez ve alakasızı eler', () => {
  const list = suggestSubstitutes('Barbell Bench Press', DEFAULT_EXERCISES, { limit: 20 });
  assert.ok(!list.some(item => item.name === 'Barbell Bench Press'));
  assert.ok(!list.some(item => item.name === 'Standing Calf Raise'));
  assert.ok(list.every(item => item.similarity >= 0.5));
});

test('kas eşlemesi olmayan harekete öneri üretilmez', () => {
  assert.deepEqual(suggestSubstitutes('Zzz Bilinmeyen Hareket', DEFAULT_EXERCISES), []);
});

/* ------------------------------------------------------------------ *
 *  ÇAKIŞMA ASİSTANI
 * ------------------------------------------------------------------ */

const cardioSlot = (key, minutes, effort, time) => ({
  id: key, type: 'cardio', activity: findActivity(key), minutes, effort, time,
});
const legDay = { Quadriceps: 8, Hamstring: 5, 'Kalça': 4 };

test('bacak günündeki koşu yakınsa yüksek çakışma, uzaksa düşük', () => {
  const yakin = analyzeDayConflicts({
    byMuscle: legDay,
    workouts: [{ id: 'w', time: '18:00' }],
    cardios: [cardioSlot('run', 40, 'moderate', '19:00')],
  });
  assert.equal(yakin.level.key, 'high');

  const uzak = analyzeDayConflicts({
    byMuscle: legDay,
    workouts: [{ id: 'w', time: '18:00' }],
    cardios: [cardioSlot('run', 40, 'moderate', '07:00')],
  });
  assert.notEqual(uzak.level.key, 'high');
  // Sabah kardiyo + akşam ağırlık önerilen düzen; sıralama uyarısı çıkmamalı.
  assert.ok(!uzak.items.some(item => item.title === 'Sıralamayı değiştir'));
});

test('üst vücut günü kardiyoyla çakışmaz', () => {
  const sonuc = analyzeDayConflicts({
    byMuscle: { 'Göğüs': 8, Triseps: 4 },
    workouts: [{ id: 'w', time: '18:00' }],
    cardios: [cardioSlot('run', 40, 'moderate', '19:00')],
  });
  assert.equal(sonuc.level.key, 'none');
});

test('bacak günündeki düşük etkili kardiyo koşu kadar çakışmaz', () => {
  const sonuc = analyzeDayConflicts({
    byMuscle: legDay,
    workouts: [{ id: 'w', time: '18:00' }],
    cardios: [cardioSlot('bike', 45, 'easy', '19:00')],
  });
  assert.equal(sonuc.level.key, 'low');
});

/* ------------------------------------------------------------------ *
 *  HAFTALIK PLAN
 * ------------------------------------------------------------------ */

test('haftalık plan kas hacmini hareket bazında dökümler', () => {
  const template = {
    id: 't1',
    name: 'İtiş',
    exercises: [
      { name: 'Barbell Bench Press', sets: Array.from({ length: 4 }, () => ({ reps: '8', rir: 2, setType: 'normal' })) },
      { name: 'Overhead Press (OHP)', sets: Array.from({ length: 3 }, () => ({ reps: '10', rir: 2, setType: 'normal' })) },
    ],
  };
  const plan = { days: { mon: [{ id: 's1', type: 'workout', templateId: 't1' }] } };
  const result = computeWeekPlan(plan, [template], { weightKg: 80 });

  const gogus = result.statuses.find(s => s.muscle === 'Göğüs');
  assert.equal(gogus.volume, 4);
  assert.equal(gogus.sources.length, 1);
  assert.equal(gogus.sources[0].name, 'Barbell Bench Press');
  assert.equal(gogus.sources[0].sets, 4);

  // Triseps iki hareketten yarımşar set alır: 4×0.5 + 3×0.5 = 3.5
  const triseps = result.statuses.find(s => s.muscle === 'Triseps');
  assert.equal(triseps.volume, 3.5);
  assert.equal(triseps.sources.length, 2);
  assert.ok(triseps.sources.every(src => src.weight === 0.5));
  // Kaynaklar katkıya göre azalan sırada: hacim kısılacaksa ilk bakılacak yer.
  assert.ok(triseps.sources[0].volume >= triseps.sources[1].volume);
});

test('planda olmayan şablon kimliği güne hacim yazmaz', () => {
  const result = computeWeekPlan(
    { days: { mon: [{ id: 's1', type: 'workout', templateId: 'yok' }] } },
    [],
    { weightKg: 80 });
  assert.equal(result.totalSets, 0);
  assert.equal(result.days.find(d => d.key === 'mon').workouts.length, 0);
});

/* ------------------------------------------------------------------ *
 *  DİNLENME ÖNERİSİ
 * ------------------------------------------------------------------ */

const restOf = (name, set) => suggestRestSeconds(name, set).seconds;

test('dinlenme süresi kas sayısına değil yüklenen kas kütlesine göre artar', () => {
  // Squat'ın 0.5+ katkısı iki, bench press'in üç. Kas SAYSAYDIK squat daha
  // hafif çıkardı; oysa sistemik yükü belirgin daha yüksek.
  const squat = restOf('Barbell Back Squat', { rir: 2, reps: 8 });
  const bench = restOf('Barbell Bench Press', { rir: 2, reps: 8 });
  const curl = restOf('Barbell Bicep Curl', { rir: 2, reps: 10 });
  assert.ok(squat > bench, `squat ${squat} > bench ${bench} olmalı`);
  assert.ok(bench > curl);
});

test('tek eklemli büyük kas hareketi bileşiğin altında kalır', () => {
  // Leg extension quadriceps'i yüklüyor ama tek eklemli; kütle tek başına
  // yetseydi squat'la aynı bandı paylaşırdı.
  assert.ok(restOf('Leg Extension', { rir: 2, reps: 10 }) < restOf('Barbell Back Squat', { rir: 2, reps: 10 }));
});

test('tükeniş dinlenmeyi uzatır, yedek tekrar kısaltır', () => {
  const tukenis = restOf('Barbell Back Squat', { setType: 'failure', reps: 8 });
  const orta = restOf('Barbell Back Squat', { rir: 2, reps: 8 });
  const rahat = restOf('Barbell Back Squat', { rir: 3, reps: 8 });
  assert.ok(tukenis > orta);
  assert.ok(rahat < orta);
});

test('drop ve rest-pause dinlenme değil teknik arası sayılır', () => {
  const drop = suggestRestSeconds('Barbell Bench Press', { setType: 'drop' });
  const rp = suggestRestSeconds('Barbell Bench Press', { setType: 'rest_pause' });
  assert.equal(drop.isTechnique, true);
  assert.equal(rp.isTechnique, true);
  assert.ok(drop.seconds <= 30 && rp.seconds <= 30);
});

test('öneri makul sınırlar içinde kalır', () => {
  const enUzun = restOf('Conventional Deadlift', { setType: 'failure', reps: 3 });
  const enKisa = restOf('Standing Calf Raise', { rir: 3, reps: 20 });
  assert.ok(enUzun <= 300, `üst sınır aşıldı: ${enUzun}`);
  assert.ok(enKisa >= 45, `alt sınır aşıldı: ${enKisa}`);
});

test('süperset eşi beklerken araya tam dinlenme girmez', () => {
  const tek = suggestRestSeconds('Barbell Bench Press', { rir: 2, reps: 8 });
  const cift = suggestRestSeconds('Barbell Bench Press', { rir: 2, reps: 8 }, { supersetPending: true });
  assert.ok(cift.seconds < tek.seconds);
  assert.equal(cift.isTechnique, true);
});

/* ------------------------------------------------------------------ *
 *  VÜCUT AĞIRLIKLI HAREKETLER
 * ------------------------------------------------------------------ */

test('vücut ağırlıklı harekette ağırlık alanı EK yük sayılır', () => {
  // Barfiks 0 kg ile giriliyor; eskiden yük 0 kabul edilip tonaj ve 1RM
  // sıfırlanıyordu, yani kalistenik çalışan biri istatistiklerde görünmüyordu.
  assert.equal(effectiveLoad('Pull-up', 0, { bodyWeightKg: 80 }), 80);
  assert.equal(effectiveLoad('Pull-up', 20, { bodyWeightKg: 80 }), 100);
  // Şınavda vücudun tamamı taşınmıyor.
  assert.equal(effectiveLoad('Push-ups', 0, { bodyWeightKg: 80 }), 51.2);
});

test('destekli ve makine varyantlarına vücut ağırlığı eklenmez', () => {
  // Bu hareketlerde ağırlık alanı ek yük değil DESTEK miktarı; eklemek tam ters
  // yönde hata olurdu.
  assert.equal(bodyweightFactorOf('Assisted Pull-up'), null);
  assert.equal(bodyweightFactorOf('Machine Chest Dip'), null);
  assert.equal(effectiveLoad('Assisted Pull-up', 30, { bodyWeightKg: 80 }), 30);
});

test('elle yazılmış vücut ağırlığı ikinci kez eklenmez', () => {
  // 3.3 öncesi alışkanlık: barfikste kendi kilosunu yazmak. Yeni kural bunu
  // ek yük sanıp 80+80=160 yapıyordu; set bazında tanıma bunu engelliyor.
  assert.equal(effectiveLoad('Pull-up', 80, { bodyWeightKg: 80 }), 80);
  assert.equal(effectiveLoad('Pull-up', 85, { bodyWeightKg: 80 }), 85);
  // Şınavda taşınan yük %64; eşik ham kiloya değil taşınan yüke göre.
  assert.equal(effectiveLoad('Push-ups', 51, { bodyWeightKg: 80 }), 51);
  // Gerçek ek yük hâlâ ekleniyor.
  assert.equal(effectiveLoad('Pull-up', 20, { bodyWeightKg: 80 }), 100);
});

test('yazım biçimi elle zorlanabilir', () => {
  assert.equal(effectiveLoad('Pull-up', 80, { bodyWeightKg: 80, entryStyle: 'added' }), 160);
  assert.equal(effectiveLoad('Pull-up', 0, { bodyWeightKg: 80, entryStyle: 'total' }), 0);
});

test('denetim karışık geçmişi ayırt eder', () => {
  const sets = (kg, n) => Array.from({ length: n }, (_, i) => ({ id: `s${i}`, weight: String(kg), reps: '10', rir: 2, setType: 'normal' }));
  const workouts = [
    { id: 'a', date: '2026-06-01', exercises: [{ name: 'Pull-up', sets: sets(80, 3) }] },
    { id: 'b', date: '2026-08-01', exercises: [{ name: 'Pull-up', sets: sets(0, 3) }] },
  ];
  const opts = { metricsHistory: [{ date: '2026-01-01', weight: '80' }], currentMetrics: { weight: '80' } };
  const audit = auditBodyweightEntries(workouts, opts);
  assert.equal(audit.total, 3);
  assert.equal(audit.added, 3);
  assert.equal(audit.hasMixed, true);
});

test('geçmişi tek biçime çevirmek hesaplanan yükü değiştirmez', () => {
  // Dönüşümün tek amacı yazım birliği; sayılar aynı kalmalı yoksa kullanıcının
  // grafikleri dönüşümden sonra kayar.
  const sets = (kg, n) => Array.from({ length: n }, (_, i) => ({ id: `s${i}`, weight: String(kg), reps: '10', rir: 2, setType: 'normal' }));
  const workouts = [{ id: 'a', date: '2026-06-01', exercises: [{ name: 'Pull-up', sets: sets(85, 2) }] }];
  const opts = { metricsHistory: [{ date: '2026-01-01', weight: '80' }], currentMetrics: { weight: '80' } };

  const oncekiYuk = effectiveLoad('Pull-up', workouts[0].exercises[0].sets[0].weight, { bodyWeightKg: 80 });
  const { workouts: sonra, changed } = normalizeBodyweightEntries(workouts, opts);
  const sonrakiYuk = effectiveLoad('Pull-up', sonra[0].exercises[0].sets[0].weight, { bodyWeightKg: 80 });

  assert.equal(changed, 2);
  assert.equal(sonra[0].exercises[0].sets[0].weight, '5');
  assert.equal(sonrakiYuk, oncekiYuk);

  // İkinci kez çalıştırmak hiçbir şeyi değiştirmemeli.
  assert.equal(normalizeBodyweightEntries(sonra, opts).changed, 0);
});

test('kilo bilinmiyorsa veya model kapalıysa eski davranışa dönülür', () => {
  assert.equal(effectiveLoad('Pull-up', 0, { bodyWeightKg: 0 }), 0);
  assert.equal(effectiveLoad('Pull-up', 0, { bodyWeightKg: 80, bodyweightEnabled: false }), 0);
});

test('vücut ağırlığı tonaja ve rekora yansır', () => {
  const workout = {
    id: 'w1', date: '2026-08-04',
    exercises: [{ name: 'Pull-up', sets: setsOf(0, 10, 3) }],
  };
  const opts = { bodyWeightKg: 80, customExercises: [] };
  assert.equal(calcTonnage(workout.exercises), 0);
  assert.equal(calcTonnage(workout.exercises, opts), 2400);

  const kayitsiz = buildPersonalRecords([workout]);
  const kayitli = buildPersonalRecords([workout], null, (name, w) => effectiveLoad(name, w, opts));
  assert.equal(kayitsiz.has('Pull-up'), false);
  assert.ok(kayitli.get('Pull-up').e1rm > 80);
});

/* ------------------------------------------------------------------ *
 *  PLAKA ENVANTERİ
 * ------------------------------------------------------------------ */

test('envanterde olmayan plaka hesaba katılmaz', () => {
  const az = [25, 20, 10, 5, 2.5]; // 1.25 yok
  const tam = calculatePlates(82.5, 20);
  const eksik = calculatePlates(82.5, 20, az);
  assert.equal(tam.exact, true);
  // 1.25 olmayan salonda 82.5 kurulamaz; uygulama bunu gizlememeli.
  assert.equal(eksik.exact, false);
  assert.equal(eksik.achievable, 80);
  assert.ok(!eksik.perSide.includes(1.25));
});

test('boş plaka listesi hesaplayıcıyı kilitlemez', () => {
  assert.deepEqual(normalizePlates([]), [...AVAILABLE_PLATES]);
  assert.deepEqual(normalizePlates(null), [...AVAILABLE_PLATES]);
  // Geçersiz değerler ayıklanır, sıralama garanti altında.
  assert.deepEqual(normalizePlates([5, 'x', -2, 20, 5]), [20, 5]);
});

test('ısınma piramidi envantere yuvarlanır', () => {
  const az = [25, 20, 10, 5]; // en küçük 5 → adım 10 kg
  const adimlar = generateWarmup(100, 20, az).map(s => s.weight);
  assert.ok(adimlar.every(w => (w - 20) % 10 === 0), `yüklenemeyen adım: ${adimlar}`);
});

/* ------------------------------------------------------------------ *
 *  SEANS RAPORU
 * ------------------------------------------------------------------ */

const setsOf = (kg, reps, n) => Array.from({ length: n }, (_, i) => ({
  id: `s${i}`, weight: String(kg), reps: String(reps), rir: 2, setType: 'normal',
}));

test('seans raporu aynı hareketi geçen seansla kıyaslar', () => {
  const gecmis = [{ id: 'w0', date: '2026-07-28', exercises: [{ name: 'Barbell Bench Press', sets: setsOf(80, 8, 4) }] }];
  const bugun = { id: 'w1', date: '2026-08-04', duration: 60, exercises: [{ name: 'Barbell Bench Press', sets: setsOf(85, 8, 4) }] };
  const rapor = buildSessionReport(bugun, gecmis, { previousRecords: new Map([['Barbell Bench Press', { e1rm: 98 }]]) });
  const satir = rapor.exercises[0];
  assert.equal(satir.metric, 'e1rm');
  assert.ok(satir.delta > 0);
  assert.equal(satir.isPR, true);
});

test('rekor ilanı için hem kayıtlı rekoru hem geçen seansı geçmek gerekir', () => {
  // Rekor listesi eksik olsa bile gerileyen bir harekete rekor verilmemeli.
  const gecmis = [{ id: 'w0', date: '2026-07-28', exercises: [{ name: 'Overhead Press (OHP)', sets: setsOf(50, 10, 3) }] }];
  const bugun = { id: 'w1', date: '2026-08-04', duration: 60, exercises: [{ name: 'Overhead Press (OHP)', sets: setsOf(47.5, 10, 3) }] };
  const rapor = buildSessionReport(bugun, gecmis, { previousRecords: new Map() });
  assert.equal(rapor.exercises[0].isPR, false);
  assert.equal(rapor.records.length, 0);
});

test('yüksek tekrarlı harekette 1RM yerine hacim yükü kıyaslanır', () => {
  // estimate1RM 15 tekrarın üstünde 0 döndüğü için bu hareketler her seans
  // "1RM 0" görünüyordu.
  const gecmis = [{ id: 'w0', date: '2026-07-28', exercises: [{ name: 'Lateral Raise (Dumbbell)', sets: setsOf(10, 15, 3) }] }];
  const bugun = { id: 'w1', date: '2026-08-04', duration: 40, exercises: [{ name: 'Lateral Raise (Dumbbell)', sets: setsOf(12, 15, 3) }] };
  const satir = buildSessionReport(bugun, gecmis).exercises[0];
  assert.equal(satir.metric, 'tonnage');
  assert.equal(satir.isPR, false);
  assert.ok(satir.delta > 0);
});

/* ------------------------------------------------------------------ *
 *  HAFTALIK GÖZDEN GEÇİRME
 * ------------------------------------------------------------------ */

test('toparlanma zayıfken hacim artışı önerilmez', () => {
  const bugun = new Date('2026-08-05T12:00:00');
  const workouts = [
    { id: 'a', date: '2026-07-27', readiness: { score: 42 }, exercises: [{ name: 'Barbell Bench Press', sets: setsOf(80, 8, 3) }] },
  ];
  const wellness = ['2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30'].map(date => ({
    date, sleep: { bedTime: '01:00', wakeTime: '05:30', latency: 20, awakenings: 2, awakeMinutes: 15, refreshed: 4 },
  }));
  const review = buildWeeklyReview({ workouts, wellness, today: bugun });
  const anahtarlar = review.adjustments.map(a => a.key);
  assert.ok(anahtarlar.includes('recovery'));
  // Aynı hafta hem "toparlan" hem "set ekle" demek çelişir.
  assert.ok(!anahtarlar.includes('under'));
});

test('aynı haftada iki uyarlanmış seans toparlanma sinyali sayılır', () => {
  const adaptation = { mode: 'reduced', label: 'Kontrollü Seans', originalWorkingSets: 4, adaptedWorkingSets: 3 };
  const workouts = [
    { id: 'a', date: '2026-07-27', readiness: { score: 65 }, adaptation, exercises: [{ name: 'Barbell Bench Press', sets: setsOf(80, 8, 3) }] },
    { id: 'b', date: '2026-07-30', readiness: { score: 62 }, adaptation, exercises: [{ name: 'Lat Pulldown', sets: setsOf(70, 8, 3) }] },
  ];
  const review = buildWeeklyReview({ workouts, today: new Date('2026-08-05T12:00:00') });
  assert.equal(review.training.adaptedSessions, 2);
  assert.ok(review.adjustments.some(item => item.key === 'recovery'));
  assert.ok(!review.adjustments.some(item => item.key === 'under'));
});

test('gözden geçirme varsayılan olarak geçen tam haftaya bakar', () => {
  // İçinde bulunulan hafta bitmeden "hacim eksik" demek yanıltıcı olurdu.
  assert.equal(lastCompletedWeekStart(new Date('2026-08-05T12:00:00')), '2026-07-27');
  assert.equal(lastCompletedWeekStart(new Date('2026-08-03T12:00:00')), '2026-07-27');
});

test('kayıt yoksa gözden geçirme uydurma ayar üretmez', () => {
  const review = buildWeeklyReview({ workouts: [], today: new Date('2026-08-05T12:00:00') });
  assert.equal(review.hasData, false);
  assert.deepEqual(review.adjustments.map(a => a.key), ['no-data']);
});

/* ------------------------------------------------------------------ *
 *  KAS ÇALIŞMA SIKLIĞI
 * ------------------------------------------------------------------ */

const freqSets = (n) => Array.from({ length: n }, (_, i) => ({
  id: `s${i}`, weight: '80', reps: '8', rir: 2, setType: 'normal',
}));

// 4 tam hafta; bugün çarşamba, içinde bulunulan hafta hesaba girmemeli.
const freqWorkouts = () => {
  const out = [];
  ['2026-07-06', '2026-07-13', '2026-07-20', '2026-07-27'].forEach((pzt, i) => {
    // Göğüs: tek günde 16 set (yığılmış)
    out.push({ id: `a${i}`, date: pzt, exercises: [
      { name: 'Barbell Bench Press', sets: freqSets(8) },
      { name: 'Incline Dumbbell Press', sets: freqSets(8) },
    ] });
    // Kanat: iki güne bölünmüş
    out.push({ id: `b${i}`, date: pzt, exercises: [{ name: 'Lat Pulldown', sets: freqSets(6) }] });
    const per = new Date(`${pzt}T12:00:00`);
    per.setDate(per.getDate() + 3);
    out.push({ id: `c${i}`, date: per.toISOString().slice(0, 10), exercises: [{ name: 'Lat Pulldown', sets: freqSets(6) }] });
  });
  return out;
};

test('sıklık yalnızca tamamlanmış haftalara bakar', () => {
  // İçinde bulunulan hafta bitmediği için ortalamayı aşağı çekerdi.
  const r = buildFrequencyReport(freqWorkouts(), { today: new Date('2026-08-05T12:00:00'), weeks: 4 });
  assert.equal(r.weeks, 4);
  assert.equal(r.rangeStart, '2026-07-06');
  assert.equal(r.rangeEnd, '2026-08-02');
});

test('aynı hacim tek güne yığılırsa işaretlenir', () => {
  const r = buildFrequencyReport(freqWorkouts(), { today: new Date('2026-08-05T12:00:00'), weeks: 4 });
  const gogus = r.byMuscle.find(m => m.muscle === 'Göğüs');
  const kanat = r.byMuscle.find(m => m.muscle === 'Kanat');

  // Göğüs 16 set ama tek gün: bölünmesi öneriliyor.
  assert.equal(gogus.sessionsPerWeek, 1);
  assert.equal(gogus.concentration, 1);
  assert.equal(gogus.verdict, 'concentrated');
  assert.equal(gogus.recommended, 2);

  // Kanat aynı hacme yakın ama iki güne bölünmüş: uyarı yok.
  assert.equal(kanat.sessionsPerWeek, 2);
  assert.ok(kanat.concentration < 1);
  assert.notEqual(kanat.verdict, 'concentrated');
});

test('yan katkıyla beslenen kas hedeflenmiş sayılmaz', () => {
  // Eşik olmasa bench press'in tricepse yazdığı yarım set "triceps çalışıldı"
  // sayılır ve sıklık her kas için şişerdi.
  const r = buildFrequencyReport([
    { id: 'x', date: '2026-07-27', exercises: [{ name: 'Barbell Bench Press', sets: freqSets(2) }] },
  ], { today: new Date('2026-08-05T12:00:00'), weeks: 4 });
  const triseps = r.byMuscle.find(m => m.muscle === 'Triseps');
  assert.equal(triseps.sessionsPerWeek, 0);
  assert.equal(triseps.verdict, 'incidental');
});

test('sorun yoksa koç sıklık maddesi üretmez', () => {
  assert.equal(frequencyCoachItem(buildFrequencyReport([], { today: new Date('2026-08-05T12:00:00') })), null);
  const item = frequencyCoachItem(buildFrequencyReport(freqWorkouts(), { today: new Date('2026-08-05T12:00:00'), weeks: 4 }));
  assert.equal(item.muscle, 'Göğüs');
});

/* ------------------------------------------------------------------ *
 *  CSV DIŞA AKTARMA
 * ------------------------------------------------------------------ */

test('CSV virgül ve tırnak içeren alanları kaçırır', () => {
  // Kaçırılmazsa sütun kayması oluyor ve bu sessizce oluyor: dosyayı açan
  // kişi yanlış sütundaki sayıyı doğru sanıyor.
  const csv = workoutsToCsv([{
    date: '2026-08-03', name: 'İtiş, A',
    exercises: [{ name: 'Lateral Raise (Cable)', sets: [{ weight: '12.5', reps: '15', rir: 1, setType: 'normal' }] }],
  }]);
  const satir = csv.split('\r\n')[1];
  assert.ok(satir.includes('"İtiş, A"'), satir);
  // Ondalık virgüllü yazıldığı için o hücre de tırnaklanmalı.
  assert.ok(satir.includes('"12,5"'), satir);
  assert.equal(satir.split(';').length > 10, true);
});

test('CSV Excel için BOM ve noktalı virgülle üretilir', () => {
  // BOM olmadan Excel UTF-8'i tanımıyor ve Türkçe karakterler bozuluyor.
  const csv = metricsToCsv([{ date: '2026-08-01', weight: '80.5', measurements: {} }]);
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  assert.ok(csv.includes('Yag Orani'));
  assert.ok(csv.split('\r\n')[0].includes(';'));
});

test('ısınma setleri CSV\'de numaralandırılmaz ama satır olarak kalır', () => {
  const csv = workoutsToCsv([{
    date: '2026-08-03', name: 'A',
    exercises: [{ name: 'Barbell Bench Press', sets: [
      { weight: '40', reps: '10', rir: 4, setType: 'warmup' },
      { weight: '80', reps: '8', rir: 2, setType: 'normal' },
    ] }],
  }]);
  const satirlar = csv.trim().split('\r\n');
  assert.equal(satirlar.length, 3); // başlık + 2 set
  assert.ok(satirlar[1].includes('Isinma'));
  // Isınma seti hacme sayılmadığı için set numarası ve hacim boş.
  assert.equal(satirlar[1].split(';')[4], '');
});

/* ------------------------------------------------------------------ *
 *  HAZIR PROGRAMLAR
 * ------------------------------------------------------------------ */

test('hazır programlardaki her hareket kütüphanede var', () => {
  // Yazım hatası olan bir hareket adı sessizce "Diğer" kasına düşer ve program
  // kurulduğunda hacim hesabı yanlış çıkar.
  const eksik = STARTER_PROGRAMS.flatMap(p =>
    p.days.flatMap(d => d.exercises.map(e => e.name)))
    .filter(name => !DEFAULT_EXERCISES.includes(name));
  assert.deepEqual([...new Set(eksik)], []);
});

test('hazır programlar her kası MEV üstünde ve MRV altında tutar', () => {
  // Programın kendi vaadi bu; kaydığında sessizce kötü bir program dağıtılmış
  // olur. Uygulamanın kendi hacim analiziyle doğrulanıyor.
  let sayac = 0;
  const gid = () => `sp-${++sayac}`;
  const seviyeOf = (level) =>
    (level === 'Yeni başlayan' ? 'beginner' : level === 'İleri' ? 'advanced' : 'intermediate');

  STARTER_PROGRAMS.forEach(program => {
    const { templates, plan } = instantiateStarterProgram(program, gid);
    const sonuc = computeWeekPlan(plan, templates, { experienceLevel: seviyeOf(program.level) });
    const dusuk = sonuc.statuses.filter(s => s.volume < s.mev).map(s => `${s.muscle} ${s.volume}/${s.mev}`);
    const asiri = sonuc.statuses.filter(s => s.volume > s.mrv).map(s => s.muscle);
    assert.deepEqual(dusuk, [], `${program.name} MEV altı: ${dusuk.join(', ')}`);
    assert.deepEqual(asiri, [], `${program.name} MRV üstü: ${asiri.join(', ')}`);
  });
});

test('program kurulumu şablonları ve haftalık planı üretir', () => {
  let sayac = 0;
  const program = STARTER_PROGRAMS.find(p => p.key === 'upperlower4');
  const { templates, plan } = instantiateStarterProgram(program, () => `x-${++sayac}`);

  assert.equal(templates.length, 4);
  // Şablon adı program adını taşımalı: kullanıcı birden fazla program kurabiliyor.
  assert.ok(templates[0].name.startsWith(program.name));
  // Planlanan gün sayısı programın vaat ettiğiyle aynı.
  const doluGun = Object.values(plan.days).filter(slots => slots.length > 0);
  assert.equal(doluGun.length, program.daysPerWeek);
  // Her slot gerçek bir şablona işaret etmeli.
  const ids = new Set(templates.map(t => t.id));
  doluGun.forEach(slots => assert.ok(ids.has(slots[0].templateId)));
});

/* ------------------------------------------------------------------ *
 *  SEANS İÇİ YÜK AYARI
 * ------------------------------------------------------------------ */

const advSet = (w, r, rir) => ({ weight: String(w), reps: String(r), rir, setType: 'normal' });

test('hedef aralıkta kalan sette öneri üretilmez', () => {
  // Her sete yorum yapmak gürültü olurdu.
  assert.equal(sessionAdvice([advSet(100, 8, 2)], { repRangeMin: 6, repRangeMax: 10 }), null);
});

test('aralığın altında tükenilince yük düşürülür', () => {
  const a = sessionAdvice([advSet(100, 4, 0)], { repRangeMin: 6, repRangeMax: 10 });
  assert.equal(a.action, 'decrease');
  assert.ok(a.weight < 100);
});

test('aralığın üstünde yedek tekrar varsa yük artırılır', () => {
  const a = sessionAdvice([advSet(100, 13, 3)], { repRangeMin: 6, repRangeMax: 10 });
  assert.equal(a.action, 'increase');
  assert.equal(a.weight, 102.5);
  // Küçük kasta sıçrama daha ufak olmalı.
  const k = sessionAdvice([advSet(10, 15, 3)], { repRangeMin: 6, repRangeMax: 10, isSmallMuscle: true });
  assert.equal(k.weight, 11.25);
});

test('aralık üstünde ama tükenilmişse artırma önerilmez', () => {
  assert.equal(sessionAdvice([advSet(100, 12, 0)], { repRangeMin: 6, repRangeMax: 10 }), null);
});

test('aynı ağırlıkta sert tekrar kaybı yük düşürtür', () => {
  const a = sessionAdvice(
    [advSet(100, 10, 1), advSet(100, 8, 0), advSet(100, 6, 0)],
    { repRangeMin: 6, repRangeMax: 10 });
  assert.equal(a.action, 'decrease');
  assert.equal(a.weight, 92.5);
  // Normal düşüşte sessiz kalmalı.
  assert.equal(sessionAdvice([advSet(100, 10, 2), advSet(100, 9, 1)], { repRangeMin: 6, repRangeMax: 10 }), null);
});


/* --- Mezosiklik (blok) planı --- */

const mesoAyar = (over = {}) => ({
  active: true, startDate: '2026-08-03', weeks: 5,
  baseline: { 'Göğüs': 10, Kanat: 12 }, feedback: {}, ...over,
});

test('blok hafta indeksi tarihten yürür ve son hafta boşaltmadır', () => {
  assert.equal(mesocycleState(mesoAyar(), '2026-08-03').weekIndex, 1);
  assert.equal(mesocycleState(mesoAyar(), '2026-08-09').weekIndex, 1);
  assert.equal(mesocycleState(mesoAyar(), '2026-08-10').weekIndex, 2);
  const son = mesocycleState(mesoAyar(), '2026-08-31');
  assert.equal(son.weekIndex, 5);
  assert.equal(son.isDeload, true);
  assert.equal(son.phase, 'deload');
  // Süre dolduğunda kayıt silinmiyor, kapalı + expired sayılıyor.
  const bitmis = mesocycleState(mesoAyar(), '2026-09-07');
  assert.equal(bitmis.active, false);
  assert.equal(bitmis.expired, true);
  // İleri tarihli başlangıç henüz başlamamış demek.
  assert.equal(mesocycleState(mesoAyar(), '2026-08-01').active, false);
});

test('geri bildirim girilmemişse hafta başına varsayılan bir set eklenir', () => {
  const t = (h) => muscleTarget('Göğüs', { baseline: 10, weekIndex: h, totalWeeks: 5 });
  assert.equal(t(1).target, 10);
  assert.equal(t(2).target, 11);
  assert.equal(t(4).target, 13);
});

test('artış geçen haftanın geri bildirimine göre değişir', () => {
  const feedback = { 1: { 'Göğüs': 'easy' }, 2: { 'Göğüs': 'hard' } };
  // 1. hafta kolay geldi (+2), 2. hafta zorladı (+0).
  assert.equal(muscleTarget('Göğüs', { baseline: 10, weekIndex: 2, totalWeeks: 5, feedback }).target, 12);
  assert.equal(muscleTarget('Göğüs', { baseline: 10, weekIndex: 3, totalWeeks: 5, feedback }).target, 12);
  assert.equal(muscleTarget('Göğüs', { baseline: 10, weekIndex: 4, totalWeeks: 5, feedback }).target, 13);
});

test('hedef MRV tavanını aşmaz', () => {
  const feedback = Object.fromEntries([1, 2, 3, 4].map(h => [h, { 'Bel': 'easy' }]));
  const t = muscleTarget('Bel', { baseline: 8, weekIndex: 5, totalWeeks: 6, feedback });
  const { mrv } = getVolumeLandmarks('Bel', 'intermediate');
  assert.equal(t.target, mrv);
  assert.equal(t.capped, true);
});

test('boşaltma haftası son haftanın değil BAŞLANGICIN yarısıdır', () => {
  const feedback = Object.fromEntries([1, 2, 3].map(h => [h, { Kanat: 'easy' }]));
  // 4. hafta 12 + 6 = 18 sete çıkmış olurdu; boşaltma yine de 6.
  assert.equal(muscleTarget('Kanat', { baseline: 12, weekIndex: 4, totalWeeks: 5, feedback }).target, 18);
  assert.equal(muscleTarget('Kanat', { baseline: 12, weekIndex: 5, totalWeeks: 5, feedback }).target, 6);
});

test('talimat en çok katkı veren harekete yazılır', () => {
  const hedefler = weeklyTargets({ Kanat: 12 }, { weekIndex: 2, totalWeeks: 5 });
  const [i] = targetInstructions(hedefler, [{
    muscle: 'Kanat', volume: 12,
    sources: [{ name: 'Lat Pulldown', volume: 8, dayLabel: 'Pazartesi' }],
  }]);
  assert.equal(i.action, 'add');
  assert.equal(i.diff, 1);
  assert.match(i.text, /Lat Pulldown/);
  assert.match(i.text, /Pazartesi/);
  // Hedefle mevcut eşitse dokunulmaz.
  const [h] = targetInstructions(
    weeklyTargets({ Kanat: 12 }, { weekIndex: 1, totalWeeks: 5 }),
    [{ muscle: 'Kanat', volume: 12, sources: [] }]);
  assert.equal(h.action, 'hold');
});

test('dolaylı çeyrek setlerden ibaret kaslar blok hedefine girmez', () => {
  const h = weeklyTargets({ 'Göğüs': 10, Trapez: 1 }, { weekIndex: 2, totalWeeks: 5 });
  assert.deepEqual(h.map(x => x.muscle), ['Göğüs']);
});

test('blok kapalıyken koç satırı çıkmaz', () => {
  assert.equal(mesocycleCoachItem({ active: false }, []), null);
  assert.match(mesocycleCoachItem({ active: true, isDeload: true, weekIndex: 5, totalWeeks: 5 }, []).title, /Boşaltma/);
});

/* --- Hareket seçimi denetimi --- */

test('kas boyu profili doğru sınıflanır', () => {
  assert.equal(lengthBias('Romanian Deadlift (RDL)'), 'stretch');
  assert.equal(lengthBias('Incline Dumbbell Fly'), 'stretch');
  assert.equal(lengthBias('Seated Leg Curl'), 'stretch');
  assert.equal(lengthBias('Lying Leg Curl'), 'short');
  assert.equal(lengthBias('Leg Extension'), 'short');
  assert.equal(lengthBias('Barbell Shrug'), 'short');
  assert.equal(lengthBias('Barbell Bench Press'), 'mid');
  assert.equal(lengthBias('Barbell Row'), 'mid');
  // Araya kelime giren adlar kaçmamalı — bitişik kalıp bunu yapamıyordu.
  assert.equal(lengthBias('Leaning Cable Lateral Raise'), 'stretch');
  // Baldır kuralı leg press kuralından önce gelmeli.
  assert.equal(lengthBias('Leg Press Calf Raise'), 'stretch');
});

test('gerilmede yükleme yoksa uyarı ve öneri çıkar', () => {
  const r = auditExerciseSelection([{
    muscle: 'Kalça', volume: 12,
    sources: [
      { name: 'Hip Thrust', volume: 8, dayLabel: 'Pazartesi' },
      { name: 'Cable Glute Kickback', volume: 4, dayLabel: 'Cuma' },
    ],
  }]);
  const f = r.findings[0];
  assert.ok(f.issues.some(i => i.key === 'noStretch'));
  assert.equal(f.stretchVolume, 0);
  // Öneriler birincil kas şartına takılmamalı: RDL ve split squat da kalçayı
  // gerilmede yüklüyor ama ikisinin de birincil kası başka.
  assert.ok(f.suggestions.length > 0);
  assert.ok(f.suggestions.every(ad => lengthBias(ad) === 'stretch'));
});

test('gerilmede yükleme varsa o uyarı çıkmaz', () => {
  const r = auditExerciseSelection([{
    muscle: 'Hamstring', volume: 10,
    sources: [
      { name: 'Romanian Deadlift (RDL)', volume: 5, dayLabel: 'Salı' },
      { name: 'Lying Leg Curl', volume: 5, dayLabel: 'Cuma' },
    ],
  }]);
  assert.equal(r.findings.length, 0);
  assert.equal(r.clean, true);
});

test('hacmin çoğu tek hareketten geliyorsa bağımlılık bildirilir', () => {
  const r = auditExerciseSelection([{
    muscle: 'Göğüs', volume: 12,
    sources: [
      { name: 'Incline Dumbbell Fly', volume: 10, dayLabel: 'Pazartesi' },
      { name: 'Machine Chest Press', volume: 2, dayLabel: 'Cuma' },
    ],
  }]);
  assert.ok(r.findings[0].issues.some(i => i.key === 'single'));
});

test('kas hiçbir harekette hedef değilse dolaylı hacim bildirilir', () => {
  const r = auditExerciseSelection([{
    muscle: 'Triseps', volume: 8,
    sources: [{ name: 'Barbell Bench Press', volume: 8, dayLabel: 'Pazartesi' }],
  }]);
  const konu = r.findings[0].issues.find(i => i.key === 'indirectOnly');
  assert.ok(konu);
  assert.equal(konu.severity, 'high');
});

test('gerilme karşılığı olmayan kaslarda uyarı verilmez', () => {
  // Trapez shrug ile, ön deltoid baş üstü basışla çalışıyor; ikisinin de
  // uzun boyda yükleyen ayrı bir karşılığı yok, uyarı gürültü olurdu.
  const r = auditExerciseSelection([
    { muscle: 'Trapez', volume: 8, sources: [{ name: 'Barbell Shrug', volume: 5, dayLabel: 'Pazartesi' }, { name: 'Dumbbell Shrug', volume: 3, dayLabel: 'Cuma' }] },
    { muscle: 'Ön Omuz', volume: 8, sources: [{ name: 'Overhead Press (OHP)', volume: 5, dayLabel: 'Salı' }, { name: 'Arnold Press', volume: 3, dayLabel: 'Cuma' }] },
  ]);
  assert.equal(r.findings.length, 0);
});

test('hacmi düşük kaslar denetlenmez', () => {
  const r = auditExerciseSelection([{
    muscle: 'Karın', volume: 3,
    sources: [{ name: 'Machine Crunch', volume: 3, dayLabel: 'Cuma' }],
  }]);
  assert.equal(r.hasData, false);
  assert.equal(r.findings.length, 0);
});



/* --- Program üretici --- */

test('üretilen program her kombinasyonda hacim sınırlarını tutturur', () => {
  // Üreticinin tek gerçek iddiası bu ve iddia burada ÖLÇÜLÜYOR. 3.8'de hazır
  // programların hacim iddiası yorum satırında kalmıştı ve yanlış çıkmıştı;
  // bu test aynı hatanın tekrarını imkânsız kılıyor.
  const oncelikler = [[], ['Kanat', 'Yan Omuz'], ['Göğüs'], ['Quadriceps', 'Biseps']];
  let sayac = 0;

  for (const preset of SPLIT_PRESETS) {
    const gun = preset.daysPerWeek;
    for (const profil of EQUIPMENT_PROFILES) {
      for (const seviye of ['beginner', 'intermediate', 'advanced']) {
        for (const priority of oncelikler) {
          const r = buildProgram({
            daysPerWeek: gun, splitId: preset.id,
            equipment: profil.key, experienceLevel: seviye, priority,
          });
          const etiket = `${preset.id}/${profil.key}/${seviye}/${priority.join('+') || 'öncelik yok'}`;
          assert.deepEqual(r.belowMev, [], `${etiket}: MEV altında kas var`);
          assert.deepEqual(r.aboveMrv, [], `${etiket}: MRV üstünde kas var`);
          assert.deepEqual(r.withoutStretch, [], `${etiket}: gerilmede yükleyen hareketi olmayan kas var`);
          assert.ok(r.days.length === gun, `${etiket}: gün sayısı tutmuyor`);
          assert.ok(r.totalSets > 0, `${etiket}: boş program`);
          sayac += 1;
        }
      }
    }
  }
  assert.equal(sayac, SPLIT_PRESETS.length * EQUIPMENT_PROFILES.length * 3 * oncelikler.length);
});

test('aynı gün sayısı için hibrit program düzenleri sunulur', () => {
  assert.ok(getSplitOptions(3).some(x => x.id === 'hybrid-3'));
  assert.ok(getSplitOptions(4).some(x => x.id === 'push-pull-legs-4'));
  assert.ok(getSplitOptions(4).some(x => x.id === 'torso-limbs-4'));
  assert.ok(getSplitOptions(6).some(x => x.id === 'arnold-6'));
  assert.equal(findSplitPreset(null, 4).id, 'upper-lower-4');
});

test('bütün program düzenleri geçerli hacim ve gün sayısı üretir', () => {
  SPLIT_PRESETS.forEach(preset => {
    const r = buildProgram({ daysPerWeek: preset.daysPerWeek, splitId: preset.id });
    assert.equal(r.split.id, preset.id, `${preset.id}: seçilen düzen korunmadı`);
    assert.equal(r.days.length, preset.daysPerWeek, `${preset.id}: gün sayısı yanlış`);
    assert.deepEqual(r.belowMev, [], `${preset.id}: MEV altında kas var`);
    assert.deepEqual(r.aboveMrv, [], `${preset.id}: MRV üstünde kas var`);
  });
});

test('program üretici geçmişte yapılan uygun hareketleri öne alır', () => {
  const r = buildProgram({
    daysPerWeek: 4,
    splitId: 'upper-lower-4',
    preferredExercises: ['Machine Fly'],
  });
  const adlar = r.days.flatMap(day => day.exercises.map(ex => ex.name));
  assert.ok(adlar.includes('Machine Fly'), 'geçmişte yapılan uygun hareket seçilmedi');
});

test('hibrit düzende bel hareketi itiş ve ön bacak gününe sızmaz', () => {
  const r = buildProgram({ daysPerWeek: 4, splitId: 'push-pull-legs-4' });
  [0, 3].forEach(index => {
    assert.ok(
      r.days[index].exercises.every(ex => ex.muscle !== 'Bel'),
      `${r.days[index].name}: bel hareketi yanlış güne eklendi`,
    );
  });
});

test('ekipman profili aday havuzunu gerçekten süzer', () => {
  const ev = buildProgram({ daysPerWeek: 4, equipment: 'home' });
  const adlar = ev.days.flatMap(d => d.exercises.map(e => e.name));
  // Ev profilinde makine ve kablo hareketi olmamalı.
  adlar.forEach(ad => {
    const eq = detectEquipment(ad);
    if (!eq) return;
    assert.ok(eq.key !== 'machine' && eq.key !== 'cable', `${ad} ev profilinde çıkmamalı`);
  });
});

test('öncelik seçilen kasın hacmini yükseltir', () => {
  const normal = buildProgram({ daysPerWeek: 4 });
  const oncelikli = buildProgram({ daysPerWeek: 4, priority: ['Yan Omuz'] });
  const v = (r) => r.report.find(x => x.muscle === 'Yan Omuz').volume;
  assert.ok(v(oncelikli) > v(normal), 'öncelik hacmi artırmadı');
});

test('üretici verimli bandın alt ucunda başlar, tavanda değil', () => {
  // Blok planının artıracak yeri kalmalı: hiçbir kas doğrudan MAV'ın üstünde
  // başlamamalı, çoğunluk MEV ile MAV ortasının altında olmalı.
  const r = buildProgram({ daysPerWeek: 4 });
  const calisan = r.report.filter(x => x.volume > 0);
  assert.ok(calisan.every(x => x.volume <= x.mrv));
  const altYarida = calisan.filter(x => x.volume <= (x.mev + x.mav) / 2).length;
  assert.ok(altYarida > calisan.length / 2, 'program bandın üst yarısında başlıyor');
});

test('program şablonlara ve haftalık plana çevrilir', () => {
  const r = buildProgram({ daysPerWeek: 4 });
  let n = 0;
  const kurulum = instantiateProgram(r, () => `id-${n += 1}`);
  assert.equal(kurulum.templates.length, 4);
  // Setler boş ağırlıkla açılmalı: uydurma bir başlangıç ağırlığı vermek yerine
  // hedefi ilk seanstan sonra geçmişten öğrenmek doğru.
  assert.ok(kurulum.templates.every(t => t.exercises.every(e => e.sets.every(x => x.weight === ''))));
  const dolu = Object.values(kurulum.plan.days).filter(d => d.length > 0);
  assert.equal(dolu.length, 4);
  // Plandaki her slot gerçek bir şablona işaret etmeli ve kimliği olmalı.
  const kimlikler = new Set(kurulum.templates.map(t => t.id));
  dolu.flat().forEach(slot => {
    assert.ok(slot.id, 'slot kimliksiz');
    assert.ok(kimlikler.has(slot.templateId), 'slot var olmayan şablona işaret ediyor');
  });
});



/* --- Ağrı takibi --- */

const agriKaydi = (date, region, severity, extra = {}) =>
  painEntry({ date, region, severity, ...extra });

test('aynı gün aynı bölgeye ikinci giriş satırı çoğaltmaz', () => {
  let log = [];
  log = upsertPainEntry(log, agriKaydi('2026-08-10', 'shoulder', 4));
  log = upsertPainEntry(log, agriKaydi('2026-08-10', 'shoulder', 7));
  log = upsertPainEntry(log, agriKaydi('2026-08-10', 'knee', 5));
  assert.equal(log.length, 2);
  // Sonuncusu kazanır: o günün nihai değerlendirmesi.
  assert.equal(log.find(x => x.region === 'shoulder').severity, 7);
});

test('eşik altındaki ağrılar rapora girmez', () => {
  const log = [agriKaydi('2026-08-14', 'knee', 2), agriKaydi('2026-08-15', 'knee', 1)];
  const r = buildPainReport(log, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.hasData, false);
});

test('sürekli ağrı işaretlenir ve trend hesaplanır', () => {
  const log = [
    agriKaydi('2026-08-01', 'shoulder', 4),
    agriKaydi('2026-08-06', 'shoulder', 6),
    agriKaydi('2026-08-11', 'shoulder', 8),
    agriKaydi('2026-08-15', 'shoulder', 8),
  ];
  const r = buildPainReport(log, { today: new Date('2026-08-16T12:00:00') });
  const omuz = r.regions.find(x => x.region === 'shoulder');
  assert.equal(omuz.persistent, true);
  assert.equal(omuz.trend, 'worsening');
  assert.equal(omuz.peak, 8);
  assert.ok(painCoachItem(r));
});

test('ağrılı günlerdeki hareketler yalnızca tekrarlıyorsa listelenir', () => {
  const log = [
    agriKaydi('2026-08-05', 'elbow', 6),
    agriKaydi('2026-08-12', 'elbow', 6),
  ];
  const w = [
    { date: '2026-08-05', exercises: [{ name: 'Skull Crusher' }, { name: 'Leg Press' }] },
    { date: '2026-08-12', exercises: [{ name: 'Skull Crusher' }] },
  ];
  const r = buildPainReport(log, { workouts: w, today: new Date('2026-08-16T12:00:00') });
  const adlar = r.regions[0].suspects.map(x => x.name);
  assert.ok(adlar.includes('Skull Crusher'));
  // Tek ağrılı günde görülen hareket rastlantı sayılır.
  assert.ok(!adlar.includes('Leg Press'));
});

/* --- Kuvvet dengesi --- */

const kuvvetSeansi = (date, ad, kg, tekrar, adet = 3) => ({
  date,
  exercises: [{ name: ad, sets: Array.from({ length: adet }, () => ({ weight: String(kg), reps: String(tekrar), rir: 1, setType: 'normal' })) }],
});

test('iki tarafı da ölçülemeyen oran rapora girmez', () => {
  const r = buildStrengthBalance([kuvvetSeansi('2026-08-10', 'Barbell Bench Press', 100, 5)],
    { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.ratios.length, 0);
  assert.ok(r.missing.some(m => m.key === 'pushPull'));
});

test('itiş çekişin çok önündeyse bant dışı bildirilir', () => {
  const w = [
    kuvvetSeansi('2026-08-10', 'Barbell Bench Press', 120, 5),
    kuvvetSeansi('2026-08-11', 'Barbell Row', 60, 8),
  ];
  const r = buildStrengthBalance(w, { today: new Date('2026-08-16T12:00:00') });
  const oran = r.ratios.find(x => x.key === 'pushPull');
  assert.equal(oran.status, 'high');
  assert.ok(oran.ratio > oran.max);
  assert.ok(strengthBalanceCoachItem(r));
});

test('dengeli oran uyarı üretmez', () => {
  const w = [
    kuvvetSeansi('2026-08-10', 'Barbell Bench Press', 100, 5),
    kuvvetSeansi('2026-08-11', 'Barbell Row', 90, 5),
  ];
  const r = buildStrengthBalance(w, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.ratios.find(x => x.key === 'pushPull').status, 'ok');
  assert.equal(strengthBalanceCoachItem(r), null);
});

test('tek set oran kurmaya yetmez', () => {
  const w = [
    kuvvetSeansi('2026-08-10', 'Barbell Bench Press', 120, 5, 1),
    kuvvetSeansi('2026-08-11', 'Barbell Row', 60, 8, 1),
  ];
  const r = buildStrengthBalance(w, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.ratios.length, 0);
});

/* --- Tutarlılık ve plan uyumu --- */

const seans = (date) => ({ date, exercises: [{ sets: [{}, {}, {}] }] });

test('seri hafta biriminde sayılır, içinde bulunulan hafta kırmaz', () => {
  // 16 Ağustos 2026 pazar. Önceki üç hafta dolu, bu hafta boş.
  const w = ['2026-07-28', '2026-08-04', '2026-08-11'].map(seans);
  const c = buildConsistency(w, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(c.currentStreak, 3);
  assert.ok(c.longestStreak >= 3);
});

test('ortalama gün, kayıt başlamadan önceki haftaları saymaz', () => {
  // Beş haftalık geçmiş, her hafta iki gün. Pencere 12 hafta olsa da ortalama
  // 2 çıkmalı; kullanıcının uygulamayı kullanmadığı haftalar devamsızlık değil.
  const w = ['2026-07-14', '2026-07-16', '2026-07-21', '2026-07-23',
    '2026-07-28', '2026-07-30', '2026-08-04', '2026-08-06'].map(seans);
  const c = buildConsistency(w, { today: new Date('2026-08-16T12:00:00'), weeks: 12 });
  assert.equal(c.averageDaysPerWeek, 2);
});

test('arada boş hafta seriyi kırar', () => {
  const w = ['2026-07-21', '2026-08-04', '2026-08-11'].map(seans);
  const c = buildConsistency(w, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(c.currentStreak, 2);
});

test('plan uyumu gün eşleşmesine değil hafta içi sayıya bakar', () => {
  // Plan 3 gün; hafta içinde farklı günlerde 3 antrenman yapılmış.
  const w = ['2026-08-04', '2026-08-06', '2026-08-08'].map(seans);
  const a = buildAdherence(w, { trainingDays: 3 }, { today: new Date('2026-08-16T12:00:00'), weeks: 2 });
  const hafta = a.weeks.find(x => !x.isCurrent);
  assert.equal(hafta.done, 3);
  assert.equal(hafta.rate, 1);
});

test('fazla antrenman uyumu yüzde yüzün üstüne çıkarmaz', () => {
  const w = ['2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07'].map(seans);
  const a = buildAdherence(w, { trainingDays: 3 }, { today: new Date('2026-08-16T12:00:00'), weeks: 2 });
  assert.equal(a.weeks.find(x => !x.isCurrent).rate, 1);
});

/* --- Veri sağlığı --- */

test('aykırı ağırlık ve tekrar yakalanır', () => {
  const w = [{
    id: 'w1', date: '2026-08-10', name: 'Üst',
    exercises: [{ name: 'Barbell Bench Press', sets: [{ weight: '1000', reps: '8', setType: 'normal' }] }],
  }];
  const r = auditWorkoutData(w);
  assert.equal(r.criticalCount, 1);
  assert.equal(r.findings[0].kind, 'weightOutlier');
});

test('yarım kalmış set bildirilir, temiz kayıt bildirilmez', () => {
  const eksik = auditWorkoutData([{
    id: 'w1', date: '2026-08-10',
    exercises: [{ name: 'Leg Press', sets: [{ weight: '200', reps: '', setType: 'normal' }] }],
  }]);
  assert.ok(eksik.findings.some(f => f.kind === 'zeroReps'));

  const temiz = auditWorkoutData([{
    id: 'w2', date: '2026-08-11',
    exercises: [{ name: 'Leg Press', sets: [{ weight: '200', reps: '10', setType: 'normal' }] }],
  }]);
  assert.equal(temiz.hasIssues, false);
});

test('boş kayıt silme idempotent', () => {
  const w = [
    { id: 'a', date: '2026-08-10', exercises: [] },
    { id: 'b', date: '2026-08-11', exercises: [{ name: 'X', sets: [{ weight: '50', reps: '10' }] }] },
  ];
  const bir = removeEmptyWorkouts(w);
  assert.equal(bir.removed, 1);
  assert.equal(bir.workouts.length, 1);
  const iki = removeEmptyWorkouts(bir.workouts);
  assert.equal(iki.removed, 0);
  assert.equal(iki.workouts.length, 1);
});

/* --- Hareket bazlı tekrar aralığı --- */

test('tekrar aralığı özel -> kas -> genel sırasıyla düşer', () => {
  const genel = { globalMin: 6, globalMax: 10 };
  // Kas varsayılanı: yan omuz yüksek tekrar.
  const yanOmuz = repRangeFor('Lateral Raise (Dumbbell)', genel);
  assert.equal(yanOmuz.source, 'muscle');
  assert.equal(yanOmuz.min, 12);
  assert.equal(yanOmuz.max, 20);

  // Kullanıcının yazdığı aralık kas varsayılanını geçer.
  const ozel = repRangeFor('Lateral Raise (Dumbbell)', {
    ...genel, overrides: { 'Lateral Raise (Dumbbell)': { min: 8, max: 12 } },
  });
  assert.equal(ozel.source, 'exercise');
  assert.equal(ozel.min, 8);
});

test('geçersiz aralık kaydı silinir ve sıralama düzeltilir', () => {
  let o = setRepRangeOverride({}, 'Barbell Back Squat', 12, 5);
  // min > max verilirse max min'e çekilir, ters kayıt yazılmaz.
  assert.ok(o['Barbell Back Squat'].max >= o['Barbell Back Squat'].min);
  o = setRepRangeOverride(o, 'Barbell Back Squat', '', '');
  assert.equal(o['Barbell Back Squat'], undefined);
});

/* --- Şablonda süperset --- */

test('taslak süperset bayrağı şablonda paylaşılan kimliğe dönüşür', () => {
  let gun = {
    uid: 'g1', name: 'Üst', weekday: 'mon',
    exercises: [
      { uid: 'a', name: 'Barbell Bench Press', sets: 3 },
      { uid: 'b', name: 'Barbell Row', sets: 3 },
      { uid: 'c', name: 'Lateral Raise (Dumbbell)', sets: 3 },
    ],
  };
  gun = toggleDraftSuperset(gun, 'a');
  let n = 0;
  const kurulum = instantiateDraftProgram('Test', [gun], () => `id-${n += 1}`);
  const [x, y, z] = kurulum.templates[0].exercises;
  assert.ok(x.supersetId);
  assert.equal(x.supersetId, y.supersetId);
  assert.equal(z.supersetId, null);

  // Son hareket bağlanamaz: bağlanacak bir sonraki yok.
  assert.equal(toggleDraftSuperset(gun, 'c').exercises[2].superset, undefined);
});



/* --- Koç hafızası --- */

const kocMadde = (key, priority = 2) => ({ key, priority, title: key, detail: '' });

test('ertelenen madde süresi dolana kadar gizlenir', () => {
  const m = snoozeCoachItem(emptyCoachMemory(), 'sleep', '2026-08-10');
  const icinde = applyCoachMemory([kocMadde('sleep')], m, '2026-08-14');
  assert.equal(icinde.items.length, 0);
  assert.equal(icinde.suppressed[0].hiddenBy, 'snoozed');
  // Süre dolunca geri geliyor.
  const sonra = applyCoachMemory([kocMadde('sleep')], m, '2026-08-18');
  assert.equal(sonra.items.length, 1);
});

test('kapatılan madde geri açılana kadar gizli kalır', () => {
  let m = dismissCoachItem(emptyCoachMemory(), 'metric');
  assert.equal(applyCoachMemory([kocMadde('metric')], m, '2027-01-01').items.length, 0);
  m = restoreCoachItem(m, 'metric');
  assert.equal(applyCoachMemory([kocMadde('metric')], m, '2027-01-01').items.length, 1);
});

test('deload görünürken hacim ve rekor maddeleri susturulur', () => {
  const r = applyCoachMemory(
    [kocMadde('deload-running'), kocMadde('volume-low'), kocMadde('pr-watch'), kocMadde('sleep')],
    emptyCoachMemory(), '2026-08-16');
  const kalan = r.items.map(i => i.key);
  assert.ok(kalan.includes('deload-running'));
  assert.ok(kalan.includes('sleep'));
  assert.ok(!kalan.includes('volume-low'));
  assert.ok(!kalan.includes('pr-watch'));
  assert.equal(r.conflictCount, 2);
  // Susturma sebebi taşınmalı; sessiz eleme kullanıcıya kayıp gibi görünürdü.
  assert.ok(r.suppressed.every(x => x.hiddenReason));
});

test('kazanan madde yoksa çelişki kuralı çalışmaz', () => {
  const r = applyCoachMemory([kocMadde('volume-low'), kocMadde('pr-watch')], emptyCoachMemory(), '2026-08-16');
  assert.equal(r.items.length, 2);
  assert.equal(r.conflictCount, 0);
});

/* --- Hafta sonu projeksiyonu --- */

const sablon = (id, ad, sets) => ({
  id, name: ad,
  exercises: [{ name: ad, sets: Array.from({ length: sets }, () => ({ setType: 'normal' })) }],
});

const planSonuc = (gunler) => ({
  days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(key => ({
    key,
    workouts: gunler[key] ? [{ template: gunler[key] }] : [],
  })),
});

test('kalan planlı günler eşiği kapatıyorsa uyarı çıkmaz', () => {
  const bacak = sablon('t1', 'Barbell Back Squat', 10);
  // Çarşamba: bacak henüz çalışılmadı ama cuma planlı.
  const p = buildWeekProjection({}, planSonuc({ fri: bacak }), [bacak], {
    today: new Date('2026-08-12T12:00:00'),
  });
  const quad = p.rows.find(r => r.muscle === 'Quadriceps');
  assert.equal(quad.planned, 10);
  assert.equal(quad.status, 'onTrack');
  assert.equal(projectionCoachItem(p), null);
});

test('programın hiç çalıştırmadığı kas risk sayılmaz', () => {
  // Program sadece bacak çalıştırıyor; göğüs bir hafta sapması değil, program
  // tercihi. Bu ayrım olmadan projeksiyon her hafta on dört kası birden
  // "risk altında" diye bildiriyordu.
  const bacak = sablon('t9', 'Barbell Back Squat', 10);
  const p = buildWeekProjection({}, planSonuc({ fri: bacak }), [bacak], {
    today: new Date('2026-08-12T12:00:00'),
  });
  assert.equal(p.rows.find(r => r.muscle === 'Göğüs').status, 'untrained');
  assert.equal(p.atRisk.length, 0);
  assert.equal(projectionCoachItem(p), null);
});

test('kalan günlerle bile kapanmıyorsa risk bildirilir', () => {
  const az = sablon('t2', 'Barbell Back Squat', 2);
  const p = buildWeekProjection({}, planSonuc({ fri: az }), [az], {
    today: new Date('2026-08-12T12:00:00'),
  });
  const quad = p.rows.find(r => r.muscle === 'Quadriceps');
  assert.equal(quad.status, 'atRisk');
  assert.ok(quad.gap > 0);
  assert.match(projectionCoachItem(p).title, /eşiğin altında kalıyor/);
});

test('planlı gün kalmadıysa kaçırılmış sayılır', () => {
  const az = sablon('t3', 'Barbell Back Squat', 2);
  // Pazar: cuma geçti, kalan planlı gün yok.
  const p = buildWeekProjection({ Quadriceps: 2 }, planSonuc({ fri: az }), [az], {
    today: new Date('2026-08-16T12:00:00'),
    // Plan bitti ama kas bu hafta gerçekten çalışıldı; programın parçası.
    trainedMuscles: ['Quadriceps'],
  });
  assert.equal(p.remainingDays, 0);
  assert.ok(p.missed.some(r => r.muscle === 'Quadriceps'));
  assert.match(projectionCoachItem(p).title, /Planlı günler bitti/);
});

/* --- Rekor eşiği --- */

const prSeans = (date, ad, kg, tekrar) => ({
  date, exercises: [{ name: ad, sets: [{ weight: String(kg), reps: String(tekrar), rir: 1, setType: 'normal' }] }],
});

test('gereken tekrar Epley tersinden hesaplanır', () => {
  // 100 kg, hedef e1RM 120 -> 30*(1.2-1) = 6 tekrar.
  assert.equal(repsNeededFor(120, 100), 6);
  // Ağırlık hedefin üstündeyse tek tekrar yeter.
  assert.equal(repsNeededFor(100, 120), 1);
});

test('rekora yakın hareket somut hedefle bildirilir', () => {
  const w = [
    prSeans('2026-08-01', 'Barbell Bench Press', 120, 5),
    prSeans('2026-08-14', 'Barbell Bench Press', 120, 4),
  ];
  const r = buildPrWatch(['Barbell Bench Press'], w, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.hasData, true);
  const t = r.targets[0];
  assert.ok(t.closeness >= 92);
  assert.ok(t.options.length > 0);
  assert.ok(t.options[0].reps >= 5);
  assert.match(prWatchCoachItem(r).detail, /tekrar yaparsan geçersin/);
});

test('rekordan uzak hareket gösterilmez', () => {
  const w = [
    prSeans('2026-08-01', 'Barbell Bench Press', 140, 5),
    prSeans('2026-08-14', 'Barbell Bench Press', 90, 5),
  ];
  const r = buildPrWatch(['Barbell Bench Press'], w, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.hasData, false);
});

/* --- RIR kalibrasyonu --- */

const rirSeans = (ciftler) => ({
  date: '2026-08-10',
  exercises: ciftler.map((c, i) => ({
    name: `Hareket ${i}`,
    sets: [
      { weight: '100', reps: String(c.ilk), rir: c.rir, setType: 'normal' },
      { weight: '100', reps: String(c.ikinci), rir: 1, setType: 'normal' },
    ],
  })),
});

test('yetersiz çiftte kalibrasyon hesaplanmaz', () => {
  const r = buildRirCalibration([rirSeans([{ ilk: 10, ikinci: 9, rir: 3 }])]);
  assert.equal(r.hasData, false);
  assert.equal(r.verdict, 'unknown');
});

test('sert tekrar kaybı yedeğin abartıldığını gösterir', () => {
  // RIR 3 bildirilmiş ama ikinci sette 4 tekrar kaybı var: beklenen 1.
  const ciftler = Array.from({ length: 10 }, () => ({ ilk: 10, ikinci: 6, rir: 3 }));
  const r = buildRirCalibration([rirSeans(ciftler)]);
  assert.equal(r.hasData, true);
  assert.equal(r.verdict, 'overestimating');
  assert.ok(r.bias > 0);
  assert.ok(rirCoachItem(r));
});

test('beklenen düşüşe uyan setler tutarlı sayılır', () => {
  const ciftler = Array.from({ length: 10 }, () => ({ ilk: 10, ikinci: 9, rir: 3 }));
  const r = buildRirCalibration([rirSeans(ciftler)]);
  assert.equal(r.verdict, 'calibrated');
  assert.equal(rirCoachItem(r), null);
});

test('farklı ağırlıklı ardışık setler kalibrasyona girmez', () => {
  const w = [{
    date: '2026-08-10',
    exercises: [{
      name: 'Barbell Bench Press',
      sets: Array.from({ length: 20 }, (_, i) => ({
        weight: String(100 + i), reps: '8', rir: 3, setType: 'normal',
      })),
    }],
  }];
  assert.equal(buildRirCalibration(w).hasData, false);
});

/* --- Seans kalitesi --- */

const kaliteHareket = (ad, sets) => ({
  name: ad, sets: Array.from({ length: sets }, () => ({ setType: 'normal', reps: '8', weight: '50' })),
});

test('bileşke izolasyonlardan sonra geliyorsa sıra uyarısı çıkar', () => {
  const r = auditSessionQuality([
    kaliteHareket('Lateral Raise (Dumbbell)', 3),
    kaliteHareket('Leg Extension', 3),
    kaliteHareket('Cable Crunch', 3),
    kaliteHareket('Barbell Back Squat', 4),
  ]);
  const bulgu = r.findings.find(f => f.exercise === 'Barbell Back Squat');
  assert.ok(bulgu);
  assert.equal(bulgu.severity, 'medium');
  assert.ok(sessionQualityCoachItem(r));
});

test('doğru sıralanmış seans uyarı üretmez', () => {
  const r = auditSessionQuality([
    kaliteHareket('Barbell Back Squat', 4),
    kaliteHareket('Romanian Deadlift (RDL)', 3),
    kaliteHareket('Leg Extension', 3),
    kaliteHareket('Lateral Raise (Dumbbell)', 3),
  ]);
  assert.equal(r.clean, true);
  assert.equal(sessionQualityCoachItem(r), null);
});

test('süre verimliliği set başına dakikadan okunur', () => {
  const hareketler = [kaliteHareket('Barbell Back Squat', 10)];
  assert.equal(auditSessionQuality(hareketler, { durationMinutes: 30 }).efficiency.pace, 'ok');
  assert.equal(auditSessionQuality(hareketler, { durationMinutes: 90 }).efficiency.pace, 'slow');
  assert.equal(auditSessionQuality(hareketler, { durationMinutes: 12 }).efficiency.pace, 'fast');
  // Süre yoksa verimlilik hesaplanmıyor; uydurmak yerine susuyor.
  assert.equal(auditSessionQuality(hareketler).efficiency, null);
});



/* --- Nabız bölgeleri --- */

test('maksimum nabız Tanaka formülünden çıkar', () => {
  assert.equal(estimateMaxHr(30), 187);
  assert.equal(estimateMaxHr(50), 173);
  assert.equal(estimateMaxHr(0), null);
});

test('ölçülen nabız bölge tahminini ezer', () => {
  // Yürüyüş normalde zone 1; nabız 170 girilirse ölçüm kazanmalı.
  const tahmin = zoneForEntry({ type: 'walk', effort: 'moderate' }, { age: 30 });
  assert.equal(tahmin.zone.key, 'z1');
  assert.equal(tahmin.source, 'estimate');

  const olcum = zoneForEntry({ type: 'walk', effort: 'moderate', avgHeartRate: 170 }, { age: 30 });
  assert.equal(olcum.source, 'heartRate');
  assert.ok(['z4', 'z5'].includes(olcum.zone.key));
});

test('tempo seçimi bölgeyi kaydırır', () => {
  const rahat = zoneForEntry({ type: 'run', effort: 'easy' });
  const sert = zoneForEntry({ type: 'run', effort: 'hard' });
  assert.ok(HR_ZONES.indexOf(rahat.zone) < HR_ZONES.indexOf(sert.zone));
  // HIIT her koşulda yüksek şiddet sınıfında kalmalı.
  assert.equal(intensityClassOf(zoneForEntry({ type: 'hiit', effort: 'easy' }).zone.key).key, 'high');
});

test('tempo mesafe ve süreden hesaplanır, yüzmede 100 m üzerinden', () => {
  assert.equal(entryPace({ type: 'run', minutes: 50, distanceKm: 10 }).label, '5:00 /km');
  assert.equal(entryPace({ type: 'swim', minutes: 30, distanceKm: 1.5 }).label, '2:00 /100 m');
  // Mesafe yoksa tempo yok; uydurulmuyor.
  assert.equal(entryPace({ type: 'run', minutes: 50 }), null);
  assert.equal(supportsDistance('run'), true);
  assert.equal(supportsDistance('hiit'), false);
});

test('tempo eğilimi yalnızca aynı şiddet sınıfını karşılaştırır', () => {
  const w = [
    { date: '2026-08-01', cardio: [{ type: 'run', minutes: 55, distanceKm: 10, effort: 'moderate' }] },
    { date: '2026-08-10', cardio: [{ type: 'run', minutes: 50, distanceKm: 10, effort: 'moderate' }] },
  ];
  const t = paceTrend(w, 'run');
  assert.equal(t.hasData, true);
  // Tempoda düşüş iyileşme demek: aynı mesafe daha kısa sürede.
  assert.equal(t.direction, 'improving');
  assert.ok(t.deltaMinutes < 0);
});

/* --- Kardiyo hedefleri ve koçu --- */

const kardiyoGun = (date, girisler) => ({ date, cardio: girisler });
const PZT = '2026-08-10';
const CAR = '2026-08-12';

test('hedef yokken kardiyo koçu susar', () => {
  const r = buildCardioReport([kardiyoGun(PZT, [{ type: 'run', minutes: 40, effort: 'moderate' }])],
    { preset: 'off' }, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.active, false);
  assert.equal(cardioCoachItem(r, null), null);
});

test('düşük şiddet eksikse kalan dakika bildirilir', () => {
  const r = buildCardioReport([kardiyoGun(PZT, [{ type: 'walk', minutes: 30, effort: 'moderate' }])],
    { preset: 'health' }, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.active, true);
  assert.equal(r.minutes.low, 30);
  const bulgu = r.findings.find(f => f.key === 'lowShort');
  assert.ok(bulgu);
  assert.match(bulgu.title, /30\/150/);
});

test('yüksek şiddet hedefi aşılırsa uyarı çıkar', () => {
  const w = [
    kardiyoGun(PZT, [{ type: 'hiit', minutes: 20, effort: 'moderate' }]),
    kardiyoGun(CAR, [{ type: 'interval', minutes: 25, effort: 'hard' }]),
    kardiyoGun('2026-08-14', [{ type: 'hiit', minutes: 20, effort: 'moderate' }]),
  ];
  const r = buildCardioReport(w, { preset: 'hypertrophy' }, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.highSessions, 3);
  const bulgu = r.findings.find(f => f.key === 'highOver');
  assert.ok(bulgu);
  assert.equal(bulgu.severity, 'warn');
});

test('kısa yüksek şiddet bloğu seans sayılmaz', () => {
  const r = buildCardioReport([kardiyoGun(PZT, [{ type: 'hiit', minutes: 5, effort: 'moderate' }])],
    { preset: 'health' }, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.highSessions, 0);
});

test('orta bölge tuzağı yakalanır', () => {
  const r = buildCardioReport([kardiyoGun(PZT, [{ type: 'run', minutes: 60, effort: 'moderate' }])],
    { preset: 'health' }, { today: new Date('2026-08-16T12:00:00') });
  assert.ok(r.findings.some(f => f.key === 'middleTrap'));
});

test('yüksek şiddet bacak gününe denk gelirse yerleşim uyarısı çıkar', () => {
  // 10 Ağustos 2026 pazartesi; plan pazartesiyi bacak günü yapıyor.
  const plan = { days: [{ key: 'mon', byMuscle: { Quadriceps: 12 } }] };
  const r = buildCardioReport([kardiyoGun(PZT, [{ type: 'hiit', minutes: 20, effort: 'moderate' }])],
    { preset: 'health' }, { today: new Date('2026-08-16T12:00:00'), planResult: plan });
  const bulgu = r.findings.find(f => f.key === 'placement');
  assert.ok(bulgu);
  assert.equal(bulgu.severity, 'warn');
  // Uyarı varken koç satırı dengesizliği söylemeli, yeni seans önermemeli.
  const oneri = cardioSuggestionForToday(r);
  assert.equal(cardioCoachItem(r, oneri).key, 'cardio-balance');
});

test('bacak gününde yüksek şiddet önerilmez, düşük şiddet önerilir', () => {
  const r = buildCardioReport([], { preset: 'health' }, { today: new Date('2026-08-16T12:00:00') });
  const bacakGunu = cardioSuggestionForToday(r, { planDay: { byMuscle: { Quadriceps: 12 } } });
  assert.equal(bacakGunu.kind, 'low');
  const normalGun = cardioSuggestionForToday(r, { planDay: { byMuscle: { 'Göğüs': 12 } } });
  assert.equal(normalGun.kind, 'high');
});

test('hedef tamamlandığında ekleme baskısı yapılmaz', () => {
  const w = [
    kardiyoGun(PZT, [{ type: 'walk', minutes: 90, effort: 'moderate' }]),
    kardiyoGun(CAR, [{ type: 'walk', minutes: 70, effort: 'moderate' }]),
    kardiyoGun('2026-08-13', [{ type: 'hiit', minutes: 20, effort: 'moderate' }]),
  ];
  const r = buildCardioReport(w, { preset: 'health' }, { today: new Date('2026-08-16T12:00:00') });
  const oneri = cardioSuggestionForToday(r);
  assert.equal(oneri.kind, 'done');
  assert.equal(cardioCoachItem(r, oneri), null);
});

/* --- Dinlenme uyarısı --- */

test('uyarı şiddeti tekrar ve ses seviyesini yükseltir', () => {
  const hafif = findRestAlertIntensity('soft');
  const belirgin = findRestAlertIntensity('strong');
  const israrci = findRestAlertIntensity('insistent');
  assert.ok(belirgin.repeats > hafif.repeats);
  assert.ok(israrci.repeats > belirgin.repeats);
  assert.ok(belirgin.gain > hafif.gain);
  // Bilinmeyen anahtar varsayılana düşmeli, çökmemeli.
  assert.equal(findRestAlertIntensity('yok').key, 'strong');
});



/* --- Karvonen (%HRR) yöntemi --- */

test('Karvonen sınırları maks yöntemine göre yukarı kayar', () => {
  const maks = zoneRange('z2', { age: 30, method: 'max' });
  const karvonen = zoneRange('z2', { age: 30, restingHr: 55, method: 'hrr' });
  assert.ok(karvonen.min > maks.min);
  assert.ok(karvonen.max > maks.max);
  // Karvonen alt sınırı dinlenme nabzının üstünde olmalı.
  assert.ok(karvonen.min > 55);
});

test('dinlenme nabzı yoksa Karvonen sessizce maks yöntemine düşer', () => {
  assert.equal(effectiveZoneMethod({ age: 30, method: 'hrr' }), 'max');
  assert.equal(effectiveZoneMethod({ age: 30, restingHr: 55, method: 'hrr' }), 'hrr');
  // Dinlenme nabzı maksimumdan büyükse de geçersiz sayılmalı.
  assert.equal(effectiveZoneMethod({ age: 30, restingHr: 250, method: 'hrr' }), 'max');
  const a = zoneRange('z2', { age: 30, method: 'hrr' });
  const b = zoneRange('z2', { age: 30, method: 'max' });
  assert.deepEqual(a, b);
});

test('aynı nabız iki yöntemde farklı bölgeye düşebilir', () => {
  assert.equal(zoneForHeartRate(140, { age: 30, method: 'max' }).key, 'z3');
  assert.equal(zoneForHeartRate(140, { age: 30, restingHr: 55, method: 'hrr' }).key, 'z2');
});

/* --- Nabızdan kalori --- */

test('nabız girilince kalori Keytel denkleminden hesaplanır', () => {
  const r = cardioCalories({ avgHeartRate: 150, minutes: 45 },
    { weightKg: 80, age: 30, metCalories: 400 });
  assert.equal(r.source, 'heartRate');
  assert.ok(r.kcal > 400);
});

test('nabız yoksa ya da güvenilmezse MET hesabına dönülür', () => {
  assert.equal(cardioCalories({ minutes: 45 }, { weightKg: 80, age: 30, metCalories: 400 }).source, 'met');
  // Dinlenmeye yakın nabızda formül güvenilmez; MET kullanılmalı.
  assert.equal(cardioCalories({ avgHeartRate: 70, minutes: 45 },
    { weightKg: 80, age: 30, metCalories: 400 }).source, 'met');
  // Kilo ya da yaş yoksa da tahmin yapılmıyor.
  assert.equal(heartRateCalories({ avgHeartRate: 150, minutes: 45, weightKg: 80 }), null);
});

/* --- Aktivite seans hedefleri --- */

test('boş hedef kaydedilmez, dolu hedef kaydedilir', () => {
  let t = setActivityTarget({}, 'swim', emptyActivityTarget());
  assert.equal(t.swim, undefined);
  t = setActivityTarget(t, 'swim', { sets: 8, setDistance: 100, minutes: 40 });
  assert.ok(t.swim);
  // Tamamen boşaltmak kaydı siler.
  t = setActivityTarget(t, 'swim', emptyActivityTarget());
  assert.equal(t.swim, undefined);
});

test('set ve mesafe birlikte tek ifadede birleşir', () => {
  assert.equal(describeTarget({ sets: 8, setDistance: 100 }, 'swim'), '8 × 100 m');
  assert.equal(describeTarget({ sets: 5 }, 'run'), '5 set');
  // Yüzmede toplam mesafe metre olarak okunaklı.
  assert.match(describeTarget({ distanceKm: 1.5 }, 'swim'), /1500 m toplam/);
  assert.match(describeTarget({ distanceKm: 10 }, 'run'), /10 km/);
});

test('karşılaştırma yalnızca dolu hedef alanlarına bakar', () => {
  const k = compareToTarget({ type: 'swim', minutes: 40, distanceKm: 0.8 },
    { sets: 8, setDistance: 100, minutes: 40 });
  const sure = k.rows.find(r => r.label === 'Süre');
  assert.equal(sure.status, 'met');
  // 8 × 100 = 800 m hedefi tam tutmuş.
  const mesafe = k.rows.find(r => r.label === 'Toplam mesafe');
  assert.equal(mesafe.status, 'met');
  assert.equal(k.met, true);
});

test('hedefin altında kalmak eksik olarak işaretlenir ama tolerans vardır', () => {
  // %5 tolerans: 29 dakika 30 dakikalık hedefte "met" sayılmalı.
  assert.equal(compareToTarget({ minutes: 29 }, { minutes: 30 }).rows[0].status, 'met');
  assert.equal(compareToTarget({ minutes: 20 }, { minutes: 30 }).rows[0].status, 'under');
  // Hedef yoksa karşılaştırma da yok.
  assert.equal(compareToTarget({ minutes: 30 }, emptyActivityTarget()), null);
});

/* --- Vücut ağırlığı alanının açıklaması --- */

test('ek yük biçiminde taban ve toplam ayrı ayrı çıkar', () => {
  const d = describeSetLoad('Pull-up', 10, { bodyWeightKg: 82, entryStyle: 'added' });
  assert.equal(d.style, 'added');
  assert.equal(d.carried, 82);
  assert.equal(d.added, 10);
  assert.equal(d.total, 92);
  assert.match(d.explain, /82 kg vücut ağırlığı \+ 10 kg ek yük = 92 kg/);
});

test('kısmi vücut ağırlığı taşıyan harekette oran uygulanır', () => {
  const d = describeSetLoad('Push-ups', 0, { bodyWeightKg: 82, entryStyle: 'added' });
  assert.ok(d.carried > 0 && d.carried < 82);
  assert.equal(d.added, 0);
  assert.match(d.label, /%\d+/);
});

test('toplam yazım biçiminde vücut ağırlığı ikinci kez eklenmez', () => {
  const d = describeSetLoad('Pull-up', 92, { bodyWeightKg: 82, entryStyle: 'auto' });
  assert.equal(d.style, 'total');
  assert.equal(d.total, 92);
});

test('vücut ağırlıklı olmayan harekette alan olduğu gibi kalır', () => {
  const d = describeSetLoad('Barbell Bench Press', 100, { bodyWeightKg: 82 });
  assert.equal(d.style, 'plain');
  assert.equal(d.total, 100);
  assert.equal(d.carried, 0);
});

test('taban önce seansın kendi kaydından okunur', () => {
  // Ölçüm geçmişi sonradan düzenlense bile geçmiş seansın yükü değişmemeli.
  assert.deepEqual(bodyweightBasisFor({ weightAtTime: 79 }, 82),
    { kg: 79, source: 'workout', label: 'seans kaydından' });
  assert.equal(bodyweightBasisFor({}, 82).source, 'metrics');
  assert.equal(bodyweightBasisFor({}, 0).source, 'none');
});



/* --- Kuvvet standartları --- */

// RIR 0: tahmini 1RM tam olarak kaldırılan ağırlığa eşit olsun. RIR 1 verilseydi
// formül yedek tekrarı da hesaba katıp oranı kaydırırdı.
const stdSeans = (date, ad, kg, tekrar, adet = 3) => ({
  date,
  exercises: [{ name: ad, sets: Array.from({ length: adet }, () => ({ weight: String(kg), reps: String(tekrar), rir: 0, setType: 'normal' })) }],
});

test('standart vücut ağırlığının katı olarak okunur', () => {
  const r = buildStrengthStandards([stdSeans('2026-08-10', 'Barbell Back Squat', 140, 1)],
    { bodyWeightKg: 80, gender: 'male', today: new Date('2026-08-16T12:00:00') });
  const squat = r.rows.find(x => x.key === 'squat');
  assert.ok(squat);
  // Beklenen oran formülden türetiliyor; burada 1RM formülünü ikinci kez
  // yazmak, formül değiştiğinde sessizce yanlış kalan bir test üretirdi.
  const beklenen = Math.round((estimate1RM(140, 1, 0) / 80) * 100) / 100;
  assert.equal(squat.ratio, beklenen);
  assert.equal(squat.level.key, 'intermediate');
  assert.ok(squat.kgToNext > 0);
  // Eşikler kilo cinsine çevriliyor: orta seviye 80 kg vücutta 1.75 x 80.
  assert.equal(squat.thresholds[2], 140);
});

test('cinsiyete göre farklı tablo kullanılır', () => {
  const w = [stdSeans('2026-08-10', 'Barbell Bench Press', 60, 1)];
  const erkek = buildStrengthStandards(w, { bodyWeightKg: 60, gender: 'male', today: new Date('2026-08-16T12:00:00') });
  const kadin = buildStrengthStandards(w, { bodyWeightKg: 60, gender: 'female', today: new Date('2026-08-16T12:00:00') });
  const e = erkek.rows.find(x => x.key === 'bench');
  const k = kadin.rows.find(x => x.key === 'bench');
  // Aynı oran (1.0x), kadın tablosunda daha yüksek seviyeye denk geliyor.
  assert.equal(e.ratio, k.ratio);
  assert.ok(STRENGTH_LEVELS.findIndex(l => l.key === k.level.key)
    > STRENGTH_LEVELS.findIndex(l => l.key === e.level.key));
});

test('vücut ağırlığı yoksa standart hesaplanmaz', () => {
  const r = buildStrengthStandards([stdSeans('2026-08-10', 'Barbell Back Squat', 140, 1)], { bodyWeightKg: 0 });
  assert.equal(r.missingWeight, true);
  assert.equal(r.rows.length, 0);
});

test('yalnızca belirgin dengesizlikte koç satırı çıkar', () => {
  const dengeli = buildStrengthStandards([
    stdSeans('2026-08-10', 'Barbell Back Squat', 140, 1),
    stdSeans('2026-08-11', 'Barbell Bench Press', 100, 1),
  ], { bodyWeightKg: 80, today: new Date('2026-08-16T12:00:00') });
  assert.equal(strengthStandardCoachItem(dengeli), null);

  const dengesiz = buildStrengthStandards([
    stdSeans('2026-08-10', 'Barbell Back Squat', 200, 1),
    stdSeans('2026-08-11', 'Overhead Press (OHP)', 25, 1),
  ], { bodyWeightKg: 80, today: new Date('2026-08-16T12:00:00') });
  assert.ok(strengthStandardCoachItem(dengesiz));
  // Eşiğin bile altında kalan hareket en zayıf olarak seçilmeli; hesaptan
  // düşürülürse en dengesiz durum hiç görünmüyor.
  assert.equal(dengesiz.overall.weakest.key, 'ohp');
  assert.equal(dengesiz.overall.weakest.level, null);
  assert.ok(dengesiz.overall.spread >= 2);
});

/* --- Şiddet dağılımı --- */

const rirSet = (rir) => ({ weight: '100', reps: '8', rir, setType: 'normal' });
const rirGun = (date, rirler) => ({
  date, exercises: [{ name: 'Barbell Bench Press', sets: rirler.map(rirSet) }],
});

test('yetersiz set sayısında dağılım yorumlanmaz', () => {
  const r = buildEffortDistribution([rirGun('2026-08-14', [2, 2, 2])],
    { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.hasData, false);
  assert.equal(r.findings.length, 0);
});

test('hep başarısızlığa giden dağılım uyarı üretir', () => {
  const r = buildEffortDistribution([rirGun('2026-08-14', Array(20).fill(0))],
    { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.hasData, true);
  assert.ok(r.findings.some(f => f.key === 'tooHard'));
  assert.ok(effortCoachItem(r));
});

test('hep RIR 4+ dağılımı da uyarı üretir', () => {
  const r = buildEffortDistribution([rirGun('2026-08-14', Array(20).fill(5))],
    { today: new Date('2026-08-16T12:00:00') });
  assert.ok(r.findings.some(f => f.key === 'tooEasy'));
});

test('verimli bantta yoğunlaşan dağılım temiz çıkar', () => {
  const r = buildEffortDistribution([rirGun('2026-08-14', Array(20).fill(2))],
    { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.findings.length, 0);
  assert.equal(effortCoachItem(r), null);
});

test('RIR girilmemiş setler dağılıma katılmaz', () => {
  const w = [{
    date: '2026-08-14',
    exercises: [{ name: 'Barbell Bench Press', sets: Array(20).fill({ weight: '100', reps: '8', rir: '', setType: 'normal' }) }],
  }];
  const r = buildEffortDistribution(w, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.total, 0);
  assert.equal(r.withoutRir, 20);
});

/* --- Hareket rotasyonu --- */

const rotSeans = (date, kg) => ({
  date, exercises: [{ name: 'Barbell Bench Press', sets: [{ weight: String(kg), reps: '5', rir: 1, setType: 'normal' }] }],
});

test('eski ve durmuş hareket rotasyon adayı olur', () => {
  // 20 hafta önce başlamış, son seanslarda ilerleme yok.
  const w = [];
  for (let i = 0; i < 10; i += 1) {
    const d = new Date('2026-08-14T12:00:00');
    d.setDate(d.getDate() - i * 14);
    w.push(rotSeans(d.toISOString().slice(0, 10), 100));
  }
  const r = buildRotationReport(w, { today: new Date('2026-08-16T12:00:00') });
  const satir = r.rows.find(x => x.name === 'Barbell Bench Press');
  assert.ok(satir.weeks >= 16);
  assert.equal(satir.status, 'stalled');
  assert.equal(satir.rotationCandidate, true);
  assert.ok(rotationCoachItem(r));
});

test('ilerleyen hareket eski olsa da aday değil', () => {
  const w = [];
  for (let i = 0; i < 10; i += 1) {
    const d = new Date('2026-08-14T12:00:00');
    d.setDate(d.getDate() - i * 14);
    // En yeni en ağır: seri yeniden eskiye kuruluyor.
    w.push(rotSeans(d.toISOString().slice(0, 10), 130 - i * 3));
  }
  const r = buildRotationReport(w, { today: new Date('2026-08-16T12:00:00') });
  const satir = r.rows.find(x => x.name === 'Barbell Bench Press');
  assert.equal(satir.status, 'progressing');
  assert.equal(satir.rotationCandidate, false);
  assert.equal(rotationCoachItem(r), null);
});

test('yeni hareket durmuş olsa da aday değil', () => {
  const w = ['2026-08-01', '2026-08-04', '2026-08-07', '2026-08-10', '2026-08-13', '2026-08-15']
    .map(d => rotSeans(d, 100));
  const r = buildRotationReport(w, { today: new Date('2026-08-16T12:00:00') });
  const satir = r.rows.find(x => x.name === 'Barbell Bench Press');
  assert.ok(satir.weeks < 16);
  assert.equal(satir.rotationCandidate, false);
});

/* --- Vücut oranları --- */

const olcum = (m) => ({ date: '2026-08-15', measurements: m });

test('oran hesaplanır ve banda göre konumlanır', () => {
  const r = buildBodyRatios(olcum({ shoulder: 126, waist: 84, chest: 108, arm: 40, wrist: 18, calf: 39, thigh: 62 }),
    { gender: 'male' });
  const omuzBel = r.rows.find(x => x.key === 'shoulderWaist');
  assert.equal(omuzBel.ratio, 1.5);
  assert.equal(omuzBel.status, 'inRange');
  const kolBilek = r.rows.find(x => x.key === 'armWrist');
  assert.equal(kolBilek.kind, 'frame');
});

test('eksik ölçüde oran üretilmez ve eksik bildirilir', () => {
  const r = buildBodyRatios(olcum({ shoulder: 126 }), { gender: 'male' });
  assert.equal(r.rows.length, 0);
  assert.ok(r.missing.includes('waist'));
});

test('önceki ölçüme göre yön hesaplanır', () => {
  const r = buildBodyRatios(
    olcum({ shoulder: 128, waist: 82 }),
    { gender: 'male', previous: olcum({ shoulder: 126, waist: 84 }) });
  const omuzBel = r.rows.find(x => x.key === 'shoulderWaist');
  assert.equal(omuzBel.direction, 'up');
  assert.ok(omuzBel.delta > 0);
});

test('yalnızca estetik oranlarda bant altı koç satırı üretir', () => {
  // Çerçeve oranı düşük ama estetik oranlar bantta: satır çıkmamalı.
  const sadeceFrame = buildBodyRatios(olcum({ shoulder: 126, waist: 84, arm: 30, wrist: 18 }), { gender: 'male' });
  assert.equal(bodyRatioCoachItem(sadeceFrame), null);

  const estetikDusuk = buildBodyRatios(olcum({ shoulder: 105, waist: 90 }), { gender: 'male' });
  assert.ok(bodyRatioCoachItem(estetikDusuk));
});

/* --- Isınma rutini --- */

test('rutin seansın kaslarından türer', () => {
  const bacak = buildWarmupRoutine([{ name: 'Barbell Back Squat', sets: 4 }]);
  const itis = buildWarmupRoutine([{ name: 'Barbell Bench Press', sets: 4 }]);
  assert.equal(bacak.hasData, true);
  assert.ok(bacak.muscles.includes('Quadriceps'));
  assert.ok(itis.muscles.includes('Göğüs'));
  // İki farklı gün aynı rutini üretmemeli.
  const metin = (r) => r.blocks.flatMap(b => b.items).join('|');
  assert.notEqual(metin(bacak), metin(itis));
});

test('boş seansta rutin üretilmez', () => {
  assert.equal(buildWarmupRoutine([]).hasData, false);
  assert.equal(buildWarmupRoutine([{ name: 'Barbell Back Squat', sets: 0 }]).hasData, false);
});

/* --- Deload dönüşü --- */

test('süre dolan deload iki haftalık dönüş planı üretir', () => {
  const deload = { active: true, startDate: '2026-08-03', days: 7, preset: 'volume' };
  const state = deloadState(deload, '2026-08-12');
  assert.equal(state.expired, true);

  const plan = buildDeloadReturn(deload, state, { today: new Date('2026-08-12T12:00:00') });
  assert.equal(plan.active, true);
  assert.equal(plan.step.key, 'week1');
  assert.equal(returnSets(10, plan), 8);
  assert.ok(deloadReturnCoachItem(plan));

  // İkinci haftada tam hacme dönülüyor.
  const ikinci = buildDeloadReturn(deload, state, { today: new Date('2026-08-19T12:00:00') });
  assert.equal(ikinci.step.key, 'week2');
  assert.equal(returnSets(10, ikinci), 10);
});

test('deload sürüyorsa ya da pencere geçtiyse plan çıkmaz', () => {
  const deload = { active: true, startDate: '2026-08-03', days: 7, preset: 'volume' };
  // Hâlâ deload içinde: expired değil.
  const suruyor = deloadState(deload, '2026-08-06');
  assert.equal(buildDeloadReturn(deload, suruyor, { today: new Date('2026-08-06T12:00:00') }).active, false);
  // İki haftalık pencere geçti.
  const state = deloadState(deload, '2026-09-05');
  assert.equal(buildDeloadReturn(deload, state, { today: new Date('2026-09-05T12:00:00') }).active, false);
});

/* --- Antrenman çevresi beslenme --- */

test('planlı seans öncesi düşük karbonhidrat uyarı üretir', () => {
  const r = buildPeriNutrition({
    macros: { carbs: 15, protein: 40, calories: 600 },
    targetProtein: 160, targetCalories: 2800,
    plannedToday: true, doneToday: false, hour: 14,
  });
  assert.ok(r.items.some(i => i.key === 'preCarb'));
  assert.ok(periNutritionCoachItem(r));
});

test('antrenman sonrası protein açığı bildirilir', () => {
  const r = buildPeriNutrition({
    macros: { carbs: 200, protein: 50, calories: 1800 },
    targetProtein: 160, targetCalories: 2800,
    plannedToday: true, doneToday: true, hour: 19,
  });
  assert.ok(r.items.some(i => i.key === 'postProtein'));
});

test('hedefler tutuyorsa uyarı çıkmaz', () => {
  const r = buildPeriNutrition({
    macros: { carbs: 250, protein: 150, calories: 2700 },
    targetProtein: 160, targetCalories: 2800,
    plannedToday: true, doneToday: true, hour: 20, mealCount: 4,
  });
  assert.equal(r.hasData, false);
  assert.equal(periNutritionCoachItem(r), null);
});



/* --- Yüzme set defteri --- */

const yuzmeDefter = [
  { reps: 1, distance: 200, stroke: 'free', kind: 'warmup', seconds: 240 },
  { reps: 8, distance: 100, stroke: 'free', kind: 'work', seconds: 95, restSeconds: 20, strokeCount: 76 },
  { reps: 4, distance: 50, stroke: 'fly', kind: 'work', seconds: 48, restSeconds: 30 },
  { reps: 1, distance: 100, stroke: 'back', kind: 'cooldown', seconds: 150 },
];

test('set defteri toplam mesafe ve süreyi çıkarır', () => {
  const o = summarizeSets(yuzmeDefter, 'swim');
  // 200 + 800 + 200 + 100
  assert.equal(o.totalDistance, 1300);
  assert.ok(o.totalMinutes > 0);
  const kayit = entryFromSets(yuzmeDefter, 'swim');
  assert.equal(kayit.distanceKm, 1.3);
  assert.equal(kayit.minutes, o.totalMinutes);
});

test('tempo yalnızca ana setlerden hesaplanır', () => {
  const o = summarizeSets(yuzmeDefter, 'swim');
  // Ana setler: 800 m serbest (95 sn/100 m) + 200 m kelebek (96 sn/100 m).
  // Isınma ve soğuma dahil edilseydi ortalama belirgin yavaşlardı.
  assert.ok(o.avgPace >= 94 && o.avgPace <= 97);
  const isinmaDahil = (240 + 760 + 192 + 150) / 1300 * 100;
  assert.ok(o.avgPace < isinmaDahil);
});

test('stil dağılımı mesafeye göre çıkar', () => {
  const o = summarizeSets(yuzmeDefter, 'swim');
  const serbest = o.byStroke.find(x => x.stroke.key === 'free');
  assert.equal(serbest.distance, 1000);
  assert.equal(serbest.share, 77);
  assert.ok(o.byStroke.some(x => x.stroke.key === 'fly'));
});

test('SWOLF havuz uzunluğuna göre hesaplanır', () => {
  const rows = [{ reps: 8, distance: 100, stroke: 'free', kind: 'work', seconds: 95, strokeCount: 76 }];
  // 25 m havuz: 100 m = 4 uzunluk -> 95/4 + 76/4 = 42.75 -> 43
  assert.equal(summarizeSets(rows, 'swim', { poolLength: 25 }).avgSwolf, 43);
  // 50 m havuzda uzunluk sayısı yarıya iner, SWOLF iki katına çıkar.
  assert.equal(summarizeSets(rows, 'swim', { poolLength: 50 }).avgSwolf, 86);
  // Kulaç girilmemişse hesaplanmıyor; uydurma bir sayı üretmiyor.
  assert.equal(summarizeSets([{ reps: 8, distance: 100, kind: 'work', seconds: 95 }], 'swim').avgSwolf, null);
});

test('kelebek ağırlıklı seans MET çarpanını yükseltir', () => {
  const serbest = summarizeSets([{ reps: 10, distance: 100, stroke: 'free', kind: 'work', seconds: 95 }], 'swim');
  const kelebek = summarizeSets([{ reps: 10, distance: 100, stroke: 'fly', kind: 'work', seconds: 95 }], 'swim');
  assert.ok(kelebek.metMultiplier > serbest.metMultiplier);
});

test('interval defteri km başına tempo verir', () => {
  const o = summarizeSets([{ reps: 6, distance: 400, kind: 'work', seconds: 85, restSeconds: 90 }], 'interval');
  // 85 sn / 400 m -> 212.5 sn/km
  assert.ok(Math.abs(o.avgPace - 212.5) < 1);
  assert.equal(o.byStroke.length, 0);
});

test('boş defter kayıt üretmez', () => {
  assert.equal(entryFromSets([], 'swim'), null);
  assert.equal(summarizeSets([{ reps: 1, distance: 0, seconds: 0 }], 'swim').hasData, false);
});

/* --- Elle maksimum nabız --- */

test('elle girilen maksimum nabız tahmini ezer', () => {
  assert.deepEqual(resolveMaxHr({ age: 30, maxHrManual: 196 }), { bpm: 196, source: 'manual' });
  assert.equal(resolveMaxHr({ age: 30 }).source, 'estimate');
  // Sınır dışı değerler yok sayılıyor: 400 gibi bir yazım hatası bütün
  // bölgeleri anlamsız yapardı.
  assert.equal(resolveMaxHr({ age: 30, maxHrManual: 400 }).source, 'estimate');
  assert.equal(resolveMaxHr({ age: 30, maxHrManual: 50 }).source, 'estimate');
  assert.equal(resolveMaxHr({}).bpm, null);
});

test('elle maksimum bölge sınırlarını kaydırır', () => {
  const tahmin = zoneRange('z2', { age: 30 });
  const elle = zoneRange('z2', { age: 30, maxHrManual: 196 });
  assert.ok(elle.min > tahmin.min && elle.max > tahmin.max);
  // Karvonen ile birlikte de çalışmalı.
  const karvonen = zoneRange('z2', { age: 30, maxHrManual: 196, restingHr: 55, method: 'hrr' });
  assert.ok(karvonen.min > elle.min);
});

/* --- Dinlenme nabzı takibi --- */

const rhrGun = (offset, bpm) => {
  const d = new Date('2026-08-16T12:00:00');
  d.setDate(d.getDate() - offset);
  return { date: d.toISOString().slice(0, 10), bpm };
};

test('taban çizgisi için yeterli ölçüm gerekiyor', () => {
  const r = buildRestingHrReport([rhrGun(0, 60), rhrGun(1, 58)], { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.hasData, true);
  assert.equal(r.baseline, null);
  assert.equal(restingHrCoachItem(r), null);
});

test('sürdürülen yükseklik uyarı üretir', () => {
  const log = [];
  for (let i = 3; i < 15; i += 1) log.push(rhrGun(i, 55));
  log.push(rhrGun(2, 62), rhrGun(1, 63), rhrGun(0, 64));
  const r = buildRestingHrReport(log, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.status, 'sustainedHigh');
  assert.ok(r.streak >= 3);
  assert.match(restingHrCoachItem(r).title, /yüksek/);
});

test('tabanın altına inen nabız fırsat olarak bildirilir', () => {
  const log = [];
  for (let i = 1; i < 15; i += 1) log.push(rhrGun(i, 60));
  log.push(rhrGun(0, 52));
  const r = buildRestingHrReport(log, { today: new Date('2026-08-16T12:00:00') });
  assert.equal(r.status, 'low');
  assert.match(restingHrCoachItem(r).title, /tabanın altında/);
});

test('taban son ölçümü dışarıda bırakır', () => {
  const log = [];
  for (let i = 1; i < 10; i += 1) log.push(rhrGun(i, 60));
  log.push(rhrGun(0, 90));
  const r = buildRestingHrReport(log, { today: new Date('2026-08-16T12:00:00') });
  // Taban 60 olmalı; son ölçüm dahil edilseydi 63 çıkardı ve sapma küçülürdü.
  assert.equal(r.baseline, 60);
  assert.equal(r.delta, 30);
});

test('aynı güne ikinci giriş öncekini değiştirir', () => {
  let log = upsertRestingHr([], '2026-08-16', 58);
  log = upsertRestingHr(log, '2026-08-16', 61);
  assert.equal(log.length, 1);
  assert.equal(log[0].bpm, 61);
  // Saçma değerler kaydedilmiyor.
  assert.equal(upsertRestingHr(log, '2026-08-15', 5).length, 1);
});

/* --- Kardiyo rekorları --- */

test('set defterinden mesafe rekorları çıkar', () => {
  const w = [{
    date: '2026-08-10',
    cardio: [{ type: 'swim', minutes: 30, sets: [
      { reps: 4, distance: 100, stroke: 'free', kind: 'work', seconds: 95 },
      { reps: 1, distance: 400, stroke: 'free', kind: 'work', seconds: 380 },
    ] }],
  }];
  const r = buildCardioRecords(w);
  const yuz = r.records.find(x => x.distance === 100);
  assert.ok(yuz);
  assert.equal(yuz.seconds, 95);
  assert.ok(r.records.some(x => x.distance === 400));
});

test('daha hızlı süre rekoru geçer', () => {
  const seans = (date, saniye) => ({
    date, cardio: [{ type: 'swim', minutes: 20, sets: [{ reps: 1, distance: 100, stroke: 'free', kind: 'work', seconds: saniye }] }],
  });
  const r = buildCardioRecords([seans('2026-08-01', 95), seans('2026-08-10', 88)]);
  assert.equal(r.records.find(x => x.distance === 100).seconds, 88);
});

test('tam eşleşmeyen mesafe rekor sayılmaz', () => {
  const w = [{ date: '2026-08-10', cardio: [{ type: 'swim', minutes: 25, distanceKm: 1.2 }] }];
  assert.equal(buildCardioRecords(w).hasData, false);
  // Tam eşleşen mesafe sayılıyor.
  const tam = [{ date: '2026-08-10', cardio: [{ type: 'swim', minutes: 25, distanceKm: 1.5 }] }];
  assert.ok(buildCardioRecords(tam).records.some(x => x.distance === 1500));
});

test('ısınma setleri rekor üretmez', () => {
  const w = [{
    date: '2026-08-10',
    cardio: [{ type: 'swim', minutes: 20, sets: [{ reps: 1, distance: 100, stroke: 'free', kind: 'warmup', seconds: 80 }] }],
  }];
  assert.equal(buildCardioRecords(w).hasData, false);
});


// ---------------------------------------------------------------- 6.7

test('ağrı bölgesi hareket adından bulunuyor', () => {
  assert.ok(regionsLoadedBy('Barbell Bench Press').includes('shoulder'));
  assert.ok(regionsLoadedBy('Barbell Back Squat').includes('knee'));
  assert.ok(regionsLoadedBy('Deadlift').includes('lowBack'));
  // Yükleme ilişkisi olmayan hareket hiçbir bölgeye bağlanmıyor.
  assert.equal(regionsLoadedBy('Seated Calf Raise').includes('shoulder'), false);
});

test('yalnızca süren ya da şiddetli ağrı uyarı üretir', () => {
  const hafif = [{ region: 'shoulder', severity: 2, date: '2026-08-16' }];
  assert.equal(activePainRegions(hafif, { today: new Date('2026-08-17') }).length, 0);

  // Aynı bölge birkaç gün üst üste: artık süren bir ağrı.
  const suren = [
    { region: 'shoulder', severity: 3, date: '2026-08-12' },
    { region: 'shoulder', severity: 3, date: '2026-08-15' },
    { region: 'shoulder', severity: 3, date: '2026-08-16' },
  ];
  const aktif = activePainRegions(suren, { today: new Date('2026-08-17') });
  assert.equal(aktif.length, 1);
  assert.equal(aktif[0].key, 'shoulder');
});

test('ağrı uyarısı yalnızca o bölgeyi yükleyen harekette çıkıyor', () => {
  // Tek bir şiddetli kayıt (7+) süreklilik aranmadan uyarı üretiyor.
  const gunluk = [{ region: 'shoulder', severity: 8, date: '2026-08-16' }];
  const aktif = activePainRegions(gunluk, { today: new Date('2026-08-17') });
  const uyari = painWarningFor('Barbell Overhead Press', aktif);
  assert.ok(uyari);
  assert.ok(uyari.safer.length > 0);
  // Omuz ağrısı bacak hareketini etkilemiyor.
  assert.equal(painWarningFor('Leg Extension', aktif), null);
  // Ağrı yoksa hiçbir hareket uyarı vermiyor.
  assert.equal(painWarningFor('Barbell Overhead Press', []), null);
});

test('seans taraması riskli hareketleri sayıyor', () => {
  const aktif = activePainRegions([
    { region: 'knee', severity: 4, date: '2026-08-12' },
    { region: 'knee', severity: 4, date: '2026-08-15' },
    { region: 'knee', severity: 4, date: '2026-08-16' },
  ], { today: new Date('2026-08-17') });
  const tarama = scanSessionForPain(
    [{ name: 'Barbell Back Squat' }, { name: 'Lat Pulldown' }, { name: 'Leg Press' }],
    aktif);
  assert.equal(tarama.findings.length, 2);
  assert.ok(tarama.hasWarnings);
  assert.deepEqual(tarama.regions, ['Diz']);
});

test('seans temposu üçüncü setten önce tahmin vermiyor', () => {
  const az = {
    exercises: [{ name: 'Squat', sets: [{ reps: 8, weight: 100 }, { reps: 8, weight: 100 }, { reps: '', weight: '' }] }],
  };
  const p = buildSessionPace(az, 300);
  assert.equal(p.hasEstimate, false);
  assert.equal(p.reason, 'tooEarly');
  assert.equal(p.total, 3);
});

test('şablondan gelen hedef tekrarlar tamamlanmış sayılmıyor', () => {
  // Şablonla başlatılan seansta tekrar alanı baştan dolu, ağırlık boş.
  const yeni = {
    exercises: [{ name: 'Squat', sets: [{ reps: 8, weight: '' }, { reps: 8, weight: '' }, { reps: 8, weight: '' }] }],
  };
  assert.equal(buildSessionPace(yeni, 60).done, 0);
  // Sıfır geçerli bir giriş: ek ağırlıksız barfiks seti tamamlanmış sayılıyor.
  const bw = { exercises: [{ name: 'Pull-up', sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: '' }] }] };
  assert.equal(buildSessionPace(bw, 60).done, 1);
});

test('seans temposu kalan süreyi girilen setlerden çıkarıyor', () => {
  const w = {
    exercises: [{
      name: 'Squat',
      sets: [
        { reps: 8, weight: 100 }, { reps: 8, weight: 100 }, { reps: 8, weight: 100 },
        { reps: '', weight: '' }, { reps: '', weight: '' }, { reps: '', weight: '' },
        { reps: '', weight: '' }, { reps: '', weight: '' },
      ],
    }],
  };
  // 3 set / 12 dakika = set başına 4 dakika, kalan 5 set = 20 dakika.
  const p = buildSessionPace(w, 12 * 60, { now: new Date('2026-08-17T18:00:00') });
  assert.equal(p.hasEstimate, true);
  assert.equal(p.minutesPerSet, 4);
  assert.equal(p.remainingMinutes, 20);
  assert.equal(p.finishLabel, '18:20');
});

test('makul olmayan tempo tahmin üretmiyor', () => {
  const w = {
    exercises: [{
      name: 'Squat',
      sets: [{ reps: 8, weight: 100 }, { reps: 8, weight: 100 }, { reps: 8, weight: 100 }, { reps: '', weight: '' }],
    }],
  };
  // 3 set için iki saat: aradan uzun bir ara geçmiş, tahmin yanıltıcı olurdu.
  assert.equal(buildSessionPace(w, 7200).hasEstimate, false);
  assert.equal(buildSessionPace(w, 7200).reason, 'unreliable');
});

test('seans karşılaştırması hareket bazında fark veriyor', () => {
  const once = {
    date: '2026-08-10', id: 'a', sourceTemplateId: 't1',
    exercises: [{ name: 'Squat', sets: [{ reps: 8, weight: 95 }, { reps: 8, weight: 95 }] }],
  };
  const simdi = {
    date: '2026-08-17', id: 'b', sourceTemplateId: 't1',
    exercises: [
      { name: 'Squat', sets: [{ reps: 8, weight: 100 }, { reps: 8, weight: 100 }] },
      { name: 'Leg Curl', sets: [{ reps: 12, weight: 40 }] },
    ],
  };
  const k = compareSessions(simdi, once);
  assert.equal(k.tonnage.current, 2080);
  assert.equal(k.tonnage.previous, 1520);
  const squat = k.rows.find(r => r.name === 'Squat');
  assert.equal(squat.tonnageDelta, 80);
  assert.equal(squat.weightDelta, 5);
  assert.equal(k.rows.find(r => r.name === 'Leg Curl').status, 'new');
});

test('karşılaştırma yalnızca aynı şablonun seanslarını eşliyor', () => {
  const kayitlar = [
    { id: 'c', date: '2026-08-17', sourceTemplateId: 't1', exercises: [] },
    { id: 'b', date: '2026-08-14', sourceTemplateId: 't2', exercises: [] },
    { id: 'a', date: '2026-08-10', sourceTemplateId: 't1', exercises: [] },
  ];
  const cift = findComparableSessions(kayitlar, 't1');
  assert.equal(cift.current.id, 'c');
  assert.equal(cift.previous.id, 'a');
  // Tek seans varsa kıyaslanacak bir şey yok.
  assert.equal(findComparableSessions(kayitlar, 't2'), null);
  assert.equal(findComparableSessions(kayitlar, null), null);
});

test('kardiyo şablonu ölçülen değerleri taşımıyor', () => {
  let n = 0;
  const uret = () => `id${++n}`;
  const kayit = {
    type: 'swim', effort: 'medium',
    sets: [{ reps: 8, distance: 100, stroke: 'free', kind: 'main', seconds: 95, restSeconds: 20, strokeCount: 43 }],
  };
  const sablon = templateFromEntry(kayit, 'Yüzme 8x100', uret);
  assert.equal(sablon.sets[0].distance, 100);
  assert.equal(sablon.sets[0].restSeconds, 20);
  // Ölçülen kulaç sayısı şablona geçmiyor; hedef süre plan olduğu için kalıyor.
  assert.equal(sablon.sets[0].strokeCount, '');
  assert.equal(sablon.sets[0].seconds, 95);
  // Defteri olmayan kayıttan şablon çıkmıyor.
  assert.equal(templateFromEntry({ type: 'swim', minutes: 30 }, 'Boş', uret), null);
});

test('şablon listesi kullanım sayısına göre sıralanıyor', () => {
  let liste = [];
  liste = addCardioTemplate(liste, { id: 'a', name: 'A', type: 'swim', sets: [{ reps: 1, distance: 100 }] });
  liste = addCardioTemplate(liste, { id: 'b', name: 'B', type: 'swim', sets: [{ reps: 1, distance: 200 }] });
  liste = markCardioTemplateUsed(liste, 'b');
  liste = markCardioTemplateUsed(liste, 'b');
  assert.equal(templatesForActivity(liste, 'swim')[0].id, 'b');
  assert.equal(templatesForActivity(liste, 'run').length, 0);
  liste = removeCardioTemplate(liste, 'b');
  assert.equal(liste.length, 1);
});

test('şablon uygulanınca forma plan alanları giriyor', () => {
  const sablon = {
    id: 'x', name: 'Y', type: 'swim', effort: 'hard',
    sets: [{ reps: 8, distance: 100, stroke: 'free', kind: 'main', restSeconds: 20 }],
  };
  const u = applyCardioTemplate(sablon);
  assert.equal(u.type, 'swim');
  assert.equal(u.effort, 'hard');
  assert.equal(u.sets[0].reps, 8);
  assert.equal(applyCardioTemplate(null), null);
  assert.ok(describeCardioTemplate(sablon, { poolLength: 25 }).summaryLabel.includes('800 m'));
});

test('kardiyo CSV her seti ayrı satıra yazıyor', () => {
  const w = [{
    date: '2026-08-16',
    cardio: [{
      type: 'swim', effort: 'medium', minutes: 20, avgHeartRate: 150, note: 'iyi',
      sets: [
        { reps: 8, distance: 100, stroke: 'free', kind: 'main', seconds: 95, restSeconds: 20, strokeCount: 40 },
        { reps: 1, distance: 200, stroke: 'back', kind: 'cooldown', seconds: 240 },
      ],
    }],
  }];
  const satirlar = cardioToCsv(w, { poolLength: 25 }).trim().split('\n');
  assert.equal(satirlar.length, 3);
  assert.ok(satirlar[0].includes('SWOLF'));
  assert.ok(satirlar[1].includes('Serbest'));
  assert.ok(satirlar[2].includes('200'));

  // Defteri olmayan kayıt da tek satır olarak çıkıyor.
  const duz = cardioToCsv([{ date: '2026-08-16', cardio: [{ type: 'run', minutes: 40 }] }]).trim().split('\n');
  assert.equal(duz.length, 2);
});


// ---------------------------------------------------------------- 6.8

test('süperset bayrağı kimliğe ve geri çevriliyor', () => {
  const liste = [
    { name: 'A', superset: true }, { name: 'B', superset: false },
    { name: 'C', superset: false },
  ];
  const kimlikler = draftSupersetIds(liste, 'g');
  assert.equal(kimlikler[0], kimlikler[1]);
  assert.ok(kimlikler[0]);
  assert.equal(kimlikler[2], null);

  // Ters yön: şablondan taslağa.
  const sablon = kimlikler.map((id, i) => ({ name: liste[i].name, supersetId: id }));
  assert.deepEqual(draftFlagsFromSupersetIds(sablon), [true, false, false]);
});

test('zincirleme süperset tek grup oluyor', () => {
  const liste = [
    { name: 'A', superset: true }, { name: 'B', superset: true },
    { name: 'C', superset: false }, { name: 'D', superset: false },
  ];
  const k = draftSupersetIds(liste, 'g');
  assert.equal(k[0], k[1]);
  assert.equal(k[1], k[2]);
  assert.equal(k[3], null);
});

test('bitişik olmayan aynı kimlik bağ sayılmıyor', () => {
  // Şablonda araya başka hareket girmişse bağ anlamını yitirmiş demektir.
  const sablon = [
    { name: 'A', supersetId: 'x' }, { name: 'B', supersetId: null }, { name: 'C', supersetId: 'x' },
  ];
  assert.deepEqual(draftFlagsFromSupersetIds(sablon), [false, false, false]);
});

test('kenara taşıma süperset bağını koparıyor', () => {
  const gun = { exercises: [
    { uid: '1', name: 'A', superset: true }, { uid: '2', name: 'B', superset: false },
    { uid: '3', name: 'C', superset: false },
  ] };
  const ust = moveDraftExerciseToEdge(gun, '3', 'top');
  assert.deepEqual(ust.exercises.map(e => e.uid), ['3', '1', '2']);
  // Taşınan hareket bağsız, listenin sonu da bağsız.
  assert.equal(ust.exercises[0].superset, false);
  assert.equal(ust.exercises[2].superset, false);

  // A en alta gidince eski eşiyle bağı kalkıyor.
  const alt = moveDraftExerciseToEdge(gun, '1', 'bottom');
  assert.deepEqual(alt.exercises.map(e => e.uid), ['2', '3', '1']);
  assert.ok(alt.exercises.every(e => e.superset === false));

  // Zaten kenardaysa değişiklik yok.
  assert.equal(moveDraftExerciseToEdge(gun, '1', 'top'), gun);
});

test('güne taşıma ve kopyalama', () => {
  const gunler = [
    { uid: 'd1', name: 'Push', exercises: [{ uid: '1', name: 'Bench', sets: 4 }, { uid: '2', name: 'Fly', sets: 3 }] },
    { uid: 'd2', name: 'Pull', exercises: [] },
  ];
  const tasindi = moveDraftExerciseToDay(gunler, 0, '2', 1, { generateId: () => 'yeni' });
  assert.equal(tasindi[0].exercises.length, 1);
  assert.equal(tasindi[1].exercises[0].name, 'Fly');
  assert.equal(tasindi[1].exercises[0].sets, 3);

  const kopyalandi = moveDraftExerciseToDay(gunler, 0, '2', 1, { copy: true, generateId: () => 'yeni' });
  assert.equal(kopyalandi[0].exercises.length, 2);
  assert.equal(kopyalandi[1].exercises.length, 1);

  // Hedefte aynı hareket varsa işlem yapılmıyor: hacimde iki kat sayılırdı.
  const dolu = [gunler[0], { uid: 'd2', name: 'Pull', exercises: [{ uid: '9', name: 'Fly', sets: 2 }] }];
  assert.equal(moveDraftExerciseToDay(dolu, 0, '2', 1, { generateId: () => 'x' }), dolu);
});

test('taslak haftalık hacmi bütün günleri topluyor', () => {
  const gunler = [
    { name: 'A', exercises: [{ name: 'Barbell Bench Press', sets: 4 }] },
    { name: 'B', exercises: [{ name: 'Barbell Bench Press', sets: 4 }] },
  ];
  const h = draftWeeklyVolume(gunler);
  assert.equal(h.totalSets, 8);
  const gogus = h.statuses.find(s => s.muscle === 'Göğüs');
  assert.equal(gogus.volume, 8);
  // Tek günde 4 set MEV'in altında görünürken haftalık toplam 8'e çıkıyor.
  assert.equal(draftWeeklyVolume([gunler[0]]).statuses.find(s => s.muscle === 'Göğüs').volume, 4);
  assert.ok(Array.isArray(h.audit.findings));
});

test('hazır program taslağa çevriliyor', () => {
  let n = 0;
  const draft = draftFromStarterProgram(findStarterProgram('fullbody3'), () => `id${++n}`);
  assert.ok(draft.days.length >= 2);
  assert.ok(draft.days[0].exercises.length > 0);
  // Taslak hareketleri bayrak taşıyor ve düzenlenebilir set sayısı sayı.
  assert.equal(typeof draft.days[0].exercises[0].sets, 'number');
  assert.equal(draft.days[0].exercises[0].superset, false);
  assert.equal(draftFromStarterProgram(null, () => 'x'), null);
});

test('taslaktan şablona süperset kimliği yazılıyor', () => {
  let n = 0;
  const { templates } = instantiateDraftProgram('Test', [{
    uid: 'd1', name: 'Push', weekday: 'mon',
    exercises: [
      { uid: '1', name: 'Bench', sets: 3, superset: true },
      { uid: '2', name: 'Fly', sets: 3, superset: false },
    ],
  }], () => `id${++n}`);
  assert.equal(templates.length, 1);
  assert.ok(templates[0].exercises[0].supersetId);
  assert.equal(templates[0].exercises[0].supersetId, templates[0].exercises[1].supersetId);
});

test('birleştirme geçmişi kazanan ada taşıyor', () => {
  const workouts = [
    { id: 'a', date: '2026-01-10', exercises: [{ name: 'Kablo Yan Kaldırış', sets: [{ reps: 12 }, { reps: 12 }] }] },
    { id: 'b', date: '2026-02-10', exercises: [{ name: 'Cable Lateral Raise', sets: [{ reps: 15 }] }] },
  ];
  const templates = [{ id: 't', name: 'Omuz', exercises: [{ name: 'Kablo Yan Kaldırış', sets: [{}] }] }];
  const customExercises = [{ name: 'Kablo Yan Kaldırış', muscle: 'Yan Omuz' }];
  const settings = {
    strengthGoals: [{ exercise: 'Kablo Yan Kaldırış', weight: 20 }],
    repRangeOverrides: { 'Kablo Yan Kaldırış': { min: 12, max: 20 } },
    painLog: [{ region: 'shoulder', exercise: 'Kablo Yan Kaldırış', severity: 5, date: '2026-02-01' }],
    hiddenExercises: ['Kablo Yan Kaldırış'],
  };

  const on = previewExerciseMerge('Kablo Yan Kaldırış', 'Cable Lateral Raise', { workouts, templates, settings });
  assert.equal(on.sessions, 1);
  assert.equal(on.sets, 2);
  assert.equal(on.templates, 1);
  assert.equal(on.strengthGoals, 1);
  assert.equal(on.spellingOnly, false);
  assert.equal(on.totalSessionsAfter, 2);

  const r = applyExerciseMerge('Kablo Yan Kaldırış', 'Cable Lateral Raise', {
    workouts, templates, customExercises, settings,
  });
  assert.equal(r.workouts[0].exercises[0].name, 'Cable Lateral Raise');
  assert.equal(r.templates[0].exercises[0].name, 'Cable Lateral Raise');
  assert.equal(r.customExercises.length, 0);
  assert.equal(r.settings.strengthGoals[0].exercise, 'Cable Lateral Raise');
  assert.deepEqual(Object.keys(r.settings.repRangeOverrides), ['Cable Lateral Raise']);
  assert.equal(r.settings.painLog[0].exercise, 'Cable Lateral Raise');
  assert.deepEqual(r.settings.hiddenExercises, ['Cable Lateral Raise']);
});

test('birleştirme kaynak veriyi değiştirmiyor', () => {
  const workouts = [{ id: 'a', date: '2026-01-10', exercises: [
    { name: 'Cable Lateral Raise', sets: [{ reps: 15 }] },
    { name: 'cable lateral raise', sets: [{ reps: 12 }] },
  ] }];
  const kopya = JSON.stringify(workouts);
  const r = applyExerciseMerge('cable lateral raise', 'Cable Lateral Raise', { workouts });
  assert.equal(JSON.stringify(workouts), kopya);
  // Aynı seanstaki iki satır tek satırda toplanıyor.
  assert.equal(r.workouts[0].exercises.length, 1);
  assert.equal(r.workouts[0].exercises[0].sets.length, 2);
});

test('yazım birleştirmesi kazananın kayıtlarını saymıyor', () => {
  const workouts = [
    { id: 'a', date: '2026-01-10', exercises: [{ name: 'cable lateral raise', sets: [{ reps: 12 }] }] },
    { id: 'b', date: '2026-02-10', exercises: [{ name: 'Cable Lateral Raise', sets: [{ reps: 15 }] }] },
  ];
  const on = previewExerciseMerge('cable lateral raise', 'Cable Lateral Raise', { workouts });
  assert.equal(on.spellingOnly, true);
  // Yalnızca küçük harfli yazımın kaydı sayılıyor, kazananınki değil.
  assert.equal(on.sessions, 1);
  assert.equal(on.sets, 1);
});

test('birleştirme aynı adı ve boş adı reddediyor', () => {
  assert.equal(previewExerciseMerge('A', 'A', {}), null);
  assert.equal(applyExerciseMerge('', 'A', {}), null);
  assert.equal(applyExerciseMerge('A', '', {}), null);
});

test('temiz kurulumda birleştirme adayı çıkmıyor', () => {
  // Kütüphanenin kendi içinde kopya yok; aday üreten şey kullanıcının adları.
  assert.deepEqual(findMergeCandidates([], []), []);
});

test('yazım kopyası kesin aday, parantezli varyant olası aday', () => {
  const workouts = [
    { id: 'a', date: '2026-01-10', exercises: [{ name: 'cable lateral raise', sets: [{ reps: 12 }] }] },
    { id: 'b', date: '2026-03-10', exercises: [{ name: 'Cable Lateral Raise', sets: [{ reps: 15 }, { reps: 15 }] }] },
  ];
  const adaylar = findMergeCandidates([{ name: 'Romanian Deadlift' }], workouts);

  const kesin = adaylar.find(a => a.certain);
  assert.ok(kesin);
  // Daha çok kullanılan yazım kazanan öneriliyor.
  assert.equal(kesin.suggestedWinner, 'Cable Lateral Raise');

  const olasi = adaylar.find(a => !a.certain);
  assert.ok(olasi);
  assert.ok(olasi.variants.some(v => v.name === 'Romanian Deadlift (RDL)'));
  // Kütüphanedeki birebir yazım kazanan öneriliyor.
  assert.equal(olasi.suggestedWinner, 'Romanian Deadlift (RDL)');
});

test('ayak izi birebir yazımla sayılabiliyor', () => {
  const w = [
    { id: 'a', date: '2026-01-10', exercises: [{ name: 'Squat', sets: [{ reps: 5 }] }] },
    { id: 'b', date: '2026-02-10', exercises: [{ name: 'squat', sets: [{ reps: 5 }, { reps: 5 }] }] },
  ];
  // Varsayılan: katlanmış eşleşme, iki yazım da sayılıyor.
  assert.equal(exerciseFootprint('Squat', w).sessions, 2);
  // Birebir eşleşme: yalnızca kendi yazımı.
  assert.equal(exerciseFootprint('Squat', w, (n) => n === 'Squat').sets, 1);
});


// ---------------------------------------------------------------- 6.9

test('istenen üç günlük düzenler var ve doğru kasları eşliyor', () => {
  const secenekler = getSplitOptions(3);
  const kimlikler = secenekler.map(x => x.id);
  assert.ok(kimlikler.includes('push-pull-upper-3'));
  assert.ok(kimlikler.includes('ppl-3'));

  const hibrit = secenekler.find(x => x.id === 'push-pull-upper-3');
  assert.equal(hibrit.days.length, 3);
  // 1. gün itiş + ön bacak, 2. gün çekiş + arka bacak, 3. gün yalnızca üst.
  assert.ok(hibrit.days[0].groups.includes('Göğüs') && hibrit.days[0].groups.includes('Quadriceps'));
  assert.ok(hibrit.days[1].groups.includes('Kanat') && hibrit.days[1].groups.includes('Hamstring'));
  assert.ok(hibrit.days[2].groups.includes('Göğüs') && hibrit.days[2].groups.includes('Kanat'));
  // Üçüncü gün bacak GÖRMÜYOR: ilk iki günün bacak yorgunluğu toparlansın.
  assert.equal(hibrit.days[2].groups.includes('Quadriceps'), false);
  assert.equal(hibrit.days[2].groups.includes('Hamstring'), false);

  const ppl = secenekler.find(x => x.id === 'ppl-3');
  assert.equal(ppl.days.map(d => d.name).join(','), 'İtiş,Çekiş,Bacak');
  assert.equal(ppl.days[0].groups.includes('Kanat'), false);
});

test('yeni düzenler gerçekten program üretiyor', () => {
  ['push-pull-upper-3', 'ppl-3'].forEach(id => {
    const b = buildProgram({ daysPerWeek: 3, splitId: id });
    assert.equal(b.split.id, id);
    assert.equal(b.days.length, 3);
    assert.ok(b.totalSets > 30, `${id} hacmi düşük: ${b.totalSets}`);
    b.days.forEach(g => assert.ok(g.exercises.length > 0, `${id}/${g.name} boş`));
  });
});

test('seans süresi set tavanını belirliyor', () => {
  assert.equal(findSessionLength('short').cap, 15);
  assert.equal(findSessionLength('extended').cap, 30);
  // Bilinmeyen anahtar en uzun süreye düşüyor (eski davranış korunuyor).
  assert.equal(findSessionLength('yok').cap, 30);
  assert.equal(SESSION_LENGTHS.length, 4);

  const kisa = buildProgram({ daysPerWeek: 5, sessionLength: 'short' });
  const uzun = buildProgram({ daysPerWeek: 5, sessionLength: 'extended' });
  assert.equal(kisa.sessionCap, 15);
  assert.equal(uzun.sessionCap, 30);
  // Kısa süre gerçekten daha az set üretiyor.
  assert.ok(kisa.totalSets < uzun.totalSets, `${kisa.totalSets} < ${uzun.totalSets}`);
});

test('süre bölmeye sığmıyorsa çelişki adıyla söyleniyor', () => {
  const b = buildProgram({ daysPerWeek: 3, sessionLength: 'short' });
  assert.equal(b.sessionFit.ok, false);
  assert.ok(b.sessionFit.worstDay > b.sessionFit.cap);
  // Çıkış yolu öneriliyor: aynı hacim için daha çok gün.
  assert.ok(b.sessionFit.suggestion > 3);
  assert.ok(b.sessionFit.detail.includes('tavan'));

  const rahat = buildProgram({ daysPerWeek: 5, sessionLength: 'extended' });
  assert.equal(rahat.sessionFit.ok, true);
  assert.equal(rahat.sessionFit.suggestion, null);
});

test('dışlanan hareket hiç seçilmiyor', () => {
  const yasak = ['Barbell Back Squat', 'Barbell Bench Press', 'Leg Press'];
  const b = buildProgram({ daysPerWeek: 4, excludedExercises: yasak });
  const secilenler = b.days.flatMap(d => d.exercises.map(e => e.name));
  yasak.forEach(ad => assert.equal(secilenler.includes(ad), false, `${ad} seçilmiş`));
});

test('kilitli hareket korunuyor ve kısılmıyor', () => {
  const kilit = { 'Üst A': ['Machine Chest Press', 'Lat Pulldown'] };
  const b = buildProgram({ daysPerWeek: 4, lockedExercises: kilit });
  const ustA = b.days.find(d => d.name === 'Üst A');
  kilit['Üst A'].forEach(ad => {
    const ex = ustA.exercises.find(e => e.name === ad);
    assert.ok(ex, `${ad} kaybolmuş`);
    assert.equal(ex.locked, true);
    // Yakınsama kilitli hareketten set kısmıyor.
    assert.ok(ex.sets >= 3, `${ad} kısılmış: ${ex.sets}`);
  });
});

test('dışlanan hareket kilitli olsa bile yerleşmiyor', () => {
  const b = buildProgram({
    daysPerWeek: 4,
    lockedExercises: { 'Üst A': ['Barbell Bench Press'] },
    excludedExercises: ['Barbell Bench Press'],
  });
  const secilenler = b.days.flatMap(d => d.exercises.map(e => e.name));
  assert.equal(secilenler.includes('Barbell Bench Press'), false);
});

test('varyant farklı ama tekrarlanabilir program üretiyor', () => {
  const adlar = (v) => buildProgram({ daysPerWeek: 4, variant: v })
    .days.flatMap(d => d.exercises.map(e => e.name));
  const v0 = adlar(0);
  const v1 = adlar(1);
  assert.notDeepEqual(v0, v1);
  // Aynı varyant her zaman aynı programı veriyor: ileri geri gezinilebilsin.
  assert.deepEqual(v0, adlar(0));
  assert.deepEqual(v1, adlar(1));
});

test('seçilen günler bölmenin gün sırasını koruyor', () => {
  const split = findSplitPreset('push-pull-upper-3', 3);
  assert.deepEqual(scheduleFromWeekdays(split, ['tue', 'thu', 'sat']), { tue: 0, thu: 1, sat: 2 });
  // Seçim sırası değil HAFTA sırası geçerli: cumartesi önce yazılsa da son gün.
  assert.deepEqual(scheduleFromWeekdays(split, ['sat', 'tue', 'thu']), { tue: 0, thu: 1, sat: 2 });
  // Gün sayısı tutmuyorsa hazır takvime düşüyor.
  assert.deepEqual(scheduleFromWeekdays(split, ['mon', 'tue']), split.schedule);
});

test('arka arkaya günlerde ortak kas uyarı üretiyor', () => {
  const split = findSplitPreset('push-pull-upper-3', 3);
  const ayrik = auditSchedule(split, scheduleFromWeekdays(split, ['mon', 'wed', 'fri']));
  assert.equal(ayrik.ok, true);
  assert.equal(ayrik.assigned, 3);

  const bitisik = auditSchedule(split, scheduleFromWeekdays(split, ['mon', 'tue', 'wed']));
  assert.equal(bitisik.ok, false);
  assert.ok(bitisik.conflicts.length > 0);
  assert.ok(bitisik.conflicts[0].shared.length > 0);
});

test('hafta sonu ile pazartesi de komşu sayılıyor', () => {
  // Pazar + Pazartesi arka arkaya; hafta sınırında kesilmemeli.
  const split = findSplitPreset('upper-lower-4', 4);
  const d = auditSchedule(split, { sun: 0, mon: 1, wed: 2, fri: 3 });
  // Üst A (pazar) ile Alt A (pazartesi) ortak kas yüklemiyor.
  assert.equal(d.ok, true);
  const ayni = auditSchedule(split, { sun: 0, mon: 2, wed: 1, fri: 3 });
  // Üst A (pazar) ile Üst B (pazartesi): ortak var.
  assert.equal(ayni.ok, false);
});

test('aktif plan özeti şablonları ve günleri sayıyor', () => {
  const templates = [
    { id: 't1', name: 'Üst', exercises: [{ name: 'Barbell Bench Press', sets: [{}, {}, {}] }] },
    { id: 't2', name: 'Alt', exercises: [{ name: 'Barbell Back Squat', sets: [{}, {}] }] },
  ];
  const plan = {
    name: 'Eski',
    days: {
      mon: [{ type: 'workout', templateId: 't1' }],
      thu: [{ type: 'workout', templateId: 't2' }],
      // Silinmiş şablona işaret eden slot: gün sayılıyor, şablon sayılmıyor.
      sat: [{ type: 'workout', templateId: 'yok' }],
      tue: [], wed: [], fri: [], sun: [],
    },
  };
  const ozet = activePlanSummary(plan, templates);
  assert.equal(ozet.daysPerWeek, 3);
  assert.equal(ozet.templates.length, 2);
  assert.equal(ozet.brokenSlots, 1);
  assert.equal(activePlanSummary(null, templates), null);
});

test('program karşılaştırması kas kas farkı veriyor', () => {
  const built = buildProgram({ daysPerWeek: 5 });
  const templates = [{
    id: 't1', name: 'Tek Gün',
    exercises: [{ name: 'Barbell Bench Press', sets: [{}, {}, {}] }],
  }];
  const plan = {
    name: 'Eski',
    days: { mon: [{ type: 'workout', templateId: 't1' }], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
  };
  const k = compareWithActivePlan(built, plan, templates);
  assert.equal(k.currentDays, 1);
  assert.equal(k.nextDays, 5);
  assert.equal(k.currentSets, 3);
  assert.equal(k.nextSets, built.totalSets);
  // Göğüs iki tarafta da var: fark hesaplanmış olmalı.
  const gogus = k.rows.find(r => r.muscle === 'Göğüs');
  assert.equal(gogus.current, 3);
  assert.ok(gogus.delta > 0);
  // Eşiğin altından kurtulan kaslar ayrıca listeleniyor.
  assert.ok(k.rescued.length > 0);

  // Aktif plan yoksa karşılaştırma da yok.
  assert.equal(compareWithActivePlan(built, null, []), null);
});

test('ağrı bölgesini yükleyen hareketler dışlama adayı olarak çıkıyor', () => {
  const aktif = activePainRegions([
    { region: 'shoulder', severity: 8, date: '2026-08-16' },
  ], { today: new Date('2026-08-17') });
  const adaylar = exercisesLoadingPain(aktif, DEFAULT_EXERCISES, { limit: 20 });
  assert.ok(adaylar.length > 0);
  assert.ok(adaylar.some(a => /bench press|overhead press/i.test(a)));
  // Ağrı yoksa öneri de yok.
  assert.deepEqual(exercisesLoadingPain([], DEFAULT_EXERCISES), []);
});

test('kurulumda seçilen takvim kullanılıyor', () => {
  let n = 0;
  const built = buildProgram({ daysPerWeek: 3, splitId: 'push-pull-upper-3' });
  const takvim = { tue: 0, thu: 1, sat: 2 };
  const { plan } = instantiateProgram(built, () => `id${++n}`, { schedule: takvim });
  assert.equal(plan.days.tue.length, 1);
  assert.equal(plan.days.sat.length, 1);
  assert.equal(plan.days.mon.length, 0);

  // Takvim verilmezse bölmenin hazır takvimi.
  const { plan: varsayilan } = instantiateProgram(built, () => `v${++n}`);
  assert.equal(varsayilan.days.mon.length, 1);
});


// ---------------------------------------------------------------- 7.0

const normalSet = (weight, reps, rir = 1) => ({ weight, reps, rir, setType: 'normal' });

test('çift ilerleme yalnızca BÜTÜN setler üst uca ulaşınca yük artırır', () => {
  const hepsiUstte = [normalSet(80, 10), normalSet(80, 10)];
  const a = nextTargetByRule(hepsiUstte, { repRangeMin: 6, repRangeMax: 10, rule: 'double' });
  assert.equal(a.strategy, 'load');
  assert.equal(a.weight, 82.5);
  assert.equal(a.reps, 6);

  // 12-8 ortalaması 10 çıkıyor ama ikinci set üst uca ulaşmamış: yük artmamalı.
  const karisik = [normalSet(80, 12), normalSet(80, 8)];
  const b = nextTargetByRule(karisik, { repRangeMin: 6, repRangeMax: 10, rule: 'double' });
  assert.equal(b.strategy, 'reps');
  assert.equal(b.weight, 80);
});

test('çift ilerleme tükenişte aralığın altına düşünce yükü geri çeker', () => {
  const c = nextTargetByRule([normalSet(100, 4, 0)], { repRangeMin: 6, repRangeMax: 10, rule: 'double' });
  assert.equal(c.strategy, 'reset');
  assert.ok(c.weight < 100);
});

test('doğrusal kural alt hedefi tutturunca artırır', () => {
  const a = nextTargetByRule([normalSet(80, 6)], { repRangeMin: 6, repRangeMax: 10, rule: 'linear' });
  assert.equal(a.strategy, 'load');
  const b = nextTargetByRule([normalSet(80, 4)], { repRangeMin: 6, repRangeMax: 10, rule: 'linear' });
  assert.equal(b.strategy, 'hold');
  assert.equal(b.weight, 80);
});

test('RIR kuralı bir tam tekrardan küçük sapmayı yok sayar', () => {
  // RIR 2 hedefte: değişiklik yok.
  const tam = nextTargetByRule([normalSet(80, 8, 2)], { rule: 'rir', targetRir: 2 });
  assert.equal(tam.strategy, 'hold');
  // Yarım tekrarlık sapma da gürültü: RIR tahmini o hassasiyette değil.
  const yarim = nextTargetByRule([normalSet(80, 8, 2.5)], { rule: 'rir', targetRir: 2 });
  assert.equal(yarim.strategy, 'hold');
  // Bir tam tekrar fazla yedek: yük artar.
  const fazla = nextTargetByRule([normalSet(80, 8, 3)], { rule: 'rir', targetRir: 2 });
  assert.equal(fazla.strategy, 'load');
  // Bir tam tekrar eksik: yük düşer.
  const eksik = nextTargetByRule([normalSet(80, 8, 1)], { rule: 'rir', targetRir: 2 });
  assert.equal(eksik.strategy, 'reset');
});

test('sabit kural ağırlık önermez', () => {
  const r = nextTargetByRule([normalSet(80, 10)], { rule: 'fixed' });
  assert.equal(r.strategy, 'fixed');
  assert.equal(r.weight, 80);
});

test('küçük kas grubunda artış adımı daha küçük', () => {
  const buyuk = nextTargetByRule([normalSet(80, 10)], { repRangeMax: 10, rule: 'double', muscle: 'Göğüs' });
  const kucuk = nextTargetByRule([normalSet(80, 10)], { repRangeMax: 10, rule: 'double', muscle: 'Yan Omuz' });
  assert.equal(buyuk.weight, 82.5);
  assert.equal(kucuk.weight, 81.25);
});

test('ilerleme kuralı kaydediliyor, varsayılan yazılmıyor', () => {
  let o = {};
  o = setProgressionRule(o, 'Bench', 'linear');
  assert.deepEqual(o, { Bench: 'linear' });
  assert.equal(progressionFor('Bench', o).key, 'linear');
  // Varsayılana dönüş kaydı siliyor: her harekete satır yazmak ayarları şişirirdi.
  o = setProgressionRule(o, 'Bench', 'double');
  assert.deepEqual(o, {});
  assert.equal(progressionFor('Bench', o).key, 'double');
  // Tanınmayan anahtar yok sayılıyor.
  assert.deepEqual(setProgressionRule({}, 'X', 'uyduruk'), {});
  assert.equal(Object.keys(PROGRESSION_RULES).length, 4);
});

test('sonraki seans hedef kartı ilk kez yapılanı ayırıyor', () => {
  const sablon = { name: 'Push', exercises: [{ name: 'Bench' }, { name: 'Yeni' }] };
  const gecmis = [{ id: 'w', date: '2026-08-10', exercises: [{ name: 'Bench', sets: [normalSet(80, 10), normalSet(80, 10)] }] }];
  const k = buildNextSessionTargets(sablon, gecmis, { repRangeFor: () => ({ min: 6, max: 10 }) });
  assert.equal(k.rows.length, 2);
  assert.equal(k.rows[0].target.strategy, 'load');
  assert.equal(k.rows[1].firstTime, true);
  assert.equal(k.loadIncreases, 1);
  assert.equal(k.firstTimers, 1);
  assert.equal(buildNextSessionTargets(null, gecmis), null);
});

const seansMk = (date, weight, reps) => ({
  id: date, date, exercises: [{ name: 'Bench', sets: [normalSet(weight, reps)] }],
});

test('durgunluk üç seanstır ilerlemeyeni yakalıyor', () => {
  const w = [
    seansMk('2026-06-01', 80, 8), seansMk('2026-06-08', 82.5, 8), seansMk('2026-06-15', 85, 8),
    seansMk('2026-06-22', 85, 7), seansMk('2026-06-29', 85, 7), seansMk('2026-07-06', 85, 7),
  ];
  const a = assessExercise('Bench', w);
  assert.equal(a.status, 'stalling');
  assert.equal(a.sessionsSinceBest, 3);
  assert.equal(a.sessions, 6);
  // Öneriler en ucuz müdahaleden başlıyor; hareket değiştirmek en sonda.
  assert.deepEqual(a.status === 'stalling' ? ['deload', 'reprange', 'variation'] : [],
    scanPlateaus(w).items[0].advice.map(x => x.key));
});

test('gerileme durgunluktan ayrı işaretleniyor', () => {
  const w = [
    seansMk('2026-06-01', 80, 8), seansMk('2026-06-08', 90, 8), seansMk('2026-06-15', 100, 8),
    seansMk('2026-06-22', 100, 8), seansMk('2026-06-29', 80, 6),
  ];
  const a = assessExercise('Bench', w);
  assert.equal(a.status, 'regressing');
  assert.ok(a.dropPercent > 5);
  // Gerilemede ilk öneri toparlanma: sebep çoğunlukla program değil.
  assert.equal(scanPlateaus(w).items[0].advice[0].key, 'recovery');
});

test('az veri durgunluk sayılmıyor', () => {
  const w = [seansMk('2026-06-01', 80, 8), seansMk('2026-06-08', 80, 8)];
  assert.equal(assessExercise('Bench', w).status, 'insufficient');
  assert.equal(scanPlateaus(w).hasData, false);
  assert.equal(plateauCoachItem(scanPlateaus(w)), null);
  // Eğilim serisi yeniden eskiye sıralı.
  const seri = exerciseTrend('Bench', w);
  assert.equal(seri[0].date, '2026-06-08');
});

test('tekrar rekorları banda göre ayrılıyor', () => {
  const w = [
    seansMk('2026-06-01', 100, 3), seansMk('2026-06-08', 80, 10),
    seansMk('2026-06-15', 85, 10), seansMk('2026-06-22', 60, 20),
  ];
  const r = repRecordsFor('Bench', w);
  assert.equal(r.rows.length, 3);
  assert.equal(r.rows.find(x => x.band === '3').weight, 100);
  // Aynı bantta daha ağır olan kazanıyor.
  assert.equal(r.rows.find(x => x.band === '9').weight, 85);
  // 15 toplam tekrarın üstünde 1RM tahmini yok: formül orada güvenilir değil.
  assert.equal(r.rows.find(x => x.band === '13').e1rm, null);
  assert.equal(r.strongestBand.band, '9');
  assert.equal(REP_BANDS.length, 6);
});

test('yalnızca yüksek tekrar varsa en güçlü bant boş kalıyor', () => {
  const r = repRecordsFor('Bench', [seansMk('2026-06-22', 60, 20)]);
  assert.equal(r.hasData, true);
  assert.equal(r.strongestBand, null);
});

test('bant rekoru tespiti önceki en iyiyle kıyaslıyor', () => {
  const w = [seansMk('2026-06-15', 85, 10)];
  assert.ok(isRepRecord('Bench', normalSet(90, 10), w));
  assert.equal(isRepRecord('Bench', normalSet(80, 10), w), null);
  // Aynı ağırlıkta daha çok tekrar da rekor.
  assert.ok(isRepRecord('Bench', normalSet(85, 11), w));
  // Isınma seti rekor sayılmıyor.
  assert.equal(isRepRecord('Bench', { weight: 200, reps: 10, rir: 0, setType: 'warmup' }, w), null);
  // Bantta hiç kayıt yoksa "ilk" işaretleniyor.
  assert.equal(isRepRecord('Bench', normalSet(120, 2), w).first, true);
});

test('dinlenme raporu tekrar maliyetini aynı ağırlıkta ölçüyor', () => {
  const seans = (d, satirlar) => ({
    id: d, date: d,
    exercises: [{ name: 'Barbell Bench Press', sets: [
      normalSet(80, 10),
      ...satirlar.map(x => ({ ...normalSet(80, x.reps), restBefore: x.rest })),
    ] }],
  });
  const w = [
    seans('2026-08-01', [{ rest: 60, reps: 7 }, { rest: 60, reps: 6 }]),
    seans('2026-08-05', [{ rest: 180, reps: 10 }, { rest: 180, reps: 9 }]),
    seans('2026-08-09', [{ rest: 55, reps: 7 }, { rest: 200, reps: 10 }]),
  ];
  const r = buildRestReport(w);
  assert.equal(r.hasData, true);
  assert.equal(r.samples, 6);
  assert.ok(r.repCost.difference > 0, 'kısa dinlenme daha çok tekrar kaybettirmeli');
  assert.ok(restCoachItem(r).title.includes('tekrar'));
});

test('dinlenme raporu veri yoksa ve fark küçükse susuyor', () => {
  assert.equal(buildRestReport([]).hasData, false);
  // Kısa dinlenme tekrar kaybettirmiyorsa koç konuşmuyor: kısa dinlenmek
  // tek başına kusur değil.
  const esit = {
    hasData: true, shortShare: 50, repCost: { difference: 0.2, shortDrop: 1, adequateDrop: 0.8 },
  };
  assert.equal(restCoachItem(esit), null);
});

test('saat dilimi eşleştirmesi gece yarısını aşıyor', () => {
  assert.equal(slotForHour(7).key, 'earlyMorning');
  assert.equal(slotForHour(19).key, 'evening');
  // Gece dilimi 21'den 05'e kadar; saat 2 de o dilime düşüyor.
  assert.equal(slotForHour(2).key, 'night');
  assert.equal(slotForHour(22).key, 'night');
  assert.equal(slotForHour('yok'), null);
});

test('saat analizi hareketi kendi ortalamasına göre normalleştiriyor', () => {
  const mk = (tarih, saat, kg) => ({
    id: tarih + saat, date: tarih,
    startedAt: `${tarih}T${String(saat).padStart(2, '0')}:00:00`,
    exercises: [{ name: 'Squat', sets: [normalSet(kg, 5)] }],
  });
  const w = [
    mk('2026-07-01', 7, 100), mk('2026-07-03', 7, 100), mk('2026-07-05', 7, 102.5),
    mk('2026-07-08', 19, 112.5), mk('2026-07-10', 19, 115), mk('2026-07-12', 19, 115),
  ];
  const r = buildTimeOfDayReport(w);
  assert.equal(r.hasData, true);
  assert.equal(r.best.key, 'evening');
  assert.equal(r.worst.key, 'earlyMorning');
  assert.ok(r.meaningful);
  assert.ok(timeOfDayCoachItem(r).title.includes('Akşam'));

  // Saati olmayan kayıtlar değerlendirilmiyor: eski geçmişte startedAt yok.
  const saatsiz = w.map(x => ({ ...x, startedAt: undefined }));
  assert.equal(buildTimeOfDayReport(saatsiz).hasData, false);
});

test('küçük saat farkı gürültü sayılıyor', () => {
  const mk = (tarih, saat, kg) => ({
    id: tarih + saat, date: tarih,
    startedAt: `${tarih}T${String(saat).padStart(2, '0')}:00:00`,
    exercises: [{ name: 'Squat', sets: [normalSet(kg, 5)] }],
  });
  const w = [
    mk('2026-07-01', 7, 100), mk('2026-07-03', 7, 100), mk('2026-07-05', 7, 100.5),
    mk('2026-07-08', 19, 101), mk('2026-07-10', 19, 100), mk('2026-07-12', 19, 101),
  ];
  const r = buildTimeOfDayReport(w);
  assert.equal(r.meaningful, false);
  assert.equal(timeOfDayCoachItem(r), null);
});

test('yoğunluk tekniği oranı denetleniyor', () => {
  const seans = (d, tipler) => ({
    id: d, date: d,
    exercises: [{ name: 'Fly', sets: tipler.map(t => ({ ...normalSet(50, 10), setType: t })) }],
  });
  const normal = [seans('2026-08-01', Array(12).fill('normal')), seans('2026-08-05', Array(12).fill('normal'))];
  const nr = buildTechniqueReport(normal);
  assert.equal(nr.share, 0);
  assert.equal(nr.overused, false);
  assert.equal(techniqueCoachItem(nr), null);

  const asiri = [
    seans('2026-08-01', [...Array(6).fill('normal'), ...Array(6).fill('drop')]),
    seans('2026-08-05', [...Array(6).fill('normal'), ...Array(6).fill('failure')]),
  ];
  const ar = buildTechniqueReport(asiri);
  assert.equal(ar.share, 50);
  assert.equal(ar.overused, true);
  assert.ok(techniqueCoachItem(ar).title.includes('%50'));

  // Az veriyle karar verilmiyor.
  assert.equal(buildTechniqueReport([seans('2026-08-01', ['drop'])]).hasData, false);
});

test('teknik rehberi hacim sayımını açıklıyor', () => {
  // Isınma hacme hiç sayılmıyor, drop tek set sayılıyor.
  assert.ok(techniqueInfo('warmup').volume.includes('HİÇ'));
  assert.ok(techniqueInfo('drop').volume.includes('TEK set'));
  assert.ok(techniqueInfo('rest_pause').caution);
  // Tanınmayan anahtar normale düşüyor.
  assert.equal(techniqueInfo('uyduruk').key, 'normal');
});


for (const { name, run } of tests) {
  try {
    run();
  } catch (error) {
    console.error(`Başarısız: ${name}`);
    throw error;
  }
}

console.log(`Temel kontroller geçti — ${tests.length} test.`);
