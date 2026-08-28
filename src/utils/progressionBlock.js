import { parseNumber } from './number.js';

/**
 * Hareket bazlı çok haftalı ilerleme bloğu.
 *
 * Bu motor bir "optimal program" iddiası taşımaz. Çift ilerleme, RIR,
 * top-set/back-off ve dalgalı yükleme aynı hedefe giden farklı uygulama
 * biçimleridir. Kullanıcı modeli seçer; motorun görevi seçilen kuralı tutarlı,
 * ölçülebilir ve geçmişe dönük denetlenebilir hale getirmektir.
 */

export const PROGRESSION_BLOCK_MODELS = {
  double: {
    key: 'double', label: 'Çift İlerleme', short: 'Çift',
    hint: 'Önce tekrar, aralığın üstünde yük artışı',
  },
  rir: {
    key: 'rir', label: 'RIR Oto-regülasyon', short: 'RIR',
    hint: 'Yükü hedef yedek tekrara göre yönet',
  },
  topBackoff: {
    key: 'topBackoff', label: 'Tepe + Geri Çekme', short: 'Tepe',
    hint: 'Bir ağır tepe seti, ardından daha hafif hacim',
  },
  wave: {
    key: 'wave', label: 'Dalgalı Yükleme', short: 'Dalga',
    hint: 'Ağır, orta ve hafif günleri sırayla uygula',
  },
  technique: {
    key: 'technique', label: 'Teknik / Sabit Yük', short: 'Teknik',
    hint: 'Yükü sabit tut, temiz tekrar ve formu izle',
  },
};

export const PROGRESSION_BLOCK_MODEL_KEYS = Object.keys(PROGRESSION_BLOCK_MODELS);

const DAY_MS = 24 * 60 * 60 * 1000;
const round1 = value => Math.round(parseNumber(value) * 10) / 10;
const clamp = (value, min, max, fallback = min) => {
  const number = parseNumber(value);
  return Math.min(max, Math.max(min, Number.isFinite(number) ? number : fallback));
};
const isoDay = value => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '';
};
const round2 = value => Math.round(parseNumber(value) * 100) / 100;
const median = values => {
  const sorted = (values || []).filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const isWorking = set => set?.setType !== 'warmup';
const isCompleted = set => isWorking(set) && parseNumber(set?.reps) > 0;

const PREDICTION_HISTORY_LIMIT = 36;
const PREDICTION_STATUSES = new Set(['projected', 'reached']);
const CONFIDENCE_LEVELS = new Set(['low', 'medium', 'high']);

const normalizeScenario = (scenario, fallbackKey = '') => {
  if (!scenario || typeof scenario !== 'object') return null;
  const key = ['optimistic', 'current', 'conservative'].includes(scenario.key)
    ? scenario.key : fallbackKey;
  if (!key) return null;
  return {
    key,
    label: typeof scenario.label === 'string' ? scenario.label : key,
    days: Math.max(0, Math.round(parseNumber(scenario.days))),
    date: isoDay(scenario.date),
    weeklySlope: round2(scenario.weeklySlope),
  };
};

/** LocalStorage/yedekte yalnız küçük ve denetlenebilir ETA anlık görüntüleri tutulur. */
export const normalizePredictionHistory = value => (Array.isArray(value) ? value : [])
  .map(entry => {
    if (!entry || typeof entry !== 'object' || !PREDICTION_STATUSES.has(entry.status)) return null;
    const asOf = isoDay(entry.asOf || entry.capturedAt);
    if (!asOf) return null;
    return {
      asOf,
      capturedAt: typeof entry.capturedAt === 'string' ? entry.capturedAt : `${asOf}T12:00:00.000Z`,
      status: entry.status,
      targetE1RM: round1(entry.targetE1RM),
      targetWeight: round1(entry.targetWeight),
      targetReps: Math.max(0, Math.round(parseNumber(entry.targetReps))),
      date: isoDay(entry.date),
      rangeStart: isoDay(entry.rangeStart),
      rangeEnd: isoDay(entry.rangeEnd),
      confidence: CONFIDENCE_LEVELS.has(entry.confidence) ? entry.confidence : 'low',
      pointCount: Math.max(0, Math.round(parseNumber(entry.pointCount))),
      spanDays: Math.max(0, Math.round(parseNumber(entry.spanDays))),
      slope: round2(entry.slope),
      backtestMaeKg: round2(entry.backtestMaeKg),
      scenarios: (Array.isArray(entry.scenarios) ? entry.scenarios : [])
        .map((scenario, index) => normalizeScenario(
          scenario, ['optimistic', 'current', 'conservative'][index],
        ))
        .filter(Boolean),
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.asOf.localeCompare(b.asOf))
  .slice(-PREDICTION_HISTORY_LIMIT);

/** Kullanıcının erişebildiği plaka/dambıl artışına yuvarlar. */
export const roundToLoadStep = (value, step = 2.5) => {
  const safeStep = clamp(step, 0.25, 50, 2.5);
  return round1(Math.max(0, Math.round(parseNumber(value) / safeStep) * safeStep));
};

const estimateE1RM = (weight, reps, rir = 0) => {
  const kg = parseNumber(weight);
  const done = parseNumber(reps);
  if (!(kg > 0) || !(done > 0)) return 0;
  const effectiveReps = Math.min(15, done + Math.max(0, parseNumber(rir)));
  return round1(kg * (1 + effectiveReps / 30));
};

export const normalizeProgressionPlan = (exerciseName, raw = {}, {
  today = '', id = '', updatedAt = '',
} = {}) => {
  if (!exerciseName || !raw || typeof raw !== 'object') return null;
  const mode = PROGRESSION_BLOCK_MODEL_KEYS.includes(raw.mode) ? raw.mode : 'double';
  const repMin = Math.round(clamp(raw.repMin, 1, 50, 6));
  const repMax = Math.round(clamp(raw.repMax, repMin, 50, Math.max(repMin, 10)));
  const startWeight = round1(clamp(raw.startWeight, 0, 1000, 0));
  const targetWeightRaw = round1(clamp(raw.targetWeight, 0, 1000, startWeight));
  const targetWeight = startWeight > 0 ? Math.max(startWeight, targetWeightRaw) : targetWeightRaw;
  const date = isoDay(raw.startDate || today) || isoDay(new Date());
  const stableId = String(raw.id || id || `pb-${exerciseName}-${date}`).trim();

  return {
    id: stableId,
    exerciseName,
    active: raw.active !== false,
    mode,
    startDate: date,
    weeks: Math.round(clamp(raw.weeks, 3, 12, 6)),
    sessionsPerWeek: Math.round(clamp(raw.sessionsPerWeek, 1, 4, 1)),
    sets: Math.round(clamp(raw.sets, 1, 8, 3)),
    repMin,
    repMax,
    startWeight,
    targetWeight,
    targetReps: Math.round(clamp(raw.targetReps, repMin, repMax, repMax)),
    targetRir: Math.round(clamp(raw.targetRir, 0, 5, 2)),
    increment: roundToLoadStep(clamp(raw.increment, 0.25, 20, 2.5), 0.25),
    backoffPercent: Math.round(clamp(raw.backoffPercent, 5, 30, 10)),
    deloadLastWeek: Boolean(raw.deloadLastWeek),
    predictionHistory: normalizePredictionHistory(raw.predictionHistory),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : (updatedAt || new Date().toISOString()),
    updatedAt: updatedAt || (typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString()),
  };
};

export const progressionPlanDefaults = (exerciseName, profile = null, repRange = {}, increment = 2.5) => {
  const latest = profile?.latest;
  const best = latest?.bestSet;
  const enteredLoad = round1(parseNumber(best?.weight));
  const effectiveLoad = round1(parseNumber(best?.effectiveLoad));
  const startWeight = enteredLoad > 0 ? enteredLoad : 0;
  const repMin = Math.max(1, Math.round(parseNumber(repRange?.min) || 6));
  const repMax = Math.max(repMin, Math.round(parseNumber(repRange?.max) || 10));
  const step = roundToLoadStep(increment || 2.5, 0.25);

  return {
    mode: 'double', weeks: 6, sessionsPerWeek: 1,
    sets: Math.min(5, Math.max(2, latest?.setCount || 3)),
    repMin, repMax, startWeight,
    targetWeight: startWeight > 0 ? roundToLoadStep(startWeight + step * 3, step) : 0,
    targetReps: repMax, targetRir: 2, increment: step,
    backoffPercent: 10, deloadLastWeek: false,
    effectiveLoadHint: effectiveLoad,
  };
};

const capAtGoal = (weight, plan) => {
  if (!(plan.targetWeight > 0)) return roundToLoadStep(weight, plan.increment);
  return roundToLoadStep(Math.min(weight, plan.targetWeight), plan.increment);
};

const makeSet = (kind, weight, reps, rir) => ({
  kind, weight: round1(weight), reps: Math.max(1, Math.round(reps)), rir: Math.round(rir),
});

const transformPrescription = (prescription, {
  loadFactor = 1, setFactor = 1, rirDelta = 0, reason = '', adaptation = '',
} = {}) => {
  const wanted = Math.max(1, Math.ceil(prescription.sets.length * setFactor));
  return {
    ...prescription,
    sets: prescription.sets.slice(0, wanted).map(set => ({
      ...set,
      weight: roundToLoadStep(set.weight * loadFactor, prescription.increment),
      rir: Math.min(5, Math.max(0, set.rir + rirDelta)),
    })),
    adaptation: adaptation || prescription.adaptation || '',
    adaptationReason: reason || prescription.adaptationReason || '',
  };
};

/** Bir bloktaki belirli seansın planlanan reçetesi. */
export const prescriptionForSession = (rawPlan, sessionIndex, runtime = {}) => {
  const plan = normalizeProgressionPlan(rawPlan?.exerciseName, rawPlan, {
    today: rawPlan?.startDate,
    id: rawPlan?.id,
    updatedAt: rawPlan?.updatedAt,
  });
  if (!plan) return null;
  const totalSessions = plan.weeks * plan.sessionsPerWeek;
  const index = Math.max(0, Math.min(totalSessions - 1, Math.round(parseNumber(sessionIndex))));
  const weekIndex = Math.floor(index / plan.sessionsPerWeek);
  const withinWeek = index % plan.sessionsPerWeek;
  let sets = [];
  let phase = '';

  if (plan.mode === 'double') {
    const span = plan.repMax - plan.repMin + 1;
    const loadCycle = Math.floor(index / span);
    const reps = plan.repMin + (index % span);
    const load = capAtGoal(plan.startWeight + loadCycle * plan.increment, plan);
    sets = Array.from({ length: plan.sets }, () => makeSet('work', load, reps, plan.targetRir));
    phase = reps === plan.repMax ? 'Tekrar bandının üstü' : 'Tekrar biriktirme';
  } else if (plan.mode === 'rir') {
    const load = capAtGoal(plan.startWeight + Math.floor(index / 2) * plan.increment, plan);
    sets = Array.from({ length: plan.sets }, () => makeSet('work', load, plan.targetReps, plan.targetRir));
    phase = 'RIR kalibrasyonu';
  } else if (plan.mode === 'topBackoff') {
    const top = capAtGoal(plan.startWeight + Math.floor(index / 2) * plan.increment, plan);
    const backoff = roundToLoadStep(top * (1 - plan.backoffPercent / 100), plan.increment);
    sets = [makeSet('top', top, plan.repMin, plan.targetRir)];
    for (let i = 1; i < plan.sets; i += 1) {
      sets.push(makeSet('backoff', backoff, Math.min(plan.repMax, plan.repMin + 2), Math.min(5, plan.targetRir + 1)));
    }
    phase = 'Tepe set + hacim';
  } else if (plan.mode === 'wave') {
    const wave = index % 3;
    const cycleLoad = plan.startWeight + Math.floor(index / 3) * plan.increment;
    const configs = [
      { label: 'Ağır', factor: 1, reps: plan.repMin, rir: plan.targetRir },
      { label: 'Orta', factor: 0.9, reps: Math.round((plan.repMin + plan.repMax) / 2), rir: plan.targetRir + 1 },
      { label: 'Hafif', factor: 0.825, reps: plan.repMax, rir: plan.targetRir + 1 },
    ];
    const config = configs[wave];
    const load = capAtGoal(cycleLoad * config.factor, plan);
    sets = Array.from({ length: plan.sets }, () => makeSet('work', load, config.reps, Math.min(5, config.rir)));
    phase = `${config.label} dalga`;
  } else {
    sets = Array.from({ length: plan.sets }, () => makeSet(
      'technique', plan.startWeight, plan.targetReps, Math.max(3, plan.targetRir),
    ));
    phase = 'Teknik ve tekrar kalitesi';
  }

  let prescription = {
    planId: plan.id,
    exerciseName: plan.exerciseName,
    mode: plan.mode,
    modelLabel: PROGRESSION_BLOCK_MODELS[plan.mode].label,
    sessionIndex: index,
    totalSessions,
    weekIndex,
    withinWeek,
    phase,
    increment: plan.increment,
    sets,
    createdFor: runtime.today || '',
    adaptation: '',
    adaptationReason: '',
  };

  const plannedDeload = plan.deloadLastWeek && weekIndex === plan.weeks - 1;
  if (plannedDeload) {
    prescription = transformPrescription(prescription, {
      loadFactor: 0.9, setFactor: 0.5, rirDelta: 2,
      adaptation: 'planned-deload',
      reason: 'Son hafta tam bırakmak yerine yük ve hacim azaltıldı.',
    });
    prescription.phase = 'Planlı hafifletme';
  }

  if (runtime.deloadActive && !plannedDeload) {
    prescription = transformPrescription(prescription, {
      loadFactor: 0.9, setFactor: 0.5, rirDelta: 2,
      adaptation: 'active-deload',
      reason: 'Etkin deload ayarı bugünkü reçeteye uygulandı.',
    });
  }

  const score = parseNumber(runtime.readiness?.score);
  const jointPain = parseNumber(runtime.readiness?.jointPain);
  if (score > 0 && (score < 40 || jointPain >= 8)) {
    prescription = transformPrescription(prescription, {
      loadFactor: 0.9, setFactor: 0.5, rirDelta: 2,
      adaptation: 'critical-readiness',
      reason: jointPain >= 8
        ? 'Yüksek eklem ağrısı bildirimi nedeniyle yalnızca bugünün yükü azaltıldı.'
        : 'Kritik hazır oluş nedeniyle yalnızca bugünün yükü ve seti azaltıldı.',
    });
  } else if (score >= 40 && score < 60) {
    prescription = transformPrescription(prescription, {
      loadFactor: 0.95, setFactor: plan.sets > 2 ? (plan.sets - 1) / plan.sets : 1,
      rirDelta: 1, adaptation: 'moderate-readiness',
      reason: 'Orta hazır oluş nedeniyle yalnızca bugünün reçetesi ölçülü azaltıldı.',
    });
  }

  return prescription;
};

/** Plan ile yapılan setleri puanlar; boş setler veri sayılmaz. */
export const evaluatePrescription = (prescription, exercise, {
  final = false, requireCompleted = false,
} = {}) => {
  const targets = Array.isArray(prescription?.sets) ? prescription.sets : [];
  const actual = (exercise?.sets || []).filter(set =>
    isCompleted(set) && (!requireCompleted || Boolean(set.completed)));
  if (targets.length === 0 || actual.length === 0) {
    return { status: 'pending', score: null, completedSets: actual.length, plannedSets: targets.length, metSets: 0 };
  }

  let metSets = 0;
  let points = 0;
  targets.forEach((target, index) => {
    const set = actual[index];
    if (!set) return;
    const weightOk = !(parseNumber(target.weight) > 0)
      || parseNumber(set.weight) + 0.01 >= parseNumber(target.weight);
    const repsOk = parseNumber(set.reps) >= parseNumber(target.reps);
    if (weightOk && repsOk) {
      metSets += 1;
      points += 1;
      return;
    }
    const weightRatio = parseNumber(target.weight) > 0
      ? Math.min(1, parseNumber(set.weight) / parseNumber(target.weight))
      : 1;
    const repRatio = Math.min(1, parseNumber(set.reps) / Math.max(1, parseNumber(target.reps)));
    points += weightRatio * repRatio;
  });
  const score = Math.round((points / targets.length) * 100);
  const allMet = metSets === targets.length;
  let status = allMet ? 'met' : score >= 70 ? 'partial' : (final ? 'missed' : 'partial');
  if (!final && actual.length < targets.length && !allMet) status = 'partial';
  return { status, score, completedSets: actual.length, plannedSets: targets.length, metSets };
};

const exerciseSessions = (exerciseName, workouts = [], { resolveLoad = null } = {}) => {
  const sessions = [];
  (workouts || []).forEach(workout => {
    const exercise = (workout?.exercises || []).find(item => item?.name === exerciseName);
    const sets = (exercise?.sets || []).filter(isCompleted);
    if (!exercise || sets.length === 0) return;
    let bestE1RM = 0;
    let bestSet = null;
    sets.forEach(set => {
      const weight = resolveLoad
        ? parseNumber(resolveLoad(exerciseName, set.weight, workout))
        : parseNumber(set.weight);
      const e1rm = estimateE1RM(weight, set.reps, set.rir);
      if (e1rm > bestE1RM) {
        bestE1RM = e1rm;
        bestSet = { weight: round1(weight), reps: parseNumber(set.reps), rir: parseNumber(set.rir) };
      }
    });
    sessions.push({
      date: workout.date,
      workoutId: workout.id,
      exercise,
      bestE1RM,
      bestSet,
      bodyWeight: parseNumber(workout?.bodyContextSnapshot?.weight)
        || parseNumber(workout?.weightAtTime),
      prescription: exercise.progressionPrescription || null,
    });
  });
  return sessions.sort((a, b) => String(a.date).localeCompare(String(b.date)));
};

const progressionPoints = sessions => {
  const byDay = new Map();
  (sessions || []).forEach(item => {
    const date = isoDay(item?.date);
    const e1rm = parseNumber(item?.bestE1RM);
    const plannedDeload = item?.prescription?.adaptation === 'planned-deload';
    if (!date || !(e1rm > 0) || plannedDeload) return;
    const existing = byDay.get(date);
    if (!existing || e1rm > existing.bestE1RM) byDay.set(date, { ...item, date, bestE1RM: e1rm });
  });
  return [...byDay.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-16);
};

/** Aykırı tek seansın eğimi sürüklememesi için Theil–Sen kestirimi. */
const robustTrend = points => {
  if (!Array.isArray(points) || points.length < 2) return null;
  const origin = new Date(points[0].date).getTime();
  const values = points.map(point => ({
    x: (new Date(point.date).getTime() - origin) / DAY_MS,
    y: parseNumber(point.bestE1RM),
  }));
  const slopes = [];
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      const delta = values[j].x - values[i].x;
      if (delta > 0) slopes.push((values[j].y - values[i].y) / delta);
    }
  }
  const slope = median(slopes);
  const intercept = median(values.map(point => point.y - slope * point.x));
  const meanY = values.reduce((sum, point) => sum + point.y, 0) / values.length;
  const variance = values.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
  const residual = values.reduce((sum, point) => sum + (point.y - (intercept + slope * point.x)) ** 2, 0);
  const r2 = variance > 0 ? Math.max(0, Math.min(1, 1 - residual / variance)) : 0;
  return {
    slope,
    intercept,
    r2,
    values,
    origin,
    spanDays: Math.round(values.at(-1).x - values[0].x),
  };
};

const progressionBacktest = points => {
  const errors = [];
  for (let index = 4; index < points.length; index += 1) {
    const training = points.slice(0, index);
    const fit = robustTrend(training);
    if (!fit || !(fit.slope > 0)) continue;
    const next = points[index];
    const x = (new Date(next.date).getTime() - fit.origin) / DAY_MS;
    const predicted = fit.intercept + fit.slope * x;
    if (!Number.isFinite(predicted)) continue;
    errors.push(predicted - next.bestE1RM);
  }
  if (errors.length === 0) return { samples: 0, maeKg: null, biasKg: null, quality: 'unknown' };
  const maeKg = errors.reduce((sum, error) => sum + Math.abs(error), 0) / errors.length;
  const biasKg = errors.reduce((sum, error) => sum + error, 0) / errors.length;
  return {
    samples: errors.length,
    maeKg: round2(maeKg),
    biasKg: round2(biasKg),
    quality: maeKg <= 2.5 ? 'high' : maeKg <= 5 ? 'medium' : 'low',
  };
};

const dateAfter = (date, days) => new Date(
  new Date(date).getTime() + Math.max(0, Math.round(days)) * DAY_MS,
).toISOString().slice(0, 10);

const scenarioFromSlope = (key, label, slope, gap, latestDate) => {
  const days = Math.ceil(gap / slope);
  if (!(days >= 0) || days > 730) return null;
  return { key, label, days, date: dateAfter(latestDate, days), weeklySlope: round2(slope * 7) };
};

/**
 * Tarihsel e1RM eğiliminden hedef aralığı üretir.
 * Bu bir nedensel model değildir: üç senaryo geçmiş eğilimin sürmesi halinde
 * oluşabilecek takvim aralığını gösterir; hedef tarihi garanti etmez.
 */
export const estimateProgressionEta = (plan, sessions = [], context = {}) => {
  const targetE1RM = estimateE1RM(plan?.targetWeight, plan?.targetReps, plan?.targetRir);
  const points = progressionPoints(sessions);
  const latest = points.at(-1);
  if (!(targetE1RM > 0)) {
    return { status: 'insufficient', reason: 'target', targetE1RM, confidence: 'low', days: null, date: null, pointCount: points.length, spanDays: 0 };
  }
  if (latest?.bestE1RM >= targetE1RM) {
    const date = latest.date;
    return {
      status: 'reached', targetE1RM, confidence: 'high', confidenceScore: 100,
      days: 0, date, rangeStart: date, rangeEnd: date, slope: 0, r2: 1,
      pointCount: points.length, spanDays: points.length > 1
        ? Math.round((new Date(date) - new Date(points[0].date)) / DAY_MS) : 0,
      scenarios: [], backtest: progressionBacktest(points),
    };
  }

  const fit = robustTrend(points);
  const spanDays = fit?.spanDays || 0;
  if (points.length < 6 || spanDays < 21) {
    return {
      status: 'insufficient', reason: points.length < 6 ? 'sessions' : 'span',
      targetE1RM, confidence: 'low', days: null, date: null,
      pointCount: points.length, spanDays, neededSessions: Math.max(0, 6 - points.length),
      neededDays: Math.max(0, 21 - spanDays), backtest: progressionBacktest(points),
    };
  }
  if (!fit || !(fit.slope > 0)) {
    return {
      status: 'indeterminate', reason: 'nonpositive-trend', targetE1RM,
      confidence: 'low', days: null, date: null, slope: round2((fit?.slope || 0) * 7),
      r2: round2(fit?.r2 || 0), pointCount: points.length, spanDays,
      backtest: progressionBacktest(points),
    };
  }

  const actualFrequency = points.length > 1 ? ((points.length - 1) * 7) / spanDays : 0;
  const plannedFrequency = Math.max(1, parseNumber(plan?.sessionsPerWeek) || 1);
  const frequencyRatio = Math.min(1.5, actualFrequency / plannedFrequency);
  const adherence = context.adherence === null || context.adherence === undefined
    ? null : Math.max(0, Math.min(100, parseNumber(context.adherence)));
  const adherenceRatio = adherence === null ? 0.8 : adherence / 100;
  const optimisticFactor = Math.min(1.3, Math.max(1.15, 1.15 + frequencyRatio * 0.1));
  const conservativeFactor = Math.min(0.78, Math.max(0.55, 0.55 + adherenceRatio * 0.22));
  const gap = targetE1RM - latest.bestE1RM;
  const scenarios = [
    scenarioFromSlope('optimistic', 'İyimser', fit.slope * optimisticFactor, gap, latest.date),
    scenarioFromSlope('current', 'Mevcut eğilim', fit.slope, gap, latest.date),
    scenarioFromSlope('conservative', 'Temkinli', fit.slope * conservativeFactor, gap, latest.date),
  ];
  if (scenarios.some(scenario => !scenario)) {
    return {
      status: 'indeterminate', reason: 'horizon', targetE1RM, confidence: 'low',
      days: null, date: null, slope: round2(fit.slope * 7), r2: round2(fit.r2),
      pointCount: points.length, spanDays, backtest: progressionBacktest(points),
    };
  }

  const backtest = progressionBacktest(points);
  const pointScore = Math.min(30, Math.max(0, points.length - 5) * 7.5);
  const spanScore = Math.min(25, spanDays / 42 * 25);
  const fitScore = fit.r2 * 25;
  const backtestScore = backtest.quality === 'high' ? 20 : backtest.quality === 'medium' ? 12 : backtest.quality === 'low' ? 4 : 0;
  const confidenceScore = Math.round(pointScore + spanScore + fitScore + backtestScore);
  const confidence = confidenceScore >= 78 ? 'high' : confidenceScore >= 52 ? 'medium' : 'low';
  const bodyWeights = points.filter(point => parseNumber(point.bodyWeight) > 0)
    .map(point => ({ ...point, bestE1RM: parseNumber(point.bodyWeight) }));
  const bodyTrend = bodyWeights.length >= 3 ? robustTrend(bodyWeights) : null;
  const current = scenarios[1];

  return {
    status: 'projected', targetE1RM, confidence, confidenceScore,
    days: current.days, date: current.date,
    rangeStart: scenarios[0].date, rangeEnd: scenarios[2].date,
    slope: round2(fit.slope * 7), r2: round2(fit.r2),
    pointCount: points.length, spanDays, scenarios, backtest,
    context: {
      adherence,
      actualSessionsPerWeek: round2(actualFrequency),
      plannedSessionsPerWeek: plannedFrequency,
      missedSessions: Math.max(0, Math.round(parseNumber(context.missedSessions))),
      bodyWeightWeeklyTrend: bodyTrend ? round2(bodyTrend.slope * 7) : null,
    },
  };
};

export const predictionSnapshotFromEta = (plan, eta, asOf = new Date()) => {
  if (!eta || !PREDICTION_STATUSES.has(eta.status)) return null;
  const date = isoDay(asOf);
  if (!date) return null;
  return normalizePredictionHistory([{
    asOf: date,
    capturedAt: asOf instanceof Date ? asOf.toISOString() : `${date}T12:00:00.000Z`,
    status: eta.status,
    targetE1RM: eta.targetE1RM,
    targetWeight: plan?.targetWeight,
    targetReps: plan?.targetReps,
    date: eta.date,
    rangeStart: eta.rangeStart,
    rangeEnd: eta.rangeEnd,
    confidence: eta.confidence,
    pointCount: eta.pointCount,
    spanDays: eta.spanDays,
    slope: eta.slope,
    backtestMaeKg: eta.backtest?.maeKg,
    scenarios: eta.scenarios,
  }])[0] || null;
};

/** Aynı gün ve aynı hedef için ikinci kayıt oluşturmak yerine son tahmini yeniler. */
export const appendPredictionSnapshot = (plan, eta, asOf = new Date()) => {
  const snapshot = predictionSnapshotFromEta(plan, eta, asOf);
  if (!snapshot) return plan;
  const history = normalizePredictionHistory(plan?.predictionHistory);
  const filtered = history.filter(entry => !(
    entry.asOf === snapshot.asOf && entry.targetE1RM === snapshot.targetE1RM
  ));
  return { ...plan, predictionHistory: [...filtered, snapshot].slice(-PREDICTION_HISTORY_LIMIT) };
};

const recoveryPrescription = (base, missedStreak) => {
  if (!base || missedStreak <= 0) return base;
  if (missedStreak === 1) {
    return {
      ...base,
      recoveryAction: 'repeat',
      adaptationReason: 'Bir hedef kaçtı; yük düşürmeden aynı reçete bir kez daha deneniyor.',
    };
  }
  const reset = transformPrescription(base, {
    loadFactor: 0.95, adaptation: 'miss-reset',
    reason: 'Ardışık iki belirgin hedef kaçırıldı; yük %5 geri çekildi, blok sürüyor.',
  });
  return { ...reset, recoveryAction: 'reset' };
};

/** Tek hareketin blok durumu, sıradaki reçetesi, uyumu ve ETA'sı. */
export const buildProgressionBlockReport = (exerciseName, rawPlan, workouts = [], runtime = {}) => {
  const plan = normalizeProgressionPlan(exerciseName, rawPlan, {
    today: runtime.today || rawPlan?.startDate,
    id: rawPlan?.id,
    updatedAt: rawPlan?.updatedAt,
  });
  if (!plan?.active) return null;
  const sessions = exerciseSessions(exerciseName, workouts, runtime);
  const planSessions = sessions
    .filter(item => item.prescription?.planId === plan.id)
    .map(item => ({
      ...item,
      evaluation: evaluatePrescription(item.prescription, item.exercise, {
        final: true,
        requireCompleted: true,
      }),
    }))
    // Sırf seans açılıp kaydedildi diye blok ilerlemez. En az bir planlı
    // çalışma setinin gerçekten tamamlanmış olması gerekir.
    .filter(item => item.evaluation.status !== 'pending');
  const totalSessions = plan.weeks * plan.sessionsPerWeek;
  const completedSessions = planSessions.length;
  const nextIndex = Math.min(completedSessions, Math.max(0, totalSessions - 1));
  let nextPrescription = prescriptionForSession(plan, nextIndex, runtime);

  let missedStreak = 0;
  for (let i = planSessions.length - 1; i >= 0; i -= 1) {
    if (planSessions[i].evaluation.status !== 'missed') break;
    missedStreak += 1;
  }
  if (missedStreak > 0 && planSessions.length > 0) {
    const last = planSessions.at(-1).prescription;
    nextPrescription = recoveryPrescription({
      ...last,
      sessionIndex: nextIndex,
      createdFor: runtime.today || '',
    }, missedStreak);
  } else if (plan.mode === 'rir' && planSessions.length > 0 && nextPrescription) {
    const latestSets = (planSessions.at(-1).exercise?.sets || []).filter(isCompleted);
    if (latestSets.length > 0) {
      const averageRir = latestSets.reduce((sum, set) => sum + parseNumber(set.rir), 0) / latestSets.length;
      const lastLoad = Math.max(...latestSets.map(set => parseNumber(set.weight)));
      let nextLoad = lastLoad;
      let reason = `RIR ${round1(averageRir)} hedefin etrafında; yük korunuyor.`;
      if (averageRir >= plan.targetRir + 1) {
        nextLoad = lastLoad + plan.increment;
        reason = `Ortalama RIR ${round1(averageRir)}, hedef ${plan.targetRir}; yük bir adım artırıldı.`;
      } else if (averageRir <= plan.targetRir - 1) {
        nextLoad = Math.max(0, lastLoad - plan.increment);
        reason = `Ortalama RIR ${round1(averageRir)}, hedef ${plan.targetRir}; yük bir adım azaltıldı.`;
      }
      nextPrescription = {
        ...nextPrescription,
        sets: nextPrescription.sets.map(set => ({
          ...set,
          weight: capAtGoal(roundToLoadStep(nextLoad, plan.increment), plan),
        })),
        adaptation: 'rir-calibration',
        adaptationReason: reason,
      };
    }
  }

  const measured = planSessions.filter(item => item.evaluation.score !== null);
  const adherence = measured.length > 0
    ? Math.round(measured.reduce((sum, item) => sum + item.evaluation.score, 0) / measured.length)
    : null;
  const met = measured.filter(item => item.evaluation.status === 'met').length;
  const partial = measured.filter(item => item.evaluation.status === 'partial').length;
  const missed = measured.filter(item => item.evaluation.status === 'missed').length;
  const eta = estimateProgressionEta(plan, sessions, {
    adherence,
    completedSessions,
    missedSessions: missed,
  });
  const targetReached = eta.status === 'reached';
  const complete = targetReached || completedSessions >= totalSessions;

  return {
    plan,
    totalSessions,
    completedSessions,
    remainingSessions: Math.max(0, totalSessions - completedSessions),
    currentWeek: Math.min(plan.weeks, Math.floor(completedSessions / plan.sessionsPerWeek) + 1),
    nextPrescription: complete ? null : nextPrescription,
    complete,
    completionReason: targetReached ? 'target' : completedSessions >= totalSessions ? 'calendar' : '',
    missedStreak,
    adherence,
    outcomes: { measured: measured.length, met, partial, missed },
    eta,
    sessions: planSessions.slice().reverse(),
    schedule: Array.from({ length: totalSessions }, (_, index) => prescriptionForSession(plan, index)),
  };
};

/**
 * Reçeteyi yalnızca boş çalışma setlerine uygular. Kullanıcının girdiği kilo,
 * tekrar veya tamamlanmış set asla ezilmez; eksik plan yuvaları eklenir.
 */
export const applyProgressionPrescription = (exercise, prescription, generateId = () => `set-${Date.now()}`) => {
  if (!exercise || !prescription?.sets?.length) return exercise;
  const sets = [...(exercise.sets || [])];
  const workingIndexes = sets
    .map((set, index) => (isWorking(set) ? index : -1))
    .filter(index => index >= 0);

  prescription.sets.forEach((target, targetIndex) => {
    const existingIndex = workingIndexes[targetIndex];
    const plannedTarget = {
      planId: prescription.planId,
      sessionIndex: prescription.sessionIndex,
      kind: target.kind,
      weight: target.weight,
      reps: target.reps,
      rir: target.rir,
    };
    if (existingIndex === undefined) {
      sets.push({
        id: generateId(), weight: String(target.weight || ''), reps: '',
        rir: target.rir, tempo: '', formRating: 8, setType: 'normal', plannedTarget,
      });
      return;
    }
    const existing = sets[existingIndex];
    const hasUserData = parseNumber(existing.weight) > 0
      || parseNumber(existing.reps) > 0
      || existing.completed;
    sets[existingIndex] = hasUserData
      ? { ...existing, plannedTarget }
      : {
        ...existing,
        weight: String(target.weight || ''), reps: '', rir: target.rir,
        plannedTarget,
      };
  });

  return { ...exercise, sets, progressionPrescription: prescription };
};

/** Tüm etkin blokları merkez kartında göstermek için küçük özet. */
export const activeProgressionBlocks = (plans = {}, workouts = [], runtime = {}) =>
  Object.entries(plans && typeof plans === 'object' ? plans : {})
    .map(([name, plan]) => buildProgressionBlockReport(name, plan, workouts, runtime))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.complete !== b.complete) return a.complete ? 1 : -1;
      return (b.missedStreak || 0) - (a.missedStreak || 0);
    });
