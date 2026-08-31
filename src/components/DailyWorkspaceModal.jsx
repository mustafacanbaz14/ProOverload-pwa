import React, { memo } from 'react';
import {
  Beef, CheckCircle2, ChevronRight, Droplets, Dumbbell, Flame,
  HeartPulse, History, Moon, Plus, Scale, Sparkles, X,
} from 'lucide-react';
import { formatDay, weekdayName } from '../utils/dates';

const RECORDS = [
  { key: 'workout', label: 'Antrenman', hint: 'Ağırlık seansı', icon: Dumbbell, tone: 'text-cyan-400' },
  { key: 'cardio', label: 'Kardiyo / Aktivite', hint: 'Koşu, yürüyüş ve spor', icon: HeartPulse, tone: 'text-rose-400' },
  { key: 'nutrition', label: 'Beslenme', hint: 'Öğün veya günlük toplam', icon: Beef, tone: 'text-orange-400' },
  { key: 'metrics', label: 'Vücut Ölçümü', hint: 'Kilo, mezura ve kaliper', icon: Scale, tone: 'text-emerald-400' },
  { key: 'sleep', label: 'Uyku', hint: 'Hızlı puan veya ayrıntı', icon: Moon, tone: 'text-indigo-400' },
  { key: 'mind', label: 'Zihin & Esneme', hint: 'Meditasyon ve mobilite', icon: Sparkles, tone: 'text-purple-400' },
];

const number = value => Math.round(Number(value) || 0);

/** Tek bir tarihin bütün kayıt türlerini bir görev alanında toplar. */
const DailyWorkspaceModal = memo(({
  isOpen,
  onClose,
  date,
  maxDate,
  onDateChange,
  summary = {},
  onAction,
  onEnergy,
  onArchive,
  onAddWater,
}) => {
  if (!isOpen) return null;

  const run = (action) => {
    onClose?.();
    action?.();
  };
  const intake = number(summary.intake);
  const expenditure = number(summary.expenditure);
  const hasIntake = Boolean(summary.nutrition?.hasData);
  const balance = hasIntake ? intake - expenditure : null;
  const waterMl = number(summary.waterMl);
  const waterTarget = Math.max(1, number(summary.waterTarget));

  return (
    <div className="fixed inset-0 z-[119] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-workspace-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[430px] max-h-[92dvh] overflow-y-auto hide-scrollbar rounded-t-[32px] sm:rounded-3xl border border-zinc-800/90 bg-zinc-950 shadow-2xl shadow-black/90 pb-safe"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl">
          <div className="min-w-0">
            <span className="text-[9px] text-cyan-400 uppercase tracking-[0.18em] font-bold">Günlük Kayıt Merkezi</span>
            <h2 id="daily-workspace-title" className="text-sm font-black text-zinc-100 mt-0.5">{formatDay(date, 'medium', { year: true })}</h2>
          </div>
          <button onClick={onClose} aria-label="Günlük merkezi kapat" className="luxury-icon-button shrink-0"><X size={18} /></button>
        </header>

        <div className="p-4 space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/65 p-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 block">Çalışılan tarih</span>
              <strong className="text-[11px] text-cyan-300 block mt-0.5">{weekdayName(date)}</strong>
            </div>
            <input
              type="date"
              value={date}
              max={maxDate}
              onChange={(event) => onDateChange?.(event.target.value || maxDate)}
              aria-label="Günlük merkez tarihi"
              className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-[11px] text-zinc-200 outline-none focus:border-cyan-500"
            />
          </div>

          <section aria-labelledby="daily-energy-title">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 id="daily-energy-title" className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Günün özeti</h3>
              <span className="text-[8px] text-zinc-500">Kayıt varsa gerçek, yoksa tahmini</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Alınan', value: hasIntake ? `${intake} kcal` : '—', tone: hasIntake ? 'text-orange-300' : 'text-zinc-400' },
                { label: 'Harcama', value: `${expenditure} kcal`, tone: expenditure > 0 ? 'text-rose-300' : 'text-zinc-400' },
                { label: 'Enerji Dengesi', value: balance === null ? 'Beslenme verisi yok' : `${balance > 0 ? '+' : ''}${balance} kcal`, tone: balance === null ? 'text-zinc-400' : balance > 250 ? 'text-amber-300' : balance < -700 ? 'text-red-300' : 'text-emerald-300' },
                { label: 'Su', value: `${(waterMl / 1000).toFixed(1)} / ${(waterTarget / 1000).toFixed(1)} L`, tone: waterMl >= waterTarget ? 'text-sky-300' : 'text-zinc-300' },
              ].map(item => (
                <div key={item.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/65 p-3">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">{item.label}</span>
                  <strong className={`text-[12px] block mt-1 ${item.tone}`}>{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => onAddWater?.(250)} className="min-h-11 rounded-xl border border-sky-900/50 bg-sky-950/20 text-[10px] font-bold text-sky-300 flex items-center justify-center gap-1.5 active:bg-sky-950/40"><Droplets size={13} /> +250 ml</button>
              <button onClick={() => onAddWater?.(500)} className="min-h-11 rounded-xl border border-sky-900/50 bg-sky-950/20 text-[10px] font-bold text-sky-300 flex items-center justify-center gap-1.5 active:bg-sky-950/40"><Droplets size={13} /> +500 ml</button>
            </div>
          </section>

          <section aria-labelledby="daily-records-title">
            <div className="mb-2 px-1">
              <h3 id="daily-records-title" className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Kayıtlar</h3>
              <p className="text-[8px] text-zinc-500 mt-0.5">Bu bir zorunluluk listesi değil; yalnız takip etmek istediğin alanları kullan.</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden divide-y divide-zinc-800">
              {RECORDS.map(item => {
                const Icon = item.icon;
                const state = summary[item.key] || {};
                return (
                  <button
                    key={item.key}
                    onClick={() => run(() => onAction?.(item.key, date))}
                    className="w-full min-h-16 px-3.5 py-3 flex items-center gap-3 text-left active:bg-zinc-800"
                  >
                    <span className={`w-9 h-9 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center shrink-0 ${item.tone}`}><Icon size={16} /></span>
                    <span className="flex-1 min-w-0">
                      <strong className="text-[11px] text-zinc-100 block">{item.label}</strong>
                      <span className="text-[9px] text-zinc-400 block mt-0.5 truncate">{state.detail || item.hint}</span>
                    </span>
                    {state.hasData
                      ? <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 shrink-0"><CheckCircle2 size={13} /> Aç</span>
                      : <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-400 shrink-0"><Plus size={13} /> Ekle</span>}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => run(() => onEnergy?.(date))} className="min-h-14 rounded-2xl border border-rose-900/45 bg-rose-950/15 px-3 flex items-center gap-2 text-left active:bg-rose-950/30"><Flame size={15} className="text-rose-400" /><span><strong className="text-[10px] text-zinc-100 block">Kalori detayı</strong><span className="text-[8px] text-zinc-500">Kaynakları gör</span></span></button>
            <button onClick={() => run(() => onArchive?.(date))} className="min-h-14 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-3 flex items-center gap-2 text-left active:bg-zinc-800"><History size={15} className="text-cyan-400" /><span><strong className="text-[10px] text-zinc-100 block">Arşivde aç</strong><span className="text-[8px] text-zinc-500">Günün kayıtları</span></span><ChevronRight size={13} className="text-zinc-600 ml-auto" /></button>
          </div>
        </div>
      </section>
    </div>
  );
});

DailyWorkspaceModal.displayName = 'DailyWorkspaceModal';
export default DailyWorkspaceModal;
