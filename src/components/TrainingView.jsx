import React, { memo, useMemo, useState, lazy, Suspense } from 'react';
import {
  Zap, Library, CalendarRange, BookmarkPlus, HeartPulse, Pencil, Play,
  ChevronRight, ChevronDown, Copy, Wand2, Sparkles, Search, Star, Trash2,
  RotateCcw, SlidersHorizontal, Target, AlertTriangle, ShieldCheck,
  TrendingUp, Settings2,
} from 'lucide-react';
import { estimateDuration } from '../utils/templates';
import { estimateLiftingCalories } from '../utils/cardio';
import { formatDay } from '../utils/dates';
import { organizeTemplates } from '../utils/templateLibrary';
import WorkoutFlowStepper from './WorkoutFlowStepper';
import ViewHeader from './ViewHeader';

// Ana sayfadaki haritanın aynısı; ayrı parçada kalsın diye tembel yükleniyor.
const MuscleHeatmap = lazy(() => import('./MuscleHeatmap'));

const TEMPLATE_BATCH = 12;

const TrainingView = memo(({
  templates = [],
  restSeconds = 120,
  weightKg = 0,
  recentWorkout = null,
  interfaceMode = 'simple',
  recommendation = null,
  experienceLevel = 'intermediate',
  gender = 'male',
  progressionBlocks = [],
  programDraft = null,
  onOpenExercise,
  onStart,
  onRepeat,
  onLibrary,
  onBuilder,
  onWizard,
  onResumeDraft,
  onFreshProgram,
  onStarter,
  onWeekPlan,
  onCardio,
  onCoach,
  onPreview,
  onEdit,
  onWizardEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onOpenSettings,
}) => {
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [templateLimit, setTemplateLimit] = useState(TEMPLATE_BATCH);
  // Kullanıcı bu ekranda elle açıp kapatana kadar Ayarlar'daki bilgi yoğunluğunu
  // canlı izler. Böylece Basit/Detaylı değişikliği sayfa yenilemeden uygulanır.
  const [plannerOverride, setPlannerOverride] = useState(null);
  const [recommendationOverride, setRecommendationOverride] = useState(null);
  const [progressionOverride, setProgressionOverride] = useState(null);
  const [programOptionsOverride, setProgramOptionsOverride] = useState(null);
  const [openTemplateMenu, setOpenTemplateMenu] = useState(null);
  const plannerOpen = plannerOverride ?? interfaceMode === 'detailed';
  const recommendationOpen = recommendationOverride ?? interfaceMode === 'detailed';
  const progressionOpen = progressionOverride ?? interfaceMode === 'detailed';
  const programOptionsOpen = programOptionsOverride ?? interfaceMode === 'detailed';

  const favoriteCount = templates.filter(template => template.favorite).length;
  const visibleTemplates = useMemo(
    () => organizeTemplates(templates, { query, favoritesOnly }),
    [templates, query, favoritesOnly],
  );
  const displayedTemplates = visibleTemplates.slice(0, templateLimit);
  const latestDraft = programDraft?.latest;
  const draftSummary = latestDraft?.kind === 'builder'
    ? `${latestDraft.name || 'Adsız program'} · ${latestDraft.dayCount || 1} gün`
    : latestDraft?.kind === 'wizard'
      ? `Sihirbaz · ${latestDraft.step || 1}. adım`
      : '';

  return (
    <div data-view-scroll="training" className="luxury-screen p-4 space-y-4 pb-nav h-full overflow-y-auto hide-scrollbar bg-black">
      <ViewHeader
        eyebrow="Antrenman Merkezi"
        title="Bugünkü çalışmanı yönet"
        subtitle="Başlat, kaldığın yerden devam et veya programını düzenle."
        action={onOpenSettings ? (
          <button onClick={onOpenSettings} aria-label="Antrenman ayarlarını aç" className="w-11 h-11 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 flex items-center justify-center active:bg-zinc-800">
            <Settings2 size={17} />
          </button>
        ) : null}
      />

      <WorkoutFlowStepper stage="prepare" />

      {recommendation && (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 flex items-center gap-1.5"><Target size={12} className="text-emerald-400" /> Bu Hafta İçin Akıllı Seçim</span>
              <h3 className="text-[15px] font-black text-zinc-100 truncate mt-1">{recommendation.template.name}</h3>
              <span className="text-[9px] text-zinc-400">~{recommendation.minutes} dk · {recommendation.preview.totalSets} set</span>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-center shrink-0">
              <strong className="text-lg text-emerald-400 block leading-none">{recommendation.score}</strong>
              <span className="text-[7px] font-bold uppercase tracking-wider text-zinc-400">{recommendation.label}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {recommendation.reasons.slice(0, recommendationOpen ? 2 : 1).map(reason => (
              <p key={reason} className="text-[9px] font-mono text-zinc-300 leading-relaxed flex gap-1.5"><span className="text-emerald-400">•</span>{reason}</p>
            ))}
            {recommendationOpen && recommendation.risks.slice(0, 1).map(risk => (
              <p key={risk} className="text-[9px] font-mono text-amber-300/90 leading-relaxed flex gap-1.5"><AlertTriangle size={10} className="shrink-0 mt-0.5" />{risk}</p>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRecommendationOverride(!recommendationOpen)}
            aria-expanded={recommendationOpen}
            className="min-h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/55 px-3 flex items-center justify-between text-left text-[10px] font-bold text-zinc-300 active:bg-zinc-900"
          >
            <span>{recommendationOpen ? 'Öneri ayrıntılarını gizle' : 'Neden bu seans? Kas haritasını göster'}</span>
            <ChevronDown size={14} className={`text-zinc-400 transition-transform ${recommendationOpen ? 'rotate-180' : ''}`} />
          </button>
          {/* Seçili antrenmanın vücutta nereye denk geldiği. Buradaki karar
              "bugün ne çalışayım" — o kararı metinle anlatmak yerine haritada
              göstermek, listedeki gerekçelerden daha hızlı okunuyor. */}
          {recommendationOpen && recommendation.preview?.byMuscle && (
            <Suspense fallback={<div className="h-[430px] rounded-2xl border border-zinc-800 bg-zinc-950/40" />}>
              <MuscleHeatmap
                muscleVolume={recommendation.preview.byMuscle}
                experienceLevel={experienceLevel}
                gender={gender}
                title="Bu Seans Neyi Çalıştırır"
                subtitle="Teorik"
              />
            </Suspense>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onPreview?.(recommendation.template)} className="rounded-xl border border-zinc-700 py-2.5 text-[9px] font-bold text-zinc-300 active:bg-zinc-800">Planı İncele</button>
            <button onClick={() => onStart?.(recommendation.template)} className="rounded-xl bg-emerald-700 py-2.5 text-[9px] font-black uppercase text-white active:bg-emerald-800 flex items-center justify-center gap-1.5"><Play size={12} /> Başlat</button>
          </div>
          {recommendationOpen && <p className="text-[8px] font-mono text-zinc-400">Puan; haftalık hacim açığı, tavan riski ve son 48 saat yüklenmesini birlikte tartar.</p>}
        </section>
      )}

      <button onClick={() => onStart?.()} className="luxury-primary-card w-full bg-cyan-600 active:bg-cyan-700 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-cyan-950/30">
        <span className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"><Zap size={19} /></span>
          <span className="text-left"><strong className="text-sm block">Serbest Antrenman Başlat</strong><span className="text-[10px] opacity-75">Doğrudan başla, istersen bugünü puanla</span></span>
        </span>
        <ChevronRight size={18} />
      </button>

      {recentWorkout && (
        <button
          type="button"
          onClick={() => onRepeat?.(recentWorkout)}
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-left flex items-center gap-3 active:bg-zinc-800"
        >
          <span className="w-9 h-9 rounded-xl border border-emerald-900/50 bg-emerald-950/25 text-emerald-400 flex items-center justify-center shrink-0">
            <RotateCcw size={16} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 block">Son Seansı Tekrarla</span>
            <strong className="text-[11px] text-zinc-200 block truncate">{recentWorkout.name || 'Serbest Antrenman'}</strong>
            <span className="text-[9px] font-mono text-zinc-400">
              {formatDay(recentWorkout.date, 'short', { year: true })} · {(recentWorkout.exercises || []).length} hareket
            </span>
          </span>
          <Play size={15} className="text-emerald-400 shrink-0" />
        </button>
      )}

      {progressionBlocks.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-cyan-900/55 bg-cyan-950/15">
          <button
            type="button"
            onClick={() => setProgressionOverride(!progressionOpen)}
            aria-expanded={progressionOpen}
            className={`w-full flex items-center justify-between bg-zinc-950/55 px-3.5 py-3 text-left active:bg-zinc-900 ${progressionOpen ? 'border-b border-cyan-900/35' : ''}`}
          >
            <span>
              <strong className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-cyan-300">
                <TrendingUp size={12} /> Etkin İlerleme Blokları
              </strong>
              <span className="mt-0.5 block text-[8px] font-mono text-zinc-400">{progressionBlocks.length} hareket · hedef ve uyum tek yerde</span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="rounded-lg border border-cyan-900/50 bg-cyan-950/30 px-2 py-1 text-[9px] font-mono text-cyan-300">
                {progressionBlocks.filter(block => !block.complete).length} sürüyor
              </span>
              <ChevronDown size={14} className={`text-cyan-400 transition-transform ${progressionOpen ? 'rotate-180' : ''}`} />
            </span>
          </button>
          {progressionOpen && <div className="divide-y divide-cyan-900/25">
            {progressionBlocks.slice(0, 6).map(block => {
              const next = block.nextPrescription;
              const first = next?.sets?.[0];
              return (
                <button
                  key={block.plan.id}
                  onClick={() => onOpenExercise?.(block.plan.exerciseName)}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-cyan-950/25"
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${block.complete ? 'border-emerald-900/50 bg-emerald-950/20 text-emerald-400' : block.missedStreak >= 2 ? 'border-amber-900/50 bg-amber-950/20 text-amber-400' : 'border-cyan-900/50 bg-cyan-950/25 text-cyan-300'}`}>
                    {block.complete ? <Target size={14} /> : <TrendingUp size={14} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-[10px] text-zinc-200">{block.plan.exerciseName}</strong>
                    <span className="mt-0.5 block truncate text-[8px] font-mono text-zinc-400">
                      {block.complete
                        ? 'blok tamamlandı'
                        : `${block.completedSessions + 1}/${block.totalSessions}. seans · ${first?.weight > 0 ? `${first.weight} kg × ` : ''}${first?.reps || '—'} tekrar`}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <strong className={`block text-[10px] font-mono ${block.adherence === null ? 'text-zinc-400' : block.adherence >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {block.adherence === null ? '—' : `%${block.adherence}`}
                    </strong>
                    <span className="text-[7px] font-bold uppercase text-zinc-400">uyum</span>
                  </span>
                  <ChevronRight size={13} className="shrink-0 text-zinc-400" />
                </button>
              );
            })}
          </div>}
          {progressionOpen && progressionBlocks.length > 6 && (
            <p className="border-t border-cyan-900/25 px-3.5 py-2 text-center text-[8px] font-mono text-zinc-400">
              İlk 6 blok gösteriliyor; diğerleri hareket profillerinde duruyor.
            </p>
          )}
        </section>
      )}

      <section className="luxury-feature-card rounded-3xl border border-violet-800/50 bg-gradient-to-br from-violet-950/45 via-zinc-900 to-cyan-950/20 p-4 space-y-3 shadow-lg shadow-violet-950/15">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-2xl border border-violet-700/60 bg-violet-500/15 text-violet-300 flex items-center justify-center shrink-0">
            <Wand2 size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-[9px] font-mono uppercase tracking-widest text-violet-400">Tek Akışta Program Kur</span>
            <strong className="text-sm text-zinc-100 block mt-0.5">Programını adım adım hazırla</strong>
            <span className="text-[9px] font-mono text-zinc-500 block mt-1">Seçimlerin otomatik kaydolur; çıkıp geri dönebilirsin.</span>
          </span>
        </div>

        {programOptionsOpen && <div className="grid grid-cols-4 gap-1" aria-label="Program oluşturma adımları">
          {['Tercihler', 'Taslak', 'Hareketler', 'Haftalık'].map((label, index) => (
            <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-950/55 px-1 py-2 text-center">
              <span className="w-4 h-4 rounded-full bg-violet-950 border border-violet-800 text-[8px] font-mono text-violet-300 inline-flex items-center justify-center">{index + 1}</span>
              <span className="text-[7px] font-bold text-zinc-500 block mt-1 truncate">{label}</span>
            </div>
          ))}
        </div>}

        {programDraft?.hasAny ? (
          <div className="space-y-2">
            <button onClick={onResumeDraft} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 active:scale-[0.98] transition-all p-3.5 text-left flex items-center gap-3 text-white shadow-lg shadow-violet-950/40">
              <span className="flex-1 min-w-0">
                <strong className="text-[12px] font-black tracking-wide block">Taslağa Devam Et</strong>
                <span className="text-[9px] font-mono text-violet-200 block truncate mt-0.5">{draftSummary}</span>
              </span>
              <ChevronRight size={17} />
            </button>
            {programOptionsOpen && <button onClick={onFreshProgram} className="min-h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 text-[9px] font-bold text-zinc-400 active:text-violet-300 transition-colors">
              Taslağı bırakıp sıfırdan başla
            </button>}
          </div>
        ) : (
          <button onClick={onWizard} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 active:scale-[0.98] transition-all p-3.5 text-[11px] font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-lg shadow-violet-950/40">
            <Wand2 size={15} /> Yönlendirmeli Program Oluştur
          </button>
        )}

        <button
          type="button"
          onClick={() => setProgramOptionsOverride(!programOptionsOpen)}
          aria-expanded={programOptionsOpen}
          className="min-h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/55 px-3 flex items-center justify-between text-left text-[10px] font-bold text-zinc-300 active:bg-zinc-900"
        >
          <span>{programOptionsOpen ? 'Kurulum seçeneklerini gizle' : 'Hazır program ve elle kurma seçenekleri'}</span>
          <ChevronDown size={14} className={`text-zinc-400 transition-transform ${programOptionsOpen ? 'rotate-180' : ''}`} />
        </button>

        {programOptionsOpen && <div className="grid grid-cols-2 gap-2">
          <button onClick={onStarter} className="rounded-xl border border-amber-900/50 bg-gradient-to-b from-amber-950/25 to-zinc-950 p-3 text-left active:scale-[0.98] transition-all shadow-sm">
            <Sparkles size={14} className="mb-1.5 text-amber-400" />
            <strong className="block text-[10px] font-bold text-zinc-200">Hazır Program</strong>
            <span className="text-[8px] font-mono text-zinc-500">Hızlı başlangıç</span>
          </button>
          <button onClick={onBuilder} className="rounded-xl border border-cyan-900/50 bg-gradient-to-b from-cyan-950/25 to-zinc-950 p-3 text-left active:scale-[0.98] transition-all shadow-sm">
            <BookmarkPlus size={14} className="mb-1.5 text-cyan-400" />
            <strong className="block text-[10px] font-bold text-zinc-200">Elle Kur</strong>
            <span className="text-[8px] font-mono text-zinc-500">Tam kontrol</span>
          </button>
        </div>}
      </section>

      <section className="luxury-feature-card rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <button
          type="button"
          onClick={() => setPlannerOverride(!plannerOpen)}
          className="w-full p-3.5 flex items-center justify-between text-left active:bg-zinc-800"
          aria-expanded={plannerOpen}
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl border border-violet-900/50 bg-violet-950/25 text-violet-300 flex items-center justify-center shrink-0">
              <SlidersHorizontal size={16} />
            </span>
            <span>
              <strong className="text-[11px] text-zinc-200 block">Program Araçları</strong>
              <span className="text-[9px] font-mono text-zinc-500">Kütüphane · takvim · kardiyo · koç</span>
            </span>
          </span>
          <ChevronDown size={15} className={`text-zinc-500 shrink-0 transition-transform ${plannerOpen ? 'rotate-180' : ''}`} />
        </button>

        {plannerOpen && (
          <div className="border-t border-zinc-800 p-3 space-y-3 bg-zinc-950/35">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Hareketler', hint: 'Kütüphane & ince ayar', icon: Library, action: onLibrary },
                { label: 'Haftalık Plan', hint: 'Günleri ve saatleri düzenle', icon: CalendarRange, action: onWeekPlan },
                { label: 'Kardiyo / Aktivite', hint: 'Kondisyon, spor & hareket', icon: HeartPulse, action: onCardio },
                { label: 'Koç Merkezi', hint: 'Haftalık karar & veri güveni', icon: ShieldCheck, action: onCoach },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.label} onClick={item.action} className="bg-zinc-900 border border-zinc-800 active:bg-zinc-800 rounded-xl p-3 text-left">
                    <Icon size={15} className="text-cyan-400 mb-1.5" />
                    <strong className="text-[10px] text-zinc-200 block">{item.label}</strong>
                    <span className="text-[8px] font-mono text-zinc-400">{item.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="luxury-feature-card bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-4 py-3.5 border-b border-zinc-800 bg-zinc-950/70 flex justify-between items-center gap-2">
          <div>
            <h3 className="text-[11px] font-bold text-zinc-100 uppercase tracking-wider">Şablon Kütüphanesi</h3>
            <span className="text-[8px] font-mono text-zinc-400">{templates.length} şablon · {favoriteCount} favori</span>
          </div>
          <button
            onClick={onWizard}
            className="min-h-11 text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-900/60 rounded-xl px-3 active:scale-[0.95] transition-all"
          >
            + Yeni
          </button>
        </div>

        {templates.length > 0 && (
          <div className="p-3 border-b border-zinc-800 space-y-2 bg-zinc-950/30">
            <div className="relative">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={event => { setQuery(event.target.value); setTemplateLimit(TEMPLATE_BATCH); }}
                placeholder="Şablon veya hareket ara…"
                aria-label="Şablon ara"
                className="w-full bg-zinc-950/90 border border-zinc-800/80 rounded-xl pl-9 pr-3 py-2.5 text-[10px] text-zinc-200 outline-none focus:border-cyan-500 shadow-inner"
              />
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-1">
              <button
                type="button"
                onClick={() => { setFavoritesOnly(false); setTemplateLimit(TEMPLATE_BATCH); }}
                className={`min-h-11 rounded-lg px-2 text-[10px] font-bold transition-all ${!favoritesOnly ? 'bg-cyan-600 text-white shadow-sm' : 'text-zinc-400'}`}
              >
                Tümü ({templates.length})
              </button>
              <button
                type="button"
                onClick={() => { setFavoritesOnly(true); setTemplateLimit(TEMPLATE_BATCH); }}
                className={`min-h-11 rounded-lg px-2 text-[10px] font-bold transition-all ${favoritesOnly ? 'bg-cyan-600 text-white shadow-sm' : 'text-zinc-400'}`}
              >
                Favoriler ({favoriteCount})
              </button>
            </div>
          </div>
        )}

        {templates.length === 0 ? (
          <button onClick={onWizard} className="w-full p-8 text-center text-[10px] font-mono text-zinc-400">
            Henüz şablon yok · ilk şablonu oluştur
          </button>
        ) : visibleTemplates.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-[10px] font-mono text-zinc-400">Bu filtreye uyan şablon yok.</p>
            <button onClick={() => { setQuery(''); setFavoritesOnly(false); setTemplateLimit(TEMPLATE_BATCH); }} className="text-[9px] font-bold text-cyan-400">Filtreyi Temizle</button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {displayedTemplates.map(template => {
              const minutes = estimateDuration(template.exercises || [], restSeconds);
              const kcal = estimateLiftingCalories(minutes, weightKg);
              const menuOpen = openTemplateMenu === template.id;
              return (
                <article key={template.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite?.(template)}
                      aria-label={`${template.name} ${template.favorite ? 'favorilerden çıkar' : 'favorilere ekle'}`}
                      title={template.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 active:scale-[0.92] transition-all ${template.favorite ? 'border-amber-700/60 bg-amber-950/30 text-amber-400 shadow-sm' : 'border-zinc-800 text-zinc-500'}`}
                    >
                      <Star size={14} fill={template.favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button type="button" onClick={() => onPreview?.(template)} className="flex-1 min-w-0 text-left">
                      <strong className="text-[11px] font-bold text-zinc-100 block truncate">{template.name}</strong>
                      <span className="text-[9px] font-mono text-zinc-400 block truncate mt-0.5">
                        {(template.exercises || []).length} hareket · ~{minutes} dk{weightKg > 0 ? ` · ~${kcal} kcal` : ''}
                      </span>
                      {template.useCount > 0 && (
                        <span className="text-[8px] font-mono text-zinc-400 block mt-0.5">
                          {template.useCount} kez tamamlandı{template.lastUsedAt ? ` · son ${formatDay(template.lastUsedAt, 'short')}` : ''}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onStart?.(template)}
                      aria-label={`${template.name} başlat`}
                      className="w-11 h-11 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 flex items-center justify-center shrink-0 active:scale-[0.92] transition-all shadow-sm"
                    >
                      <Play size={14} />
                    </button>
                  </div>

                  {/* Düzenleme en sık kullanılan bakım eylemi; "Diğer" içine
                      saklandığında kullanıcı kırık sandığı için her görünümde
                      doğrudan erişilir. Daha seyrek işlemler ikinci katmanda. */}
                  <div className="pl-10 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button onClick={() => onEdit?.(template)} className="min-h-11 rounded-xl border border-cyan-900/60 bg-cyan-950/20 text-[9px] font-bold text-cyan-300 flex items-center justify-center gap-1.5 active:bg-cyan-950/40"><Pencil size={12} /> Düzenle</button>
                      <button onClick={() => setOpenTemplateMenu(menuOpen ? null : template.id)} aria-expanded={menuOpen} className="min-h-11 rounded-xl border border-zinc-800 text-[9px] font-bold text-zinc-300 flex items-center justify-center gap-1.5 active:bg-zinc-800">Diğer İşlemler <ChevronDown size={11} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} /></button>
                    </div>
                    {menuOpen && (
                      <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950/55 p-1.5">
                        <button onClick={() => { setOpenTemplateMenu(null); onWizardEdit?.(template); }} className="min-h-10 rounded-lg text-[8px] font-bold text-violet-400 flex items-center justify-center gap-1 active:bg-violet-950/20"><Wand2 size={10} /> Sihirbaz</button>
                        <button onClick={() => { setOpenTemplateMenu(null); onDuplicate?.(template); }} className="min-h-10 rounded-lg text-[8px] font-bold text-zinc-300 flex items-center justify-center gap-1 active:bg-zinc-900"><Copy size={10} /> Kopyala</button>
                        <button onClick={() => { setOpenTemplateMenu(null); onDelete?.(template); }} className="min-h-10 rounded-lg text-[8px] font-bold text-red-400 flex items-center justify-center gap-1 active:bg-red-950/30"><Trash2 size={10} /> Sil</button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
            {displayedTemplates.length < visibleTemplates.length && (
              <button
                type="button"
                onClick={() => setTemplateLimit(limit => limit + TEMPLATE_BATCH)}
                className="w-full py-3 text-[9px] font-bold text-cyan-400 active:bg-zinc-900"
              >
                Sonraki {Math.min(TEMPLATE_BATCH, visibleTemplates.length - displayedTemplates.length)} şablonu göster
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
});

TrainingView.displayName = 'TrainingView';
export default TrainingView;
