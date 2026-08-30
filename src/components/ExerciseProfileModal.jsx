import React, { memo, useState } from 'react';
import {
  X, Trophy, Target, Calendar, Layers, TrendingUp, TrendingDown, Minus,
  Pin, Play, Settings, Dumbbell, Bookmark, Repeat2, RotateCcw, AlertTriangle,
} from 'lucide-react';
import TrendChart from './TrendChart';
import ProgressionBlockCard from './ProgressionBlockCard';
import { formatDay } from '../utils/dates';
import { PROGRESSION_RULES } from '../utils/progression';

const contributionTone = weight => weight === 1
  ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
  : weight === 0.5
    ? 'border-cyan-900/60 bg-cyan-950/25 text-cyan-300'
    : 'border-zinc-800 bg-zinc-950 text-zinc-500';

/**
 * Hedef tekrar aralığı düzenleyici.
 *
 * Ayrı bir bileşen ve dışarıdan `key` ile sıfırlanıyor. Alanları effect içinde
 * senkronlamak React Compiler kurallarına aykırı (effect içinde setState
 * zincirleme render tetikliyor); yeniden monte etmek aynı işi yan etkisiz
 * yapıyor.
 */
const RepRangeEditor = memo(({ repRange, onChange }) => {
  const [min, setMin] = useState(String(repRange.min));
  const [max, setMax] = useState(String(repRange.max));

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Repeat2 size={12} className="mr-1.5 text-cyan-400" /> Hedef Tekrar
        </span>
        <span className="text-[9px] font-mono text-zinc-600">
          {repRange.source === 'exercise' ? 'bu harekete özel'
            : repRange.source === 'muscle' ? `${repRange.muscle} varsayılanı` : 'genel ayar'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number" inputMode="numeric" value={min}
          onChange={(e) => setMin(e.target.value)}
          onBlur={() => onChange(min, max)}
          aria-label="Alt tekrar sınırı"
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 text-[12px] font-mono text-center outline-none focus:border-cyan-500"
        />
        <span className="text-zinc-600 text-[11px] font-mono">–</span>
        <input
          type="number" inputMode="numeric" value={max}
          onChange={(e) => setMax(e.target.value)}
          onBlur={() => onChange(min, max)}
          aria-label="Üst tekrar sınırı"
          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 text-[12px] font-mono text-center outline-none focus:border-cyan-500"
        />
        {repRange.source === 'exercise' && (
          <button
            onClick={() => onChange('', '')}
            title="Varsayılana dön"
            aria-label="Tekrar aralığını varsayılana döndür"
            className="w-10 h-10 rounded-xl border border-zinc-800 text-zinc-500 active:text-cyan-400 flex items-center justify-center shrink-0"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
      <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
        Seans içi yük ayarı ve sıradaki set hedefi bu aralığı kullanıyor.
        Yazmazsan kas grubunun varsayılanı geçerli — aynı 6-10 bandını hem ağır
        çömelişe hem yan omuz kaldırışına dayatmak, tavsiyeyi ikincisinde
        yanlış yapıyordu.
      </p>
    </section>
  );
});

RepRangeEditor.displayName = 'RepRangeEditor';

const ExerciseProfileModal = memo(({
  profile,
  setupNote = '',
  pinned = false,
  onTogglePinned,
  onEdit,
  onStart,
  onClose,
  repRange = null,
  onChangeRepRange,
  progressionRule = null,
  onChangeProgression,
  progressionBlock = null,
  progressionBlockReport = null,
  progressionBlockDefaults = null,
  onSaveProgressionBlock,
  onRemoveProgressionBlock,
  repRecords = null,
  plateau = null,
}) => {
  if (!profile) return null;
  const trendIcon = profile.trend.direction === 'up'
    ? <TrendingUp size={13} />
    : profile.trend.direction === 'down'
      ? <TrendingDown size={13} />
      : <Minus size={13} />;
  const metricUnit = profile.metric === 'e1rm' ? ' kg' : ' kg hacim';
  const bestValue = profile.bestEver
    ? (profile.metric === 'e1rm' ? profile.bestEver.bestE1RM : profile.bestEver.tonnage)
    : 0;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="exercise-profile-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[97] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">
        <header className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <span className="text-[8px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">Hareket Profili</span>
            <h3 id="exercise-profile-title" className="text-[13px] font-black text-zinc-100 truncate">{profile.name}</h3>
          </div>
          <button onClick={onClose} aria-label="Hareket profilini kapat" className="luxury-icon-button"><X size={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <section className="rounded-3xl border border-cyan-900/50 bg-gradient-to-br from-cyan-950/40 via-zinc-900/90 to-zinc-950 p-4 space-y-3 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(profile.contributions || {}).sort((a, b) => b[1] - a[1]).map(([muscle, weight]) => (
              <span key={muscle} className={`rounded-xl border px-2.5 py-1 text-[9px] font-bold ${contributionTone(weight)}`}>
                {muscle} · %{Math.round(weight * 100)}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-zinc-800/80 bg-black/40 p-3 text-center">
              <Calendar size={13} className="text-cyan-400 mx-auto mb-1" />
              <strong className="text-base font-mono font-black text-zinc-100 block">{profile.sessionCount}</strong>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">seans</span>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-black/40 p-3 text-center">
              <Layers size={13} className="text-violet-400 mx-auto mb-1" />
              <strong className="text-base font-mono font-black text-zinc-100 block">{profile.totalSets}</strong>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">set</span>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-black/40 p-3 text-center">
              <Trophy size={13} className="text-amber-400 mx-auto mb-1" />
              <strong className="text-base font-mono font-black text-zinc-100 block">{bestValue || '—'}</strong>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">{profile.metric === 'e1rm' ? 'en iyi 1RM' : 'en iyi hacim'}</span>
            </div>
          </div>
        </section>

        {profile.target && (
          <section className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400 flex items-center gap-1.5"><Target size={14} /> Sıradaki Hedef</span>
              <strong className="text-base font-mono font-black text-emerald-300">{profile.target.weight} kg × {profile.target.reps}</strong>
            </div>
            <p className="text-[10px] font-mono text-emerald-200/80 leading-relaxed mt-1.5">{profile.target.note}</p>
          </section>
        )}

        {profile.chartData.length >= 2 ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] uppercase tracking-widest font-black text-zinc-400">Son {profile.chartData.length} Seans</h4>
              <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${profile.trend.direction === 'up' ? 'text-emerald-400' : profile.trend.direction === 'down' ? 'text-amber-400' : 'text-zinc-500'}`}>
                {trendIcon}{profile.trend.deltaPct > 0 ? '+' : ''}{profile.trend.deltaPct ?? 0}%
              </span>
            </div>
            <TrendChart
              data={profile.chartData.map(point => ({ ...point, label: formatDay(point.label) }))}
              color="#22d3ee"
              unit={metricUnit}
              decimals={1}
            />
          </section>
        ) : (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 text-center backdrop-blur-sm">
            <Dumbbell size={18} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-[10px] font-mono text-zinc-500">Trend için en az iki tamamlanmış seans gerekli.</p>
          </div>
        )}

        {profile.sessions.length > 0 && (
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur-sm">
            <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60">
              <h4 className="text-[10px] uppercase tracking-widest font-black text-zinc-400">Seans Geçmişi</h4>
            </div>
            <div className="divide-y divide-zinc-800/70">
              {profile.sessions.slice(0, 8).map(session => (
                <div key={`${session.workoutId}-${session.date}`} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="text-[11px] font-bold text-zinc-200 block truncate">{formatDay(session.date, 'medium')}</strong>
                    <span className="text-[9px] font-mono text-zinc-500">{session.setCount} set · {session.workoutName || 'Antrenman'}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-cyan-400 shrink-0">
                    {profile.metric === 'e1rm' ? `${session.bestE1RM || '—'} kg 1RM` : `${session.tonnage} kg`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hedef tekrar aralığı */}
        {repRange && onChangeRepRange && (
          <RepRangeEditor
            key={`${profile.name}-${repRange.min}-${repRange.max}-${repRange.source}`}
            repRange={repRange}
            onChange={onChangeRepRange}
          />
        )}

        {/* İlerleme kuralı */}
        {progressionRule && onChangeProgression && (
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 space-y-2.5 backdrop-blur-sm">
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={12} className="text-emerald-400" /> İlerleme Kuralı
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.values(PROGRESSION_RULES).map(k => {
                const secili = progressionRule.key === k.key;
                return (
                  <button
                    key={k.key}
                    onClick={() => onChangeProgression(k.key)}
                    aria-pressed={secili}
                    title={k.hint}
                    className={`rounded-xl py-2 border text-[9px] font-bold transition-all active:scale-95 ${secili ? 'border-emerald-600 bg-emerald-950/40 text-emerald-300 shadow-sm shadow-emerald-950/30' : 'border-zinc-800/80 bg-zinc-950 text-zinc-500'}`}
                  >
                    {k.short}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
              {progressionRule.detail}
            </p>
          </section>
        )}

        {progressionBlockDefaults && onSaveProgressionBlock && (
          <ProgressionBlockCard
            key={`${profile.name}-${progressionBlock?.updatedAt || 'new'}`}
            exerciseName={profile.name}
            plan={progressionBlock}
            report={progressionBlockReport}
            defaults={progressionBlockDefaults}
            onSave={onSaveProgressionBlock}
            onRemove={onRemoveProgressionBlock}
          />
        )}

        {/* Tekrar bandı rekorları */}
        {repRecords?.hasData && (
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur-sm">
            <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60 flex justify-between items-baseline">
              <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                Tekrar Rekorları
              </span>
              {repRecords.strongestBand && (
                <span className="text-[9px] font-mono font-bold text-amber-400">
                  en güçlü: {repRecords.strongestBand.bandLabel}
                </span>
              )}
            </div>
            <div className="divide-y divide-zinc-800/70">
              {repRecords.rows.map(r => (
                <div key={r.band} className="px-4 py-2 flex justify-between items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-300 shrink-0 w-12">{r.bandLabel}</span>
                  <span className="text-[9px] font-mono text-zinc-500 truncate min-w-0 flex-1">{r.hint}</span>
                  <span className="text-[10px] font-mono shrink-0 text-right">
                    <strong className="text-zinc-100">{r.weight} kg × {r.reps}</strong>
                    <span className="text-zinc-500 block text-[9px]">
                      {formatDay(r.date, 'short')}{r.e1rm ? ` · ~${r.e1rm} kg 1RM` : ''}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <p className="px-4 py-2 text-[9px] font-mono text-zinc-500 leading-relaxed bg-zinc-950/40">
              Hepsi gerçekten yapılmış setler. 15 toplam tekrarın üstünde 1RM
              tahmini gösterilmiyor: formül o bölgede güvenilir değil.
            </p>
          </section>
        )}

        {/* Durgunluk */}
        {plateau && (plateau.status === 'stalling' || plateau.status === 'regressing') && (
          <section className={`rounded-2xl border p-4 space-y-2.5 backdrop-blur-sm ${plateau.status === 'regressing' ? 'border-red-900/50 bg-red-950/20' : 'border-amber-900/50 bg-amber-950/20'}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${plateau.status === 'regressing' ? 'text-red-300' : 'text-amber-300'}`}>
              <AlertTriangle size={13} />
              {plateau.status === 'regressing'
                ? `En iyinin %${plateau.dropPercent} altında`
                : `${plateau.sessionsSinceBest} seanstır ilerlemiyor`}
            </span>
            <p className="text-[10px] font-mono text-zinc-300 leading-relaxed">
              En iyi tahmini 1RM {plateau.best.e1rm} kg ({formatDay(plateau.best.date, 'short')}),
              son seans {plateau.latest.e1rm} kg. Toplam {plateau.sessions} seans ölçüldü.
            </p>
            <div className="space-y-1.5">
              {plateau.advice.map(o => (
                <div key={o.key} className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-2.5">
                  <strong className="text-[10px] text-zinc-200 block font-bold">{o.title}</strong>
                  <span className="text-[9px] font-mono text-zinc-400 leading-relaxed">{o.detail}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {(setupNote || profile.templateNames.length > 0) && (
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 space-y-2 backdrop-blur-sm">
            {setupNote && <p className="text-[10px] font-mono text-zinc-300 leading-relaxed"><Settings size={12} className="inline text-cyan-400 mr-1.5" />{setupNote}</p>}
            {profile.templateNames.length > 0 && (
              <p className="text-[10px] font-mono text-zinc-300 leading-relaxed"><Bookmark size={12} className="inline text-violet-400 mr-1.5" />{profile.templateNames.join(' · ')}</p>
            )}
          </section>
        )}
      </div>

      <footer className="p-3.5 border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md grid grid-cols-[auto_auto_1fr] gap-2 pb-safe shrink-0">
        <button onClick={onTogglePinned} aria-label={pinned ? 'Sabitlemeyi kaldır' : 'Seçim listesine sabitle'} className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${pinned ? 'border-amber-700 bg-amber-950/40 text-amber-400 shadow-sm shadow-amber-950/30' : 'border-zinc-800 text-zinc-500 bg-zinc-900/60'}`}><Pin size={17} fill={pinned ? 'currentColor' : 'none'} /></button>
        <button onClick={onEdit} aria-label="Hareket ayarlarını düzenle" className="w-12 h-12 rounded-2xl border border-zinc-800 text-zinc-400 bg-zinc-900/60 flex items-center justify-center transition-all active:scale-95"><Settings size={17} /></button>
        <button onClick={onStart} className="rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 active:scale-[0.98] py-3.5 text-[11px] font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all"><Play size={16} /> Bu Hareketle Başla</button>
      </footer>
    </div>
  </div>
  );
});

ExerciseProfileModal.displayName = 'ExerciseProfileModal';
export default ExerciseProfileModal;
