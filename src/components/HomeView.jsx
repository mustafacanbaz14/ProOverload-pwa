import React, { lazy, memo, Suspense } from 'react';
import {
  AlertCircle, Calendar, ChevronRight, Droplets, Dumbbell, Flame, Plus,
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
    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-700">{label}</span>
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
  onQuickCapture,
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
  const isTemplateReady = Boolean(todayCoach?.workoutTemplate || todayCoach?.cardioLabel);

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

      {/* Hızlı Aksiyon & Görev Komuta Merkezi */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" aria-label="Hızlı işlemler">
          <button
            type="button"
            onClick={() => handleStartRequest ? handleStartRequest() : onOpenTraining?.()}
            className="group relative overflow-hidden rounded-2xl border border-cyan-800/50 bg-gradient-to-br from-cyan-950/60 via-zinc-900/90 to-zinc-950 p-3 text-left active:scale-[0.97] transition-all shadow-lg shadow-cyan-950/20 hover:border-cyan-600/70"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Zap size={16} className="text-cyan-300" />
              </div>
              <span className="text-[8px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded-md border border-cyan-800/40">
                {isTemplateReady ? 'Planlı' : 'Serbest'}
              </span>
            </div>
            <strong className="text-xs font-black uppercase tracking-wider text-zinc-100 block">
              Antrenman
            </strong>
            <span className="text-[9px] font-mono text-zinc-400 block mt-0.5 truncate">
              {todayCoach?.workoutTemplate ? todayCoach.workoutTemplate.name : 'Seansı Başlat'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onQuickCapture?.()}
            className="group relative overflow-hidden rounded-2xl border border-emerald-800/50 bg-gradient-to-br from-emerald-950/60 via-zinc-900/90 to-zinc-950 p-3 text-left active:scale-[0.97] transition-all shadow-lg shadow-emerald-950/20 hover:border-emerald-600/70"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Plus size={16} className="text-emerald-300" />
              </div>
              <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-800/40">
                Hızlı
              </span>
            </div>
            <strong className="text-xs font-black uppercase tracking-wider text-zinc-100 block">
              Hızlı Kayıt
            </strong>
            <span className="text-[9px] font-mono text-zinc-400 block mt-0.5 truncate">
              Set, Kilo & Besin
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenWeeklyPlan ? onOpenWeeklyPlan() : onOpenTraining?.()}
            className="group relative overflow-hidden rounded-2xl border border-indigo-800/50 bg-gradient-to-br from-indigo-950/60 via-zinc-900/90 to-zinc-950 p-3 text-left active:scale-[0.97] transition-all shadow-lg shadow-indigo-950/20 hover:border-indigo-600/70"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <Calendar size={16} className="text-indigo-300" />
              </div>
              <span className="text-[8px] font-mono uppercase tracking-wider text-indigo-400 font-bold bg-indigo-950/60 px-1.5 py-0.5 rounded-md border border-indigo-800/40">
                Haftalık
              </span>
            </div>
            <strong className="text-xs font-black uppercase tracking-wider text-zinc-100 block">
              Program Planı
            </strong>
            <span className="text-[9px] font-mono text-zinc-400 block mt-0.5 truncate">
              Düzen & Günler
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenTools?.()}
            className="group relative overflow-hidden rounded-2xl border border-violet-800/50 bg-gradient-to-br from-violet-950/60 via-zinc-900/90 to-zinc-950 p-3 text-left active:scale-[0.97] transition-all shadow-lg shadow-violet-950/20 hover:border-violet-600/70"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                <Wrench size={16} className="text-violet-300" />
              </div>
              <span className="text-[8px] font-mono uppercase tracking-wider text-violet-400 font-bold bg-violet-950/60 px-1.5 py-0.5 rounded-md border border-violet-800/40">
                Merkez
              </span>
            </div>
            <strong className="text-xs font-black uppercase tracking-wider text-zinc-100 block">
              Araçlar
            </strong>
            <span className="text-[9px] font-mono text-zinc-400 block mt-0.5 truncate">
              Plaka & 1RM
            </span>
          </button>
        </div>
      </div>

      {/* Günlük Hızlı Hidrasyon Paneli */}
      {waterSummary && waterTarget && (
        <div className="luxury-feature-card bg-gradient-to-br from-sky-950/30 via-zinc-900/95 to-zinc-950 rounded-2xl border border-sky-900/40 p-3.5 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
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
                className="px-2.5 py-1 rounded-lg border border-sky-800/60 bg-sky-950/50 text-sky-200 text-[9px] font-mono font-bold active:scale-[0.95] transition-all hover:bg-sky-900/60 shadow-sm"
                title="+250 ml su ekle"
              >
                +250ml
              </button>
              <button
                type="button"
                onClick={() => onAddWater?.(500)}
                className="px-2.5 py-1 rounded-lg border border-sky-800/60 bg-sky-950/50 text-sky-200 text-[9px] font-mono font-bold active:scale-[0.95] transition-all hover:bg-sky-900/60 shadow-sm"
                title="+500 ml su ekle"
              >
                +500ml
              </button>
              {onOpenNutrition && (
                <button
                  type="button"
                  onClick={onOpenNutrition}
                  className="p-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 active:scale-[0.95] transition-colors"
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
