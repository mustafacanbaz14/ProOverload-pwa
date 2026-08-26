import React, { useState, useMemo, memo } from 'react';
import { X, Target, RotateCcw, Sparkles, AlertTriangle } from 'lucide-react';
import { MUSCLE_GROUPS, getVolumeLandmarks } from '../utils/constants';
import { targetsFor, setVolumeTarget, suggestVolumeTarget, VOLUME_TARGET_LIMITS } from '../utils/volumeTargets';

/**
 * Kas bazında kişisel haftalık hacim hedefi.
 *
 * Bant sınırları doz-yanıt eğrisinden türetiliyor ve deneyim seviyesine göre
 * ölçekleniyor —
 * doğru bir başlangıç ama kişisel değil. Aynı seviyedeki iki kişinin aynı
 * kastaki toparlanma kapasitesi belirgin farklı olabiliyor ve kişi bunu
 * birkaç blok sonra kendi verisinden öğreniyor.
 *
 * Yalnızca DEĞİŞTİRİLEN kaslar kaydediliyor; gerisi literatür değerinde
 * kalıyor. Böylece tek bir kası ayarlamak için on altı kası girmek gerekmiyor.
 */

const SatirDuzenleyici = memo(({ muscle, current, suggestion, onSave, onReset }) => {
  const [mev, setMev] = useState(String(current.mev));
  const [mav, setMav] = useState(String(current.mav));
  const [mrv, setMrv] = useState(String(current.mrv));

  const alan = (deger, ayarla, etiket) => (
    <label className="flex-1 min-w-0">
      <span className="text-[8px] font-mono text-zinc-600 block mb-0.5">{etiket}</span>
      <input
        type="number"
        inputMode="numeric"
        min={VOLUME_TARGET_LIMITS.min}
        max={VOLUME_TARGET_LIMITS.max}
        value={deger}
        onChange={(e) => ayarla(e.target.value)}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] font-mono text-zinc-200 outline-none focus:border-cyan-500"
        aria-label={`${muscle} ${etiket}`}
      />
    </label>
  );

  return (
    <div className="px-3 py-2.5 space-y-2 bg-zinc-950/40">
      <div className="flex gap-2">
        {alan(mev, setMev, 'Eşik')}
        {alan(mav, setMav, 'Verimli')}
        {alan(mrv, setMrv, 'Tartışmalı')}
      </div>

      {suggestion && (
        <button
          onClick={() => { setMev(String(suggestion.mev)); setMav(String(suggestion.mav)); setMrv(String(suggestion.mrv)); }}
          className="w-full rounded-lg border border-violet-900/50 bg-violet-950/20 px-2 py-1.5 text-left active:bg-violet-900/25"
        >
          <span className="text-[9px] font-bold text-violet-300 flex items-center gap-1">
            <Sparkles size={9} /> Geçmişinden öneri: {suggestion.mev} / {suggestion.mav} / {suggestion.mrv}
          </span>
          <span className="text-[8px] font-mono text-zinc-500 block mt-0.5 leading-relaxed">
            {suggestion.recoveredWeeks} haftada iyi toparladığın en yüksek hacme göre.
            {suggestion.deviates && ' Literatür değerinden belirgin farklı — bilerek seç.'}
          </span>
        </button>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onReset}
          className="rounded-lg border border-zinc-800 bg-zinc-900 py-2 text-[9px] font-bold text-zinc-400 active:bg-zinc-800 flex items-center justify-center gap-1"
        >
          <RotateCcw size={10} /> Varsayılana Dön
        </button>
        <button
          onClick={() => onSave({ mev, mav, mrv })}
          className="rounded-lg bg-cyan-600 active:bg-cyan-700 py-2 text-[9px] font-bold text-white uppercase tracking-wider"
        >
          Kaydet
        </button>
      </div>
    </div>
  );
});
SatirDuzenleyici.displayName = 'SatirDuzenleyici';

const VolumeTargetsModal = memo(({
  isOpen, onClose, overrides = {}, experienceLevel = 'intermediate',
  weeklyVolumeHistory = {}, onChange,
}) => {
  const [acik, setAcik] = useState(null);

  const satirlar = useMemo(() => MUSCLE_GROUPS.map(muscle => ({
    muscle,
    current: targetsFor(muscle, { overrides, experienceLevel }),
    suggestion: suggestVolumeTarget(muscle, weeklyVolumeHistory[muscle] || [], { experienceLevel }),
  })), [overrides, experienceLevel, weeklyVolumeHistory]);

  if (!isOpen) return null;

  const kaydet = (muscle, values) => {
    onChange?.(setVolumeTarget(overrides, muscle, values));
    setAcik(null);
  };

  const kisiselSayisi = satirlar.filter(r => r.current.source === 'custom').length;

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[92] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Target size={15} className="mr-2 text-cyan-400" /> Hacim Hedefleri
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">
        <p className="text-[9px] font-mono text-zinc-500 leading-relaxed bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          Bant sınırları doz-yanıt eğrisinden ve deneyim seviyene göre
          ölçekleniyor — doğru bir başlangıç ama kişisel değil. Aynı seviyedeki
          iki kişinin aynı kastaki toparlanma kapasitesi belirgin farklı
          olabiliyor. Değiştirdiğin kas kendi değerini kullanır, dokunmadığın
          kaslar eğriden türetilen bandı kullanmaya devam eder. Kişisel değere
          deneyim çarpanı UYGULANMAZ:
          yazdığın sayı zaten senin kapasiten.
          {kisiselSayisi > 0 && ` Şu an ${kisiselSayisi} kasta kendi hedefin var.`}
        </p>

        {kisiselSayisi > 0 && (
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-2.5 flex items-start gap-2">
            <AlertTriangle size={11} className="text-amber-400 shrink-0 mt-0.5" />
            <span className="text-[9px] font-mono text-amber-200/85 leading-relaxed">
              Kişisel hedefler uygulamanın HER YERİNDE geçerli: hacim tablosu,
              ısı haritası, koç uyarıları, program üreticisi ve haftalık
              projeksiyon hepsi bu değerleri kullanır.
            </span>
          </div>
        )}

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/70">
          {satirlar.map(r => {
            const kisisel = r.current.source === 'custom';
            const varsayilan = getVolumeLandmarks(r.muscle, experienceLevel);
            return (
              <div key={r.muscle}>
                <button
                  onClick={() => setAcik(acik === r.muscle ? null : r.muscle)}
                  aria-expanded={acik === r.muscle}
                  className="w-full px-3 py-2 flex justify-between items-center gap-2 text-left active:bg-zinc-800/40"
                >
                  <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0 flex items-center gap-1.5">
                    {r.muscle}
                    {kisisel && <span className="text-[7px] font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-900/50 rounded px-1 py-0.5">ÖZEL</span>}
                    {!kisisel && r.suggestion && <Sparkles size={9} className="text-violet-400 shrink-0" />}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                    {r.current.mev} / {r.current.mav} / {r.current.mrv}
                  </span>
                </button>
                {acik === r.muscle && (
                  <SatirDuzenleyici
                    key={`${r.muscle}-${r.current.mev}-${r.current.mav}-${r.current.mrv}`}
                    muscle={r.muscle}
                    current={kisisel ? r.current : varsayilan}
                    suggestion={r.suggestion}
                    onSave={(v) => kaydet(r.muscle, v)}
                    onReset={() => kaydet(r.muscle, null)}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
          Sıralama bozulursa (örneğin tartışmalı sınır eşiğin altında kalırsa) değerler
          sessizce düzeltilir: sıralamayı bozan bir hedef, hacim
          çözümleyicisinde anlamsız sonuç üretirdi.
        </p>
      </div>
    </div>
  );
});

VolumeTargetsModal.displayName = 'VolumeTargetsModal';

export default VolumeTargetsModal;
