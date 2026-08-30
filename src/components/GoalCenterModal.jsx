import React, { memo, useState } from 'react';
import { Dumbbell, Ruler, ScanLine, Target, X } from 'lucide-react';
import { BODY_METRICS } from '../utils/constants';
import { clampNumber, parseNumber } from '../utils/helpers';
import GoalsCard from './GoalsCard';
import StrengthGoalsCard from './StrengthGoalsCard';

const SKINFOLD_SITES = [
  ['chest', 'Göğüs'], ['abdomen', 'Karın'], ['thigh', 'Uyluk'],
  ['triceps', 'Triceps'], ['suprailiac', 'Suprailiak'],
  ['axilla', 'Aksilla'], ['subscapular', 'Subskapular'],
];

const TABS = [
  { key: 'composition', label: 'Kompozisyon', icon: Target },
  { key: 'tape', label: 'Çevre', icon: Ruler },
  { key: 'skinfold', label: 'Kaliper', icon: ScanLine },
  { key: 'strength', label: 'Güç', icon: Dumbbell },
];

const MeasurementGoals = memo(({ type, settings, setSettings, current = {} }) => {
  const isTape = type === 'tape';
  const collection = isTape ? 'goalMeasurements' : 'goalSkinfolds';
  const unit = isTape ? 'cm' : 'mm';
  const max = isTape ? 300 : 100;
  const rows = isTape
    ? BODY_METRICS.filter(metric => metric.key !== 'weight').map(metric => [metric.key, metric.label])
    : SKINFOLD_SITES;
  const goals = settings[collection] || {};
  const update = (key, value) => setSettings(prev => ({
    ...prev,
    [collection]: { ...(prev[collection] || {}), [key]: value },
  }));
  const clear = (key) => update(key, '');

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
        <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
          {isTape ? 'Çevre ölçüsü hedefleri' : 'Kaliper hedefleri'}
        </h3>
        <p className="text-[9px] font-mono text-zinc-600 mt-1">
          Şu anki değer solda, hedef sağda. Boş bırakılan bölge takip edilmez.
        </p>
      </div>
      <div className="p-3 space-y-2">
        {rows.map(([key, label]) => {
          const now = parseNumber(current[key]);
          const target = parseNumber(goals[key]);
          const delta = now > 0 && target > 0 ? Math.round((target - now) * 10) / 10 : null;
          return (
            <div key={key} className="grid grid-cols-[1fr_62px_82px] gap-2 items-center bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
              <div className="min-w-0">
                <strong className="text-[10px] text-zinc-300 block truncate">{label}</strong>
                <span className="text-[8px] font-mono text-zinc-600">
                  {now > 0 ? `Şu an ${now} ${unit}` : 'Güncel ölçüm yok'}
                  {delta !== null ? ` · ${delta > 0 ? '+' : ''}${delta} ${unit}` : ''}
                </span>
              </div>
              <button
                type="button"
                disabled={!(now > 0)}
                onClick={() => update(key, Math.max(0, Math.round((now + (isTape ? 1 : -1)) * 10) / 10))}
                className="h-9 rounded-lg border border-cyan-900/40 text-[8px] font-mono text-cyan-500 disabled:text-zinc-700 disabled:border-zinc-900"
              >
                {isTape ? 'şu an +1' : 'şu an −1'}
              </button>
              <span className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  max={max}
                  value={goals[key] ?? ''}
                  onChange={event => update(key, event.target.value)}
                  onBlur={event => update(key, event.target.value === '' ? '' : clampNumber(event.target.value, 0, max))}
                  placeholder="—"
                  aria-label={`${label} hedefi`}
                  className="w-full h-9 bg-cyan-950/20 border border-cyan-900/50 rounded-lg pl-2 pr-6 text-center text-[10px] font-mono text-cyan-400 outline-none focus:border-cyan-500"
                />
                {target > 0 && (
                  <button type="button" onClick={() => clear(key)} aria-label={`${label} hedefini temizle`} className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-600 p-1">
                    <X size={10} />
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
});

MeasurementGoals.displayName = 'MeasurementGoals';

const GoalCenterModal = memo(({
  isOpen,
  onClose,
  settings = {},
  setSettings,
  goalValues = {},
  heightCm = 0,
  measurements = {},
  skinfolds = {},
  allExerciseNames = [],
  personalRecords,
  workouts = [],
}) => {
  const [tab, setTab] = useState('composition');
  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="goal-center-title" className="fixed inset-0 z-[125] bg-black flex flex-col">
      <header className="pt-safe px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
        <div>
          <span className="text-[8px] font-mono text-cyan-500 uppercase tracking-widest">Gelişim</span>
          <h2 id="goal-center-title" className="text-sm font-black text-zinc-100">Hedef Merkezi</h2>
        </div>
        <button onClick={onClose} aria-label="Hedef merkezini kapat" className="w-10 h-10 rounded-xl border border-zinc-800 text-zinc-400 flex items-center justify-center">
          <X size={18} />
        </button>
      </header>

      <div className="px-3 pt-3 shrink-0">
        <div className="grid grid-cols-4 gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1">
          {TABS.map(item => {
            const Icon = item.icon;
            const active = tab === item.key;
            return (
              <button key={item.key} onClick={() => setTab(item.key)} className={`rounded-xl py-2 flex flex-col items-center gap-1 text-[8px] font-bold ${active ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}>
                <Icon size={13} /> {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-safe">
        {tab === 'composition' && (
          <GoalsCard
            settings={settings}
            setSettings={setSettings}
            current={goalValues.current}
            earliest={goalValues.earliest}
            heightCm={heightCm}
            trends={goalValues.trends}
          />
        )}
        {tab === 'tape' && <MeasurementGoals type="tape" settings={settings} setSettings={setSettings} current={measurements} />}
        {tab === 'skinfold' && <MeasurementGoals type="skinfold" settings={settings} setSettings={setSettings} current={skinfolds} />}
        {tab === 'strength' && (
          <StrengthGoalsCard
            settings={settings}
            setSettings={setSettings}
            allExerciseNames={allExerciseNames}
            personalRecords={personalRecords}
            workouts={workouts}
          />
        )}
      </main>
    </div>
  );
});

GoalCenterModal.displayName = 'GoalCenterModal';
export default GoalCenterModal;
