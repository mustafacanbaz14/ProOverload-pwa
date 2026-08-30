import React, { useMemo, memo } from 'react';
import { Flame, CalendarCheck, Info } from 'lucide-react';
import { buildConsistency, buildAdherence } from '../utils/consistency';
import { WEEKDAY_SHORT, formatDay } from '../utils/dates';

/**
 * Tutarlılık ve plan uyumu kartı.
 *
 * En belirleyici değişken burada: mükemmel kurulmuş bir programın vasat bir
 * programa üstünlüğü ancak yapılırsa var. Kart iki ayrı soruyu ayrı ayrı
 * gösteriyor — kaç haftadır kesintisiz çalışıyorum (seri) ve planladığımın
 * kaçını yaptım (uyum) — çünkü biri iyiyken diğeri kötü olabiliyor.
 */

// Isı haritası yoğunluğu: set sayısına göre dört kademe. Sürekli bir renk
// ölçeği yerine kademe kullanılıyor; küçük karelerde ara tonlar ayırt
// edilemiyor ve göz zaten "yaptım / yapmadım / çok yaptım" ayrımını arıyor.
const kutuRengi = (sets) => {
  if (!sets) return 'bg-zinc-900 border-zinc-800/70';
  if (sets < 12) return 'bg-cyan-950 border-cyan-900/60';
  if (sets < 22) return 'bg-cyan-800 border-cyan-700/60';
  return 'bg-cyan-500 border-cyan-400/60';
};

const ConsistencyCard = memo(({ workouts = [], planResult = null, today }) => {
  const bugun = today ? new Date(`${today}T12:00:00`) : new Date();

  const tutarlilik = useMemo(
    () => buildConsistency(workouts, { today: bugun, weeks: 12 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workouts, today]);

  const uyum = useMemo(
    () => buildAdherence(workouts, planResult, { today: bugun, weeks: 4 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workouts, planResult, today]);

  if (!tutarlilik.hasData) return null;

  // Izgarayı haftalık sütunlara böl: her sütun bir hafta, satırlar Pzt-Paz.
  const sutunlar = [];
  let mevcut = [];
  tutarlilik.days.forEach(g => {
    mevcut.push(g);
    // Pazar günü haftayı kapatıyor (dizi pazartesi başlangıçlı değilse de
    // sütunlar tutarlı kalsın diye gün numarasına bakılıyor).
    if (g.weekday === 0) { sutunlar.push(mevcut); mevcut = []; }
  });
  if (mevcut.length) sutunlar.push(mevcut);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <CalendarCheck size={12} className="mr-1.5 text-cyan-400" /> Tutarlılık
        </h4>
        <span className="text-[9px] font-mono text-zinc-400 shrink-0">son 12 hafta</span>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: tutarlilik.currentStreak, label: 'hafta seri', icon: <Flame size={12} className="text-amber-400" /> },
            { value: tutarlilik.averageDaysPerWeek, label: 'gün/hafta', icon: null },
            { value: uyum.hasData ? `%${uyum.percent}` : '—', label: 'plan uyumu', icon: null },
          ].map(k => (
            <div key={k.label} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 text-center">
              {k.icon && <div className="flex justify-center mb-0.5">{k.icon}</div>}
              <span className="text-sm font-mono font-bold text-zinc-100 block">{k.value}</span>
              <span className="text-[9px] font-mono text-zinc-500">{k.label}</span>
            </div>
          ))}
        </div>

        {/* Gün ızgarası */}
        <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1">
          <div className="flex flex-col gap-1 shrink-0 pr-0.5">
            {[1, 2, 3, 4, 5, 6, 0].map(d => (
              <span key={d} className="h-3 text-[7px] font-mono text-zinc-500 leading-3">
                {d % 2 === 1 ? WEEKDAY_SHORT[d] : ''}
              </span>
            ))}
          </div>
          {sutunlar.map((hafta, i) => (
            <div key={hafta[0]?.date || i} className="flex flex-col gap-1 shrink-0">
              {[1, 2, 3, 4, 5, 6, 0].map(gunNo => {
                const g = hafta.find(x => x.weekday === gunNo);
                if (!g) return <span key={gunNo} className="w-3 h-3" />;
                return (
                  <span
                    key={gunNo}
                    title={`${formatDay(g.date, 'short', { weekday: true })}${g.trained ? ` · ${g.sets} set` : ' · dinlenme'}`}
                    className={`w-3 h-3 rounded-[3px] border ${kutuRengi(g.sets)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {uyum.hasData && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-bold text-zinc-300">Plan uyumu</span>
              <span className="text-[9px] font-mono text-zinc-400">
                haftada {uyum.plannedPerWeek} gün planlı
              </span>
            </div>
            {uyum.weeks.map(w => (
              <div key={w.key} className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-zinc-500 w-[86px] shrink-0 truncate">
                  {w.label}{w.isCurrent ? ' ·' : ''}
                </span>
                <div className="flex-1 h-1.5 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${w.rate >= 1 ? 'bg-emerald-500' : w.rate >= 0.7 ? 'bg-cyan-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.round(w.rate * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-zinc-400 shrink-0 w-[34px] text-right">
                  {w.done}/{w.planned}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/60 flex items-start gap-2">
        <Info size={11} className="text-zinc-400 shrink-0 mt-0.5" />
        <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
          Seri HAFTA biriminde sayılıyor; içinde en az bir antrenman olan hafta
          tutulmuş sayılıyor ve içinde bulunduğun hafta seriyi kırmıyor. Uyum,
          gün gün eşleşmeye değil hafta içindeki sayıya bakıyor: pazartesi
          planlanan seansı salı yapmak program kaydırmaktır, uygulamamak değil.
          {uyum.hasData && uyum.percent < 70 && ' Uyum düşükken programı büyütmek işe yaramaz — yapılmayan set hacim değildir.'}
        </p>
      </div>
    </div>
  );
});

ConsistencyCard.displayName = 'ConsistencyCard';

export default ConsistencyCard;
