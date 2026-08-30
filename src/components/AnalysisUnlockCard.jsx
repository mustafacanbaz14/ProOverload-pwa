import React, { memo, useState } from 'react';
import { Lock, LockOpen, ChevronDown } from 'lucide-react';

/**
 * Analiz kilitleri kartı.
 *
 * Eşiği geçmemiş analizler eskiden hiç görünmüyordu ve sonucu şuydu: o
 * özelliğin eksik olduğu değil, VAR OLMADIĞI sanılıyordu. Kart eşikleri
 * görünür kılıyor — ne gerekiyor, ne kadar kaldı, açılınca ne kazanılıyor.
 *
 * Hepsi açıksa kart kendini gizliyor: her şey açıkken kilit listesi göstermek
 * ekranda yer kaplamaktan başka bir şey yapmaz.
 */

const AnalysisUnlockCard = memo(({ report }) => {
  const [acik, setAcik] = useState(false);
  if (!report || report.silent) return null;

  const gosterilen = acik ? report.lockedRows : report.lockedRows.slice(0, 3);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Lock size={12} className="mr-1.5 text-zinc-400" /> Açılmayı Bekleyen Analizler
        </h4>
        <span className="text-[9px] font-mono text-zinc-400">
          {report.ready}/{report.total} açık
        </span>
      </div>

      {report.bottleneck && report.bottleneck.unlocks > 1 && (
        <p className="px-4 py-2.5 text-[10px] font-mono text-cyan-200 leading-relaxed bg-cyan-950/15 border-b border-zinc-800">
          En çok işe yarayacak tek şey: <strong>{report.bottleneck.label}</strong> girmek.
          {' '}{report.bottleneck.unlocks} analizi birden açıyor.
        </p>
      )}

      <div className="divide-y divide-zinc-800/70">
        {gosterilen.map(r => (
          <div key={r.key} className="px-4 py-2.5 space-y-1.5">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[11px] font-bold text-zinc-300 truncate min-w-0">{r.label}</span>
              <span className="text-[9px] font-mono text-zinc-400 shrink-0">{r.area}</span>
            </div>
            <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">{r.value}</p>
            <div className="w-full bg-zinc-950 rounded-full h-1 border border-zinc-800 overflow-hidden">
              <div className="h-full rounded-full bg-cyan-700" style={{ width: `${r.progress}%` }} />
            </div>
            <span className="text-[9px] font-mono text-zinc-400 block">
              {r.conditions.map(c => `${c.have}/${c.need} ${c.label}`).join(' · ')}
            </span>
          </div>
        ))}
      </div>

      {report.lockedRows.length > 3 && (
        <button
          type="button"
          onClick={() => setAcik(v => !v)}
          className="w-full py-2 text-[9px] font-mono text-zinc-500 active:text-zinc-300 flex items-center justify-center gap-1 border-t border-zinc-800"
        >
          {acik ? 'Daha az göster' : `${report.lockedRows.length - 3} analiz daha`}
          <ChevronDown size={10} className={`transition-transform ${acik ? 'rotate-180' : ''}`} />
        </button>
      )}

      {report.unlocked.length > 0 && (
        <p className="px-4 py-2 text-[9px] font-mono text-zinc-400 leading-relaxed bg-zinc-950/40 border-t border-zinc-800">
          <LockOpen size={9} className="inline mr-1 text-emerald-500" />
          Açık olanlar: {report.unlocked.map(r => r.label).join(', ')}.
        </p>
      )}
    </div>
  );
});

AnalysisUnlockCard.displayName = 'AnalysisUnlockCard';

export default AnalysisUnlockCard;
