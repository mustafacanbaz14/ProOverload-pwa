import { parseNumber } from './number.js';

export const ENERGY_SNAPSHOT_SCHEMA = 1;

const rounded = value => Math.round(parseNumber(value) * 1000) / 1000;
const text = value => typeof value === 'string' ? value : '';

const hashText = value => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

/**
 * Yalnız kullanıcının o güne yazdığı ve günün aktivite kayıtlarından türeyen
 * girdiler imzalanır. Sonraki genel ayar veya vücut ölçümü değişiklikleri imzayı
 * değiştirmez; geçmiş kaydın hesap bağlamı böyle sabit kalır.
 */
export const energyInputHash = ({ record = {}, macros = {}, exercise = {} } = {}) => hashText(JSON.stringify({
  date: text(record.date),
  entryMode: text(record.entryMode),
  dayType: text(record.dayType),
  calories: rounded(macros.calories),
  protein: rounded(macros.protein),
  carbs: rounded(macros.carbs),
  fats: rounded(macros.fats),
  manual: rounded(record.activeCaloriesOut),
  steps: rounded(record.steps),
  neatModeOverride: text(record.neatModeOverride),
  activityLevelOverride: text(record.activityLevelOverride),
  neatManualOverride: rounded(record.neatManualOverride),
  neatMultiplier: rounded(record.neatMultiplier),
  lifting: rounded(exercise.lifting),
  cardio: rounded(exercise.cardio),
  recovery: rounded(exercise.mind ?? exercise.recovery),
  activeRecovery: Boolean(exercise.activeRecovery),
}));

export const buildBodyContextSnapshot = (body = {}) => ({
  metricDate: text(body.metricDate || body.metric?.date),
  weight: rounded(body.weight || body.metric?.weight),
  bmr: rounded(body.bmr),
  bodyFat: rounded(body.bodyFat),
  ffm: rounded(body.ffm),
  ffmi: rounded(body.ffmi),
  height: rounded(body.height || body.metric?.height),
  age: rounded(body.age || body.metric?.age),
  gender: text(body.gender || body.metric?.gender),
});

export const buildEnergySnapshot = (breakdown, {
  inputHash,
  bodyContext = {},
  settingsContext = {},
  exerciseContext = {},
  capturedAt = new Date().toISOString(),
} = {}) => {
  if (!breakdown || typeof breakdown !== 'object' || !(parseNumber(breakdown.total) > 0)) return null;
  return {
    ...breakdown,
    _meta: {
      schemaVersion: ENERGY_SNAPSHOT_SCHEMA,
      inputHash: text(inputHash),
      capturedAt: text(capturedAt) || new Date().toISOString(),
      bodyContext: buildBodyContextSnapshot(bodyContext),
      settingsContext: {
        neatMode: text(settingsContext.neatMode),
        activityLevel: text(settingsContext.activityLevel),
        neatManual: rounded(settingsContext.neatManual),
        neatMultiplier: rounded(settingsContext.neatMultiplier) || 1,
        avgDailyExercise: rounded(settingsContext.avgDailyExercise),
        maintenance: rounded(settingsContext.maintenance),
      },
      exerciseContext: {
        lifting: rounded(exerciseContext.lifting),
        cardio: rounded(exerciseContext.cardio),
        recovery: rounded(exerciseContext.mind ?? exerciseContext.recovery),
        activeRecovery: Boolean(exerciseContext.activeRecovery),
      },
    },
  };
};

/** Eski, imzasız görüntüler güvenilir bağlam sayılmaz ve yeniden hesaplanır. */
export const readEnergySnapshot = (record, expectedInputHash) => {
  const snapshot = record?.energySnapshot;
  const meta = snapshot?._meta;
  if (!snapshot || typeof snapshot !== 'object' || !meta || typeof meta !== 'object') return null;
  if (Number(meta.schemaVersion) !== ENERGY_SNAPSHOT_SCHEMA) return null;
  if (!expectedInputHash || meta.inputHash !== expectedInputHash) return null;
  if (!(parseNumber(snapshot.total) > 0) || !Array.isArray(snapshot.parts)) return null;
  return snapshot;
};

