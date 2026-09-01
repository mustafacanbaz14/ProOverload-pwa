import React, { memo } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Mobilde çok sayıda sekmeyi tek, açıklamalı sistem seçicisine indirger.
 * Görünür kart mevcut seçimi anlatır; saydam native select iOS/Android'in
 * alışıldık seçim arayüzünü açar. Seçenekler kaybolmaz, yalnız aynı anda
 * ekranda yarışmaz.
 */
const CompactChoiceNav = memo(({
  value,
  options = [],
  onChange,
  eyebrow = 'Görünüm',
  ariaLabel = 'Görünüm seç',
}) => {
  const active = options.find(option => option.key === value) || options[0];
  if (!active) return null;

  const Icon = active.icon;

  return (
    <label className="relative min-h-[68px] rounded-2xl border border-zinc-800/80 bg-zinc-900/75 px-3.5 py-3 flex items-center gap-3 shadow-sm focus-within:border-cyan-700 focus-within:ring-2 focus-within:ring-cyan-950/50">
      {Icon && (
        <span className="w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-950 text-cyan-400 flex items-center justify-center shrink-0">
          <Icon size={17} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 block">{eyebrow}</span>
        <strong className="text-[11px] text-zinc-100 block mt-0.5 truncate">
          {active.label}{active.count !== undefined ? ` · ${active.count}` : ''}
        </strong>
        {active.hint && <span className="text-[9px] font-mono text-zinc-400 block mt-0.5 truncate">{active.hint}</span>}
      </span>
      <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold text-cyan-400">
        Değiştir <ChevronDown size={14} />
      </span>
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        aria-label={ariaLabel}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {options.map(option => (
          <option key={option.key} value={option.key}>
            {option.optionLabel || option.label}{option.count !== undefined ? ` (${option.count})` : ''}
          </option>
        ))}
      </select>
    </label>
  );
});

CompactChoiceNav.displayName = 'CompactChoiceNav';
export default CompactChoiceNav;
