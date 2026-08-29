import { useCallback, useEffect, useMemo } from 'react';
import { createErrorThrottle } from '../utils/persist.js';
import { getBrowserDataRepository } from '../utils/dataRepository.js';

/** Kalıcı veri yazımlarını App görünüm mantığından ayırır. */
export const useAppPersistence = ({
  workouts,
  templates,
  customExercises,
  customFoods,
  recentFoods,
  mealTemplates,
  dayTemplates,
  activeWorkout,
  metricsHistory,
  nutritionHistory,
  wellness,
  cycleHistory,
  settings,
}, showToast) => {
  const repository = useMemo(() => getBrowserDataRepository(), []);
  const notifyPersistError = useMemo(
    () => createErrorThrottle((message) => showToast(message, 'error')),
    [showToast]);

  const persist = useCallback(
    (name, value) => repository.write(name, value, notifyPersistError),
    [notifyPersistError, repository]);

  useEffect(() => { persist('workouts', workouts); }, [workouts, persist]);
  useEffect(() => { persist('templates', templates); }, [templates, persist]);
  useEffect(() => { persist('custom_exercises', customExercises); }, [customExercises, persist]);
  useEffect(() => { persist('custom_foods', customFoods); }, [customFoods, persist]);
  useEffect(() => { persist('recent_foods', recentFoods); }, [recentFoods, persist]);
  useEffect(() => { persist('meal_templates', mealTemplates); }, [mealTemplates, persist]);
  useEffect(() => { persist('day_templates', dayTemplates); }, [dayTemplates, persist]);
  useEffect(() => { persist('active_workout', activeWorkout); }, [activeWorkout, persist]);
  useEffect(() => { persist('metrics', metricsHistory); }, [metricsHistory, persist]);
  useEffect(() => { persist('nutrition', nutritionHistory); }, [nutritionHistory, persist]);
  useEffect(() => { persist('wellness', wellness); }, [wellness, persist]);
  useEffect(() => { persist('cycle', cycleHistory); }, [cycleHistory, persist]);
  useEffect(() => { persist('settings', settings); }, [settings, persist]);
};
