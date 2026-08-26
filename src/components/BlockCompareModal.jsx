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
        <span className="text-zinc-600">{r.before}{r.unit}</span>
        <ArrowRight size={9} className="text-zinc-700" />
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
    <div className="fixed inset-0 bg-zinc-950 z-[93] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <GitCompareArrows size={15} className="mr-2 text-cyan-400" /> Blok Karşılaştırma
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">
        <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          {WEEKS.map(w => (
            <button
              key={w}
              type="button"
              onClick={() => setWeeks(w)}
              className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-colors ${
                weeks === w ? 'bg-cyan-600 text-white' : 'text-zinc-500'
              }`}
            >
              {w} hafta
            </button>
          ))}
        </div>

        {!report?.hasData ? (
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
            {report?.reason || 'Karşılaştırma için yeterli veri yok.'}
          </p>
        ) : (
          <>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5">
              <div className="flex justify-between text-[9px] font-mono text-zinc-600">
                <span>{report.ranges.previous}</span>
                <span className="text-cyan-500">{report.ranges.current}</span>
              </div>
              <p className="text-[11px] font-mono text-zinc-300 leading-relaxed mt-2">{report.verdict}</p>
            </div>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/60">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Girdiler — senin seçtiklerin
                </span>
              </div>
              <div className="divide-y divide-zinc-800/70">
                {report.inputs.map(r => <Row key={r.key} r={r} />)}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Çıktı — ne üretti
                </span>
                <span className="text-[9px] font-mono text-zinc-600">{report.shared} ortak hareket</span>
              </div>
              {report.outcome.meanChange === null ? (
                <p className="px-4 py-3 text-[10px] font-mono text-zinc-500 leading-relaxed">
                  İki blokta da yapılmış ortak hareket yok.
                </p>
              ) : (
                <>
                  <div className="px-4 py-3 text-center border-b border-zinc-800">
                    <strong className={`text-2xl font-mono ${report.outcome.meanChange > 0 ? 'text-emerald-400' : report.outcome.meanChange < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                      {report.outcome.meanChange > 0 ? '+' : ''}%{report.outcome.meanChange}
                    </strong>
                    <span className="text-[9px] font-mono text-zinc-600 block">
                      ortak hareketlerde ortalama tahmini 1RM değişimi
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-800/70">
                    {[...report.outcome.gainers, ...report.outcome.losers].map(h => (
                      <div key={h.name} className="px-4 py-1.5 flex justify-between items-baseline gap-2">
                        <span className="text-[10px] text-zinc-300 truncate min-w-0">{h.name}</span>
                        <span className={`text-[10px] font-mono shrink-0 ${h.deltaPct > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.before} → {h.after} kg ({h.deltaPct > 0 ? '+' : ''}%{h.deltaPct})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            {report.muscles.length > 0 && (
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/60">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Kas Bazında Haftalık Hacim
                  </span>
                </div>
                <div className="divide-y divide-zinc-800/70">
                  {report.muscles.slice(0, 8).map(m => (
                    <div key={m.muscle} className="px-4 py-1.5 flex justify-between items-baseline gap-2">
                      <span className="text-[10px] text-zinc-300">{m.muscle}</span>
                      <span className="text-[10px] font-mono shrink-0">
                        <span className="text-zinc-600">{m.before} → </span>
                        <span className="text-zinc-200">{m.after} set </span>
                        <span className={m.delta > 0 ? 'text-cyan-400' : 'text-amber-400'}>
                          ({m.delta > 0 ? '+' : ''}{m.delta})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(report.added.length > 0 || report.dropped.length > 0) && (
              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
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
  );
});

BlockCompareModal.displayName = 'BlockCompareModal';

export default BlockCompareModal;
