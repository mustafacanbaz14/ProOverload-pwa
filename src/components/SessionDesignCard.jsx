import React, { memo, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowDownUp, CheckCircle2, Clock3, History, Link2,
  RotateCcw, Sparkles, Target, Wand2,
} from 'lucide-react';
import { previewTemplateVolume, estimateDuration } from '../utils/templates';
import { draftSupersetIds } from '../utils/programDraft';
import {
  ORDER_PROFILES, applySupersetOpportunity, suggestOrderByProfile,
  suggestSupersetOpportunity, trimSessionToMinutes,
} from '../utils/exerciseOrder';

const EMPTY_SET = new Set();
const PROFILE_KEYS = ['performance', 'priority', 'alternate', 'upperLower', 'stretch', 'familiar', 'preExhaust', 'manual'];
const TARGET_MINUTES = [35, 45, 60, 75, 90];

const cloneExercises = (exercises = []) => exercises.map(exercise => ({
  ...exercise,
  ...(exercise.repRange ? { repRange: { ...exercise.repRange } } : {}),
}));

const toTemplateExercises = (exercises = []) => {
  const supersetIds = draftSupersetIds(exercises, 'wizard');
  return exercises.map((exercise, index) => ({
    name: exercise.name,
    supersetId: supersetIds[index],
    sets: Array.from({ length: Math.max(0, Number(exercise.sets) || 0) }, () => ({
      weight: '', reps: '', rir: 2, setType: 'normal',
    })),
  }));
};

const sameDraft = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const SessionDesignCard = memo(({
  exercises = [],
  onChange,
  customExercises = [],
  performedNames = EMPTY_SET,
  restSeconds = 120,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [profile, setProfile] = useState('performance');
  const [priorityMuscle, setPriorityMuscle] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [message, setMessage] = useState('');
  const [initialExercises] = useState(() => cloneExercises(exercises));

  const templateExercises = useMemo(() => toTemplateExercises(exercises), [exercises]);
  const preview = useMemo(
    () => previewTemplateVolume(templateExercises, customExercises),
    [templateExercises, customExercises],
  );
  const minutes = useMemo(
    () => (templateExercises.length ? estimateDuration(templateExercises, restSeconds) : 0),
    [templateExercises, restSeconds],
  );
  const initialTemplate = useMemo(() => toTemplateExercises(initialExercises), [initialExercises]);
  const initialPreview = useMemo(
    () => previewTemplateVolume(initialTemplate, customExercises),
    [initialTemplate, customExercises],
  );
  const initialMinutes = useMemo(
    () => (initialTemplate.length ? estimateDuration(initialTemplate, restSeconds) : 0),
    [initialTemplate, restSeconds],
  );
  const muscles = useMemo(
    () => Object.entries(preview.byMuscle || {}).filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([muscle]) => muscle),
    [preview.byMuscle],
  );
  const ordering = useMemo(() => suggestOrderByProfile(exercises, {
    profile, priorityMuscle, customExercises, performedNames,
  }), [exercises, profile, priorityMuscle, customExercises, performedNames]);
  const trim = useMemo(() => trimSessionToMinutes(exercises, {
    targetMinutes, restSeconds, priorityMuscle, customExercises,
  }), [exercises, targetMinutes, restSeconds, priorityMuscle, customExercises]);
  const superset = useMemo(
    () => suggestSupersetOpportunity(exercises, { customExercises }),
    [exercises, customExercises],
  );

  const changed = !sameDraft(exercises, initialExercises);
  const unknownCount = exercises.filter(exercise => !performedNames.has(exercise.name)).length;
  const recommendations = [
    ordering.changed ? `${ordering.profile.label} profili sırayı değiştirebilir.` : null,
    minutes > targetMinutes ? `Seans hedefi ${targetMinutes} dk; tahmin yaklaşık ${minutes} dk.` : null,
    superset ? `${superset.firstName} + ${superset.secondName} basit süperset adayı.` : null,
    unknownCount >= 3
      ? (performedNames.size > 0
        ? `${unknownCount} hareket geçmişinde yok; “Bildiğim” profili öğrenme yükünü azaltabilir.`
        : `${unknownCount} hareket için geçmiş verisi yok; ilk seans öncesi tekniklerini gözden geçir.`)
      : null,
  ].filter(Boolean);

  const applyOrder = () => {
    if (!ordering.changed) {
      setMessage('Seçili profile göre sıra zaten uyumlu.');
      return;
    }
    onChange?.(ordering.order);
    setMessage(`${ordering.profile.label} sırası uygulandı; set ve hareket seçimi değişmedi.`);
  };

  const applyTrim = () => {
    if (!trim.changes.length) {
      setMessage(trim.reached
        ? `Seans zaten yaklaşık ${targetMinutes} dakikanın içinde.`
        : 'Hiçbir hareketi 2 setin altına indirmeden daha fazla kısaltılamıyor.');
      return;
    }
    onChange?.(trim.exercises);
    setMessage(`${trim.changes.length} set adımı azaltıldı: ~${trim.beforeMinutes} → ~${trim.afterMinutes} dk.`);
  };

  const applySuperset = () => {
    if (!superset) {
      setMessage('Ağır bileşkelere dokunmadan uygun izolasyon çifti bulunamadı.');
      return;
    }
    onChange?.(applySupersetOpportunity(exercises, superset));
    setMessage(`${superset.firstName} ile ${superset.secondName} komşu süperset yapıldı.`);
  };

  return (
    <section className="rounded-2xl border border-fuchsia-900/45 bg-gradient-to-br from-fuchsia-950/20 via-zinc-900 to-zinc-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        className="w-full px-3 py-2.5 flex items-center justify-between gap-3 text-left active:bg-zinc-800/30"
      >
        <span className="min-w-0">
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-fuchsia-400 flex items-center gap-1.5">
            <Sparkles size={10} /> Seans Sihirbazı
          </span>
          <strong className="text-[11px] text-zinc-100 block mt-0.5 truncate">
            {exercises.length} hareket · {preview.totalSets} set · ~{minutes} dk
          </strong>
        </span>
        <span className="text-right shrink-0">
          <span className={`text-[9px] font-bold block ${recommendations.length ? 'text-amber-300' : 'text-emerald-300'}`}>
            {recommendations.length ? `${recommendations.length} öneri` : 'Düzenli'}
          </span>
          <span className="text-[8px] font-mono text-zinc-400">dokun ve aç</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-zinc-800/80 p-3 space-y-3">
          <div>
            <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest block mb-1.5">1 · Sıralama amacı</span>
            <div className="grid grid-cols-2 gap-1.5">
              {PROFILE_KEYS.map(key => {
                const item = ORDER_PROFILES[key];
                const selected = profile === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setProfile(key)}
                    aria-pressed={selected}
                    disabled={key === 'familiar' && performedNames.size === 0}
                    className={`rounded-xl border px-2 py-2 text-left disabled:opacity-35 ${selected ? 'border-fuchsia-500 bg-fuchsia-950/35 text-fuchsia-200' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
                  >
                    <strong className="text-[9px] block">{item.short}</strong>
                    <span className="text-[7px] font-mono opacity-70 line-clamp-2">{item.detail}</span>
                  </button>
                );
              })}
            </div>
            {ORDER_PROFILES[profile]?.caution && (
              <p className="mt-1.5 text-[8px] font-mono text-amber-300/85 leading-relaxed flex gap-1.5">
                <AlertTriangle size={9} className="shrink-0 mt-0.5" /> Ön yorgunluk bileşke hareketindeki yük/tekrar performansını düşürebilir.
              </p>
            )}
          </div>

          {(profile === 'priority' || profile === 'preExhaust') && muscles.length > 0 && (
            <div>
              <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest block mb-1.5">2 · Öncelikli kas</span>
              <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                {muscles.map(muscle => (
                  <button
                    type="button"
                    key={muscle}
                    onClick={() => setPriorityMuscle(muscle)}
                    aria-pressed={priorityMuscle === muscle}
                    className={`shrink-0 rounded-lg border px-2 py-1.5 text-[8px] font-bold ${priorityMuscle === muscle ? 'border-amber-500 bg-amber-950/30 text-amber-200' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}
                  >
                    {muscle}
                  </button>
                ))}
              </div>
              {!priorityMuscle && <p className="text-[8px] font-mono text-amber-300/80">Bu profil için bir kas seçmelisin.</p>}
            </div>
          )}

          <div>
            <div className="flex justify-between items-center gap-2 mb-1.5">
              <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">3 · Süre hedefi</span>
              <span className="text-[8px] font-mono text-zinc-400">tahmin ~{minutes} dk</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {TARGET_MINUTES.map(value => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setTargetMinutes(value)}
                  className={`rounded-lg border py-1.5 text-[8px] font-mono ${targetMinutes === value ? 'border-cyan-600 bg-cyan-950/30 text-cyan-300' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={applyOrder}
              disabled={(profile === 'priority' || profile === 'preExhaust') && !priorityMuscle}
              className="rounded-xl border border-fuchsia-800/60 bg-fuchsia-950/25 py-2 text-[8px] font-bold text-fuchsia-200 disabled:opacity-35 flex flex-col items-center gap-1"
            >
              <ArrowDownUp size={12} /> Sırayı Uygula
            </button>
            <button
              type="button"
              onClick={applyTrim}
              className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 py-2 text-[8px] font-bold text-cyan-200 flex flex-col items-center gap-1"
            >
              <Clock3 size={12} /> Süreye Sığdır
            </button>
            <button
              type="button"
              onClick={applySuperset}
              disabled={!superset}
              className="rounded-xl border border-violet-900/60 bg-violet-950/20 py-2 text-[8px] font-bold text-violet-200 disabled:opacity-35 flex flex-col items-center gap-1"
            >
              <Link2 size={12} /> Süperset Öner
            </button>
          </div>

          {ordering.order.length > 0 && profile !== 'manual' && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              {ordering.order.slice(0, 6).map((exercise, index) => (
                <div key={exercise.uid || `${exercise.name}-${index}`} className="px-2.5 py-1.5 border-b border-zinc-900 last:border-0 flex items-center gap-2">
                  <span className="text-[8px] font-mono text-fuchsia-400 w-3 shrink-0">{index + 1}</span>
                  <span className="text-[9px] text-zinc-300 truncate flex-1">{exercise.name}</span>
                  <span className="text-[7px] font-mono text-zinc-400 shrink-0">{ordering.reasons[index]}</span>
                </div>
              ))}
            </div>
          )}

          {recommendations.length > 0 ? (
            <div className="space-y-1">
              {recommendations.map(item => (
                <p key={item} className="text-[8px] font-mono text-zinc-500 leading-relaxed flex gap-1.5">
                  <Target size={8} className="text-amber-400 shrink-0 mt-0.5" /> {item}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[8px] font-mono text-emerald-300 flex gap-1.5">
              <CheckCircle2 size={9} /> Seçili hedeflere göre belirgin düzenleme gerekmiyor.
            </p>
          )}

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 grid grid-cols-3 gap-2 text-center">
            <span><strong className="text-[10px] font-mono text-zinc-200 block">{initialPreview.totalSets} → {preview.totalSets}</strong><span className="text-[7px] text-zinc-400">set</span></span>
            <span><strong className="text-[10px] font-mono text-zinc-200 block">{initialMinutes} → {minutes}</strong><span className="text-[7px] text-zinc-400">dakika</span></span>
            <span><strong className="text-[10px] font-mono text-zinc-200 block">{initialExercises.length} → {exercises.length}</strong><span className="text-[7px] text-zinc-400">hareket</span></span>
          </div>

          {message && <p className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-[8px] font-mono text-zinc-500 leading-relaxed">{message}</p>}

          <button
            type="button"
            disabled={!changed}
            onClick={() => { onChange?.(cloneExercises(initialExercises)); setMessage('Sihirbaz açıldığı andaki sıra ve setler geri yüklendi.'); }}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2 text-[8px] font-bold text-zinc-500 disabled:opacity-30 flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={10} /> Sihirbaz Değişikliklerini Sıfırla
          </button>

          <p className="text-[8px] font-mono text-zinc-500 leading-relaxed flex items-start gap-1.5">
            <History size={9} className="shrink-0 mt-0.5" /> Hiçbir öneri kendiliğinden uygulanmaz. Mevcut şablonu kaydedersen önceki hali sürüm geçmişine yazılır; ağırlık ve tekrar değerleri hareket adı değişmedikçe korunur.
          </p>
        </div>
      )}
    </section>
  );
});

SessionDesignCard.displayName = 'SessionDesignCard';
export default SessionDesignCard;
