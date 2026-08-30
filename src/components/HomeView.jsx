import React, { lazy, memo, Suspense } from 'react';
import { AlertCircle, Dumbbell, Plus, Wrench, Zap } from 'lucide-react';
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
  onToggleTemplateFavorite,
}) => {
  return (
    <div data-view-scroll="home" className="luxury-screen p-4 space-y-5 pb-nav h-full overflow-y-auto hide-scrollbar bg-black">

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

      {interfaceMode === 'simple' ? (
        <div className="grid grid-cols-3 gap-2.5" aria-label="Hızlı işlemler">
          <button
            type="button"
            onClick={() => onOpenTraining?.()}
            className="min-h-21 rounded-2xl border border-cyan-900/60 bg-gradient-to-b from-cyan-950/45 to-zinc-950 text-cyan-100 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-2 shadow-md shadow-black/20"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-800/40 flex items-center justify-center">
              <Dumbbell size={16} className="text-cyan-400" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-200">Antrenman</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickCapture?.()}
            className="min-h-21 rounded-2xl border border-emerald-900/50 bg-gradient-to-b from-emerald-950/35 to-zinc-950 text-zinc-100 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-2 shadow-md shadow-black/20"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center">
              <Plus size={16} className="text-emerald-400" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-200">Hızlı Kayıt</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenTools?.()}
            className="min-h-21 rounded-2xl border border-violet-900/50 bg-gradient-to-b from-violet-950/35 to-zinc-950 text-zinc-100 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-2 shadow-md shadow-black/20"
          >
            <div className="w-8 h-8 rounded-xl bg-violet-950/80 border border-violet-800/40 flex items-center justify-center">
              <Wrench size={16} className="text-violet-400" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-200">Araçlar</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {(todayCoach?.workoutTemplate || todayCoach?.cardioLabel) && (
            <button onClick={() => handleStartRequest()} className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-4 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-sm shadow-lg shadow-cyan-900/20 transition-all">
              <Zap size={18} className="mr-2" /> Serbest Antrenman
            </button>
          )}
          <button
            onClick={() => onOpenTools?.()}
            className="w-full bg-zinc-900 active:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold py-3.5 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-xs transition-colors"
          >
            <Wrench size={16} className="mr-2 text-cyan-400" /> Araçlar
            <span className="ml-2 text-[10px] font-mono text-zinc-500 normal-case tracking-normal">
              kütüphane · program · kardiyo
            </span>
          </button>
        </div>
      )}

      {/* Yedekleme hatırlatması artık ekranın EN ÜSTÜNDE değil ve alarm tonunda
          değil. Eskiden uygulamayı açan ilk gördüğü şey turuncu bir veri kaybı
          uyarısıydı; oysa bu acil bir hata değil, yapılacak bir iş. Uyarı
          yalnızca korunmaya değer bir geçmiş varken çıkıyor (App tarafında
          üç antrenman eşiği). */}
      {needsBackup && (
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-2xl flex items-center gap-2.5 text-left active:bg-zinc-800"
        >
          <AlertCircle className="text-amber-500 shrink-0" size={14} />
          <span className="text-[10px] font-mono text-zinc-400 flex-1 leading-relaxed">
            Bir haftadır yedek almadın. Veriler yalnızca bu cihazda.
          </span>
          <span className="text-[9px] font-bold text-amber-400 uppercase shrink-0">Yedekle</span>
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

      {/* Şablon kütüphanesi sayfanın altındadır; kullanıcı yaklaşmadan yüzlerce
          hareket katkısı ve süre hesabını çalıştırmak ilk açılışı yavaşlatır. */}
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
