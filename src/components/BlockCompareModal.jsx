import React, { memo, useState } from 'react';
import { X, GitCompareArrows, ArrowRight } from 'lucide-react';

/**
 * Blok karşılaştırma.
 *
 * Girdiler ve çıktı ayrı bölümlerde. Aynı listede göstermek "hacmim %20 arttı"
 * ile "gücüm %3 arttı"yı eşit iki başarı gibi okutuyordu; oysa birincisi
 * yalnızca ikincisinin bedeli.
 */

const WEEKS = [3, 4, 6];

const Row = ({ r }) => {
  const artis = (r.deltaPct ?? 0) > 0;
  const iyi = r.higherIsBetter ? artis : !artis;
  const renk = !r.changed ? 'text-zinc-500' : iyi ? 'text-emerald-400' : 'text-amber-400';
  return (
    <div className="px-4 py-2 flex items-baseline justify-between gap-2">
      <span className="text-[10px] text-zinc-300 truncate min-w-0">{r.label}</span>
      <span className="text-[10px] font-mono shrink-0 flex items-center gap-1">
        <span className="text-zinc-400">{r.before}{r.unit}</span>
        <ArrowRight size={9} className="text-zinc-500" />
        <span className="text-zinc-200">{r.after}{r.unit}</span>
        {r.deltaPct !== null && (
          <span className={renk}>({r.deltaPct > 0 ? '+' : ''}%{r.deltaPct})</span>
        )}
      </span>
    </div>
  );
};

const BlockCompareModal = memo(({ isOpen, onClose, buildReport }) => {
  const [weeks, setWeeks] = useState(4);
  if (!isOpen) return null;

  const report = buildReport(weeks);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="block-compare-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[93] flex items-center justify-center p-4 luxury-sheet-host">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] luxury-sheet shadow-2xl shadow-black/80">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md shrink-0">
          <h3 id="block-compare-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest flex items-center">
            <GitCompareArrows size={16} className="mr-2 text-cyan-400" /> Blok Karşılaştırma
          </h3>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">
        <div className="luxury-segmented grid grid-cols-3 gap-1 p-1 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
          {WEEKS.map(w => (
            <button
              key={w}
              type="button"
              onClick={() => setWeeks(w)}
              className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-[0.98] ${
                weeks === w ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {w} Hafta
            </button>
          ))}
        </div>

        {!report?.hasData ? (
          <p className="text-[10px] font-mono text-zinc-400 leading-relaxed bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 backdrop-blur-sm">
            {report?.reason || 'Karşılaştırma için yeterli veri yok.'}
          </p>
        ) : (
          <>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-sm shadow-sm">
              <div className="flex justify-between text-[9px] font-mono text-zinc-500 font-bold">
                <span>{report.ranges.previous}</span>
                <span className="text-cyan-400">{report.ranges.current}</span>
              </div>
              <p className="text-[11px] font-mono text-zinc-200 leading-relaxed mt-2.5">{report.verdict}</p>
            </div>

            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur-sm">
              <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Girdiler — senin seçtiklerin
                </span>
              </div>
              <div className="divide-y divide-zinc-800/70">
                {report.inputs.map(r => <Row key={r.key} r={r} />)}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur-sm">
              <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60 flex justify-between items-baseline">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Çıktı — ne üretti
                </span>
                <span className="text-[9px] font-mono text-zinc-500">{report.shared} ortak hareket</span>
              </div>
              {report.outcome.meanChange === null ? (
                <p className="px-4 py-3.5 text-[10px] font-mono text-zinc-500 leading-relaxed">
                  İki blokta da yapılmış ortak hareket yok.
                </p>
              ) : (
                <>
                  <div className="px-4 py-3.5 text-center border-b border-zinc-800/80 bg-zinc-950/40">
                    <strong className={`text-3xl font-mono font-black ${report.outcome.meanChange > 0 ? 'text-emerald-400' : report.outcome.meanChange < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                      {report.outcome.meanChange > 0 ? '+' : ''}%{report.outcome.meanChange}
                    </strong>
                    <span className="text-[9px] font-mono text-zinc-500 block mt-1">
                      ortak hareketlerde ortalama tahmini 1RM değişimi
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-800/70">
                    {[...report.outcome.gainers, ...report.outcome.losers].map(h => (
                      <div key={h.name} className="px-4 py-2 flex justify-between items-baseline gap-2">
                        <span className="text-[10px] font-bold text-zinc-200 truncate min-w-0">{h.name}</span>
                        <span className={`text-[10px] font-mono font-bold shrink-0 ${h.deltaPct > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.before} → {h.after} kg ({h.deltaPct > 0 ? '+' : ''}%{h.deltaPct})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            {report.muscles.length > 0 && (
              <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur-sm">
                <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Kas Bazında Haftalık Hacim
                  </span>
                </div>
                <div className="divide-y divide-zinc-800/70">
                  {report.muscles.slice(0, 8).map(m => (
                    <div key={m.muscle} className="px-4 py-2 flex justify-between items-baseline gap-2">
                      <span className="text-[10px] font-bold text-zinc-200">{m.muscle}</span>
                      <span className="text-[10px] font-mono shrink-0">
                        <span className="text-zinc-500">{m.before} → </span>
                        <span className="text-zinc-200 font-bold">{m.after} set </span>
                        <span className={m.delta > 0 ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
                          ({m.delta > 0 ? '+' : ''}{m.delta})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(report.added.length > 0 || report.dropped.length > 0) && (
              <p className="text-[9px] font-mono text-zinc-400 leading-relaxed px-1">
                {report.added.length > 0 && `Yeni: ${report.added.join(', ')}. `}
                {report.dropped.length > 0 && `Bırakılan: ${report.dropped.join(', ')}. `}
                Bunlar çıktı hesabına girmiyor — yeni bir harekete başlamak
                ortalama 1RM'i düşürür (teknik henüz oturmamış), bırakmak
                yükseltir; ikisini de saymak hareket değiştirmeyi gelişim ya da
                gerileme diye okumak olurdu.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  </div>
  );
});

BlockCompareModal.displayName = 'BlockCompareModal';

export default BlockCompareModal;
