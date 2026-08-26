import React, { memo, useMemo, useState } from 'react';
import { X, FlaskConical, Minus, Plus, AlertTriangle, Clock3 } from 'lucide-react';
import { buildScenario, suggestScenarios, totalCost } from '../utils/whatIf';

/**
 * Senaryo denemesi.
 *
 * Kullanıcının kendi sorusunu kurabilmesi için önce ne sorabileceğini görmesi
 * gerekiyor — boş bir form kimseye bir şey sordurmuyor. Bu yüzden mevcut
 * duruma göre hazır senaryolar üstte; altında kendi kasını ve set sayısını
 * seçebileceği bir kurgu var.
 */

const ScenarioModal = memo(({ isOpen, onClose, muscleStates = [], profile = null, restSeconds = 120 }) => {
  const [muscle, setMuscle] = useState('');
  const [delta, setDelta] = useState(2);

  const oneriler = useMemo(
    () => (isOpen ? suggestScenarios(muscleStates, { profile, restSeconds }) : []),
    [isOpen, muscleStates, profile, restSeconds]);

  const secili = muscleStates.find(m => m.muscle === muscle) || muscleStates[0] || null;

  const kendi = useMemo(() => {
    if (!secili) return null;
    return buildScenario(
      { muscle: secili.muscle, deltaSets: delta },
      {
        current: { volume: secili.volume, frequency: secili.frequency },
        landmarks: secili.landmarks,
        profile,
        restSeconds,
      });
  }, [secili, delta, profile, restSeconds]);

  if (!isOpen) return null;

  const bedel = totalCost(oneriler);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[93] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <FlaskConical size={15} className="mr-2 text-violet-400" /> Senaryo
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">
        <p className="text-[10px] font-mono text-zinc-500 leading-relaxed bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
          "Şunu değiştirsem ne olur" sorusunun üç parçası var: değişiklikten
          sonra hacim hangi banda düşüyor, o bantta senin geçmişinde ne olmuş
          ve bedeli kaç dakika. Uygulama TAHMİN üretmiyor — hacim-tepki
          ilişkisini kişide ölçmek için gereken veri tipik bir kullanıcıda yok
          ve "iki set eklersen %1.4 daha hızlı ilerlersin" demek uydurulmuş bir
          kesinlik olurdu.
        </p>

        {secili && (
          <section className="rounded-2xl border border-violet-900/40 bg-violet-950/10 overflow-hidden">
            <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/50">
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Kendi senaryonu kur</span>
            </div>
            <div className="p-3 space-y-3">
              <select
                value={secili.muscle}
                onChange={(e) => setMuscle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-violet-300 font-mono outline-none"
              >
                {muscleStates.map(m => (
                  <option key={m.muscle} value={m.muscle}>
                    {m.muscle} — şu an {m.volume} set/hafta
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDelta(d => Math.max(-12, d - 1))}
                  aria-label="Bir set azalt"
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-xl p-2.5 active:bg-zinc-800"
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1 text-center">
                  <strong className="text-xl font-mono text-violet-300">
                    {delta > 0 ? '+' : ''}{delta}
                  </strong>
                  <span className="text-[9px] font-mono text-zinc-600 block">haftalık set değişimi</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDelta(d => Math.min(12, d + 1))}
                  aria-label="Bir set ekle"
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-xl p-2.5 active:bg-zinc-800"
                >
                  <Plus size={14} />
                </button>
              </div>

              {kendi && (
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-[10px] font-mono">
                    <span className="text-zinc-500">{kendi.from.volume} set · {kendi.from.bandLabel}</span>
                    <span className="text-violet-300">{kendi.to.volume} set · {kendi.to.bandLabel}</span>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">{kendi.summary}</p>
                  {kendi.minutesPerWeek !== 0 && (
                    <p className="text-[9px] font-mono text-zinc-600 flex items-center gap-1">
                      <Clock3 size={9} />
                      Haftalık süre farkı: {kendi.minutesPerWeek > 0 ? '+' : ''}{kendi.minutesPerWeek} dakika
                    </p>
                  )}
                  {kendi.warnings.map(w => (
                    <p key={w} className="text-[9px] font-mono text-amber-300/85 leading-relaxed flex items-start gap-1">
                      <AlertTriangle size={9} className="shrink-0 mt-0.5" /> {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {oneriler.length > 0 && (
          <section className="space-y-2">
            <div className="flex justify-between items-baseline px-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hazır sorular</span>
              <span className="text-[9px] font-mono text-zinc-600">
                hepsi birden: {bedel.deltaSets > 0 ? '+' : ''}{bedel.deltaSets} set, {bedel.minutesPerWeek > 0 ? '+' : ''}{bedel.minutesPerWeek} dk/hafta
              </span>
            </div>
            {oneriler.map(o => (
              <div key={o.label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-200 block">{o.label}</span>
                <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">{o.result.summary}</p>
                {o.result.evidence && (
                  <span className="text-[9px] font-mono text-emerald-400/80 block">
                    Kanıt: {o.result.evidence.band} bandında {o.result.evidence.observations} gözlem
                    (kas ayrımı yapılmadan), seans başına %{o.result.evidence.gainPerSession}
                  </span>
                )}
                {o.result.warnings.map(w => (
                  <p key={w} className="text-[9px] font-mono text-amber-300/85 leading-relaxed">{w}</p>
                ))}
              </div>
            ))}
            {bedel.heavy && (
              <p className="text-[9px] font-mono text-amber-300/85 leading-relaxed px-1">
                Hepsini birden uygulamak haftada bir saatten fazla ek yük demek.
                Bu bir program değişikliği değil hayat değişikliği; birini seçip
                ölçmek, hepsini birden denemekten çok daha iyi sonuç verir.
              </p>
            )}
          </section>
        )}

        {oneriler.length === 0 && (
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
            Hazır soru üretilecek bir durum yok: çalıştığın kasların hepsi
            koruma eşiği ile tavan arasında ve yeterince bölünmüş.
          </p>
        )}
      </div>
    </div>
  );
});

ScenarioModal.displayName = 'ScenarioModal';

export default ScenarioModal;
