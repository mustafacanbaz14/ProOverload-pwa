import { buildPlanAdherence } from './sessionReport.js';
import { detectMuscleGroup, isCompletedWorkingSet } from './helpers.js';
import { dayKey, formatRange, toLocalDate, weekBounds } from './dates.js';
import { parseNumber } from './number.js';

/**
 * Aktif programın kâğıt üzerindeki kalitesi başka, gerçekte uygulanması başka
 * bir sorudur. Bu model yalnız kayıtlı davranışı özetler. Geçmişte hangi planın
 * aktif olduğunu saklamadığımız için eski haftalarda mevcut planı kesin gerçek
 * kabul etmez; güven puanı bu sınırı görünür tutar.
 */

const round = (value, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(parseNumber(value) * factor) / factor;
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, parseNumber(value)));

const mondayIndex = (value) => {
  const date = toLocalDate(value);
  return date ? (date.getDay() + 6) % 7 : null;
};

const strengthSession = (workout) => (workout?.exercises || [])
  .some(exercise => (exercise.sets || []).some(isCompletedWorkingSet));

const actualMuscleVolume = (workouts = [], customExercises = []) => {
  const volume = {};
  workouts.forEach(workout => {
    (workout?.exercises || []).forEach(exercise => {
      const sets = (exercise.sets || []).filter(isCompletedWorkingSet).length;
      if (sets <= 0) return;
      const { contributions } = detectMuscleGroup(exercise.name, customExercises);
      Object.entries(contributions || {}).forEach(([muscle, weight]) => {
        volume[muscle] = round((volume[muscle] || 0) + sets * weight, 2);
      });
    });
  });
  return volume;
};

const planSlotsOf = (planResult) => (planResult?.days || []).flatMap((day, weekdayIndex) =>
  (day.workouts || []).map(slot => ({
    templateId: slot.templateId || slot.template?.id || '',
    templateName: slot.template?.name || 'Şablon',
    dayKey: day.key,
    dayLabel: day.label,
    weekdayIndex,
    plannedSets: parseNumber(slot.sets),
    plannedMinutes: parseNumber(slot.minutes),
  })).filter(slot => slot.templateId));

const countMatchedSessions = (records, slotCounts) => {
  const actual = new Map();
  records.forEach(workout => {
    if (!workout?.sourceTemplateId) return;
    actual.set(workout.sourceTemplateId, (actual.get(workout.sourceTemplateId) || 0) + 1);
  });
  let matched = 0;
  slotCounts.forEach((expected, templateId) => {
    matched += Math.min(expected, actual.get(templateId) || 0);
  });
  return matched;
};

const nearestSlot = (workout, slotsByTemplate) => {
  const candidates = slotsByTemplate.get(workout?.sourceTemplateId) || [];
  const actualDay = mondayIndex(workout?.date);
  if (actualDay === null || candidates.length === 0) return null;
  return candidates
    .map(slot => {
      const raw = Math.abs(actualDay - slot.weekdayIndex);
      return { ...slot, drift: Math.min(raw, 7 - raw) };
    })
    .sort((a, b) => a.drift - b.drift)[0];
};

const weekRows = (workouts, slots, today, weeks) => {
  const current = weekBounds(today);
  const todayDate = toLocalDate(today);
  if (!current) return [];
  const expected = slots.length;
  const slotCounts = new Map();
  slots.forEach(slot => slotCounts.set(slot.templateId, (slotCounts.get(slot.templateId) || 0) + 1));

  return Array.from({ length: weeks }, (_, offset) => {
    const start = new Date(current.start);
    start.setDate(start.getDate() - offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const records = workouts.filter(workout => {
      const date = toLocalDate(workout?.date);
      const visibleEnd = offset === 0 && todayDate && todayDate < end ? todayDate : end;
      return date && date >= start && date <= visibleEnd && strengthSession(workout);
    });
    const matched = countMatchedSessions(records, slotCounts);
    const tracked = records.filter(workout => slotCounts.has(workout.sourceTemplateId));
    const snapshots = tracked.map(buildPlanAdherence).filter(Boolean);
    const plannedSets = snapshots.reduce((sum, row) => sum + row.plannedSets, 0);
    const matchedSets = snapshots.reduce((sum, row) => sum + row.matchedSets, 0);
    return {
      key: dayKey(start),
      start: dayKey(start),
      end: dayKey(end),
      label: formatRange(start, end),
      current: offset === 0,
      expected,
      matched,
      tracked: tracked.length,
      unplanned: Math.max(0, records.length - matched),
      setPercent: plannedSets > 0 ? Math.round((matchedSets / plannedSets) * 100) : null,
      rate: expected > 0 ? Math.min(1, matched / expected) : 0,
      records,
    };
  });
};

const scoreZone = (score) => {
  if (score === null) return { key: 'unknown', label: 'Veri Az', tone: 'text-zinc-400', bar: 'bg-zinc-600' };
  if (score >= 85) return { key: 'strong', label: 'Sürdürülebilir', tone: 'text-emerald-400', bar: 'bg-emerald-500' };
  if (score >= 70) return { key: 'stable', label: 'İyi', tone: 'text-cyan-400', bar: 'bg-cyan-500' };
  if (score >= 50) return { key: 'fragile', label: 'Kırılgan', tone: 'text-amber-400', bar: 'bg-amber-500' };
  return { key: 'rebuild', label: 'Sadeleştir', tone: 'text-red-400', bar: 'bg-red-500' };
};

const catchupAdvice = (planResult, slots, currentWeek, today) => {
  if (!currentWeek || slots.length === 0) return null;
  const todayIndex = mondayIndex(today);
  if (todayIndex === null) return null;

  const doneCounts = new Map();
  currentWeek.records.forEach(workout => {
    if (workout?.sourceTemplateId) {
      doneCounts.set(workout.sourceTemplateId, (doneCounts.get(workout.sourceTemplateId) || 0) + 1);
    }
  });
  const missing = [];
  slots.filter(slot => slot.weekdayIndex <= todayIndex).forEach(slot => {
    const left = doneCounts.get(slot.templateId) || 0;
    if (left > 0) doneCounts.set(slot.templateId, left - 1);
    else missing.push(slot);
  });
  if (missing.length === 0) return null;

  const futureOff = (planResult?.days || [])
    .map((day, index) => ({ day, index }))
    .filter(({ day, index }) => index > todayIndex && day.isOffDay);
  const target = futureOff[0];
  if (!target) {
    return {
      tone: 'warn',
      title: `${missing.length} planlı seans henüz yapılmadı`,
      detail: 'Bu haftada boş antrenman günü kalmadı. İki seansı üst üste sıkıştırmak yerine haftayı eksik kapatıp sonraki haftayı normal başlatmak daha ölçülebilir.',
      missed: missing.length,
      targetDay: null,
    };
  }
  return {
    tone: 'info',
    title: `${missing[0].templateName} için telafi boşluğu`,
    detail: `${target.day.label} planında off/aktif toparlanma günü. Kaçan seansı buraya kaydırabilirsin; toplam haftalık hacmi artırma. Bu öneri kas toparlanmasını ölçmez, yalnız takvim sıkışmasını azaltır.`,
    missed: missing.length,
    targetDay: target.day.key,
  };
};

/** Aktif planın uygulanma raporu. */
export const buildPlanExecution = (workouts = [], planResult = null, {
  today = new Date(),
  weeks = 8,
  customExercises = [],
} = {}) => {
  const slots = planSlotsOf(planResult);
  if (slots.length === 0) {
    return {
      hasPlan: false, hasData: false, score: null, confidence: 0,
      zone: scoreZone(null), weeks: [], templates: [], muscles: [], sessions: [],
      catchup: null, simplification: null,
    };
  }

  const slotsByTemplate = new Map();
  slots.forEach(slot => {
    const rows = slotsByTemplate.get(slot.templateId) || [];
    rows.push(slot);
    slotsByTemplate.set(slot.templateId, rows);
  });
  const templateIds = new Set(slotsByTemplate.keys());
  const allStrength = workouts.filter(strengthSession);
  const rows = weekRows(allStrength, slots, today, Math.max(4, weeks));

  // İlk eşleşmenin bulunduğu hafta, planın o haftanın başından beri aktif
  // olduğunu kanıtlamaz. Devamlılık oranına yalnız SONRAKİ tam haftalar girer.
  const firstMatch = [...allStrength]
    .filter(workout => templateIds.has(workout.sourceTemplateId))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
  const firstWeek = firstMatch ? weekBounds(firstMatch.date)?.startKey : null;
  const completedWeeks = rows.filter(row => !row.current && firstWeek && row.start > firstWeek);

  const recentStart = rows.at(-1)?.start;
  const recentRecords = allStrength.filter(workout => !recentStart || workout.date >= recentStart);
  const trackedSessions = recentRecords.filter(workout => templateIds.has(workout.sourceTemplateId));
  const snapshotSessions = trackedSessions
    .map(workout => ({ workout, adherence: buildPlanAdherence(workout), slot: nearestSlot(workout, slotsByTemplate) }))
    .filter(row => row.adherence);

  const plannedSets = snapshotSessions.reduce((sum, row) => sum + row.adherence.plannedSets, 0);
  const matchedSets = snapshotSessions.reduce((sum, row) => sum + row.adherence.matchedSets, 0);
  const plannedExercises = snapshotSessions.reduce((sum, row) => sum + row.adherence.plannedExercises, 0);
  const completedExercises = snapshotSessions.reduce((sum, row) => sum + row.adherence.completedPlannedExercises, 0);
  const setPercent = plannedSets > 0 ? Math.round((matchedSets / plannedSets) * 100) : null;
  const exercisePercent = plannedExercises > 0 ? Math.round((completedExercises / plannedExercises) * 100) : null;
  const attendancePercent = completedWeeks.length > 0
    ? Math.round((completedWeeks.reduce((sum, row) => sum + row.rate, 0) / completedWeeks.length) * 100)
    : null;

  const driftRows = trackedSessions
    .map(workout => nearestSlot(workout, slotsByTemplate))
    .filter(Boolean);
  const averageDrift = driftRows.length > 0
    ? round(driftRows.reduce((sum, row) => sum + row.drift, 0) / driftRows.length, 1)
    : null;
  const scheduleAccuracy = averageDrift === null ? null : Math.round(clamp(100 - averageDrift * 25));

  const durationRows = trackedSessions.map(workout => {
    const slot = nearestSlot(workout, slotsByTemplate);
    const actual = parseNumber(workout.duration);
    const planned = parseNumber(slot?.plannedMinutes);
    if (!(actual > 0) || !(planned > 0)) return null;
    const accuracy = clamp(100 - (Math.abs(actual - planned) / planned) * 100);
    return { actual, planned, accuracy };
  }).filter(Boolean);
  const durationAccuracy = durationRows.length > 0
    ? Math.round(durationRows.reduce((sum, row) => sum + row.accuracy, 0) / durationRows.length)
    : null;

  const metrics = [
    { key: 'attendance', value: attendancePercent, weight: 35 },
    { key: 'sets', value: setPercent, weight: 30 },
    { key: 'exercises', value: exercisePercent, weight: 15 },
    { key: 'schedule', value: scheduleAccuracy, weight: 10 },
    { key: 'duration', value: durationAccuracy, weight: 10 },
  ].filter(metric => metric.value !== null);
  const metricWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);
  const rawScore = metricWeight > 0
    ? Math.round(metrics.reduce((sum, metric) => sum + metric.value * metric.weight, 0) / metricWeight)
    : null;

  const coverage = recentRecords.length > 0 ? trackedSessions.length / recentRecords.length : 0;
  const confidence = Math.round(clamp(
    Math.min(1, snapshotSessions.length / 6) * 45
    + Math.min(1, completedWeeks.length / 4) * 35
    + coverage * 20,
  ));
  const hasData = snapshotSessions.length >= 2 || completedWeeks.length >= 2;
  const score = hasData ? rawScore : null;

  const currentWeek = rows.find(row => row.current) || null;
  const currentBounds = weekBounds(today);
  const currentRecords = currentBounds
    ? allStrength.filter(workout => {
      const date = toLocalDate(workout.date);
      return date && date >= currentBounds.start && date <= currentBounds.end;
    })
    : [];
  const actualVolume = actualMuscleVolume(currentRecords, customExercises);
  const muscles = Object.entries(planResult?.muscleVolume || {})
    .filter(([, planned]) => parseNumber(planned) > 0)
    .map(([muscle, planned]) => {
      const actual = round(actualVolume[muscle] || 0, 2);
      const percent = Math.round((actual / parseNumber(planned)) * 100);
      return {
        muscle, planned: round(planned, 2), actual, percent,
        status: percent < 70 ? 'under' : percent <= 120 ? 'on' : 'over',
      };
    })
    .sort((a, b) => Math.abs(100 - b.percent) - Math.abs(100 - a.percent));

  const templates = [...slotsByTemplate.entries()].map(([templateId, templateSlots]) => {
    const eligibleRecords = completedWeeks.flatMap(row => row.records)
      .filter(workout => workout.sourceTemplateId === templateId);
    const expected = templateSlots.length * completedWeeks.length;
    const snapshotRows = eligibleRecords.map(buildPlanAdherence).filter(Boolean);
    const setAvg = snapshotRows.length > 0
      ? Math.round(snapshotRows.reduce((sum, row) => sum + row.percent, 0) / snapshotRows.length)
      : null;
    const drifts = eligibleRecords.map(workout => nearestSlot(workout, slotsByTemplate)?.drift)
      .filter(value => value !== undefined && value !== null);
    const durations = eligibleRecords.map(workout => parseNumber(workout.duration)).filter(value => value > 0);
    return {
      templateId,
      name: templateSlots[0]?.templateName || 'Şablon',
      plannedPerWeek: templateSlots.length,
      expected,
      done: eligibleRecords.length,
      attendancePercent: expected > 0 ? Math.min(100, Math.round((eligibleRecords.length / expected) * 100)) : null,
      setPercent: setAvg,
      averageDrift: drifts.length > 0 ? round(drifts.reduce((sum, value) => sum + value, 0) / drifts.length, 1) : null,
      averageMinutes: durations.length > 0 ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null,
      plannedMinutes: Math.round(templateSlots.reduce((sum, slot) => sum + slot.plannedMinutes, 0) / templateSlots.length),
    };
  }).sort((a, b) => (a.attendancePercent ?? 101) - (b.attendancePercent ?? 101));

  const averageDone = completedWeeks.length > 0
    ? completedWeeks.reduce((sum, row) => sum + row.matched, 0) / completedWeeks.length
    : 0;
  const simplification = completedWeeks.length >= 3 && attendancePercent !== null
    && attendancePercent < 70 && slots.length >= 3
    ? {
      currentDays: slots.length,
      suggestedDays: Math.max(2, Math.min(slots.length - 1, Math.round(averageDone))),
      title: `Programı ${Math.max(2, Math.min(slots.length - 1, Math.round(averageDone)))} güne sadeleştir`,
      detail: `Son ${completedWeeks.length} tam haftada ${slots.length} planlı seansa karşı ortalama ${round(averageDone, 1)} eşleşen seans var. Önce uygulanabilen sıklığı sabitle; hacmi kalan günlere körlemesine yığma.`,
    }
    : null;

  const sessions = snapshotSessions
    .sort((a, b) => String(b.workout.date).localeCompare(String(a.workout.date)))
    .slice(0, 8)
    .map(row => ({
      id: row.workout.id,
      date: row.workout.date,
      name: row.adherence.templateName,
      setPercent: row.adherence.percent,
      drift: row.slot?.drift ?? null,
      actualMinutes: parseNumber(row.workout.duration) || null,
      plannedMinutes: parseNumber(row.slot?.plannedMinutes) || null,
      missedExercises: row.adherence.missedExercises,
      extraExercises: row.adherence.extraExercises,
    }));

  return {
    hasPlan: true,
    hasData,
    score,
    rawScore,
    confidence,
    zone: scoreZone(score),
    plannedPerWeek: slots.length,
    measuredWeeks: completedWeeks.length,
    trackedSessions: trackedSessions.length,
    snapshotSessions: snapshotSessions.length,
    unplannedSessions: Math.max(0, recentRecords.length - trackedSessions.length),
    attendancePercent,
    setPercent,
    exercisePercent,
    averageDrift,
    scheduleAccuracy,
    durationAccuracy,
    currentWeek,
    weeks: rows,
    templates,
    muscles,
    sessions,
    catchup: catchupAdvice(planResult, slots, currentWeek, today),
    simplification,
    caveat: 'Set ve hareket uyumu, seans başında kaydedilen şablon anlık görüntüsünden gelir. Geçmiş haftaların seans sıklığı mevcut aktif plana göre kestirilir; plan sonradan değiştiyse güven düşürülmelidir.',
  };
};

/** Koç, yalnız uygulanabilir bir değişiklik varsa madde üretir. */
export const planExecutionCoachItem = (report) => {
  if (!report?.hasPlan || !report.hasData) return null;
  if (report.simplification) {
    return {
      key: 'plan-execution',
      title: report.simplification.title,
      detail: `${report.simplification.detail} Plan gerçekleşme güveni %${report.confidence}.`,
      tone: 'warn',
    };
  }
  if (report.catchup) {
    return {
      key: 'plan-execution',
      title: report.catchup.title,
      detail: `${report.catchup.detail} Plan gerçekleşme güveni %${report.confidence}.`,
      tone: report.catchup.tone,
    };
  }
  if (report.setPercent !== null && report.setPercent < 75 && report.confidence >= 45) {
    return {
      key: 'plan-execution',
      title: `Planlı setlerin %${report.setPercent}'i tamamlanıyor`,
      detail: 'Önce en sık atlanan hareketi veya seti programdan bilinçli çıkar; kâğıt üzerinde kalan ama yapılmayan hacim ilerleme verisi üretmez.',
      tone: 'warn',
    };
  }
  return null;
};
