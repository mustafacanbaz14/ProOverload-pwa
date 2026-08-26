import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';
import { parseNumber } from './number.js';

/**
 * Kişisel optimal hacim modeli.
 *
 * Buradaki aralık bir fizyolojik "gerçek" ya da MRV testi değildir. Üç ayrı
 * kaynağı görünür biçimde birleştirir:
 *   1. popülasyon başlangıç aralığı,
 *   2. kullanıcının performansı koruduğu tamamlanmış haftalar,
 *   3. yeterince güvenilir olduğunda yakın dönem toparlanma kapasitesi.
 *
 * Az veriyle kişiselleştirme yapılmaz. Eksik hafta sıfır hacim ya da başarısız
 * toparlanma sayılmaz; böylece kayıt alışkanlığı öneriyi aşağı çekmez.
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundQuarter = (value) => Math.round(parseNumber(value) * 4) / 4;

const quantile = (values, q) => {
  const sorted = (values || []).filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return sorted[lower + 1] === undefined
    ? sorted[lower]
    : sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower]);
};
const confidenceLabel = (score) => score >= 75 ? 'Yüksek' : score >= 55 ? 'Orta' : 'Düşük';

const capacityAdjustment = (capacity) => {
  if (!capacity || parseNumber(capacity.confidence) < 60 || capacity.score === null) {
    return { sets: 0, label: 'Toparlanma verisi yetersiz', applied: false };
  }
  const score = parseNumber(capacity.score);
  if (score < 40) return { sets: -2, label: 'Toparlanma düşük: geçici −2 set', applied: true };
  if (score < 60) return { sets: -1, label: 'Toparlanma temkinli: geçici −1 set', applied: true };
  if (score >= 85) return { sets: 1, label: 'Toparlanma güçlü: en fazla +1 set deneme payı', applied: true };
  return { sets: 0, label: 'Toparlanma dengeli: aralık değişmedi', applied: true };
};

const planStatusMap = (statuses = []) => new Map((statuses || []).map(row => [row.muscle, row]));

/** Seçili kas için dört haftalık kontrollü deneme rampası. */
export const buildVolumeRamp = (row) => {
  if (!row) return [];
  const low = Math.max(2, Math.round(parseNumber(row.targetLow)));
  const high = Math.max(low, Math.round(parseNumber(row.targetHigh)));
  const center = Math.round((low + high) / 2);
  const start = row.planned > 0
    ? clamp(Math.round(row.planned), Math.max(2, low - 2), high)
    : low;
  const second = Math.min(high, Math.max(start, center));
  const third = row.recoveryAdjustment?.sets < 0 ? second : high;
  const deload = Math.max(2, Math.round(low * 0.55));
  return [
    { week: 1, sets: start, label: 'Başlangıç', rule: 'Mevcut plana yakın kal; performans ve eklem geri bildirimini kaydet.' },
    { week: 2, sets: second, label: 'Kontrollü artış', rule: second > start ? 'Toparlanma normalse artışı uygula.' : 'Hacmi sabit tut.' },
    { week: 3, sets: third, label: 'Üst sınır denemesi', rule: third > second ? 'Yalnız performans korunuyorsa üst banda çık.' : 'Toparlanma sinyali nedeniyle artış yok.' },
    { week: 4, sets: deload, label: 'Boşaltma', rule: 'Hacmi azalt; bir sonraki blok için yorgunluğu ayır.' },
  ];
};

/**
 * Bütün kaslar için kişisel aralık ve aktif plan farkı.
 * `weeklyHistory`, buildWeeklyVolumeHistory çıktısıdır.
 */
export const buildOptimalVolumeProfile = ({
  weeklyHistory = {},
  planStatuses = [],
  currentVolume = {},
  capacity = null,
  experienceLevel = 'intermediate',
} = {}) => {
  const planMap = planStatusMap(planStatuses);
  const recoveryAdjustment = capacityAdjustment(capacity);

  const rows = MUSCLE_GROUPS.map(muscle => {
    const base = getVolumeLandmarks(muscle, experienceLevel);
    const history = (weeklyHistory?.[muscle] || [])
      .filter(item => parseNumber(item?.volume) > 0);
    // Yeni kayıtlarda evaluated açıkça var. Eski/haricî girdide recovered
    // boolean ise değerlendirilmiş kabul edilir; alan yoksa varsayım yapılmaz.
    const evaluated = history.filter(item => item?.evaluated === true
      || (item?.evaluated === undefined && typeof item?.recovered === 'boolean'));
    const recovered = evaluated.filter(item => item.recovered === true);
    const recoveredVolumes = recovered.map(item => parseNumber(item.volume));

    const sampleScore = Math.min(55, evaluated.length * 7);
    const recoveredScore = Math.min(20, recovered.length * 4);
    const contrastScore = evaluated.some(item => item.recovered === false) ? 10 : 0;
    const continuityScore = history.length >= 6 ? 15 : history.length >= 4 ? 8 : 0;
    const confidence = Math.min(100, sampleScore + recoveredScore + contrastScore + continuityScore);
    const personalized = recoveredVolumes.length >= 3 && confidence >= 55;

    let low = base.mev;
    let high = base.mav;
    let center = Math.round((low + high) / 2);
    let source = 'Başlangıç referansı';

    if (personalized) {
      const q25 = quantile(recoveredVolumes, 0.25);
      const median = quantile(recoveredVolumes, 0.5);
      const q75 = quantile(recoveredVolumes, 0.75);
      // Kişisel gözlemi doğrudan dayatmak yerine güven oranında başlangıç
      // referansına yaklaştırıyoruz. Dört haftalık şanslı seri bütün modeli
      // ele geçiremez; veri arttıkça kişisel tarafın ağırlığı büyür.
      const blend = clamp((confidence - 40) / 60, 0.25, 1);
      const floor = Math.max(2, Math.round(base.mev * 0.6));
      low = clamp(Math.round(base.mev * (1 - blend) + q25 * blend), floor, base.mrv);
      high = clamp(Math.round(base.mav * (1 - blend) + q75 * blend), low, base.mrv);
      center = clamp(Math.round(base.mav * (1 - blend) + median * blend), low, high);
      source = 'Kişisel tamamlanmış haftalar';
    }

    const adjustedLow = clamp(low + recoveryAdjustment.sets, Math.max(2, Math.round(base.mev * 0.5)), base.mrv);
    const adjustedHigh = clamp(high + recoveryAdjustment.sets, adjustedLow, base.mrv);
    const adjustedCenter = clamp(center + recoveryAdjustment.sets, adjustedLow, adjustedHigh);
    const planned = roundQuarter(planMap.get(muscle)?.volume);
    const actual = roundQuarter(currentVolume?.[muscle]);
    const status = planned <= 0 ? 'unplanned'
      : planned < adjustedLow ? 'under'
        : planned > adjustedHigh ? 'over'
          : 'aligned';

    const row = {
      muscle,
      base,
      source,
      personalized,
      confidence,
      confidenceLabel: confidenceLabel(confidence),
      weeks: history.length,
      evaluatedWeeks: evaluated.length,
      recoveredWeeks: recovered.length,
      observedMedian: recoveredVolumes.length ? roundQuarter(quantile(recoveredVolumes, 0.5)) : null,
      targetLow: adjustedLow,
      targetHigh: adjustedHigh,
      targetCenter: adjustedCenter,
      unadjustedLow: low,
      unadjustedHigh: high,
      recoveryAdjustment,
      planned,
      actual,
      status,
      gap: planned < adjustedLow ? roundQuarter(adjustedLow - planned) : 0,
      lowValueCandidate: planned > adjustedHigh ? roundQuarter(planned - adjustedHigh) : 0,
      sources: planMap.get(muscle)?.sources || [],
    };
    return { ...row, ramp: buildVolumeRamp(row) };
  });

  const plannedRows = rows.filter(row => row.planned > 0);
  const aligned = plannedRows.filter(row => row.status === 'aligned');
  const under = plannedRows.filter(row => row.status === 'under').sort((a, b) => b.gap - a.gap);
  const over = plannedRows.filter(row => row.status === 'over').sort((a, b) => b.lowValueCandidate - a.lowValueCandidate);
  const personalizedRows = rows.filter(row => row.personalized);
  const averageConfidence = personalizedRows.length
    ? Math.round(personalizedRows.reduce((sum, row) => sum + row.confidence, 0) / personalizedRows.length)
    : 0;

  return {
    rows,
    hasPlan: plannedRows.length > 0,
    plannedRows,
    aligned,
    under,
    over,
    personalized: personalizedRows.length,
    averageConfidence,
    recoveryAdjustment,
    summary: {
      planned: plannedRows.length,
      aligned: aligned.length,
      under: under.length,
      over: over.length,
      lowValueSets: roundQuarter(over.reduce((sum, row) => sum + row.lowValueCandidate, 0)),
    },
  };
};

/** Koç listesine tek, ölçülebilir ve alarm üretmeyen hacim maddesi. */
export const optimalVolumeCoachItem = (profile) => {
  if (!profile?.hasPlan) return null;
  const highConfidenceOver = profile.over.find(row => row.confidence >= 55 || !row.personalized);
  if (highConfidenceOver && highConfidenceOver.lowValueCandidate >= 2) {
    return {
      key: 'optimal-volume',
      tone: 'warn',
      muscle: highConfidenceOver.muscle,
      title: `${highConfidenceOver.muscle}: ${highConfidenceOver.lowValueCandidate} set düşük getirili hacim adayı`,
      detail: `Plan ${highConfidenceOver.planned} set, geçerli verimli aralık ${highConfidenceOver.targetLow}–${highConfidenceOver.targetHigh}. Bu bir “zararlı set” teşhisi değil; önce bu fazlalığı sabit tutup performans ve toparlanmayı karşılaştır.`
    };
  }
  const under = profile.under.find(row => row.gap >= 2);
  if (under) {
    return {
      key: 'optimal-volume',
      tone: 'info',
      muscle: under.muscle,
      title: `${under.muscle}: plan kişisel çalışma bandının ${under.gap} set altında`,
      detail: `Plan ${under.planned} set, güncel aralık ${under.targetLow}–${under.targetHigh}. Bir kerede kapatmak yerine iki hafta boyunca toplam 1–2 set ekleyip performansı izle.`
    };
  }
  return null;
};
