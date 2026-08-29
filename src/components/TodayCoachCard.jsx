import React, { memo, useState } from 'react';
import { CalendarCheck, Moon, BrainCircuit, Flame, Dumbbell, HeartPulse, ChevronRight, ChevronDown, Clock3, BellOff, CheckCheck, BookCheck } from 'lucide-react';

const Metric = ({ icon, label, value, tone = 'text-zinc-200' }) => (
  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 min-w-0">
    <span className="flex items-center text-[9px] font-mono text-zinc-600 uppercase tracking-wider mb-1">
      {icon}{label}
    </span>
    <span className={`text-[11px] font-mono font-bold block truncate ${tone}`}>{value}</span>
  </div>
);

const TodayCoachCard = memo(({ data, actions = [], onAction, onStart, onOpenEnergy, onOpenWellness, onOpenCardio,
  onSnooze, onDismiss, onRestoreCoach, hiddenCount = 0, conflictCount = 0,
  onApply, onReject, focus = null, onOpenLedger, ledgerOpenCount = 0, briefing = null }) => {
  const [showAll, setShowAll] = useState(false);
  // Açık madde: aynı anda yalnızca biri. Ölçüldüğünde ana ekranda beş uzun
  // paragraf vardı (ortalama 160, en uzunu 307 karakter) ve birincil eylem
  // 2.5 ekran aşağıdaydı. Koç maddelerinin GEREKÇESİ değerli ama her gün
  // hepsini birden okumak kimsenin yaptığı bir şey değil; başlık kalıyor,
  // gerekçe dokununca açılıyor.
  const [openKey, setOpenKey] = useState(null);
  if (!data) return null;
  const planned = Boolean(data.workoutTemplate);
  return (
    <section className="luxury-feature-card bg-gradient-to-br from-cyan-950/45 via-zinc-900 to-zinc-900 rounded-3xl border border-cyan-900/40 overflow-hidden shadow-lg shadow-cyan-950/10">
      <div className="px-4 py-3 border-b border-zinc-800/80 flex justify-between items-center gap-3">
        <div className="min-w-0">
          <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-[0.18em]">Bugünün Koçu</span>
          <h2 className="text-sm font-bold text-zinc-100 truncate">{data.dateLabel}</h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Odak rozeti: sıranın neden bu olduğunu görünür kılıyor. Ayardan
              seçilen bir şeyin etkisi görünmezse ayar unutuluyor. */}
          {focus && focus.key !== 'balanced' && (
            <span className="text-[8px] font-mono text-violet-300 border border-violet-900/60 bg-violet-950/25 px-1.5 py-1 rounded-lg">
              {focus.label}
            </span>
          )}
          <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-lg border ${data.tone}`}>
            {data.status}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-[12px] font-bold text-zinc-100 leading-snug">{data.headline}</p>
          <p className="text-[10px] font-mono text-zinc-500 leading-relaxed mt-1">{data.detail}</p>
        </div>

        {briefing?.capacity && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 flex items-center gap-3">
            <div className="text-center shrink-0">
              <strong className={`text-lg font-mono block leading-none ${briefing.capacity.zone.tone}`}>
                {briefing.capacity.score === null ? '—' : briefing.capacity.score}
              </strong>
              <span className="text-[7px] font-mono text-zinc-600">kapasite</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <span className={`text-[9px] font-bold ${briefing.capacity.zone.tone}`}>{briefing.capacity.zone.label}</span>
                <span className="text-[8px] font-mono text-zinc-600">güven %{briefing.capacity.confidence}</span>
              </div>
              <div className="h-1 rounded-full bg-zinc-900 overflow-hidden mt-1">
                <div className={`h-full ${briefing.capacity.zone.bar}`} style={{ width: `${briefing.capacity.score ?? 0}%` }} />
              </div>
              <p className="text-[8px] font-mono text-zinc-600 truncate mt-1">
                {briefing.capacity.concerns[0]?.detail || briefing.capacity.positives[0]?.detail || 'Yeni kayıtlarla karar güveni artar.'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Metric icon={<Moon size={10} className="mr-1 text-indigo-400" />} label="Uyku" value={data.sleepLabel} tone={data.sleepTone} />
          <Metric icon={<BrainCircuit size={10} className="mr-1 text-amber-400" />} label="Hazır Oluş" value={data.readinessLabel} tone={data.readinessTone} />
          <Metric icon={<Flame size={10} className="mr-1 text-red-400" />} label="Kalori" value={data.calorieLabel} tone={data.calorieTone} />
        </div>

        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-zinc-300 flex items-center min-w-0">
              {planned ? <Dumbbell size={12} className="mr-1.5 text-cyan-400 shrink-0" /> : <CalendarCheck size={12} className="mr-1.5 text-zinc-500 shrink-0" />}
              <span className="truncate">{data.planLabel}</span>
            </span>
            {data.planTime && <span className="text-[9px] font-mono text-cyan-500 shrink-0">{data.planTime}</span>}
          </div>
          {data.cardioLabel && (
            <p className="text-[9px] font-mono text-zinc-500 flex items-center">
              <HeartPulse size={10} className="mr-1.5 text-red-400" /> {data.cardioLabel}
            </p>
          )}
          {data.planCalories > 0 && (
            <p className="text-[9px] font-mono text-zinc-600 flex items-center">
              <Flame size={10} className="mr-1.5 text-orange-400" /> Planlanan ek harcama ~{data.planCalories} kcal
            </p>
          )}
        </div>

        {/* Sıralanmış eylem listesi. Kart tek cümleyle "planın hazır" diyordu
            ama günün asıl kararı çoğu zaman başka yerde oluyor: uyku kötüyse
            planın hazır olması bir şey ifade etmiyor. İlk iki madde açık,
            gerisi istenirse açılıyor — kart ikinci bir ekrana dönüşmesin. */}
        {actions.length > 0 && (
          <div className="space-y-1.5">
            {(showAll ? actions : actions.slice(0, 3)).map(item => (
              <div key={item.key} className={`rounded-xl border p-2.5 ${item.tone.chip}`}>
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenKey(k => (k === item.key ? null : item.key))}
                    aria-expanded={openKey === item.key}
                    className="min-w-0 flex-1 text-left flex items-start gap-1.5 active:opacity-70"
                  >
                    <span className={`text-[10px] font-bold leading-snug ${item.tone.text}`}>{item.title}</span>
                    <ChevronDown
                      size={11}
                      className={`shrink-0 mt-0.5 text-zinc-500 transition-transform ${openKey === item.key ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {item.action && onAction && (
                    <button
                      onClick={() => onAction(item.action)}
                      className="text-[9px] font-bold text-zinc-400 active:text-zinc-100 shrink-0 flex items-center"
                    >
                      Aç <ChevronRight size={10} />
                    </button>
                  )}
                </div>
                {openKey === item.key && (
                  <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1.5">{item.detail}</p>
                )}
                {/* Erteleme ve kapatma: aynı maddeyi her gün aynı yerde görmek
                    bir süre sonra kartın tamamını görünmez yapıyordu. */}
                {openKey === item.key && (onSnooze || onDismiss || onApply) && (
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    {/* "Uyguladım" ertelemeden önce geliyor: kartın asıl amacı
                        tavsiyeyi susturmak değil uygulatmak, ve defter ancak
                        bu dokunuşla dolabiliyor. */}
                    {onApply && (
                      <button
                        onClick={() => onApply(item)}
                        className="text-[9px] font-mono text-emerald-500 active:text-emerald-300 flex items-center gap-1"
                      >
                        <CheckCheck size={9} /> Uyguladım
                      </button>
                    )}
                    {onSnooze && (
                      <button
                        onClick={() => onSnooze(item.key)}
                        className="text-[9px] font-mono text-zinc-500 active:text-zinc-200 flex items-center gap-1"
                      >
                        <Clock3 size={9} /> Ertele
                      </button>
                    )}
                    {onDismiss && (
                      <button
                        onClick={() => { onReject?.(item); onDismiss(item.key); }}
                        className="text-[9px] font-mono text-zinc-500 active:text-zinc-200 flex items-center gap-1"
                      >
                        <BellOff size={9} /> Bir daha gösterme
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {/* Gizlenenler görünür kalıyor: eleme sessiz olsaydı kullanıcı
                tavsiyenin kaybolduğunu sanardı. Çelişki yüzünden susulan
                maddeler ayrı sayılıyor çünkü onları kullanıcı kapatmadı. */}
            {hiddenCount > 0 && (
              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                {conflictCount > 0 && `${conflictCount} madde bu haftaki kararla çeliştiği için susturuldu. `}
                {hiddenCount - conflictCount > 0 && `${hiddenCount - conflictCount} madde ertelendi ya da kapatıldı. `}
                {onRestoreCoach && (
                  <button onClick={() => onRestoreCoach()} className="text-cyan-500 active:text-cyan-300 underline">
                    Hepsini geri aç
                  </button>
                )}
              </p>
            )}
            {actions.length > 3 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full text-[9px] font-mono text-zinc-500 active:text-zinc-300 py-1 flex items-center justify-center gap-1"
              >
                {showAll ? 'Daha az göster' : `${actions.length - 3} madde daha`}
                <ChevronDown size={10} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        )}

        {ledgerOpenCount > 0 && onOpenLedger && (
          <button
            onClick={onOpenLedger}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-left active:bg-zinc-900"
          >
            <span className="text-[9px] font-mono text-zinc-400 flex items-center gap-1.5">
              <BookCheck size={10} className="text-emerald-500" />
              Defterde ölçüm bekleyen {ledgerOpenCount} tavsiye var
            </span>
          </button>
        )}

        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <button
            onClick={() => data.cardioLabel && !planned
              ? onOpenCardio?.()
              : onStart?.(data.workoutTemplate || null)}
            className="bg-cyan-600 active:bg-cyan-700 text-white rounded-xl px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center"
          >
            {planned ? 'Planlananı Başlat' : data.cardioLabel ? 'Kardiyoyu Aç' : 'Serbest Başlat'} <ChevronRight size={12} className="ml-1" />
          </button>
          <button onClick={onOpenEnergy} aria-label="Enerji detayını aç" className="bg-zinc-950 border border-zinc-800 text-red-400 rounded-xl p-2.5"><Flame size={15} /></button>
          <button onClick={onOpenWellness} aria-label="Uyku ve toparlanmayı aç" className="bg-zinc-950 border border-zinc-800 text-indigo-400 rounded-xl p-2.5"><Moon size={15} /></button>
        </div>
      </div>
    </section>
  );
});

TodayCoachCard.displayName = 'TodayCoachCard';

export default TodayCoachCard;
