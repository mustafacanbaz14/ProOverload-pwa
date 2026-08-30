import React, { useState, useMemo, memo } from 'react';
import {
  X, Layers3, Play, Square, TrendingUp, Minus, ArrowDownWideNarrow, Info, Check,
} from 'lucide-react';
import {
  MESOCYCLE_PRESETS, RECOVERY_FEEDBACK, emptyMesocycle,
  mesocycleState, weeklyTargets, targetInstructions,
  PROGRESSION_MODES, findProgressionMode,
} from '../utils/mesocycle';
import { dayKey } from '../utils/dates';

/**
 * Mezosiklik (blok) ekranı.
 *
 * Blok kurulurken o anki haftalık program hacmi TABAN olarak dondurulur. Taban
 * her hafta yeniden okunsaydı ilerleme ölçülemezdi: kullanıcı set eklediğinde
 * taban da yükselir, artış hep sıfır görünürdü.
 */

const ACTION_STYLE = {
  add: { icon: TrendingUp, color: 'text-emerald-400', border: 'border-emerald-900/50', bg: 'bg-emerald-950/20' },
  remove: { icon: ArrowDownWideNarrow, color: 'text-amber-400', border: 'border-amber-900/50', bg: 'bg-amber-950/20' },
  hold: { icon: Minus, color: 'text-zinc-500', border: 'border-zinc-800', bg: 'bg-zinc-950/60' },
};

const MesocycleModal = memo(({
  isOpen,
  onClose,
  mesocycle,
  onChange,
  statuses = [],
  muscleVolume = {},
  experienceLevel = 'intermediate',
  volumePhilosophy = 'balanced',
  today = dayKey(new Date()),
}) => {
  const meso = mesocycle || emptyMesocycle();
  const [weeks, setWeeks] = useState(meso.weeks || 5);
  const [mode, setMode] = useState(meso.mode || 'ramp');

  const state = useMemo(() => mesocycleState(meso, today), [meso, today]);

  const targets = useMemo(
    () => (state.active
      ? weeklyTargets(meso.baseline, {
        weekIndex: state.weekIndex,
        totalWeeks: state.totalWeeks,
        experienceLevel,
        feedback: meso.feedback,
        mode: meso.mode || 'ramp',
        philosophy: volumePhilosophy,
      })
      : []),
    [state, meso.baseline, meso.feedback, meso.mode, experienceLevel, volumePhilosophy]);

  const instructions = useMemo(
    () => targetInstructions(targets, statuses),
    [targets, statuses]);

  if (!isOpen) return null;

  const basla = () => {
    // Taban: programın şu anki kas hacimleri, tam sayıya yuvarlanmış.
    const baseline = {};
    Object.entries(muscleVolume).forEach(([kas, hacim]) => {
      const n = Math.round(hacim);
      if (n > 0) baseline[kas] = n;
    });
    onChange({ active: true, startDate: today, weeks, mode, baseline, feedback: {} });
  };

  const bitir = () => onChange(emptyMesocycle());

  const geriBildirimVer = (muscle, key) => {
    // Geri bildirim BU haftaya yazılır; artış hesabı geçmiş haftaların
    // toplamından yürüdüğü için gelecek hafta kendiliğinden etkilenir.
    const hafta = String(state.weekIndex);
    const mevcut = meso.feedback?.[hafta] || {};
    const yeni = { ...mevcut };
    if (yeni[muscle] === key) delete yeni[muscle];
    else yeni[muscle] = key;
    onChange({ ...meso, feedback: { ...(meso.feedback || {}), [hafta]: yeni } });
  };

  const buHafta = meso.feedback?.[String(state.weekIndex)] || {};
  const tabanKasSayisi = Object.keys(meso.baseline || {}).length;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="mesocycle-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[92] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md shrink-0">
          <h3 id="mesocycle-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest flex items-center">
            <Layers3 size={16} className="mr-2 text-cyan-400" /> Mezosiklik Planlayıcı
          </h3>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">

        {!state.active ? (
          <>
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 backdrop-blur-sm">
              <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
                Haftalık program sabit kalırsa hacim de sabit kalır. Blok, programı
                ZAMANA yayar: bugünkü hacim taban alınır, her hafta kas kas bir
                miktar artar, son hafta boşaltmayla biter. Artış miktarı sabit
                değil — her haftanın sonunda kas kas verdiğin geri bildirime göre
                hesaplanır.
              </p>
              {state.expired && (
                <p className="text-[10px] font-mono text-amber-300 leading-relaxed mt-2.5 pt-2.5 border-t border-zinc-800/80">
                  Önceki blok tamamlandı ({state.rangeLabel}). Yeni bloğun tabanı
                  şu anki programın hacmi olacak.
                </p>
              )}
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60">
                <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Blok Uzunluğu</h4>
              </div>
              <div className="p-3 space-y-2">
                {MESOCYCLE_PRESETS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setWeeks(p.weeks)}
                    className={`w-full text-left rounded-2xl p-3 border transition-all active:scale-[0.99] ${weeks === p.weeks ? 'border-cyan-600 bg-cyan-950/30 shadow-md shadow-cyan-950/30' : 'border-zinc-800/80 bg-zinc-950/60'}`}
                  >
                    <div className="flex justify-between items-baseline gap-2">
                      <strong className={`text-[12px] font-bold ${weeks === p.weeks ? 'text-cyan-300' : 'text-zinc-200'}`}>{p.label}</strong>
                      <span className="text-[9px] font-mono text-zinc-500 shrink-0">{p.summary}</span>
                    </div>
                    <p className="text-[9px] font-mono text-zinc-500 leading-relaxed mt-1">{p.detail}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60">
                <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">İlerleme Kipi</h4>
              </div>
              <div className="p-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(PROGRESSION_MODES).map(m => (
                    <button
                      key={m.key}
                      onClick={() => setMode(m.key)}
                      aria-pressed={mode === m.key}
                      className={`rounded-xl py-2.5 px-2.5 border text-[10px] font-black uppercase tracking-wider transition-all active:scale-[0.98] ${mode === m.key ? 'border-cyan-600 bg-cyan-950/40 text-cyan-200 shadow-md shadow-cyan-950/30' : 'border-zinc-800/80 bg-zinc-950/60 text-zinc-500'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                  {findProgressionMode(mode).summary}
                </p>
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                  {findProgressionMode(mode).detail}
                </p>
              </div>
            </div>

            {Object.keys(muscleVolume).length === 0 ? (
              <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
                <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] font-mono text-amber-200 leading-relaxed">
                  Aktif haftalık programda hiç set yok; blok başlatılamaz. Önce bir
                  program kur (Araçlar → Hazır Programlar) ya da haftalık plana
                  şablon yerleştir.
                </p>
              </div>
            ) : (
              <button
                onClick={basla}
                className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 active:scale-[0.98] text-white font-black py-3.5 rounded-2xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all"
              >
                <Play size={16} /> {weeks} Haftalık Bloğu Başlat
              </button>
            )}
          </>
        ) : (
          <>
            {/* Hafta göstergesi */}
            <div className={`rounded-3xl p-4 border backdrop-blur-sm ${state.isDeload ? 'border-amber-900/50 bg-amber-950/20' : 'border-cyan-900/50 bg-cyan-950/20'}`}>
              <div className="flex justify-between items-baseline gap-2">
                <strong className={`text-[13px] font-black tracking-wide ${state.isDeload ? 'text-amber-300' : 'text-cyan-300'}`}>
                  {state.weekIndex}. hafta / {state.totalWeeks}
                </strong>
                <span className="text-[9px] font-mono text-zinc-400 shrink-0">{state.weekRangeLabel}</span>
              </div>
              <div className="flex gap-1.5 mt-3">
                {Array.from({ length: state.totalWeeks }, (_, i) => {
                  const n = i + 1;
                  const gecmis = n < state.weekIndex;
                  const simdi = n === state.weekIndex;
                  const bosaltma = n === state.totalWeeks;
                  return (
                    <div
                      key={n}
                      title={bosaltma ? 'Boşaltma haftası' : `${n}. hafta`}
                      className={`h-2 flex-1 rounded-full transition-all ${simdi
                        ? (bosaltma ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-cyan-400 shadow-sm shadow-cyan-400/50')
                        : gecmis ? 'bg-zinc-600' : (bosaltma ? 'bg-amber-900/50' : 'bg-zinc-800')}`}
                    />
                  );
                })}
              </div>
              <p className="text-[10px] font-mono text-zinc-400 leading-relaxed mt-3">
                {state.isDeload
                  ? 'Boşaltma haftası: hedefler bloğun BAŞLANGIÇ hacminin yarısı. Ağırlığı düşürme, set sayısını düşür — kuvvet uyarımı korunsun, biriken iş azalsın.'
                  : `Yükleme haftası. ${state.weeksLeft} hafta sonra boşaltma. Hafta sonunda aşağıdan kas kas geri bildirim gir; gelecek haftanın artışı buna göre hesaplanacak.`}
              </p>
            </div>

            {/* Bu haftanın hedefleri */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60 flex justify-between items-baseline">
                <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Bu Haftanın Hedefleri</h4>
                <span className="text-[9px] font-mono text-zinc-500">mevcut → hedef</span>
              </div>
              <div className="divide-y divide-zinc-800/70">
                {instructions.map(i => {
                  const stil = ACTION_STYLE[i.action];
                  const Icon = stil.icon;
                  return (
                    <div key={i.muscle} className="px-3.5 py-2.5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Icon size={12} className={`${stil.color} shrink-0`} />
                          <strong className="text-[11px] text-zinc-200 truncate">{i.muscle}</strong>
                          {i.capped && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-lg border border-amber-900/50 bg-amber-950/30 text-amber-400 shrink-0">
                              MRV
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] font-mono shrink-0">
                          <span className="text-zinc-500">{i.current} → </span>
                          <strong className={stil.color}>{i.target}</strong>
                        </span>
                      </div>
                      <p className="text-[9px] font-mono text-zinc-500 leading-relaxed mt-1 pl-4">{i.text}</p>
                    </div>
                  );
                })}
                {instructions.length === 0 && (
                  <p className="px-4 py-6 text-center text-[10px] font-mono text-zinc-600">
                    Bloğun tabanında kas yok.
                  </p>
                )}
              </div>
            </div>

            {/* Haftalık geri bildirim */}
            {!state.isDeload && (
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60">
                  <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                    {state.weekIndex}. Hafta Geri Bildirimi
                  </h4>
                </div>
                <div className="p-3.5 space-y-2.5">
                  <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                    Her kas için hafta nasıl geçti? Girilmeyen kaslar varsayılan
                    artışı (+1 set) alır — form boş kalınca blok durmaz.
                  </p>
                  <div className="flex gap-1.5 pb-1">
                    {RECOVERY_FEEDBACK.map(f => (
                      <span key={f.key} className="flex-1 text-center text-[8px] font-mono text-zinc-500 leading-tight">
                        {f.label}<br /><span className="text-cyan-600">+{f.step} set</span>
                      </span>
                    ))}
                  </div>
                  {targets.map(t => (
                    <div key={t.muscle} className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-300 w-[68px] shrink-0 truncate">{t.muscle}</span>
                      {RECOVERY_FEEDBACK.map(f => {
                        const secili = buHafta[t.muscle] === f.key;
                        return (
                          <button
                            key={f.key}
                            onClick={() => geriBildirimVer(t.muscle, f.key)}
                            title={f.hint}
                            className={`flex-1 py-1.5 rounded-xl border text-[9px] font-bold transition-all active:scale-[0.97] ${secili ? 'border-cyan-600 bg-cyan-950/40 text-cyan-300 shadow-sm shadow-cyan-950/30' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
                          >
                            {secili ? <Check size={11} className="inline" /> : f.label}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-zinc-800/80 bg-zinc-950/60">
                  <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                    {RECOVERY_FEEDBACK.map(f => `${f.label}: ${f.hint.toLowerCase()}.`).join(' ')}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 backdrop-blur-sm">
              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                Blok {state.rangeLabel} aralığında; taban {tabanKasSayisi} kas
                üzerinden dondurulmuş. Hedefler şablonlara KENDİLİĞİNDEN yazılmaz —
                set eklemeyi sen yaparsın, böylece elle yaptığın düzenlemeler her
                hafta ezilmez.
              </p>
            </div>

            <button
              onClick={bitir}
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-[0.98] text-zinc-300 font-bold py-3.5 rounded-2xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <Square size={13} /> Bloğu Bitir
            </button>
          </>
        )}
      </div>
    </div>
  </div>
  );
});

MesocycleModal.displayName = 'MesocycleModal';

export default MesocycleModal;
