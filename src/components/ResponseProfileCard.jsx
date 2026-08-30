import React, { memo, useState } from 'react';
import { Fingerprint } from 'lucide-react';

/**
 * Tepki profili kartı.
 *
 * Üç boyut üç ayrı sekmede: tekrar aralığı, hacim bandı, sıklık. Hepsini aynı
 * anda göstermek on iki satırlık bir tablo üretiyordu ve hiçbiri okunmuyordu.
 *
 * Yeterli gözlemi olmayan bantlar gizlenmiyor, GRİ gösteriliyor: "bu bantta
 * hiç çalışmamışsın" bilgisi de en az sonucun kendisi kadar değerli.
 */

const TABS = [
  { key: 'repBands', label: 'Tekrar' },
  { key: 'volumeBands', label: 'Hacim' },
  { key: 'frequencyBands', label: 'Sıklık' },
];

const ResponseProfileCard = memo(({ profile }) => {
  const [tab, setTab] = useState('repBands');
  if (!profile?.hasData) return null;

  const bandlar = profile[tab] || [];
  const enIyi = [...bandlar.filter(b => b.enough)].sort((a, b) => b.gainPerSession - a.gainPerSession)[0];
  const tavan = Math.max(0.01, ...bandlar.filter(b => b.enough).map(b => Math.abs(b.gainPerSession)));

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Fingerprint size={12} className="mr-1.5 text-violet-400" /> Tepki Profili
        </h4>
        <span className="text-[9px] font-mono text-zinc-400">{profile.observations} seans geçişi</span>
      </div>

      <div className="grid grid-cols-3 gap-1 p-2 bg-zinc-950/40">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-colors ${
              tab === t.key ? 'bg-violet-900/40 text-violet-300 border border-violet-800/60' : 'text-zinc-500 border border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="divide-y divide-zinc-800/70">
        {bandlar.map(b => {
          const oran = b.enough ? Math.abs(b.gainPerSession) / tavan : 0;
          const kazanan = enIyi && b.key === enIyi.key && b.enough;
          return (
            <div key={b.key} className="px-4 py-2 space-y-1">
              <div className="flex justify-between items-baseline gap-2">
                <span className={`text-[10px] font-bold truncate min-w-0 ${b.enough ? 'text-zinc-200' : 'text-zinc-400'}`}>
                  {b.label}
                  {b.hint && <span className="font-normal text-zinc-400"> · {b.hint}</span>}
                </span>
                <span className={`text-[10px] font-mono shrink-0 ${kazanan ? 'text-emerald-400' : b.enough ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {b.enough ? `%${b.gainPerSession} / seans` : `${b.observations} gözlem`}
                </span>
              </div>
              {b.enough && (
                <div className="w-full bg-zinc-950 rounded-full h-1 border border-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${b.gainPerSession < 0 ? 'bg-red-500' : kazanan ? 'bg-emerald-500' : 'bg-violet-500'}`}
                    style={{ width: `${Math.round(oran * 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {profile.identity && (
        <p className="px-4 py-2.5 text-[10px] font-mono text-violet-200 leading-relaxed border-t border-zinc-800 bg-violet-950/15">
          {profile.identity}
        </p>
      )}

      <p className="px-4 py-2 text-[9px] font-mono text-zinc-400 leading-relaxed bg-zinc-950/40">
        Ölçü SEANS BAŞINA tahmini 1RM kazancı — haftalık ölçmek daha çok
        antrenman yapan bandı otomatik kazandırırdı. Her kazanç onu üreten
        seansın bandına yazılıyor. Bu bir deney değil gözlem: ağır çalıştığın
        dönemler aynı zamanda daha dinlenmiş olduğun dönemler de olabilir. İki
        bant arasındaki fark küçükse "en iyi" seçilmiyor.
      </p>
    </div>
  );
});

ResponseProfileCard.displayName = 'ResponseProfileCard';

export default ResponseProfileCard;
