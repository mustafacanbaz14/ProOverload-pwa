import React, { useState, useMemo, memo } from 'react';
import {
  X, Activity, Plus, Trash2, TrendingDown, TrendingUp, Minus, AlertTriangle, ChevronDown,
} from 'lucide-react';
import {
  PAIN_REGIONS, buildPainReport, painEntry, upsertPainEntry, removePainEntry,
} from '../utils/painLog';
import { formatDay } from '../utils/dates';

/**
 * Eklem ağrısı takibi.
 *
 * Kayıt girişi bilerek çok kısa: bölge + 1-10 kaydırıcı. Ne kadar alan varsa
 * o kadar az doldurulur ve doldurulmayan bir günlüğün hiçbir değeri yok.
 * Hareket ve not isteğe bağlı, katlanmış duruyor.
 */

const TREND = {
  improving: { icon: TrendingDown, color: 'text-emerald-400', label: 'Azalıyor' },
  worsening: { icon: TrendingUp, color: 'text-red-400', label: 'Artıyor' },
  flat: { icon: Minus, color: 'text-zinc-500', label: 'Sabit' },
  unknown: { icon: Minus, color: 'text-zinc-600', label: 'Yeni' },
};

const severityColor = (n) => (n >= 7 ? 'text-red-400' : n >= 5 ? 'text-amber-400' : 'text-zinc-300');

const PainLogModal = memo(({
  isOpen,
  onClose,
  log = [],
  onChange,
  workouts = [],
  exerciseNames = [],
  today,
}) => {
  const [region, setRegion] = useState('');
  const [severity, setSeverity] = useState(5);
  const [note, setNote] = useState('');
  const [exercise, setExercise] = useState('');
  const [detay, setDetay] = useState(false);
  const [openRegion, setOpenRegion] = useState(null);

  const rapor = useMemo(
    () => (isOpen ? buildPainReport(log, { workouts, today: today ? new Date(`${today}T12:00:00`) : new Date() }) : null),
    [isOpen, log, workouts, today]);

  if (!isOpen) return null;

  const kaydet = () => {
    if (!region) return;
    onChange(upsertPainEntry(log, painEntry({ date: today, region, severity, note, exercise })));
    setNote('');
    setExercise('');
    setDetay(false);
    setRegion('');
    setSeverity(5);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[92] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Activity size={15} className="mr-2 text-red-400" /> Ağrı Takibi
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">

        <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
          Hazır oluşluk formu seans başına tek bir eklem ağrısı puanı alıyor ve o
          puan seansın hesabına girip kayboluyor. Burası bölgeyi ve zamanı
          tutuyor — asıl bilgi tek bir puanda değil, örüntüde.
        </p>

        {/* Yeni kayıt */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
            <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Bugün</h4>
            <span className="text-[9px] font-mono text-zinc-600">{formatDay(today, 'short', { weekday: true })}</span>
          </div>
          <div className="p-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {PAIN_REGIONS.map(b => (
                <button
                  key={b.key}
                  onClick={() => setRegion(region === b.key ? '' : b.key)}
                  title={b.hint}
                  aria-pressed={region === b.key}
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${region === b.key ? 'border-red-600 bg-red-950/30 text-red-300' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            {region && (
              <>
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] font-mono text-zinc-500">Şiddet</span>
                    <strong className={`text-sm font-mono ${severityColor(severity)}`}>{severity}/10</strong>
                  </div>
                  <input
                    type="range" min="1" max="10" step="1"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full accent-red-500"
                    aria-label="Ağrı şiddeti"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-zinc-600">
                    <span>Hafif</span><span>Şiddetli</span>
                  </div>
                </div>

                <button
                  onClick={() => setDetay(v => !v)}
                  className="text-[10px] font-mono text-zinc-500 active:text-zinc-300 flex items-center gap-1"
                >
                  <ChevronDown size={11} className={detay ? 'rotate-180' : ''} /> Hareket ve not (isteğe bağlı)
                </button>

                {detay && (
                  <div className="space-y-2">
                    <select
                      value={exercise}
                      onChange={(e) => setExercise(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 text-[11px] font-mono outline-none focus:border-red-500"
                      aria-label="Ağrıyı tetikleyen hareket"
                    >
                      <option value="">— hareket seçme —</option>
                      {exerciseNames.map(ad => <option key={ad} value={ad}>{ad}</option>)}
                    </select>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Not: ne zaman, hangi açıda"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 text-[11px] font-mono outline-none focus:border-red-500"
                    />
                  </div>
                )}

                <button
                  onClick={kaydet}
                  className="w-full bg-red-600 active:bg-red-700 text-white font-bold py-3 rounded-xl uppercase text-[11px] tracking-wider flex items-center justify-center gap-2"
                >
                  <Plus size={15} /> Kaydet
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bölge raporu */}
        {rapor?.hasData ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
              <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Son {rapor.windowDays} Gün</h4>
              <span className="text-[9px] font-mono text-zinc-600">{rapor.regions.length} bölge</span>
            </div>
            <div className="divide-y divide-zinc-800/70">
              {rapor.regions.map(r => {
                const acik = openRegion === r.region;
                const T = TREND[r.trend] || TREND.unknown;
                const Icon = T.icon;
                return (
                  <div key={r.region}>
                    <button
                      onClick={() => setOpenRegion(acik ? null : r.region)}
                      aria-expanded={acik}
                      className="w-full px-4 py-2.5 flex justify-between items-center gap-2 text-left active:bg-zinc-800/50 transition-colors"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <ChevronDown size={11} className={`text-zinc-600 shrink-0 ${acik ? 'rotate-180' : ''}`} />
                        <strong className="text-[11px] text-zinc-200 truncate">{r.label}</strong>
                        {r.persistent && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded border border-red-900/50 bg-red-950/25 text-red-400 shrink-0">
                            sürüyor
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
                        <Icon size={11} className={T.color} />
                        <strong className={severityColor(r.average)}>{r.average}</strong>
                        <span className="text-zinc-600">/10 · {r.count} kayıt</span>
                      </span>
                    </button>

                    {acik && (
                      <div className="px-4 pb-3 pt-0.5 space-y-2 bg-zinc-950/50">
                        <p className="text-[9px] font-mono text-zinc-500">
                          Trend: <span className={T.color}>{T.label}</span> · en yüksek {r.peak}/10 · son kayıt {r.latestLabel}
                        </p>

                        {r.suspects.length > 0 && (
                          <div>
                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block mb-1">
                              Ağrılı günlerde en sık yapılanlar
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {r.suspects.map(s => (
                                <span key={s.name} className="text-[9px] font-bold px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400">
                                  {s.name}
                                </span>
                              ))}
                            </div>
                            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed mt-1.5">
                              Bu bir NEDEN listesi değil, sadece birlikte görülme sayısı.
                              Ağrısız bir varyantla değiştirip bir blok izlemek, tahmin
                              yürütmekten daha hızlı sonuç verir.
                            </p>
                          </div>
                        )}

                        <div className="space-y-1">
                          {r.entries.slice(0, 8).map(e => (
                            <div key={`${e.date}-${e.region}`} className="flex justify-between items-baseline gap-2 text-[10px] font-mono">
                              <span className="text-zinc-500 truncate min-w-0">
                                {formatDay(e.date, 'short', { weekday: true })}
                                {e.exercise && <span className="text-zinc-600"> · {e.exercise}</span>}
                                {e.note && <span className="text-zinc-600"> · {e.note}</span>}
                              </span>
                              <span className="shrink-0 flex items-center gap-1.5">
                                <strong className={severityColor(e.severity)}>{e.severity}</strong>
                                <button
                                  onClick={() => onChange(removePainEntry(log, e.date, e.region))}
                                  aria-label="Kaydı sil"
                                  className="text-zinc-700 active:text-red-500"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <p className="text-[10px] font-mono text-zinc-600 leading-relaxed">
              Henüz kayıt yok. Bir şey ağrıdığında bölgesini ve şiddetini gir;
              üç kayıttan sonra trend ve hareket ilişkisi görünmeye başlar.
            </p>
          </div>
        )}

        <div className="bg-amber-950/15 border border-amber-900/30 rounded-2xl p-3.5 flex items-start gap-2.5">
          <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[9px] font-mono text-amber-200/80 leading-relaxed">
            Bu bir günlük, teşhis aracı değil. Eklem ağrısı kas ağrısıyla aynı
            sinyal değildir: kas ağrısı geçer, eklem ağrısı yüklenmeye devam
            edilirse büyür. Ağrı sürüyor, uyku bölüyor ya da hareket aralığını
            kısıtlıyorsa değerlendirme al.
          </p>
        </div>
      </div>
    </div>
  );
});

PainLogModal.displayName = 'PainLogModal';

export default PainLogModal;
