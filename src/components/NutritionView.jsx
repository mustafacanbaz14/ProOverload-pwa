import React, { memo, useMemo, useState } from 'react';
import {
  Activity, BarChart3, Beef, BookOpen, ChevronDown, Copy,
  Droplets, Flame, Plus, Save, Search, Trash2, TrendingUp, Footprints, Settings2,
} from 'lucide-react';
import {
  parseNumber, clampNumber, INPUT_LIMITS, getLocalDateString,
} from '../utils/helpers';
import { dailyTotals, nutritionDayScore } from '../utils/nutritionStats';
import { dayWorkoutCalories } from '../utils/cardio';
import { calorieDashboard, recommendedCalories } from '../utils/goals';
import CalorieBalanceCard from './CalorieBalanceCard';
import DisclosureCard from './DisclosureCard';
import { formatDay, weekdayName } from '../utils/dates';
import { dayMindCalories } from '../utils/wellness';
import { dayEnergyBreakdown, hasDayNeatOverride, neatOptsForDay } from '../utils/energyModel';
import NutritionTemplatesModal from './NutritionTemplatesModal';
import { isCoachProtocolActive } from '../utils/coachProtocol';
import HydrationCard from './HydrationCard';
import ViewHeader from './ViewHeader';

const MacroTile = ({ label, value, numericValue, target, color, bar }) => {
  const ratio = target > 0 ? Math.min(100, Math.round((parseNumber(numericValue) / target) * 100)) : null;
  return (
    <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-3 min-w-0 shadow-sm">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{label}</span>
      <span className={`text-sm font-mono font-black block mt-0.5 tracking-tight ${color}`}>{value}</span>
      {ratio !== null && (
        <>
          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-2 shadow-inner">
            <div className={`h-full rounded-full transition-all duration-300 ${bar}`} style={{ width: `${ratio}%` }} />
          </div>
          <span className="text-[9px] font-mono text-zinc-500 block mt-1">hedef {target}g</span>
        </>
      )}
    </div>
  );
};

const NUTRITION_FOCUS_OPTIONS = [
  { key: 'log', label: 'Kayıt', hint: 'Besin, günlük toplam ve su kaydı', icon: Plus },
  { key: 'summary', label: 'Özet', hint: 'Hedef, kalan kalori ve makro özeti', icon: Flame },
  { key: 'insights', label: 'Analiz', hint: 'Enerji dengesi ve 7 günlük eğilimler', icon: TrendingUp },
];

const NutritionView = memo(({
  currentNutritionForm,
  setCurrentNutritionForm,
  handleNutritionDateChange,
  updateMeal,
  handleSaveNutrition,
  computedComp,
  settings,
  nutritionHistory,
  setIsFoodSearchOpen,
  adaptiveTDEE,
  workouts = [],
  latestWeight = 0,
  wellness = [],
  maintenanceCalories = 0,
  neatOpts = {},
  onOpenEnergyDetail,
  bodyContextForDate,
  energyForRecord,
  mealTemplates = [],
  setMealTemplates,
  dayTemplates = [],
  setDayTemplates,
  coachProtocol = null,
  waterSummary = null,
  waterTarget = null,
  onAddWater,
  onToggleWaterHeat,
  onOpenSettings,
}) => {
  const safeMeals = Array.isArray(currentNutritionForm.meals) ? currentNutritionForm.meals : [];
  const isDaily = currentNutritionForm.entryMode === 'daily';
  const isToday = currentNutritionForm.date === getLocalDateString();
  const detailed = settings.interfaceMode === 'detailed';
  const [expandedMeals, setExpandedMeals] = useState(() => new Set());
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [nutritionFocus, setNutritionFocus] = useState('log');

  const dailyMeal = safeMeals[0] || {};
  const totals = dailyTotals(currentNutritionForm);
  const selectedBody = bodyContextForDate?.(currentNutritionForm.date) || {};
  const selectedWeight = parseNumber(selectedBody.weight) || latestWeight;
  const selectedMaintenance = parseNumber(currentNutritionForm.maintenanceAtTheTime)
    || maintenanceCalories;
  const ffm = parseNumber(selectedBody.ffm) || parseNumber(computedComp?.ffm) || 60;
  const targetProteinMultiplier = settings.nutritionGoal === 'bulk'
    ? (settings.proteinPerFfmBulk || 2.2)
    : (settings.proteinPerFfmCut || 2.6);
  const targetProtein = Math.round(ffm * targetProteinMultiplier);

  const recent7Days = useMemo(() => [...(nutritionHistory || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7), [nutritionHistory]);

  const recommended = recommendedCalories(selectedMaintenance, settings.nutritionGoal, {
    weightKg: selectedWeight,
    bodyFatPct: parseNumber(selectedBody.bodyFat) || parseNumber(computedComp?.activeBF),
    rate: settings.paceRate,
  });
  const protocolCalorieDelta = isCoachProtocolActive(coachProtocol, currentNutritionForm.date)
    ? parseNumber(coachProtocol.calorieDelta)
    : 0;

  const energyFor = (record) => {
    if (typeof energyForRecord === 'function') return energyForRecord(record);
    const body = bodyContextForDate?.(record.date) || {
      weight: record.weightAtTheTime || latestWeight,
      bmr: record.bmrAtTheTime || parseNumber(computedComp?.bmr),
    };
    const recordTotals = dailyTotals(record);
    const workout = dayWorkoutCalories(workouts, record.date, body.weight);
    const recovery = dayMindCalories(wellness, record.date, body.weight);
    return dayEnergyBreakdown({
      maintenance: record.maintenanceAtTheTime || maintenanceCalories,
      bmr: record.bmrAtTheTime || body.bmr,
      macros: recordTotals,
      lifting: workout.lifting,
      cardio: workout.cardio,
      activeRecovery: workout.activeRecovery,
      recovery,
      manual: record.activeCaloriesOut,
      steps: record.steps,
      // Güne özel hareket çarpanı varsa genel ayarı ezer.
      ...neatOptsForDay({ ...neatOpts, weightKg: body.weight }, record),
    });
  };

  const currentEnergy = energyFor(currentNutritionForm);
  const automaticExercise = currentEnergy.lifting + currentEnergy.cardio + currentEnergy.recovery;
  const calorieData = calorieDashboard({
    intake: totals.calories,
    burnedAuto: automaticExercise,
    burnedManual: currentNutritionForm.activeCaloriesOut,
    maintenance: selectedMaintenance,
    targetIntake: recommended ? recommended.target + protocolCalorieDelta : 0,
    totalOut: currentEnergy.total,
    weekDays: recent7Days.map(record => ({
      intake: dailyTotals(record).calories,
      out: energyFor(record).total,
    })),
  });
  const targetCalories = calorieData?.adjustedTarget || (recommended ? recommended.target + protocolCalorieDelta : 0);

  const weeklyAvg = useMemo(() => {
    if (recent7Days.length === 0) return null;
    const sum = recent7Days.map(dailyTotals).reduce((acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fats: acc.fats + day.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    return Object.fromEntries(Object.entries(sum).map(([key, value]) => [key, Math.round(value / recent7Days.length)]));
  }, [recent7Days]);

  const dayScore = nutritionDayScore({
    totals,
    targetCalories,
    targetProtein,
    waterMl: currentNutritionForm.waterMl,
    weightKg: selectedWeight,
  });

  const yesterdayRecord = useMemo(() => {
    const date = new Date(`${currentNutritionForm.date}T12:00:00`);
    date.setDate(date.getDate() - 1);
    const yesterday = getLocalDateString(date);
    return (nutritionHistory || []).find(record => record.date === yesterday) || null;
  }, [currentNutritionForm.date, nutritionHistory]);

  const previousWeekRecord = useMemo(() => {
    const date = new Date(`${currentNutritionForm.date}T12:00:00`);
    date.setDate(date.getDate() - 7);
    const previousWeek = getLocalDateString(date);
    return (nutritionHistory || []).find(record => record.date === previousWeek) || null;
  }, [currentNutritionForm.date, nutritionHistory]);

  const setEntryMode = (mode) => {
    setCurrentNutritionForm(prev => {
      if (mode === prev.entryMode) return prev;
      if (mode === 'daily') {
        const sum = dailyTotals(prev);
        return {
          ...prev,
          entryMode: 'daily',
          meals: [{
            id: prev.meals?.[0]?.id || `daily-${Date.now()}`,
            name: 'Günlük Toplam',
            calories: Math.round(sum.protein * 4 + sum.carbs * 4 + sum.fats * 9),
            protein: sum.protein || '',
            carbs: sum.carbs || '',
            fats: sum.fats || '',
          }],
        };
      }
      return { ...prev, entryMode: 'meals' };
    });
  };

  const openDailyTotals = () => {
    setNutritionFocus('log');
    setEntryMode('daily');
    requestAnimationFrame(() => {
      document.querySelector('[data-nutrition-editor]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const openDayMovement = () => {
    setNutritionFocus('log');
    setAdvancedOpen(true);
    requestAnimationFrame(() => {
      document.querySelector('[data-nutrition-editor]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const updateDailyMacro = (field, value) => {
    setCurrentNutritionForm(prev => {
      const base = (Array.isArray(prev.meals) && prev.meals[0]) || {};
      const next = { ...base, name: 'Günlük Toplam', id: base.id || `daily-${Date.now()}`, [field]: value };
      next.calories = Math.round(
        parseNumber(next.protein) * 4 + parseNumber(next.carbs) * 4 + parseNumber(next.fats) * 9
      );
      return { ...prev, meals: [next] };
    });
  };

  const addMealAndOpen = () => {
    setNutritionFocus('log');
    const id = `meal-${Date.now()}`;
    setCurrentNutritionForm(prev => ({
      ...prev,
      entryMode: 'meals',
      meals: [...(prev.meals || []), {
        id,
        name: `${(prev.meals || []).length + 1}. Öğün`,
        calories: '', protein: '', carbs: '', fats: '',
      }],
    }));
    setExpandedMeals(prev => new Set([...prev, id]));
    requestAnimationFrame(() => {
      document.querySelector('[data-nutrition-editor]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const copyRecord = (record) => {
    if (!record) return;
    setCurrentNutritionForm(prev => ({
      ...prev,
      entryMode: record.entryMode || 'meals',
      meals: (record.meals || []).map((meal, index) => ({
        ...meal,
        id: `copy-${Date.now()}-${index}`,
        source: { type: 'copied-day', label: 'Geçmiş günden kopyalandı', date: record.date },
      })),
      waterMl: record.waterMl || '',
      energySnapshot: null,
    }));
  };
  const copyYesterday = () => copyRecord(yesterdayRecord);

  const dayHasNeatOverride = hasDayNeatOverride(currentNutritionForm);
  const resetDayNeat = () => setCurrentNutritionForm(prev => ({
    ...prev,
    neatModeOverride: '',
    activityLevelOverride: '',
    neatManualOverride: '',
    neatMultiplier: '',
    energySnapshot: null,
  }));
  const setDayNeatMode = (value) => setCurrentNutritionForm(prev => ({
    ...prev,
    neatModeOverride: value,
    activityLevelOverride: value === 'level' ? prev.activityLevelOverride : '',
    neatManualOverride: value === 'manual' ? prev.neatManualOverride : '',
    energySnapshot: null,
  }));

  const remaining = targetCalories > 0 ? targetCalories - totals.calories : null;
  const calorieProgress = targetCalories > 0 ? Math.min(100, totals.calories / targetCalories * 100) : 0;
  const scoreColor = !dayScore ? 'text-zinc-500' : dayScore.score >= 65 ? 'text-emerald-400' : dayScore.score >= 45 ? 'text-amber-400' : 'text-orange-400';
  const baseTarget = calorieData?.ready ? calorieData.target : (recommended?.target || 0) + protocolCalorieDelta;
  const dayAdjustment = calorieData?.ready ? calorieData.activityAdjustment : 0;
  const targetSource = adaptiveTDEE && !adaptiveTDEE.insufficient
    ? `Kilo eğilimiyle kalibre edildi · ${adaptiveTDEE.confidence || 'orta'} güven`
    : 'Vücut ölçümü, hedef ve aktiviteden tahmin';
  const activeFocus = NUTRITION_FOCUS_OPTIONS.find(option => option.key === nutritionFocus)
    || NUTRITION_FOCUS_OPTIONS[0];

  return (
    <div data-view-scroll="nutrition" className="luxury-screen p-4 space-y-3.5 pb-nav h-full overflow-y-auto hide-scrollbar bg-black">
      <ViewHeader
        eyebrow="Günlük Takip"
        title="Beslenme"
        subtitle={detailed
          ? `${isToday ? 'Bugünün' : 'Seçili günün'} kaydı, özeti ve analizi.`
          : 'Kayıt, günlük özet ve analiz tek yerde.'}
        action={(
          <div className="flex items-end gap-1.5">
            <label className="text-right">
              <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-1">{weekdayName(currentNutritionForm.date)}</span>
              <input
                type="date"
                value={currentNutritionForm.date}
                onChange={(event) => handleNutritionDateChange(event.target.value)}
                aria-label="Beslenme tarihi"
                className="min-h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-zinc-300 font-mono text-[10px] outline-none focus:border-orange-500"
              />
            </label>
            {onOpenSettings && <button onClick={onOpenSettings} aria-label="Beslenme ayarlarını aç" className="w-11 h-11 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 flex items-center justify-center active:bg-zinc-800"><Settings2 size={17} /></button>}
          </div>
        )}
      />

      {!detailed && (
        <section data-nutrition-focus={nutritionFocus} className="rounded-2xl border border-zinc-800 bg-zinc-900/75 p-1.5 shadow-sm">
          <div className="grid grid-cols-3 gap-1" aria-label="Beslenme amacı">
            {NUTRITION_FOCUS_OPTIONS.map(option => {
              const Icon = option.icon;
              const active = nutritionFocus === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setNutritionFocus(option.key)}
                  aria-pressed={active}
                  className={`min-h-12 rounded-xl px-2 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${active ? 'bg-orange-700 text-white shadow-md' : 'text-zinc-400 active:bg-zinc-800'}`}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="px-2 pb-1 pt-2 text-center text-[9px] font-mono text-zinc-400">{activeFocus.hint}</p>
        </section>
      )}

      {(detailed || nutritionFocus === 'summary') && (
      <section className="luxury-feature-card bg-gradient-to-br from-orange-950/40 via-zinc-900 to-zinc-900 rounded-3xl border border-orange-900/30 p-4 shadow-lg shadow-black/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{isToday ? 'Bugün Kalan' : 'O Gün Kalan'}</span>
            {remaining === null ? (
              <span className="text-xl font-bold text-zinc-400 block mt-1">Hedef bekleniyor</span>
            ) : (
              <div className="mt-0.5">
                <span className={`text-4xl font-mono font-black ${remaining < 0 ? 'text-amber-400' : 'text-orange-400'}`}>
                  {Math.abs(Math.round(remaining))}
                </span>
                <span className="text-xs font-mono text-zinc-500 ml-1">kcal</span>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  {remaining < 0 ? 'hedefin üzerinde' : 'daha yiyebilirsin'}
                </span>
              </div>
            )}
          </div>
          <div className="text-right bg-zinc-950/70 border border-zinc-800 rounded-2xl px-3 py-2">
            <span className={`text-lg font-mono font-bold block ${scoreColor}`}>{dayScore ? dayScore.score : '—'}</span>
            <span className="text-[8px] font-bold uppercase text-zinc-400 block">Günlük Uyum</span>
            {dayScore && <span className="text-[9px] font-mono text-zinc-500 block">{dayScore.label}</span>}
          </div>
        </div>

        <div className="h-2 bg-zinc-950 border border-zinc-800 rounded-full overflow-hidden mt-4">
          <div
            className={`h-full rounded-full ${remaining !== null && remaining < 0 ? 'bg-amber-500' : 'bg-orange-500'}`}
            style={{ width: `${calorieProgress}%` }}
          />
        </div>
        {detailed ? (
          <>
            <div className="grid grid-cols-4 gap-1 mt-2.5" aria-label="Günlük kalori denklemi">
              {[
                { label: 'Baz Hedef', value: baseTarget || '—', color: 'text-emerald-400' },
                { label: 'Gün Farkı', value: `${dayAdjustment > 0 ? '+' : ''}${dayAdjustment}`, color: 'text-red-400' },
                { label: 'Alınan', value: totals.calories, color: 'text-cyan-400' },
                { label: '= Kalan', value: remaining === null ? '—' : Math.round(remaining), color: remaining !== null && remaining < 0 ? 'text-amber-400' : 'text-orange-400' },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-zinc-800 bg-zinc-950/65 px-1 py-2 text-center min-w-0">
                  <strong className={`text-xs font-mono block truncate ${item.color}`}>{item.value}</strong>
                  <span className="text-[9px] font-bold uppercase text-zinc-400 block mt-0.5 leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[8px] font-mono text-zinc-400 leading-relaxed mt-2">
              Gün farkı, bugünkü harcamanın korunum ortalamasından farkıdır; antrenman iki kez eklenmez.
              {' '}Toplam harcama: <span className="text-zinc-400">{calorieData?.ready ? calorieData.totalOut : '—'} kcal</span>.
            </p>
            <div className="flex items-center justify-between gap-2 mt-1.5 text-[8px] font-mono">
              <span className="text-zinc-400 truncate">{targetSource}</span>
              <span className={`shrink-0 rounded-md border px-1.5 py-0.5 ${adaptiveTDEE && !adaptiveTDEE.insufficient ? 'border-emerald-900/60 text-emerald-500' : 'border-amber-900/60 text-amber-500'}`}>
                {adaptiveTDEE && !adaptiveTDEE.insufficient ? 'Kalibre' : 'Tahmini'}
              </span>
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/65 px-3 py-2.5 flex items-center justify-between gap-2 text-[9px] font-mono">
            <span className="text-zinc-400">Hedef <strong className="text-emerald-400">{targetCalories || '—'}</strong></span>
            <span className="text-zinc-400">Alınan <strong className="text-cyan-400">{totals.calories}</strong></span>
            <span className="text-zinc-400">Yakılan <strong className="text-red-400">{calorieData?.ready ? calorieData.totalOut : '—'}</strong></span>
          </div>
        )}
        {protocolCalorieDelta !== 0 && (
          <p className="text-[8px] font-mono text-cyan-400 mt-1.5 text-right">
            Koç protokolü {protocolCalorieDelta > 0 ? '+' : ''}{protocolCalorieDelta} kcal uyguladı
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 mt-3">
          <MacroTile label="Protein" value={`${totals.protein}g`} numericValue={totals.protein} target={targetProtein} color="text-emerald-400" bar="bg-emerald-500" />
          <MacroTile label="Karbonhidrat" value={`${totals.carbs}g`} color="text-amber-400" />
          <MacroTile label="Yağ" value={`${totals.fats}g`} color="text-purple-400" />
        </div>

        {/* Makro Dağılım Oranları */}
        {detailed && (() => {
          const pKcal = (parseNumber(totals.protein) || 0) * 4;
          const cKcal = (parseNumber(totals.carbs) || 0) * 4;
          const fKcal = (parseNumber(totals.fats) || 0) * 9;
          const totalKcal = pKcal + cKcal + fKcal;
          if (totalKcal <= 0) return null;
          const pPct = Math.round((pKcal / totalKcal) * 100);
          const cPct = Math.round((cKcal / totalKcal) * 100);
          const fPct = Math.max(0, 100 - pPct - cPct);
          return (
            <div className="mt-3 pt-2.5 border-t border-zinc-800/70 space-y-1.5">
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-zinc-400 font-bold uppercase tracking-wider">Makro Enerji Dağılımı</span>
                <span className="text-zinc-300 font-semibold">{totalKcal} kcal</span>
              </div>
              <div className="h-2 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800/80 shadow-inner">
                <div style={{ width: `${pPct}%` }} className="bg-emerald-500 transition-all duration-300" title={`Protein: %${pPct}`} />
                <div style={{ width: `${cPct}%` }} className="bg-amber-500 transition-all duration-300" title={`Karbonhidrat: %${cPct}`} />
                <div style={{ width: `${fPct}%` }} className="bg-purple-500 transition-all duration-300" title={`Yağ: %${fPct}`} />
              </div>
              <div className="flex justify-between items-center text-[8px] font-mono font-bold">
                <span className="text-emerald-400">%{pPct} Protein</span>
                <span className="text-amber-400">%{cPct} Karb</span>
                <span className="text-purple-400">%{fPct} Yağ</span>
              </div>
            </div>
          );
        })()}
        {dayScore?.next?.length > 0 && (
          <p className="text-[9px] font-mono text-zinc-500 mt-2.5">
            {isToday ? 'Bugün' : 'Bu gün'} öncelik: <strong className="text-zinc-300">{dayScore.next.join(' ve ')}</strong>.
          </p>
        )}
        <button
          type="button"
          onClick={() => onOpenEnergyDetail?.('days', currentNutritionForm.date)}
          className="w-full mt-3 rounded-xl border border-red-900/40 bg-red-950/15 px-3 py-2.5 text-left flex items-center justify-between active:bg-red-950/30"
        >
          <span className="flex items-center gap-2"><BarChart3 size={14} className="text-red-400" /><span><strong className="text-[9px] text-zinc-300 block">Gün gün kalori detayı</strong><span className="text-[8px] font-mono text-zinc-400">Alınan, yakılan, denge ve harcama kaynakları</span></span></span>
          <span className="text-[9px] font-bold text-red-400">Aç</span>
        </button>
      </section>
      )}

      {(detailed || nutritionFocus === 'log') && (
      <>
      <section className="space-y-2" aria-label="Hızlı beslenme işlemleri">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setEntryMode('meals'); setIsFoodSearchOpen(true); }} className="min-h-14 bg-gradient-to-r from-orange-950/50 to-zinc-900 border border-orange-900/45 rounded-2xl px-3 flex items-center gap-2.5 text-left active:scale-[0.98] transition-all shadow-md">
            <Search size={18} className="text-orange-400 shrink-0" />
            <span><strong className="text-[11px] text-zinc-100 block">Besin Ekle</strong><span className="text-[9px] font-mono text-zinc-400">Ara veya barkod</span></span>
          </button>
          <button type="button" onClick={openDailyTotals} className="min-h-14 bg-zinc-900/90 border border-zinc-800 rounded-2xl px-3 flex items-center gap-2.5 text-left active:scale-[0.98] transition-all shadow-md">
            <Beef size={18} className="text-emerald-400 shrink-0" />
            <span><strong className="text-[11px] text-zinc-100 block">Günlük Toplam</strong><span className="text-[9px] font-mono text-zinc-400">Makroları yaz</span></span>
          </button>
        </div>
        {detailed && <button type="button" onClick={handleSaveNutrition} className="min-h-12 w-full bg-cyan-700 active:bg-cyan-800 text-white rounded-2xl px-3.5 flex items-center justify-between gap-3 shadow-lg shadow-cyan-950/25">
          <span className="flex items-center gap-2.5"><Save size={17} /><strong className="text-[11px]">{isToday ? 'Bugünün Kaydını Kaydet' : 'Geçmiş Kaydı Kaydet'}</strong></span>
          <span className="text-[9px] font-mono text-cyan-100/75">Değişiklikleri sakla</span>
        </button>}
      </section>

      <section data-nutrition-editor className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4 space-y-3.5 shadow-xl scroll-mt-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-zinc-100">{isToday ? 'Bugünün kaydı' : 'Geçmiş gün kaydı'}</h3>
            <span className="text-[9px] font-mono text-zinc-500">{safeMeals.length} öğün · {totals.calories} kcal</span>
          </div>
          {detailed ? (
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              {[
                { key: 'meals', label: 'Öğünler' },
                { key: 'daily', label: 'Toplam' },
              ].map(mode => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setEntryMode(mode.key)}
                  className={`min-h-11 px-3 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                    (currentNutritionForm.entryMode || 'meals') === mode.key
                      ? 'bg-orange-700 text-white shadow-sm'
                      : 'text-zinc-500'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => (isDaily ? setEntryMode('meals') : openDailyTotals())}
              className="min-h-11 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-right active:bg-zinc-800"
            >
              <strong className="text-[10px] text-orange-400 block">{isDaily ? 'Günlük toplam' : 'Öğünlerle giriş'}</strong>
              <span className="text-[8px] font-mono text-zinc-500 block">Giriş şeklini değiştir</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-zinc-950/85 border border-zinc-800/80 rounded-2xl p-3 shadow-inner">
          <span className="flex items-center gap-2 text-[10px] font-bold text-zinc-300">
            <Droplets size={15} className="text-cyan-400 shrink-0" /> Su Takibi
            <span className="text-[9px] font-mono text-zinc-500">/ {dayScore?.waterTarget || 2500} ml</span>
          </span>
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCurrentNutritionForm(prev => ({
                  ...prev,
                  waterMl: Math.min(10000, (parseNumber(prev.waterMl) || 0) + 250),
                }))}
                className="min-h-11 px-3 bg-zinc-900/90 border border-cyan-900/50 text-cyan-400 rounded-xl text-[10px] font-mono font-bold active:scale-[0.94] transition-all"
              >
                +250
              </button>
              <button
                type="button"
                onClick={() => setCurrentNutritionForm(prev => ({
                  ...prev,
                  waterMl: Math.min(10000, (parseNumber(prev.waterMl) || 0) + 500),
                }))}
                className="min-h-11 px-3 bg-zinc-900/90 border border-cyan-900/50 text-cyan-400 rounded-xl text-[10px] font-mono font-bold active:scale-[0.94] transition-all"
              >
                +500
              </button>
            </div>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={10000}
              value={currentNutritionForm.waterMl ?? ''}
              onChange={(event) => setCurrentNutritionForm(prev => ({ ...prev, waterMl: event.target.value }))}
              onBlur={(event) => setCurrentNutritionForm(prev => ({
                ...prev,
                waterMl: event.target.value === '' ? '' : clampNumber(event.target.value, 0, 10000),
              }))}
              placeholder="0"
              aria-label="İçilen su miktarı"
              className="w-20 min-h-11 bg-zinc-900 border border-zinc-800 rounded-xl py-2 text-center font-mono text-cyan-400 text-[11px] font-bold outline-none focus:border-cyan-500 shadow-inner"
            />
          </div>
        </div>

        {(detailed || advancedOpen || dayHasNeatOverride) && <button
          type="button"
          onClick={() => setAdvancedOpen(open => !open)}
          aria-expanded={advancedOpen}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between gap-3 text-left active:bg-zinc-900"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Footprints size={14} className="text-emerald-400 shrink-0" />
            <span>
              <strong className="text-[10px] text-zinc-300 block">Günlük hareket ve NEAT</strong>
              <span className="text-[8px] font-mono text-zinc-400 block">Yalnızca gerekiyorsa bu güne özel değiştir</span>
            </span>
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            {dayHasNeatOverride && <span className="text-[7px] font-bold uppercase text-cyan-400">Özel</span>}
            <ChevronDown size={13} className={`text-zinc-400 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>}

        {advancedOpen && <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[10px] font-bold text-zinc-300">
              <Footprints size={14} className="text-emerald-400" /> Hareket Modu & Çarpanı
            </span>
            <span className={`text-[8px] font-bold uppercase rounded-md border px-1.5 py-0.5 ${dayHasNeatOverride ? 'text-cyan-400 border-cyan-900/60 bg-cyan-950/20' : 'text-zinc-400 border-zinc-800'}`}>
              {dayHasNeatOverride ? 'Bu güne özel' : 'Genel ayar'}
            </span>
          </div>
          <p className="text-[8px] font-mono text-zinc-400 leading-relaxed">
            Yalnız {formatDay(currentNutritionForm.date)} tarihini değiştirir. Boş seçenekler Ayarlar’daki {settings.neatMode || 'auto'} modu ve ×{settings.neatMultiplier || 1} çarpanını kullanır.
          </p>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-900">
            <span className="text-[9px] font-bold text-zinc-500">Günlük mod</span>
            <select
              value={currentNutritionForm.neatModeOverride || ''}
              onChange={(e) => setDayNeatMode(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 font-mono text-zinc-300 text-[10px] outline-none focus:border-emerald-500"
            >
              <option value="">Genel Modu Kullan</option>
              <option value="auto">Otomatik (Artık)</option>
              <option value="level">Seviye Seçimi</option>
              <option value="steps">Adım Sayısı</option>
              <option value="manual">Elle Gir (Kcal)</option>
            </select>
          </div>

          {currentNutritionForm.neatModeOverride === 'level' && (
            <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
              <span className="text-[9px] font-bold text-zinc-500">Seviye</span>
              <select
                value={currentNutritionForm.activityLevelOverride || 'light'}
                onChange={(e) => setCurrentNutritionForm(prev => ({ ...prev, activityLevelOverride: e.target.value, energySnapshot: null }))}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 font-mono text-emerald-400 text-[10px] outline-none"
              >
                <option value="sedentary">Masa Başı (×0.15)</option>
                <option value="light">Hafif (×0.25)</option>
                <option value="moderate">Hareketli (×0.40)</option>
                <option value="high">Fiziksel İş (×0.60)</option>
              </select>
            </div>
          )}

          {currentNutritionForm.neatModeOverride === 'manual' && (
            <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
              <span className="text-[9px] font-bold text-zinc-500">Sabit Harcama (kcal)</span>
              <input
                type="number" inputMode="decimal"
                min={0}
                max={5000}
                value={currentNutritionForm.neatManualOverride || ''}
                onChange={(e) => setCurrentNutritionForm(prev => ({ ...prev, neatManualOverride: e.target.value, energySnapshot: null }))}
                placeholder="Örn: 400"
                className="w-24 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-center font-mono text-emerald-400 text-[10px] outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
            <span className="text-[9px] font-bold text-zinc-500">Çarpan (Ekstra)</span>
            <select
              value={currentNutritionForm.neatMultiplier || ''}
              onChange={(e) => setCurrentNutritionForm(prev => ({ ...prev, neatMultiplier: e.target.value ? Number(e.target.value) : '', energySnapshot: null }))}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 font-mono text-zinc-300 text-[10px] outline-none focus:border-emerald-500"
            >
              <option value="">Genel Çarpan Kullan</option>
              <option value="0.75">Çok durgun (×0.75)</option>
              <option value="0.9">Durgun (×0.9)</option>
              <option value="1">Normal (×1)</option>
              <option value="1.15">Hareketli (×1.15)</option>
              <option value="1.25">Çok hareketli (×1.25)</option>
              <option value="1.4">Ayakta iş (×1.4)</option>
            </select>
          </div>
          {dayHasNeatOverride && (
            <button type="button" onClick={resetDayNeat}
              className="w-full py-1.5 rounded-lg border border-zinc-800 text-[9px] font-bold text-zinc-500 active:text-cyan-400 active:border-cyan-800">
              Bu Günü Genel Ayara Döndür
            </button>
          )}
        </div>}

        {isDaily ? (
          <div className="space-y-3">
            <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
              Başka bir uygulamada saydıysan yalnızca günlük toplam makroları yaz. Kalori otomatik hesaplanır.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'protein', label: 'Protein', color: 'text-emerald-400' },
                { key: 'carbs', label: 'Karb.', color: 'text-amber-400' },
                { key: 'fats', label: 'Yağ', color: 'text-purple-400' },
              ].map(field => (
                <label key={field.key}>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">{field.label}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={INPUT_LIMITS.macro.min}
                    max={INPUT_LIMITS.macro.max}
                    value={dailyMeal[field.key] ?? ''}
                    onChange={(event) => updateDailyMacro(field.key, event.target.value)}
                    onBlur={(event) => updateDailyMacro(field.key, clampNumber(event.target.value, INPUT_LIMITS.macro.min, INPUT_LIMITS.macro.max))}
                    placeholder="0 g"
                    className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 font-mono text-sm text-center outline-none focus:border-orange-500 ${field.color}`}
                  />
                </label>
              ))}
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-center">
              <strong className="text-xl font-mono text-orange-400">{parseNumber(dailyMeal.calories)}</strong>
              <span className="text-[10px] font-mono text-zinc-500 ml-1">kcal hesaplandı</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {safeMeals.map((meal, index) => {
              const open = expandedMeals.has(meal.id) || (detailed && safeMeals.length === 1);
              return (
                <article key={meal.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setExpandedMeals(prev => {
                        const next = new Set(prev);
                        if (next.has(meal.id)) next.delete(meal.id);
                        else next.add(meal.id);
                        return next;
                      })}
                      aria-expanded={open}
                      className="flex-1 min-w-0 text-left flex items-center gap-2"
                    >
                      <ChevronDown size={14} className={`text-zinc-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                      <span className="min-w-0">
                        <span className="text-[11px] font-bold text-zinc-200 block truncate">{meal.name || `${index + 1}. Öğün`}</span>
                        <span className="text-[9px] font-mono text-zinc-500 block">
                          {meal.calories || 0} kcal · P {meal.protein || 0} · K {meal.carbs || 0} · Y {meal.fats || 0}
                        </span>
                        {meal.source?.label && (
                          <span className="inline-block mt-1 rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[8px] font-mono text-zinc-500">
                            {meal.source.label}
                          </span>
                        )}
                      </span>
                    </button>
                    {safeMeals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCurrentNutritionForm(prev => ({
                          ...prev,
                          meals: prev.meals.filter(item => item.id !== meal.id),
                        }))}
                        aria-label={`${meal.name || 'Öğünü'} sil`}
                        className="p-2 text-zinc-400 active:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  {open && (
                    <div className="border-t border-zinc-800 p-3 space-y-2.5">
                      <input
                        type="text"
                        value={meal.name}
                        onChange={(event) => updateMeal(meal.id, 'name', event.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] font-bold text-zinc-200 outline-none focus:border-orange-500"
                        placeholder={`${index + 1}. Öğün`}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'protein', label: 'Protein', color: 'text-emerald-400' },
                          { key: 'carbs', label: 'Karb.', color: 'text-amber-400' },
                          { key: 'fats', label: 'Yağ', color: 'text-purple-400' },
                        ].map(field => (
                          <label key={field.key}>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">{field.label}</span>
                            <input
                              type="number" inputMode="decimal"
                              min={INPUT_LIMITS.macro.min}
                              max={INPUT_LIMITS.macro.max}
                              value={meal[field.key] ?? ''}
                              onChange={(event) => updateMeal(meal.id, field.key, event.target.value)}
                              onBlur={(event) => updateMeal(meal.id, field.key, clampNumber(event.target.value, INPUT_LIMITS.macro.min, INPUT_LIMITS.macro.max))}
                              placeholder="0"
                              className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 font-mono text-center outline-none focus:border-orange-500 ${field.color}`}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            {detailed && <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={addMealAndOpen}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl flex justify-center items-center text-[10px]"
              >
                <Plus size={13} className="mr-1.5" /> Boş Öğün
              </button>
              <button
                type="button"
                onClick={() => setIsFoodSearchOpen(true)}
                className="bg-orange-950/40 border border-orange-900/50 text-orange-400 font-bold py-2.5 rounded-xl flex justify-center items-center text-[10px]"
              >
                <Search size={13} className="mr-1.5" /> Besin Bul
              </button>
            </div>}
          </div>
        )}
      </section>

      {!detailed && <button
        type="button"
        onClick={handleSaveNutrition}
        className="min-h-12 w-full bg-cyan-700 active:bg-cyan-800 text-white rounded-2xl px-3.5 flex items-center justify-between gap-3 shadow-lg shadow-cyan-950/25"
      >
        <span className="flex items-center gap-2.5"><Save size={17} /><strong className="text-[11px]">{isToday ? 'Bugünün Kaydını Kaydet' : 'Geçmiş Kaydı Kaydet'}</strong></span>
        <span className="text-[9px] font-mono text-cyan-100/75">Değişiklikleri sakla</span>
      </button>}

      <DisclosureCard
        icon={BookOpen}
        title="Diğer kayıt yolları"
        summary="Şablon, kopyalama ve özel gün ayarları"
        defaultOpen={false}
        accentClass="text-purple-400"
      >
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Şablon & Tarif', icon: BookOpen, action: () => setTemplatesOpen(true), enabled: true, color: 'text-purple-400' },
            { label: 'Dünü Kopyala', icon: Copy, action: copyYesterday, enabled: Boolean(yesterdayRecord), color: 'text-cyan-400' },
            { label: 'Geçen Haftayı Kopyala', icon: Copy, action: () => copyRecord(previousWeekRecord), enabled: Boolean(previousWeekRecord), color: 'text-blue-400' },
            { label: 'Boş Öğün Ekle', icon: Plus, action: addMealAndOpen, enabled: true, color: 'text-orange-400' },
            { label: 'Güne Özel Hareket', icon: Footprints, action: openDayMovement, enabled: true, color: 'text-emerald-400' },
            { label: 'Kalori Detayı', icon: BarChart3, action: () => onOpenEnergyDetail?.('days', currentNutritionForm.date), enabled: true, color: 'text-red-400' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button key={item.label} type="button" onClick={item.action} disabled={!item.enabled} className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-left disabled:opacity-35 active:scale-[0.97] transition-all">
                <Icon size={13} className={`${item.color} mb-1`} />
                <span className="text-[9px] font-bold text-zinc-300">{item.label}</span>
              </button>
            );
          })}
        </div>
      </DisclosureCard>
      </>
      )}

      {(detailed || nutritionFocus === 'insights') && (
      <DisclosureCard
        key={`tracking-${detailed}-${nutritionFocus}`}
        icon={Activity}
        title="Takip ve analiz ayrıntıları"
        summary="Su hedefi, enerji dengesi, 7 günlük tablo ve gerçek harcama"
        defaultOpen={detailed || nutritionFocus === 'insights'}
        accentClass="text-cyan-400"
      >
        <div className="space-y-2.5">
          {detailed && isToday && waterSummary && waterTarget && (
            <HydrationCard
              summary={waterSummary}
              target={waterTarget}
              onAdd={onAddWater}
              onToggleHeat={onToggleWaterHeat}
              heat={Boolean(settings.waterHeatBonus)}
            />
          )}

      <DisclosureCard
        key={`energy-${detailed}-${nutritionFocus}`}
        icon={Flame}
        title="Enerji dengesi"
        summary={calorieData?.ready ? `${Math.abs(calorieData.balance)} kcal ${calorieData.balance < 0 ? 'açık' : calorieData.balance > 0 ? 'fazla' : 'korunum'}` : 'Vücut verisiyle hesaplanır'}
        defaultOpen={detailed || nutritionFocus === 'insights'}
        accentClass="text-red-400"
      >
        <CalorieBalanceCard
          data={calorieData}
          dateLabel={formatDay(currentNutritionForm.date, 'medium')}
          goalLabel={recommended?.label}
          manualValue={currentNutritionForm.activeCaloriesOut}
          onChangeManual={(value) => setCurrentNutritionForm(prev => ({ ...prev, activeCaloriesOut: value }))}
          stepsMode={settings.neatMode === 'steps'}
          stepsValue={currentNutritionForm.steps}
          onChangeSteps={(value) => setCurrentNutritionForm(prev => ({ ...prev, steps: value }))}
        />
        <button
          type="button"
          onClick={() => onOpenEnergyDetail?.('today', currentNutritionForm.date)}
          className="w-full mt-2.5 bg-zinc-950 border border-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-[10px] flex items-center justify-center"
        >
          <BarChart3 size={13} className="mr-1.5 text-red-400" /> Günlük ve Haftalık Tüm Detaylar
        </button>
      </DisclosureCard>

      <DisclosureCard
        key={`analysis-${detailed}`}
        icon={TrendingUp}
        title="7 günlük analiz"
        summary={weeklyAvg ? `${recent7Days.length} gün · ort. ${weeklyAvg.calories} kcal · ${weeklyAvg.protein}g protein` : 'Henüz yeterli kayıt yok'}
        defaultOpen={detailed}
        accentClass="text-emerald-400"
      >
        {weeklyAvg ? (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Kalori', value: weeklyAvg.calories, color: 'text-cyan-400' },
                { label: 'Protein', value: `${weeklyAvg.protein}g`, color: 'text-emerald-400' },
                { label: 'Karb.', value: `${weeklyAvg.carbs}g`, color: 'text-amber-400' },
                { label: 'Yağ', value: `${weeklyAvg.fats}g`, color: 'text-purple-400' },
              ].map(item => (
                <div key={item.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-center">
                  <strong className={`text-[11px] font-mono block ${item.color}`}>{item.value}</strong>
                  <span className="text-[8px] font-bold uppercase text-zinc-400">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              {recent7Days.map(record => {
                const day = dailyTotals(record);
                return (
                  <div key={record.id || record.date} className="grid grid-cols-[1.35fr_repeat(4,0.75fr)] gap-1 px-2.5 py-2 text-[9px] font-mono odd:bg-zinc-950 even:bg-zinc-900">
                    <span className="text-zinc-400 truncate">{formatDay(record.date, 'short')}</span>
                    <span className="text-cyan-400 text-right">{day.calories}</span>
                    <span className="text-emerald-400 text-right">{day.protein}P</span>
                    <span className="text-amber-400 text-right">{day.carbs}K</span>
                    <span className="text-purple-400 text-right">{day.fats}Y</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-[10px] font-mono text-zinc-500">Kayıt girdikçe günlük tablo ve ortalamalar burada oluşacak.</p>
        )}
      </DisclosureCard>

      {adaptiveTDEE && (
        <DisclosureCard
          key={`tdee-${detailed}`}
          icon={Activity}
          title="Gerçek günlük harcama"
          summary={adaptiveTDEE.insufficient ? adaptiveTDEE.reason : `${adaptiveTDEE.tdee} kcal/gün · ${adaptiveTDEE.confidence} güven`}
          defaultOpen={false}
          accentClass="text-cyan-400"
        >
          {adaptiveTDEE.insufficient ? (
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
              {adaptiveTDEE.reason} Yeterli veri oluşana kadar vücut ölçülerinden hesaplanan tahmin kullanılır.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Harcama', value: `${adaptiveTDEE.tdee} kcal` },
                  { label: 'Ort. Alım', value: `${adaptiveTDEE.avgIntake} kcal` },
                  { label: 'Kilo Hızı', value: `${adaptiveTDEE.weightChangePerWeek > 0 ? '+' : ''}${adaptiveTDEE.weightChangePerWeek} kg` },
                ].map(item => (
                  <div key={item.label} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2">
                    <strong className="text-[10px] font-mono text-zinc-200 block">{item.value}</strong>
                    <span className="text-[8px] text-zinc-400 uppercase">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">{adaptiveTDEE.note}</p>
            </div>
          )}
        </DisclosureCard>
      )}
        </div>
      </DisclosureCard>
      )}

      <NutritionTemplatesModal
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        currentNutritionForm={currentNutritionForm}
        setCurrentNutritionForm={setCurrentNutritionForm}
        mealTemplates={mealTemplates}
        setMealTemplates={setMealTemplates}
        dayTemplates={dayTemplates}
        setDayTemplates={setDayTemplates}
      />
    </div>
  );
});

NutritionView.displayName = 'NutritionView';

export default NutritionView;
