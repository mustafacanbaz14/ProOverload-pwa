import React, { useMemo, memo } from 'react';
import { X, Stethoscope, AlertTriangle, Info, CheckCircle2, Trash2 } from 'lucide-react';
import { auditWorkoutData } from '../utils/dataHealth';
import { formatDay } from '../utils/dates';

/**
 * Veri sağlığı.
 *
 * Bulgular gösteriliyor, düzeltme kullanıcıya bırakılıyor. Tek otomatik işlem
 * boş kayıtların silinmesi; onun da düzeltilmesi tartışmasız (içinde veri yok).
 * 600 kg'lık bir set yanlış olabilir ama doğru da olabilir ve kullanıcının
 * verisini tahminle değiştirmek, bozuk veriden daha kötü.
 */

const SEVERITY = {
  high: { border: 'border-red-900/50', bg: 'bg-red-950/20', text: 'text-red-300', icon: AlertTriangle, label: 'Hesabı bozuyor' },
  medium: { border: 'border-amber-900/50', bg: 'bg-amber-950/20', text: 'text-amber-300', icon: AlertTriangle, label: 'Şüpheli' },
  low: { border: 'border-zinc-800', bg: 'bg-zinc-950/60', text: 'text-zinc-300', icon: Info, label: 'Eksik' },
};

const STORAGE_LABELS = {
  storageUnavailable: 'Cihaz depolamasına erişilemiyor.',
  manifestCorrupt: 'Önceki bütünlük kaydı okunamadı; asıl veriler ayrı ayrı kontrol edildi.',
  manifestFutureVersion: 'Bütünlük kaydı bu uygulamadan daha yeni bir biçimde.',
  corruptValue: 'Bir veri anahtarı bozuk JSON içeriyor.',
  normalizationFailed: 'Bir kayıt güvenli biçime dönüştürülemedi.',
  legacyFallback: 'En yeni anahtar yerine eski güvenli sürüm kullanıldı.',
  checksumMismatch: 'Kayıt içeriği son bütünlük imzasıyla uyuşmuyor.',
  manifestKeyMismatch: 'Bütünlük kaydı farklı bir depolama anahtarını gösteriyor.',
  manifestWriteFailed: 'Veri yazıldı ancak bütünlük kaydı güncellenemedi.',
  writeFailed: 'Bir değişiklik cihaz depolamasına yazılamadı.',
  rawWriteFailed: 'Yedek tarihi gibi yardımcı bir kayıt yazılamadı.',
  unknownDataset: 'Bu veri alanı merkezi kalıcı koleksiyon sözlüğünde tanımlı değil.',
};

const DATASET_LABELS = {
  workouts: 'Antrenmanlar', templates: 'Şablonlar', custom_exercises: 'Özel hareketler',
  custom_foods: 'Özel besinler', recent_foods: 'Son besinler', meal_templates: 'Öğün şablonları',
  day_templates: 'Gün şablonları', active_workout: 'Aktif antrenman', metrics: 'Vücut ölçümleri',
  nutrition: 'Beslenme', wellness: 'Toparlanma', cycle: 'Döngü', settings: 'Ayarlar',
};

const DataHealthModal = memo(({
  isOpen, onClose, workouts = [], storageHealth = null, onRemoveEmpty,
}) => {
  const rapor = useMemo(
    () => (isOpen ? auditWorkoutData(workouts) : null),
    [isOpen, workouts]);

  if (!isOpen || !rapor) return null;

  const bosKayitlar = rapor.findings.filter(f => f.kind === 'emptyWorkout');

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="datahealth-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[92] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-md max-h-[88dvh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md shrink-0">
          <h3 id="datahealth-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest flex items-center">
            <Stethoscope size={16} className="mr-2 text-emerald-400" /> Veri Sağlığı & Denetim
          </h3>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">

        <p className="text-[10px] font-mono text-zinc-500 leading-relaxed px-1">
          Uygulamanın bütün hesapları (1RM, hacim, ACWR, adaptif TDEE, kuvvet
          dengesi) geçmiş kayıtlardan çıkıyor. Tek bir yanlış giriş — 100 yerine
          1000 kg — hepsini birden bozuyor ve bozulma sessiz oluyor: grafikte
          sıçrama görünür, sebebi görünmez.
        </p>

        {storageHealth && (
          <div className={`rounded-2xl border p-3.5 space-y-3 ${
            storageHealth.hasCritical
              ? 'border-red-900/50 bg-red-950/20'
              : storageHealth.hasIssues
                ? 'border-amber-900/50 bg-amber-950/20'
                : 'border-emerald-900/40 bg-emerald-950/20'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong className="text-[11px] text-zinc-100 block">Depolama bütünlüğü</strong>
                <span className="text-[9px] font-mono text-zinc-500 leading-relaxed block mt-0.5">
                  Veri içeriği, sürüm geri dönüşü ve yazma durumu
                </span>
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                storageHealth.hasCritical
                  ? 'text-red-400'
                  : storageHealth.hasIssues ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {storageHealth.hasCritical ? 'Müdahale gerekli' : storageHealth.hasIssues ? 'Kurtarıldı' : 'Sağlıklı'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl py-2 text-center">
                <span className="text-xs font-mono font-bold text-zinc-100 block">{storageHealth.checkedDatasets}</span>
                <span className="text-[8px] font-mono text-zinc-500">okunan alan</span>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl py-2 text-center">
                <span className="text-xs font-mono font-bold text-zinc-100 block">
                  {storageHealth.trackedDatasets}/{storageHealth.totalDatasets}
                </span>
                <span className="text-[8px] font-mono text-zinc-500">imzalı alan</span>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl py-2 text-center">
                <span className={`text-xs font-mono font-bold block ${storageHealth.recoveredDatasets ? 'text-amber-400' : 'text-zinc-100'}`}>
                  {storageHealth.recoveredDatasets}
                </span>
                <span className="text-[8px] font-mono text-zinc-500">geri kazanım</span>
              </div>
            </div>

            {storageHealth.manifestStatus === 'missing' && (
              <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                Bu cihazda önceki bütünlük kaydı yoktu. İlk güvenli kayıt arka planda oluşturuluyor;
                mevcut veriler silinmedi veya yeniden yorumlanmadı.
              </p>
            )}

            {storageHealth.issues.length > 0 && (
              <div className="space-y-1.5">
                {storageHealth.issues.slice(0, 8).map((issue, index) => (
                  <div key={`${issue.kind}-${issue.dataset || issue.key || index}`} className="flex items-start gap-2 text-[9px] font-mono leading-relaxed">
                    <AlertTriangle size={11} className={issue.severity === 'high' ? 'text-red-400 shrink-0 mt-0.5' : 'text-amber-400 shrink-0 mt-0.5'} />
                    <span className="text-zinc-300">
                      {issue.dataset && <strong>{DATASET_LABELS[issue.dataset] || issue.dataset}: </strong>}
                      {STORAGE_LABELS[issue.kind] || issue.kind}
                    </span>
                  </div>
                ))}
                {storageHealth.issues.length > 8 && (
                  <p className="text-[8px] font-mono text-zinc-500">+{storageHealth.issues.length - 8} ek depolama bulgusu</p>
                )}
              </div>
            )}

            <p className="text-[8px] font-mono text-zinc-600 leading-relaxed">
              Eski sürüm anahtarları geri dönüş kopyası olarak korunur. Bütünlük uyarısı veriyi otomatik silmez.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {[
            { value: rapor.scanned, label: 'kayıt tarandı', color: 'text-zinc-100' },
            { value: rapor.criticalCount, label: 'ciddi', color: rapor.criticalCount > 0 ? 'text-red-400' : 'text-zinc-100' },
            { value: rapor.findings.length, label: 'toplam bulgu', color: rapor.findings.length > 0 ? 'text-amber-400' : 'text-zinc-100' },
          ].map(k => (
            <div key={k.label} className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 text-center">
              <span className={`text-sm font-mono font-bold block ${k.color}`}>{k.value}</span>
              <span className="text-[9px] font-mono text-zinc-500">{k.label}</span>
            </div>
          ))}
        </div>

        {!rapor.hasIssues ? (
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-3.5 flex items-start gap-2.5">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono text-emerald-200 leading-relaxed">
              {rapor.scanned} antrenman kaydında aykırı değer, yarım kalmış set
              ya da kopya kayıt bulunamadı. Hesapların dayandığı veri temiz.
            </p>
          </div>
        ) : (
          <>
            {bosKayitlar.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
                <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-200">{bosKayitlar.length} boş kayıt</strong> —
                  içlerinde hiç set yok ama sıklık ve tutarlılık hesaplarına
                  &quot;antrenman yapıldı&quot; olarak giriyorlar.
                </p>
                <button
                  onClick={() => onRemoveEmpty?.()}
                  className="w-full bg-zinc-800 active:bg-zinc-700 text-zinc-200 font-bold py-2.5 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Trash2 size={13} /> Boş kayıtları sil
                </button>
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                  Diğer bulgular otomatik düzeltilmiyor: hangisinin hata hangisinin
                  gerçek olduğuna ancak sen karar verebilirsin. Geçmiş sekmesinden
                  ilgili kaydı açıp düzeltebilirsin.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {rapor.findings.map((f, i) => {
                const stil = SEVERITY[f.severity] || SEVERITY.low;
                const Icon = stil.icon;
                return (
                  <div key={`${f.kind}-${f.workoutId || f.date}-${i}`} className={`rounded-2xl border p-3.5 ${stil.border} ${stil.bg}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="flex items-start gap-2 min-w-0">
                        <Icon size={13} className={`${stil.text} shrink-0 mt-0.5`} />
                        <strong className={`text-[11px] leading-snug ${stil.text}`}>{f.title}</strong>
                      </span>
                      {f.date && (
                        <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                          {formatDay(f.date, 'short')}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] font-mono text-zinc-400 leading-relaxed pl-[21px]">{f.detail}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  </div>
  );
});

DataHealthModal.displayName = 'DataHealthModal';

export default DataHealthModal;
