import React, { memo } from 'react';
import { X, Zap, Clock, Layers, Link2, Flame, Pencil, Trash2, Star, RefreshCw, History, SlidersHorizontal } from 'lucide-react';
import { getVolumeLandmarks } from '../utils/constants';
import { previewTemplateVolume, estimateDuration } from '../utils/templates';
import { isWorkingSet } from '../utils/helpers';
import { formatDay } from '../utils/dates';
import { EMPHASIS_MODES } from '../utils/undulation';
import { estimateLiftingCalories } from '../utils/cardio';
import MuscleHeatmap from './MuscleHeatmap';
import TemplateAssistantCard from './TemplateAssistantCard';

const TemplatePreviewModal = memo(({
  isOpen,
  onClose,
  template,
  customExercises = [],
  restSeconds = 120,
  onStart,
  experienceLevel = 'intermediate',
  weightKg = 0,
  gender = 'male',
  onEdit,
  onDelete,
  onToggleFavorite,
  // Şablonu düzenleyiciye götürmeden hareketi değiştirmek için. Tek bir
  // hareketi beğenmeyip programı olduğu gibi kullanmak isteyen kişi için
  // düzenleyiciyi açıp kaydetmek gereksiz uzun bir yoldu.
  onReplaceExercise,
  nextTargets = null,
  versions = [],
  onRestoreVersion,
  versionDiff,
}) => {
  if (!isOpen || !template) return null;

  const { byMuscle, totalSets, exercises } = previewTemplateVolume(template.exercises, customExercises);
  const minutes = estimateDuration(template.exercises, restSeconds);
  const kcal = estimateLiftingCalories(minutes, weightKg);

  // En çok yüklenen kaslar üstte
  const ranked = Object.entries(byMuscle).sort((a, b) => b[1] - a[1]);
  const maxVol = ranked.length ? ranked[0][1] : 1;

  // Tek seansta haftalık verimli tavanı geçen bölgeler: hacmi yaymak gerekir.
  const overMav = ranked
    .filter(([muscle, vol]) => vol > getVolumeLandmarks(muscle, experienceLevel).mav)
    .map(([muscle]) => muscle);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh]">

        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
          <div className="min-w-0">
            <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider truncate">{template.name}</h3>
            <span className="text-[10px] font-mono text-zinc-500">Şablon önizlemesi</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1 shrink-0" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">

          {/* Özet */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: <Clock size={13} className="text-emerald-400" />, label: 'Süre', value: `~${minutes} dk` },
              { icon: <Layers size={13} className="text-cyan-400" />, label: 'Set', value: totalSets },
              { icon: <Zap size={13} className="text-amber-400" />, label: 'Hareket', value: exercises },
              // Kalori kiloya bağlı; ölçüm girilmemişse tahmin üretilmez.
              { icon: <Flame size={13} className="text-red-400" />, label: 'Kalori', value: kcal > 0 ? `~${kcal}` : '—' },
            ].map(item => (
              <div key={item.label} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 text-center">
                <div className="flex justify-center mb-1">{item.icon}</div>
                <span className="text-sm font-mono font-bold text-zinc-100 block">{item.value}</span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Bu şablonun bölge dağılımı — ana sayfadakiyle aynı ısı haritası */}
          <MuscleHeatmap
            muscleVolume={byMuscle}
            experienceLevel={experienceLevel}
            title="Bu Şablonun Isı Haritası"
            subtitle="Teorik"
            gender={gender}
          />

          <TemplateAssistantCard exercises={template.exercises || []} customExercises={customExercises} />

          {/* Kas dağılımı */}
          <div>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
              Hangi Bölge Ne Kadar Çalışacak
            </h4>
            {ranked.length === 0 ? (
              <div className="text-center py-6 text-zinc-600 text-[11px] font-mono">
                Bu şablonda set tanımlı değil.
              </div>
            ) : (
              <div className="space-y-2">
                {ranked.map(([muscle, vol]) => {
                  const landmark = getVolumeLandmarks(muscle, experienceLevel);
                  // Tek seansın haftalık MAV hedefine oranı: "bu seans haftalık
                  // hedefin ne kadarını karşılıyor" sorusuna cevap verir.
                  const weeklyShare = landmark ? Math.round((vol / landmark.mav) * 100) : 0;
                  return (
                    <div key={muscle} className="space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[11px] font-bold text-zinc-200 truncate">{muscle}</span>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                          <strong className="text-cyan-400">{vol}</strong> set
                          {landmark && <span className="text-zinc-600"> · haftalığın %{weeklyShare}'i</span>}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-800">
                        <div
                          className="h-1.5 rounded-full bg-cyan-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, (vol / maxVol) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {template.emphasis && template.emphasis !== 'standard' && (
            <div className="rounded-2xl border border-violet-900/40 bg-violet-950/15 p-3 flex items-start gap-2">
              <SlidersHorizontal size={12} className="text-violet-400 shrink-0 mt-0.5" />
              <span className="text-[9px] font-mono text-violet-200/85 leading-relaxed">
                <strong>{EMPHASIS_MODES[template.emphasis]?.label} gün.</strong>{' '}
                {EMPHASIS_MODES[template.emphasis]?.detail}
              </span>
            </div>
          )}

          {/* Sürüm geçmişi. Şablonu düzenlemek 7.3'e kadar geri alınamaz bir
              işlemdi ve eski düzen hiçbir yerde durmuyordu. */}
          {versions.length > 0 && onRestoreVersion && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-3.5 py-2 border-b border-zinc-800 bg-zinc-900/60 flex justify-between items-baseline">
                <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                  <History size={11} className="text-amber-400" /> Sürüm Geçmişi
                </h4>
                <span className="text-[9px] font-mono text-zinc-600">{versions.length} kayıt</span>
              </div>
              <div className="divide-y divide-zinc-800/70">
                {versions.map((v, i) => {
                  const fark = versionDiff?.(v);
                  return (
                    <div key={v.savedAt + i} className="px-3.5 py-2 flex items-center gap-2">
                      <span className="min-w-0 flex-1">
                        <span className="text-[10px] text-zinc-300 block truncate">
                          {formatDay(v.savedAt.slice(0, 10), 'short')} · {v.exercises.length} hareket · {v.totalSets} set
                        </span>
                        <span className="text-[9px] font-mono text-zinc-600 block truncate">
                          {fark?.summary || v.label || 'Kayıtlı sürüm'}
                        </span>
                      </span>
                      <button
                        onClick={() => onRestoreVersion(i)}
                        className="shrink-0 bg-amber-950/30 border border-amber-900/60 text-amber-300 px-2 py-1 rounded-lg text-[9px] font-bold active:bg-amber-900/30"
                      >
                        Geri Dön
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="px-3.5 py-2 text-[9px] font-mono text-zinc-600 leading-relaxed bg-zinc-900/40">
                Geri dönmek de bir değişiklik: şu anki hal geçmişe yazılır, yani
                geri aldıktan sonra yeni haline de dönebilirsin. Setlerin
                ağırlık değerleri korunur.
              </p>
            </div>
          )}

          {/* Bir sonraki seans hedefleri. Hedefler tek tek hareket ekranında
              görünüyordu; seansa başlamadan önce "bugün ne yapacağım"
              sorusunun toplu cevabı yoktu ve kullanıcı salonda hareket hareket
              geçmişe bakıyordu. */}
          {nextTargets && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-3.5 py-2 border-b border-zinc-800 bg-zinc-900/60 flex justify-between items-baseline">
                <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                  Bugünkü Hedefler
                </h4>
                <span className="text-[9px] font-mono text-zinc-600">
                  {nextTargets.loadIncreases > 0 ? `${nextTargets.loadIncreases} harekette ağırlık artıyor` : 'ağırlık artışı yok'}
                </span>
              </div>
              <div className="divide-y divide-zinc-800/70">
                {nextTargets.rows.map(r => (
                  <div key={r.name} className="px-3.5 py-1.5 flex justify-between items-center gap-2">
                    <span className="text-[10px] text-zinc-300 truncate min-w-0 flex-1">{r.name}</span>
                    {r.firstTime ? (
                      <span className="text-[9px] font-mono text-cyan-400 shrink-0">ilk kez</span>
                    ) : r.target ? (
                      <span className="text-[10px] font-mono shrink-0 text-right">
                        <strong className={r.target.strategy === 'load' ? 'text-emerald-300'
                          : r.target.strategy === 'reset' ? 'text-amber-300' : 'text-zinc-200'}>
                          {r.target.weight} kg × {r.target.reps}
                        </strong>
                        {r.lastBest && (
                          <span className="text-zinc-600 block text-[9px]">
                            geçen: {r.lastBest.weight} × {r.lastBest.reps}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-zinc-600 shrink-0">veri yok</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="px-3.5 py-2 text-[9px] font-mono text-zinc-600 leading-relaxed bg-zinc-900/40">
                Hedefler her hareketin kendi ilerleme kuralından çıkıyor; kuralı
                hareketin profil ekranından değiştirebilirsin.
              </p>
            </div>
          )}

          {/* Hareket listesi */}
          <div>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Hareketler</h4>
            <div className="space-y-1.5">
              {(template.exercises || []).map((ex, i) => {
                const sets = (ex.sets || []).filter(isWorkingSet);
                const topSet = sets[0];
                return (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 flex justify-between items-center gap-2">
                    <span className="text-[11px] text-zinc-200 font-bold truncate flex items-center min-w-0">
                      {ex.supersetId && <Link2 size={11} className="mr-1.5 text-purple-400 shrink-0" />}
                      <span className="truncate">{ex.name}</span>
                      {ex.plannedTechnique && (
                        <span className="ml-1.5 text-[7px] font-bold text-purple-300 bg-purple-950/30 border border-purple-900/50 rounded px-1 py-0.5 shrink-0">
                          {ex.plannedTechnique === 'drop' ? 'DROP' : ex.plannedTechnique === 'rest_pause' ? 'RP' : 'F'}
                        </span>
                      )}
                      {ex.repRange?.min > 0 && (
                        <span className="ml-1 text-[7px] font-mono text-cyan-400 shrink-0">
                          {ex.repRange.min}-{ex.repRange.max}
                        </span>
                      )}
                      {ex.backup && (
                        <span className="ml-1 text-[7px] font-mono text-emerald-500 shrink-0" title={`Yedek: ${ex.backup}`}>
                          +yedek
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono text-zinc-500">
                        {sets.length} set{topSet?.weight ? ` · ${topSet.weight}kg` : ''}
                      </span>
                      {onReplaceExercise && (
                        <button
                          onClick={() => onReplaceExercise(template, ex.name)}
                          title="Hareketi değiştir"
                          aria-label={`${ex.name} hareketini değiştir`}
                          className="text-zinc-600 active:text-emerald-400 p-0.5"
                        >
                          <RefreshCw size={12} />
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {(overMav.length > 0 || ranked.length > 0) && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-1.5">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bu Seans Ne Söylüyor</h4>
              <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
                En çok yüklenen bölge <strong className="text-cyan-400">{ranked[0]?.[0] || '—'}</strong>
                {ranked[0] && ` (${ranked[0][1]} set)`}.
              </p>
              {overMav.length > 0 && (
                <p className="text-[10px] font-mono text-orange-300 leading-relaxed">
                  Tek seansta haftalık MAV hedefini aşan bölge: {overMav.join(', ')}.
                  Hacmi haftaya yaymak toparlanma açısından daha verimli.
                </p>
              )}
              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                Haftanın tamamını görmek için ana sayfadaki Haftalık Program'ı kullan.
              </p>
            </div>
          )}

          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
            Süre tahmini set başına 45 sn ve {restSeconds} sn dinlenme varsayar.
            Süperset çiftlerinde araya dinlenme girmediği için o setler yarım sayılır.
          </p>
        </div>

        <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onToggleFavorite?.(template)}
              className={`rounded-lg border py-2 text-[8px] font-bold flex items-center justify-center gap-1 ${template.favorite ? 'border-amber-800/60 bg-amber-950/25 text-amber-400' : 'border-zinc-800 text-zinc-500'}`}
            >
              <Star size={11} fill={template.favorite ? 'currentColor' : 'none'} /> {template.favorite ? 'Favoride' : 'Favori'}
            </button>
            <button type="button" onClick={() => onEdit?.(template)} className="rounded-lg border border-zinc-800 py-2 text-[8px] font-bold text-zinc-500 flex items-center justify-center gap-1">
              <Pencil size={11} /> Düzenle
            </button>
            <button type="button" onClick={() => onDelete?.(template)} className="rounded-lg border border-red-950/70 py-2 text-[8px] font-bold text-red-500/80 flex items-center justify-center gap-1">
              <Trash2 size={11} /> Şablonu Sil
            </button>
          </div>
          <button
            onClick={() => { onStart(template); onClose(); }}
            className="w-full bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3.5 rounded-xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Zap size={15} /> Bu Şablonla Başla
          </button>
        </div>
      </div>
    </div>
  );
});

TemplatePreviewModal.displayName = 'TemplatePreviewModal';

export default TemplatePreviewModal;
