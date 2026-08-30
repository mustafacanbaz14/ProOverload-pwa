import React, { useEffect, useState, useMemo, memo } from 'react';
import {
  X, Wand2, ChevronLeft, ChevronRight, Check, AlertTriangle, CalendarRange,
  Layers, Dumbbell, Target, Pencil, Lock, Unlock, RefreshCw, Ban, Clock, ArrowRight,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, RotateCcw,
} from 'lucide-react';
import {
  buildProgram, SPLIT_DAY_OPTIONS, EQUIPMENT_PROFILES, PRIORITY_MUSCLES, MAX_PRIORITY,
  findSplitPreset, getSplitOptions, SESSION_LENGTHS, findSessionLength,
  scheduleFromWeekdays, auditSchedule,
} from '../utils/programBuilder';
import { compareWithActivePlan } from '../utils/programCompare';
import { SUBSTITUTION_GOALS, suggestSubstitutesByGoal } from '../utils/substitution';
import { ORDER_PROFILES, suggestOrderByProfile } from '../utils/exerciseOrder';
import { WEEKDAYS } from '../utils/weekPlan';
import { lengthBias, LENGTH_BIAS_LABEL } from '../utils/selectionAudit';
import { clearProgramDraft, loadProgramDraft, saveProgramDraft } from '../utils/programDraftStorage';

/**
 * Program sihirbazı.
 *
 * Dört soru soruyor ve programı üretiyor. Sorular, hareket seçimini gerçekten
 * değiştiren şeylerle sınırlı: gün sayısı bölmeyi, ekipman aday havuzunu,
 * deneyim hacim referanslarını, öncelik ise hacmin nereye kaydırılacağını
 * belirliyor. Bunların dışında sorulabilecek her şey (hedef, yaş, süre) ya
 * uygulamada zaten var ya da üretilen programı değiştirmiyordu.
 *
 * Son adım kurulumdan ÖNCE tam raporu gösteriyor: gün gün hareketler, kas kas
 * ölçülen hacim ve varsa uyarılar. Program kurulduktan sonra "bu neden böyle"
 * sorusunu cevaplamak zor; kurulmadan önce cevaplamak kolay.
 */

const ADIMLAR = ['Düzen', 'Ekipman', 'Öncelik', 'Sıra', 'Takvim', 'Kontrol'];
const ORDER_PROFILE_KEYS = ['performance', 'priority', 'alternate', 'upperLower', 'stretch', 'familiar', 'preExhaust'];
const EMPTY_PERFORMED = new Set();
const EMPTY_LIST = [];
const EMPTY_LOCKS = {};

const ProgramWizardModal = memo(({
  isOpen,
  onClose,
  onInstall,
  onCustomize,
  experienceLevel = 'intermediate',
  customExercises = [],
  performedNames = EMPTY_PERFORMED,
  existingTemplateCount = 0,
  allExerciseNames = [],
  activePlan = null,
  templates = [],
  painExclusions = EMPTY_LIST,
  onDraftChange,
}) => {
  const [draftSeed] = useState(() => loadProgramDraft('wizard'));
  const [restoredDraft, setRestoredDraft] = useState(Boolean(draftSeed));
  const [adim, setAdim] = useState(draftSeed?.adim ?? 0);
  const [daysPerWeek, setDaysPerWeek] = useState(draftSeed?.daysPerWeek ?? 4);
  const [splitId, setSplitId] = useState(() => draftSeed?.splitId || findSplitPreset(null, draftSeed?.daysPerWeek ?? 4).id);
  const [equipment, setEquipment] = useState(draftSeed?.equipment || 'full');
  const [priority, setPriority] = useState(draftSeed?.priority || []);
  const [preferPerformed, setPreferPerformed] = useState(draftSeed?.preferPerformed !== false);
  const [openDay, setOpenDay] = useState(draftSeed?.openDay ?? 0);
  const [sessionLength, setSessionLength] = useState(draftSeed?.sessionLength || 'long');
  // Yapılamayan hareketler: havuzdan tamamen çıkıyor.
  const [excluded, setExcluded] = useState(draftSeed?.excluded || EMPTY_LIST);
  // Beğenilip sabitlenen hareketler: { 'Gün Adı': ['Hareket'] }.
  const [locked, setLocked] = useState(draftSeed?.locked || EMPTY_LOCKS);
  // Yeniden üretim sayacı: değişince useMemo yeniden çalışıyor ve kilitli
  // olmayan hareketler baştan seçiliyor.
  const [regenSeed, setRegenSeed] = useState(draftSeed?.regenSeed ?? 0);
  // Kullanıcının seçtiği antrenman günleri; boşken bölmenin hazır takvimi.
  const [weekdays, setWeekdays] = useState(draftSeed?.weekdays || EMPTY_LIST);
  // Tek hareketi değiştirme paneli açık olan hareket.
  const [swapping, setSwapping] = useState(null);
  // Elle yapılan tekil değişimler: { 'Gün Adı::Eski Ad': 'Yeni Ad' }.
  const [swaps, setSwaps] = useState(draftSeed?.swaps || EMPTY_LOCKS);
  // Hareket sırası ayrı bir karar: aynı hareket ve set listesi farklı amaçlarla
  // farklı dizilebilir. Elle taşıma yapılınca yalnız o günün ad sırası saklanır.
  const [orderProfile, setOrderProfile] = useState(draftSeed?.orderProfile || 'performance');
  const [manualOrders, setManualOrders] = useState(draftSeed?.manualOrders || EMPTY_LOCKS);
  const [substitutionGoal, setSubstitutionGoal] = useState(draftSeed?.substitutionGoal || 'closest');

  useEffect(() => {
    if (!isOpen) return;
    const snapshot = {
      adim, daysPerWeek, splitId, equipment, priority, preferPerformed, openDay,
      sessionLength, excluded, locked, regenSeed, weekdays, swaps, orderProfile,
      manualOrders, substitutionGoal,
    };
    if (saveProgramDraft('wizard', snapshot)) onDraftChange?.({ kind: 'wizard', step: adim + 1 });
  }, [isOpen, adim, daysPerWeek, splitId, equipment, priority, preferPerformed,
    openDay, sessionLength, excluded, locked, regenSeed, weekdays, swaps,
    orderProfile, manualOrders, substitutionGoal, onDraftChange]);

  const clearDraft = () => {
    clearProgramDraft('wizard');
    onDraftChange?.(null);
  };

  const resetWizard = () => {
    clearDraft();
    setRestoredDraft(false);
    setAdim(0);
    setDaysPerWeek(4);
    setSplitId(findSplitPreset(null, 4).id);
    setEquipment('full');
    setPriority([]);
    setPreferPerformed(true);
    setOpenDay(0);
    setSessionLength('long');
    setExcluded([]);
    setLocked({});
    setRegenSeed(0);
    setWeekdays([]);
    setSwapping(null);
    setSwaps({});
    setOrderProfile('performance');
    setManualOrders({});
    setSubstitutionGoal('closest');
  };

  const splitOptions = useMemo(() => getSplitOptions(daysPerWeek), [daysPerWeek]);

  // Elle değiştirilen hareketler de kilitli sayılıyor: kullanıcı bilerek
  // seçtiği bir hareketi bir sonraki üretimde kaybetmemeli.
  const effectiveLocks = useMemo(() => {
    const out = {};
    Object.entries(locked).forEach(([gun, liste]) => { out[gun] = [...liste]; });
    Object.entries(swaps).forEach(([anahtar, yeniAd]) => {
      const gun = anahtar.split('::')[0];
      if (!out[gun]) out[gun] = [];
      if (!out[gun].includes(yeniAd)) out[gun].push(yeniAd);
    });
    return out;
  }, [locked, swaps]);

  const generated = useMemo(
    () => (isOpen ? buildProgram({
      daysPerWeek,
      splitId,
      equipment,
      experienceLevel,
      priority,
      preferredExercises: preferPerformed ? [...performedNames] : [],
      customExercises,
      excludedExercises: excluded,
      lockedExercises: effectiveLocks,
      sessionLength,
      // Varyant aday listesini kaydırıyor: kilitli olmayan hareketler aynı
      // kurallarla ama farklı bir eşdeğer seçimle yeniden kuruluyor.
      variant: regenSeed,
    }) : null),
    [isOpen, daysPerWeek, splitId, equipment, experienceLevel, priority, preferPerformed,
      performedNames, customExercises, excluded, effectiveLocks, sessionLength, regenSeed]);

  const built = useMemo(() => {
    if (!generated) return null;
    const priorityMuscle = priority[0] || '';
    return {
      ...generated,
      days: generated.days.map(day => {
        const suggested = suggestOrderByProfile(day.exercises, {
          profile: orderProfile === 'manual' ? 'performance' : orderProfile,
          priorityMuscle,
          customExercises,
          performedNames,
        });
        const reasonByName = new Map(suggested.order.map((exercise, index) => [exercise.name, suggested.reasons[index]]));
        const requested = manualOrders[day.name] || [];
        const byName = new Map(suggested.order.map(exercise => [exercise.name, exercise]));
        const manual = requested.map(name => byName.get(name)).filter(Boolean);
        const used = new Set(manual.map(exercise => exercise.name));
        const order = requested.length
          ? [...manual, ...suggested.order.filter(exercise => !used.has(exercise.name))]
          : suggested.order;
        return {
          ...day,
          exercises: order.map(exercise => ({
            ...exercise,
            orderReason: requested.length ? 'Elle belirlenen sıra' : reasonByName.get(exercise.name),
          })),
        };
      }),
    };
  }, [generated, orderProfile, priority, customExercises, performedNames, manualOrders]);

  const schedule = useMemo(
    () => (built ? scheduleFromWeekdays(built.split, weekdays) : {}),
    [built, weekdays]);

  const scheduleAudit = useMemo(
    () => (built ? auditSchedule(built.split, schedule) : null),
    [built, schedule]);

  const comparison = useMemo(
    () => compareWithActivePlan(built, activePlan, templates, { customExercises, experienceLevel }),
    [built, activePlan, templates, customExercises, experienceLevel]);

  const swapOptions = useMemo(() => {
    if (!swapping) return [];
    return suggestSubstitutesByGoal(swapping.name, allExerciseNames, {
      customExercises,
      performed: performedNames,
      goal: substitutionGoal,
      limit: 6,
    })
      .filter(o => !excluded.includes(o.name));
  }, [swapping, allExerciseNames, customExercises, performedNames, substitutionGoal, excluded]);

  if (!isOpen) return null;

  const oncelikSec = (kas) => {
    setPriority(prev => {
      if (prev.includes(kas)) return prev.filter(k => k !== kas);
      // Üçüncü önceliği eklemek yerine en eskisi düşüyor: "her şey öncelikli"
      // demek hiçbir şeyin öncelikli olmaması demek, hacim bir yerden gelmeli.
      return [...prev, kas].slice(-MAX_PRIORITY);
    });
  };

  const kilitliMi = (gunAdi, ad) => (effectiveLocks[gunAdi] || []).includes(ad);

  const kilitDegistir = (gunAdi, ad) => {
    setLocked(prev => {
      const mevcut = prev[gunAdi] || [];
      const sonraki = mevcut.includes(ad) ? mevcut.filter(x => x !== ad) : [...mevcut, ad];
      return { ...prev, [gunAdi]: sonraki };
    });
    // Elle değiştirilmiş bir hareketin kilidi açılıyorsa değişimi de bırak;
    // yoksa kilit açık görünür ama hareket yeniden üretimde geri gelmezdi.
    setSwaps(prev => {
      const anahtar = Object.keys(prev).find(k => k.startsWith(`${gunAdi}::`) && prev[k] === ad);
      if (!anahtar) return prev;
      const { [anahtar]: _cikan, ...kalan } = prev;
      return kalan;
    });
  };

  const hareketDegistir = (gunAdi, eskiAd, yeniAd) => {
    setSwaps(prev => ({ ...prev, [`${gunAdi}::${eskiAd}`]: yeniAd }));
    setLocked(prev => ({
      ...prev,
      [gunAdi]: (prev[gunAdi] || []).filter(x => x !== eskiAd),
    }));
    setManualOrders(prev => ({
      ...prev,
      [gunAdi]: (prev[gunAdi] || []).map(name => (name === eskiAd ? yeniAd : name)),
    }));
    setSwapping(null);
  };

  const disla = (ad) => {
    setExcluded(prev => (prev.includes(ad) ? prev.filter(x => x !== ad) : [...prev, ad]));
    // Dışlanan hareket kilitli kalamaz.
    setLocked(prev => Object.fromEntries(
      Object.entries(prev).map(([g, liste]) => [g, liste.filter(x => x !== ad)])));
  };

  const gunSec = (key) => {
    setWeekdays(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      // Bölmenin gün sayısı kadar seçilebilir; fazlası en eskiyi düşürür.
      return [...prev, key].slice(-daysPerWeek);
    });
  };

  const sirayiElleDegistir = (gunAdi, hareketAdi, target) => {
    const day = built?.days?.find(item => item.name === gunAdi);
    if (!day) return;
    const names = day.exercises.map(exercise => exercise.name);
    const index = names.indexOf(hareketAdi);
    if (index < 0) return;
    const to = target === 'top' ? 0
      : target === 'bottom' ? names.length - 1
        : Math.max(0, Math.min(names.length - 1, index + target));
    if (to === index) return;
    const [moved] = names.splice(index, 1);
    names.splice(to, 0, moved);
    setOrderProfile('manual');
    setManualOrders(prev => ({ ...prev, [gunAdi]: names }));
  };

  const sirayiSifirla = (gunAdi = null) => {
    if (!gunAdi) setManualOrders(EMPTY_LOCKS);
    else setManualOrders(prev => {
      const { [gunAdi]: _removed, ...remaining } = prev;
      return remaining;
    });
    if (orderProfile === 'manual') setOrderProfile('performance');
  };

  const sonAdim = adim === ADIMLAR.length - 1;
  const uyariVar = built && (built.belowMev.length > 0 || built.overloadedDays.length > 0);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[92] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Wand2 size={15} className="mr-2 text-violet-400" /> Program Sihirbazı
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      {/* Adım göstergesi */}
      <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/80 shrink-0 flex gap-2">
        {ADIMLAR.map((ad, i) => (
          <div key={ad} className="flex-1">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${i < adim ? 'bg-violet-600' : i === adim ? 'bg-violet-400 shadow-sm shadow-violet-500/50' : 'bg-zinc-800'}`} />
            <span className={`text-[8px] font-mono font-bold uppercase tracking-widest block mt-1.5 ${i === adim ? 'text-violet-400' : 'text-zinc-500'}`}>
              {ad}
            </span>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 border-b border-zinc-800/80 bg-violet-950/20 flex items-center justify-between gap-3">
        <span className="text-[8px] font-mono text-zinc-400">
          {restoredDraft ? 'Kaldığın taslak geri yüklendi' : 'Her seçim bu cihazda otomatik kaydedilir'}
        </span>
        <button type="button" onClick={resetWizard} className="text-[9px] font-black uppercase tracking-wider text-violet-400 active:text-violet-200 shrink-0">
          Sıfırdan Başla
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">

        {adim === 0 && (
          <>
            <p className="text-[10px] font-mono text-zinc-400 leading-relaxed px-1">
              Önce haftalık gün sayını, sonra sana en rahat gelen çalışma
              düzenini seç. Aynı gün sayısında tek bir doğru bölme yoktur.
            </p>

            <div className="grid grid-cols-5 gap-1.5">
              {SPLIT_DAY_OPTIONS.map(g => {
                const secili = daysPerWeek === g;
                return (
                  <button
                    key={g}
                    onClick={() => {
                      const varsayilan = findSplitPreset(null, g);
                      setDaysPerWeek(g);
                      setSplitId(varsayilan.id);
                      setOpenDay(0);
                    }}
                    aria-pressed={secili}
                    className={`rounded-2xl py-3 border font-mono active:scale-[0.97] transition-all shadow-sm ${secili ? 'border-violet-500 bg-gradient-to-b from-violet-950/60 to-zinc-950 text-violet-200 shadow-violet-950/40' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
                  >
                    <strong className="text-sm font-black block">{g}</strong>
                    <span className="text-[8px] uppercase tracking-wider">gün</span>
                  </button>
                );
              })}
            </div>

            {/* Seans süresi */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-zinc-200 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Clock size={12} className="text-cyan-400" /> Seansa ayırabildiğin süre
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {SESSION_LENGTHS.map(u => {
                  const secili = sessionLength === u.key;
                  return (
                    <button
                      key={u.key}
                      onClick={() => setSessionLength(u.key)}
                      aria-pressed={secili}
                      title={u.hint}
                      className={`rounded-2xl py-2.5 border font-mono active:scale-[0.97] transition-all shadow-sm ${secili ? 'border-cyan-500 bg-gradient-to-b from-cyan-950/50 to-zinc-950 text-cyan-200 shadow-cyan-950/40' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
                    >
                      <strong className="text-[11px] font-bold block">{u.label}</strong>
                      <span className="text-[8px]">≤{u.cap} set</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed px-1">
                {findSessionLength(sessionLength).hint}. Set başına ısınma ve
                dinlenme dahil ortalama üç dakika sayılıyor.
              </p>
            </div>

            <div className="flex items-center justify-between px-1 pt-1">
              <h4 className="text-[10px] font-black text-zinc-200 uppercase tracking-widest">
                {daysPerWeek} gün için {splitOptions.length} düzen
              </h4>
              <span className="text-[8px] font-mono text-zinc-500">birini seç</span>
            </div>

            <div className="space-y-2.5">
              {splitOptions.map(secenek => {
                const secili = splitId === secenek.id;
                return (
                  <button
                    key={secenek.id}
                    onClick={() => { setSplitId(secenek.id); setOpenDay(0); }}
                    aria-pressed={secili}
                    className={`w-full text-left rounded-3xl p-4 border active:scale-[0.99] transition-all ${secili ? 'border-violet-500 bg-gradient-to-br from-violet-950/30 via-zinc-900/90 to-zinc-950 shadow-xl shadow-violet-950/30' : 'border-zinc-800/80 bg-zinc-950'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <strong className={`text-[12px] font-bold block leading-snug ${secili ? 'text-violet-200' : 'text-zinc-200'}`}>
                          {secenek.name}
                        </strong>
                        <span className="text-[9px] font-mono text-zinc-500 block mt-0.5">
                          {secenek.summary}
                        </span>
                      </span>
                      {secenek.recommended && (
                        <span className="text-[8px] font-black tracking-wider text-emerald-300 bg-emerald-950/50 border border-emerald-900/60 px-2 py-1 rounded-lg shrink-0">
                          DENGELİ
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {secenek.tags.map(tag => (
                        <span key={tag} className="text-[8px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg px-1.5 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {secili && built && (
                      <div className="mt-2 flex gap-1.5">
                        <span className="text-[8px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg px-1.5 py-1">
                          {built.totalSets} set/hafta
                        </span>
                        <span className={`text-[8px] font-mono rounded-lg px-1.5 py-1 border ${built.sessionFit.ok ? 'text-emerald-300 bg-emerald-950/25 border-emerald-900/50' : 'text-amber-300 bg-amber-950/25 border-amber-900/50'}`}>
                          en yüklü gün {built.sessionFit.worstDay} set
                        </span>
                        {built.belowMev.length > 0 && (
                          <span className="text-[8px] font-mono text-amber-300 bg-amber-950/25 border border-amber-900/50 rounded-lg px-1.5 py-1">
                            {built.belowMev.length} kas eşik altı
                          </span>
                        )}
                      </div>
                    )}
                    {secili && (
                      <div className="mt-2.5 pt-2.5 border-t border-violet-900/30">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {secenek.days.map(day => (
                            <span key={day.name} className="text-[8px] font-mono text-violet-300 bg-violet-950/35 rounded-lg px-1.5 py-1">
                              {day.name}
                            </span>
                          ))}
                        </div>
                        <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">{secenek.rationale}</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {built && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
                  <strong className="text-sm font-mono text-zinc-100 block">{built.totalSets}</strong>
                  <span className="text-[8px] font-mono text-zinc-500">set / hafta</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
                  <strong className="text-sm font-mono text-zinc-100 block">~{Math.round(built.totalSets / built.days.length)}</strong>
                  <span className="text-[8px] font-mono text-zinc-500">set / seans</span>
                </div>
              </div>
            )}

            {built && !built.sessionFit.ok && (
              <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[9px] font-mono text-amber-200/90 leading-relaxed">
                  {built.sessionFit.detail}
                  {built.sessionFit.suggestion
                    ? ` Aynı hacmi bu süreye sığdırmak için haftada ${built.sessionFit.suggestion} gün gerekiyor.`
                    : ' Süreyi uzatmak ya da gün eklemek dışında çözüm yok.'}
                </p>
              </div>
            )}

            <div className="bg-cyan-950/15 border border-cyan-900/30 rounded-xl p-3">
              <p className="text-[9px] font-mono text-cyan-200/80 leading-relaxed">
                Eşit haftalık hacimde Full Body, Üst/Alt veya hibrit bölmenin adı
                tek başına gelişimi belirlemez. Düzenli sürdürebildiğin ve set
                kalitesini koruduğun düzeni seç.
              </p>
            </div>

            <button
              onClick={() => setAdim(ADIMLAR.length - 1)}
              className="w-full py-3 rounded-2xl border border-violet-800/60 bg-violet-950/25 text-violet-300 font-bold text-[10px] uppercase tracking-wider"
            >
              Varsayılanlarla Hızlı Önizle
            </button>
          </>
        )}

        {adim === 1 && (
          <>
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
              Salonunda ne var? Bu, aday hareketleri süzüyor — "kanadım için ne
              yapayım" sorusunun cevabı barfiks çekebilenle sadece makine
              bulabilende aynı değil.
            </p>
            {EQUIPMENT_PROFILES.map(p => {
              const secili = equipment === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setEquipment(p.key)}
                  className={`w-full text-left rounded-2xl p-3.5 border transition-colors ${secili ? 'border-violet-600 bg-violet-950/20' : 'border-zinc-800 bg-zinc-900'}`}
                >
                  <strong className={`text-[12px] block ${secili ? 'text-violet-300' : 'text-zinc-200'}`}>{p.label}</strong>
                  <span className="text-[9px] font-mono text-zinc-500">{p.hint}</span>
                </button>
              );
            })}
            {performedNames.size > 0 && (
              <button
                onClick={() => setPreferPerformed(v => !v)}
                aria-pressed={preferPerformed}
                className={`w-full rounded-2xl p-3.5 border flex items-center gap-3 text-left ${preferPerformed ? 'border-cyan-800/60 bg-cyan-950/20' : 'border-zinc-800 bg-zinc-900'}`}
              >
                <span className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${preferPerformed ? 'border-cyan-600 bg-cyan-500 text-zinc-950' : 'border-zinc-700 bg-zinc-950 text-zinc-600'}`}>
                  {preferPerformed ? <Check size={15} /> : <Dumbbell size={14} />}
                </span>
                <span className="min-w-0">
                  <strong className={`text-[11px] block ${preferPerformed ? 'text-cyan-200' : 'text-zinc-300'}`}>
                    Bildiğim hareketleri öne al
                  </strong>
                  <span className="text-[9px] font-mono text-zinc-500 leading-relaxed block mt-0.5">
                    Geçmişindeki {performedNames.size} hareket, uygun olduğu yerde önce seçilir.
                  </span>
                </span>
              </button>
            )}
            {/* Yapılamayan hareketler. Ekipman profili kaba bir süzgeç:
                salonda barbell var ama omzun izin vermiyorsa bench press
                havuzda kalmaya devam ediyordu ve üretilen programı her
                seferinde elle düzeltmek gerekiyordu. */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-2">
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                <Ban size={11} className="text-red-400" /> Yapamadığın hareketler
              </span>
              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                Bunlar aday havuzundan tamamen çıkar — "önerilmesin" değil, "hiç
                seçilmesin". Bir kasın bütün adayları çıkarsa üretici o kası
                atlar ve raporda hacmi eksik gösterir.
              </p>

              {painExclusions.length > 0 && (
                <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-2 space-y-1.5">
                  <span className="text-[9px] font-mono text-amber-300/85 block leading-relaxed">
                    Ağrı günlüğüne göre şu bölgeler sürüyor; bu hareketler o
                    bölgeleri yüklüyor:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {painExclusions.map(ad => (
                      <button
                        key={ad}
                        onClick={() => disla(ad)}
                        aria-pressed={excluded.includes(ad)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold border ${excluded.includes(ad)
                          ? 'border-red-800 bg-red-950/40 text-red-300'
                          : 'border-zinc-700 bg-zinc-950 text-zinc-400'}`}
                      >
                        {excluded.includes(ad) && <Ban size={8} className="inline mr-1" />}{ad}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {excluded.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {excluded.map(ad => (
                    <button
                      key={ad}
                      onClick={() => disla(ad)}
                      className="px-2 py-1 rounded-lg text-[9px] font-bold border border-red-800 bg-red-950/40 text-red-300"
                    >
                      <Ban size={8} className="inline mr-1" />{ad}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-[9px] font-mono text-zinc-600 block">
                  Dışlanan hareket yok. Kontrol adımında herhangi bir hareketi
                  tek dokunuşla buraya ekleyebilirsin.
                </span>
              )}
            </div>

            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
              Deneyim seviyesi ayarlardan alınıyor; hacim bandı (eşik / verimli)
              ona göre ölçekleniyor.
            </p>
          </>
        )}

        {adim === 4 && built && (
          <>
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
              Hangi günler gelebiliyorsun? Bölmenin hazır takvimi Pazartesi'den
              başlıyor ama bu herkese uymuyor. Seçmezsen hazır takvim kullanılır.
            </p>

            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map(g => {
                const secili = weekdays.includes(g.key);
                const sira = weekdays.indexOf(g.key);
                return (
                  <button
                    key={g.key}
                    onClick={() => gunSec(g.key)}
                    aria-pressed={secili}
                    className={`rounded-xl py-2 border font-mono transition-colors ${secili ? 'border-violet-500 bg-violet-950/35 text-violet-200' : 'border-zinc-800 bg-zinc-900 text-zinc-600'}`}
                  >
                    <strong className="text-[10px] block">{g.short}</strong>
                    <span className="text-[8px]">{secili ? built.split.days[sira]?.name?.slice(0, 6) || '·' : '—'}</span>
                  </button>
                );
              })}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-2">
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">
                Takvim
              </span>
              {weekdays.length === 0 ? (
                <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                  Hazır takvim: {Object.entries(built.split.schedule)
                    .sort((a, b) => a[1] - b[1])
                    .map(([k, i]) => `${WEEKDAYS.find(w => w.key === k)?.short} → ${built.split.days[i]?.name}`)
                    .join(' · ')}
                </p>
              ) : weekdays.length !== daysPerWeek ? (
                <p className="text-[9px] font-mono text-amber-300/85 leading-relaxed">
                  {daysPerWeek} gün seçmen gerekiyor, {weekdays.length} seçildi.
                  Eksik kaldığı sürece hazır takvim kullanılır.
                </p>
              ) : (
                <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                  {Object.entries(schedule)
                    .sort((a, b) => a[1] - b[1])
                    .map(([k, i]) => `${WEEKDAYS.find(w => w.key === k)?.short} → ${built.split.days[i]?.name}`)
                    .join(' · ')}
                </p>
              )}

              {/* Aynı kası iki gün üst üste yüklemek toparlanmayı kesiyor.
                  Uyarı engel değil: bazen tek seçenek arka arkaya iki gündür. */}
              {scheduleAudit && !scheduleAudit.ok && (
                <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-2 flex items-start gap-2">
                  <AlertTriangle size={11} className="text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[9px] font-mono text-amber-200/85 leading-relaxed">
                    {scheduleAudit.conflicts.map(c => (
                      `${c.dayA} ile ${c.dayB} arka arkaya ve ${c.shared.slice(0, 3).join(', ')} ortak.`
                    )).join(' ')}
                    {' '}Aynı kası iki gün üst üste yüklemek toparlanmayı kesiyor;
                    araya bir gün koyabiliyorsan koy. Koyamıyorsan bu, hiç
                    çalışmamaktan iyidir.
                  </span>
                </div>
              )}
              {scheduleAudit?.ok && weekdays.length === daysPerWeek && (
                <p className="text-[9px] font-mono text-emerald-300/80 leading-relaxed">
                  <Check size={9} className="inline mr-1" />
                  Arka arkaya gelen günler ortak kas yüklemiyor.
                </p>
              )}
            </div>
          </>
        )}

        {adim === 2 && (
          <>
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
              Geride kalan ya da öne çıkarmak istediğin en fazla {MAX_PRIORITY} kas
              seç. Seçilenler verimli bandın üst ucuna, diğerleri alt ucuna
              yerleşir. Hiçbiri seçilmezse hacim dengeli dağılır.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_MUSCLES.map(kas => {
                const secili = priority.includes(kas);
                return (
                  <button
                    key={kas}
                    onClick={() => oncelikSec(kas)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${secili ? 'border-violet-600 bg-violet-950/30 text-violet-300' : 'border-zinc-800 bg-zinc-900 text-zinc-400'}`}
                  >
                    {secili && <Check size={9} className="inline mr-1" />}{kas}
                  </button>
                );
              })}
            </div>
            {priority.length > 0 && (
              <button
                onClick={() => setPriority([])}
                className="text-[10px] font-mono text-zinc-500 active:text-zinc-300 px-1"
              >
                Seçimi temizle
              </button>
            )}
          </>
        )}

        {adim === 3 && built && (
          <>
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
              Hareket seçimi aynı kalır; yalnız seans içindeki sıra değişir.
              Tek bir evrensel doğru yok: ağır performans, kas önceliği ve
              yorgunluk dağılımı farklı sıralar gerektirir.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {ORDER_PROFILE_KEYS.map(key => {
                const item = ORDER_PROFILES[key];
                const selected = orderProfile === key;
                const disabled = key === 'familiar' && performedNames.size === 0;
                return (
                  <button
                    type="button"
                    key={key}
                    disabled={disabled}
                    onClick={() => { setOrderProfile(key); setManualOrders(EMPTY_LOCKS); }}
                    aria-pressed={selected}
                    className={`rounded-2xl border p-3 text-left disabled:opacity-35 ${selected ? 'border-fuchsia-500 bg-fuchsia-950/30' : 'border-zinc-800 bg-zinc-900'}`}
                  >
                    <strong className={`text-[10px] block ${selected ? 'text-fuchsia-200' : 'text-zinc-300'}`}>{item.label}</strong>
                    <span className="text-[8px] font-mono text-zinc-600 leading-relaxed block mt-1">{item.detail}</span>
                  </button>
                );
              })}
            </div>

            {(orderProfile === 'priority' || orderProfile === 'preExhaust') && priority.length === 0 && (
              <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-2.5 flex gap-2">
                <AlertTriangle size={11} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[9px] font-mono text-amber-200/85 leading-relaxed">
                  Bu sıra için Öncelik adımında en az bir kas seçmelisin. Seçmezsen performans sırası kullanılır.
                </p>
              </div>
            )}

            {ORDER_PROFILES[orderProfile]?.caution && (
              <p className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-2.5 text-[9px] font-mono text-amber-200/85 leading-relaxed">
                Ön yorgunluk seçili kası daha erken hissettirebilir fakat sonraki bileşke harekette kaldırılan yükü veya tekrarı düşürebilir. Uygulama bunu “daha iyi” diye etiketlemez.
              </p>
            )}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
                <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Örnek · {built.days[0]?.name}</span>
                <span className="text-[8px] font-mono text-zinc-600">ilk {Math.min(8, built.days[0]?.exercises.length || 0)} hareket</span>
              </div>
              {(built.days[0]?.exercises || []).slice(0, 8).map((exercise, index) => (
                <div key={exercise.name} className="px-3 py-1.5 border-b border-zinc-800/70 last:border-0 flex gap-2 items-center">
                  <span className="text-[8px] font-mono text-fuchsia-400 w-3 shrink-0">{index + 1}</span>
                  <span className="text-[9px] text-zinc-300 truncate flex-1">{exercise.name}</span>
                  <span className="text-[7px] font-mono text-zinc-600 shrink-0">{exercise.orderReason}</span>
                </div>
              ))}
            </div>

            <p className="text-[8px] font-mono text-zinc-700 leading-relaxed px-1">
              Kontrol adımında her hareketi tek basamak, en üste veya en alta da taşıyabilirsin. Elle değişiklik yalnız seçili güne uygulanır.
            </p>
          </>
        )}

        {adim === 5 && built && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <CalendarRange size={13} className="text-cyan-400" />, value: daysPerWeek, label: 'gün' },
                { icon: <Layers size={13} className="text-emerald-400" />, value: built.totalSets, label: 'set/hafta' },
                { icon: <Dumbbell size={13} className="text-amber-400" />, value: built.days.reduce((t, d) => t + d.exercises.length, 0), label: 'hareket' },
              ].map(k => (
                <div key={k.label} className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-center">
                  <div className="flex justify-center mb-1">{k.icon}</div>
                  <span className="text-sm font-mono font-bold text-zinc-100 block">{k.value}</span>
                  <span className="text-[9px] font-mono text-zinc-500">{k.label}</span>
                </div>
              ))}
            </div>

            {uyariVar ? (
              <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[10px] font-mono text-amber-200 leading-relaxed space-y-1.5">
                  {built.belowMev.length > 0 && (
                    <p>
                      <strong>Koruma eşiğinin altında:</strong> {built.belowMev.join(', ')}.
                      Seçtiğin gün sayısı bu kaslara yetecek hacmi taşımıyor; gün
                      eklersen kapanır.
                    </p>
                  )}
                  {built.overloadedDays.length > 0 && (
                    <p>
                      <strong>Uzun seans:</strong> {built.overloadedDays.map(d => `${d.name} (${d.sets} set)`).join(', ')}.
                      Seans başına {built.sessionCap} setin üstü. Bu bölmede tüm
                      kasları eşiğin üstünde tutmakla seansı kısa tutmak aynı anda
                      mümkün değil — hangisinden vazgeçeceğin senin kararın.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
                <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10px] font-mono text-emerald-200 leading-relaxed">
                  Her kas eşiğin üstünde, tartışmalı bandın sonunun altında ve
                  gerilmede yükleyen en az bir harekete sahip. Bu, iddia değil
                  ölçüm: program kurulmadan önce uygulamanın kendi hacim
                  çözümleyicisinden geçirildi.
                </p>
              </div>
            )}

            {/* Gün gün program */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-center gap-2">
                <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest truncate min-w-0">
                  {built.split.name}
                </h4>
                {/* Beğenmediğin seçimi tümden yenile. Kilitli hareketler
                    korunuyor; üretici aynı kurallarla farklı ama eşdeğer bir
                    seçim kuruyor. Aynı varyant numarası her zaman aynı
                    programı verdiği için ileri geri gezinilebiliyor. */}
                <span className="shrink-0 flex items-center gap-1">
                  {Object.keys(manualOrders).length > 0 && (
                    <button
                      onClick={() => sirayiSifirla()}
                      title="Elle yapılan bütün sıra değişikliklerini sıfırla"
                      aria-label="Bütün manuel sıraları sıfırla"
                      className="p-1.5 rounded-lg border border-zinc-800 text-zinc-500 active:text-cyan-300"
                    >
                      <RotateCcw size={10} />
                    </button>
                  )}
                  <button
                    onClick={() => { setRegenSeed(v => v + 1); setSwapping(null); }}
                    className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-1 rounded-lg text-[9px] font-bold active:bg-zinc-800"
                  >
                    <RefreshCw size={10} /> Yeniden Üret
                  </button>
                </span>
              </div>
              {(Object.values(effectiveLocks).some(l => l.length > 0) || excluded.length > 0) && (
                <div className="px-4 py-2 bg-zinc-950/40 border-b border-zinc-800 flex flex-wrap gap-1.5">
                  {Object.values(effectiveLocks).flat().length > 0 && (
                    <span className="text-[8px] font-mono text-amber-300 bg-amber-950/25 border border-amber-900/50 rounded-lg px-1.5 py-1">
                      <Lock size={8} className="inline mr-1" />
                      {Object.values(effectiveLocks).flat().length} hareket sabit
                    </span>
                  )}
                  {excluded.length > 0 && (
                    <span className="text-[8px] font-mono text-red-300 bg-red-950/25 border border-red-900/50 rounded-lg px-1.5 py-1">
                      <Ban size={8} className="inline mr-1" />{excluded.length} hareket dışlandı
                    </span>
                  )}
                  {regenSeed > 0 && (
                    <span className="text-[8px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-800 rounded-lg px-1.5 py-1">
                      varyant {regenSeed}
                    </span>
                  )}
                </div>
              )}
              <div className="divide-y divide-zinc-800/70">
                {built.days.map((gun, i) => {
                  const acik = openDay === i;
                  const previewSchedule = weekdays.length === daysPerWeek ? schedule : built.split.schedule;
                  const gunKey = Object.entries(previewSchedule).find(([, idx]) => idx === i)?.[0];
                  const gunAdi = WEEKDAYS.find(w => w.key === gunKey)?.label || '';
                  const setler = gun.exercises.reduce((t, e) => t + e.sets, 0);
                  return (
                    <div key={gun.name}>
                      <button
                        onClick={() => setOpenDay(acik ? -1 : i)}
                        aria-expanded={acik}
                        className="w-full px-4 py-2.5 flex justify-between items-center gap-2 text-left active:bg-zinc-800/50 transition-colors"
                      >
                        <span className="min-w-0">
                          <strong className="text-[11px] text-zinc-200 block truncate">{gun.name}</strong>
                          <span className="text-[9px] font-mono text-cyan-500">{gunAdi}</span>
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                          {gun.exercises.length} hareket · {setler} set
                        </span>
                      </button>
                      {acik && (
                        <div className="px-4 pb-3 pt-0.5 space-y-1 bg-zinc-950/50">
                          {gun.exercises.map((ex, exIndex) => {
                            const kilit = kilitliMi(gun.name, ex.name);
                            const degistiriliyor = swapping?.day === gun.name && swapping?.name === ex.name;
                            return (
                              <div key={ex.name} className="space-y-1">
                                <div className="flex justify-between items-center gap-1.5 text-[10px] font-mono">
                                  <span className="text-zinc-300 truncate min-w-0 flex-1">{ex.name}</span>
                                  <span className="shrink-0 flex items-center gap-1">
                                    <span className={lengthBias(ex.name) === 'stretch' ? 'text-cyan-500' : 'text-zinc-600'}>
                                      {LENGTH_BIAS_LABEL[lengthBias(ex.name)]}
                                    </span>
                                    <strong className="text-zinc-300">{ex.sets}s</strong>
                                    {/* Kilit: yeniden üretimde bu hareket korunur. */}
                                    <button
                                      onClick={() => kilitDegistir(gun.name, ex.name)}
                                      aria-pressed={kilit}
                                      title={kilit ? 'Kilidi aç' : 'Bu hareketi sabitle'}
                                      aria-label={`${ex.name} ${kilit ? 'kilidini aç' : 'hareketini sabitle'}`}
                                      className={`p-1 ${kilit ? 'text-amber-400' : 'text-zinc-700 active:text-amber-400'}`}
                                    >
                                      {kilit ? <Lock size={11} /> : <Unlock size={11} />}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSubstitutionGoal('closest');
                                        setSwapping(degistiriliyor ? null : { day: gun.name, name: ex.name });
                                      }}
                                      title="Bu hareketi değiştir"
                                      aria-label={`${ex.name} hareketini değiştir`}
                                      aria-expanded={degistiriliyor}
                                      className={`p-1 ${degistiriliyor ? 'text-emerald-400' : 'text-zinc-700 active:text-emerald-400'}`}
                                    >
                                      <RefreshCw size={11} />
                                    </button>
                                    <button
                                      onClick={() => disla(ex.name)}
                                      title="Bu hareketi yapamıyorum"
                                      aria-label={`${ex.name} hareketini dışla`}
                                      className="p-1 text-zinc-700 active:text-red-400"
                                    >
                                      <Ban size={11} />
                                    </button>
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 pl-0.5">
                                  <span className="text-[7px] font-mono text-zinc-700 truncate flex-1">{ex.orderReason}</span>
                                  <button onClick={() => sirayiElleDegistir(gun.name, ex.name, 'top')} disabled={exIndex === 0} title="En üste taşı" aria-label={`${ex.name} en üste taşı`} className="p-1 text-zinc-700 active:text-cyan-400 disabled:opacity-20"><ChevronsUp size={10} /></button>
                                  <button onClick={() => sirayiElleDegistir(gun.name, ex.name, -1)} disabled={exIndex === 0} title="Yukarı taşı" aria-label={`${ex.name} yukarı taşı`} className="p-1 text-zinc-700 active:text-cyan-400 disabled:opacity-20"><ArrowUp size={10} /></button>
                                  <button onClick={() => sirayiElleDegistir(gun.name, ex.name, 1)} disabled={exIndex === gun.exercises.length - 1} title="Aşağı taşı" aria-label={`${ex.name} aşağı taşı`} className="p-1 text-zinc-700 active:text-cyan-400 disabled:opacity-20"><ArrowDown size={10} /></button>
                                  <button onClick={() => sirayiElleDegistir(gun.name, ex.name, 'bottom')} disabled={exIndex === gun.exercises.length - 1} title="En alta taşı" aria-label={`${ex.name} en alta taşı`} className="p-1 text-zinc-700 active:text-cyan-400 disabled:opacity-20"><ChevronsDown size={10} /></button>
                                </div>
                                {degistiriliyor && (
                                  <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/10 p-2 space-y-1.5">
                                    <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1">
                                      {Object.values(SUBSTITUTION_GOALS).map(goal => (
                                        <button
                                          type="button"
                                          key={goal.key}
                                          onClick={() => setSubstitutionGoal(goal.key)}
                                          aria-pressed={substitutionGoal === goal.key}
                                          title={goal.detail}
                                          className={`shrink-0 rounded-lg border px-2 py-1 text-[8px] font-bold ${substitutionGoal === goal.key ? 'border-emerald-600 bg-emerald-950/30 text-emerald-300' : 'border-zinc-800 bg-zinc-900 text-zinc-600'}`}
                                        >
                                          {goal.label}
                                        </button>
                                      ))}
                                    </div>
                                    <span className="text-[8px] font-mono text-emerald-400/70 block">
                                      {SUBSTITUTION_GOALS[substitutionGoal]?.detail}
                                    </span>
                                    <div className="space-y-1">
                                      {swapOptions.length === 0 ? (
                                        <span className="text-[9px] font-mono text-zinc-600">Uygun alternatif bulunamadı.</span>
                                      ) : swapOptions.map(o => (
                                        <button
                                          key={o.name}
                                          onClick={() => hareketDegistir(gun.name, ex.name, o.name)}
                                          title={`%${Math.round(o.similarity * 100)} örtüşme · ${o.note}`}
                                          className="w-full text-left bg-zinc-900 border border-emerald-900/50 px-2 py-1.5 rounded-lg active:bg-emerald-950/40"
                                        >
                                          <strong className="text-[9px] text-emerald-300 block truncate">{o.name}</strong>
                                          <span className="text-[7px] font-mono text-zinc-600 block truncate">%{Math.round(o.similarity * 100)} · {o.note}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ölçülen hacim */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
                <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Ölçülen Hacim</h4>
                <span className="text-[9px] font-mono text-zinc-600">dolaylı katkı dahil</span>
              </div>
              <div className="divide-y divide-zinc-800/70">
                {built.report.filter(r => r.volume > 0).map(r => (
                  <div key={r.muscle} className="px-4 py-1.5 flex justify-between items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-300 truncate min-w-0 flex items-center gap-1.5">
                      {r.muscle}
                      {r.priority && <Target size={9} className="text-violet-400 shrink-0" />}
                    </span>
                    <span className="text-[10px] font-mono shrink-0">
                      <strong className={r.belowMev ? 'text-amber-400' : r.aboveMrv ? 'text-red-400' : 'text-zinc-100'}>
                        {r.volume}
                      </strong>
                      <span className="text-zinc-600"> · eşik {r.mev} / verimli {r.mav}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aktif programla karşılaştırma. Zaten bir programı olan biri için
                asıl soru "bu program iyi mi" değil, "buna geçersem ne değişir".
                Bu cevap verilmeden kurmak, kullanıcıyı bilmediği bir takasa
                sokuyordu. */}
            {comparison && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60">
                  <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                    Şu Anki Programına Göre
                  </h4>
                  <span className="text-[9px] font-mono text-zinc-600 block mt-0.5 truncate">
                    {comparison.currentName}
                  </span>
                </div>

                <div className="px-4 py-2.5 grid grid-cols-2 gap-2 border-b border-zinc-800">
                  {[
                    { l: 'gün / hafta', a: comparison.currentDays, b: comparison.nextDays },
                    { l: 'set / hafta', a: comparison.currentSets, b: comparison.nextSets },
                  ].map(k => (
                    <div key={k.l} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 text-center">
                      <span className="text-[11px] font-mono block">
                        <span className="text-zinc-500">{k.a}</span>
                        <ArrowRight size={9} className="inline mx-1 text-zinc-700" />
                        <strong className="text-zinc-100">{k.b}</strong>
                      </span>
                      <span className="text-[8px] font-mono text-zinc-600">{k.l}</span>
                    </div>
                  ))}
                </div>

                {comparison.warnings.length > 0 && (
                  <div className="px-4 py-2 bg-amber-950/15 border-b border-amber-900/30">
                    <p className="text-[9px] font-mono text-amber-200/85 leading-relaxed">
                      <AlertTriangle size={9} className="inline mr-1" />
                      {comparison.warnings.map(r => (
                        r.crossesBelowMev
                          ? `${r.muscle} eşiğin altına düşüyor (${r.current}→${r.next}, eşik ${r.mev})`
                          : `${r.muscle} kanıtsız bölgeye çıkıyor (${r.current}→${r.next}, tartışmalı sonu ${r.mrv})`
                      )).join(' · ')}
                    </p>
                  </div>
                )}
                {comparison.rescued.length > 0 && (
                  <div className="px-4 py-2 bg-emerald-950/15 border-b border-emerald-900/30">
                    <p className="text-[9px] font-mono text-emerald-200/85 leading-relaxed">
                      <Check size={9} className="inline mr-1" />
                      Koruma eşiğinin altından çıkan: {comparison.rescued.map(r => r.muscle).join(', ')}.
                    </p>
                  </div>
                )}

                <div className="divide-y divide-zinc-800/70 max-h-60 overflow-y-auto hide-scrollbar">
                  {comparison.rows.filter(r => r.delta !== 0).slice(0, 12).map(r => (
                    <div key={r.muscle} className="px-4 py-1.5 flex justify-between items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-300 truncate min-w-0">{r.muscle}</span>
                      <span className="text-[10px] font-mono shrink-0">
                        <span className="text-zinc-600">{r.current} → </span>
                        <strong className="text-zinc-200">{r.next}</strong>
                        <span className={r.delta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {' '}({r.delta > 0 ? '+' : ''}{r.delta})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="px-4 py-2 text-[9px] font-mono text-zinc-600 leading-relaxed bg-zinc-950/40">
                  İki taraf da aynı katkı modelinden geçti; fark yöntem farkı
                  değil program farkı. Eski şablonların silinmiyor.
                </p>
              </div>
            )}

            {existingTemplateCount > 0 && (
              <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-xl p-3">
                <p className="text-[10px] font-mono text-cyan-200 leading-relaxed">
                  Zaten {existingTemplateCount} şablonun var. Bu program onları
                  SİLMEZ, yanlarına eklenir.
                </p>
              </div>
            )}

            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
              Setler boş ağırlıkla açılır; hedefi uygulama ilk seanstan sonra
              geçmişten öğrenir. Hacmi haftadan haftaya artırmak için Araçlar →
              Mezosiklik'i kullanabilirsin — bu program bilerek verimli bandın
              alt ucunda başlıyor ki bloğa artıracak yer kalsın.
            </p>
          </>
        )}
      </div>

      {/* Gezinme */}
      <div className="px-3 py-2.5 border-t border-zinc-800 bg-zinc-900 shrink-0 pb-safe flex gap-2">
        <button
          onClick={() => (adim === 0 ? onClose() : setAdim(a => a - 1))}
          className="px-4 py-3 rounded-2xl bg-zinc-800 active:bg-zinc-700 text-zinc-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1"
        >
          <ChevronLeft size={14} /> {adim === 0 ? 'Kaydet ve Çık' : 'Geri'}
        </button>
        {sonAdim ? (
          <>
            <button
              onClick={() => {
                clearDraft();
                onCustomize?.({
                  ...built,
                  split: {
                    ...built.split,
                    schedule: weekdays.length === daysPerWeek ? schedule : built.split.schedule,
                  },
                });
              }}
              className="flex-1 py-3.5 rounded-2xl border border-violet-700/60 bg-violet-950/40 active:scale-[0.98] text-violet-200 font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Pencil size={13} /> Önce Düzenle
            </button>
            <button
              type="button"
              onClick={() => {
                // Takvim ancak bölmenin gün sayısı kadar gün seçilmişse
                // geçerli; eksikse bölmenin hazır takvimi kullanılıyor.
                clearDraft();
                onInstall(built, { schedule: weekdays.length === daysPerWeek ? schedule : null });
                onClose();
              }}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 active:scale-[0.98] text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-violet-950/50 transition-all"
            >
              <Check size={15} /> Direkt Kur
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setAdim(a => a + 1)}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 active:scale-[0.98] text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-violet-950/50 transition-all"
          >
            Devam <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
});

ProgramWizardModal.displayName = 'ProgramWizardModal';

export default ProgramWizardModal;
