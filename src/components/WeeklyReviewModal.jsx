import React, { useState, useMemo, memo } from 'react';
import {
  X, ClipboardCheck, ChevronLeft, ChevronRight, Layers, Dumbbell,
  Moon, BrainCircuit, Flame, CalendarCheck, ShieldCheck,
} from 'lucide-react';
import { buildWeeklyReview, lastCompletedWeekStart } from '../utils/weeklyReview';
import { weekBounds, dayKey } from '../utils/dates';
import { buildCoachProtocol, isCoachProtocolActive } from '../utils/coachProtocol';

const TONE = {
  warn: 'border-amber-900/50 bg-amber-950/20 text-amber-300',
  info: 'border-cyan-900/50 bg-cyan-950/20 text-cyan-300',
  good: 'border-emerald-900/50 bg-emerald-950/20 text-emerald-300',
};

const Stat = ({ icon, value, label, sub }) => (
  <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl py-3 px-2 text-center min-w-0 shadow-sm backdrop-blur-sm">
    <div className="flex justify-center mb-1.5">{icon}</div>
    <span className="text-base font-mono font-black text-zinc-100 block truncate">{value}</span>
    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 block truncate mt-0.5">{label}</span>
    {sub && <span className="text-[8px] font-mono text-zinc-500 block truncate mt-0.5">{sub}</span>}
  </div>
);

/**
 * Haftalık gözden geçirme.
 *
 * Günlük koç "bugün ne yapmalıyım"ı cevaplıyor; hacim artır/azalt, deload ve
 * kalori ayarı gibi kararlar ise haftalık ölçekte alınıyor. Varsayılan görünüm
 * GEÇEN tam hafta — içinde bulunulan hafta bitmediği için "hacim eksik" demek
 * yanıltıcı olur; kullanıcı isterse oklarla o haftaya da bakabiliyor.
 */
const WeeklyReviewModal = memo(({
  isOpen, onClose, activeProtocol, onActivateProtocol, onOpenCoach, ...data
}) => {
  const [weekStart, setWeekStart] = useState(() => lastCompletedWeekStart());

  const review = useMemo(
    () => buildWeeklyReview({ ...data, weekStart }),
    [data, weekStart]);
  const proposal = useMemo(
    () => buildCoachProtocol(review, data.nutritionGoal),
    [review, data.nutritionGoal]);

  if (!isOpen || !review) return null;

  const kaydir = (yon) => {
    const d = weekBounds(weekStart).start;
    d.setDate(d.getDate() + yon * 7);
    setWeekStart(dayKey(d));
  };
  // İçinde bulunulan haftadan ileriye gidilemez: henüz veri yok.
  const ileriKapali = weekStart >= weekBounds(dayKey(new Date())).startKey;

  const { training, volume, recovery, energy, cardio } = review;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="weekly-review-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[94] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md shrink-0">
          <h3 id="weekly-review-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest flex items-center">
            <ClipboardCheck size={16} className="mr-2 text-emerald-400" /> Haftalık Gözden Geçirme
          </h3>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/70 shrink-0 flex items-center justify-between gap-2">
          <button onClick={() => kaydir(-1)} className="luxury-icon-button w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400" aria-label="Önceki hafta">
            <ChevronLeft size={15} />
          </button>
          <span className="text-[12px] font-black text-zinc-100 tracking-wide">{review.range}</span>
          <button
            onClick={() => kaydir(1)}
            disabled={ileriKapali}
            className="luxury-icon-button w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 disabled:opacity-30"
            aria-label="Sonraki hafta"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">

        <div className="grid grid-cols-4 gap-2">
          <Stat
            icon={<CalendarCheck size={14} className="text-cyan-400" />}
            value={training.plannedDays > 0 ? `${training.days}/${training.plannedDays}` : training.days}
            label="gün"
            sub={training.plannedDays > 0 ? 'plan' : null}
          />
          <Stat
            icon={<Layers size={14} className="text-emerald-400" />}
            value={training.effectiveSets}
            label="etkili set"
            sub={training.previousEffectiveSets > 0
              ? `${training.effectiveSets - training.previousEffectiveSets >= 0 ? '+' : ''}${training.effectiveSets - training.previousEffectiveSets}`
              : null}
          />
          <Stat
            icon={<Moon size={14} className="text-indigo-400" />}
            value={recovery.sleepScore ?? '—'}
            label="uyku"
            sub={recovery.nights > 0 ? `${recovery.nights} gece` : null}
          />
          <Stat
            icon={<BrainCircuit size={14} className="text-amber-400" />}
            value={recovery.readiness ?? '—'}
            label="hazır oluş"
          />
        </div>

        {/* Kardiyo haftalık özette */}
        {cardio?.sessions > 0 && (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 space-y-2 backdrop-blur-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Kardiyo</span>
              <strong className="text-[11px] font-mono text-cyan-300">
                {cardio.sessions} seans · {cardio.minutes} dk
                {cardio.distanceKm > 0 ? ` · ${cardio.distanceKm} km` : ''}
              </strong>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800/60">
              {[
                { k: 'low', v: cardio.byIntensity.low, c: 'bg-emerald-500' },
                { k: 'middle', v: cardio.byIntensity.middle, c: 'bg-amber-500' },
                { k: 'high', v: cardio.byIntensity.high, c: 'bg-red-500' },
              ].map(x => (
                <div key={x.k} className={x.c} style={{ width: `${cardio.minutes > 0 ? (x.v / cardio.minutes) * 100 : 0}%` }} />
              ))}
            </div>
            <span className="text-[9px] font-mono text-zinc-500">
              {cardio.byIntensity.low} dk düşük · {cardio.byIntensity.middle} dk orta · {cardio.byIntensity.high} dk yüksek
              {cardio.previousMinutes > 0 ? ` (geçen hafta ${cardio.previousMinutes} dk)` : ''}
            </span>
          </div>
        )}

        {training.adaptedSessions > 0 && (
          <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 px-3.5 py-2.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-amber-300">Hazır oluşluğa göre uyarlanan seans</span>
            <strong className="text-[11px] font-mono text-amber-400">{training.adaptedSessions}{training.recoverySessions > 0 ? ` · ${training.recoverySessions} toparlanma` : ''}</strong>
          </div>
        )}

        {/* Bir sonraki hafta için ayarlar */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
            Gelecek Hafta İçin
          </h4>
          {review.adjustments.map(a => (
            <div key={a.key} className={`rounded-2xl border p-3.5 backdrop-blur-sm ${TONE[a.tone] || TONE.info}`}>
              <span className="text-[11px] font-bold block mb-1">{a.title}</span>
              <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">{a.detail}</p>
            </div>
          ))}
        </div>

        {proposal && (
          <div className="rounded-2xl border border-cyan-900/60 bg-cyan-950/20 p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={11} /> 6.0 Koç Protokolü
                </span>
                <strong className="text-[12px] font-bold text-zinc-100 block mt-1">{proposal.label}</strong>
                <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1">{proposal.summary}</p>
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-lg shrink-0">{proposal.confidence.score}/100</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <button
                onClick={() => onActivateProtocol?.(proposal)}
                disabled={!proposal.canApply || isCoachProtocolActive(activeProtocol)}
                className="rounded-2xl bg-cyan-600 active:scale-[0.98] disabled:bg-zinc-800 disabled:text-zinc-600 py-3 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-cyan-950/40 transition-all"
              >
                {isCoachProtocolActive(activeProtocol) ? 'Protokol Aktif' : 'Bu Haftaya Uygula'}
              </button>
              <button onClick={onOpenCoach} className="rounded-2xl border border-zinc-700/80 bg-zinc-900/80 active:scale-[0.98] py-3 text-[10px] font-black uppercase tracking-wider text-zinc-200 flex items-center justify-center gap-1.5 transition-all">
                <BrainCircuit size={13} /> Detay
              </button>
            </div>
          </div>
        )}

        {energy && (
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center">
                <Flame size={13} className="mr-1.5 text-red-400" /> Kalori Dengesi
              </span>
              <span className="text-[9px] font-mono text-zinc-500">{energy.days}/7 gün</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-mono font-black ${energy.balance < 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                {energy.balance > 0 ? '+' : ''}{energy.balance}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                kcal ≈ {energy.kg > 0 ? '+' : ''}{energy.kg} kg
              </span>
              {energy.partial && (
                <span className="text-[9px] font-mono text-amber-400 ml-auto">kısmi</span>
              )}
            </div>
          </div>
        )}

        {/* Kas kas hacim ve önceki haftaya göre değişim */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex justify-between items-baseline">
            <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Hacim</h4>
            <span className="text-[9px] font-mono text-zinc-500">önceki haftaya göre</span>
          </div>
          <div className="divide-y divide-zinc-800/70">
            {volume.statuses.filter(s => s.volume > 0 || s.change !== 0).map(s => (
              <div key={s.muscle} className="px-4 py-2.5 flex justify-between items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-200 truncate">{s.muscle}</span>
                <span className="text-[10px] font-mono shrink-0">
                  <span className="text-zinc-100 font-bold">{s.volume}</span>
                  <span className="text-zinc-500"> / MEV {s.mev}</span>
                  {s.change !== 0 && (
                    <span className={`font-bold ml-1.5 ${s.change > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {s.change > 0 ? '+' : ''}{s.change}
                    </span>
                  )}
                </span>
              </div>
            ))}
            {volume.statuses.every(s => s.volume === 0 && s.change === 0) && (
              <p className="px-4 py-6 text-center text-[11px] font-mono text-zinc-400">
                Bu hafta ağırlık antrenmanı kaydı yok.
              </p>
            )}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-3 flex items-start gap-2.5">
          <Dumbbell size={14} className="text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
            Varsayılan görünüm geçen tam hafta; içinde bulunduğun hafta bitmeden
            hacmi eksik saymak yanıltıcı olurdu. Oklarla geçmiş haftalara
            bakabilirsin.
          </p>
        </div>
      </div>
    </div>
  </div>
  );
});

WeeklyReviewModal.displayName = 'WeeklyReviewModal';

export default WeeklyReviewModal;
