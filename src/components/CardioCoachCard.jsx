import React, { memo } from 'react';
import { HeartPulse, Target, AlertTriangle, Info, CheckCircle2, Activity } from 'lucide-react';
import { CARDIO_GOAL_PRESETS, INTENSITY_ORDER } from '../utils/cardioGoals';
import { HR_ZONES, zoneRange, resolveMaxHr, effectiveZoneMethod, findZoneMethod } from '../utils/cardioZones';

/**
 * Kardiyo koçu.
 *
 * Kardiyo uygulamada bir kalori kaynağıydı; burada antrenman olarak
 * değerlendiriliyor. Kart üç şeyi yan yana gösteriyor: hedefe göre nerede
 * olduğun, hacmin şiddet bölgelerine nasıl dağıldığı ve bugün ne yapman
 * gerektiği.
 */

const SEVERITY = {
  warn: { border: 'border-amber-900/50', bg: 'bg-amber-950/20', text: 'text-amber-300', icon: AlertTriangle },
  info: { border: 'border-zinc-800', bg: 'bg-zinc-950/60', text: 'text-zinc-300', icon: Info },
};

const BAR = { low: 'bg-emerald-500', middle: 'bg-amber-500', high: 'bg-red-500' };

const CardioCoachCard = memo(({ report, suggestion, goal, onChangeGoal, age = null,
  restingHr = '', zoneMethod = 'max', maxHrManual = '', onOpenCardio,
  compact = false, showZones = true }) => {
  if (!report) return null;

  const zoneOpts = { age, restingHr, method: zoneMethod, maxHrManual };
  const maxBilgi = resolveMaxHr(zoneOpts);
  const maxHr = maxBilgi.bpm;
  const gecerliYontem = findZoneMethod(effectiveZoneMethod(zoneOpts));
  const toplam = report.totalMinutes;
  const selectedPreset = CARDIO_GOAL_PRESETS.find(preset => preset.key === (goal?.preset || 'off')) || CARDIO_GOAL_PRESETS[0];

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <HeartPulse size={12} className="mr-1.5 text-red-400" /> Kardiyo Koçu
        </h4>
        <span className="text-[9px] font-mono text-zinc-400 shrink-0">bu hafta</span>
      </div>

      {/* Hedef seçimi */}
      {onChangeGoal && (
        <div className="px-3 py-2.5 border-b border-zinc-800 bg-zinc-950/40">
          {compact ? (
            <label className="block">
              <span className="text-[9px] font-bold text-zinc-400 block mb-1">Kardiyo amacım</span>
              <select
                value={goal?.preset || 'off'}
                onChange={event => onChangeGoal({ preset: event.target.value, lowMinutes: '', highSessions: '' })}
                aria-label="Kardiyo amacı seç"
                className="w-full min-h-11 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-[11px] font-bold text-zinc-200 outline-none focus:border-red-500"
              >
                {CARDIO_GOAL_PRESETS.map(preset => <option key={preset.key} value={preset.key}>{preset.label}</option>)}
              </select>
            </label>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
              {CARDIO_GOAL_PRESETS.map(p => {
                const secili = (goal?.preset || 'off') === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => onChangeGoal({ preset: p.key, lowMinutes: '', highSessions: '' })}
                    title={p.detail}
                    aria-pressed={secili}
                    className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${secili ? 'border-red-600 bg-red-950/25 text-red-300' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}
          {report.active && (
            <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1.5">{report.goal.detail}</p>
          )}
          {compact && !report.active && (
            <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1.5">{selectedPreset.detail}</p>
          )}
        </div>
      )}

      {!report.active ? (
        <div className="p-3.5">
          <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
            {compact
              ? 'Bir amaç seçersen haftalık süre ve yoğunluk takibi açılır. Hedef seçmesen de bütün kayıtlar kalori hesabına girer.'
              : 'Kardiyo hedefi konmadı. Kayıtların kalori hesabına girmeye devam ediyor ama koç kardiyo tarafında bir şey söylemiyor. Yukarıdan bir amaç seçersen haftalık düşük şiddet dakikası ve yüksek şiddet seans sayısı takip edilir.'}
          </p>
        </div>
      ) : (
        <>
          {/* Hedef ilerlemesi */}
          <div className="px-4 py-3 border-b border-zinc-800/70 space-y-2.5">
            {[
              {
                label: 'Düşük şiddet (zone 1-2)',
                value: report.minutes.low, target: report.goal.lowMinutes, unit: 'dk',
              },
              {
                label: 'Yüksek şiddet (zone 4-5)',
                value: report.highSessions, target: report.goal.highSessions, unit: 'seans',
              },
            ].map(satir => {
              const oran = satir.target > 0 ? Math.min(1, satir.value / satir.target) : 0;
              const asim = satir.target > 0 && satir.value > satir.target;
              return (
                <div key={satir.label}>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-[10px] font-bold text-zinc-300 truncate min-w-0">{satir.label}</span>
                    <span className="text-[10px] font-mono shrink-0">
                      <strong className={asim ? 'text-amber-400' : oran >= 1 ? 'text-emerald-400' : 'text-zinc-100'}>
                        {satir.value}
                      </strong>
                      <span className="text-zinc-400">/{satir.target} {satir.unit}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-zinc-950 rounded-full border border-zinc-800 mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${asim ? 'bg-amber-500' : oran >= 1 ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                      style={{ width: `${Math.round(oran * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Şiddet dağılımı */}
          {toplam > 0 && (
            <div className="px-4 py-3 border-b border-zinc-800/70">
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-[10px] font-bold text-zinc-300">Şiddet dağılımı</span>
                <span className="text-[9px] font-mono text-zinc-400">{toplam} dk toplam</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden border border-zinc-800">
                {INTENSITY_ORDER.map(sinif => {
                  const pay = report.shares[sinif.key];
                  if (!pay) return null;
                  return (
                    <div
                      key={sinif.key}
                      title={`${sinif.label} · %${pay}`}
                      className={BAR[sinif.key]}
                      style={{ width: `${pay}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex gap-3 mt-1.5">
                {INTENSITY_ORDER.map(sinif => (
                  <span key={sinif.key} className="text-[9px] font-mono text-zinc-500">
                    <span className={sinif.color}>●</span> {sinif.label} %{report.shares[sinif.key]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bulgular */}
          {report.findings.length > 0 ? (
            <div className="p-3 space-y-2 border-b border-zinc-800/70">
              {report.findings.map(f => {
                const stil = SEVERITY[f.severity] || SEVERITY.info;
                const Icon = stil.icon;
                return (
                  <div key={f.key} className={`rounded-xl border p-2.5 ${stil.border} ${stil.bg}`}>
                    <span className={`text-[10px] font-bold flex items-start gap-1.5 ${stil.text}`}>
                      <Icon size={11} className="shrink-0 mt-0.5" /> {f.title}
                    </span>
                    <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1 pl-[17px]">{f.detail}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3.5 flex items-start gap-2.5 border-b border-zinc-800/70">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[10px] font-mono text-emerald-200 leading-relaxed">
                Hacim hedefte ve şiddet dağılımı dengeli. Kardiyo tarafında
                düzeltilecek bir şey yok.
              </p>
            </div>
          )}

          {/* Bugün */}
          {suggestion && (
            <div className="px-4 py-3 border-b border-zinc-800/70">
              <span className="text-[10px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Target size={11} /> {suggestion.title}
              </span>
              <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1">{suggestion.detail}</p>
              {onOpenCardio && suggestion.kind !== 'done' && (
                <button
                  onClick={() => onOpenCardio()}
                  className="mt-2 w-full bg-zinc-800 active:bg-zinc-700 text-zinc-200 font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Activity size={12} /> Kardiyo ekle
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Nabız bölgeleri */}
      {showZones && <div className="px-4 py-2.5 bg-zinc-950/60">
        {maxHr ? (
          <>
            <p className="text-[9px] font-mono text-zinc-400 mb-1.5">
              Maksimum nabız <strong className="text-zinc-200">{maxHr}</strong> ({maxBilgi.source === 'manual' ? 'elle girildi' : 'Tanaka tahmini'})
              {' · '}<strong className="text-zinc-200">{gecerliYontem.short}</strong> yöntemi
            </p>
            <div className="grid grid-cols-5 gap-1">
              {HR_ZONES.map(z => {
                const r = zoneRange(z.key, zoneOpts);
                return (
                  <div key={z.key} title={z.purpose} className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 text-center">
                    <span className={`text-[9px] font-bold block ${z.color}`}>{z.label.replace('Zone ', 'Z')}</span>
                    <span className="text-[8px] font-mono text-zinc-400 block">{r ? `${r.min}-${r.max}` : '—'}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1.5">
              Sınırlar bir TAHMİN; kişiler arası sapma ±10-12 atım. Nabız
              girmediğin kayıtlarda bölge, aktivite ve tempodan tahmin ediliyor.
            </p>
          </>
        ) : (
          <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
            Nabız bölgelerini görmek için Vücut ekranında yaşını gir. Bölge
            sınıflandırması yaş olmadan da çalışıyor — aktivite ve tempodan
            tahmin ediliyor.
          </p>
        )}
      </div>}
    </div>
  );
});

CardioCoachCard.displayName = 'CardioCoachCard';

export default CardioCoachCard;
