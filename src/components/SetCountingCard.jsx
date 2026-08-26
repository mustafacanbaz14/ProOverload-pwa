import React, { memo, useState } from 'react';
import { Sigma, Info } from 'lucide-react';
import { COUNTING_METHODS, describeGap, compareToReference } from '../utils/setCounting';

/**
 * Set sayımı kartı.
 *
 * Kullanıcının en çok kafasını karıştıran şey buydu: takip ettiği kişiler
 * "haftada 30 set göğüs" derken uygulama "14 set" diyordu. İkisi de doğru —
 * farklı birimlerde konuşuyorlar. Kart üç sayıyı yan yana koyup farkın nereden
 * geldiğini gösteriyor.
 *
 * Fizik sporcusu sütunu bir HEDEF değil referans, ve bu her satırda yazıyor:
 * o hacimlerin gerekli olduğunu gösteren doğrudan bir deneme yok.
 */

const SetCountingCard = memo(({ report, onOpenEvidence }) => {
  const [acik, setAcik] = useState(null);
  if (!report?.hasData || report.rows.length === 0) return null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Sigma size={12} className="mr-1.5 text-violet-400" /> Set Sayımı
        </h4>
        <span className="text-[9px] font-mono text-zinc-600">son {report.weeks} hafta ortalaması</span>
      </div>

      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/30 grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[8px] font-mono text-zinc-600 uppercase tracking-wider">
        <span>Kas</span>
        <span className="text-right w-10">Doğr.</span>
        <span className="text-right w-10">Kesirli</span>
        <span className="text-right w-10">Toplam</span>
      </div>

      <div className="divide-y divide-zinc-800/70">
        {report.rows.map(r => {
          const secili = acik === r.muscle;
          const ref = compareToReference(r);
          return (
            <div key={r.muscle}>
              <button
                type="button"
                onClick={() => setAcik(secili ? null : r.muscle)}
                className="w-full px-4 py-2 grid grid-cols-[1fr_auto_auto_auto] gap-2 items-baseline text-left active:bg-zinc-950/40"
              >
                <span className="text-[10px] text-zinc-300 truncate">{r.muscle}</span>
                <span className="text-[10px] font-mono text-zinc-600 text-right w-10">{r.direct}</span>
                <span className="text-[10px] font-mono text-violet-300 text-right w-10">{r.fractional}</span>
                <span className="text-[10px] font-mono text-zinc-400 text-right w-10">{r.total}</span>
              </button>
              {secili && (
                <div className="px-4 pb-2.5 space-y-1.5">
                  <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">{describeGap(r)}</p>
                  {ref && <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">{ref.note}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2.5 bg-zinc-950/40 border-t border-zinc-800 space-y-1.5">
        {Object.values(COUNTING_METHODS).map(m => (
          <p key={m.key} className="text-[9px] font-mono text-zinc-600 leading-relaxed">
            <strong className={m.key === 'fractional' ? 'text-violet-400' : 'text-zinc-500'}>
              {m.label}:
            </strong> {m.hint}
          </p>
        ))}
        <button
          type="button"
          onClick={onOpenEvidence}
          className="text-[9px] font-mono text-cyan-500 active:text-cyan-300 flex items-center gap-1 pt-0.5"
        >
          <Info size={9} /> Uygulama neden kesirli sayıyor
        </button>
      </div>
    </div>
  );
});

SetCountingCard.displayName = 'SetCountingCard';

export default SetCountingCard;
