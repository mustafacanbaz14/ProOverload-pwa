import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';
import { isWorkingSet, parseNumber } from './helpers.js';
import { previewTemplateVolume, estimateDuration } from './templates.js';
import { toLocalDate } from './dates.js';

const DAY_MS = 86400000;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const completedSetCount = (exercise) => (exercise?.sets || []).filter(set =>
  isWorkingSet(set) && (parseNumber(set.reps) > 0 || parseNumber(set.weight) > 0)
).length;

/** Son yüklenmeden beri geçen günü kas bazında çıkarır. */
const recentMuscleDays = (workouts, customExercises, today) => {
  const result = {};
  const todayDate = toLocalDate(today) || new Date();
  todayDate.setHours(12, 0, 0, 0);

  (workouts || []).forEach(workout => {
    const date = toLocalDate(workout?.date);
    if (!date) return;
    date.setHours(12, 0, 0, 0);
    const days = Math.floor((todayDate - date) / DAY_MS);
    if (days < 0 || days > 3) return;

    (workout.exercises || []).forEach(exercise => {
      if (completedSetCount(exercise) === 0) return;
      const { byMuscle } = previewTemplateVolume([exercise], customExercises);
      Object.keys(byMuscle || {}).forEach(muscle => {
        result[muscle] = Math.min(result[muscle] ?? Infinity, days);
      });
    });
  });
  return result;
};

/**
 * Şablonları bu haftanın gerçek hacmine göre sıralar.
 *
 * Bu bir sakatlık tahmini değildir. MEV/MAV açığını ödüllendirir, MRV aşımını
 * kuvvetli; son 48 saatte çalışılan kası ise yumuşak biçimde cezalandırır.
 * Frekans tek başına hipertrofi üstünlüğü yaratmadığı için yakın tarih katı bir
 * yasak değil, yalnızca toparlanma bağlamıdır.
 */
export const rankTemplateRecommendations = (templates = [], {
  currentVolume = {},
  customExercises = [],
  experienceLevel = 'intermediate',
  workouts = [],
  restSeconds = 120,
  today = new Date(),
} = {}) => {
  const recentDays = recentMuscleDays(workouts, customExercises, today);

  return (templates || []).map(template => {
    const preview = previewTemplateVolume(template.exercises || [], customExercises);
    let benefit = 0;
    let overloadPenalty = 0;
    let freshnessPenalty = 0;
    const needs = [];
    const risks = [];

    MUSCLE_GROUPS.forEach(muscle => {
      const added = parseNumber(preview.byMuscle[muscle]);
      if (!(added > 0)) return;
      const current = parseNumber(currentVolume[muscle]);
      const { mev, mav, mrv } = getVolumeLandmarks(muscle, experienceLevel);
      const projected = current + added;

      const toMev = Math.max(0, mev - current);
      const toMav = Math.max(0, mav - Math.max(current, mev));
      const mevHelp = Math.min(added, toMev);
      const mavHelp = Math.min(Math.max(0, added - mevHelp), toMav);
      const maintenanceHelp = Math.max(0, Math.min(added - mevHelp - mavHelp, mrv - Math.max(current, mav)));
      benefit += mevHelp * 4.5 + mavHelp * 2.5 + maintenanceHelp * 0.35;

      if (current < mav) {
        needs.push({ muscle, current, added, target: current < mev ? mev : mav, belowMev: current < mev });
      }

      if (projected > mrv) {
        const over = Math.round((projected - mrv) * 4) / 4;
        overloadPenalty += 14 + over * 7;
        risks.push(`${muscle} tavanı yaklaşık ${over} set aşabilir`);
      } else if (projected > mav) {
        overloadPenalty += (projected - mav) * 1.25;
      }

      const days = recentDays[muscle];
      if (days === 0) freshnessPenalty += added * 3;
      else if (days === 1) freshnessPenalty += added * 1.6;
      else if (days === 2) freshnessPenalty += added * 0.45;
    });

    const minutes = estimateDuration(template.exercises || [], restSeconds);
    const durationPenalty = Math.max(0, minutes - 100) * 0.12;
    const score = clamp(Math.round(45 + benefit - overloadPenalty - freshnessPenalty - durationPenalty), 0, 100);
    const reasons = [];
    const hasGap = needs.length > 0;

    needs
      .sort((a, b) => (b.target - b.current) - (a.target - a.current) || b.added - a.added)
      .slice(0, 2)
      .forEach(item => {
        const gap = Math.round((item.target - item.current) * 4) / 4;
        reasons.push(`${item.muscle}: ${item.belowMev ? 'MEV' : 'MAV'} için ${gap} set açık, şablon +${item.added} set ekliyor`);
      });

    if (freshnessPenalty === 0 && preview.totalSets > 0) {
      reasons.push('Ana kaslarda son 48 saat yüklenme çakışması yok');
    } else if (freshnessPenalty > 0) {
      const recent = Object.entries(preview.byMuscle)
        .filter(([muscle, volume]) => volume > 0 && (recentDays[muscle] ?? 99) <= 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([muscle]) => muscle);
      if (recent.length) risks.push(`${recent.join(' ve ')} son 48 saatte çalıştı`);
    }

    if (reasons.length === 0) reasons.push('Haftalık hacmi en az taşıran seçeneklerden biri');

    return {
      template,
      score,
      label: score >= 80 ? 'Çok uygun' : score >= 65 ? 'Uygun' : score >= 45 ? 'Dengeli seçenek' : 'Dikkatli seç',
      reasons: reasons.slice(0, 3),
      risks: [...new Set(risks)].slice(0, 3),
      minutes,
      preview,
      hasGap,
    };
  }).sort((a, b) => b.score - a.score || Number(Boolean(b.template?.favorite)) - Number(Boolean(a.template?.favorite)));
};

/**
 * Günlük ekranda gösterilebilecek güvenilir tek öneriyi seçer.
 *
 * Sıralama motoru karşılaştırma için her şablona puan verir; bu, listenin
 * birincisinin mutlaka iyi bir öneri olduğu anlamına gelmez. Plan yokken öneri
 * ancak kullanıcının daha önce tamamladığı, haftalık gerçek bir açığı kapatan,
 * risk taşımayan ve en yakın rakibinden açıkça ayrılan bir şablonsa gösterilir.
 * Bu koşullar yoksa `null` dönmek, rastgele bir antrenmanı otoriter biçimde
 * önermekten daha doğrudur.
 */
export const bestTemplateRecommendation = (templates = [], options = {}) => {
  const {
    scheduledTemplate = null,
    allowUnplanned = true,
    doneToday = false,
    recoveryBlocked = false,
    minimumScore = 75,
    minimumMargin = 6,
    currentVolume = {},
    workouts = [],
  } = options;

  if (doneToday || recoveryBlocked) return null;

  const ranked = rankTemplateRecommendations(templates, options)
    .filter(item => item.template?.id && item.preview?.totalSets > 0);

  if (scheduledTemplate?.id) {
    const planned = ranked.find(item => item.template.id === scheduledTemplate.id)
      || rankTemplateRecommendations([scheduledTemplate], options)
        .find(item => item.preview?.totalSets > 0);
    return planned ? {
      ...planned,
      source: 'plan',
      confidence: 'plan',
      label: 'Bugünkü plan',
    } : null;
  }

  if (!allowUnplanned) return null;

  // Haftanın başında veya geçmişsiz profilde bütün kaslar sıfırdır. Bu durumda
  // puan çoğunlukla şablon büyüklüğünü ödüllendirir ve seçim kişisel değildir.
  const hasWeeklySignal = MUSCLE_GROUPS.some(muscle => parseNumber(currentVolume[muscle]) > 0);
  const completedStrengthSessions = (workouts || []).filter(workout =>
    (workout.exercises || []).some(exercise => completedSetCount(exercise) > 0)
  ).length;
  if (!hasWeeklySignal || completedStrengthSessions < 2) return null;

  const usedTemplateIds = new Set((workouts || [])
    .map(workout => workout?.sourceTemplateId)
    .filter(Boolean));
  const eligible = ranked.filter(item => {
    const familiar = parseNumber(item.template?.useCount) > 0 || usedTemplateIds.has(item.template.id);
    return familiar
      && item.hasGap
      && item.score >= minimumScore
      && item.risks.length === 0;
  });

  const first = eligible[0];
  if (!first) return null;
  const second = eligible[1];
  if (second && first.score - second.score < minimumMargin) return null;

  return {
    ...first,
    source: 'volume',
    confidence: 'high',
    label: 'Veriye dayalı',
  };
};
