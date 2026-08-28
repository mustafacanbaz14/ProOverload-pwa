import React, { memo, useMemo, useState } from 'react';
import {
  Check, ChevronRight, Clipboard, ExternalLink, Info, ShieldCheck, Smartphone, X,
} from 'lucide-react';
import {
  buildStoreReadiness, normalizeStoreChecklist, STORE_IDENTIFIERS, storeUrls,
} from '../utils/storeReadiness';

const tabs = [
  { key: 'foundation', label: 'Temel' },
  { key: 'ios', label: 'iOS' },
  { key: 'android', label: 'Android' },
];

const StoreReadinessModal = memo(({ isOpen, onClose, checklist = {}, onChangeChecklist }) => {
  const [tab, setTab] = useState('foundation');
  const [copied, setCopied] = useState('');
  const readiness = useMemo(() => buildStoreReadiness(checklist), [checklist]);
  const urls = useMemo(() => storeUrls(typeof window === 'undefined' ? '' : window.location.origin), []);
  if (!isOpen) return null;

  const group = readiness.groups[tab];
  const toggle = (check) => {
    if (check.automatic) return;
    const current = normalizeStoreChecklist(checklist);
    const next = { ...current };
    if (next[check.key]) delete next[check.key];
    else next[check.key] = true;
    onChangeChecklist?.(next);
  };
  const copy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(''), 1400);
    } catch { /* Panoya erişim yoksa değer ekranda seçilebilir halde kalır. */ }
  };

  return (
    <div className="fixed inset-0 z-[122] bg-zinc-950 flex flex-col">
      <header className="px-4 py-3 pt-safe border-b border-zinc-800 flex items-center justify-between bg-zinc-950/95 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-xl border border-emerald-800/50 bg-emerald-950/30 flex items-center justify-center">
            <ShieldCheck size={17} className="text-emerald-400" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-100">Mağaza Hazırlık Merkezi</h2>
            <p className="text-[9px] font-mono text-zinc-500">Kod temeli + başvuru kontrolü</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-zinc-400" aria-label="Kapat"><X size={20} /></button>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-10 space-y-4 max-w-lg w-full mx-auto">
        <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-zinc-950 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-400">Toplam Hazırlık</span>
              <div className="text-3xl font-black font-mono text-zinc-100 mt-1">%{readiness.percent}</div>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">{readiness.done}/{readiness.total} kontrol</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden mt-3">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${readiness.percent}%` }} />
          </div>
          <p className="text-[10px] font-mono text-zinc-400 leading-relaxed mt-3">
            {readiness.storeReady
              ? 'Kod ve mağaza işlemleri tamamlandı. Yine de gerçek cihaz kabul testi yapılmalı.'
              : `Sıradaki doğrulanmamış adım: ${readiness.next?.label || 'yok'}.`}
          </p>
        </section>

        <section className="grid grid-cols-3 gap-2">
          {tabs.map(item => {
            const data = readiness.groups[item.key];
            return (
              <button key={item.key} onClick={() => setTab(item.key)} aria-pressed={tab === item.key} className={`rounded-2xl border p-3 text-left ${tab === item.key ? 'border-cyan-600 bg-cyan-950/30' : 'border-zinc-800 bg-zinc-900'}`}>
                <span className={`text-[10px] font-bold block ${tab === item.key ? 'text-cyan-300' : 'text-zinc-400'}`}>{item.label}</span>
                <span className="text-[9px] font-mono text-zinc-600 block mt-1">{data.done}/{data.total} · %{data.percent}</span>
              </button>
            );
          })}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="px-3.5 py-3 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-zinc-200">{group.label}</h3>
            <span className="text-[9px] font-mono text-zinc-500">Otomatik maddeler kilitli</span>
          </div>
          <div className="divide-y divide-zinc-800/80">
            {group.checks.map(check => (
              <button
                type="button"
                key={check.key}
                onClick={() => toggle(check)}
                disabled={check.automatic}
                aria-pressed={check.automatic ? undefined : check.done}
                className="w-full p-3.5 text-left flex items-start gap-3 disabled:cursor-default"
              >
                <span className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${check.done ? 'border-emerald-600 bg-emerald-950/50 text-emerald-400' : 'border-zinc-700 bg-zinc-950 text-zinc-700'}`}>
                  {check.done && <Check size={13} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-zinc-200 block">{check.label}</span>
                  <span className="text-[9px] font-mono leading-relaxed text-zinc-500 block mt-0.5">{check.detail}</span>
                </span>
                {!check.automatic && <ChevronRight size={14} className="text-zinc-700 mt-1 shrink-0" />}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5 space-y-2.5">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Smartphone size={13} className="text-cyan-400" /> Sabit Kimlikler ve URL’ler
          </h3>
          {[
            ['bundle', 'iOS Bundle ID', STORE_IDENTIFIERS.iosBundleId],
            ['package', 'Android paket adı', STORE_IDENTIFIERS.androidPackageName],
            ['privacy', 'Gizlilik URL', urls.privacy],
            ['support', 'Destek URL', urls.support],
          ].map(([key, label, value]) => (
            <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[8px] uppercase tracking-wider text-zinc-600 block">{label}</span>
                <span className="text-[9px] font-mono text-zinc-300 block truncate mt-0.5">{value}</span>
              </div>
              <button onClick={() => copy(key, value)} className="p-2 text-zinc-500 active:text-cyan-400" aria-label={`${label} kopyala`}>
                {copied === key ? <Check size={14} className="text-emerald-400" /> : <Clipboard size={14} />}
              </button>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-3 gap-2">
          {[
            ['Gizlilik', urls.privacy], ['Destek', urls.support], ['Koşullar', urls.terms],
          ].map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-[10px] font-bold text-zinc-300 flex items-center justify-center gap-1.5">
              {label}<ExternalLink size={11} />
            </a>
          ))}
        </section>

        <section className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-3.5 flex gap-2.5">
          <Info size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[9px] font-mono text-amber-200/70 leading-relaxed">
            PWA yayını mağaza yayını değildir. Tek kod tabanını korumak için önerilen yol Capacitor’dır.
            iOS paketi Mac üzerinde Xcode 26 ile, Android paketi API 36 hedefleyen imzalı AAB olarak üretilmelidir.
          </p>
        </section>
      </main>
    </div>
  );
});

StoreReadinessModal.displayName = 'StoreReadinessModal';
export default StoreReadinessModal;
