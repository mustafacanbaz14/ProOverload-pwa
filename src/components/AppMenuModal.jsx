import React, { memo } from 'react';
import {
  Beef, CalendarCheck2, ChevronRight, Dumbbell, History, Home, LineChart,
  Menu, Plus, Search, Settings, Wrench, X,
} from 'lucide-react';

const DESTINATIONS = [
  { key: 'home', label: 'Bugün', hint: 'Günün planı ve koç özeti', icon: Home },
  { key: 'training', label: 'Antrenman', hint: 'Seans başlat, program ve şablonları yönet', icon: Dumbbell },
  { key: 'nutrition', label: 'Beslenme', hint: 'Besin, su ve enerji dengesi', icon: Beef },
  { key: 'progress', label: 'Gelişim', hint: 'Vücut, hedefler ve analizler', icon: LineChart },
  { key: 'history', label: 'Geçmiş', hint: 'Bütün kayıtları gün ve tarih ile bul', icon: History },
];

/**
 * Uygulamanın küresel menüsü.
 *
 * Önceden üst çubuktaki üç çıplak simge arama, ayarlar ve hızlı kaydı
 * birbirinden koparıyordu. Bu menü gezinme ve seyrek kullanılan küresel
 * eylemleri tek, yazılı bir çatıya alır. Alt gezinme ve bağlamsal kısayollar
 * korunur; bu nedenle mevcut hiçbir özellik veya erişim yolu kaybolmaz.
 */
const AppMenuModal = memo(({
  isOpen,
  onClose,
  currentView = 'home',
  onNavigate,
  onDailyWorkspace,
  onQuickCapture,
  onSearch,
  onTools,
  onSettings,
}) => {
  if (!isOpen) return null;

  const run = (action) => {
    onClose?.();
    action?.();
  };

  return (
    <div
      className="fixed inset-0 z-[119] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-menu-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[420px] max-h-[90dvh] overflow-y-auto hide-scrollbar rounded-t-[32px] sm:rounded-3xl border border-zinc-800/90 bg-zinc-950 shadow-2xl shadow-black/90 pb-safe"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-2xl border border-amber-700/30 bg-amber-950/25 text-amber-300 flex items-center justify-center shrink-0">
              <Menu size={18} />
            </span>
            <div className="min-w-0">
              <span className="text-[9px] text-amber-300 uppercase tracking-[0.18em] font-bold">Uygulama Menüsü</span>
              <h2 id="app-menu-title" className="text-sm font-black text-zinc-100 mt-0.5">Nereye gitmek istiyorsun?</h2>
            </div>
          </div>
          <button onClick={onClose} aria-label="Menüyü kapat" className="luxury-icon-button shrink-0">
            <X size={18} />
          </button>
        </header>

        <div className="p-4 space-y-4">
          <section aria-labelledby="app-menu-actions">
            <h3 id="app-menu-actions" className="text-[9px] text-zinc-400 uppercase tracking-widest mb-2 px-1">Hızlı işlemler</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => run(onQuickCapture)}
                className="min-h-[76px] rounded-2xl border border-amber-700/35 bg-amber-950/20 p-3.5 text-left active:scale-[0.98] transition-transform"
              >
                <Plus size={17} className="text-amber-300 mb-2" />
                <strong className="text-[11px] text-zinc-100 block">Yeni kayıt ekle</strong>
                <span className="text-[9px] text-zinc-400 block mt-0.5">Antrenman, besin, ölçüm ve daha fazlası</span>
              </button>
              <button
                onClick={() => run(onSearch)}
                className="min-h-[76px] rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3.5 text-left active:scale-[0.98] transition-transform"
              >
                <Search size={17} className="text-cyan-400 mb-2" />
                <strong className="text-[11px] text-zinc-100 block">Uygulamada ara</strong>
                <span className="text-[9px] text-zinc-400 block mt-0.5">Sayfa, araç, hareket veya kayıt bul</span>
              </button>
            </div>
            <button
              onClick={() => run(onDailyWorkspace)}
              className="w-full min-h-14 mt-2.5 rounded-2xl border border-cyan-900/45 bg-cyan-950/15 px-3.5 py-3 flex items-center gap-3 text-left active:bg-cyan-950/30"
            >
              <CalendarCheck2 size={17} className="text-cyan-400 shrink-0" />
              <span className="flex-1 min-w-0"><strong className="text-[10px] text-zinc-100 block">Günün kayıtlarını yönet</strong><span className="text-[9px] text-zinc-400 block mt-0.5">Antrenman, beslenme, uyku, ölçüm ve enerjiyi tek yerde gör</span></span>
              <ChevronRight size={14} className="text-zinc-600 shrink-0" />
            </button>
          </section>

          <section aria-labelledby="app-menu-pages">
            <h3 id="app-menu-pages" className="text-[9px] text-zinc-400 uppercase tracking-widest mb-2 px-1">Bölümler</h3>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden divide-y divide-zinc-800">
              {DESTINATIONS.map((item) => {
                const Icon = item.icon;
                const active = currentView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => run(() => onNavigate?.(item.key))}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full min-h-14 px-3.5 py-3 flex items-center gap-3 text-left active:bg-zinc-800 ${active ? 'bg-amber-950/20' : ''}`}
                  >
                    <span className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${active ? 'border-amber-700/40 bg-amber-950/30 text-amber-300' : 'border-zinc-800 bg-zinc-950/70 text-zinc-400'}`}>
                      <Icon size={16} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <strong className={`text-[11px] block ${active ? 'text-amber-200' : 'text-zinc-100'}`}>{item.label}</strong>
                      <span className="text-[9px] text-zinc-400 block mt-0.5 leading-snug">{item.hint}</span>
                    </span>
                    {active
                      ? <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wide shrink-0">Buradasın</span>
                      : <ChevronRight size={15} className="text-zinc-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-2.5 pt-1" aria-label="Diğer menüler">
            <button onClick={() => run(onTools)} className="min-h-14 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-3 flex items-center gap-2.5 text-left active:bg-zinc-800">
              <Wrench size={16} className="text-cyan-400 shrink-0" />
              <span><strong className="text-[10px] text-zinc-100 block">Tüm Araçlar</strong><span className="text-[9px] text-zinc-400">29 yardımcı</span></span>
            </button>
            <button onClick={() => run(onSettings)} className="min-h-14 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-3 flex items-center gap-2.5 text-left active:bg-zinc-800">
              <Settings size={16} className="text-zinc-300 shrink-0" />
              <span><strong className="text-[10px] text-zinc-100 block">Ayarlar</strong><span className="text-[9px] text-zinc-400">Görünüm ve yöntem</span></span>
            </button>
          </section>
        </div>
      </section>
    </div>
  );
});

AppMenuModal.displayName = 'AppMenuModal';
export default AppMenuModal;
