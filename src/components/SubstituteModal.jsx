import React, { useState, useMemo, memo } from 'react';
import { X, Repeat, Check, Star } from 'lucide-react';
import { suggestSubstitutes, EQUIPMENT, detectEquipment } from '../utils/substitution';

/**
 * Hareket ikamesi.
 *
 * "Omzum ağrıyor, bench yerine ne yapayım" ya da "makine dolu" sorularının
 * cevabı. Öneriler kas katkı profilinin yakınlığına göre sıralanıyor; ekipman
 * filtresi var çünkü çoğu zaman asıl kısıt kas değil, elde ne olduğu.
 */
const SubstituteModal = memo(({ isOpen, onClose, exerciseName, allExerciseNames = [], customExercises = [], performedNames, onPick }) => {
  const [equipment, setEquipment] = useState(null);

  const oneriler = useMemo(
    () => suggestSubstitutes(exerciseName, allExerciseNames, {
      customExercises,
      performed: performedNames instanceof Set ? performedNames : new Set(performedNames || []),
      equipment,
      limit: equipment ? 10 : 8,
    }),
    [exerciseName, allExerciseNames, customExercises, performedNames, equipment]);

  if (!isOpen || !exerciseName) return null;

  const kaynakEkipman = detectEquipment(exerciseName);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="substitute-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">

        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex justify-between items-center gap-2 shrink-0">
          <div className="min-w-0">
            <span className="text-[8px] font-mono text-cyan-400 font-bold uppercase tracking-widest block">Yerine Ne Yapılır</span>
            <h3 id="substitute-title" className="text-[12px] font-black text-zinc-100 truncate">{exerciseName}</h3>
          </div>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        {/* Ekipman filtresi */}
        <div className="px-3.5 py-2.5 border-b border-zinc-800/80 bg-zinc-950/70 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setEquipment(null)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 ${!equipment ? 'border-cyan-600/80 text-cyan-300 bg-cyan-950/40 shadow-sm shadow-cyan-950/30' : 'border-zinc-800 text-zinc-500 bg-zinc-900/60'}`}
            >
              Hepsi
            </button>
            {EQUIPMENT.map(e => (
              <button
                key={e.key}
                onClick={() => setEquipment(equipment === e.key ? null : e.key)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 ${equipment === e.key ? 'border-cyan-600/80 text-cyan-300 bg-cyan-950/40 shadow-sm shadow-cyan-950/30' : 'border-zinc-800 text-zinc-500 bg-zinc-900/60'}`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-2.5">
          {oneriler.length === 0 ? (
            <p className="text-center py-8 text-[11px] font-mono text-zinc-500 leading-relaxed px-4">
              {equipment
                ? 'Bu ekipmanla yeterince yakın bir hareket bulunamadı. Filtreyi kaldırıp bakabilirsin.'
                : 'Bu hareketin kas eşlemesi tanımlı değil, benzer hareket çıkarılamıyor. Kütüphaneden eşlemeyi düzenlersen öneri gelir.'}
            </p>
          ) : oneriler.map(o => (
            <button
              key={o.name}
              onClick={() => { onPick?.(o.name); onClose(); }}
              className="w-full text-left bg-zinc-900/60 border border-zinc-800/80 hover:border-cyan-600/60 rounded-2xl p-3.5 active:scale-[0.98] transition-all backdrop-blur-sm shadow-sm"
            >
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <span className="text-[11px] font-bold text-zinc-100 truncate min-w-0 flex items-center gap-1.5">
                  {o.name}
                  {o.isKnown && <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />}
                </span>
                <span className="text-[9px] font-mono font-bold text-cyan-400 shrink-0">
                  %{Math.round(o.similarity * 100)} örtüşme
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {o.equipment && (
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-md border border-cyan-900/60 bg-cyan-950/30 text-cyan-300">
                    {o.equipment.label}
                  </span>
                )}
                {o.sharedMuscles.slice(0, 3).map(m => (
                  <span key={m} className="text-[8px] font-bold px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-400">
                    {m}
                  </span>
                ))}
              </div>
              <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">{o.note}</p>
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md shrink-0 pb-safe">
          <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
            Örtüşme, iki hareketin kas katkı dağılımının yakınlığı.
            {kaynakEkipman && ` Bu hareket ${kaynakEkipman.label.toLowerCase()} sınıfında;`}
            {' '}makine ve kablo varyantlarının hareket yolu daha kontrollü olabilir;
            bu, eklem için ağrısız veya güvenli olduklarını garanti etmez. <Check size={10} className="inline text-cyan-400" /> ile
            seçtiğin hareket listede yerine geçer.
          </p>
        </div>
      </div>
    </div>
  );
});

SubstituteModal.displayName = 'SubstituteModal';

export default SubstituteModal;
