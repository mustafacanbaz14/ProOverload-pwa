import React, { memo, useMemo } from 'react';
import {
  X, BrainCircuit, ShieldCheck, CalendarRange, Dumbbell, Moon,
  Flame, CheckCircle2, AlertTriangle, History, Power, PowerOff,
} from 'lucide-react';
import { buildWeeklyReview } from '../utils/weeklyReview';
import { buildCoachProtocol, COACH_PROTOCOL_MODES, isCoachProtocolActive } from '../utils/coachProtocol';
import CoachBriefingCard from './CoachBriefingCard';
import { APP_VERSION } from '../utils/constants';

const MODE_STYLE = {
  recovery: 'border-amber-900/60 bg-amber-950/20 text-amber-300',
  rebuild: 'border-violet-900/60 bg-violet-950/20 text-violet-300',
  progress: 'border-emerald-900/60 bg-emerald-950/20 text-emerald-300',
  hold: 'border-cyan-900/60 bg-cyan-950/20 text-cyan-300',
};

const Stat = ({ icon, value, label }) => (
  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/90 px-2.5 py-3 text-center min-w-0 shadow-sm">
    <div className="flex justify-center mb-1.5">{icon}</div>
    <strong className="text-[12px] font-mono font-black text-zinc-100 block truncate tracking-tight">{value}</strong>
    <span className="text-[8px] font-mono text-zinc-500 block truncate mt-0.5">{label}</span>
  </div>
);

const CoachCenterModal = memo(({
  isOpen, onClose,
  workouts = [], customExercises = [], experienceLevel = 'intermediate',
  planDays = [], wellness = [], energyWeeks = [], nutritionGoal = 'maintain',
  activeProtocol = null, history = [], onActivate, onDeactivate,
  briefing = null, onCoachAction, onApplyCoach,
}) => {
  const review = useMemo(() => buildWeeklyReview({
    workouts, customExercises, experienceLevel, planDays, wellness, energyWeeks, nutritionGoal,
  }), [workouts, customExercises, experienceLevel, planDays, wellness, energyWeeks, nutritionGoal]);

  const proposal = useMemo(
    () => buildCoachProtocol(review, nutritionGoal),
    [review, nutritionGoal]);

  if (!isOpen || !review || !proposal) return null;

  const active = isCoachProtocolActive(activeProtocol);
  const sameSource = activeProtocol?.sourceWeek?.start === proposal.sourceWeek?.start;
  const mode = COACH_PROTOCOL_MODES[proposal.mode];
  const style = MODE_STYLE[proposal.mode] || MODE_STYLE.hold;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="coach-center-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[96] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-md max-h-[88dvh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden">
        <header className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md shrink-0">
          <div>
            <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-[0.2em] font-bold">ProOverload v{APP_VERSION}</span>
            <h3 id="coach-center-title" className="text-[13px] font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2 mt-0.5">
              <BrainCircuit size={16} className="text-cyan-400" /> Koç Merkezi
            </h3>
          </div>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Koç merkezini kapat">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">
        <CoachBriefingCard
          briefing={briefing}
          compact
          onAction={onCoachAction}
          onApply={onApplyCoach}
        />

        {active && (
          <section className="rounded-2xl border border-emerald-800/60 bg-emerald-950/20 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-wider">Aktif Bu Hafta</span>
                <strong className="text-[12px] text-emerald-300 block mt-0.5">{activeProtocol.label}</strong>
                <p className="text-[9px] font-mono text-zinc-400 mt-1">{activeProtocol.validFrom} → {activeProtocol.validUntil}</p>
              </div>
              <button onClick={onDeactivate} className="rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-[9px] font-bold text-zinc-400 flex items-center gap-1">
                <PowerOff size={11} /> Kapat
              </button>
            </div>
          </section>
        )}

        <section className={`rounded-3xl border p-4 ${style}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[8px] font-mono uppercase tracking-wider opacity-75">Gelecek Hafta Kararı</span>
              <h4 className="text-base font-black mt-0.5">{mode.label}</h4>
            </div>
            <div className="text-right shrink-0">
              <strong className="text-xl font-mono block">{proposal.confidence.score}</strong>
              <span className="text-[8px] font-mono opacity-75">güven / 100</span>
            </div>
          </div>
          <p className="text-[10px] font-mono text-zinc-300 leading-relaxed mt-2">{mode.summary}</p>
          <div className="mt-3 pt-3 border-t border-current/15 space-y-1">
            {proposal.reasons.map(reason => (
              <p key={reason} className="text-[9px] font-mono text-zinc-400 flex items-start gap-1.5">
                <CheckCircle2 size={10} className="shrink-0 mt-0.5" /> {reason}
              </p>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-4 gap-2">
          <Stat icon={<Dumbbell size={12} className="text-cyan-400" />} value={review.training.sessions} label="seans" />
          <Stat icon={<Moon size={12} className="text-indigo-400" />} value={review.recovery.nights} label="gece" />
          <Stat icon={<ShieldCheck size={12} className="text-amber-400" />} value={review.recovery.readinessEntries || 0} label="hazır oluş" />
          <Stat icon={<Flame size={12} className="text-orange-400" />} value={review.energy?.days || 0} label="enerji günü" />
        </div>

        {proposal.confidence.missing.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 flex items-start gap-2.5">
            <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[9px] font-bold text-zinc-300 block">Güveni artırmak için</span>
              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed mt-0.5">{proposal.confidence.missing.join(' · ')}</p>
            </div>
          </div>
        )}

        {(proposal.volume.length > 0 || proposal.calorieDelta !== 0) && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-3.5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <CalendarRange size={13} className="text-cyan-400" />
              <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Somut Ayarlar</h4>
            </div>
            <div className="divide-y divide-zinc-800/70">
              {proposal.volume.slice(0, 6).map(row => (
                <div key={row.muscle} className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold text-zinc-300">{row.muscle}</span>
                  <span className={`text-[10px] font-mono font-bold ${row.delta > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {row.current} → {row.target} set
                  </span>
                </div>
              ))}
              {proposal.calorieDelta !== 0 && (
                <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold text-zinc-300">Günlük kalori hedefi</span>
                  <span className={`text-[10px] font-mono font-bold ${proposal.calorieDelta > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {proposal.calorieDelta > 0 ? '+' : ''}{proposal.calorieDelta} kcal
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[9px] font-bold text-zinc-300">{proposal.validFrom} → {proposal.validUntil}</span>
            <span className="text-[8px] font-mono text-zinc-400">kaynak: {proposal.sourceWeek.range}</span>
          </div>
          <button
            onClick={() => onActivate?.(proposal)}
            disabled={!proposal.canApply || (active && sameSource)}
            className="w-full rounded-xl bg-cyan-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Power size={12} /> {active && sameSource ? 'Bu Protokol Aktif' : 'Bu Haftaya Uygula'}
          </button>
          {!proposal.canApply && (
            <p className="text-[8px] font-mono text-zinc-400 leading-relaxed mt-2 text-center">
              Aktivasyon için en az bir antrenman ve 35/100 veri güveni gerekir.
            </p>
          )}
          <p className="text-[8px] font-mono text-zinc-400 leading-relaxed mt-2 text-center">
            Protokol şablonları değiştirmez. Toparlanma modu yalnızca o hafta başlatılan seansın çalışma setlerini azaltır.
          </p>
        </section>

        {history.length > 0 && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-3.5 py-3 border-b border-zinc-800 flex items-center gap-2">
              <History size={13} className="text-zinc-500" />
              <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Karar Hafızası</h4>
            </div>
            <div className="divide-y divide-zinc-800/70">
              {history.slice(0, 6).map(item => (
                <div key={item.id} className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="text-[10px] text-zinc-300 block truncate">{item.label}</strong>
                    <span className="text-[8px] font-mono text-zinc-400">{item.validFrom} → {item.validUntil}</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500 shrink-0">güven {item.confidence?.score || 0}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  </div>
  );
});

CoachCenterModal.displayName = 'CoachCenterModal';
export default CoachCenterModal;
