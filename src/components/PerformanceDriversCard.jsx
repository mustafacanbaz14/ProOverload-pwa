import React, { memo } from 'react';
import { Activity, Info } from 'lucide-react';

/**
 * Performans sürücüleri kartı.
 *
 * Korelasyon katsayısı ekranda gösterilmiyor — kimseye bir şey ifade etmiyor.
 * Gösterilen şey anlaşılır olan: en yüksek üçte birlik dilimde seanslar
 * ortalama ne kadar iyi geçti. Katsayı yalnızca sıralama için kullanılıyor.
 */

const STRENGTH_STYLE = {
  strong: 'text-emerald-400',
  moderate: 'text-cyan-400',
  weak: 'text-zinc-500',
  none: 'text-zinc-600',
};

const CONFIDENCE_LABEL = { high: 'sağlam veri', medium: 'orta veri', low: 'az veri' };

// Dilimin iki ucu aynıysa aralık yazmak ("3–3 gün") okunmuyor; tek değer daha
// doğru çünkü o dilimde gerçekten tek bir değer var.
const aralik = ([alt, ust], birim) => (alt === ust ? `${alt}${birim}` : `${alt}–${ust}${birim}`);

const PerformanceDriversCard = memo(({ report }) => {
  if (!report?.hasData) return null;

  const olculen = report.drivers.filter(d => d.strength.key !== 'none');
  const sessiz = report.drivers.filter(d => d.strength.key === 'none');

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Activity size={12} className="mr-1.5 text-cyan-400" /> Performans Sürücüleri
        </h4>
        <span className="text-[9px] font-mono text-zinc-600">{report.sessions} puanlanmış seans</span>
      </div>

      {olculen.length === 0 ? (
        <p className="px-4 py-3 text-[10px] font-mono text-zinc-500 leading-relaxed">
          Ölçülen hiçbir sinyal seans kalitenle birlikte hareket etmiyor. Bu iyi
          bir haber olabilir (performansın bu değişkenlere karşı dayanıklı) ya da
          henüz yeterince değişken veri olmadığı anlamına gelebilir.
        </p>
      ) : (
        <div className="divide-y divide-zinc-800/70">
          {olculen.map(d => (
            <div key={d.key} className="px-4 py-2.5 space-y-1.5">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0">{d.label}</span>
                <span className={`text-[10px] font-mono shrink-0 ${STRENGTH_STYLE[d.strength.key]}`}>
                  {d.spread > 0 ? '+' : ''}{d.spread} puan
                </span>
              </div>
              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                {aralik(d.lowRange, d.unit)} için performans %{d.lowPerformance},
                {' '}{aralik(d.highRange, d.unit)} için %{d.highPerformance}.
              </p>
              <span className="text-[8px] font-mono text-zinc-600">
                {d.samples} seans · {CONFIDENCE_LABEL[d.confidence]} · ilişki {d.strength.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {report.threshold && (
        <div className="px-4 py-2.5 border-t border-zinc-800 bg-cyan-950/10">
          <span className="text-[10px] font-bold text-cyan-300 block">
            Kişisel eşiğin: hazır oluşluk {report.threshold.cut}
          </span>
          <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1">
            Bu değerin altında ({report.threshold.belowCount} seans) performansın
            ortalama %{report.threshold.below}; üstünde ({report.threshold.aboveCount} seans)
            %{report.threshold.above}. Kesme noktası bir kuraldan değil senin
            verinden çıktı — iki tarafta da yeterli seans kalacak şekilde farkı
            en büyüten yer.
          </p>
        </div>
      )}

      {sessiz.length > 0 && (
        <p className="px-4 py-2 text-[9px] font-mono text-zinc-600 leading-relaxed border-t border-zinc-800">
          Ölçüldü ama belirgin bir ilişki bulunmadı: {sessiz.map(d => d.label.toLowerCase()).join(', ')}.
        </p>
      )}

      <p className="px-4 py-2 text-[9px] font-mono text-zinc-600 leading-relaxed bg-zinc-950/40">
        <Info size={9} className="inline mr-1" />
        Her seans KENDİ hareketlerinin son beş seansına göre puanlanıyor, yani
        bacak günüyle kol günü aynı ölçekte. Bunlar neden-sonuç değil birlikte
        hareket etme: iyi uyunan gün genellikle stresin de düşük olduğu gündür
        ve hangisinin farkı ürettiği bu veriyle ayrılamaz. Uzun vadeli bir
        ilerleme eğilimi de zamanla artan her sinyale bulaşabiliyor.
      </p>
    </div>
  );
});

PerformanceDriversCard.displayName = 'PerformanceDriversCard';

export default PerformanceDriversCard;
