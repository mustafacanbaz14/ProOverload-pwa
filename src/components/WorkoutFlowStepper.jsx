import React, { memo } from 'react';

const STAGES = [
  { key: 'prepare', label: 'Hazırla', hint: 'Plan ve durum' },
  { key: 'train', label: 'Çalış', hint: 'Setleri tamamla' },
  { key: 'review', label: 'Değerlendir', hint: 'Sonucu gör' },
];

const WorkoutFlowStepper = memo(({ stage = 'prepare', compact = false }) => {
  const activeIndex = Math.max(0, STAGES.findIndex(item => item.key === stage));

  return (
    <ol className={`grid grid-cols-3 ${compact ? 'gap-1' : 'gap-1.5'}`} aria-label="Antrenman aşamaları">
      {STAGES.map((item, index) => {
        const active = index === activeIndex;
        const complete = index < activeIndex;
        return (
          <li
            key={item.key}
            aria-current={active ? 'step' : undefined}
            className={`rounded-xl border px-2 py-2 ${active
              ? 'border-cyan-700/60 bg-cyan-950/25'
              : complete
                ? 'border-emerald-900/50 bg-emerald-950/15'
                : 'border-zinc-800 bg-zinc-950/55'}`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shrink-0 ${active
                ? 'bg-cyan-500 text-white'
                : complete ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
              >
                {complete ? '✓' : index + 1}
              </span>
              <strong className={`text-[9px] ${active ? 'text-cyan-300' : complete ? 'text-emerald-300' : 'text-zinc-400'}`}>{item.label}</strong>
            </div>
            {!compact && <span className="text-[8px] text-zinc-500 block mt-1 leading-tight">{item.hint}</span>}
          </li>
        );
      })}
    </ol>
  );
});

WorkoutFlowStepper.displayName = 'WorkoutFlowStepper';
export default WorkoutFlowStepper;
