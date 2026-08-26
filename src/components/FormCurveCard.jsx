import React, { memo, useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { projectRest } from '../utils/formCurve';

/**
 * Fitness–yorgunluk (form) kartı.
 *
 * Antrenmanın etkisi iki zıt bileşenden oluşuyor ve ikisi farklı hızda
 * sönüyor: fitness yavaş birikip yavaş sönüyor, yorgunluk hızlı birikip
 * hızlı sönüyor. Form ikisinin farkı — ağır bir haftadan sonra performansın
 * neden düşük göründüğünü ve birkaç gün sonra neden beklenenden yükseğe
 * çıktığını açıklayan şey bu.
 *
 * Grafik SVG ile çiziliyor: üç eğri, dış bağımlılık yok.
 */
const FormCurveCard = memo(({ curve }) => {
  const tahmin = useMemo(() => (curve?.hasData ? projectRest(curve, { days: 7 }) : []), [curve]);

  if (!curve?.hasData) {
    return curve?.reason === 'insufficient' ? (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3.5">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center mb-1.5">
          <Activity size={12} className="mr-1.5 text-violet-400" /> Form Eğrisi
        </h4>
        <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
          Model için en az {curve.needed} günlük kayıt gerekiyor ({curve.dayCount} gün var).
          Fitness yavaş biriken bir bileşen; kısa bir pencereden okunamıyor.
        </p>
      </div>
    ) : null;
  }

  const gunler = curve.days;
  const w = 300;
  const h = 90;
  const degerler = gunler.flatMap(d => [d.fitness, d.fatigue, d.form]);
  const enAz = Math.min(...degerler, 0);
  const enCok = Math.max(...degerler, 1);
  const aralik = enCok - enAz || 1;
  const x = (i) => (i / Math.max(1, gunler.length - 1)) * w;
  const y = (v) => h - ((v - enAz) / aralik) * h;
  const cizgi = (alan) => gunler.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[alan]).toFixed(1)}`).join(' ');

  const yonIkon = curve.trend.direction === 'rising'
    ? <TrendingUp size={11} className="text-emerald-400" />
    : curve.trend.direction === 'falling'
      ? <TrendingDown size={11} className="text-amber-400" />
      : <Minus size={11} className="text-zinc-500" />;

  const pozitifGun = tahmin.find(d => d.form >= 0);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Activity size={12} className="mr-1.5 text-violet-400" /> Form Eğrisi
        </h4>
        <span className="text-[9px] font-mono text-zinc-600 flex items-center gap-1">
          {yonIkon} {curve.trend.delta > 0 ? '+' : ''}{curve.trend.delta} / hafta
        </span>
      </div>

      <div className="p-3 space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Fitness', value: curve.today.fitness, cls: 'text-cyan-300' },
            { label: 'Yorgunluk', value: curve.today.fatigue, cls: 'text-amber-300' },
            { label: 'Form', value: curve.today.form, cls: curve.today.form >= 0 ? 'text-emerald-300' : 'text-red-300' },
          ].map(k => (
            <div key={k.label} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 text-center">
              <strong className={`text-[13px] font-mono block ${k.cls}`}>{k.value}</strong>
              <span className="text-[8px] font-mono text-zinc-600">{k.label}</span>
            </div>
          ))}
        </div>

        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none" role="img" aria-label="Fitness, yorgunluk ve form eğrileri">
          <line x1="0" y1={y(0)} x2={w} y2={y(0)} stroke="#3f3f46" strokeWidth="1" strokeDasharray="3 3" />
          <path d={cizgi('fitness')} fill="none" stroke="#22d3ee" strokeWidth="1.5" />
          <path d={cizgi('fatigue')} fill="none" stroke="#fbbf24" strokeWidth="1.5" />
          <path d={cizgi('form')} fill="none" stroke="#34d399" strokeWidth="2" />
        </svg>

        <div className="flex justify-center gap-3">
          {[['Fitness', '#22d3ee'], ['Yorgunluk', '#fbbf24'], ['Form', '#34d399']].map(([ad, renk]) => (
            <span key={ad} className="text-[8px] font-mono text-zinc-500 flex items-center gap-1">
              <span className="w-2 h-0.5 rounded" style={{ background: renk }} /> {ad}
            </span>
          ))}
        </div>

        {curve.overreached ? (
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/15 p-2.5">
            <p className="text-[9px] font-mono text-amber-200/85 leading-relaxed">
              Yorgunluk fitness göstergesinin üstünde: performans olduğundan
              düşük görünecek. Yorgunluk çok daha hızlı söndüğü için kısa bir
              hafifleme net kazanç
              {pozitifGun ? ` — ${pozitifGun.dayOffset} gün hafif çalışmayla form artıya dönüyor.` : '.'}
            </p>
          </div>
        ) : curve.readyForHeavy && (
          <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/15 p-2.5">
            <p className="text-[9px] font-mono text-emerald-200/85 leading-relaxed">
              Form artıda ve yükseliyor: yorgunluk sönmüş, fitness durmuş.
              Rekor denemesi ya da ağır bir seans için uygun pencere.
            </p>
          </div>
        )}

        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
          Üstel sönümlü bir model (fitness yaklaşık altı hafta, yorgunluk bir
          hafta yarı ömürle sönüyor). Sabitler kişiye göre değişiyor, burada
          literatürün yaygın değerleri kullanılıyor — işe yarayan taraf mutlak
          sayı değil EĞİLİM. Deload'un neden işe yaradığının modeli bu.
        </p>
      </div>
    </div>
  );
});

FormCurveCard.displayName = 'FormCurveCard';

export default FormCurveCard;
