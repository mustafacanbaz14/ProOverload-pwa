import React, { memo, useState } from 'react';
import { Scale, AlertTriangle } from 'lucide-react';

/**
 * Hareket getirisi kartı.
 *
 * Varsayılan görünüm KAS BAZINDA: mutlak sıralama izolasyonları her zaman en
 * dibe yazıyor ve "lateral raise kötü hareket" gibi yanlış bir okuma üretiyor.
 * Aynı kası çalıştıran hareketler birbiriyle karşılaştırıldığında sıralama
 * gerçekten bir seçim sorusuna cevap veriyor.
 */

const ExerciseRoiCard = memo(({ report }) => {
  const [gorunum, setGorunum] = useState('muscle');
  if (!report?.hasData) return null;

  const gruplar = report.byMuscle;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Scale size={12} className="mr-1.5 text-amber-400" /> Hareket Getirisi
        </h4>
        <span className="text-[9px] font-mono text-zinc-400">
          {report.items.length} hareket · {report.totalSets} set
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1 p-2 bg-zinc-950/40">
        {[{ key: 'muscle', label: 'Kas Bazında' }, { key: 'all', label: 'Tümü' }].map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setGorunum(t.key)}
            className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-colors ${
              gorunum === t.key ? 'bg-amber-900/35 text-amber-300 border border-amber-800/60' : 'text-zinc-500 border border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {gorunum === 'muscle' && gruplar.length === 0 ? (
        <p className="px-4 py-3 text-[10px] font-mono text-zinc-500 leading-relaxed">
          Henüz aynı kasta karşılaştırılabilir iki hareket yok. Karşılaştırma
          için her hareketin en az dört seansı ve üç haftalık geçmişi gerekiyor.
        </p>
      ) : gorunum === 'muscle' ? (
        <div className="divide-y divide-zinc-800/70">
          {gruplar.map(g => (
            <div key={g.muscle} className="px-4 py-2.5">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">
                {g.muscle}
              </span>
              <div className="space-y-1.5">
                {g.items.map(r => (
                  <div key={r.name} className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] text-zinc-300 truncate min-w-0">
                      {r.underperforming && <AlertTriangle size={9} className="inline mr-1 text-amber-500" />}
                      {r.name}
                    </span>
                    <span className="text-[9px] font-mono shrink-0">
                      <span className="text-zinc-400">{r.sets} set · </span>
                      <span className={r.roi > 0 ? 'text-emerald-400' : 'text-red-400'}>%{r.roi}</span>
                      <span className="text-zinc-500"> /10 set</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/70">
          {report.items.map(r => (
            <div key={r.name} className="px-4 py-2">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[10px] font-bold text-zinc-200 truncate min-w-0">{r.name}</span>
                <span className={`text-[10px] font-mono shrink-0 ${r.roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  %{r.roi} /10 set
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-400 block">
                {r.muscle} · {r.sessions} seans · {r.from} → {r.to} kg (%{r.gainPct}) · {r.sets} set
              </span>
            </div>
          ))}
        </div>
      )}

      {report.underperformers.length > 0 && (
        <p className="px-4 py-2.5 text-[9px] font-mono text-amber-200/80 leading-relaxed border-t border-zinc-800 bg-amber-950/10">
          İşaretli hareketler aynı kasta en düşük getiriye sahip ve haftada üç
          setten fazla yiyorlar. Bu onları kötü hareket yapmıyor: eklem dostu
          oldukları ya da bir zayıf noktayı hedefledikleri için duruyor
          olabilirler. Bilinçli bir tercih değilse setlerinin bir kısmını
          taşımayı denemeye değer.
        </p>
      )}

      <p className="px-4 py-2 text-[9px] font-mono text-zinc-400 leading-relaxed bg-zinc-950/40">
        Ölçü: on set yatırım başına tahmini 1RM yüzdesi. Set, seansta harcanan
        paranın birimi. Son {report.windowDays} güne bakılıyor ve en az dört
        seans, yirmi bir gün isteniyor — yeni bir harekette ilk haftalarda
        görülen sıçrama kas kazancı değil teknik öğrenmesi.
      </p>
    </div>
  );
});

ExerciseRoiCard.displayName = 'ExerciseRoiCard';

export default ExerciseRoiCard;
