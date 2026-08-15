import {
  detectMuscleGroup, estimate1RM, isWorkingSet, parseNumber, suggestNextTarget,
} from './helpers.js';

const completedSets = (exercise) => (exercise?.sets || []).filter(set =>
  isWorkingSet(set) && parseNumber(set.reps) > 0
);

const round1 = value => Math.round(value * 10) / 10;

const sessionStats = (exercise, workout, resolveLoad) => {
  const sets = completedSets(exercise);
  let bestE1RM = 0;
  let bestSet = null;
  let tonnage = 0;

  sets.forEach(set => {
    const load = resolveLoad
      ? parseNumber(resolveLoad(exercise.name, set.weight, workout))
      : parseNumber(set.weight);
    const reps = parseNumber(set.reps);
    const e1rm = estimate1RM(load, reps, set.rir);
    tonnage += load * reps;
    if (e1rm > bestE1RM) {
      bestE1RM = e1rm;
      bestSet = { ...set, effectiveLoad: round1(load) };
    }
  });

  return {
    date: workout.date,
    workoutId: workout.id,
    workoutName: workout.name,
    sets,
    setCount: sets.length,
    bestE1RM: round1(bestE1RM),
    bestSet,
    tonnage: Math.round(tonnage),
  };
};

/** Hareket kütüphanesindeki tek hareket için geçmiş + hedef + kullanım özeti. */
export const buildExerciseProfile = (exerciseName, workouts = [], {
  templates = [],
  customExercises = [],
  settings = {},
  resolveLoad = null,
} = {}) => {
  if (!exerciseName) return null;

  const sessions = (workouts || [])
    .flatMap(workout => {
      const exercise = (workout.exercises || []).find(item => item.name === exerciseName);
      if (!exercise || completedSets(exercise).length === 0) return [];
      return [sessionStats(exercise, workout, resolveLoad)];
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const metric = sessions.some(item => item.bestE1RM > 0) ? 'e1rm' : 'tonnage';
  const chartSessions = sessions
    .filter(item => (metric === 'e1rm' ? item.bestE1RM : item.tonnage) > 0)
    .slice(0, 8)
    .reverse();
  const valueOf = item => metric === 'e1rm' ? item.bestE1RM : item.tonnage;
  const first = chartSessions[0] || null;
  const last = chartSessions.at(-1) || null;
  const delta = first && last ? round1(valueOf(last) - valueOf(first)) : null;
  const deltaPct = first && last && valueOf(first) > 0
    ? round1((delta / valueOf(first)) * 100)
    : null;
  const bestEver = sessions.reduce((best, item) => !best || valueOf(item) > valueOf(best) ? item : best, null);
  const { muscle, contributions, mechanics } = detectMuscleGroup(exerciseName, customExercises);
  const latest = sessions[0] || null;
  const target = latest
    ? suggestNextTarget(latest.sets, settings, muscle, {
      history: sessions.slice(0, 3).map(item => ({ date: item.date, sets: item.sets })),
    })
    : null;

  return {
    name: exerciseName,
    muscle,
    mechanics,
    contributions,
    sessions,
    sessionCount: sessions.length,
    totalSets: sessions.reduce((sum, item) => sum + item.setCount, 0),
    latest,
    bestEver,
    metric,
    trend: {
      delta,
      deltaPct,
      direction: delta === null || Math.abs(deltaPct || 0) < 1 ? 'stable' : delta > 0 ? 'up' : 'down',
    },
    chartData: chartSessions.map(item => ({
      val: valueOf(item),
      label: item.date,
    })),
    target,
    templateNames: (templates || [])
      .filter(template => (template.exercises || []).some(exercise => exercise.name === exerciseName))
      .map(template => template.name),
  };
};
