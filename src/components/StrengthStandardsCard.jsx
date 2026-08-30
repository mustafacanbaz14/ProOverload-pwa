import React, { useMemo, memo } from 'react';
import { Award, Info } from 'lucide-react';
import { buildStrengthStandards, STRENGTH_LEVELS } from '../utils/strengthStandards';
import { formatDay } from '../utils/dates';

/**
 * Kuvvet standartları kartı.
 *
 * Uygulama kuvveti hep kendi geçmişine göre ölçüyordu. Bu kart dışarıya bir
 * referans veriyor: vücut ağırlığının katı olarak nerede duruyorsun.
 */

const StrengthStandardsCard = memo(({ workouts = [], bodyWeightKg = 0, gender = 'male', resolveLoad = null }) => {
  const rapor = useMemo(
    () => buildStrengthStandards(workouts, { bodyWeightKg, gender, resolveLoad }),
    [workouts, bodyWeightKg, gender, resolveLoad]);

  if (rapor.missingWeight) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3.5 flex items-start gap-2.5">
        <Award size={14} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
          Kuvvet standartları için vücut ağırlığı gerekiyor. Standartlar mutlak
          kilo değil vücut ağırlığının katı olarak veriliyor — farklı kilodaki
          insanları karşılaştırılabilir kılan tek yol bu.
        </p>
      </div>
    );
  }

  if (!rapor.hasData) return null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Award size={12} className="mr-1.5 text-amber-400" /> Kuvvet Standartları
        </h4>
        <span className="text-[9px] font-mono text-zinc-400 shrink-0">son {rapor.windowDays} gün</span>
      </div>

      {rapor.overall && (
        <div className="px-4 py-2.5 border-b border-zinc-800/70 flex justify-between items-baseline gap-2">
          <span className="text-[10px] font-bold text-zinc-300">Genel seviye</span>
          <span className="text-[10px] font-mono">
            <strong className={rapor.overall.level.color}>{rapor.overall.level.label}</strong>
            {rapor.overall.spread >= 2 && (
              <span className="text-zinc-400"> · {rapor.overall.spread} seviye fark</span>
            )}
          </span>
        </div>
      )}

      <div className="divide-y divide-zinc-800/70">
        {rapor.rows.map(r => {
          // Bantların ekrandaki konumu: elit eşiği sağ uç kabul ediliyor.
          const ust = r.thresholds[r.thresholds.length - 1];
          const konum = Math.min(100, Math.max(2, (r.best.value / ust) * 100));
          return (
            <div key={r.key} className="px-4 py-3">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0">{r.label}</span>
                <span className="text-[10px] font-mono shrink-0">
                  <strong className={r.level ? r.level.color : 'text-zinc-500'}>
                    {r.level ? r.level.label : 'Eşik altı'}
                  </strong>
                  <span className="text-zinc-400"> · {r.ratio}× VA</span>
                </span>
              </div>

              {/* Seviye çubuğu: eşikler işaret, nokta mevcut konum. */}
              <div className="relative h-1.5 bg-zinc-950 rounded-full mt-2 border border-zinc-800">
                {r.thresholds.slice(0, -1).map((esik, i) => (
                  <span
                    key={STRENGTH_LEVELS[i].key}
                    className="absolute top-0 bottom-0 w-px bg-zinc-700"
                    style={{ left: `${Math.min(100, (esik / ust) * 100)}%` }}
                  />
                ))}
                <span
                  className={`absolute w-2 h-2 rounded-full -top-[3px] ${r.level ? r.level.color.replace('text-', 'bg-') : 'bg-zinc-500'}`}
                  style={{ left: `calc(${konum}% - 4px)` }}
                />
              </div>

              <p className="text-[9px] font-mono text-zinc-500 mt-1.5">
                En iyi <strong className="text-zinc-300">{r.best.value} kg</strong>
                <span className="text-zinc-500"> ({r.best.weight}×{r.best.reps}, {formatDay(r.best.date, 'short')})</span>
                {r.next && r.kgToNext > 0 && (
                  <> · <span className={r.next.color}>{r.next.label}</span> için {r.kgToNext} kg</>
                )}
              </p>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/60 flex items-start gap-2">
        <Info size={11} className="text-zinc-400 shrink-0 mt-0.5" />
        <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
          Standartlar vücut ağırlığının katı olarak veriliyor ve
          {gender === 'female' ? ' kadın' : ' erkek'} tablosu kullanılıyor.
          Kaynaklar arasında %10-15 sapma normal; yaş, kol uzunluğu ve teknik
          seçimi sonucu kaydırıyor. Bu bir not değil, bir konum.
        </p>
      </div>
    </div>
  );
});

StrengthStandardsCard.displayName = 'StrengthStandardsCard';

export default StrengthStandardsCard;
