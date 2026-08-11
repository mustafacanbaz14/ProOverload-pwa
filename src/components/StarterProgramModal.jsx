import React, { useState, memo } from 'react';
import { X, Sparkles, CalendarRange, Layers, ChevronDown, Check } from 'lucide-react';
import { STARTER_PROGRAMS } from '../utils/starterPrograms';
import { WEEKDAYS } from '../utils/weekPlan';

/**
 * Hazır program seçimi.
 *
 * Uygulamanın en zor ilk adımı program kurmaktı: hangi hareket, kaç set, hangi
 * gün. Buradan seçilen program şablonlara ve haftalık plana dönüşüyor; sonrası
 * normal şablon, istenildiği gibi düzenleniyor.
 */
const StarterProgramModal = memo(({ isOpen, onClose, onInstall, existingTemplateCount = 0 }) => {
  const [open, setOpen] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[92] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Sparkles size={15} className="mr-2 text-amber-400" /> Hazır Programlar
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">
        <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
          Seçtiğin program şablonlara ve haftalık plana dönüşür. Sonrasında normal
          şablon gibi düzenlenir — hareket ekleyip çıkarabilir, günleri değiştirebilirsin.
        </p>

        {existingTemplateCount > 0 && (
          <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-xl p-3">
            <p className="text-[10px] font-mono text-cyan-200 leading-relaxed">
              Zaten {existingTemplateCount} şablonun var. Hazır program bunları
              SİLMEZ, yanına eklenir; istemediğini sonradan silebilirsin.
            </p>
          </div>
        )}

        {STARTER_PROGRAMS.map(p => {
          const acik = open === p.key;
          const toplamSet = p.days.reduce((s, d) => s + d.exercises.reduce((x, e) => x + e.sets, 0), 0);
          return (
            <div key={p.key} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(acik ? null : p.key)}
                aria-expanded={acik}
                className="w-full p-3.5 text-left active:bg-zinc-800 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest block">{p.level}</span>
                    <strong className="text-[13px] text-zinc-100 block">{p.name}</strong>
                    <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">{p.summary}</span>
                  </div>
                  <ChevronDown size={16} className={`text-zinc-600 shrink-0 transition-transform ${acik ? 'rotate-180' : ''}`} />
                </div>

                <div className="flex gap-3 mt-2.5">
                  <span className="text-[10px] font-mono text-zinc-500 flex items-center">
                    <CalendarRange size={11} className="mr-1 text-cyan-400" /> {p.daysPerWeek} gün
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 flex items-center">
                    <Layers size={11} className="mr-1 text-emerald-400" /> {toplamSet} set/hafta
                  </span>
                </div>
              </button>

              {acik && (
                <div className="border-t border-zinc-800 bg-zinc-950/50 p-3 space-y-3">
                  <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">{p.rationale}</p>

                  {p.days.map((day, i) => {
                    // Bu günün haftada hangi güne düştüğü
                    const gunKey = Object.entries(p.schedule).find(([, idx]) => idx === i)?.[0];
                    const gun = WEEKDAYS.find(w => w.key === gunKey);
                    return (
                      <div key={day.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5">
                        <div className="flex justify-between items-baseline mb-1.5">
                          <strong className="text-[11px] text-zinc-200">{day.name}</strong>
                          <span className="text-[9px] font-mono text-cyan-500">{gun?.label || ''}</span>
                        </div>
                        <div className="space-y-0.5">
                          {day.exercises.map(e => (
                            <div key={e.name} className="flex justify-between text-[9px] font-mono">
                              <span className="text-zinc-400 truncate min-w-0">{e.name}</span>
                              <span className="text-zinc-600 shrink-0 pl-2">{e.sets} set</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => { onInstall(p.key); onClose(); }}
                    className="w-full bg-amber-600 active:bg-amber-700 text-white font-bold py-3 rounded-xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <Check size={15} /> Bu programı kur
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
          Set sayıları, her kasın haftalık toplamı koruma eşiğinin (MEV) üstünde
          ve toparlanma sınırının (MRV) altında kalacak şekilde seçildi. Kurduktan
          sonra Haftalık Program ekranındaki kas dökümünden kendi gözünle
          doğrulayabilirsin.
        </p>
      </div>
    </div>
  );
});

StarterProgramModal.displayName = 'StarterProgramModal';

export default StarterProgramModal;
