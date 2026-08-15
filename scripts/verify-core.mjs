import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { APP_VERSION, LATEST_RELEASE_NOTES, DEFAULT_EXERCISES, getVolumeLandmarks } from '../src/utils/constants.js';
import { buildCoachActions } from '../src/utils/coach.js';
import { suggestSubstitutes } from '../src/utils/substitution.js';
import { analyzeDayConflicts } from '../src/utils/interference.js';
import { computeWeekPlan } from '../src/utils/weekPlan.js';
import { findActivity } from '../src/utils/cardio.js';
import { suggestRestSeconds } from '../src/utils/rest.js';
import { effectiveLoad, bodyweightFactorOf } from '../src/utils/bodyweight.js';
import { auditBodyweightEntries, normalizeBodyweightEntries } from '../src/utils/bodyweightAudit.js';
import { calculatePlates, generateWarmup, normalizePlates, AVAILABLE_PLATES } from '../src/utils/plates.js';
import { buildSessionReport } from '../src/utils/sessionReport.js';
import { buildWeeklyReview, lastCompletedWeekStart } from '../src/utils/weeklyReview.js';
import { computeReadiness } from '../src/utils/readiness.js';
import { dayEnergyBreakdown, theoreticalWeek, estimateMacrosForTef, groupByWeek, buildEnergySeries, neatOptsForDay } from '../src/utils/energyModel.js';
import { calorieDashboard, deriveGoalSet } from '../src/utils/goals.js';
import { mergeWellnessDay, computeSleepScore } from '../src/utils/wellness.js';
import { migrateWeekPlans, removeTemplateFromPlans } from '../src/utils/planMigration.js';
import { suggestNextTarget, mergeWorkout, findMetricsForDate, resetDayNeatOverride, calcTonnage, buildPersonalRecords } from '../src/utils/helpers.js';
import { dailyTotals, nutritionDayScore } from '../src/utils/nutritionStats.js';
import { buildPlateauInsights, buildNutritionPerformanceInsight } from '../src/utils/insights.js';
import { resolvePlannedCardioMinutes, isActiveRecoveryCardioDay, isActiveRecoveryEntry, cardioEntryCalories, workoutCalories, dayWorkoutCalories } from '../src/utils/cardio.js';
import { groupIntoWeeks, groupWeeksIntoMonths } from '../src/utils/dates.js';
import { deloadState } from '../src/utils/deload.js';
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
import { buildFrequencyReport, frequencyCoachItem } from '../src/utils/frequency.js';
import { workoutsToCsv, metricsToCsv } from '../src/utils/csvExport.js';
import { STARTER_PROGRAMS, instantiateStarterProgram } from '../src/utils/starterPrograms.js';
import { sessionAdvice } from '../src/utils/autoregulation.js';
import {
  duplicateTemplate, markTemplateUsed, organizeTemplates, toggleTemplateFavorite,
} from '../src/utils/templateLibrary.js';

const tests = [];
const test = (name, run) => tests.push({ name, run });

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
  ]);
  const backup = buildEmergencyBackup({ getItem: key => values.get(key) ?? null }, '2026-08-06T12:00:00.000Z');
  assert.equal(backup.version, APP_VERSION);
  assert.equal(backup.workouts[0].id, 'legacy-workout');
  assert.equal(backup.metricsHistory[0].id, 'safe-metric');
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
  // Sürüm iki parçalı: MAJOR.MINOR. Yama parçası kullanılmıyor.
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


for (const { name, run } of tests) {
  try {
    run();
  } catch (error) {
    console.error(`Başarısız: ${name}`);
    throw error;
  }
}

console.log(`Temel kontroller geçti — ${tests.length} test.`);
