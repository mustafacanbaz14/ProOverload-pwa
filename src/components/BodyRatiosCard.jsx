import React, { useMemo, useState, memo } from 'react';
import { Ruler, TrendingUp, TrendingDown, Minus, Info, ChevronDown } from 'lucide-react';
import { buildBodyRatios } from '../utils/bodyRatios';
import { BODY_METRICS } from '../utils/constants';

/**
 * Vücut oranları kartı.
 *
 * Tek tek çevre ölçüleri "kol 39 oldu" diyor; oranlar görünümün nasıl
 * değiştiğini söylüyor. Omuzu büyütmekle beli inceltmek aynı orana çıkıyor ve
 * ikisi de aynı görsel sonucu veriyor.
 */

const STATUS = {
  below: { color: 'text-cyan-400', label: 'bandın altında' },
  inRange: { color: 'text-emerald-400', label: 'bantta' },
  above: { color: 'text-amber-400', label: 'bandın üstünde' },
};

const KIND_LABEL = {
  aesthetic: 'Estetik',
  frame: 'Çerçeve',
  symmetry: 'Simetri',
};

const olcuAdi = (key) => BODY_METRICS.find(m => m.key === key)?.label || key;

const BodyRatiosCard = memo(({ metrics, previous = null, gender = 'male', defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const rapor = useMemo(
    () => buildBodyRatios(metrics, { gender, previous }),
    [metrics, gender, previous]);

  if (!rapor.hasData && rapor.missing.length === 0) return null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className={`w-full px-4 py-3 bg-zinc-950/60 flex items-center justify-between gap-2 text-left active:bg-zinc-900 ${open ? 'border-b border-zinc-800' : ''}`}>
        <span className="min-w-0">
          <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
            <Ruler size={12} className="mr-1.5 text-cyan-400" /> Vücut Oranları
          </h4>
          <span className="text-[9px] font-mono text-zinc-500 block mt-0.5">{rapor.hasData ? `${rapor.rows.length} oran hesaplandı` : 'Çevre ölçüsü girilince hesaplanır'}</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {rapor.dateLabel && <span className="text-[9px] font-mono text-zinc-400">{rapor.dateLabel}</span>}
          <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (rapor.hasData ? (
        <div className="divide-y divide-zinc-800/70">
          {rapor.rows.map(r => {
            const s = STATUS[r.status];
            // Bandın ekrandaki konumu; uçlarda taşmasın diye pencere genişletiliyor.
            const alt = r.band.low * 0.8;
            const ust = r.band.high * 1.2;
            const konum = Math.min(100, Math.max(0, ((r.ratio - alt) / (ust - alt)) * 100));
            const bantSol = ((r.band.low - alt) / (ust - alt)) * 100;
            const bantGen = ((r.band.high - r.band.low) / (ust - alt)) * 100;
            const Ok = r.direction === 'up' ? TrendingUp : r.direction === 'down' ? TrendingDown : Minus;

            return (
              <div key={r.key} className="px-4 py-3">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0">
                    {r.label}
                    <span className="text-[8px] font-mono text-zinc-400 ml-1.5">{KIND_LABEL[r.kind]}</span>
                  </span>
                  <span className="text-[10px] font-mono shrink-0 flex items-center gap-1">
                    {r.direction && <Ok size={10} className={r.direction === 'up' ? 'text-emerald-400' : r.direction === 'down' ? 'text-amber-400' : 'text-zinc-400'} />}
                    <strong className={s.color}>{r.ratio}</strong>
                    <span className="text-zinc-400">· {r.band.low}–{r.band.high}</span>
                  </span>
                </div>

                <div className="relative h-1.5 bg-zinc-950 rounded-full mt-2 border border-zinc-800">
                  <div className="absolute h-full bg-emerald-900/50 rounded-full" style={{ left: `${bantSol}%`, width: `${bantGen}%` }} />
                  <div className={`absolute w-2 h-2 rounded-full -top-[3px] ${s.color.replace('text-', 'bg-')}`} style={{ left: `calc(${konum}% - 4px)` }} />
                </div>

                <p className="text-[9px] font-mono text-zinc-500 mt-1.5">
                  {r.values.of} / {r.values.to} cm · <span className={s.color}>{s.label}</span>
                  {r.delta !== null && r.delta !== 0 && (
                    <span className="text-zinc-400"> · önceki ölçüme göre {r.delta > 0 ? '+' : ''}{r.delta}</span>
                  )}
                </p>
                <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1">{r.note}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3.5">
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
            Oran hesaplamak için çevre ölçüleri gerekiyor.
          </p>
        </div>
      ))}

      {open && rapor.missing.length > 0 && (
        <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/60 flex items-start gap-2">
          <Info size={11} className="text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
            Eksik ölçüler: {rapor.missing.map(olcuAdi).join(', ')}. Eksik ölçünün
            oranı hiç hesaplanmıyor — eksik veriden oran üretmek, uydurma bir
            sayıyı gerçek gibi göstermek olurdu.
          </p>
        </div>
      )}
    </div>
  );
});

BodyRatiosCard.displayName = 'BodyRatiosCard';

export default BodyRatiosCard;
