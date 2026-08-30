import React, { memo } from 'react';
import { Droplets, Plus, RotateCcw } from 'lucide-react';
import { QUICK_AMOUNTS } from '../utils/hydration';

/**
 * Su takibi kartı.
 *
 * Hedef vücut ağırlığından türetiliyor, sabit "2 litre" değil: 55 kiloluk
 * biriyle 100 kiloluk birinin ihtiyacı aynı olamaz. Antrenman günü ve sıcak
 * hava için ek pay veriliyor ve sayının nereden geldiği kartta yazıyor.
 */
const HydrationCard = memo(({ summary, target, onAdd, onToggleHeat, heat = false }) => {
  if (!summary) return null;
  const litre = (ml) => (ml / 1000).toFixed(1);

  return (
    <div className="luxury-feature-card bg-gradient-to-br from-zinc-900/90 via-zinc-900/95 to-zinc-950 rounded-3xl border border-zinc-800/80 shadow-xl overflow-hidden">
      <div className="px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/50 backdrop-blur-md flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-black text-zinc-200 uppercase tracking-widest flex items-center">
          <Droplets size={13} className="mr-1.5 text-sky-400" /> Günlük Su Takibi
        </h4>
        <span className="text-[10px] font-mono font-bold text-sky-400">
          {litre(summary.today)} / {litre(target.ml)} L
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="h-2.5 bg-zinc-950 rounded-full border border-zinc-800/80 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${summary.percent}%` }}
          />
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {QUICK_AMOUNTS.map(ml => (
            <button
              key={ml}
              onClick={() => onAdd?.(ml)}
              className="rounded-xl border border-sky-900/50 bg-gradient-to-b from-sky-950/40 to-zinc-950 py-2.5 text-[10px] font-black tracking-wide text-sky-300 active:scale-[0.97] transition-all shadow-sm"
            >
              <Plus size={9} className="inline mr-0.5" />{ml}ml
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-mono text-zinc-500">
            {summary.remaining > 0
              ? `${litre(summary.remaining)} L kaldı`
              : 'Günlük hedef tamamlandı'}
            {summary.trackedDays > 0 && ` · ${summary.trackedDays} günde ${summary.metDays} kez ulaşıldı`}
          </span>
          {summary.today > 0 && (
            <button
              onClick={() => onAdd?.(-summary.today)}
              aria-label="Bugünkü kaydı sıfırla"
              className="text-zinc-600 active:text-red-400 p-1 shrink-0"
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>

        {onToggleHeat && (
          <button
            onClick={() => onToggleHeat(!heat)}
            aria-pressed={heat}
            className={`w-full rounded-xl border py-2 text-[9px] font-bold ${heat
              ? 'border-amber-800/60 bg-amber-950/25 text-amber-300'
              : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
          >
            {heat ? 'Sıcak hava payı açık (+500 ml)' : 'Sıcak hava payı ekle'}
          </button>
        )}

        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
          Hedef kilo başına {target.perKg} ml{target.trainingBonus > 0 && ` + antrenman günü ${target.trainingBonus} ml`}
          {target.heatBonus > 0 && ` + sıcak hava ${target.heatBonus} ml`}.
          {target.estimatedWeight && ' Kilon kayıtlı olmadığı için ortalama bir yetişkin varsayıldı.'}
          {' '}Vücut ağırlığının yaklaşık %2'si kadar sıvı kaybı kuvvet çıktısını ölçülebilir biçimde düşürüyor.
        </p>
      </div>
    </div>
  );
});

HydrationCard.displayName = 'HydrationCard';

export default HydrationCard;
