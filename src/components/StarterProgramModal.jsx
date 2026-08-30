import React, { useState, memo } from 'react';
import { X, Sparkles, CalendarRange, Layers, ChevronDown, Check, Pencil } from 'lucide-react';
import { STARTER_PROGRAMS } from '../utils/starterPrograms';
import { WEEKDAYS } from '../utils/weekPlan';

/**
 * Hazır program seçimi.
 *
 * Uygulamanın en zor ilk adımı program kurmaktı: hangi hareket, kaç set, hangi
 * gün. Buradan seçilen program şablonlara ve haftalık plana dönüşüyor; sonrası
 * normal şablon, istenildiği gibi düzenleniyor.
 */
const StarterProgramModal = memo(({ isOpen, onClose, onInstall, onCustomize, existingTemplateCount = 0 }) => {
  const [open, setOpen] = useState(null);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="starter-program-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[92] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md shrink-0">
          <h3 id="starter-program-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest flex items-center">
            <Sparkles size={16} className="mr-2 text-amber-400" /> Hazır Programlar
          </h3>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">
        <p className="text-[10px] font-mono text-zinc-400 leading-relaxed bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 backdrop-blur-sm">
          Seçtiğin program şablonlara ve haftalık plana dönüşür. Sonrasında normal
          şablon gibi düzenlenir — hareket ekleyip çıkarabilir, günleri değiştirebilirsin.
        </p>

        {existingTemplateCount > 0 && (
          <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-2xl p-3.5">
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
            <div key={p.key} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm transition-all">
              <button
                onClick={() => setOpen(acik ? null : p.key)}
                aria-expanded={acik}
                className="w-full p-4 text-left active:bg-zinc-800/40 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="text-[8px] font-mono font-bold text-amber-400 uppercase tracking-widest block">{p.level}</span>
                    <strong className="text-[13px] font-bold text-zinc-100 block mt-0.5">{p.name}</strong>
                    <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">{p.summary}</span>
                  </div>
                  <ChevronDown size={16} className={`text-zinc-500 shrink-0 transition-transform duration-200 ${acik ? 'rotate-180 text-amber-400' : ''}`} />
                </div>

                <div className="flex gap-3 mt-3">
                  <span className="text-[10px] font-mono text-zinc-400 flex items-center">
                    <CalendarRange size={12} className="mr-1 text-cyan-400" /> {p.daysPerWeek} gün
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 flex items-center">
                    <Layers size={12} className="mr-1 text-emerald-400" /> {toplamSet} set/hafta
                  </span>
                </div>
              </button>

              {acik && (
                <div className="border-t border-zinc-800/80 bg-zinc-950/60 p-3.5 space-y-3">
                  <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">{p.rationale}</p>

                  {p.days.map((day, i) => {
                    const gunKey = Object.entries(p.schedule).find(([, idx]) => idx === i)?.[0];
                    const gun = WEEKDAYS.find(w => w.key === gunKey);
                    return (
                      <div key={day.name} className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3">
                        <div className="flex justify-between items-baseline mb-1.5">
                          <strong className="text-[11px] font-bold text-zinc-200">{day.name}</strong>
                          <span className="text-[9px] font-mono font-bold text-cyan-400">{gun?.label || ''}</span>
                        </div>
                        <div className="space-y-1">
                          {day.exercises.map(e => (
                            <div key={e.name} className="flex justify-between text-[9px] font-mono">
                              <span className="text-zinc-400 truncate min-w-0">{e.name}</span>
                              <span className="text-zinc-500 shrink-0 pl-2">{e.sets} set</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => { onInstall(p.key); onClose(); }}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 active:scale-[0.98] text-white font-black py-3.5 rounded-2xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all"
                  >
                    <Check size={16} /> Bu Programı Kur
                  </button>
                  {onCustomize && (
                    <button
                      onClick={() => { onCustomize(p.key); onClose(); }}
                      className="w-full mt-2 bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-600 active:scale-[0.98] text-zinc-300 font-bold py-3 rounded-2xl uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                      <Pencil size={13} /> Değiştirerek Kur
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <p className="text-[9px] font-mono text-zinc-400 leading-relaxed px-1">
          Set sayıları, her kasın haftalık toplamı eşiğin üstünde ve tartışmalı
          bandın sonunun altında kalacak şekilde seçildi. Kurduktan
          sonra Haftalık Program ekranındaki kas dökümünden kendi gözünle
          doğrulayabilirsin.
        </p>
      </div>
    </div>
  </div>
  );
});

StarterProgramModal.displayName = 'StarterProgramModal';

export default StarterProgramModal;
