import React, { memo, useState } from 'react';
import { AlertTriangle, CalendarDays, FileCheck2, GitMerge, Replace, RefreshCw, X } from 'lucide-react';
import { formatDay } from '../utils/dates';

const BackupImportPreviewModal = memo(({ isOpen, fileName, inspection, migrations = [], onClose, onApply }) => {
  const [confirmReplace, setConfirmReplace] = useState(false);
  if (!isOpen || !inspection) return null;

  const exportedDate = inspection.exportedAt
    ? formatDay(inspection.exportedAt.slice(0, 10), 'medium')
    : 'Tarih bilgisi yok';

  return (
    <div className="fixed inset-0 z-[125] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="backup-preview-title">
      <div className="w-full max-w-sm max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 py-4 backdrop-blur-xl">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-400">Güvenli Yedek Yükleme</span>
            <h2 id="backup-preview-title" className="mt-0.5 text-base font-black text-zinc-100">Dosyayı kontrol et</h2>
          </div>

          <button type="button" onClick={onClose} aria-label="Yedek önizlemesini kapat" className="rounded-xl p-2 text-zinc-500 active:bg-zinc-800 active:text-zinc-100">
            <X size={19} />
          </button>
        </header>

        <div className="space-y-4 p-4">
          <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-3.5">
            <div className="flex items-start gap-3">
              <FileCheck2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-zinc-200">{fileName || 'Aktarım verisi'}</p>
                <p className="mt-1 text-[9px] font-mono text-zinc-500">Sürüm {inspection.version} · {inspection.total} kayıt</p>
                <p className="mt-1 flex items-center gap-1 text-[9px] font-mono text-zinc-500"><CalendarDays size={11} /> {exportedDate}</p>
              </div>
            </div>
          </div>

          {migrations.length > 0 && (
            <div className="rounded-2xl border border-cyan-900/50 bg-cyan-950/20 p-3 flex items-start gap-2.5">
              <RefreshCw size={15} className="mt-0.5 shrink-0 text-cyan-400" />
              <div>
                <p className="text-[10px] font-bold text-cyan-300">Eski yedek güvenle güncellenecek</p>
                <p className="mt-0.5 text-[9px] font-mono leading-relaxed text-zinc-500">
                  {migrations.map(item => item.description).join(' ')} Mevcut dosya değiştirilmez.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {inspection.items.map(item => (
              <div key={item.key} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5">
                <span className="block text-lg font-mono font-black text-zinc-100">{item.count}</span>
                <span className="block text-[9px] font-bold uppercase tracking-wide text-zinc-500">{item.label}{item.unit ? ` ${item.unit}` : ''}</span>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => onApply('merge')} className="w-full rounded-2xl border border-cyan-800/60 bg-cyan-950/40 p-3.5 text-left active:bg-cyan-900/50">
            <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-cyan-300"><GitMerge size={15} /> Birleştir <em className="not-italic text-[8px] text-emerald-400">Önerilen</em></span>
            <span className="mt-1 block text-[9px] font-mono leading-relaxed text-zinc-500">Cihazdaki farklı kayıtları korur. Aynı tarih veya kimlik varsa yedekteki kayıt kullanılır.</span>
          </button>

          <div className="rounded-2xl border border-orange-900/40 bg-orange-950/15 p-3.5">
            <button type="button" onClick={() => setConfirmReplace(value => !value)} className="w-full text-left">
              <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-orange-300"><Replace size={15} /> Yedekle Değiştir</span>
              <span className="mt-1 block text-[9px] font-mono leading-relaxed text-zinc-500">Dosyada bulunan bölümlerde cihazdaki mevcut listeleri yedekle değiştirir.</span>
            </button>
            {confirmReplace && (
              <div className="mt-3 border-t border-orange-900/40 pt-3">
                <p className="mb-2 flex items-start gap-1.5 text-[9px] font-mono leading-relaxed text-orange-300"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> İşlemden sonra kısa süreli Geri Al seçeneği gösterilecek.</p>
                <button type="button" onClick={() => onApply('replace')} className="w-full rounded-xl bg-orange-600 py-2.5 text-[10px] font-black uppercase tracking-wide text-white active:bg-orange-500">Evet, dosyadakiyle değiştir</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

BackupImportPreviewModal.displayName = 'BackupImportPreviewModal';

export default BackupImportPreviewModal;
