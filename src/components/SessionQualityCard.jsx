import React, { useMemo, memo } from 'react';
import { Gauge, ArrowUpNarrowWide, CheckCircle2, Timer } from 'lucide-react';
import { auditSessionQuality } from '../utils/sessionQuality';
import { buildRirCalibration } from '../utils/rirCalibration';

/**
 * Seans kalitesi ve RIR kalibrasyonu.
 *
 * İkisi bir arada duruyor çünkü ikisi de aynı soruyu soruyor: kaydettiğin
 * sayılar gerçekte ne anlama geliyor. Hacim tablosu "16 set" diyor; bu kart
 * o 16 setin hangi sırada, hangi tempoda ve ne kadar gerçek bir zorlanmayla
 * yapıldığını söylüyor.
 */

const PACE = {
  slow: { color: 'text-amber-400', label: 'Dağınık' },
  fast: { color: 'text-amber-400', label: 'Hızlı' },
  ok: { color: 'text-emerald-400', label: 'Dengeli' },
};

const VERDICT = {
  overestimating: { color: 'text-amber-400', label: 'Yedek abartılıyor' },
  underestimating: { color: 'text-cyan-400', label: 'Yedek eksik bildiriliyor' },
  calibrated: { color: 'text-emerald-400', label: 'Tutarlı' },
  unknown: { color: 'text-zinc-500', label: 'Veri yetersiz' },
};

const SessionQualityCard = memo(({ workouts = [], customExercises = [] }) => {
  const sonSeans = useMemo(
    () => [...(workouts || [])].sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null,
    [workouts]);

  const kalite = useMemo(
    () => (sonSeans
      ? auditSessionQuality(sonSeans.exercises, { customExercises, durationMinutes: sonSeans.duration })
      : null),
    [sonSeans, customExercises]);

  const rir = useMemo(
    () => buildRirCalibration(workouts),
    [workouts]);

  if (!kalite?.hasData && !rir.hasData) return null;

  const V = VERDICT[rir.verdict] || VERDICT.unknown;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Gauge size={12} className="mr-1.5 text-cyan-400" /> Seans Kalitesi
        </h4>
        {sonSeans && <span className="text-[9px] font-mono text-zinc-400 shrink-0">son seans</span>}
      </div>

      {kalite?.efficiency && (
        <div className="px-4 py-3 border-b border-zinc-800/70">
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-[11px] font-bold text-zinc-200 flex items-center">
              <Timer size={11} className="mr-1.5 text-zinc-500" /> Süre verimliliği
            </span>
            <span className="text-[10px] font-mono shrink-0">
              <strong className={PACE[kalite.efficiency.pace].color}>{kalite.efficiency.minutesPerSet}</strong>
              <span className="text-zinc-400"> dk/set · {PACE[kalite.efficiency.pace].label}</span>
            </span>
          </div>
          <p className="text-[9px] font-mono text-zinc-500 leading-relaxed mt-1">
            {kalite.efficiency.minutes} dk · {kalite.efficiency.workingSets} çalışma seti
            {kalite.efficiency.warmupSets > 0 ? ` (+${kalite.efficiency.warmupSets} ısınma)` : ''}.
            {' '}{kalite.efficiency.note}
          </p>
        </div>
      )}

      {kalite?.hasData && (
        <div className="px-4 py-3 border-b border-zinc-800/70">
          <span className="text-[11px] font-bold text-zinc-200 flex items-center mb-1.5">
            <ArrowUpNarrowWide size={11} className="mr-1.5 text-zinc-500" /> Hareket sırası
          </span>
          {kalite.clean ? (
            <p className="text-[9px] font-mono text-emerald-300 leading-relaxed flex items-start gap-1.5">
              <CheckCircle2 size={11} className="shrink-0 mt-0.5" />
              Bileşke hareketler izolasyonlardan önce yapılmış. En çok yük kaldıran
              hareket dinç yapıldığında hem risk düşük hem uyaran yüksek.
            </p>
          ) : (
            <div className="space-y-1.5">
              {kalite.findings.map(f => (
                <p key={f.exercise} className="text-[9px] font-mono text-amber-200/90 leading-relaxed">
                  <strong className="text-amber-400">{f.title}.</strong> {f.detail}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex justify-between items-baseline gap-2">
          <span className="text-[11px] font-bold text-zinc-200">RIR kalibrasyonu</span>
          <span className="text-[10px] font-mono shrink-0">
            <strong className={V.color}>{V.label}</strong>
            {rir.hasData && <span className="text-zinc-400"> · {rir.pairs} çift</span>}
          </span>
        </div>
        <p className="text-[9px] font-mono text-zinc-500 leading-relaxed mt-1">
          {rir.hasData
            ? rir.advice
            : `Aynı ağırlıkta ardışık iki set gerekiyor ve şu an ${rir.pairs}/${rir.needed} çift var. Bildirdiğin RIR'in gerçekle uyuşup uyuşmadığı ancak bu çiftlerden ölçülebiliyor — kimse her seti başarısızlığa taşımadığı için doğrudan ölçüm mümkün değil.`}
        </p>
        {rir.hasData && rir.byExercise?.length > 0 && rir.verdict !== 'calibrated' && (
          <div className="mt-2 space-y-0.5">
            {rir.byExercise.map(x => (
              <div key={x.name} className="flex justify-between items-baseline gap-2 text-[9px] font-mono">
                <span className="text-zinc-500 truncate min-w-0">{x.name}</span>
                <span className="text-zinc-400 shrink-0">
                  {x.bias > 0 ? '+' : ''}{x.bias} RIR · {x.pairs} çift
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

SessionQualityCard.displayName = 'SessionQualityCard';

export default SessionQualityCard;
