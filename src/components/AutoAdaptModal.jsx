import React, { useState, memo } from 'react';
import { X, Wand2, Check, AlertTriangle, Hand } from 'lucide-react';

/**
 * Otomatik program uyarlaması.
 *
 * Ölçümler okunup unutuluyordu: uygulama hangi kasın eşiğin altında olduğunu
 * biliyordu ama bunu plana uygulamak beş ekranı gezip şablonları tek tek
 * açmayı gerektiriyordu.
 *
 * Öneriler tek tek onaylanıyor. Otomatik uygulanmıyor çünkü sessizce değişen
 * bir program güvenilmez bir programdır — uygulamanın işi değişikliği
 * hazırlamak, onaylamak değil.
 */
const AutoAdaptModal = memo(({ isOpen, onClose, report, onApply }) => {
  const [uygulanan, setUygulanan] = useState(() => new Set());

  if (!isOpen) return null;

  const uygula = (oneri) => {
    onApply?.(oneri);
    setUygulanan(prev => new Set(prev).add(oneri.key));
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="autoadapt-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[92] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-md max-h-[88dvh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md shrink-0">
          <h3 id="autoadapt-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest flex items-center">
            <Wand2 size={16} className="mr-2 text-violet-400" /> Programı Otomatik Güncelle
          </h3>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">
          <p className="text-[9px] font-mono text-zinc-400 leading-relaxed bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3.5 shadow-sm">
            Geçen haftanın ölçümleri somut değişiklik önerilerine çevrildi. Her
            öneri tek tek onaylanıyor; hiçbiri kendiliğinden uygulanmıyor. Bir
            haftada en fazla dört set ekleniyor.
          </p>

          {report?.overreached && (
            <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-3.5 flex items-start gap-2.5 shadow-sm">
              <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
              <span className="text-[9px] font-mono text-amber-200/90 leading-relaxed">
                Form modeli yorgunluk birikimi gösteriyor, bu yüzden hacim artışı
                önerileri ({report.deferred} tane) şimdilik ertelendi.
              </span>
            </div>
          )}

          {!report?.hasData || report.items.length === 0 ? (
            <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-4 shadow-sm">
              <p className="text-[10px] font-mono text-emerald-200/90 leading-relaxed">
                <Check size={13} className="inline mr-1.5 text-emerald-400" />
                Programda değiştirilmesi gereken bir şey görünmüyor. Hacim
                eşiklerin içinde, durgun hareket yok.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {report.items.map(x => {
                const bitti = uygulanan.has(x.key);
                return (
                  <div
                    key={x.key}
                    className={`luxury-feature-card rounded-2xl border p-4 space-y-2.5 transition-all ${bitti
                      ? 'border-emerald-900/50 bg-emerald-950/20'
                      : x.manual ? 'border-zinc-800/80 bg-zinc-900/80' : 'border-violet-900/50 bg-violet-950/20'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <strong className="text-[11px] font-black text-zinc-100 block leading-snug tracking-tight">{x.title}</strong>
                        {x.templateName && (
                          <span className="text-[9px] font-mono text-zinc-400 block mt-0.5">{x.templateName}</span>
                        )}
                      </span>
                      {x.manual ? (
                        <span className="text-[8px] font-black text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-0.5 shrink-0 flex items-center gap-1">
                          <Hand size={9} /> ELLE
                        </span>
                      ) : bitti ? (
                        <span className="text-[8px] font-black text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-lg px-2 py-0.5 shrink-0">
                          UYGULANDI
                        </span>
                      ) : null}
                    </div>

                    <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">{x.detail}</p>

                    {!x.manual && !bitti && (
                      <button
                        onClick={() => uygula(x)}
                        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 active:scale-[0.98] py-2.5 text-[10px] font-black text-white uppercase tracking-wider shadow-md shadow-violet-950/40 transition-all"
                      >
                        Uygula
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[9px] font-mono text-zinc-500 leading-relaxed px-1">
            &quot;Elle&quot; işaretli öneriler bir karar gerektiriyor — hangi varyanta
            geçileceği ya da hacmin hangi güne taşınacağı programın yapısına
            bağlı ve uygulama bunu senin yerine seçemez.
          </p>
        </div>
      </div>
    </div>
  );
});

AutoAdaptModal.displayName = 'AutoAdaptModal';

export default AutoAdaptModal;
