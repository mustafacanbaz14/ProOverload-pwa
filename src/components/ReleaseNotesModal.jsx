import React, { memo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, History, Sparkles, X } from 'lucide-react';
import { LATEST_RELEASE_NOTES, RELEASE_HISTORY } from '../utils/releaseHistory';

const ReleaseNotesModal = memo(({ isOpen, onClose }) => {
  const [tab, setTab] = useState('latest');
  const [expandedVersion, setExpandedVersion] = useState(RELEASE_HISTORY[1]?.version || '');

  if (!isOpen) return null;

  const past = RELEASE_HISTORY.slice(1);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl max-w-sm w-full max-h-[88dvh] flex flex-col shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-start justify-between p-5 pb-3.5 shrink-0 border-b border-zinc-800/80 bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold uppercase text-cyan-400 tracking-widest block">
                Güncelleme Merkezi
              </span>
              <h3 className="text-base font-black text-zinc-100 mt-0.5 tracking-tight">
                ProOverload v{LATEST_RELEASE_NOTES.version}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="luxury-icon-button"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="luxury-segmented grid grid-cols-2 gap-1.5 mx-5 my-3 p-1.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setTab('latest')}
            className={`rounded-xl py-2.5 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${tab === 'latest' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Sparkles size={11} /> Son Güncelleme
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`rounded-xl py-2.5 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${tab === 'history' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <History size={11} /> Geçmiş Sürümler
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-5 pb-4">
          {tab === 'latest' ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-2xl border border-cyan-900/45 bg-cyan-950/20 px-3 py-2.5">
                <div>
                  <strong className="text-[11px] text-cyan-300">{LATEST_RELEASE_NOTES.title}</strong>
                  <span className="mt-0.5 block text-[9px] font-mono text-zinc-400">Yalnız bu sürümde eklenenler</span>
                </div>
                <span className="flex items-center gap-1 text-[9px] font-mono text-zinc-500">
                  <CalendarDays size={11} /> {LATEST_RELEASE_NOTES.date}
                </span>
              </div>
              {LATEST_RELEASE_NOTES.items.map((releaseItem) => (
                <div key={releaseItem.title} className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-3 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-bold text-zinc-200 leading-snug">{releaseItem.title}</h4>
                    <p className="text-[10px] font-mono text-zinc-500 leading-relaxed mt-0.5">{releaseItem.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[9px] font-mono text-zinc-400 leading-relaxed px-1 pb-1">
                Her sürüm kendi notunu gösterir. Eski özellikler son güncelleme etiketiyle yeniden sunulmaz.
              </p>
              {past.map(releaseEntry => {
                const expanded = expandedVersion === releaseEntry.version;
                return (
                  <div key={releaseEntry.version} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                    <button
                      type="button"
                      onClick={() => setExpandedVersion(expanded ? '' : releaseEntry.version)}
                      aria-expanded={expanded}
                      className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-[11px] font-mono text-cyan-400">v{releaseEntry.version}</strong>
                          <span className="truncate text-[10px] font-bold text-zinc-300">{releaseEntry.title}</span>
                        </div>
                        <span className="mt-0.5 block text-[8px] font-mono text-zinc-400">{releaseEntry.date} · {releaseEntry.items.length} başlık</span>
                      </div>
                      <ChevronDown size={14} className={`shrink-0 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                    {expanded && (
                      <div className="space-y-2 border-t border-zinc-800 p-3">
                        {releaseEntry.items.map(releaseItem => (
                          <div key={releaseItem.title} className="rounded-xl border border-zinc-800 bg-zinc-900/65 p-2.5">
                            <strong className="text-[10px] text-zinc-300">{releaseItem.title}</strong>
                            <p className="mt-1 text-[9px] font-mono leading-relaxed text-zinc-400">{releaseItem.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe">
          <button type="button" onClick={onClose} className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-cyan-950/40 transition-colors">
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
});

ReleaseNotesModal.displayName = 'ReleaseNotesModal';
export default ReleaseNotesModal;
