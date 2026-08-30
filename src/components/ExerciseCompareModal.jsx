import React, { useState, useMemo, memo } from 'react';
import { X, ArrowLeftRight, Search, TrendingUp, AlertTriangle } from 'lucide-react';
import { compareExercises } from '../utils/exerciseCompare';
import { foldForSearch } from '../utils/helpers';
import { formatDay } from '../utils/dates';

/**
 * İki hareketi yan yana karşılaştırma.
 *
 * Hareket profili tek bir hareketi ayrıntılı anlatıyordu; "hangisi daha iyi
 * gidiyor" sorusu iki profili açıp göz kararı kıyaslamayı gerektiriyordu.
 *
 * Ekran İDDİA ÜRETMİYOR: hangisinin daha iyi olduğunu söylemiyor, çünkü bu
 * kişiye, ekipmana ve hedefe bağlı. Ölçülebilir olanı yan yana koyuyor.
 */
const ExerciseCompareModal = memo(({ isOpen, onClose, allNames = [], workouts = [], resolveLoad, customExercises = [] }) => {
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [query, setQuery] = useState('');

  const sonuclar = useMemo(() => {
    const q = foldForSearch(query.trim());
    if (!q) return [];
    return allNames.filter(n => foldForSearch(n).includes(q)).slice(0, 8);
  }, [query, allNames]);

  const karsilastirma = useMemo(
    () => (a && b ? compareExercises(a, b, workouts, { resolveLoad, customExercises }) : null),
    [a, b, workouts, resolveLoad, customExercises]);

  if (!isOpen) return null;

  const sec = (name) => {
    if (!a) setA(name);
    else if (!b && name !== a) setB(name);
    else { setA(name); setB(null); }
    setQuery('');
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="exercise-compare-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[92] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md shrink-0">
          <h3 id="exercise-compare-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest flex items-center">
            <ArrowLeftRight size={16} className="mr-2 text-cyan-400" /> Hareket Karşılaştır
          </h3>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">
        <div className="grid grid-cols-2 gap-2">
          {[{ v: a, set: setA, n: 1 }, { v: b, set: setB, n: 2 }].map(slot => (
            <button
              key={slot.n}
              onClick={() => slot.set(null)}
              className={`rounded-2xl border p-3 text-left transition-all active:scale-[0.98] ${slot.v ? 'border-cyan-800/60 bg-cyan-950/30 shadow-sm shadow-cyan-950/30' : 'border-dashed border-zinc-800 bg-zinc-900/60'}`}
            >
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">{slot.n}. hareket</span>
              <span className={`text-[11px] font-bold block truncate mt-0.5 ${slot.v ? 'text-cyan-200' : 'text-zinc-500'}`}>
                {slot.v || '+ Seç'}
              </span>
            </button>
          ))}
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3 space-y-2 backdrop-blur-sm">
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2">
            <Search size={14} className="text-zinc-500 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hareket ara…"
              className="flex-1 bg-transparent text-[11px] text-zinc-200 outline-none min-w-0"
            />
          </div>
          {sonuclar.length > 0 && (
            <div className="space-y-1 pt-1">
              {sonuclar.map(name => (
                <button
                  key={name}
                  onClick={() => sec(name)}
                  disabled={name === a || name === b}
                  className="w-full text-left bg-zinc-950/70 border border-zinc-800/60 hover:border-cyan-600/50 rounded-xl px-3 py-2 text-[10px] text-zinc-300 active:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {karsilastirma && (
          <>
            {!karsilastirma.enoughData && (
              <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-3 flex items-start gap-2.5">
                <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[9px] font-mono text-amber-200/90 leading-relaxed">
                  Karşılaştırma için hareket başına en az {karsilastirma.minSessions} seans gerekiyor.
                  Şu an {karsilastirma.a.sessions} ve {karsilastirma.b.sessions} seans var; sayılar
                  yine gösteriliyor ama eğilim çıkarmak için erken.
                </span>
              </div>
            )}

            {!karsilastirma.comparable && (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 backdrop-blur-sm">
                <span className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                  Bu iki hareket ortak kas çalıştırmıyor. Sayılar yan yana duruyor ama
                  "hangisi daha iyi" sorusu burada anlamsız.
                </span>
              </div>
            )}

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="grid grid-cols-12 px-3.5 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60 gap-1">
                <span className="col-span-4 text-[9px] font-mono text-zinc-600" />
                <span className="col-span-4 text-[10px] font-bold text-zinc-300 truncate text-center">{karsilastirma.a.name}</span>
                <span className="col-span-4 text-[10px] font-bold text-zinc-300 truncate text-center">{karsilastirma.b.name}</span>
              </div>
              <div className="divide-y divide-zinc-800/70">
                {karsilastirma.rows.map(r => (
                  <div key={r.label} className="grid grid-cols-12 px-3.5 py-2 gap-1 items-center">
                    <span className="col-span-4 text-[9px] font-mono text-zinc-500 truncate">{r.label}</span>
                    <span className={`col-span-4 text-[10px] font-mono text-center ${r.winner === 'a' ? 'text-emerald-300 font-bold' : 'text-zinc-300'}`}>
                      {r.a}
                    </span>
                    <span className={`col-span-4 text-[10px] font-mono text-center ${r.winner === 'b' ? 'text-emerald-300 font-bold' : 'text-zinc-300'}`}>
                      {r.b}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-3.5 py-2.5 bg-zinc-950/60 border-t border-zinc-800/60 space-y-1">
                {karsilastirma.sharedMuscles.length > 0 && (
                  <p className="text-[9px] font-mono text-zinc-400">
                    Ortak kaslar: {karsilastirma.sharedMuscles.join(', ')}
                  </p>
                )}
                {[karsilastirma.a, karsilastirma.b].map(x => (
                  x.firstDate && (
                    <p key={x.name} className="text-[9px] font-mono text-zinc-500 truncate">
                      <TrendingUp size={10} className="inline mr-1 text-cyan-400" />
                      {x.name}: {formatDay(x.firstDate, 'short')} – {formatDay(x.lastDate, 'short')}
                    </p>
                  )
                ))}
              </div>
            </div>

            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
              Haftalık artış toplam farktan değil, ilk ve son ölçüm arasındaki
              süreye bölünerek hesaplanıyor: iki yıldır yaptığın hareket, iki
              aydır yaptığını her zaman yenerdi ve bu bir ilerleme farkı değil
              süre farkı olurdu. Boy yüklenmesinde "kazanan" yok; ikisi de
              değerli ve program ikisini birden içermeli.
            </p>
          </>
        )}
      </div>
    </div>
  </div>
  );
});

ExerciseCompareModal.displayName = 'ExerciseCompareModal';

export default ExerciseCompareModal;
