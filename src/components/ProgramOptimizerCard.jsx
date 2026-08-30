import React, { memo, useMemo, useState } from 'react';
import {
  AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ChevronUp,
  Gauge, Grid3X3, Sparkles, Target, Timer, Wand2,
} from 'lucide-react';
import { MUSCLE_GROUPS } from '../utils/constants';
import {
  PROGRAM_GOALS, PROGRAM_TIME_BUDGETS, buildProgramAudit,
  rebalanceDraftVolume, spreadDraftWeekdays, trimDraftToTime,
} from '../utils/programIntelligence';

const scoreTone = (score) => score >= 80
  ? 'text-emerald-300 border-emerald-800/50 bg-emerald-950/20'
  : score >= 60
    ? 'text-cyan-300 border-cyan-800/50 bg-cyan-950/20'
    : score >= 40
      ? 'text-amber-300 border-amber-800/50 bg-amber-950/20'
      : 'text-red-300 border-red-800/50 bg-red-950/20';

const ProgramOptimizerCard = memo(({
  days = [], onChange, customExercises = [], experienceLevel = 'intermediate',
  restSeconds = 120, optimalProfile = null,
}) => {
  const [open, setOpen] = useState(true);
  const [goal, setGoal] = useState('growth');
  const [timeBudget, setTimeBudget] = useState(60);
  const [priorities, setPriorities] = useState([]);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [lastAction, setLastAction] = useState('');

  const options = useMemo(() => ({
    customExercises, experienceLevel, goal, priorities, timeBudget,
    restSeconds, optimalProfile,
  }), [customExercises, experienceLevel, goal, priorities, timeBudget, restSeconds, optimalProfile]);

  const audit = useMemo(() => buildProgramAudit(days, options), [days, options]);

  const togglePriority = (muscle) => setPriorities(current => {
    if (current.includes(muscle)) return current.filter(item => item !== muscle);
    if (current.length >= 3) return current;
    return [...current, muscle];
  });

  const applyBalance = () => {
    const result = rebalanceDraftVolume(days, options);
    if (result.changes.length) onChange?.(result.days);
    setLastAction(result.changes.length
      ? `${result.changes.filter(c => c.type === 'add').length} set eklendi, ${result.changes.filter(c => c.type === 'remove').length} set çıkarıldı.`
      : 'Mevcut hareketlerle güvenli bir set düzeltmesi bulunamadı. Eksik kas için hareket eklemek gerekebilir.');
  };

  const applyTime = () => {
    const result = trimDraftToTime(days, options);
    if (result.changes.length) onChange?.(result.days);
    setLastAction(result.changes.length
      ? `${result.changes.length} set azaltıldı; hiçbir hareket silinmedi ve hiçbir hareket 2 setin altına inmedi.`
      : 'Set azaltarak yapılabilecek ek süre düzeltmesi yok. Süreyi kısaltmak için hareket seçimini değiştirmek gerekir.');
  };

  const applySpacing = () => {
    onChange?.(spreadDraftWeekdays(days));
    setLastAction('Antrenman günleri mevcut sıraları korunarak haftaya eşit yayıldı.');
  };

  const matrixMuscles = audit.muscleRows.slice(0, 6);

  return (
    <section className="rounded-2xl border border-violet-900/45 bg-gradient-to-br from-violet-950/25 via-zinc-900 to-zinc-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        className="w-full px-3 py-2.5 flex items-center justify-between gap-3 text-left active:bg-zinc-800/30"
      >
        <span className="min-w-0">
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-violet-400 flex items-center gap-1.5">
            <Sparkles size={10} /> Program Zekâsı
          </span>
          <strong className="text-[11px] text-zinc-100 block mt-0.5 truncate">
            {audit.hasData ? `${audit.score}/100 · ${audit.findings.length} inceleme noktası` : 'Hareket ekledikçe canlı denetim'}
          </strong>
        </span>
        <span className={`w-12 h-12 shrink-0 rounded-xl border flex flex-col items-center justify-center ${scoreTone(audit.score)}`}>
          <strong className="text-base font-mono leading-none">{audit.hasData ? audit.score : '—'}</strong>
          <span className="text-[7px] font-bold mt-1">SKOR</span>
        </span>
        {open ? <ChevronUp size={15} className="text-zinc-400 shrink-0" /> : <ChevronDown size={15} className="text-zinc-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-zinc-800/80 p-3 space-y-3">
          <div>
            <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest block mb-1.5">1 · Program amacı</span>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.values(PROGRAM_GOALS).map(item => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setGoal(item.key)}
                  aria-pressed={goal === item.key}
                  className={`rounded-xl border py-2 text-[9px] font-bold ${goal === item.key ? 'border-violet-500 bg-violet-950/40 text-violet-200' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-[8px] font-mono text-zinc-400 leading-relaxed mt-1.5">{PROGRAM_GOALS[goal].detail}</p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">2 · Seans süresi</span>
              <span className="text-[8px] font-mono text-zinc-400">en fazla {timeBudget} dk</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {PROGRAM_TIME_BUDGETS.map(value => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setTimeBudget(value)}
                  className={`rounded-lg border py-1.5 text-[9px] font-mono ${timeBudget === value ? 'border-cyan-600 bg-cyan-950/30 text-cyan-300' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}
                >
                  {value} dk
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">3 · Kas önceliği</span>
              <span className="text-[8px] font-mono text-zinc-400">{priorities.length}/3</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
              {MUSCLE_GROUPS.map(muscle => (
                <button
                  type="button"
                  key={muscle}
                  onClick={() => togglePriority(muscle)}
                  aria-pressed={priorities.includes(muscle)}
                  className={`shrink-0 rounded-lg border px-2 py-1.5 text-[8px] font-bold ${priorities.includes(muscle) ? 'border-amber-500 bg-amber-950/30 text-amber-200' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>

          {audit.hasData && (
            <>
              <div className="grid grid-cols-5 gap-1">
                {audit.dimensions.map(item => (
                  <div key={item.key} className="rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 text-center min-w-0">
                    <strong className={`text-[10px] font-mono block ${item.score >= 70 ? 'text-emerald-300' : item.score >= 45 ? 'text-amber-300' : 'text-red-300'}`}>{item.score}</strong>
                    <span className="text-[6px] font-bold text-zinc-400 uppercase block truncate px-0.5">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                {audit.findings.slice(0, 4).map(finding => (
                  <div key={finding.key} className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 px-2.5 py-2">
                    {finding.tone === 'danger' || finding.tone === 'warn'
                      ? <AlertTriangle size={10} className={finding.tone === 'danger' ? 'text-red-400 mt-0.5 shrink-0' : 'text-amber-400 mt-0.5 shrink-0'} />
                      : <Target size={10} className="text-cyan-400 mt-0.5 shrink-0" />}
                    <span className="min-w-0">
                      <strong className="text-[9px] text-zinc-300 block">{finding.title}</strong>
                      <span className="text-[8px] font-mono text-zinc-400 leading-relaxed block">{finding.detail}</span>
                    </span>
                  </div>
                ))}
                {audit.findings.length === 0 && (
                  <p className="rounded-xl border border-emerald-900/40 bg-emerald-950/15 px-2.5 py-2 text-[9px] font-mono text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={10} /> Seçili amaç ve süre için belirgin sorun bulunmadı.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button type="button" onClick={applyBalance} className="rounded-xl border border-violet-800/60 bg-violet-950/25 py-2 text-[8px] font-bold text-violet-200 flex flex-col items-center gap-1">
                  <Wand2 size={12} /> Setleri Dengele
                </button>
                <button type="button" onClick={applyTime} className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 py-2 text-[8px] font-bold text-cyan-200 flex flex-col items-center gap-1">
                  <Timer size={12} /> Süreye Sığdır
                </button>
                <button type="button" onClick={applySpacing} className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 py-2 text-[8px] font-bold text-emerald-200 flex flex-col items-center gap-1">
                  <CalendarDays size={12} /> Günleri Yay
                </button>
              </div>

              {lastAction && (
                <p className="text-[8px] font-mono text-zinc-500 leading-relaxed rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5">{lastAction}</p>
              )}

              <button
                type="button"
                onClick={() => setMatrixOpen(value => !value)}
                aria-expanded={matrixOpen}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 py-2 flex items-center justify-between text-[9px] font-bold text-zinc-400"
              >
                <span className="flex items-center gap-1.5"><Grid3X3 size={11} /> Kas × Gün Dağılımı</span>
                {matrixOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {matrixOpen && audit.dayRows.length > 0 && (
                <div className="overflow-x-auto hide-scrollbar rounded-xl border border-zinc-800 bg-zinc-950">
                  <table className="min-w-full text-[8px] font-mono">
                    <thead><tr className="text-zinc-400 border-b border-zinc-800">
                      <th className="text-left p-2">Kas</th>
                      {audit.dayRows.map(day => <th key={day.uid} className="px-2 py-2 text-center whitespace-nowrap">{day.name}</th>)}
                    </tr></thead>
                    <tbody>
                      {matrixMuscles.map(row => (
                        <tr key={row.muscle} className="border-b border-zinc-900 last:border-0">
                          <td className="p-2 text-zinc-400 whitespace-nowrap">{row.muscle}</td>
                          {audit.dayRows.map(day => {
                            const volume = row.dayVolumes[day.originalIndex] || 0;
                            return <td key={day.uid} className={`px-2 py-2 text-center ${volume >= 4 ? 'text-emerald-300' : volume > 0 ? 'text-cyan-300' : 'text-zinc-800'}`}>{Math.round(volume * 4) / 4}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <p className="text-[8px] font-mono text-zinc-500 leading-relaxed flex items-start gap-1.5">
            <Gauge size={9} className="mt-0.5 shrink-0" /> Skor karar desteğidir. Bölgesel programlarda “örüntü” puanı bilinçli olarak düşük olabilir; otomatik düzeltmeler hareket silmez ve en az 2 seti korur.
          </p>
        </div>
      )}
    </section>
  );
});

ProgramOptimizerCard.displayName = 'ProgramOptimizerCard';

export default ProgramOptimizerCard;
