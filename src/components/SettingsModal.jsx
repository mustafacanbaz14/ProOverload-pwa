import { REST_ALERT_INTENSITIES, REST_ALERT_TONES } from '../lockScreen';
import React, { memo, useState } from 'react';
import { X, Settings, Download, Upload, Smartphone, HeartPulse, Database, Dumbbell, Beef, Sun, Moon, Footprints, Layers3, Sparkles, Volume2, CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink, Search, ChevronDown } from 'lucide-react';
import { exportAppleHealthXML, exportGoogleFitJSON } from '../utils/healthSync';
import { EXPERIENCE_LEVELS, APP_VERSION } from '../utils/constants';
import { PLATE_OPTIONS, AVAILABLE_PLATES, smallestPlateOf } from '../utils/plates';
import { ratesForGoal } from '../utils/goals';
import { TRAINING_GOALS, findTrainingGoal } from '../utils/trainingGoal';
import { COACH_FOCUSES, findFocus } from '../utils/coachFocus';
import { VOLUME_PHILOSOPHIES, findPhilosophy } from '../utils/doseResponse';
import { ACTIVITY_LEVELS } from '../utils/energyModel';

const Toggle = ({ label, hint, checked, onChange }) => (
  <label className="flex items-center justify-between gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer">
    <span className="min-w-0">
      <span className="text-zinc-200 text-[11px] font-bold block">{label}</span>
      {hint && <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 leading-snug">{hint}</span>}
    </span>
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onChange(!checked); }}
      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${checked ? 'bg-cyan-600' : 'bg-zinc-700'}`}
    >
      {/* Hata: `left` hiç yazılmadığı için nokta statik konumundan başlıyordu.
          Buton ortalı olduğundan bu ~22px'e denk geliyor, üstüne binen translate
          de noktayı rayın dışına taşırıyordu; kapalıyken de sola inmiyordu.
          Konum artık doğrudan `left` ile veriliyor:
          ray 44px − nokta 16px − 4px boşluk = kapalı 4px, açık 24px. */}
      <span
        style={{ left: checked ? 24 : 4 }}
        className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200"
      />
    </button>
  </label>
);

const Group = ({ icon, title, children, visible = true }) => !visible ? null : (
  <div className="space-y-2.5">
    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center border-b border-zinc-800 pb-1.5">
      <span className="mr-1.5 flex items-center">{icon}</span>{title}
    </h4>
    {children}
  </div>
);

const SETTINGS_SECTIONS = [
  { key: 'all', label: 'Tümü', title: 'Tüm ayarlar', summary: 'Bir kategori seç veya ayar adını ara.', detail: 'Arama, ilgili ayar grubunu bütünüyle gösterir; böylece bulunan ayarın açıklaması ve bağlı kontrolleri kaybolmaz.' },
  { key: 'data', label: 'Veri', title: 'Veri, hedef ve aktarım', summary: 'Yedek, CSV, program kodu ve temel antrenman yaklaşımı.', detail: 'JSON yedeği geri yükleme içindir; CSV analiz içindir. Program kodu yalnız program yapısını taşır.' },
  { key: 'appearance', label: 'Görünüm', title: 'Görünüm', summary: 'Tema, yazı boyutu ve basit/detaylı arayüz.', detail: 'Basit mod özellik silmez; ileri kartları ihtiyaç anına kadar kapalı tutar.' },
  { key: 'body', label: 'Vücut', title: 'Vücut ve hesaplama', summary: 'BMI, NEAT ve enerji hesabı varsayımları.', detail: 'Bu ayarlar tahmin yöntemini değiştirir. Geçmiş kayıtlardaki dondurulmuş vücut verileri korunur.' },
  { key: 'training', label: 'Antrenman', title: 'Antrenman', summary: 'Set, dinlenme, ses, yük ve ilerleme davranışı.', detail: 'Hareket bazında yazılan özel ayarlar genel varsayılanlardan önceliklidir.' },
  { key: 'nutrition', label: 'Beslenme', title: 'Beslenme hedefleri', summary: 'Dönem hedefi, hız ve protein çarpanları.', detail: 'Hız seçimi vücut ağırlığının haftalık yüzdesidir; güvenli sınır analizde ayrıca denetlenir.' },
  { key: 'device', label: 'Cihaz', title: 'Cihaz ve sağlık', summary: 'Kilit ekranı, ekran açıklığı ve sağlık dışa aktarımı.', detail: 'Sağlık dışa aktarımı tek yönlü dosya üretir; uygulama diğer sağlık uygulamalarını doğrudan okuyamaz.' },
  { key: 'privacy', label: 'Güven', title: 'Gizlilik ve sürüm', summary: 'Politikalar, mağaza hazırlığı ve sürüm notları.', detail: 'Kişisel kayıtlar cihazda tutulur. Uygulama sağlık tahminleri sunar; tıbbi cihaz değildir.' },
];

const SettingsModal = memo(({
  isOpen,
  onClose,
  settings,
  setSettings,
  handleExportData,
  handleImportFileSelect,
  setIsQRModalOpen,
  workouts,
  nutritionHistory,
  lastBackupDate,
  onOpenOnboarding,
  onOpenReleaseNotes,
  onOpenStoreReadiness,
  profileGender = 'male',
  // Vücut ağırlıklı kayıtların yazım biçimi denetimi; null = hesaplanmadı.
  bodyweightAudit = null,
  onNormalizeBodyweight,
  onExportCsv,
  onToggleRestNotification,
  onTestRestAlert,
  notificationState = 'default',
  volumePhilosophy = 'balanced',
  onChangeVolumePhilosophy,
  gradedEffectiveSets = false,
  onToggleGradedSets,
  effectiveSetComparison = null,
  trainingAgeSuggestion = null,
  coachFocus = 'balanced',
  onChangeCoachFocus,
  trainingGoal = 'hypertrophy',
  onChangeTrainingGoal,
  onImportProgramCode,
  initialSection = 'all',
}) => {
  const [programCode, setProgramCode] = useState('');
  const [soundTest, setSoundTest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState(
    SETTINGS_SECTIONS.some(section => section.key === initialSection) ? initialSection : 'all',
  );
  const [helpOpen, setHelpOpen] = useState(false);
  if (!isOpen) return null;

  const set = (patch) => setSettings(s => ({ ...s, ...patch }));
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('tr-TR');
  const sectionVisible = (key) => {
    const section = SETTINGS_SECTIONS.find(item => item.key === key);
    if (!section) return false;
    const categoryMatch = normalizedQuery ? true : activeSection === 'all' || activeSection === key;
    const searchMatch = !normalizedQuery || `${section.label} ${section.title} ${section.summary} ${section.detail}`.toLocaleLowerCase('tr-TR').includes(normalizedQuery);
    return categoryMatch && searchMatch;
  };
  const visibleCount = SETTINGS_SECTIONS.filter(section => section.key !== 'all' && sectionVisible(section.key)).length;
  const activeHelp = SETTINGS_SECTIONS.find(section => section.key === activeSection) || SETTINGS_SECTIONS[0];

  const testSound = async (patch = {}) => {
    const result = await onTestRestAlert?.({
      intensityKey: patch.intensityKey || settings.restAlertIntensity || 'strong',
      toneKey: patch.toneKey || settings.restAlertTone || 'ascending',
      volume: patch.volume ?? settings.restAlertVolume ?? 0.85,
    });
    setSoundTest(result || { ok: false, state: 'unknown', error: 'Test sonucu alınamadı.' });
  };

  // Hız seçenekleri döneme bağlı; koruma döneminde hız kavramı yok.
  const paceOptions = ratesForGoal(settings.nutritionGoal);
  const activePace = paceOptions.find(r => r.key === settings.paceRate)
    || paceOptions.find(r => r.default)
    || null;

  const downloadBlob = (content, type, filename) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh]">

        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
          <h3 id="settings-title" className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
            <Settings size={16} className="mr-2 text-cyan-400" /> Ayarlar
          </h3>
          <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>

        <div className="px-3 py-3 border-b border-zinc-800 bg-zinc-950/95 shrink-0 space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Ayarlarda ara: dinlenme, tema, NEAT…" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-3 text-[10px] text-zinc-200 outline-none focus:border-cyan-600" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
            {SETTINGS_SECTIONS.map(section => (
              <button key={section.key} onClick={() => { setActiveSection(section.key); setSearchQuery(''); setHelpOpen(false); }} className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-[8px] font-bold ${activeSection === section.key ? 'border-cyan-600 bg-cyan-950/30 text-cyan-300' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}>{section.label}</button>
            ))}
          </div>
          <button type="button" onClick={() => setHelpOpen(value => !value)} aria-expanded={helpOpen} className="w-full flex items-start gap-2 text-left bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
            <Sparkles size={12} className="text-cyan-500 shrink-0 mt-0.5" />
            <span className="min-w-0 flex-1"><strong className="text-[9px] text-zinc-300 block">{activeHelp.title}</strong><span className="text-[8px] font-mono text-zinc-600 leading-relaxed block">{activeHelp.summary}</span>{helpOpen && <span className="text-[8px] font-mono text-zinc-500 leading-relaxed block mt-1 pt-1 border-t border-zinc-800">{activeHelp.detail}</span>}</span>
            <ChevronDown size={12} className={`text-zinc-600 shrink-0 transition-transform ${helpOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-5">

          {visibleCount === 0 && <div className="py-12 text-center"><Search size={20} className="text-zinc-700 mx-auto mb-2" /><p className="text-[10px] font-mono text-zinc-600">Bu aramayla eşleşen ayar grubu yok.</p></div>}

          {/* Veri yedekleme en üstte: veri yalnızca bu cihazda tutuluyor. */}
          <div className={`${sectionVisible('data') ? '' : 'hidden'} bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                <Database size={13} className="mr-1.5" /> Veri Yedekleme
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {lastBackupDate ? `Son: ${lastBackupDate}` : 'Hiç alınmadı'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
              Veriler yalnızca bu cihazda tutulur. Telefon değiştirmeden veya tarayıcıyı
              sıfırlamadan önce mutlaka indir.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportData}
                className="bg-zinc-900 border border-zinc-700 text-cyan-400 active:bg-zinc-800 font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider text-[11px] transition-colors"
              >
                <Download size={14} /> Yedek İndir
              </button>
              <label className="bg-zinc-900 border border-zinc-700 text-orange-400 active:bg-zinc-800 font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider text-[11px] cursor-pointer transition-colors">
                <Upload size={14} /> Yedek Yükle
                <input type="file" accept=".json,application/json" onChange={handleImportFileSelect} className="hidden" />
              </label>
            </div>
            <button
              onClick={() => { onClose(); setIsQRModalOpen(true); }}
              className="w-full bg-cyan-950/40 border border-cyan-900/50 text-cyan-400 active:bg-cyan-900/60 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-[11px] transition-colors"
            >
              <Smartphone size={14} /> Metin ile Cihaz Aktarımı
            </button>

            {/* CSV yedek değil ANALİZ içindir: JSON tek satırda tüm durumu
                taşıyor ve elektronik tabloda açılamıyor. Burada her satır bir
                set — pivot tablo kurmak için doğal biçim. */}
            {/* Antrenman hedefi modu. Uygulamanın bütün varsayılanları
                hipertrofiye göre ayarlıydı — doğru bir varsayılan ama tek
                varsayılan. Mod değiştirince altı ayrı ayarı elle değiştirmek
                gerekiyordu ve biri unutulduğunda sistem kendi içinde
                çelişiyordu. */}
            {onChangeTrainingGoal && (
              <div className="pt-2.5 border-t border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  Antrenman Hedefi
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.values(TRAINING_GOALS).map(g => {
                    const secili = trainingGoal === g.key;
                    return (
                      <button
                        key={g.key}
                        onClick={() => onChangeTrainingGoal(g.key)}
                        aria-pressed={secili}
                        title={g.hint}
                        className={`rounded-xl py-2 border text-[9px] font-bold transition-colors ${secili ? 'border-violet-500 bg-violet-950/30 text-violet-200' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
                      >
                        {g.short}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                  {findTrainingGoal(trainingGoal).detail}
                </p>
                {trainingAgeSuggestion?.hasData && trainingAgeSuggestion.confidence !== 'low' && (
                  <p className="text-[9px] font-mono text-cyan-400/80 leading-relaxed">
                    Kayıtlarına göre deneyim seviyen{' '}
                    {{ beginner: 'Yeni Başlayan', intermediate: 'Orta', advanced: 'İleri' }[trainingAgeSuggestion.suggestion]}
                    {' '}görünüyor ({trainingAgeSuggestion.reasons.join(', ')}). Bu tahmin uygulamayı
                    kullanma geçmişini ölçüyor, antrenman yaşını değil.
                  </p>
                )}
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                  Mod yalnızca VARSAYILANLARI değiştiriyor: tekrar aralığı,
                  dinlenme süresi ve ilerleme kuralı. Hareket ya da şablon için
                  elle yazdığın değerler dokunulmadan kalıyor — mod denemek
                  ayarlarını silmek anlamına gelmemeli.
                </p>
              </div>
            )}

            {/* Hacim felsefesi. Literatür bölünmüş: bir kanıt hattı "daha
                fazla set daha fazla kas" diyor, diğeri doğrudan test edince
                fark bulamıyor. Tek bir sayı dayatmak yerine kullanıcı hangi
                hatta yaslanacağını seçiyor. */}
            {onChangeVolumePhilosophy && (
              <div className="pt-2.5 border-t border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  Hacim Felsefesi
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.values(VOLUME_PHILOSOPHIES).map(f => {
                    const secili = volumePhilosophy === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => onChangeVolumePhilosophy(f.key)}
                        aria-pressed={secili}
                        className={`rounded-xl py-2 px-1 border text-[9px] font-bold transition-colors ${secili ? 'border-cyan-500 bg-cyan-950/30 text-cyan-200' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
                      >
                        {f.short}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                  {findPhilosophy(volumePhilosophy).summary}
                </p>
                <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                  <span className="text-zinc-600">Dayanak: </span>
                  {findPhilosophy(volumePhilosophy).evidence}
                </p>
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                  Felsefe yalnızca HEDEFİ kaydırıyor. Eşik (altında ölçülebilir
                  uyaran beklenmeyen hacim) ve seans başı tavan değişmiyor —
                  onlar tartışmalı değil, iki kanıt hattı da orada anlaşıyor.
                </p>
              </div>
            )}

            {/* Kademeli etkili set. Eski ikili kural RIR 0 ile RIR 3'ü aynı
                sayıyor, RIR 4'ü hiç saymıyordu. Yakınlık meta-regresyonu
                hipertrofinin yetmezliğe yaklaştıkça arttığını buluyor. */}
            {onToggleGradedSets && (
              <div className="pt-2.5 border-t border-zinc-800 space-y-2">
                <button
                  onClick={onToggleGradedSets}
                  aria-pressed={gradedEffectiveSets}
                  className={`w-full rounded-xl py-2.5 border text-[10px] font-bold uppercase tracking-wider transition-colors ${gradedEffectiveSets ? 'border-emerald-600 bg-emerald-950/25 text-emerald-300' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
                >
                  Kademeli Etkili Set {gradedEffectiveSets ? '(açık)' : '(kapalı)'}
                </button>
                {effectiveSetComparison?.hasData && (
                  <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                    Son seansında ikili kural <strong className="text-zinc-200">{effectiveSetComparison.binary}</strong> etkili
                    set sayıyor, kademeli ölçü <strong className="text-emerald-300">{effectiveSetComparison.graded}</strong>.
                    {' '}{effectiveSetComparison.note}
                  </p>
                )}
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                  İkili kural RIR 0 ile RIR 3'ü aynı sayıyor ve RIR 4'ü hiç
                  saymıyordu. Kademeli ölçü yetmezliğe yakınlığa göre ağırlık
                  veriyor. Ağırlıklar eğrinin şeklinden geliyor, ölçülmüş
                  katsayılar değil. Varsayılan kapalı: geçmiş sayılarının bir
                  gecede değişmesi kimseye yardımcı olmaz.
                </p>
              </div>
            )}

            {/* Koç odağı. Koç maddelerinin önceliği koda sabitlenmişti ve o
                sabitler herkes için aynıydı; oysa kas kazanmaya çalışan biriyle
                omzunu bir daha sakatlamamaya çalışan biri aynı sırayı
                istemiyor. */}
            {onChangeCoachFocus && (
              <div className="pt-2.5 border-t border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  Koç Odağı
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.values(COACH_FOCUSES).map(f => {
                    const secili = coachFocus === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => onChangeCoachFocus(f.key)}
                        aria-pressed={secili}
                        className={`rounded-xl py-2 px-1 border text-[9px] font-bold transition-colors ${secili ? 'border-cyan-500 bg-cyan-950/30 text-cyan-200' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                  {findFocus(coachFocus).desc}
                </p>
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                  Odak maddeleri silmiyor, SIRALARINI kaydırıyor. Sağlık ve
                  toparlanma maddeleri hiçbir odakta geri itilmiyor: bir tercih
                  ekranının kullanıcıyı sakatlığa götürebilmesi kabul edilebilir
                  bir tasarım değil.
                </p>
              </div>
            )}

            {/* Program kodu: şablonlar cihazda kilitliydi. QR yedeğin tamamını
                taşıyor; tek bir programı vermek için bütün veriyi paylaşmak
                makul değil. */}
            {onImportProgramCode && (
              <div className="pt-2.5 border-t border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  Program Kodu İçe Aktar
                </span>
                <textarea
                  value={programCode}
                  onChange={(e) => setProgramCode(e.target.value)}
                  rows="2"
                  placeholder="PO1. ile başlayan kodu yapıştır"
                  aria-label="Program kodu"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-300 font-mono text-[10px] outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  disabled={!programCode.trim()}
                  onClick={async () => {
                    if (await onImportProgramCode(programCode)) setProgramCode('');
                  }}
                  className="w-full py-2.5 rounded-xl border border-cyan-900/60 bg-cyan-950/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider disabled:opacity-30"
                >
                  İçe Aktar
                </button>
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                  Kod programın YAPISINI taşıyor: hareketler, set sayıları,
                  süperset bağları, tekrar aralıkları. Ağırlıklar taşınmıyor —
                  başkasının yükünü senin programına yazmak yanlış bir
                  başlangıç değeri önermek olurdu. Kendi programının kodunu
                  şablon önizlemesindeki "Kod" düğmesinden alabilirsin.
                </p>
              </div>
            )}

            {onExportCsv && (
              <div className="pt-2.5 border-t border-zinc-800 space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  Elektronik Tablo (CSV)
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'workouts', label: 'Setler' },
                    { key: 'metrics', label: 'Ölçüm' },
                    { key: 'nutrition', label: 'Besin' },
                    { key: 'cardio', label: 'Kardiyo' },
                  ].map(o => (
                    <button
                      key={o.key}
                      onClick={() => onExportCsv(o.key)}
                      className="bg-zinc-900 border border-zinc-800 text-zinc-300 active:bg-zinc-800 font-bold py-2.5 rounded-xl uppercase tracking-wider text-[10px] transition-colors"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                  Excel ve Google E-Tablolar için hazır: noktalı virgül ayraçlı,
                  ondalıklar virgüllü. Geri yükleme için değil, kendi analizini
                  kurmak için — geri yükleme JSON yedeğiyle yapılır.
                </p>
              </div>
            )}
          </div>

          {/* --- GÖRÜNÜM --- */}
          <Group visible={sectionVisible('appearance')} icon={<Sun size={12} className="text-amber-400" />} title="Görünüm">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block mb-2">Tema</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'dark', label: 'Obsidyen', icon: Moon },
                  { key: 'light', label: 'Fildişi', icon: Sun },
                ].map(t => {
                  const Icon = t.icon;
                  const aktif = (settings.theme || 'dark') === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => set({ theme: t.key })}
                      className={`py-2.5 rounded-lg text-[10px] font-bold uppercase border transition-colors flex items-center justify-center gap-1.5 ${aktif ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                    >
                      <Icon size={12} /> {t.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">
                Seçtiğin tema kaydedilir ve uygulamayı her açtığında geçerli olur.
              </p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block mb-2">Yazı Boyutu</span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { v: 0.9, l: 'Küçük' },
                  { v: 1, l: 'Normal' },
                  { v: 1.15, l: 'Büyük' },
                  { v: 1.3, l: 'En Büyük' },
                ].map(o => (
                  <button
                    key={o.v}
                    onClick={() => set({ fontScale: o.v })}
                    className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-colors ${(settings.fontScale || 1) === o.v ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
              <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">
                Tüm uygulamadaki yazılar bu orana göre ölçeklenir.
              </p>
            </div>

            {profileGender === 'female' && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-zinc-200 text-[11px] font-bold block mb-2">Vurgu Rengi</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    // Sabit hex kullanılır: rose tema seçiliyken global cyan değişkeni
                    // pembeye döner; sınıf kullanılsa iki önizleme noktası da pembe görünürdü.
                    { key: 'cyan', label: 'Şampanya', color: '#d8b66b' },
                    { key: 'rose', label: 'Gül', color: '#de7fa2' },
                  ].map(option => {
                    const active = (settings.accentTheme || 'cyan') === option.key;
                    return (
                      <button key={option.key} onClick={() => set({ accentTheme: option.key })}
                        className={`py-2.5 rounded-lg text-[10px] font-bold uppercase border flex items-center justify-center gap-2 ${active ? 'border-cyan-600 text-cyan-400 bg-cyan-950/25' : 'border-zinc-800 text-zinc-500 bg-zinc-900'}`}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: option.color }} /> {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] font-mono text-zinc-600 mt-2">İsteğe bağlıdır; sağlık ve uyarı renklerini değiştirmez.</p>
              </div>
            )}

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold flex items-center gap-1.5 mb-1">
                <Layers3 size={12} className="text-orange-400" /> Bilgi Yoğunluğu
              </span>
              <span className="text-zinc-500 text-[10px] font-mono block mb-2 leading-snug">
                Basit görünüm günlük kararları öne çıkarır; ayrıntılar kaldırılmaz, kapalı başlar.
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'simple', label: 'Basit', hint: 'Önerilen' },
                  { key: 'detailed', label: 'Detaylı', hint: 'Her şey açık' },
                ].map(mode => {
                  const active = (settings.interfaceMode || 'simple') === mode.key;
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => set({ interfaceMode: mode.key })}
                      className={`py-2 rounded-lg border transition-colors ${active ? 'bg-orange-950/40 border-orange-600 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                    >
                      <span className="text-[10px] font-bold uppercase block">{mode.label}</span>
                      <span className="text-[8px] font-mono opacity-70 block">{mode.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => { onClose(); onOpenOnboarding?.(); }}
              className="w-full p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-left active:bg-zinc-900"
            >
              <span className="text-zinc-200 text-[11px] font-bold block">Uygulama Turunu Tekrar Göster</span>
              <span className="text-zinc-500 text-[9px] font-mono block mt-0.5">Ana bölümleri ve kullanım akışını yeniden anlatır.</span>
            </button>
          </Group>

          {/* --- VÜCUT & HESAPLAMA --- */}
          <Group visible={sectionVisible('body')} icon={<Beef size={12} className="text-cyan-400" />} title="Vücut & Hesaplama">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block">BMI Değerlendirmesi</span>
              <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 mb-2 leading-snug">
                Klasik BMI kası yağdan ayırt edemez; kaslı biri fazla kilolu çıkar.
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'standard', label: 'Klasik' },
                  { key: 'athletic', label: 'Sporcu' },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => set({ bmiMode: m.key })}
                    className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-colors ${(settings.bmiMode || 'athletic') === m.key ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">
                {(settings.bmiMode || 'athletic') === 'athletic'
                  ? 'Yağ oranın sağlıklı bandın içindeyse yüksek BMI kas olarak yorumlanır; FFMI arttıkça üst sınırlar yukarı kaydırılır.'
                  : 'Dünya Sağlık Örgütü aralıkları (18.5 / 25 / 30) olduğu gibi kullanılır.'}
              </p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block">Günlük Hareket (NEAT)</span>
              <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 mb-2 leading-snug">
                Antrenman dışı hareketlilik. Otomatik yöntem gerçek harcamandan
                bazal, sindirim ve ortalama antrenman payını düşerek bulur.
              </span>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[
                  { key: 'auto', label: 'Oto' },
                  { key: 'level', label: 'Seviye' },
                  { key: 'steps', label: 'Adım' },
                  { key: 'manual', label: 'Elle' },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => set({ neatMode: m.key })}
                    className={`py-2 rounded-lg text-[9px] font-bold uppercase border transition-colors ${(settings.neatMode || 'auto') === m.key ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {settings.neatMode === 'level' && (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    {ACTIVITY_LEVELS.map(l => (
                      <button
                        key={l.key}
                        onClick={() => set({ activityLevel: l.key })}
                        className={`py-2 rounded-lg text-[9px] font-bold uppercase border transition-colors ${(settings.activityLevel || 'light') === l.key ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                    {(ACTIVITY_LEVELS.find(l => l.key === (settings.activityLevel || 'light')) || ACTIVITY_LEVELS[1]).hint}
                  </p>
                </div>
              )}

              {settings.neatMode === 'steps' && (
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed flex items-start gap-1.5">
                  <Footprints size={11} className="text-cyan-400 shrink-0 mt-0.5" />
                  Adım sayısını Beslenme sekmesinde gün gün girersin. Yakım vücut
                  ağırlığınla ölçeklenir (yaklaşık 0.0005 kcal/adım/kg).
                </p>
              )}

              {/* Çarpan otomatik ve seviye hesabını ölçekler; kullanıcı kendi
                  gözlemine göre "bana bu az/çok geliyor" diyebilsin. */}
              {(settings.neatMode === 'auto' || settings.neatMode === 'level' || !settings.neatMode) && (
                <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-zinc-900">
                  <span className="text-[10px] font-mono text-zinc-500">Çarpan</span>
                  <span className="flex items-center gap-1.5">
                    {[0.8, 0.9, 1, 1.1, 1.25].map(v => (
                      <button
                        key={v}
                        onClick={() => set({ neatMultiplier: v })}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors ${(settings.neatMultiplier || 1) === v ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                      >
                        {v}×
                      </button>
                    ))}
                  </span>
                </div>
              )}

              {settings.neatMode === 'manual' && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-zinc-500">Günlük sabit</span>
                  <span className="flex items-center gap-1.5">
                    <input
                      type="number" inputMode="numeric" min={0} max={3000}
                      value={settings.neatManual ?? ''}
                      onChange={(e) => set({ neatManual: e.target.value })}
                      onBlur={(e) => set({ neatManual: e.target.value === '' ? '' : Math.min(3000, Math.max(0, Number(e.target.value) || 0)) })}
                      placeholder="0"
                      className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 text-center font-mono text-cyan-400 text-[11px] outline-none focus:border-cyan-500"
                    />
                    <span className="text-[10px] font-mono text-zinc-600">kcal</span>
                  </span>
                </div>
              )}
            </div>
          </Group>

          {/* --- ANTRENMAN --- */}
          <Group visible={sectionVisible('training')} icon={<Dumbbell size={12} className="text-cyan-400" />} title="Antrenman">
            <Toggle
              label="Son Seti Kopyala"
              hint="Yeni set eklerken önceki setin değerlerini klonlar."
              checked={settings.autoCopyLastSet}
              onChange={(v) => set({ autoCopyLastSet: v })}
            />
            <Toggle
              label="Dinlenmeyi Otomatik Başlat"
              hint="Bir sete tekrar girdiğinde sayaç kendiliğinden başlar."
              checked={settings.autoRestTimer}
              onChange={(v) => set({ autoRestTimer: v })}
            />
            <Toggle
              label="Bitişte Sesli Uyarı"
              hint="Dinlenme bitince seçtiğin tını ve ses düzeyiyle uyarır."
              checked={settings.restAlert}
              onChange={(v) => set({ restAlert: v })}
            />

            {/* Kilit ekranı kartı duyulmaz bir ses döngüsüyle var oluyor ve
                cihazda aynı anda tek bir "Şu An Çalınan" oturumu olabiliyor.
                Bu yüzden kart ile müzik aynı anda yaşayamıyor — tekniğin
                sınırı, düzeltilebilecek bir hata değil. Seçim kullanıcıda. */}
            {/* Şiddet: tek bip müzik çalarken kayboluyordu. Yükselen üç
                notalı dizi, tekrar ve güçlü titreşim deseni müziğin üstünde
                duyuluyor. */}
            {settings.restAlert && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block mb-1.5">Uyarı şiddeti</span>
                <div className="flex gap-1.5">
                  {REST_ALERT_INTENSITIES.map(x => {
                    const secili = (settings.restAlertIntensity || 'strong') === x.key;
                    return (
                      <button
                        key={x.key}
                        onClick={() => { set({ restAlertIntensity: x.key }); testSound({ intensityKey: x.key }); }}
                        title={x.hint}
                        aria-pressed={secili}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-colors ${secili ? 'border-cyan-600 bg-cyan-950/25 text-cyan-300' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
                      >
                        {x.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed mt-1.5">
                  Dokununca örnek çalar. {REST_ALERT_INTENSITIES.find(x => x.key === (settings.restAlertIntensity || 'strong'))?.hint}
                </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block mb-1.5">Uyarı tınısı</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {REST_ALERT_TONES.map(tone => {
                      const active = (settings.restAlertTone || 'ascending') === tone.key;
                      return (
                        <button
                          key={tone.key}
                          onClick={() => { set({ restAlertTone: tone.key }); testSound({ toneKey: tone.key }); }}
                          title={tone.hint}
                          aria-pressed={active}
                          className={`py-2 rounded-xl text-[10px] font-bold border transition-colors ${active ? 'border-amber-600 bg-amber-950/20 text-amber-300' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
                        >
                          {tone.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1.5">
                    <span className="text-zinc-500">Ses düzeyi</span>
                    <span className="text-cyan-400">%{Math.round((settings.restAlertVolume ?? 0.85) * 100)}</span>
                  </div>
                  <input
                    type="range" min="0.2" max="1" step="0.05"
                    value={settings.restAlertVolume ?? 0.85}
                    onChange={(e) => set({ restAlertVolume: Number(e.target.value) })}
                    onPointerUp={() => testSound()}
                    className="w-full accent-cyan-500"
                    aria-label="Dinlenme uyarısı ses düzeyi"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-mono text-zinc-500 block mb-1.5">Bitişten önce kısa uyarı</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 5, 10, 15].map(seconds => (
                      <button
                        key={seconds}
                        onClick={() => set({ restPreAlertSeconds: seconds })}
                        className={`py-2 rounded-lg text-[10px] font-bold border ${Number(settings.restPreAlertSeconds || 0) === seconds ? 'border-cyan-600 bg-cyan-950/25 text-cyan-300' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
                      >
                        {seconds === 0 ? 'Kapalı' : `${seconds} sn`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => testSound()}
                  className="w-full py-2.5 rounded-xl border border-cyan-900/60 bg-cyan-950/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Volume2 size={13} /> Seçili Ayarlarla Test Et
                </button>
                {soundTest && (
                  <div className={`rounded-lg border px-2.5 py-2 flex items-start gap-2 ${soundTest.ok ? 'border-emerald-900/50 bg-emerald-950/15' : 'border-amber-900/50 bg-amber-950/15'}`}>
                    {soundTest.ok
                      ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                      : <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />}
                    <span className={`text-[9px] font-mono leading-relaxed ${soundTest.ok ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {soundTest.ok
                        ? `Ses motoru hazır · ${soundTest.state}`
                        : `Ses motoru hazır değil · ${soundTest.state}${soundTest.error ? ` · ${soundTest.error}` : ''}`}
                      {/* Sesin neden gelmediğini tahmin ettirmek yerine
                          söylüyoruz: üç mekanizmanın hangisinin çalıştığı
                          ayrı ayrı görünüyor. */}
                      <span className="block mt-1 text-zinc-500">
                        Bildirim izni: {soundTest.notification === 'granted' ? 'verildi'
                          : soundTest.notification === 'denied' ? 'reddedildi'
                            : soundTest.notification === 'unsupported' ? 'desteklenmiyor' : 'sorulmadı'}
                        {' · '}
                        Zamanlanmış bildirim: {soundTest.triggers ? 'destekleniyor' : 'yok'}
                        {' · '}
                        Ayakta tutma: {soundTest.keepAlive ? 'açık' : 'kapalı'}
                      </span>
                      {!soundTest.triggers && (
                        <span className="block mt-1 text-zinc-600">
                          Bu tarayıcı bildirimi önceden zamanlayamıyor. Ekran
                          kapalıyken uyarının kaçmaması için "Dinlenmede Ses
                          Motorunu Ayakta Tut" açık kalmalı.
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Ekran kapanınca tarayıcı sayfayı donduruyor ve ses motorunu
                askıya alıyordu; zamanlanmış uyarı bu yüzden bazen hiç
                çalmıyordu. */}
            <Toggle
              label="Dinlenmede Ses Motorunu Ayakta Tut"
              hint="Dinlenme sayacı çalışırken duyulmayan bir ses akışı sürer. Ekran kapalıyken ve müzik çalarken uyarının kaçmasını önler; kapatırsan pil biraz daha az harcanır ama uyarı bazen gelmeyebilir."
              checked={settings.restKeepAwake !== false}
              onChange={(v) => set({ restKeepAwake: v })}
            />

            <Toggle
              label="Ekranı Işıkla Uyar"
              hint="Dinlenme bittiğinde ses kapalı olsa bile ekranda kısa bir renkli uyarı gösterir."
              checked={settings.restVisualAlert !== false}
              onChange={(v) => set({ restVisualAlert: v })}
            />

            <Toggle
              label="Müzik Önceliği"
              hint="Açıkken kilit ekranı antrenman kartı hiç başlatılmaz ve müziğin kesilmez. Kapalıyken kart çalışır; müzik başlatırsan kart sessizce kapanır ve seans bitene kadar geri gelmez."
              checked={Boolean(settings.musicPriority)}
              onChange={(v) => set({ musicPriority: v })}
            />

            {/* Ses ve titreşim telefon sessizdeyken ya da uygulama arka
                plandayken yetmiyor; bildirim sistemin kendi kanalını kullanıyor. */}
            <Toggle
              label="Bitişte Bildirim"
              hint={notificationState === 'denied'
                ? 'Tarayıcı bildirimlere izin vermiyor. Site ayarlarından açman gerekiyor.'
                : 'Telefon sessizdeyken veya uygulama arka plandayken de görünür. İzin ilk açılışta sorulur.'}
              checked={Boolean(settings.restNotification)}
              onChange={() => onToggleRestNotification?.()}
            />

            <Toggle
              label="Vücut Ağırlığını Yüke Say"
              hint="Barfiks, dip ve şınavda taşınan vücut ağırlığı yüke katılır. Kapatırsan ağırlık alanı mutlak yük olarak okunur."
              checked={settings.bodyweightLoad !== false}
              onChange={(v) => set({ bodyweightLoad: v })}
            />

            {/* Ağırlık alanının anlamı kullanıcıdan kullanıcıya değişiyor:
                kimi "0" (ek yok), kimi "80" (toplam) yazıyor. Geçmiş çoğu zaman
                karışık olduğu için varsayılan set bazında tanıma. */}
            {settings.bodyweightLoad !== false && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-zinc-200 text-[11px] font-bold block mb-1">Ağırlık Alanının Anlamı</span>
                <span className="text-zinc-500 text-[10px] font-mono block mb-2 leading-snug">
                  Barfiks, dip ve şınavda taşınan vücut ağırlığı yüke sayılıyor.
                  Taban, O ANTRENMANDAKİ kilon: seans kaydedilirken dondurulan
                  değer, yoksa o tarihe kadarki en son ölçüm. Bu ayar yalnızca
                  ağırlık alanına NE YAZDIĞINI söylüyor.
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'auto', label: 'Otomatik', hint: 'Karışıksa' },
                    { key: 'added', label: 'Ek yük', hint: '+10 yazıyorum' },
                    { key: 'total', label: 'Toplam', hint: '92 yazıyorum' },
                  ].map(o => {
                    const aktif = (settings.bodyweightEntry || 'auto') === o.key;
                    return (
                      <button
                        key={o.key}
                        onClick={() => set({ bodyweightEntry: o.key })}
                        className={`py-2 px-1 rounded-lg border leading-tight transition-colors ${aktif ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                      >
                        <span className="text-[10px] font-bold block">{o.label}</span>
                        <span className="text-[8px] font-mono opacity-70 block mt-0.5">{o.hint}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Somut örnek: seçilen ayarın ne anlama geldiğini anlatmanın
                    en kısa yolu, aynı sayının iki ayarda ne ürettiğini
                    göstermek. */}
                <p className="text-[9px] font-mono text-zinc-500 leading-relaxed mt-2">
                  {(settings.bodyweightEntry || 'auto') === 'total'
                    ? 'Örnek: 82 kg vücutla barfikste alana 92 yazarsan yük 92 kg sayılır — üstüne ekleme yapılmaz.'
                    : (settings.bodyweightEntry || 'auto') === 'added'
                      ? 'Örnek: 82 kg vücutla barfikste alana 10 yazarsan yük 92 kg olur. Ek yük yoksa 0 bırak; yük yine 82 kg sayılır.'
                      : 'Örnek: 82 kg vücutla barfikste 10 yazarsan 92 kg, 92 yazarsan yine 92 kg sayılır — her set kendi biçiminden tanınır. Geçmişi karışık olanlar için doğru seçenek.'}
                  {' '}Antrenman ekranında hareketin üstünde canlı olarak yazıyor.
                </p>

                {bodyweightAudit && (bodyweightAudit.total > 0 || bodyweightAudit.added > 0) && (
                  <div className="mt-2.5 pt-2.5 border-t border-zinc-800 space-y-2">
                    <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
                      Kayıtlarında <strong className="text-cyan-400">{bodyweightAudit.added}</strong> set ek yük,
                      {' '}<strong className="text-amber-400">{bodyweightAudit.total}</strong> set toplam yazımı görünüyor.
                      {bodyweightAudit.hasMixed && ' İkisi karışık — otomatik tanıma her setin kendi biçimini kullanıyor.'}
                    </p>
                    {bodyweightAudit.byExercise.slice(0, 3).map(e => (
                      <div key={e.name} className="flex justify-between text-[9px] font-mono">
                        <span className="text-zinc-500 truncate">{e.name}</span>
                        <span className="text-zinc-600 shrink-0">ek {e.added} · toplam {e.total}</span>
                      </div>
                    ))}
                    {bodyweightAudit.canNormalize && onNormalizeBodyweight && (
                      <>
                        <button
                          onClick={onNormalizeBodyweight}
                          className="w-full bg-zinc-900 border border-cyan-900/50 text-cyan-400 active:bg-zinc-800 font-bold py-2.5 rounded-xl uppercase text-[10px] tracking-wider transition-colors"
                        >
                          Geçmişi tek biçime çevir ({bodyweightAudit.total} set)
                        </button>
                        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                          Toplam yazılmış setlerden o tarihteki vücut ağırlığı düşülür; alan
                          yalnızca ek yükü gösterir. Hesaplanan yükler <strong>değişmez</strong> —
                          yalnızca yazım biçimi tekleşir. Önce yedek almanı öneririm.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <Toggle
              label="Harekete Göre Dinlenme"
              hint="Ağır squat ile lateral raise aynı süreye ihtiyaç duymuyor. Süre; kas kütlesi, bileşiklik, RIR ve tekrar sayısından hesaplanır."
              checked={settings.smartRest !== false}
              onChange={(v) => set({ smartRest: v })}
            />

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block mb-1">Varsayılan Dinlenme</span>
              <span className="text-zinc-500 text-[10px] font-mono block mb-2 leading-snug">
                {settings.smartRest !== false
                  ? 'Harekete göre dinlenme açıkken yalnızca öneri üretilemeyen durumlarda kullanılır.'
                  : 'Bütün setlerde bu süre kullanılır.'}
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[60, 90, 120, 180].map(sec => (
                  <button
                    key={sec}
                    onClick={() => set({ restSeconds: sec })}
                    className={`py-2 rounded-lg text-[11px] font-bold border transition-colors ${settings.restSeconds === sec ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Salon plaka envanteri: hesaplayıcı ve ısınma piramidi buna göre
                yuvarlıyor. 1.25'i olmayan bir salonda 82.5 kg önermek,
                yüklenemeyecek bir hedef vermek demekti. */}
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block mb-1">Salondaki Plakalar</span>
              <span className="text-zinc-500 text-[10px] font-mono block mb-2 leading-snug">
                Plaka hesaplayıcı ve ısınma piramidi yalnızca seçili plakaları kullanır.
                En küçük plaka, yükleme adımını belirler (çift olarak takıldığı için iki katı).
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {PLATE_OPTIONS.map(p => {
                  const secili = (settings.availablePlates || AVAILABLE_PLATES).includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        const mevcut = settings.availablePlates || AVAILABLE_PLATES;
                        const sonraki = secili ? mevcut.filter(x => x !== p) : [...mevcut, p];
                        // Hepsi kapatılırsa hesaplayıcı hiçbir ağırlık kuramaz;
                        // son plaka çıkarılmaya çalışılırsa yok sayılıyor.
                        if (sonraki.length === 0) return;
                        set({ availablePlates: [...new Set(sonraki)].sort((a, b) => b - a) });
                      }}
                      className={`py-2 rounded-lg text-[10px] font-bold border transition-colors ${secili ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <span className="text-zinc-600 text-[9px] font-mono block mt-2">
                En küçük plaka {smallestPlateOf(settings.availablePlates)} kg — yükleme adımı {smallestPlateOf(settings.availablePlates) * 2} kg.
              </span>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block">Hedef Tekrar Aralığı</span>
              <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 mb-2 leading-snug">
                Üst sınıra ulaşınca ağırlık artar, alt sınıra dönülür.
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number" inputMode="numeric" value={settings.repRangeMin}
                  onChange={(e) => set({ repRangeMin: Math.max(1, Number(e.target.value) || 1) })}
                  className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg py-2 text-center font-mono text-cyan-400 text-xs outline-none"
                />
                <span className="text-zinc-600">—</span>
                <input
                  type="number" inputMode="numeric" value={settings.repRangeMax}
                  onChange={(e) => set({ repRangeMax: Math.max(1, Number(e.target.value) || 1) })}
                  className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-lg py-2 text-center font-mono text-cyan-400 text-xs outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block">Antrenman Deneyimi</span>
              <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 mb-2 leading-snug">
                Hacim bandını kaydırır ve genişletir.
              </span>
              <div className="grid grid-cols-3 gap-2">
                {EXPERIENCE_LEVELS.map(l => (
                  <button
                    key={l.key}
                    onClick={() => set({ experienceLevel: l.key })}
                    className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-colors ${settings.experienceLevel === l.key ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">
                {(EXPERIENCE_LEVELS.find(l => l.key === settings.experienceLevel) || EXPERIENCE_LEVELS[1]).hint}
              </p>
              <p className="text-[9px] font-mono text-zinc-600 mt-1.5 leading-relaxed border-t border-zinc-900 pt-1.5">
                Emin değilsen <strong className="text-zinc-400">Orta</strong> seç: referans değerler bu
                seviyeye göre belirlendi ve çoğu kişi için en güvenli başlangıç.
                Seviye ne olursa olsun hedef, eşik ile verimli bandın üstü arasında kalıp haftadan haftaya
                hacmi yavaşça artırmak.
              </p>
            </div>
          </Group>

          {/* --- BESLENME --- */}
          <Group visible={sectionVisible('nutrition')} icon={<Beef size={12} className="text-orange-400" />} title="Beslenme Hedefleri">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block mb-2">Dönem Hedefi</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'bulk', label: 'Büyüme' },
                  { key: 'maintenance', label: 'Koruma' },
                  { key: 'cut', label: 'Yağ Yakım' },
                ].map(g => (
                  <button
                    key={g.key}
                    onClick={() => set({ nutritionGoal: g.key })}
                    className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-colors ${settings.nutritionGoal === g.key ? 'bg-orange-900/30 border-orange-600 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hız seçimi yalnızca kesme/büyüme dönemlerinde anlamlı. */}
            {paceOptions.length > 0 && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-zinc-200 text-[11px] font-bold block">
                  Haftalık {settings.nutritionGoal === 'cut' ? 'Kayıp' : 'Alım'} Hızı
                </span>
                <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 mb-2 leading-snug">
                  Vücut ağırlığının yüzdesi olarak. Mutlak kg yerine yüzde kullanılır;
                  haftada 0.5 kg 60 kiloda agresif, 110 kiloda yavaştır.
                </span>
                <div className={`grid gap-2 ${paceOptions.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {paceOptions.map(r => {
                    const active = (settings.paceRate || activePace?.key) === r.key;
                    return (
                      <button
                        key={r.key}
                        onClick={() => set({ paceRate: r.key })}
                        className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-colors ${active ? 'bg-orange-900/30 border-orange-600 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                      >
                        {r.label}
                        <span className="block text-[8px] font-mono normal-case tracking-normal opacity-70">
                          %{r.weeklyPct}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {activePace && (
                  <p className="text-[9px] font-mono text-zinc-600 mt-2 leading-relaxed">{activePace.hint}</p>
                )}
                <p className="text-[9px] font-mono text-zinc-600 mt-1.5 leading-relaxed border-t border-zinc-900 pt-1.5">
                  Seçtiğin hız, yağ oranına göre belirlenen güvenli sınırı aşamaz —
                  aşarsa otomatik kırpılır ve analiz ekranında bunu görürsün.
                </p>
              </div>
            )}

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-zinc-200 text-[11px] font-bold block">Protein Çarpanı</span>
              <span className="text-zinc-500 text-[10px] font-mono block mt-0.5 mb-2 leading-snug">
                Yağsız kütle (kg) başına gram. Kalori açığında ihtiyaç artar.
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'proteinPerFfmBulk', label: 'Büyüme' },
                  { key: 'proteinPerFfmCut', label: 'Yağ Yakım' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">{f.label}</label>
                    <input
                      type="number" inputMode="decimal" step="0.1"
                      value={settings[f.key]}
                      onChange={(e) => set({ [f.key]: Number(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 text-center font-mono text-orange-400 text-xs outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Group>

          {/* --- CİHAZ --- */}
          <Group visible={sectionVisible('device')} icon={<Smartphone size={12} className="text-emerald-400" />} title="Cihaz">
            <Toggle
              label="Kilit Ekranı Kartı"
              hint="Ekran kapalıyken süre, hareket ve dinlenme kilit ekranında görünür."
              checked={settings.lockScreenActivity}
              onChange={(v) => set({ lockScreenActivity: v })}
            />
            <Toggle
              label="Ekranı Açık Tut"
              hint="Seans boyunca ekranın kapanmasını engeller."
              checked={settings.keepScreenAwake}
              onChange={(v) => set({ keepScreenAwake: v })}
            />
          </Group>

          {/* --- SAĞLIK DIŞA AKTARIM --- */}
          <Group visible={sectionVisible('device')} icon={<HeartPulse size={12} className="text-red-400" />} title="Sağlık Uygulamaları">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => downloadBlob(exportAppleHealthXML(workouts, nutritionHistory), 'application/xml', 'Apple_Health_Export.xml')}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 active:bg-zinc-800 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px] transition-colors"
              >
                <Download size={12} className="text-red-400" /> Apple Health
              </button>
              <button
                onClick={() => downloadBlob(exportGoogleFitJSON(workouts, nutritionHistory), 'application/json', 'Google_Fit_Export.json')}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 active:bg-zinc-800 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px] transition-colors"
              >
                <Download size={12} className="text-blue-400" /> Google Fit
              </button>
            </div>
          </Group>

          {/* Mağaza politikaları uygulamanın içinde kolay erişilebilir olmalı.
              Bağlantılar statik sayfaya gider; uygulama durumu veya localStorage
              bozulsa bile politika ve destek içeriği açılabilir. */}
          <Group visible={sectionVisible('privacy')} icon={<ShieldCheck size={12} className="text-emerald-400" />} title="Gizlilik & Mağaza">
            <div className="grid grid-cols-3 gap-2">
              {[
                { href: '/privacy.html', label: 'Gizlilik' },
                { href: '/support.html', label: 'Destek' },
                { href: '/terms.html', label: 'Koşullar' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 active:bg-zinc-800 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 uppercase tracking-wider text-[9px]"
                >
                  {link.label} <ExternalLink size={10} />
                </a>
              ))}
            </div>
            {onOpenStoreReadiness && (
              <button
                type="button"
                onClick={() => { onClose(); onOpenStoreReadiness(); }}
                className="w-full bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 active:bg-emerald-900/40 font-bold py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-[10px]"
              >
                <ShieldCheck size={14} /> Mağaza Hazırlık Merkezi
              </button>
            )}
            <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
              Sağlık hesapları tahmindir; uygulama tıbbi cihaz değildir ve tanı veya tedavi sunmaz.
            </p>
          </Group>

          {/* --- SÜRÜM BİLGİSİ --- */}
          <Group visible={sectionVisible('privacy')} icon={<Sparkles size={12} className="text-cyan-400" />} title="Sürüm & Güncelleme">
            <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <div>
                <span className="text-[11px] font-bold text-zinc-200 block">ProOverload v{APP_VERSION}</span>
                <span className="text-[9px] font-mono text-zinc-500 block mt-0.5">Son güncelleme · sürüm geçmişi</span>
              </div>
              {onOpenReleaseNotes && (
                <button
                  type="button"
                  onClick={onOpenReleaseNotes}
                  className="bg-zinc-900 border border-zinc-800 hover:border-cyan-800 text-cyan-400 text-[10px] font-bold px-3 py-1.5 rounded-lg active:bg-zinc-800 transition-colors"
                >
                  Güncellemeler
                </button>
              )}
            </div>
          </Group>
        </div>

        <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0 pb-safe">
          <button
            onClick={onClose}
            className="w-full bg-zinc-100 active:bg-white text-zinc-900 font-bold py-3 rounded-xl uppercase text-[11px] tracking-wider transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';

export default SettingsModal;
