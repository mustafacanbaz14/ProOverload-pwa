/** Uygulama yedeğinin biçim sürümü; uygulama sürümünden bağımsızdır. */
export const DATA_SCHEMA_VERSION = 4;

export const DATA_SCHEMA_MIGRATIONS = [
  {
    version: 4,
    description: 'Öğün ve günlük beslenme şablonları tam yedekleme kapsamına alındı.',
  },
];

const arrayOf = (value) => Array.isArray(value) ? value : [];

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
  workouts: arrayOf(data.workouts),
  templates: arrayOf(data.templates),
  customExercises: arrayOf(data.customExercises),
  customFoods: arrayOf(data.customFoods),
  recentFoods: arrayOf(data.recentFoods),
  mealTemplates: arrayOf(data.mealTemplates),
  dayTemplates: arrayOf(data.dayTemplates),
  metricsHistory: arrayOf(data.metricsHistory),
  nutritionHistory: arrayOf(data.nutritionHistory),
  wellness: arrayOf(data.wellness),
  cycleHistory: arrayOf(data.cycleHistory),
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

  payload.schemaVersion = DATA_SCHEMA_VERSION;
  return { payload, applied };
};

