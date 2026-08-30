import React, { lazy, Suspense, startTransition, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useTransition } from 'react';
import {
  Plus, Save, Activity, X, Search, Trash2, AlertCircle, Settings, BrainCircuit, Star, Database, WifiOff
} from 'lucide-react';
import {
  startLockScreenActivity, updateLockScreenActivity, stopLockScreenActivity,
  requestWakeLock, playRestAlert, vibrateAlert,
  showRestNotification, requestNotificationPermission, notificationPermission,
  primeRestAlert, scheduleRestAlert, cancelScheduledRestAlert, restAlertDiagnostics,
  restAlertMissed, startAlertKeepAlive, stopAlertKeepAlive,
  scheduleRestNotification, cancelScheduledRestNotification
} from './lockScreen';

import {
  DEFAULT_EXERCISES, MUSCLE_GROUPS, BODY_METRICS, getVolumeLandmarks,
  setVolumeTargetOverrides, ACWR_MIN_DAYS, APP_VERSION,
} from './utils/constants';
import { migrateCustomExercises } from './utils/migrations';
import { painCoachItem, buildPainReport } from './utils/painLog';
import { buildStrengthBalance, strengthBalanceCoachItem } from './utils/strengthBalance';
import { buildConsistency, buildAdherence, consistencyCoachItem } from './utils/consistency';
import { buildPlanExecution, planExecutionCoachItem } from './utils/planExecution';
import { auditWorkoutData, removeEmptyWorkouts, dataHealthCoachItem } from './utils/dataHealth';
import { loadStepFor, repRangeFor, setRepRangeOverride } from './utils/exerciseTargets';
import { applyCoachMemory, snoozeCoachItem, dismissCoachItem, restoreCoachItem } from './utils/coachMemory';
import {
  snapshotDecision, logDecision, logRejection, dueEntries, settleDue, ledgerStats, ledgerCoachItem,
} from './utils/coachLedger';
import { applyCoachFocus, findFocus } from './utils/coachFocus';
import { countWeeklySets } from './utils/setCounting';
import { buildProximityReport, proximityCoachItem } from './utils/proximity';
import { buildTrainingAge, trainingAgeCoachItem } from './utils/trainingAge';
import { compareEffectiveSets } from './utils/effectiveSets';
import { sessionCeilingAudit, findPhilosophy as findVolumePhilosophy } from './utils/doseResponse';
import { buildPerformanceDrivers, driverCoachItem } from './utils/performanceDrivers';
import { buildResponseProfile, responseProfileCoachItem } from './utils/responseProfile';
import { buildExerciseRoi, roiCoachItem } from './utils/exerciseRoi';
import { buildMuscleScorecard, scorecardCoachItem } from './utils/muscleScorecard';
import { buildAnalysisReadiness, readinessCoachItem } from './utils/analysisReadiness';
import { buildBlockCompare, blockCoachItem } from './utils/blockCompare';
import { buildAnomalyWatch, anomalyCoachItem } from './utils/anomalyWatch';
import { buildWeekProjection, projectionCoachItem } from './utils/weekProjection';
import { buildPrWatch, prWatchCoachItem } from './utils/prWatch';
import { buildRirCalibration, rirCoachItem } from './utils/rirCalibration';
import { auditSessionQuality, sessionQualityCoachItem } from './utils/sessionQuality';
import { buildCardioReport, cardioSuggestionForToday, cardioCoachItem } from './utils/cardioGoals';
import { buildRestingHrReport, upsertRestingHr, restingHrCoachItem } from './utils/restingHrLog';
import { buildCardioRecords } from './utils/cardioRecords';
import { activePainRegions, scanSessionForPain, painGuardCoachItem, painWarningFor, exercisesLoadingPain } from './utils/painGuard';
import { progressionFor, setProgressionRule, buildNextSessionTargets, PROGRESSION_RULES } from './utils/progression';
import { applyProgressionPrescription } from './utils/progressionBlock';
import { scanPlateaus, plateauCoachItem } from './utils/plateau';
import { repRecordsFor, isRepRecord } from './utils/repRecords';
import { buildRestReport, restCoachItem } from './utils/restQuality';
import { buildTimeOfDayReport, timeOfDayCoachItem } from './utils/timeOfDay';
import { buildTechniqueReport, techniqueCoachItem } from './utils/setTechniques';
import { auditExerciseOrder, orderCoachItem } from './utils/exerciseOrder';
import { buildWeeklyVolumeHistory } from './utils/volumeTargets';
import { buildOptimalVolumeProfile, optimalVolumeCoachItem } from './utils/optimalVolume';
import { buildWarmupLadder, applyWarmupLadder, removeWarmupSets } from './utils/warmupSets';
import { setExerciseNote, notesFor } from './utils/exerciseNotes';
import { scanSideBalance, sideBalanceCoachItem } from './utils/unilateral';
import { buildSessionVolume } from './utils/sessionVolume';
import { dailyWaterTarget, addWater, waterSummary, waterCoachItem } from './utils/hydration';
import { buildRecordTimeline } from './utils/recordTimeline';
import { pickGhost, buildGhostRace, ghostTargetFor } from './utils/ghostSession';
import { planTimeCrunch, describeTimeCrunch } from './utils/timeCrunch';
import { buildWeakLinks, weakLinkCoachItem } from './utils/weakLink';
import { buildFormCurve, formCoachItem } from './utils/formCurve';
import { buildAdaptations, applyAdaptation } from './utils/autoAdapt';
import { buildYearReview } from './utils/yearReview';
import { discoverExercises } from './utils/exerciseDiscovery';
import { restProfileByMuscle, adaptiveRestCoachItem } from './utils/adaptiveRest';
import { applyTrainingGoal, findTrainingGoal } from './utils/trainingGoal';
import { pushVersion, restoreVersion, describeVersionDiff } from './utils/templateVersions';
import { buildFrequencyPlan, frequencyPlanCoachItem } from './utils/frequencyPlanner';
import { buildSessionPace, compareSessions, findComparableSessions } from './utils/sessionPace';
import { templateFromEntry, addCardioTemplate, removeCardioTemplate, markCardioTemplateUsed, applyCardioTemplate } from './utils/cardioTemplates';
import { bodyweightBasisFor, describeSetLoad } from './utils/bodyweight';
import { buildStrengthStandards, strengthStandardCoachItem } from './utils/strengthStandards';
import { buildEffortDistribution, effortCoachItem } from './utils/effortDistribution';
import { buildRotationReport, rotationCoachItem } from './utils/exerciseRotation';
import { buildBodyRatios, bodyRatioCoachItem } from './utils/bodyRatios';
import { buildDeloadReturn, deloadReturnCoachItem } from './utils/deloadReturn';
import { buildPeriNutrition, periNutritionCoachItem } from './utils/periNutrition';
import { buildWarmupRoutine } from './utils/warmupRoutine';
import { computeAdaptiveTDEE } from './utils/tdee';
import { totalCardioCalories } from './utils/cardio';
import { computeWeekPlan, findPlan } from './utils/weekPlan';
import { removeTemplateFromPlans } from './utils/planMigration';
import { buildPersonalVolumeGuidance } from './utils/personalization';
import { buildCoachActions } from './utils/coach';
import { buildCoachBriefing, buildCoachCalibration } from './utils/coachDashboard';
import { activateCoachProtocol, archiveCoachProtocol, isCoachProtocolActive } from './utils/coachProtocol';
import { effectiveLoad } from './utils/bodyweight';
import { auditBodyweightEntries, normalizeBodyweightEntries } from './utils/bodyweightAudit';
import { deloadState, shouldSuggestDeload, emptyDeload } from './utils/deload';
import { mesocycleState, weeklyTargets, targetInstructions, mesocycleCoachItem, emptyMesocycle } from './utils/mesocycle';
import { auditExerciseSelection, selectionCoachItem } from './utils/selectionAudit';
import { buildSessionReport, snapshotTemplatePlan } from './utils/sessionReport';
import { bestTemplateRecommendation } from './utils/templateRecommendation';
import { buildExerciseProfile } from './utils/exerciseProfile';
import { buildPlateauInsights } from './utils/insights';
import { buildFrequencyReport, frequencyCoachItem } from './utils/frequency';
import { findStarterProgram, instantiateStarterProgram } from './utils/starterPrograms';
import { analyzeDayConflicts } from './utils/interference';
import { dayEnergyBreakdown, neatOptsForDay, buildEnergySeries, groupByWeek } from './utils/energyModel';
import { recommendedCalories, trendRate, GOAL_FIELDS } from './utils/goals';
import { caloriesFromMacros, dailyTotals } from './utils/nutritionStats';
import { DEFAULT_READINESS, READINESS_FIELDS, computeReadiness, readinessTrend } from './utils/readiness';
import { buildSessionAdaptation } from './utils/sessionAdaptation';
import { getBrowserDataRepository } from './utils/dataRepository';
import { removeById, restoreAtIndex, removeCardioEntry, restoreCardioEntry } from './utils/undo';
import { backupValue, inspectBackupPayload, mergeImportedRecords, backupImportSummary } from './utils/backupImport';
import { useAppPersistence } from './hooks/useAppPersistence';
import { useDisplayPreferences } from './hooks/useDisplayPreferences';
import { useDeferredPwaUpdate } from './hooks/useDeferredPwaUpdate';
import { useAppDataState } from './hooks/useAppDataState';
import { useHistoricalEnergy } from './hooks/useHistoricalEnergy';
import { useProgressionBlocks } from './hooks/useProgressionBlocks';
import { createBackupPayload, migrateBackupPayload } from './utils/dataSchema';
import { buildBodyContextSnapshot } from './utils/historicalContext';
// Sürüm tek kaynaktan okunur: package.json. Ekranda gösterilen sürüm ile
// yedek dosyasına yazılan sürümün birbirinden sapması böyle engellenir.
import pkg from '../package.json';
import { templateToExercises, workoutToTemplate, suggestTemplateName } from './utils/templates';
import {
  duplicateTemplate, markTemplateUsed, toggleTemplateFavorite,
} from './utils/templateLibrary';
import { draftFromGeneratedProgram, draftFromStarterProgram, instantiateDraftProgram, draftSupersetIds } from './utils/programDraft';
import { findMergeCandidates, previewExerciseMerge, applyExerciseMerge } from './utils/exerciseMerge';

import {
  generateId, getLocalDateString, getMondayOfCurrentWeek, detectMuscleGroup,
  foldForSearch, parseNumber, mergeMetrics, mergeNutrition,
  isWorkingSet, isCompletedWorkingSet, calcEffectiveSets, buildPersonalRecords, loadPersistedState, exerciseSetupNote,
  computeComposition, sortByDateDesc, suggestNextTarget, mergeSettings,
  mergeWorkout, mergeTemplate, isWarmupSet, estimate1RM, findMetricsForDate,
  resetDayNeatOverride,
} from './utils/helpers';

import Navbar from './components/Navbar';
import { formatDay, formatDayRelative } from './utils/dates';
import { emptyWellnessDay, mergeWellnessDay, computeSleepScore } from './utils/wellness';
import { buildCycleSummary, emptyCycleDay, mergeCycleDay } from './utils/cycle';

// Ana ekran için gerekli olmayan büyük pencereler ilk açılışta çalıştırılmaz.
// Kullanıcı ilgili aracı açtığında ayrı parça indirilir ve değerlendirilir.
const loadActiveWorkoutView = () => import('./components/ActiveWorkoutView');
const loadHomeView = () => import('./components/HomeView');
const loadTrainingView = () => import('./components/TrainingView');
const loadNutritionView = () => import('./components/NutritionView');
const loadProgressHubView = () => import('./components/ProgressHubView');
const loadHistoryView = () => import('./components/HistoryView');
const loadCardioView = () => import('./components/CardioView');
const VIEW_LOADERS = Object.freeze({
  home: loadHomeView,
  training: loadTrainingView,
  nutrition: loadNutritionView,
  progress: loadProgressHubView,
  history: loadHistoryView,
});

// Dinamik import aynı modülü tekrar indirmez. Niyet sinyali yalnız indirme ve
// değerlendirmeyi tıklamadan biraz önce başlatır.
const preloadView = (viewKey) => {
  const loader = VIEW_LOADERS[viewKey];
  if (loader) void loader().catch(() => {});
};

const scrollStorageKey = (viewKey) => `po_view_scroll_${viewKey}`;
const rememberScrollPosition = (viewKey, value) => {
  try { sessionStorage.setItem(scrollStorageKey(viewKey), String(Math.max(0, value || 0))); }
  catch { /* Gizli mod veya kapalı depolamada bellek içi yedek yeterli. */ }
};
const storedScrollPosition = (viewKey, fallback = 0) => {
  try {
    const stored = Number(sessionStorage.getItem(scrollStorageKey(viewKey)));
    return Number.isFinite(stored) ? Math.max(0, stored) : fallback;
  } catch {
    return fallback;
  }
};

const DeloadModal = lazy(() => import('./components/DeloadModal'));
const HomeView = lazy(loadHomeView);
const ActiveWorkoutView = lazy(loadActiveWorkoutView);
const MesocycleModal = lazy(() => import('./components/MesocycleModal'));
const PainLogModal = lazy(() => import('./components/PainLogModal'));
const DataHealthModal = lazy(() => import('./components/DataHealthModal'));
const ExerciseMergeModal = lazy(() => import('./components/ExerciseMergeModal'));
const VolumeTargetsModal = lazy(() => import('./components/VolumeTargetsModal'));
const ExerciseCompareModal = lazy(() => import('./components/ExerciseCompareModal'));
const AutoAdaptModal = lazy(() => import('./components/AutoAdaptModal'));
const YearReviewModal = lazy(() => import('./components/YearReviewModal'));
const CoachLedgerModal = lazy(() => import('./components/CoachLedgerModal'));
const BlockCompareModal = lazy(() => import('./components/BlockCompareModal'));
const ScenarioModal = lazy(() => import('./components/ScenarioModal'));
const EvidenceModal = lazy(() => import('./components/EvidenceModal'));
const ProgramWizardModal = lazy(() => import('./components/ProgramWizardModal'));
const CardioView = lazy(loadCardioView);
const TrainingView = lazy(loadTrainingView);
const NutritionView = lazy(loadNutritionView);
const ProgressHubView = lazy(loadProgressHubView);
const HistoryView = lazy(loadHistoryView);
const QuickCaptureModal = lazy(() => import('./components/QuickCaptureModal'));
const StarterProgramModal = lazy(() => import('./components/StarterProgramModal'));

// Kaçan dinlenme uyarısı en fazla bu kadar gecikmeyle telafi edilir. Ötesinde
// ses çalmak, kullanıcının çoktan geçtiği bir ana ait uyarıyı bağırmak olur.
const LATE_ALERT_LIMIT_MS = 90 * 1000;
const SubstituteModal = lazy(() => import('./components/SubstituteModal'));
const SessionReportModal = lazy(() => import('./components/SessionReportModal'));
const WeeklyReviewModal = lazy(() => import('./components/WeeklyReviewModal'));
const CoachCenterModal = lazy(() => import('./components/CoachCenterModal'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const QRCodeModal = lazy(() => import('./components/QRCodeModal'));
const FoodSearchModal = lazy(() => import('./components/FoodSearchModal'));
const MetricsComparisonModal = lazy(() => import('./components/MetricsComparisonModal'));
const ReportCardModal = lazy(() => import('./components/ReportCardModal'));
const MuscleDetailModal = lazy(() => import('./components/MuscleDetailModal'));
const PlateCalculatorModal = lazy(() => import('./components/PlateCalculatorModal'));
const TemplatePreviewModal = lazy(() => import('./components/TemplatePreviewModal'));
const ExerciseEditorModal = lazy(() => import('./components/ExerciseEditorModal'));
const ExerciseLibraryModal = lazy(() => import('./components/ExerciseLibraryModal'));
const ExerciseProfileModal = lazy(() => import('./components/ExerciseProfileModal'));
const TemplateBuilderModal = lazy(() => import('./components/TemplateBuilderModal'));
const CardioModal = lazy(() => import('./components/CardioModal'));
const EnergyDetailModal = lazy(() => import('./components/EnergyDetailModal'));
const ToolsModal = lazy(() => import('./components/ToolsModal'));
const WellnessModal = lazy(() => import('./components/WellnessModal'));
const PRCelebration = lazy(() => import('./components/PRCelebration'));
const WeeklyPlanModal = lazy(() => import('./components/WeeklyPlanModal'));
const GlobalSearchModal = lazy(() => import('./components/GlobalSearchModal'));
const OnboardingModal = lazy(() => import('./components/OnboardingModal'));
const ReleaseNotesModal = lazy(() => import('./components/ReleaseNotesModal'));
const BackupImportPreviewModal = lazy(() => import('./components/BackupImportPreviewModal'));
const StoreReadinessModal = lazy(() => import('./components/StoreReadinessModal'));

const ModalLoadingFallback = () => (
  <div className="fixed inset-0 z-[119] bg-black/70 backdrop-blur-sm flex items-center justify-center" role="status" aria-label="Ekran yükleniyor">
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 text-center shadow-2xl">
      <span className="w-7 h-7 rounded-full border-2 border-zinc-700 border-t-cyan-400 animate-spin block mx-auto" />
      <span className="text-[10px] font-mono text-zinc-400 block mt-2">Ekran hazırlanıyor…</span>
    </div>
  </div>
);

const VIEW_LABELS = Object.freeze({
  home: 'Bugün',
  training: 'Antrenman',
  nutrition: 'Beslenme',
  progress: 'Gelişim',
  history: 'Geçmiş',
});

const ViewLoadingFallback = ({ viewKey }) => (
  <div className="luxury-screen h-full bg-black p-4" role="status" aria-label={`${VIEW_LABELS[viewKey] || 'Sayfa'} yükleniyor`}>
    <div className="animate-pulse space-y-4">
      <div className="h-3 w-24 rounded-full bg-zinc-900" />
      <div className="h-7 w-52 rounded-xl bg-zinc-900" />
      <div className="h-28 rounded-3xl border border-zinc-900 bg-zinc-950" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-zinc-950" />
        <div className="h-24 rounded-2xl bg-zinc-950" />
      </div>
      <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-700">
        {VIEW_LABELS[viewKey] || 'Sayfa'} hazırlanıyor
      </p>
    </div>
  </div>
);

export default function App() {
  const [dataRepository] = useState(getBrowserDataRepository);
  const [initial] = useState(() => loadPersistedState(dataRepository));
  const appData = useAppDataState(initial);
  const {
    workouts, setWorkouts,
    templates, setTemplates,
    activeWorkout, setActiveWorkout,
    customExercises, setCustomExercises,
  } = appData.training;
  const {
    customFoods, setCustomFoods,
    recentFoods, setRecentFoods,
    mealTemplates, setMealTemplates,
    dayTemplates, setDayTemplates,
    nutritionHistory, setNutritionHistory,
    currentNutritionForm, setCurrentNutritionForm,
  } = appData.nutrition;
  const {
    metricsHistory, setMetricsHistory,
    currentMetricsForm, setCurrentMetricsForm,
  } = appData.body;
  const { wellness, setWellness, cycleHistory, setCycleHistory } = appData.recovery;
  const { settings, setSettings } = appData.preferences;
  const { lastBackupDate, setLastBackupDate } = appData.meta;

  const [preWorkoutModal, setPreWorkoutModal] = useState(null);
  const [isEndWorkoutModalOpen, setIsEndWorkoutModalOpen] = useState(false);
  const [readinessForm, setReadinessForm] = useState(DEFAULT_READINESS);

  const [view, setView] = useState(() => {
    if (typeof window === 'undefined') return 'home';
    const requested = new URLSearchParams(window.location.search).get('view');
    return ['home', 'training', 'nutrition', 'progress', 'history'].includes(requested) ? requested : 'home';
  });
  const [isViewPending, beginViewTransition] = useTransition();
  const viewScrollPositionsRef = useRef(new Map());
  const [historyTab, setHistoryTab] = useState('workouts');
  const [analysisType, setAnalysisType] = useState('body');
  const [progressTab, setProgressTab] = useState('body');
  // Antrenman sekmesi iki bölüme ayrıldı: ağırlık ve kardiyo. Kardiyonun
  // kendi ekranı olmaması, uygulamanın ona bir ek özellik gibi davrandığı
  // anlamına geliyordu.
  const [trainingTab, setTrainingTab] = useState('lift');
  const handleTrainingTabChange = useCallback((next) => {
    if (next === 'cardio') void loadCardioView().catch(() => {});
    startTransition(() => setTrainingTab(next));
  }, []);

  // Ana ekrandan en sık yapılan iki işlem antrenman merkezini açmak ve seans
  // başlatmaktır. İlk boya tamamlandıktan sonra, bağlantı veri tasarrufunda
  // değilse bu iki küçük parçayı boş zamanda hazırla. Kritik açılış yolunu
  // büyütmez; ilk dokunuştaki beklemeyi azaltır.
  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return undefined;

    const warmUp = () => {
      void Promise.allSettled([loadTrainingView(), loadActiveWorkoutView()]);
    };

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warmUp, { timeout: 4500 });
      return () => window.cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(warmUp, 2600);
    return () => window.clearTimeout(id);
  }, []);

  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isFoodSearchOpen, setIsFoodSearchOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [detailMuscle, setDetailMuscle] = useState(null);
  const [plateCalc, setPlateCalc] = useState(null); // { weight } | null
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [editorExercise, setEditorExercise] = useState(null); // hareket adı
  const [profileExercise, setProfileExercise] = useState(null); // hareket adı
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [builderDraft, setBuilderDraft] = useState(null);
  const [builderWizardMode, setBuilderWizardMode] = useState(false);
  const [isCardioOpen, setIsCardioOpen] = useState(false);
  const [cardioContext, setCardioContext] = useState(null);
  const [isEnergyDetailOpen, setIsEnergyDetailOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [prCelebration, setPrCelebration] = useState(null);
  const [isWeekPlanOpen, setIsWeekPlanOpen] = useState(false);
  const [isWellnessOpen, setIsWellnessOpen] = useState(false);
  const [isDeloadOpen, setIsDeloadOpen] = useState(false);
  const [isStarterOpen, setIsStarterOpen] = useState(false);
  const [isMesocycleOpen, setIsMesocycleOpen] = useState(false);
  const [isPainOpen, setIsPainOpen] = useState(false);
  const [isDataHealthOpen, setIsDataHealthOpen] = useState(false);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [isVolumeTargetsOpen, setIsVolumeTargetsOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isAutoAdaptOpen, setIsAutoAdaptOpen] = useState(false);
  const [isYearReviewOpen, setIsYearReviewOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isBlockCompareOpen, setIsBlockCompareOpen] = useState(false);
  const [isScenarioOpen, setIsScenarioOpen] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
  const [isCoachCenterOpen, setIsCoachCenterOpen] = useState(false);
  // Seans bitince gösterilen rapor; kapatılana kadar duruyor.
  const [sessionReport, setSessionReport] = useState(null);
  // Yerine hareket aranan giriş: { name, exerciseId }
  const [substituteFor, setSubstituteFor] = useState(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() =>
    !initial.settings.onboardingComplete
    && initial.workouts.length === 0
    && initial.metricsHistory.length === 0
    && initial.nutritionHistory.length === 0);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);
  const [isStoreReadinessOpen, setIsStoreReadinessOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);

  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem('po_last_seen_version');
      if (lastSeen !== APP_VERSION) {
        // Boş profilde onboarding ve sürüm notları üst üste açılmamalı. Yeni
        // kullanıcı zaten güncel sürümle başlıyor; değişiklik özeti ona gerekli değil.
        if (!isOnboardingOpen) setIsReleaseNotesOpen(true);
        localStorage.setItem('po_last_seen_version', APP_VERSION);
      }
    } catch {
      // localStorage erişim engellerine karşı koruma
    }
  }, [isOnboardingOpen]);
  // Araçlar listesinde uyku ve meditasyon ayrı giriş; hangisinden gelindiyse
  // Toparlanma ekranı o sekmede açılır.
  const [wellnessTab, setWellnessTab] = useState('sleep');
  // Kütüphaneden "yeni hareket" ile gelindiğinde kapanışta oraya dönülür.
  const [pickerReturnsToLibrary, setPickerReturnsToLibrary] = useState(false);

  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newCustomExercise, setNewCustomExercise] = useState('');
  const [newExContribs, setNewExContribs] = useState({});
  const [newExMechanics, setNewExMechanics] = useState('Push');

  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null });
  const [rest, setRest] = useState(null);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [sessionRestMuted, setSessionRestMuted] = useState(false);
  const [restAlertFlash, setRestAlertFlash] = useState(false);

  const [analysisExercise, setAnalysisExercise] = useState('');
  const [bodyMetricKey, setBodyMetricKey] = useState('weight');

  const [isMeasurementGuideOpen, setIsMeasurementGuideOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);
  const [lockScreenOn, setLockScreenOn] = useState(false);

  const [todayTime] = useState(() => Date.now());

  const quickCaptureStatus = useMemo(() => {
    const date = getLocalDateString();
    const todayWorkouts = workouts.filter(record => record.date === date);
    const todayWellness = wellness.find(record => record.date === date);
    const sleep = todayWellness?.sleep || {};
    return {
      workout: Boolean(activeWorkout?.date === date || todayWorkouts.some(record => (record.exercises || []).length > 0)),
      cardio: todayWorkouts.some(record => (record.cardio || []).length > 0),
      nutrition: nutritionHistory.some(record => record.date === date),
      metrics: metricsHistory.some(record => record.date === date),
      sleep: Boolean(sleep.bedTime || sleep.wakeTime || parseNumber(sleep.quickScore) > 0),
      mind: Boolean(todayWellness?.mind?.length),
    };
  }, [activeWorkout, workouts, nutritionHistory, metricsHistory, wellness]);

  const activeWorkoutRef = useRef(activeWorkout);
  const restRef = useRef(rest);
  const repsOnFocusRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => { activeWorkoutRef.current = activeWorkout; }, [activeWorkout]);
  useEffect(() => { restRef.current = rest; }, [rest]);

  // Hata tostu daha uzun durur: veri kaybı uyarısını kaçırmak kritik.
  const showToast = useCallback((message, type = 'info', options = {}) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    const id = `${Date.now()}-${Math.random()}`;
    const action = options?.action || null;
    setToast({ id, message, type, action });
    const duration = options?.duration || (action ? 7000 : type === 'error' ? 6000 : 3000);
    toastTimerRef.current = setTimeout(() => {
      setToast(current => current?.id === id ? null : current);
      toastTimerRef.current = null;
    }, duration);
  }, []);

  const handleActivateCoachProtocol = useCallback((proposal) => {
    if (!proposal?.canApply) {
      showToast('Bu protokol için veri güveni yeterli değil.', 'error');
      return;
    }
    const activated = activateCoachProtocol(proposal);
    setSettings(prev => ({
      ...prev,
      coachProtocol: activated,
      coachHistory: archiveCoachProtocol(prev.coachHistory, activated),
    }));
    showToast(`${activated.label} bu hafta için aktive edildi.`);
  }, [setSettings, showToast]);

  const handleDeactivateCoachProtocol = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      coachProtocol: prev.coachProtocol ? { ...prev.coachProtocol, active: false } : null,
    }));
    showToast('Haftalık koç protokolü kapatıldı.');
  }, [setSettings, showToast]);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  useEffect(() => {
    const offline = () => {
      setIsOnline(false);
      showToast('Çevrimdışısın. Kayıtların cihazda tutulmaya devam ediyor.', 'warning', { duration: 5000 });
    };
    const online = () => {
      setIsOnline(true);
      showToast('Bağlantı geri geldi. Uygulama çevrimiçi.');
    };
    window.addEventListener('offline', offline);
    window.addEventListener('online', online);
    return () => {
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', online);
    };
  }, [showToast]);

  // Kişisel hacim hedefleri, hacim referanslarını okuyan tek noktaya yazılıyor.
  //
  // Bu useMemo bilinçli olarak dosyadaki DİĞER hacim memo'larından önce
  // duruyor: hook'lar sırayla çalıştığı için sonraki memo'lar güncel kaydı
  // görüyor. Kaydı okuyan memo'ların bağımlılık dizilerine `volumeTargets`
  // ayrıca eklendi; yoksa hedef değişince tablo eski değerde kalırdı ve
  // kullanıcı "değiştirdim ama bir şey olmadı" derdi.
  useMemo(() => {
    setVolumeTargetOverrides(settings.volumeTargets);
    return settings.volumeTargets;
  }, [settings.volumeTargets]);

  const showUndoToast = useCallback((message, onUndo, duration = 7000) => {
    showToast(message, 'info', {
      duration,
      action: {
        label: 'Geri Al',
        onClick: () => {
          onUndo?.();
          showToast('İşlem geri alındı.');
        },
      },
    });
  }, [showToast]);

  useAppPersistence({
    workouts, templates, customExercises, customFoods, recentFoods,
    mealTemplates, dayTemplates,
    activeWorkout, metricsHistory, nutritionHistory, wellness, cycleHistory, settings,
  }, showToast);
  useDisplayPreferences(settings);
  useDeferredPwaUpdate(activeWorkout, showToast);

  // Süresi biten protokol ayarlardan silinmez; karar hafızası korunur fakat
  // seans ve beslenme hesabına yalnızca geçerli tarih aralığındaysa girer.
  const activeCoachProtocol = useMemo(
    () => isCoachProtocolActive(settings.coachProtocol) ? settings.coachProtocol : null,
    [settings.coachProtocol]);

  // Dinlenme sayacı
  useEffect(() => {
    if (!rest) return;
    if (rest.paused) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((rest.endsAt - Date.now()) / 1000));
      setRestSecondsLeft(remaining);
      if (remaining === 0) {
        setRest(null);
        stopAlertKeepAlive();
        // Ses iki yoldan gelebiliyor: sayaç başında donanım saatine yazılan
        // zamanlanmış notalar, ya da buradaki anlık çağrı.
        //
        // 7.1'e kadar ölçüt "zamanlama başarılı mıydı" idi ve bu yanlıştı:
        // zamanlamadan SONRA ses motoru askıya alınırsa (ekran kapanması,
        // arka plan, iOS kesintisi) notalar hiç çalmıyor ama bayrak hâlâ
        // "planlandı" diyor, yedek de atlanıyordu. Sonuç sessizlik.
        //
        // Artık ölçüt "gerçekten çaldı mı": zamanlanmış uyarı kaçtıysa yedek
        // devreye giriyor.
        //
        // Telafi bir PENCEREYLE sınırlı: sayfa donmuş ve kullanıcı on dakika
        // sonra dönmüşse o dinlenme çoktan bitmiştir; o anda yüksek sesle
        // uyarı çalmak bilgi değil şaşkınlık üretir. Geç kalınan durumda
        // görsel uyarı ve bildirim yine çıkıyor, yalnızca ses susuyor.
        const gecikme = Date.now() - rest.endsAt;
        const kacti = rest.soundScheduled && restAlertMissed() && gecikme < LATE_ALERT_LIMIT_MS;
        if (settings.restAlert && !sessionRestMuted && (!rest.soundScheduled || kacti)) {
          void playRestAlert(settings.restAlertIntensity, {
            toneKey: settings.restAlertTone,
            volume: settings.restAlertVolume,
          });
        }
        if (!sessionRestMuted) vibrateAlert(settings.restAlertIntensity);
        if (settings.restVisualAlert !== false) {
          setRestAlertFlash(true);
          setTimeout(() => setRestAlertFlash(false), 1800);
        }
        // Bildirim, ses ve titreşimin YERİNE değil yanına: telefon sessizdeyken
        // ya da uygulama arka plandayken tek görünür uyarı bu.
        if (settings.restNotification && !sessionRestMuted) void showRestNotification();
      }
    };
    const interval = setInterval(tick, 500);
    tick();
    return () => clearInterval(interval);
  }, [rest, sessionRestMuted, settings.restAlert, settings.restNotification,
    settings.restAlertIntensity, settings.restAlertTone, settings.restAlertVolume,
    settings.restVisualAlert]);


  // Antrenman işlemleri
  // `reason` akıllı öneriden gelir: sayacın neden 210 sn değil de 75 sn
  // olduğunu göstermek, öneriyi "keyfi sayı" olmaktan çıkarıyor.
  // Dinlenmenin BAŞLADIĞI an. Bir sonraki set eklendiğinde aradan geçen süre
  // o setin `restBefore` alanına yazılıyor: uygulama dinlenme süresi öneriyor
  // ve kronometre çalıştırıyordu ama gerçekte ne kadar beklendiğini hiç
  // kaydetmiyordu, dolayısıyla "acele ettiğim için mi tekrar düşüyor"
  // sorusunun cevabı yoktu. Ref kullanılıyor çünkü bu değer render'ı
  // etkilemiyor; state olsaydı her sayaç tikinde yeniden çizim olurdu.
  const restStartedAtRef = useRef(null);

  const startRest = useCallback((seconds, reason = null) => {
    const total = Math.max(1, Math.round(seconds));
    const endsAt = Date.now() + total * 1000;
    restStartedAtRef.current = Date.now();
    cancelScheduledRestAlert();
    setRest({ endsAt, total, reason, paused: false, soundScheduled: false });
    setRestSecondsLeft(total);
    if (settings.restAlert && !sessionRestMuted) {
      // Ses motorunu dinlenme boyunca ayakta tut: ekran kapanınca tarayıcı
      // hem sayfayı donduruyor hem motoru askıya alıyordu ve zamanlanmış
      // notalar bu yüzden hiç çalmıyordu.
      if (settings.restKeepAwake !== false) void startAlertKeepAlive();
      void scheduleRestAlert(total, {
        intensityKey: settings.restAlertIntensity,
        toneKey: settings.restAlertTone,
        volume: settings.restAlertVolume,
        preAlertSeconds: settings.restPreAlertSeconds,
      }).then(result => {
        setRest(current => current?.endsAt === endsAt
          ? { ...current, soundScheduled: Boolean(result?.ok) }
          : current);
      });
    }
    // Bildirimi işletim sistemine yaz: destekleyen tarayıcıda sayfa donmuş
    // olsa bile zamanında çıkıyor. Desteklenmiyorsa sessizce atlanıyor ve
    // bildirim eskisi gibi sayaç bitince gösteriliyor.
    if (settings.restNotification && !sessionRestMuted) {
      void scheduleRestNotification(total);
    }
  }, [sessionRestMuted, settings.restAlert, settings.restNotification, settings.restKeepAwake,
    settings.restAlertIntensity, settings.restAlertTone, settings.restAlertVolume,
    settings.restPreAlertSeconds]);

  const stopRest = useCallback(() => {
    cancelScheduledRestAlert();
    void cancelScheduledRestNotification();
    stopAlertKeepAlive();
    setRest(null);
    setRestSecondsLeft(0);
  }, []);

  const pauseRest = useCallback(() => {
    if (!rest || rest.paused) return;
    const remaining = Math.max(1, Math.ceil((rest.endsAt - Date.now()) / 1000));
    cancelScheduledRestAlert();
    setRestSecondsLeft(remaining);
    setRest({ ...rest, paused: true, remaining, soundScheduled: false });
  }, [rest]);

  const resumeRest = useCallback(() => {
    if (!rest?.paused) return;
    const remaining = Math.max(1, rest.remaining || restSecondsLeft);
    const endsAt = Date.now() + remaining * 1000;
    setRest({ ...rest, endsAt, paused: false, remaining: null, soundScheduled: false });
    if (settings.restAlert && !sessionRestMuted) {
      void scheduleRestAlert(remaining, {
        intensityKey: settings.restAlertIntensity,
        toneKey: settings.restAlertTone,
        volume: settings.restAlertVolume,
        preAlertSeconds: settings.restPreAlertSeconds,
      }).then(result => setRest(value => value?.endsAt === endsAt
        ? { ...value, soundScheduled: Boolean(result?.ok) }
        : value));
    }
  }, [rest, restSecondsLeft, sessionRestMuted, settings.restAlert, settings.restAlertIntensity,
    settings.restAlertTone, settings.restAlertVolume, settings.restPreAlertSeconds]);

  const adjustRest = useCallback((delta) => {
    if (!rest) return;
    const base = rest.paused
      ? (rest.remaining || restSecondsLeft)
      : Math.max(1, Math.ceil((rest.endsAt - Date.now()) / 1000));
    const remaining = Math.max(5, Math.min(900, base + delta));
    const total = Math.max(remaining, rest.total + delta);
    cancelScheduledRestAlert();
    setRestSecondsLeft(remaining);
    if (rest.paused) {
      setRest({ ...rest, remaining, total, soundScheduled: false });
      return;
    }
    const endsAt = Date.now() + remaining * 1000;
    setRest({ ...rest, endsAt, total, soundScheduled: false });
    if (settings.restAlert && !sessionRestMuted) {
      void scheduleRestAlert(remaining, {
        intensityKey: settings.restAlertIntensity,
        toneKey: settings.restAlertTone,
        volume: settings.restAlertVolume,
        preAlertSeconds: settings.restPreAlertSeconds,
      }).then(result => setRest(value => value?.endsAt === endsAt
        ? { ...value, soundScheduled: Boolean(result?.ok) }
        : value));
    }
  }, [rest, restSecondsLeft, sessionRestMuted, settings.restAlert, settings.restAlertIntensity,
    settings.restAlertTone, settings.restAlertVolume, settings.restPreAlertSeconds]);

  const toggleSessionRestMute = useCallback(() => {
    if (!sessionRestMuted) {
      cancelScheduledRestAlert();
      setRest(current => current ? { ...current, soundScheduled: false } : current);
      setSessionRestMuted(true);
      return;
    }
    setSessionRestMuted(false);
    if (!rest || rest.paused || !settings.restAlert) return;
    const remaining = Math.max(1, Math.ceil((rest.endsAt - Date.now()) / 1000));
    void scheduleRestAlert(remaining, {
      intensityKey: settings.restAlertIntensity,
      toneKey: settings.restAlertTone,
      volume: settings.restAlertVolume,
      preAlertSeconds: settings.restPreAlertSeconds,
    }).then(result => setRest(current => current?.endsAt === rest.endsAt
      ? { ...current, soundScheduled: Boolean(result?.ok) }
      : current));
  }, [rest, sessionRestMuted, settings.restAlert, settings.restAlertIntensity,
    settings.restAlertTone, settings.restAlertVolume, settings.restPreAlertSeconds]);

  const handleSetRestOverride = useCallback((exerciseName, seconds) => {
    setSettings(previous => {
      const overrides = { ...(previous.exerciseRestOverrides || {}) };
      if (seconds) overrides[exerciseName] = seconds;
      else delete overrides[exerciseName];
      return { ...previous, exerciseRestOverrides: overrides };
    });
  }, [setSettings]);

  const handleTestRestAlert = useCallback(async ({ intensityKey, toneKey, volume } = {}) => {
    const result = await playRestAlert(intensityKey || settings.restAlertIntensity, {
      toneKey: toneKey || settings.restAlertTone,
      volume: volume ?? settings.restAlertVolume,
    });
    if (result?.ok) vibrateAlert(intensityKey || settings.restAlertIntensity);
    return result || restAlertDiagnostics();
  }, [settings.restAlertIntensity, settings.restAlertTone, settings.restAlertVolume]);

  const allExercisesNames = useMemo(() => {
    const customNames = customExercises.map(ex => typeof ex === 'object' ? ex.name : ex);
    return Array.from(new Set([...DEFAULT_EXERCISES, ...customNames])).sort();
  }, [customExercises]);

  // Daha önce en az bir kez yapılmış hareketler. Seçim listesinin varsayılan
  // içeriği bu; kalan ~100 hareket arama çubuğundan bulunur.
  const performedNames = useMemo(() => {
    const s = new Set();
    workouts.forEach(w => (w.exercises || []).forEach(ex => { if (ex?.name) s.add(ex.name); }));
    return s;
  }, [workouts]);

  const pinnedExerciseNames = useMemo(
    () => new Set(settings.pinnedExercises || []),
    [settings.pinnedExercises],
  );

  // Her hareketin kaç ayrı seansta yapıldığı. 1RM grafiği en az iki ölçüm
  // olmadan bir eğilim gösteremediği için o liste bu sayıya göre filtrelenir.
  const exercisePerformCounts = useMemo(() => {
    const counts = new Map();
    workouts.forEach(w => {
      const seen = new Set();
      (w.exercises || []).forEach(ex => {
        // Aynı hareket bir seansta iki kez varsa (süperset vb.) tek sayılır.
        if (!ex?.name || seen.has(ex.name)) return;
        seen.add(ex.name);
        counts.set(ex.name, (counts.get(ex.name) || 0) + 1);
      });
    });
    return counts;
  }, [workouts]);

  // 1RM listesinin kendi gizleme listesi var: antrenman seçiminde görünmesini
  // istediğin bir hareketi burada gizlemek isteyebilirsin.
  const handleToggleHidden1RM = useCallback((name) => {
    setSettings(prev => {
      const hidden = new Set(prev.hidden1RMExercises || []);
      if (hidden.has(name)) hidden.delete(name); else hidden.add(name);
      return { ...prev, hidden1RMExercises: [...hidden] };
    });
  }, [setSettings]);

  // Yerleşik veritabanında olmayan her ad kullanıcının kendi eklediğidir.
  // Yerleşik bir hareketin kas eşlemesini düzenlemek de customExercises'a kayıt
  // yazar, bu yüzden "customExercises içinde mi" sorusu bu ayrımı yapamaz.
  const isUserAddedExercise = useCallback(
    (name) => !DEFAULT_EXERCISES.includes(name), []);

  // Seçim listesinde görünmeyecek hareketler.
  const pickerHiddenNames = useMemo(() => {
    const hidden = new Set(settings.hiddenExercises || []);
    const pinned = new Set(settings.pinnedExercises || []);
    const out = new Set();
    allExercisesNames.forEach(name => {
      if (hidden.has(name)) { out.add(name); return; }
      if (!performedNames.has(name) && !pinned.has(name)) out.add(name);
    });
    return out;
  }, [allExercisesNames, performedNames, settings.hiddenExercises, settings.pinnedExercises]);

  const filteredExercises = useMemo(() => {
    const query = foldForSearch(exerciseSearchQuery).trim();
    if (query) return allExercisesNames.filter(ex => foldForSearch(ex).includes(query));
    if (settings.pickerShowAll) return allExercisesNames;
    const shortlist = allExercisesNames.filter(ex => !pickerHiddenNames.has(ex));
    // Hiç antrenman geçmişi olmayan kullanıcı boş listeyle karşılaşmasın.
    return shortlist.length ? shortlist : allExercisesNames;
  }, [allExercisesNames, exerciseSearchQuery, pickerHiddenNames, settings.pickerShowAll]);

  // Tarihe göre azalan sıralı listeler: hem arşiv görünümü hem de "en son ne yaptım"
  // sorguları bunlara dayanır, böylece kayıt sırasından bağımsız olarak doğru çalışır.
  const sortedWorkouts = useMemo(() => sortByDateDesc(workouts), [workouts]);
  const recentStrengthWorkout = useMemo(
    () => sortedWorkouts.find(workout => (workout.exercises || []).length > 0) || null,
    [sortedWorkouts],
  );
  const sortedMetrics = useMemo(() => sortByDateDesc(metricsHistory), [metricsHistory]);
  const sortedNutrition = useMemo(() => sortByDateDesc(nutritionHistory), [nutritionHistory]);
  const profileGender = sortedMetrics[0]?.gender || currentMetricsForm.gender || 'male';
  const todayCycleSummary = useMemo(
    () => profileGender === 'female'
      ? buildCycleSummary(cycleHistory, getLocalDateString(), settings.cycleConfig)
      : null,
    [profileGender, cycleHistory, settings.cycleConfig],
  );

  /**
   * Bir setin gerçek yükü: ek ağırlık + taşınan vücut ağırlığı.
   *
   * Vücut ağırlığı O TARİHTEKİ ölçümden okunuyor. Bugünkü kiloyu iki yıl
   * önceki barfikse uygulamak, kilo veren birinde geçmişi olduğundan ağır,
   * kilo alanda hafif gösterirdi.
   */
  const resolveSetLoad = useCallback((exerciseName, setWeight, workout) => {
    const olcum = findMetricsForDate(sortedMetrics, workout?.date, currentMetricsForm);
    // Seansın KENDİ kaydı önce: kaydedilirken dondurulan kilo, sonradan bir
    // ölçüm silinse ya da düzeltilse bile geçmiş seansın yükünü değiştirmiyor.
    const taban = bodyweightBasisFor(workout, parseNumber(olcum?.weight));
    return effectiveLoad(exerciseName, setWeight, {
      bodyWeightKg: taban.kg,
      customExercises,
      bodyweightEnabled: settings.bodyweightLoad !== false,
      entryStyle: settings.bodyweightEntry || 'auto',
    });
  }, [sortedMetrics, currentMetricsForm, customExercises,
    settings.bodyweightLoad, settings.bodyweightEntry]);

  /**
   * Vücut ağırlıklı kayıtlarda hangi yazım biçiminin kullanıldığı.
   *
   * Ayarlar açılmadan hesaplamak gereksiz iş; ama ayarlar açıkken kullanıcının
   * geçmişinde ne olduğunu görmesi gerekiyor, çünkü 3.3 öncesi "toplam" yazan
   * kayıtlar yeni kuralla iki kez sayılıyordu.
   */
  const bodyweightAudit = useMemo(
    () => (isSettingsModalOpen
      ? auditBodyweightEntries(workouts, {
        metricsHistory: sortedMetrics,
        currentMetrics: currentMetricsForm,
        customExercises,
      })
      : null),
    [isSettingsModalOpen, workouts, sortedMetrics, currentMetricsForm, customExercises]);

  /**
   * Seçilen veri kümesini CSV olarak indirir.
   *
   * Yük çözücü setlere de uygulanıyor: barfiks satırında hem yazılan değer hem
   * gerçek yük görünsün ki tabloyu açan kişi hangisiyle hesap yaptığını bilsin.
   */
  const handleExportCsv = useCallback(async (kind) => {
    const { workoutsToCsv, metricsToCsv, nutritionToCsv, cardioToCsv } = await import('./utils/csvExport');
    const uretici = {
      workouts: () => ({
        text: workoutsToCsv(sortedWorkouts, { customExercises, resolveLoad: resolveSetLoad }),
        name: 'setler',
      }),
      metrics: () => ({ text: metricsToCsv(sortedMetrics), name: 'olcumler' }),
      nutrition: () => ({ text: nutritionToCsv(sortedNutrition, dailyTotals), name: 'beslenme' }),
      // Kardiyo dışa aktarımda hiç yoktu: set defteri seansın yapısını
      // tutuyor ama tabloya "45 dakika yüzme" olarak düşüyordu.
      cardio: () => ({
        text: cardioToCsv(sortedWorkouts, { poolLength: Number(settings.poolLength) || 25 }),
        name: 'kardiyo',
      }),
    }[kind];
    if (!uretici) return;

    const { text, name } = uretici();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProOverload_${name}_${getLocalDateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV indirildi.');
  }, [sortedWorkouts, sortedMetrics, sortedNutrition, customExercises, resolveSetLoad, settings.poolLength, showToast]);

  /**
   * Hazır programı kurar: şablonları ekler, haftalık planı oluşturup aktif yapar.
   *
   * Mevcut şablonlar SİLİNMİYOR, yenileri yanına ekleniyor — kullanıcı bir
   * programı denemek isteyip vazgeçebilir ve eski şablonlarını kaybetmemeli.
   * Plan aktif yapılıyor çünkü kurmanın amacı zaten onu kullanmak.
   */
  const handleInstallStarter = useCallback((key) => {
    const program = findStarterProgram(key);
    const kurulum = instantiateStarterProgram(program, generateId);
    if (!kurulum) return;

    setTemplates(prev => [...prev, ...kurulum.templates]);
    setSettings(prev => ({
      ...prev,
      weekPlans: [...(prev.weekPlans || []), kurulum.plan],
      activePlanId: kurulum.plan.id,
    }));
    showToast(`${program.name} kuruldu — ${kurulum.templates.length} şablon eklendi.`);
  }, [setSettings, setTemplates, showToast]);

  /** Sihirbazın ürettiği programı şablonlara ve haftalık plana yazar. */
  const handleInstallGenerated = useCallback(async (built, { schedule = null } = {}) => {
    const { instantiateProgram } = await import('./utils/programBuilder');
    const kurulum = instantiateProgram(built, generateId, { schedule });
    if (!kurulum) return;

    setTemplates(prev => [...prev, ...kurulum.templates]);
    setSettings(prev => ({
      ...prev,
      weekPlans: [...(prev.weekPlans || []), kurulum.plan],
      activePlanId: kurulum.plan.id,
    }));
    showToast(`${kurulum.plan.name} kuruldu — ${kurulum.templates.length} şablon eklendi.`);
  }, [setSettings, setTemplates, showToast]);

  /**
   * Şablonu kopyalar.
   *
   * Program kurarken en sık yapılan iş, var olan bir günü alıp bir iki
   * hareketini değiştirmek ("Üst A"dan "Üst B" türetmek). Bunun yolu şimdiye
   * kadar sıfırdan şablon açıp hareketleri tek tek yeniden eklemekti.
   * Kopyanın setleri de geliyor; kimlikler yeniden üretiliyor ki iki şablon
   * birbirine bağlı kalmasın.
   */
  const handleDuplicateTemplate = useCallback((template) => {
    const kopya = duplicateTemplate(template, generateId);
    if (!kopya) return;
    setTemplates(prev => [...prev, kopya]);
    showToast(`${template.name} kopyalandı.`);
  }, [setTemplates, showToast]);

  const handleToggleTemplateFavorite = useCallback((template) => {
    if (!template?.id) return;
    setTemplates(prev => toggleTemplateFavorite(prev, template.id));
    showToast(template.favorite ? 'Şablon favorilerden çıkarıldı.' : 'Şablon favorilere eklendi.');
  }, [setTemplates, showToast]);

  /** Veri sağlığı: içi boş antrenman kayıtlarını siler. */
  const handleRemoveEmptyWorkouts = useCallback(() => {
    const { workouts: next, removed } = removeEmptyWorkouts(workouts);
    if (removed === 0) {
      showToast('Silinecek boş kayıt bulunamadı.');
      return;
    }
    setWorkouts(next);
    showToast(`${removed} boş kayıt silindi.`);
  }, [workouts, setWorkouts, showToast]);

  /** Bildirim iznini kullanıcı eylemiyle ister; reddedilirse ayarı açmaz. */
  const handleToggleRestNotification = useCallback(async () => {
    if (settings.restNotification) {
      setSettings(prev => ({ ...prev, restNotification: false }));
      return;
    }
    const sonuc = await requestNotificationPermission();
    if (sonuc === 'granted') {
      setSettings(prev => ({ ...prev, restNotification: true }));
      showToast('Dinlenme bildirimi açıldı.');
    } else if (sonuc === 'unsupported') {
      showToast('Bu tarayıcı bildirim desteklemiyor.', 'warning');
    } else {
      showToast('Bildirim izni verilmedi. Tarayıcı ayarlarından açabilirsin.', 'warning');
    }
  }, [settings.restNotification, setSettings, showToast]);

  /** Kardiyo kaydından şablon üretir; defteri olmayan kayıttan şablon çıkmaz. */
  const handleSaveCardioTemplate = useCallback((entry, name) => {
    const sablon = templateFromEntry(entry, name, generateId);
    if (!sablon) {
      showToast('Şablon için set defteri gerekiyor.', 'warning');
      return;
    }
    setSettings(prev => ({ ...prev, cardioTemplates: addCardioTemplate(prev.cardioTemplates, sablon) }));
    showToast(`${sablon.name} şablonu kaydedildi.`);
  }, [setSettings, showToast]);

  const handleDeleteCardioTemplate = useCallback((id) => {
    setSettings(prev => ({ ...prev, cardioTemplates: removeCardioTemplate(prev.cardioTemplates, id) }));
    showToast('Kardiyo şablonu silindi.');
  }, [setSettings, showToast]);

  /** Şablonu kardiyo formuna yükler ve kullanım sayacını artırır. */
  const handleApplyCardioTemplate = useCallback((template) => {
    const uygulama = applyCardioTemplate(template);
    if (!uygulama) return;
    setSettings(prev => ({ ...prev, cardioTemplates: markCardioTemplateUsed(prev.cardioTemplates, template.id) }));
    // presetId key'e giriyor: aynı gün ikinci bir şablon yüklendiğinde
    // ekran yeniden kurulmalı, yoksa ilk şablonun setleri kalırdı.
    setCardioContext({ date: getLocalDateString(), preset: uygulama, presetId: `${template.id}-${Date.now()}` });
    setIsCardioOpen(true);
  }, [setSettings]);

  const handleNormalizeBodyweight = useCallback(() => {
    const { workouts: next, changed } = normalizeBodyweightEntries(workouts, {
      metricsHistory: sortedMetrics,
      currentMetrics: currentMetricsForm,
      customExercises,
    });
    if (changed === 0) {
      showToast('Dönüştürülecek kayıt bulunamadı.');
      return;
    }
    setWorkouts(next);
    // Biçim tekleştiği için otomatik tanımaya artık gerek yok; kesin kural
    // seçilmesi ileride sınıra yakın bir setin yanlış okunmasını da engelliyor.
    setSettings(prev => ({ ...prev, bodyweightEntry: 'added' }));
    showToast(`${changed} set ek yük biçimine çevrildi.`);
  }, [workouts, sortedMetrics, currentMetricsForm, customExercises, setSettings, setWorkouts, showToast]);

  /**
   * Antrenman ekranındaki vücut ağırlığı bilgisi.
   *
   * Yalnızca "ne kadar ekleniyor" değil, TABANIN NEREDEN geldiği de
   * dönüyor: kullanıcı sayının hangi kilodan çıktığını göremeyince ayarın
   * doğru olup olmadığını da anlayamıyordu.
   */
  const bodyweightContext = useCallback((exerciseName) => {
    const olcum = findMetricsForDate(sortedMetrics, activeWorkout?.date, currentMetricsForm);
    const taban = bodyweightBasisFor(activeWorkout, parseNumber(olcum?.weight));
    const bilgi = describeSetLoad(exerciseName, 0, {
      bodyWeightKg: taban.kg,
      customExercises,
      bodyweightEnabled: settings.bodyweightLoad !== false,
      entryStyle: settings.bodyweightEntry || 'auto',
    });
    if (!bilgi || bilgi.style === 'plain') return null;
    return { ...bilgi, basis: taban, kg: bilgi.carried };
  }, [activeWorkout, sortedMetrics, currentMetricsForm, customExercises,
    settings.bodyweightLoad, settings.bodyweightEntry]);

  /** Tonaj hesapları için o tarihin vücut ağırlığı bağlamı. */
  const loadOptsFor = useCallback((dateStr) => ({
    bodyWeightKg: parseNumber(findMetricsForDate(sortedMetrics, dateStr, currentMetricsForm)?.weight),
    customExercises,
    bodyweightEnabled: settings.bodyweightLoad !== false,
    entryStyle: settings.bodyweightEntry || 'auto',
  }), [sortedMetrics, currentMetricsForm, customExercises,
    settings.bodyweightLoad, settings.bodyweightEntry]);

  const personalRecords = useMemo(() => {
    return buildPersonalRecords(workouts, activeWorkout?.id, resolveSetLoad);
  }, [workouts, activeWorkout?.id, resolveSetLoad]);

  const exerciseProfile = useMemo(
    () => buildExerciseProfile(profileExercise, sortedWorkouts, {
      templates,
      customExercises,
      settings,
      resolveLoad: resolveSetLoad,
    }),
    [profileExercise, sortedWorkouts, templates, customExercises, settings, resolveSetLoad],
  );

  const profileRepRange = useMemo(() => profileExercise ? repRangeFor(profileExercise, {
    overrides: settings.repRangeOverrides,
    customExercises,
    globalMin: settings.repRangeMin,
    globalMax: settings.repRangeMax,
  }) : null, [profileExercise, settings.repRangeOverrides, settings.repRangeMin,
    settings.repRangeMax, customExercises]);

  const {
    profilePlan: profileProgressionPlan,
    profileReport: progressionBlockReport,
    profileDefaults: progressionBlockDefaults,
    blocks: progressionBlocks,
    prescriptionFor: progressionPrescriptionFor,
    saveBlock: handleSaveProgressionBlock,
    removeBlock: handleRemoveProgressionBlock,
    captureAfterWorkout: captureProgressionAfterWorkout,
  } = useProgressionBlocks({
    profileExercise,
    profileRepRange,
    exerciseProfile,
    defaultIncrement: profileExercise ? loadStepFor(profileExercise, customExercises) : 2.5,
    progressionPlans: settings.progressionPlans,
    workouts: sortedWorkouts,
    resolveLoad: resolveSetLoad,
    setSettings,
    showToast,
    today: getLocalDateString(),
  });

  // Rekor kontrolü set güncellenirken yapılıyor; o an güncel tabloyu okumak
  // için ref kullanılır, yoksa bağımlılık zinciri her tuşta yeniden kurulurdu.
  const personalRecordsRef = useRef(personalRecords);
  useEffect(() => { personalRecordsRef.current = personalRecords; }, [personalRecords]);
  // Tekrar bandı rekorları geçmişin tamamına bakıyor. Ref kullanılıyor ki
  // updateSet her kayıt değişiminde yeniden kurulmasın — set girerken her tuş
  // vuruşunda yeni bir işlev üretmek gereksiz render'a mal olurdu.
  const workoutsRef = useRef(sortedWorkouts);
  useEffect(() => { workoutsRef.current = sortedWorkouts; }, [sortedWorkouts]);

  // Gerçek (adaptif) TDEE: ölçülen kilo değişimi + kaydedilen alım.
  // Formül BMR yalnızca bir tahmindir; bu hesap gerçek harcamayı doğrudan ölçer.
  const adaptiveTDEE = useMemo(
    () => computeAdaptiveTDEE(metricsHistory, nutritionHistory),
    [metricsHistory, nutritionHistory]
  );

  const computedComp = useMemo(() => {
    return computeComposition(currentMetricsForm);
  }, [currentMetricsForm]);

  // Hedef ilerlemesi için başlangıç noktası: elimizdeki EN ESKİ ölçüm.
  // Hedef sonradan konulduğu için "hedefi koyduğum an" referans alınsaydı
  // ilerleme her zaman %0 görünürdü.
  const earliestMetrics = useMemo(() => {
    const withWeight = metricsHistory.filter(m => parseNumber(m.weight) > 0);
    if (withWeight.length === 0) return null;
    return withWeight.reduce((oldest, m) =>
      new Date(m.date) < new Date(oldest.date) ? m : oldest);
  }, [metricsHistory]);

  // Hedef kartı, hedef anahtarlarıyla eşleşen mevcut/başlangıç değerlerini bekler.
  const goalValues = useMemo(() => {
    const shape = (metrics, comp) => ({
      goalWeight: parseNumber(metrics?.weight),
      goalBodyFat: parseNumber(comp?.activeBF),
      goalFFM: parseNumber(comp?.ffm),
      goalFFMI: parseNumber(comp?.ffmi),
    });
    // Her hedefin kendi eğilimi: kilo düşerken yağsız kütle sabit kalabiliyor,
    // tek bir "haftalık kilo" hızından dört tahmin türetmek yanlış olurdu.
    // Doğru, son altı haftanın ölçümlerine ayrı ayrı bakmak.
    const noktalar = sortedMetrics.map(m => {
      const comp = computeComposition(m);
      return { date: m.date, values: shape(m, comp) };
    });
    const trends = Object.fromEntries(GOAL_FIELDS.map(f => [
      f.key,
      trendRate(noktalar.map(p => ({ date: p.date, value: p.values[f.key] })), 42),
    ]));
    const measurementTrends = Object.fromEntries(
      BODY_METRICS.filter(metric => metric.key !== 'weight').map(metric => [
        metric.key,
        trendRate(sortedMetrics.map(m => ({ date: m.date, value: m.measurements?.[metric.key] })), 42),
      ]),
    );
    const skinfoldTrends = Object.fromEntries(
      ['chest', 'abdomen', 'thigh', 'triceps', 'suprailiac', 'axilla', 'subscapular'].map(key => [
        key,
        trendRate(sortedMetrics.map(m => ({ date: m.date, value: m.skinfolds?.[key] })), 42),
      ]),
    );

    return {
      current: shape(currentMetricsForm, computedComp),
      earliest: earliestMetrics
        ? shape(earliestMetrics, computeComposition(earliestMetrics))
        : {},
      trends,
      measurementTrends,
      skinfoldTrends,
    };
  }, [currentMetricsForm, computedComp, earliestMetrics, sortedMetrics]);

  const dashboardStats = useMemo(() => {
    const monday = getMondayOfCurrentWeek();
    const thisWeekWorkouts = workouts.filter(w => new Date(w.date) >= monday);
    const thisWeekSessions = thisWeekWorkouts.length;
    const thisWeekEffectiveSets = thisWeekWorkouts.reduce((sum, w) => sum + calcEffectiveSets(w.exercises), 0);

    const muscleVolume = Object.fromEntries(MUSCLE_GROUPS.map(m => [m, 0]));

    // Her çalışma seti, hareketin katkı tablosundaki ağırlıkla ilgili kaslara yazılır:
    // birincil kas 1, belirgin yardımcılar 0.5, hafif katkılar 0.25 set sayılır.
    // Bu hafta DOĞRUDAN çalışılan kaslar. Hacim tablosu dolaylı katkıyı da
    // sayıyor; projeksiyon ise bir kasın programda olup olmadığını sorarken
    // yalnızca birincil hedefe bakmalı.
    const trainedMusclesThisWeek = new Set();
    thisWeekWorkouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        const { contributions, muscle: birincil } = detectMuscleGroup(ex.name, customExercises);
        const count = (ex.sets || []).filter(isCompletedWorkingSet).length;
        if (count === 0) return;
        if (birincil) trainedMusclesThisWeek.add(birincil);

        Object.entries(contributions || {}).forEach(([muscle, weight]) => {
          if (muscleVolume[muscle] !== undefined) {
            muscleVolume[muscle] += count * weight;
          } else if (import.meta.env.DEV) {
            // Bu koruma bir sürüm boyunca geçersiz kas adlarını gizledi.
            console.warn('[hacim] tanınmayan kas grubu:', muscle, '·', ex.name);
          }
        });
      });
    });

    // Yarım set katkıları ondalık biriktirdiği için yuvarlanır.
    Object.keys(muscleVolume).forEach(m => {
      muscleVolume[m] = Math.round(muscleVolume[m] * 4) / 4;
    });

    // Deload kararı kasa özel MRV tavanına göre verilir, sabit bir eşiğe göre değil.
    const isDeloadNeeded = Object.entries(muscleVolume).some(
      ([muscle, volume]) => volume > getVolumeLandmarks(muscle, settings.experienceLevel).mrv
    );

    // En az bir kas verimli tavana (MAV) ulaştı mı? ACWR oranı göreli olduğu
    // için tek başına risk göstergesi değil; mutlak yük de tavana yaklaşmadıkça
    // yüksek oran "risk" değil "rampa" sayılır.
    const nearCeiling = Object.entries(muscleVolume).some(
      ([muscle, volume]) => volume >= getVolumeLandmarks(muscle, settings.experienceLevel).mav
    );

    // İtme/çekme dengesi: bu haftaki etkili setlerin mekanik dağılımı.
    let pushSets = 0;
    let pullSets = 0;
    thisWeekWorkouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        const { mechanics } = detectMuscleGroup(ex.name, customExercises);
        const effective = calcEffectiveSets([ex]);
        if (mechanics === 'Push') pushSets += effective;
        else if (mechanics === 'Pull') pullSets += effective;
      });
    });
    // Hiç çekme yapılmamışken oran sayısal olarak tanımsızdır; bu durumu
    // "dengeli" saymamak için denge bilgisi ayrı bir bayrakla taşınır.
    const hasPushPullData = pushSets > 0 || pullSets > 0;
    const pushPullRatio = pullSets > 0
      ? (pushSets / pullSets).toFixed(2)
      : (pushSets > 0 ? 'Çekme yok' : '—');
    const pushPullBalanced = pullSets > 0 && pushSets > 0
      ? (pushSets / pullSets) <= 1.5 && (pullSets / pushSets) <= 1.5
      : !hasPushPullData;

    // ACWR (akut:kronik yük oranı) — üstel ağırlıklı hareketli ortalama ile.
    //
    // Eskiden akut (son 7 gün) ve kronik (son 28 gün) yükler düz toplamdı ve
    // akut pencere kroniğin içinde yer alıyordu. Hiç yumuşatma olmadığı için
    // tek bir ağır ya da hafif seans oranı doğrudan sallıyor, boş yere alarm
    // veriyordu. EWMA son günlere daha çok ağırlık verir ama tek günün etkisini
    // söndürür — spor bilimi literatüründe de düz toplamın yerini bu aldı.
    const DAY_MS = 1000 * 60 * 60 * 24;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Yük metriği: sRPE benzeri — seans zorluğu × etkili set sayısı.
    const loadByDay = new Map();
    let firstDayTime = null;
    workouts.forEach(w => {
      const wDate = new Date(w.date);
      wDate.setHours(0, 0, 0, 0);
      if (wDate > today) return; // gelecek tarihli kayıtlar sayılmaz
      const key = wDate.getTime();
      loadByDay.set(key, (loadByDay.get(key) || 0) + (w.rating || 3) * calcEffectiveSets(w.exercises));
      if (firstDayTime === null || key < firstDayTime) firstDayTime = key;
    });

    let acwr = '0.00';
    let hasEnoughData = false;

    if (firstDayTime !== null) {
      // EWMA günlük bir seri bekler; antrenman yapılmayan günler 0 yük olarak
      // doldurulur, yoksa dinlenme günleri hesaba hiç girmez ve oran şişer.
      const LAMBDA_ACUTE = 2 / 8;    // N = 7 gün
      const LAMBDA_CHRONIC = 2 / 29; // N = 28 gün
      let acuteEWMA = null;
      let chronicEWMA = null;
      const dailyRatios = [];

      for (let t = firstDayTime; t <= today.getTime(); t += DAY_MS) {
        const load = loadByDay.get(t) || 0;
        acuteEWMA = acuteEWMA === null ? load : LAMBDA_ACUTE * load + (1 - LAMBDA_ACUTE) * acuteEWMA;
        chronicEWMA = chronicEWMA === null ? load : LAMBDA_CHRONIC * load + (1 - LAMBDA_CHRONIC) * chronicEWMA;
        if (chronicEWMA > 0) dailyRatios.push(acuteEWMA / chronicEWMA);
      }

      // Tek günün oranı yerine son 7 günün ortalaması gösterilir. Akut EWMA
      // antrenman gününde yükselip dinlenme gününde düştüğü için, aynı rutini
      // sürdüren biri sırf hangi gün baktığına göre farklı sonuç görüyordu
      // (haftada 2 gün çalışanda 0.67 ile 1.30 arası). Ortalama alınca düzenli
      // rutin sıklıktan bağımsız 1.00 civarına oturuyor, buna karşılık gerçek
      // yük değişimlerini daha net yakalıyor.
      if (dailyRatios.length > 0) {
        const window = dailyRatios.slice(-7);
        acwr = (window.reduce((sum, r) => sum + r, 0) / window.length).toFixed(2);
      }
      // Kronik bileşen anlam kazanana kadar risk sınıflandırması gösterilmez.
      hasEnoughData = Math.floor((today.getTime() - firstDayTime) / DAY_MS) >= ACWR_MIN_DAYS;
    }

    return {
      thisWeekSessions,
      thisWeekEffectiveSets,
      muscleVolume,
      trainedMusclesThisWeek: [...trainedMusclesThisWeek],
      isDeloadNeeded,
      acwr,
      hasEnoughData,
      nearCeiling,
      pushPullRatio,
      pushPullBalanced,
      hasPushPullData
    };
  }, [workouts, customExercises, settings.experienceLevel, settings.volumeTargets]);

  const templateRecommendation = useMemo(
    () => bestTemplateRecommendation(templates, {
      currentVolume: dashboardStats.muscleVolume,
      customExercises,
      experienceLevel: settings.experienceLevel,
      workouts: sortedWorkouts,
      restSeconds: settings.restSeconds,
      today: getLocalDateString(),
    }),
    [templates, dashboardStats.muscleVolume, customExercises, settings.experienceLevel, settings.volumeTargets,
      settings.restSeconds, sortedWorkouts],
  );

  // Kas başına haftalık hacmin hangi hareketlerden geldiği.
  // Hacim hesabıyla aynı kuralları izler: yalnızca çalışma setleri, katkı ağırlığıyla.
  const muscleBreakdown = useMemo(() => {
    const monday = getMondayOfCurrentWeek();
    const byMuscle = {};

    workouts
      .filter(w => new Date(w.date) >= monday)
      .forEach(w => {
        (w.exercises || []).forEach(ex => {
          const { contributions } = detectMuscleGroup(ex.name, customExercises);
          const sets = (ex.sets || []).filter(isCompletedWorkingSet).length;
          if (sets === 0) return;

          Object.entries(contributions || {}).forEach(([muscle, weight]) => {
            const bucket = (byMuscle[muscle] ||= {});
            const entry = (bucket[ex.name] ||= { exerciseName: ex.name, weight, sets: 0, contributed: 0, dates: [] });
            entry.sets += sets;
            entry.contributed = Math.round(entry.sets * weight * 4) / 4;
            if (!entry.dates.includes(w.date)) entry.dates.push(w.date);
          });
        });
      });

    // Her kasın listesi katkısı büyükten küçüğe sıralanır.
    return Object.fromEntries(
      Object.entries(byMuscle).map(([muscle, items]) => [
        muscle,
        Object.values(items).sort((a, b) => b.contributed - a.contributed)
      ])
    );
  }, [workouts, customExercises]);

  const handleSelectExercise = useCallback((exerciseName) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const newExerciseId = generateId();
      const initialSet = { id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal' };
      const prescription = progressionPrescriptionFor(exerciseName, { readiness: prev.readiness });
      const exercise = {
        id: newExerciseId,
        name: exerciseName,
        sets: [initialSet],
        ...(prescription ? { progressionPrescription: prescription } : {}),
      };
      return {
        ...prev,
        activeExerciseId: newExerciseId,
        exercises: [...(prev?.exercises || []), exercise]
      };
    });
    setIsExerciseModalOpen(false);
    setExerciseSearchQuery('');
  }, [setActiveWorkout, progressionPrescriptionFor]);

  const addSet = useCallback((exerciseId) => {
    setActiveWorkout(prev => ({
      ...prev, activeExerciseId: exerciseId, exercises: (prev?.exercises || []).map(ex => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1] || { weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal' };
          const taban = settings.autoCopyLastSet
            ? { ...lastSet, id: generateId() }
            : { id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal' };
          // Kronometre çalıştıysa gerçek bekleme süresi bu sete yazılıyor.
          // Kopyalanan setten miras kalan eski değer her durumda siliniyor:
          // önceki setin dinlenmesini yenisine taşımak uydurma veri olurdu.
          const gecen = restStartedAtRef.current
            ? Math.round((Date.now() - restStartedAtRef.current) / 1000)
            : 0;
          const newSet = gecen > 0
            ? { ...taban, restBefore: gecen }
            : (() => { const { restBefore: _eski, ...temiz } = taban; return temiz; })();
          restStartedAtRef.current = null;
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      })
    }));
  }, [settings.autoCopyLastSet, setActiveWorkout]);

  const updateSet = useCallback((exerciseId, setId, field, value) => {
    // Rekor tespiti: yalnızca ağırlık/tekrar değişince ve set anlamlı hale
    // gelince bakılır, her tuş vuruşunda değil.
    if (field === 'weight' || field === 'reps') {
      const ex = activeWorkoutRef.current?.exercises?.find(e => e.id === exerciseId);
      const st = ex?.sets?.find(x => x.id === setId);
      if (ex && st) {
        const yeni = { ...st, [field]: value };
        const kg = parseNumber(yeni.weight);
        const tekrar = parseNumber(yeni.reps);
        if (kg > 0 && tekrar > 0 && !isWarmupSet(yeni)) {
          const tahmin = estimate1RM(kg, tekrar, yeni.rir);
          const eski = personalRecordsRef.current?.get(ex.name);
          if (tahmin > 0 && (!eski || tahmin > eski.e1rm + 0.5)) {
            setPrCelebration({ name: ex.name, weight: kg, reps: tekrar });
          } else {
            // Genel 1RM rekoru değilse tekrar BANDI rekoru olabilir: "on
            // tekrarda en iyim" de bir rekor ve çok daha sık geliyor, yani
            // çok daha sık motive ediyor. Yalnızca biri gösteriliyor —
            // ikisini üst üste bindirmek kutlamayı gürültüye çevirirdi.
            const bant = isRepRecord(ex.name, yeni, workoutsRef.current, {
              resolveLoad: resolveSetLoad,
              excludeWorkoutId: activeWorkoutRef.current?.id,
            });
            if (bant && !bant.first) {
              setPrCelebration({
                name: ex.name, weight: kg, reps: tekrar,
                band: bant.bandLabel, previous: bant.previous,
              });
            }
          }
        }
      }
    }
    setActiveWorkout(prev => ({
      ...prev,
      activeExerciseId: exerciseId,
      exercises: (prev?.exercises || []).map(ex => ex.id === exerciseId
        ? { ...ex, sets: (ex.sets || []).map(s => s.id === setId ? { ...s, [field]: value } : s) } : ex)
    }));
  }, [resolveSetLoad, setActiveWorkout]);

  /**
   * Hareketi bir sıra yukarı/aşağı taşır.
   *
   * Aynı state üzerinden çalıştığı için hem aktif antrenmanda hem de geçmiş bir
   * antrenmanı düzenlerken (isEditingOld) geçerli — ikisi de activeWorkout.
   */
  const moveExercise = useCallback((exerciseId, direction) => {
    setActiveWorkout(prev => {
      const list = [...(prev?.exercises || [])];
      const from = list.findIndex(e => e.id === exerciseId);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= list.length) return prev;
      [list[from], list[to]] = [list[to], list[from]];
      return { ...prev, exercises: list };
    });
  }, [setActiveWorkout]);

  /**
   * Isınma piramidini harekete ekler.
   *
   * Setler listenin BAŞINA giriyor: ısınma çalışma setlerinden önce yapılır ve
   * sonuna eklenirse kullanıcı her seferinde elle yukarı taşımak zorunda kalır.
   * `warmup` tipi hacme sayılmadığı için istatistikler etkilenmiyor.
   */
  const addWarmupSets = useCallback((exerciseId, steps) => {
    if (!exerciseId || !Array.isArray(steps) || steps.length === 0) return;
    setActiveWorkout(prev => prev ? {
      ...prev,
      exercises: (prev.exercises || []).map(ex => ex.id === exerciseId ? {
        ...ex,
        sets: [
          ...steps.map(s => ({
            id: generateId(),
            weight: String(s.weight),
            reps: String(s.reps),
            rir: 4,
            tempo: '',
            formRating: 8,
            setType: 'warmup',
          })),
          ...(ex.sets || []),
        ],
      } : ex),
    } : prev);
    showToast(`${steps.length} ısınma seti eklendi.`);
  }, [setActiveWorkout, showToast]);

  const removeSet = useCallback((exerciseId, setId) => {
    setActiveWorkout(prev => ({ ...prev, exercises: (prev?.exercises || []).map(ex => ex.id === exerciseId ? { ...ex, sets: (ex.sets || []).filter(s => s.id !== setId) } : ex) }));
  }, [setActiveWorkout]);

  const handleApplyProgressionPrescription = useCallback((exerciseId) => {
    const current = activeWorkoutRef.current?.exercises?.find(exercise => exercise.id === exerciseId);
    if (!current?.progressionPrescription) return;
    setActiveWorkout(prev => prev ? {
      ...prev,
      activeExerciseId: exerciseId,
      exercises: (prev.exercises || []).map(exercise => {
        if (exercise.id !== exerciseId || !exercise.progressionPrescription) return exercise;
        return applyProgressionPrescription(exercise, exercise.progressionPrescription, generateId);
      }),
    } : prev);
    showToast('Reçete boş setlere uygulandı; girilmiş veriler korunuyor.');
  }, [setActiveWorkout, showToast]);

  // Sıralı liste üzerinden gezilir: sırasız bir dizide ilk eşleşme en eski seans olur
  // ve "geçen antrenman" bilgisi ile progresyon önerisi yanlış çıkardı.
  const getRecentExerciseData = useCallback((exerciseName) => {
    const history = [];
    for (const w of sortedWorkouts) {
      if (w.id === activeWorkout?.id) continue;
      const ex = (w.exercises || []).find(e => e.name === exerciseName);
      if (ex && Array.isArray(ex.sets) && ex.sets.some(s => isWorkingSet(s) && parseNumber(s.reps) > 0)) {
        history.push({ date: w.date, sets: ex.sets.filter(isCompletedWorkingSet) });
        if (history.length >= 3) break;
      }
    }
    return history.length > 0 ? { ...history[0], history } : null;
  }, [sortedWorkouts, activeWorkout?.id]);

  // iOS Lock Screen entegrasyonu
  const activeWorkoutId = activeWorkout?.id;
  const isEditingOldWorkout = activeWorkout?.isEditingOld;
  const currentExerciseName = activeWorkout?.exercises?.find(e => e.id === activeWorkout.activeExerciseId)?.name;
  const timerStatus = activeWorkout?.timer?.status;

  useEffect(() => {
    if (!lockScreenOn || !activeWorkoutId || isEditingOldWorkout) return;

    const pushUpdate = () => {
      const workout = activeWorkoutRef.current;
      if (!workout) return;

      const exercises = workout.exercises || [];
      const activeIdx = exercises.findIndex(e => e.id === workout.activeExerciseId);
      const active = activeIdx >= 0 ? exercises[activeIdx] : exercises[exercises.length - 1];
      const history = active ? getRecentExerciseData(active.name) : null;

      const totalExercises = Math.max(1, exercises.length);
      const exerciseIndex = activeIdx >= 0 ? activeIdx + 1 : totalExercises;

      const currentSets = active?.sets || [];
      const completedSetsCount = currentSets.filter(s => parseNumber(s.reps) > 0 || parseNumber(s.weight) > 0).length;
      const totalSetsCount = Math.max(1, currentSets.length);

      let elapsed = workout.timer?.accumulatedSeconds || 0;
      if (workout.timer?.status === 'running' && workout.timer.startTime) {
        elapsed += Math.floor((Date.now() - workout.timer.startTime) / 1000);
      }

      const currentRest = restRef.current;
      const secondsLeft = currentRest ? Math.max(0, Math.ceil((currentRest.endsAt - Date.now()) / 1000)) : 0;

      const { muscle } = active ? detectMuscleGroup(active.name, customExercises) : {};
      // Tekrar aralığı harekete özel; kilit ekranındaki hedef ile antrenman
      // ekranındaki hedefin ayrışmaması için ikisi de aynı yerden okuyor.
      const kilitAralik = repRangeFor(active?.name, {
        overrides: settings.repRangeOverrides,
        customExercises,
        globalMin: settings.repRangeMin,
        globalMax: settings.repRangeMax,
      });
      const target = history ? suggestNextTarget(history.sets, {
        repRangeMin: kilitAralik.min,
        repRangeMax: kilitAralik.max,
      }, muscle, {
        history: history.history,
        readiness: workout.readiness,
      }) : null;
      const partner = active?.supersetId
        ? exercises.find(e => e.supersetId === active.supersetId && e.id !== active.id)
        : null;

      updateLockScreenActivity({
        elapsedSeconds: elapsed,
        exerciseName: active?.name || '',
        previousSets: (history?.sets || []).filter(isCompletedWorkingSet),
        previousDate: history ? formatDay(history.date, 'numeric') : '',
        effectiveSets: calcEffectiveSets(exercises),
        isPaused: workout.timer?.status !== 'running',
        restSecondsLeft: secondsLeft,
        restTotalSeconds: currentRest?.total || 0,
        exerciseIndex,
        totalExercises,
        completedSetsCount,
        totalSetsCount,
        // Bugünkü hedef ve süperset eşi kilit ekranından da görünsün.
        targetText: target ? `${target.weight} kg × ${target.reps}` : '',
        supersetName: partner?.name || '',
      });
    };

    pushUpdate();
    const interval = setInterval(pushUpdate, 1000);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        pushUpdate();
      } else if (settings.keepScreenAwake) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [lockScreenOn, activeWorkoutId, isEditingOldWorkout, currentExerciseName, timerStatus, rest,
      settings, customExercises, getRecentExerciseData]);


  const handleStartRequest = useCallback((templateOrWorkout = null) => {
    // Uyku zaten Toparlanma ekranında ölçülmüşse aynı şeyi iki kez sormanın
    // anlamı yok: 100'lük puan 1-10 ölçeğine indirilip form önceden dolduruluyor.
    // Kullanıcı yine de kaydırıcıyla değiştirebilir.
    const bugun = getLocalDateString();
    const gece = wellness.find(r => r.date === bugun)?.sleep;
    const oncekiler = wellness
      .filter(r => r.date < bugun && r.sleep)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(r => r.sleep);
    const uyku = gece ? computeSleepScore(gece, oncekiler) : null;
    if (uyku) {
      setReadinessForm(prev => ({
        ...prev,
        sleep: Math.min(10, Math.max(1, Math.round(uyku.score / 10))),
      }));
    }
    setPreWorkoutModal({
      template: templateOrWorkout,
      sleepScore: uyku?.score ?? null,
      adaptationChoice: null,
    });
  }, [wellness]);

  const confirmStartWorkout = () => {
    const template = preWorkoutModal?.template;
    const todayStr = getLocalDateString();
    const hazir = computeReadiness(readinessForm);
    const readinessSnapshot = { ...readinessForm, score: hazir.score, zone: hazir.zone.key };
    const adaptation = buildSessionAdaptation(template, readinessSnapshot, {
      coachProtocol: activeCoachProtocol,
      date: todayStr,
    });
    const useAdaptedPlan = preWorkoutModal?.adaptationChoice ?? adaptation.recommended;
    const sessionTemplate = useAdaptedPlan ? adaptation.template : template;

    // Süperset bağları ve set yapısı şablondan aynen taşınır.
    const templateExercises = sessionTemplate ? templateToExercises(sessionTemplate, generateId) : [];
    const initialExercises = templateExercises.map(exercise => {
      const prescription = progressionPrescriptionFor(exercise.name, {
        readiness: readinessSnapshot,
        deloadActive: Boolean(deload?.active),
      });
      return prescription ? { ...exercise, progressionPrescription: prescription } : exercise;
    });

    const sourceTemplateId = template?.id && templates.some(item => item.id === template.id)
      ? template.id
      : null;
    const newWorkout = {
      id: generateId(),
      date: todayStr,
      name: template?.name || 'Serbest Antrenman',
      exercises: initialExercises,
      activeExerciseId: initialExercises[0]?.id || null,
      readiness: readinessSnapshot,
      timer: { status: 'running', startTime: Date.now(), accumulatedSeconds: 0 },
      // Seansın başlangıç saati kalıcı olarak saklanıyor: `timer` kaydederken
      // sıfırlandığı için saat bilgisi kayboluyordu ve günün saati ile
      // performans ilişkisi hiç kurulamıyordu.
      startedAt: new Date().toISOString(),
      rating: 4,
      notes: ''
    };
    // Gün vurgusu seansa taşınıyor: tekrar aralıklarını kaydıran şey bu alan
    // ve şablonda kalsaydı seansta hiçbir etkisi olmazdı.
    if (sessionTemplate?.emphasis && sessionTemplate.emphasis !== 'standard') {
      newWorkout.emphasis = sessionTemplate.emphasis;
    }
    if (sourceTemplateId) {
      newWorkout.sourceTemplateId = sourceTemplateId;
      const plannedTemplate = snapshotTemplatePlan(sessionTemplate);
      if (plannedTemplate) newWorkout.plannedTemplate = plannedTemplate;
    }
    if (useAdaptedPlan && adaptation.recommended) {
      newWorkout.adaptation = {
        mode: adaptation.mode.key,
        label: adaptation.mode.label,
        summary: adaptation.mode.summary,
        reasons: adaptation.reasons,
        ...adaptation.changes,
        source: adaptation.mode.key === 'consolidate' ? 'coach' : 'readiness',
        ...(activeCoachProtocol?.id ? { protocolId: activeCoachProtocol.id } : {}),
      };
    }

    setActiveWorkout(newWorkout);
    setSessionRestMuted(false);
    setPreWorkoutModal(null);

    if (initialExercises.length === 0) {
      setIsExerciseModalOpen(true);
    }

    // Ses motoru burada, kullanıcı hareketi içinde açılıyor. iOS
    // AudioContext'i yalnızca bir dokunma sırasında başlatıyor; sonradan
    // (dinlenme bitince) açmaya çalışmak sessizlikle sonuçlanıyordu.
    void primeRestAlert();

    // Müzik önceliği açıkken kart hiç başlatılmıyor: başlatmak, kullanıcının
    // dinlediği müziği kesmek demek ve bunu sessizce yapmak yanlış olurdu.
    if (settings.lockScreenActivity && !settings.musicPriority) {
      try {
        startLockScreenActivity({
          onYield: () => {
            setLockScreenOn(false);
            showToast('Müzik başladı, kilit ekranı kartı kapandı. Cihazda aynı anda tek medya kartı olabiliyor; kartı hep kapalı tutmak için Ayarlar → Müzik Önceliği.', 'warning', { duration: 7000 });
          },
          onPause: () => setActiveWorkout(p => p ? { ...p, timer: { ...p.timer, status: 'paused' } } : p),
          onResume: () => setActiveWorkout(p => p ? { ...p, timer: { ...p.timer, status: 'running', startTime: Date.now() } } : p)
        }).then(ok => setLockScreenOn(!!ok)).catch(() => setLockScreenOn(false));
      } catch {
        setLockScreenOn(false);
      }
    }
  };

  const confirmSaveWorkout = () => {
    if (!activeWorkout) return;
    let finalDuration = activeWorkout.duration;
    if (!finalDuration && activeWorkout.timer) {
      let secs = activeWorkout.timer.accumulatedSeconds || 0;
      if (activeWorkout.timer.status === 'running' && activeWorkout.timer.startTime) {
        secs += Math.floor((Date.now() - activeWorkout.timer.startTime) / 1000);
      }
      finalDuration = Math.max(1, Math.round(secs / 60));
    }

    const persistableWorkout = Object.fromEntries(Object.entries(activeWorkout)
      .filter(([key]) => key !== 'isEditingOld' && key !== 'activeExerciseId'));
    const bodyAtDate = bodyContextForDate(activeWorkout.date);
    const saved = {
      ...persistableWorkout,
      duration: finalDuration || 45,
      weightAtTime: parseNumber(activeWorkout.weightAtTime) || bodyAtDate.weight,
      bodyContextSnapshot: buildBodyContextSnapshot(bodyAtDate),
      timer: { status: 'finished' },
    };
    const existingIndex = workouts.findIndex(workout => workout.id === saved.id);
    const nextWorkouts = existingIndex >= 0
      ? workouts.map((workout, index) => index === existingIndex ? saved : workout)
      : [saved, ...workouts];
    setWorkouts(nextWorkouts);
    captureProgressionAfterWorkout(saved, nextWorkouts);

    // Şablon kullanım bilgisi yalnız gerçekten kaydedilen yeni seanslarda artar;
    // başlatıp vazgeçmek veya geçmiş bir kaydı düzenlemek istatistiği bozmaz.
    if (saved.sourceTemplateId && !activeWorkout.isEditingOld) {
      setTemplates(prev => markTemplateUsed(prev, saved.sourceTemplateId));
    }

    // Rapor kaydetmeden ÖNCEKİ geçmiş ve rekorlarla kuruluyor: bu seans
    // listeye girdikten sonra kıyaslansaydı hareket kendi kendisiyle
    // karşılaştırılır ve her fark sıfır çıkardı.
    setSessionReport(buildSessionReport(saved, sortedWorkouts.filter(w => w.id !== saved.id), {
      customExercises,
      previousRecords: buildPersonalRecords(workouts, saved.id, resolveSetLoad),
      resolveLoad: resolveSetLoad,
    }));

    stopLockScreenActivity();
    stopRest();
    setSessionRestMuted(false);
    setLockScreenOn(false);
    setActiveWorkout(null);
    setIsEndWorkoutModalOpen(false);
    showToast('Antrenman kaydedildi.');
  };

  const handleSaveMetrics = () => {
    if (!currentMetricsForm.date) { showToast('Önce bir tarih seç.'); return; }

    let updated = false;
    setMetricsHistory(prev => {
      const idx = prev.findIndex(m => m.date === currentMetricsForm.date);
      if (idx >= 0) {
        updated = true;
        const next = [...prev];
        // Mevcut kaydın kimliği korunur; aksi halde aynı güne ikinci bir kayıt
        // gibi davranıp geçmişteki referanslar kopardı.
        next[idx] = { ...currentMetricsForm, id: prev[idx].id };
        return next;
      }
      return [{ ...currentMetricsForm, id: currentMetricsForm.id || generateId() }, ...prev];
    });
    showToast(updated ? 'Ölçüm güncellendi.' : 'Ölçüm kaydedildi.');
  };

  // Geçmişteki bir ölçümü ölçüm sayfasında düzenlemeye açar.
  // Ölçüm tarihi değişince: o tarihte kayıt varsa yüklenir, yoksa en son
  // ölçümün değerleri yeni tarihle önden doldurulur. Vücut ölçüleri günden güne
  // çok değişmediği için her seferinde elle "son ölçümden doldur" demek
  // gereksiz bir adımdı.
  const handleMetricsDateChange = useCallback((date) => {
    const mevcut = metricsHistory.find(m => m.date === date);
    if (mevcut) return setCurrentMetricsForm(mergeMetrics(mevcut));

    const sonuncu = sortByDateDesc(metricsHistory)[0];
    setCurrentMetricsForm(prev => sonuncu
      ? { ...mergeMetrics(sonuncu), id: generateId(), date }
      : { ...prev, date });
  }, [metricsHistory, setCurrentMetricsForm]);

  const handleEditMetric = useCallback((metric) => {
    setCurrentMetricsForm(mergeMetrics(metric));
    setProgressTab('body');
    setView('progress');
    showToast('Ölçüm düzenleniyor.');
  }, [setCurrentMetricsForm, showToast]);

  // Geçmişteki bir beslenme kaydını beslenme sayfasında düzenlemeye açar.
  const handleEditNutrition = useCallback((entry) => {
    setCurrentNutritionForm(mergeNutrition(entry));
    setView('nutrition');
    showToast('Beslenme kaydı düzenleniyor.');
  }, [setCurrentNutritionForm, showToast]);

  const handleSaveNutrition = () => {
    const captured = captureEnergySnapshot(currentNutritionForm);
    const body = captured.body;
    const savedNutrition = {
      ...currentNutritionForm,
      weightAtTheTime: body.weight,
      bmrAtTheTime: body.bmr,
      maintenanceAtTheTime: captured.maintenanceAtDate,
      energySnapshot: captured.snapshot,
    };
    setNutritionHistory(prev => {
      const idx = prev.findIndex(n => n.date === currentNutritionForm.date);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedNutrition;
        return next;
      }
      return [savedNutrition, ...prev];
    });
    setCurrentNutritionForm(savedNutrition);
    showToast('Beslenme kaydedildi.');
  };

  const handleEditOldWorkoutDate = (workoutId, newDate) => {
    setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, date: newDate } : w));
  };

  // Geçmiş bir seansı düzenlemek için aktif antrenman ekranına yükler.
  // isEditingOld işaretiyle kronometre çalışmaz ve kilit ekranı kartı açılmaz;
  // kaydedildiğinde yeni kayıt eklenmez, mevcut kaydın üzerine yazılır.
  const handleEditOldWorkout = useCallback((workout) => {
    const copy = JSON.parse(JSON.stringify(workout));
    setActiveWorkout({
      ...copy,
      isEditingOld: true,
      activeExerciseId: copy.exercises?.[0]?.id || null,
      timer: {
        status: 'paused',
        startTime: null,
        accumulatedSeconds: Math.max(0, Math.round((copy.duration || 0) * 60))
      }
    });
    showToast('Geçmiş antrenman düzenleniyor.');
  }, [setActiveWorkout, showToast]);

  // Geçmiş bir seansı bugün için şablon olarak tekrarlar.
  const handleRepeatWorkout = useCallback((workout) => {
    setPreWorkoutModal({ template: workout });
  }, []);

  const handleAddHistoricalWorkout = useCallback((date) => {
    const id = generateId();
    setActiveWorkout({
      id,
      date,
      name: 'Geçmiş Antrenman',
      exercises: [],
      cardio: [],
      isEditingOld: true,
      manualEntry: true,
      activeExerciseId: null,
      timer: { status: 'paused', startTime: null, accumulatedSeconds: 0 },
      rating: 3,
      notes: '',
    });
    setIsExerciseModalOpen(true);
    showToast(`${formatDay(date, 'short')} için antrenman oluşturuluyor.`);
  }, [setActiveWorkout, showToast]);

  const handleAddHistoricalNutrition = useCallback((date) => {
    const existing = nutritionHistory.find(record => record.date === date);
    setCurrentNutritionForm(mergeNutrition(existing || { id: generateId(), date, manualEntry: true }));
    setView('nutrition');
    showToast(existing ? 'Bu günün beslenme kaydı düzenleniyor.' : 'Geçmiş beslenme kaydı oluşturuluyor.');
  }, [nutritionHistory, setCurrentNutritionForm, showToast]);

  const handleAddHistoricalMetric = useCallback((date) => {
    handleMetricsDateChange(date);
    setProgressTab('body');
    setView('progress');
    showToast(`${formatDay(date, 'short')} için ölçüm açıldı.`);
  }, [handleMetricsDateChange, showToast]);

  // --- SÜPERSET ---
  // Model olabildiğince basit: bir hareket, kendisinden SONRA gelen hareketle
  // eşleşir ve ikisi aynı supersetId'yi paylaşır. Bağı koparmak ikisini de
  // serbest bırakır. Üçlü/dörtlü grup gerekmediği için ayrı bir yapı kurulmadı.
  const handleToggleSuperset = useCallback((exerciseId) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const list = prev.exercises || [];
      const i = list.findIndex(e => e.id === exerciseId);
      if (i < 0) return prev;

      const current = list[i];

      // Zaten bağlıysa: aynı gruptaki tüm hareketleri serbest bırak.
      if (current.supersetId) {
        return {
          ...prev,
          exercises: list.map(e => e.supersetId === current.supersetId ? { ...e, supersetId: null } : e)
        };
      }

      const next = list[i + 1];
      if (!next || next.supersetId) return prev; // eşleşecek serbest hareket yok

      const groupId = generateId();
      return {
        ...prev,
        exercises: list.map((e, idx) =>
          idx === i || idx === i + 1 ? { ...e, supersetId: groupId } : e)
      };
    });
  }, [setActiveWorkout]);

  // --- ŞABLONLAR ---

  // Aktif veya geçmiş bir antrenmanı şablona çevirir.
  const handleSaveAsTemplate = useCallback((workout) => {
    const source = workout || activeWorkoutRef.current;
    if (!source) return;
    const suggested = source.name && source.name !== 'Serbest Antrenman'
      ? source.name
      : suggestTemplateName(source.exercises, customExercises);
    const template = workoutToTemplate(source, suggested, generateId);
    if (template.exercises.length === 0) {
      showToast('Şablon için en az bir dolu set gerekiyor.');
      return;
    }
    setTemplates(prev => [template, ...prev]);
    showToast(`"${suggested}" şablon olarak kaydedildi.`);
  }, [customExercises, setTemplates, showToast]);


  // --- HAREKET KAS EŞLEMESİ ---

  // Yerleşik hareketler de düzenlenebilir: kayıt customExercises içine aynı ADLA
  // yazılır, detectMuscleGroup önce oraya baktığı için yerleşik kuralı ezer.
  const handleSaveExerciseMapping = useCallback((name, { contributions, mechanics, setupNote }) => {
    const primary = Object.entries(contributions).sort((a, b) => b[1] - a[1])[0]?.[0];
    setCustomExercises(prev => {
      const rest = prev.filter(ex => (typeof ex === 'object' ? ex.name : ex) !== name);
      return [...rest, {
        name, contributions, muscle: primary, mechanics, schema: 2,
        ...(setupNote ? { setupNote } : {}),
      }];
    });
    setEditorExercise(null);
    showToast('Kaydedildi.');
  }, [setCustomExercises, showToast]);

  /**
   * Kas eşlemesini yerleşik kurala döndürür.
   *
   * Kurulum notu KORUNUYOR: not eşlemenin parçası değil, kullanıcının kendi
   * salon ayarı. Kaydı tümden silmek "varsayılana dön"e basan kullanıcının
   * sehpa yüksekliği notunu da sessizce siliyordu.
   */
  const handleResetExerciseMapping = useCallback((name) => {
    setCustomExercises(prev => prev.flatMap(ex => {
      const exName = typeof ex === 'object' ? ex.name : ex;
      if (exName !== name) return [ex];
      const not = typeof ex === 'object' ? ex.setupNote : '';
      return not ? [{ name, setupNote: not, schema: 2 }] : [];
    }));
    setEditorExercise(null);
    showToast('Varsayılan eşlemeye dönüldü.');
  }, [setCustomExercises, showToast]);

  // --- HAREKET KÜTÜPHANESİ ---

  const getExerciseContributions = useCallback(
    (name) => detectMuscleGroup(name, customExercises).contributions,
    [customExercises]);

  // Tek düğme iki listeyi birden yönetir: görünürse gizlenenlere, gizliyse
  // sabitlenenlere yazılır. Böylece hem "yaptım ama listede istemiyorum" hem de
  // "hiç yapmadım ama listede dursun" durumu tek dokunuşla kurulur.
  const handleTogglePickerVisibility = useCallback((name) => {
    setSettings(prev => {
      const hidden = new Set(prev.hiddenExercises || []);
      const pinned = new Set(prev.pinnedExercises || []);
      const wasVisible = !hidden.has(name) && (performedNames.has(name) || pinned.has(name));
      if (wasVisible) { hidden.add(name); pinned.delete(name); }
      else { hidden.delete(name); if (!performedNames.has(name)) pinned.add(name); }
      return { ...prev, hiddenExercises: [...hidden], pinnedExercises: [...pinned] };
    });
  }, [performedNames, setSettings]);

  const handleTogglePinnedExercise = useCallback((name) => {
    const wasPinned = (settings.pinnedExercises || []).includes(name);
    setSettings(prev => {
      const pinned = new Set(prev.pinnedExercises || []);
      const hidden = new Set(prev.hiddenExercises || []);
      if (pinned.has(name)) pinned.delete(name);
      else { pinned.add(name); hidden.delete(name); }
      return { ...prev, pinnedExercises: [...pinned], hiddenExercises: [...hidden] };
    });
    showToast(wasPinned ? 'Hareket sabitlemesi kaldırıldı.' : 'Hareket seçim listesine sabitlendi.');
  }, [settings.pinnedExercises, setSettings, showToast]);

  const handleDeleteExercise = useCallback((name) => {
    const index = customExercises.findIndex(ex => (typeof ex === 'object' ? ex.name : ex) === name);
    const record = customExercises[index];
    if (index < 0 || record === undefined) return;
    const visibility = {
      hiddenExercises: settings.hiddenExercises || [],
      pinnedExercises: settings.pinnedExercises || [],
    };
    setCustomExercises(prev => prev.filter(ex => (typeof ex === 'object' ? ex.name : ex) !== name));
    setSettings(prev => ({
      ...prev,
      hiddenExercises: (prev.hiddenExercises || []).filter(n => n !== name),
      pinnedExercises: (prev.pinnedExercises || []).filter(n => n !== name),
    }));
    showUndoToast(`"${name}" silindi. Geçmiş antrenman kayıtları korundu.`, () => {
      setCustomExercises(prev => {
        if (prev.some(ex => (typeof ex === 'object' ? ex.name : ex) === name)) return prev;
        const next = [...prev];
        next.splice(Math.max(0, Math.min(index, next.length)), 0, record);
        return next;
      });
      setSettings(prev => ({ ...prev, ...visibility }));
    });
  }, [customExercises, settings.hiddenExercises, settings.pinnedExercises, setCustomExercises, setSettings, showUndoToast]);

  // Program oluşturucu her dolu günü ayrı bir şablon yapar: uygulamanın şablon
  // modeli tek seanslık, program adı gün adının önüne eklenir.
  // Var olan şablonu günceller. Set sayısı değişse bile eski setlerin ağırlık ve
  // tekrar bilgisi korunur — şablonlar bir sonraki seansın başlangıç değerlerini
  // taşıyor, sıfırlamak kullanıcının girdiği veriyi çöpe atmak olurdu.
  const handleUpdateTemplate = useCallback((templateId, name, exercises, { emphasis } = {}) => {
    setTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      const oldByName = new Map((t.exercises || []).map(ex => [ex.name, ex.sets || []]));
      // Süperset bağları taslakta komşuluk bayrağı olarak duruyor; şablona
      // yazılırken gerçek kimliğe çevriliyor. 6.8'e kadar bu adım yoktu ve
      // şablonu düzenleyip kaydetmek bütün süpersetleri sessizce siliyordu.
      const supersetIds = draftSupersetIds(exercises, templateId);
      return {
        ...t,
        name: name || t.name,
        ...(emphasis && emphasis !== 'standard' ? { emphasis } : { emphasis: undefined }),
        // Kaydetmeden ÖNCEKİ hali geçmişe itiliyor. Şablonu düzenlemek 7.3'e
        // kadar geri alınamaz bir işlemdi: bir hareketi çıkarıp kaydeden
        // kullanıcı eski düzeni hatırlamak zorunda kalıyordu.
        versions: pushVersion(t.versions, t),
        exercises: exercises.map((ex, i) => {
          const old = oldByName.get(ex.name) || [];
          return {
            name: ex.name,
            supersetId: supersetIds[i],
            ...(ex.backup ? { backup: ex.backup } : {}),
            ...(ex.plannedTechnique ? { plannedTechnique: ex.plannedTechnique } : {}),
            ...(parseNumber(ex.repRange?.min) > 0 && parseNumber(ex.repRange?.max) > 0
              ? { repRange: { min: parseNumber(ex.repRange.min), max: parseNumber(ex.repRange.max) } }
              : {}),
            sets: Array.from({ length: ex.sets }, (_, i2) => old[i2]
              ? { ...old[i2], id: old[i2].id || generateId() }
              : { id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal' }),
          };
        }),
      };
    }));
    showToast('Şablon güncellendi.');
  }, [setTemplates, showToast]);

  /** Şablonu daha önceki bir sürümüne döndürür. */
  const handleRestoreTemplateVersion = useCallback((templateId, index) => {
    setTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      const surum = (t.versions || [])[index];
      if (!surum) return t;
      const geri = restoreVersion(t, surum, generateId);
      if (!geri) return t;
      // Geri dönmek de bir değişiklik: mevcut hal geçmişe yazılıyor ki
      // "geri aldım ama yeni halini de kaybetmek istemiyorum" mümkün olsun.
      return { ...geri, versions: pushVersion(t.versions, t, { label: 'geri alma öncesi' }) };
    }));
    showToast('Şablon önceki sürüme döndürüldü.');
  }, [setTemplates, showToast]);

  // --- Hareket birleştirme -------------------------------------------------
  // Elle eklenen hareket ile kütüphaneye sonradan giren aynı hareket iki ayrı
  // kayıt olarak yaşıyordu: rekorlar bölünüyor, hacim eğrisi kopuyordu.
  const mergeCandidates = useMemo(
    () => findMergeCandidates(customExercises, sortedWorkouts),
    [customExercises, sortedWorkouts]);

  const mergePreviewFor = useCallback((loser, winner) => previewExerciseMerge(loser, winner, {
    workouts: sortedWorkouts, templates, settings, activeWorkout,
  }), [sortedWorkouts, templates, settings, activeWorkout]);

  const handleMergeExercises = useCallback((loser, winner) => {
    const sonuc = applyExerciseMerge(loser, winner, {
      workouts, templates, customExercises, settings, activeWorkout,
    });
    if (!sonuc) return;

    // Geri alma için YALNIZCA değişen koleksiyonların eski hali saklanıyor;
    // dokunulmamış bir koleksiyonu geri yazmak, birleştirmeden sonra yapılmış
    // başka bir değişikliği ezerdi.
    const oncekiler = {
      workouts: sonuc.workouts ? workouts : null,
      templates: sonuc.templates ? templates : null,
      customExercises: sonuc.customExercises ? customExercises : null,
      settings: sonuc.settings ? settings : null,
      activeWorkout: sonuc.activeWorkout ? activeWorkout : null,
    };

    if (sonuc.workouts) setWorkouts(sonuc.workouts);
    if (sonuc.templates) setTemplates(sonuc.templates);
    if (sonuc.customExercises) setCustomExercises(sonuc.customExercises);
    if (sonuc.settings) setSettings(sonuc.settings);
    if (sonuc.activeWorkout) setActiveWorkout(sonuc.activeWorkout);

    showUndoToast(`"${loser}" → "${winner}" birleştirildi.`, () => {
      if (oncekiler.workouts) setWorkouts(oncekiler.workouts);
      if (oncekiler.templates) setTemplates(oncekiler.templates);
      if (oncekiler.customExercises) setCustomExercises(oncekiler.customExercises);
      if (oncekiler.settings) setSettings(oncekiler.settings);
      if (oncekiler.activeWorkout) setActiveWorkout(oncekiler.activeWorkout);
    });
  }, [workouts, templates, customExercises, settings, activeWorkout,
    setWorkouts, setTemplates, setCustomExercises, setSettings, setActiveWorkout, showUndoToast]);

  /**
   * Şablondaki bir hareketi YERİNDE değiştirir.
   *
   * Sırası, set sayısı ve süperset bağı korunuyor — çıkarıp yeniden eklemek
   * üçünü de bozuyordu. Setlerin ağırlık ve tekrar değerleri SIFIRLANIYOR:
   * başka bir hareketin yükünü yeni harekete taşımak, bir sonraki seansta
   * yanlış bir başlangıç değeri önermek olurdu.
   */
  const handleReplaceTemplateExercise = useCallback((templateId, oldName, newName) => {
    if (!templateId || !oldName || !newName || oldName === newName) return;
    setTemplates(prev => prev.map(t => {
      if (t.id !== templateId) return t;
      return {
        ...t,
        exercises: (t.exercises || []).map(ex => (ex.name !== oldName ? ex : {
          ...ex,
          name: newName,
          sets: (ex.sets || []).map(set => ({
            ...set, id: set.id || generateId(), weight: '', reps: '',
          })),
        })),
      };
    }));
    showToast(`${oldName} → ${newName}`);
  }, [setTemplates, showToast]);

  /**
   * Şablonda planlanmış yedek harekete geçer.
   *
   * `handleSubstituteExercise`'ten farkı: yedek zaten şablonda yazılı olduğu
   * için ikame ekranı açılmıyor, tek dokunuşla geçiliyor. Girilmiş setler
   * KORUNUYOR ama ağırlık ve tekrar temizleniyor — başka bir hareketin yükünü
   * yeni harekete taşımak yanlış bir başlangıç değeri olurdu.
   */
  /** Hareketin çalışma ağırlığına göre ısınma merdiveni ekler. */
  const handleAddWarmup = useCallback((exerciseId) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const hedef = (prev.exercises || []).find(e => e.id === exerciseId);
      if (!hedef) return prev;
      const gecmis = getRecentExerciseData(hedef.name);
      const merdiven = buildWarmupLadder(hedef, {
        history: gecmis,
        barWeight: 20,
        plates: settings.availablePlates,
        customExercises,
      });
      if (!merdiven?.steps?.length) {
        // Sebep söyleniyor: sessizce hiçbir şey yapmamak "düğme bozuk" gibi
        // görünürdü.
        showToast(merdiven?.reason === 'no-target'
          ? 'Isınma için önce çalışma ağırlığı gerekiyor.'
          : merdiven?.reason === 'existing'
            ? 'Bu harekette zaten ısınma seti var.'
            : 'Bu yük için ısınma merdiveni çıkmıyor.', 'warning');
        return prev;
      }
      return {
        ...prev,
        exercises: prev.exercises.map(ex => (ex.id === exerciseId
          ? applyWarmupLadder(ex, merdiven, generateId)
          : ex)),
      };
    });
  }, [setActiveWorkout, getRecentExerciseData, settings.availablePlates, customExercises, showToast]);

  const handleRemoveWarmup = useCallback((exerciseId) => {
    setActiveWorkout(prev => (prev ? {
      ...prev,
      exercises: prev.exercises.map(ex => (ex.id === exerciseId ? removeWarmupSets(ex) : ex)),
    } : prev));
  }, [setActiveWorkout]);

  const handleSetExerciseNote = useCallback((exerciseId, text) => {
    setActiveWorkout(prev => (prev ? {
      ...prev,
      exercises: prev.exercises.map(ex => (ex.id === exerciseId ? setExerciseNote(ex, text) : ex)),
    } : prev));
  }, [setActiveWorkout]);

  /** Setin tarafını döndürür: yok → sol → sağ → yok. */
  const handleSetSide = useCallback((exerciseId, setId) => {
    setActiveWorkout(prev => (prev ? {
      ...prev,
      exercises: prev.exercises.map(ex => (ex.id !== exerciseId ? ex : {
        ...ex,
        sets: (ex.sets || []).map(st => {
          if (st.id !== setId) return st;
          const sonraki = st.side === 'left' ? 'right' : st.side === 'right' ? undefined : 'left';
          if (!sonraki) { const { side: _cikan, ...kalan } = st; return kalan; }
          return { ...st, side: sonraki };
        }),
      })),
    } : prev));
  }, [setActiveWorkout]);

  const pastNotesForExercise = useCallback(
    (name) => notesFor(name, sortedWorkouts, { excludeWorkoutId: activeWorkout?.id }),
    [sortedWorkouts, activeWorkout?.id]);

  const sessionVolumeReport = useMemo(
    () => buildSessionVolume(activeWorkout, sortedWorkouts, {
      customExercises,
      experienceLevel: settings.experienceLevel,
    }),
    [activeWorkout, sortedWorkouts, customExercises, settings.experienceLevel, settings.volumeTargets]);

  // --- Hayalet seans: geçen seferle canlı yarış -------------------------
  const ghost = useMemo(
    () => pickGhost(activeWorkout, sortedWorkouts),
    [activeWorkout, sortedWorkouts]);

  const ghostRace = useMemo(
    () => (ghost ? buildGhostRace(activeWorkout, ghost.workout, { resolveLoad: resolveSetLoad }) : null),
    [activeWorkout, ghost, resolveSetLoad]);

  const ghostTargetForSet = useCallback(
    (name, index) => (ghost ? ghostTargetFor(name, index, ghost.workout, { resolveLoad: resolveSetLoad }) : null),
    [ghost, resolveSetLoad]);

  /**
   * Zaman sıkışması: seansı verilen dakikaya sığdır.
   *
   * Değişiklik doğrudan uygulanmıyor; önce ne olacağı gösteriliyor ve
   * kullanıcı onaylıyor. Sessizce hareket silen bir düğme, neyi kaybettiğini
   * bilmemek demekti.
   */
  const [timeCrunchPlan, setTimeCrunchPlan] = useState(null);

  const previewTimeCrunch = useCallback((minutes) => {
    if (!activeWorkout?.exercises?.length) return;
    const sonuc = planTimeCrunch(activeWorkout.exercises, minutes, {
      restSeconds: settings.restSeconds,
      customExercises,
    });
    setTimeCrunchPlan({ ...sonuc, summary: describeTimeCrunch(sonuc) });
  }, [activeWorkout, settings.restSeconds, customExercises]);

  const applyTimeCrunch = useCallback(() => {
    if (!timeCrunchPlan?.plan) return;
    setActiveWorkout(prev => (prev ? { ...prev, exercises: timeCrunchPlan.plan } : prev));
    showToast(timeCrunchPlan.summary || 'Seans kısaltıldı.');
    setTimeCrunchPlan(null);
  }, [timeCrunchPlan, setActiveWorkout, showToast]);

  const handleUseBackupExercise = useCallback((exerciseId, backupName) => {
    if (!exerciseId || !backupName) return;
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const hedef = (prev.exercises || []).find(e => e.id === exerciseId);
      if (!hedef) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => (ex.id !== exerciseId ? ex : {
          ...ex,
          name: backupName,
          // Geri dönebilmek için asıl hareket yedek olarak yazılıyor.
          backup: ex.name,
          sets: (ex.sets || []).map(set => ({ ...set, weight: '', reps: '' })),
        })),
      };
    });
    showToast(`Yedek harekete geçildi: ${backupName}`);
  }, [setActiveWorkout, showToast]);

  const handleSaveProgram = useCallback((programName, days, { createWeekPlan = true } = {}) => {
    const installation = instantiateDraftProgram(programName, days, generateId);
    if (!installation?.templates.length) return;
    setTemplates(prev => [...installation.templates, ...prev]);
    if (createWeekPlan) {
      setSettings(prev => ({
        ...prev,
        weekPlans: [...(prev.weekPlans || []), installation.plan],
        activePlanId: installation.plan.id,
      }));
    }
    showToast(createWeekPlan
      ? `${installation.templates.length} günlük "${programName}" kaydedildi ve aktif program yapıldı.`
      : `${installation.templates.length} şablon kaydedildi.`);
  }, [setSettings, setTemplates, showToast]);

  const closeExercisePicker = useCallback(() => {
    setIsExerciseModalOpen(false);
    setIsAddingCustom(false);
    setNewCustomExercise('');
    setNewExContribs({});
    setExerciseSearchQuery('');
    if (pickerReturnsToLibrary) {
      setPickerReturnsToLibrary(false);
      setIsLibraryOpen(true);
    }
  }, [pickerReturnsToLibrary]);

  /**
   * Bir günün uyku/zihin kaydını günceller.
   *
   * Kayıt yoksa o anda üretilir: kullanıcı tarihi seçip doğrudan yazmaya
   * başlayabilsin diye önce "gün oluştur" adımı istenmiyor.
   */
  const handleUpdateWellnessDay = useCallback((date, updater) => {
    setWellness(prev => {
      const mevcut = prev.find(r => r.date === date);
      const taban = mevcut || emptyWellnessDay(date, generateId());
      const yeni = updater(taban);
      return mevcut
        ? prev.map(r => r.date === date ? yeni : r)
        : [...prev, yeni];
    });
  }, [setWellness]);

  const handleUpdateCycleDay = useCallback((date, updater) => {
    setCycleHistory(prev => {
      const existing = prev.find(record => record.date === date);
      const base = existing || emptyCycleDay(date, generateId);
      const next = mergeCycleDay(updater(base), generateId);
      return existing
        ? prev.map(record => record.date === date ? next : record)
        : [...prev, next];
    });
  }, [setCycleHistory]);

  const handleDeleteCycleDay = useCallback((date) => {
    const record = cycleHistory.find(item => item.date === date);
    if (!record) return;
    const snapshot = removeById(cycleHistory, record.id);
    setCycleHistory(snapshot.next);
    showUndoToast('Döngü kaydı silindi.', () => {
      setCycleHistory(prev => restoreAtIndex(prev, snapshot));
    });
  }, [cycleHistory, setCycleHistory, showUndoToast]);

  const handleExportData = () => {
    const backup = createBackupPayload({
      workouts, templates, customExercises, customFoods, recentFoods,
      mealTemplates, dayTemplates,
      metricsHistory, nutritionHistory, wellness, cycleHistory, settings
    }, { version: pkg.version });
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProOverload_Backup_${getLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const today = getLocalDateString();
    setLastBackupDate(today);
    // Yedek tarihi yazılamazsa yalnızca "yedekleme uyarısı" erken görünür;
    // dosya zaten indi, bu yüzden hata kullanıcıya ayrıca bildirilmiyor.
    dataRepository.writeRaw('po_last_backup', today);
    showToast('Yedek indirildi.');
  };

  const handleImportFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const input = e.currentTarget;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        handleImportRequest(data, { fileName: file.name });
      } catch {
        showToast('Yedek dosyası okunamadı.', 'error');
      }
    };
    reader.onerror = () => showToast('Yedek dosyasına erişilemedi.', 'error');
    reader.onloadend = () => { input.value = ''; };
    reader.readAsText(file);
  };

  const handleImportRequest = (data, { fileName = 'Cihaz aktarım kodu' } = {}) => {
    const migrated = migrateBackupPayload(data);
    const inspection = inspectBackupPayload(migrated.payload);
    if (!inspection.valid) {
      showToast(inspection.errors[0] || 'Geçerli ProOverload verisi bulunamadı.', 'error');
      return false;
    }
    setPendingImport({ data: migrated.payload, inspection, fileName, migrations: migrated.applied });
    return true;
  };

  const applyPendingImport = (mode = 'merge') => {
    if (!pendingImport?.data) return;
    const data = pendingImport.data;
    const before = {
      workouts, templates, customExercises, customFoods, recentFoods,
      mealTemplates, dayTemplates,
      metricsHistory, nutritionHistory, wellness, cycleHistory, settings,
    };
    const merge = mode === 'merge';

    // Antrenman ve şablonlar da ölçüm/beslenme gibi normalize edilir: bozuk
    // şekilli bir yedek (örn. `workouts: [{}]`) doğrudan state'e girerse
    // aşağıdaki hacim/tonaj hesapları eksik alanlarla çalışmak zorunda kalır.
    const importedWorkouts = backupValue(data, 'workouts', 'w');
    if (Array.isArray(importedWorkouts)) {
      const normalized = importedWorkouts.map(mergeWorkout);
      setWorkouts(merge ? mergeImportedRecords(workouts, normalized) : normalized);
    }
    const importedTemplates = backupValue(data, 'templates', 't');
    if (Array.isArray(importedTemplates)) {
      const normalized = importedTemplates.map(mergeTemplate);
      setTemplates(merge ? mergeImportedRecords(templates, normalized) : normalized);
    }
    // Sürüm damgasına değil şekle bakılır: göç idempotent olduğu için yeni
    // yedekler dokunulmadan geçer, eski yedekler taşınır.
    // Birleştirme modunda yerel kayıtlar silinmez; aynı isimde yedek kazanır.
    if (Array.isArray(data.customExercises)) {
      const incoming = migrateCustomExercises(data.customExercises);
      const keyOf = ex => foldForSearch(typeof ex === 'object' ? ex.name : ex);
      setCustomExercises(merge ? mergeImportedRecords(customExercises, incoming, keyOf) : incoming);
    }
    if (Array.isArray(data.customFoods)) {
      const incoming = data.customFoods.filter(food => food && typeof food.name === 'string');
      setCustomFoods(merge
        ? mergeImportedRecords(customFoods, incoming, food => foldForSearch(food?.name))
        : incoming);
    }
    if (Array.isArray(data.recentFoods)) {
      const incoming = data.recentFoods.filter(f => f && typeof f.name === 'string').slice(0, 8);
      setRecentFoods(merge
        ? mergeImportedRecords(recentFoods, incoming, food => foldForSearch(food?.name)).slice(0, 8)
        : incoming);
    }
    if (Array.isArray(data.mealTemplates)) {
      const incoming = data.mealTemplates.filter(item => item && typeof item === 'object');
      setMealTemplates(merge
        ? mergeImportedRecords(mealTemplates, incoming)
        : incoming);
    }
    if (Array.isArray(data.dayTemplates)) {
      const incoming = data.dayTemplates.filter(item => item && typeof item === 'object');
      setDayTemplates(merge
        ? mergeImportedRecords(dayTemplates, incoming)
        : incoming);
    }
    const importedMetrics = backupValue(data, 'metricsHistory', 'm');
    if (Array.isArray(importedMetrics)) {
      const normalized = importedMetrics.map(mergeMetrics);
      setMetricsHistory(merge
        ? mergeImportedRecords(metricsHistory, normalized, record => record?.date || record?.id)
        : normalized);
    }
    const importedNutrition = backupValue(data, 'nutritionHistory', 'n');
    if (Array.isArray(importedNutrition)) {
      const importedSettings = data.settings || data.s || {};
      const resetImportedDayNeat = Number(importedSettings.dayNeatModelVersion) < 1;
      const normalized = importedNutrition
        .map(entry => mergeNutrition(resetImportedDayNeat ? resetDayNeatOverride(entry) : entry));
      setNutritionHistory(merge
        ? mergeImportedRecords(nutritionHistory, normalized, record => record?.date || record?.id)
        : normalized);
    }
    if (Array.isArray(data.wellness)) {
      const normalized = data.wellness
        .map(day => mergeWellnessDay(day, generateId))
        .filter(day => day.date);
      setWellness(merge
        ? mergeImportedRecords(wellness, normalized, record => record?.date || record?.id)
        : normalized);
    }
    if (Array.isArray(data.cycleHistory)) {
      const normalized = data.cycleHistory
        .map(day => mergeCycleDay(day, generateId))
        .filter(day => day.date);
      setCycleHistory(merge
        ? mergeImportedRecords(cycleHistory, normalized, record => record?.date || record?.id)
        : normalized);
    }
    // Eski yedekler eksik/bozuk ayar taşıyabilir; aynı birleştirme kuralından geçirilir.
    const importedSettings = backupValue(data, 'settings', 's');
    if (importedSettings) setSettings(merge
      ? mergeSettings({ ...settings, ...importedSettings })
      : mergeSettings(importedSettings));

    const summary = backupImportSummary(pendingImport.inspection);
    setPendingImport(null);
    showUndoToast(
      `${merge ? 'Yedek birleştirildi' : 'Veriler yedekle değiştirildi'}: ${summary}.`,
      () => {
        setWorkouts(before.workouts);
        setTemplates(before.templates);
        setCustomExercises(before.customExercises);
        setCustomFoods(before.customFoods);
        setRecentFoods(before.recentFoods);
        setMealTemplates(before.mealTemplates);
        setDayTemplates(before.dayTemplates);
        setMetricsHistory(before.metricsHistory);
        setNutritionHistory(before.nutritionHistory);
        setWellness(before.wellness);
        setCycleHistory(before.cycleHistory);
        setSettings(before.settings);
      },
      12000,
    );
  };

  const handleDeleteConfirmExecute = () => {
    const { type, id } = deleteConfirm;
    if (!type || !id) return;

    if (type === 'template') {
      const snapshot = removeById(templates, id);
      if (!snapshot.record) return;
      const planSnapshot = {
        weekPlan: settings.weekPlan || {},
        weekPlans: settings.weekPlans || [],
      };
      setTemplates(snapshot.next);
      // Plana atanmış şablon silinirse o gün dinlenmeye döner, yoksa plan
      // var olmayan bir kimliği gösterip boş kalırdı.
      setSettings(prev => {
        const plan = prev.weekPlan || {};
        const next = {};
        Object.entries(plan).forEach(([k, v]) => { next[k] = v === id ? null : v; });
        return {
          ...prev,
          weekPlan: next,
          weekPlans: removeTemplateFromPlans(prev.weekPlans, id),
        };
      });
      setDeleteConfirm({ isOpen: false, type: null, id: null });
      showUndoToast('Şablon silindi.', () => {
        setTemplates(prev => restoreAtIndex(prev, snapshot));
        setSettings(prev => ({ ...prev, ...planSnapshot }));
      });
      return;
    }

    if (type === 'exercise') {
      handleDeleteExercise(id);
      setDeleteConfirm({ isOpen: false, type: null, id: null });
      return;
    }

    if (type === 'cardio') {
      const [workoutId, cardioId] = String(id).split('::');
      const removed = removeCardioEntry(workouts, workoutId, cardioId);
      if (!removed.snapshot) return;
      setWorkouts(removed.next);
      setDeleteConfirm({ isOpen: false, type: null, id: null });
      showUndoToast('Kardiyo kaydı silindi.', () => {
        setWorkouts(prev => restoreCardioEntry(prev, removed.snapshot));
      });
      return;
    }

    const source = type === 'workout'
      ? workouts
      : type === 'metric'
        ? metricsHistory
        : type === 'nutrition'
          ? nutritionHistory
          : [];
    const snapshot = removeById(source, id);
    if (!snapshot.record) return;

    if (type === 'workout') setWorkouts(snapshot.next);
    else if (type === 'metric') setMetricsHistory(snapshot.next);
    else if (type === 'nutrition') setNutritionHistory(snapshot.next);

    setDeleteConfirm({ isOpen: false, type: null, id: null });
    showUndoToast('Kayıt silindi.', () => {
      if (type === 'workout') setWorkouts(prev => restoreAtIndex(prev, snapshot));
      else if (type === 'metric') setMetricsHistory(prev => restoreAtIndex(prev, snapshot));
      else if (type === 'nutrition') setNutritionHistory(prev => restoreAtIndex(prev, snapshot));
    });
  };

  // Geçmiş bir beslenme kaydının tek alanını günceller (yakılan kalori gibi).
  // Kaydın tamamını forma yüklemeye gerek kalmıyor.
  const handleUpdateNutritionField = useCallback((id, patch) => {
    const energyFields = [
      'activeCaloriesOut', 'steps', 'neatModeOverride', 'activityLevelOverride',
      'neatManualOverride', 'neatMultiplier',
    ];
    const changesEnergy = energyFields.some(field => Object.prototype.hasOwnProperty.call(patch, field));
    const normalizedPatch = changesEnergy ? { ...patch, energySnapshot: null } : patch;
    setNutritionHistory(prev => prev.map(n => n.id === id ? { ...n, ...normalizedPatch } : n));
    // Düzenlenen gün açıkta duran form ile aynıysa form da güncellenmeli,
    // yoksa kaydet düğmesi eski değeri geri yazar.
    setCurrentNutritionForm(prev => {
      const target = prev && nutritionHistory.find(n => n.id === id);
      return target && target.date === prev.date ? { ...prev, ...normalizedPatch } : prev;
    });
  }, [nutritionHistory, setCurrentNutritionForm, setNutritionHistory]);

  /**
   * Bir güne özel günlük hareket (NEAT) çarpanı yazar.
   *
   * Değer beslenme kaydında tutuluyor çünkü gün bazlı diğer enerji alanları
   * (adım, elle eklenen kalori) da orada. O tarihe henüz kayıt yoksa boş bir
   * kayıt açılıyor — kullanıcı sırf çarpan girmek için önce beslenme yazmak
   * zorunda kalmasın.
   */
  const handleSetDayNeat = useCallback((date, updates) => {
    const rawPatch = typeof updates === 'object' && updates !== null ? updates : { neatMultiplier: updates };
    const mode = ['auto', 'level', 'steps', 'manual'].includes(rawPatch.neatModeOverride)
      ? rawPatch.neatModeOverride
      : '';
    // Tek-gün kaydı yalnız açıkça seçilmiş alanları taşır. "Genel"e dönünce
    // önceki manuel kcal/seviye artık gizlice kayıtta kalmaz.
    const patch = {
      neatModeOverride: mode,
      activityLevelOverride: mode === 'level' ? (rawPatch.activityLevelOverride || '') : '',
      neatManualOverride: mode === 'manual' ? (rawPatch.neatManualOverride || '') : '',
      neatMultiplier: parseNumber(rawPatch.neatMultiplier) > 0 ? parseNumber(rawPatch.neatMultiplier) : '',
      energySnapshot: null,
    };
    setNutritionHistory(prev => {
      const idx = prev.findIndex(n => n.date === date);
      let next;
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...next[idx], ...patch };
      } else {
        next = [mergeNutrition({ date, ...patch }), ...prev];
      }
      return next;
    });
    setCurrentNutritionForm(prev =>
      prev?.date === date ? { ...prev, ...patch } : prev);
  }, [setCurrentNutritionForm, setNutritionHistory]);

  const handleNutritionDateChange = (date) => {
    const existing = nutritionHistory.find(n => n.date === date);
    if (existing) setCurrentNutritionForm(mergeNutrition(existing));
    else setCurrentNutritionForm(mergeNutrition({ date: date }));
  };

  // Beslenme sekmesi her zaman bugünle açılır. Geçmiş bir günü Geçmiş
  // bölümünden düzenledikten sonra sekmeye dönünce eski günde takılı kalmasın.
  const handleChangeView = useCallback((next) => {
    const currentScroller = document.querySelector(`[data-view-scroll="${view}"]`);
    if (currentScroller) {
      viewScrollPositionsRef.current.set(view, currentScroller.scrollTop);
      rememberScrollPosition(view, currentScroller.scrollTop);
    }
    preloadView(next);
    beginViewTransition(() => {
      if (next === 'nutrition') {
        const today = getLocalDateString();
        setCurrentNutritionForm(prev => {
          if (prev.date === today) return prev;
          const existing = nutritionHistory.find(n => n.date === today);
          return mergeNutrition(existing || { date: today });
        });
      }
      setView(next);
    });
  }, [beginViewTransition, nutritionHistory, setCurrentNutritionForm, view]);

  // Dinamik ekran henüz inmemişse birkaç kare bekle. Konum yalnız bellekte
  // tutulur; uygulamayı yeni açan kullanıcı eski bir kaydın ortasına düşmez.
  useLayoutEffect(() => {
    let frameId;
    let retryTimer;
    let attempts = 0;
    const restore = () => {
      const scroller = document.querySelector(`[data-view-scroll="${view}"]`);
      if (scroller) {
        const remembered = viewScrollPositionsRef.current.get(view) || 0;
        const restored = storedScrollPosition(view, remembered);
        scroller.scrollTop = restored;
        attempts += 1;
        // Tembel bölümler henüz gerçek yüksekliğine ulaşmadıysa tarayıcı
        // scrollTop değerini geçici maksimuma kırpar. İçerik yerleşirken 50 ms
        // aralıkla yeniden dene; bu, her kare DOM yazmaktan daha ucuzdur.
        if (restored > 0 && Math.abs(scroller.scrollTop - restored) > 1 && attempts < 100) {
          retryTimer = window.setTimeout(restore, 50);
        }
        return;
      }
      attempts += 1;
      if (attempts < 120) frameId = window.requestAnimationFrame(restore);
    };
    frameId = window.requestAnimationFrame(restore);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(retryTimer);
    };
  }, [view]);

  const handleGlobalNavigate = useCallback((next, subTab) => {
    if (next === 'progress' && subTab) setProgressTab(subTab);
    if (next === 'history' && subTab) setHistoryTab(subTab);
    handleChangeView(next);
  }, [handleChangeView]);

  const handleQuickCapture = useCallback((key) => {
    const today = getLocalDateString();
    const action = {
      workout: () => handleStartRequest(),
      nutrition: () => { handleChangeView('nutrition'); setIsFoodSearchOpen(true); },
      cardio: () => { setCardioContext(null); setIsCardioOpen(true); },
      metrics: () => handleAddHistoricalMetric(today),
      sleep: () => { setWellnessTab('sleep'); setIsWellnessOpen(true); },
      mind: () => { setWellnessTab('mind'); setIsWellnessOpen(true); },
      energy: () => setIsEnergyDetailOpen(true),
      plan: () => setIsWeekPlanOpen(true),
    }[key];
    action?.();
  }, [handleStartRequest, handleChangeView, handleAddHistoricalMetric]);

  // --- KARDİYO ---
  const {
    latestWeight,
    bodyContextForDate,
    dayCaloriesFor,
    avgDailyExercise,
    maintenanceCalories,
    estimatedTefMacros,
    neatOpts,
    captureEnergySnapshot,
    energyForNutritionRecord,
  } = useHistoricalEnergy({
    metricsHistory,
    sortedMetrics,
    currentMetricsForm,
    computedComp,
    workouts,
    wellness,
    nutritionHistory,
    adaptiveTDEE,
    settings,
  });

  // Teorik hesaplar AKTİF programı kullanır: kullanıcı birden fazla program
  // tutabiliyor ama ana ekranda görünen hafta yıldızladığı olan.
  const activePlan = useMemo(
    () => findPlan(settings.weekPlans || [], settings.activePlanId),
    [settings.weekPlans, settings.activePlanId]);

  const weekPlanResult = useMemo(() => computeWeekPlan(activePlan || {}, templates, {
    customExercises,
    restSeconds: settings.restSeconds,
    experienceLevel: settings.experienceLevel,
    weightKg: latestWeight,
    workouts,
  }), [activePlan, settings.restSeconds, settings.experienceLevel, settings.volumeTargets,
    templates, customExercises, latestWeight, workouts]);

  const weekPlanDays = weekPlanResult.days;

  // Bugün için planlanmış kardiyo: kardiyo ekranında tek dokunuşla yüklenip
  // gerçekleşen tempoyla karşılaştırılabilsin diye çıkarılıyor.
  const todayPlannedCardio = useMemo(() => {
    // getDay() pazar=0 verirken plan pazartesi ile başlıyor.
    const gunler = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const bugun = gunler[new Date().getDay()];
    return weekPlanDays.find(day => day.key === bugun)?.cardios || [];
  }, [weekPlanDays]);

  // Aktif antrenman varsa oraya yazılır; yoksa bugünün kardiyo kaydına eklenir
  // (yoksa oluşturulur), böylece basketbol/koşu için seans başlatmak gerekmez.
  const handleAddCardio = useCallback((entry) => {
    const today = getLocalDateString();
    const item = { id: generateId(), ...entry, weightAtTime: entry.weightAtTime || bodyContextForDate(today).weight };
    if (activeWorkoutRef.current) {
      setActiveWorkout(prev => prev ? { ...prev, cardio: [...(prev.cardio || []), item] } : prev);
      showToast('Kardiyo antrenmana eklendi.');
      return;
    }
    setWorkouts(prev => {
      const idx = prev.findIndex(w => w.date === today && (w.exercises || []).length === 0 && w.cardio);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cardio: [...(next[idx].cardio || []), item] };
        return next;
      }
      return [{
        id: generateId(), date: today, name: 'Kardiyo', duration: 0,
        exercises: [], cardio: [item], timer: { status: 'finished' },
      }, ...prev];
    });
    showToast('Kardiyo bugüne kaydedildi.');
  }, [showToast, bodyContextForDate, setActiveWorkout, setWorkouts]);

  const handleOpenHistoricalCardio = useCallback((date) => {
    setCardioContext({ date });
    setIsCardioOpen(true);
  }, []);

  const handleEditCardio = useCallback((record) => {
    setCardioContext({
      date: record.date,
      workoutId: record.workoutId,
      entry: record.cardio,
    });
    setIsCardioOpen(true);
  }, []);

  const handleSaveCardio = useCallback((payload) => {
    const date = payload.date || cardioContext?.date || getLocalDateString();
    const entryFields = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== 'date'));
    const item = {
      ...cardioContext?.entry,
      ...entryFields,
      id: cardioContext?.entry?.id || entryFields.id || generateId(),
      weightAtTime: cardioContext?.entry?.weightAtTime || bodyContextForDate(date).weight,
      ...(cardioContext || date !== getLocalDateString() ? { manualEntry: true } : {}),
    };

    if (!cardioContext && date === getLocalDateString()) {
      handleAddCardio(item);
      return;
    }

    setWorkouts(prev => {
      const sourceId = cardioContext?.workoutId;
      const sourceDate = cardioContext?.date;
      if (sourceId && sourceDate === date) {
        return prev.map(workout => workout.id === sourceId
          ? { ...workout, cardio: (workout.cardio || []).map(cardio => cardio.id === item.id ? item : cardio) }
          : workout);
      }

      let next = sourceId
        ? prev
          .map(workout => workout.id === sourceId
            ? { ...workout, cardio: (workout.cardio || []).filter(cardio => cardio.id !== item.id) }
            : workout)
          .filter(workout => (workout.exercises || []).length > 0 || (workout.cardio || []).length > 0)
        : [...prev];

      const destination = next.findIndex(workout =>
        workout.date === date && (workout.exercises || []).length === 0 && Array.isArray(workout.cardio));
      if (destination >= 0) {
        next = [...next];
        next[destination] = { ...next[destination], cardio: [...(next[destination].cardio || []), item] };
        return next;
      }
      return [{
        id: generateId(), date, name: 'Kardiyo', duration: 0,
        exercises: [], cardio: [item], manualEntry: true, timer: { status: 'finished' },
      }, ...next];
    });
    showToast(cardioContext?.entry ? 'Kardiyo kaydı güncellendi.' : 'Geçmiş kardiyo kaydedildi.');
  }, [cardioContext, handleAddCardio, showToast, bodyContextForDate, setWorkouts]);

  const handleDeleteCardio = useCallback((entryId) => {
    if (activeWorkoutRef.current) {
      setActiveWorkout(prev => prev ? { ...prev, cardio: (prev.cardio || []).filter(c => c.id !== entryId) } : prev);
      return;
    }
    // Geçmiş bir güne kayıt eklenirken silme de o güne uygulanmalı; sabit
    // "bugün" varsayımı, geçmiş güne yanlış eklenen girdiyi silinemez yapıyordu.
    const hedefTarih = cardioContext?.date || getLocalDateString();
    setWorkouts(prev => prev
      .map(w => w.date === hedefTarih && w.cardio
        ? { ...w, cardio: w.cardio.filter(c => c.id !== entryId) }
        : w)
      // Son kardiyo da silinince boş kayıt geride kalmasın.
      .filter(w => (w.exercises || []).length > 0 || (w.cardio || []).length > 0));
  }, [cardioContext, setActiveWorkout, setWorkouts]);

  // Kardiyo penceresinde listelenecek girişler: aktif seans varsa onunkiler.
  /**
   * Kardiyo ekranında listelenecek girişler.
   *
   * Tarihi parametre alıyor çünkü kullanıcı pencerenin içinden tarihi
   * değiştirebiliyor; sabit bir liste verilseydi geçmiş bir güne geçildiğinde
   * hâlâ bugünün kayıtları görünürdü.
   */
  const cardioEntriesFor = useCallback((dateStr) => {
    const today = getLocalDateString();
    // Aktif seans varsa kardiyo oraya yazılıyor, ayrı bir gün kaydına değil.
    if (activeWorkout && (!dateStr || dateStr === today)) return activeWorkout.cardio || [];
    const hedef = dateStr || today;
    return workouts
      .filter(workout => workout.date === hedef)
      .flatMap(workout => workout.cardio || []);
  }, [activeWorkout, workouts]);

  // Bu haftaki toplam kardiyo kalorisi (dinlenme üstü).
  const weeklyCardioKcal = useMemo(() => {
    const monday = getMondayOfCurrentWeek();
    return workouts
      .filter(w => new Date(w.date) >= monday)
      .reduce((sum, w) => sum + totalCardioCalories(w.cardio || [], latestWeight), 0);
  }, [workouts, latestWeight]);

  // Hazır oluşluk eğilimi: tek gün gürültülü, karar son kayıtların
  // ortalamasından verilir. Üst üste düşük skor deload sinyali.
  const readiness = useMemo(() => readinessTrend(workouts, 10), [workouts]);
  const personalVolume = useMemo(
    () => buildPersonalVolumeGuidance(workouts, customExercises, settings.experienceLevel),
    [workouts, customExercises, settings.experienceLevel, settings.volumeTargets]);

  const todayCoach = useMemo(() => {
    const date = getLocalDateString();
    const keyByDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = keyByDay[new Date().getDay()];
    const planDay = weekPlanDays.find(day => day.key === dayKey);
    const workoutTemplate = planDay?.workouts?.[0]?.template || null;
    const planTime = planDay?.workouts?.[0]?.time || '';
    const activeRest = Boolean(planDay?.isActiveRest);

    const nutrition = nutritionHistory.find(day => day.date === date)
      || (currentNutritionForm.date === date ? currentNutritionForm : mergeNutrition({ date }));
    const macros = dailyTotals(nutrition);
    const exercise = dayCaloriesFor(date);
    const energy = dayEnergyBreakdown({
      maintenance: maintenanceCalories,
      bmr: parseNumber(computedComp?.bmr),
      macros,
      estimatedMacros: estimatedTefMacros,
      lifting: exercise.lifting,
      cardio: exercise.cardio,
      activeRecovery: exercise.activeRecovery,
      recovery: exercise.mind,
      manual: nutrition.activeCaloriesOut,
      steps: nutrition.steps,
      ...neatOptsForDay(neatOpts, nutrition),
    });
    const recommendation = recommendedCalories(maintenanceCalories, settings.nutritionGoal, {
      weightKg: latestWeight,
      bodyFatPct: parseNumber(computedComp?.activeBF),
      rate: settings.paceRate,
    });
    const protocolCalorieDelta = activeCoachProtocol?.calorieDelta || 0;
    const adjustedTarget = recommendation
      ? Math.max(0, recommendation.target + protocolCalorieDelta + energy.total - maintenanceCalories)
      : 0;
    const remaining = Math.round(adjustedTarget - macros.calories);

    const todaySleep = wellness.find(day => day.date === date)?.sleep;
    const previousSleep = wellness
      .filter(day => day.date < date && day.sleep)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(day => day.sleep);
    const sleep = todaySleep ? computeSleepScore(todaySleep, previousSleep) : null;
    const recoveryConcern = Boolean(readiness?.deloadOnerisi || (sleep && sleep.score < 55));

    const headline = recoveryConcern
      ? 'Bugün performanstan önce toparlanmayı koru.'
      : activeRest
        ? 'Bugün aktif dinlenme: hareket et, toparlanmayı zorlamadan koru.'
        : workoutTemplate
        ? `${workoutTemplate.name} için planın hazır.`
        : planDay?.cardios?.length
          ? 'Bugün kardiyo odaklı bir gün planladın.'
          : 'Planında açık gün — serbest çalışabilir veya dinlenebilirsin.';
    const detail = recoveryConcern
      ? 'Yoğunluğu düşür, teknik kalitesini koru ve eklem ağrısı varsa zorlayan hareketi değiştir.'
      : activeRest
        ? `${planDay.cardioMinutes} dk aktif toparlanma temposu · yaklaşık ${planDay.cardioKcal} kcal. Gün off day olarak kalır.`
        : workoutTemplate
        ? `${planDay.sets} teorik set · yaklaşık ${planDay.minutes} dk · ${planDay.totalKcal} kcal.`
        : 'Hazır oluşluğun iyiyse eksik kas gruplarına kısa bir seans ekleyebilirsin.';

    return {
      dateLabel: formatDayRelative(date, 'medium'),
      status: recoveryConcern ? 'Toparlan' : activeRest ? 'Aktif Off Day' : workoutTemplate ? 'Plan Hazır' : 'Esnek Gün',
      tone: recoveryConcern
        ? 'text-amber-300 border-amber-900/50 bg-amber-950/30'
        : activeRest
          ? 'text-indigo-300 border-indigo-900/50 bg-indigo-950/30'
          : workoutTemplate
          ? 'text-emerald-300 border-emerald-900/50 bg-emerald-950/30'
          : 'text-cyan-300 border-cyan-900/50 bg-cyan-950/30',
      headline,
      detail,
      sleepLabel: sleep ? `${sleep.score}/100` : 'Hızlı puan gir',
      sleepTone: sleep ? sleep.zone.text : 'text-purple-400',
      readinessLabel: readiness ? `${readiness.ortalama}/100` : 'Veri yok',
      readinessTone: readiness?.zone?.text || 'text-zinc-500',
      calorieLabel: adjustedTarget > 0
        ? macros.calories > 0
          ? `${Math.abs(remaining)} ${remaining >= 0 ? 'kaldı' : 'fazla'}`
          : `hedef ${Math.round(adjustedTarget)}`
        : 'Veri yok',
      calorieTone: remaining < 0 ? 'text-amber-400' : 'text-emerald-400',
      planLabel: workoutTemplate?.name || (activeRest ? 'Aktif dinlenme' : planDay?.cardios?.length ? 'Kardiyo günü' : 'Off / serbest gün'),
      planTime,
      cardioLabel: planDay?.cardios?.map(cardio => `${cardio.activity.label} ${cardio.minutes} dk${cardio.minuteSource === 'history' ? ' (arşiv ort.)' : ''}`).join(' · ') || '',
      planCalories: planDay?.totalKcal || 0,
      activeRest,
      workoutTemplate,
      // Eylem listesinin hesabı için ham girdiler; koç modülü saf kalsın diye
      // React state'ine değil bu nesneye bakıyor.
      _signals: {
        planDay,
        sleep,
        macros,
        calorieRemaining: adjustedTarget > 0 ? remaining : null,
        doneToday: workouts.filter(w => w.date === date && (w.exercises || []).length > 0).length,
      },
    };
  }, [weekPlanDays, nutritionHistory, currentNutritionForm, dayCaloriesFor,
    maintenanceCalories, computedComp, neatOpts, estimatedTefMacros, settings.nutritionGoal,
    settings.paceRate, latestWeight, wellness, readiness, workouts, activeCoachProtocol]);

  /**
   * Koçun sıralanmış eylem listesi.
   *
   * Sinyaller uygulamanın dört bir yanında zaten hesaplanıyor (hazır oluşluk,
   * uyku, hacim, ACWR, plato, ölçüm boşluğu); burada tek yerde toplanıp
   * önceliklendiriliyor ki kullanıcı "bugün neye bakmalıyım" sorusunu tek
   * kartta cevaplayabilsin.
   */
  const plateauInsights = useMemo(() => buildPlateauInsights(workouts), [workouts]);

  // Kas sıklığı: haftalık hacim 16 seti tek güne yığmakla ikiye bölmeyi ayırt
  // etmiyor. Yalnızca tamamlanmış haftalara bakar.
  const frequencyReport = useMemo(
    () => buildFrequencyReport(workouts, {
      customExercises,
      experienceLevel: settings.experienceLevel,
      weeks: 4,
    }),
    [workouts, customExercises, settings.experienceLevel, settings.volumeTargets]);

  // Haftalık kalori dengesi: gözden geçirme ekranı da kalori detayıyla aynı
  // motoru kullansın diye burada bir kez hesaplanıyor, iki ayrı sayı çıkmasın.
  const weeklyEnergy = useMemo(() => groupByWeek(buildEnergySeries(nutritionHistory, {
    maintenance: maintenanceCalories,
    bmr: parseNumber(computedComp?.bmr),
    dayCalories: dayCaloriesFor,
    days: 90,
    neatOpts,
    estimatedMacros: estimatedTefMacros,
    energyForRecord: energyForNutritionRecord,
  })), [nutritionHistory, maintenanceCalories, computedComp, dayCaloriesFor,
    neatOpts, estimatedTefMacros, energyForNutritionRecord]);

  // Deload durumu her render'da tarihten yeniden hesaplanıyor; süre dolduğunda
  // ayar yazılmıyor, yalnızca kapalı sayılıyor (render sırasında state yazmamak
  // için). Kullanıcı kaydı kendisi temizliyor.
  const deload = useMemo(
    () => deloadState(settings.deload),
    [settings.deload]);

  const deloadSuggestion = useMemo(
    () => shouldSuggestDeload({
      readiness,
      isDeloadNeeded: dashboardStats.isDeloadNeeded,
      acwr: dashboardStats,
    }),
    [readiness, dashboardStats]);

  // Blok durumu deload gibi tarihten yeniden hesaplanıyor; süre dolduğunda
  // ayar yazılmıyor, yalnızca kapalı sayılıyor.
  const mesocycle = useMemo(
    () => mesocycleState(settings.mesocycle),
    [settings.mesocycle]);

  // Bloğun bu haftaki talimatları hem koç satırında hem blok ekranında
  // kullanılıyor; iki yerde ayrı hesaplanırsa ayrışma riski doğar.
  const mesocycleInstructions = useMemo(() => {
    if (!mesocycle.active) return [];
    return targetInstructions(
      weeklyTargets(settings.mesocycle?.baseline, {
        weekIndex: mesocycle.weekIndex,
        totalWeeks: mesocycle.totalWeeks,
        experienceLevel: settings.experienceLevel,
        feedback: settings.mesocycle?.feedback,
        mode: settings.mesocycle?.mode || 'ramp',
        philosophy: settings.volumePhilosophy,
      }),
      weekPlanResult.statuses);
  }, [mesocycle, settings.mesocycle, settings.experienceLevel, settings.volumeTargets,
    settings.volumePhilosophy, weekPlanResult.statuses]);

  const selectionReport = useMemo(
    () => auditExerciseSelection(weekPlanResult.statuses, { customExercises }),
    [weekPlanResult.statuses, customExercises]);

  /** Antrenmandaki bir hareketi başka bir hareketle değiştirir; setler korunur. */
  const handleSubstituteExercise = useCallback((exerciseId, newName) => {
    setActiveWorkout(prev => prev ? {
      ...prev,
      exercises: (prev.exercises || []).map(ex => ex.id === exerciseId ? { ...ex, name: newName } : ex),
    } : prev);
    showToast(`Hareket ${newName} ile değiştirildi.`);
  }, [setActiveWorkout, showToast]);

  // 6.1 raporları. Hepsi coachActions'tan önce hesaplanıyor çünkü koç satırı
  // bunları tüketiyor; ayrıca modaller de aynı nesneleri kullanıyor ki iki
  // yerde farklı sayı görünmesin.
  const painReport = useMemo(
    () => buildPainReport(settings.painLog || [], { workouts: sortedWorkouts }),
    [settings.painLog, sortedWorkouts]);

  const strengthBalance = useMemo(
    () => buildStrengthBalance(sortedWorkouts, { resolveLoad: resolveSetLoad }),
    [sortedWorkouts, resolveSetLoad]);

  const consistencyReport = useMemo(
    () => buildConsistency(sortedWorkouts),
    [sortedWorkouts]);

  const handleApplyAdaptation = useCallback((suggestion) => {
    setTemplates(prev => {
      const sonraki = applyAdaptation(prev, suggestion, generateId);
      if (sonraki === prev) return prev;
      return sonraki;
    });
    showToast(`Uygulandı: ${suggestion.title}`);
  }, [setTemplates, showToast]);

  const adherenceReport = useMemo(
    () => buildAdherence(sortedWorkouts, weekPlanResult),
    [sortedWorkouts, weekPlanResult]);

  const planExecutionReport = useMemo(
    () => buildPlanExecution(sortedWorkouts, weekPlanResult, {
      today: getLocalDateString(),
      weeks: 8,
      customExercises,
    }),
    [sortedWorkouts, weekPlanResult, customExercises]);

  const dataHealthReport = useMemo(
    () => auditWorkoutData(sortedWorkouts),
    [sortedWorkouts]);

  // 6.2 raporları.
  const weekProjection = useMemo(() => buildWeekProjection(
    dashboardStats.muscleVolume,
    weekPlanResult,
    templates,
    {
      // Bugün zaten çalışıldıysa planlanan hacim bir kez daha sayılmamalı;
      // aksi halde projeksiyon aynı seansı iki kere ekliyor.
      includeToday: workouts.filter(w => w.date === getLocalDateString()).length === 0,
      experienceLevel: settings.experienceLevel,
      customExercises,
      trainedMuscles: dashboardStats.trainedMusclesThisWeek || [],
    }),
  [dashboardStats.muscleVolume, dashboardStats.trainedMusclesThisWeek, weekPlanResult, templates, workouts, settings.experienceLevel, settings.volumeTargets, customExercises]);

  // Rekor eşiği yalnızca BUGÜN gündemde olan hareketler için: tüm kütüphaneyi
  // taramak her gün bir "rekora yakınsın" listesi üretir ve anlamını yitirir.
  const prWatch = useMemo(() => {
    const bugunku = activeWorkout?.exercises?.map(e => e.name)
      || todayCoach?._signals?.planDay?.workouts?.flatMap(w => (w.template?.exercises || []).map(e => e.name))
      || [];
    return buildPrWatch(bugunku, sortedWorkouts, { resolveLoad: resolveSetLoad });
  }, [activeWorkout, todayCoach, sortedWorkouts, resolveSetLoad]);

  const rirCalibration = useMemo(() => buildRirCalibration(sortedWorkouts), [sortedWorkouts]);

  const lastSessionQuality = useMemo(() => {
    const son = sortedWorkouts[0];
    if (!son) return null;
    return auditSessionQuality(son.exercises, { customExercises, durationMinutes: son.duration });
  }, [sortedWorkouts, customExercises]);

  // Kardiyo koçu. Yaş nabız bölgeleri için; yoksa bölge aktivite ve tempodan
  // tahmin ediliyor.
  const profileAge = parseNumber(currentMetricsForm?.age) || null;

  // Bölge hesabının bütün girdileri tek nesnede: yöntem, dinlenme nabzı ve
  // elle girilen maksimum. Ayrı ayrı geçirilirken bir çağrı eksik kalıyor ve
  // aynı kayıt iki ekranda farklı bölge gösterebiliyordu.
  const zoneOpts = useMemo(() => ({
    age: profileAge,
    restingHr: settings.restingHr,
    method: settings.zoneMethod,
    maxHrManual: settings.maxHrManual,
  }), [profileAge, settings.restingHr, settings.zoneMethod, settings.maxHrManual]);

  const cardioReport = useMemo(
    () => buildCardioReport(sortedWorkouts, settings.cardioGoal, {
      ...zoneOpts,
      planResult: weekPlanResult,
    }),
    [sortedWorkouts, settings.cardioGoal, zoneOpts, weekPlanResult]);

  const restingHrReport = useMemo(
    () => buildRestingHrReport(settings.restingHrLog),
    [settings.restingHrLog]);

  const cardioRecords = useMemo(
    () => buildCardioRecords(sortedWorkouts, { poolLength: Number(settings.poolLength) || 25 }),
    [sortedWorkouts, settings.poolLength]);

  /**
   * Sabah dinlenme nabzı kaydı.
   *
   * Karvonen hesabındaki tek değer de güncelleniyor: kullanıcı iki ayrı yerde
   * aynı sayıyı girmek zorunda kalmasın.
   */
  const handleLogRestingHr = useCallback((bpm, date = getLocalDateString()) => {
    const deger = parseNumber(bpm);
    if (!(deger > 0)) return;
    setSettings(prev => ({
      ...prev,
      restingHrLog: upsertRestingHr(prev.restingHrLog, date, deger),
      restingHr: String(Math.round(deger)),
    }));
    showToast('Dinlenme nabzı kaydedildi.');
  }, [setSettings, showToast]);

  const cardioSuggestion = useMemo(
    () => cardioSuggestionForToday(cardioReport, {
      planDay: todayCoach?._signals?.planDay || null,
      readinessScore: readiness?.sonSkor ?? null,
    }),
    [cardioReport, todayCoach, readiness]);

  // 6.5 raporları.
  const strengthStandards = useMemo(
    () => buildStrengthStandards(sortedWorkouts, {
      bodyWeightKg: latestWeight, gender: profileGender, resolveLoad: resolveSetLoad,
    }),
    [sortedWorkouts, latestWeight, profileGender, resolveSetLoad]);

  const effortDistribution = useMemo(
    () => buildEffortDistribution(sortedWorkouts, { customExercises }),
    [sortedWorkouts, customExercises]);

  const rotationReport = useMemo(
    () => buildRotationReport(sortedWorkouts, { customExercises, resolveLoad: resolveSetLoad }),
    [sortedWorkouts, customExercises, resolveSetLoad]);

  const bodyRatios = useMemo(
    () => buildBodyRatios(sortedMetrics[0] || currentMetricsForm, {
      gender: profileGender, previous: sortedMetrics[1] || null,
    }),
    [sortedMetrics, currentMetricsForm, profileGender]);

  // Deload dönüşü: boşaltma tamamlandıysa iki haftalık kademeli plan.
  const deloadReturn = useMemo(
    () => buildDeloadReturn(settings.deload, deload),
    [settings.deload, deload]);

  const periNutrition = useMemo(() => {
    const bugun = getLocalDateString();
    return buildPeriNutrition({
      macros: todayCoach?._signals?.macros || {},
      targetProtein: Math.round(parseNumber(computedComp?.ffm) * (settings.nutritionGoal === 'bulk'
        ? (settings.proteinPerFfmBulk || 2.2)
        : (settings.proteinPerFfmCut || 2.6))),
      targetCalories: maintenanceCalories,
      plannedToday: (todayCoach?._signals?.planDay?.workouts?.length || 0) > 0,
      doneToday: workouts.some(w => w.date === bugun && (w.exercises || []).length > 0),
      mealCount: (currentNutritionForm?.meals || []).filter(m => parseNumber(m.calories) > 0).length,
    });
  }, [todayCoach, computedComp, settings.nutritionGoal, settings.proteinPerFfmBulk,
    settings.proteinPerFfmCut, maintenanceCalories, workouts, currentNutritionForm]);

  // 6.7: ağrı koruması. Ağrı günlüğü ile hareket listesi bu sürüme kadar
  // birbirinden habersizdi.
  const painRegions = useMemo(
    () => activePainRegions(settings.painLog, { workouts: sortedWorkouts }),
    [settings.painLog, sortedWorkouts]);

  const painScan = useMemo(() => {
    const hareketler = activeWorkout?.exercises
      || todayCoach?._signals?.planDay?.workouts?.flatMap(w => w.template?.exercises || [])
      || [];
    return scanSessionForPain(hareketler, painRegions, { customExercises });
  }, [activeWorkout, todayCoach, painRegions, customExercises]);

  // --- 7.0 raporları --------------------------------------------------
  // Hepsi sortedWorkouts üzerinden; hiçbiri yeni depolama anahtarı açmıyor.
  const plateauReport = useMemo(
    () => scanPlateaus(sortedWorkouts, { resolveLoad: resolveSetLoad, customExercises }),
    [sortedWorkouts, resolveSetLoad, customExercises]);

  const restReport = useMemo(
    () => buildRestReport(sortedWorkouts, { customExercises }),
    [sortedWorkouts, customExercises]);

  const timeOfDayReport = useMemo(
    () => buildTimeOfDayReport(sortedWorkouts, { resolveLoad: resolveSetLoad }),
    [sortedWorkouts, resolveSetLoad]);

  const techniqueReport = useMemo(
    () => buildTechniqueReport(sortedWorkouts),
    [sortedWorkouts]);

  // Kişisel hacim hedefi önerisinin girdisi: kas kas haftalık hacim ve o
  // haftanın toparlanıp toparlanmadığı.
  const weeklyVolumeHistory = useMemo(
    () => buildWeeklyVolumeHistory(sortedWorkouts, {
      customExercises,
      detectMuscle: detectMuscleGroup,
      estimate: estimate1RM,
    }),
    [sortedWorkouts, customExercises]);

  // --- 7.4 raporları --------------------------------------------------
  const sideBalance = useMemo(
    () => scanSideBalance(sortedWorkouts),
    [sortedWorkouts]);

  const waterTarget = useMemo(
    () => dailyWaterTarget(latestWeight, {
      training: Boolean(activeWorkout) || sortedWorkouts.some(w => w.date === getLocalDateString()),
      heat: Boolean(settings.waterHeatBonus),
    }),
    [latestWeight, activeWorkout, sortedWorkouts, settings.waterHeatBonus]);

  const waterReport = useMemo(
    () => waterSummary(settings.waterLog, {
      target: waterTarget.ml,
      todayKey: getLocalDateString(),
    }),
    [settings.waterLog, waterTarget.ml]);

  const handleAddWater = useCallback((ml) => {
    setSettings(prev => ({
      ...prev,
      waterLog: addWater(prev.waterLog, getLocalDateString(), ml),
    }));
  }, [setSettings]);

  /**
   * Haftalık planı takvim dosyasına aktarır.
   *
   * Dosya olarak indiriliyor, bir servise gönderilmiyor: uygulama çevrimdışı
   * çalışıyor ve hiçbir veri dışarı çıkmıyor.
   */
  const handleExportCalendar = useCallback(async () => {
    const { planToIcs } = await import('./utils/calendarExport');
    const ics = planToIcs(activePlan, templates, { restSeconds: settings.restSeconds });
    if (!ics) {
      showToast('Aktif planda takvime yazılacak antrenman yok.', 'warning');
      return;
    }
    const blob = new Blob([ics.text], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ics.filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${ics.events.length} antrenman takvime aktarıldı.`);
  }, [activePlan, templates, settings.restSeconds, showToast]);

  // --- 7.5 raporları --------------------------------------------------
  const formCurve = useMemo(
    () => buildFormCurve(sortedWorkouts),
    [sortedWorkouts]);

  const restProfile = useMemo(
    () => restProfileByMuscle(sortedWorkouts, { customExercises }),
    [sortedWorkouts, customExercises]);

  const yearReview = useMemo(
    () => buildYearReview(sortedWorkouts, { resolveLoad: resolveSetLoad, customExercises }),
    [sortedWorkouts, resolveSetLoad, customExercises]);

  /** Rekor zaman çizelgesi: bütün rekorlar tek listede, yeniden eskiye. */
  const recordTimeline = useMemo(
    () => buildRecordTimeline(sortedWorkouts, { resolveLoad: resolveSetLoad, customExercises }),
    [sortedWorkouts, resolveSetLoad, customExercises]);

  // Sıklık planı: frequency.js GEÇMİŞE bakıyor, bu PLANA. Hafta bitmeden
  // hangi kasın tek uyaranda kaldığını söylüyor.
  const frequencyPlan = useMemo(
    () => buildFrequencyPlan(activePlan?.days, templates, {
      customExercises,
      experienceLevel: settings.experienceLevel,
    }),
    [activePlan, templates, customExercises, settings.experienceLevel, settings.volumeTargets]);

  /**
   * Zayıf halka: beş ayrı analizin tek sıralı listeye indirgenmiş hali.
   * Hesap yapmıyor, yalnızca birleştirip sıralıyor — aynı hesabı ikinci kez
   * yapmak iki farklı sayı üretme riski taşırdı.
   */
  const weakLinks = useMemo(() => buildWeakLinks({
    volumeStatuses: weekPlanResult.statuses,
    balance: strengthBalance,
    standards: strengthStandards,
    plateaus: plateauReport,
    selection: selectionReport,
    frequency: frequencyPlan,
  }), [weekPlanResult.statuses, strengthBalance, strengthStandards,
    plateauReport, selectionReport, frequencyPlan]);

  /** Geçen haftanın dersini plana çeviren somut öneriler. */
  const adaptations = useMemo(() => buildAdaptations({
    volumeStatuses: weekPlanResult.statuses,
    plateaus: plateauReport,
    frequency: frequencyPlan,
    formCurve,
  }, templates, { customExercises, detectMuscle: detectMuscleGroup }),
  [weekPlanResult.statuses, plateauReport, frequencyPlan, formCurve, templates, customExercises]);

  const discovery = useMemo(
    () => discoverExercises(sortedWorkouts, {
      volumeStatuses: weekPlanResult.statuses,
      customExercises,
      allNames: allExercisesNames,
    }),
    [sortedWorkouts, weekPlanResult.statuses, customExercises, allExercisesNames]);

  // --- 7.9 doz-yanıt ve yakınlık --------------------------------------

  /** Üç sayım yöntemi yan yana: kesirli, toplam, doğrudan. */
  const setCounts = useMemo(
    () => countWeeklySets(sortedWorkouts, { customExercises, weeks: 4 }),
    [sortedWorkouts, customExercises]);

  /** Gerçekleşen yakınlık ile hedefin karşılaştırması. */
  const proximityReport = useMemo(
    () => buildProximityReport(sortedWorkouts, {
      customExercises,
      overrides: settings.proximityTargets,
      goal: settings.trainingGoal,
    }),
    [sortedWorkouts, customExercises, settings.proximityTargets, settings.trainingGoal]);

  /** Kayıt geçmişinden seviye önerisi — uygulanmıyor, öneriliyor. */
  const trainingAge = useMemo(
    () => buildTrainingAge(sortedWorkouts, { resolveLoad: resolveSetLoad }),
    [sortedWorkouts, resolveSetLoad]);

  /** İkili ve kademeli etkili set ölçüsünün son seanstaki farkı. */
  const effectiveSetComparison = useMemo(() => {
    const son = sortedWorkouts[0];
    return son ? compareEffectiveSets(son.exercises) : null;
  }, [sortedWorkouts]);

  /**
   * Seans başı tavan: haftalık hacim doğru olsa bile tek seansa yığılınca
   * kayboluyor. Bugünkü plandaki her gün ayrı denetleniyor.
   */
  const sessionCeiling = useMemo(() => {
    const gun = weekPlanResult.days?.find(d => d.isToday) || weekPlanResult.days?.[0];
    const kaslar = new Map();
    (gun?.workouts || []).forEach(w => (w.template?.exercises || []).forEach(ex => {
      const adet = (ex.sets || []).length;
      if (adet === 0) return;
      const { contributions } = detectMuscleGroup(ex.name, customExercises);
      Object.entries(contributions || {}).forEach(([kas, katki]) => {
        kaslar.set(kas, (kaslar.get(kas) || 0) + adet * katki);
      });
    }));
    return sessionCeilingAudit([...kaslar.entries()].map(([muscle, sets]) => ({ muscle, sets })));
  }, [weekPlanResult.days, customExercises]);

  const handleSetVolumePhilosophy = useCallback((key) => {
    setSettings(prev => ({ ...prev, volumePhilosophy: key }));
    showToast(`Hacim felsefesi: ${findVolumePhilosophy(key).label}.`);
  }, [setSettings, showToast]);

  const handleToggleGradedSets = useCallback(() => {
    setSettings(prev => ({ ...prev, gradedEffectiveSets: !prev.gradedEffectiveSets }));
  }, [setSettings]);

  // --- 7.6 koç ve analiz raporları -----------------------------------

  /** Gün → uyku puanı. Sürücü analizi ve sapma taraması aynı tabloyu kullanıyor. */
  const sleepScoreByDay = useMemo(() => {
    const tablo = {};
    const gunler = [...wellness].filter(d => d?.date && d.sleep)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    gunler.forEach((gun, i) => {
      // Puan önceki gecelere göre hesaplanıyor; sıralı gezmek şart.
      const oncekiler = gunler.slice(0, i).reverse().map(g => g.sleep);
      const puan = computeSleepScore(gun.sleep, oncekiler);
      if (puan?.score > 0) tablo[gun.date] = puan.score;
    });
    return tablo;
  }, [wellness]);

  /**
   * Performans sürücüleri: uyku, protein, dinlenme ve kilonun seans kalitesiyle
   * ilişkisi. Nedensellik iddiası taşımıyor; modül bunu her çıktısında yazıyor.
   */
  const performanceDrivers = useMemo(
    () => buildPerformanceDrivers({
      workouts: sortedWorkouts,
      sleepScores: sleepScoreByDay,
      nutrition: nutritionHistory,
      metrics: metricsHistory,
      resolveLoad: resolveSetLoad,
    }),
    [sortedWorkouts, sleepScoreByDay, nutritionHistory, metricsHistory, resolveSetLoad]);

  /** Tepki profili: hangi tekrar aralığı, hacim bandı ve sıklıkta daha hızlı ilerliyor. */
  const responseProfile = useMemo(
    () => buildResponseProfile(sortedWorkouts, customExercises, {
      experienceLevel: settings.experienceLevel,
      resolveLoad: resolveSetLoad,
    }),
    [sortedWorkouts, customExercises, settings.experienceLevel, settings.volumeTargets, resolveSetLoad]);

  /** Hareket getirisi: yatırılan set başına tahmini 1RM kazancı. */
  const exerciseRoi = useMemo(
    () => buildExerciseRoi(sortedWorkouts, customExercises, { resolveLoad: resolveSetLoad }),
    [sortedWorkouts, customExercises, resolveSetLoad]);

  /** Kas karnesi: hacim, ilerleme ve sıklıktan tek not. */
  const muscleScorecard = useMemo(
    () => buildMuscleScorecard(sortedWorkouts, customExercises, {
      weeks: 8,
      experienceLevel: settings.experienceLevel,
      resolveLoad: resolveSetLoad,
    }),
    [sortedWorkouts, customExercises, settings.experienceLevel, settings.volumeTargets, resolveSetLoad]);

  /**
   * Defterin ölçüm penceresi ayrı: karne sekiz haftaya bakıyor ve o kadar
   * geniş bir ortalama, üç hafta önce yapılmış bir set değişikliğini
   * seyreltip görünmez kılıyor.
   */
  const recentScorecard = useMemo(
    () => buildMuscleScorecard(sortedWorkouts, customExercises, {
      weeks: 4,
      experienceLevel: settings.experienceLevel,
      resolveLoad: resolveSetLoad,
    }),
    [sortedWorkouts, customExercises, settings.experienceLevel, settings.volumeTargets, resolveSetLoad]);

  /** Sessiz sinyaller: kural yazılmamış değişimler. */
  const anomalyWatch = useMemo(
    () => buildAnomalyWatch({
      workouts: sortedWorkouts,
      metrics: metricsHistory,
      sleepScores: sleepScoreByDay,
      restingHrLog: settings.restingHrLog,
      resolveLoad: resolveSetLoad,
    }),
    [sortedWorkouts, metricsHistory, sleepScoreByDay, settings.restingHrLog, resolveSetLoad]);

  /**
   * Blok karşılaştırma modal içinden pencere uzunluğu seçilerek çağrılıyor;
   * memo yerine callback, çünkü sonuç kullanıcının seçtiği süreye bağlı.
   */
  const blockCompareFor = useCallback(
    (weeks) => buildBlockCompare(sortedWorkouts, customExercises, { weeks, resolveLoad: resolveSetLoad }),
    [sortedWorkouts, customExercises, resolveSetLoad]);

  const blockCompare = useMemo(() => blockCompareFor(4), [blockCompareFor]);

  /** Son dört haftanın en iyi tahmini 1RM'leri — defterin sonuç ölçüsü. */
  const strengthSnapshot = useMemo(() => {
    const sinir = new Date();
    sinir.setDate(sinir.getDate() - 28);
    const byMuscle = new Map();
    const byExercise = new Map();
    sortedWorkouts.forEach(w => {
      if (new Date(w.date) < sinir) return;
      (w.exercises || []).forEach(ex => {
        const { muscle } = detectMuscleGroup(ex.name, customExercises);
        const en = Math.max(0, ...(ex.sets || [])
          .filter(isCompletedWorkingSet)
          .map(setKaydi => estimate1RM(resolveSetLoad(ex.name, setKaydi.weight, w), setKaydi.reps, setKaydi.rir)));
        if (en <= 0) return;
        byExercise.set(ex.name, Math.max(byExercise.get(ex.name) || 0, en));
        byMuscle.set(muscle, Math.max(byMuscle.get(muscle) || 0, en));
      });
    });
    return { byMuscle, byExercise };
  }, [sortedWorkouts, customExercises, resolveSetLoad]);

  /** Defterin ölçüm kaynakları: modül kendi başına hacim ya da 1RM hesaplamıyor. */
  const ledgerSources = useMemo(() => ({
    // Kas belirtilmemişse toplam haftalık hacim: "hacim ekle" tavsiyesinin
    // uygulanıp uygulanmadığı bu sayıdan okunabiliyor.
    weeklyVolumeOf: (kas) => (kas
      ? recentScorecard.rows.find(r => r.muscle === kas)?.weeklyVolume || 0
      : recentScorecard.rows.reduce((t, r) => t + (r.weeklyVolume || 0), 0)),
    bestE1rmOf: ({ muscle, exercise }) =>
      (exercise ? strengthSnapshot.byExercise.get(exercise) : 0)
      || (muscle ? strengthSnapshot.byMuscle.get(muscle) : 0)
      || Math.max(0, ...strengthSnapshot.byMuscle.values()),
    weeklySessions: () => {
      const sinir = new Date();
      sinir.setDate(sinir.getDate() - 28);
      return sortedWorkouts.filter(w => new Date(w.date) >= sinir).length / 4;
    },
  }), [recentScorecard, strengthSnapshot, sortedWorkouts]);

  const coachLedger = useMemo(
    () => (Array.isArray(settings.coachLedger) ? settings.coachLedger : []),
    [settings.coachLedger]);
  const ledgerDue = useMemo(() => dueEntries(coachLedger), [coachLedger]);
  const ledgerReport = useMemo(() => ledgerStats(coachLedger), [coachLedger]);

  /** Analiz kilitleri: hangi kart neden boş ve ne girilirse açılır. */
  const analysisLocks = useMemo(() => {
    const tarihler = sortedWorkouts.map(w => new Date(w.date)).filter(d => !Number.isNaN(d.getTime()));
    const gunAraligi = tarihler.length >= 2
      ? Math.round((Math.max(...tarihler) - Math.min(...tarihler)) / 86400000)
      : 0;

    let dinlenmeOrnegi = 0;
    sortedWorkouts.forEach(w => (w.exercises || []).forEach(ex => (ex.sets || []).forEach(setKaydi => {
      if (parseNumber(setKaydi.restBefore) > 0) dinlenmeOrnegi += 1;
    })));

    // Geçen tam hafta (pazartesi–pazar).
    const bugun = new Date();
    const gun = bugun.getDay() === 0 ? 7 : bugun.getDay();
    const buPazartesi = new Date(bugun);
    buPazartesi.setHours(0, 0, 0, 0);
    buPazartesi.setDate(bugun.getDate() - gun + 1);
    const gecenPazartesi = new Date(buPazartesi);
    gecenPazartesi.setDate(buPazartesi.getDate() - 7);
    const gecenHafta = sortedWorkouts.filter(w => {
      const d = new Date(w.date);
      return d >= gecenPazartesi && d < buPazartesi;
    }).length;

    return buildAnalysisReadiness({
      workouts: sortedWorkouts.length,
      trainingDays: gunAraligi,
      exercisesWith4Sessions: [...exercisePerformCounts.values()].filter(n => n >= 4).length,
      sleepNights: Object.keys(sleepScoreByDay).length,
      nutritionDays: nutritionHistory.length,
      metricEntries: metricsHistory.length,
      restSamples: dinlenmeOrnegi,
      painEntries: (settings.painLog || []).length,
      restingHrEntries: (settings.restingHrLog || []).length,
      bodyWeight: parseNumber(sortedMetrics.find(m => parseNumber(m.weight) > 0)?.weight) > 0 ? 1 : 0,
      mainLifts: strengthStandards?.rows?.length || 0,
      lastWeekSessions: gecenHafta,
      ledgerEntries: coachLedger.length,
    });
  }, [sortedWorkouts, exercisePerformCounts, sleepScoreByDay, nutritionHistory, metricsHistory,
    settings.painLog, settings.restingHrLog, sortedMetrics, strengthStandards, coachLedger]);

  /** Senaryo ekranının çalıştığı kas durumu: sekiz haftalık ortalama. */
  const scenarioMuscleStates = useMemo(
    () => muscleScorecard.trained.map(r => ({
      muscle: r.muscle,
      volume: r.weeklyVolume,
      frequency: r.weeklySessions,
      landmarks: r.landmarks,
    })),
    [muscleScorecard]);

  /**
   * Koç maddesini deftere yazar.
   *
   * Kayıt ANINDA ölçülüyor: üç hafta sonra "o gün hacmin neydi" sorusunun
   * cevabı geriye dönük hesaplanabilir ama araya giren her değişiklik o
   * cevabı bulanıklaştırırdı.
   */
  const handleApplyCoachItem = useCallback((item) => {
    const kayit = snapshotDecision(item, ledgerSources, { id: generateId() });
    if (!kayit) return;
    setSettings(prev => ({ ...prev, coachLedger: logDecision(prev.coachLedger, kayit) }));
    showToast(kayit.kind === 'none'
      ? 'Deftere yazıldı. Bu tavsiyenin sayısal bir karşılığı yok, isabet oranına girmiyor.'
      : 'Deftere yazıldı; üç hafta sonra sonucu ölçülecek.');
  }, [ledgerSources, setSettings, showToast]);

  const handleRejectCoachItem = useCallback((item) => {
    setSettings(prev => ({ ...prev, coachLedger: logRejection(prev.coachLedger, item) }));
  }, [setSettings]);

  const handleSettleLedger = useCallback(() => {
    setSettings(prev => {
      const { ledger, settled } = settleDue(prev.coachLedger || [], (entry) => ({
        complianceValue: entry.compliance?.kind === 'sessions'
          ? ledgerSources.weeklySessions()
          : ledgerSources.weeklyVolumeOf(entry.compliance?.muscle),
        resultValue: ledgerSources.bestE1rmOf({
          muscle: entry.result?.muscle,
          exercise: entry.result?.exercise,
        }),
      }));
      if (settled > 0) showToast(`${settled} tavsiyenin sonucu ölçüldü.`);
      return { ...prev, coachLedger: ledger };
    });
  }, [ledgerSources, setSettings, showToast]);

  const handleSetCoachFocus = useCallback((key) => {
    setSettings(prev => ({ ...prev, coachFocus: key }));
    showToast(`Koç odağı: ${findFocus(key).label}.`);
  }, [setSettings, showToast]);

  /**
   * Şablonu paylaşılabilir koda çevirip panoya kopyalar.
   *
   * Setlerin ağırlık ve tekrar değerleri taşınmıyor: onlar kişinin kendi
   * yükleri ve başkasının programına yazılması yanlış bir başlangıç değeri
   * önermek olurdu.
   */
  const handleCopyTemplateCode = useCallback(async (template) => {
    const { templateToCode } = await import('./utils/programCode');
    const kod = templateToCode(template);
    if (!kod) {
      showToast('Bu şablonda paylaşılacak hareket yok.', 'warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(kod);
      showToast('Program kodu panoya kopyalandı.');
    } catch {
      // Pano izni yoksa kod yine de gösterilmeli; kullanıcı elle seçebilsin.
      showToast(kod, 'info', { duration: 15000 });
    }
  }, [showToast]);

  const handleImportTemplateCode = useCallback(async (kod) => {
    const { codeToTemplate, describeCodeError } = await import('./utils/programCode');
    const sonuc = codeToTemplate(kod, generateId);
    if (!sonuc.ok) {
      showToast(describeCodeError(sonuc.reason), 'warning');
      return false;
    }
    setTemplates(prev => [sonuc.template, ...prev]);
    showToast(`"${sonuc.template.name}" içe aktarıldı.`);
    return true;
  }, [setTemplates, showToast]);

  /** Antrenman hedefi modu: varsayılanları tek yerden kaydırır. */
  const handleSetTrainingGoal = useCallback((key) => {
    setSettings(prev => applyTrainingGoal(prev, key));
    showToast(`${findTrainingGoal(key).label} moduna geçildi.`);
  }, [setSettings, showToast]);

  // Sıra denetimi: bugünkü seansın ya da planlanan şablonun hareket sırası.
  // Aynı hareket listesi farklı sırayla farklı sonuç veriyor.
  const orderReport = useMemo(() => {
    const hareketler = activeWorkout?.exercises
      || todayCoach?._signals?.planDay?.workouts?.flatMap(w => w.template?.exercises || [])
      || [];
    return auditExerciseOrder(hareketler, { customExercises });
  }, [activeWorkout, todayCoach, customExercises]);

  /** Hareketin tekrar bandı rekorları — profil ekranı için. */
  const repRecordsForExercise = useCallback(
    (name) => repRecordsFor(name, sortedWorkouts, { resolveLoad: resolveSetLoad }),
    [sortedWorkouts, resolveSetLoad]);

  const handleSetProgressionRule = useCallback((exerciseName, key) => {
    setSettings(prev => ({
      ...prev,
      progressionRules: setProgressionRule(prev.progressionRules, exerciseName, key),
    }));
    showToast(`${exerciseName}: ${PROGRESSION_RULES[key]?.label || 'Çift İlerleme'}`);
  }, [setSettings, showToast]);

  /** Seansa başlamadan önce şablonun tamamı için hedef kartı. */
  const nextSessionTargetsFor = useCallback((template) => buildNextSessionTargets(template, sortedWorkouts, {
    repRangeFor: (ad) => repRangeFor(ad, {
      overrides: settings.repRangeOverrides,
      customExercises,
      fallback: { min: settings.repRangeMin, max: settings.repRangeMax },
    }),
    resolveLoad: resolveSetLoad,
    overrides: settings.progressionRules,
    customExercises,
    muscleOf: (ad, liste) => detectMuscleGroup(ad, liste).muscle,
  }), [sortedWorkouts, settings.repRangeOverrides, settings.repRangeMin, settings.repRangeMax,
    settings.progressionRules, resolveSetLoad, customExercises]);

  // Sihirbazın dışlama adımına öneri: ağrılı bölgeyi yükleyen hareketler.
  const painExclusionSuggestions = useMemo(
    () => exercisesLoadingPain(painRegions, allExercisesNames),
    [painRegions, allExercisesNames]);

  const painWarningForExercise = useCallback(
    (name) => painWarningFor(name, painRegions, { customExercises }),
    [painRegions, customExercises]);

  // Kişisel hacim modeli iki aşamalı: koç maddesi toparlanma puanından önceki
  // temel plan farkına dayanır; ekran ise koç kapasitesi hesaplandıktan sonra
  // en fazla +1/−2 setlik geçici toparlanma ayarını da gösterir. Böylece koç
  // kendi ürettiği puanı girdi olarak kullanıp döngüye girmez.
  const optimalVolumeBase = useMemo(() => buildOptimalVolumeProfile({
    weeklyHistory: weeklyVolumeHistory,
    planStatuses: weekPlanResult.statuses,
    currentVolume: dashboardStats.muscleVolume,
    experienceLevel: settings.experienceLevel,
  }), [weeklyVolumeHistory, weekPlanResult.statuses, dashboardStats.muscleVolume, settings.experienceLevel]);

  const optimalVolumeItem = useMemo(
    () => optimalVolumeCoachItem(optimalVolumeBase),
    [optimalVolumeBase]);

  const coachActions = useMemo(() => {
    const bugun = getLocalDateString();
    const sonOlcum = sortedMetrics[0]?.date;
    const gunFarki = sonOlcum
      ? Math.floor((new Date(`${bugun}T12:00:00`) - new Date(`${sonOlcum}T12:00:00`)) / 86400000)
      : null;
    // Eklem ağrısı en son seansın formundan okunuyor; bugünkü form henüz yok.
    const sonSeans = sortedWorkouts.find(w => w.readiness);

    return buildCoachActions({
      readiness,
      sleep: todayCoach?._signals.sleep,
      lastReadiness: sonSeans?.readiness,
      planDay: todayCoach?._signals.planDay,
      doneToday: todayCoach?._signals.doneToday || 0,
      conflict: todayCoach?._signals.planDay
        ? analyzeDayConflicts(todayCoach._signals.planDay)
        : null,
      macros: todayCoach?._signals.macros,
      targetProtein: Math.round(parseNumber(computedComp?.ffm) * (settings.nutritionGoal === 'bulk'
        ? (settings.proteinPerFfmBulk || 2.2)
        : (settings.proteinPerFfmCut || 2.6))),
      calorieRemaining: todayCoach?._signals.calorieRemaining ?? null,
      muscleVolume: dashboardStats.muscleVolume,
      experienceLevel: settings.experienceLevel,
      acwr: dashboardStats,
      daysSinceMetric: gunFarki,
      plateaus: plateauInsights,
      frequencyItem: frequencyCoachItem(frequencyReport),
      mesocycleItem: mesocycleCoachItem(mesocycle, mesocycleInstructions),
      selectionItem: selectionCoachItem(selectionReport),
      painItem: painCoachItem(painReport),
      balanceItem: strengthBalanceCoachItem(strengthBalance),
      consistencyItem: consistencyCoachItem(consistencyReport, adherenceReport),
      planExecutionItem: planExecutionCoachItem(planExecutionReport),
      dataHealthItem: dataHealthCoachItem(dataHealthReport),
      projectionAvailable: weekProjection.hasData,
      projectionItem: projectionCoachItem(weekProjection),
      prItem: prWatchCoachItem(prWatch),
      rirItem: rirCoachItem(rirCalibration),
      orderItem: sessionQualityCoachItem(lastSessionQuality),
      cardioItem: cardioCoachItem(cardioReport, cardioSuggestion),
      restingHrItem: restingHrCoachItem(restingHrReport),
      painGuardItem: painGuardCoachItem(painScan, painRegions),
      plateauItem: plateauCoachItem(plateauReport),
      restQualityItem: restCoachItem(restReport),
      timeOfDayItem: timeOfDayCoachItem(timeOfDayReport),
      techniqueItem: techniqueCoachItem(techniqueReport),
      frequencyPlanItem: frequencyPlanCoachItem(frequencyPlan),
      sideBalanceItem: sideBalanceCoachItem(sideBalance),
      weakLinkItem: weakLinkCoachItem(weakLinks),
      formItem: formCoachItem(formCurve),
      adaptiveRestItem: adaptiveRestCoachItem(restProfile, settings.restSeconds),
      waterItem: waterCoachItem(waterReport),
      exerciseOrderItem: orderCoachItem(orderReport, {
        context: activeWorkout ? 'devam eden seans' : 'bugünkü plan',
      }),
      standardsItem: strengthStandardCoachItem(strengthStandards),
      effortItem: effortCoachItem(effortDistribution),
      rotationItem: rotationCoachItem(rotationReport),
      ratioItem: bodyRatioCoachItem(bodyRatios),
      returnItem: deloadReturnCoachItem(deloadReturn),
      periItem: periNutritionCoachItem(periNutrition),
      ledgerItem: ledgerCoachItem(ledgerReport, ledgerDue),
      driverItem: driverCoachItem(performanceDrivers),
      responseItem: responseProfileCoachItem(responseProfile),
      roiItem: roiCoachItem(exerciseRoi),
      scorecardItem: scorecardCoachItem(muscleScorecard),
      lockItem: readinessCoachItem(analysisLocks),
      blockItem: blockCoachItem(blockCompare),
      anomalyItem: anomalyCoachItem(anomalyWatch),
      proximityItem: proximityCoachItem(proximityReport, {
        // Hacim eşiğin altındayken "daha sert çalış" demek yanlış sırayla
        // müdahale etmek olurdu: önce eşiği geç, sonra yakınlığı ayarla.
        volumeBelowThreshold: weekPlanResult.statuses?.some(x => x.status === 'under'),
      }),
      trainingAgeItem: trainingAgeCoachItem(trainingAge, settings.experienceLevel),
      sessionCeilingItem: sessionCeiling.ok ? null : {
        key: 'session-ceiling',
        title: `${sessionCeiling.items[0].muscle} tek seansta ${sessionCeiling.items[0].sets} kesirli set`,
        detail: `Seans başına ~${sessionCeiling.ceiling} kesirli setten sonra ek fayda ölçülemiyor — bu haftalık hacimden AYRI bir kısıt. Haftalık toplamın doğru olsa bile tek güne yığılınca kaybediliyor. ${sessionCeiling.splittable.includes(sessionCeiling.items[0].muscle) ? 'Aynı hacmi iki güne bölmek tavanın altına indirir.' : 'Bölmek bile tek başına yetmeyebilir; hacmi de gözden geçir.'}`,
      },
      optimalVolumeItem,
      deload,
      deloadSuggestion,
      gender: profileGender,
      cycle: todayCycleSummary,
      coachProtocol: activeCoachProtocol,
    });
  }, [readiness, todayCoach, sortedWorkouts, sortedMetrics, computedComp,
    settings.nutritionGoal, settings.proteinPerFfmBulk, settings.proteinPerFfmCut,
    settings.experienceLevel, settings.volumeTargets, dashboardStats, plateauInsights, deload, deloadSuggestion,
    mesocycle, mesocycleInstructions, selectionReport, frequencyReport,
    painReport, strengthBalance, consistencyReport, adherenceReport, planExecutionReport, dataHealthReport,
    weekProjection, prWatch, rirCalibration, lastSessionQuality,
    cardioReport, cardioSuggestion, restingHrReport, painScan, painRegions,
    plateauReport, restReport, timeOfDayReport, techniqueReport, orderReport, frequencyPlan,
    sideBalance, waterReport, weakLinks, formCurve, restProfile, settings.restSeconds,
    strengthStandards, effortDistribution, rotationReport, bodyRatios, deloadReturn, periNutrition,
    ledgerReport, ledgerDue, performanceDrivers, responseProfile, exerciseRoi, muscleScorecard,
    analysisLocks, blockCompare, anomalyWatch, proximityReport, trainingAge, sessionCeiling,
    settings.experienceLevel, weekPlanResult.statuses, optimalVolumeItem,
    profileGender, todayCycleSummary, activeCoachProtocol, activeWorkout]);

  // Koç hafızası: ertelenen/kapatılan maddeler ve çelişki çözümü. Ham liste
  // yerine bu sonuç gösteriliyor.
  const coachView = useMemo(() => {
    const hafiza = applyCoachMemory(coachActions, settings.coachMemory, getLocalDateString());
    // Odak hafızadan SONRA uygulanıyor: ertelenmiş bir maddeyi öne çekmenin
    // anlamı yok, ve çelişki elemesi önceliğe göre çalışıyor.
    const odak = applyCoachFocus(hafiza.items, settings.coachFocus);
    return { ...hafiza, items: odak.items, focus: odak.focus, focusShifted: odak.shifted };
  }, [coachActions, settings.coachMemory, settings.coachFocus]);

  /**
   * 7.7 karar panosu. Koç maddelerini yeniden hesaplamıyor; görünür listedeki
   * maddelere zaman ufku ve kanıt açıklaması ekliyor. Kapasite puanında eksik
   * sinyaller sıfır sayılmadığı için veri girmemek sahte bir kötü gün üretmez.
   */
  const coachBriefing = useMemo(() => buildCoachBriefing({
    actions: coachView.items,
    readiness,
    sleep: todayCoach?._signals?.sleep || null,
    restingHr: restingHrReport,
    painReport,
    formCurve,
    acwr: dashboardStats,
  }), [coachView.items, readiness, todayCoach, restingHrReport, painReport, formCurve, dashboardStats]);

  const optimalVolumeProfile = useMemo(() => buildOptimalVolumeProfile({
    weeklyHistory: weeklyVolumeHistory,
    planStatuses: weekPlanResult.statuses,
    currentVolume: dashboardStats.muscleVolume,
    capacity: coachBriefing.capacity,
    experienceLevel: settings.experienceLevel,
  }), [weeklyVolumeHistory, weekPlanResult.statuses, dashboardStats.muscleVolume,
    coachBriefing.capacity, settings.experienceLevel]);

  const coachCalibration = useMemo(
    () => buildCoachCalibration(coachLedger),
    [coachLedger]);

  /** Koç ve analiz kartlarının kullandığı tek yönlendirme tablosu. */
  const handleCoachAction = useCallback((hedef) => {
    const action = ({
      workout: () => handleStartRequest(todayCoach?.workoutTemplate || null),
      cardio: () => setIsCardioOpen(true),
      nutrition: () => handleChangeView('nutrition'),
      wellness: () => { setWellnessTab('sleep'); setIsWellnessOpen(true); },
      metrics: () => { setProgressTab('body'); handleChangeView('progress'); },
      progress: () => { setProgressTab('analysis'); setAnalysisType('1rm'); handleChangeView('progress'); },
      analysis: () => { setProgressTab('analysis'); handleChangeView('progress'); },
      plan: () => setIsWeekPlanOpen(true),
      deload: () => setIsDeloadOpen(true),
      mesocycle: () => setIsMesocycleOpen(true),
      pain: () => setIsPainOpen(true),
      dataHealth: () => setIsDataHealthOpen(true),
      mergeExercises: () => setIsMergeOpen(true),
      volumeTargets: () => setIsVolumeTargetsOpen(true),
      compareExercises: () => setIsCompareOpen(true),
      autoAdapt: () => setIsAutoAdaptOpen(true),
      yearReview: () => setIsYearReviewOpen(true),
      coachLedger: () => setIsLedgerOpen(true),
      blockCompare: () => setIsBlockCompareOpen(true),
      scenario: () => setIsScenarioOpen(true),
      evidence: () => setIsEvidenceOpen(true),
      wizard: () => setIsWizardOpen(true),
      coach: () => setIsCoachCenterOpen(true),
      cycle: () => { setProgressTab('cycle'); handleChangeView('progress'); },
    })[hedef];
    action?.();
  }, [handleStartRequest, todayCoach, handleChangeView]);

  const handleSnoozeCoach = useCallback((key) => {
    setSettings(prev => ({ ...prev, coachMemory: snoozeCoachItem(prev.coachMemory, key) }));
    showToast('Bir hafta ertelendi.');
  }, [setSettings, showToast]);

  const handleDismissCoach = useCallback((key) => {
    setSettings(prev => ({ ...prev, coachMemory: dismissCoachItem(prev.coachMemory, key) }));
    showToast('Bu madde bir daha gösterilmeyecek.');
  }, [setSettings, showToast]);

  const handleRestoreCoach = useCallback(() => {
    setSettings(prev => ({ ...prev, coachMemory: restoreCoachItem(prev.coachMemory) }));
    showToast('Gizlenen koç maddeleri geri açıldı.');
  }, [setSettings, showToast]);

  const needsBackup = useMemo(() => {
    // Kaybedilecek bir şey yokken veri kaybı uyarısı göstermek, uygulamayı
    // ilk açan kişiye ilk gördüğü şey olarak turuncu bir alarm sunuyordu.
    // Uyarı ancak korunmaya değer bir geçmiş varken anlamlı.
    if (workouts.length < 3) return false;
    if (!lastBackupDate) return true;
    const diffDays = (todayTime - new Date(lastBackupDate).getTime()) / (1000 * 3600 * 24);
    return diffDays > 7;
  }, [lastBackupDate, todayTime, workouts.length]);

  return (
    <div className="luxury-app flex justify-center min-h-screen font-sans antialiased text-zinc-100 select-none">
      <div className="luxury-frame w-full max-w-[440px] h-[100dvh] flex flex-col relative overflow-hidden">

        {/* TOAST BİLDİRİMİ */}
        {toast && (
          <div role="status" aria-live="polite" className={`luxury-toast absolute top-4 left-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-mono animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-red-950/95 border border-red-800 text-red-100'
              : toast.type === 'warning'
                ? 'bg-amber-950/95 border border-amber-800 text-amber-100'
              : 'bg-zinc-900 border border-zinc-700 text-zinc-100'
          }`}>
            {toast.type === 'error'
              ? <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              : toast.type === 'warning'
                ? <WifiOff size={14} className="text-amber-400 shrink-0" />
                : <Activity size={14} className="text-cyan-400 shrink-0" />}
            <span className="leading-relaxed flex-1 min-w-0">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                  toastTimerRef.current = null;
                  const action = toast.action;
                  setToast(null);
                  action.onClick?.();
                }}
                className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white active:bg-white/20"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}

        {/* HEADER */}
        <header className="luxury-header pt-safe flex justify-between items-center z-10">
          <div className="pl-4 pr-2 py-3 flex items-center gap-2.5 min-w-0">
            <div className="luxury-brand-mark shrink-0">
              <Activity size={16} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h1 className="luxury-brand-title text-[13px] font-black uppercase whitespace-nowrap">
                Hypertrophy <strong>LAB</strong>
              </h1>
              <span className="text-[8px] font-medium text-zinc-600 uppercase tracking-[0.2em] block mt-0.5">
                Crafted by Afacan Tech
              </span>
            </div>
            <span className="luxury-version text-[8px] font-mono self-center whitespace-nowrap">v{pkg.version}</span>
          </div>
          <div className="flex items-center gap-0.5 pr-2 shrink-0">
            {!isOnline && (
              <span aria-label="Çevrimdışı; kayıtlar cihazda tutuluyor" title="Çevrimdışı · kayıtlar cihazda tutuluyor" className="w-7 h-7 rounded-full border border-amber-900/60 bg-amber-950/40 text-amber-400 flex items-center justify-center">
                <WifiOff size={12} />
              </span>
            )}
            <button
              onClick={() => setIsQuickCaptureOpen(true)}
              aria-label="Hızlı kayıt aç"
              className="luxury-icon-button luxury-icon-button--primary"
            >
              <Plus size={18} />
            </button>
            <button onClick={() => setIsGlobalSearchOpen(true)} aria-label="Uygulamada ara" className="luxury-icon-button">
              <Search size={18} />
            </button>
            <button onClick={() => setIsSettingsModalOpen(true)} aria-label="Ayarları aç" className="luxury-icon-button">
              <Settings size={18} />
            </button>
          </div>
        </header>
        <div className="h-px shrink-0 bg-zinc-950 overflow-hidden" aria-hidden="true">
          <div className={`h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-opacity ${isViewPending ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
        </div>
        <span className="sr-only" aria-live="polite">{isViewPending ? 'Sayfa hazırlanıyor' : ''}</span>

        {/* MAIN VIEW CONTENT */}
        <div className="flex-1 overflow-hidden relative z-[1]">
          {view === 'home' && (
            <Suspense fallback={<ViewLoadingFallback viewKey="home" />}>
            <HomeView
              needsBackup={needsBackup}
              dashboardStats={dashboardStats}
              templates={templates}
              setIsSettingsModalOpen={setIsSettingsModalOpen}
              handleStartRequest={handleStartRequest}
              setDeleteConfirm={setDeleteConfirm}
              onSelectMuscle={setDetailMuscle}
              onPreviewTemplate={setPreviewTemplate}
              onEditTemplate={(t) => { setBuilderWizardMode(false); setEditingTemplate(t); setIsBuilderOpen(true); }}
              customExercises={customExercises}
              restSeconds={settings.restSeconds}
              experienceLevel={settings.experienceLevel}
              onOpenTemplateBuilder={() => { setBuilderWizardMode(false); setIsBuilderOpen(true); }}
              onOpenTools={() => setIsToolsOpen(true)}
              onQuickCapture={() => setIsQuickCaptureOpen(true)}
              readiness={readiness}
              personalVolume={personalVolume}
              todayCoach={todayCoach}
              coachBriefing={coachBriefing}
              coachActions={coachView.items}
              // Her koç maddesi doğrudan ilgili ekranı açar; kullanıcı uyarıyı
              // okuyup nereye gideceğini ayrıca aramasın.
              onSnoozeCoach={handleSnoozeCoach}
              onDismissCoach={handleDismissCoach}
              onRestoreCoach={handleRestoreCoach}
              onApplyCoach={handleApplyCoachItem}
              onRejectCoach={handleRejectCoachItem}
              coachFocus={coachView.focus}
              onOpenLedger={() => setIsLedgerOpen(true)}
              ledgerOpenCount={ledgerReport.open}
              coachHiddenCount={coachView.hiddenCount}
              coachConflictCount={coachView.conflictCount}
              onCoachAction={handleCoachAction}
              onOpenEnergy={() => setIsEnergyDetailOpen(true)}
              onOpenWellness={() => { setWellnessTab('sleep'); setIsWellnessOpen(true); }}
              onOpenCardio={() => setIsCardioOpen(true)}
              gender={profileGender}
              cycleSummary={todayCycleSummary}
              onOpenCycle={() => { setProgressTab('cycle'); handleChangeView('progress'); }}
              weeklyCardioKcal={weeklyCardioKcal}
              showMuscleVolume={settings.showMuscleVolume}
              onToggleMuscleVolume={() => setSettings(prev => ({ ...prev, showMuscleVolume: !prev.showMuscleVolume }))}
              interfaceMode={settings.interfaceMode}
              onOpenTraining={() => handleChangeView('training')}
              onToggleTemplateFavorite={handleToggleTemplateFavorite}
            />
            </Suspense>
          )}

          <Suspense fallback={<ViewLoadingFallback viewKey={view} />}>
          {view === 'training' && (
            <div className="luxury-screen h-full flex flex-col bg-black">
              <div className="px-4 pt-4 pb-2 shrink-0">
                <div className="luxury-segmented grid grid-cols-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
                  <button
                    onClick={() => handleTrainingTabChange('lift')}
                    className={`py-2.5 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${trainingTab === 'lift' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}
                  >
                    Ağırlık
                  </button>
                  <button
                    onPointerEnter={() => void loadCardioView().catch(() => {})}
                    onFocus={() => void loadCardioView().catch(() => {})}
                    onClick={() => handleTrainingTabChange('cardio')}
                    className={`py-2.5 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${trainingTab === 'cardio' ? 'bg-red-600 text-white' : 'text-zinc-500'}`}
                  >
                    Kardiyo & Aktivite
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                {trainingTab === 'cardio' ? (
                  <Suspense fallback={null}>
                    <CardioView
                      embedded
                      report={cardioReport}
                      suggestion={cardioSuggestion}
                      cardioGoal={settings.cardioGoal}
                      onChangeCardioGoal={(next) => setSettings(prev => ({ ...prev, cardioGoal: next }))}
                      onOpenCardio={() => setIsCardioOpen(true)}
                      onEditEntry={(entry) => { setCardioContext({ workoutId: entry.workoutId, entry, date: entry.date }); setIsCardioOpen(true); }}
                      workouts={sortedWorkouts}
                      age={profileAge}
                      restingHr={settings.restingHr}
                      zoneMethod={settings.zoneMethod}
                      maxHrManual={settings.maxHrManual}
                      restingHrReport={restingHrReport}
                      onLogRestingHr={handleLogRestingHr}
                      cardioRecords={cardioRecords}
                      cardioTemplates={settings.cardioTemplates}
                      onApplyCardioTemplate={handleApplyCardioTemplate}
                      onDeleteCardioTemplate={handleDeleteCardioTemplate}
                      onSaveCardioTemplate={handleSaveCardioTemplate}
                      poolLength={settings.poolLength}
                      onChangeZoneSettings={(patch) => setSettings(prev => ({ ...prev, ...patch }))}
                      activityTargets={settings.activityTargets}
                      onChangeActivityTargets={(next) => setSettings(prev => ({ ...prev, activityTargets: next }))}
                    />
                  </Suspense>
                ) : (
            <TrainingView
              templates={templates}
              restSeconds={settings.restSeconds}
              weightKg={latestWeight}
              recentWorkout={recentStrengthWorkout}
              interfaceMode={settings.interfaceMode}
              recommendation={templateRecommendation}
              progressionBlocks={progressionBlocks}
              onOpenExercise={setProfileExercise}
              onStart={handleStartRequest}
              onRepeat={handleRepeatWorkout}
              onLibrary={() => setIsLibraryOpen(true)}
              onBuilder={() => { setBuilderWizardMode(false); setIsBuilderOpen(true); }}
              onWizard={() => setIsWizardOpen(true)}
              onStarter={() => setIsStarterOpen(true)}
              onWeekPlan={() => setIsWeekPlanOpen(true)}
              onCardio={() => setIsCardioOpen(true)}
              onCoach={() => setIsCoachCenterOpen(true)}
              onPreview={setPreviewTemplate}
              onEdit={(template) => { setBuilderWizardMode(false); setEditingTemplate(template); setIsBuilderOpen(true); }}
              onWizardEdit={(template) => { setBuilderWizardMode(true); setEditingTemplate(template); setIsBuilderOpen(true); }}
              onDuplicate={handleDuplicateTemplate}
              onDelete={(template) => setDeleteConfirm({ isOpen: true, type: 'template', id: template.id })}
              onToggleFavorite={handleToggleTemplateFavorite}
            />
                )}
              </div>
            </div>
          )}

          {view === 'nutrition' && (
            <NutritionView
              currentNutritionForm={currentNutritionForm}
              setCurrentNutritionForm={setCurrentNutritionForm}
              handleNutritionDateChange={handleNutritionDateChange}
              updateMeal={(id, field, value) => {
                setCurrentNutritionForm(prev => ({
                  ...prev,
                  meals: (prev.meals || []).map(m => {
                    if (m.id !== id) return m;
                    const next = { ...m, [field]: value };
                    // Makrolar elle değiştirildiğinde kalori de güncellenmeli;
                    // aksi halde geçmişte öğün dolu olsa bile 0 kcal görünüyordu.
                    if (['protein', 'carbs', 'fats'].includes(field)) {
                      next.calories = caloriesFromMacros(next.protein, next.carbs, next.fats);
                    }
                    return next;
                  })
                }));
              }}
              handleSaveNutrition={handleSaveNutrition}
              computedComp={computedComp}
              settings={settings}
              nutritionHistory={nutritionHistory}
              setIsFoodSearchOpen={setIsFoodSearchOpen}
              adaptiveTDEE={adaptiveTDEE}
              workouts={workouts}
              latestWeight={latestWeight}
              wellness={wellness}
              maintenanceCalories={maintenanceCalories}
              neatOpts={neatOpts}
              energyForRecord={energyForNutritionRecord}
              onOpenEnergyDetail={() => setIsEnergyDetailOpen(true)}
              bodyContextForDate={bodyContextForDate}
              mealTemplates={mealTemplates}
              setMealTemplates={setMealTemplates}
              dayTemplates={dayTemplates}
              setDayTemplates={setDayTemplates}
              coachProtocol={activeCoachProtocol}
              waterSummary={waterReport}
              waterTarget={waterTarget}
              onAddWater={handleAddWater}
              onToggleWaterHeat={(v) => setSettings(prev => ({ ...prev, waterHeatBonus: v }))}
            />
          )}

          {view === 'progress' && (
            <ProgressHubView
              tab={progressTab}
              setTab={setProgressTab}
              gender={profileGender}
              cycleProps={{
                records: cycleHistory,
                settings,
                setSettings,
                onUpdateDay: handleUpdateCycleDay,
                onDeleteDay: handleDeleteCycleDay,
              }}
              metricsProps={{
                currentMetricsForm,
                setCurrentMetricsForm,
                computedComp,
                handleSaveMetrics,
                setIsMeasurementGuideOpen,
                isMeasurementGuideOpen,
                setIsComparisonOpen,
                latestMetrics: sortedMetrics[0] || null,
                previousMetrics: sortedMetrics[1] || null,
                bodyRatios,
                gender: profileGender,
                onDateChange: handleMetricsDateChange,
                isExistingRecord: metricsHistory.some(m => m.date === currentMetricsForm.date),
                settings,
                setSettings,
                goalValues,
                weeklyKg: adaptiveTDEE?.insufficient ? 0 : (adaptiveTDEE?.weightChangePerWeek || 0),
                allExerciseNames: allExercisesNames,
                personalRecords,
                workouts,
              }}
              analyticsProps={{
                recordTimeline,
                weakLinks,
                formCurve,
                discovery,
                muscleScorecard,
                exerciseRoi,
                performanceDrivers,
                responseProfile,
                anomalyWatch,
                analysisLocks,
                setCounts,
                proximityReport,
                volumePhilosophy: settings.volumePhilosophy,
                currentVolume: dashboardStats.muscleVolume,
                restSeconds: settings.restSeconds,
                onOpenEvidence: () => setIsEvidenceOpen(true),
                coachBriefing,
                coachCalibration,
                optimalVolumeProfile,
                planExecution: planExecutionReport,
                sleepScores: sleepScoreByDay,
                onAction: handleCoachAction,
                onApplyCoach: handleApplyCoachItem,
                onOpenLedger: () => setIsLedgerOpen(true),
                onOpenPlan: () => setIsWeekPlanOpen(true),
                onOpenVolumeTargets: () => setIsVolumeTargetsOpen(true),
                analysisType,
                frequency: frequencyReport,
                setAnalysisType,
                bodyMetricKey,
                setBodyMetricKey,
                analysisExercise,
                setAnalysisExercise,
                metricsHistory,
                workouts,
                allExercisesNames,
                customExercises,
                experienceLevel: settings.experienceLevel,
                exercisePerformCounts,
                hidden1RMExercises: settings.hidden1RMExercises,
                onToggleHidden1RM: handleToggleHidden1RM,
                nutritionHistory: sortedNutrition,
                planResult: weekPlanResult,
                resolveLoad: resolveSetLoad,
                today: getLocalDateString(),
                cardioReport,
                cardioSuggestion,
                cardioGoal: settings.cardioGoal,
                onChangeCardioGoal: (next) => setSettings(prev => ({ ...prev, cardioGoal: next })),
                onOpenCardio: () => setIsCardioOpen(true),
                age: profileAge,
                bodyWeightKg: latestWeight,
                gender: profileGender,
                settings,
                computedComp,
                adaptiveTDEE,
              }}
            />
          )}

          {view === 'history' && (
            <HistoryView
              historyTab={historyTab}
              setHistoryTab={setHistoryTab}
              loadOptsFor={loadOptsFor}
              workouts={sortedWorkouts}
              metricsHistory={sortedMetrics}
              nutritionHistory={sortedNutrition}
              setDeleteConfirm={setDeleteConfirm}
              handleEditOldWorkoutDate={handleEditOldWorkoutDate}
              handleEditOldWorkout={handleEditOldWorkout}
              handleRepeatWorkout={handleRepeatWorkout}
              handleEditMetric={handleEditMetric}
              handleEditNutrition={handleEditNutrition}
              onAddWorkout={handleAddHistoricalWorkout}
              onAddCardio={handleOpenHistoricalCardio}
              onAddMetric={handleAddHistoricalMetric}
              onAddNutrition={handleAddHistoricalNutrition}
              onEditCardio={handleEditCardio}
              handleSaveAsTemplate={handleSaveAsTemplate}
              latestWeight={latestWeight}
              wellness={wellness}
              maintenanceCalories={maintenanceCalories}
              onUpdateNutrition={handleUpdateNutritionField}
              bodyContextForDate={bodyContextForDate}
              energyForRecord={energyForNutritionRecord}
            />
          )}
          </Suspense>

          {/* ACTIVE WORKOUT OVERLAY */}
          {activeWorkout && (
            <Suspense fallback={<ModalLoadingFallback />}>
            <ActiveWorkoutView
              activeWorkout={activeWorkout}
              setActiveWorkout={setActiveWorkout}
              setIsEndWorkoutModalOpen={setIsEndWorkoutModalOpen}
              setIsExerciseModalOpen={setIsExerciseModalOpen}
              getRecentExerciseData={getRecentExerciseData}
              personalRecords={personalRecords}
              customExercises={customExercises}
              settings={settings}
              updateSet={updateSet}
              onApplyProgressionPrescription={handleApplyProgressionPrescription}
              addSet={addSet}
              removeSet={removeSet}
              repsOnFocusRef={repsOnFocusRef}
              startRest={startRest}
              stopRest={stopRest}
              pauseRest={pauseRest}
              resumeRest={resumeRest}
              adjustRest={adjustRest}
              sessionRestMuted={sessionRestMuted}
              onToggleSessionRestMute={toggleSessionRestMute}
              onReplayRestAlert={handleTestRestAlert}
              restAlertFlash={restAlertFlash}
              onSetRestOverride={handleSetRestOverride}
              onOpenPlateCalc={(w, exerciseId) => setPlateCalc({ weight: w, exerciseId })}
              onSaveAsTemplate={() => handleSaveAsTemplate(null)}
              onToggleSuperset={handleToggleSuperset}
              onEditExercise={setEditorExercise}
              onMoveExercise={moveExercise}
              onSubstitute={(name, exerciseId) => setSubstituteFor({ name, exerciseId })}
              resolveLoad={(name, weight) => resolveSetLoad(name, weight, activeWorkout)}
              bodyweightInfoFor={bodyweightContext}
              deload={deload}
              deloadReturn={deloadReturn}
              painWarningFor={painWarningForExercise}
              onUseBackup={handleUseBackupExercise}
              onAddWarmup={handleAddWarmup}
              onRemoveWarmup={handleRemoveWarmup}
              onSetExerciseNote={handleSetExerciseNote}
              onSetSide={handleSetSide}
              pastNotesFor={pastNotesForExercise}
              sessionVolume={sessionVolumeReport}
              ghostRace={ghostRace}
              ghostTargetFor={ghostTargetForSet}
              timeCrunchPlan={timeCrunchPlan}
              onPreviewTimeCrunch={previewTimeCrunch}
              onApplyTimeCrunch={applyTimeCrunch}
              onCancelTimeCrunch={() => setTimeCrunchPlan(null)}
              sessionPace={buildSessionPace(activeWorkout, (() => {
                // Kronometrenin gösterdiği süre: biriken + çalışıyorsa aradan geçen.
                const t = activeWorkout.timer || {};
                let sn = t.accumulatedSeconds || 0;
                if (t.status === 'running' && t.startTime) sn += Math.floor((Date.now() - t.startTime) / 1000);
                return sn;
              })())}
              warmupRoutine={buildWarmupRoutine(activeWorkout.exercises, { customExercises })}
              onOpenCardio={() => setIsCardioOpen(true)}
              cardioKcal={totalCardioCalories(activeWorkout.cardio || [], latestWeight)}
              rest={rest}
              restSecondsLeft={restSecondsLeft}
            />
            </Suspense>
          )}
        </div>

        {/* BOTTOM NAVIGATION */}
        {!activeWorkout && (
          <Navbar view={view} setView={handleChangeView} onPreload={preloadView} isPending={isViewPending} />
        )}

        <Suspense fallback={<ModalLoadingFallback />}>
        {isQuickCaptureOpen && <QuickCaptureModal
          isOpen={isQuickCaptureOpen}
          onClose={() => setIsQuickCaptureOpen(false)}
          onSelect={handleQuickCapture}
          status={quickCaptureStatus}
        />}

        {isGlobalSearchOpen && <GlobalSearchModal
          isOpen={isGlobalSearchOpen}
          onClose={() => setIsGlobalSearchOpen(false)}
          exercises={allExercisesNames}
          templates={templates}
          workouts={sortedWorkouts}
          onNavigate={handleGlobalNavigate}
          onExercise={setEditorExercise}
          onTemplate={setPreviewTemplate}
          onTool={(key) => {
            const action = {
              library: () => setIsLibraryOpen(true),
              weekPlan: () => setIsWeekPlanOpen(true),
              energy: () => setIsEnergyDetailOpen(true),
              sleep: () => { setWellnessTab('sleep'); setIsWellnessOpen(true); },
              deload: () => setIsDeloadOpen(true),
              starter: () => setIsStarterOpen(true),
              mesocycle: () => setIsMesocycleOpen(true),
              pain: () => setIsPainOpen(true),
              dataHealth: () => setIsDataHealthOpen(true),
              mergeExercises: () => setIsMergeOpen(true),
              volumeTargets: () => setIsVolumeTargetsOpen(true),
              compareExercises: () => setIsCompareOpen(true),
              autoAdapt: () => setIsAutoAdaptOpen(true),
              yearReview: () => setIsYearReviewOpen(true),
              coachLedger: () => setIsLedgerOpen(true),
              blockCompare: () => setIsBlockCompareOpen(true),
              scenario: () => setIsScenarioOpen(true),
              evidence: () => setIsEvidenceOpen(true),
              wizard: () => setIsWizardOpen(true),
              weeklyReview: () => setIsWeeklyReviewOpen(true),
              coach: () => setIsCoachCenterOpen(true),
            }[key];
            action?.();
          }}
        />}

        {isOnboardingOpen && <OnboardingModal
          isOpen={isOnboardingOpen}
          settings={settings}
          onFinish={(patch) => {
            setSettings(prev => ({ ...prev, ...patch }));
            setIsOnboardingOpen(false);
          }}
        />}

        {/* SETTINGS MODAL */}
        {isSettingsModalOpen && <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          setSettings={setSettings}
          handleExportData={handleExportData}
          handleImportFileSelect={handleImportFileSelect}
          setIsQRModalOpen={setIsQRModalOpen}
          workouts={workouts}
          nutritionHistory={nutritionHistory}
          lastBackupDate={lastBackupDate}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onOpenReleaseNotes={() => setIsReleaseNotesOpen(true)}
          onOpenStoreReadiness={() => setIsStoreReadinessOpen(true)}
          bodyweightAudit={bodyweightAudit}
          onNormalizeBodyweight={handleNormalizeBodyweight}
          onToggleRestNotification={handleToggleRestNotification}
          onTestRestAlert={handleTestRestAlert}
          volumePhilosophy={settings.volumePhilosophy}
          onChangeVolumePhilosophy={handleSetVolumePhilosophy}
          gradedEffectiveSets={settings.gradedEffectiveSets}
          onToggleGradedSets={handleToggleGradedSets}
          effectiveSetComparison={effectiveSetComparison}
          trainingAgeSuggestion={trainingAge}
          coachFocus={settings.coachFocus}
          onChangeCoachFocus={handleSetCoachFocus}
          trainingGoal={settings.trainingGoal}
          onChangeTrainingGoal={handleSetTrainingGoal}
          onImportProgramCode={handleImportTemplateCode}
          notificationState={notificationPermission()}
          onExportCsv={handleExportCsv}
          profileGender={profileGender}
        />}

        {/* RELEASE NOTES MODAL */}
        {isReleaseNotesOpen && <ReleaseNotesModal
          isOpen={isReleaseNotesOpen}
          onClose={() => setIsReleaseNotesOpen(false)}
        />}

        {isStoreReadinessOpen && <StoreReadinessModal
          isOpen={isStoreReadinessOpen}
          onClose={() => setIsStoreReadinessOpen(false)}
          checklist={settings.storeChecklist}
          onChangeChecklist={(storeChecklist) => setSettings(prev => ({ ...prev, storeChecklist }))}
        />}

        {pendingImport && <BackupImportPreviewModal
          isOpen={Boolean(pendingImport)}
          fileName={pendingImport.fileName}
          inspection={pendingImport.inspection}
          migrations={pendingImport.migrations}
          onClose={() => setPendingImport(null)}
          onApply={applyPendingImport}
        />}

        {/* QR CODE MODAL */}
        {isQRModalOpen && <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          fullData={createBackupPayload({
            workouts, templates, customExercises, customFoods, recentFoods,
            mealTemplates, dayTemplates,
            metricsHistory, nutritionHistory, wellness, cycleHistory, settings,
          }, { version: pkg.version })}
          onImportData={(data) => handleImportRequest(data, { fileName: 'Cihaz aktarım kodu' })}
        />}

        {/* FOOD SEARCH MODAL */}
        {isFoodSearchOpen && <FoodSearchModal
          isOpen={isFoodSearchOpen}
          onClose={() => setIsFoodSearchOpen(false)}
          customFoods={customFoods}
          setCustomFoods={setCustomFoods}
          recentFoods={recentFoods}
          favoriteFoods={settings.favoriteFoods || []}
          onToggleFavorite={(food) => {
            setSettings(prev => {
              const favorites = Array.isArray(prev.favoriteFoods) ? prev.favoriteFoods : [];
              const exists = favorites.some(item => item.name === food.name);
              return {
                ...prev,
                favoriteFoods: exists
                  ? favorites.filter(item => item.name !== food.name)
                  : [food, ...favorites].slice(0, 16),
              };
            });
          }}
          onAddFoodToMeal={(meal, sourceFood) => {
            setCurrentNutritionForm(prev => ({
              ...prev,
              meals: [...(prev.meals || []), { id: generateId(), ...meal }]
            }));
            // Kaynak besin (100g bazlı değerleriyle) sık kullanılanlara yazılır;
            // öğün kaydı porsiyona göre ölçeklenmiş olduğu için tekrar
            // kullanılamazdı. Aynı besin başa alınır, liste 8 ile sınırlanır.
            if (sourceFood?.name) {
              setRecentFoods(prev => [
                sourceFood,
                ...prev.filter(f => f.name !== sourceFood.name),
              ].slice(0, 8));
            }
            showToast(`${meal.name} öğüne eklendi.`);
          }}
        />}

        {/* METRICS COMPARISON MODAL */}
        {isComparisonOpen && <MetricsComparisonModal
          isOpen={isComparisonOpen}
          onClose={() => setIsComparisonOpen(false)}
          metricsHistory={metricsHistory}
        />}

        {/* TEMPLATE PREVIEW */}
        {previewTemplate && <TemplatePreviewModal
          isOpen={Boolean(previewTemplate)}
          onClose={() => setPreviewTemplate(null)}
          template={previewTemplate}
          customExercises={customExercises}
          restSeconds={settings.restSeconds}
          experienceLevel={settings.experienceLevel}
          weightKg={latestWeight}
          gender={profileGender}
          onStart={(t) => handleStartRequest(t)}
          onEdit={(t) => { setPreviewTemplate(null); setBuilderWizardMode(false); setEditingTemplate(t); setIsBuilderOpen(true); }}
          onWizardEdit={(t) => { setPreviewTemplate(null); setBuilderWizardMode(true); setEditingTemplate(t); setIsBuilderOpen(true); }}
          onDelete={(t) => { setPreviewTemplate(null); setDeleteConfirm({ isOpen: true, type: 'template', id: t.id }); }}
          onToggleFavorite={(t) => {
            handleToggleTemplateFavorite(t);
            setPreviewTemplate(prev => prev ? { ...prev, favorite: !prev.favorite } : prev);
          }}
          onReplaceExercise={(t, name) => setSubstituteFor({ name, templateId: t.id })}
          nextTargets={nextSessionTargetsFor(previewTemplate)}
          onCopyCode={() => handleCopyTemplateCode(previewTemplate)}
          versions={previewTemplate.versions || []}
          versionDiff={(v) => describeVersionDiff(v, previewTemplate)}
          onRestoreVersion={(index) => {
            handleRestoreTemplateVersion(previewTemplate.id, index);
            setPreviewTemplate(null);
          }}
        />}

        {/* EXERCISE MAPPING EDITOR */}
        {editorExercise && <ExerciseEditorModal
          key={editorExercise || 'none'}
          isOpen={Boolean(editorExercise)}
          onClose={() => setEditorExercise(null)}
          exerciseName={editorExercise || ''}
          currentContributions={editorExercise ? detectMuscleGroup(editorExercise, customExercises).contributions : {}}
          currentMechanics={editorExercise ? detectMuscleGroup(editorExercise, customExercises).mechanics : 'Push'}
          currentNote={exerciseSetupNote(editorExercise, customExercises)}
          isOverridden={customExercises.some(ex => (typeof ex === 'object' ? ex.name : ex) === editorExercise)}
          onSave={(data) => handleSaveExerciseMapping(editorExercise, data)}
          onReset={() => handleResetExerciseMapping(editorExercise)}
        />}

        {/* HAREKET KÜTÜPHANESİ */}
        {isLibraryOpen && <ExerciseLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          allExerciseNames={allExercisesNames}
          getContributions={getExerciseContributions}
          isUserAdded={isUserAddedExercise}
          performedNames={performedNames}
          hiddenNames={pickerHiddenNames}
          pinnedNames={pinnedExerciseNames}
          onEditExercise={setEditorExercise}
          onDeleteExercise={(name) => setDeleteConfirm({ isOpen: true, type: 'exercise', id: name })}
          onToggleHidden={handleTogglePickerVisibility}
          onTogglePinned={handleTogglePinnedExercise}
          onOpenProfile={setProfileExercise}
          onAddNew={() => { setPickerReturnsToLibrary(true); setIsLibraryOpen(false); setIsExerciseModalOpen(true); setIsAddingCustom(true); }}
        />}

        {profileExercise && <ExerciseProfileModal
          profile={exerciseProfile}
          setupNote={exerciseSetupNote(profileExercise, customExercises)}
          pinned={pinnedExerciseNames.has(profileExercise)}
          onTogglePinned={() => handleTogglePinnedExercise(profileExercise)}
          onEdit={() => { setProfileExercise(null); setEditorExercise(profileExercise); }}
          repRange={profileRepRange}
          onChangeRepRange={(min, max) => setSettings(prev => ({
            ...prev,
            repRangeOverrides: setRepRangeOverride(prev.repRangeOverrides, profileExercise, min, max),
          }))}
          progressionRule={progressionFor(profileExercise, settings.progressionRules)}
          onChangeProgression={(key) => handleSetProgressionRule(profileExercise, key)}
          progressionBlock={profileProgressionPlan}
          progressionBlockReport={progressionBlockReport}
          progressionBlockDefaults={progressionBlockDefaults}
          onSaveProgressionBlock={(draft) => handleSaveProgressionBlock(profileExercise, draft)}
          onRemoveProgressionBlock={() => handleRemoveProgressionBlock(profileExercise)}
          repRecords={repRecordsForExercise(profileExercise)}
          plateau={plateauReport.items.find(x => x.name === profileExercise) || null}
          onStart={() => {
            const name = profileExercise;
            setProfileExercise(null);
            setIsLibraryOpen(false);
            handleStartRequest({
              name: `${name} Odak`,
              exercises: [{
                name,
                sets: Array.from({ length: 3 }, () => ({
                  weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal',
                })),
              }],
            });
          }}
          onClose={() => setProfileExercise(null)}
        />}

        {/* PROGRAM OLUŞTURUCU */}
        {isBuilderOpen && <TemplateBuilderModal
          key={`${editingTemplate?.id || builderDraft?.key || 'new'}-${builderWizardMode ? 'wizard' : 'plain'}`}
          isOpen={isBuilderOpen}
          onClose={() => { setIsBuilderOpen(false); setEditingTemplate(null); setBuilderDraft(null); setBuilderWizardMode(false); }}
          onSave={handleSaveProgram}
          onUpdate={handleUpdateTemplate}
          editing={editingTemplate}
          initialDraft={builderDraft}
          customExercises={customExercises}
          restSeconds={settings.restSeconds}
          experienceLevel={settings.experienceLevel}
          weightKg={latestWeight}
          optimalProfile={optimalVolumeProfile}
          wizardMode={builderWizardMode}
          libraryProps={{
            allExerciseNames: allExercisesNames,
            getContributions: getExerciseContributions,
            isUserAdded: isUserAddedExercise,
            performedNames,
            hiddenNames: pickerHiddenNames,
          }}
        />}

        {/* HAFTALIK PROGRAM */}
        {isWeekPlanOpen && <WeeklyPlanModal
          isOpen={isWeekPlanOpen}
          onClose={() => setIsWeekPlanOpen(false)}
          plans={settings.weekPlans || []}
          activePlanId={settings.activePlanId}
          onChangePlans={(list) => setSettings(prev => ({ ...prev, weekPlans: list }))}
          onChangeActive={(id) => setSettings(prev => ({ ...prev, activePlanId: id }))}
          templates={templates}
          customExercises={customExercises}
          restSeconds={settings.restSeconds}
          experienceLevel={settings.experienceLevel}
          weightKg={latestWeight}
          workouts={workouts}
          gender={profileGender}
          onExportCalendar={handleExportCalendar}
        />}

        {isMesocycleOpen && <MesocycleModal
          isOpen={isMesocycleOpen}
          onClose={() => setIsMesocycleOpen(false)}
          mesocycle={settings.mesocycle || emptyMesocycle()}
          onChange={(next) => setSettings(prev => ({ ...prev, mesocycle: next }))}
          statuses={weekPlanResult.statuses}
          muscleVolume={weekPlanResult.muscleVolume}
          experienceLevel={settings.experienceLevel}
          volumePhilosophy={settings.volumePhilosophy}
        />}

        {isWizardOpen && <ProgramWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          onInstall={handleInstallGenerated}
          onCustomize={(built) => {
            const draft = draftFromGeneratedProgram(built, generateId);
            if (!draft) return;
            setBuilderDraft({ ...draft, key: generateId() });
            setIsWizardOpen(false);
            setBuilderWizardMode(true);
            setIsBuilderOpen(true);
          }}
          experienceLevel={settings.experienceLevel}
          customExercises={customExercises}
          performedNames={performedNames}
          existingTemplateCount={templates.length}
          allExerciseNames={allExercisesNames}
          activePlan={activePlan}
          templates={templates}
          painExclusions={painExclusionSuggestions}
        />}

        {isPainOpen && <PainLogModal
          isOpen={isPainOpen}
          onClose={() => setIsPainOpen(false)}
          log={settings.painLog || []}
          onChange={(next) => setSettings(prev => ({ ...prev, painLog: next }))}
          workouts={sortedWorkouts}
          exerciseNames={allExercisesNames}
          today={getLocalDateString()}
        />}

        {isAutoAdaptOpen && <AutoAdaptModal
          isOpen={isAutoAdaptOpen}
          onClose={() => setIsAutoAdaptOpen(false)}
          report={adaptations}
          onApply={handleApplyAdaptation}
        />}

        {isLedgerOpen && <CoachLedgerModal
          isOpen={isLedgerOpen}
          onClose={() => setIsLedgerOpen(false)}
          ledger={coachLedger}
          stats={ledgerReport}
          due={ledgerDue}
          onSettle={handleSettleLedger}
        />}

        {isBlockCompareOpen && <BlockCompareModal
          isOpen={isBlockCompareOpen}
          onClose={() => setIsBlockCompareOpen(false)}
          buildReport={blockCompareFor}
        />}

        {isEvidenceOpen && <EvidenceModal
          isOpen={isEvidenceOpen}
          onClose={() => setIsEvidenceOpen(false)}
        />}

        {isScenarioOpen && <ScenarioModal
          isOpen={isScenarioOpen}
          onClose={() => setIsScenarioOpen(false)}
          muscleStates={scenarioMuscleStates}
          profile={responseProfile}
          restSeconds={settings.restSeconds}
        />}

        {isYearReviewOpen && <YearReviewModal
          isOpen={isYearReviewOpen}
          onClose={() => setIsYearReviewOpen(false)}
          review={yearReview}
        />}

        {isCompareOpen && <ExerciseCompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          allNames={allExercisesNames}
          workouts={sortedWorkouts}
          resolveLoad={resolveSetLoad}
          customExercises={customExercises}
        />}

        {isVolumeTargetsOpen && <VolumeTargetsModal
          isOpen={isVolumeTargetsOpen}
          onClose={() => setIsVolumeTargetsOpen(false)}
          overrides={settings.volumeTargets}
          experienceLevel={settings.experienceLevel}
          weeklyVolumeHistory={weeklyVolumeHistory}
          onChange={(next) => setSettings(prev => ({ ...prev, volumeTargets: next }))}
        />}

        {isMergeOpen && <ExerciseMergeModal
          isOpen={isMergeOpen}
          onClose={() => setIsMergeOpen(false)}
          candidates={mergeCandidates}
          allNames={allExercisesNames}
          previewFor={mergePreviewFor}
          onMerge={handleMergeExercises}
        />}

        {isDataHealthOpen && <DataHealthModal
          isOpen={isDataHealthOpen}
          onClose={() => setIsDataHealthOpen(false)}
          workouts={sortedWorkouts}
          storageHealth={dataRepository.health()}
          onRemoveEmpty={handleRemoveEmptyWorkouts}
        />}

        {/* HAZIR PROGRAMLAR */}
        {isStarterOpen && <StarterProgramModal
          isOpen={isStarterOpen}
          onClose={() => setIsStarterOpen(false)}
          onInstall={handleInstallStarter}
          onCustomize={(key) => {
            const draft = draftFromStarterProgram(findStarterProgram(key), generateId);
            if (!draft) return;
            setBuilderDraft({ ...draft, key: generateId() });
            setIsStarterOpen(false);
            setBuilderWizardMode(true);
            setIsBuilderOpen(true);
          }}
          existingTemplateCount={templates.length}
        />}

        {/* DELOAD */}
        {/* SEANS RAPORU */}
        {sessionReport && <SessionReportModal
          report={sessionReport}
          // Aynı şablonun son iki seansı: "geçen sefere göre ne değişti"
          // sorusu için iki kaydı elle açıp göz kararı kıyaslamak gerekiyordu.
          comparison={(() => {
            const cift = findComparableSessions(sortedWorkouts, sessionReport.sourceTemplateId);
            return cift ? compareSessions(cift.current, cift.previous, { resolveLoad: resolveSetLoad }) : null;
          })()}
          onClose={() => setSessionReport(null)}
        />}

        {/* HAFTALIK GÖZDEN GEÇİRME */}
        {isWeeklyReviewOpen && <WeeklyReviewModal
          isOpen={isWeeklyReviewOpen}
          onClose={() => setIsWeeklyReviewOpen(false)}
          workouts={workouts}
          customExercises={customExercises}
          experienceLevel={settings.experienceLevel}
          planDays={weekPlanDays}
          wellness={wellness}
          energyWeeks={weeklyEnergy}
          nutritionGoal={settings.nutritionGoal}
          zoneOpts={zoneOpts}
          activeProtocol={activeCoachProtocol}
          onActivateProtocol={handleActivateCoachProtocol}
          onOpenCoach={() => { setIsWeeklyReviewOpen(false); setIsCoachCenterOpen(true); }}
        />}

        {isCoachCenterOpen && <CoachCenterModal
          isOpen={isCoachCenterOpen}
          onClose={() => setIsCoachCenterOpen(false)}
          workouts={workouts}
          customExercises={customExercises}
          experienceLevel={settings.experienceLevel}
          planDays={weekPlanDays}
          wellness={wellness}
          energyWeeks={weeklyEnergy}
          nutritionGoal={settings.nutritionGoal}
          activeProtocol={activeCoachProtocol}
          history={settings.coachHistory || []}
          briefing={coachBriefing}
          onCoachAction={handleCoachAction}
          onApplyCoach={handleApplyCoachItem}
          onActivate={handleActivateCoachProtocol}
          onDeactivate={handleDeactivateCoachProtocol}
        />}

        {isDeloadOpen && <DeloadModal
          isOpen={isDeloadOpen}
          onClose={() => setIsDeloadOpen(false)}
          deload={settings.deload || emptyDeload()}
          onChange={(next) => setSettings(prev => ({ ...prev, deload: next }))}
          suggestion={deloadSuggestion}
        />}

        {/* HAREKET İKAMESİ */}
        {substituteFor && <SubstituteModal
          isOpen={Boolean(substituteFor)}
          onClose={() => setSubstituteFor(null)}
          exerciseName={substituteFor?.name || ''}
          allExerciseNames={allExercisesNames}
          customExercises={customExercises}
          performedNames={performedNames}
          onPick={(name) => {
            // Aynı ekran iki yerden açılıyor: canlı seansta hareket kimliğiyle,
            // şablon önizlemesinde şablon kimliğiyle.
            if (substituteFor?.exerciseId) handleSubstituteExercise(substituteFor.exerciseId, name);
            else if (substituteFor?.templateId) {
              handleReplaceTemplateExercise(substituteFor.templateId, substituteFor.name, name);
              setPreviewTemplate(prev => (prev && prev.id === substituteFor.templateId
                ? {
                  ...prev,
                  exercises: (prev.exercises || []).map(ex => (ex.name !== substituteFor.name ? ex : {
                    ...ex, name, sets: (ex.sets || []).map(set => ({ ...set, weight: '', reps: '' })),
                  })),
                }
                : prev));
            }
          }}
        />}

        {/* REKOR KUTLAMASI */}
        {prCelebration && <PRCelebration record={prCelebration} onDone={() => setPrCelebration(null)} />}

        {/* UYKU / MEDİTASYON & ESNEME */}
        {isWellnessOpen && <WellnessModal
          key={wellnessTab}
          initialTab={wellnessTab}
          isOpen={isWellnessOpen}
          onClose={() => setIsWellnessOpen(false)}
          records={wellness}
          todayStr={getLocalDateString()}
          weightKg={latestWeight}
          onUpdateDay={handleUpdateWellnessDay}
        />}

        {/* ARAÇLAR */}
        {isToolsOpen && <ToolsModal
          isOpen={isToolsOpen}
          onClose={() => setIsToolsOpen(false)}
          showCycle={profileGender === 'female'}
          onSelect={(key) => {
            const ac = {
              library: () => setIsLibraryOpen(true),
              builder: () => { setBuilderWizardMode(false); setIsBuilderOpen(true); },
              weekPlan: () => setIsWeekPlanOpen(true),
              plates: () => setPlateCalc({ weight: 0 }),
              cardio: () => setIsCardioOpen(true),
              energy: () => setIsEnergyDetailOpen(true),
              compare: () => setIsComparisonOpen(true),
              guide: () => setIsMeasurementGuideOpen(true),
              report: () => setIsReportCardOpen(true),
              sleep: () => { setWellnessTab('sleep'); setIsWellnessOpen(true); },
              deload: () => setIsDeloadOpen(true),
              starter: () => setIsStarterOpen(true),
              mesocycle: () => setIsMesocycleOpen(true),
              pain: () => setIsPainOpen(true),
              dataHealth: () => setIsDataHealthOpen(true),
              mergeExercises: () => setIsMergeOpen(true),
              volumeTargets: () => setIsVolumeTargetsOpen(true),
              compareExercises: () => setIsCompareOpen(true),
              autoAdapt: () => setIsAutoAdaptOpen(true),
              yearReview: () => setIsYearReviewOpen(true),
              coachLedger: () => setIsLedgerOpen(true),
              blockCompare: () => setIsBlockCompareOpen(true),
              scenario: () => setIsScenarioOpen(true),
              evidence: () => setIsEvidenceOpen(true),
              wizard: () => setIsWizardOpen(true),
              weeklyReview: () => setIsWeeklyReviewOpen(true),
              coach: () => setIsCoachCenterOpen(true),
              mind: () => { setWellnessTab('mind'); setIsWellnessOpen(true); },
              cycle: () => { setProgressTab('cycle'); handleChangeView('progress'); },
            }[key];
            ac?.();
          }}
        />}

        {/* KALORİ DETAYI */}
        {isEnergyDetailOpen && <EnergyDetailModal
          isOpen={isEnergyDetailOpen}
          onClose={() => setIsEnergyDetailOpen(false)}
          nutritionHistory={sortedNutrition}
          todayForm={currentNutritionForm}
          maintenance={maintenanceCalories}
          computedComp={computedComp}
          dayCalories={dayCaloriesFor}
          neatOpts={neatOpts}
          planDays={weekPlanDays}
          plannedCardioKcal={weekPlanResult.totalCardioKcal || weeklyCardioKcal}
          cardioIsPlanned={weekPlanResult.totalCardioKcal > 0}
          avgDailyExercise={avgDailyExercise}
          estimatedMacros={estimatedTefMacros}
          energyForRecord={energyForNutritionRecord}
          maintenanceEstimated={!(adaptiveTDEE?.tdee > 0)}
          onSetDayNeat={handleSetDayNeat}
          defaultNeatMultiplier={settings.neatMultiplier || 1}
        />}

        {/* KARDİYO */}
        {isCardioOpen && <CardioModal
          key={`${cardioContext?.workoutId || 'new'}-${cardioContext?.entry?.id || cardioContext?.presetId || cardioContext?.date || 'today'}`}
          isOpen={isCardioOpen}
          onClose={() => { setIsCardioOpen(false); setCardioContext(null); }}
          onSave={handleSaveCardio}
          onDelete={handleDeleteCardio}
          weightKg={latestWeight}
          age={profileAge}
          zoneOpts={zoneOpts}
          poolLength={settings.poolLength}
          onChangePool={(v) => setSettings(prev => ({ ...prev, poolLength: v }))}
          // Tek bir kaydı düzenlerken liste gizlenir; onun dışında (bugün ya da
          // geçmiş bir gün) o güne eklenenler görünür kalır, çünkü aynı güne
          // arka arkaya birkaç aktivite eklenebiliyor.
          entriesFor={cardioContext?.entry ? null : cardioEntriesFor}
          planned={!cardioContext || cardioContext.date === getLocalDateString() ? todayPlannedCardio : []}
          initialDate={cardioContext?.date || getLocalDateString()}
          editingEntry={cardioContext?.entry || null}
          presetEntry={cardioContext?.preset || null}
        />}

        {/* PLATE CALCULATOR */}
        {plateCalc && <PlateCalculatorModal
          isOpen={Boolean(plateCalc)}
          onClose={() => setPlateCalc(null)}
          onAddWarmup={plateCalc?.exerciseId
            ? (steps) => addWarmupSets(plateCalc.exerciseId, steps)
            : null}
          initialWeight={plateCalc?.weight || 0}
          availablePlates={settings.availablePlates}
        />}

        {/* MUSCLE DETAIL MODAL */}
        {detailMuscle && <MuscleDetailModal
          isOpen={Boolean(detailMuscle)}
          onClose={() => setDetailMuscle(null)}
          muscle={detailMuscle}
          total={detailMuscle ? (dashboardStats.muscleVolume[detailMuscle] || 0) : 0}
          breakdown={detailMuscle ? (muscleBreakdown[detailMuscle] || []) : []}
          experienceLevel={settings.experienceLevel}
        />}

        {/* REPORT CARD MODAL */}
        {isReportCardOpen && <ReportCardModal
          isOpen={isReportCardOpen}
          onClose={() => setIsReportCardOpen(false)}
          workouts={workouts}
          personalRecords={personalRecords}
        />}
        </Suspense>

        {/* PRE-WORKOUT READINESS MODAL */}
        {preWorkoutModal && (
          <div className="absolute inset-0 bg-black/90 z-[60] flex justify-center items-center px-4 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full max-h-[88dvh] overflow-y-auto hide-scrollbar rounded-2xl shadow-2xl border border-zinc-800 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-zinc-100 mb-2 uppercase tracking-wide border-b border-zinc-800 pb-3 flex items-center">
                <BrainCircuit size={16} className="mr-2 text-cyan-500" /> Hazırbulunuşluk
              </h3>
              <p className="text-[11px] text-zinc-400 mb-4 mt-2 leading-tight">Bugünkü yüklenme kararını toparlanma verilerinle desteklemek için mental ve fiziksel durumunu puanla.</p>

              {preWorkoutModal.sleepScore !== null && preWorkoutModal.sleepScore !== undefined && (
                <p className="text-[10px] font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-900/40 rounded-xl px-3 py-2 mb-4 leading-relaxed">
                  Uyku alanı bu gecenin uyku puanından ({preWorkoutModal.sleepScore}/100) dolduruldu — istersen değiştir.
                </p>
              )}

              <div className="space-y-4 mb-5">
                {READINESS_FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="flex justify-between text-xs text-zinc-300 font-bold mb-1.5">
                      <span>{f.label}</span>
                      <span className={f.color}>{readinessForm[f.key]}/10</span>
                    </label>
                    <input
                      type="range" min="1" max="10"
                      value={readinessForm[f.key]}
                      onChange={(e) => setReadinessForm(p => ({ ...p, [f.key]: parseInt(e.target.value, 10) }))}
                      className={`w-full ${f.accent}`}
                    />
                    <div className="flex justify-between text-[9px] font-mono text-zinc-600 mt-0.5">
                      <span>{f.low}</span><span>{f.high}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Skor, bölge ve tavsiye anında hesaplanır. */}
              {(() => {
                const h = computeReadiness(readinessForm);
                const adaptation = buildSessionAdaptation(preWorkoutModal.template, {
                  ...readinessForm,
                  score: h.score,
                  zone: h.zone.key,
                }, {
                  coachProtocol: activeCoachProtocol,
                  date: getLocalDateString(),
                });
                const adaptedSelected = preWorkoutModal.adaptationChoice ?? adaptation.recommended;
                return (
                  <>
                  <div className={`rounded-2xl border p-3.5 mb-3 ${h.zone.bg}`}>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hazır Oluşluk</span>
                      <span className={`text-[11px] font-bold uppercase ${h.zone.text}`}>{h.zone.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className={`text-3xl font-mono font-bold ${h.zone.text}`}>{h.score}</span>
                      <span className="text-[10px] font-mono text-zinc-500">/ 100</span>
                    </div>
                    <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800 mb-2">
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${h.zone.bar}`} style={{ width: `${h.score}%` }} />
                    </div>
                    <p className="text-[10px] font-mono text-zinc-300 leading-relaxed">{h.zone.advice}</p>
                    {h.safetyReason && (
                      <p className="text-[9px] font-bold font-mono text-red-300 leading-relaxed mt-1.5 pt-1.5 border-t border-red-900/40">
                        Güvenlik sınırı: {h.safetyReason}
                      </p>
                    )}
                    {h.warnings.map(w => (
                      <p key={w.key} className="text-[9px] font-mono text-amber-300 leading-relaxed mt-1.5 pt-1.5 border-t border-zinc-800/60">
                        {w.text}
                      </p>
                    ))}
                  </div>
                  {preWorkoutModal.template && (
                    <div className={`rounded-2xl border p-3.5 mb-5 ${adaptation.mode.key === 'normal' ? 'border-emerald-900/50 bg-emerald-950/20' : adaptation.mode.key === 'recovery' ? 'border-red-900/50 bg-red-950/20' : 'border-amber-900/50 bg-amber-950/20'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Akıllı Seans Planı</span>
                          <strong className={`text-[12px] block mt-0.5 ${adaptation.mode.key === 'normal' ? 'text-emerald-400' : adaptation.mode.key === 'recovery' ? 'text-red-400' : 'text-amber-400'}`}>{adaptation.mode.label}</strong>
                        </div>
                        {adaptation.changes && (
                          <span className="text-[9px] font-mono text-zinc-500 text-right shrink-0">
                            {adaptation.changes.originalWorkingSets} → {adaptation.changes.adaptedWorkingSets} set
                            {adaptation.changes.loadPercent > 0 && <span className="block">yük −%{adaptation.changes.loadPercent}</span>}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-2">{adaptation.mode.summary}</p>
                      {adaptation.reasons.length > 0 && (
                        <p className="text-[8px] font-mono text-zinc-600 mt-1">Neden: {adaptation.reasons.join(' · ')}</p>
                      )}
                      {adaptation.recommended && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button type="button" onClick={() => setPreWorkoutModal(prev => ({ ...prev, adaptationChoice: true }))} className={`rounded-xl border py-2 text-[9px] font-bold ${adaptedSelected ? 'border-cyan-600 bg-cyan-950/30 text-cyan-300' : 'border-zinc-800 text-zinc-500'}`}>Bugüne Uyarla</button>
                          <button type="button" onClick={() => setPreWorkoutModal(prev => ({ ...prev, adaptationChoice: false }))} className={`rounded-xl border py-2 text-[9px] font-bold ${!adaptedSelected ? 'border-zinc-600 bg-zinc-800 text-zinc-200' : 'border-zinc-800 text-zinc-500'}`}>Planı Koru</button>
                        </div>
                      )}
                      <p className="text-[8px] font-mono text-zinc-600 leading-relaxed mt-2">Orijinal şablon değişmez; karar yalnızca bu seansa uygulanır.</p>
                    </div>
                  )}
                  </>
                );
              })()}

              <div className="flex space-x-3">
                <button onClick={() => setPreWorkoutModal(null)} className="flex-1 bg-zinc-800 active:bg-zinc-700 text-zinc-300 font-bold py-3.5 rounded-xl uppercase text-xs transition-colors">İptal</button>
                <button onClick={confirmStartWorkout} className="flex-1 bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3.5 rounded-xl uppercase text-xs transition-colors shadow-lg shadow-cyan-900/20">Seansa Başla</button>
              </div>
            </div>
          </div>
        )}

        {/* END WORKOUT MODAL */}
        {isEndWorkoutModalOpen && (
          <div className="absolute inset-0 bg-black/90 z-[60] flex justify-center items-center px-4 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full max-h-[88dvh] overflow-y-auto hide-scrollbar rounded-2xl shadow-2xl border border-zinc-800 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-zinc-100 mb-4 uppercase tracking-wide border-b border-zinc-800 pb-3 flex items-center">
                <Save size={16} className="mr-2 text-emerald-500" /> Antrenmanı Tamamla
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Antrenman Adı</label>
                  <input value={activeWorkout?.name || ''} onChange={e => setActiveWorkout(p => ({ ...p, name: e.target.value }))} maxLength={60} placeholder="Örn. Push A" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 font-mono text-sm outline-none focus:border-emerald-500 transition-colors" />
                </div>

                {activeWorkout?.isEditingOld && <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Kayıt Tarihi</label>
                  <input type="date" value={activeWorkout?.date || ''} max={getLocalDateString()} onChange={e => setActiveWorkout(p => ({ ...p, date: e.target.value }))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-cyan-400 font-mono text-sm outline-none focus:border-cyan-500 transition-colors" />
                </div>}

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Toplam Süre (Dakika)</label>
                  <input type="number" inputMode="decimal" value={activeWorkout?.duration || ''} onChange={e => setActiveWorkout(p => ({ ...p, duration: parseNumber(e.target.value) }))} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-emerald-400 font-mono text-sm outline-none focus:border-emerald-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Zorluk Derecesi (RPE)</label>
                  <div className="flex space-x-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} onClick={() => setActiveWorkout(prev => ({ ...prev, rating: star }))} fill={activeWorkout?.rating >= star ? "currentColor" : "none"} className={`transition-colors cursor-pointer ${activeWorkout?.rating >= star ? "text-yellow-500" : "text-zinc-700"}`} size={24} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Notlar (Pump, Tükeniş vb.)</label>
                  <textarea value={activeWorkout?.notes || ''} onChange={e => setActiveWorkout(p => ({ ...p, notes: e.target.value }))} rows="3" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-300 font-mono text-xs outline-none focus:border-emerald-500 transition-colors"></textarea>
                </div>
              </div>

              <div className="flex space-x-3">
                <button onClick={() => setIsEndWorkoutModalOpen(false)} className="flex-1 bg-zinc-800 active:bg-zinc-700 text-zinc-300 font-bold py-3.5 rounded-xl uppercase text-xs transition-colors">İptal</button>
                <button onClick={confirmSaveWorkout} className="flex-1 bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3.5 rounded-xl uppercase text-xs transition-colors shadow-lg shadow-emerald-900/20">Kaydet</button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM MODAL */}
        {/* z-[120]: kütüphane (92), kardiyo (95), hareket seçimi (100) ve barkod
            tarayıcının (110) üstünde kalmalı — aksi halde onay penceresi açık
            pencerenin arkasında kalır ve ancak oradan çıkınca görünür. */}
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-black/90 z-[120] flex justify-center items-center px-4 backdrop-blur-sm">
            <div className="bg-zinc-900 w-full max-w-xs rounded-2xl border border-zinc-800 p-5 text-center space-y-4">
              <AlertCircle size={32} className="text-red-500 mx-auto" />
              <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Silme Onayı</h4>
              <p className="text-[11px] text-zinc-400 font-mono">
                {deleteConfirm.type === 'exercise'
                  ? `"${deleteConfirm.id}" kütüphaneden silinecek. Geçmiş antrenman kayıtların korunur.`
                  : deleteConfirm.type === 'template'
                    ? 'Bu antrenman şablonu silinecek ve haftalık plandaki bağlantıları temizlenecek. İşlemi 12 saniye içinde geri alabilirsin.'
                    : 'Bu kaydı silmek istediğinizden emin misiniz? İşlemi 12 saniye içinde geri alabilirsin.'}
              </p>
              <div className="flex space-x-2 pt-2">
                <button onClick={() => setDeleteConfirm({ isOpen: false, type: null, id: null })} className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-xs uppercase">İptal</button>
                <button onClick={handleDeleteConfirmExecute} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase shadow-lg shadow-red-900/30">Sil</button>
              </div>
            </div>
          </div>
        )}

        {/* EXERCISE SELECTION MODAL */}
        {isExerciseModalOpen && (
          <div className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col h-[100dvh] max-w-[420px] mx-auto shadow-2xl">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center pt-safe">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider flex items-center"><Database size={14} className="mr-2 text-cyan-500" /> Hareket Seçimi</h3>
              <button onClick={closeExercisePicker} aria-label="Hareket seçimini kapat" className="text-zinc-500 p-2"><X size={18} /></button>
            </div>
            <div className="p-4 border-b border-zinc-800 bg-zinc-950">
              {!isAddingCustom ? (
                <button onClick={() => setIsAddingCustom(true)} className="w-full bg-zinc-900 active:bg-zinc-800 border border-zinc-800 text-cyan-500 font-bold py-3 rounded-xl text-[11px] uppercase tracking-wider flex justify-center items-center transition-colors">
                  <Plus size={14} className="mr-2" /> Yeni Özel Hareket Ekle
                </button>
              ) : (
                <div className="space-y-3 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <input type="text" value={newCustomExercise} onChange={(e) => setNewCustomExercise(e.target.value)} placeholder="Hareket Adı (Örn: Cable Lateral Raise)" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-100 font-mono text-xs outline-none focus:border-cyan-500 transition-colors" />
                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase">Kas Katkıları</label>
                      <span className="text-[9px] font-mono text-zinc-600">dokun: 1 → ½ → ¼ → yok</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {MUSCLE_GROUPS.map(m => {
                        const w = newExContribs[m] || 0;
                        const cycle = { 0: 1, 1: 0.5, 0.5: 0.25, 0.25: 0 };
                        return (
                          <button
                            key={m}
                            onClick={() => setNewExContribs(prev => {
                              const next = { ...prev };
                              const val = cycle[w];
                              if (val === 0) delete next[m]; else next[m] = val;
                              return next;
                            })}
                            className={`py-1.5 px-1 rounded-lg border text-[9px] font-bold transition-colors ${
                              w === 1 ? 'text-emerald-400 border-emerald-600 bg-emerald-950/40'
                                : w === 0.5 ? 'text-cyan-400 border-cyan-700 bg-cyan-950/30'
                                  : w === 0.25 ? 'text-zinc-300 border-zinc-600 bg-zinc-800'
                                    : 'text-zinc-600 border-zinc-800 bg-zinc-950'
                            }`}
                          >
                            {m}{w === 1 ? ' •' : w === 0.5 ? ' ½' : w === 0.25 ? ' ¼' : ''}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[9px] font-mono text-zinc-600 mt-1.5 leading-snug">
                      Tek kasa bir kez dokunmak yeterli. En az bir kas birincil (•) olmalı.
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Mekanik</label>
                    <select value={newExMechanics} onChange={e => setNewExMechanics(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 text-[11px] outline-none">
                      <option value="Push">İtme (Push)</option>
                      <option value="Pull">Çekme (Pull)</option>
                      <option value="Legs">Bacak (Legs)</option>
                      <option value="Core">Merkez (Core)</option>
                    </select>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button onClick={() => { setIsAddingCustom(false); setNewCustomExercise(''); setNewExContribs({}); }} className="flex-1 text-zinc-500 bg-zinc-950 active:bg-zinc-800 rounded-lg text-[11px] uppercase font-bold py-2.5 transition-colors">İptal</button>
                    <button
                      disabled={!newCustomExercise.trim() || !Object.values(newExContribs).includes(1)}
                      onClick={() => {
                        const newEx = newCustomExercise.trim();
                        const exists = allExercisesNames.some(ex => ex.toLowerCase() === newEx.toLowerCase());
                        if (!exists) {
                          setCustomExercises(prev => [...prev, {
                            name: newEx,
                            contributions: newExContribs,
                            muscle: Object.entries(newExContribs).sort((a, b) => b[1] - a[1])[0][0],
                            mechanics: newExMechanics,
                            schema: 2
                          }]);
                        }
                        setNewCustomExercise('');
                        setNewExContribs({});
                        setIsAddingCustom(false);
                        if (pickerReturnsToLibrary || !activeWorkout) {
                          showToast(`"${newEx}" kütüphaneye eklendi.`);
                          closeExercisePicker();
                        } else {
                          handleSelectExercise(newEx);
                        }
                      }}
                      className="flex-1 bg-cyan-600 active:bg-cyan-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg text-[11px] uppercase font-bold py-2.5 transition-colors"
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              )}
            </div>
            {!isAddingCustom && (
              <div className="p-4 border-b border-zinc-800 bg-zinc-950 space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input type="text" value={exerciseSearchQuery} onChange={(e) => setExerciseSearchQuery(e.target.value)} placeholder="Tüm veritabanında ara..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3 text-zinc-100 outline-none font-mono text-xs h-11 focus:border-cyan-500 transition-colors" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-mono text-zinc-600 leading-snug min-w-0">
                    {exerciseSearchQuery.trim()
                      ? `${filteredExercises.length} sonuç · tüm veritabanı`
                      : settings.pickerShowAll
                        ? `Tüm ${filteredExercises.length} hareket listeleniyor`
                        : `Kendi listen (${filteredExercises.length}) · diğerleri için ara`}
                  </span>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, pickerShowAll: !prev.pickerShowAll }))}
                    className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide border transition-colors ${settings.pickerShowAll ? 'border-cyan-600 text-cyan-400 bg-cyan-950/20' : 'border-zinc-800 text-zinc-500'}`}
                  >
                    {settings.pickerShowAll ? 'Kendi listem' : 'Hepsini göster'}
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto bg-zinc-950 pb-safe hide-scrollbar">
              {filteredExercises.map(ex => {
                const { contributions } = detectMuscleGroup(ex, customExercises);
                // Katkılar büyükten küçüğe: birincil kas en solda görünsün.
                const parts = Object.entries(contributions || {}).sort((a, b) => b[1] - a[1]);
                return (
                  <button key={ex} onClick={() => handleSelectExercise(ex)} className="w-full flex justify-between items-start gap-3 px-5 py-3.5 border-b border-zinc-900 text-zinc-300 active:bg-zinc-900 transition-colors text-left">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold font-mono">{ex}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {parts.length === 0 ? (
                          <span className="text-[10px] text-zinc-600 font-mono">Kas eşlemesi yok</span>
                        ) : parts.map(([muscle, weight]) => (
                          <span
                            key={muscle}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              weight === 1 ? 'text-emerald-400 border-emerald-900/50 bg-emerald-950/30'
                                : weight === 0.5 ? 'text-cyan-400 border-cyan-900/50 bg-cyan-950/30'
                                  : 'text-zinc-500 border-zinc-800 bg-zinc-900'
                            }`}
                          >
                            {muscle}{weight === 0.5 ? ' ½' : weight === 0.25 ? ' ¼' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 shrink-0 mt-0.5">
                      {getRecentExerciseData(ex) && <Activity size={14} className="text-cyan-600" />}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setEditorExercise(ex); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setEditorExercise(ex); } }}
                        title="Kas eşlemesini düzenle"
                        className="text-zinc-600 active:text-cyan-400 p-1.5 -m-0.5 cursor-pointer"
                      >
                        <Settings size={13} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
