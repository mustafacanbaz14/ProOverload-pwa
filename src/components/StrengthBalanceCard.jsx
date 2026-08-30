import React, { useMemo, memo } from 'react';
import { Scale, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { buildStrengthBalance } from '../utils/strengthBalance';
import { formatDay } from '../utils/dates';

/**
 * Kuvvet dengesi kartı.
 *
 * Hacim tablosunun yanıtlamadığı soruyu yanıtlıyor: kuvvet kaslar arasında
 * nasıl dağılmış. Bench 120 / row 70 olan biri hacim tablosunda iki tarafı da
 * yeşil görür ama omuz çevresindeki denge bozulmuştur.
 */

const STATUS = {
  ok: { color: 'text-emerald-400', bg: 'bg-emerald-500', label: 'Bantta' },
  low: { color: 'text-cyan-400', bg: 'bg-cyan-500', label: 'Bandın altında' },
  high: { color: 'text-amber-400', bg: 'bg-amber-500', label: 'Bandın üstünde' },
};

const StrengthBalanceCard = memo(({ workouts = [], resolveLoad = null }) => {
  const rapor = useMemo(
    () => buildStrengthBalance(workouts, { resolveLoad }),
    [workouts, resolveLoad]);

  if (!rapor.hasData && rapor.missing.length === 0) return null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Scale size={12} className="mr-1.5 text-cyan-400" /> Kuvvet Dengesi
        </h4>
        <span className="text-[9px] font-mono text-zinc-400 shrink-0">son {rapor.windowDays} gün</span>
      </div>

      {rapor.hasData && rapor.issues.length === 0 && (
        <div className="p-3.5 flex items-start gap-2.5 border-b border-zinc-800/70">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono text-emerald-200 leading-relaxed">
            Ölçülebilen bütün oranlar sağlıklı bandın içinde. Kuvvet, kaslar
            arasında dengeli dağılmış.
          </p>
        </div>
      )}

      <div className="divide-y divide-zinc-800/70">
        {rapor.ratios.map(r => {
          const s = STATUS[r.status];
          // Oranın bant içindeki konumu (%): çubuk üstünde işaretlemek için.
          const alt = r.min * 0.7;
          const ust = r.max * 1.3;
          const konum = Math.min(100, Math.max(0, ((r.ratio - alt) / (ust - alt)) * 100));
          const bantSol = ((r.min - alt) / (ust - alt)) * 100;
          const bantGen = ((r.max - r.min) / (ust - alt)) * 100;
          return (
            <div key={r.key} className="px-4 py-3">
              <div className="flex justify-between items-baseline gap-2">
                <strong className="text-[11px] text-zinc-200 truncate min-w-0">{r.label}</strong>
                <span className="text-[10px] font-mono shrink-0">
                  <strong className={s.color}>{r.ratio}</strong>
                  <span className="text-zinc-400"> · bant {r.min}–{r.max}</span>
                </span>
              </div>

              {/* Bant çubuğu: sağlıklı aralık koyu, oran nokta olarak üstünde. */}
              <div className="relative h-1.5 bg-zinc-950 rounded-full mt-2 border border-zinc-800">
                <div
                  className="absolute h-full bg-emerald-900/50 rounded-full"
                  style={{ left: `${bantSol}%`, width: `${bantGen}%` }}
                />
                <div
                  className={`absolute w-2 h-2 rounded-full -top-[3px] ${s.bg}`}
                  style={{ left: `calc(${konum}% - 4px)` }}
                />
              </div>

              <p className="text-[9px] font-mono text-zinc-500 mt-1.5">
                {r.of.label} <strong className="text-zinc-300">{r.of.value} kg</strong>
                <span className="text-zinc-500"> ({r.of.weight}×{r.of.reps}, {formatDay(r.of.date, 'short')}) </span>
                / {r.to.label} <strong className="text-zinc-300">{r.to.value} kg</strong>
                <span className="text-zinc-500"> ({r.to.weight}×{r.to.reps}, {formatDay(r.to.date, 'short')})</span>
              </p>

              {r.advice && (
                <p className={`text-[9px] font-mono leading-relaxed mt-1.5 ${s.color}`}>{r.advice}</p>
              )}
            </div>
          );
        })}
      </div>

      {rapor.missing.length > 0 && (
        <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/60 flex items-start gap-2">
          <Info size={11} className="text-zinc-400 shrink-0 mt-0.5" />
          <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
            Ölçülemeyen oranlar: {rapor.missing.map(m => `${m.label} (${m.need.join(', ')} eksik)`).join(' · ')}.
            Her iki taraf da en az üç çalışma setiyle kaydedilmeden oran kurulmuyor —
            tek taraflı bir sayıdan &quot;denge yok&quot; sonucu çıkarmak yanlış olurdu.
          </p>
        </div>
      )}

      {rapor.issues.length > 0 && (
        <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/60 flex items-start gap-2">
          <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
            Bantlar kişiye göre kayar: kol ve bacak uzunluğu oranı doğal olarak
            değiştirir. Bandın hemen dışındaki bir sayı acil bir sorun değil,
            hacmi hangi tarafa ekleyeceğine dair bir işaret.
          </p>
        </div>
      )}
    </div>
  );
});

StrengthBalanceCard.displayName = 'StrengthBalanceCard';

export default StrengthBalanceCard;
