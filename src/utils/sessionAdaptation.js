import { isWorkingSet } from './helpers.js';
import { parseNumber } from './number.js';

const clone = value => JSON.parse(JSON.stringify(value));
const roundLoad = (value, step = 2.5) => Math.max(0, Math.round(value / step) * step);

export const SESSION_MODES = {
  normal: {
    key: 'normal', label: 'Planı Koru', tone: 'good', loadFactor: 1,
    targetRir: null, maxWorkingSets: null, removeOneSet: false,
    summary: 'Hazır oluşluk planı değiştirmeyi gerektirmiyor.',
  },
  reduced: {
    key: 'reduced', label: 'Kontrollü Seans', tone: 'warn', loadFactor: 0.95,
    targetRir: 3, maxWorkingSets: null, removeOneSet: true,
    summary: 'Her harekette en fazla bir set azaltılır; kayıtlı yükler yaklaşık %5 düşürülür.',
  },
  recovery: {
    key: 'recovery', label: 'Toparlanma Seansı', tone: 'danger', loadFactor: 0.85,
    targetRir: 4, maxWorkingSets: 2, removeOneSet: false,
    summary: 'Çalışma setleri hareket başına ikiyle sınırlandırılır; kayıtlı yükler yaklaşık %15 düşürülür.',
  },
};

export const adaptationModeFor = (readiness = {}) => {
  const score = parseNumber(readiness.score);
  const jointPain = parseNumber(readiness.jointPain);
  if (jointPain >= 9 || score < 40) return SESSION_MODES.recovery;
  if (jointPain >= 7 || score < 60) return SESSION_MODES.reduced;
  return SESSION_MODES.normal;
};

/**
 * Şablonu yalnızca bugünkü seans için ölçekler. Şablon nesnesi mutasyona uğramaz.
 * Isınma setleri korunur; yalnız çalışma setleri azaltılır. Boş ağırlığa sayı
 * uydurulmaz, yalnızca şablonda zaten kayıtlı olan yük ölçeklenir.
 */
export const buildSessionAdaptation = (template, readiness = {}, { loadStep = 2.5 } = {}) => {
  if (!template?.exercises) {
    return { mode: SESSION_MODES.normal, template, recommended: false, changes: null, reasons: [] };
  }

  const mode = adaptationModeFor(readiness);
  const adapted = clone(template);
  let removedSets = 0;
  let adjustedLoads = 0;
  let adjustedRir = 0;
  let originalWorkingSets = 0;
  let adaptedWorkingSets = 0;

  adapted.exercises = adapted.exercises.map(exercise => {
    const warmups = (exercise.sets || []).filter(set => !isWorkingSet(set));
    const working = (exercise.sets || []).filter(isWorkingSet);
    originalWorkingSets += working.length;

    let keep = working.length;
    if (mode.maxWorkingSets !== null) keep = Math.min(keep, mode.maxWorkingSets);
    else if (mode.removeOneSet && keep >= 3) keep -= 1;
    removedSets += working.length - keep;

    const adjusted = working.slice(0, keep).map(set => {
      const next = { ...set };
      const weight = parseNumber(set.weight);
      if (weight > 0 && mode.loadFactor < 1) {
        const scaled = roundLoad(weight * mode.loadFactor, loadStep);
        if (scaled !== weight) adjustedLoads += 1;
        next.weight = String(scaled);
      }
      if (mode.targetRir !== null && parseNumber(set.rir) < mode.targetRir) {
        next.rir = mode.targetRir;
        adjustedRir += 1;
      }
      return next;
    });
    adaptedWorkingSets += adjusted.length;
    return { ...exercise, sets: [...warmups, ...adjusted] };
  });

  const reasons = [];
  if (parseNumber(readiness.jointPain) >= 7) reasons.push(`eklem ağrısı ${parseNumber(readiness.jointPain)}/10`);
  if (parseNumber(readiness.score) < 60) reasons.push(`hazır oluşluk ${parseNumber(readiness.score)}/100`);
  if (parseNumber(readiness.carbs) <= 3) reasons.push('antrenman öncesi karbonhidrat düşük');

  const meaningful = mode.key !== 'normal' && (removedSets > 0 || adjustedLoads > 0 || adjustedRir > 0);
  return {
    mode,
    template: adapted,
    recommended: meaningful,
    reasons,
    changes: {
      removedSets,
      adjustedLoads,
      adjustedRir,
      originalWorkingSets,
      adaptedWorkingSets,
      loadPercent: Math.round((1 - mode.loadFactor) * 100),
    },
  };
};

