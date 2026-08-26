import { parseNumber } from './number.js';
import { dayKey, toLocalDate, formatRange, WEEKDAY_SHORT } from './dates.js';
import { isCompletedWorkingSet, calcEffectiveSets } from './helpers.js';
import { dailyTotals } from './nutritionStats.js';

/**
 * Eş dönem karşılaştırması.
 *
 * "Son 28 gün" ile önceki 28 gün aynı uzunlukta karşılaştırılır. Takvim ayı
 * kullanılmıyor; 31 günlük ayı 28 günlük ayla kıyaslamak değişimin bir kısmını
 * yalnızca pencere uzunluğundan üretirdi. Küçük farklar da anlamlı değişim
 * sayılmaz: kartın görevi her sayıya ok koymak değil, gerçekten bakmaya değer
 * kaymaları görünür yapmak.
 */

export const ANALYSIS_WINDOWS = [7, 28, 84];

const average = (values) => {
  const valid = values.map(parseNumber).filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, v) => sum + v, 0) / valid.length : null;
};

const round = (value, digits = 0) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
};

const dateAtNoon = (value) => {
  const d = toLocalDate(value);
  if (!d) return null;
  const out = new Date(d);
  out.setHours(12, 0, 0, 0);
  return out;
};

const rangeFor = (days, today = new Date()) => {
  const end = dateAtNoon(today) || new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - days + 1);
  const previousEnd = new Date(start);
  previousEnd.setDate(start.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - days + 1);
  return {
    current: { start, end, startKey: dayKey(start), endKey: dayKey(end) },
    previous: { start: previousStart, end: previousEnd, startKey: dayKey(previousStart), endKey: dayKey(previousEnd) },
  };
};

const inside = (date, range) => {
  const d = dateAtNoon(date);
  return Boolean(d && d >= range.start && d <= range.end);
};

const tonnageOf = (workout, resolveLoad) => (workout?.exercises || []).reduce((total, exercise) =>
  total + (exercise.sets || []).filter(isCompletedWorkingSet).reduce((sum, set) => {
    const load = resolveLoad ? resolveLoad(exercise.name, set.weight, workout) : parseNumber(set.weight);
    return sum + parseNumber(load) * parseNumber(set.reps);
  }, 0), 0);

const latestMetric = (metrics, range) => [...(metrics || [])]
  .filter(m => inside(m.date, range))
  .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;

const snapshot = ({ workouts, metrics, nutrition, sleepScores, restingHrLog, resolveLoad, range }) => {
  const sessions = (workouts || []).filter(w => inside(w.date, range) && (w.exercises || []).length > 0);
  const allWorkouts = (workouts || []).filter(w => inside(w.date, range));
  const readiness = sessions.map(w => parseNumber(w.readiness?.score)).filter(v => v > 0);
  const completedSets = sessions.reduce((sum, w) => sum + (w.exercises || [])
    .reduce((inner, ex) => inner + (ex.sets || []).filter(isCompletedWorkingSet).length, 0), 0);
  const cardioMinutes = allWorkouts.reduce((sum, w) => sum + (w.cardio || [])
    .reduce((inner, entry) => inner + Math.max(0, parseNumber(entry.minutes)), 0), 0);
  const uniqueExercises = new Set(sessions.flatMap(w => (w.exercises || []).map(ex => ex.name))).size;

  const sleep = Object.entries(sleepScores || {})
    .filter(([date, value]) => inside(date, range) && parseNumber(value) > 0)
    .map(([, value]) => parseNumber(value));
  const restingHr = (restingHrLog || [])
    .filter(row => inside(row.date, range) && parseNumber(row.bpm) > 0)
    .map(row => parseNumber(row.bpm));

  const nutritionRows = (nutrition || [])
    .filter(row => inside(row.date, range))
    .map(row => ({ date: row.date, ...dailyTotals(row) }))
    .filter(row => row.calories > 0 || row.protein > 0 || row.carbs > 0 || row.fats > 0);
  const body = latestMetric(metrics, range);

  const rhythm = Array.from({ length: 7 }, (_, day) => ({ day, count: 0 }));
  sessions.forEach(w => {
    const d = toLocalDate(w.date);
    if (!d) return;
    const mondayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
    rhythm[mondayIndex].count += 1;
  });

  return {
    range,
    sessions: sessions.length,
    completedSets,
    effectiveSets: sessions.reduce((sum, w) => sum + calcEffectiveSets(w), 0),
    tonnage: sessions.reduce((sum, w) => sum + tonnageOf(w, resolveLoad), 0),
    duration: sessions.reduce((sum, w) => sum + Math.max(0, parseNumber(w.duration)), 0),
    cardioMinutes,
    uniqueExercises,
    readiness: average(readiness),
    readinessEntries: readiness.length,
    sleep: average(sleep),
    sleepEntries: sleep.length,
    restingHr: average(restingHr),
    restingHrEntries: restingHr.length,
    calories: average(nutritionRows.map(r => r.calories)),
    protein: average(nutritionRows.map(r => r.protein)),
    nutritionDays: nutritionRows.length,
    weight: parseNumber(body?.weight) || null,
    waist: parseNumber(body?.measurements?.waist) || null,
    bodyFat: parseNumber(body?.bodyFat) || null,
    metricEntries: (metrics || []).filter(m => inside(m.date, range)).length,
    rhythm,
  };
};

const METRICS = [
  { key: 'sessions', label: 'Antrenman', unit: ' seans', category: 'training', digits: 0, thresholdAbs: 1, neutral: true },
  { key: 'effectiveSets', label: 'Etkili set', unit: ' set', category: 'training', digits: 0, thresholdPct: 10, thresholdAbs: 2, neutral: true },
  { key: 'tonnage', label: 'Tonaj', unit: ' kg', category: 'training', digits: 0, thresholdPct: 10, neutral: true },
  { key: 'duration', label: 'Salon süresi', unit: ' dk', category: 'training', digits: 0, thresholdPct: 12, neutral: true },
  { key: 'cardioMinutes', label: 'Kardiyo', unit: ' dk', category: 'training', digits: 0, thresholdAbs: 15, neutral: true },
  { key: 'uniqueExercises', label: 'Hareket çeşitliliği', unit: '', category: 'training', digits: 0, thresholdAbs: 2, neutral: true },
  { key: 'readiness', label: 'Hazır oluşluk', unit: '/100', category: 'recovery', digits: 0, thresholdAbs: 5, higherIsBetter: true },
  { key: 'sleep', label: 'Uyku puanı', unit: '/100', category: 'recovery', digits: 0, thresholdAbs: 5, higherIsBetter: true },
  { key: 'restingHr', label: 'Dinlenme nabzı', unit: ' bpm', category: 'recovery', digits: 1, thresholdAbs: 3, higherIsBetter: false },
  { key: 'calories', label: 'Günlük kalori', unit: ' kcal', category: 'nutrition', digits: 0, thresholdAbs: 100, neutral: true },
  { key: 'protein', label: 'Günlük protein', unit: ' g', category: 'nutrition', digits: 0, thresholdAbs: 10, neutral: true },
  { key: 'nutritionDays', label: 'Kayıtlı gün', unit: ' gün', category: 'nutrition', digits: 0, thresholdAbs: 2, higherIsBetter: true },
  { key: 'weight', label: 'Vücut ağırlığı', unit: ' kg', category: 'body', digits: 1, thresholdAbs: 0.5, neutral: true },
  { key: 'waist', label: 'Bel çevresi', unit: ' cm', category: 'body', digits: 1, thresholdAbs: 1, neutral: true },
  { key: 'bodyFat', label: 'Yağ oranı', unit: '%', category: 'body', digits: 1, thresholdAbs: 1, neutral: true },
];

const compareMetric = (definition, current, previous) => {
  const a = current[definition.key];
  const b = previous[definition.key];
  const available = a !== null && a !== undefined && b !== null && b !== undefined;
  if (!available) return { ...definition, current: a, previous: b, available: false, meaningful: false };
  const delta = Number(a) - Number(b);
  const deltaPct = Number(b) !== 0 ? delta / Math.abs(Number(b)) * 100 : null;
  const meaningful = Math.abs(delta) >= (definition.thresholdAbs || 0)
    && (definition.thresholdPct === undefined || deltaPct === null || Math.abs(deltaPct) >= definition.thresholdPct);
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const favorable = definition.neutral || direction === 'flat' ? null
    : (direction === 'up') === Boolean(definition.higherIsBetter);
  return {
    ...definition,
    current: round(a, definition.digits),
    previous: round(b, definition.digits),
    delta: round(delta, definition.digits),
    deltaPct: deltaPct === null ? null : round(deltaPct, 1),
    available: true,
    meaningful,
    direction,
    favorable,
  };
};

const coverage = (snap, days) => {
  const expectedSessions = Math.max(1, snap.sessions);
  const expectedMetrics = Math.max(1, Math.ceil(days / 28));
  const rows = [
    { key: 'readiness', label: 'Hazır oluşluk', have: snap.readinessEntries, need: expectedSessions },
    { key: 'sleep', label: 'Uyku', have: snap.sleepEntries, need: days },
    { key: 'nutrition', label: 'Beslenme', have: snap.nutritionDays, need: days },
    { key: 'body', label: 'Vücut ölçümü', have: snap.metricEntries, need: expectedMetrics },
  ].map(row => ({ ...row, percent: Math.round(Math.min(1, row.have / row.need) * 100) }));
  return {
    rows,
    score: Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length),
    gaps: [...rows].filter(row => row.percent < 60).sort((a, b) => a.percent - b.percent),
  };
};

const weekRhythm = (rhythm) => rhythm.map((row, index) => ({
  ...row,
  label: WEEKDAY_SHORT[index + 1 === 7 ? 0 : index + 1],
}));

export const buildTrendComparison = ({
  workouts = [], metrics = [], nutrition = [], sleepScores = {}, restingHrLog = [],
  resolveLoad = null, days = 28, today = new Date(),
} = {}) => {
  const windowDays = ANALYSIS_WINDOWS.includes(Number(days)) ? Number(days) : 28;
  const ranges = rangeFor(windowDays, today);
  const shared = { workouts, metrics, nutrition, sleepScores, restingHrLog, resolveLoad };
  const current = snapshot({ ...shared, range: ranges.current });
  const previous = snapshot({ ...shared, range: ranges.previous });
  const rows = METRICS.map(def => compareMetric(def, current, previous));
  const meaningful = rows.filter(row => row.meaningful);
  const dataCoverage = coverage(current, windowDays);

  return {
    days: windowDays,
    ranges: {
      current: { ...ranges.current, label: formatRange(ranges.current.startKey, ranges.current.endKey) },
      previous: { ...ranges.previous, label: formatRange(ranges.previous.startKey, ranges.previous.endKey) },
    },
    current,
    previous,
    rows,
    byCategory: Object.fromEntries(['training', 'recovery', 'nutrition', 'body'].map(category => [
      category, rows.filter(row => row.category === category),
    ])),
    meaningful,
    coverage: dataCoverage,
    rhythm: weekRhythm(current.rhythm),
    hasData: current.sessions > 0 || current.nutritionDays > 0 || current.sleepEntries > 0 || current.metricEntries > 0,
  };
};

export const trendComparisonText = (report) => {
  if (!report) return '';
  const lines = [
    `DÖNEM ANALİZİ — ${report.ranges.current.label} / önceki ${report.ranges.previous.label}`,
    `Veri kapsamı: %${report.coverage.score}`,
  ];
  const rows = report.meaningful.slice(0, 8);
  if (rows.length === 0) lines.push('Pratik eşikleri aşan bir değişim yok.');
  else rows.forEach(row => {
    const sign = row.delta > 0 ? '+' : '';
    lines.push(`- ${row.label}: ${row.previous}${row.unit} → ${row.current}${row.unit} (${sign}${row.delta}${row.unit})`);
  });
  if (report.coverage.gaps.length) {
    lines.push(`Eksik veri: ${report.coverage.gaps.map(g => `${g.label} %${g.percent}`).join(', ')}`);
  }
  lines.push('Değişimler aynı uzunluktaki iki dönemin betimsel karşılaştırmasıdır; neden-sonuç göstermez.');
  return lines.join('\n');
};
