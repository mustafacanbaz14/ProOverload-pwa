import { parseNumber } from './number.js';
import { categoryOf } from './coachFocus.js';

/**
 * Koç karar panosu.
 *
 * Buradaki "kapasite" tıbbi bir hazır oluşluk testi değil. Uygulamada zaten
 * bulunan ve birbirinden bağımsız anlam taşıyan sinyalleri tek başlangıç
 * noktasında toplar; her sinyal ayrıca görünür kalır. Eksik veri, nötr değer
 * gibi puana katılmaz. Böylece hiç uyku girmeyen biri otomatik olarak kötü
 * uyumuş sayılmaz ve yüksek puan da düşük puan da sahte kesinlik kazanmaz.
 */

export const COACH_HORIZONS = {
  today: { key: 'today', label: 'Bugün', short: 'Şimdi' },
  week: { key: 'week', label: 'Bu Hafta', short: 'Hafta' },
  watch: { key: 'watch', label: 'İzle', short: 'İzle' },
};

export const COACH_CATEGORIES = {
  health: 'Sağlık',
  recovery: 'Toparlanma',
  volume: 'Hacim',
  progress: 'İlerleme',
  nutrition: 'Beslenme',
  consistency: 'Düzen',
  cardio: 'Kardiyo',
  other: 'Diğer',
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, parseNumber(value)));

const signalTone = (score) => score >= 75 ? 'good' : score >= 50 ? 'watch' : 'risk';

const signal = ({ key, label, score, weight, detail, source, available = true }) => ({
  key,
  label,
  score: available ? Math.round(clamp(score)) : null,
  weight,
  detail,
  source,
  available,
  tone: available ? signalTone(score) : 'missing',
});

const latestReadiness = (readiness) => {
  const last = readiness?.seri?.at?.(-1);
  return Number.isFinite(parseNumber(last?.score)) && last?.score !== undefined
    ? clamp(last.score)
    : null;
};

/** Çoklu günlük sinyalden açıklanabilir kapasite özeti. */
export const buildDailyCapacity = ({
  readiness = null,
  sleep = null,
  restingHr = null,
  painReport = null,
  formCurve = null,
  acwr = null,
} = {}) => {
  const signals = [];

  const hazirlik = latestReadiness(readiness);
  signals.push(signal({
    key: 'readiness', label: 'Hazır oluşluk', score: hazirlik, weight: 3,
    available: hazirlik !== null,
    detail: hazirlik === null
      ? 'Yakın tarihli antrenman öncesi form yok.'
      : `Son antrenman öncesi öz bildirimin ${Math.round(hazirlik)}/100.`,
    source: 'Öz bildirim',
  }));

  const uyku = parseNumber(sleep?.score);
  signals.push(signal({
    key: 'sleep', label: 'Uyku', score: uyku, weight: 2,
    available: uyku > 0,
    detail: uyku > 0 ? `Son uyku puanı ${Math.round(uyku)}/100.` : 'Bugüne ait uyku puanı yok.',
    source: 'Uyku kaydı',
  }));

  const hrAvailable = restingHr?.baseline !== null && restingHr?.baseline !== undefined
    && restingHr?.latest?.bpm > 0;
  const hrDelta = hrAvailable ? parseNumber(restingHr.delta) : 0;
  const hrScore = hrDelta <= -3 ? 92 : hrDelta <= 2 ? 85 : hrDelta < 5 ? 68 : hrDelta < 8 ? 45 : 25;
  signals.push(signal({
    key: 'restingHr', label: 'Dinlenme nabzı', score: hrScore, weight: 1,
    available: hrAvailable,
    detail: hrAvailable
      ? `${restingHr.latest.bpm} bpm; kişisel tabandan ${hrDelta > 0 ? '+' : ''}${hrDelta} bpm.`
      : 'Kişisel taban için en az 8 sabah ölçümü gerekiyor.',
    source: 'Ölçüm',
  }));

  const painAvailable = Boolean(painReport?.hasData);
  const activePain = (painReport?.regions || []).filter(r => r.persistent || r.high);
  const maxPain = Math.max(0, ...activePain.map(r => parseNumber(r.average)));
  const painScore = activePain.length === 0 ? 95 : clamp(100 - maxPain * 11);
  signals.push(signal({
    key: 'pain', label: 'Ağrı yükü', score: painScore, weight: 2,
    available: painAvailable,
    detail: !painAvailable
      ? 'Yakın dönem ağrı kaydı yok.'
      : activePain.length === 0
        ? 'Süren veya yüksek şiddetli ağrı örüntüsü yok.'
        : `${activePain.slice(0, 2).map(r => `${r.label} ${r.average}/10`).join(' · ')} sürüyor.`,
    source: 'Ağrı günlüğü',
  }));

  const formAvailable = Boolean(formCurve?.hasData);
  const formScore = formCurve?.overreached ? 35 : formCurve?.readyForHeavy ? 90
    : formCurve?.trend?.direction === 'rising' ? 78 : formCurve?.trend?.direction === 'falling' ? 52 : 66;
  signals.push(signal({
    key: 'form', label: 'Fitness–yorgunluk', score: formScore, weight: 1,
    available: formAvailable,
    detail: !formAvailable
      ? 'Form eğrisi için en az 14 günlük antrenman geçmişi gerekiyor.'
      : formCurve.overreached
        ? 'Modelde kısa vadeli yorgunluk, birikmiş fitness etkisinin üzerinde.'
        : formCurve.readyForHeavy
          ? 'Model ağır çalışma için uygun bir pencere gösteriyor.'
          : `Form eğilimi ${formCurve.trend?.direction === 'rising' ? 'yükseliyor' : formCurve.trend?.direction === 'falling' ? 'düşüyor' : 'dengeli'}.`,
    source: 'Tahmin modeli',
  }));

  const acwrValue = parseNumber(acwr?.acwr);
  const loadAvailable = Boolean(acwr?.hasEnoughData) && acwrValue > 0;
  const loadScore = acwrValue > 1.5 ? 35 : acwrValue > 1.3 ? 58 : acwrValue < 0.65 ? 62 : 82;
  signals.push(signal({
    key: 'load', label: 'Yakın dönem yükü', score: loadScore, weight: 1,
    available: loadAvailable,
    detail: loadAvailable
      ? `EWMA yük oranı ${acwrValue.toFixed(2)}; tek başına risk kararı değildir.`
      : 'Yük eğilimi için yeterli uzunlukta geçmiş yok.',
    source: 'Yük modeli',
  }));

  const available = signals.filter(s => s.available);
  const availableWeight = available.reduce((sum, s) => sum + s.weight, 0);
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const confidence = Math.round((availableWeight / totalWeight) * 100);
  const score = availableWeight > 0
    ? Math.round(available.reduce((sum, s) => sum + s.score * s.weight, 0) / availableWeight)
    : null;

  const insufficient = confidence < 40 || score === null;
  const zone = insufficient
    ? { key: 'unknown', label: 'Veri Az', tone: 'text-zinc-400', bar: 'bg-zinc-600' }
    : score >= 80
      ? { key: 'ready', label: 'Hazır', tone: 'text-emerald-400', bar: 'bg-emerald-500' }
      : score >= 60
        ? { key: 'balanced', label: 'Dengeli', tone: 'text-cyan-400', bar: 'bg-cyan-500' }
        : score >= 40
          ? { key: 'careful', label: 'Temkinli', tone: 'text-amber-400', bar: 'bg-amber-500' }
          : { key: 'recover', label: 'Toparlan', tone: 'text-red-400', bar: 'bg-red-500' };

  return {
    score: insufficient ? null : score,
    rawScore: score,
    confidence,
    zone,
    insufficient,
    available: available.length,
    total: signals.length,
    signals,
    positives: available.filter(s => s.tone === 'good').sort((a, b) => b.weight - a.weight),
    concerns: available.filter(s => s.tone === 'risk' || s.tone === 'watch')
      .sort((a, b) => a.score - b.score || b.weight - a.weight),
    missing: signals.filter(s => !s.available),
  };
};

const DIRECT_KEYS = new Set([
  'joint', 'pain', 'pain-guard', 'plan', 'conflict', 'calories', 'protein',
  'sleep-missing', 'metric', 'dataHealth', 'hydration', 'cardio-todo',
]);
const MODEL_KEYS = new Set([
  'acwr', 'form-overreach', 'form-overreached', 'form-fresh', 'form-peak',
  'perf-driver', 'response-profile', 'exercise-roi', 'muscle-scorecard',
  'block-compare', 'anomaly', 'weak-link',
]);
const TREND_KEYS = new Set([
  'plateau', 'plateau-decline', 'readiness-low', 'resting-hr', 'frequency',
  'frequency-plan', 'consistency', 'pr-watch', 'rotation', 'rir', 'effort',
  'rest-quality', 'time-of-day', 'side-balance',
]);

const horizonFor = (item) => {
  const priority = parseNumber(item?.adjustedPriority || item?.priority || 5);
  if (priority <= 2) return 'today';
  if (priority <= 5) return 'week';
  return 'watch';
};

const evidenceFor = (item) => {
  if (DIRECT_KEYS.has(item.key)) return {
    key: 'direct', label: 'Doğrudan kayıt', confidence: 'Yüksek',
    why: 'Girilen gün, seans veya plan kaydından doğrudan üretildi.',
    caveat: 'Kayıt yanlışsa sonuç da yanlış olur; tahmin eklenmedi.',
  };
  if (MODEL_KEYS.has(item.key)) return {
    key: 'model', label: 'Model', confidence: 'Orta',
    why: 'Birden fazla geçmiş sinyali bir tahmin veya sınıflandırma modelinde birleşti.',
    caveat: 'Bu sonuç teşhis ya da kesin tahmin değildir; yön ve bağlam için kullanılır.',
  };
  if (TREND_KEYS.has(item.key)) return {
    key: 'trend', label: 'Çoklu kayıt', confidence: 'Orta–Yüksek',
    why: 'Tek güne değil, tekrarlanan kayıtların yönüne veya kişisel tabana dayanır.',
    caveat: 'Program, ekipman veya hareket değişimi eğilimi etkileyebilir.',
  };
  return {
    key: 'rule', label: 'Kural', confidence: 'Bağlama bağlı',
    why: 'Mevcut kayıt bir uygulama kuralının koşulunu karşıladı.',
    caveat: 'Kural kişisel bağlamı tamamen bilemez; öneri karar desteğidir.',
  };
};

/** Koç maddelerine zaman ufku, konu ve kanıt açıklaması ekler. */
export const enrichCoachActions = (items = []) => (items || []).map(item => {
  const category = item.category || categoryOf(item.key);
  return {
    ...item,
    horizon: horizonFor(item),
    category,
    categoryLabel: COACH_CATEGORIES[category] || COACH_CATEGORIES.other,
    evidence: evidenceFor(item),
  };
});

const missionList = (items) => {
  const picked = [];
  const categories = new Set();
  for (const item of items) {
    if (picked.length >= 3) break;
    // Saf bilgi ve olumlu durumlar görev değildir; yapılabilecek bir eylem
    // yoksa "görev" etiketi yalnızca baskı üretir.
    if (!item.action || item.tone?.key === 'good') continue;
    if (categories.has(item.category) && picked.length < 2) continue;
    picked.push(item);
    categories.add(item.category);
  }
  return picked;
};

/** Günlük kapasite ile sıralı koç eylemlerini tek açıklanabilir panoda toplar. */
export const buildCoachBriefing = ({ actions = [], ...capacitySources } = {}) => {
  const capacity = buildDailyCapacity(capacitySources);
  const enriched = enrichCoachActions(actions);
  const horizons = Object.fromEntries(Object.keys(COACH_HORIZONS).map(key => [
    key,
    enriched.filter(item => item.horizon === key),
  ]));
  const categories = [...new Set(enriched.map(item => item.category))];
  const missions = missionList(enriched);

  return {
    capacity,
    actions: enriched,
    horizons,
    categories,
    missions,
    headline: capacity.insufficient
      ? 'Karar için birkaç temel kayıt eksik.'
      : capacity.zone.key === 'ready'
        ? 'Sinyaller planlanan yükü destekliyor.'
        : capacity.zone.key === 'balanced'
          ? 'Plan uygulanabilir; ilk setlerdeki geri bildirimi izle.'
          : capacity.zone.key === 'careful'
            ? 'Planı koru, ilerlemeyi bugün zorlamadan değerlendir.'
            : 'Bugünün önceliği yük eklemek değil toparlanmayı korumak.',
  };
};

/** Koç karar defterinin kalibrasyon ve öğrenme özeti. */
export const buildCoachCalibration = (ledger = []) => {
  const entries = (Array.isArray(ledger) ? ledger : []).filter(e => e?.id);
  const settled = entries.filter(e => e?.outcome);
  const tested = settled.filter(e => e.outcome?.complianceMet);
  const worked = tested.filter(e => e.outcome.verdict === 'worked');
  const applied = entries.filter(e => e.decision === 'applied');

  const rate = (rows) => rows.length ? Math.round(rows.filter(e => e.outcome?.verdict === 'worked').length / rows.length * 100) : null;
  const byCategoryMap = new Map();
  tested.forEach(entry => {
    const category = categoryOf(entry.key);
    const row = byCategoryMap.get(category) || { category, tested: 0, worked: 0, backfired: 0, deltas: [] };
    row.tested += 1;
    if (entry.outcome.verdict === 'worked') row.worked += 1;
    if (entry.outcome.verdict === 'backfired') row.backfired += 1;
    if (Number.isFinite(parseNumber(entry.outcome.deltaPct))) row.deltas.push(parseNumber(entry.outcome.deltaPct));
    byCategoryMap.set(category, row);
  });

  const byCategory = [...byCategoryMap.values()].map(row => ({
    ...row,
    label: COACH_CATEGORIES[row.category] || COACH_CATEGORIES.other,
    hitRate: row.tested >= 3 ? Math.round(row.worked / row.tested * 100) : null,
    averageDelta: row.deltas.length
      ? Math.round(row.deltas.reduce((sum, v) => sum + v, 0) / row.deltas.length * 10) / 10
      : null,
  })).sort((a, b) => b.tested - a.tested);

  const chronological = [...tested].sort((a, b) => String(a.outcome.measuredOn).localeCompare(String(b.outcome.measuredOn)));
  const recent = chronological.slice(-5);
  const previous = chronological.slice(-10, -5);
  const complianceRate = settled.length >= 5
    ? Math.round(settled.filter(e => e.outcome.complianceMet).length / settled.length * 100)
    : null;
  const overallRate = tested.length >= 5 ? Math.round(worked.length / tested.length * 100) : null;

  const keyBackfires = new Map();
  tested.filter(e => e.outcome.verdict === 'backfired').forEach(e => {
    const row = keyBackfires.get(e.key) || { key: e.key, title: e.title, count: 0 };
    row.count += 1;
    keyBackfires.set(e.key, row);
  });

  return {
    entries: entries.length,
    applied: applied.length,
    settled: settled.length,
    tested: tested.length,
    worked: worked.length,
    overallRate,
    complianceRate,
    byCategory,
    bestCategory: byCategory.filter(r => r.hitRate !== null).sort((a, b) => b.hitRate - a.hitRate)[0] || null,
    cautionCategory: byCategory.filter(r => r.hitRate !== null).sort((a, b) => a.hitRate - b.hitRate)[0] || null,
    recentRate: recent.length >= 3 ? rate(recent) : null,
    previousRate: previous.length >= 3 ? rate(previous) : null,
    repeatedBackfires: [...keyBackfires.values()].filter(r => r.count >= 2).sort((a, b) => b.count - a.count),
    needed: Math.max(0, 5 - tested.length),
  };
};

export const coachBriefingText = (briefing) => {
  if (!briefing) return '';
  const capacity = briefing.capacity;
  const lines = [
    `KOÇ ÖZETİ — ${capacity.score === null ? 'veri az' : `${capacity.score}/100 ${capacity.zone.label}`} · veri güveni %${capacity.confidence}`,
    briefing.headline,
  ];
  if (briefing.missions.length) {
    lines.push('', 'Öncelikler:');
    briefing.missions.forEach((item, i) => lines.push(`${i + 1}. ${item.title}`));
  }
  const concerns = capacity.concerns.slice(0, 3);
  if (concerns.length) {
    lines.push('', 'Dikkat isteyen sinyaller:');
    concerns.forEach(s => lines.push(`- ${s.label}: ${s.detail}`));
  }
  lines.push('', 'Bu özet karar desteğidir; tıbbi değerlendirme değildir.');
  return lines.join('\n');
};
