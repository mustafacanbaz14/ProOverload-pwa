import React, { useEffect, useState, useMemo, memo } from 'react';
import { X, Plus, Trash2, Save, Clock, Layers, Calendar, ChevronUp, ChevronDown, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Flame, Copy, RefreshCw, Link2, MoveRight, AlertTriangle, CheckCircle2, LifeBuoy, Zap, SlidersHorizontal } from 'lucide-react';
import { getVolumeLandmarks } from '../utils/constants';
import { previewTemplateVolume, estimateDuration } from '../utils/templates';
import { generateId } from '../utils/helpers';
import { SUBSTITUTION_GOALS, suggestSubstitutes, suggestSubstitutesByGoal } from '../utils/substitution';
import { EMPHASIS_MODES, findEmphasis } from '../utils/undulation';
import { PLANNABLE_TECHNIQUES } from '../utils/constants';
import { TECHNIQUE_GUIDE } from '../utils/setTechniques';
import { estimateLiftingCalories } from '../utils/cardio';
import { WEEKDAYS } from '../utils/weekPlan';
import {
  addExercisesToDraftDay, duplicateDraftDay, nextUnusedWeekday,
  replaceDraftExercise, suggestedWeekdays, toggleDraftSuperset,
  draftFlagsFromSupersetIds, moveDraftExerciseToEdge, moveDraftExerciseToDay,
  draftWeeklyVolume,
} from '../utils/programDraft';
import ExerciseLibraryModal from './ExerciseLibraryModal';
import PlanningGuide from './PlanningGuide';
import TemplateAssistantCard from './TemplateAssistantCard';
import ProgramOptimizerCard from './ProgramOptimizerCard';
import SessionDesignCard from './SessionDesignCard';
import { clearProgramDraft, loadProgramDraft, saveProgramDraft } from '../utils/programDraftStorage';

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
  optimalProfile = null,
  libraryProps = {},
  wizardMode = false,
  onDraftChange,
}) => {
  const [storedDraft] = useState(() => (!editing && !initialDraft ? loadProgramDraft('builder') : null));
  const draftSeed = initialDraft || storedDraft;
  const [programName, setProgramName] = useState(editing?.name || draftSeed?.name || '');
  const [days, setDays] = useState(() => editing
    ? [{
      uid: generateId(),
      name: editing.name,
      weekday: 'mon',
      // Süperset bağları şablondan GERİ OKUNUYOR. Bu yapılmadığı sürece var
      // olan bir şablonu düzenlemeye açmak bağları sessizce düşürüyordu.
      emphasis: editing.emphasis || 'standard',
      exercises: (editing.exercises || []).map((ex, i, liste) => ({
        // Aynı hareket bir güne iki kez eklenebiliyor; listeyi index yerine
        // kalıcı bir kimlikle keylemek silme sonrası karışmayı önler.
        uid: generateId(),
        name: ex.name,
        sets: Math.max(1, (ex.sets || []).length),
        superset: draftFlagsFromSupersetIds(liste)[i],
        // Plan alanları da geri okunuyor; okunmasaydı şablonu düzenleyip
        // kaydetmek yedek hareketi ve tekniği sessizce silerdi.
        ...(ex.backup ? { backup: ex.backup } : {}),
        ...(ex.plannedTechnique ? { plannedTechnique: ex.plannedTechnique } : {}),
        ...(ex.repRange ? { repRange: ex.repRange } : {}),
      })),
    }]
    : draftSeed?.days?.length
      ? draftSeed.days.map((day, index) => ({
        uid: day.uid || generateId(),
        name: day.name || DAY_NAMES[index],
        weekday: day.weekday || suggestedWeekdays(draftSeed.days.length)[index],
        exercises: (day.exercises || []).map(ex => ({ ...ex, uid: ex.uid || generateId(), sets: ex.sets || 3 })),
      }))
      : [{ uid: generateId(), name: DAY_NAMES[0], weekday: 'mon', exercises: [] }]);
  const [activeDay, setActiveDay] = useState(draftSeed?.activeDay || 0);
  // Kütüphane bu bileşenin içinden açılır; böylece seçilen hareket bir üst
  // bileşene çıkıp geri dönmek zorunda kalmaz (render sırasında yan etki olurdu).
  const [pickerMode, setPickerMode] = useState(null); // { type: 'add' } | { type: 'replace', uid }
  const [selectedExercises, setSelectedExercises] = useState(() => new Set());
  const [defaultSets, setDefaultSets] = useState(3);
  const [createWeekPlan, setCreateWeekPlan] = useState(editing ? false : draftSeed?.createWeekPlan !== false);
  const [removeArmed, setRemoveArmed] = useState(false);
  // Açık olan "başka güne taşı" menüsünün hareketi.
  const [moveTarget, setMoveTarget] = useState(null);
  // Hareket başına plan paneli (yedek hareket, teknik, tekrar aralığı).
  const [planTarget, setPlanTarget] = useState(null);
  const [replaceGoal, setReplaceGoal] = useState('closest');

  useEffect(() => {
    if (!isOpen || editing) return;
    if (saveProgramDraft('builder', { name: programName, days, activeDay, createWeekPlan })) {
      onDraftChange?.({ kind: 'builder', name: programName, dayCount: days.length });
    }
  }, [isOpen, editing, programName, days, activeDay, createWeekPlan, onDraftChange]);

  const finishDraft = () => {
    clearProgramDraft('builder');
    onDraftChange?.(null);
  };

  // Haftalık toplam: gün gün bakarak program yazan biri, her günü makul görünen
  // ama haftalık toplamı MEV altında kalan bir program üretebiliyordu. Hook
  // erken dönüşün üstünde duruyor — çağrı sırası her render'da aynı olmalı.
  const weekly = useMemo(
    () => draftWeeklyVolume(days, { customExercises, experienceLevel }),
    [days, customExercises, experienceLevel]);

  // Değiştirme kipinde alternatifler: aynı katkı profiline en yakın hareketler.
  const replaceSuggestions = useMemo(() => {
    if (pickerMode?.type !== 'replace') return [];
    const hedef = (days[activeDay]?.exercises || []).find(ex => ex.uid === pickerMode.uid);
    if (!hedef) return [];
    return suggestSubstitutesByGoal(hedef.name, libraryProps.allExerciseNames || [], {
      customExercises,
      performed: libraryProps.performedNames || new Set(),
      goal: replaceGoal,
      limit: 6,
    }).map(o => ({
      name: o.name,
      reason: `%${Math.round(o.similarity * 100)} örtüşme · ${o.note}`,
    }));
  }, [pickerMode, days, activeDay, libraryProps.allExerciseNames,
    libraryProps.performedNames, customExercises, replaceGoal]);

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
  /** Hareketin plan alanlarını (yedek, teknik, aralık) günceller. */
  const setExercisePlan = (uid, patch) => updateDay({
    exercises: day.exercises.map(ex => (ex.uid === uid ? { ...ex, ...patch } : ex)),
  });

  const moveToEdge = (uid, edge) => updateDay(moveDraftExerciseToEdge(day, uid, edge));
  const moveToDay = (uid, toIndex, copy) => {
    const next = moveDraftExerciseToDay(days, activeDay, uid, toIndex, { copy, generateId });
    if (next === days) return;
    setDays(next);
    setMoveTarget(null);
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
    setReplaceGoal('closest');
    setPickerMode({ type: 'replace', uid });
  };

  const canSave = programName.trim() && days.some(d => d.exercises.length > 0);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[88] flex flex-col h-[100dvh] max-w-[420px] mx-auto">

      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Calendar size={15} className="mr-2 text-cyan-400" /> {wizardMode ? 'Şablon Sihirbazı' : editing ? 'Şablonu Düzenle' : 'Program Oluştur'}
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
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[8px] font-mono text-zinc-600">
              {storedDraft ? 'Kaydedilmiş taslak geri yüklendi' : 'Değişiklikler bu cihazda otomatik korunur'}
            </span>
            <span className="text-[8px] font-bold text-emerald-500">Taslak açık</span>
          </div>
        )}

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

        {/* 7.8 program zekâsı: taslağın tamamını amaç, kişisel hacim, süre,
            sıklık ve gün dağılımıyla birlikte denetler. Düzeltmeler yalnız
            kullanıcı dokunduğunda uygulanır; program sessizce değişmez. */}
        {!editing && (
          <ProgramOptimizerCard
            days={days}
            onChange={setDays}
            customExercises={customExercises}
            experienceLevel={experienceLevel}
            restSeconds={restSeconds}
            optimalProfile={optimalProfile}
          />
        )}

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

        {/* Haftalık hacim. Şablon oluşturucu şimdiye kadar yalnızca AÇIK OLAN
            GÜNÜN hacmini gösteriyordu; oysa MEV/MAV/MRV kararları haftalık.
            Gösterilen değer ÜST SINIR: şablonda RIR yok, bütün setler etkili
            varsayılıyor. */}
        {!editing && weekly.hasData && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                Haftalık Toplam
              </span>
              <span className="text-[9px] font-mono text-zinc-500">
                {weekly.totalSets} set · {days.filter(d => d.exercises.length > 0).length} gün
              </span>
            </div>

            <div className="px-3 py-2 flex flex-wrap gap-1.5">
              {weekly.statuses.slice(0, 10).map(st => (
                <span
                  key={st.muscle}
                  title={`${st.muscle}: ${st.volume} kesirli set (eşik ${st.mev} · verimli ${st.mav} · tartışmalı sonu ${st.mrv})`}
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    st.status === 'below' ? 'border-amber-900/60 bg-amber-950/20 text-amber-300'
                      : st.status === 'over' ? 'border-red-900/60 bg-red-950/20 text-red-300'
                        : st.status === 'high' ? 'border-cyan-900/60 bg-cyan-950/20 text-cyan-300'
                          : 'border-emerald-900/60 bg-emerald-950/20 text-emerald-300'}`}
                >
                  {st.muscle} {st.volume}
                </span>
              ))}
            </div>

            {(weekly.below.length > 0 || weekly.over.length > 0) ? (
              <div className="px-3 pb-2 space-y-1">
                {weekly.below.length > 0 && (
                  <p className="text-[9px] font-mono text-amber-300/80 leading-relaxed">
                    <AlertTriangle size={9} className="inline mr-1" />
                    Koruma eşiğinin altında: {weekly.below.map(s => `${s.muscle} ${s.volume}/${s.mev}`).join(' · ')}
                  </p>
                )}
                {weekly.over.length > 0 && (
                  <p className="text-[9px] font-mono text-red-300/80 leading-relaxed">
                    <AlertTriangle size={9} className="inline mr-1" />
                    Tavanın üstünde: {weekly.over.map(s => `${s.muscle} ${s.volume}/${s.mrv}`).join(' · ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="px-3 pb-2 text-[9px] font-mono text-emerald-300/70">
                <CheckCircle2 size={9} className="inline mr-1" />
                Bütün kaslar koruma eşiği ile tavan arasında.
              </p>
            )}

            {/* Seçim denetimi: hacim doğru olduğunda bile geçerli bulgular.
                Aynı 16 set iki farklı hareket seçimiyle farklı sonuç verir. */}
            {weekly.audit.findings.length > 0 && (
              <div className="px-3 py-2 border-t border-zinc-800 bg-zinc-950/40 space-y-1.5">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                  Hareket seçimi
                </span>
                {weekly.audit.findings.slice(0, 3).map(f => (
                  <div key={`${f.muscle}-${f.issues[0]?.key}`} className="text-[9px] font-mono leading-relaxed">
                    <strong className="text-zinc-300">{f.muscle}:</strong>{' '}
                    <span className="text-zinc-500">{f.issues[0]?.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <TemplateAssistantCard
          exercises={dayExercises}
          customExercises={customExercises}
          onAddSuggested={addSuggested}
        />

        <SessionDesignCard
          key={day.uid}
          exercises={day.exercises}
          onChange={(exercises) => updateDay({ exercises })}
          customExercises={customExercises}
          performedNames={libraryProps.performedNames || new Set()}
          restSeconds={restSeconds}
          defaultOpen={wizardMode}
        />

        {/* Gün vurgusu. Uygulamanın ilerleme modeli haftalıktı; haftanın
            İÇİNDE bir yapı yoktu ve aynı kası iki kez çalışan kişi iki seansı
            da aynı aralıkta yapıyordu. */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-2">
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
            <SlidersHorizontal size={11} className="text-violet-400" /> Gün Vurgusu
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {Object.values(EMPHASIS_MODES).map(v => {
              const secili = (day.emphasis || 'standard') === v.key;
              return (
                <button
                  key={v.key}
                  onClick={() => updateDay({ emphasis: v.key })}
                  aria-pressed={secili}
                  title={v.hint}
                  className={`rounded-xl py-2 border text-[9px] font-bold transition-colors ${secili ? 'border-violet-500 bg-violet-950/30 text-violet-200' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
                >
                  {v.short}
                </button>
              );
            })}
          </div>
          <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
            {findEmphasis(day.emphasis).detail}
          </p>
        </div>

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
                  {/* Tek tek taşımak sekiz hareketlik bir günde yedi dokunuş
                      demekti; uzun basış yerine ayrı düğme, çünkü uzun basış
                      dokunmatikte keşfedilmiyor. */}
                  <button
                    onClick={() => moveToEdge(ex.uid, 'top')}
                    disabled={exIndex === 0}
                    title="En üste taşı"
                    aria-label="Hareketi en üste taşı"
                    className="text-zinc-600 active:text-cyan-400 p-1.5 disabled:opacity-25 disabled:active:text-zinc-600"
                  >
                    <ChevronsUp size={13} />
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
                  <button
                    onClick={() => moveToEdge(ex.uid, 'bottom')}
                    disabled={exIndex === day.exercises.length - 1}
                    title="En alta taşı"
                    aria-label="Hareketi en alta taşı"
                    className="text-zinc-600 active:text-cyan-400 p-1.5 disabled:opacity-25 disabled:active:text-zinc-600"
                  >
                    <ChevronsDown size={13} />
                  </button>
                  {/* Güne taşıma yalnızca çok günlü programda anlamlı. */}
                  {!editing && days.length > 1 && (
                    <button
                      onClick={() => setMoveTarget(moveTarget === ex.uid ? null : ex.uid)}
                      title="Başka güne taşı"
                      aria-label={`${ex.name} hareketini başka güne taşı`}
                      aria-expanded={moveTarget === ex.uid}
                      className={`p-1.5 ${moveTarget === ex.uid ? 'text-amber-400' : 'text-zinc-600 active:text-amber-400'}`}
                    >
                      <MoveRight size={13} />
                    </button>
                  )}
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
                    onClick={() => setPlanTarget(planTarget === ex.uid ? null : ex.uid)}
                    title="Yedek hareket, teknik ve tekrar aralığı"
                    aria-label={`${ex.name} için plan ayarları`}
                    aria-expanded={planTarget === ex.uid}
                    className={`p-1.5 ${planTarget === ex.uid ? 'text-violet-400' : 'text-zinc-600 active:text-violet-400'}`}
                  >
                    <SlidersHorizontal size={13} />
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
              {planTarget === ex.uid && (
                <div className="mb-2 rounded-lg border border-violet-900/50 bg-violet-950/10 p-2.5 space-y-2.5">
                  {/* Yedek hareket. "Makine dolu" ya da "bugün omzum ağrıyor"
                      durumunda seansta hareket aramak yerine tek dokunuşla
                      geçilecek alternatif şablonda yazılı duruyor. */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-violet-300 uppercase tracking-widest flex items-center gap-1">
                      <LifeBuoy size={9} /> Yedek Hareket
                    </span>
                    {ex.backup ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-300 truncate flex-1">{ex.backup}</span>
                        <button
                          onClick={() => setExercisePlan(ex.uid, { backup: '' })}
                          className="text-zinc-600 active:text-red-400 p-1 shrink-0"
                          aria-label="Yedek hareketi kaldır"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {suggestSubstitutes(ex.name, libraryProps.allExerciseNames || [], { customExercises, limit: 4 })
                          .map(o => (
                            <button
                              key={o.name}
                              onClick={() => setExercisePlan(ex.uid, { backup: o.name })}
                              title={`%${Math.round(o.similarity * 100)} örtüşme`}
                              className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-1 rounded-lg text-[9px] font-bold active:bg-zinc-800"
                            >
                              {o.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Planlanan teknik: seansta hatırlatma olarak çıkıyor,
                      seti otomatik işaretlemiyor. */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-violet-300 uppercase tracking-widest flex items-center gap-1">
                      <Zap size={9} /> Planlanan Teknik
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {PLANNABLE_TECHNIQUES.map(k => {
                        const secili = ex.plannedTechnique === k;
                        return (
                          <button
                            key={k}
                            onClick={() => setExercisePlan(ex.uid, { plannedTechnique: secili ? '' : k })}
                            aria-pressed={secili}
                            title={TECHNIQUE_GUIDE[k]?.when}
                            className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${secili ? 'border-purple-600 bg-purple-950/30 text-purple-300' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
                          >
                            {TECHNIQUE_GUIDE[k]?.label || k}
                          </button>
                        );
                      })}
                    </div>
                    {ex.plannedTechnique && (
                      <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                        {TECHNIQUE_GUIDE[ex.plannedTechnique]?.how}
                      </p>
                    )}
                  </div>

                  {/* Şablona özel tekrar aralığı: aynı hareket kuvvet
                      şablonunda 4-6, hipertrofi şablonunda 10-14 olabilir. */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-violet-300 uppercase tracking-widest">
                      Bu Şablonda Tekrar Aralığı
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" inputMode="numeric" min="1" max="30"
                        value={ex.repRange?.min ?? ''}
                        onChange={(e) => setExercisePlan(ex.uid, {
                          repRange: { min: e.target.value, max: ex.repRange?.max ?? '' },
                        })}
                        placeholder="alt"
                        aria-label={`${ex.name} alt tekrar`}
                        className="w-14 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] font-mono text-zinc-200 outline-none focus:border-violet-500"
                      />
                      <span className="text-[10px] text-zinc-600">–</span>
                      <input
                        type="number" inputMode="numeric" min="1" max="30"
                        value={ex.repRange?.max ?? ''}
                        onChange={(e) => setExercisePlan(ex.uid, {
                          repRange: { min: ex.repRange?.min ?? '', max: e.target.value },
                        })}
                        placeholder="üst"
                        aria-label={`${ex.name} üst tekrar`}
                        className="w-14 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] font-mono text-zinc-200 outline-none focus:border-violet-500"
                      />
                      {ex.repRange && (
                        <button
                          onClick={() => setExercisePlan(ex.uid, { repRange: null })}
                          className="text-zinc-600 active:text-red-400 p-1"
                          aria-label="Tekrar aralığını temizle"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                    {ex.repRange?.min > 0 && (day.emphasis && day.emphasis !== 'standard') && (
                      <p className="text-[9px] font-mono text-violet-300/80 leading-relaxed">
                        Buraya bir aralık yazdığın için {findEmphasis(day.emphasis).label.toLowerCase()}
                        {' '}gün vurgusu bu harekete UYGULANMAZ: yazdığın sayı açık bir
                        tercih, vurgu ise günün geneline konmuş varsayılan.
                      </p>
                    )}
                    <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                      Boş bırakılırsa hareketin genel aralığı kullanılır.
                    </p>
                  </div>
                </div>
              )}

              {moveTarget === ex.uid && (
                <div className="mb-2 rounded-lg border border-amber-900/50 bg-amber-950/15 p-2 space-y-1.5">
                  <span className="text-[9px] font-mono text-amber-300/80 block">
                    Hangi güne? Taşımak bu günden çıkarır, kopyalamak iki günde de bırakır.
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {days.map((hedef, hi) => hi !== activeDay && (
                      <span key={hedef.uid} className="flex rounded-lg overflow-hidden border border-zinc-800">
                        <button
                          onClick={() => moveToDay(ex.uid, hi, false)}
                          disabled={(hedef.exercises || []).some(x => x.name === ex.name)}
                          className="bg-zinc-900 px-2 py-1 text-[9px] font-bold text-zinc-300 active:bg-zinc-800 disabled:opacity-30"
                        >
                          {hedef.name}
                        </button>
                        <button
                          onClick={() => moveToDay(ex.uid, hi, true)}
                          disabled={(hedef.exercises || []).some(x => x.name === ex.name)}
                          title={`${hedef.name} gününe kopyala`}
                          aria-label={`${hedef.name} gününe kopyala`}
                          className="bg-zinc-950 px-1.5 py-1 text-zinc-500 active:text-cyan-400 disabled:opacity-30 border-l border-zinc-800"
                        >
                          <Copy size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
            if (editing) onUpdate(editing.id, programName.trim(), days[0].exercises, { emphasis: days[0].emphasis });
            else {
              onSave(programName.trim(), days, { createWeekPlan });
              finishDraft();
            }
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
        suggestions={replaceSuggestions}
        suggestionsLabel={SUBSTITUTION_GOALS[replaceGoal]?.detail || 'Aynı kası çalıştıran alternatifler'}
        suggestionModes={Object.values(SUBSTITUTION_GOALS)}
        suggestionMode={replaceGoal}
        onSuggestionModeChange={setReplaceGoal}
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
