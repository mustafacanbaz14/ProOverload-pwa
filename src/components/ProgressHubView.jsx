import React, { lazy, memo, Suspense } from 'react';
import { Scale, LineChart, CalendarDays } from 'lucide-react';

const MetricsView = lazy(() => import('./MetricsView'));
const AnalyticsView = lazy(() => import('./AnalyticsView'));
const CycleView = lazy(() => import('./CycleView'));

const EmbeddedLoading = () => (
  <div className="h-full p-4 animate-pulse space-y-3" role="status" aria-label="Gelişim ekranı yükleniyor">
    <div className="h-24 rounded-2xl bg-zinc-950 border border-zinc-900" />
    <div className="h-40 rounded-2xl bg-zinc-950 border border-zinc-900" />
  </div>
);

const ProgressHubView = memo(({ tab, setTab, metricsProps, analyticsProps, gender = 'male', cycleProps }) => {
  const visibleTab = gender === 'female' ? tab : tab === 'cycle' ? 'body' : tab;
  return <div className="luxury-screen h-full flex flex-col bg-black">
    <div className="px-4 pt-4 pb-2 shrink-0">
      <span className="luxury-eyebrow text-[10px] uppercase">Gelişim Merkezi</span>
      <div className={`luxury-segmented grid ${gender === 'female' ? 'grid-cols-3' : 'grid-cols-2'} bg-zinc-900 p-1 rounded-2xl border border-zinc-800 mt-2`}>
        <button onClick={() => setTab('body')} className={`py-2.5 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${visibleTab === 'body' ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}>
          <Scale size={14} /> Vücut & Hedefler
        </button>
        <button onClick={() => setTab('analysis')} className={`py-2.5 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${visibleTab === 'analysis' ? 'bg-emerald-600 text-white' : 'text-zinc-500'}`}>
          <LineChart size={14} /> Analizler
        </button>
        {gender === 'female' && (
          <button onClick={() => setTab('cycle')} className={`py-2.5 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 ${visibleTab === 'cycle' ? 'bg-rose-600 text-white' : 'text-zinc-500'}`}>
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
