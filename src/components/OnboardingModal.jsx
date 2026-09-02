import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Beef, CheckCircle2, ChevronLeft, ChevronRight, Dumbbell, LineChart, Moon,
  Ruler, Sparkles, Target,
} from 'lucide-react';
import { EXPERIENCE_LEVELS } from '../utils/constants';
import { STARTER_PROGRAMS } from '../utils/starterPrograms';

const GOALS = [
  { key: 'cut', label: 'Yağ Kaybı', hint: 'Kontrollü kalori açığı' },
  { key: 'maintenance', label: 'Koruma', hint: 'Kilo ve performansı koru' },
  { key: 'bulk', label: 'Kas Kazanımı', hint: 'Ölçülü kalori fazlası' },
];

const FIRST_RECORDS = [
  { key: 'metrics', statusKey: 'profile', label: 'Vücut ölçümü', hint: 'Kalori ve hedef hesabının temeli', icon: Ruler },
  { key: 'training', statusKey: 'workout', label: 'Antrenman', hint: 'Serbest seans veya program günü', icon: Dumbbell },
  { key: 'nutrition', statusKey: 'nutrition', label: 'Beslenme', hint: 'Günlük toplam veya besin kaydı', icon: Beef },
  { key: 'sleep', statusKey: 'sleep', label: 'Uyku puanı', hint: '100 üzerinden hızlı toparlanma kaydı', icon: Moon },
];

const OnboardingModal = memo(({ isOpen, settings, onFinish, status = {} }) => {
  const [step, setStep] = useState(0);
  const [starterKey, setStarterKey] = useState('');
  const [firstAction, setFirstAction] = useState(() => status.profile ? 'training' : 'metrics');
  const [draft, setDraft] = useState({
    nutritionGoal: settings.nutritionGoal === 'maintain' ? 'maintenance' : settings.nutritionGoal || 'maintenance',
    experienceLevel: settings.experienceLevel || 'intermediate',
    interfaceMode: settings.interfaceMode || 'simple',
  });
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const starterPrograms = useMemo(
    () => STARTER_PROGRAMS.filter(program => program.key !== 'ppl6'),
    [],
  );

  // Modal açıldığında odağı içine alır, Tab döngüsünü dışarı kaçırmaz ve
  // kapanınca kullanıcıyı geldiği kontrole geri bırakır.
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll(
        'button:not([disabled]), select:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ) || [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const frame = window.requestAnimationFrame(() => headingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const selectedGoal = GOALS.find(goal => goal.key === draft.nutritionGoal) || GOALS[1];
  const selectedLevel = EXPERIENCE_LEVELS.find(level => level.key === draft.experienceLevel) || EXPERIENCE_LEVELS[1];
  const selectedRecord = FIRST_RECORDS.find(record => record.key === firstAction) || FIRST_RECORDS[0];
  const finish = (openFirstRecord = true) => onFinish(
    { ...draft, onboardingComplete: true },
    starterKey,
    openFirstRecord ? firstAction : null,
  );

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-purpose"
      className="fixed inset-0 bg-black z-[140] flex flex-col"
    >
      <header className="pt-safe px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-950/95">
        <div className="max-w-sm mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">Hızlı Kurulum</span>
            <span id="onboarding-purpose" className="text-[9px] text-zinc-500 block mt-0.5">Üç seçimden sonra ilk kaydını açar.</span>
          </div>
          <button type="button" onClick={() => finish(false)} className="min-h-11 px-2 text-[10px] font-bold text-zinc-400">
            Şimdilik kapat
          </button>
        </div>
        <ol className="max-w-sm mx-auto grid grid-cols-3 gap-2 mt-3" aria-label="Kurulum ilerlemesi">
          {['Hedef', 'İlk kayıt', 'Özet'].map((label, index) => (
            <li key={label} aria-current={step === index ? 'step' : undefined}>
              <span className={`h-1.5 rounded-full block ${index <= step ? 'bg-cyan-500' : 'bg-zinc-800'}`} aria-hidden="true" />
              <span className={`text-[8px] font-mono block mt-1 ${index === step ? 'text-cyan-400' : 'text-zinc-500'}`}>{index + 1}. {label}</span>
            </li>
          ))}
        </ol>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-5 py-5">
        <div className="max-w-sm w-full mx-auto">
          {step === 0 && (
            <section aria-labelledby="onboarding-title">
              <span className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-4">
                <Target size={22} />
              </span>
              <h2 ref={headingRef} tabIndex="-1" id="onboarding-title" className="text-xl font-black text-zinc-100 outline-none">Önce hedefini seç</h2>
              <p className="text-[10px] text-zinc-400 leading-relaxed mt-2 mb-4">Bu seçim kalori ve koç önerilerinin yönünü belirler; daha sonra Ayarlar’dan değiştirilebilir.</p>
              <div className="space-y-2">
                {GOALS.map(item => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => setDraft(current => ({ ...current, nutritionGoal: item.key }))}
                    aria-pressed={draft.nutritionGoal === item.key}
                    className={`w-full min-h-[64px] p-3.5 rounded-2xl border text-left flex items-center gap-3 ${draft.nutritionGoal === item.key ? 'bg-cyan-950/30 border-cyan-600' : 'bg-zinc-900 border-zinc-800'}`}
                  >
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${draft.nutritionGoal === item.key ? 'border-cyan-500 bg-cyan-500 text-zinc-950' : 'border-zinc-600'}`}>
                      {draft.nutritionGoal === item.key && <CheckCircle2 size={13} />}
                    </span>
                    <span><strong className="text-[11px] text-zinc-200 block">{item.label}</strong><span className="text-[9px] text-zinc-500 block mt-0.5">{item.hint}</span></span>
                  </button>
                ))}
              </div>
              <label htmlFor="onboarding-level" className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mt-5 mb-1.5">Antrenman deneyimi</label>
              <select
                id="onboarding-level"
                value={draft.experienceLevel}
                onChange={event => setDraft(current => ({ ...current, experienceLevel: event.target.value }))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-zinc-200 outline-none focus:border-cyan-500"
              >
                {EXPERIENCE_LEVELS.map(level => <option key={level.key} value={level.key}>{level.label}</option>)}
              </select>
              <p className="text-[9px] text-zinc-500 mt-1.5">{selectedLevel.hint}</p>
            </section>
          )}

          {step === 1 && (
            <section aria-labelledby="onboarding-title">
              <span className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-4">
                <LineChart size={22} />
              </span>
              <h2 ref={headingRef} tabIndex="-1" id="onboarding-title" className="text-xl font-black text-zinc-100 outline-none">İlk olarak ne kaydedeceksin?</h2>
              <p className="text-[10px] text-zinc-400 leading-relaxed mt-2 mb-4">Kurulum bittiğinde seçtiğin ekran doğrudan açılır. Uygulama boş veriden sonuç uydurmaz.</p>
              <div className="space-y-2">
                {FIRST_RECORDS.map(item => {
                  const Icon = item.icon;
                  const selected = firstAction === item.key;
                  const done = Boolean(status[item.statusKey]);
                  return (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => setFirstAction(item.key)}
                      aria-pressed={selected}
                      className={`w-full min-h-[66px] p-3 rounded-2xl border text-left flex items-center gap-3 ${selected ? 'bg-cyan-950/30 border-cyan-600' : 'bg-zinc-900 border-zinc-800'}`}
                    >
                      <span className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${selected ? 'border-cyan-700 bg-cyan-950 text-cyan-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}><Icon size={17} /></span>
                      <span className="min-w-0 flex-1"><strong className="text-[11px] text-zinc-200 block">{item.label}</strong><span className="text-[9px] text-zinc-500 block mt-0.5">{item.hint}</span></span>
                      {done && <span className="text-[8px] font-bold text-emerald-400 uppercase">Kayıtlı</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="onboarding-title">
              <span className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-4">
                <Sparkles size={22} />
              </span>
              <h2 ref={headingRef} tabIndex="-1" id="onboarding-title" className="text-xl font-black text-zinc-100 outline-none">Hazırsın</h2>
              <p className="text-[10px] text-zinc-400 leading-relaxed mt-2">İlk kaydından sonra Bugün ekranı hedefini, koç kararını ve oluşan özeti aynı akışta gösterecek.</p>

              <dl className="rounded-2xl border border-zinc-800 bg-zinc-900 mt-4 divide-y divide-zinc-800">
                {[
                  ['Hedef', selectedGoal.label],
                  ['Seviye', selectedLevel.label],
                  ['İlk adım', selectedRecord.label],
                  ['Arayüz', draft.interfaceMode === 'detailed' ? 'Detaylı' : 'Basit'],
                ].map(([term, value]) => (
                  <div key={term} className="px-3.5 py-2.5 flex justify-between gap-3"><dt className="text-[9px] text-zinc-500">{term}</dt><dd className="text-[10px] font-bold text-zinc-200 text-right">{value}</dd></div>
                ))}
              </dl>

              {!status.program && (
                <div className="mt-5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">İsteğe bağlı başlangıç programı</span>
                  <p className="text-[9px] text-zinc-500 mt-1 mb-2">Gerçek geçmiş üretmez; düzenlenebilir şablon ve haftalık plan kurar.</p>
                  <div className="space-y-2">
                    <button type="button" onClick={() => setStarterKey('')} aria-pressed={starterKey === ''} className={`w-full min-h-11 rounded-xl border px-3 text-left ${starterKey === '' ? 'border-cyan-600 bg-cyan-950/25' : 'border-zinc-800 bg-zinc-900'}`}>
                      <strong className="text-[10px] text-zinc-200">Şimdilik program kurma</strong>
                    </button>
                    {starterPrograms.map(program => (
                      <button type="button" key={program.key} onClick={() => setStarterKey(program.key)} aria-pressed={starterKey === program.key} className={`w-full min-h-[52px] rounded-xl border px-3 py-2 text-left ${starterKey === program.key ? 'border-cyan-600 bg-cyan-950/25' : 'border-zinc-800 bg-zinc-900'}`}>
                        <strong className="text-[10px] text-zinc-200 block">{program.name}</strong>
                        <span className="text-[8px] text-zinc-500 block mt-0.5">{program.daysPerWeek} gün · düzenlenebilir</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      <footer className="px-5 py-4 border-t border-zinc-800 bg-zinc-950 pb-safe">
        <div className="max-w-sm w-full mx-auto flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep(current => current - 1)} className="w-12 rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-300 flex items-center justify-center" aria-label="Önceki kurulum adımı">
              <ChevronLeft size={18} />
            </button>
          )}
          <button type="button" onClick={() => step < 2 ? setStep(current => current + 1) : finish(true)} className="flex-1 min-h-[52px] bg-cyan-600 text-white rounded-2xl font-bold text-[11px] flex items-center justify-center gap-2">
            {step < 2 ? 'Devam' : `${selectedRecord.label} ekranını aç`} <ChevronRight size={17} />
          </button>
        </div>
      </footer>
      <span className="sr-only" aria-live="polite">Kurulum adımı {step + 1} / 3</span>
    </div>
  );
});

OnboardingModal.displayName = 'OnboardingModal';
export default OnboardingModal;
