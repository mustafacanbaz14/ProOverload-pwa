import React, { memo } from 'react';
import {
  BarChart3, Beef, Brain, CalendarRange, CheckCircle2, ChevronRight, Dumbbell,
  HeartPulse, Moon, Scale, X,
} from 'lucide-react';

const CAPTURE_ITEMS = [
  { key: 'workout', label: 'Antrenman', hint: 'Serbest veya şablondan başlat', icon: Dumbbell, color: 'text-cyan-400' },
  { key: 'nutrition', label: 'Besin Ekle', hint: 'Öğün, barkod veya toplam gir', icon: Beef, color: 'text-orange-400' },
  { key: 'cardio', label: 'Kardiyo / Aktivite', hint: 'Koşu, yürüyüş, spor ve diğerleri', icon: HeartPulse, color: 'text-rose-400' },
  { key: 'metrics', label: 'Vücut Ölçümü', hint: 'Kilo, mezura veya kaliper', icon: Scale, color: 'text-emerald-400' },
  { key: 'sleep', label: 'Uyku', hint: 'Hızlı puan veya ayrıntılı kayıt', icon: Moon, color: 'text-indigo-400' },
  { key: 'mind', label: 'Zihin & Esneme', hint: 'Meditasyon ve esneme süresi', icon: Brain, color: 'text-purple-400' },
];

const TOOL_ITEMS = [
  { key: 'energy', label: 'Kalori Detayı', icon: BarChart3 },
  { key: 'plan', label: 'Haftalık Plan', icon: CalendarRange },
];

const QuickCaptureModal = memo(({ isOpen, onClose, onSelect, status = {} }) => {
  if (!isOpen) return null;
  const completedCount = CAPTURE_ITEMS.filter(item => Boolean(status[item.key])).length;

  const choose = (key) => {
    onClose?.();
    onSelect?.(key);
  };

  return (
    <div className="fixed inset-0 z-[118] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-capture-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[420px] max-h-[92dvh] overflow-y-auto hide-scrollbar rounded-t-[32px] sm:rounded-3xl border border-zinc-800/90 bg-zinc-950 shadow-2xl shadow-black/90 pb-safe"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl">
          <div>
            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-[0.2em] font-bold">Hızlı Kayıt</span>
            <h2 id="quick-capture-title" className="text-sm font-black text-zinc-100 mt-0.5">Ne eklemek istiyorsun?</h2>
            <span className="text-[9px] text-zinc-500 block mt-0.5">Bugün {completedCount}/6 alanda kayıt var</span>
          </div>
          <button onClick={onClose} aria-label="Hızlı kaydı kapat" className="luxury-icon-button">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed mb-3">
            Bulunduğun sekmeden ayrılmadan doğru giriş ekranına tek dokunuşla git.
          </p>
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/55 overflow-hidden divide-y divide-zinc-800/70">
            {CAPTURE_ITEMS.map((item) => {
              const Icon = item.icon;
              const complete = Boolean(status[item.key]);
              return (
                <button
                  key={item.key}
                  onClick={() => choose(item.key)}
                  className="w-full min-h-[68px] px-3.5 py-3 flex items-center gap-3 text-left active:bg-zinc-800/80 transition-colors"
                >
                  <span className={`w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner shrink-0 ${item.color}`}><Icon size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="text-[11px] font-black text-zinc-100 block tracking-tight">{item.label}</strong>
                    <span className="text-[9px] text-zinc-400 leading-snug block mt-0.5">{complete ? 'Bugünkü kaydı görüntüle veya güncelle' : item.hint}</span>
                  </span>
                  {complete
                    ? <span className="shrink-0 flex items-center gap-1 text-[8px] font-bold text-emerald-300 border border-emerald-900/50 bg-emerald-950/30 rounded-lg px-2 py-1"><CheckCircle2 size={11} /> Kayıtlı</span>
                    : <ChevronRight size={15} className="text-zinc-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3.5 border-t border-zinc-800/80">
            {TOOL_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.key} onClick={() => choose(item.key)} className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/90 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-300 active:scale-[0.97] active:bg-zinc-800 transition-all shadow-sm">
                  <Icon size={14} className="text-cyan-400" /> {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
});

QuickCaptureModal.displayName = 'QuickCaptureModal';
export default QuickCaptureModal;
