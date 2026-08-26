import React, { memo } from 'react';
import { X, Trophy, Flame, Clock, Layers, TrendingUp, Calendar } from 'lucide-react';

/**
 * Yıl özeti.
 *
 * Uygulama her şeyi hafta ve blok ölçeğinde anlatıyordu; en uzun pencere on
 * iki hafta. Ama bir yıl çalışmış birinin merak ettiği şey o ölçekte değil.
 * Sayılar zaten kayıtta duruyordu, hiçbir yerde toplanmıyordu.
 *
 * Takvim yılı değil, bugünden geriye on iki ay: ocak ayında "bu yıl 3 seans
 * yaptın" demek anlamsız olurdu.
 */
const YearReviewModal = memo(({ isOpen, onClose, review }) => {
  if (!isOpen) return null;

  const bicim = (n) => new Intl.NumberFormat('tr-TR').format(Math.round(n));

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[92] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Trophy size={15} className="mr-2 text-yellow-400" /> Yıl Özeti
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">
        {!review?.hasData ? (
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            Son on iki ayda kayıtlı antrenman yok.
          </p>
        ) : (
          <>
            <div className="rounded-2xl border border-yellow-900/40 bg-gradient-to-br from-yellow-950/25 to-zinc-900 p-4 text-center">
              <span className="text-[9px] font-mono text-zinc-500 block">{review.label}</span>
              <strong className="text-3xl font-mono text-yellow-300 block mt-1">{review.sessions}</strong>
              <span className="text-[10px] font-mono text-zinc-400">antrenman</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <Layers size={12} className="text-cyan-400" />, v: bicim(review.sets), l: 'etkili set' },
                { icon: <Flame size={12} className="text-red-400" />, v: `${bicim(review.tonnage)} kg`, l: 'toplam tonaj' },
                { icon: <Clock size={12} className="text-emerald-400" />, v: `${review.hours} sa`, l: 'salonda geçen' },
                { icon: <Calendar size={12} className="text-violet-400" />, v: review.streakWeeks, l: 'hafta seri' },
              ].map(k => (
                <div key={k.l} className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-center">
                  <div className="flex justify-center mb-1">{k.icon}</div>
                  <strong className="text-[13px] font-mono text-zinc-100 block">{k.v}</strong>
                  <span className="text-[8px] font-mono text-zinc-600">{k.l}</span>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-1">
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">Özet</span>
              <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
                {review.activeWeeks} farklı haftada antrenman yaptın, haftada
                ortalama {review.averagePerWeek} seans. {review.exercises} farklı
                hareket kullandın{review.newExercises > 0 && `, ${review.newExercises} tanesi bu dönemde ilk kez`}.
                {review.busiestMonth && ` En yoğun ay ${review.busiestMonth.month} (${review.busiestMonth.sessions} seans).`}
              </p>
            </div>

            {review.mostImproved.length > 0 && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/60">
                  <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
                    <TrendingUp size={11} className="mr-1.5 text-emerald-400" /> En Çok Gelişen
                  </h4>
                </div>
                <div className="divide-y divide-zinc-800/70">
                  {review.mostImproved.map(x => (
                    <div key={x.name} className="px-4 py-1.5 flex justify-between items-center gap-2">
                      <span className="text-[10px] text-zinc-300 truncate min-w-0">{x.name}</span>
                      <span className="text-[10px] font-mono shrink-0">
                        <span className="text-zinc-600">{x.from} → </span>
                        <strong className="text-emerald-300">{x.to} kg</strong>
                        <span className="text-emerald-500"> (%{x.percent})</span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="px-4 py-2 text-[9px] font-mono text-zinc-600 leading-relaxed bg-zinc-950/40">
                  Sıralama ORANA göre: 20 kiloluk bir hareketin 5 kg artması,
                  150 kiloluk bir hareketin 5 kg artmasından çok daha büyük bir
                  gelişim. Mutlak farkla sıralasaydık ağır hareketler her zaman
                  kazanırdı.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {[
                { title: 'En Çok Yapılan', rows: review.topExercises.map(x => [x.name, `${x.sets} set`]) },
                { title: 'En Çok Hacim', rows: review.topMuscles.map(x => [x.muscle, `${x.volume} set`]) },
              ].map(blok => (
                <div key={blok.title} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/60">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{blok.title}</span>
                  </div>
                  <div className="divide-y divide-zinc-800/70">
                    {blok.rows.map(([ad, deger]) => (
                      <div key={ad} className="px-3 py-1.5">
                        <span className="text-[9px] text-zinc-300 block truncate">{ad}</span>
                        <span className="text-[9px] font-mono text-zinc-600">{deger}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
              Bütün sayılar kendi kayıtlarından; tahmin yok. Tonaj yalnızca
              çalışma setlerinden hesaplanıyor, ısınma sayılmıyor.
            </p>
          </>
        )}
      </div>
    </div>
  );
});

YearReviewModal.displayName = 'YearReviewModal';

export default YearReviewModal;
