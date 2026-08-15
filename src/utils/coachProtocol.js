import { parseNumber } from './number.js';
import { dayKey, toLocalDate, weekBounds } from './dates.js';

export const COACH_PROTOCOL_MODES = {
  recovery: {
    key: 'recovery', label: 'Toparlanmayı Öncele', tone: 'warn',
    summary: 'Bir hafta boyunca çalışma setleri kontrollü azalır; yük artırılmaz.',
  },
  rebuild: {
    key: 'rebuild', label: 'Programı Gerçekçileştir', tone: 'warn',
    summary: 'Sorun yükten çok plan uyumu; kaçan günleri telafi etmek yerine program sadeleştirilir.',
  },
  progress: {
    key: 'progress', label: 'İlerlemeyi Sürdür', tone: 'good',
    summary: 'Hacim eklemek yerine mevcut setlerde tekrar veya yük ilerlemesi izlenir.',
  },
  hold: {
    key: 'hold', label: 'Ritmi Koru', tone: 'info',
    summary: 'Veri köklü bir değişiklik gerektirmiyor; mevcut plan aynı kalır.',
  },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const nextWeekRange = (sourceEnd) => {
  const end = toLocalDate(sourceEnd);
  if (!end) return { start: '', end: '' };
  const start = new Date(end);
  start.setDate(end.getDate() + 1);
  const finish = new Date(start);
  finish.setDate(start.getDate() + 6);
  return { start: dayKey(start), end: dayKey(finish) };
};

const confidenceFor = (review) => {
  const training = Math.min(30, parseNumber(review?.training?.sessions) * 10);
  const sleep = Math.min(25, parseNumber(review?.recovery?.nights) * 6.25);
  const readiness = Math.min(20, parseNumber(review?.recovery?.readinessEntries) * 5);
  const energy = Math.min(15, parseNumber(review?.energy?.days) * 3);
  const plan = parseNumber(review?.training?.plannedDays) > 0 ? 10 : 0;
  const score = Math.round(training + sleep + readiness + energy + plan);
  const label = score >= 75 ? 'Yüksek güven' : score >= 50 ? 'Orta güven' : 'Düşük güven';
  return {
    score, label,
    coverage: { training, sleep, readiness, energy, plan },
    missing: [
      training < 20 ? 'en az 2 antrenman' : null,
      sleep < 18 ? 'en az 3 gece uyku' : null,
      readiness < 10 ? 'en az 2 hazır oluşluk kaydı' : null,
      energy < 12 ? 'en az 4 gün enerji kaydı' : null,
    ].filter(Boolean),
  };
};

const energyAdjustment = (review, nutritionGoal) => {
  const energy = review?.energy;
  if (!energy || parseNumber(energy.days) < 5) return 0;
  const balance = parseNumber(energy.balance);
  const kg = parseNumber(energy.kg);
  const wrongDirection = nutritionGoal === 'cut'
    ? kg > 0.1
    : nutritionGoal === 'bulk'
      ? kg < -0.1
      : Math.abs(kg) > 0.35;
  if (!wrongDirection) return 0;
  return clamp(-Math.round(balance / 7 / 25) * 25, -300, 300);
};

const volumeDecisions = (review, mode) => (review?.volume?.statuses || [])
  .filter(row => parseNumber(row.volume) > 0 || parseNumber(row.change) !== 0)
  .map(row => {
    const volume = parseNumber(row.volume);
    let delta = 0;
    if (row.status === 'over') delta = -Math.min(4, Math.max(2, Math.ceil(volume - row.mrv)));
    else if (mode !== 'recovery' && mode !== 'rebuild' && (row.status === 'under' || row.status === 'none')) {
      delta = Math.min(2, Math.max(0, Math.ceil(row.mev - volume)));
    }
    return { muscle: row.muscle, current: volume, target: Math.max(0, volume + delta), delta, status: row.status };
  })
  .filter(row => row.delta !== 0)
  .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

/**
 * Geçen tam haftayı tek, açıklanabilir bir sonraki-hafta kararına dönüştürür.
 * Protokol şablonları değiştirmez; yalnızca kullanıcı aktive ederse seans açılışında
 * uygulanır. Düşük veri güveninde aktivasyon kapalıdır.
 */
export const buildCoachProtocol = (review, nutritionGoal = 'maintain', { now = new Date(), id } = {}) => {
  if (!review) return null;
  const confidence = confidenceFor(review);
  const recoveryConcern = (review.recovery?.readiness !== null && parseNumber(review.recovery?.readiness) < 50)
    || (review.recovery?.sleepMinutes !== null && parseNumber(review.recovery?.sleepMinutes) < 380)
    || parseNumber(review.training?.adaptedSessions) >= 2
    || (review.volume?.over || []).length > 0;
  const adherenceGap = Math.max(0, parseNumber(review.training?.plannedDays) - parseNumber(review.training?.days));

  let mode = COACH_PROTOCOL_MODES.hold;
  if (recoveryConcern) mode = COACH_PROTOCOL_MODES.recovery;
  else if (adherenceGap >= 2) mode = COACH_PROTOCOL_MODES.rebuild;
  else if (parseNumber(review.training?.sessions) >= 2 && (review.volume?.optimal || []).length >= 3) {
    mode = COACH_PROTOCOL_MODES.progress;
  }

  const range = nextWeekRange(review.endKey);
  const reasons = [];
  if ((review.volume?.over || []).length) reasons.push(`${review.volume.over.length} kas grubu MRV üstünde`);
  if (review.recovery?.readiness !== null && parseNumber(review.recovery.readiness) < 50) reasons.push(`hazır oluşluk ${review.recovery.readiness}/100`);
  if (review.recovery?.sleepMinutes !== null && parseNumber(review.recovery.sleepMinutes) < 380) reasons.push('uyku ortalaması 6 sa 20 dk altında');
  if (parseNumber(review.training?.adaptedSessions) >= 2) reasons.push(`${review.training.adaptedSessions} seans azaltıldı`);
  if (adherenceGap >= 2) reasons.push(`plandan ${adherenceGap} gün eksik`);
  if (reasons.length === 0) reasons.push(mode.key === 'progress' ? 'hacim ve toparlanma sinyalleri dengeli' : 'köklü değişiklik gerektiren sinyal yok');

  const today = dayKey(now);
  return {
    id: id || `coach-${review.startKey}-${now.getTime()}`,
    createdAt: now.toISOString(),
    sourceWeek: { start: review.startKey, end: review.endKey, range: review.range },
    validFrom: range.start,
    validUntil: range.end,
    mode: mode.key,
    label: mode.label,
    summary: mode.summary,
    confidence,
    reasons,
    volume: volumeDecisions(review, mode.key),
    calorieDelta: energyAdjustment(review, nutritionGoal),
    active: false,
    canApply: Boolean(
      review.hasData
      && parseNumber(review.training?.sessions) > 0
      && confidence.score >= 35
      && review.endKey < today
      && today >= range.start
      && today <= range.end
    ),
    source: {
      sessions: parseNumber(review.training?.sessions),
      plannedDays: parseNumber(review.training?.plannedDays),
      completedDays: parseNumber(review.training?.days),
      readiness: review.recovery?.readiness ?? null,
      sleepMinutes: review.recovery?.sleepMinutes ?? null,
      energyDays: parseNumber(review.energy?.days),
    },
  };
};

export const normalizeCoachProtocol = (value) => {
  if (!value || !COACH_PROTOCOL_MODES[value.mode]) return null;
  return {
    ...value,
    active: Boolean(value.active),
    confidence: value.confidence && typeof value.confidence === 'object'
      ? value.confidence : { score: 0, label: 'Düşük güven', coverage: {}, missing: [] },
    reasons: Array.isArray(value.reasons) ? value.reasons.filter(item => typeof item === 'string') : [],
    volume: Array.isArray(value.volume) ? value.volume : [],
    calorieDelta: clamp(parseNumber(value.calorieDelta), -300, 300),
  };
};

export const isCoachProtocolActive = (protocol, date = dayKey(new Date())) => Boolean(
  protocol?.active
  && protocol.validFrom
  && protocol.validUntil
  && date >= protocol.validFrom
  && date <= protocol.validUntil
);

export const activateCoachProtocol = (protocol) => protocol ? { ...protocol, active: true, activatedAt: new Date().toISOString() } : null;

export const archiveCoachProtocol = (history = [], protocol, limit = 12) => {
  if (!protocol?.id) return Array.isArray(history) ? history : [];
  return [protocol, ...(Array.isArray(history) ? history : []).filter(item => item?.id !== protocol.id)].slice(0, limit);
};

export const protocolWeekIsCurrent = (protocol, today = dayKey(new Date())) => {
  const bounds = weekBounds(today);
  return Boolean(protocol?.validFrom === bounds?.startKey && protocol?.validUntil === bounds?.endKey);
};
