import React, { memo, useState } from 'react';
import { Activity, Pause, Play, Plus, X, Trash2, Trophy, TrendingUp, AlertCircle, Save, Timer, Layers, Link2, Unlink, BookmarkPlus, Settings, HeartPulse, ArrowUp, ArrowDown, Repeat, BatteryLow, TrendingDown, Flame, Volume2, VolumeX, RotateCcw, CheckCircle2, SlidersHorizontal, Minus, LifeBuoy, Ghost, Hourglass, MoreHorizontal } from 'lucide-react';
import WorkoutTimer from './WorkoutTimer';
import { FORM_RATINGS, SET_TYPES, SMALL_MUSCLE_GROUPS } from '../utils/constants';
import {
  getNextSetType, calcFatigueDropoff,
  isWarmupSet, isWorkingSet, parseNumber, estimate1RM,
  suggestNextTarget, detectMuscleGroup, clampNumber, INPUT_LIMITS, exerciseSetupNote
} from '../utils/helpers';
import { formatDay } from '../utils/dates';
import { READINESS_FIELDS, READINESS_ZONES } from '../utils/readiness';
import { nextSetCue, resolveRestTarget } from '../utils/rest';
import { sessionAdvice } from '../utils/autoregulation';
import { repRangeFor } from '../utils/exerciseTargets';
import { applyEmphasis } from '../utils/undulation';
import { TECHNIQUE_GUIDE } from '../utils/setTechniques';
import { SIDES, isUnilateralName, sideSummary } from '../utils/unilateral';
import { evaluatePrescription } from '../utils/progressionBlock';
import WorkoutFlowStepper from './WorkoutFlowStepper';

const ActiveWorkoutView = memo(({
  deloadReturn = null,
  warmupRoutine = null,
  painWarningFor = null,
  sessionPace = null,
  onUseBackup = null,
  onAddWarmup = null,
  onRemoveWarmup = null,
  onSetExerciseNote = null,
  onSetSide = null,
  pastNotesFor = null,
  sessionVolume = null,
  ghostRace = null,
  ghostTargetFor = null,
  timeCrunchPlan = null,
  onPreviewTimeCrunch = null,
  onApplyTimeCrunch = null,
  onCancelTimeCrunch = null,
  activeWorkout,
  setActiveWorkout,
  setIsEndWorkoutModalOpen,
  setIsExerciseModalOpen,
  getRecentExerciseData,
  personalRecords,
  customExercises,
  settings,
  updateSet,
  onApplyProgressionPrescription,
  addSet,
  removeSet,
  repsOnFocusRef,
  startRest,
  stopRest,
  pauseRest,
  resumeRest,
  adjustRest,
  sessionRestMuted = false,
  onToggleSessionRestMute,
  onReplayRestAlert,
  restAlertFlash = false,
  onSetRestOverride,
  rest,
  restSecondsLeft,
  onOpenPlateCalc,
  onSaveAsTemplate,
  onOpenCardio,
  cardioKcal = 0,
  onToggleSuperset,
  onEditExercise,
  onMoveExercise,
  onSubstitute,
  deload,
  // (hareket, ağırlık) → gerçek yük; vücut ağırlıklı hareketlerde ek yükün
  // üstüne taşınan vücut ağırlığını ekler.
  resolveLoad,
  bodyweightInfoFor,
}) => {
  // Hareket başlığındaki altı ikon satırın 264px'ini yiyordu ve geriye
  // hareket adına 26px kalıyordu — ekranın en önemli bilgisi okunamıyordu.
  // Eylemler tek bir menüye toplandı; menüde ETİKETLİ duruyorlar, çünkü
  // altı çıplak ikonun ne yaptığı zaten tahmin edilmek zorundaydı.
  // Kanca erken dönüşten önce: koşullu çağrılamaz.
  const [acikMenu, setAcikMenu] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!activeWorkout) return null;
  const restCue = nextSetCue(activeWorkout);

  return (
    <div className="luxury-workout absolute inset-0 bg-black z-40 flex flex-col h-[100dvh]">
      {/* Üst Bar: Kronometre ve Seans Durumu */}
      <div className="luxury-header flex justify-between items-center bg-zinc-950 px-4 py-3 border-b border-zinc-800 shadow-md pt-safe">
        <div className="flex items-center">
          <Activity size={16} className="mr-3 text-emerald-400 animate-pulse" />
          <div>
            <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wide truncate max-w-[160px]">
              {activeWorkout.name || 'Aktif Antrenman'}
            </h2>
            <div className="text-[11px] text-zinc-400 font-mono flex items-center space-x-1">
              {activeWorkout.isEditingOld
                ? <span>{formatDay(activeWorkout.date, 'medium', { year: true })}</span>
                : <WorkoutTimer timer={activeWorkout.timer} />}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!activeWorkout.isEditingOld && <button
            onClick={() => {
              setActiveWorkout(prev => {
                const status = prev.timer?.status === 'running' ? 'paused' : 'running';
                let accumulated = prev.timer?.accumulatedSeconds || 0;
                let startTime = prev.timer?.startTime || null;

                if (status === 'paused' && startTime) {
                  accumulated += Math.floor((Date.now() - startTime) / 1000);
                  startTime = null;
                } else if (status === 'running') {
                  startTime = Date.now();
                }
                return { ...prev, timer: { status, accumulatedSeconds: accumulated, startTime } };
              });
            }}
            className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl active:bg-zinc-800 transition-colors"
          >
            {activeWorkout.timer?.status === 'running' ? <Pause size={14} /> : <Play size={14} />}
          </button>}

          <button
            onClick={() => setIsEndWorkoutModalOpen(true)}
            className="bg-emerald-700 active:bg-emerald-800 text-white font-bold px-3 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 transition-all flex items-center"
          >
            <Save size={13} className="mr-1" /> {activeWorkout.isEditingOld ? 'Kaydet' : 'Bitir'}
          </button>
        </div>
      </div>

      {/* Ana İçerik: Egzersizler ve Setler */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar pb-32">
        {!activeWorkout.isEditingOld && <WorkoutFlowStepper stage="train" compact />}

        {!activeWorkout.isEditingOld && (
          <section className={`rounded-2xl border p-3.5 ${restCue?.complete
            ? 'border-emerald-900/55 bg-emerald-950/20'
            : 'border-cyan-900/50 bg-cyan-950/15'}`}
          >
            <span className={`text-[9px] font-black uppercase tracking-widest ${restCue?.complete ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {restCue?.complete ? 'Plan tamamlandı' : restCue ? 'Şimdi bunu yap' : 'İlk adım'}
            </span>
            <strong className="text-[13px] text-zinc-100 block mt-1">
              {restCue?.exerciseName || 'İlk hareketini seç'}
              {restCue && !restCue.complete ? ` · ${restCue.setIndex}/${restCue.totalSets}. set` : ''}
            </strong>
            <span className="text-[10px] text-zinc-400 block mt-0.5 leading-relaxed">
              {restCue?.details || 'Hareket kütüphanesinden başlayacağın hareketi ekle.'}
            </span>
            <button
              type="button"
              onClick={() => {
                if (!restCue) setIsExerciseModalOpen(true);
                else if (restCue.complete) setIsEndWorkoutModalOpen(true);
                else document.getElementById(`exercise-${restCue.exerciseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`w-full min-h-11 mt-3 rounded-xl text-[10px] font-black uppercase tracking-wider ${restCue?.complete ? 'bg-emerald-700 text-white' : 'bg-cyan-700 text-white'}`}
            >
              {!restCue ? 'Hareket Ekle' : restCue.complete ? 'Seansı Değerlendir' : 'Sete Git'}
            </button>
          </section>
        )}

        <button
          type="button"
          onClick={() => setDetailsOpen(open => !open)}
          aria-expanded={detailsOpen}
          className="w-full min-h-11 rounded-xl border border-zinc-800 bg-zinc-900 px-3 flex items-center gap-2 text-left active:bg-zinc-800"
        >
          <SlidersHorizontal size={14} className="text-zinc-400 shrink-0" />
          <span className="flex-1 min-w-0">
            <strong className="text-[10px] text-zinc-200 block">Seans ayrıntıları</strong>
            <span className="text-[9px] text-zinc-500 block truncate">
              {sessionPace?.total > 0 ? `${sessionPace.done}/${sessionPace.total} set` : 'Hazır oluşluk, tempo, hacim ve ısınma'}
            </span>
          </span>
          <span className="text-[9px] font-bold text-cyan-400">{detailsOpen ? 'Gizle' : 'Göster'}</span>
        </button>

        {detailsOpen && <div className="space-y-4">
        {activeWorkout.readiness && !activeWorkout.isEditingOld && (() => {
          // Skor kayıt anında hesaplanıp saklanıyor; burada yalnızca gösterilir.
          // Bölge anahtarı da kayıtta var, yoksa skordan yeniden bulunur.
          const r = activeWorkout.readiness;
          const zone = READINESS_ZONES.find(z => z.key === r.zone)
            || READINESS_ZONES.find(z => parseNumber(r.score) >= z.min)
            || READINESS_ZONES[READINESS_ZONES.length - 1];
          return (
            <div className={`p-3 rounded-xl border ${zone.bg}`}>
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Hazır Oluşluk</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono">
                    {READINESS_FIELDS.map(f => (
                      <span key={f.key} className={f.color}>
                        {f.label.split(' ')[0]}: {r[f.key] ?? '—'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className={`text-lg font-mono font-bold block ${zone.text}`}>{r.score}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${zone.text}`}>{zone.label}</span>
                </div>
              </div>
              <p className="text-[10px] font-mono text-zinc-400 leading-relaxed mt-2 pt-2 border-t border-zinc-800/60">
                {zone.advice}
              </p>
            </div>
          );
        })()}

        {activeWorkout.adaptation && !activeWorkout.isEditingOld && (
          <div className={`rounded-xl border px-3 py-2.5 flex items-start gap-2.5 ${activeWorkout.adaptation.mode === 'recovery' ? 'bg-red-950/20 border-red-900/50' : 'bg-amber-950/20 border-amber-900/50'}`}>
            <TrendingDown size={15} className={activeWorkout.adaptation.mode === 'recovery' ? 'text-red-400 shrink-0 mt-0.5' : 'text-amber-400 shrink-0 mt-0.5'} />
            <div className="min-w-0">
              <span className={`text-[10px] font-bold block ${activeWorkout.adaptation.mode === 'recovery' ? 'text-red-300' : 'text-amber-300'}`}>
                {activeWorkout.adaptation.label} · bugüne özel
              </span>
              <span className="text-[9px] font-mono text-zinc-500 block leading-relaxed">
                {activeWorkout.adaptation.originalWorkingSets} → {activeWorkout.adaptation.adaptedWorkingSets} set
                {activeWorkout.adaptation.loadPercent > 0 ? ` · kayıtlı yükler −%${activeWorkout.adaptation.loadPercent}` : ''}.
                {' '}{activeWorkout.adaptation.summary}
              </span>
            </div>
          </div>
        )}

        {/* Deload bandı: hedeflerin neden düşük geldiği görünür olsun, yoksa
            "uygulama yanlış öneriyor" gibi okunuyor. */}
        {deload?.active && (
          <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
            <BatteryLow size={15} className="text-amber-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-amber-300 block">
                Deload · {deload.dayIndex}/{deload.totalDays}. gün
              </span>
              <span className="text-[9px] font-mono text-amber-200/80 block leading-relaxed">
                {deload.preset.label} — {deload.preset.summary}. Hedefler buna göre geliyor.
              </span>
            </div>
          </div>
        )}

        {/* Tahmini bitiş. Salonda en sık sorulan pratik soru "kaç dakikam
            kaldı"; cevabı olmayınca son hareketler aceleye geliyordu. Tahmin
            seansın KENDİ temposundan çıkıyor, şablonun teorik süresinden
            değil. */}
        {sessionPace?.total > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2.5">
            <Timer size={13} className="text-cyan-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[10px] font-bold text-zinc-200">
                  {sessionPace.done}/{sessionPace.total} set
                </span>
                <span className="text-[9px] font-mono text-zinc-500">
                  {sessionPace.hasEstimate
                    ? `~${sessionPace.remainingMinutes} dk kaldı · bitiş ${sessionPace.finishLabel}`
                    : sessionPace.reason === 'done' ? 'bütün setler girildi'
                      : sessionPace.reason === 'tooEarly' ? 'tahmin için birkaç set daha'
                        : sessionPace.reason === 'unreliable' ? 'tempo örneklemi güvenilmez'
                          : ''}
                </span>
              </div>
              <div className="h-1 bg-zinc-950 rounded-full mt-1 border border-zinc-800 overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${sessionPace.progress}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* Hayalet: geçen seferle canlı yarış. Seans sonu raporu bu
            karşılaştırmayı seans BİTTİKTEN sonra veriyordu, oysa işe
            yarayacağı an son sette bir tekrar daha yapma kararı. */}
        {ghostRace?.hasGhost && ghostRace.status && (
          <div className={`rounded-xl border px-3 py-2 space-y-1.5 ${
            ghostRace.status.tone === 'ahead' ? 'border-emerald-900/50 bg-emerald-950/15'
              : ghostRace.status.tone === 'behind' ? 'border-amber-900/50 bg-amber-950/15'
                : 'border-zinc-800 bg-zinc-900'}`}>
            <div className="flex justify-between items-baseline gap-2">
              <span className={`text-[10px] font-bold ${
                ghostRace.status.tone === 'ahead' ? 'text-emerald-300'
                  : ghostRace.status.tone === 'behind' ? 'text-amber-300' : 'text-zinc-300'}`}>
                <Ghost size={11} className="inline mr-1" />
                {ghostRace.status.text}
              </span>
              <span className="text-[9px] font-mono text-zinc-500">
                {formatDay(ghostRace.date, 'short')} · {ghostRace.doneSets}/{ghostRace.ghostSets} set
              </span>
            </div>
            <div className="h-1 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${ghostRace.status.tone === 'behind' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${ghostRace.progress}%` }}
              />
            </div>
            {ghostRace.rows.filter(r => r.delta !== 0).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ghostRace.rows.filter(r => r.delta !== 0).slice(0, 5).map(r => (
                  <span
                    key={r.name}
                    className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${r.delta > 0
                      ? 'border-emerald-900/50 bg-emerald-950/20 text-emerald-300'
                      : 'border-amber-900/50 bg-amber-950/20 text-amber-300'}`}
                  >
                    {r.name.length > 16 ? `${r.name.slice(0, 15)}…` : r.name} {r.delta > 0 ? '+' : ''}{r.delta}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Zaman sıkışması. Değişiklik önce gösteriliyor, sonra onaylanıyor:
            sessizce hareket silen bir düğme neyi kaybettiğini bilmemek. */}
        {onPreviewTimeCrunch && (
          timeCrunchPlan ? (
            <div className="rounded-xl border border-amber-900/50 bg-amber-950/15 px-3 py-2 space-y-2">
              <span className="text-[10px] font-bold text-amber-300 block">{timeCrunchPlan.summary}</span>
              {timeCrunchPlan.dropped.length > 0 && (
                <div className="space-y-0.5">
                  {timeCrunchPlan.dropped.map(d => (
                    <p key={d.name} className="text-[9px] font-mono text-amber-200/80">
                      − {d.name} <span className="text-zinc-500">({d.reason})</span>
                    </p>
                  ))}
                </div>
              )}
              {timeCrunchPlan.trimmed.length > 0 && (
                <p className="text-[9px] font-mono text-zinc-500">
                  Kısılan: {timeCrunchPlan.trimmed.map(t => `${t.name} −${t.removed}`).join(' · ')}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onCancelTimeCrunch}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 py-2 text-[9px] font-bold text-zinc-400 active:bg-zinc-800"
                >
                  Vazgeç
                </button>
                <button
                  onClick={onApplyTimeCrunch}
                  className="rounded-lg bg-amber-600 active:bg-amber-700 py-2 text-[9px] font-bold text-white uppercase tracking-wider"
                >
                  Uygula
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 flex items-center gap-2">
              <Hourglass size={11} className="text-amber-400 shrink-0" />
              <span className="text-[9px] font-mono text-zinc-500 shrink-0">Vaktim az:</span>
              <div className="flex gap-1 flex-1">
                {[30, 45, 60].map(dk => (
                  <button
                    key={dk}
                    onClick={() => onPreviewTimeCrunch(dk)}
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 text-[9px] font-bold text-zinc-400 active:text-amber-300"
                  >
                    {dk} dk
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        {/* Kalan hacim. Hacim tablosu haftayı BİTTİKTEN SONRA anlatıyordu;
            seansın ortasında "bu kastan bu hafta kaç set kaldı" sorusunun
            cevabı yoktu, oysa karar tam orada veriliyor. Planlanan ama henüz
            girilmemiş setler ayrı gösteriliyor: onları saymamak "6 set açık"
            deyip zaten programda duran setleri görmezden gelmek olurdu. */}
        {sessionVolume?.hasData && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
                Bu Hafta Kalan
              </span>
              <span className="text-[9px] font-mono text-zinc-400">planlananlar dahil</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {sessionVolume.rows.slice(0, 8).map(r => (
                <span
                  key={r.muscle}
                  title={`${r.muscle}: hafta ${r.priorWeek} + bugün ${r.entered} girildi, ${r.planned} planlı → ${r.projected} (eşik ${r.mev} · tartışmalı sonu ${r.mrv})`}
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    r.willExceedMrv ? 'border-red-900/60 bg-red-950/20 text-red-300'
                      : r.shortOfMev ? 'border-amber-900/60 bg-amber-950/20 text-amber-300'
                        : 'border-emerald-900/60 bg-emerald-950/20 text-emerald-300'}`}
                >
                  {r.muscle} {r.projected}/{r.mev}
                  {r.planned > 0 && <span className="text-zinc-400"> (+{r.planned})</span>}
                </span>
              ))}
            </div>
            {sessionVolume.willExceedMrv.length > 0 && (
              <p className="text-[9px] font-mono text-red-300/85 leading-relaxed">
                Tavanı aşacak: {sessionVolume.willExceedMrv.map(r => `${r.muscle} +${r.overBy}`).join(' · ')}
              </p>
            )}
          </div>
        )}

        {/* Deload dönüşü: boşaltma bitince hiçbir şey söylenmiyordu ve
            kullanıcı ya bir anda eski hacme dönüyor ya da düşük hacimde
            kalıyordu. İkisi de deloadun amacını boşa çıkarıyor. */}
        {deloadReturn?.active && (
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-xl px-3 py-2.5 flex items-start gap-2.5">
            <TrendingUp size={15} className="text-cyan-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-cyan-300 block">
                Deload dönüşü · {deloadReturn.step.label}
              </span>
              <span className="text-[9px] font-mono text-cyan-200/80 block leading-relaxed">
                {deloadReturn.step.detail}
              </span>
            </div>
          </div>
        )}

        {/* Seans ısınması. Hareket bazlı ısınma piramidinden AYRI: piramit ilk
            ağır hareket için, bu rutin seansın tamamı için ve ondan önce. */}
        {warmupRoutine?.hasData && (
          <details className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <summary className="px-3 py-2.5 flex items-center gap-2 cursor-pointer list-none">
              <Flame size={13} className="text-orange-400 shrink-0" />
              <span className="text-[10px] font-bold text-zinc-200">
                Isınma rutini · ~{warmupRoutine.minutes} dk
              </span>
              <span className="text-[9px] font-mono text-zinc-400 ml-auto">
                {warmupRoutine.muscles.slice(0, 3).join(', ')}
              </span>
            </summary>
            <div className="px-3 pb-3 space-y-2.5 border-t border-zinc-800 pt-2.5">
              {warmupRoutine.blocks.map(b => (
                <div key={b.key}>
                  <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest block mb-1">
                    {b.label} · {b.minutes} dk
                  </span>
                  <ul className="space-y-0.5">
                    {b.items.map(item => (
                      <li key={item} className="text-[9px] font-mono text-zinc-400 leading-relaxed">• {item}</li>
                    ))}
                  </ul>
                  {b.note && <p className="text-[8px] font-mono text-zinc-400 leading-relaxed mt-1">{b.note}</p>}
                </div>
              ))}
              <p className="text-[8px] font-mono text-zinc-400 leading-relaxed">{warmupRoutine.note}</p>
            </div>
          </details>
        )}
        </div>}

        {(activeWorkout.exercises || []).length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-3 my-4">
            <div className="p-3 bg-zinc-950 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-zinc-800 text-cyan-400">
              <Plus size={24} />
            </div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Antrenmana Hareket Ekle</h3>
            <p className="text-[11px] text-zinc-500 font-mono">Antrenmanınıza henüz bir hareket eklenmedi. Aşağıdaki butondan ilk hareketinizi seçin.</p>
            <button
              onClick={() => setIsExerciseModalOpen(true)}
              className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center uppercase tracking-wide text-xs transition-colors shadow-lg shadow-cyan-900/30"
            >
              <Plus size={16} className="mr-1.5" /> İlk Hareketi Seç
            </button>
          </div>
        )}

        {(activeWorkout.exercises || []).map((ex, exIndex) => {
          const recentData = getRecentExerciseData(ex.name);
          const { muscle, contributions } = detectMuscleGroup(ex.name, customExercises);
          // Hedef tekrar aralığı harekete özel; hem buradaki hedef hem aşağıdaki
          // seans içi yük ayarı aynı yerden okuyor ki ikisi çelişmesin.
          // Öncelik sırası: şablona yazılmış aralık, sonra hareketin kendi
          // aralığı. Aynı hareket kuvvet şablonunda 4-6, hipertrofi
          // şablonunda 10-14 olabiliyor ve tek bir genel aralık ikisini
          // birden anlatamıyordu.
          const tabanAralik = ex.repRange?.min > 0 && ex.repRange?.max > 0
            ? { min: ex.repRange.min, max: ex.repRange.max, source: 'template' }
            : repRangeFor(ex.name, {
              overrides: settings.repRangeOverrides,
              customExercises,
              globalMin: settings.repRangeMin,
              globalMax: settings.repRangeMax,
            });
          // Gün vurgusu aralığı kaydırıyor: ağır günde aşağı, hafif günde
          // yukarı. Ama ŞABLONA ÖZEL bir aralık yazılmışsa vurgu uygulanmıyor:
          // o değer kullanıcının bu hareket için bu şablonda açıkça yazdığı
          // sayı, vurgu ise günün geneline konmuş bir varsayılan. İkisini üst
          // üste bindirmek, 4-6 yazan birinin ağır günde 1-3 görmesi demekti —
          // yani açık niyetin sessizce değişmesi.
          const vurguSonucu = tabanAralik.source === 'template'
            ? null
            : applyEmphasis(activeWorkout.emphasis, tabanAralik);
          const repRange = vurguSonucu ? vurguSonucu.repRange : tabanAralik;
          const target = recentData ? suggestNextTarget(recentData.sets, {
            repRangeMin: repRange.min,
            repRangeMax: repRange.max,
          }, muscle, {
            history: recentData.history,
            readiness: activeWorkout.readiness,
            deload,
          }) : null;
          const blockPrescription = ex.progressionPrescription || null;
          const blockEvaluation = blockPrescription
            ? evaluatePrescription(blockPrescription, ex, { requireCompleted: true })
            : null;
          const record = personalRecords.get(ex.name);
          const setupNote = exerciseSetupNote(ex.name, customExercises);
          const bodyweightInfo = bodyweightInfoFor?.(ex.name) || null;
          // Dinlenme düğmesinin göstereceği süre: son çalışma setine göre.
          // Set yoksa hareketin kendi karakterinden (orta şiddet varsayımı).
          // Süperset eşi varsa araya tam dinlenme girmemeli: dinlenme çiftin
          // sonuna ait, arada yalnızca geçiş var.
          const supersetPending = Boolean(ex.supersetId)
            && (activeWorkout.exercises || []).some(e => e.supersetId === ex.supersetId && e.id !== ex.id);
          const restHint = resolveRestTarget(
            ex.name,
            [...(ex.sets || [])].reverse().find(isWorkingSet) || { rir: 2 },
            settings,
            { customExercises, supersetPending });
          const restOverride = Number(settings.exerciseRestOverrides?.[ex.name]) || 0;
          const restOverrideOptions = [0, 60, 90, 120, 150, 180, 240, 300];
          // Katkılar büyükten küçüğe: birincil kas en solda.
          const muscleParts = Object.entries(contributions || {}).sort((a, b) => b[1] - a[1]);

          return (
            <div id={`exercise-${ex.id}`} key={ex.id} className="luxury-feature-card scroll-mt-4 bg-zinc-900/95 rounded-3xl border border-zinc-800/90 overflow-hidden shadow-xl">
              <div className="bg-zinc-950/80 px-3.5 py-2.5 border-b border-zinc-800/80 flex justify-between items-center gap-2">
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wide truncate min-w-0 flex items-center flex-1">
                  {ex.supersetId && <Link2 size={12} className="mr-1.5 text-purple-400 shrink-0" />}
                  <span className="text-cyan-400 mr-1">{exIndex + 1}.</span>
                  <span className="truncate">{ex.name}</span>
                </h3>
                <button
                  onClick={() => setAcikMenu(acikMenu === ex.id ? null : ex.id)}
                  aria-expanded={acikMenu === ex.id}
                  aria-label={`${ex.name} hareket eylemleri`}
                  className={`shrink-0 rounded-xl transition-colors ${acikMenu === ex.id ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-400 active:text-cyan-400'}`}
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {acikMenu === ex.id && (
                <div className="bg-zinc-950/60 border-b border-zinc-800/80 p-2 grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'up', icon: ArrowUp, label: 'Yukarı taşı', disabled: exIndex === 0,
                      onClick: () => onMoveExercise?.(ex.id, -1) },
                    { key: 'down', icon: ArrowDown, label: 'Aşağı taşı',
                      disabled: exIndex === (activeWorkout.exercises || []).length - 1,
                      onClick: () => onMoveExercise?.(ex.id, 1) },
                    { key: 'superset', icon: ex.supersetId ? Unlink : Link2,
                      label: ex.supersetId ? 'Süperset bağını kaldır' : 'Süperset yap',
                      tone: ex.supersetId ? 'text-purple-300' : '',
                      onClick: () => { onToggleSuperset?.(ex.id); setAcikMenu(null); } },
                    { key: 'sub', icon: Repeat, label: 'Alternatifleri gör',
                      onClick: () => { onSubstitute?.(ex.name, ex.id); setAcikMenu(null); } },
                    { key: 'map', icon: Settings, label: 'Kas eşlemesi',
                      onClick: () => { onEditExercise?.(ex.name); setAcikMenu(null); } },
                    { key: 'remove', icon: X, label: 'Antrenmandan çıkar', tone: 'text-red-300',
                      onClick: () => {
                        setActiveWorkout(prev => ({ ...prev, exercises: prev.exercises.filter(e => e.id !== ex.id) }));
                        setAcikMenu(null);
                      } },
                  ].map(eylem => {
                    const Icon = eylem.icon;
                    return (
                      <button
                        key={eylem.key}
                        onClick={eylem.onClick}
                        disabled={eylem.disabled}
                        className={`rounded-xl border border-zinc-800 bg-zinc-900/70 px-2.5 py-2 flex items-center gap-2 text-left active:bg-zinc-800 disabled:opacity-30 ${eylem.tone || 'text-zinc-300'}`}
                      >
                        <Icon size={14} className="shrink-0" />
                        <span className="text-[10px] font-bold leading-tight">{eylem.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {ex.supersetId && (
                <div className="bg-purple-950/25 px-3 py-1.5 border-b border-purple-900/40 flex items-center gap-1.5">
                  <Link2 size={10} className="text-purple-400 shrink-0" />
                  <span className="text-[9px] font-mono text-purple-300">
                    Süperset — {(activeWorkout.exercises || []).filter(e => e.supersetId === ex.supersetId && e.id !== ex.id).map(e => e.name).join(', ') || 'eş bekleniyor'}
                  </span>
                </div>
              )}

              {/* Bu hareketin bir setinin hangi kasa ne kadar yazıldığı */}
              {/* Vücut ağırlığı payı: ağırlık alanına 0 yazan kullanıcı, yükün
                  sıfır sayılmadığını görsün. */}
              {/* Ağrı uyarısı. Ağrı günlüğü ile hareket listesi bu sürüme
                  kadar birbirinden habersizdi; uyarının işe yarayacağı an
                  tam burası — sete girmeden önce. Hareket ENGELLENMİYOR:
                  karar kullanıcının, uygulamanın işi kararı görünür kılmak. */}
              {(() => {
                const uyari = painWarningFor?.(ex.name);
                if (!uyari) return null;
                return (
                  <div className={`px-3 py-1.5 border-b border-zinc-800 flex items-start gap-2 ${uyari.severity === 'high' ? 'bg-red-950/20' : 'bg-amber-950/15'}`}>
                    <AlertCircle size={10} className={`${uyari.severity === 'high' ? 'text-red-400' : 'text-amber-400'} shrink-0 mt-0.5`} />
                    <span className={`text-[9px] font-mono ${uyari.severity === 'high' ? 'text-red-300/90' : 'text-amber-300/90'}`}>
                      {uyari.regions.join(' / ')} ağrısı sürüyor ve bu hareket o bölgeyi yüklüyor.
                      {' '}{uyari.note}
                      {uyari.safer.length > 0 && <> Daha az yükleyen seçenekler: {uyari.safer.join(', ')}.</>}
                    </span>
                  </div>
                );
              })()}

              {/* Isınma merdiveni, seans notu ve tek taraflı takip.
                  Üçü de hareketin kendi bandında: seansın genel not alanına
                  yazılanlar bir sonraki seansta kimse tarafından açılmıyordu. */}
              {(onAddWarmup || onSetExerciseNote) && (
                <div className="px-3 py-1.5 border-b border-zinc-800 bg-zinc-950/40 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {onAddWarmup && (() => {
                      const isinmaVar = (ex.sets || []).some(st => st.setType === 'warmup');
                      return isinmaVar ? (
                        <button
                          onClick={() => onRemoveWarmup?.(ex.id)}
                          className="text-[8px] font-bold text-orange-300 bg-orange-950/25 border border-orange-900/50 rounded px-1.5 py-0.5 active:bg-orange-900/30"
                        >
                          ısınmayı kaldır
                        </button>
                      ) : (
                        <button
                          onClick={() => onAddWarmup(ex.id)}
                          title="Çalışma ağırlığına göre ısınma merdiveni ekle"
                          className="text-[8px] font-bold text-orange-300 bg-orange-950/25 border border-orange-900/50 rounded px-1.5 py-0.5 active:bg-orange-900/30 flex items-center gap-1"
                        >
                          <Flame size={8} /> ısınma ekle
                        </button>
                      );
                    })()}

                    {/* Tek taraflı takip yalnızca adı çağrıştıran hareketlerde
                        önerilir; her harekete sol/sağ düğmesi koymak arayüzü
                        gereksiz doldururdu. */}
                    {isUnilateralName(ex.name) && (() => {
                      const ozet = sideSummary(ex.sets);
                      return ozet.hasBoth ? (
                        <span
                          className={`text-[8px] font-bold rounded px-1.5 py-0.5 border ${ozet.gapPercent >= 10
                            ? 'text-amber-300 bg-amber-950/25 border-amber-900/50'
                            : 'text-zinc-400 bg-zinc-900 border-zinc-800'}`}
                        >
                          S {ozet.left.tonnage} · D {ozet.right.tonnage}
                          {ozet.gapPercent >= 10 && ` (%${ozet.gapPercent} fark)`}
                        </span>
                      ) : null;
                    })()}
                  </div>

                  {onSetExerciseNote && (
                    <input
                      type="text"
                      value={ex.note || ''}
                      onChange={(e) => onSetExerciseNote(ex.id, e.target.value)}
                      placeholder="Bu harekete not… (sehpa deliği, sıkışma, ayar)"
                      maxLength={240}
                      aria-label={`${ex.name} için seans notu`}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-[9px] font-mono text-zinc-300 outline-none focus:border-cyan-600 placeholder:text-zinc-500"
                    />
                  )}

                  {/* Geçmiş notlar: kalıcı kurulum notundan farklı, o seansa
                      ait gözlemler. Dört ay öncesinden eskisi gösterilmiyor. */}
                  {pastNotesFor?.(ex.name)?.map(n => (
                    <p key={n.date} className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                      <span className="text-zinc-300 font-bold">{n.label}:</span> {n.note}
                    </p>
                  ))}
                </div>
              )}

              {/* Şablonda planlanmış olanlar: yedek hareket, teknik ve
                  kaydırılmış tekrar aralığı. Plan şablonda kalsaydı seansta
                  hatırlanması kullanıcıya kalırdı. */}
              {(ex.backup || ex.plannedTechnique || vurguSonucu || tabanAralik.source === 'template') && (
                <div className="px-3 py-1.5 border-b border-zinc-800 bg-zinc-950/40 flex flex-wrap items-center gap-1.5">
                  {vurguSonucu && (
                    <span className="text-[8px] font-bold text-violet-300 bg-violet-950/30 border border-violet-900/50 rounded px-1.5 py-0.5">
                      {vurguSonucu.emphasis.label} · {repRange.min}-{repRange.max} tekrar
                    </span>
                  )}
                  {tabanAralik.source === 'template' && (
                    <span
                      title={activeWorkout.emphasis && activeWorkout.emphasis !== 'standard'
                        ? 'Şablona özel aralık yazıldığı için gün vurgusu bu harekete uygulanmadı.'
                        : undefined}
                      className="text-[8px] font-bold text-cyan-300 bg-cyan-950/30 border border-cyan-900/50 rounded px-1.5 py-0.5"
                    >
                      şablon aralığı {repRange.min}-{repRange.max}
                    </span>
                  )}
                  {ex.plannedTechnique && (
                    <span
                      title={TECHNIQUE_GUIDE[ex.plannedTechnique]?.how}
                      className="text-[8px] font-bold text-purple-300 bg-purple-950/30 border border-purple-900/50 rounded px-1.5 py-0.5"
                    >
                      planlı: {TECHNIQUE_GUIDE[ex.plannedTechnique]?.label}
                    </span>
                  )}
                  {ex.backup && onUseBackup && (
                    <button
                      onClick={() => onUseBackup(ex.id, ex.backup)}
                      title={`${ex.name} yerine ${ex.backup}`}
                      className="text-[8px] font-bold text-emerald-300 bg-emerald-950/30 border border-emerald-900/50 rounded px-1.5 py-0.5 active:bg-emerald-900/30 flex items-center gap-1"
                    >
                      <LifeBuoy size={8} /> yedek: {ex.backup}
                    </button>
                  )}
                </div>
              )}

              {/* Vücut ağırlığı bandı. Eskiden yalnızca "şu kadar ekleniyor"
                  diyordu; sayının hangi kilodan çıktığı ve alana ne yazılması
                  gerektiği görünmüyordu. Artık taban, kaynağı ve canlı toplam
                  yazıyor — ayarın doğru olup olmadığı buradan anlaşılıyor. */}
              {bodyweightInfo && (
                <div className={`px-3 py-1.5 border-b border-zinc-800 flex items-start gap-2 ${bodyweightInfo.style === 'total' ? 'bg-amber-950/15' : 'bg-emerald-950/15'}`}>
                  <Activity size={10} className={`${bodyweightInfo.style === 'total' ? 'text-amber-500' : 'text-emerald-500'} shrink-0 mt-0.5`} />
                  <span className={`text-[9px] font-mono ${bodyweightInfo.style === 'total' ? 'text-amber-300/90' : 'text-emerald-300/90'}`}>
                    {bodyweightInfo.style === 'total' ? (
                      <>Ağırlık alanı TOPLAM yük olarak okunuyor; vücut ağırlığı ayrıca eklenmiyor.</>
                    ) : (
                      <>
                        Taban <strong>{bodyweightInfo.carried} kg</strong> ({bodyweightInfo.label},
                        {' '}{bodyweightInfo.basis.kg} kg {bodyweightInfo.basis.label}) — alana yalnızca
                        {' '}<strong>EK</strong> yükü yaz.
                        {(() => {
                          const sonSet = [...(ex.sets || [])].reverse().find(isWorkingSet);
                          const ek = parseNumber(sonSet?.weight);
                          return ek > 0
                            ? <> Şu an: {bodyweightInfo.carried} + {ek} = <strong>{Math.round((bodyweightInfo.carried + ek) * 10) / 10} kg</strong></>
                            : <> Ek yük yoksa 0 bırak.</>;
                        })()}
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Kurulum notu: sehpa yüksekliği, pim deliği gibi ayarlar her
                  seans yeniden bulunuyordu. Setlerin hemen üstünde duruyor
                  çünkü lazım olduğu an makineye otururken. */}
              {setupNote && (
                <div className="px-3 py-2 border-b border-zinc-800 bg-cyan-950/15 flex items-start gap-2">
                  <Settings size={11} className="text-cyan-500 shrink-0 mt-0.5" />
                  <span className="text-[10px] font-mono text-cyan-200/90 leading-relaxed">{setupNote}</span>
                </div>
              )}

              {muscleParts.length > 0 && (
                <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/40 flex flex-wrap gap-1">
                  {muscleParts.map(([m, w]) => (
                    <span
                      key={m}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        w === 1 ? 'text-emerald-400 border-emerald-900/50 bg-emerald-950/30'
                          : w === 0.5 ? 'text-cyan-400 border-cyan-900/50 bg-cyan-950/30'
                            : 'text-zinc-500 border-zinc-800 bg-zinc-900'
                      }`}
                    >
                      {m}{w === 0.5 ? ' ½' : w === 0.25 ? ' ¼' : ''}
                    </span>
                  ))}
                </div>
              )}

              {blockPrescription && (
                <div className="border-b border-cyan-900/45 bg-cyan-950/25 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="flex items-center text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                        <TrendingUp size={11} className="mr-1.5" /> İlerleme Bloğu
                      </span>
                      <span className="mt-0.5 block text-[9px] font-mono text-cyan-300/75">
                        {blockPrescription.modelLabel} · {blockPrescription.sessionIndex + 1}/{blockPrescription.totalSessions}. seans · {blockPrescription.phase}
                      </span>
                    </div>
                    {onApplyProgressionPrescription && (
                      <button
                        onClick={() => onApplyProgressionPrescription(ex.id)}
                        className="shrink-0 rounded-lg border border-cyan-700 bg-cyan-900/40 px-2.5 py-1.5 text-[8px] font-black uppercase text-cyan-200 active:bg-cyan-800/50"
                      >
                        Boş Setlere Uygula
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex gap-1.5 overflow-x-auto hide-scrollbar">
                    {blockPrescription.sets.map((planned, index) => (
                      <span key={`${planned.kind}-${index}`} className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-950/80 px-2 py-1 text-[9px] font-mono text-zinc-300">
                        {index + 1}. {planned.weight > 0 ? `${planned.weight} kg × ` : ''}{planned.reps} · RIR {planned.rir}
                      </span>
                    ))}
                  </div>
                  {blockPrescription.adaptationReason && (
                    <p className="mt-1.5 text-[9px] font-mono leading-relaxed text-amber-300/85">{blockPrescription.adaptationReason}</p>
                  )}
                  {blockEvaluation?.status !== 'pending' && (
                    <p className={`mt-1.5 text-[9px] font-bold ${blockEvaluation.status === 'met' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      Canlı uyum: %{blockEvaluation.score} · {blockEvaluation.metSets}/{blockEvaluation.plannedSets} hedef set
                    </p>
                  )}
                </div>
              )}

              {target && !blockPrescription && (
                <div className="bg-emerald-950/25 px-3 py-2 border-b border-emerald-900/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center">
                      <TrendingUp size={11} className="mr-1.5" /> Bugünkü Hedef
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-400">{target.weight} kg × {target.reps}</span>
                  </div>
                    <div className="text-[10px] text-emerald-400 font-mono mt-1">
                      {target.note} · {target.confidence === 'high' ? 'yüksek güven' : 'orta güven'}
                    </div>
                </div>
              )}

              {/* Yatay kaydırıcıydı ve kaydırma çubuğu gizliydi: son setler
                  ekran dışında kalıyor, kullanıcı da kaydırabileceğini
                  göremiyordu. Setler arasında bakılan referans veri bu —
                  saklanacak yer değil, satıra sığmıyorsa alta insin. */}
              {recentData && (
                <div className="bg-cyan-950/20 px-3 py-1.5 border-b border-zinc-800 text-[10px] text-cyan-500/70 font-mono flex flex-wrap gap-x-3 gap-y-1 items-center">
                  <span className="text-cyan-600 font-bold shrink-0">Geçen ({formatDay(recentData.date)}):</span>
                  {recentData.sets.map((s, i) => (
                    <span key={i} className="shrink-0">{s.weight}x{s.reps} {s.rir !== '' && s.rir !== undefined && `(RIR:${s.rir})`}</span>
                  ))}
                </div>
              )}

              {record && (
                <div className="bg-yellow-950/15 px-3 py-1.5 border-b border-zinc-800 text-[10px] font-mono flex items-center gap-2">
                  <Trophy size={10} className="text-yellow-500 shrink-0" />
                  <span className="text-yellow-500/90">Rekor: <span className="text-yellow-500 font-bold">{record.e1rm} kg</span> (1RM tahmini · {record.weight}×{record.reps})</span>
                </div>
              )}

              {(() => {
                const fatigue = calcFatigueDropoff(ex.sets);
                if (!fatigue) return null;
                const isHighDropoff = fatigue.dropoff > 20;
                return (
                  <div className={`px-3 py-1 border-b border-zinc-800 text-[10px] font-mono flex items-center justify-between ${isHighDropoff ? 'bg-red-950/20 text-red-400' : 'bg-zinc-950/60 text-emerald-400'}`}>
                    <span className="flex items-center gap-1 font-bold">
                      {isHighDropoff ? <AlertCircle size={10} className="text-red-500" /> : <Activity size={10} className="text-emerald-500" />}
                      {isHighDropoff ? `Yorgunluk Yüksek (%${fatigue.dropoff} Güç Kaybı)` : `Hacim Korunumu: %${fatigue.retention}`}
                    </span>
                    <span className="text-zinc-500 text-[10px]">{fatigue.firstSet} → {fatigue.lastSet}</span>
                  </div>
                );
              })()}

              {/* Seans içi yük ayarı. Yorgunluk düşüşü yukarıda GÖSTERİLİYORDU
                  ama ne yapılacağını söylemiyordu; karar anı tam da burası. */}
              {(() => {
                // Tekrar aralığı artık harekete özel: aynı 6-10 bandını hem
                // ağır çömelişe hem yan omuz kaldırışına dayatmak, verilen
                // tavsiyeyi ikincisinde yanlış yapıyordu.
                const advice = sessionAdvice(ex.sets, {
                  repRangeMin: repRange.min,
                  repRangeMax: repRange.max,
                  isSmallMuscle: SMALL_MUSCLE_GROUPS.includes(muscle),
                });
                if (!advice) return null;
                const artis = advice.action === 'increase';
                return (
                  <div className={`px-3 py-2 border-b border-zinc-800 flex items-start gap-2 ${artis ? 'bg-emerald-950/20' : 'bg-amber-950/20'}`}>
                    {artis
                      ? <TrendingUp size={11} className="text-emerald-400 shrink-0 mt-0.5" />
                      : <TrendingDown size={11} className="text-amber-400 shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <span className={`text-[10px] font-bold block ${artis ? 'text-emerald-300' : 'text-amber-300'}`}>
                        Sıradaki set: {advice.weight} kg ({advice.delta > 0 ? '+' : ''}{advice.delta})
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 leading-relaxed block">{advice.reason}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="p-2 space-y-2 mt-1">
                <div className="grid grid-cols-12 gap-1 text-[10px] uppercase tracking-wider text-zinc-500 text-center font-bold px-0.5">
                  <div className="col-span-1">S</div><div className="col-span-3">KG</div><div className="col-span-2">Tekrar</div><div className="col-span-2">RIR</div><div className="col-span-2">Tempo</div><div className="col-span-2">Form</div>
                </div>

                {(ex.sets || []).map((set, setIndex) => {
                  const warmup = isWarmupSet(set);
                  const st = SET_TYPES[set.setType] || SET_TYPES.normal;
                  const isEffective = !warmup && parseNumber(set.rir) <= 3 && parseNumber(set.reps) > 0;
                  // 1RM ek ağırlıktan değil GERÇEK yükten hesaplanıyor: barfikste
                  // ağırlık alanı 0 olduğu için bu hareketler hiç 1RM üretmiyordu.
                  const e1rm = warmup ? 0 : estimate1RM(
                    resolveLoad ? resolveLoad(ex.name, set.weight) : set.weight,
                    set.reps, set.rir);
                  const isNewRecord = e1rm > 0 && (!record || e1rm > record.e1rm);
                  const workingIndex = (ex.sets || []).slice(0, setIndex + 1).filter(isWorkingSet).length;
                  // Geçen seferin aynı sıradaki seti. Hedef vermiyor, sadece
                  // geçmişi hatırlatıyor — salonda asıl işe yarayan bilgi bu.
                  const hayaletSet = !warmup && ghostTargetFor
                    ? ghostTargetFor(ex.name, workingIndex - 1)
                    : null;

                  const setBadgeText = set.setType === 'warmup' ? 'W' : set.setType === 'drop' ? 'D' : set.setType === 'failure' ? 'F' : set.setType === 'rest_pause' ? 'RP' : workingIndex;

                  const isCompleted = Boolean(set.completed);
                  const borderStyle = warmup
                    ? 'bg-zinc-950/50 border-orange-900/40'
                    : set.setType === 'drop'
                    ? 'bg-purple-950/20 border-purple-900/50'
                    : set.setType === 'failure'
                    ? 'bg-red-950/20 border-red-900/50'
                    : set.setType === 'rest_pause'
                    ? 'bg-emerald-950/20 border-emerald-900/50'
                    : isCompleted
                    ? 'bg-emerald-950/15 border-emerald-800/60 shadow-sm shadow-emerald-950/20'
                    : isEffective
                    ? 'bg-zinc-950 border-cyan-900/50'
                    : 'bg-zinc-950 border-zinc-800/90';

                  return (
                    <div key={set.id} className={`grid grid-cols-12 gap-1 items-center p-1 rounded-xl border transition-colors relative ${borderStyle}`}>
                      {/* Tek taraflı hareketlerde rozet hücresi ikiye bölünüyor:
                          üstte set tipi, altta taraf. Ayrı bir sütun açmak
                          on iki sütunluk ızgarayı bozardı ve taraf takibi
                          yalnızca birkaç harekette gerekiyor. */}
                      {onSetSide && isUnilateralName(ex.name) ? (
                        <div className="col-span-1 flex flex-col gap-0.5">
                          <button
                            onClick={() => updateSet(ex.id, set.id, 'setType', getNextSetType(set.setType))}
                            title={`Set Tipi: ${st.label} (Dokun: değiştir)`}
                            className={`text-center text-[10px] font-mono font-bold h-6 rounded-md transition-colors ${st.textClass}`}
                          >
                            {setBadgeText}
                          </button>
                          <button
                            onClick={() => onSetSide(ex.id, set.id)}
                            title={set.side === 'left' ? 'Sol taraf' : set.side === 'right' ? 'Sağ taraf' : 'Taraf yok (dokun: sol)'}
                            aria-label={`${set.side === 'left' ? 'Sol' : set.side === 'right' ? 'Sağ' : 'Tarafsız'} — değiştirmek için dokun`}
                            className={`text-center text-[9px] font-mono font-bold h-3.5 rounded-md transition-colors ${
                              set.side === 'left' ? 'text-violet-300 bg-violet-950/40'
                                : set.side === 'right' ? 'text-cyan-300 bg-cyan-950/40'
                                  : 'text-zinc-500 bg-zinc-900'}`}
                          >
                            {set.side === 'left' ? SIDES[0].short : set.side === 'right' ? SIDES[1].short : '·'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => updateSet(ex.id, set.id, 'setType', getNextSetType(set.setType))}
                          title={`Set Tipi: ${st.label} (Dokun: değiştir)`}
                          className={`col-span-1 text-center text-[11px] font-mono font-bold h-10 rounded-lg transition-colors ${st.textClass}`}
                        >
                          {setBadgeText}
                        </button>
                      )}
                      {hayaletSet && parseNumber(set.reps) === 0 && (
                        <span
                          title={`Geçen sefer ${hayaletSet.setIndex}. set: ${hayaletSet.weight} kg x ${hayaletSet.reps}`}
                          className="absolute -top-1.5 right-2 text-[7px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-800 rounded px-1 z-10"
                        >
                          geçen: {hayaletSet.weight}×{hayaletSet.reps}
                        </span>
                      )}
                      <div className="col-span-3"><input type="number" inputMode="decimal" min={INPUT_LIMITS.weight.min} max={INPUT_LIMITS.weight.max} value={set.weight} onChange={(e) => updateSet(ex.id, set.id, 'weight', e.target.value)} onFocus={e => e.target.select()} onBlur={(e) => updateSet(ex.id, set.id, 'weight', clampNumber(e.target.value, INPUT_LIMITS.weight.min, INPUT_LIMITS.weight.max))} className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 font-mono text-sm outline-none text-center focus:bg-zinc-800 h-10 transition-colors ${warmup ? 'text-orange-300/70' : 'text-cyan-400'}`} placeholder="0" /></div>
                      <div className="col-span-2">
                        <input
                          type="number" inputMode="decimal" value={set.reps}
                          min={INPUT_LIMITS.reps.min} max={INPUT_LIMITS.reps.max}
                          onChange={(e) => updateSet(ex.id, set.id, 'reps', e.target.value)}
                          onFocus={(e) => { e.target.select(); repsOnFocusRef.current = e.target.value; }}
                          onBlur={(e) => {
                            const changed = repsOnFocusRef.current !== e.target.value;
                            repsOnFocusRef.current = null;
                            updateSet(ex.id, set.id, 'reps', clampNumber(e.target.value, INPUT_LIMITS.reps.min, INPUT_LIMITS.reps.max));
                            if (changed && !warmup && parseNumber(e.target.value) > 0) {
                              updateSet(ex.id, set.id, 'completed', true);
                              if (settings.autoRestTimer) {
                                // Süreyi az önce BİTEN setin özellikleri belirliyor:
                                // yorgunluğu bırakan o set, sıradaki değil.
                                const oneri = resolveRestTarget(
                                  ex.name, { ...set, reps: e.target.value }, settings,
                                  { customExercises, supersetPending });
                                startRest(oneri.seconds, oneri.reason);
                              }
                            }
                          }}
                          className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 font-mono text-sm outline-none text-center focus:bg-zinc-800 h-10 transition-colors ${warmup ? 'text-zinc-500' : 'text-zinc-100'}`}
                          placeholder={set.plannedTarget?.reps ? String(set.plannedTarget.reps) : '0'} />
                      </div>
                      <div className="col-span-2"><input type="number" inputMode="decimal" step="0.5" min={INPUT_LIMITS.rir.min} max={INPUT_LIMITS.rir.max} value={set.rir} onChange={(e) => updateSet(ex.id, set.id, 'rir', e.target.value)} onFocus={e => e.target.select()} onBlur={(e) => updateSet(ex.id, set.id, 'rir', clampNumber(e.target.value, INPUT_LIMITS.rir.min, INPUT_LIMITS.rir.max))} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-mono text-xs outline-none text-center focus:bg-zinc-800 h-10 transition-colors" placeholder="0" /></div>
                      <div className="col-span-2"><input type="text" maxLength="4" value={set.tempo || ''} onChange={(e) => updateSet(ex.id, set.id, 'tempo', e.target.value)} onFocus={e => e.target.select()} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-400 font-mono text-[11px] outline-none text-center focus:bg-zinc-800 h-10 transition-colors" placeholder="TUT" /></div>
                      <div className="col-span-2 flex items-center pr-1">
                        <select value={set.formRating} onChange={(e) => updateSet(ex.id, set.id, 'formRating', parseNumber(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-zinc-300 font-mono text-[11px] outline-none text-center h-10 appearance-none transition-colors">
                          {FORM_RATINGS.map(r => <option key={r.value} value={r.value}>{r.value}</option>)}
                        </select>
                      </div>
                      <div className="col-span-12 flex flex-wrap justify-between items-center px-1.5 pt-1 border-t border-zinc-900/60 gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => removeSet(ex.id, set.id)} className="text-zinc-500 hover:text-red-400 active:text-red-500 p-1 -m-0.5 transition-colors" title="Bu seti sil" aria-label="Bu seti sil">
                            <Trash2 size={12} />
                          </button>
                          <select
                            value={set.setType || 'normal'}
                            onChange={(e) => updateSet(ex.id, set.id, 'setType', e.target.value)}
                            className="bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-[10px] font-mono rounded-md px-1 py-0.5 outline-none border border-zinc-800 transition-colors"
                          >
                            <option value="normal">Normal (N)</option>
                            <option value="warmup">Isınma (W)</option>
                            <option value="drop">Drop Set (D)</option>
                            <option value="failure">Tükeniş (F)</option>
                            <option value="rest_pause">Rest-Pause (RP)</option>
                          </select>

                          {/* Hızlı Ağırlık Artır/Azalt Kısayolları */}
                          <div className="flex items-center gap-0.5 bg-zinc-900/90 rounded-lg p-0.5 border border-zinc-800">
                            <button
                              type="button"
                              onClick={() => {
                                const curr = parseNumber(set.weight) || 0;
                                updateSet(ex.id, set.id, 'weight', Math.max(0, Math.round((curr - 2.5) * 100) / 100));
                              }}
                              className="px-1.5 py-0.5 text-[8px] font-mono font-bold text-zinc-400 hover:text-zinc-200 active:bg-zinc-800 rounded"
                              title="2.5 kg azalt"
                            >
                              -2.5
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const curr = parseNumber(set.weight) || 0;
                                updateSet(ex.id, set.id, 'weight', Math.round((curr + 1.25) * 100) / 100);
                              }}
                              className="px-1.5 py-0.5 text-[8px] font-mono font-bold text-cyan-400 hover:text-cyan-300 active:bg-zinc-800 rounded"
                              title="1.25 kg artır"
                            >
                              +1.25
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const curr = parseNumber(set.weight) || 0;
                                updateSet(ex.id, set.id, 'weight', Math.round((curr + 2.5) * 100) / 100);
                              }}
                              className="px-1.5 py-0.5 text-[8px] font-mono font-bold text-cyan-400 hover:text-cyan-300 active:bg-zinc-800 rounded"
                              title="2.5 kg artır"
                            >
                              +2.5
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const curr = parseNumber(set.weight) || 0;
                                updateSet(ex.id, set.id, 'weight', Math.round((curr + 5) * 100) / 100);
                              }}
                              className="px-1.5 py-0.5 text-[8px] font-mono font-bold text-cyan-400 hover:text-cyan-300 active:bg-zinc-800 rounded"
                              title="5 kg artır"
                            >
                              +5
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const complete = !set.completed;
                              updateSet(ex.id, set.id, 'completed', complete);
                              if (complete && settings.autoRestTimer && !warmup) {
                                const suggestion = resolveRestTarget(ex.name, set, settings, { customExercises, supersetPending });
                                startRest(suggestion.seconds, suggestion.reason);
                              }
                            }}
                            aria-pressed={Boolean(set.completed)}
                            title={set.completed ? 'Seti tamamlanmadı olarak işaretle' : 'Seti tamamla'}
                            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold border transition-all active:scale-[0.96] shadow-sm ${set.completed ? 'border-emerald-700/80 bg-emerald-950/40 text-emerald-300' : 'border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:text-zinc-200'}`}
                          >
                            <CheckCircle2 size={12} className={set.completed ? 'text-emerald-400' : 'text-zinc-500'} /> {set.completed ? 'Tamamlandı' : 'Tamamla'}
                          </button>
                        </div>
                        {warmup ? (
                          <span className="text-[10px] text-orange-400 font-mono tracking-wider uppercase font-semibold">Isınma</span>
                        ) : (
                          <span className="text-[10px] font-mono tracking-wider flex items-center gap-1.5">
                            {isNewRecord && (
                              <span className="text-yellow-400 font-bold flex items-center"><Trophy size={10} className="mr-0.5" /> REKOR</span>
                            )}
                            <span className="text-cyan-400 font-semibold">1RM: {e1rm > 0 ? `${e1rm}kg` : '—'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => addSet(ex.id)}
                    className="flex-1 py-2.5 bg-zinc-950/80 hover:bg-zinc-900 active:scale-[0.98] text-cyan-400 border border-dashed border-cyan-900/40 rounded-xl font-bold text-xs flex items-center justify-center uppercase tracking-wider transition-all shadow-sm"
                  >
                    <Plus size={14} className="mr-1" /> Set Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Son çalışma setinin ağırlığıyla aç; yoksa bugünkü hedefle.
                      const lastWorking = [...(ex.sets || [])].reverse().find(s => isWorkingSet(s) && parseNumber(s.weight) > 0);
                      onOpenPlateCalc?.(parseNumber(lastWorking?.weight) || target?.weight || 0, ex.id);
                    }}
                    title="Plaka hesaplayıcı ve ısınma"
                    className="px-3 py-2.5 bg-zinc-950/80 active:scale-[0.95] text-cyan-400 border border-cyan-900/50 rounded-xl transition-all shrink-0 shadow-sm hover:border-cyan-700"
                  >
                    <Layers size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const index = Math.max(0, restOverrideOptions.indexOf(restOverride));
                      const next = restOverrideOptions[(index + 1) % restOverrideOptions.length];
                      onSetRestOverride?.(ex.name, next || null);
                    }}
                    title={restOverride ? `Harekete özel ${restOverride} sn — değiştirmek için dokun` : 'Harekete özel dinlenme süresi belirle'}
                    aria-label="Harekete özel dinlenme süresini değiştir"
                    className={`px-2.5 py-2.5 bg-zinc-950/80 active:scale-[0.95] border rounded-xl transition-all shrink-0 flex items-center gap-1 shadow-sm ${restOverride ? 'border-amber-800 text-amber-400' : 'border-zinc-800 text-zinc-500'}`}
                  >
                    <SlidersHorizontal size={13} />
                    <span className="text-[9px] font-bold">{restOverride ? `${restOverride}s` : 'Özel'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startRest(restHint.seconds, restHint.reason)}
                    title={restHint.reason}
                    className={`px-3 py-2.5 bg-zinc-950/80 active:scale-[0.95] border border-zinc-800 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all shrink-0 shadow-sm ${restHint.tier.text}`}
                  >
                    {restHint.seconds}s{restOverride ? ' •' : ''}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setIsExerciseModalOpen(true)}
          className="w-full bg-zinc-900/90 hover:bg-zinc-800/90 active:scale-[0.98] border border-zinc-800/80 text-zinc-100 font-bold py-3.5 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-xs transition-all shadow-md shadow-black/20"
        >
          <Plus size={16} className="mr-2 text-cyan-400" /> Hareket Ekle
        </button>

        <button
          type="button"
          onClick={onOpenCardio}
          className="w-full bg-zinc-900/90 active:scale-[0.98] border border-zinc-800/80 text-zinc-100 font-bold py-3.5 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-xs transition-all shadow-md shadow-black/20"
        >
          <HeartPulse size={16} className="mr-2 text-red-400" />
          Kardiyo Ekle
          {(activeWorkout.cardio || []).length > 0 && (
            <span className="ml-2 text-[10px] font-mono text-zinc-500 normal-case tracking-normal">
              ({activeWorkout.cardio.length} kayıt{cardioKcal > 0 ? ` · ${cardioKcal} kcal` : ''})
            </span>
          )}
        </button>

        {(activeWorkout.exercises || []).length > 0 && (
          <button
            type="button"
            onClick={onSaveAsTemplate}
            className="w-full bg-zinc-950/80 border border-zinc-800/80 text-zinc-400 active:scale-[0.98] active:text-zinc-200 font-bold py-3 px-4 rounded-2xl flex justify-center items-center uppercase tracking-wide text-[11px] transition-all shadow-sm"
          >
            <BookmarkPlus size={15} className="mr-2 text-cyan-500" /> Bu Antrenmanı Şablon Yap
          </button>
        )}
      </div>

      {/* Ses kapalıyken de bitiş fark edilsin; pointer-events-none olduğu için
          kullanıcının dokunuşunu yutmaz. */}
      {restAlertFlash && (
        <div className="absolute inset-0 z-[70] pointer-events-none flex items-center justify-center bg-emerald-400/25 animate-pulse">
          <div className="bg-zinc-950/95 border border-emerald-400 rounded-3xl px-7 py-5 shadow-2xl text-center">
            <CheckCircle2 size={30} className="text-emerald-400 mx-auto mb-2" />
            <span className="text-sm font-black uppercase tracking-widest text-emerald-300">Dinlenme Bitti</span>
          </div>
        </div>
      )}

      {/* Dinlenme geri sayımı — ekranın altında sabit durur */}
      {rest && restSecondsLeft > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-[380px]">
          <div className="bg-zinc-950/95 backdrop-blur-2xl border border-cyan-800/40 rounded-3xl shadow-2xl shadow-black/80 px-4 py-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center">
                <Timer size={12} className={`mr-1.5 ${rest.paused ? '' : 'animate-pulse text-cyan-400'}`} /> {rest.paused ? 'Dinlenme Duraklatıldı' : 'Dinlenme Sayacı'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={onToggleSessionRestMute}
                  title={sessionRestMuted ? 'Seans uyarılarını aç' : 'Yalnız bu seansın uyarılarını sessize al'}
                  aria-label={sessionRestMuted ? 'Seans uyarılarını aç' : 'Seans uyarılarını sessize al'}
                  className={`p-1.5 rounded-xl border bg-zinc-900/90 transition-colors ${sessionRestMuted ? 'border-red-900/60 text-red-400' : 'border-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                >
                  {sessionRestMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                <button
                  onClick={() => onReplayRestAlert?.()}
                  title="Uyarıyı şimdi tekrar çal"
                  aria-label="Dinlenme uyarısını tekrar çal"
                  className="p-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-400 active:text-cyan-400 transition-colors"
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  onClick={rest.paused ? resumeRest : pauseRest}
                  title={rest.paused ? 'Sayacı sürdür' : 'Sayacı duraklat'}
                  aria-label={rest.paused ? 'Dinlenme sayacını sürdür' : 'Dinlenme sayacını duraklat'}
                  className="p-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-300 active:text-cyan-400 transition-colors"
                >
                  {rest.paused ? <Play size={13} /> : <Pause size={13} />}
                </button>
                <button
                  onClick={stopRest}
                  title="Dinlenmeyi bitir"
                  aria-label="Dinlenme sayacını kapat"
                  className="text-zinc-400 active:text-red-400 bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-xl transition-colors hover:border-red-900/40"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
            {sessionRestMuted && (
              <p className="text-[9px] font-mono text-red-300/80 mb-2">Bu seans için ses, titreşim ve sistem bildirimi kapalı.</p>
            )}
            <div className="flex items-center gap-3.5 my-1">
              <span className="font-mono font-black text-3xl text-cyan-400 tabular-nums tracking-tight drop-shadow-sm">
                {Math.floor(restSecondsLeft / 60)}:{(restSecondsLeft % 60).toString().padStart(2, '0')}
              </span>
              <div className="flex-1 bg-zinc-900 rounded-full h-2.5 border border-zinc-800/80 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max(0, Math.min(100, (restSecondsLeft / rest.total) * 100))}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2.5">
              <button aria-label="15 saniye azalt" onClick={() => adjustRest?.(-15)} className="py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 text-[10px] font-black tracking-wide flex items-center justify-center gap-0.5 active:scale-[0.97] transition-all"><Minus size={10} />15s</button>
              <button aria-label="15 saniye ekle" onClick={() => adjustRest?.(15)} className="py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 text-[10px] font-black tracking-wide active:scale-[0.97] transition-all">+15s</button>
              <button aria-label="30 saniye ekle" onClick={() => adjustRest?.(30)} className="py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 text-[10px] font-black tracking-wide active:scale-[0.97] transition-all">+30s</button>
            </div>
            {restCue && (
              <div className={`mt-2 rounded-xl border px-2.5 py-2 ${restCue.complete ? 'border-emerald-900/50 bg-emerald-950/15' : 'border-cyan-900/40 bg-cyan-950/15'}`}>
                <span className={`text-[8px] font-bold uppercase tracking-widest block ${restCue.complete ? 'text-emerald-500' : 'text-cyan-500'}`}>
                  {restCue.complete ? 'Plan Durumu' : 'Sıradaki Set'}
                </span>
                <span className="text-[10px] font-bold text-zinc-200 block truncate mt-0.5">
                  {restCue.exerciseName}{!restCue.complete && ` · ${restCue.setIndex}/${restCue.totalSets}`}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 block truncate">{restCue.details}</span>
              </div>
            )}
            {/* Sürenin gerekçesi: sayı keyfi görünmesin, kullanıcı kabul ya da
                reddetmeyi bilerek yapsın. */}
            {rest.reason && (
              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed mt-2 pt-2 border-t border-zinc-800">
                {rest.reason}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ActiveWorkoutView.displayName = 'ActiveWorkoutView';

export default ActiveWorkoutView;
