import React, { memo, useMemo, useState } from 'react';
import {
  BrainCircuit, ChevronDown, ChevronRight, Check, Copy, Gauge,
  ShieldCheck, Sparkles, Target,
} from 'lucide-react';
import {
  COACH_CATEGORIES, COACH_HORIZONS, coachBriefingText,
} from '../utils/coachDashboard';

const SIGNAL_STYLE = {
  good: 'border-emerald-900/50 bg-emerald-950/15 text-emerald-400',
  watch: 'border-amber-900/50 bg-amber-950/15 text-amber-400',
  risk: 'border-red-900/50 bg-red-950/15 text-red-400',
  missing: 'border-zinc-800 bg-zinc-950 text-zinc-600',
};

const EVIDENCE_STYLE = {
  direct: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/20',
  trend: 'text-cyan-400 border-cyan-900/50 bg-cyan-950/20',
  model: 'text-violet-400 border-violet-900/50 bg-violet-950/20',
  rule: 'text-zinc-400 border-zinc-700 bg-zinc-900',
};

const CoachBriefingCard = memo(({
  briefing,
  onAction,
  onApply,
  compact = false,
}) => {
  const [horizon, setHorizon] = useState('today');
  const [category, setCategory] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [showSignals, setShowSignals] = useState(false);
  const [copied, setCopied] = useState(false);

  const actions = useMemo(() => {
    const rows = briefing?.horizons?.[horizon] || [];
    return category === 'all' ? rows : rows.filter(item => item.category === category);
  }, [briefing, horizon, category]);

  if (!briefing) return null;

  const { capacity, missions } = briefing;
  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(coachBriefingText(briefing));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="rounded-3xl border border-cyan-900/45 bg-gradient-to-br from-cyan-950/30 via-zinc-900 to-zinc-950 overflow-hidden">
      <div className="p-4 border-b border-zinc-800/80">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[8px] font-mono text-cyan-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <BrainCircuit size={11} /> Karar Panosu
            </span>
            <h3 className="text-[13px] font-black text-zinc-100 mt-1 leading-snug">{briefing.headline}</h3>
          </div>
          <button
            type="button"
            onClick={copySummary}
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-zinc-500 active:text-cyan-400 shrink-0"
            aria-label="Koç özetini kopyala"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-3 items-center mt-3">
          <div className="w-16 h-16 rounded-2xl border border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center">
            <strong className={`text-xl font-mono ${capacity.zone.tone}`}>
              {capacity.score === null ? '—' : capacity.score}
            </strong>
            <span className="text-[8px] font-mono text-zinc-600">/100</span>
          </div>
          <div className="min-w-0">
            <div className="flex justify-between items-baseline gap-2">
              <strong className={`text-[11px] uppercase tracking-wider ${capacity.zone.tone}`}>{capacity.zone.label}</strong>
              <span className="text-[8px] font-mono text-zinc-600">veri güveni %{capacity.confidence}</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden mt-1.5">
              <div className={`h-full rounded-full ${capacity.zone.bar}`} style={{ width: `${capacity.score ?? 0}%` }} />
            </div>
            <p className="text-[8px] font-mono text-zinc-500 leading-relaxed mt-1.5">
              {capacity.available}/{capacity.total} sinyal kullanılabilir. Eksik sinyaller puana sıfır olarak yazılmaz.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSignals(v => !v)}
          className="w-full mt-3 flex items-center justify-between text-left rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2"
        >
          <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-1.5">
            <Gauge size={11} className="text-cyan-500" /> Puanı oluşturan sinyaller
          </span>
          <ChevronDown size={12} className={`text-zinc-600 transition-transform ${showSignals ? 'rotate-180' : ''}`} />
        </button>

        {showSignals && (
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {capacity.signals.map(row => (
              <div key={row.key} className={`rounded-xl border p-2 ${SIGNAL_STYLE[row.tone]}`}>
                <div className="flex justify-between gap-1 items-baseline">
                  <span className="text-[9px] font-bold truncate">{row.label}</span>
                  <strong className="text-[10px] font-mono shrink-0">{row.score === null ? '—' : row.score}</strong>
                </div>
                <p className="text-[8px] font-mono text-zinc-500 leading-relaxed mt-1">{row.detail}</p>
                <span className="text-[7px] font-mono text-zinc-700 block mt-1 uppercase">{row.source}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {missions.length > 0 && (
        <div className="px-4 py-3 border-b border-zinc-800/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target size={11} className="text-amber-400" /> Üç Öncelik
            </span>
            <span className="text-[8px] font-mono text-zinc-600">etki sırasıyla</span>
          </div>
          <div className="space-y-1.5">
            {missions.map((item, index) => (
              <button
                key={item.key}
                type="button"
                onClick={() => item.action && onAction?.(item.action)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-left flex items-center gap-2 active:border-cyan-800"
              >
                <span className="w-5 h-5 rounded-lg bg-zinc-900 text-[9px] font-mono text-cyan-400 flex items-center justify-center shrink-0">{index + 1}</span>
                <span className="text-[9px] font-bold text-zinc-300 leading-snug flex-1">{item.title}</span>
                {item.action && <ChevronRight size={11} className="text-zinc-600 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {!compact && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
            {Object.values(COACH_HORIZONS).map(item => {
              const count = briefing.horizons[item.key]?.length || 0;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setHorizon(item.key)}
                  className={`rounded-xl py-2 text-[9px] font-bold transition-colors ${horizon === item.key ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
                >
                  {item.label} <span className="font-mono opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {briefing.categories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={`shrink-0 rounded-lg border px-2 py-1.5 text-[8px] font-bold ${category === 'all' ? 'border-cyan-700 bg-cyan-950/30 text-cyan-300' : 'border-zinc-800 text-zinc-500'}`}
              >
                TÜMÜ
              </button>
              {briefing.categories.map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`shrink-0 rounded-lg border px-2 py-1.5 text-[8px] font-bold ${category === key ? 'border-cyan-700 bg-cyan-950/30 text-cyan-300' : 'border-zinc-800 text-zinc-500'}`}
                >
                  {(COACH_CATEGORIES[key] || key).toUpperCase()}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            {actions.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-center text-[9px] font-mono text-zinc-600">
                Bu zaman ve konu süzgecinde madde yok.
              </div>
            ) : actions.map(item => {
              const open = expanded === item.key;
              return (
                <div key={item.key} className={`rounded-xl border overflow-hidden ${item.tone?.chip || 'border-zinc-800 bg-zinc-950'}`}>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span className="text-[7px] font-mono rounded-md border border-zinc-700/70 px-1.5 py-0.5 text-zinc-500">{item.categoryLabel}</span>
                          <span className={`text-[7px] font-mono rounded-md border px-1.5 py-0.5 ${EVIDENCE_STYLE[item.evidence.key]}`}>{item.evidence.label}</span>
                        </div>
                        <strong className={`text-[10px] leading-snug block ${item.tone?.text || 'text-zinc-200'}`}>{item.title}</strong>
                        <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1">{item.detail}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : item.key)}
                        className="text-[8px] font-mono text-cyan-500 flex items-center gap-1"
                      >
                        <ShieldCheck size={9} /> {open ? 'Açıklamayı kapat' : 'Neden bu öneri?'}
                      </button>
                      {item.action && onAction && (
                        <button type="button" onClick={() => onAction(item.action)} className="text-[8px] font-bold text-zinc-400 flex items-center gap-1">
                          İlgili ekran <ChevronRight size={9} />
                        </button>
                      )}
                      {onApply && (
                        <button type="button" onClick={() => onApply(item)} className="text-[8px] font-mono text-emerald-500 flex items-center gap-1">
                          <Sparkles size={9} /> Uyguladım
                        </button>
                      )}
                    </div>
                  </div>
                  {open && (
                    <div className="border-t border-zinc-800/70 bg-zinc-950/70 px-3 py-2.5 space-y-1">
                      <p className="text-[8px] font-mono text-zinc-400"><strong className="text-zinc-300">Dayanak:</strong> {item.evidence.why}</p>
                      <p className="text-[8px] font-mono text-zinc-600"><strong className="text-zinc-500">Sınır:</strong> {item.evidence.caveat}</p>
                      <p className="text-[8px] font-mono text-zinc-600">Güven sınıfı: {item.evidence.confidence}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
});

CoachBriefingCard.displayName = 'CoachBriefingCard';
export default CoachBriefingCard;
