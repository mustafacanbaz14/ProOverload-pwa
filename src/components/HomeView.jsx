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

      {/* Hızlı işlemler.
          Dört kart daha önce dört ayrı vurgu rengi taşıyordu (cyan, emerald,
          indigo, violet); her birinde gradyan, renkli ikon kutusu, renkli
          glow ve bir rozet vardı. Renk kategoriyi anlatmaya çalışıyordu ama
          kategoriyi başlık zaten söylüyor — sonuç, hiçbirinin öne çıkmadığı
          bir renk kalabalığıydı.

          Artık tek yüzey var ve vurgu yalnızca BİRİNCİL eylemde: antrenman
          başlatmak. Renk burada süs değil, "önce buraya bak" demenin yolu.
          Rozetler kaldırıldı; "Merkez" ya da "Hızlı" yazmak başlığın yanında
          bilgi eklemiyordu. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" aria-label="Hızlı işlemler">
        {[
          {
            key: 'train',
            icon: Zap,
            title: 'Antrenman',
            alt: todayCoach?.workoutTemplate ? todayCoach.workoutTemplate.name : 'Seansı başlat',
            birincil: true,
            onClick: () => (handleStartRequest ? handleStartRequest() : onOpenTraining?.()),
          },
          {
            key: 'quick',
            icon: Plus,
            title: 'Hızlı Kayıt',
            alt: 'Set, kilo, besin',
            onClick: () => onQuickCapture?.(),
          },
          {
            key: 'plan',
            icon: Calendar,
            title: 'Program Planı',
            alt: 'Düzen ve günler',
            onClick: () => (onOpenWeeklyPlan ? onOpenWeeklyPlan() : onOpenTraining?.()),
          },
          {
            key: 'tools',
            icon: Wrench,
            title: 'Araçlar',
            alt: 'Plaka ve 1RM',
            onClick: () => onOpenTools?.(),
          },
        ].map(kart => {
          const Icon = kart.icon;
          return (
            <button
              key={kart.key}
              type="button"
              onClick={kart.onClick}
              className={`rounded-2xl border p-3 text-left active:scale-[0.97] transition-transform ${
                kart.birincil
                  ? 'border-zinc-700 bg-zinc-900'
                  : 'border-zinc-800/80 bg-zinc-950/60'
              }`}
            >
              <Icon size={17} className={kart.birincil ? 'text-cyan-400' : 'text-zinc-400'} />
              <strong className="text-[12px] font-bold text-zinc-100 block mt-2.5">
                {kart.title}
              </strong>
              <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                {kart.alt}
              </span>
            </button>
          );
        })}
      </div>

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
                className="px-3 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 text-[10px] font-bold active:scale-[0.95] transition-transform"
                title="+250 ml su ekle"
              >
                +250ml
              </button>
              <button
                type="button"
                onClick={() => onAddWater?.(500)}
                className="px-3 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 text-[10px] font-bold active:scale-[0.95] transition-transform"
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
