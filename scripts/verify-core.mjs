import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { APP_VERSION, LATEST_RELEASE_NOTES, DEFAULT_EXERCISES } from '../src/utils/constants.js';
import { buildCoachActions } from '../src/utils/coach.js';
import { suggestSubstitutes } from '../src/utils/substitution.js';
import { analyzeDayConflicts } from '../src/utils/interference.js';
import { computeWeekPlan } from '../src/utils/weekPlan.js';
import { findActivity } from '../src/utils/cardio.js';
import { suggestRestSeconds } from '../src/utils/rest.js';
import { calculatePlates, generateWarmup, normalizePlates, AVAILABLE_PLATES } from '../src/utils/plates.js';
import { buildSessionReport } from '../src/utils/sessionReport.js';
import { buildWeeklyReview, lastCompletedWeekStart } from '../src/utils/weeklyReview.js';
import { computeReadiness } from '../src/utils/readiness.js';
import { dayEnergyBreakdown, theoreticalWeek, estimateMacrosForTef, groupByWeek, buildEnergySeries, neatOptsForDay } from '../src/utils/energyModel.js';
import { calorieDashboard, deriveGoalSet } from '../src/utils/goals.js';
import { mergeWellnessDay, computeSleepScore } from '../src/utils/wellness.js';
import { migrateWeekPlans, removeTemplateFromPlans } from '../src/utils/planMigration.js';
import { suggestNextTarget, mergeWorkout, findMetricsForDate, resetDayNeatOverride } from '../src/utils/helpers.js';
import { dailyTotals, nutritionDayScore } from '../src/utils/nutritionStats.js';
import { buildPlateauInsights, buildNutritionPerformanceInsight } from '../src/utils/insights.js';
import { resolvePlannedCardioMinutes, isActiveRecoveryCardioDay, isActiveRecoveryEntry, cardioEntryCalories, workoutCalories, dayWorkoutCalories } from '../src/utils/cardio.js';
import { groupIntoWeeks, groupWeeksIntoMonths } from '../src/utils/dates.js';
import { deloadState } from '../src/utils/deload.js';
import { buildCycleSummary, mergeCycleDay } from '../src/utils/cycle.js';
import { analyzeTemplate } from '../src/utils/templateAssistant.js';
import { sortExercisesForMuscle } from '../src/utils/exerciseSort.js';
import { buildEmergencyBackup } from '../src/utils/emergencyBackup.js';

const tests = [];
const test = (name, run) => tests.push({ name, run });

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
  // İkisi ayrışınca sürüm notları açılmıyor ve yedek dosyası eski sürümü
  // yazıyordu; sessiz kaldığı için de fark edilmiyordu.
  assert.equal(APP_VERSION, pkg.version);
  // Sürüm iki parçalı: MAJOR.MINOR. Yama parçası kullanılmıyor.
  assert.match(pkg.version, /^\d+\.\d+$/);
  assert.equal(LATEST_RELEASE_NOTES.version, pkg.version);
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

for (const { name, run } of tests) {
  try {
    run();
  } catch (error) {
    console.error(`Başarısız: ${name}`);
    throw error;
  }
}

console.log(`Temel kontroller geçti — ${tests.length} test.`);
