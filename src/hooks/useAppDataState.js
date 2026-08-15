import { useState } from 'react';

/**
 * Uygulamanın kalıcı verisini görünüm/modallerin geçici state'inden ayırır.
 *
 * App.jsx hâlâ alanlar arası hesaplamaları yönetiyor; ancak hangi kaydın hangi
 * alana ait olduğu artık tek yerde açık. Yeni bir kalıcı koleksiyon eklendiğinde
 * yükleme, persistence ve yedekleme denetiminde gözden kaçma ihtimali azalır.
 */
export const useAppDataState = (initial) => {
  const [workouts, setWorkouts] = useState(initial.workouts);
  const [templates, setTemplates] = useState(initial.templates);
  const [activeWorkout, setActiveWorkout] = useState(initial.activeWorkout);

  const [customExercises, setCustomExercises] = useState(initial.customExercises);

  const [customFoods, setCustomFoods] = useState(initial.customFoods);
  const [recentFoods, setRecentFoods] = useState(initial.recentFoods);
  const [mealTemplates, setMealTemplates] = useState(initial.mealTemplates);
  const [dayTemplates, setDayTemplates] = useState(initial.dayTemplates);
  const [nutritionHistory, setNutritionHistory] = useState(initial.nutritionHistory);
  const [currentNutritionForm, setCurrentNutritionForm] = useState(initial.currentNutritionForm);

  const [metricsHistory, setMetricsHistory] = useState(initial.metricsHistory);
  const [currentMetricsForm, setCurrentMetricsForm] = useState(initial.currentMetricsForm);

  const [wellness, setWellness] = useState(initial.wellness);
  const [cycleHistory, setCycleHistory] = useState(initial.cycleHistory);

  const [settings, setSettings] = useState(initial.settings);
  const [lastBackupDate, setLastBackupDate] = useState(initial.lastBackupDate);

  return {
    training: {
      workouts, setWorkouts,
      templates, setTemplates,
      activeWorkout, setActiveWorkout,
      customExercises, setCustomExercises,
    },
    nutrition: {
      customFoods, setCustomFoods,
      recentFoods, setRecentFoods,
      mealTemplates, setMealTemplates,
      dayTemplates, setDayTemplates,
      nutritionHistory, setNutritionHistory,
      currentNutritionForm, setCurrentNutritionForm,
    },
    body: {
      metricsHistory, setMetricsHistory,
      currentMetricsForm, setCurrentMetricsForm,
    },
    recovery: {
      wellness, setWellness,
      cycleHistory, setCycleHistory,
    },
    preferences: { settings, setSettings },
    meta: { lastBackupDate, setLastBackupDate },
  };
};

