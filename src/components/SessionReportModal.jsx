import React, { memo } from 'react';
import { X, Trophy, TrendingUp, TrendingDown, Minus, Sparkles, Layers, Clock, Dumbbell, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDay } from '../utils/dates';

/**
 * Seans sonu raporu.
 *
 * Antrenman bitince kayıt sessizce listeye giriyordu; "bugün geçen seferden iyi
 * miydim" sorusu ancak analiz sekmesine gidilirse cevaplanıyordu. Geri bildirim
 * döngüsünün kapanacağı yer seansın hemen sonrası.
 */
const SessionReportModal = memo(({ report, onClose, comparison = null }) => {
  if (!report) return null;

  const rozet = (row) => {
    if (row.isNew) return { icon: <Sparkles size={11} />, text: 'ilk kez', tone: 'text-cyan-400' };
    if (row.delta === null) return { icon: <Minus size={11} />, text: '—', tone: 'text-zinc-600' };
    if (row.delta > 0) return { icon: <TrendingUp size={11} />, text: `+${row.delta}`, tone: 'text-emerald-400' };
    if (row.delta < 0) return { icon: <TrendingDown size={11} />, text: `${row.delta}`, tone: 'text-amber-400' };
    return { icon: <Minus size={11} />, text: 'aynı', tone: 'text-zinc-400' };
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="session-report-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[115] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">

        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex justify-between items-center gap-2 shrink-0">
          <div className="min-w-0">
            <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-widest block">Seans Raporu</span>
            <h3 id="session-report-title" className="text-[12px] font-black text-zinc-100 truncate">
              {report.name || 'Antrenman'} · {formatDay(report.date, 'medium')}
            </h3>
          </div>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">

          <div className={`rounded-2xl border p-4 backdrop-blur-sm shadow-sm ${report.records.length > 0
            ? 'border-yellow-800/60 bg-yellow-950/25'
            : 'border-zinc-800/80 bg-zinc-900/60'}`}>
            <div className="flex items-start gap-3">
              {report.records.length > 0
                ? <Trophy size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                : <Dumbbell size={18} className="text-zinc-400 shrink-0 mt-0.5" />}
              <p className={`text-[12px] font-black leading-snug ${report.records.length > 0 ? 'text-yellow-300' : 'text-zinc-100'}`}>
                {report.headline}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Layers size={13} className="text-cyan-400" />, value: report.effectiveSets, label: 'etkili set' },
              { icon: <Dumbbell size={13} className="text-emerald-400" />, value: `${report.tonnage}`, label: 'kg tonaj' },
              { icon: <Clock size={13} className="text-amber-400" />, value: `${report.duration}`, label: 'dakika' },
            ].map(item => (
              <div key={item.label} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl py-3 text-center backdrop-blur-sm">
                <div className="flex justify-center mb-1">{item.icon}</div>
                <span className="text-base font-mono font-black text-zinc-100 block">{item.value}</span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Aynı şablonun bir önceki seansıyla karşılaştırma */}
          {comparison?.hasData && (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-3 backdrop-blur-sm">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Geçen Sefere Göre
                </span>
                <span className="text-[9px] font-mono text-zinc-500">
                  {formatDay(comparison.previousDate, 'short')}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <strong className={`text-xl font-mono font-black ${comparison.tonnage.delta > 0 ? 'text-emerald-300' : comparison.tonnage.delta < 0 ? 'text-red-300' : 'text-zinc-300'}`}>
                  {comparison.tonnage.delta > 0 ? '+' : ''}{comparison.tonnage.delta} kg
                </strong>
                <span className="text-[9px] font-mono text-zinc-400">
                  tonaj · {comparison.improved} hareket arttı, {comparison.declined} azaldı
                </span>
              </div>

              <div className="space-y-1.5">
                {comparison.rows.slice(0, 6).map(r => (
                  <div key={r.name} className="flex items-center gap-2 bg-zinc-950/70 border border-zinc-800/70 rounded-xl px-3 py-2">
                    {r.status === 'new'
                      ? <Sparkles size={11} className="text-cyan-400 shrink-0" />
                      : r.status === 'dropped'
                        ? <Minus size={11} className="text-zinc-600 shrink-0" />
                        : r.tonnageDelta > 0
                          ? <TrendingUp size={11} className="text-emerald-400 shrink-0" />
                          : r.tonnageDelta < 0
                            ? <TrendingDown size={11} className="text-red-400 shrink-0" />
                            : <Minus size={11} className="text-zinc-500 shrink-0" />}
                    <span className="text-[10px] font-bold text-zinc-200 truncate flex-1">{r.name}</span>
                    <span className="text-[9px] font-mono text-zinc-400 shrink-0">
                      {r.status === 'new' ? 'yeni'
                        : r.status === 'dropped' ? 'yapılmadı'
                          : `${r.tonnageDelta > 0 ? '+' : ''}${r.tonnageDelta} kg${r.weightDelta !== 0 ? ` · ${r.weightDelta > 0 ? '+' : ''}${r.weightDelta} kg yük` : ''}`}
                    </span>
                  </div>
                ))}
              </div>
              {comparison.rows.length > 6 && (
                <p className="text-[9px] font-mono text-zinc-500">
                  +{comparison.rows.length - 6} hareket daha
                </p>
              )}
            </div>
          )}

          {report.adaptation && (
            <div className={`rounded-2xl border p-4 backdrop-blur-sm ${report.adaptation.mode === 'recovery' ? 'border-red-900/50 bg-red-950/20' : 'border-amber-900/50 bg-amber-950/20'}`}>
              <div className="flex items-start gap-2.5">
                <Sparkles size={15} className={report.adaptation.mode === 'recovery' ? 'text-red-400 shrink-0 mt-0.5' : 'text-amber-400 shrink-0 mt-0.5'} />
                <div>
                  <span className="text-[10px] font-black text-zinc-200 block">{report.adaptation.label} uygulandı</span>
                  <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1">
                    Plan {report.adaptation.originalWorkingSets} setten {report.adaptation.adaptedWorkingSets} sete uyarlandı
                    {report.adaptation.loadPercent > 0 ? `; kayıtlı yük hedefleri %${report.adaptation.loadPercent} azaltıldı` : ''}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {report.planAdherence && (
            <div className={`rounded-2xl border p-4 space-y-2.5 backdrop-blur-sm ${report.planAdherence.percent >= 90 ? 'border-emerald-900/60 bg-emerald-950/20' : 'border-amber-900/60 bg-amber-950/20'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${report.planAdherence.percent >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {report.planAdherence.percent >= 90 ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} Plan Uyumu
                  </span>
                  <strong className="text-[11px] font-bold text-zinc-200 block mt-1 truncate">{report.planAdherence.templateName}</strong>
                  <span className="text-[9px] font-mono text-zinc-400">{report.planAdherence.label}</span>
                </div>
                <strong className={`text-2xl font-mono font-black shrink-0 ${report.planAdherence.percent >= 90 ? 'text-emerald-300' : 'text-amber-300'}`}>%{report.planAdherence.percent}</strong>
              </div>
              <div className="h-2 rounded-full bg-zinc-950 border border-zinc-800/80 overflow-hidden">
                <div className={`h-full rounded-full ${report.planAdherence.percent >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${report.planAdherence.percent}%` }} />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                <span>{report.planAdherence.matchedSets}/{report.planAdherence.plannedSets} planlı set</span>
                <span>{report.planAdherence.completedPlannedExercises}/{report.planAdherence.plannedExercises} hareket</span>
              </div>
              {report.planAdherence.missedExercises.length > 0 && (
                <p className="text-[9px] font-mono text-amber-300/90 leading-relaxed">Atlanan: {report.planAdherence.missedExercises.join(' · ')}</p>
              )}
              {(report.planAdherence.extraExercises.length > 0 || report.planAdherence.extraSets > 0) && (
                <p className="text-[9px] font-mono text-cyan-300/85 leading-relaxed">Ek çalışma: {report.planAdherence.extraExercises.join(' · ') || `${report.planAdherence.extraSets} plan üstü set`}</p>
              )}
            </div>
          )}

          {/* Hareket hareket kıyas */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60 flex justify-between items-baseline">
              <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Geçen Seansa Göre</h4>
              <span className="text-[9px] font-mono text-zinc-500">tahmini 1RM</span>
            </div>
            <div className="divide-y divide-zinc-800/70">
              {report.exercises.map(row => {
                const r = rozet(row);
                return (
                  <div key={row.name} className="px-4 py-2.5">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0 flex items-center gap-1.5">
                        {row.isPR && <Trophy size={11} className="text-yellow-400 shrink-0" />}
                        {row.name}
                      </span>
                      <span className={`text-[10px] font-mono font-bold shrink-0 flex items-center gap-1 ${r.tone}`}>
                        {r.icon}{r.text}
                        {row.deltaPct !== null && <span className="text-zinc-500">({row.deltaPct > 0 ? '+' : ''}{row.deltaPct}%)</span>}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline gap-2 mt-0.5">
                      <span className="text-[9px] font-mono text-zinc-500 truncate">
                        {row.sets} set · {row.muscle}
                        {row.metric === 'tonnage' && ' · hacim yüküyle kıyaslandı'}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 shrink-0 font-bold">
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
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
              <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Bu Seansın Hacim Katkısı</h4>
              {report.topMuscles.map(([muscle, vol]) => (
                <div key={muscle} className="flex justify-between text-[10px] font-mono">
                  <span className="text-zinc-400">{muscle}</span>
                  <span className="text-cyan-400 font-bold">+{vol} set</span>
                </div>
              ))}
              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed pt-1">
                Katkılar haftalık toplama eklendi; hangi bölgenin eşiğe yaklaştığını
                ana ekrandaki ısı haritasından görebilirsin.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md shrink-0 pb-safe">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 active:scale-[0.98] text-white font-black py-3.5 rounded-2xl uppercase text-[11px] tracking-wider shadow-lg shadow-emerald-950/50 transition-all"
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
