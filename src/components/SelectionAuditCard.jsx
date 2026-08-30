import React, { useState, useMemo, memo } from 'react';
import { Ruler, CheckCircle2, ChevronDown, AlertTriangle, Info } from 'lucide-react';
import { auditExerciseSelection, LENGTH_BIAS_LABEL } from '../utils/selectionAudit';

/**
 * Hareket seçimi denetimi kartı.
 *
 * Kas dökümünün hemen üstünde duruyor çünkü ikisi aynı sayılara farklı iki soru
 * soruyor: döküm "kaç set", bu kart "hangi hareket". Hacim tablosu yemyeşilken
 * bu kartın uyarı vermesi bir çelişki değil, tasarımın kendisi.
 */

const SEVERITY = {
  high: { border: 'border-red-900/50', bg: 'bg-red-950/20', text: 'text-red-300', icon: AlertTriangle },
  medium: { border: 'border-amber-900/50', bg: 'bg-amber-950/20', text: 'text-amber-300', icon: AlertTriangle },
  low: { border: 'border-zinc-800', bg: 'bg-zinc-950/60', text: 'text-zinc-300', icon: Info },
};

const BIAS_COLOR = {
  stretch: 'text-cyan-400',
  short: 'text-zinc-500',
  mid: 'text-zinc-500',
};

const SelectionAuditCard = memo(({ statuses = [], customExercises = [] }) => {
  const [open, setOpen] = useState(null);

  const rapor = useMemo(
    () => auditExerciseSelection(statuses, { customExercises }),
    [statuses, customExercises]);

  if (!rapor.hasData) return null;

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
        <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
          <Ruler size={12} className="mr-1.5 text-cyan-400" /> Hareket Seçimi
        </h4>
        <span className="text-[9px] font-mono text-zinc-400 shrink-0">{rapor.audited} kas denetlendi</span>
      </div>

      {rapor.clean ? (
        <div className="p-3.5 flex items-start gap-2.5">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono text-emerald-200 leading-relaxed">
            Hacmi yeterli her kasta hem gerilmede yükleyen bir hareket var hem de
            hacim birden fazla harekete dağılmış. Seçim tarafında yapılacak bir
            şey yok; ilerleme ağırlık ve tekrar üzerinden aranmalı.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/70">
          {rapor.findings.map(f => {
            const acik = open === f.muscle;
            const enAgir = f.issues[0];
            const stil = SEVERITY[enAgir.severity] || SEVERITY.low;
            const Icon = stil.icon;
            return (
              <div key={f.muscle}>
                <button
                  onClick={() => setOpen(acik ? null : f.muscle)}
                  aria-expanded={acik}
                  className="w-full px-4 py-2.5 flex justify-between items-center gap-2 text-left active:bg-zinc-800/50 transition-colors"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <ChevronDown size={11} className={`text-zinc-400 shrink-0 transition-transform ${acik ? 'rotate-180' : ''}`} />
                    <span className="text-[11px] font-bold text-zinc-200 truncate">{f.muscle}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {f.issues.map(i => (
                      <span
                        key={i.key}
                        className={`text-[9px] px-1.5 py-0.5 rounded border ${(SEVERITY[i.severity] || SEVERITY.low).border} ${(SEVERITY[i.severity] || SEVERITY.low).bg} ${(SEVERITY[i.severity] || SEVERITY.low).text}`}
                      >
                        {i.title}
                      </span>
                    ))}
                    <Icon size={11} className={stil.text} />
                  </span>
                </button>

                {acik && (
                  <div className="px-4 pb-3.5 pt-0.5 space-y-2.5 bg-zinc-950/50">
                    {f.issues.map(i => (
                      <p key={i.key} className="text-[10px] font-mono text-zinc-400 leading-relaxed">
                        <strong className={(SEVERITY[i.severity] || SEVERITY.low).text}>{i.title}.</strong> {i.detail}
                      </p>
                    ))}

                    {/* Bu kasa katkı veren hareketler ve kas boyu profilleri.
                        Eksiğin nereden geldiğini iddia etmek yerine gösteriyor. */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 space-y-1">
                      {f.exercises.map(h => (
                        <div key={h.name} className="flex justify-between items-baseline gap-2 text-[10px] font-mono">
                          <span className="text-zinc-400 truncate min-w-0">
                            {h.name}
                            {!h.primary && <span className="text-zinc-400"> · dolaylı</span>}
                          </span>
                          <span className="shrink-0">
                            <span className={BIAS_COLOR[h.bias]}>{LENGTH_BIAS_LABEL[h.bias]}</span>
                            <span className="text-zinc-400"> · </span>
                            <strong className="text-zinc-300">{Math.round(h.volume * 4) / 4}</strong>
                          </span>
                        </div>
                      ))}
                    </div>

                    {f.suggestions.length > 0 && (
                      <div>
                        <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                          Gerilmede yükleyen seçenekler
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {f.suggestions.map(ad => (
                            <span key={ad} className="text-[9px] font-bold px-2 py-1 rounded-lg border border-cyan-900/50 bg-cyan-950/25 text-cyan-300">
                              {ad}
                            </span>
                          ))}
                        </div>
                        <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1.5">
                          Set EKLEMEK gerekmiyor: mevcut setlerin bir kısmını bu
                          hareketlerden birine kaydırmak yeter. Toplam hacim
                          değişmez, uyaranın niteliği değişir.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/60">
        <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
          {LENGTH_BIAS_LABEL.stretch}: kasın uzun boydayken yüklendiği hareketler —
          RDL, incline dumbbell fly, baş üstü triseps. {LENGTH_BIAS_LABEL.short}:
          tepe kasılmada yüklenenler — shrug, leg extension, pushdown. Buradaki
          bulgular hacimden bağımsızdır; hacim doğruyken de çıkabilir.
        </p>
      </div>
    </div>
  );
});

SelectionAuditCard.displayName = 'SelectionAuditCard';

export default SelectionAuditCard;
