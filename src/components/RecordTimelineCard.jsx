import React, { useState, memo } from 'react';
import { Trophy, ChevronDown, Sparkles } from 'lucide-react';

/**
 * Rekor zaman çizelgesi.
 *
 * Rekorlar hareket başına tutuluyordu; "son üç ayda kaç rekor kırdım" sorusu
 * için on beş profili tek tek açmak gerekiyordu.
 *
 * Rekor tanımı ileriye doğru: bir set YAPILDIĞI GÜN rekor olduysa listede
 * kalıyor, sonradan geçilmiş olması onu düşürmüyor. Bugünün gözünden bakıp
 * geçmişteki başarıları silmek olmazdı.
 */
const RecordTimelineCard = memo(({ timeline }) => {
  const [genis, setGenis] = useState(false);
  if (!timeline?.hasData) return null;

  const gosterilen = genis ? timeline.items : timeline.items.slice(0, 5);
  const yeniRekor = timeline.recentCount - timeline.firstTimeCount;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Trophy size={12} className="mr-1.5 text-yellow-400" /> Rekor Çizelgesi
        </h4>
        <span className="text-[9px] font-mono text-zinc-600">
          son {timeline.recentDays} günde {timeline.recentCount}
        </span>
      </div>

      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/30 flex flex-wrap gap-1.5">
        {timeline.byMuscle.slice(0, 6).map(m => (
          <span key={m.muscle} className="text-[9px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5">
            {m.muscle} {m.count}
          </span>
        ))}
        {timeline.byMuscle.length === 0 && (
          <span className="text-[9px] font-mono text-zinc-600">Son dönemde yeni rekor yok.</span>
        )}
      </div>

      <div className="divide-y divide-zinc-800/70">
        {gosterilen.map(r => (
          <div key={`${r.date}-${r.exercise}`} className="px-4 py-1.5 flex justify-between items-center gap-2">
            <span className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-zinc-200 block truncate">
                {r.first && <Sparkles size={9} className="inline text-cyan-400 mr-1" />}
                {r.exercise}
              </span>
              <span className="text-[9px] font-mono text-zinc-600">{r.label}</span>
            </span>
            <span className="text-[10px] font-mono shrink-0 text-right">
              <strong className="text-zinc-100">{r.weight} kg × {r.reps}</strong>
              <span className={`block text-[9px] ${r.first ? 'text-cyan-500' : 'text-emerald-400'}`}>
                {r.first ? 'ilk kayıt' : `+${r.gain} kg → ${r.e1rm}`}
              </span>
            </span>
          </div>
        ))}
      </div>

      {timeline.items.length > 5 && (
        <button
          onClick={() => setGenis(v => !v)}
          className="w-full py-2 text-[9px] font-mono text-zinc-500 active:text-zinc-300 flex items-center justify-center gap-1 border-t border-zinc-800"
        >
          {genis ? 'Daha az göster' : `${timeline.items.length - 5} rekor daha`}
          <ChevronDown size={10} className={genis ? 'rotate-180' : ''} />
        </button>
      )}

      <p className="px-4 py-2 text-[9px] font-mono text-zinc-600 leading-relaxed bg-zinc-950/40">
        {timeline.daysSinceLast !== null && (
          <>Son rekorun üstünden {timeline.daysSinceLast} gün geçti. </>
        )}
        {yeniRekor > 0
          ? `Son ${timeline.recentDays} günün ${yeniRekor} tanesi gerçek ilerleme, ${timeline.firstTimeCount} tanesi ilk kez yapılan hareket.`
          : 'Bir set, yapıldığı gün rekor olduysa listede kalır; sonradan geçilmiş olması onu düşürmez.'}
      </p>
    </div>
  );
});

RecordTimelineCard.displayName = 'RecordTimelineCard';

export default RecordTimelineCard;
