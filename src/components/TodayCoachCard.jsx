import React, { memo, useState } from 'react';
import { CalendarCheck, Moon, BrainCircuit, Flame, Dumbbell, HeartPulse, ChevronRight, ChevronDown, Clock3, BellOff, CheckCheck, BookCheck } from 'lucide-react';

const Metric = ({ icon, label, value, tone = 'text-zinc-200' }) => (
  <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-2.5 min-w-0 shadow-sm transition-colors">
    <span className="flex items-center text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
      {icon}{label}
    </span>
    <span className={`text-[12px] font-mono font-black block truncate tracking-tight ${tone}`}>{value}</span>
  </div>
);

const TodayCoachCard = memo(({ data, actions = [], onAction, onStart, onOpenEnergy, onOpenWellness, onOpenCardio,
  onSnooze, onDismiss, onRestoreCoach, hiddenCount = 0, conflictCount = 0,
  onApply, onReject, focus = null, onOpenLedger, ledgerOpenCount = 0, briefing = null,
  compact = false }) => {
  const [showAll, setShowAll] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  // Açık madde: aynı anda yalnızca biri. Ölçüldüğünde ana ekranda beş uzun
  // paragraf vardı (ortalama 160, en uzunu 307 karakter) ve birincil eylem
  // 2.5 ekran aşağıdaydı. Koç maddelerinin GEREKÇESİ değerli ama her gün
  // hepsini birden okumak kimsenin yaptığı bir şey değil; başlık kalıyor,
  // gerekçe dokununca açılıyor.
  const [openKey, setOpenKey] = useState(null);
  if (!data) return null;
  const planned = Boolean(data.workoutTemplate);
  const detailsVisible = !compact || showDetails;
  const hasDetails = Boolean(briefing?.capacity || actions.length > 0 || (ledgerOpenCount > 0 && onOpenLedger));
  return (
    <section className="luxury-feature-card bg-gradient-to-br from-cyan-950/40 via-zinc-900/90 to-zinc-950 rounded-3xl border border-cyan-900/35 overflow-hidden shadow-xl shadow-black/40">
      <div className="px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center gap-3 bg-zinc-950/40 backdrop-blur-md">
        <div className="min-w-0">
          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-[0.2em] font-semibold block mb-0.5">Bugünün Koçu</span>
          <h2 className="text-sm font-bold text-zinc-100 truncate tracking-tight">{data.dateLabel}</h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Odak rozeti: sıranın neden bu olduğunu görünür kılıyor. Ayardan
              seçilen bir şeyin etkisi görünmezse ayar unutuluyor. */}
          {focus && focus.key !== 'balanced' && (
            <span className="text-[8px] font-mono font-medium text-violet-300 border border-violet-900/60 bg-violet-950/30 px-2 py-1 rounded-lg">
              {focus.label}
            </span>
          )}
          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border tracking-wider ${data.tone}`}>
            {data.status}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        <div>
          <p className="text-[13px] font-black text-zinc-100 leading-snug tracking-tight">{data.headline}</p>
          <p className="text-[10px] font-mono text-zinc-400 leading-relaxed mt-1">{data.detail}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Metric icon={<Moon size={11} className="mr-1 text-indigo-400" />} label="Uyku" value={data.sleepLabel} tone={data.sleepTone} />
          <Metric icon={<BrainCircuit size={11} className="mr-1 text-amber-400" />} label="Hazır Oluş" value={data.readinessLabel} tone={data.readinessTone} />
          <Metric icon={<Flame size={11} className="mr-1 text-red-400" />} label="Kalori" value={data.calorieLabel} tone={data.calorieTone} />
        </div>

        <div className="bg-zinc-950/85 border border-zinc-800/90 rounded-2xl p-3.5 space-y-1.5 shadow-inner">
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
            <p className="text-[9px] font-mono text-zinc-400 flex items-center">
              <Flame size={10} className="mr-1.5 text-orange-400" /> Planlanan ek harcama ~{data.planCalories} kcal
            </p>
          )}
        </div>

        {compact && hasDetails && (
          <button
            type="button"
            onClick={() => setShowDetails(value => !value)}
            aria-expanded={showDetails}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/55 px-3 py-2 text-left flex items-center justify-between gap-3 active:bg-zinc-900"
          >
            <span className="text-[9px] font-mono text-zinc-300">
              Koç ayrıntıları
              {actions.length > 0 && <span className="text-cyan-400 font-bold"> · {actions.length} öneri</span>}
            </span>
            <ChevronDown size={12} className={`text-zinc-400 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </button>
        )}

        {detailsVisible && briefing?.capacity && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 flex items-center gap-3">
            <div className="text-center shrink-0">
              <strong className={`text-lg font-mono block leading-none ${briefing.capacity.zone.tone}`}>
                {briefing.capacity.score === null ? '—' : briefing.capacity.score}
              </strong>
              <span className="text-[7px] font-mono text-zinc-400">kapasite</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <span className={`text-[9px] font-bold ${briefing.capacity.zone.tone}`}>{briefing.capacity.zone.label}</span>
                <span className="text-[8px] font-mono text-zinc-400">güven %{briefing.capacity.confidence}</span>
              </div>
              <div className="h-1 rounded-full bg-zinc-900 overflow-hidden mt-1">
                <div className={`h-full ${briefing.capacity.zone.bar}`} style={{ width: `${briefing.capacity.score ?? 0}%` }} />
              </div>
              <p className="text-[8px] font-mono text-zinc-400 truncate mt-1">
                {briefing.capacity.concerns[0]?.detail || briefing.capacity.positives[0]?.detail || 'Yeni kayıtlarla karar güveni artar.'}
              </p>
            </div>
          </div>
        )}

        {/* Sıralanmış eylem listesi. Kart tek cümleyle "planın hazır" diyordu
            ama günün asıl kararı çoğu zaman başka yerde oluyor: uyku kötüyse
            planın hazır olması bir şey ifade etmiyor. İlk iki madde açık,
            gerisi istenirse açılıyor — kart ikinci bir ekrana dönüşmesin. */}
        {detailsVisible && actions.length > 0 && (
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
                      className={`shrink-0 mt-0.5 text-zinc-400 transition-transform ${openKey === item.key ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {item.action && onAction && (
                    <button
                      onClick={() => onAction(item.action)}
                      className="text-[9px] font-bold text-zinc-300 active:text-zinc-100 shrink-0 flex items-center"
                    >
                      Aç <ChevronRight size={10} />
                    </button>
                  )}
                </div>
                {openKey === item.key && (
                  <p className="text-[9px] font-mono text-zinc-300 leading-relaxed mt-1.5">{item.detail}</p>
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
                        className="text-[9px] font-mono text-emerald-400 active:text-emerald-300 flex items-center gap-1"
                      >
                        <CheckCheck size={9} /> Uyguladım
                      </button>
                    )}
                    {onSnooze && (
                      <button
                        onClick={() => onSnooze(item.key)}
                        className="text-[9px] font-mono text-zinc-400 active:text-zinc-200 flex items-center gap-1"
                      >
                        <Clock3 size={9} /> Ertele
                      </button>
                    )}
                    {onDismiss && (
                      <button
                        onClick={() => { onReject?.(item); onDismiss(item.key); }}
                        className="text-[9px] font-mono text-zinc-400 active:text-zinc-200 flex items-center gap-1"
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
              <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                {conflictCount > 0 && `${conflictCount} madde bu haftaki kararla çeliştiği için susturuldu. `}
                {hiddenCount - conflictCount > 0 && `${hiddenCount - conflictCount} madde ertelendi ya da kapatıldı. `}
                {onRestoreCoach && (
                  <button onClick={() => onRestoreCoach()} className="text-cyan-400 active:text-cyan-300 underline font-bold">
                    Hepsini geri aç
                  </button>
                )}
              </p>
            )}
            {actions.length > 3 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full text-[9px] font-mono text-zinc-400 active:text-zinc-200 py-1 flex items-center justify-center gap-1"
              >
                {showAll ? 'Daha az göster' : `${actions.length - 3} madde daha`}
                <ChevronDown size={10} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        )}

        {detailsVisible && ledgerOpenCount > 0 && onOpenLedger && (
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

        <div className="grid grid-cols-[1fr_auto_auto] gap-2 pt-1">
          <button
            type="button"
            onClick={() => data.cardioLabel && !planned
              ? onOpenCardio?.()
              : onStart?.(data.workoutTemplate || null)}
            className="bg-cyan-600 active:scale-[0.98] text-white rounded-2xl px-4 py-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center shadow-lg shadow-black/30 transition-all"
          >
            {planned ? 'Planlananı Başlat' : data.cardioLabel ? 'Kardiyoyu Aç' : 'Serbest Başlat'} <ChevronRight size={13} className="ml-1" />
          </button>
          <button
            type="button"
            onClick={onOpenEnergy}
            aria-label="Enerji detayını aç"
            className="bg-zinc-950/90 border border-zinc-800/80 text-red-400 active:scale-[0.95] rounded-2xl px-3 py-2 flex flex-col items-center justify-center gap-0.5 shadow-sm transition-all hover:border-red-900/40"
          >
            <Flame size={15} />
            <span className="text-[7px] font-bold uppercase tracking-wider">Kalori</span>
          </button>
          <button
            type="button"
            onClick={onOpenWellness}
            aria-label="Uyku ve toparlanmayı aç"
            className="bg-zinc-950/90 border border-zinc-800/80 text-indigo-400 active:scale-[0.95] rounded-2xl px-3.5 py-2 flex flex-col items-center justify-center gap-0.5 shadow-sm transition-all hover:border-indigo-900/40"
          >
            <Moon size={15} />
            <span className="text-[7px] font-bold uppercase tracking-wider">Uyku</span>
          </button>
        </div>
      </div>
    </section>
  );
});

TodayCoachCard.displayName = 'TodayCoachCard';

export default TodayCoachCard;
