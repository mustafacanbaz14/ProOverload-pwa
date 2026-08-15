import React, { memo, useMemo, useState } from 'react';
import {
  Zap, Library, CalendarRange, BookmarkPlus, HeartPulse, Pencil, Play,
  ChevronRight, ChevronDown, Copy, Wand2, Sparkles, Search, Star, Trash2,
  RotateCcw, SlidersHorizontal,
} from 'lucide-react';
import { estimateDuration } from '../utils/templates';
import { estimateLiftingCalories } from '../utils/cardio';
import { formatDay } from '../utils/dates';
import { organizeTemplates } from '../utils/templateLibrary';

const TrainingView = memo(({
  templates = [],
  restSeconds = 120,
  weightKg = 0,
  recentWorkout = null,
  interfaceMode = 'simple',
  onStart,
  onRepeat,
  onLibrary,
  onBuilder,
  onWizard,
  onStarter,
  onWeekPlan,
  onCardio,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
}) => {
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  // Kullanıcı bu ekranda elle açıp kapatana kadar Ayarlar'daki bilgi yoğunluğunu
  // canlı izler. Böylece Basit/Detaylı değişikliği sayfa yenilemeden uygulanır.
  const [plannerOverride, setPlannerOverride] = useState(null);
  const plannerOpen = plannerOverride ?? interfaceMode === 'detailed';

  const favoriteCount = templates.filter(template => template.favorite).length;
  const visibleTemplates = useMemo(
    () => organizeTemplates(templates, { query, favoritesOnly }),
    [templates, query, favoritesOnly],
  );

  return (
    <div className="luxury-screen p-4 space-y-4 pb-nav h-full overflow-y-auto hide-scrollbar bg-black">
      <div>
        <span className="luxury-eyebrow text-[10px] uppercase">Antrenman Merkezi</span>
        <h2 className="luxury-title text-xl font-black mt-0.5">Bugünkü çalışmanı yönet</h2>
        <p className="luxury-subtitle text-[10px] mt-1">Başlat, kaldığın yerden devam et veya programını düzenle.</p>
      </div>

      <button onClick={() => onStart?.()} className="luxury-primary-card w-full bg-cyan-600 active:bg-cyan-700 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-cyan-950/30">
        <span className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"><Zap size={19} /></span>
          <span className="text-left"><strong className="text-sm block">Serbest Antrenman Başlat</strong><span className="text-[10px] text-cyan-100">Hazır oluşluk kontrolüyle</span></span>
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
            <span className="text-[9px] font-mono text-zinc-500">
              {formatDay(recentWorkout.date, 'short', { year: true })} · {(recentWorkout.exercises || []).length} hareket
            </span>
          </span>
          <Play size={15} className="text-emerald-400 shrink-0" />
        </button>
      )}

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
              <strong className="text-[11px] text-zinc-200 block">Programlama ve Araçlar</strong>
              <span className="text-[9px] font-mono text-zinc-500">Sihirbaz · haftalık plan · hareketler · kardiyo</span>
            </span>
          </span>
          <ChevronDown size={15} className={`text-zinc-500 shrink-0 transition-transform ${plannerOpen ? 'rotate-180' : ''}`} />
        </button>

        {plannerOpen && (
          <div className="border-t border-zinc-800 p-3 space-y-3 bg-zinc-950/35">
            <button onClick={onWizard} className="w-full rounded-2xl border border-violet-700/60 bg-gradient-to-r from-violet-950/55 to-fuchsia-950/15 p-3.5 text-left active:bg-violet-900/40 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-700/50 flex items-center justify-center shrink-0">
                <Wand2 size={18} className="text-violet-300" />
              </span>
              <span className="flex-1 min-w-0">
                <strong className="text-[12px] text-zinc-100 block">Akıllı Program Sihirbazı</strong>
                <span className="text-[9px] font-mono text-zinc-400 block mt-0.5">Düzeni seç, taslağı gör, hareketleri değiştir</span>
              </span>
              <ChevronRight size={16} className="text-violet-400 shrink-0" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={onStarter} className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 text-left active:bg-amber-900/30">
                <Sparkles size={15} className="mb-1.5 text-amber-400" />
                <strong className="block text-[10px] text-zinc-100">Hazırdan Başla</strong>
                <span className="text-[8px] font-mono text-zinc-500">Tek dokunuşla kur</span>
              </button>
              <button onClick={onBuilder} className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-3 text-left active:bg-cyan-900/30">
                <BookmarkPlus size={15} className="mb-1.5 text-cyan-400" />
                <strong className="block text-[10px] text-zinc-100">Boş Program</strong>
                <span className="text-[8px] font-mono text-zinc-500">Toplu hareket seç</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Hareketler', hint: 'Kütüphane & ince ayar', icon: Library, action: onLibrary },
                { label: 'Haftalık Plan', hint: 'Günleri ve saatleri düzenle', icon: CalendarRange, action: onWeekPlan },
                { label: 'Kardiyo / Aktivite', hint: 'Kondisyon, spor & hareket', icon: HeartPulse, action: onCardio },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.label} onClick={item.action} className={`bg-zinc-900 border border-zinc-800 active:bg-zinc-800 rounded-xl p-3 text-left ${item.label === 'Kardiyo / Aktivite' ? 'col-span-2' : ''}`}>
                    <Icon size={15} className="text-cyan-400 mb-1.5" />
                    <strong className="text-[10px] text-zinc-200 block">{item.label}</strong>
                    <span className="text-[8px] font-mono text-zinc-600">{item.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="luxury-feature-card bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-center gap-2">
          <div>
            <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">Şablon Kütüphanesi</h3>
            <span className="text-[8px] font-mono text-zinc-600">{templates.length} şablon · {favoriteCount} favori</span>
          </div>
          <button onClick={onBuilder} className="text-[9px] font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-900/50 rounded-lg px-2.5 py-1.5">
            + Yeni
          </button>
        </div>

        {templates.length > 0 && (
          <div className="p-3 border-b border-zinc-800 space-y-2 bg-zinc-950/25">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Şablon veya hareket ara…"
                aria-label="Şablon ara"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2.5 text-[10px] text-zinc-200 outline-none focus:border-cyan-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-950 border border-zinc-800 p-1">
              <button onClick={() => setFavoritesOnly(false)} className={`rounded-lg py-1.5 text-[9px] font-bold ${!favoritesOnly ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}>Tümü ({templates.length})</button>
              <button onClick={() => setFavoritesOnly(true)} className={`rounded-lg py-1.5 text-[9px] font-bold ${favoritesOnly ? 'bg-cyan-600 text-white' : 'text-zinc-500'}`}>Favoriler ({favoriteCount})</button>
            </div>
          </div>
        )}

        {templates.length === 0 ? (
          <button onClick={onBuilder} className="w-full p-7 text-center text-[10px] font-mono text-zinc-500">
            Henüz şablon yok · ilk şablonu oluştur
          </button>
        ) : visibleTemplates.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-[10px] font-mono text-zinc-500">Bu filtreye uyan şablon yok.</p>
            <button onClick={() => { setQuery(''); setFavoritesOnly(false); }} className="text-[9px] font-bold text-cyan-400">Filtreyi Temizle</button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {visibleTemplates.map(template => {
              const minutes = estimateDuration(template.exercises || [], restSeconds);
              const kcal = estimateLiftingCalories(minutes, weightKg);
              return (
                <article key={template.id} className="p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleFavorite?.(template)}
                      aria-label={`${template.name} ${template.favorite ? 'favorilerden çıkar' : 'favorilere ekle'}`}
                      title={template.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${template.favorite ? 'border-amber-700/60 bg-amber-950/30 text-amber-400' : 'border-zinc-800 text-zinc-600'}`}
                    >
                      <Star size={14} fill={template.favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => onPreview?.(template)} className="flex-1 min-w-0 text-left">
                      <strong className="text-[11px] text-zinc-200 block truncate">{template.name}</strong>
                      <span className="text-[9px] font-mono text-zinc-500 block truncate">
                        {(template.exercises || []).length} hareket · ~{minutes} dk{weightKg > 0 ? ` · ~${kcal} kcal` : ''}
                      </span>
                      {template.useCount > 0 && (
                        <span className="text-[8px] font-mono text-zinc-600 block mt-0.5">
                          {template.useCount} kez tamamlandı{template.lastUsedAt ? ` · son ${formatDay(template.lastUsedAt, 'short')}` : ''}
                        </span>
                      )}
                    </button>
                    <button onClick={() => onStart?.(template)} aria-label={`${template.name} başlat`} className="w-9 h-9 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-900 flex items-center justify-center shrink-0"><Play size={14} /></button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pl-10">
                    <button onClick={() => onEdit?.(template)} className="rounded-lg border border-zinc-800 py-1.5 text-[8px] font-bold text-zinc-500 flex items-center justify-center gap-1 active:text-cyan-400"><Pencil size={10} /> Düzenle</button>
                    <button onClick={() => onDuplicate?.(template)} className="rounded-lg border border-zinc-800 py-1.5 text-[8px] font-bold text-zinc-500 flex items-center justify-center gap-1 active:text-cyan-400"><Copy size={10} /> Kopyala</button>
                    <button onClick={() => onDelete?.(template)} className="rounded-lg border border-red-950/70 py-1.5 text-[8px] font-bold text-red-500/80 flex items-center justify-center gap-1 active:bg-red-950/30"><Trash2 size={10} /> Sil</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
});

TrainingView.displayName = 'TrainingView';
export default TrainingView;
