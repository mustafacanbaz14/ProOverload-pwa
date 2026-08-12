import React, { memo } from 'react';
import { Zap, Library, CalendarRange, BookmarkPlus, HeartPulse, Pencil, Play, ChevronRight, Copy, Wand2, Sparkles } from 'lucide-react';
import { estimateDuration } from '../utils/templates';
import { estimateLiftingCalories } from '../utils/cardio';

const TrainingView = memo(({
  templates = [],
  restSeconds = 120,
  weightKg = 0,
  onStart,
  onLibrary,
  onBuilder,
  onWizard,
  onStarter,
  onWeekPlan,
  onCardio,
  onPreview,
  onEdit,
  onDuplicate,
}) => (
  <div className="luxury-screen p-4 space-y-4 pb-nav h-full overflow-y-auto hide-scrollbar bg-black">
    <div>
      <span className="luxury-eyebrow text-[10px] uppercase">Antrenman Merkezi</span>
      <h2 className="luxury-title text-xl font-black mt-0.5">Bugünkü çalışmanı yönet</h2>
      <p className="luxury-subtitle text-[10px] mt-1">Başlat, programla veya hareketlerini düzenle.</p>
    </div>

    <button onClick={() => onStart?.()} className="luxury-primary-card w-full bg-cyan-600 active:bg-cyan-700 text-white rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-cyan-950/30">
      <span className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"><Zap size={19} /></span>
        <span className="text-left"><strong className="text-sm block">Serbest Antrenman Başlat</strong><span className="text-[10px] text-cyan-100">Hazır oluşluk kontrolüyle</span></span>
      </span>
      <ChevronRight size={18} />
    </button>

    <section className="luxury-feature-card rounded-2xl border border-violet-900/40 bg-violet-950/15 p-3">
      <div className="mb-2.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-violet-400">Program Hazırla</span>
        <p className="mt-0.5 text-[9px] font-mono text-zinc-500">Bir düzen seç, taslağı gör ve istediğin hareketleri değiştir.</p>
      </div>
      <div className="space-y-2">
        <button onClick={onWizard} className="w-full rounded-2xl border border-violet-700/70 bg-gradient-to-r from-violet-950/60 to-fuchsia-950/20 p-3.5 text-left active:bg-violet-900/40 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-700/50 flex items-center justify-center shrink-0">
            <Wand2 size={18} className="text-violet-300" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-1.5">
              <strong className="text-[12px] text-zinc-100">Akıllı Program Sihirbazı</strong>
              <span className="text-[7px] font-bold text-violet-200 bg-violet-800/50 rounded-md px-1.5 py-0.5">YENİ</span>
            </span>
            <span className="text-[9px] font-mono text-zinc-400 block mt-0.5">İtiş+bacak, gövde/uzuvlar, Arnold ve daha fazlası</span>
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
      </div>
    </section>

    <div className="grid grid-cols-2 gap-2">
      {[
        { label: 'Hareketler', hint: 'Kütüphane & ince ayar', icon: Library, action: onLibrary },
        { label: 'Haftalık Plan', hint: 'Günleri ve saatleri düzenle', icon: CalendarRange, action: onWeekPlan },
        { label: 'Kardiyo / Aktivite', hint: 'Kondisyon, spor & günlük hareket', icon: HeartPulse, action: onCardio },
      ].map(item => {
        const Icon = item.icon;
        return (
          <button key={item.label} onClick={item.action} className={`bg-zinc-900 border border-zinc-800 active:bg-zinc-800 rounded-2xl p-3 text-left ${item.label === 'Kardiyo / Aktivite' ? 'col-span-2' : ''}`}>
            <Icon size={16} className="text-cyan-400 mb-2" />
            <strong className="text-[11px] text-zinc-200 block">{item.label}</strong>
            <span className="text-[9px] font-mono text-zinc-600">{item.hint}</span>
          </button>
        );
      })}
    </div>

    <section className="luxury-feature-card bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-center">
        <h3 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">Antrenman Şablonları</h3>
        <button onClick={onBuilder} className="text-[9px] font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-900/50 rounded-lg px-2 py-1.5">
          + Yeni <span className="text-zinc-600 ml-1">{templates.length}</span>
        </button>
      </div>
      {templates.length === 0 ? (
        <button onClick={onBuilder} className="w-full p-6 text-center text-[10px] font-mono text-zinc-500">
          Henüz şablon yok · ilk şablonu oluştur
        </button>
      ) : (
        <div className="divide-y divide-zinc-800">
          {templates.map(template => {
            const minutes = estimateDuration(template.exercises || [], restSeconds);
            const kcal = estimateLiftingCalories(minutes, weightKg);
            return (
              <div key={template.id} className="p-3 flex items-center gap-2">
                <button onClick={() => onPreview?.(template)} className="flex-1 min-w-0 text-left">
                  <strong className="text-[11px] text-zinc-200 block truncate">{template.name}</strong>
                  <span className="text-[9px] font-mono text-zinc-500">
                    {(template.exercises || []).length} hareket · ~{minutes} dk{weightKg > 0 ? ` · ~${kcal} kcal` : ''}
                  </span>
                </button>
                {/* Kopyala: program kurarken en sık yapılan iş, var olan bir
                    günü alıp bir iki hareketini değiştirmek. */}
                <button onClick={() => onDuplicate?.(template)} aria-label={`${template.name} kopyala`} title="Kopyala" className="p-2 text-zinc-500 active:text-cyan-400"><Copy size={14} /></button>
                <button onClick={() => onEdit?.(template)} aria-label={`${template.name} düzenle`} className="p-2 text-zinc-500 active:text-cyan-400"><Pencil size={14} /></button>
                <button onClick={() => onStart?.(template)} aria-label={`${template.name} başlat`} className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-900"><Play size={14} /></button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  </div>
));

TrainingView.displayName = 'TrainingView';
export default TrainingView;
