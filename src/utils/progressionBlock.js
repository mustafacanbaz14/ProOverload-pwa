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
const isWorking = set => set?.setType !== 'warmup';
const isCompleted = set => isWorking(set) && parseNumber(set?.reps) > 0;

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
      prescription: exercise.progressionPrescription || null,
    });
  });
  return sessions.sort((a, b) => String(a.date).localeCompare(String(b.date)));
};

/** Tarihsel e1RM eğiliminden hedefe kalan süreyi tahmin eder. */
export const estimateProgressionEta = (plan, sessions = []) => {
  const targetE1RM = estimateE1RM(plan?.targetWeight, plan?.targetReps, plan?.targetRir);
  const points = (sessions || [])
    .filter(item => item.bestE1RM > 0 && isoDay(item.date))
    .slice(-10);
  if (!(targetE1RM > 0) || points.length < 4) {
    return { status: 'insufficient', targetE1RM, confidence: 'low', days: null, date: null };
  }
  const origin = new Date(points[0].date).getTime();
  const values = points.map(point => ({
    x: (new Date(point.date).getTime() - origin) / DAY_MS,
    y: point.bestE1RM,
  }));
  const meanX = values.reduce((sum, point) => sum + point.x, 0) / values.length;
  const meanY = values.reduce((sum, point) => sum + point.y, 0) / values.length;
  const numerator = values.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
  const denominator = values.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  const slope = denominator > 0 ? numerator / denominator : 0;
  const latest = values.at(-1).y;
  if (latest >= targetE1RM) {
    return { status: 'reached', targetE1RM, confidence: 'high', days: 0, date: isoDay(points.at(-1).date), slope: round1(slope * 7), r2: 1 };
  }
  if (!(slope > 0)) {
    return { status: 'indeterminate', targetE1RM, confidence: 'low', days: null, date: null, slope: round1(slope * 7), r2: 0 };
  }
  const totalVariance = values.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
  const residual = values.reduce((sum, point) => {
    const predicted = meanY + slope * (point.x - meanX);
    return sum + (point.y - predicted) ** 2;
  }, 0);
  const r2 = totalVariance > 0 ? Math.max(0, Math.min(1, 1 - residual / totalVariance)) : 0;
  const days = Math.ceil((targetE1RM - latest) / slope);
  if (!(days >= 0) || days > 730) {
    return { status: 'indeterminate', targetE1RM, confidence: 'low', days: null, date: null, slope: round1(slope * 7), r2: round1(r2) };
  }
  const date = new Date(new Date(points.at(-1).date).getTime() + days * DAY_MS).toISOString().slice(0, 10);
  const confidence = points.length >= 6 && r2 >= 0.65 ? 'high' : r2 >= 0.35 ? 'medium' : 'low';
  return {
    status: 'projected', targetE1RM, confidence, days, date,
    slope: round1(slope * 7), r2: round1(r2),
  };
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
  const eta = estimateProgressionEta(plan, sessions);
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
