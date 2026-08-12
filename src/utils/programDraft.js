export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const SUGGESTED_WEEKDAYS = {
  1: ['mon'],
  2: ['mon', 'thu'],
  3: ['mon', 'wed', 'fri'],
  4: ['mon', 'tue', 'thu', 'fri'],
  5: ['mon', 'tue', 'wed', 'fri', 'sat'],
  6: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  7: WEEKDAY_KEYS,
};

export const suggestedWeekdays = (count = 1) =>
  (SUGGESTED_WEEKDAYS[Math.max(1, Math.min(7, Number(count) || 1))] || WEEKDAY_KEYS).slice();

export const nextUnusedWeekday = (days = []) => {
  const used = new Set((days || []).map(day => day.weekday).filter(Boolean));
  return WEEKDAY_KEYS.find(key => !used.has(key)) || 'mon';
};

export const addExercisesToDraftDay = (day, names = [], generateId, sets = 3) => {
  const current = Array.isArray(day?.exercises) ? day.exercises : [];
  const existing = new Set(current.map(ex => ex.name));
  const additions = (names || [])
    .filter(name => typeof name === 'string' && name.trim() && !existing.has(name))
    .map(name => ({ uid: generateId(), name, sets: Math.max(1, Math.min(12, Number(sets) || 3)) }));
  return { ...day, exercises: [...current, ...additions] };
};

export const replaceDraftExercise = (day, uid, name) => ({
  ...day,
  exercises: (day?.exercises || []).map(ex => ex.uid === uid ? { ...ex, name } : ex),
});

export const duplicateDraftDay = (days = [], index, generateId) => {
  if (!days[index] || days.length >= 7) return days;
  const source = days[index];
  const copy = {
    ...source,
    uid: generateId(),
    name: `${source.name} Kopya`,
    weekday: nextUnusedWeekday(days),
    exercises: (source.exercises || []).map(ex => ({ ...ex, uid: generateId() })),
  };
  const next = [...days];
  next.splice(index + 1, 0, copy);
  return next;
};

/** Sihirbaz çıktısını elle düzenlenebilir taslağa çevirir. */
export const draftFromGeneratedProgram = (built, generateId) => {
  if (!built?.days?.length) return null;
  const schedule = built.split?.schedule || {};
  const weekdayByIndex = new Map(Object.entries(schedule).map(([weekday, index]) => [index, weekday]));
  return {
    name: built.split?.name || 'Yeni Program',
    days: built.days.map((day, index) => ({
      name: day.name || `${index + 1}. Gün`,
      weekday: weekdayByIndex.get(index) || suggestedWeekdays(built.days.length)[index] || 'mon',
      exercises: (day.exercises || []).map(ex => ({
        uid: generateId(),
        name: ex.name,
        sets: Math.max(1, Math.min(12, Number(ex.sets) || 3)),
      })),
    })),
  };
};

/** Elle yazılan taslağı şablonlara ve isteğe bağlı aktif haftalık plana dönüştürür. */
export const instantiateDraftProgram = (programName, draftDays = [], generateId, createdAt = new Date().toISOString()) => {
  const filled = (draftDays || []).filter(day => (day.exercises || []).length > 0);
  const templates = filled.map(day => ({
    id: generateId(),
    name: `${programName} — ${day.name}`,
    createdAt,
    exercises: day.exercises.map(ex => ({
      name: ex.name,
      supersetId: null,
      sets: Array.from({ length: Math.max(1, Number(ex.sets) || 1) }, () => ({
        id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal',
      })),
    })),
  }));

  const planDays = Object.fromEntries(WEEKDAY_KEYS.map(key => [key, []]));
  filled.forEach((day, index) => {
    const template = templates[index];
    const weekday = WEEKDAY_KEYS.includes(day.weekday) ? day.weekday : suggestedWeekdays(filled.length)[index];
    if (!template || !weekday) return;
    planDays[weekday].push({ id: generateId(), type: 'workout', templateId: template.id, time: '' });
  });

  return {
    templates,
    plan: { id: generateId(), name: programName, days: planDays },
  };
};
