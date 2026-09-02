import React, { lazy, memo, startTransition, Suspense, useEffect } from 'react';
import { Scale, LineChart, CalendarDays } from 'lucide-react';
import ViewHeader from './ViewHeader';

const loadMetricsView = () => import('./MetricsView');
const loadAnalyticsView = () => import('./AnalyticsView');
const loadCycleView = () => import('./CycleView');
const MetricsView = lazy(loadMetricsView);
const AnalyticsView = lazy(loadAnalyticsView);
const CycleView = lazy(loadCycleView);

const loaderFor = (key) => ({
  body: loadMetricsView,
  analysis: loadAnalyticsView,
  cycle: loadCycleView,
})[key];

const EmbeddedLoading = () => (
  <div className="h-full p-4 animate-pulse space-y-3" role="status" aria-label="Gelişim ekranı yükleniyor">
    <div className="h-24 rounded-2xl bg-zinc-950 border border-zinc-900" />
    <div className="h-40 rounded-2xl bg-zinc-950 border border-zinc-900" />
  </div>
);

const HUB_COPY = {
  body: {
    title: 'Ölçüm ve hedefler',
    subtitle: 'Bugünkü ölçümü kaydet; hedef, oran ve kıyaslama araçlarına gerektiğinde aç.',
  },
  analysis: {
    title: 'İlerlemeni incele',
    subtitle: 'Vücut, performans, hacim, plan, beslenme ve koç analizlerinden birini seç.',
  },
  cycle: {
    title: 'Döngü takibi',
    subtitle: 'Döngü kaydını, tahminleri ve döneme göre önerileri tek yerde yönet.',
  },
};

const ProgressHubView = memo(({
  tab,
  setTab,
  metricsProps,
  analyticsProps,
  gender = 'male',
  cycleProps,
  interfaceMode = 'simple',
}) => {
  const visibleTab = gender === 'female' ? tab : tab === 'cycle' ? 'body' : tab;
  const simple = interfaceMode !== 'detailed';
  const copy = HUB_COPY[visibleTab] || HUB_COPY.body;
  const prepare = (key) => void loaderFor(key)?.().catch(() => {});

  // Alt sekmeler yalnızca `onPointerEnter` ile ısınıyordu; dokunmatikte
  // "üzerine gelme" diye bir şey yok, yani telefonda hiç ısınmıyorlardı.
  // Ölçümde Vücut sekmesine ilk gidiş 98 ms'lik bir engelleme üretiyordu.
  // Bu ekran açıldığında diğer alt sekmeler boş zamanda hazırlanıyor —
  // tek tek, ısıtmanın kendisi uzun bir göreve dönüşmesin diye.
  useEffect(() => {
    const kalanlar = ['body', 'analysis', ...(gender === 'female' ? ['cycle'] : [])]
      .filter(key => key !== visibleTab);
    let iptal = false;
    let bekleyen = null;
    const planla = (isIdi) => {
      bekleyen = typeof window.requestIdleCallback === 'function'
        ? { tur: 'idle', id: window.requestIdleCallback(isIdi, { timeout: 3000 }) }
        : { tur: 'timeout', id: window.setTimeout(isIdi, 1200) };
    };
    const adim = (i) => {
      if (iptal || i >= kalanlar.length) return;
      prepare(kalanlar[i]);
      planla(() => adim(i + 1));
    };
    planla(() => adim(0));
    return () => {
      iptal = true;
      if (!bekleyen) return;
      if (bekleyen.tur === 'idle') window.cancelIdleCallback?.(bekleyen.id);
      else window.clearTimeout(bekleyen.id);
    };
    // `prepare` saf bir modül yükleyici; bağımlılığa girmesi gerekmiyor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTab, gender]);

  const select = (key) => {
    prepare(key);
    startTransition(() => setTab(key));
  };
  return <div className="luxury-screen h-full flex flex-col bg-black">
    <div className="px-4 pt-4 pb-2.5 shrink-0 space-y-3">
      <ViewHeader
        eyebrow="Gelişim Merkezi"
        title={copy.title}
        subtitle={copy.subtitle}
      />
      <div className={`luxury-segmented grid ${gender === 'female' ? 'grid-cols-3' : 'grid-cols-2'} bg-zinc-900 p-1 rounded-2xl border border-zinc-800`} aria-label="Gelişim görünümü">
        <button aria-label="Ölçüm ve hedefler görünümünü aç" onPointerEnter={() => prepare('body')} onFocus={() => prepare('body')} onClick={() => select('body')} className={`min-h-11 px-2 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${visibleTab === 'body' ? 'bg-cyan-600 text-white' : 'text-zinc-400'}`}>
          <Scale size={14} /> {simple ? 'Ölçüm' : 'Vücut & Hedefler'}
        </button>
        <button aria-label="Gelişim analizlerini aç" onPointerEnter={() => prepare('analysis')} onFocus={() => prepare('analysis')} onClick={() => select('analysis')} className={`min-h-11 px-2 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${visibleTab === 'analysis' ? 'bg-emerald-700 text-white' : 'text-zinc-400'}`}>
          <LineChart size={14} /> {simple ? 'Analiz' : 'Analizler'}
        </button>
        {gender === 'female' && (
          <button aria-label="Döngü takibini aç" onPointerEnter={() => prepare('cycle')} onFocus={() => prepare('cycle')} onClick={() => select('cycle')} className={`min-h-11 px-2 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${visibleTab === 'cycle' ? 'bg-rose-600 text-white' : 'text-zinc-400'}`}>
            <CalendarDays size={14} /> Döngü
          </button>
        )}
      </div>
    </div>
    <div className="flex-1 min-h-0">
      <Suspense fallback={<EmbeddedLoading />}>
        {visibleTab === 'body'
          ? <MetricsView {...metricsProps} embedded />
          : visibleTab === 'cycle'
            ? <CycleView {...cycleProps} embedded />
            : <AnalyticsView {...analyticsProps} embedded />}
      </Suspense>
    </div>
  </div>
});

ProgressHubView.displayName = 'ProgressHubView';
export default ProgressHubView;
