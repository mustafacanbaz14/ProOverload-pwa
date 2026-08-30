import React, { memo, useState } from 'react';
import {
  CalendarCheck2, ChevronRight, Clock3, Dumbbell, Gauge, Route,
  ShieldCheck, SlidersHorizontal, Target,
} from 'lucide-react';
import { formatDay } from '../utils/dates';

const pctText = (value) => value === null || value === undefined ? '—' : `%${value}`;

const toneForPercent = (value) => {
  if (value === null || value === undefined) return 'text-zinc-500';
  if (value >= 85) return 'text-emerald-400';
  if (value >= 70) return 'text-cyan-400';
  if (value >= 50) return 'text-amber-400';
  return 'text-red-400';
};

const Metric = ({ icon, label, value, detail }) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 min-w-0">
    <div className="flex items-center gap-1.5 text-zinc-400">
      {icon}
      <span className="text-[8px] font-mono uppercase tracking-wide truncate">{label}</span>
    </div>
    <strong className={`mt-1 block text-base font-mono ${toneForPercent(typeof value === 'number' ? value : null)}`}>
      {typeof value === 'number' ? `%${value}` : value}
    </strong>
    {detail && <span className="mt-0.5 block text-[8px] font-mono text-zinc-400 truncate">{detail}</span>}
  </div>
);

const PlanExecutionCard = memo(({ report, onOpenPlan }) => {
  const [panel, setPanel] = useState('overview');
  const [showAllMuscles, setShowAllMuscles] = useState(false);

  if (!report?.hasPlan) {
    return (
      <div className="rounded-2xl border border-violet-900/40 bg-gradient-to-br from-violet-950/25 to-zinc-900 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarCheck2 size={15} className="text-violet-400" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-200">Plan Gerçekleşme Merkezi</h4>
        </div>
        <p className="text-[10px] font-mono leading-relaxed text-zinc-500">
          Planlanan ile yapılanı karşılaştırmak için aktif haftalık program gerekiyor.
        </p>
        <button type="button" onClick={onOpenPlan} className="w-full rounded-xl border border-violet-800/50 bg-violet-950/30 py-2.5 text-[10px] font-bold text-violet-300">
          Haftalık Programı Aç
        </button>
      </div>
    );
  }

  const scoreLabel = report.score === null ? '—' : report.score;
  const current = report.currentWeek;
  const muscleRows = showAllMuscles ? report.muscles : report.muscles.slice(0, 6);

  return (
    <div className="overflow-hidden rounded-2xl border border-violet-900/45 bg-zinc-900">
      <div className="border-b border-zinc-800 bg-gradient-to-br from-violet-950/35 to-zinc-950 px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-violet-400">
              <Gauge size={12} /> Plan Gerçekleşme Merkezi
            </span>
            <h4 className="mt-1 text-sm font-black text-zinc-100">
              {report.hasData ? report.zone.label : 'Ölçüm birikiyor'}
            </h4>
            <p className="mt-0.5 text-[9px] font-mono text-zinc-500">
              {report.measuredWeeks} tam hafta · {report.snapshotSessions} anlık plan kaydı · güven %{report.confidence}
            </p>
          </div>
          <div className="min-w-[62px] rounded-2xl border border-violet-800/50 bg-black/40 px-3 py-2 text-center">
            <strong className={`block text-2xl font-mono ${report.zone.tone}`}>{scoreLabel}</strong>
            <span className="text-[8px] font-mono text-zinc-400">/100</span>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
          <div className={`h-full rounded-full ${report.zone.bar}`} style={{ width: `${report.score || 0}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 border-b border-zinc-800 bg-zinc-950/50 p-1.5">
        {[
          { key: 'overview', label: 'Özet' },
          { key: 'weeks', label: 'Haftalar' },
          { key: 'templates', label: 'Şablonlar' },
        ].map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => setPanel(item.key)}
            className={`rounded-xl py-2 text-[9px] font-bold uppercase ${panel === item.key ? 'bg-violet-600 text-white' : 'text-zinc-500'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {panel === 'overview' && (
        <div className="space-y-3 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Metric icon={<Target size={11} />} label="Planlı set" value={report.setPercent} detail="anlık şablondan" />
            <Metric icon={<Dumbbell size={11} />} label="Hareket" value={report.exercisePercent} detail="planlı hareketler" />
            <Metric icon={<Route size={11} />} label="Gün düzeni" value={report.scheduleAccuracy} detail={report.averageDrift === null ? 'veri yok' : `ort. ${report.averageDrift} gün kayma`} />
            <Metric icon={<Clock3 size={11} />} label="Süre tahmini" value={report.durationAccuracy} detail="tahmin doğruluğu" />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-300">Bu hafta</span>
                <p className="mt-0.5 text-[9px] font-mono text-zinc-400">
                  {current?.matched || 0}/{current?.expected || report.plannedPerWeek} eşleşen seans
                </p>
              </div>
              <strong className={toneForPercent(current?.rate !== undefined ? Math.round(current.rate * 100) : null)}>
                {current ? `%${Math.round(current.rate * 100)}` : '—'}
              </strong>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full border border-zinc-800 bg-black">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.round((current?.rate || 0) * 100)}%` }} />
            </div>
            {report.unplannedSessions > 0 && (
              <p className="mt-2 text-[9px] font-mono text-cyan-400/80">
                Son pencerede {report.unplannedSessions} plansız/başka plana ait seans ayrıca tutuldu; uyum puanına gizlice eklenmedi.
              </p>
            )}
          </div>

          {(report.simplification || report.catchup) && (
            <div className={`rounded-xl border p-3 ${report.simplification || report.catchup?.tone === 'warn' ? 'border-amber-900/50 bg-amber-950/15' : 'border-cyan-900/50 bg-cyan-950/15'}`}>
              <div className="flex items-start gap-2">
                <SlidersHorizontal size={13} className={`mt-0.5 shrink-0 ${report.simplification || report.catchup?.tone === 'warn' ? 'text-amber-400' : 'text-cyan-400'}`} />
                <div>
                  <strong className="block text-[10px] text-zinc-200">{report.simplification?.title || report.catchup?.title}</strong>
                  <p className="mt-1 text-[9px] font-mono leading-relaxed text-zinc-500">
                    {report.simplification?.detail || report.catchup?.detail}
                  </p>
                </div>
              </div>
            </div>
          )}

          {report.muscles.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
              <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-300">Kas hacmi teslimi</span>
                <span className="text-[8px] font-mono text-zinc-400">gerçek / plan</span>
              </div>
              <div className="divide-y divide-zinc-800/70">
                {muscleRows.map(row => (
                  <div key={row.muscle} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2">
                    <span className="truncate text-[10px] font-bold text-zinc-300">{row.muscle}</span>
                    <span className="text-[9px] font-mono text-zinc-500">{row.actual}/{row.planned}</span>
                    <span className={`w-10 text-right text-[9px] font-mono ${row.status === 'on' ? 'text-emerald-400' : row.status === 'under' ? 'text-amber-400' : 'text-cyan-400'}`}>%{row.percent}</span>
                  </div>
                ))}
              </div>
              {report.muscles.length > 6 && (
                <button type="button" onClick={() => setShowAllMuscles(value => !value)} className="w-full border-t border-zinc-800 py-2 text-[9px] font-bold text-violet-400">
                  {showAllMuscles ? 'Daha Az Göster' : `${report.muscles.length - 6} Kas Daha`}
                </button>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">Son ölçülen seanslar</span>
            {report.sessions.length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-[9px] font-mono text-zinc-400">
                Yeni başlayan seanslarda plan anlık görüntüsü kaydedilir. En az iki kayıt sonrası skor açılır.
              </p>
            ) : report.sessions.slice(0, 4).map(session => (
              <div key={session.id || `${session.date}-${session.name}`} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                <div className="min-w-0">
                  <strong className="block truncate text-[10px] text-zinc-300">{session.name}</strong>
                  <span className="text-[8px] font-mono text-zinc-400">{formatDay(session.date)}</span>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`block text-[10px] font-mono ${toneForPercent(session.setPercent)}`}>%{session.setPercent}</span>
                  <span className="text-[8px] font-mono text-zinc-400">{session.drift === null ? 'gün ?' : session.drift === 0 ? 'plan gününde' : `${session.drift} gün kaydı`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {panel === 'weeks' && (
        <div className="divide-y divide-zinc-800/70">
          {report.weeks.map(week => (
            <div key={week.key} className="px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <strong className="text-[10px] text-zinc-300">{week.label}</strong>
                  {week.current && <span className="ml-1.5 text-[8px] font-mono text-violet-400">devam ediyor</span>}
                </div>
                <span className={`text-[10px] font-mono ${toneForPercent(Math.round(week.rate * 100))}`}>{week.matched}/{week.expected}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.round(week.rate * 100)}%` }} />
                </div>
                <span className="w-[68px] text-right text-[8px] font-mono text-zinc-400">
                  {week.setPercent === null ? 'set verisi yok' : `set %${week.setPercent}`}
                </span>
              </div>
              {week.unplanned > 0 && <p className="mt-1 text-[8px] font-mono text-cyan-500">+{week.unplanned} plansız/ek seans</p>}
            </div>
          ))}
        </div>
      )}

      {panel === 'templates' && (
        <div className="divide-y divide-zinc-800/70">
          {report.templates.map(template => (
            <div key={template.templateId} className="px-3.5 py-3 space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <strong className="truncate text-[10px] text-zinc-300">{template.name}</strong>
                <span className={`shrink-0 text-[10px] font-mono ${toneForPercent(template.attendancePercent)}`}>{pctText(template.attendancePercent)}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[8px] font-mono text-zinc-400">
                <span>{template.done}/{template.expected} seans</span>
                <span>set {pctText(template.setPercent)}</span>
                <span className="text-right">{template.averageDrift === null ? 'gün —' : `${template.averageDrift}g kayma`}</span>
              </div>
              {(template.averageMinutes || template.plannedMinutes) && (
                <p className="text-[8px] font-mono text-zinc-400">
                  Süre: gerçekleşen {template.averageMinutes || '—'} dk · plan {template.plannedMinutes || '—'} dk
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-zinc-800 bg-zinc-950/60 px-4 py-3">
        <div className="flex items-start gap-2">
          <ShieldCheck size={11} className="mt-0.5 shrink-0 text-zinc-400" />
          <p className="text-[8px] font-mono leading-relaxed text-zinc-400">{report.caveat}</p>
        </div>
        <button type="button" onClick={onOpenPlan} className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-zinc-800 py-2 text-[9px] font-bold text-violet-400">
          Haftalık Programı Düzenle <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
});

PlanExecutionCard.displayName = 'PlanExecutionCard';

export default PlanExecutionCard;
