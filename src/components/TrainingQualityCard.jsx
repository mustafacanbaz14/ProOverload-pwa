import React, { useMemo, memo } from 'react';
import { Flame, RefreshCw, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { buildEffortDistribution } from '../utils/effortDistribution';
import { buildRotationReport } from '../utils/exerciseRotation';

/**
 * Şiddet dağılımı ve hareket rotasyonu.
 *
 * İkisi bir arada duruyor çünkü ikisi de aynı boşluğu dolduruyor: hacim
 * tablosu "kaç set" diyor, bu kart o setlerin NASIL ve NE KADAR SÜREDİR
 * yapıldığını söylüyor.
 */

const SEVERITY = {
  warn: { text: 'text-amber-300', icon: AlertTriangle },
  info: { text: 'text-zinc-300', icon: Info },
};

const TrainingQualityCard = memo(({ workouts = [], customExercises = [], resolveLoad = null }) => {
  const efor = useMemo(
    () => buildEffortDistribution(workouts, { customExercises }),
    [workouts, customExercises]);

  const rotasyon = useMemo(
    () => buildRotationReport(workouts, { customExercises, resolveLoad }),
    [workouts, customExercises, resolveLoad]);

  if (!efor.hasData && !rotasyon.hasData) return null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Flame size={12} className="mr-1.5 text-amber-400" /> Şiddet ve Rotasyon
        </h4>
        <span className="text-[9px] font-mono text-zinc-600 shrink-0">son {efor.days} gün</span>
      </div>

      {/* RIR dağılımı */}
      <div className="px-4 py-3 border-b border-zinc-800/70">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-[10px] font-bold text-zinc-300">RIR dağılımı</span>
          <span className="text-[9px] font-mono text-zinc-600">
            {efor.total} set{efor.withoutRir > 0 ? ` · ${efor.withoutRir} RIR'siz` : ''}
          </span>
        </div>

        {efor.total > 0 ? (
          <>
            <div className="flex h-2 rounded-full overflow-hidden border border-zinc-800">
              {efor.buckets.map(b => (b.share > 0 ? (
                <div key={b.key} title={`${b.label} · %${b.share}`} className={b.bar} style={{ width: `${b.share}%` }} />
              ) : null))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              {efor.buckets.map(b => (
                <span key={b.key} className="text-[9px] font-mono text-zinc-500" title={b.hint}>
                  <span className={b.color}>●</span> {b.label} %{b.share}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
            RIR girilmiş çalışma seti yok. Dağılım, RIR alanı doldurulan setlerden
            çıkıyor; boş bir alanı herhangi bir kovaya koymak olmayan bir veriden
            sonuç üretmek olurdu.
          </p>
        )}

        {!efor.hasData && efor.total > 0 && (
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed mt-1.5">
            Yorum için en az {efor.needed} set gerekiyor ({efor.total} var).
          </p>
        )}

        {efor.findings.length > 0 ? (
          <div className="space-y-1.5 mt-2">
            {efor.findings.map(f => {
              const stil = SEVERITY[f.severity] || SEVERITY.info;
              const Icon = stil.icon;
              return (
                <p key={f.key} className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                  <Icon size={10} className={`inline ${stil.text} mr-1`} />
                  <strong className={stil.text}>{f.title}.</strong> {f.detail}
                </p>
              );
            })}
          </div>
        ) : efor.hasData && (
          <p className="text-[9px] font-mono text-emerald-300/90 leading-relaxed mt-2 flex items-start gap-1.5">
            <CheckCircle2 size={10} className="shrink-0 mt-0.5" />
            Setlerin çoğu RIR 1-3 bandında — hipertrofide en iyi getiriyi veren
            aralık. Şiddet tarafında düzeltilecek bir şey yok.
          </p>
        )}
      </div>

      {/* Rotasyon */}
      <div className="px-4 py-3">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-[10px] font-bold text-zinc-300 flex items-center">
            <RefreshCw size={11} className="mr-1.5 text-zinc-500" /> Hareket yaşı
          </span>
          <span className="text-[9px] font-mono text-zinc-600">{rotasyon.rows.length} hareket</span>
        </div>

        {rotasyon.candidates.length > 0 ? (
          <div className="space-y-1.5">
            {rotasyon.candidates.slice(0, 3).map(r => (
              <div key={r.name} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-[10px] font-bold text-amber-300 truncate min-w-0">{r.name}</span>
                  <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                    {r.weeks} hafta · {r.sessions} seans
                  </span>
                </div>
                <p className="text-[9px] font-mono text-zinc-500 leading-relaxed mt-1">
                  Son 4 seansın en iyisi {r.bestRecent} kg, öncesinde {r.bestEarlier} kg
                  {' '}({r.changePercent > 0 ? '+' : ''}{r.changePercent}%). Aynı kası benzer açıdan
                  çalıştıran bir varyanta geçmek birkaç blok daha ilerleme açabilir.
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
            {rotasyon.hasData
              ? `Rotasyon adayı yok. Öneri yalnızca hareket ${rotasyon.longTenureWeeks} haftadan eski VE ilerleme durmuşsa çıkıyor; hareket değiştirmenin bedeli var (teknik oturana kadar birkaç seans, yük karşılaştırılabilirliğinin bozulması), o yüzden tek başına eskilik yeterli değil.`
              : 'Eğilim okunacak kadar seans yok.'}
          </p>
        )}
      </div>
    </div>
  );
});

TrainingQualityCard.displayName = 'TrainingQualityCard';

export default TrainingQualityCard;
