import React, { memo, useMemo, useState } from 'react';
import {
  BarChart3, Check, ChevronDown, Copy, Database, Dumbbell,
  HeartPulse, Scale, Utensils,
} from 'lucide-react';
import {
  ANALYSIS_WINDOWS, buildTrendComparison, trendComparisonText,
} from '../utils/trendComparison';

const CATEGORY = {
  training: { label: 'Antrenman', icon: Dumbbell, color: 'text-cyan-400' },
  recovery: { label: 'Toparlanma', icon: HeartPulse, color: 'text-indigo-400' },
  nutrition: { label: 'Beslenme', icon: Utensils, color: 'text-emerald-400' },
  body: { label: 'Vücut', icon: Scale, color: 'text-amber-400' },
};

const deltaTone = (row) => {
  if (!row.meaningful) return 'text-zinc-400';
  if (row.favorable === true) return 'text-emerald-400';
  if (row.favorable === false) return 'text-amber-400';
  return 'text-cyan-400';
};

const formatValue = (value, unit) => value === null || value === undefined ? '—' : `${value}${unit}`;

const PeriodComparisonCard = memo(({
  workouts = [], metrics = [], nutrition = [], sleepScores = {}, restingHrLog = [],
  resolveLoad = null, today,
}) => {
  const [days, setDays] = useState(28);
  const [category, setCategory] = useState('training');
  const [meaningfulOnly, setMeaningfulOnly] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);
  const [copied, setCopied] = useState(false);

  const report = useMemo(() => buildTrendComparison({
    workouts, metrics, nutrition, sleepScores, restingHrLog, resolveLoad, days, today,
  }), [workouts, metrics, nutrition, sleepScores, restingHrLog, resolveLoad, days, today]);

  const rows = (report.byCategory[category] || []).filter(row => !meaningfulOnly || row.meaningful);
  const rhythmMax = Math.max(1, ...report.rhythm.map(row => row.count));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(trendComparisonText(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 bg-gradient-to-br from-violet-950/20 to-zinc-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[8px] font-mono text-violet-400 uppercase tracking-[0.18em] flex items-center gap-1.5">
              <BarChart3 size={11} /> Eş Dönem Analizi
            </span>
            <h3 className="text-[12px] font-black text-zinc-100 mt-1">Şimdi ile aynı uzunluktaki önceki dönemi karşılaştır</h3>
          </div>
          <button type="button" onClick={copy} aria-label="Dönem analizini kopyala" className="p-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-500 shrink-0">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {ANALYSIS_WINDOWS.map(window => (
            <button
              key={window}
              type="button"
              onClick={() => setDays(window)}
              className={`rounded-xl border py-2 text-[9px] font-bold ${days === window ? 'border-violet-600 bg-violet-950/35 text-violet-300' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
            >
              {window} GÜN
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 text-center">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2">
            <span className="text-[8px] font-mono text-zinc-400 block">ŞİMDİ</span>
            <strong className="text-[9px] font-mono text-zinc-300">{report.ranges.current.label}</strong>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2">
            <span className="text-[8px] font-mono text-zinc-400 block">ÖNCEKİ</span>
            <strong className="text-[9px] font-mono text-zinc-300">{report.ranges.previous.label}</strong>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowCoverage(v => !v)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-left"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-1.5">
              <Database size={11} className="text-violet-400" /> Veri kapsamı %{report.coverage.score}
            </span>
            <ChevronDown size={11} className={`text-zinc-400 transition-transform ${showCoverage ? 'rotate-180' : ''}`} />
          </div>
          <div className="h-1 rounded-full bg-zinc-900 overflow-hidden mt-1.5">
            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${report.coverage.score}%` }} />
          </div>
        </button>

        {showCoverage && (
          <div className="grid grid-cols-2 gap-1.5">
            {report.coverage.rows.map(row => (
              <div key={row.key} className="rounded-xl border border-zinc-800 bg-zinc-950 p-2">
                <div className="flex justify-between gap-1 text-[8px] font-mono">
                  <span className="text-zinc-500">{row.label}</span>
                  <strong className={row.percent >= 60 ? 'text-emerald-400' : 'text-amber-400'}>%{row.percent}</strong>
                </div>
                <span className="text-[7px] font-mono text-zinc-500">{row.have}/{row.need} kayıt</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-1">
          {Object.entries(CATEGORY).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`rounded-xl border py-2 flex flex-col items-center gap-1 ${category === key ? 'border-cyan-700 bg-cyan-950/25' : 'border-zinc-800 bg-zinc-950'}`}
              >
                <Icon size={12} className={category === key ? meta.color : 'text-zinc-400'} />
                <span className={`text-[7px] font-bold ${category === key ? 'text-zinc-300' : 'text-zinc-400'}`}>{meta.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setMeaningfulOnly(v => !v)}
          className={`w-full rounded-xl border py-2 text-[8px] font-bold ${meaningfulOnly ? 'border-cyan-700 bg-cyan-950/25 text-cyan-300' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
        >
          {meaningfulOnly ? 'YALNIZCA ANLAMLI DEĞİŞİMLER' : 'TÜM ÖLÇÜLER'}
        </button>

        <div className="space-y-1.5">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-[9px] font-mono text-zinc-400 text-center">
              Bu başlıkta pratik eşiği aşan değişim yok.
            </div>
          ) : rows.map(row => (
            <div key={row.key} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-zinc-300 block truncate">{row.label}</span>
                  <span className="text-[8px] font-mono text-zinc-400">
                    önceki {formatValue(row.previous, row.unit)}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <strong className="text-[12px] font-mono text-zinc-100 block">{formatValue(row.current, row.unit)}</strong>
                  {row.available && (
                    <span className={`text-[8px] font-mono ${deltaTone(row)}`}>
                      {row.delta > 0 ? '+' : ''}{row.delta}{row.unit}
                      {row.deltaPct !== null && ` · %${row.deltaPct > 0 ? '+' : ''}${row.deltaPct}`}
                    </span>
                  )}
                </div>
              </div>
              {!row.available && <p className="text-[8px] font-mono text-zinc-500 mt-1">İki dönemde de karşılaştırılabilir kayıt gerekiyor.</p>}
            </div>
          ))}
        </div>

        {category === 'training' && report.rhythm.some(row => row.count > 0) && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[9px] font-bold text-zinc-400">Antrenman Ritmi</span>
              <span className="text-[7px] font-mono text-zinc-500">seansların günlere dağılımı</span>
            </div>
            <div className="grid grid-cols-7 gap-1 h-16 items-end">
              {report.rhythm.map(row => (
                <div key={row.day} className="flex flex-col items-center justify-end gap-1 h-full">
                  <span className="text-[7px] font-mono text-zinc-400">{row.count}</span>
                  <div className="w-full rounded-t bg-cyan-600/70 min-h-[2px]" style={{ height: `${Math.max(3, row.count / rhythmMax * 38)}px` }} />
                  <span className="text-[7px] font-mono text-zinc-400">{row.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.coverage.gaps.length > 0 && (
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-3">
            <span className="text-[9px] font-bold text-amber-400 block">Analizi en hızlı güçlendirecek kayıt</span>
            <p className="text-[8px] font-mono text-zinc-500 leading-relaxed mt-1">
              {report.coverage.gaps[0].label}: mevcut kapsam %{report.coverage.gaps[0].percent}.
              Bu veri artmadan dönem farkının bir kısmı kayıt sıklığı farkı olabilir.
            </p>
          </div>
        )}

        <p className="text-[8px] font-mono text-zinc-500 leading-relaxed">
          Oklar aynı uzunluktaki iki dönemi betimler. Neden-sonuç iddiası değildir;
          küçük farklar pratik eşik altında kaldığında özellikle vurgulanmaz.
        </p>
      </div>
    </section>
  );
});

PeriodComparisonCard.displayName = 'PeriodComparisonCard';
export default PeriodComparisonCard;
