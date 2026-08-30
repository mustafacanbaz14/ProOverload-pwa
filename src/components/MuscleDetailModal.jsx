import React, { memo } from 'react';
import { X, Target, Calendar } from 'lucide-react';
import { getVolumeLandmarks, volumeStatusOf, VOLUME_STATUS } from '../utils/constants';
import { formatDay } from '../utils/dates';

const WEIGHT_LABEL = {
  1: 'Birincil',
  0.5: 'Yardımcı',
  0.25: 'Hafif',
};

const WEIGHT_COLOR = {
  1: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/30',
  0.5: 'text-cyan-400 border-cyan-900/50 bg-cyan-950/30',
  0.25: 'text-zinc-400 border-zinc-700 bg-zinc-900',
};

/**
 * Bir kas grubunun bu haftaki hacminin hangi hareketlerden geldiğini gösterir.
 * `breakdown`: [{ exerciseName, weight, sets, contributed, dates: [] }]
 */
const MuscleDetailModal = memo(({ isOpen, onClose, muscle, total = 0, breakdown = [], experienceLevel = 'intermediate' }) => {
  if (!isOpen || !muscle) return null;

  const landmark = getVolumeLandmarks(muscle, experienceLevel);

  const state = VOLUME_STATUS[volumeStatusOf(total, muscle, experienceLevel)];

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="muscle-detail-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[85] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">

        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex justify-between items-center shrink-0">
          <h3 id="muscle-detail-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest flex items-center">
            <Target size={16} className="mr-2 text-cyan-400" /> {muscle}
          </h3>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">

          {/* Özet */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Bu Hafta</span>
                <span className="text-3xl font-mono font-black text-zinc-100">{total}</span>
                <span className="text-[11px] font-mono text-zinc-500 ml-1">set</span>
              </div>
              <span className={`text-[11px] font-black uppercase tracking-wider ${state.text}`}>{state.label}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Eşik', value: landmark.mev, hint: 'Altında uyaran yok' },
                { label: 'Verimli', value: landmark.mav, hint: 'Yüksek verim bandı' },
                { label: 'Tartışmalı', value: landmark.mrv, hint: 'Doğrudan kanıt yok' },
              ].map(l => (
                <div key={l.label} className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl py-2.5 px-1">
                  <span className="text-[8px] font-mono font-bold uppercase text-zinc-400 block">{l.label}</span>
                  <span className="text-sm font-mono font-black text-zinc-100 block mt-0.5">{l.value}</span>
                  <span className="text-[7px] font-mono text-zinc-500 block mt-0.5 leading-tight">{l.hint}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Katkı dökümü */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
              Katkı Veren Hareketler
            </h4>

            {breakdown.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-[11px] font-mono bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-4">
                Bu hafta bu kasa katkı veren hareket yok.
              </div>
            ) : (
              <div className="space-y-2">
                {breakdown.map((item) => (
                  <div key={item.exerciseName} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 backdrop-blur-sm shadow-sm">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[11px] font-bold text-zinc-200 min-w-0 truncate">{item.exerciseName}</span>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${WEIGHT_COLOR[item.weight] || WEIGHT_COLOR[0.25]}`}>
                        {WEIGHT_LABEL[item.weight] || `×${item.weight}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-400">
                        {item.sets} set × {item.weight}
                      </span>
                      <span className="text-cyan-400 font-bold">= {item.contributed} set</span>
                    </div>

                    {item.dates?.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-zinc-800/60 text-[9px] font-mono text-zinc-500">
                        <Calendar size={11} className="text-cyan-400" />
                        {item.dates.map(d => formatDay(d)).join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[9px] font-mono text-zinc-500 leading-relaxed px-1">
            Bir set, hareketin o kasa katkı ağırlığı kadar sayılır: birincil hedef 1,
            belirgin yardımcı 0.5, hafif katkı 0.25. Isınma setleri hiç sayılmaz.
          </p>
        </div>
      </div>
    </div>
  );
});

MuscleDetailModal.displayName = 'MuscleDetailModal';

export default MuscleDetailModal;
