import React, { memo } from 'react';
import { X, Trophy, Activity, Download } from 'lucide-react';
import { calcTonnage, calcEffectiveSets } from '../utils/helpers';

const ReportCardModal = memo(({ isOpen, onClose, workouts = [], personalRecords }) => {

  if (!isOpen) return null;

  const totalSessions = workouts.length;
  const totalTonnage = workouts.reduce((sum, w) => sum + calcTonnage(w.exercises), 0);
  const totalSets = workouts.reduce((sum, w) => sum + calcEffectiveSets(w.exercises), 0);
  const prCount = personalRecords ? personalRecords.size : 0;

  const handleDownloadCard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 700;

    // Arka plan
    const grad = ctx.createLinearGradient(0, 0, 0, 700);
    grad.addColorStop(0, '#080806');
    grad.addColorStop(1, '#18181b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 700);

    // Kenarlık
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 560, 660);

    // Başlık
    ctx.fillStyle = '#d8b66b';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('HYPERTROPHY LAB', 50, 75);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '16px monospace';
    ctx.fillText('Gelişim & Başarım Rapor Karnesi', 50, 105);

    // Ayırıcı
    ctx.strokeStyle = '#27272a';
    ctx.beginPath();
    ctx.moveTo(50, 125);
    ctx.lineTo(550, 125);
    ctx.stroke();

    // İstatistikler
    const stats = [
      { label: 'TOPLAM SEANS', val: `${totalSessions}`, color: '#38bdf8', x: 50, y: 150 },
      { label: 'KALDIRILAN TONAJ', val: `${Math.round(totalTonnage / 1000)} Ton`, color: '#34d399', x: 315, y: 150 },
      { label: 'ETKİLİ SET SAYISI', val: `${totalSets}`, color: '#fbbf24', x: 50, y: 275 },
      { label: '1RM REKORLARI', val: `${prCount} Rekor`, color: '#a855f7', x: 315, y: 275 }
    ];

    stats.forEach(s => {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(s.x, s.y, 235, 100);
      ctx.fillStyle = '#71717a';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(s.label, s.x + 20, s.y + 30);
      ctx.fillStyle = s.color;
      ctx.font = 'bold 32px monospace';
      ctx.fillText(s.val, s.x + 20, s.y + 75);
    });

    // Rekorlar
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('ÖNE ÇIKAN GÜÇ REKORLARI', 50, 420);

    let y = 460;
    if (personalRecords) {
      Array.from(personalRecords.entries()).slice(0, 4).forEach(([exName, record]) => {
        ctx.fillStyle = '#27272a';
        ctx.fillRect(50, y, 500, 40);
        ctx.fillStyle = '#e4e4e7';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(exName.substring(0, 20), 65, y + 25);
        ctx.fillStyle = '#d8b66b';
        ctx.fillText(`1RM: ${record.e1rm} kg`, 380, y + 25);
        y += 50;
      });
    }

    ctx.fillStyle = '#52525b';
    ctx.font = '12px monospace';
    ctx.fillText('ProOverload Hypertrophy Lab • Progressive Overload Tracker', 50, 660);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'Antrenman_Rapor_Karnesi.png';
    a.click();
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="report-card-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <Trophy size={16} className="text-yellow-400" />
            <h3 id="report-card-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest">Antrenman Karnesi</h3>
          </div>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto hide-scrollbar">
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-3xl space-y-3.5 backdrop-blur-sm shadow-sm">
            <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2.5">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">HYPERTROPHY LAB</span>
              <Activity size={18} className="text-cyan-400" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80"><span className="text-[9px] text-zinc-500 uppercase font-bold block">SEANS</span><span className="text-cyan-400 text-xl font-black mt-0.5 block">{totalSessions}</span></div>
              <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80"><span className="text-[9px] text-zinc-500 uppercase font-bold block">TONAJ</span><span className="text-emerald-400 text-xl font-black mt-0.5 block">{Math.round(totalTonnage / 1000)}t</span></div>
              <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80"><span className="text-[9px] text-zinc-500 uppercase font-bold block">SET</span><span className="text-amber-400 text-xl font-black mt-0.5 block">{totalSets}</span></div>
              <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80"><span className="text-[9px] text-zinc-500 uppercase font-bold block">1RM</span><span className="text-purple-400 text-xl font-black mt-0.5 block">{prCount}</span></div>
            </div>
          </div>
          <button onClick={handleDownloadCard} className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 active:scale-[0.98] text-white font-black py-3.5 rounded-2xl flex justify-center items-center uppercase text-[11px] tracking-wider shadow-lg shadow-cyan-950/50 transition-all">
            <Download size={16} className="mr-2" /> Görseli İndir (PNG)
          </button>
        </div>
      </div>
    </div>
  );
});

ReportCardModal.displayName = 'ReportCardModal';
export default ReportCardModal;
