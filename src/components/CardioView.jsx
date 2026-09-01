import React, { useState, useMemo, memo } from 'react';
import {
  HeartPulse, Plus, Target, Timer, Ruler, ChevronDown, Trash2, Activity, Gauge, Trophy, Bookmark, Play,
} from 'lucide-react';
import CardioCoachCard from './CardioCoachCard';
import { CARDIO_ACTIVITIES, CARDIO_SECTIONS, findActivity } from '../utils/cardio';
import {
  supportsDistance, entryPace, paceTrend, describeCardioEntry, ZONE_METHODS, effectiveZoneMethod, MAX_HR_TEST_HINT,
} from '../utils/cardioZones';
import {
  TARGET_FIELDS, emptyActivityTarget, setActivityTarget,
  targetedActivities, describeTarget,
} from '../utils/activityTargets';
import { describeCardioTemplate, templatesForActivity } from '../utils/cardioTemplates';
import { formatDay, formatDayRelative } from '../utils/dates';

/**
 * Kardiyo & Aktivite sekmesi.
 *
 * Kardiyo, analiz ekranındaki bir kartın içinde sıkışıyordu. Ağırlık
 * antrenmanının kendi ekranı varken kardiyonun olmaması, uygulamanın ona bir
 * ek özellik gibi davrandığı anlamına geliyordu.
 *
 * Sekme üç işi bir arada yapıyor: koçluk (hedef, dağılım, bugün ne yapmalı),
 * seans hedefleri (yüzmede 8 × 100 m gibi, unutmamak için) ve kayıt geçmişi
 * (tempo, bölge, kalori).
 */

const zoneMethodOptions = ZONE_METHODS;

const CardioView = memo(({
  report,
  suggestion,
  cardioGoal,
  onChangeCardioGoal,
  onOpenCardio,
  onEditEntry,
  onDeleteEntry,
  workouts = [],
  age = null,
  restingHr = '',
  zoneMethod = 'max',
  maxHrManual = '',
  restingHrReport = null,
  onLogRestingHr,
  cardioRecords = null,
  poolLength = 25,
  cardioTemplates = [],
  onApplyCardioTemplate,
  onDeleteCardioTemplate,
  onSaveCardioTemplate,
  onChangeZoneSettings,
  activityTargets = {},
  onChangeActivityTargets,
  interfaceMode = 'simple',
  embedded = false,
}) => {
  const [tab, setTab] = useState('coach');
  const [openTarget, setOpenTarget] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [restingDraft, setRestingDraft] = useState('');
  const [coachToolsOpen, setCoachToolsOpen] = useState(false);
  const [logInsightsOpen, setLogInsightsOpen] = useState(false);
  const simple = interfaceMode === 'simple';

  const zoneOpts = { age, restingHr, method: zoneMethod, maxHrManual };
  const gecerliYontem = effectiveZoneMethod(zoneOpts);

  const hedefli = useMemo(
    () => targetedActivities(activityTargets, workouts),
    [activityTargets, workouts]);

  // Şablonlar en çok kullanılan üstte; listenin başı en olası seçim olsun.
  const siraliSablonlar = useMemo(
    () => templatesForActivity(cardioTemplates).map(t => ({
      ...t, info: describeCardioTemplate(t, { poolLength }),
    })),
    [cardioTemplates, poolLength]);

  // Son kayıtlar: bölge, tempo ve kalori ile birlikte.
  const sonKayitlar = useMemo(() => {
    const liste = [];
    [...(workouts || [])]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .forEach(w => {
        (w.cardio || []).forEach(e => {
          liste.push({
            ...describeCardioEntry(e, zoneOpts),
            date: w.date,
            workoutId: w.id,
            pace: entryPace(e),
          });
        });
      });
    return liste.slice(0, 25);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workouts, age, restingHr, zoneMethod]);

  // Mesafeli aktiviteler için tempo eğilimi.
  const tempoEgilimleri = useMemo(() => {
    const turler = [...new Set(sonKayitlar.filter(k => k.pace).map(k => k.type))];
    return turler
      .map(t => ({ type: t, activity: findActivity(t), trend: paceTrend(workouts, t, zoneOpts) }))
      .filter(x => x.trend.hasData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sonKayitlar, workouts, age, restingHr, zoneMethod]);

  const hedefKaydet = (key, target) => {
    onChangeActivityTargets?.(setActivityTarget(activityTargets, key, target));
  };

  const tabOptions = [
    { key: 'coach', label: simple ? 'Bugün' : 'Koç', hint: 'Öneri ve hızlı kayıt', icon: HeartPulse },
    { key: 'targets', label: simple ? 'Plan' : 'Hedefler', hint: 'Süre ve mesafe hedefleri', icon: Target },
    { key: 'log', label: simple ? 'Geçmiş' : 'Kayıtlar', hint: 'Kayıt, tempo ve rekorlar', icon: Timer },
  ];
  const activeTab = tabOptions.find(option => option.key === tab) || tabOptions[0];

  return (
    <div className={`${embedded ? '' : 'luxury-screen'} h-full flex flex-col bg-black`}>
      <div className="px-4 pt-4 pb-2 shrink-0">
        <span className="luxury-eyebrow text-[10px] uppercase">Kardiyo & Aktivite</span>
        <div className="luxury-segmented grid grid-cols-3 bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800 shadow-inner mt-2">
          {tabOptions.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-pressed={tab === t.key}
                className={`min-h-12 rounded-xl text-[11px] font-bold flex justify-center items-center gap-1.5 transition-all ${
                  tab === t.key
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 px-1 text-[9px] font-mono text-zinc-400">{activeTab.hint}</p>
      </div>

      <div data-view-scroll="training" className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-nav">

        <button
          onClick={() => onOpenCardio?.()}
          className="w-full bg-gradient-to-r from-red-600 to-rose-600 active:scale-[0.98] text-white rounded-2xl p-3.5 flex items-center justify-center gap-2 font-black text-[12px] uppercase tracking-widest shadow-lg shadow-red-950/40 transition-all"
        >
          <Plus size={16} /> {simple ? 'Bugüne Aktivite Ekle' : 'Kardiyo / Aktivite Ekle'}
        </button>

        {tab === 'coach' && (
          <>
            <CardioCoachCard
              report={report}
              suggestion={suggestion}
              goal={cardioGoal}
              compact={simple}
              showZones={!simple || coachToolsOpen}
              onChangeGoal={onChangeCardioGoal}
              age={age}
              restingHr={restingHr}
              zoneMethod={zoneMethod}
              maxHrManual={maxHrManual}
              onOpenCardio={onOpenCardio}
            />

            {simple && (
              <button
                type="button"
                onClick={() => setCoachToolsOpen(open => !open)}
                aria-expanded={coachToolsOpen}
                className="w-full min-h-14 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center justify-between gap-3 text-left active:bg-zinc-800"
              >
                <span className="min-w-0">
                  <strong className="text-[11px] text-zinc-200 block">Nabız ve bölge ayarları</strong>
                  <span className="text-[9px] font-mono text-zinc-400 block truncate">
                    {zoneMethodOptions.find(method => method.key === gecerliYontem)?.label || 'Nabız yöntemi'}
                    {restingHrReport?.latest?.bpm ? ` · son ölçüm ${restingHrReport.latest.bpm} bpm` : ' · isteğe bağlı'}
                  </span>
                </span>
                <ChevronDown size={15} className={`text-zinc-400 shrink-0 transition-transform ${coachToolsOpen ? 'rotate-180' : ''}`} />
              </button>
            )}

            {(!simple || coachToolsOpen) && <>
            {/* Bölge yöntemi. Hedef koymadan da kullanılabilmesi için koç
                kartından bağımsız duruyor: kalori ve bölge bilgisi hedefe
                bağlı değil. */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60">
                <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
                  <Gauge size={12} className="mr-1.5 text-cyan-400" /> Bölge Hesabı
                </h4>
              </div>
              <div className="p-3 space-y-2.5">
                <div className="flex gap-1.5">
                  {zoneMethodOptions.map(m => {
                    const secili = zoneMethod === m.key;
                    return (
                      <button
                        key={m.key}
                        onClick={() => onChangeZoneSettings?.({ zoneMethod: m.key })}
                        title={m.hint}
                        aria-pressed={secili}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-colors ${secili ? 'border-cyan-600 bg-cyan-950/25 text-cyan-300' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
                <label className="block">
                  <span className="text-[9px] font-mono text-zinc-500 block mb-1">
                    Maksimum nabız (elle) — boşsa yaştan tahmin edilir
                  </span>
                  <input
                    type="number" inputMode="numeric" min="120" max="230"
                    value={maxHrManual}
                    onChange={(e) => onChangeZoneSettings?.({ maxHrManual: e.target.value })}
                    placeholder="örn. 194"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 text-[12px] font-mono text-center outline-none focus:border-red-500"
                  />
                  <span className="text-[9px] font-mono text-zinc-400 leading-relaxed block mt-1">{MAX_HR_TEST_HINT}</span>
                </label>

                <label className="block">
                  <span className="text-[9px] font-mono text-zinc-500 block mb-1">Dinlenme nabzı (Karvonen için gerekli)</span>
                  <input
                    type="number" inputMode="numeric" min="30" max="120"
                    value={restingHr}
                    onChange={(e) => onChangeZoneSettings?.({ restingHr: e.target.value })}
                    placeholder="örn. 58"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 text-[12px] font-mono text-center outline-none focus:border-cyan-500"
                  />
                </label>
                <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                  {zoneMethod === 'hrr' && gecerliYontem === 'max'
                    ? 'Karvonen seçili ama dinlenme nabzı yok; sınırlar şimdilik maksimum nabız yüzdesinden hesaplanıyor. Eksik veriyle yanlış bir sayı üretmektense bilinen yöntemi kullanmak doğru.'
                    : zoneMethodOptions.find(m => m.key === gecerliYontem)?.hint}
                  {' '}Dinlenme nabzı sabah yataktan kalkmadan ölçülür.
                </p>
              </div>
            </div>
            {/* Dinlenme nabzı takibi: uygulamanın toparlanma sinyalleri hep
                bildirilen ya da türetilen verilerdi; bu ÖLÇÜLEN bir sayı. */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
                <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
                  <HeartPulse size={12} className="mr-1.5 text-red-400" /> Sabah Dinlenme Nabzı
                </h4>
                {restingHrReport?.hasData && (
                  <span className="text-[9px] font-mono text-zinc-400">{restingHrReport.entries.length} ölçüm</span>
                )}
              </div>
              <div className="p-3 space-y-2.5">
                {restingHrReport?.hasData ? (
                  <>
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-[10px] font-bold text-zinc-300">
                        Son ölçüm <span className="text-zinc-400 font-mono">{restingHrReport.latest.label}</span>
                      </span>
                      <span className="text-[11px] font-mono">
                        <strong className={restingHrReport.status === 'sustainedHigh' || restingHrReport.status === 'high'
                          ? 'text-amber-400' : restingHrReport.status === 'low' ? 'text-emerald-400' : 'text-zinc-100'}>
                          {restingHrReport.latest.bpm}
                        </strong>
                        {restingHrReport.baseline !== null && (
                          <span className="text-zinc-400"> · taban {restingHrReport.baseline}
                            {restingHrReport.delta !== null && ` (${restingHrReport.delta > 0 ? '+' : ''}${restingHrReport.delta})`}
                          </span>
                        )}
                      </span>
                    </div>
                    {restingHrReport.baseline === null && (
                      <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                        Taban çizgisi için en az {restingHrReport.needed} ölçüm gerekiyor
                        ({restingHrReport.baselineCount} var). Taban kurulmadan tek bir
                        yüksek değer yorumlanmıyor — kahve, geç yemek ya da kötü uyku
                        da aynı sayıyı üretir.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                    Sabah yataktan kalkmadan ölçülen nabız, toparlanma borcunun en
                    erken göstergelerinden biri. Birkaç gün girince taban çizgisi
                    kurulur ve sapmalar yorumlanmaya başlar.
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="number" inputMode="numeric" min="25" max="140"
                    value={restingDraft}
                    onChange={(e) => setRestingDraft(e.target.value)}
                    placeholder="bugünkü ölçüm"
                    aria-label="Bugünkü dinlenme nabzı"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 text-[12px] font-mono text-center outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => { if (restingDraft) { onLogRestingHr?.(restingDraft); setRestingDraft(''); } }}
                    className="px-4 rounded-xl bg-red-600 active:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
            </>}
          </>
        )}

        {tab === 'targets' && (
          <>
            {simple ? (
              <p className="text-[10px] font-mono text-zinc-400 leading-relaxed px-1">
                Sık yaptığın aktiviteler için süre, mesafe veya set hedefi belirle.
              </p>
            ) : (
              <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
                Aktivite başına seans hedefi. Haftalık hedef &quot;ne kadar&quot; sorusunu
                yanıtlıyor ama seansın içini boş bırakıyor: havuza giderken akılda
                &quot;8 × 100 m&quot; gibi somut bir plan oluyor ve unutuluyor. Hepsi isteğe
                bağlı; boş bıraktığın alan hedef sayılmaz.
              </p>
            )}

            {hedefli.map(h => {
              const acik = openTarget === h.key;
              return (
                <div key={h.key} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenTarget(acik ? null : h.key)}
                    aria-expanded={acik}
                    className="w-full px-4 py-3 flex justify-between items-center gap-2 text-left active:bg-zinc-800/50"
                  >
                    <span className="min-w-0">
                      <strong className="text-[12px] text-zinc-100 block truncate">{h.activity.label}</strong>
                      <span className="text-[9px] font-mono text-cyan-400 block">{h.summary}</span>
                      {h.lastDate && (
                        <span className="text-[9px] font-mono text-zinc-400 block">
                          son: {formatDayRelative(h.lastDate, 'short')}
                        </span>
                      )}
                    </span>
                    <ChevronDown size={14} className={`text-zinc-400 shrink-0 ${acik ? 'rotate-180' : ''}`} />
                  </button>
                  {acik && (
                    <TargetEditor
                      activityKey={h.key}
                      value={h.target}
                      onSave={(t) => { hedefKaydet(h.key, t); setOpenTarget(null); }}
                      onRemove={() => { hedefKaydet(h.key, emptyActivityTarget()); setOpenTarget(null); }}
                    />
                  )}
                </div>
              );
            })}

            {!pickerOpen ? (
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 py-3 text-[11px] font-bold text-zinc-400 active:text-zinc-100 flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Aktiviteye hedef ekle
              </button>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 space-y-2 max-h-[50vh] overflow-y-auto hide-scrollbar">
                {CARDIO_SECTIONS.map(section => (
                  <div key={section.key}>
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">{section.label}</span>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {CARDIO_ACTIVITIES.filter(a => section.groups.includes(a.group)).map(a => (
                        <button
                          key={a.key}
                          onClick={() => { setOpenTarget(a.key); setPickerOpen(false); hedefKaydet(a.key, { ...emptyActivityTarget(), minutes: 30 }); }}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-zinc-800 bg-zinc-950 text-zinc-400 active:border-red-600 active:text-red-300"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'log' && (
          <>
            {simple && (
              <button
                type="button"
                onClick={() => setLogInsightsOpen(open => !open)}
                aria-expanded={logInsightsOpen}
                className="w-full min-h-14 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center justify-between gap-3 text-left active:bg-zinc-800"
              >
                <span className="min-w-0">
                  <strong className="text-[11px] text-zinc-200 block">Tempo, şablon ve rekorlar</strong>
                  <span className="text-[9px] font-mono text-zinc-400 block truncate">
                    {tempoEgilimleri.length} eğilim · {siraliSablonlar.length} şablon · {cardioRecords?.records?.length || 0} rekor
                  </span>
                </span>
                <ChevronDown size={15} className={`text-zinc-400 shrink-0 transition-transform ${logInsightsOpen ? 'rotate-180' : ''}`} />
              </button>
            )}

            {(!simple || logInsightsOpen) && <>
            {tempoEgilimleri.length > 0 && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60">
                  <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
                    <Ruler size={12} className="mr-1.5 text-cyan-400" /> Tempo Eğilimi
                  </h4>
                </div>
                <div className="divide-y divide-zinc-800/70">
                  {tempoEgilimleri.map(x => (
                    <div key={x.type} className="px-4 py-2.5 flex justify-between items-baseline gap-2">
                      <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0">{x.activity.label}</span>
                      <span className="text-[10px] font-mono shrink-0">
                        <strong className={x.trend.direction === 'improving' ? 'text-emerald-400' : x.trend.direction === 'declining' ? 'text-amber-400' : 'text-zinc-300'}>
                          {x.trend.latest.label}
                        </strong>
                        <span className="text-zinc-400">
                          {' '}· {x.trend.direction === 'improving' ? 'hızlanıyor' : x.trend.direction === 'declining' ? 'yavaşlıyor' : 'sabit'}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-zinc-950/60">
                  <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                    Karşılaştırma yalnızca aynı aktivite ve aynı şiddet sınıfı içinde
                    yapılıyor; zone 2 koşusunun temposunu interval seansıyla
                    kıyaslamak gerileme gibi görünürdü.
                  </p>
                </div>
              </div>
            )}

            {/* Kardiyo şablonları. Yüzmede 8 × 100 m serbest gibi bir set
                defterini her seferinde elle kurmak, defteri hiç kullanmamanın
                en kısa yoluydu. Şablon yalnızca PLAN alanlarını taşıyor;
                ölçülen değerler (kulaç, gerçek süre) sıfırlanıyor. */}
            {siraliSablonlar.length > 0 && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
                  <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
                    <Bookmark size={12} className="mr-1.5 text-cyan-400" /> Seans Şablonları
                  </h4>
                  <span className="text-[9px] font-mono text-zinc-400">{siraliSablonlar.length}</span>
                </div>
                <div className="divide-y divide-zinc-800/70">
                  {siraliSablonlar.map(t => (
                    <div key={t.id} className="px-4 py-2.5 flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-zinc-200 block truncate">{t.name}</span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          {t.info.activity?.label}
                          {t.info.summaryLabel ? ` · ${t.info.summaryLabel}` : ''}
                          {t.useCount > 0 ? ` · ${t.useCount}× kullanıldı` : ''}
                        </span>
                      </div>
                      <button
                        onClick={() => onApplyCardioTemplate?.(t)}
                        className="bg-cyan-950/40 border border-cyan-900/60 text-cyan-300 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider active:bg-cyan-900/40 shrink-0 flex items-center gap-1"
                      >
                        <Play size={9} /> Yükle
                      </button>
                      <button
                        onClick={() => onDeleteCardioTemplate?.(t.id)}
                        className="text-zinc-400 active:text-red-400 p-1.5 shrink-0"
                        aria-label={`${t.name} şablonunu sil`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-zinc-950/60">
                  <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                    Şablon plandaki mesafe, stil, set tipi ve dinlenmeyi taşır;
                    ölçtüğün süreyi ve kulaç sayısını taşımaz — onlar o seansa
                    ait. Geçmiş kayıtlardaki "Şablon yap" düğmesiyle çoğaltılır.
                  </p>
                </div>
              </div>
            )}

            {cardioRecords?.hasData && (
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
                  <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center">
                    <Trophy size={12} className="mr-1.5 text-amber-400" /> Kardiyo Rekorları
                  </h4>
                  <span className="text-[9px] font-mono text-zinc-400">{cardioRecords.records.length}</span>
                </div>
                <div className="divide-y divide-zinc-800/70">
                  {cardioRecords.records.map(r => (
                    <div key={`${r.family}-${r.distance}`} className="px-4 py-2 flex justify-between items-baseline gap-2">
                      <span className="text-[11px] font-bold text-zinc-200 truncate min-w-0">
                        {r.label}
                        <span className="text-[9px] font-mono text-zinc-400 ml-1.5">{r.activityInfo?.label}</span>
                      </span>
                      <span className="text-[10px] font-mono shrink-0">
                        <strong className="text-amber-400">{r.timeLabel}</strong>
                        <span className="text-zinc-400"> · {r.paceLabel} · {formatDay(r.date, 'short')}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-zinc-950/60">
                  <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                    Rekor yalnızca TAM eşleşen mesafede sayılıyor; 1200 m'lik bir
                    yüzmeden 1000 m rekoru türetmek tempoyu sabit varsaymak olurdu.
                  </p>
                </div>
              </div>
            )}
            </>}

            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
                <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Son Kayıtlar</h4>
                <span className="text-[9px] font-mono text-zinc-400">{sonKayitlar.length}</span>
              </div>
              {sonKayitlar.length === 0 ? (
                <p className="px-4 py-8 text-center text-[10px] font-mono text-zinc-400">
                  Henüz kardiyo kaydı yok.
                </p>
              ) : (
                <div className="divide-y divide-zinc-800/70">
                  {sonKayitlar.map(k => (
                    <div key={`${k.workoutId}-${k.id}`} className="px-4 py-2.5 flex items-center gap-2">
                      <button
                        onClick={() => onEditEntry?.(k)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <span className="text-[11px] font-bold text-zinc-200 block truncate">
                          {k.activity?.label || k.type}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 block truncate">
                          {formatDay(k.date, 'short', { weekday: true })} · {k.minutes} dk
                          {k.pace && ` · ${k.pace.label}`}
                          {k.avgHeartRate ? ` · ${k.avgHeartRate} bpm` : ''}
                        </span>
                      </button>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${k.zone.color} border-zinc-800 bg-zinc-950`}>
                        {k.zone.label.replace('Zone ', 'Z')}
                      </span>
                      {/* Şablon yalnızca set defteri olan kayıttan çıkar;
                          defteri olmayan kayıtta taşınacak bir yapı yok. */}
                      {onSaveCardioTemplate && k.sets?.length > 0 && (
                        <button
                          onClick={() => onSaveCardioTemplate(k, `${k.activity?.label || k.type} · ${k.sets.length} set`)}
                          aria-label="Şablon yap"
                          className="text-zinc-500 active:text-cyan-400 p-1 shrink-0"
                        >
                          <Bookmark size={12} />
                        </button>
                      )}
                      {onDeleteEntry && (
                        <button
                          onClick={() => onDeleteEntry(k)}
                          aria-label="Kaydı sil"
                          className="text-zinc-500 active:text-red-500 p-1 shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

/**
 * Hedef düzenleyici.
 *
 * Ayrı bileşen: alanları effect ile senkronlamak React Compiler kurallarına
 * aykırı, `key` ile yeniden monte etmek aynı işi yan etkisiz yapıyor.
 */
const TargetEditor = memo(({ activityKey, value, onSave, onRemove }) => {
  const [form, setForm] = useState(() => ({ ...emptyActivityTarget(), ...(value || {}) }));
  const mesafeli = supportsDistance(activityKey);

  const alanlar = TARGET_FIELDS.filter(f => mesafeli || (f.key !== 'distanceKm' && f.key !== 'setDistance'));

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/50 p-3 space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        {alanlar.map(f => (
          <label key={f.key} title={f.hint}>
            <span className="text-[9px] font-mono text-zinc-500 block mb-1">{f.label} ({f.unit})</span>
            <input
              type="number" inputMode="numeric" min="0"
              value={form[f.key]}
              onChange={(e) => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder="—"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 text-center font-mono text-cyan-400 text-[12px] outline-none focus:border-cyan-500"
            />
          </label>
        ))}
      </div>
      <input
        value={form.note}
        onChange={(e) => setForm(p => ({ ...p, note: e.target.value }))}
        placeholder="Not: teknik, parkur, ekipman…"
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-[11px] font-mono outline-none focus:border-cyan-500"
      />
      <p className="text-[9px] font-mono text-zinc-400">{describeTarget(form, activityKey) || 'Henüz hedef yok.'}</p>
      <div className="flex gap-2">
        <button
          onClick={onRemove}
          className="px-3 py-2.5 rounded-xl bg-zinc-800 active:bg-zinc-700 text-zinc-400 text-[10px] font-bold"
        >
          Kaldır
        </button>
        <button
          onClick={() => onSave(form)}
          className="flex-1 py-2.5 rounded-xl bg-red-600 active:bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
        >
          <Activity size={12} /> Hedefi kaydet
        </button>
      </div>
    </div>
  );
});

TargetEditor.displayName = 'TargetEditor';
CardioView.displayName = 'CardioView';

export default CardioView;
