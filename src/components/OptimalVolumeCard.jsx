import React, { memo, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CalendarRange, ChevronDown, ChevronUp, Target } from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'under', label: 'Eksik' },
  { key: 'over', label: 'Fazla' },
  { key: 'personal', label: 'Kişisel' },
];

const statusStyle = {
  aligned: 'text-emerald-300 border-emerald-900/50 bg-emerald-950/15',
  under: 'text-amber-300 border-amber-900/50 bg-amber-950/15',
  over: 'text-red-300 border-red-900/50 bg-red-950/15',
  unplanned: 'text-zinc-400 border-zinc-800 bg-zinc-950',
};

const statusLabel = { aligned: 'Bantta', under: 'Altında', over: 'Üstünde', unplanned: 'Plansız' };

const OptimalVolumeCard = memo(({ profile, onOpenPlan, onOpenTargets }) => {
  const [filter, setFilter] = useState('all');
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [methodOpen, setMethodOpen] = useState(false);

  const rows = useMemo(() => {
    const planned = profile?.plannedRows || [];
    if (filter === 'personal') return planned.filter(row => row.personalized);
    if (filter === 'under' || filter === 'over') return planned.filter(row => row.status === filter);
    return planned;
  }, [profile, filter]);

  if (!profile) return null;
  const selected = profile.rows.find(row => row.muscle === selectedMuscle)
    || rows[0]
    || profile.rows[0];

  return (
    <section className="rounded-2xl border border-violet-900/45 bg-gradient-to-br from-violet-950/20 via-zinc-900 to-zinc-900 overflow-hidden">
      <div className="px-3 py-3 border-b border-zinc-800/80 flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-violet-400 flex items-center gap-1.5"><BarChart3 size={10} /> Optimal Hacim Laboratuvarı</span>
          <strong className="text-[12px] text-zinc-100 block mt-1">Aktif planın kişisel çalışma bandıyla karşılaştırması</strong>
          <span className="text-[8px] font-mono text-zinc-400 block mt-1">{profile.personalized} kas kişiselleşti · ortalama güven %{profile.averageConfidence}</span>
        </span>
        <span className="rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-center shrink-0">
          <strong className="text-sm font-mono text-emerald-300 block">{profile.summary.aligned}/{profile.summary.planned}</strong>
          <span className="text-[7px] font-bold text-zinc-400">BANTTA</span>
        </span>
      </div>

      {!profile.hasPlan ? (
        <div className="p-3 space-y-2">
          <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">Karşılaştırma için aktif haftalık program gerekiyor. Kişisel aralıklar kayıt biriktikçe hazırlanır; plansız kaslara alarm verilmez.</p>
          <button type="button" onClick={onOpenPlan} className="w-full rounded-xl border border-violet-800/60 bg-violet-950/25 py-2 text-[9px] font-bold text-violet-200">Haftalık Programı Aç</button>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/15 py-2 text-center"><strong className="text-sm font-mono text-emerald-300 block">{profile.summary.aligned}</strong><span className="text-[7px] font-bold text-zinc-400">BANTTA</span></div>
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 py-2 text-center"><strong className="text-sm font-mono text-amber-300 block">{profile.summary.under}</strong><span className="text-[7px] font-bold text-zinc-400">EKSİK</span></div>
            <div className="rounded-xl border border-red-900/40 bg-red-950/15 py-2 text-center"><strong className="text-sm font-mono text-red-300 block">{profile.summary.lowValueSets}</strong><span className="text-[7px] font-bold text-zinc-400">FAZLA ADAYI</span></div>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {FILTERS.map(item => (
              <button type="button" key={item.key} onClick={() => setFilter(item.key)} className={`rounded-lg border py-1.5 text-[8px] font-bold ${filter === item.key ? 'border-violet-500 bg-violet-950/35 text-violet-200' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}>{item.label}</button>
            ))}
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto hide-scrollbar">
            {rows.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-[9px] font-mono text-zinc-400 text-center">Bu süzgeçte kas yok.</p>
            ) : rows.map(row => (
              <button
                type="button"
                key={row.muscle}
                onClick={() => setSelectedMuscle(row.muscle)}
                className={`w-full rounded-xl border px-2.5 py-2 text-left ${selected?.muscle === row.muscle ? 'border-violet-600 bg-violet-950/20' : 'border-zinc-800 bg-zinc-950'}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <strong className="text-[10px] text-zinc-200 truncate">{row.muscle}</strong>
                  <span className={`rounded border px-1.5 py-0.5 text-[7px] font-bold ${statusStyle[row.status]}`}>{statusLabel[row.status]}</span>
                </span>
                <span className="flex items-baseline justify-between gap-2 mt-1 text-[8px] font-mono">
                  <span className="text-zinc-500">plan {row.planned} · hedef {row.targetLow}–{row.targetHigh}</span>
                  <span className={row.personalized ? 'text-violet-300' : 'text-zinc-500'}>{row.personalized ? `kişisel %${row.confidence}` : 'referans'}</span>
                </span>
              </button>
            ))}
          </div>

          {selected && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="p-3 border-b border-zinc-800/80">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[11px] text-zinc-200">{selected.muscle}</strong>
                  <span className="text-[8px] font-mono text-zinc-400">{selected.source}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden relative">
                  <div className="h-full bg-violet-500/80 rounded-full" style={{ width: `${Math.min(100, selected.planned / Math.max(1, selected.base.mrv) * 100)}%` }} />
                </div>
                <div className="flex justify-between mt-1 text-[8px] font-mono text-zinc-400"><span>plan {selected.planned}</span><span>bant {selected.targetLow}–{selected.targetHigh}</span><span>tavan {selected.base.mrv}</span></div>
              </div>

              <div className="p-3 space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 text-center"><strong className="text-[10px] font-mono text-zinc-300 block">{selected.weeks}</strong><span className="text-[7px] text-zinc-400">kayıtlı hafta</span></div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 text-center"><strong className="text-[10px] font-mono text-zinc-300 block">{selected.evaluatedWeeks}</strong><span className="text-[7px] text-zinc-400">ölçülebilir</span></div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 text-center"><strong className="text-[10px] font-mono text-zinc-300 block">%{selected.confidence}</strong><span className="text-[7px] text-zinc-400">güven</span></div>
                </div>

                {selected.lowValueCandidate > 0 && (
                  <p className="rounded-lg border border-red-900/40 bg-red-950/15 p-2 text-[8px] font-mono text-red-200/85 leading-relaxed flex gap-1.5"><AlertTriangle size={9} className="shrink-0 mt-0.5" /> {selected.lowValueCandidate} set “düşük getirili hacim adayı”. Zararlı olduğu kanıtlanmış değildir; azaltma deneyi için ilk adaydır.</p>
                )}

                <p className="text-[8px] font-mono text-zinc-500 leading-relaxed">{selected.recoveryAdjustment.label}. Bu ayar yalnız kapasite verisi güveni %60+ olduğunda uygulanır.</p>

                <div>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1 mb-1.5"><CalendarRange size={9} /> 4 haftalık deneme rampası</span>
                  <div className="grid grid-cols-4 gap-1">
                    {selected.ramp.map(week => (
                      <div key={week.week} title={week.rule} className="rounded-lg border border-zinc-800 bg-zinc-900 py-2 text-center">
                        <span className="text-[7px] text-zinc-400 block">H{week.week}</span>
                        <strong className="text-[11px] font-mono text-violet-300 block">{week.sets}</strong>
                        <span className="text-[6px] text-zinc-500 block truncate px-0.5">{week.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={onOpenPlan} className="rounded-xl border border-violet-800/60 bg-violet-950/25 py-2 text-[8px] font-bold text-violet-200">Programı Düzenle</button>
            <button type="button" onClick={onOpenTargets} className="rounded-xl border border-zinc-800 bg-zinc-950 py-2 text-[8px] font-bold text-zinc-400">Hacim Hedefleri</button>
          </div>

          <button type="button" onClick={() => setMethodOpen(value => !value)} aria-expanded={methodOpen} className="w-full flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-[8px] font-bold text-zinc-500">
            <span className="flex items-center gap-1.5"><Target size={9} /> Bu aralık nasıl hesaplandı?</span>
            {methodOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {methodOpen && (
            <p className="text-[8px] font-mono text-zinc-400 leading-relaxed px-1">Başlangıç MEV–MAV aralığı; performansın korunduğu tamamlanmış haftaların ortanca ve çeyreklerinden, veri güveni oranında kişiselleştirilir. Eksik hafta başarısız sayılmaz. Toparlanma güçlü/zayıf olsa bile geçici ayar en fazla +1/−2 settir. Bu gözlemsel karar desteğidir; kas büyümesini doğrudan ölçmez.</p>
          )}
        </div>
      )}
    </section>
  );
});

OptimalVolumeCard.displayName = 'OptimalVolumeCard';

export default OptimalVolumeCard;
