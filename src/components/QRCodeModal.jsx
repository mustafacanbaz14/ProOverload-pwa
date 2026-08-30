import React, { useState, memo } from 'react';
import { X, Copy, Download, Upload, Check, Smartphone, Database } from 'lucide-react';
import { createQRDataString } from '../utils/qrCode';

const QRCodeModal = memo(({ isOpen, onClose, fullData, onImportData }) => {
  const [copied, setCopied] = useState(false);
  const [inputString, setInputString] = useState('');
  const [importStatus, setImportStatus] = useState(null);

  if (!isOpen) return null;

  const dataStr = fullData ? createQRDataString(fullData) : '';

  const handleCopy = () => {
    if (!dataStr) return;
    navigator.clipboard?.writeText(dataStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportSubmit = () => {
    if (!inputString.trim()) return;
    try {
      const parsed = JSON.parse(inputString.trim());
      if (parsed && typeof parsed === 'object') {
        const accepted = onImportData(parsed);
        if (accepted === false) {
          setImportStatus('error');
          return;
        }
        setImportStatus(null);
        onClose();
      } else {
        setImportStatus('error');
      }
    } catch {
      setImportStatus('error');
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="qr-modal-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <Smartphone size={16} className="text-cyan-400" />
            <h3 id="qr-modal-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest">Hızlı Cihaz Aktarımı</h3>
          </div>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto hide-scrollbar text-xs">
          <div className="bg-cyan-950/25 border border-cyan-900/50 p-3.5 rounded-2xl backdrop-blur-sm">
            <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Cihazlar Arası Aktarım</h4>
            <p className="text-[10px] text-zinc-300 leading-relaxed font-mono">
              Verilerinizi dosya indirmeden metin kodu şeklinde kopyalayıp yeni cihazınızda aşağıdaki alana yapıştırarak saniyeler içinde taşıyabilirsiniz.
            </p>
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">1. Bu Cihazın Aktarım Kodu</label>
            <div className="bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-2xl font-mono text-[9px] text-zinc-400 break-all max-h-24 overflow-y-auto">
              {dataStr ? dataStr.substring(0, 160) + '...' : 'Veri hazırlanıyor...'}
            </div>
            <button
              onClick={handleCopy}
              className="w-full bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 active:scale-[0.98] font-bold py-3 px-3 rounded-2xl flex items-center justify-center space-x-2 uppercase tracking-wider text-[11px] transition-all shadow-sm shadow-cyan-950/30"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Kopyalandı!' : 'Aktarım Kodunu Kopyala'}</span>
            </button>
          </div>

          <div className="border-t border-zinc-800/80 pt-3.5 space-y-2.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">2. Yeni Cihaza Veri Yapıştır & Yükle</label>
            <textarea
              rows="3"
              value={inputString}
              onChange={(e) => setInputString(e.target.value)}
              placeholder="Diğer cihazdan kopyaladığınız aktarım kodunu buraya yapıştırın..."
              className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3 font-mono text-[10px] text-zinc-200 outline-none focus:border-cyan-500 transition-colors"
            />
            {importStatus === 'error' && (
              <p className="text-[10px] text-red-400 font-mono">Geçersiz kod biçimi. Lütfen tam kopyaladığınızdan emin olun.</p>
            )}
            <button
              onClick={handleImportSubmit}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 active:scale-[0.98] text-white font-black py-3 px-3 rounded-2xl flex items-center justify-center space-x-2 uppercase tracking-wider text-[11px] shadow-lg shadow-emerald-950/50 transition-all"
            >
              <Upload size={14} />
              <span>Veriyi Aktar & Yükle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

QRCodeModal.displayName = 'QRCodeModal';

export default QRCodeModal;
