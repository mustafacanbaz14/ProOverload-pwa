import React, { memo } from 'react';
import { BookCheck, ChevronRight, FlaskConical, TrendingUp } from 'lucide-react';

const CoachCalibrationCard = memo(({ report, onOpenLedger }) => {
  if (!report) return null;
  const enough = report.overallRate !== null;
  const trend = report.recentRate !== null && report.previousRate !== null
    ? report.recentRate - report.previousRate
    : null;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/55 flex items-center justify-between gap-2">
        <div>
          <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-[0.18em] flex items-center gap-1.5">
            <FlaskConical size={10} /> Koç Kalibrasyonu
          </span>
          <h4 className="text-[11px] font-bold text-zinc-200 mt-0.5">Tavsiyeler sende gerçekten çalışıyor mu?</h4>
        </div>
        {onOpenLedger && (
          <button type="button" onClick={onOpenLedger} aria-label="Koç karar defterini aç" className="p-2 text-zinc-500 active:text-emerald-400">
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 text-center">
            <strong className={`text-base font-mono block ${enough ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {enough ? `%${report.overallRate}` : '—'}
            </strong>
            <span className="text-[7px] font-mono text-zinc-600">isabet</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 text-center">
            <strong className="text-base font-mono text-cyan-400 block">{report.tested}</strong>
            <span className="text-[7px] font-mono text-zinc-600">ölçüldü</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 text-center">
            <strong className="text-base font-mono text-violet-400 block">
              {report.complianceRate === null ? '—' : `%${report.complianceRate}`}
            </strong>
            <span className="text-[7px] font-mono text-zinc-600">uygulama</span>
          </div>
        </div>

        {!enough ? (
          <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
            Kalibrasyon için {report.needed} ölçülmüş tavsiye daha gerekiyor. Az örneklemde
            “%100 isabet” gibi bir sayı bilgi değil tesadüf olurdu.
          </p>
        ) : (
          <>
            {trend !== null && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 flex items-start gap-2">
                <TrendingUp size={11} className={trend >= 0 ? 'text-emerald-400' : 'text-amber-400'} />
                <p className="text-[8px] font-mono text-zinc-500 leading-relaxed">
                  Son tavsiyelerin isabeti %{report.recentRate}; önceki grup %{report.previousRate}.
                  {trend === 0 ? ' Değişim yok.' : ` ${trend > 0 ? '+' : ''}${trend} puan değişti.`}
                </p>
              </div>
            )}

            {report.byCategory.length > 0 && (
              <div className="space-y-1.5">
                {report.byCategory.slice(0, 5).map(row => (
                  <div key={row.category} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 flex justify-between gap-2">
                    <span className="text-[9px] font-bold text-zinc-300">{row.label}</span>
                    <span className="text-[8px] font-mono text-zinc-500">
                      {row.hitRate === null ? `${row.tested}/3 ölçüm` : `%${row.hitRate} · ${row.tested} deneme`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {report.repeatedBackfires.length > 0 && (
              <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-2.5">
                <span className="text-[9px] font-bold text-amber-400 block">Tekrarlanan ters sonuç</span>
                <p className="text-[8px] font-mono text-zinc-500 leading-relaxed mt-0.5">
                  {report.repeatedBackfires[0].title} iki veya daha fazla denemede ters gitti.
                  Bu tavsiyeyi otomatik doğru kabul etmek yerine bağlamını yeniden değerlendirmek gerekir.
                </p>
              </div>
            )}
          </>
        )}

        {onOpenLedger && (
          <button type="button" onClick={onOpenLedger} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 text-[9px] font-bold text-zinc-400 flex items-center justify-center gap-1.5">
            <BookCheck size={11} className="text-emerald-500" /> Karar Defterini Aç
          </button>
        )}
      </div>
    </section>
  );
});

CoachCalibrationCard.displayName = 'CoachCalibrationCard';
export default CoachCalibrationCard;
