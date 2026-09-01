import React, { memo, useCallback, useMemo, useState } from 'react';
import { Trash2, Calendar, Scale, Beef, Pencil, Copy, BookmarkPlus, HeartPulse, Search, Timer, Flame, Activity, Plus, Dumbbell, X, ChevronDown, FolderArchive, Layers3, ArrowRightLeft } from 'lucide-react';
import { calcTonnage, calcEffectiveSets, isCompletedWorkingSet, foldForSearch, getLocalDateString } from '../utils/helpers';
import {
  findActivity, findEffort, effortDelta, cardioEntryCalories, totalCardioCalories,
  dayWorkoutCalories, cardioArchiveSummary, evaluateCardioEntry, isActiveRecoveryEntry,
} from '../utils/cardio';
import { dailyTotals } from '../utils/nutritionStats';
import { parseNumber, clampNumber } from '../utils/helpers';
import { formatDay, weekdayName, groupIntoWeeks, groupWeeksIntoMonths } from '../utils/dates';
import { dayMindCalories } from '../utils/wellness';
import { buildArchiveDays, filterArchiveDays } from '../utils/archiveTimeline';
import ViewHeader from './ViewHeader';

/**
 * Listeyi haftalara bölüp araya başlık koyar.
 *
 * Uzun bir geçmiş listesinde tek tek tarihler birbirine karışıyor; hafta
 * sınırları "bu hafta ne yaptım" sorusunu gözle cevaplanır hale getiriyor.
 * Hafta pazartesi–pazar; veri sınırıyla kesilen haftalar ayrıca işaretleniyor
 * ki eksik bir hafta tam haftayla kıyaslanıp yanlış okunmasın.
 */
const WeekGroups = ({ items, getDate, children, expandAll = false }) => {
  const months = useMemo(
    () => groupWeeksIntoMonths(groupIntoWeeks(items, getDate)),
    [items, getDate],
  );
  // Arşiv ilk açıldığında yalnız en yeni ayın başlığı açık, haftalar kapalıdır.
  // Böylece uzun geçmiş tek ekrana yığılmaz; arama sırasında eşleşmeler otomatik açılır.
  const [openMonths, setOpenMonths] = useState(() => new Set(months[0] ? [months[0].key] : []));
  const [openWeeks, setOpenWeeks] = useState(() => new Set());
  const toggle = (setter, key) => setter(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  return (
    <div className="space-y-2.5">
      {months.map(month => {
        const monthOpen = expandAll || openMonths.has(month.key);
        return (
          <section key={month.key} className="defer-card-render bg-zinc-900/65 border border-zinc-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggle(setOpenMonths, month.key)}
              aria-expanded={monthOpen}
              className="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left active:bg-zinc-800"
            >
              <span className="flex items-center gap-2 min-w-0">
                <FolderArchive size={14} className="text-cyan-500 shrink-0" />
                <span>
                  <strong className="text-[11px] text-zinc-200 uppercase tracking-wider block">{month.label}</strong>
                  <span className="text-[8px] font-mono text-zinc-400">{month.weeks.length} hafta · {month.itemCount} kayıt</span>
                </span>
              </span>
              <ChevronDown size={15} className={`text-zinc-400 transition-transform ${monthOpen ? 'rotate-180' : ''}`} />
            </button>

            {monthOpen && (
              <div className="border-t border-zinc-800 p-2 space-y-2 bg-black/20">
                {month.weeks.map(group => {
                  const weekOpen = expandAll || openWeeks.has(group.key);
                  return (
                    <div key={group.key} className="bg-zinc-950/70 border border-zinc-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggle(setOpenWeeks, group.key)}
                        aria-expanded={weekOpen}
                        className="w-full px-3 py-2.5 flex items-center gap-2 text-left active:bg-zinc-900"
                      >
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest shrink-0">{group.label}</span>
                        {group.partial && (
                          <span title={`Tam hafta: ${group.fullLabel}`} className="text-[8px] font-mono text-amber-400 border border-amber-900/50 bg-amber-950/20 rounded px-1 py-0.5 shrink-0">kısmi</span>
                        )}
                        <span className="h-px flex-1 bg-zinc-800" />
                        <span className="text-[9px] font-mono text-zinc-400 shrink-0">{group.items.length}</span>
                        <ChevronDown size={13} className={`text-zinc-400 transition-transform ${weekOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {weekOpen && <div className="p-2.5 space-y-2.5 border-t border-zinc-800">{group.items.map(children)}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

const ArchiveEmptyState = ({ icon, title, detail, actionLabel, onAction }) => (
  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/65 px-5 py-9 text-center">
    <span className="w-12 h-12 mx-auto rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400 flex items-center justify-center">
      {React.createElement(icon, { size: 20 })}
    </span>
    <strong className="text-sm text-zinc-200 block mt-3">{title}</strong>
    <p className="text-[10px] font-mono text-zinc-400 leading-relaxed mt-1.5 max-w-xs mx-auto">{detail}</p>
    {onAction && (
      <button type="button" onClick={onAction} className="min-h-11 mt-4 rounded-xl border border-cyan-900/60 bg-cyan-950/25 px-4 text-[10px] font-bold text-cyan-400 active:bg-cyan-950/50">
        {actionLabel}
      </button>
    )}
  </div>
);

// Listeler App tarafından tarihe göre azalan sırada verilir (en yeni en üstte).
// Burada tekrar sıralama veya ters çevirme yapılmaz.
const HistoryView = memo(({
  historyTab,
  setHistoryTab,
  workouts,
  metricsHistory,
  nutritionHistory,
  setDeleteConfirm,
  handleEditOldWorkoutDate,
  handleEditOldWorkout,
  handleRepeatWorkout,
  handleEditMetric,
  handleEditNutrition,
  onAddWorkout,
  onAddCardio,
  onAddMetric,
  onAddNutrition,
  onEditCardio,
  handleSaveAsTemplate,
  latestWeight = 0,
  loadOptsFor,
  wellness = [],
  maintenanceCalories = 0,
  onUpdateNutrition,
  bodyContextForDate,
  energyForRecord,
  onCompareMetrics,
  onOpenEnergyDay,
  interfaceMode = 'simple',
}) => {
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState(getLocalDateString);
  const openAddPanel = () => {
    setAddOpen(true);
    requestAnimationFrame(() => document.querySelector('[data-view-scroll="history"]')?.scrollTo({ top: 0, behavior: 'smooth' }));
  };
  const q = foldForSearch(query).trim();
  const strengthWorkouts = useMemo(() => workouts.filter(w => (w.exercises || []).length > 0), [workouts]);
  const cardioRecords = useMemo(() => workouts.flatMap(workout => (workout.cardio || []).map(cardio => ({
    workoutId: workout.id, date: workout.date, workoutName: workout.name, cardio,
  }))), [workouts]);
  const filteredWorkouts = useMemo(() => !q ? strengthWorkouts : strengthWorkouts.filter(w =>
    foldForSearch(`${w.name || ''} ${w.date} ${(w.exercises || []).map(ex => ex.name).join(' ')}`).includes(q)), [strengthWorkouts, q]);
  const filteredCardio = useMemo(() => !q ? cardioRecords : cardioRecords.filter(record =>
    foldForSearch(`${record.date} ${findActivity(record.cardio.type)?.label || record.cardio.type} ${record.workoutName || ''}`).includes(q)), [cardioRecords, q]);
  const filteredMetrics = useMemo(() => !q ? metricsHistory : metricsHistory.filter(m =>
    foldForSearch(`${m.date} ${m.weight} ${m.bodyFat || ''}`).includes(q)), [metricsHistory, q]);
  const filteredNutrition = useMemo(() => !q ? nutritionHistory : nutritionHistory.filter(n =>
    foldForSearch(`${n.date} ${(n.meals || []).map(meal => meal.name).join(' ')}`).includes(q)), [nutritionHistory, q]);
  const archiveDays = useMemo(
    () => buildArchiveDays({ workouts, metrics: metricsHistory, nutrition: nutritionHistory }),
    [workouts, metricsHistory, nutritionHistory],
  );
  const filteredArchiveDays = useMemo(
    () => filterArchiveDays(archiveDays, query, type => findActivity(type)?.label || type),
    [archiveDays, query],
  );
  const weightForDate = useCallback(
    (date) => bodyContextForDate?.(date)?.weight || latestWeight,
    [bodyContextForDate, latestWeight],
  );
  const cardioSummary = useMemo(
    () => cardioArchiveSummary(workouts, latestWeight, weightForDate),
    [workouts, latestWeight, weightForDate]);

  return (
    <div data-view-scroll="history" className="luxury-screen p-4 space-y-4 pb-nav h-full overflow-y-auto hide-scrollbar bg-black">
      <ViewHeader
        eyebrow="Kayıt Arşivi"
        title="Geçmiş"
        subtitle="Günlerini ara, incele veya geçmiş bir kaydı düzenle."
        action={(
          <button
            type="button"
            onClick={() => setAddOpen(value => !value)}
            aria-expanded={addOpen}
            className={`min-h-11 rounded-xl border px-3 flex items-center gap-1.5 text-[10px] font-bold ${addOpen ? 'border-cyan-700 bg-cyan-600 text-white' : 'border-zinc-800 bg-zinc-900 text-cyan-400'}`}
          >
            {addOpen ? <X size={15} /> : <Plus size={15} />} {addOpen ? 'Kapat' : 'Geçmişe Ekle'}
          </button>
        )}
      />

      {addOpen && (
        <section className="luxury-feature-card bg-gradient-to-br from-zinc-900/90 via-zinc-900/95 to-zinc-950 rounded-3xl border border-zinc-800/80 shadow-xl overflow-hidden">
          <div className="p-3.5 space-y-3 bg-zinc-950/60">
            <div>
              <strong className="text-[12px] font-bold text-zinc-100 block">Geçmişe kayıt ekle</strong>
              <span className="text-[9px] font-mono text-zinc-500">Tarihi seç, ardından kayıt türüne dokun.</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Kayıt tarihi</span>
                <strong className="text-[11px] font-mono text-cyan-400">{formatDay(addDate, 'medium', { year: true })}</strong>
              </div>
              <input type="date" value={addDate} max={getLocalDateString()} onChange={(event) => setAddDate(event.target.value)} className="min-h-11 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-cyan-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'workout', label: 'Antrenman', icon: Dumbbell, tone: 'text-cyan-400 border-cyan-900/50 bg-gradient-to-b from-cyan-950/30 to-zinc-950', action: onAddWorkout },
                { key: 'cardio', label: 'Kardiyo / Aktivite', icon: HeartPulse, tone: 'text-red-400 border-red-900/50 bg-gradient-to-b from-red-950/30 to-zinc-950', action: onAddCardio },
                { key: 'nutrition', label: 'Beslenme', icon: Beef, tone: 'text-emerald-400 border-emerald-900/50 bg-gradient-to-b from-emerald-950/30 to-zinc-950', action: onAddNutrition },
                { key: 'metric', label: 'Vücut Ölçümü', icon: Scale, tone: 'text-purple-400 border-purple-900/50 bg-gradient-to-b from-purple-950/30 to-zinc-950', action: onAddMetric },
              ].map(item => (
                <button key={item.key} onClick={() => { item.action?.(addDate); setAddOpen(false); }} className={`min-h-12 border rounded-2xl p-3 flex items-center gap-2 text-[10px] font-bold active:scale-[0.97] transition-all shadow-sm ${item.tone}`}>
                  {React.createElement(item.icon, { size: 14 })} {item.label}
                </button>
              ))}
            </div>
            <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">O tarihte beslenme veya ölçüm varsa yeni kopya açmak yerine mevcut kayıt düzenlemeye yüklenir.</p>
          </div>
        </section>
      )}
      <div className="luxury-segmented flex gap-1.5 overflow-x-auto hide-scrollbar bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800/80 shadow-md" aria-label="Arşiv kayıt türü">
        {[
          { key: 'all', label: 'Tümü', count: archiveDays.length, activeBg: 'bg-cyan-600' },
          { key: 'workouts', label: 'Ağırlık', count: strengthWorkouts.length, activeBg: 'bg-cyan-600' },
          { key: 'cardio', label: 'Aktivite', count: cardioRecords.length, activeBg: 'bg-red-600' },
          { key: 'metrics', label: 'Ölçüm', count: metricsHistory.length, activeBg: 'bg-cyan-600' },
          { key: 'nutrition', label: 'Besin', count: nutritionHistory.length, activeBg: 'bg-cyan-600' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setHistoryTab(tab.key)}
            aria-pressed={historyTab === tab.key}
            className={`min-h-11 shrink-0 px-3 rounded-xl text-[10px] font-bold transition-all active:scale-[0.96] flex items-center gap-1.5 ${historyTab === tab.key ? `${tab.activeBg} text-white shadow-sm font-black` : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <span>{tab.label}</span>
            <span className={`min-w-5 h-5 px-1 rounded-md flex items-center justify-center text-[9px] font-mono ${historyTab === tab.key ? 'bg-black/20 text-white' : 'bg-zinc-900 text-zinc-400'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onOpenEnergyDay?.('')}
        className="w-full rounded-2xl border border-red-900/40 bg-red-950/15 px-3.5 py-3 flex items-center justify-between text-left active:scale-[0.98] transition-all shadow-sm hover:border-red-800/50"
      >
        <span className="flex items-center gap-2.5">
          <Flame size={15} className="text-red-400 shrink-0" />
          <span>
            <strong className="text-[10px] font-bold text-zinc-200 block">Gün gün kalori ve harcama</strong>
            <span className="text-[8px] font-mono text-zinc-500 block">Geçmiş günlerin enerji dökümünü tek tabloda aç</span>
          </span>
        </span>
        <span className="text-[9px] font-bold text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg px-2 py-1">Aç</span>
      </button>

      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tarih, hareket, öğün veya kayıt ara…"
          aria-label="Geçmişte ara"
          className="w-full bg-zinc-950/90 border border-zinc-800/80 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-500 shadow-inner"
        />
      </div>

      {historyTab === 'all' && (
        <div className="space-y-3">
          {interfaceMode === 'detailed' && <div className="bg-cyan-950/15 border border-cyan-900/30 rounded-xl p-3 flex items-start gap-2">
            <Layers3 size={14} className="text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">Aynı güne ait antrenman, aktivite, ölçüm, beslenme ve enerji kaydı tek kartta. Ay ve hafta başlıklarına dokunarak arşivi aç.</p>
          </div>}
          {filteredArchiveDays.length === 0 ? (
            <ArchiveEmptyState
              icon={Layers3}
              title={q ? 'Aramana uyan kayıt yok' : 'Arşiv henüz boş'}
              detail={q ? 'Başka bir tarih, hareket veya öğün adı dene.' : 'İlk kaydını eklediğinde günler burada ay ve hafta halinde düzenlenecek.'}
              actionLabel={q ? 'Aramayı temizle' : 'Kayıt seçeneklerini aç'}
              onAction={q ? () => setQuery('') : openAddPanel}
            />
          ) : (
            <WeekGroups key="all" items={filteredArchiveDays} expandAll={Boolean(q)}>{day => (
              <article key={day.date} className="defer-card-render bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <header className="px-3.5 py-3 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between gap-2">
                  <div>
                    <strong className="text-[11px] text-zinc-200 block">{formatDay(day.date, 'long')}</strong>
                    <span className="text-[8px] font-mono text-zinc-400">
                      {day.workouts.length} antrenman · {day.cardio.length} aktivite · {day.metrics.length} ölçüm · {day.nutrition.length} besin
                    </span>
                  </div>
                  {day.metrics.length > 0 && onCompareMetrics && (
                    <button onClick={onCompareMetrics} className="h-8 px-2 rounded-lg border border-zinc-800 text-[8px] font-bold text-cyan-400 flex items-center gap-1">
                      <ArrowRightLeft size={10} /> Kıyasla
                    </button>
                  )}
                </header>
                <div className="p-2.5 space-y-2">
                  {day.workouts.map(workout => (
                    <div key={`w-${workout.id}`} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 flex items-center gap-2">
                      <Dumbbell size={13} className="text-cyan-400 shrink-0" />
                      <div className="min-w-0 flex-1"><strong className="text-[10px] text-zinc-300 block truncate">{workout.name || 'Serbest Antrenman'}</strong><span className="text-[8px] font-mono text-zinc-400">{(workout.exercises || []).length} hareket · {calcEffectiveSets(workout.exercises)} etkili set</span></div>
                      <button onClick={() => handleEditOldWorkout?.(workout)} aria-label="Antrenmanı düzenle" className="p-2 text-zinc-400 active:text-cyan-400"><Pencil size={12} /></button>
                    </div>
                  ))}
                  {day.cardio.map(record => {
                    const activity = findActivity(record.cardio.type);
                    return (
                      <div key={`c-${record.workoutId}-${record.cardio.id}`} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 flex items-center gap-2">
                        <HeartPulse size={13} className="text-red-400 shrink-0" />
                        <div className="min-w-0 flex-1"><strong className="text-[10px] text-zinc-300 block truncate">{activity?.label || record.cardio.type}</strong><span className="text-[8px] font-mono text-zinc-400">{record.cardio.minutes || 0} dk · ~{cardioEntryCalories(record.cardio, weightForDate(day.date))} kcal</span></div>
                        <button onClick={() => onEditCardio?.(record)} aria-label="Aktiviteyi düzenle" className="p-2 text-zinc-400 active:text-cyan-400"><Pencil size={12} /></button>
                      </div>
                    );
                  })}
                  {day.metrics.map(metric => (
                    <div key={`m-${metric.id || metric.date}`} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 flex items-center gap-2">
                      <Scale size={13} className="text-emerald-400 shrink-0" />
                      <div className="min-w-0 flex-1"><strong className="text-[10px] text-zinc-300 block">Vücut ölçümü</strong><span className="text-[8px] font-mono text-zinc-400">{parseNumber(metric.weight) || '—'} kg · %{parseNumber(metric.bodyFat) || '—'} yağ</span></div>
                      <button onClick={() => handleEditMetric?.(metric)} aria-label="Ölçümü düzenle" className="p-2 text-zinc-400 active:text-cyan-400"><Pencil size={12} /></button>
                    </div>
                  ))}
                  {day.nutrition.map(record => {
                    const totals = dailyTotals(record);
                    const energy = energyForRecord?.(record);
                    const balance = energy ? Math.round(totals.calories - parseNumber(energy.total)) : null;
                    return (
                      <div key={`n-${record.id || record.date}`} className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 flex items-center gap-2">
                        <Beef size={13} className="text-orange-400 shrink-0" />
                        <div className="min-w-0 flex-1"><strong className="text-[10px] text-zinc-300 block">Beslenme & enerji</strong><span className="text-[8px] font-mono text-zinc-400">{Math.round(totals.calories)} kcal · P {Math.round(totals.protein)}g{balance !== null ? ` · denge ${balance > 0 ? '+' : ''}${balance}` : ''}</span></div>
                        <button onClick={() => onOpenEnergyDay?.(day.date)} aria-label="Bu günün enerji detayını aç" className="p-2 text-red-400 active:text-red-300"><Flame size={12} /></button>
                        <button onClick={() => handleEditNutrition?.(record)} aria-label="Beslenmeyi düzenle" className="p-2 text-zinc-400 active:text-cyan-400"><Pencil size={12} /></button>
                      </div>
                    );
                  })}
                </div>
              </article>
            )}</WeekGroups>
          )}
        </div>
      )}

      {historyTab === 'workouts' && (
        <div className="space-y-3">
          {filteredWorkouts.length === 0 ? (
            <ArchiveEmptyState
              icon={Dumbbell}
              title={q ? 'Eşleşen antrenman yok' : 'Henüz ağırlık antrenmanı yok'}
              detail={q ? 'Hareket adını veya tarihi değiştirerek tekrar ara.' : 'Bugün için boş bir antrenman açıp hareketlerini ekleyebilirsin.'}
              actionLabel={q ? 'Aramayı temizle' : 'Antrenman ekle'}
              onAction={q ? () => setQuery('') : () => onAddWorkout?.(getLocalDateString())}
            />
          ) : (
            <WeekGroups key="workouts" items={filteredWorkouts} expandAll={Boolean(q)}>{w => {
              const tonnage = calcTonnage(w.exercises, loadOptsFor?.(w.date) || null);
              const effectiveSets = calcEffectiveSets(w.exercises);
              const cardio = w.cardio || [];
              const cardioKcal = totalCardioCalories(cardio, weightForDate(w.date));
              return (
                <div key={w.id} className="defer-card-render bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
                  <div className="flex justify-between items-start border-b border-zinc-800 pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-cyan-400">{w.name || 'Serbest Antrenman'}</h4>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-500 mt-0.5">
                        <Calendar size={10} />
                        <input
                          type="date"
                          value={w.date}
                          onChange={(e) => handleEditOldWorkoutDate(w.id, e.target.value)}
                          className="bg-transparent text-zinc-400 font-mono outline-none border-b border-dashed border-zinc-700 focus:border-cyan-500 text-[10px]"
                        />
                        {/* Tarih girdisi gün adını göstermiyor; program takibinde
                            asıl bilgi o olduğu için yanına ayrıca yazılıyor. */}
                        <span className="text-cyan-500/80 font-bold">{weekdayName(w.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        onClick={() => handleSaveAsTemplate?.(w)}
                        title="Şablon olarak kaydet"
                        className="text-zinc-500 active:text-cyan-400 p-2"
                      >
                        <BookmarkPlus size={14} />
                      </button>
                      <button
                        onClick={() => handleRepeatWorkout?.(w)}
                        title="Bu antrenmanı bugün tekrarla"
                        className="text-zinc-500 active:text-cyan-400 p-2"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleEditOldWorkout?.(w)}
                        title="Setleri düzenle"
                        className="text-zinc-500 active:text-cyan-400 p-2"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, type: 'workout', id: w.id })}
                        title="Sil"
                        className="text-zinc-400 active:text-red-500 p-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Toplam Hacim</span>
                      <span className="text-zinc-200 font-bold">{tonnage} kg</span>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Etkili Set (RIR ≤ 3)</span>
                      <span className="text-cyan-400 font-bold">{effectiveSets} Set</span>
                    </div>
                  </div>

                  {cardio.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center">
                          <HeartPulse size={11} className="mr-1.5" /> Kardiyo
                        </span>
                        {cardioKcal > 0 && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            toplam <strong className="text-red-400">{cardioKcal}</strong> kcal
                          </span>
                        )}
                      </div>
                      {cardio.map(c => {
                        // Planla arasındaki tempo farkı varsa gösterilir: haftalık
                        // dengeyi bozan çoğunlukla plandan sapan şiddet oluyor.
                        const sapma = effortDelta(c, weightForDate(w.date));
                        return (
                          <div key={c.id} className="text-[11px] font-mono text-zinc-300 bg-red-950/10 p-2 rounded-xl border border-red-900/25 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-zinc-200 truncate pr-2">{findActivity(c.type)?.label || c.type}</span>
                              <span className="text-zinc-400 text-[10px] shrink-0">
                                {c.minutes} dk
                                {c.effort && ` · ${findEffort(c).fullLabel}`}
                                {weightForDate(w.date) > 0 && ` · ${cardioEntryCalories(c, weightForDate(w.date), true)} kcal`}
                              </span>
                            </div>
                            {sapma && (
                              <p className={`text-[9px] ${sapma.harder ? 'text-amber-400' : 'text-cyan-400'}`}>
                                Plan {sapma.planned.label} → gerçekleşen {sapma.actual.label}
                                {' · '}{sapma.kcalDiff > 0 ? '+' : ''}{sapma.kcalDiff} kcal
                                {' · yorgunluk '}{sapma.fatigueDiff > 0 ? '+' : ''}{sapma.fatigueDiff}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Set özeti alt satıra sarar: shrink-0 ile tek satırda
                      tutulunca çok setli hareketlerde metin ekranın dışına
                      taşıp görünmeden kesiliyordu. */}
                  <div className="space-y-1.5 pt-1">
                    {(w.exercises || []).map((ex, i) => (
                      <div key={i} className="text-[11px] font-mono text-zinc-300 bg-zinc-950/50 p-2 rounded-xl border border-zinc-800/50 flex justify-between items-start gap-2">
                        <span className="font-bold text-zinc-200 truncate shrink-0 max-w-[45%]">{ex.name}</span>
                        <span className="text-zinc-400 text-[10px] text-right break-words min-w-0">
                          {(ex.sets || []).filter(isCompletedWorkingSet).map(s => `${s.weight}x${s.reps}`).join(' · ') || 'Tamamlanan set yok'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}</WeekGroups>
          )}
        </div>
      )}

      {historyTab === 'cardio' && (
        <div className="space-y-3">
          {cardioSummary.count > 0 && (
            <section className="bg-gradient-to-br from-red-950/35 to-zinc-900 rounded-2xl border border-red-900/35 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] font-mono text-red-400 uppercase tracking-widest">Kardiyo & Aktivite Özeti</span>
                  <h3 className="text-[12px] font-bold text-zinc-100">Kişisel arşiv ortalamaların</h3>
                </div>
                <Activity size={18} className="text-red-400" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  [<HeartPulse key="sessions" size={11} />, 'Kayıt', cardioSummary.count],
                  [<Timer key="minutes" size={11} />, 'Toplam', `${cardioSummary.totalMinutes} dk`],
                  [<Flame key="calories" size={11} />, 'Yakım', cardioSummary.totalCalories > 0 ? `${cardioSummary.totalCalories} kcal` : '—'],
                ].map(([icon, label, value]) => (
                  <div key={label} className="bg-zinc-950/80 border border-zinc-800 rounded-xl py-2">
                    <span className="flex justify-center text-red-400 mb-0.5">{icon}</span>
                    <strong className="text-[11px] font-mono text-zinc-100 block">{value}</strong>
                    <span className="text-[8px] font-mono text-zinc-400 uppercase">{label}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {cardioSummary.activities.map(item => (
                  <div key={item.type} className="flex justify-between text-[9px] font-mono text-zinc-400">
                    <span>{findActivity(item.type)?.label || item.type}</span>
                    <span>{item.count} kayıt · ort. {Math.round(item.minutes / item.count)} dk</span>
                  </div>
                ))}
              </div>
            </section>
          )}
          {filteredCardio.length === 0 ? (
            <ArchiveEmptyState
              icon={HeartPulse}
              title={q ? 'Eşleşen aktivite yok' : 'Henüz kardiyo veya aktivite yok'}
              detail={q ? 'Aktivite adını veya tarihi değiştirerek tekrar ara.' : 'Yürüyüşten interval koşuya kadar bir aktiviteyi bugüne kaydedebilirsin.'}
              actionLabel={q ? 'Aramayı temizle' : 'Aktivite ekle'}
              onAction={q ? () => setQuery('') : () => onAddCardio?.(getLocalDateString())}
            />
          ) : <WeekGroups key="cardio" items={filteredCardio} expandAll={Boolean(q)}>{record => {
            const activity = findActivity(record.cardio.type);
            const effort = findEffort(record.cardio);
            const historicalWeight = weightForDate(record.date);
            const calories = cardioEntryCalories(record.cardio, historicalWeight, true);
            const deviation = effortDelta(record.cardio, historicalWeight);
            const evaluation = evaluateCardioEntry(record.cardio, workouts, historicalWeight, true);
            return (
              <div key={`${record.workoutId}-${record.cardio.id}`} className="defer-card-render bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-red-400 flex items-center"><HeartPulse size={14} className="mr-1.5" />{activity?.label || record.cardio.type}</h4>
                    <span className="text-[10px] font-mono text-zinc-400">{formatDay(record.date, 'medium', { year: true })}</span>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button onClick={() => onEditCardio?.(record)} aria-label="Kardiyo kaydını düzenle" title="Düzenle" className="p-2 text-zinc-400 active:text-cyan-400"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'cardio', id: `${record.workoutId}::${record.cardio.id}` })} aria-label="Kardiyo kaydını sil" className="p-2 text-zinc-400 active:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Süre', `${record.cardio.minutes} dk`],
                    ['Tempo', effort?.label || 'Orta'],
                    ['Yakım', historicalWeight > 0 ? `${calories} kcal` : '—'],
                  ].map(([label, value]) => <div key={label} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2"><span className="text-[8px] font-mono text-zinc-400 uppercase block">{label}</span><strong className="text-[10px] font-mono text-zinc-200">{value}</strong></div>)}
                </div>
                {evaluation.stats.count > 1 && (
                  <div className={`rounded-xl border px-3 py-2 ${evaluation.tone === 'harder'
                    ? 'border-amber-900/40 bg-amber-950/15'
                    : evaluation.tone === 'lighter'
                      ? 'border-cyan-900/40 bg-cyan-950/15'
                      : 'border-zinc-800 bg-zinc-950/60'}`}>
                    <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                      Bu aktivitedeki son {evaluation.stats.count} kayıt ortalaman:
                      {' '}<strong className="text-zinc-200">{evaluation.stats.avgMinutes} dk</strong>
                      {historicalWeight > 0 && <> · <strong className="text-zinc-200">{evaluation.stats.avgCalories} kcal</strong></>}
                      . Bu kayıt süre olarak {evaluation.minuteDiff === 0 ? 'ortalamanla aynı' : `${Math.abs(evaluation.minuteDiff)} dk ${evaluation.minuteDiff > 0 ? 'uzun' : 'kısa'}`}
                      {evaluation.tone === 'harder' ? ' ve normalden daha yorucu.' : evaluation.tone === 'lighter' ? ' ve daha hafif.' : '.'}
                    </p>
                  </div>
                )}
                {isActiveRecoveryEntry(record.cardio) && (
                  <span className="inline-flex text-[9px] font-bold text-indigo-300 border border-indigo-900/40 bg-indigo-950/20 rounded-lg px-2 py-1">
                    Aktif toparlanma · off day korunur
                  </span>
                )}
                {record.cardio.note && <p className="text-[10px] text-zinc-400 bg-zinc-950/60 border border-zinc-800 rounded-lg px-2.5 py-2">{record.cardio.note}</p>}
                {deviation && <p className={`text-[9px] font-mono ${deviation.harder ? 'text-amber-400' : 'text-cyan-400'}`}>Plan {deviation.planned.label} → gerçekleşen {deviation.actual.label} · {deviation.kcalDiff > 0 ? '+' : ''}{deviation.kcalDiff} kcal</p>}
              </div>
            );
          }}</WeekGroups>}
        </div>
      )}

      {historyTab === 'metrics' && (
        <div className="space-y-3">
          {filteredMetrics.length === 0 ? (
            <ArchiveEmptyState
              icon={Scale}
              title={q ? 'Eşleşen ölçüm yok' : 'Henüz vücut ölçümü yok'}
              detail={q ? 'Tarihi, kiloyu veya yağ oranını değiştirerek tekrar ara.' : 'İlk ölçüm; hedef, kalori ve gelişim hesaplarının tarihsel temelini oluşturur.'}
              actionLabel={q ? 'Aramayı temizle' : 'Ölçüm ekle'}
              onAction={q ? () => setQuery('') : () => onAddMetric?.(getLocalDateString())}
            />
          ) : (
            <WeekGroups key="metrics" items={filteredMetrics} expandAll={Boolean(q)}>{m => (
              <div key={m.id} className="defer-card-render bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-2">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Scale size={14} className="text-cyan-400" />
                    <span className="text-xs font-bold text-zinc-200 font-mono">{formatDay(m.date, 'medium', { year: true })}</span>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button onClick={() => handleEditMetric?.(m)} title="Bu ölçümü düzenle" aria-label="Bu ölçümü düzenle" className="text-zinc-500 active:text-cyan-400 p-2">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'metric', id: m.id })} title="Sil" aria-label="Ölçümü sil" className="text-zinc-400 active:text-red-500 p-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-300 pt-1">
                  <div>Kilo: <strong className="text-cyan-400">{m.weight} kg</strong></div>
                  <div>Yağ: <strong className="text-cyan-400">%{m.bodyFat || '-'}</strong></div>
                  <div>Kol: <strong className="text-zinc-200">{m.measurements?.arm || '-'} cm</strong></div>
                  <div>Bel: <strong className="text-zinc-200">{m.measurements?.waist || '-'} cm</strong></div>
                  <div>Göğüs: <strong className="text-zinc-200">{m.measurements?.chest || '-'} cm</strong></div>
                  <div>Uyluk: <strong className="text-zinc-200">{m.measurements?.thigh || '-'} cm</strong></div>
                </div>
              </div>
            )}</WeekGroups>
          )}
        </div>
      )}

      {historyTab === 'nutrition' && (
        <div className="space-y-3">
          {filteredNutrition.length === 0 ? (
            <ArchiveEmptyState
              icon={Beef}
              title={q ? 'Eşleşen beslenme kaydı yok' : 'Henüz beslenme kaydı yok'}
              detail={q ? 'Öğün adını veya tarihi değiştirerek tekrar ara.' : 'Öğünlerini tek tek ya da yalnız günlük makro toplamını kaydedebilirsin.'}
              actionLabel={q ? 'Aramayı temizle' : 'Beslenme ekle'}
              onAction={q ? () => setQuery('') : () => onAddNutrition?.(getLocalDateString())}
            />
          ) : (
            <WeekGroups key="nutrition" items={filteredNutrition} expandAll={Boolean(q)}>{n => {
              // Toplamlar öğünlerden hesaplanır. Eskiden kayıttaki üst düzey
              // caloriesIn/protein/carbs/fats alanları okunuyordu ama bu alanlar
              // hiçbir zaman doldurulmuyordu; veri girilmiş günler bile 0 görünüyordu.
              const t = dailyTotals(n);
              const isDaily = n.entryMode === 'daily';
              return (
                <div key={n.id} className="defer-card-render bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-2">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Beef size={14} className="text-cyan-400 shrink-0" />
                      <span className="text-xs font-bold text-zinc-200 font-mono">{formatDay(n.date, 'medium', { year: true })}</span>
                      <span className="text-[9px] font-mono text-zinc-400 uppercase shrink-0">
                        {isDaily ? 'günlük toplam' : `${(n.meals || []).length} öğün`}
                      </span>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button onClick={() => onOpenEnergyDay?.(n.date)} title="Bu günün enerji detayını aç" aria-label="Bu günün enerji detayını aç" className="text-red-400 active:text-red-300 p-2">
                        <Flame size={14} />
                      </button>
                      <button onClick={() => handleEditNutrition?.(n)} title="Bu kaydı düzenle" aria-label="Bu kaydı düzenle" className="text-zinc-400 active:text-cyan-400 p-2">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm({ isOpen: true, type: 'nutrition', id: n.id })} title="Sil" aria-label="Sil" className="text-zinc-400 active:text-red-500 p-2">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-zinc-300 pt-1">
                    <div>Kalori: <strong className="text-cyan-400">{Math.round(t.calories)}</strong></div>
                    <div>Protein: <strong className="text-emerald-400">{Math.round(t.protein)}g</strong></div>
                    <div>Karb: <strong className="text-amber-400">{Math.round(t.carbs)}g</strong></div>
                    <div>Yağ: <strong className="text-purple-400">{Math.round(t.fats)}g</strong></div>
                  </div>

                  {/* O günün enerji dengesi. Yakım antrenman kayıtlarından
                      otomatik gelir; elle eklenen kısım burada düzenlenebilir. */}
                  {(() => {
                    const bodyAtDate = bodyContextForDate?.(n.date) || {};
                    const historicalWeight = bodyAtDate.weight || weightForDate(n.date);
                    const auto = dayWorkoutCalories(workouts, n.date, historicalWeight);
                    const zihin = dayMindCalories(wellness, n.date, historicalWeight);
                    const manual = parseNumber(n.activeCaloriesOut);
                    const maintenance = parseNumber(n.maintenanceAtTheTime) || maintenanceCalories;
                    const recalculated = typeof energyForRecord === 'function' ? energyForRecord(n) : null;
                    const energyBody = recalculated?.bodyContext || bodyAtDate;
                    const totalOut = parseNumber(recalculated?.total)
                      || (maintenance > 0 ? maintenance + auto.total + zihin + manual : auto.total + zihin + manual);
                    const balance = totalOut > 0
                      ? Math.round(t.calories - totalOut)
                      : null;
                    const weeklyKg = balance !== null
                      ? Math.round((balance * 7 / 7700) * 100) / 100
                      : null;
                    const tone = balance === null ? 'text-zinc-500'
                      : balance < -100 ? 'text-cyan-400'
                        : balance > 100 ? 'text-amber-400'
                          : 'text-emerald-400';
                    const etiket = balance === null ? '—'
                      : balance < -100 ? 'Açık'
                        : balance > 100 ? 'Fazla'
                          : 'Korunum';
                    return (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-400 uppercase tracking-wider text-[9px] font-bold">Enerji Dengesi</span>
                          {balance !== null && (
                            <span className={`font-bold ${tone}`}>
                              {balance > 0 ? '+' : ''}{balance} kcal · {etiket}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                          <span>Toplam günlük harcama</span>
                          <span className="text-zinc-200">{totalOut} kcal</span>
                        </div>

                        {energyBody.metricDate && (
                          <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                            <span>Vücut verisi</span>
                            <span>{formatDay(energyBody.metricDate)} · {Math.round(parseNumber(energyBody.weight) * 10) / 10} kg</span>
                          </div>
                        )}
                        {recalculated?.historicalSource && (
                          <div className="flex justify-between text-[8px] font-mono text-zinc-400">
                            <span>Hesap bağlamı</span>
                            <span>{recalculated.historicalSource === 'snapshot' ? 'Kayıt anında sabitlendi' : 'Tarihsel veriden hesaplandı'}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                          <span>Elle eklenen</span>
                          <span className="flex items-center gap-1.5">
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={5000}
                              value={n.activeCaloriesOut ?? ''}
                              onChange={(e) => onUpdateNutrition?.(n.id, { activeCaloriesOut: e.target.value })}
                              onBlur={(e) => onUpdateNutrition?.(n.id, {
                                activeCaloriesOut: e.target.value === '' ? '' : clampNumber(e.target.value, 0, 5000),
                              })}
                              placeholder="0"
                              className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg py-1 text-center font-mono text-red-400 text-[10px] outline-none focus:border-red-500"
                            />
                            <span className="text-zinc-400">kcal</span>
                          </span>
                        </div>

                        {balance !== null ? (
                          <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                            {Math.round(t.calories)} alındı − {totalOut} toplam harcandı. Genel ayar ve o tarihteki son ölçüm kullanıldı.
                            {weeklyKg !== 0 && (
                              <> Bu tempo sürseydi haftada {weeklyKg > 0 ? '+' : ''}{weeklyKg} kg.</>
                            )}
                          </p>
                        ) : (
                          <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                            Denge için korunum kalorisi gerekiyor — Vücut sekmesinden ölçüm gir.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            }}</WeekGroups>
          )}
        </div>
      )}
    </div>
  );
});

HistoryView.displayName = 'HistoryView';

export default HistoryView;
