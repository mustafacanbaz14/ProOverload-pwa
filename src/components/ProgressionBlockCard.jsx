import React, { memo, useState } from 'react';
import {
  CalendarRange, Check, ChevronDown, ChevronUp, Gauge,
  Pencil, RotateCcw, Save, Target, Trash2, TrendingUp,
} from 'lucide-react';
import { formatDay } from '../utils/dates';
import { PROGRESSION_BLOCK_MODELS } from '../utils/progressionBlock';

const inputClass = 'w-full rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-center text-[11px] font-mono text-zinc-200 outline-none focus:border-cyan-600';

const Field = ({ label, value, onChange, min, max, step = 1, suffix = '' }) => (
  <label className="space-y-1">
    <span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
    <div className="relative">
      <input
        type="number" inputMode="decimal" value={value}
        min={min} max={max} step={step}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} ${suffix ? 'pr-7' : ''}`}
      />
      {suffix && <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-mono text-zinc-400">{suffix}</span>}
    </div>
  </label>
);

const setKind = kind => kind === 'top' ? 'tepe' : kind === 'backoff' ? 'geri' : kind === 'technique' ? 'teknik' : 'çalışma';

const statusTone = report => report?.complete
  ? 'border-emerald-900/60 bg-emerald-950/20'
  : report?.missedStreak >= 2
    ? 'border-amber-900/60 bg-amber-950/20'
    : 'border-cyan-900/60 bg-cyan-950/20';

const ProgressionBlockCard = memo(({
  exerciseName,
  plan = null,
  report = null,
  defaults = {},
  onSave,
  onRemove,
}) => {
  const source = plan || defaults;
  const [editing, setEditing] = useState(!plan);
  const [showSchedule, setShowSchedule] = useState(false);
  const [removeArmed, setRemoveArmed] = useState(false);
  const [draft, setDraft] = useState(() => ({
    mode: source.mode || 'double',
    weeks: String(source.weeks ?? 6),
    sessionsPerWeek: String(source.sessionsPerWeek ?? 1),
    sets: String(source.sets ?? 3),
    repMin: String(source.repMin ?? 6),
    repMax: String(source.repMax ?? 10),
    startWeight: String(source.startWeight ?? ''),
    targetWeight: String(source.targetWeight ?? ''),
    targetReps: String(source.targetReps ?? source.repMax ?? 10),
    targetRir: String(source.targetRir ?? 2),
    increment: String(source.increment ?? 2.5),
    backoffPercent: String(source.backoffPercent ?? 10),
    deloadLastWeek: Boolean(source.deloadLastWeek),
  }));
  const set = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));
  const next = report?.nextPrescription;
  const eta = report?.eta;

  const save = (restart = false) => {
    onSave?.({
      ...plan,
      ...draft,
      exerciseName,
      restart,
    });
    setEditing(false);
  };

  return (
    <section className={`overflow-hidden rounded-2xl border ${statusTone(report)}`}>
      <div className="border-b border-zinc-800/80 bg-zinc-950/55 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-300">
              <CalendarRange size={13} /> Hareket İlerleme Bloğu
            </span>
            <p className="mt-1 text-[9px] font-mono leading-relaxed text-zinc-500">
              {plan
                ? `${PROGRESSION_BLOCK_MODELS[plan.mode]?.label || 'Plan'} · ${plan.weeks} hafta · haftada ${plan.sessionsPerWeek} seans`
                : 'Bu hareket için çok haftalı kilo, tekrar ve RIR reçetesi oluştur.'}
            </p>
          </div>
          {plan && !editing && (
            <button
              onClick={() => setEditing(true)} aria-label="İlerleme bloğunu düzenle"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-800 text-zinc-500 active:text-cyan-300"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>

      {plan && !editing && report && (
        <div className="space-y-3 p-3.5">
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-2.5">
              <span className="text-[8px] font-bold uppercase text-zinc-400">İlerleme</span>
              <strong className="mt-1 block text-[12px] font-mono text-zinc-100">
                {report.completedSessions}/{report.totalSessions}
              </strong>
              <span className="text-[8px] font-mono text-zinc-400">seans · {report.currentWeek}. hafta</span>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-2.5">
              <span className="text-[8px] font-bold uppercase text-zinc-400">Uyum</span>
              <strong className={`mt-1 block text-[12px] font-mono ${report.adherence === null ? 'text-zinc-500' : report.adherence >= 80 ? 'text-emerald-400' : report.adherence >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                {report.adherence === null ? '—' : `%${report.adherence}`}
              </strong>
              <span className="text-[8px] font-mono text-zinc-400">{report.outcomes.measured} ölçülen seans</span>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-2.5">
              <span className="text-[8px] font-bold uppercase text-zinc-400">Hedef Aralığı</span>
              <strong className="mt-1 block text-[10px] font-mono text-cyan-300">
                {eta?.status === 'reached' ? 'Ulaşıldı'
                  : eta?.status === 'projected'
                    ? `${formatDay(eta.rangeStart, 'short')}–${formatDay(eta.rangeEnd, 'short')}`
                    : 'Belirsiz'}
              </strong>
              <span className="text-[8px] font-mono text-zinc-400">
                {eta?.status === 'projected'
                  ? `${eta.confidence === 'high' ? 'yüksek' : eta.confidence === 'medium' ? 'orta' : 'düşük'} güven · ${eta.pointCount} seans`
                  : eta?.status === 'reached' ? 'veride doğrulandı' : '6 seans + 3 hafta'}
              </span>
            </div>
          </div>

          {report.complete ? (
            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/25 p-3 text-emerald-300">
              <span className="flex items-center gap-1.5 text-[10px] font-bold"><Check size={13} /> Blok tamamlandı</span>
              <p className="mt-1 text-[9px] font-mono text-emerald-200/65">
                {report.completionReason === 'target' ? 'Hedeflenen performans veride görüldü.' : 'Planlanan seans takvimi tamamlandı.'}
              </p>
            </div>
          ) : next && (
            <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/25 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                  <Target size={11} /> Sıradaki Reçete
                </span>
                <span className="text-[9px] font-mono text-cyan-300">{next.phase}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {next.sets.map((target, index) => (
                  <span key={`${target.kind}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-[9px] font-mono text-zinc-300">
                    {index + 1}. {target.weight > 0 ? `${target.weight} kg × ` : ''}{target.reps} · RIR {target.rir}
                    {target.kind !== 'work' && <em className="ml-1 not-italic text-zinc-400">{setKind(target.kind)}</em>}
                  </span>
                ))}
              </div>
              {next.recoveryAction && (
                <p className="mt-2 flex items-start gap-1.5 text-[9px] font-mono leading-relaxed text-amber-300">
                  <RotateCcw size={10} className="mt-0.5 shrink-0" /> {next.adaptationReason}
                </p>
              )}
            </div>
          )}

          {eta?.status === 'projected' && (
            <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/55 p-3">
              <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                <Gauge size={11} className="text-cyan-500" /> Senaryolu Tahmin
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {eta.scenarios.map(scenario => (
                  <div key={scenario.key} className={`rounded-lg border p-2 ${scenario.key === 'current' ? 'border-cyan-900/60 bg-cyan-950/20' : 'border-zinc-800 bg-zinc-950/70'}`}>
                    <span className="block text-[7px] font-bold uppercase text-zinc-400">{scenario.label}</span>
                    <strong className={`mt-1 block text-[9px] font-mono ${scenario.key === 'current' ? 'text-cyan-300' : 'text-zinc-300'}`}>
                      {formatDay(scenario.date, 'short')}
                    </strong>
                    <span className="text-[7px] font-mono text-zinc-400">{scenario.days} gün</span>
                  </div>
                ))}
              </div>
              <p className="text-[8px] font-mono leading-relaxed text-zinc-500">
                Theil–Sen eğilimi haftada {eta.slope > 0 ? '+' : ''}{eta.slope} kg tahmini 1RM.
                {eta.backtest?.samples > 0
                  ? ` Geçmiş test: ${eta.backtest.samples} adımda ortalama ${eta.backtest.maeKg} kg hata.`
                  : ' Geçmiş test için henüz yeterli ileri nokta yok.'}
                {' '}Bu istatistiksel aralıktır; garanti değildir.
              </p>
            </div>
          )}

          {eta?.status === 'insufficient' && (
            <p className="rounded-xl border border-zinc-800 bg-zinc-950/55 p-2.5 text-[8px] font-mono leading-relaxed text-zinc-500">
              Tarih göstermek için en az 6 geçerli seans ve ilk–son ölçüm arasında 21 gün gerekir.
              {eta.neededSessions > 0 ? ` ${eta.neededSessions} seans daha gerekli.` : ''}
              {eta.neededDays > 0 ? ` Zaman aralığı ${eta.neededDays} gün kısa.` : ''}
            </p>
          )}

          {Array.isArray(plan.predictionHistory) && plan.predictionHistory.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-2.5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400">Tahmin Geçmişi</span>
              <div className="mt-1.5 space-y-1">
                {plan.predictionHistory.slice(-3).reverse().map(entry => (
                  <div key={`${entry.asOf}-${entry.targetE1RM}`} className="flex items-center justify-between gap-2 text-[8px] font-mono">
                    <span className="text-zinc-400">{formatDay(entry.asOf, 'short')}</span>
                    <span className="text-zinc-400">
                      {entry.status === 'reached' ? 'hedefe ulaşıldı'
                        : `${formatDay(entry.rangeStart, 'short')}–${formatDay(entry.rangeEnd, 'short')}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowSchedule(value => !value)}
            className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-[9px] font-bold text-zinc-400"
          >
            <span>{report.totalSessions} seanslık takvimi {showSchedule ? 'gizle' : 'göster'}</span>
            {showSchedule ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showSchedule && (
            <div className="max-h-64 space-y-1 overflow-y-auto hide-scrollbar">
              {report.schedule.map((entry, index) => {
                const done = index < report.completedSessions;
                const target = entry.sets[0];
                return (
                  <div key={index} className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 ${done ? 'border-emerald-900/35 bg-emerald-950/10' : index === report.completedSessions ? 'border-cyan-800/50 bg-cyan-950/20' : 'border-zinc-800 bg-zinc-950/50'}`}>
                    <span className={`text-[9px] font-bold ${done ? 'text-emerald-500' : 'text-zinc-500'}`}>
                      {index + 1}. seans · {entry.phase}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">
                      {entry.sets.length} set · {target.weight > 0 ? `${target.weight} kg × ` : ''}{target.reps}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {editing && (
        <div className="space-y-3 p-3.5">
          <div>
            <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-wider text-zinc-400">Yükleme Modeli</span>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(PROGRESSION_BLOCK_MODELS).map(model => (
                <button
                  key={model.key} onClick={() => set('mode', model.key)}
                  aria-pressed={draft.mode === model.key} title={model.hint}
                  className={`rounded-xl border px-2 py-2 text-left ${draft.mode === model.key ? 'border-cyan-600 bg-cyan-950/35 text-cyan-200' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
                >
                  <strong className="block text-[9px]">{model.label}</strong>
                  <span className="mt-0.5 block text-[8px] font-mono leading-snug opacity-70">{model.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Field label="Hafta" value={draft.weeks} onChange={value => set('weeks', value)} min={3} max={12} />
            <Field label="Seans / hafta" value={draft.sessionsPerWeek} onChange={value => set('sessionsPerWeek', value)} min={1} max={4} />
            <Field label="Çalışma seti" value={draft.sets} onChange={value => set('sets', value)} min={1} max={8} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Başlangıç" value={draft.startWeight} onChange={value => set('startWeight', value)} min={0} max={1000} step={0.25} suffix="kg" />
            <Field label="Hedef yük" value={draft.targetWeight} onChange={value => set('targetWeight', value)} min={0} max={1000} step={0.25} suffix="kg" />
            <Field label="Artış adımı" value={draft.increment} onChange={value => set('increment', value)} min={0.25} max={20} step={0.25} suffix="kg" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Field label="Alt tekrar" value={draft.repMin} onChange={value => set('repMin', value)} min={1} max={50} />
            <Field label="Üst tekrar" value={draft.repMax} onChange={value => set('repMax', value)} min={1} max={50} />
            <Field label="Hedef tekrar" value={draft.targetReps} onChange={value => set('targetReps', value)} min={1} max={50} />
            <Field label="Hedef RIR" value={draft.targetRir} onChange={value => set('targetRir', value)} min={0} max={5} />
          </div>
          {draft.mode === 'topBackoff' && (
            <Field label="Geri çekme oranı" value={draft.backoffPercent} onChange={value => set('backoffPercent', value)} min={5} max={30} suffix="%" />
          )}

          <button
            onClick={() => set('deloadLastWeek', !draft.deloadLastWeek)}
            aria-pressed={draft.deloadLastWeek}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left ${draft.deloadLastWeek ? 'border-cyan-800 bg-cyan-950/25' : 'border-zinc-800 bg-zinc-950'}`}
          >
            <span>
              <strong className={`block text-[9px] ${draft.deloadLastWeek ? 'text-cyan-300' : 'text-zinc-400'}`}>Son haftayı hafiflet</strong>
              <span className="block text-[8px] font-mono text-zinc-400">Tam bırakma değil; yaklaşık %10 yük ve %50 set azaltımı.</span>
            </span>
            <span className={`h-5 w-9 rounded-full p-0.5 ${draft.deloadLastWeek ? 'bg-cyan-600' : 'bg-zinc-800'}`}>
              <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${draft.deloadLastWeek ? 'translate-x-4' : ''}`} />
            </span>
          </button>

          {Number(draft.startWeight) === 0 && defaults.effectiveLoadHint > 0 && (
            <p className="text-[9px] font-mono leading-relaxed text-amber-300/80">
              Son sette taşınan toplam yük yaklaşık {defaults.effectiveLoadHint} kg; ancak alana ek yük yazıldığı için başlangıç 0 bırakıldı. Buraya salonda ağırlık alanına yazacağın değeri gir.
            </p>
          )}
          <p className="text-[8px] font-mono leading-relaxed text-zinc-400">
            Takvim bir reçetedir, fizyolojik sonuç garantisi değildir. Bir kötü seans yükü otomatik düşürmez; önce hedef tekrarlanır, iki belirgin kaçırmada %5 geri çekilir.
          </p>

          <div className="flex gap-2">
            {plan && (
              <button
                onClick={() => setEditing(false)}
                className="rounded-xl border border-zinc-800 px-3 py-3 text-[9px] font-bold text-zinc-500"
              >İptal</button>
            )}
            <button
              onClick={() => save(false)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cyan-600 py-3 text-[10px] font-black uppercase tracking-wide text-white active:bg-cyan-700"
            >
              <Save size={13} /> {plan ? 'Bloğu Güncelle' : 'Bloğu Başlat'}
            </button>
            {plan && (
              <button
                onClick={() => setRemoveArmed(true)} aria-label="İlerleme bloğunu sil"
                className="flex w-11 items-center justify-center rounded-xl border border-red-900/50 text-red-500 active:bg-red-950/30"
              ><Trash2 size={14} /></button>
            )}
          </div>
          {removeArmed && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-red-900/50 bg-red-950/15 p-2.5">
              <span className="text-[9px] font-mono text-red-300">Blok silinsin mi? Geçmiş seans reçeteleri korunur.</span>
              <span className="flex shrink-0 gap-1.5">
                <button onClick={() => setRemoveArmed(false)} className="rounded-lg border border-zinc-800 px-2 py-1.5 text-[8px] font-bold text-zinc-500">Vazgeç</button>
                <button onClick={onRemove} className="rounded-lg bg-red-700 px-2 py-1.5 text-[8px] font-bold text-white">Sil</button>
              </span>
            </div>
          )}
          {plan && (
            <button
              onClick={() => save(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-900/50 bg-amber-950/15 py-2.5 text-[9px] font-bold text-amber-300"
            >
              <RotateCcw size={12} /> Geçmişi Koru, Yeni Döngü Başlat
            </button>
          )}
        </div>
      )}

      {!plan && !editing && (
        <button onClick={() => setEditing(true)} className="m-3.5 flex w-[calc(100%-1.75rem)] items-center justify-center gap-1.5 rounded-xl bg-cyan-600 py-3 text-[10px] font-bold text-white">
          <TrendingUp size={13} /> Blok Oluştur
        </button>
      )}
    </section>
  );
});

ProgressionBlockCard.displayName = 'ProgressionBlockCard';
export default ProgressionBlockCard;
