import React, { useState, useMemo, memo } from 'react';
import { X, Search, Star, Settings, Trash2, Eye, EyeOff, Plus, Dumbbell, Check, History, Pin, ChevronRight } from 'lucide-react';
import { MUSCLE_GROUPS } from '../utils/constants';
import { foldForSearch } from '../utils/helpers';
import { exerciseMuscleRank, exerciseRankLabel, sortExercisesForMuscle } from '../utils/exerciseSort';

const chip = (w) =>
  w === 1 ? 'text-emerald-400 border-emerald-900/50 bg-emerald-950/30'
    : w === 0.5 ? 'text-cyan-400 border-cyan-900/50 bg-cyan-950/30'
      : 'text-zinc-500 border-zinc-800 bg-zinc-900';

const suffix = (w) => (w === 0.5 ? ' ½' : w === 0.25 ? ' ¼' : '');
const LIST_BATCH = 40;

/**
 * Hareket kütüphanesi: tüm hareketleri görüntüleme, kas eşlemesini düzenleme,
 * kullanıcının eklediklerini silme ve seçim listesinde görünürlüğü ayarlama.
 *
 * `selectMode` açıkken şablon oluşturucudan çağrılır ve dokunulan hareket
 * doğrudan geri döner.
 */
const ExerciseLibraryModal = memo(({
  isOpen,
  onClose,
  allExerciseNames = [],
  getContributions,
  isUserAdded,
  performedNames = new Set(),
  hiddenNames = new Set(),
  pinnedNames = new Set(),
  onEditExercise,
  onDeleteExercise,
  onToggleHidden,
  onTogglePinned,
  onOpenProfile,
  onAddNew,
  selectMode = false,
  onSelect,
  multiSelect = false,
  selectedNames = new Set(),
  disabledNames = new Set(),
  onToggleSelect,
  onConfirmSelection,
  // Değiştirme kipinde en üstte gösterilen alternatifler. Kütüphanede 200'den
  // fazla hareket var; "aynı işi gören başka ne var" sorusunun cevabını elle
  // aratmak, değiştirme özelliğini pratikte kullanılmaz yapıyordu.
  suggestions = [],
  suggestionsLabel = 'Aynı kası çalıştıran alternatifler',
  suggestionModes = [],
  suggestionMode = '',
  onSuggestionModeChange,
}) => {
  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('Tümü');
  const [onlyMine, setOnlyMine] = useState(false);
  const [onlyPerformed, setOnlyPerformed] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(LIST_BATCH);

  const list = useMemo(() => {
    const q = foldForSearch(query).trim();
    const filtered = allExerciseNames.filter(name => {
      if (onlyMine && !isUserAdded(name)) return false;
      if (onlyPerformed && !performedNames.has(name)) return false;
      if (q && !foldForSearch(name).includes(q)) return false;
      if (muscleFilter !== 'Tümü') {
        const c = getContributions(name);
        if (!c || !c[muscleFilter]) return false;
      }
      return true;
    });
    const sorted = sortExercisesForMuscle(filtered, muscleFilter, getContributions);
    return sorted.sort((a, b) => Number(pinnedNames.has(b)) - Number(pinnedNames.has(a)));
  }, [allExerciseNames, query, muscleFilter, onlyMine, onlyPerformed, performedNames, pinnedNames, getContributions, isUserAdded]);
  const visibleList = list.slice(0, visibleLimit);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="exercise-library-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[90] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-md max-h-[88dvh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md shrink-0">
          <h3 id="exercise-library-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest flex items-center">
            <Dumbbell size={16} className="mr-2 text-cyan-400" />
            {selectMode ? 'Hareket Seç' : 'Hareket Kütüphanesi'}
          </h3>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-zinc-800/80 bg-zinc-950/95 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setVisibleLimit(LIST_BATCH); }}
              placeholder="Hareket ara..."
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl pl-11 pr-3 text-zinc-100 outline-none font-mono text-xs h-11 focus:border-cyan-500 transition-colors shadow-inner"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1">
            {['Tümü', ...MUSCLE_GROUPS].map(m => (
              <button
                key={m}
                onClick={() => { setMuscleFilter(m); setVisibleLimit(LIST_BATCH); }}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-[0.97] ${muscleFilter === m ? 'border-cyan-500 text-cyan-300 bg-cyan-950/40 shadow-sm shadow-cyan-950/40' : 'border-zinc-800 text-zinc-500 bg-zinc-950'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {suggestionModes.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest block">
              Alternatif amacı
            </span>
            <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1">
              {suggestionModes.map(mode => (
                <button
                  type="button"
                  key={mode.key}
                  onClick={() => onSuggestionModeChange?.(mode.key)}
                  aria-pressed={suggestionMode === mode.key}
                  title={mode.detail}
                  className={`shrink-0 rounded-lg border px-2 py-1.5 text-[8px] font-bold ${suggestionMode === mode.key ? 'border-emerald-600 bg-emerald-950/30 text-emerald-300' : 'border-zinc-800 bg-zinc-900 text-zinc-400'}`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-2 space-y-1.5">
            <span className="text-[9px] font-mono text-emerald-400/80 uppercase tracking-widest block">
              {suggestionsLabel}
            </span>
            <div className="flex flex-wrap gap-1">
              {suggestions.map(oneri => (
                <button
                  key={oneri.name}
                  onClick={() => onSelect?.(oneri.name)}
                  disabled={disabledNames.has(oneri.name)}
                  title={oneri.reason || undefined}
                  className="bg-zinc-900 border border-emerald-900/50 text-emerald-300 px-2 py-1 rounded-lg text-[9px] font-bold active:bg-emerald-950/40 disabled:opacity-30"
                >
                  {oneri.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5 min-w-0 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => { setOnlyMine(v => !v); setVisibleLimit(LIST_BATCH); }}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-colors flex items-center gap-1 ${onlyMine ? 'border-amber-600 text-amber-400 bg-amber-950/20' : 'border-zinc-800 text-zinc-500'}`}
            >
              <Star size={11} fill={onlyMine ? 'currentColor' : 'none'} /> Benimkiler
            </button>
            {selectMode && performedNames.size > 0 && (
              <button
                onClick={() => { setOnlyPerformed(v => !v); setVisibleLimit(LIST_BATCH); }}
                className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-colors flex items-center gap-1 ${onlyPerformed ? 'border-cyan-600 text-cyan-400 bg-cyan-950/20' : 'border-zinc-800 text-zinc-500'}`}
              >
                <History size={11} /> Yaptıklarım
              </button>
            )}
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {visibleList.length < list.length ? `${visibleList.length}/${list.length}` : list.length} hareket
          </span>
        </div>
        {muscleFilter !== 'Tümü' && (
          <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
            Sıra: %100 izolasyon → %100 bileşik → yardımcı katkılar.
          </p>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto bg-zinc-950 hide-scrollbar ${multiSelect ? 'pb-24' : 'pb-safe'}`}>
        {!selectMode && (
          <button
            onClick={onAddNew}
            className="w-full px-4 py-3 border-b border-zinc-900 text-cyan-400 active:bg-zinc-900 transition-colors flex items-center text-[11px] font-bold uppercase tracking-wider"
          >
            <Plus size={15} className="mr-2" /> Yeni Hareket Ekle
          </button>
        )}

        {list.length === 0 && (
          <div className="text-center py-12 text-zinc-400 text-[11px] font-mono">Eşleşen hareket yok.</div>
        )}

        {visibleList.map(name => {
          const contributions = getContributions(name) || {};
          const parts = Object.entries(contributions).sort((a, b) => b[1] - a[1]);
          const mine = isUserAdded(name);
          const hidden = hiddenNames.has(name);
          const pinned = pinnedNames.has(name);
          const done = performedNames.has(name);
          const selected = selectedNames.has(name);
          const disabled = disabledNames.has(name);
          const rank = muscleFilter !== 'Tümü'
            ? exerciseMuscleRank(name, muscleFilter, getContributions)
            : null;

          return (
            <div
              key={name}
              className={`px-4 py-3 border-b border-zinc-900 flex justify-between items-start gap-2 ${hidden ? 'opacity-45' : ''} ${selected ? 'bg-cyan-950/20' : ''}`}
            >
              <button
                onClick={() => {
                  if (disabled) return;
                  if (!selectMode) onOpenProfile?.(name);
                  else if (multiSelect) onToggleSelect?.(name);
                  else onSelect?.(name);
                }}
                disabled={disabled || (!selectMode && !onOpenProfile)}
                className={`min-w-0 flex-1 text-left ${!disabled ? 'active:opacity-60' : 'cursor-default'} ${disabled ? 'opacity-45' : ''}`}
              >
                <div className="text-xs font-bold font-mono text-zinc-200 flex items-center gap-1.5">
                  {mine && <Star size={10} className="text-amber-400 shrink-0" fill="currentColor" />}
                  <span className="truncate">{name}</span>
                  {done && <span className="text-[8px] font-sans text-cyan-600 shrink-0">YAPILDI</span>}
                  {pinned && <span className="text-[8px] font-sans text-amber-500 shrink-0">SABİT</span>}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {rank && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${rank.weight === 1 ? 'text-emerald-300 border-emerald-900/60 bg-emerald-950/25' : 'text-amber-300 border-amber-900/50 bg-amber-950/20'}`}>
                      {exerciseRankLabel(rank)}
                    </span>
                  )}
                  {parts.length === 0 ? (
                    <span className="text-[10px] text-zinc-400 font-mono">Kas eşlemesi yok</span>
                  ) : parts.map(([m, w]) => (
                    <span key={m} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${chip(w)}`}>
                      {m}{suffix(w)}
                    </span>
                  ))}
                </div>
              </button>

              {selectMode ? (
                disabled ? (
                  <span className="text-[8px] font-bold text-zinc-400 border border-zinc-800 rounded-md px-1.5 py-1 shrink-0">EKLİ</span>
                ) : selected ? (
                  <span className="text-white bg-cyan-600 rounded-full p-1 shrink-0"><Check size={13} /></span>
                ) : (
                  <span className="text-zinc-400 border border-zinc-800 rounded-full p-1 shrink-0"><Plus size={13} /></span>
                )
              ) : (
                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => onTogglePinned?.(name)}
                    title={pinned ? 'Sabitlemeyi kaldır' : 'Seçim listesine sabitle'}
                    aria-label={pinned ? `${name} sabitlemesini kaldır` : `${name} hareketini sabitle`}
                    className={`p-1.5 ${pinned ? 'text-amber-400' : 'text-zinc-400 active:text-amber-400'}`}
                  >
                    <Pin size={14} fill={pinned ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => onToggleHidden(name)}
                    title={hidden ? 'Seçim listesinde göster' : 'Seçim listesinde gizle'}
                    aria-label={hidden ? `${name} seçim listesinde göster` : `${name} seçim listesinde gizle`}
                    className="text-zinc-400 active:text-cyan-400 p-1.5"
                  >
                    {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => onEditExercise(name)}
                    title="Kas eşlemesini düzenle"
                    aria-label={`${name} kas eşlemesini düzenle`}
                    className="text-zinc-400 active:text-cyan-400 p-1.5"
                  >
                    <Settings size={14} />
                  </button>
                  {mine && (
                    <button
                      onClick={() => onDeleteExercise(name)}
                      title="Bu hareketi sil"
                      aria-label={`${name} hareketini sil`}
                      className="text-zinc-400 active:text-red-500 p-1.5"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <ChevronRight size={14} className="text-zinc-500 ml-0.5" aria-hidden="true" />
                </div>
              )}
            </div>
          );
        })}

        {visibleList.length < list.length && (
          <button
            type="button"
            onClick={() => setVisibleLimit(limit => limit + LIST_BATCH)}
            className="mx-4 my-4 w-[calc(100%_-_2rem)] rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-[10px] font-bold text-cyan-400 active:bg-zinc-800"
          >
            Sonraki {Math.min(LIST_BATCH, list.length - visibleList.length)} hareketi göster
          </button>
        )}
      </div>

      {selectMode && multiSelect && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950/95 p-3 pb-safe backdrop-blur-xl">
          <button
            type="button"
            disabled={selectedNames.size === 0}
            onClick={() => onConfirmSelection?.([...selectedNames])}
            className="w-full rounded-xl bg-cyan-600 py-3.5 text-[11px] font-black uppercase tracking-wide text-white active:bg-cyan-700 disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            {selectedNames.size > 0 ? `${selectedNames.size} hareketi ekle` : 'Eklemek için hareket seç'}
          </button>
        </div>
      )}
    </div>
  );
});

ExerciseLibraryModal.displayName = 'ExerciseLibraryModal';

export default ExerciseLibraryModal;
