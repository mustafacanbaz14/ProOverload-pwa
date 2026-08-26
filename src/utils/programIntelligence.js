import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';
import { detectMuscleGroup } from './helpers.js';
import { estimateDuration } from './templates.js';
import { draftWeeklyVolume, suggestedWeekdays } from './programDraft.js';

export const PROGRAM_GOALS = {
  growth: {
    key: 'growth', label: 'Gelişim', short: 'Kas kazanımı',
    detail: 'Kişisel verimli banda yaklaşır; öncelikli kaslar bandın üst yarısına yerleşir.',
  },
  maintenance: {
    key: 'maintenance', label: 'Koruma', short: 'Düşük doz',
    detail: 'Büyüme eşiğini hedeflemez; mevcut kazanımı daha az set ve zamanla korumaya yönelik planlama kestirimidir.',
  },
  recovery: {
    key: 'recovery', label: 'Toparlanma', short: 'Geçici azaltma',
    detail: 'Yorgunluk haftası için taban hacim üretir. Kalıcı program değil, kontrollü geri çekilme aracıdır.',
  },
};

export const PROGRAM_TIME_BUDGETS = [45, 60, 75, 90];

const cloneDays = (days = []) => days.map(day => ({
  ...day,
  exercises: (day.exercises || []).map(exercise => ({ ...exercise })),
}));

const draftExerciseView = (day) => (day?.exercises || []).map(exercise => ({
  name: exercise.name,
  supersetId: exercise.superset ? `draft-${exercise.uid}` : null,
  sets: Array.from({ length: Math.max(0, Number(exercise.sets) || 0) }, () => ({
    reps: 10, rir: 2, setType: 'normal',
  })),
}));

const dayMinutes = (day, restSeconds) => (day?.exercises || []).length
  ? estimateDuration(draftExerciseView(day), restSeconds)
  : 0;

const muscleDayVolumes = (days = [], customExercises = []) => {
  const byMuscle = Object.fromEntries(MUSCLE_GROUPS.map(muscle => [muscle, []]));
  days.forEach((day, dayIndex) => {
    (day.exercises || []).forEach(exercise => {
      const { contributions } = detectMuscleGroup(exercise.name, customExercises);
      Object.entries(contributions || {}).forEach(([muscle, coefficient]) => {
        if (!byMuscle[muscle]) byMuscle[muscle] = [];
        byMuscle[muscle][dayIndex] = (byMuscle[muscle][dayIndex] || 0)
          + (Number(exercise.sets) || 0) * coefficient;
      });
    });
  });
  return byMuscle;
};

const profileMap = (profile) => new Map((profile?.rows || []).map(row => [row.muscle, row]));

const targetBand = (muscle, goal, personalRow, experienceLevel = 'intermediate') => {
  const base = getVolumeLandmarks(muscle, experienceLevel);
  if (goal === 'maintenance') {
    const low = Math.max(2, Math.round(base.mev * 0.5));
    return { low, high: Math.max(low, Math.round(base.mev * 0.8)), source: 'koruma kestirimi' };
  }
  if (goal === 'recovery') {
    const low = Math.max(2, Math.round(base.mev * 0.35));
    return { low, high: Math.max(low, Math.round(base.mev * 0.6)), source: 'toparlanma kestirimi' };
  }
  if (personalRow) return {
    low: personalRow.targetLow,
    high: personalRow.targetHigh,
    source: personalRow.personalized ? 'kişisel geçmiş' : 'başlangıç referansı',
  };
  return { low: base.mev, high: base.mav, source: 'başlangıç referansı' };
};

const coveragePillars = (volumes) => [
  { key: 'push', label: 'Yatay itiş', covered: (volumes.Göğüs || 0) >= 2 },
  { key: 'pull', label: 'Üst çekiş', covered: (volumes.Kanat || 0) >= 2 || (volumes['Orta Sırt'] || 0) >= 2 },
  { key: 'knee', label: 'Diz baskın', covered: (volumes.Quadriceps || 0) >= 2 },
  { key: 'hip', label: 'Kalça menteşesi', covered: (volumes.Hamstring || 0) >= 2 || (volumes.Kalça || 0) >= 2 },
  { key: 'shoulder', label: 'Omuz', covered: (volumes['Yan Omuz'] || 0) >= 2 || (volumes['Arka Omuz'] || 0) >= 2 },
];

/** Program taslağının açıklanabilir sağlık denetimi. */
export const buildProgramAudit = (days = [], {
  customExercises = [],
  experienceLevel = 'intermediate',
  goal = 'growth',
  priorities = [],
  timeBudget = 60,
  restSeconds = 120,
  optimalProfile = null,
} = {}) => {
  const weekly = draftWeeklyVolume(days, { customExercises, experienceLevel });
  const pMap = profileMap(optimalProfile);
  const prioritySet = new Set(priorities || []);
  const byDay = muscleDayVolumes(days, customExercises);
  const volumes = Object.fromEntries(weekly.statuses.map(row => [row.muscle, row.volume]));
  const targetMuscles = new Set([
    ...weekly.statuses.filter(row => row.volume >= 2).map(row => row.muscle),
    ...prioritySet,
  ]);

  const muscleRows = [...targetMuscles].map(muscle => {
    const volume = Math.round((volumes[muscle] || 0) * 4) / 4;
    const band = targetBand(muscle, goal, pMap.get(muscle), experienceLevel);
    const sessions = (byDay[muscle] || []).filter(value => value >= 2).length;
    const recommendedSessions = band.high > 10 || prioritySet.has(muscle) ? 2 : 1;
    const status = volume < band.low ? 'under' : volume > band.high ? 'over' : 'aligned';
    return {
      muscle, volume, ...band, sessions, recommendedSessions, status,
      gap: volume < band.low ? Math.round((band.low - volume) * 4) / 4 : 0,
      excess: volume > band.high ? Math.round((volume - band.high) * 4) / 4 : 0,
      priority: prioritySet.has(muscle),
      dayVolumes: byDay[muscle] || [],
    };
  }).sort((a, b) => Number(b.priority) - Number(a.priority) || b.volume - a.volume);

  const filledDays = days.filter(day => (day.exercises || []).length > 0);
  const dayRows = filledDays.map(day => {
    const originalIndex = days.indexOf(day);
    return ({
    uid: day.uid,
    name: day.name,
    weekday: day.weekday,
    sets: (day.exercises || []).reduce((sum, exercise) => sum + (Number(exercise.sets) || 0), 0),
    minutes: dayMinutes(day, restSeconds),
    originalIndex,
    overBudget: dayMinutes(day, restSeconds) > timeBudget,
    muscles: muscleRows
      .map(row => ({ muscle: row.muscle, volume: Math.round((row.dayVolumes[originalIndex] || 0) * 4) / 4 }))
      .filter(row => row.volume > 0)
      .sort((a, b) => b.volume - a.volume),
    });
  });

  const targetFit = muscleRows.length
    ? muscleRows.filter(row => row.status === 'aligned').length / muscleRows.length
    : 0;
  const frequencyFit = muscleRows.length
    ? muscleRows.filter(row => row.sessions >= row.recommendedSessions).length / muscleRows.length
    : 0;
  const timeFit = dayRows.length
    ? dayRows.filter(row => !row.overBudget).length / dayRows.length
    : 0;
  const pillars = coveragePillars(volumes);
  const coverageFit = pillars.filter(row => row.covered).length / pillars.length;
  const daySetValues = dayRows.map(row => row.sets);
  const meanSets = daySetValues.length ? daySetValues.reduce((sum, value) => sum + value, 0) / daySetValues.length : 0;
  const worstDeviation = meanSets > 0 && daySetValues.length > 1
    ? Math.max(...daySetValues.map(value => Math.abs(value - meanSets) / meanSets))
    : 0;
  const distributionFit = Math.max(0, 1 - worstDeviation);
  const selectionPenalty = Math.min(12, (weekly.audit?.findings?.length || 0) * 3);

  const score = weekly.hasData ? Math.max(0, Math.round(
    targetFit * 35 + frequencyFit * 20 + timeFit * 20
    + distributionFit * 10 + coverageFit * 15 - selectionPenalty,
  )) : 0;
  const personalRows = muscleRows.map(row => pMap.get(row.muscle)).filter(row => row?.personalized);
  const confidence = Math.round(Math.min(100, 35
    + Math.min(25, filledDays.length * 5)
    + (personalRows.length ? personalRows.reduce((sum, row) => sum + row.confidence, 0) / personalRows.length * 0.4 : 0)));

  const findings = [];
  muscleRows.filter(row => row.status === 'under').slice(0, 3).forEach(row => findings.push({
    key: `under-${row.muscle}`, tone: 'warn', muscle: row.muscle,
    title: `${row.muscle} ${row.gap} set eksik`,
    detail: `${row.volume} set planlı; ${row.source} bandı ${row.low}–${row.high}.`,
  }));
  muscleRows.filter(row => row.status === 'over').slice(0, 3).forEach(row => findings.push({
    key: `over-${row.muscle}`, tone: 'danger', muscle: row.muscle,
    title: `${row.muscle} ${row.excess} set üst sınırın üzerinde`,
    detail: `${row.volume} set planlı; önce fazlalığı sabit tutup performans/toparlanma karşılaştır.`,
  }));
  muscleRows.filter(row => row.sessions < row.recommendedSessions && row.volume >= row.low).slice(0, 2).forEach(row => findings.push({
    key: `frequency-${row.muscle}`, tone: 'info', muscle: row.muscle,
    title: `${row.muscle} tek güne yığılmış`,
    detail: `${row.volume} seti ${row.recommendedSessions} güne dağıtmak seans sonu set kalitesini koruyabilir; toplam hacim değişmez.`,
  }));
  dayRows.filter(row => row.overBudget).forEach(row => findings.push({
    key: `time-${row.uid}`, tone: 'warn',
    title: `${row.name} süre bütçesini ${row.minutes - timeBudget} dk aşıyor`,
    detail: `Tahmin ${row.minutes} dk, seçilen bütçe ${timeBudget} dk.`,
  }));
  const missingPillars = pillars.filter(row => !row.covered);
  if (missingPillars.length) findings.push({
    key: 'coverage', tone: 'info',
    title: `${missingPillars.length} temel hareket örüntüsü boş`,
    detail: `${missingPillars.map(row => row.label).join(', ')}. Bölgesel uzmanlaşma bilinçliyse bu bir hata değildir.`,
  });
  (weekly.audit?.findings || []).slice(0, 2).forEach((finding, index) => findings.push({
    key: `selection-${index}`, tone: 'info', muscle: finding.muscle,
    title: `${finding.muscle} hareket seçimini gözden geçir`,
    detail: finding.issues?.[0]?.detail || 'Aynı işlevi tekrarlayan hareketler olabilir.',
  }));

  return {
    score,
    confidence,
    goal: PROGRAM_GOALS[goal] || PROGRAM_GOALS.growth,
    timeBudget,
    weekly,
    muscleRows,
    dayRows,
    pillars,
    findings,
    hasData: weekly.hasData,
    dimensions: [
      { key: 'target', label: 'Hacim bandı', score: Math.round(targetFit * 100) },
      { key: 'frequency', label: 'Dağılım', score: Math.round(frequencyFit * 100) },
      { key: 'time', label: 'Süre', score: Math.round(timeFit * 100) },
      { key: 'balance', label: 'Gün dengesi', score: Math.round(distributionFit * 100) },
      { key: 'coverage', label: 'Örüntü', score: Math.round(coverageFit * 100) },
    ],
  };
};

/** Mevcut hareketleri değiştirmeden setleri hedef bandına yaklaştırır. */
export const rebalanceDraftVolume = (days = [], options = {}) => {
  let next = cloneDays(days);
  const changes = [];
  const priorities = new Set(options.priorities || []);

  for (let pass = 0; pass < 80; pass += 1) {
    const audit = buildProgramAudit(next, options);
    const under = audit.muscleRows
      .filter(row => row.status === 'under')
      .sort((a, b) => Number(b.priority) - Number(a.priority) || b.gap - a.gap)[0];
    if (!under) break;

    const candidates = [];
    next.forEach((day, dayIndex) => (day.exercises || []).forEach((exercise, exerciseIndex) => {
      const contribution = detectMuscleGroup(exercise.name, options.customExercises || []).contributions?.[under.muscle] || 0;
      const sets = Number(exercise.sets) || 0;
      if (contribution > 0 && sets < 6) {
        const dayLoad = (day.exercises || []).reduce((sum, item) => sum + (Number(item.sets) || 0), 0);
        candidates.push({ dayIndex, exerciseIndex, contribution, sets, dayLoad, exercise });
      }
    }));
    candidates.sort((a, b) => b.contribution - a.contribution || a.dayLoad - b.dayLoad || a.sets - b.sets);
    const best = candidates[0];
    if (!best) break;
    next[best.dayIndex].exercises[best.exerciseIndex].sets = best.sets + 1;
    changes.push({ type: 'add', muscle: under.muscle, name: best.exercise.name, day: next[best.dayIndex].name });
  }

  // Üst sınırı aşan hacim daha temkinli azaltılır: hiçbir hareket iki setin
  // altına düşmez ve öncelikli kası taşıyan set en son seçilir.
  for (let pass = 0; pass < 80; pass += 1) {
    const audit = buildProgramAudit(next, options);
    const over = audit.muscleRows.filter(row => row.status === 'over').sort((a, b) => b.excess - a.excess)[0];
    if (!over) break;
    const candidates = [];
    next.forEach((day, dayIndex) => (day.exercises || []).forEach((exercise, exerciseIndex) => {
      const detected = detectMuscleGroup(exercise.name, options.customExercises || []);
      const contribution = detected.contributions?.[over.muscle] || 0;
      const sets = Number(exercise.sets) || 0;
      if (contribution > 0 && sets > 2) {
        const priorityCost = [...priorities].reduce((sum, muscle) => sum + (detected.contributions?.[muscle] || 0), 0);
        candidates.push({ dayIndex, exerciseIndex, contribution, sets, priorityCost, exercise });
      }
    }));
    candidates.sort((a, b) => a.priorityCost - b.priorityCost || b.contribution - a.contribution || b.sets - a.sets);
    const best = candidates[0];
    if (!best) break;
    next[best.dayIndex].exercises[best.exerciseIndex].sets = best.sets - 1;
    changes.push({ type: 'remove', muscle: over.muscle, name: best.exercise.name, day: next[best.dayIndex].name });
  }

  return { days: next, changes, audit: buildProgramAudit(next, options) };
};

/** Seansları hareket silmeden seçilen süre bütçesine yaklaştırır. */
export const trimDraftToTime = (days = [], options = {}) => {
  const next = cloneDays(days);
  const changes = [];
  const priorities = new Set(options.priorities || []);
  next.forEach((day, dayIndex) => {
    for (let pass = 0; pass < 60 && dayMinutes(day, options.restSeconds) > options.timeBudget; pass += 1) {
      const candidates = (day.exercises || []).map((exercise, exerciseIndex) => {
        const detected = detectMuscleGroup(exercise.name, options.customExercises || []);
        const priorityCost = [...priorities].reduce((sum, muscle) => sum + (detected.contributions?.[muscle] || 0), 0);
        return { exercise, exerciseIndex, sets: Number(exercise.sets) || 0, priorityCost };
      }).filter(row => row.sets > 2)
        .sort((a, b) => a.priorityCost - b.priorityCost || b.sets - a.sets);
      const best = candidates[0];
      if (!best) break;
      next[dayIndex].exercises[best.exerciseIndex].sets = best.sets - 1;
      changes.push({ type: 'trim', name: best.exercise.name, day: day.name });
    }
  });
  return { days: next, changes, audit: buildProgramAudit(next, options) };
};

/** Günleri, mevcut sıralarını bozmadan haftaya daha eşit yayar. */
export const spreadDraftWeekdays = (days = []) => {
  const weekdays = suggestedWeekdays(Math.max(1, days.length));
  return cloneDays(days).map((day, index) => ({ ...day, weekday: weekdays[index] || day.weekday }));
};
