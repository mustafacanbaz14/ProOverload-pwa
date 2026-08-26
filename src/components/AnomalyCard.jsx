import React, { memo } from 'react';
import { Radar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Sessiz sinyaller kartı.
 *
 * Bulgu yokken kart GİZLENMİYOR, "sessiz" durumu gösteriliyor. Sebebi:
 * kullanıcının bir şey bulunmadığını bilmesi, kartın var olduğunu hiç
 * bilmemesinden değerli — ve sistemin çalıştığının kanıtı.
 */

const AnomalyCard = memo(({ report }) => {
  if (!report?.hasData) return null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Radar size={12} className="mr-1.5 text-cyan-400" /> Sessiz Sinyaller
        </h4>
        <span className="text-[9px] font-mono text-zinc-600">{report.checked} seri tarandı</span>
      </div>

      {report.quiet ? (
        <p className="px-4 py-3 text-[10px] font-mono text-emerald-400/90 leading-relaxed">
          Taranan {report.checked} serinin hiçbirinde kendi geçmişine göre sıra
          dışı bir değişim yok. Bu, her şeyin iyi gittiği anlamına gelmiyor —
          yalnızca ani bir kayma olmadığı anlamına geliyor. Düzenli bir eğilim
          (sürekli artan tonaj gibi) burada uyarı üretmez, çünkü aranan şey
          eğilim değil eğilimden sapma.
        </p>
      ) : (
        <div className="divide-y divide-zinc-800/70">
          {report.findings.map(f => {
            const kotu = f.favorable === false;
            return (
              <div key={f.key} className="px-4 py-2.5 space-y-1">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0 flex items-center gap-1">
                    {f.direction === 'up'
                      ? <ArrowUpRight size={11} className={kotu ? 'text-amber-400' : 'text-emerald-400'} />
                      : <ArrowDownRight size={11} className={kotu ? 'text-amber-400' : 'text-emerald-400'} />}
                    {f.label}
                  </span>
                  <span className={`text-[10px] font-mono shrink-0 ${kotu ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {f.changePct > 0 ? '+' : ''}%{f.changePct}
                  </span>
                </div>
                <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                  {f.baseline}{f.unit} → {f.current}{f.unit} · {f.points} ölçüm ·
                  {' '}{f.severity === 'high' ? 'belirgin sapma' : 'sapma'}
                </p>
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">{f.note}</p>
              </div>
            );
          })}
        </div>
      )}

      {report.pending.length > 0 && (
        <p className="px-4 py-2 text-[9px] font-mono text-zinc-600 leading-relaxed border-t border-zinc-800">
          Henüz taranamayan seriler ({report.pending.map(s => s.label.toLowerCase()).join(', ')}):
          dokuz ölçümün altında "normal" diye bir şey tanımlanamıyor.
        </p>
      )}

      <p className="px-4 py-2 text-[9px] font-mono text-zinc-600 leading-relaxed bg-zinc-950/40">
        Uygulamadaki diğer bütün uyarılar kural tabanlı: birinin önceden
        düşünüp yazması gerekiyor. Bu kart kural yazmıyor, DEĞİŞİM arıyor —
        son ölçümler kendi geçmişinin normal dalgalanmasına göre sıra dışı mı.
        Ortalama yerine ortanca kullanılıyor ki tek bir rekor seansı ya da
        hasta geçirilen bir hafta sonucu bozmasın. Bulgular teşhis değil:
        aynı düşüşü yeni bir programa geçmek de üretir.
      </p>
    </div>
  );
});

AnomalyCard.displayName = 'AnomalyCard';

export default AnomalyCard;
