import { normalizePredictionHistory } from './progressionBlock.js';

/** Uygulama yedeğinin biçim sürümü; uygulama sürümünden bağımsızdır. */
export const DATA_SCHEMA_VERSION = 5;

export const DATA_SCHEMA_MIGRATIONS = [
  {
    version: 4,
    description: 'Öğün ve günlük beslenme şablonları tam yedekleme kapsamına alındı.',
  },
  {
    version: 5,
    description: 'Tahmin geçmişi ve tarihsel hesap bağlamı için koleksiyon doğrulaması güçlendirildi.',
  },
];

const arrayOf = (value) => Array.isArray(value) ? value : [];

export const BACKUP_COLLECTIONS = [
  'workouts', 'templates', 'customExercises', 'customFoods', 'recentFoods',
  'mealTemplates', 'dayTemplates', 'metricsHistory', 'nutritionHistory',
  'wellness', 'cycleHistory',
];

/**
 * Tüm dışa aktarma yolları aynı alan listesini kullanır. Bir koleksiyon eklendiğinde
 * dosya yedeği, cihaz aktarımı ve acil kurtarma birbirinden ayrılamaz.
 */
export const createBackupPayload = (data = {}, {
  version = 'unknown',
  exportedAt = new Date().toISOString(),
  emergencyRecovery = false,
} = {}) => ({
  schemaVersion: DATA_SCHEMA_VERSION,
  version,
  exportedAt,
  ...(emergencyRecovery ? { emergencyRecovery: true } : {}),
  ...Object.fromEntries(BACKUP_COLLECTIONS.map(key => [key, arrayOf(data[key])])),
  settings: data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)
    ? data.settings
    : {},
});

/**
 * Eski yedekleri state'e dokunmadan güncel biçime taşır. Göçler sürüm damgasına
 * ek olarak alan varlığına bakar; bu yüzden aynı yedeğe tekrar uygulanması güvenlidir.
 */
export const migrateBackupPayload = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { payload: input, applied: [] };
  }

  const payload = { ...input };
  const applied = [];
  const schemaVersion = Number(payload.schemaVersion || payload.schema || 0);

  if (schemaVersion < 4 || payload.mealTemplates === undefined || payload.dayTemplates === undefined) {
    if (payload.mealTemplates === undefined) payload.mealTemplates = [];
    if (payload.dayTemplates === undefined) payload.dayTemplates = [];
    applied.push(DATA_SCHEMA_MIGRATIONS[0]);
  }

  const invalidCollection = BACKUP_COLLECTIONS.some(key => !Array.isArray(payload[key]));
  const invalidSettings = !payload.settings || typeof payload.settings !== 'object'
    || Array.isArray(payload.settings);
  const rawPlans = !invalidSettings ? payload.settings.progressionPlans : null;
  const invalidPredictionHistory = rawPlans && typeof rawPlans === 'object' && !Array.isArray(rawPlans)
    && Object.values(rawPlans).some(plan => plan && typeof plan === 'object'
      && !Array.isArray(plan.predictionHistory));
  if (schemaVersion < 5 || invalidCollection || invalidSettings || invalidPredictionHistory) {
    BACKUP_COLLECTIONS.forEach(key => { payload[key] = arrayOf(payload[key]); });
    if (invalidSettings) payload.settings = {};
    const plans = payload.settings.progressionPlans;
    if (plans && typeof plans === 'object' && !Array.isArray(plans)) {
      payload.settings = {
        ...payload.settings,
        progressionPlans: Object.fromEntries(Object.entries(plans)
          .filter(([name, plan]) => name && plan && typeof plan === 'object' && !Array.isArray(plan))
          .map(([name, plan]) => [name, {
            ...plan,
            predictionHistory: normalizePredictionHistory(plan.predictionHistory),
          }])),
      };
    }
    applied.push(DATA_SCHEMA_MIGRATIONS[1]);
  }

  payload.schemaVersion = DATA_SCHEMA_VERSION;
  return { payload, applied };
};
