import React, { lazy, memo, Suspense } from 'react';
import {
  AlertCircle, Calendar, CalendarCheck2, ChevronRight, Droplets, Dumbbell, Flame,
  Sparkles, Wrench, Zap
} from 'lucide-react';
import TodayCoachCard from './TodayCoachCard';
import CycleSummaryCard from './CycleSummaryCard';
import DeferredSection from './DeferredSection';
import HomeWeeklyOverview from './HomeWeeklyOverview';

const HomeTemplatesSection = lazy(() => import('./HomeTemplatesSection'));

const DeferredCardFallback = ({ height = 180, label = 'Bölüm hazırlanıyor' }) => (
  <div
    className="rounded-2xl border border-zinc-900 bg-zinc-950/70 animate-pulse flex items-center justify-center"
    style={{ minHeight: height }}
    role="status"
  >
    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">{label}</span>
  </div>
);

const HomeView = memo(({
  needsBackup,
  dashboardStats,
  templates,
  setIsSettingsModalOpen,
  handleStartRequest,
  setDeleteConfirm,
  onSelectMuscle,
  onPreviewTemplate,
  onEditTemplate,
  customExercises = [],
  restSeconds = 120,
  experienceLevel = 'intermediate',
  onOpenTemplateBuilder,
  onOpenTools,
  onOpenDailyWorkspace,
  readiness,
  personalVolume = {},
  weeklyCardioKcal = 0,
  showMuscleVolume = false,
  onToggleMuscleVolume,
  todayCoach,
  coachBriefing = null,
  coachActions = [],
  onSnoozeCoach,
  onDismissCoach,
  onRestoreCoach,
  onApplyCoach,
  onRejectCoach,
  coachFocus = null,
  onOpenLedger,
  ledgerOpenCount = 0,
  coachHiddenCount = 0,
  coachConflictCount = 0,
  onCoachAction,
  onOpenEnergy,
  onOpenWellness,
  onOpenCardio,
  gender = 'male',
  cycleSummary,
  onOpenCycle,
  interfaceMode = 'simple',
  onOpenTraining,
  onOpenNutrition,
  onOpenWeeklyPlan,
  waterSummary,
  waterTarget,
  onAddWater,
  onToggleTemplateFavorite,
}) => {
  return (
    <div data-view-scroll="home" className="luxury-screen p-4 space-y-4 pb-nav h-full overflow-y-auto hide-scrollbar bg-black">

      {/* Koç ve Günlük Brifing Kartı */}
      <TodayCoachCard
        data={todayCoach}
        briefing={coachBriefing}
        actions={coachActions}
        onSnooze={onSnoozeCoach}
        onDismiss={onDismissCoach}
        onRestoreCoach={onRestoreCoach}
        onApply={onApplyCoach}
        onReject={onRejectCoach}
        focus={coachFocus}
        onOpenLedger={onOpenLedger}
        ledgerOpenCount={ledgerOpenCount}
        hiddenCount={coachHiddenCount}
        conflictCount={coachConflictCount}
        onAction={onCoachAction}
        onStart={handleStartRequest}
        onOpenEnergy={onOpenEnergy}
        onOpenWellness={onOpenWellness}
        onOpenCardio={onOpenCardio}
        compact={interfaceMode === 'simple'}
      />

      {/* Tek baskın eylem + üç yardımcı kısayol. Dört eşit kart, kullanıcının
          "şimdi ne yapmalıyım" kararını kendisinin vermesine yol açıyordu. */}
      <section className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 overflow-hidden shadow-lg" aria-label="Hızlı işlemler">
        <button
          type="button"
          onClick={() => (handleStartRequest ? handleStartRequest() : onOpenTraining?.())}
          className="w-full min-h-[72px] px-4 py-3.5 flex items-center gap-3.5 text-left bg-gradient-to-r from-cyan-950/45 to-zinc-900 active:bg-cyan-950/60 transition-colors"
        >
          <span className="w-11 h-11 rounded-2xl bg-cyan-500 text-zinc-950 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/40">
            <Zap size={20} strokeWidth={2.4} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-[9px] text-cyan-400 uppercase tracking-[0.16em] font-bold block">Sıradaki eylem</span>
            <strong className="text-[13px] font-black text-zinc-100 block mt-0.5">Antrenmanı Başlat</strong>
            <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
              {todayCoach?.workoutTemplate ? todayCoach.workoutTemplate.name : 'Şablon seç veya serbest seans aç'}
            </span>
          </span>
          <ChevronRight size={18} className="text-cyan-400 shrink-0" />
        </button>

        <div className="grid grid-cols-3 border-t border-zinc-800/80 divide-x divide-zinc-800/80">
          {[
            { key: 'daily', icon: CalendarCheck2, title: 'Günlük', alt: 'Tüm kayıtlar', onClick: () => onOpenDailyWorkspace?.() },
            { key: 'plan', icon: Calendar, title: 'Program', alt: 'Haftalık plan', onClick: () => (onOpenWeeklyPlan ? onOpenWeeklyPlan() : onOpenTraining?.()) },
            { key: 'tools', icon: Wrench, title: 'Araçlar', alt: 'Hesaplayıcılar', onClick: () => onOpenTools?.() },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button key={item.key} type="button" onClick={item.onClick} className="min-h-[70px] px-2 py-3 flex flex-col items-center justify-center text-center active:bg-zinc-900 transition-colors">
                <Icon size={16} className="text-zinc-300" />
                <strong className="text-[10px] text-zinc-100 block mt-1.5">{item.title}</strong>
                <span className="text-[9px] text-zinc-500 block mt-0.5 truncate max-w-full">{item.alt}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Günlük Hızlı Hidrasyon Paneli */}
      {waterSummary && waterTarget && (
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="shrink-0 text-sky-400">
                <Droplets size={14} className="text-sky-300" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-200 block">
                  Günlük Su Takibi
                </span>
                <span className="text-[9px] font-mono text-zinc-400 block">
                  {(waterSummary.today / 1000).toFixed(1)} / {(waterTarget.ml / 1000).toFixed(1)} L (%{waterSummary.percent})
                </span>
              </div>
            </div>

            {/* Hızlı Ekleme Butonları */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onAddWater?.(250)}
                className="min-h-11 px-3 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 text-[10px] font-bold active:scale-[0.95] transition-transform"
                title="+250 ml su ekle"
              >
                +250ml
              </button>
              <button
                type="button"
                onClick={() => onAddWater?.(500)}
                className="min-h-11 px-3 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 text-[10px] font-bold active:scale-[0.95] transition-transform"
                title="+500 ml su ekle"
              >
                +500ml
              </button>
              {onOpenNutrition && (
                <button
                  type="button"
                  onClick={onOpenNutrition}
                  aria-label="Beslenme ekranına git"
                  className="w-11 h-11 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 active:scale-[0.95] transition-colors flex items-center justify-center"
                  title="Beslenme ekranına git"
                >
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="h-2 bg-zinc-950 rounded-full border border-zinc-800/80 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${Math.min(100, waterSummary.percent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Yedekleme hatırlatması */}
      {needsBackup && (
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="w-full bg-zinc-900/90 border border-zinc-800/80 px-3.5 py-3 rounded-2xl flex items-center gap-2.5 text-left active:scale-[0.98] transition-all shadow-sm"
        >
          <AlertCircle className="text-amber-500 shrink-0" size={15} />
          <span className="text-[10px] font-mono text-zinc-400 flex-1 leading-relaxed">
            Bir haftadır yedek almadın. Veriler yalnızca bu cihazda.
          </span>
          <span className="text-[9px] font-bold text-amber-400 uppercase shrink-0 px-2 py-1 rounded-lg border border-amber-900/40 bg-amber-950/30">Yedekle</span>
        </button>
      )}

      {gender === 'female' && (
        <CycleSummaryCard summary={cycleSummary} onOpen={onOpenCycle} />
      )}

      <HomeWeeklyOverview
        key={interfaceMode}
        dashboardStats={dashboardStats}
        readiness={readiness}
        personalVolume={personalVolume}
        weeklyCardioKcal={weeklyCardioKcal}
        showMuscleVolume={showMuscleVolume}
        onToggleMuscleVolume={onToggleMuscleVolume}
        onSelectMuscle={onSelectMuscle}
        experienceLevel={experienceLevel}
        gender={gender}
        interfaceMode={interfaceMode}
      />

      {/* Şablon kütüphanesi sayfanın altındadır */}
      <DeferredSection
        minHeight={190}
        rootMargin="420px 0px"
        fallback={<DeferredCardFallback height={190} label="Şablonlar hazırlanıyor" />}
      >
        <Suspense fallback={<DeferredCardFallback height={190} label="Şablonlar yükleniyor" />}>
          <HomeTemplatesSection
            templates={templates}
            customExercises={customExercises}
            restSeconds={restSeconds}
            interfaceMode={interfaceMode}
            onOpenTraining={onOpenTraining}
            onOpenTemplateBuilder={onOpenTemplateBuilder}
            onPreviewTemplate={onPreviewTemplate}
            onEditTemplate={onEditTemplate}
            onToggleTemplateFavorite={onToggleTemplateFavorite}
            handleStartRequest={handleStartRequest}
            setDeleteConfirm={setDeleteConfirm}
          />
        </Suspense>
      </DeferredSection>
    </div>
  );
});

HomeView.displayName = 'HomeView';

export default HomeView;
