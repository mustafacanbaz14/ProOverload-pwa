import { safeSetItem } from './persist.js';

export const PROGRAM_DRAFT_KEYS = {
  wizard: 'po_program_wizard_draft',
  builder: 'po_program_builder_draft',
};

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const text = (value, max = 120) => String(value || '').trim().slice(0, max);
const numberIn = (value, min, max, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, Math.round(parsed))) : fallback;
};
const stringList = (value, max = 100) => Array.isArray(value)
  ? [...new Set(value.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean))].slice(0, max)
  : [];
const stringMap = (value, maxKeys = 20) => {
  if (!isObject(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, maxKeys).map(([key, item]) => [
    text(key, 160),
    Array.isArray(item) ? stringList(item, 40) : text(item, 160),
  ]));
};

export const normalizeWizardDraft = (value) => {
  if (!isObject(value)) return null;
  return {
    schema: 1,
    updatedAt: text(value.updatedAt, 40) || new Date().toISOString(),
    adim: numberIn(value.adim, 0, 5, 0),
    daysPerWeek: numberIn(value.daysPerWeek, 2, 6, 4),
    splitId: text(value.splitId, 80),
    equipment: text(value.equipment, 40) || 'full',
    priority: stringList(value.priority, 2),
    preferPerformed: value.preferPerformed !== false,
    openDay: numberIn(value.openDay, 0, 6, 0),
    sessionLength: text(value.sessionLength, 30) || 'long',
    excluded: stringList(value.excluded, 100),
    locked: stringMap(value.locked),
    regenSeed: numberIn(value.regenSeed, 0, 10000, 0),
    weekdays: stringList(value.weekdays, 7),
    swaps: stringMap(value.swaps, 80),
    orderProfile: text(value.orderProfile, 40) || 'performance',
    manualOrders: stringMap(value.manualOrders),
    substitutionGoal: text(value.substitutionGoal, 40) || 'closest',
  };
};

const normalizeBuilderExercise = (exercise) => {
  if (!isObject(exercise) || !text(exercise.name, 160)) return null;
  const normalized = {
    uid: text(exercise.uid, 100),
    name: text(exercise.name, 160),
    sets: numberIn(exercise.sets, 1, 12, 3),
    superset: Boolean(exercise.superset),
  };
  if (text(exercise.backup, 160)) normalized.backup = text(exercise.backup, 160);
  if (text(exercise.plannedTechnique, 60)) normalized.plannedTechnique = text(exercise.plannedTechnique, 60);
  if (isObject(exercise.repRange)) normalized.repRange = {
    min: numberIn(exercise.repRange.min, 1, 100, 6),
    max: numberIn(exercise.repRange.max, 1, 100, 12),
  };
  return normalized;
};

export const normalizeBuilderDraft = (value) => {
  if (!isObject(value)) return null;
  const days = Array.isArray(value.days) ? value.days.slice(0, 7).map((day, index) => ({
    uid: text(day?.uid, 100),
    name: text(day?.name, 80) || `${index + 1}. Gün`,
    weekday: text(day?.weekday, 12) || 'mon',
    emphasis: text(day?.emphasis, 30) || 'standard',
    exercises: Array.isArray(day?.exercises)
      ? day.exercises.slice(0, 40).map(normalizeBuilderExercise).filter(Boolean)
      : [],
  })) : [];
  if (!days.length) return null;
  return {
    schema: 1,
    updatedAt: text(value.updatedAt, 40) || new Date().toISOString(),
    name: text(value.name, 120),
    days,
    activeDay: numberIn(value.activeDay, 0, days.length - 1, 0),
    createWeekPlan: value.createWeekPlan !== false,
  };
};

const normalizerFor = kind => kind === 'builder' ? normalizeBuilderDraft : normalizeWizardDraft;
const storageFor = storage => storage || (typeof localStorage !== 'undefined' ? localStorage : null);

export const loadProgramDraft = (kind, storage) => {
  const target = storageFor(storage);
  const key = PROGRAM_DRAFT_KEYS[kind];
  if (!target || !key) return null;
  try {
    return normalizerFor(kind)(JSON.parse(target.getItem(key)));
  } catch {
    return null;
  }
};

export const saveProgramDraft = (kind, draft, onError) => {
  const key = PROGRAM_DRAFT_KEYS[kind];
  const normalized = normalizerFor(kind)({ ...draft, updatedAt: new Date().toISOString() });
  if (!key || !normalized) return false;
  return safeSetItem(key, normalized, onError);
};

export const clearProgramDraft = (kind, storage) => {
  const target = storageFor(storage);
  const key = PROGRAM_DRAFT_KEYS[kind];
  if (!target || !key) return false;
  try {
    target.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const programDraftStatus = (storage) => {
  const wizard = loadProgramDraft('wizard', storage);
  const builder = loadProgramDraft('builder', storage);
  const candidates = [
    wizard && { kind: 'wizard', updatedAt: wizard.updatedAt, step: wizard.adim + 1 },
    builder && { kind: 'builder', updatedAt: builder.updatedAt, name: builder.name, dayCount: builder.days.length },
  ].filter(Boolean).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return { hasAny: candidates.length > 0, latest: candidates[0] || null, wizard, builder };
};
