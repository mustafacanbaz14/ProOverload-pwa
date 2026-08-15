import React, { useState, useMemo, memo } from 'react';
import {
  X, ClipboardCheck, ChevronLeft, ChevronRight, Layers, Dumbbell,
  Moon, BrainCircuit, Flame, CalendarCheck,
} from 'lucide-react';
import { buildWeeklyReview, lastCompletedWeekStart } from '../utils/weeklyReview';
import { weekBounds, dayKey } from '../utils/dates';

const TONE = {
  warn: 'border-amber-900/50 bg-amber-950/20 text-amber-300',
  info: 'border-cyan-900/50 bg-cyan-950/20 text-cyan-300',
  good: 'border-emerald-900/50 bg-emerald-950/20 text-emerald-300',
};

const Stat = ({ icon, value, label, sub }) => (
  <div className="bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-2 text-center min-w-0">
    <div className="flex justify-center mb-1">{icon}</div>
    <span className="text-sm font-mono font-bold text-zinc-100 block truncate">{value}</span>
    <span className="text-[9px] font-mono text-zinc-500 block truncate">{label}</span>
    {sub && <span className="text-[8px] font-mono text-zinc-600 block truncate">{sub}</span>}
  </div>
);

/**
 * Haftalık gözden geçirme.
 *
 * Günlük koç "bugün ne yapmalıyım"ı cevaplıyor; hacim artır/azalt, deload ve
 * kalori ayarı gibi kararlar ise haftalık ölçekte alınıyor. Varsayılan görünüm
 * GEÇEN tam hafta — içinde bulunulan hafta bitmediği için "hacim eksik" demek
 * yanıltıcı olur; kullanıcı isterse oklarla o haftaya da bakabiliyor.
 */
const WeeklyReviewModal = memo(({ isOpen, onClose, ...data }) => {
  const [weekStart, setWeekStart] = useState(() => lastCompletedWeekStart());

  const review = useMemo(
    () => buildWeeklyReview({ ...data, weekStart }),
    [data, weekStart]);

  if (!isOpen || !review) return null;

  const kaydir = (yon) => {
    const d = weekBounds(weekStart).start;
    d.setDate(d.getDate() + yon * 7);
    setWeekStart(dayKey(d));
  };
  // İçinde bulunulan haftadan ileriye gidilemez: henüz veri yok.
  const ileriKapali = weekStart >= weekBounds(dayKey(new Date())).startKey;

  const { training, volume, recovery, energy } = review;

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[94] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <ClipboardCheck size={15} className="mr-2 text-emerald-400" /> Haftalık Gözden Geçirme
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="px-3 py-2.5 border-b border-zinc-800 bg-zinc-950 shrink-0 flex items-center justify-between gap-2">
        <button onClick={() => kaydir(-1)} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 active:text-cyan-400" aria-label="Önceki hafta">
          <ChevronLeft size={14} />
        </button>
        <span className="text-[12px] font-bold text-zinc-200">{review.range}</span>
        <button
          onClick={() => kaydir(1)}
          disabled={ileriKapali}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 active:text-cyan-400 disabled:opacity-30"
          aria-label="Sonraki hafta"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">

        <div className="grid grid-cols-4 gap-2">
          <Stat
            icon={<CalendarCheck size={12} className="text-cyan-400" />}
            value={training.plannedDays > 0 ? `${training.days}/${training.plannedDays}` : training.days}
            label="gün"
            sub={training.plannedDays > 0 ? 'plan' : null}
          />
          <Stat
            icon={<Layers size={12} className="text-emerald-400" />}
            value={training.effectiveSets}
            label="etkili set"
            sub={training.previousEffectiveSets > 0
              ? `${training.effectiveSets - training.previousEffectiveSets >= 0 ? '+' : ''}${training.effectiveSets - training.previousEffectiveSets}`
              : null}
          />
          <Stat
            icon={<Moon size={12} className="text-indigo-400" />}
            value={recovery.sleepScore ?? '—'}
            label="uyku"
            sub={recovery.nights > 0 ? `${recovery.nights} gece` : null}
          />
          <Stat
            icon={<BrainCircuit size={12} className="text-amber-400" />}
            value={recovery.readiness ?? '—'}
            label="hazır oluş"
          />
        </div>

        {training.adaptedSessions > 0 && (
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-[9px] font-mono text-amber-300">Hazır oluşluğa göre uyarlanan seans</span>
            <strong className="text-[10px] font-mono text-amber-400">{training.adaptedSessions}{training.recoverySessions > 0 ? ` · ${training.recoverySessions} toparlanma` : ''}</strong>
          </div>
        )}

        {/* Bir sonraki hafta için ayarlar — ekranın asıl çıktısı bu */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
            Gelecek Hafta İçin
          </h4>
          {review.adjustments.map(a => (
            <div key={a.key} className={`rounded-2xl border p-3.5 ${TONE[a.tone] || TONE.info}`}>
              <span className="text-[11px] font-bold block mb-1">{a.title}</span>
              <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">{a.detail}</p>
            </div>
          ))}
        </div>

        {energy && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                <Flame size={12} className="mr-1.5 text-red-400" /> Kalori Dengesi
              </span>
              <span className="text-[9px] font-mono text-zinc-600">{energy.days}/7 gün</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-mono font-bold ${energy.balance < 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                {energy.balance > 0 ? '+' : ''}{energy.balance}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                kcal ≈ {energy.kg > 0 ? '+' : ''}{energy.kg} kg
              </span>
              {energy.partial && (
                <span className="text-[9px] font-mono text-amber-400 ml-auto">kısmi</span>
              )}
            </div>
          </div>
        )}

        {/* Kas kas hacim ve önceki haftaya göre değişim */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
            <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Hacim</h4>
            <span className="text-[9px] font-mono text-zinc-600">önceki haftaya göre</span>
          </div>
          {/* Hacmi sıfır ama önceki haftaya göre düşmüş kaslar da listeleniyor:
              "ne kaybedildi" bilgisi haftayı yorumlarken gerekli. Boş mesajı bu
              yüzden hacme değil, gerçekten satır kalmamasına bakıyor. */}
          <div className="divide-y divide-zinc-800/70">
            {volume.statuses.filter(s => s.volume > 0 || s.change !== 0).map(s => (
              <div key={s.muscle} className="px-4 py-2 flex justify-between items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-200 truncate">{s.muscle}</span>
                <span className="text-[10px] font-mono shrink-0">
                  <span className="text-zinc-100">{s.volume}</span>
                  <span className="text-zinc-600"> / MEV {s.mev}</span>
                  {s.change !== 0 && (
                    <span className={s.change > 0 ? 'text-emerald-400 ml-1.5' : 'text-amber-400 ml-1.5'}>
                      {s.change > 0 ? '+' : ''}{s.change}
                    </span>
                  )}
                </span>
              </div>
            ))}
            {volume.statuses.every(s => s.volume === 0 && s.change === 0) && (
              <p className="px-4 py-6 text-center text-[11px] font-mono text-zinc-600">
                Bu hafta ağırlık antrenmanı kaydı yok.
              </p>
            )}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex items-start gap-2.5">
          <Dumbbell size={13} className="text-zinc-600 shrink-0 mt-0.5" />
          <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
            Varsayılan görünüm geçen tam hafta; içinde bulunduğun hafta bitmeden
            hacmi eksik saymak yanıltıcı olurdu. Oklarla geçmiş haftalara
            bakabilirsin.
          </p>
        </div>
      </div>
    </div>
  );
});

WeeklyReviewModal.displayName = 'WeeklyReviewModal';

export default WeeklyReviewModal;
