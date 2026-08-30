import React, { memo } from 'react';
import { Gauge, AlertTriangle } from 'lucide-react';

/**
 * Yakınlık kartı.
 *
 * Hacim modeli değiştikten sonra bu kartın rolü büyüdü: az set çalışan biri
 * için yakınlık, hacmin yerine geçen kaldıraç. Ama kart bunu bir emir gibi
 * sunmuyor — RIR ölçülmüyor, TAHMİN ediliyor ve insanlar yetmezliğe
 * uzaklığını sistematik olarak fazla tahmin ediyor. Bu uyarı kartın altında
 * daima duruyor.
 */

const STATUS = {
  far: { label: 'hedeften uzak', text: 'text-amber-400' },
  close: { label: 'hedeften yakın', text: 'text-cyan-400' },
  onTarget: { label: 'hedefte', text: 'text-emerald-400' },
};

const ProximityCard = memo(({ report }) => {
  if (!report?.hasData) return null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Gauge size={12} className="mr-1.5 text-orange-400" /> Yetmezliğe Yakınlık
        </h4>
        <span className="text-[9px] font-mono text-zinc-400">
          {report.meanRir !== null ? `ortalama RIR ${report.meanRir}` : `son ${report.weeks} hafta`}
        </span>
      </div>

      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/30 flex gap-3">
        {[
          { l: 'hedefte', v: report.onTarget.length, c: 'text-emerald-400' },
          { l: 'uzak', v: report.tooFar.length, c: 'text-amber-400' },
          { l: 'yakın', v: report.tooClose.length, c: 'text-cyan-400' },
        ].map(k => (
          <span key={k.l} className="text-[9px] font-mono text-zinc-400">
            <strong className={k.c}>{k.v}</strong> {k.l}
          </span>
        ))}
      </div>

      <div className="divide-y divide-zinc-800/70">
        {report.rows.slice(0, 8).map(r => {
          const s = STATUS[r.status];
          return (
            <div key={r.name} className="px-4 py-2 flex items-baseline justify-between gap-2">
              <span className="text-[10px] text-zinc-300 truncate min-w-0">{r.name}</span>
              <span className="text-[9px] font-mono shrink-0">
                <span className={s.text}>RIR {r.meanRir}</span>
                <span className="text-zinc-400"> · {r.targetLabel} · {r.sets} set</span>
              </span>
            </div>
          );
        })}
      </div>

      {report.tooFar.length > 0 && (
        <p className="px-4 py-2.5 text-[9px] font-mono text-amber-200/80 leading-relaxed border-t border-zinc-800 bg-amber-950/10">
          {report.tooFar.length} harekette setler hedeften uzak bitiyor. Hipertrofi
          setler yetmezliğe yaklaştıkça artıyor (düzleşen bir eğriyle) — yani bu,
          hacim eklemeden kullanabileceğin bir kaldıraç. Kuvvette aynı ilişki
          bulunmadı: kuvvet hedefliyorsan yakınlığı zorlamanın karşılığı yok,
          yorgunluğu var.
        </p>
      )}

      <p className="px-4 py-2 text-[9px] font-mono text-zinc-400 leading-relaxed bg-zinc-950/40 border-t border-zinc-800">
        <AlertTriangle size={9} className="inline mr-1" />
        {report.caveat} Hedefler hareket tipine göre veriliyor: bileşke
        hareketlerde yetmezliğe gitmenin bedeli (teknik bozulması, eklem yükü,
        sonraki setleri yeme) izolasyondakinden yüksek. Bu bir güvenlik tercihi,
        literatürden çıkarılmış bir sayı değil.
      </p>
    </div>
  );
});

ProximityCard.displayName = 'ProximityCard';

export default ProximityCard;
