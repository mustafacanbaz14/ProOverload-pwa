import React, { memo } from 'react';
import { Target, AlertTriangle, ChevronRight } from 'lucide-react';

/**
 * Zayıf halka kartı.
 *
 * Uygulama gelişimi beş ayrı pencereden anlatıyor ve hepsi doğru; ama hiçbiri
 * "ÖNCE NEYİ DÜZELTEYİM" sorusunu cevaplamıyordu. Bu kart o beş sinyali tek
 * sıralı listeye indiriyor — sıralama etki × kesinlik.
 */

const IMPACT_STYLE = {
  high: { chip: 'border-red-900/60 bg-red-950/20 text-red-300', label: 'yüksek etki' },
  medium: { chip: 'border-amber-900/60 bg-amber-950/20 text-amber-300', label: 'orta etki' },
  low: { chip: 'border-zinc-700 bg-zinc-900 text-zinc-400', label: 'düşük etki' },
};

const CONFIDENCE_LABEL = { high: 'sağlam veri', medium: 'orta veri', low: 'az veri' };

const WeakLinkCard = memo(({ report, onAction }) => {
  if (!report?.hasData) return null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Target size={12} className="mr-1.5 text-red-400" /> Zayıf Halka
        </h4>
        <span className="text-[9px] font-mono text-zinc-400">
          {report.total} bulgu · önem sırasıyla
        </span>
      </div>

      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/30 flex flex-wrap gap-1.5">
        {report.byArea.map(a => (
          <span key={a.area} className="text-[9px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5">
            {a.area} {a.count}
          </span>
        ))}
      </div>

      <div className="divide-y divide-zinc-800/70">
        {report.items.map((x, i) => {
          const stil = IMPACT_STYLE[x.impact] || IMPACT_STYLE.medium;
          return (
            <div key={x.key} className="px-4 py-2.5 space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-[11px] font-mono text-zinc-400 shrink-0 mt-0.5">{i + 1}.</span>
                <span className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-zinc-200 block leading-snug">{x.title}</span>
                  <span className="flex flex-wrap items-center gap-1 mt-1">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${stil.chip}`}>
                      {stil.label}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-400">
                      {CONFIDENCE_LABEL[x.confidence] || ''} · {x.area}
                    </span>
                  </span>
                </span>
                {x.action && onAction && (
                  <button
                    onClick={() => onAction(x.action)}
                    aria-label={`${x.title} için ilgili ekranı aç`}
                    className="shrink-0 text-zinc-400 active:text-cyan-400 p-1"
                  >
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed pl-5">{x.detail}</p>
            </div>
          );
        })}
      </div>

      <p className="px-4 py-2 text-[9px] font-mono text-zinc-400 leading-relaxed bg-zinc-950/40">
        <AlertTriangle size={9} className="inline mr-1" />
        Sıralama etki × kesinlik: hacim eşiği gibi büyümeyi doğrudan durduran
        şeyler önce geliyor, az veriye dayanan tahminler ise yüksek etkili
        olsalar bile aşağı iniyor. Aynı hesaplar başka ekranlarda da var;
        burada yalnızca birleştirilip sıralanıyorlar.
      </p>
    </div>
  );
});

WeakLinkCard.displayName = 'WeakLinkCard';

export default WeakLinkCard;
