import React, { useState, memo } from 'react';
import { X, Plus, Trash2, Save, Clock, Layers, Calendar, ChevronUp, ChevronDown, ArrowUp, ArrowDown, Flame, Copy, RefreshCw, Link2 } from 'lucide-react';
import { getVolumeLandmarks } from '../utils/constants';
import { previewTemplateVolume, estimateDuration } from '../utils/templates';
import { generateId } from '../utils/helpers';
import { estimateLiftingCalories } from '../utils/cardio';
import { WEEKDAYS } from '../utils/weekPlan';
import {
  addExercisesToDraftDay, duplicateDraftDay, nextUnusedWeekday,
  replaceDraftExercise, suggestedWeekdays, toggleDraftSuperset,
} from '../utils/programDraft';
import ExerciseLibraryModal from './ExerciseLibraryModal';
import PlanningGuide from './PlanningGuide';
import TemplateAssistantCard from './TemplateAssistantCard';

const DAY_NAMES = ['1. Gün', '2. Gün', '3. Gün', '4. Gün', '5. Gün', '6. Gün', '7. Gün'];

/**
 * Gün gün şablon oluşturucu.
 *
 * Her gün ayrı bir şablon olarak kaydedilir (uygulamanın şablon modeli tek
 * seanslık). Program adı gün adlarının önüne eklenir: "PPL — Push".
 *
 * Önizlemede hacim, TÜM SETLER ETKİLİ varsayımıyla hesaplanır: şablonda henüz
 * RIR yoktur, bu yüzden gösterilen değer üst sınırdır.
 */
const TemplateBuilderModal = memo(({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  // Doluysa tek şablonu düzenleme kipi: gün sekmeleri gizlenir, program adı
  // doğrudan şablonun adıdır. Üst bileşen key ile yeniden bağlar.
  editing = null,
  initialDraft = null,
  customExercises = [],
  restSeconds = 120,
  experienceLevel = 'intermediate',
  weightKg = 0,
  libraryProps = {},
}) => {
  const [programName, setProgramName] = useState(editing?.name || initialDraft?.name || '');
  const [days, setDays] = useState(() => editing
    ? [{
      uid: generateId(),
      name: editing.name,
      weekday: 'mon',
      exercises: (editing.exercises || []).map(ex => ({
        // Aynı hareket bir güne iki kez eklenebiliyor; listeyi index yerine
        // kalıcı bir kimlikle keylemek silme sonrası karışmayı önler.
        uid: generateId(),
        name: ex.name,
        sets: Math.max(1, (ex.sets || []).length),
      })),
    }]
    : initialDraft?.days?.length
      ? initialDraft.days.map((day, index) => ({
        uid: day.uid || generateId(),
        name: day.name || DAY_NAMES[index],
        weekday: day.weekday || suggestedWeekdays(initialDraft.days.length)[index],
        exercises: (day.exercises || []).map(ex => ({ ...ex, uid: ex.uid || generateId(), sets: ex.sets || 3 })),
      }))
      : [{ uid: generateId(), name: DAY_NAMES[0], weekday: 'mon', exercises: [] }]);
  const [activeDay, setActiveDay] = useState(0);
  // Kütüphane bu bileşenin içinden açılır; böylece seçilen hareket bir üst
  // bileşene çıkıp geri dönmek zorunda kalmaz (render sırasında yan etki olurdu).
  const [pickerMode, setPickerMode] = useState(null); // { type: 'add' } | { type: 'replace', uid }
  const [selectedExercises, setSelectedExercises] = useState(() => new Set());
  const [defaultSets, setDefaultSets] = useState(3);
  const [createWeekPlan, setCreateWeekPlan] = useState(!editing);
  const [removeArmed, setRemoveArmed] = useState(false);

  if (!isOpen) return null;

  const day = days[activeDay] || days[0];

  // Şablon önizlemesi için set sayısını gerçek set nesnelerine çevir.
  const toExercises = (d) => d.exercises.map(ex => ({
    name: ex.name,
    sets: Array.from({ length: ex.sets }, () => ({ weight: '', reps: '', rir: 2, setType: 'normal' })),
  }));

  const dayExercises = toExercises(day);
  const { byMuscle, totalSets } = previewTemplateVolume(dayExercises, customExercises);
  // Boş günde "~1 dk" saçma görünüyor; süre ancak set varsa anlamlı.
  const minutes = totalSets > 0 ? estimateDuration(dayExercises, restSeconds) : 0;
  const kcal = estimateLiftingCalories(minutes, weightKg);
  const ranked = Object.entries(byMuscle).sort((a, b) => b[1] - a[1]);
  const maxVol = ranked.length ? ranked[0][1] : 1;

  const updateDay = (patch) => setDays(prev => prev.map((d, i) => i === activeDay ? { ...d, ...patch } : d));
  const moveExercise = (index, direction) => {
    const to = index + direction;
    if (to < 0 || to >= day.exercises.length) return;
    const list = [...day.exercises];
    [list[index], list[to]] = [list[to], list[index]];
    updateDay({ exercises: list });
  };
  const setExerciseSets = (uid, n) => updateDay({
    exercises: day.exercises.map(ex => ex.uid === uid ? { ...ex, sets: Math.max(1, Math.min(12, n)) } : ex)
  });
  const addSuggested = (name) => updateDay({
    exercises: day.exercises.some(ex => ex.name === name)
      ? day.exercises.map(ex => ex.name === name ? { ...ex, sets: Math.min(12, ex.sets + 2) } : ex)
      : [...day.exercises, { uid: generateId(), name, sets: 3 }],
  });

  const addDay = () => {
    if (days.length >= 7) return;
    const oldSuggestion = suggestedWeekdays(days.length);
    const nextSuggestion = suggestedWeekdays(days.length + 1);
    const followsSuggestion = days.every((item, index) => item.weekday === oldSuggestion[index]);
    const nextDays = followsSuggestion
      ? days.map((item, index) => ({ ...item, weekday: nextSuggestion[index] }))
      : days;
    const weekday = followsSuggestion ? nextSuggestion[days.length] : nextUnusedWeekday(days);
    setDays([...nextDays, { uid: generateId(), name: DAY_NAMES[days.length], weekday, exercises: [] }]);
    setActiveDay(days.length);
    setRemoveArmed(false);
  };

  const duplicateDay = () => {
    const next = duplicateDraftDay(days, activeDay, generateId);
    if (next === days) return;
    setDays(next);
    setActiveDay(activeDay + 1);
    setRemoveArmed(false);
  };

  const removeDay = () => {
    if (days.length <= 1) return;
    if (!removeArmed) {
      setRemoveArmed(true);
      return;
    }
    const next = days.filter((_, index) => index !== activeDay);
    setDays(next);
    setActiveDay(Math.min(activeDay, next.length - 1));
    setRemoveArmed(false);
  };

  const openAddPicker = () => {
    setSelectedExercises(new Set());
    setPickerMode({ type: 'add' });
  };

  const openReplacePicker = (uid) => {
    setSelectedExercises(new Set());
    setPickerMode({ type: 'replace', uid });
  };

  const canSave = programName.trim() && days.some(d => d.exercises.length > 0);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[88] flex flex-col h-[100dvh] max-w-[420px] mx-auto">

      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Calendar size={15} className="mr-2 text-cyan-400" /> {editing ? 'Şablonu Düzenle' : 'Program Oluştur'}
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="p-3 space-y-2.5 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <input
          type="text"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          placeholder={editing ? 'Şablon adı' : 'Program adı (örn. Push Pull Legs)'}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-100 outline-none font-mono text-xs focus:border-cyan-500 transition-colors"
        />

        {!editing && (
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1 items-center">
          {days.map((d, i) => (
            <button
              key={d.uid}
              onClick={() => { setActiveDay(i); setRemoveArmed(false); }}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${activeDay === i ? 'border-cyan-600 text-cyan-400 bg-cyan-950/20' : 'border-zinc-800 text-zinc-500'}`}
            >
              {d.name} <span className="text-zinc-600">({d.exercises.length})</span>
            </button>
          ))}
          {days.length < 7 && (
            <button
              onClick={addDay}
              aria-label="Yeni program günü ekle"
              className="shrink-0 px-2.5 py-1.5 rounded-lg border border-dashed border-zinc-700 text-zinc-500 active:text-cyan-400"
            >
              <Plus size={13} />
            </button>
          )}
        </div>
        )}

        {!editing && (
          <div className="space-y-2">
            <input
              type="text"
              value={day.name}
              onChange={(e) => updateDay({ name: e.target.value })}
              placeholder="Gün adı (örn. Push)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-300 outline-none font-mono text-[11px] focus:border-cyan-500 transition-colors"
            />
            <div className="flex gap-1 overflow-x-auto hide-scrollbar" aria-label="Haftanın günü">
              {WEEKDAYS.map(weekday => (
                <button
                  key={weekday.key}
                  type="button"
                  onClick={() => updateDay({ weekday: weekday.key })}
                  className={`shrink-0 rounded-lg border px-2 py-1.5 text-[9px] font-bold ${day.weekday === weekday.key ? 'border-emerald-600 bg-emerald-950/30 text-emerald-300' : 'border-zinc-800 text-zinc-600'}`}
                >
                  {weekday.short}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={duplicateDay} disabled={days.length >= 7} className="rounded-lg border border-zinc-800 bg-zinc-900 py-2 text-[9px] font-bold text-zinc-400 active:bg-zinc-800 disabled:opacity-30">
                <Copy size={11} className="inline mr-1" /> Günü Kopyala
              </button>
              <button type="button" onClick={removeDay} disabled={days.length <= 1} className={`rounded-lg border py-2 text-[9px] font-bold disabled:opacity-30 ${removeArmed ? 'border-red-700 bg-red-950/30 text-red-300' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}>
                <Trash2 size={11} className="inline mr-1" /> {removeArmed ? 'Tekrar Dokun: Sil' : 'Günü Sil'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">

        <PlanningGuide mode="template" />

        {/* Gün özeti */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-center">
            <Clock size={13} className="text-emerald-400 mx-auto mb-1" />
            <span className="text-sm font-mono font-bold text-zinc-100 block">~{minutes} dk</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-center">
            <Layers size={13} className="text-cyan-400 mx-auto mb-1" />
            <span className="text-sm font-mono font-bold text-zinc-100 block">{totalSets} set</span>
          </div>
          {/* Kalori tahmini kiloya bağlı; ölçüm yoksa sayı uydurmak yerine
              boş bırakılır. */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-center">
            <Flame size={13} className="text-red-400 mx-auto mb-1" />
            <span className="text-sm font-mono font-bold text-zinc-100 block">
              {kcal > 0 ? `~${kcal}` : '—'}
              <span className="text-[9px] text-zinc-500"> kcal</span>
            </span>
          </div>
        </div>

        <TemplateAssistantCard
          exercises={dayExercises}
          customExercises={customExercises}
          onAddSuggested={addSuggested}
        />

        {/* Hareketler */}
        <div className="space-y-2">
          {day.exercises.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-[11px] font-mono">
              Bu güne henüz hareket eklenmedi.
            </div>
          ) : day.exercises.map((ex, exIndex) => (
            <div key={ex.uid} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <div className="flex justify-between items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0 flex items-center">
                  <span className="text-cyan-500 mr-1">{exIndex + 1}.</span>
                  {(ex.superset || day.exercises[exIndex - 1]?.superset) && (
                    <Link2 size={11} className="text-purple-400 mr-1 shrink-0" />
                  )}
                  <span className="truncate">{ex.name}</span>
                </span>
                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => openReplacePicker(ex.uid)}
                    title="Hareketi değiştir"
                    aria-label={`${ex.name} hareketini değiştir`}
                    className="text-zinc-600 active:text-emerald-400 p-1.5"
                  >
                    <RefreshCw size={13} />
                  </button>
                  <button
                    onClick={() => moveExercise(exIndex, -1)}
                    disabled={exIndex === 0}
                    title="Yukarı taşı"
                    aria-label="Hareketi yukarı taşı"
                    className="text-zinc-600 active:text-cyan-400 p-1.5 disabled:opacity-25 disabled:active:text-zinc-600"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    onClick={() => moveExercise(exIndex, 1)}
                    disabled={exIndex === day.exercises.length - 1}
                    title="Aşağı taşı"
                    aria-label="Hareketi aşağı taşı"
                    className="text-zinc-600 active:text-cyan-400 p-1.5 disabled:opacity-25 disabled:active:text-zinc-600"
                  >
                    <ArrowDown size={13} />
                  </button>
                  {/* Süperset şimdiye kadar yalnızca canlı antrenmanda
                      kurulabiliyordu, yani her seans elle yeniden bağlanıyordu.
                      Şablonda kurulunca seansa aynen taşınıyor. */}
                  <button
                    onClick={() => updateDay(toggleDraftSuperset(day, ex.uid))}
                    disabled={exIndex === day.exercises.length - 1}
                    title={ex.superset ? 'Süperset bağını kaldır' : 'Sonraki hareketle süperset yap'}
                    aria-label={ex.superset ? 'Süperset bağını kaldır' : 'Sonraki hareketle süperset yap'}
                    aria-pressed={Boolean(ex.superset)}
                    className={`p-1.5 disabled:opacity-25 ${ex.superset ? 'text-purple-400' : 'text-zinc-600 active:text-purple-400'}`}
                  >
                    <Link2 size={13} />
                  </button>
                  <button
                    onClick={() => updateDay({ exercises: day.exercises.filter(e => e.uid !== ex.uid) })}
                    aria-label={`${ex.name} hareketini çıkar`}
                    className="text-zinc-600 active:text-red-500 p-1.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500">Set sayısı</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExerciseSets(ex.uid, ex.sets - 1)} className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center justify-center active:bg-zinc-800">
                    <ChevronDown size={13} />
                  </button>
                  <span className="w-6 text-center font-mono text-sm font-bold text-cyan-400">{ex.sets}</span>
                  <button onClick={() => setExerciseSets(ex.uid, ex.sets + 1)} className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center justify-center active:bg-zinc-800">
                    <ChevronUp size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-cyan-900/50 bg-zinc-900 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-mono text-zinc-500">Yeni hareketler</span>
            <div className="flex gap-1">
              {[2, 3, 4, 5].map(value => (
                <button key={value} type="button" onClick={() => setDefaultSets(value)} className={`w-7 h-6 rounded-md border text-[9px] font-bold ${defaultSets === value ? 'border-cyan-600 bg-cyan-950/30 text-cyan-300' : 'border-zinc-800 text-zinc-600'}`}>
                  {value}s
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={openAddPicker}
            className="w-full bg-cyan-950/25 border border-cyan-900/50 text-cyan-400 font-bold py-3 rounded-xl flex justify-center items-center uppercase tracking-wide text-[11px] active:bg-cyan-900/30 transition-colors"
          >
            <Plus size={15} className="mr-2" /> Birden Fazla Hareket Seç
          </button>
        </div>

        {/* Kas dağılımı */}
        {ranked.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex justify-between items-baseline">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bu Gün Ne Çalışacak</h4>
              <span className="text-[9px] font-mono text-zinc-600">tüm setler etkili varsayımı</span>
            </div>
            {ranked.map(([muscle, vol]) => {
              const lm = getVolumeLandmarks(muscle, experienceLevel);
              const share = Math.round((vol / lm.mav) * 100);
              return (
                <div key={muscle} className="space-y-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] font-bold text-zinc-200 truncate">{muscle}</span>
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                      <strong className="text-cyan-400">{vol}</strong> set
                      <span className="text-zinc-600"> · haftalığın %{share}'i</span>
                    </span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                    <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${Math.min(100, (vol / maxVol) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe">
        {!editing && (
          <button
            type="button"
            onClick={() => setCreateWeekPlan(value => !value)}
            className="w-full flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 mb-2 text-left"
            aria-pressed={createWeekPlan}
          >
            <span className="min-w-0">
              <span className="text-[10px] font-bold text-zinc-200 block">Haftalık plana da yerleştir</span>
              <span className="text-[8px] font-mono text-zinc-600 block">Seçtiğin günlerle yeni aktif program oluşur</span>
            </span>
            <span className={`w-9 h-5 rounded-full relative shrink-0 ${createWeekPlan ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
              <span className="absolute top-1 w-3 h-3 rounded-full bg-white transition-all" style={{ left: createWeekPlan ? 20 : 4 }} />
            </span>
          </button>
        )}
        <button
          disabled={!canSave}
          onClick={() => {
            if (editing) onUpdate(editing.id, programName.trim(), days[0].exercises);
            else onSave(programName.trim(), days, { createWeekPlan });
            onClose();
          }}
          className="w-full bg-cyan-600 active:bg-cyan-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3.5 rounded-xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-colors"
        >
          <Save size={15} />
          {editing
            ? 'Şablonu Güncelle'
            : createWeekPlan
              ? `${days.filter(d => d.exercises.length > 0).length} Günü Kaydet ve Aktif Yap`
              : `${days.filter(d => d.exercises.length > 0).length} Şablonu Kaydet`}
        </button>
      </div>

      <ExerciseLibraryModal
        {...libraryProps}
        isOpen={Boolean(pickerMode)}
        onClose={() => { setPickerMode(null); setSelectedExercises(new Set()); }}
        selectMode
        multiSelect={pickerMode?.type === 'add'}
        selectedNames={selectedExercises}
        disabledNames={pickerMode?.type === 'add'
          ? new Set(day.exercises.map(ex => ex.name))
          : new Set(day.exercises.filter(ex => ex.uid !== pickerMode?.uid).map(ex => ex.name))}
        onToggleSelect={(name) => setSelectedExercises(prev => {
          const next = new Set(prev);
          if (next.has(name)) next.delete(name);
          else next.add(name);
          return next;
        })}
        onConfirmSelection={(names) => {
          setDays(prev => prev.map((draftDay, index) => index === activeDay
            ? addExercisesToDraftDay(draftDay, names, generateId, defaultSets)
            : draftDay));
          setPickerMode(null);
          setSelectedExercises(new Set());
        }}
        onSelect={(name) => {
          if (pickerMode?.type !== 'replace') return;
          setDays(prev => prev.map((draftDay, index) => index === activeDay
            ? replaceDraftExercise(draftDay, pickerMode.uid, name)
            : draftDay));
          setPickerMode(null);
        }}
      />
    </div>
  );
});

TemplateBuilderModal.displayName = 'TemplateBuilderModal';

export default TemplateBuilderModal;
