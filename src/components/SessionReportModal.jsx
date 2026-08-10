import React, { memo } from 'react';
import { X, Trophy, TrendingUp, TrendingDown, Minus, Sparkles, Layers, Clock, Dumbbell } from 'lucide-react';
import { formatDay } from '../utils/dates';

/**
 * Seans sonu raporu.
 *
 * Antrenman bitince kayıt sessizce listeye giriyordu; "bugün geçen seferden iyi
 * miydim" sorusu ancak analiz sekmesine gidilirse cevaplanıyordu. Geri bildirim
 * döngüsünün kapanacağı yer seansın hemen sonrası.
 */
const SessionReportModal = memo(({ report, onClose }) => {
  if (!report) return null;

  const rozet = (row) => {
    if (row.isNew) return { icon: <Sparkles size={11} />, text: 'ilk kez', tone: 'text-cyan-400' };
    if (row.delta === null) return { icon: <Minus size={11} />, text: '—', tone: 'text-zinc-600' };
    if (row.delta > 0) return { icon: <TrendingUp size={11} />, text: `+${row.delta}`, tone: 'text-emerald-400' };
    if (row.delta < 0) return { icon: <TrendingDown size={11} />, text: `${row.delta}`, tone: 'text-amber-400' };
    return { icon: <Minus size={11} />, text: 'aynı', tone: 'text-zinc-400' };
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[115] flex items-center justify-center p-3">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh]">

        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center gap-2 shrink-0">
          <div className="min-w-0">
            <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest block">Seans Raporu</span>
            <h3 className="text-[12px] font-bold text-zinc-100 truncate">
              {report.name || 'Antrenman'} · {formatDay(report.date, 'medium')}
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1 shrink-0" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3">

          <div className={`rounded-2xl border p-3.5 ${report.records.length > 0
            ? 'border-yellow-800/60 bg-yellow-950/20'
            : 'border-zinc-800 bg-zinc-950'}`}>
            <div className="flex items-start gap-2.5">
              {report.records.length > 0
                ? <Trophy size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                : <Dumbbell size={16} className="text-zinc-500 shrink-0 mt-0.5" />}
              <p className={`text-[12px] font-bold leading-snug ${report.records.length > 0 ? 'text-yellow-300' : 'text-zinc-200'}`}>
                {report.headline}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Layers size={12} className="text-cyan-400" />, value: report.effectiveSets, label: 'etkili set' },
              { icon: <Dumbbell size={12} className="text-emerald-400" />, value: `${report.tonnage}`, label: 'kg tonaj' },
              { icon: <Clock size={12} className="text-amber-400" />, value: `${report.duration}`, label: 'dakika' },
            ].map(item => (
              <div key={item.label} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 text-center">
                <div className="flex justify-center mb-1">{item.icon}</div>
                <span className="text-sm font-mono font-bold text-zinc-100 block">{item.value}</span>
                <span className="text-[9px] font-mono text-zinc-500">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Hareket hareket kıyas */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
              <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Geçen Seansa Göre</h4>
              <span className="text-[9px] font-mono text-zinc-600">tahmini 1RM</span>
            </div>
            <div className="divide-y divide-zinc-800/70">
              {report.exercises.map(row => {
                const r = rozet(row);
                return (
                  <div key={row.name} className="px-3.5 py-2.5">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0 flex items-center gap-1.5">
                        {row.isPR && <Trophy size={10} className="text-yellow-400 shrink-0" />}
                        {row.name}
                      </span>
                      <span className={`text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 ${r.tone}`}>
                        {r.icon}{r.text}
                        {row.deltaPct !== null && <span className="text-zinc-600">({row.deltaPct > 0 ? '+' : ''}{row.deltaPct}%)</span>}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline gap-2 mt-0.5">
                      <span className="text-[9px] font-mono text-zinc-600 truncate">
                        {row.sets} set · {row.muscle}
                        {/* Yüksek tekrarlı harekette 1RM formülü geçersiz; ölçü
                            hacim yüküne düşüyor ve bu açıkça yazılıyor. */}
                        {row.metric === 'tonnage' && ' · hacim yüküyle kıyaslandı'}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                        {row.previousValue !== null
                          ? `${row.previousValue} → ${row.value}${row.metric === 'e1rm' ? ' kg' : ''}`
                          : `${row.value}${row.metric === 'e1rm' ? ' kg' : ''}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Haftaya eklenen hacim */}
          {report.topMuscles.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-1.5">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bu Seansın Hacim Katkısı</h4>
              {report.topMuscles.map(([muscle, vol]) => (
                <div key={muscle} className="flex justify-between text-[10px] font-mono">
                  <span className="text-zinc-400">{muscle}</span>
                  <span className="text-cyan-400 font-bold">+{vol} set</span>
                </div>
              ))}
              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed pt-1">
                Katkılar haftalık toplama eklendi; hangi bölgenin eşiğe yaklaştığını
                ana ekrandaki ısı haritasından görebilirsin.
              </p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe">
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3.5 rounded-xl uppercase text-[11px] tracking-wider transition-colors"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
});

SessionReportModal.displayName = 'SessionReportModal';

export default SessionReportModal;
