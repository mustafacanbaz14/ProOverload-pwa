import React, { useState, useMemo, memo } from 'react';
import {
  X, Wand2, ChevronLeft, ChevronRight, Check, AlertTriangle, CalendarRange,
  Layers, Dumbbell, Target, Pencil,
} from 'lucide-react';
import {
  buildProgram, SPLIT_DAY_OPTIONS, EQUIPMENT_PROFILES, PRIORITY_MUSCLES, MAX_PRIORITY,
} from '../utils/programBuilder';
import { WEEKDAYS } from '../utils/weekPlan';
import { lengthBias, LENGTH_BIAS_LABEL } from '../utils/selectionAudit';

/**
 * Program sihirbazı.
 *
 * Dört soru soruyor ve programı üretiyor. Sorular, hareket seçimini gerçekten
 * değiştiren şeylerle sınırlı: gün sayısı bölmeyi, ekipman aday havuzunu,
 * deneyim hacim referanslarını, öncelik ise hacmin nereye kaydırılacağını
 * belirliyor. Bunların dışında sorulabilecek her şey (hedef, yaş, süre) ya
 * uygulamada zaten var ya da üretilen programı değiştirmiyordu.
 *
 * Son adım kurulumdan ÖNCE tam raporu gösteriyor: gün gün hareketler, kas kas
 * ölçülen hacim ve varsa uyarılar. Program kurulduktan sonra "bu neden böyle"
 * sorusunu cevaplamak zor; kurulmadan önce cevaplamak kolay.
 */

const ADIMLAR = ['Gün', 'Ekipman', 'Öncelik', 'Önizleme'];

const ProgramWizardModal = memo(({
  isOpen,
  onClose,
  onInstall,
  onCustomize,
  experienceLevel = 'intermediate',
  customExercises = [],
  existingTemplateCount = 0,
}) => {
  const [adim, setAdim] = useState(0);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [equipment, setEquipment] = useState('full');
  const [priority, setPriority] = useState([]);
  const [openDay, setOpenDay] = useState(0);

  const built = useMemo(
    () => (isOpen ? buildProgram({ daysPerWeek, equipment, experienceLevel, priority, customExercises }) : null),
    [isOpen, daysPerWeek, equipment, experienceLevel, priority, customExercises]);

  if (!isOpen) return null;

  const oncelikSec = (kas) => {
    setPriority(prev => {
      if (prev.includes(kas)) return prev.filter(k => k !== kas);
      // Üçüncü önceliği eklemek yerine en eskisi düşüyor: "her şey öncelikli"
      // demek hiçbir şeyin öncelikli olmaması demek, hacim bir yerden gelmeli.
      return [...prev, kas].slice(-MAX_PRIORITY);
    });
  };

  const sonAdim = adim === ADIMLAR.length - 1;
  const uyariVar = built && (built.belowMev.length > 0 || built.overloadedDays.length > 0);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[92] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Wand2 size={15} className="mr-2 text-violet-400" /> Program Sihirbazı
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      {/* Adım göstergesi */}
      <div className="px-3 py-2.5 border-b border-zinc-800 bg-zinc-950/60 shrink-0 flex gap-1.5">
        {ADIMLAR.map((ad, i) => (
          <div key={ad} className="flex-1">
            <div className={`h-1 rounded-full ${i < adim ? 'bg-zinc-600' : i === adim ? 'bg-violet-400' : 'bg-zinc-800'}`} />
            <span className={`text-[8px] font-mono uppercase tracking-widest block mt-1 ${i === adim ? 'text-violet-400' : 'text-zinc-600'}`}>
              {ad}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">

        {adim === 0 && (
          <>
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
              Haftada kaç gün antrenmana gelebilirsin? Bu, bölmeyi belirliyor —
              az günde tüm vücut, çok günde bölünmüş program.
            </p>
            {SPLIT_DAY_OPTIONS.map(g => {
              const secili = daysPerWeek === g;
              const onizleme = buildProgram({ daysPerWeek: g, equipment, experienceLevel, priority, customExercises });
              return (
                <button
                  key={g}
                  onClick={() => { setDaysPerWeek(g); setOpenDay(0); }}
                  className={`w-full text-left rounded-2xl p-3.5 border transition-colors ${secili ? 'border-violet-600 bg-violet-950/20' : 'border-zinc-800 bg-zinc-900'}`}
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <strong className={`text-[12px] ${secili ? 'text-violet-300' : 'text-zinc-200'}`}>
                      {g} gün · {onizleme.split.name}
                    </strong>
                    <span className="text-[9px] font-mono text-zinc-500 shrink-0">{onizleme.totalSets} set/hafta</span>
                  </div>
                  <p className="text-[9px] font-mono text-zinc-500 leading-relaxed mt-1">{onizleme.split.rationale}</p>
                </button>
              );
            })}
          </>
        )}

        {adim === 1 && (
          <>
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
              Salonunda ne var? Bu, aday hareketleri süzüyor — "kanadım için ne
              yapayım" sorusunun cevabı barfiks çekebilenle sadece makine
              bulabilende aynı değil.
            </p>
            {EQUIPMENT_PROFILES.map(p => {
              const secili = equipment === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setEquipment(p.key)}
                  className={`w-full text-left rounded-2xl p-3.5 border transition-colors ${secili ? 'border-violet-600 bg-violet-950/20' : 'border-zinc-800 bg-zinc-900'}`}
                >
                  <strong className={`text-[12px] block ${secili ? 'text-violet-300' : 'text-zinc-200'}`}>{p.label}</strong>
                  <span className="text-[9px] font-mono text-zinc-500">{p.hint}</span>
                </button>
              );
            })}
            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
              Deneyim seviyesi ayarlardan alınıyor; hacim referansları (MEV/MAV)
              ona göre ölçekleniyor.
            </p>
          </>
        )}

        {adim === 2 && (
          <>
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
              Geride kalan ya da öne çıkarmak istediğin en fazla {MAX_PRIORITY} kas
              seç. Seçilenler verimli bandın üst ucuna, diğerleri alt ucuna
              yerleşir. Hiçbiri seçilmezse hacim dengeli dağılır.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_MUSCLES.map(kas => {
                const secili = priority.includes(kas);
                return (
                  <button
                    key={kas}
                    onClick={() => oncelikSec(kas)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${secili ? 'border-violet-600 bg-violet-950/30 text-violet-300' : 'border-zinc-800 bg-zinc-900 text-zinc-400'}`}
                  >
                    {secili && <Check size={9} className="inline mr-1" />}{kas}
                  </button>
                );
              })}
            </div>
            {priority.length > 0 && (
              <button
                onClick={() => setPriority([])}
                className="text-[10px] font-mono text-zinc-500 active:text-zinc-300 px-1"
              >
                Seçimi temizle
              </button>
            )}
          </>
        )}

        {adim === 3 && built && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <CalendarRange size={13} className="text-cyan-400" />, value: daysPerWeek, label: 'gün' },
                { icon: <Layers size={13} className="text-emerald-400" />, value: built.totalSets, label: 'set/hafta' },
                { icon: <Dumbbell size={13} className="text-amber-400" />, value: built.days.reduce((t, d) => t + d.exercises.length, 0), label: 'hareket' },
              ].map(k => (
                <div key={k.label} className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-center">
                  <div className="flex justify-center mb-1">{k.icon}</div>
                  <span className="text-sm font-mono font-bold text-zinc-100 block">{k.value}</span>
                  <span className="text-[9px] font-mono text-zinc-500">{k.label}</span>
                </div>
              ))}
            </div>

            {uyariVar ? (
              <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[10px] font-mono text-amber-200 leading-relaxed space-y-1.5">
                  {built.belowMev.length > 0 && (
                    <p>
                      <strong>Koruma eşiğinin altında:</strong> {built.belowMev.join(', ')}.
                      Seçtiğin gün sayısı bu kaslara yetecek hacmi taşımıyor; gün
                      eklersen kapanır.
                    </p>
                  )}
                  {built.overloadedDays.length > 0 && (
                    <p>
                      <strong>Uzun seans:</strong> {built.overloadedDays.map(d => `${d.name} (${d.sets} set)`).join(', ')}.
                      Seans başına {built.sessionCap} setin üstü. Bu bölmede tüm
                      kasları eşiğin üstünde tutmakla seansı kısa tutmak aynı anda
                      mümkün değil — hangisinden vazgeçeceğin senin kararın.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
                <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10px] font-mono text-emerald-200 leading-relaxed">
                  Her kas koruma eşiğinin (MEV) üstünde, tavanın (MRV) altında ve
                  gerilmede yükleyen en az bir harekete sahip. Bu, iddia değil
                  ölçüm: program kurulmadan önce uygulamanın kendi hacim
                  çözümleyicisinden geçirildi.
                </p>
              </div>
            )}

            {/* Gün gün program */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60">
                <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{built.split.name}</h4>
              </div>
              <div className="divide-y divide-zinc-800/70">
                {built.days.map((gun, i) => {
                  const acik = openDay === i;
                  const gunKey = Object.entries(built.split.schedule).find(([, idx]) => idx === i)?.[0];
                  const gunAdi = WEEKDAYS.find(w => w.key === gunKey)?.label || '';
                  const setler = gun.exercises.reduce((t, e) => t + e.sets, 0);
                  return (
                    <div key={gun.name}>
                      <button
                        onClick={() => setOpenDay(acik ? -1 : i)}
                        aria-expanded={acik}
                        className="w-full px-4 py-2.5 flex justify-between items-center gap-2 text-left active:bg-zinc-800/50 transition-colors"
                      >
                        <span className="min-w-0">
                          <strong className="text-[11px] text-zinc-200 block truncate">{gun.name}</strong>
                          <span className="text-[9px] font-mono text-cyan-500">{gunAdi}</span>
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                          {gun.exercises.length} hareket · {setler} set
                        </span>
                      </button>
                      {acik && (
                        <div className="px-4 pb-3 pt-0.5 space-y-1 bg-zinc-950/50">
                          {gun.exercises.map(ex => (
                            <div key={ex.name} className="flex justify-between items-baseline gap-2 text-[10px] font-mono">
                              <span className="text-zinc-300 truncate min-w-0">{ex.name}</span>
                              <span className="shrink-0 pl-2">
                                <span className={lengthBias(ex.name) === 'stretch' ? 'text-cyan-500' : 'text-zinc-600'}>
                                  {LENGTH_BIAS_LABEL[lengthBias(ex.name)]}
                                </span>
                                <span className="text-zinc-600"> · </span>
                                <strong className="text-zinc-300">{ex.sets} set</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ölçülen hacim */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline">
                <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Ölçülen Hacim</h4>
                <span className="text-[9px] font-mono text-zinc-600">dolaylı katkı dahil</span>
              </div>
              <div className="divide-y divide-zinc-800/70">
                {built.report.filter(r => r.volume > 0).map(r => (
                  <div key={r.muscle} className="px-4 py-1.5 flex justify-between items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-300 truncate min-w-0 flex items-center gap-1.5">
                      {r.muscle}
                      {r.priority && <Target size={9} className="text-violet-400 shrink-0" />}
                    </span>
                    <span className="text-[10px] font-mono shrink-0">
                      <strong className={r.belowMev ? 'text-amber-400' : r.aboveMrv ? 'text-red-400' : 'text-zinc-100'}>
                        {r.volume}
                      </strong>
                      <span className="text-zinc-600"> · MEV {r.mev} / MAV {r.mav}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {existingTemplateCount > 0 && (
              <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-xl p-3">
                <p className="text-[10px] font-mono text-cyan-200 leading-relaxed">
                  Zaten {existingTemplateCount} şablonun var. Bu program onları
                  SİLMEZ, yanlarına eklenir.
                </p>
              </div>
            )}

            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
              Setler boş ağırlıkla açılır; hedefi uygulama ilk seanstan sonra
              geçmişten öğrenir. Hacmi haftadan haftaya artırmak için Araçlar →
              Mezosiklik'i kullanabilirsin — bu program bilerek verimli bandın
              alt ucunda başlıyor ki bloğa artıracak yer kalsın.
            </p>
          </>
        )}
      </div>

      {/* Gezinme */}
      <div className="px-3 py-2.5 border-t border-zinc-800 bg-zinc-900 shrink-0 pb-safe flex gap-2">
        <button
          onClick={() => (adim === 0 ? onClose() : setAdim(a => a - 1))}
          className="px-4 py-3 rounded-2xl bg-zinc-800 active:bg-zinc-700 text-zinc-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1"
        >
          <ChevronLeft size={14} /> {adim === 0 ? 'Vazgeç' : 'Geri'}
        </button>
        {sonAdim ? (
          <>
            <button
              onClick={() => onCustomize?.(built)}
              className="flex-1 py-3 rounded-2xl border border-violet-800/60 bg-violet-950/30 active:bg-violet-900/40 text-violet-300 font-bold text-[10px] uppercase tracking-wide flex items-center justify-center gap-1"
            >
              <Pencil size={13} /> Önce Düzenle
            </button>
            <button
              onClick={() => { onInstall(built); onClose(); }}
              className="flex-1 py-3 rounded-2xl bg-violet-600 active:bg-violet-700 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Check size={15} /> Direkt Kur
            </button>
          </>
        ) : (
          <button
            onClick={() => setAdim(a => a + 1)}
            className="flex-1 py-3 rounded-2xl bg-violet-600 active:bg-violet-700 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1"
          >
            Devam <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
});

ProgramWizardModal.displayName = 'ProgramWizardModal';

export default ProgramWizardModal;
