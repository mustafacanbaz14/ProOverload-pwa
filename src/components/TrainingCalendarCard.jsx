import React, { useState, useMemo, memo } from 'react';
import { CalendarDays, Flame, TrendingDown } from 'lucide-react';
import { buildTrainingCalendar, calendarMonthLabels, describeCalendarDay } from '../utils/trainingCalendar';

/**
 * Yıllık antrenman ızgarası.
 *
 * Tutarlılık kartı aynı veriyi sayıyla anlatıyor: haftada kaç gün, kaç hafta
 * üst üste. Doğru ama soyut. Izgara sayının söyleyemediğini gösteriyor —
 * nerede boşluk var, hangi ay çöktü, aradan sonra toparlanmak ne kadar sürdü.
 */

const GUN_ETIKET = ['Pzt', '', 'Çar', '', 'Cum', '', 'Paz'];

// Yoğunluk renkleri: etkili set sayısına göre beş basamak. Renk körlüğüne
// karşı yalnızca tona değil parlaklığa da yaslanıyor.
const LEVEL_CLASS = [
  'bg-zinc-900 border-zinc-800',
  'bg-cyan-950 border-cyan-900',
  'bg-cyan-800 border-cyan-700',
  'bg-cyan-600 border-cyan-500',
  'bg-cyan-400 border-cyan-300',
];

const TrainingCalendarCard = memo(({ workouts = [], weeks = 26, today }) => {
  const [secili, setSecili] = useState(null);

  const takvim = useMemo(
    () => buildTrainingCalendar(workouts, { weeks, today: today || new Date() }),
    [workouts, weeks, today]);
  const aylar = useMemo(() => calendarMonthLabels(takvim), [takvim]);

  if (!takvim.hasData) return null;

  const detay = describeCalendarDay(secili);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <CalendarDays size={12} className="mr-1.5 text-cyan-400" /> Antrenman Takvimi
        </h4>
        <span className="text-[9px] font-mono text-zinc-400">son {weeks} hafta</span>
      </div>

      <div className="p-3 space-y-2">
        {/* Izgara yatay kayıyor: dar ekranda 26 sütunu sıkıştırmak kareleri
            dokunulamaz hale getiriyordu. */}
        <div className="overflow-x-auto hide-scrollbar -mx-1 px-1">
          <div className="inline-block min-w-full">
            <div className="flex gap-[3px] mb-1 ml-7">
              {takvim.weeks.map((_, i) => {
                const ay = aylar.find(a => a.index === i);
                return (
                  <span key={i} className="w-[11px] text-[7px] font-mono text-zinc-400 shrink-0">
                    {ay?.label || ''}
                  </span>
                );
              })}
            </div>
            <div className="flex gap-[3px]">
              <div className="flex flex-col gap-[3px] mr-1 shrink-0">
                {GUN_ETIKET.map((g, i) => (
                  <span key={i} className="h-[11px] w-6 text-[7px] font-mono text-zinc-400 leading-[11px]">{g}</span>
                ))}
              </div>
              {takvim.weeks.map((hafta, hi) => (
                <div key={hi} className="flex flex-col gap-[3px] shrink-0">
                  {hafta.map(gun => (
                    <button
                      key={gun.date}
                      onClick={() => setSecili(gun.sessions > 0 ? gun : null)}
                      disabled={gun.sessions === 0}
                      title={gun.sessions > 0 ? `${gun.date} · ${gun.sets} set` : gun.date}
                      aria-label={gun.sessions > 0 ? `${gun.date}, ${gun.sets} set` : undefined}
                      className={`w-[11px] h-[11px] rounded-[2px] border ${gun.future ? 'bg-transparent border-zinc-900' : LEVEL_CLASS[gun.level]} ${gun.today ? 'ring-1 ring-amber-500' : ''} ${secili?.date === gun.date ? 'ring-1 ring-zinc-100' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1">
          <span className="text-[7px] font-mono text-zinc-400 mr-1">az</span>
          {LEVEL_CLASS.map((c, i) => (
            <span key={i} className={`w-[9px] h-[9px] rounded-[2px] border ${c}`} />
          ))}
          <span className="text-[7px] font-mono text-zinc-400 ml-1">çok</span>
        </div>

        {detay ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
            <span className="text-[10px] font-bold text-zinc-200 block">{detay.label}</span>
            <span className="text-[9px] font-mono text-zinc-500">
              {detay.sets} etkili set · {detay.level}
              {detay.names.length > 0 ? ` · ${detay.names.join(', ')}` : ''}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 text-center">
              <strong className="text-[12px] font-mono text-zinc-100 block">{takvim.totalDays}</strong>
              <span className="text-[8px] font-mono text-zinc-400">antrenman günü</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 text-center">
              <Flame size={10} className="text-amber-400 mx-auto" />
              <strong className="text-[12px] font-mono text-zinc-100 block">{takvim.streakWeeks}</strong>
              <span className="text-[8px] font-mono text-zinc-400">hafta seri</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 text-center">
              <TrendingDown size={10} className="text-zinc-500 mx-auto" />
              <strong className="text-[12px] font-mono text-zinc-100 block">{takvim.longestGap}</strong>
              <span className="text-[8px] font-mono text-zinc-400">gün en uzun ara</span>
            </div>
          </div>
        )}

        <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
          Renk yoğunluğu ETKİLİ SET sayısını gösteriyor, seans sayısını değil:
          yirmi dakikalık tamamlama seansıyla iki saatlik bacak gününü aynı
          renkte göstermek asıl bilgiyi silerdi. Bir güne dokun, ayrıntısı çıksın.
        </p>
      </div>
    </div>
  );
});

TrainingCalendarCard.displayName = 'TrainingCalendarCard';

export default TrainingCalendarCard;
