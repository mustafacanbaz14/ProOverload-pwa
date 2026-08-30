import React, { lazy, memo, Suspense, useMemo, useState } from 'react';
import { Activity, AlertCircle, ChevronDown, Flame, Target } from 'lucide-react';
import {
  ACWR_HINT,
  ACWR_STATUS,
  MUSCLE_SECTIONS,
  VOLUME_STATUS,
  acwrStatusOf,
  getVolumeLandmarks,
  volumeStatusOf,
} from '../utils/constants';
import DeferredSection from './DeferredSection';

const MuscleHeatmap = lazy(() => import('./MuscleHeatmap'));

const DeferredCardFallback = ({ height = 180, label = 'Bölüm hazırlanıyor' }) => (
  <div
    className="rounded-2xl border border-zinc-900 bg-zinc-950/70 animate-pulse flex items-center justify-center"
    style={{ minHeight: height }}
    role="status"
  >
    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-700">{label}</span>
  </div>
);

/**
 * Ana ekrandaki ayrıntılı haftalık analizleri tek bir niyet kapısında toplar.
 * Veriler veya araçlar kaldırılmaz; basit görünümde kullanıcı istemeden uzun
 * bir analitik duvarı ve SVG haritayı çizmek zorunda kalmaz.
 */
const HomeWeeklyOverview = memo(({
  dashboardStats,
  readiness,
  personalVolume = {},
  weeklyCardioKcal = 0,
  showMuscleVolume = false,
  onToggleMuscleVolume,
  onSelectMuscle,
  experienceLevel = 'intermediate',
  gender = 'male',
  interfaceMode = 'simple',
}) => {
  const [isOpen, setIsOpen] = useState(() => interfaceMode === 'detailed');
  const volumeSummary = useMemo(() => MUSCLE_SECTIONS
    .flatMap(section => section.muscles)
    .reduce((acc, muscle) => {
      const key = volumeStatusOf(
        dashboardStats.muscleVolume[muscle] || 0,
        muscle,
        experienceLevel,
      );
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}), [dashboardStats.muscleVolume, experienceLevel]);

  const under = (volumeSummary.none || 0) + (volumeSummary.under || 0);
  const over = volumeSummary.over || 0;
  const acwrKey = acwrStatusOf(
    dashboardStats.acwr,
    dashboardStats.hasEnoughData,
    dashboardStats.nearCeiling,
  );
  const acwrStatus = ACWR_STATUS[acwrKey];
  const recoveryWarning = Boolean(dashboardStats.isDeloadNeeded || readiness?.deloadOnerisi);

  return (
    <section className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(value => !value)}
        aria-expanded={isOpen}
        className="w-full px-4 py-3.5 text-left active:bg-zinc-800/80 transition-colors flex items-center gap-3"
      >
        <span className="w-9 h-9 rounded-xl bg-cyan-950/45 border border-cyan-900/50 text-cyan-400 flex items-center justify-center shrink-0">
          <Activity size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <strong className="text-[11px] uppercase tracking-wider text-zinc-100">Haftalık Durum</strong>
            {recoveryWarning && (
              <span className="text-[8px] font-bold uppercase text-red-300 bg-red-950/50 border border-red-900/50 rounded-md px-1.5 py-0.5">
                Dinlenmeyi kontrol et
              </span>
            )}
          </span>
          <span className="text-[9px] font-mono text-zinc-500 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
            <span>{dashboardStats.thisWeekSessions} antrenman</span>
            <span>{dashboardStats.thisWeekEffectiveSets} etkili set</span>
            <span className={under > 0 ? 'text-cyan-400' : 'text-emerald-400'}>
              {under > 0 ? `${under} kas eşik altında` : 'hacim dengeli'}
            </span>
            {over > 0 && <span className="text-orange-400">{over} tavan üstü</span>}
          </span>
        </span>
        <span className="shrink-0 flex items-center gap-2">
          {readiness?.ortalama > 0 && (
            <span className={`text-[10px] font-mono font-bold ${readiness.zone.text}`}>
              {readiness.ortalama}/100
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {!isOpen && (
        <div className="border-t border-zinc-800/70 px-4 py-2 flex items-center justify-between gap-3 text-[8px] font-mono">
          <span className="text-zinc-600">Harita, hacim ve denge ayrıntıları</span>
          <span className={acwrStatus.text}>{acwrStatus.label}</span>
        </div>
      )}

      {isOpen && (
        <div className="border-t border-zinc-800 p-3 space-y-4 bg-zinc-950/25">
          {readiness && (
            <div className={`rounded-2xl border p-3 ${readiness.zone.bg}`}>
              <div className="flex justify-between items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Hazır Oluşluk Trendi</span>
                <span className="flex items-baseline gap-1.5 shrink-0">
                  <span className={`text-lg font-mono font-bold ${readiness.zone.text}`}>{readiness.ortalama}</span>
                  <span className="text-[9px] font-mono text-zinc-500">/100</span>
                  {readiness.degisim !== null && readiness.degisim !== 0 && (
                    <span className={`text-[10px] font-mono ${readiness.degisim > 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {readiness.degisim > 0 ? '↑' : '↓'}{Math.abs(readiness.degisim)}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-end gap-0.5 h-6 mt-2">
                {readiness.seri.map((point, index) => (
                  <div
                    key={`${point.date || 'readiness'}-${index}`}
                    className={`flex-1 rounded-sm ${point.score >= 80 ? 'bg-emerald-500' : point.score >= 60 ? 'bg-cyan-500' : point.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ height: `${Math.max(12, point.score)}%` }}
                  />
                ))}
              </div>
              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed mt-1.5">
                Son {readiness.kayitSayisi} seans · {readiness.zone.label}
              </p>
              {readiness.deloadOnerisi && (
                <p className="text-[10px] font-mono text-red-300 leading-relaxed mt-1.5 pt-1.5 border-t border-zinc-800/60">
                  Üst üste üç seansta hazır oluşluk düşük. Hacim tavanı aşılmasa bile
                  toparlanamıyorsun — bu hafta yükü %30 azaltmayı düşün.
                </p>
              )}
            </div>
          )}

          {dashboardStats.isDeloadNeeded && (
            <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-2xl flex items-start space-x-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Dinlenme (Deload) İhtiyacı</h4>
                <p className="text-[10px] text-red-300 mt-1 font-mono">Yorgunluk sınırını aştınız. Bu hafta set sayılarını veya ağırlıkları yaklaşık %30 düşürün.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5"><Activity size={64} /></div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 z-10">Bu Hafta</span>
              <span className="text-2xl font-mono text-zinc-100 z-10">{dashboardStats.thisWeekSessions} <span className="text-xs text-zinc-500">Antrenman</span></span>
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5"><Target size={64} /></div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 z-10">Haftalık Hacim</span>
              <span className="text-2xl font-mono text-cyan-400 z-10">{dashboardStats.thisWeekEffectiveSets} <span className="text-xs text-zinc-500">Set</span></span>
            </div>
          </div>

          <DeferredSection
            minHeight={430}
            fallback={<DeferredCardFallback height={430} label="Kas haritası hazırlanıyor" />}
          >
            <Suspense fallback={<DeferredCardFallback height={430} label="Kas haritası yükleniyor" />}>
              <MuscleHeatmap
                muscleVolume={dashboardStats.muscleVolume}
                onSelectMuscle={onSelectMuscle}
                experienceLevel={experienceLevel}
                gender={gender}
              />
              {gender === 'female' && (
                <p className="mt-2 px-1 text-[9px] font-mono text-zinc-600 leading-relaxed">
                  Kadınlara yalnız cinsiyet nedeniyle farklı set çarpanı uygulanmaz. Hacim, belirtiler ve kişisel toparlanma trendine göre ayarlanır.
                </p>
              )}
            </Suspense>
          </DeferredSection>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Aşırı Yük Riski (ACWR)</span>
              <span className={`text-xl font-mono font-bold block mb-1 ${acwrStatus.text}`}>
                {dashboardStats.hasEnoughData ? dashboardStats.acwr : '—'}
              </span>
              <div className={`text-[10px] font-bold uppercase tracking-widest ${acwrStatus.text}`}>{acwrStatus.label}</div>
              <p className="text-[9px] font-mono text-zinc-600 leading-snug mt-1">{ACWR_HINT[acwrKey]}</p>
            </div>
            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">İtme / Çekme Oranı</span>
              {(() => {
                const { hasPushPullData, pushPullBalanced, pushPullRatio } = dashboardStats;
                const tone = !hasPushPullData ? 'text-zinc-500' : pushPullBalanced ? 'text-emerald-500' : 'text-orange-400';
                const label = !hasPushPullData ? 'Veri Yok' : pushPullBalanced ? 'Dengeli' : 'Dengesiz (Risk)';
                return (
                  <>
                    <span className={`text-xl font-mono font-bold block mb-1 ${tone}`}>{pushPullRatio}</span>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${tone}`}>{label}</div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <button
              type="button"
              onClick={() => onToggleMuscleVolume?.()}
              aria-expanded={showMuscleVolume}
              className="w-full flex justify-between items-center px-4 py-3 bg-zinc-950/60 active:bg-zinc-900 transition-colors text-left"
            >
              <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider flex items-center">
                <Target size={13} className="mr-2 text-cyan-400" /> Haftalık Kas Hacmi
              </h3>
              <span className="flex items-center gap-2 shrink-0">
                {!showMuscleVolume && (
                  <span className="text-[9px] font-mono text-zinc-500">
                    {under > 0 && <span className="text-cyan-400">{under} eksik</span>}
                    {under > 0 && over > 0 && ' · '}
                    {over > 0 && <span className="text-orange-400">{over} tavan üstü</span>}
                    {under === 0 && over === 0 && <span className="text-emerald-400">hepsi verimli</span>}
                  </span>
                )}
                <ChevronDown size={15} className={`text-zinc-500 transition-transform duration-200 ${showMuscleVolume ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {showMuscleVolume && (
              <>
                <div className="px-4 py-2 border-y border-zinc-800 bg-zinc-950/40">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Eşik / Verimli / Tartışmalı</span>
                </div>
                <div className="p-4 space-y-4">
                  {MUSCLE_SECTIONS.map(section => (
                    <div key={section.title} className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{section.title}</h4>
                      {section.muscles.map(muscle => {
                        const volume = dashboardStats.muscleVolume[muscle] || 0;
                        const landmark = getVolumeLandmarks(muscle, experienceLevel);
                        const percentage = Math.min(100, Math.round((volume / landmark.mav) * 100));
                        const status = VOLUME_STATUS[volumeStatusOf(volume, muscle, experienceLevel)];
                        const personal = personalVolume[muscle];
                        return (
                          <button
                            key={muscle}
                            type="button"
                            onClick={() => onSelectMuscle?.(muscle)}
                            className="w-full space-y-1 text-left active:opacity-70 transition-opacity"
                          >
                            <div className="flex justify-between items-center gap-2">
                              <span className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[11px] text-zinc-200 font-bold truncate">{muscle}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border shrink-0 ${status.chip}`}>{status.label}</span>
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                                <strong className="text-zinc-100">{volume}</strong>/{landmark.mav}
                                <span className="text-zinc-600"> (eşik {landmark.mev})</span>
                              </span>
                            </div>
                            {personal && (
                              <div className="flex justify-between gap-2 text-[9px] font-mono">
                                <span className="text-purple-400">Kişisel öneri {personal.low}–{personal.high} set</span>
                                <span className="text-zinc-600">{personal.confidence === 'high' ? 'yüksek' : 'orta'} güven</span>
                              </div>
                            )}
                            <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                              <div className={`h-1.5 rounded-full transition-all duration-500 ${status.bar}`} style={{ width: `${percentage}%` }} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {weeklyCardioKcal > 0 && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <Flame size={11} className="text-red-400" />
              Bu hafta kardiyodan {weeklyCardioKcal} kcal
            </div>
          )}
        </div>
      )}
    </section>
  );
});

HomeWeeklyOverview.displayName = 'HomeWeeklyOverview';

export default HomeWeeklyOverview;
