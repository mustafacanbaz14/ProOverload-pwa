import React, { memo, useMemo, useState } from 'react';
import { Waves, Info } from 'lucide-react';
import {
  bandsFor, bandOf, findBand, stimulusAt, marginalGain, VOLUME_PHILOSOPHIES, findPhilosophy,
} from '../utils/doseResponse';
import { MUSCLE_GROUPS, MUSCLE_VOLUME_LANDMARKS } from '../utils/constants';

/**
 * Doz-yanıt kartı.
 *
 * Eğri tek çizgi değil ŞERİT çiziliyor ve bu kartın bütün mesajı bu: iki kanıt
 * hattı aynı hacimde farklı şeyler söylüyor, gerçek cevabın hangisine yakın
 * olduğunu kimse bilmiyor. Tek bir çizgi çizmek, olmayan bir uzlaşıyı varmış
 * gibi göstermek olurdu.
 *
 * Şeridin GENİŞLİĞİ de bilgi taşıyor: dar olduğu yerde (eşik civarı) iki hat
 * anlaşıyor, geniş olduğu yerde cevap bilinmiyor.
 */

const W = 300;
const H = 110;
const PAD = { l: 26, r: 8, t: 8, b: 18 };
const DEFAULT_LANDMARKS = Object.freeze({ mav: 14 });

const DoseResponseCard = memo(({
  muscle: initialMuscle = 'Göğüs',
  currentVolume = {},
  experienceLevel = 'intermediate',
  philosophy = 'balanced',
  restSeconds = 120,
  onOpenEvidence,
}) => {
  const [muscle, setMuscle] = useState(initialMuscle);

  const landmarks = MUSCLE_VOLUME_LANDMARKS[muscle] || DEFAULT_LANDMARKS;
  const bands = bandsFor(landmarks, experienceLevel);
  const mevcut = Math.round((currentVolume?.[muscle] || 0) * 4) / 4;

  const grafik = useMemo(() => {
    const xMax = Math.ceil(bands.contestedEnd * 1.25);
    const x = (v) => PAD.l + (v / xMax) * (W - PAD.l - PAD.r);
    const y = (p) => PAD.t + (1 - p) * (H - PAD.t - PAD.b);
    const adimlar = Array.from({ length: 61 }, (_, i) => (i / 60) * xMax);
    const noktalar = adimlar.map(v => ({ v, ...stimulusAt(v, landmarks, experienceLevel) }));

    const ust = noktalar.map(p => `${x(p.v)},${y(p.directTrial)}`).join(' ');
    const alt = [...noktalar].reverse().map(p => `${x(p.v)},${y(p.metaReg)}`).join(' ');

    return {
      xMax, x, y,
      band: `${ust} ${alt}`,
      upper: noktalar.map(p => `${x(p.v)},${y(p.directTrial)}`).join(' '),
      lower: noktalar.map(p => `${x(p.v)},${y(p.metaReg)}`).join(' '),
    };
  }, [bands.contestedEnd, landmarks, experienceLevel]);

  const pay = stimulusAt(mevcut, landmarks, experienceLevel);
  const marjinal = marginalGain(mevcut, landmarks, experienceLevel);
  const band = findBand(bandOf(mevcut, landmarks, experienceLevel));
  const felsefe = findPhilosophy(philosophy);
  const dortSetDakika = Math.round(4 * ((Math.max(30, restSeconds) + 40) / 60));
  const dortSonra = stimulusAt(mevcut + 4, landmarks, experienceLevel);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Waves size={12} className="mr-1.5 text-cyan-400" /> Doz-Yanıt Eğrisi
        </h4>
        <span className="text-[9px] font-mono text-zinc-400">{felsefe.short} felsefe</span>
      </div>

      <div className="p-3 space-y-2.5">
        <select
          value={muscle}
          onChange={(e) => setMuscle(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-cyan-400 font-mono outline-none"
        >
          {MUSCLE_GROUPS.map(m => (
            <option key={m} value={m}>
              {m}{currentVolume?.[m] > 0 ? ` — ${Math.round(currentVolume[m] * 4) / 4} kesirli set` : ''}
            </option>
          ))}
        </select>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
          aria-label={`${muscle} için hacim-uyaran eğrisi ve belirsizlik şeridi`}>
          {/* Bant sınırları */}
          {[
            { v: bands.threshold, c: '#f59e0b' },
            { v: bands.effectiveEnd, c: '#34d399' },
            { v: bands.contestedEnd, c: '#52525b' },
          ].map(g => (
            <line key={g.v} x1={grafik.x(g.v)} x2={grafik.x(g.v)} y1={PAD.t} y2={H - PAD.b}
              stroke={g.c} strokeWidth="1" strokeDasharray="2 3" opacity="0.55" />
          ))}

          {/* Belirsizlik şeridi */}
          <polygon points={grafik.band} fill="#22d3ee" opacity="0.16" />
          <polyline points={grafik.upper} fill="none" stroke="#34d399" strokeWidth="1.6" />
          <polyline points={grafik.lower} fill="none" stroke="#22d3ee" strokeWidth="1.6" strokeDasharray="4 2" />

          {/* Şu anki hacim */}
          {mevcut > 0 && (
            <>
              <line x1={grafik.x(mevcut)} x2={grafik.x(mevcut)} y1={PAD.t} y2={H - PAD.b}
                stroke="#fafafa" strokeWidth="1.2" />
              <circle cx={grafik.x(mevcut)} cy={grafik.y(pay.directTrial)} r="2.6" fill="#34d399" />
              <circle cx={grafik.x(mevcut)} cy={grafik.y(pay.metaReg)} r="2.6" fill="#22d3ee" />
            </>
          )}

          {/* Eksen etiketleri */}
          <text x="2" y={PAD.t + 6} className="fill-zinc-600" style={{ fontSize: 7 }}>%100</text>
          <text x="6" y={H - PAD.b} className="fill-zinc-600" style={{ fontSize: 7 }}>0</text>
          <text x={grafik.x(bands.threshold)} y={H - 6} textAnchor="middle" className="fill-zinc-600" style={{ fontSize: 7 }}>
            {bands.threshold}
          </text>
          <text x={grafik.x(bands.effectiveEnd)} y={H - 6} textAnchor="middle" className="fill-zinc-600" style={{ fontSize: 7 }}>
            {bands.effectiveEnd}
          </text>
          <text x={grafik.x(bands.contestedEnd)} y={H - 6} textAnchor="middle" className="fill-zinc-600" style={{ fontSize: 7 }}>
            {bands.contestedEnd}
          </text>
          <text x={W - PAD.r} y={H - 6} textAnchor="end" className="fill-zinc-700" style={{ fontSize: 7 }}>
            kesirli set/hafta
          </text>
        </svg>

        <div className="flex gap-3 text-[8px] font-mono text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> doğrudan denemeler
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> meta-regresyon
          </span>
        </div>

        {mevcut > 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[11px] font-bold text-zinc-200">{mevcut} kesirli set</span>
              <span className="text-[10px] font-mono text-zinc-400">{band.label}</span>
            </div>
            <p className="text-[10px] font-mono text-zinc-300 leading-relaxed">
              Tahmini uyaran payı <strong className="text-cyan-300">
                %{Math.round(pay.metaReg * 100)}–%{Math.round(pay.directTrial * 100)}
              </strong>. Aradaki fark belirsizliğin kendisi: alt sınır
              meta-regresyondan, üst sınır doğrudan denemelerden geliyor.
            </p>
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
              4 set daha eklemek payı %{Math.round(dortSonra.metaReg * 100)}–%{Math.round(dortSonra.directTrial * 100)}
              {' '}aralığına taşır ve haftana ~{dortSetDakika} dakika ekler.
              {/* Aralık küçükten büyüğe yazılıyor: hangi hattın marjinal
                  kazancının büyük olduğu eğrilerin kesişme noktasında yer
                  değiştiriyor ve sabit sırayla yazınca "%4.6–%3.5" gibi ters
                  okunan aralıklar çıkıyordu. */}
              {' '}Set başına kazanç %{Math.min(marjinal.metaReg, marjinal.directTrial)}
              –%{Math.max(marjinal.metaReg, marjinal.directTrial)}.
              {marjinal.directTrial < 1 && marjinal.metaReg < 2
                && ' İki hat da bu noktada ek setin karşılığının küçük olduğunda anlaşıyor.'}
            </p>
            <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">{band.note}</p>
          </div>
        ) : (
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
            Bu kas için son dört haftada kayıtlı set yok.
          </p>
        )}

        <button
          type="button"
          onClick={onOpenEvidence}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-left active:bg-zinc-900"
        >
          <span className="text-[9px] font-mono text-zinc-400 flex items-start gap-1.5 leading-relaxed">
            <Info size={10} className="text-cyan-500 shrink-0 mt-0.5" />
            Bu eğri iki çelişen kanıt hattından kuruldu. Hangi çalışmalar, hangi
            örneklem, hangi karşı görüş — kanıt defterinde yazıyor.
          </span>
        </button>
      </div>

      <div className="px-4 py-2 bg-zinc-950/40 border-t border-zinc-800">
        <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
          Felsefe seçimi hedefi kaydırıyor ama eşiği değiştirmiyor —
          {' '}{Object.values(VOLUME_PHILOSOPHIES).map(f => f.short).join(' / ')} arasında
          tartışma bandın nerede BİTTİĞİ değil, üstünde ne olduğu.
        </p>
      </div>
    </div>
  );
});

DoseResponseCard.displayName = 'DoseResponseCard';

export default DoseResponseCard;
