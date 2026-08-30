import { dayKey } from './dates.js';
import { foldForSearch } from './helpers.js';

const ensureDay = (index, value) => {
  const date = dayKey(value);
  if (!date) return null;
  if (!index.has(date)) index.set(date, {
    date,
    workouts: [],
    cardio: [],
    metrics: [],
    nutrition: [],
  });
  return index.get(date);
};

/**
 * Ayrı koleksiyonları gün kartlarında birleştirir. Kaynak kayıtların kendisi
 * kopyalanmaz veya değiştirilmez; bu yalnızca arşiv için türetilmiş bir görünüm.
 */
export const buildArchiveDays = ({ workouts = [], metrics = [], nutrition = [] } = {}) => {
  const index = new Map();

  workouts.forEach(workout => {
    const day = ensureDay(index, workout?.date);
    if (!day) return;
    if ((workout.exercises || []).length > 0) day.workouts.push(workout);
    (workout.cardio || []).forEach(cardio => day.cardio.push({
      workoutId: workout.id,
      workoutName: workout.name,
      date: workout.date,
      cardio,
    }));
  });
  metrics.forEach(record => ensureDay(index, record?.date)?.metrics.push(record));
  nutrition.forEach(record => ensureDay(index, record?.date)?.nutrition.push(record));

  return [...index.values()].sort((a, b) => b.date.localeCompare(a.date));
};

export const archiveDayText = (day, activityName = value => value) => foldForSearch([
  day.date,
  ...day.workouts.flatMap(workout => [workout.name, ...(workout.exercises || []).map(exercise => exercise.name)]),
  ...day.cardio.flatMap(record => [record.workoutName, activityName(record.cardio?.type)]),
  ...day.metrics.flatMap(record => [record.weight, record.bodyFat]),
  ...day.nutrition.flatMap(record => (record.meals || []).map(meal => meal.name)),
].filter(Boolean).join(' '));

export const filterArchiveDays = (days = [], query = '', activityName) => {
  const folded = foldForSearch(query).trim();
  return folded ? days.filter(day => archiveDayText(day, activityName).includes(folded)) : days;
};
