import React, { memo } from 'react';
import { X, BookCheck, CheckCircle2, MinusCircle, XCircle, CircleDashed, Clock3 } from 'lucide-react';
import { describeEntry, LEDGER_VERDICTS, LEDGER_REVIEW_DAYS } from '../utils/coachLedger';
import { formatDay } from '../utils/dates';

/**
 * Koç karar defteri.
 *
 * Karnede tek bir sayı öne çıkıyor: isabet oranı. Ama o sayının yanında
 * "denenmemiş" kutusu da duruyor ve oranın dışında tutulduğu açıkça yazıyor —
 * uygulanmamış bir tavsiyeyi başarısızlığa yazmak, oranı koçun değil
 * kullanıcının davranışının ölçüsü yapardı.
 */

const VERDICT_ICON = {
  worked: <CheckCircle2 size={12} className="text-emerald-400" />,
  flat: <MinusCircle size={12} className="text-zinc-500" />,
  backfired: <XCircle size={12} className="text-red-400" />,
  'not-applied': <CircleDashed size={12} className="text-zinc-600" />,
};

const VERDICT_STYLE = {
  worked: 'border-emerald-900/50 bg-emerald-950/15',
  flat: 'border-zinc-800 bg-zinc-950',
  backfired: 'border-red-900/50 bg-red-950/15',
  'not-applied': 'border-zinc-800 bg-zinc-950/60',
};

const CoachLedgerModal = memo(({ isOpen, onClose, ledger = [], stats, due = [], onSettle }) => {
  if (!isOpen) return null;

  const acik = ledger.filter(e => e.decision === 'applied' && !e.outcome && e.kind !== 'none');
  const kapali = ledger.filter(e => e.outcome);
  const red = ledger.filter(e => e.decision === 'rejected');
  const olculemez = ledger.filter(e => e.decision === 'applied' && e.kind === 'none');

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="coach-ledger-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[93] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md shrink-0">
          <h3 id="coach-ledger-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest flex items-center">
            <BookCheck size={16} className="mr-2 text-emerald-400" /> Koç Karar Defteri
          </h3>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">
        {ledger.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-2 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-zinc-200 block">Defter henüz boş</span>
            <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
              Ana ekrandaki koç kartında bir tavsiyeyi uyguladığında
              "Uyguladım"a dokun. Uygulama o anki hacmi ve tahmini 1RM'i not
              alır, {LEDGER_REVIEW_DAYS} gün sonra tekrar ölçer ve tavsiyenin
              işe yarayıp yaramadığını söyler.
            </p>
            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
              Amaç koçu yanlış olabilir hale getirmek: yanlış olamayan bir
              tavsiye doğru da olamaz.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-emerald-950/25 via-zinc-900/80 to-zinc-950 p-4 shadow-sm backdrop-blur-sm">
              <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Koçun karnesi</span>
              {stats.hitRate === null ? (
                <p className="text-[10px] font-mono text-zinc-400 leading-relaxed mt-2">
                  Oran için en az beş ölçülmüş tavsiye gerekiyor; şu an {stats.tested} tane var.
                  İki denemenin biri tutunca "%50 isabet" çıkıyor ve bu bir bilgi değil.
                </p>
              ) : (
                <>
                  <div className="flex items-end gap-2 mt-2">
                    <strong className="text-3xl font-mono font-black text-emerald-300">%{stats.hitRate}</strong>
                    <span className="text-[10px] font-mono text-zinc-400 pb-1">
                      isabet · {stats.tested} ölçülmüş tavsiye
                    </span>
                  </div>
                  <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1.5">
                    Oran yalnızca gerçekten UYGULANMIŞ tavsiyelerden hesaplanıyor.
                    Denenmemiş {stats.notApplied} tavsiye bu sayının dışında.
                  </p>
                </>
              )}

              <div className="grid grid-cols-4 gap-1.5 mt-3.5">
                {[
                  { l: 'işe yaradı', v: stats.worked, c: 'text-emerald-400' },
                  { l: 'fark etmedi', v: stats.flat, c: 'text-zinc-400' },
                  { l: 'ters gitti', v: stats.backfired, c: 'text-red-400' },
                  { l: 'denenmedi', v: stats.notApplied, c: 'text-zinc-600' },
                ].map(k => (
                  <div key={k.l} className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl py-2 text-center">
                    <strong className={`text-[13px] font-mono font-bold block ${k.c}`}>{k.v}</strong>
                    <span className="text-[8px] font-mono text-zinc-500">{k.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {due.length > 0 && (
              <button
                type="button"
                onClick={onSettle}
                className="w-full rounded-2xl border border-cyan-800/60 bg-cyan-950/30 p-3.5 text-left active:bg-cyan-950/50 shadow-md shadow-cyan-950/20 transition-all"
              >
                <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                  <Clock3 size={13} /> {due.length} tavsiyenin sonucu ölçülmeye hazır
                </span>
                <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1">
                  {LEDGER_REVIEW_DAYS} gün doldu. Dokun, uygulama şu anki hacim ve
                  1RM değerlerini alıp karşılaştırsın.
                </p>
              </button>
            )}

            {acik.length > 0 && (
              <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur-sm">
                <div className="px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-950/60">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Ölçüm Bekleyen ({acik.length})
                  </span>
                </div>
                <div className="divide-y divide-zinc-800/70">
                  {acik.map(e => (
                    <div key={e.id} className="px-4 py-2.5">
                      <span className="text-[11px] font-bold text-zinc-200 block truncate">{e.title || e.key}</span>
                      <span className="text-[9px] font-mono text-zinc-500 block mt-0.5">
                        {formatDay(e.decidedAt)} uygulandı · {formatDay(e.reviewOn)} ölçülecek
                        {e.compliance && ` · başlangıç ${e.compliance.baseline} ${e.compliance.label}`}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {kapali.length > 0 && (
              <section className="space-y-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">
                  Ölçülmüş ({kapali.length})
                </span>
                {kapali.map(e => (
                  <div key={e.id} className={`rounded-2xl border p-3.5 backdrop-blur-sm ${VERDICT_STYLE[e.outcome.verdict]}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-bold text-zinc-200 min-w-0 truncate">{e.title || e.key}</span>
                      <span className="text-[9px] font-mono text-zinc-400 shrink-0 flex items-center gap-1">
                        {VERDICT_ICON[e.outcome.verdict]}
                        {LEDGER_VERDICTS[e.outcome.verdict]?.label}
                      </span>
                    </div>
                    <p className="text-[9px] font-mono text-zinc-400 leading-relaxed mt-1">{describeEntry(e)}</p>
                  </div>
                ))}
              </section>
            )}

            {olculemez.length > 0 && (
              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
                {olculemez.length} tavsiye uygulandı ama ölçülemiyor
                ({olculemez.map(e => e.title || e.key).join(', ')}). Her tavsiyenin
                sayısal bir karşılığı yok — "uyku puanını gir" tavsiyesinin 1RM
                karşılığı olmadığı halde bir sayı uydurmak defterin tamamına olan
                güveni bitirirdi. Bunlar isabet oranına girmiyor.
              </p>
            )}

            {red.length > 0 && (
              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
                {red.length} tavsiye uygulanmadan kapatıldı. Bunlar ölçüme
                girmiyor ama defterde duruyorlar: koçun neyi tekrar tekrar
                önerdiğini ve senin neyi tekrar tekrar reddettiğini görmek de
                bir bilgi.
              </p>
            )}
          </>
        )}

        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
          Ölçüm penceresi {LEDGER_REVIEW_DAYS} gün: daha kısası antrenman
          gürültüsünü sonuç sanmak, daha uzunu tavsiyenin etkisini araya giren
          on başka değişikliğe karıştırmak olurdu. Uygulama ve sonuç ayrı
          ölçülüyor — yapılmamış bir tavsiye başarısız değil, denenmemiştir.
        </p>
      </div>
    </div>
  </div>
  );
});

CoachLedgerModal.displayName = 'CoachLedgerModal';

export default CoachLedgerModal;
