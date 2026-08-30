import React, { useState, memo } from 'react';
import { X, Scale, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { parseNumber, computeComposition } from '../utils/helpers';
import { BODY_METRICS } from '../utils/constants';
import { formatDay } from '../utils/dates';

const MetricsComparisonModal = memo(({ isOpen, onClose, metricsHistory = [] }) => {
  const sortedMetrics = [...metricsHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

  const [dateA, setDateA] = useState(sortedMetrics[1]?.date || sortedMetrics[0]?.date || '');
  const [dateB, setDateB] = useState(sortedMetrics[0]?.date || '');

  if (!isOpen) return null;

  const recordA = sortedMetrics.find(m => m.date === dateA) || sortedMetrics[0];
  const recordB = sortedMetrics.find(m => m.date === dateB) || sortedMetrics[0];

  const compA = recordA ? computeComposition(recordA) : null;
  const compB = recordB ? computeComposition(recordB) : null;

  const calcDiff = (valA, valB) => {
    const a = parseNumber(valA);
    const b = parseNumber(valB);
    if (!a || !b) return null;
    const diff = Math.round((b - a) * 10) / 10;
    const pct = Math.round(((b - a) / a) * 1000) / 10;
    return { diff, pct };
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="metrics-comparison-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">
        {/* Üst Bar */}
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <Scale size={16} className="text-cyan-400" />
            <h3 id="metrics-comparison-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest">Dönemsel Ölçüm Kıyaslama</h3>
          </div>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        {/* Tarih Seçimi */}
        <div className="p-3.5 bg-zinc-950/70 border-b border-zinc-800/80 grid grid-cols-2 gap-2 text-xs font-mono shrink-0">
          <div>
            <label className="text-[9px] text-zinc-500 uppercase block mb-1 font-bold">1. Tarih (Önce)</label>
            <select
              value={dateA}
              onChange={(e) => setDateA(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-zinc-300 text-[11px] outline-none focus:border-cyan-500/80 transition-colors"
            >
              {sortedMetrics.map(m => (
                <option key={`a-${m.id || m.date}`} value={m.date}>{formatDay(m.date, 'numeric')} ({m.weight}kg)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9px] text-cyan-400 uppercase block mb-1 font-bold">2. Tarih (Sonra)</label>
            <select
              value={dateB}
              onChange={(e) => setDateB(e.target.value)}
              className="w-full bg-zinc-900 border border-cyan-800/60 rounded-xl p-2.5 text-cyan-300 font-bold text-[11px] outline-none focus:border-cyan-500 transition-colors"
            >
              {sortedMetrics.map(m => (
                <option key={`b-${m.id || m.date}`} value={m.date}>{formatDay(m.date, 'numeric')} ({m.weight}kg)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Kıyaslama Tablosu */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 hide-scrollbar">
          {(!recordA || !recordB) ? (
            <div className="text-center py-10 text-zinc-500 text-xs font-mono">Kıyaslanacak kayıt bulunamadı</div>
          ) : (
            <>
              {/* Temel Metrikler */}
              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 space-y-3 font-mono text-xs backdrop-blur-sm shadow-sm">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block border-b border-zinc-800/80 pb-2">Vücut Kompozisyonu</span>

                {/* Kilo */}
                {(() => {
                  const res = calcDiff(recordA.weight, recordB.weight);
                  return (
                    <div className="flex justify-between items-center text-zinc-300">
                      <span className="font-sans font-bold text-zinc-400">Kilo:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-500">{recordA.weight}kg</span>
                        <ArrowRight size={11} className="text-zinc-400" />
                        <span className="font-bold text-zinc-100">{recordB.weight}kg</span>
                        {res && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${res.diff > 0 ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : res.diff < 0 ? 'bg-orange-950/80 text-orange-400 border border-orange-800/60' : 'bg-zinc-800 text-zinc-400'}`}>
                            {res.diff > 0 ? `+${res.diff}` : res.diff}kg (%{res.pct})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Yağ Oranı */}
                {compA && compB && (() => {
                  const res = calcDiff(compA.activeBF, compB.activeBF);
                  return (
                    <div className="flex justify-between items-center text-zinc-300">
                      <span className="font-sans font-bold text-zinc-400">Yağ Oranı:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-500">%{compA.activeBF}</span>
                        <ArrowRight size={11} className="text-zinc-400" />
                        <span className="font-bold text-cyan-400">%{compB.activeBF}</span>
                        {res && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${res.diff < 0 ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : res.diff > 0 ? 'bg-red-950/80 text-red-400 border border-red-800/60' : 'bg-zinc-800 text-zinc-400'}`}>
                            {res.diff > 0 ? `+${res.diff}` : res.diff}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Kas Kütlesi (FFM) */}
                {compA && compB && (() => {
                  const res = calcDiff(compA.ffm, compB.ffm);
                  return (
                    <div className="flex justify-between items-center text-zinc-300">
                      <span className="font-sans font-bold text-zinc-400">Kas (FFM):</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-500">{compA.ffm}kg</span>
                        <ArrowRight size={11} className="text-zinc-400" />
                        <span className="font-bold text-emerald-400">{compB.ffm}kg</span>
                        {res && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${res.diff > 0 ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : res.diff < 0 ? 'bg-red-950/80 text-red-400 border border-red-800/60' : 'bg-zinc-800 text-zinc-400'}`}>
                            {res.diff > 0 ? `+${res.diff}` : res.diff}kg
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Bölgesel Ölçüm Kıyaslamaları */}
              <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 space-y-3 font-mono text-xs backdrop-blur-sm shadow-sm">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block border-b border-zinc-800/80 pb-2">Bölgesel Kas Ölçüleri (cm)</span>

                {BODY_METRICS.filter(m => m.key !== 'weight').map(m => {
                  const valA = recordA.measurements?.[m.key];
                  const valB = recordB.measurements?.[m.key];
                  const res = calcDiff(valA, valB);
                  if (!valA && !valB) return null;

                  return (
                    <div key={m.key} className="flex justify-between items-center text-zinc-300">
                      <span className="font-sans font-bold text-zinc-400">{m.label}:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-500">{valA || '-'}cm</span>
                        <ArrowRight size={11} className="text-zinc-400" />
                        <span className="font-bold text-zinc-100">{valB || '-'}cm</span>
                        {res && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${res.diff > 0 ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60' : res.diff < 0 ? 'bg-orange-950/80 text-orange-400 border border-orange-800/60' : 'bg-zinc-800 text-zinc-400'}`}>
                            {res.diff > 0 ? `+${res.diff}` : res.diff}cm
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

MetricsComparisonModal.displayName = 'MetricsComparisonModal';

export default MetricsComparisonModal;
