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
    <div className="fixed inset-0 bg-zinc-950 z-[92] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Wand2 size={15} className="mr-2 text-violet-400" /> Programı Güncelle
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">
        <p className="text-[9px] font-mono text-zinc-500 leading-relaxed bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          Geçen haftanın ölçümleri somut değişiklik önerilerine çevrildi. Her
          öneri tek tek onaylanıyor; hiçbiri kendiliğinden uygulanmıyor. Bir
          haftada en fazla dört set ekleniyor — daha fazlası neyin işe
          yaradığını anlaşılmaz yapar.
        </p>

        {report?.overreached && (
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/15 p-2.5 flex items-start gap-2">
            <AlertTriangle size={11} className="text-amber-400 shrink-0 mt-0.5" />
            <span className="text-[9px] font-mono text-amber-200/85 leading-relaxed">
              Form modeli yorgunluk birikimi gösteriyor, bu yüzden hacim artışı
              önerileri ({report.deferred} tane) şimdilik gizlendi. Yorgunluk
              yüksekken set eklemek modelin söylediğinin tam tersi olurdu.
            </span>
          </div>
        )}

        {!report?.hasData || report.items.length === 0 ? (
          <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/15 p-3">
            <p className="text-[10px] font-mono text-emerald-200/85 leading-relaxed">
              <Check size={11} className="inline mr-1" />
              Programda değiştirilmesi gereken bir şey görünmüyor. Hacim
              eşiklerin içinde, durgun hareket yok.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {report.items.map(x => {
              const bitti = uygulanan.has(x.key);
              return (
                <div
                  key={x.key}
                  className={`rounded-2xl border p-3 space-y-2 ${bitti
                    ? 'border-emerald-900/50 bg-emerald-950/15'
                    : x.manual ? 'border-zinc-800 bg-zinc-900' : 'border-violet-900/50 bg-violet-950/15'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <strong className="text-[11px] text-zinc-100 block leading-snug">{x.title}</strong>
                      {x.templateName && (
                        <span className="text-[9px] font-mono text-zinc-500">{x.templateName}</span>
                      )}
                    </span>
                    {x.manual ? (
                      <span className="text-[8px] font-bold text-zinc-500 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 shrink-0 flex items-center gap-1">
                        <Hand size={8} /> ELLE
                      </span>
                    ) : bitti ? (
                      <span className="text-[8px] font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-900/50 rounded px-1.5 py-0.5 shrink-0">
                        UYGULANDI
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">{x.detail}</p>

                  {!x.manual && !bitti && (
                    <button
                      onClick={() => uygula(x)}
                      className="w-full rounded-lg bg-violet-600 active:bg-violet-700 py-2 text-[10px] font-bold text-white uppercase tracking-wider"
                    >
                      Uygula
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
          "Elle" işaretli öneriler bir karar gerektiriyor — hangi varyanta
          geçileceği ya da hacmin hangi güne taşınacağı programın yapısına
          bağlı ve uygulama bunu senin yerine seçemez.
        </p>
      </div>
    </div>
  );
});

AutoAdaptModal.displayName = 'AutoAdaptModal';

export default AutoAdaptModal;
