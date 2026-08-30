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
    <div role="dialog" aria-modal="true" aria-labelledby="year-review-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[92] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-md max-h-[88dvh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md shrink-0">
          <h3 id="year-review-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest flex items-center">
            <Trophy size={16} className="mr-2 text-yellow-400" /> Yıl Özeti & Başarılar
          </h3>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">
          {!review?.hasData ? (
            <p className="text-[10px] font-mono text-zinc-400 leading-relaxed bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 text-center">
              Son on iki ayda kayıtlı antrenman bulunamadı.
            </p>
          ) : (
            <>
              <div className="luxury-feature-card rounded-3xl border border-yellow-800/40 bg-gradient-to-br from-yellow-950/30 via-zinc-900/90 to-zinc-950 p-5 text-center shadow-lg shadow-yellow-950/20">
                <span className="text-[9px] font-mono text-zinc-400 block tracking-wider uppercase font-bold">{review.label}</span>
                <strong className="text-4xl font-mono font-black text-yellow-300 block mt-1 tracking-tight">{review.sessions}</strong>
                <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block">Tamamlanan Antrenman</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: <Layers size={13} className="text-cyan-400" />, v: bicim(review.sets), l: 'etkili set' },
                  { icon: <Flame size={13} className="text-red-400" />, v: `${bicim(review.tonnage)} kg`, l: 'toplam tonaj' },
                  { icon: <Clock size={13} className="text-emerald-400" />, v: `${review.hours} sa`, l: 'salonda geçen' },
                  { icon: <Calendar size={13} className="text-violet-400" />, v: review.streakWeeks, l: 'hafta seri' },
                ].map(k => (
                  <div key={k.l} className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl py-3 px-2 text-center shadow-sm">
                    <div className="flex justify-center mb-1.5">{k.icon}</div>
                    <strong className="text-[13px] font-mono font-black text-zinc-100 block tracking-tight">{k.v}</strong>
                    <span className="text-[8px] font-mono text-zinc-500 block mt-0.5">{k.l}</span>
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
                        <span className="text-zinc-400">{x.from} → </span>
                        <strong className="text-emerald-300">{x.to} kg</strong>
                        <span className="text-emerald-500"> (%{x.percent})</span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="px-4 py-2 text-[9px] font-mono text-zinc-400 leading-relaxed bg-zinc-950/40">
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
                        <span className="text-[9px] font-mono text-zinc-400">{deger}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[9px] font-mono text-zinc-400 leading-relaxed px-1">
              Bütün sayılar kendi kayıtlarından; tahmin yok. Tonaj yalnızca
              çalışma setlerinden hesaplanıyor, ısınma sayılmıyor.
            </p>
          </>
        )}
      </div>
    </div>
  </div>
  );
});

YearReviewModal.displayName = 'YearReviewModal';

export default YearReviewModal;
