import React, { memo, useState } from 'react';
import { GraduationCap, ChevronDown } from 'lucide-react';

/**
 * Kas karnesi kartı.
 *
 * Nota değil SINIRLAYICI ETKENE odaklanıyor: "Göğüs C" bir şey söylemiyor,
 * "Göğüs C, sınırlayan hacim" ne yapılacağını söylüyor. Bu yüzden not küçük,
 * sınırlayan etken satırın gövdesinde.
 */

const GRADE_STYLE = {
  A: 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300',
  B: 'border-cyan-800/60 bg-cyan-950/25 text-cyan-300',
  C: 'border-amber-800/60 bg-amber-950/20 text-amber-300',
  D: 'border-orange-800/60 bg-orange-950/20 text-orange-300',
  E: 'border-red-800/60 bg-red-950/25 text-red-300',
};

const BAR_COLOR = { volume: 'bg-cyan-500', strength: 'bg-emerald-500', frequency: 'bg-violet-500' };

const MuscleScorecardCard = memo(({ report }) => {
  const [expanded, setExpanded] = useState(null);
  if (!report?.hasData) return null;

  const gosterilen = report.trained;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <GraduationCap size={12} className="mr-1.5 text-emerald-400" /> Kas Karnesi
        </h4>
        <span className="text-[9px] font-mono text-zinc-400">
          {report.weeks} hafta · ortalama {report.average}/100
        </span>
      </div>

      <div className="divide-y divide-zinc-800/70">
        {gosterilen.map(r => {
          const acik = expanded === r.muscle;
          return (
            <div key={r.muscle}>
              <button
                type="button"
                onClick={() => setExpanded(acik ? null : r.muscle)}
                className="w-full px-4 py-2.5 text-left active:bg-zinc-950/40"
              >
                <div className="flex items-center gap-2">
                  <span className={`shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center text-[11px] font-black ${GRADE_STYLE[r.grade.key]}`}>
                    {r.grade.label}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-zinc-200 block truncate">{r.muscle}</span>
                    <span className="text-[9px] font-mono text-zinc-400 block truncate">
                      sınırlayan: {r.limiting.label.toLowerCase()} · {r.weeklyVolume} set/hafta
                      {r.strengthChange !== null && ` · 1RM %${r.strengthChange > 0 ? '+' : ''}${r.strengthChange}`}
                    </span>
                  </span>
                  <ChevronDown size={13} className={`shrink-0 text-zinc-400 transition-transform ${acik ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {acik && (
                <div className="px-4 pb-3 -mt-0.5 space-y-2">
                  {r.components.map(c => (
                    <div key={c.key} className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] font-mono text-zinc-500">
                          {c.label}{c.estimated ? ' (ölçülemedi)' : ''}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">{c.score}/{c.max}</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-1 border border-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.estimated ? 'bg-zinc-600' : BAR_COLOR[c.key]}`}
                          style={{ width: `${Math.round(c.ratio * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-[9px] font-mono text-zinc-500 leading-relaxed pt-0.5">{r.advice}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {report.incidental?.length > 0 && (
        <p className="px-4 py-2 text-[9px] font-mono text-zinc-400 leading-relaxed border-t border-zinc-800">
          Notlanmayanlar: {report.incidental.join(', ')} — bu kaslar başka
          hareketlerin yan etkisiyle yük alıyor ama hiçbir seansta iki set
          almıyorlar, yani programda hedeflenmiyorlar.
        </p>
      )}

      <p className="px-4 py-2 text-[9px] font-mono text-zinc-400 leading-relaxed bg-zinc-950/40">
        Not üç bileşenden: hacim (40), tahmini 1RM ilerlemesi (40), sıklık (20).
        Notun kendisi kabaca bir özet; asıl bilgi sınırlayıcı etken — nota hangi
        bileşenin çektiği. İlerlemesi ölçülemeyen kaslara nötr puan veriliyor,
        sıfır değil: ölçemediğimiz için cezalandırmak yanlış olurdu.
      </p>
    </div>
  );
});

MuscleScorecardCard.displayName = 'MuscleScorecardCard';

export default MuscleScorecardCard;
