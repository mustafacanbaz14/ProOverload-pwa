import { APP_VERSION } from './constants.js';
import { createBackupPayload } from './dataSchema.js';
import { createDataRepository } from './dataRepository.js';

/**
 * React henüz açılmadan çökerse bile standart içe aktarma biçiminde bir yedek
 * üretir. En yeni anahtar yoksa v16…v13 geri dönüşleri de denenir.
 */
export const buildEmergencyBackup = (storage, exportedAt = new Date().toISOString()) => {
  const repository = createDataRepository(storage);
  const read = (name, fallback) => repository.read(name, fallback).value;
  return createBackupPayload({
    workouts: read('workouts', []),
    templates: read('templates', []),
    customExercises: read('custom_exercises', []),
    customFoods: read('custom_foods', []),
    recentFoods: read('recent_foods', []),
    mealTemplates: read('meal_templates', []),
    dayTemplates: read('day_templates', []),
    metricsHistory: read('metrics', []),
    nutritionHistory: read('nutrition', []),
    wellness: read('wellness', []),
    cycleHistory: read('cycle', []),
    settings: read('settings', {}),
  }, { version: APP_VERSION, exportedAt, emergencyRecovery: true });
};
