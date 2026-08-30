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
    <div role="dialog" aria-modal="true" aria-labelledby="store-readiness-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[122] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-md max-h-[88dvh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden">
        <header className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl border border-emerald-800/60 bg-emerald-950/40 flex items-center justify-center shadow-sm">
              <ShieldCheck size={16} className="text-emerald-400" />
            </span>
            <div className="min-w-0">
              <h2 id="store-readiness-title" className="text-[12px] font-black uppercase tracking-widest text-zinc-100">Mağaza Hazırlık</h2>
              <p className="text-[9px] font-mono text-zinc-500">Kod temeli + başvuru kontrolü</p>
            </div>
          </div>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat"><X size={18} /></button>
        </header>

        <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">
        <section className="rounded-3xl border border-emerald-900/50 bg-gradient-to-br from-emerald-950/35 via-zinc-900/90 to-zinc-950 p-4 backdrop-blur-sm shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-emerald-400">Toplam Hazırlık</span>
              <div className="text-3xl font-black font-mono text-zinc-100 mt-0.5">%{readiness.percent}</div>
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-400">{readiness.done}/{readiness.total} kontrol</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-950 border border-zinc-800/80 overflow-hidden mt-3">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${readiness.percent}%` }} />
          </div>
          <p className="text-[10px] font-mono text-zinc-300 leading-relaxed mt-3">
            {readiness.storeReady
              ? 'Kod ve mağaza işlemleri tamamlandı. Yine de gerçek cihaz kabul testi yapılmalı.'
              : `Sıradaki doğrulanmamış adım: ${readiness.next?.label || 'yok'}.`}
          </p>
        </section>

        <section className="grid grid-cols-3 gap-2">
          {tabs.map(item => {
            const data = readiness.groups[item.key];
            const active = tab === item.key;
            return (
              <button key={item.key} onClick={() => setTab(item.key)} aria-pressed={active} className={`rounded-2xl border p-3 text-left transition-all active:scale-95 ${active ? 'border-cyan-600 bg-cyan-950/40 shadow-sm shadow-cyan-950/30' : 'border-zinc-800/80 bg-zinc-900/60'}`}>
                <span className={`text-[10px] font-black uppercase tracking-wider block ${active ? 'text-cyan-300' : 'text-zinc-400'}`}>{item.label}</span>
                <span className="text-[9px] font-mono text-zinc-500 block mt-1">{data.done}/{data.total} · %{data.percent}</span>
              </button>
            );
          })}
        </section>

        <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden backdrop-blur-sm shadow-sm">
          <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{group.label}</h3>
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Otomatik maddeler kilitli</span>
          </div>
          <div className="divide-y divide-zinc-800/70">
            {group.checks.map(check => (
              <button
                type="button"
                key={check.key}
                onClick={() => toggle(check)}
                disabled={check.automatic}
                aria-pressed={check.automatic ? undefined : check.done}
                className="w-full p-3.5 text-left flex items-start gap-3 disabled:cursor-default active:bg-zinc-800/30 transition-colors"
              >
                <span className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${check.done ? 'border-emerald-600 bg-emerald-950/60 text-emerald-400' : 'border-zinc-700 bg-zinc-950 text-zinc-500'}`}>
                  {check.done && <Check size={13} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-zinc-200 block">{check.label}</span>
                  <span className="text-[9px] font-mono leading-relaxed text-zinc-400 block mt-0.5">{check.detail}</span>
                </span>
                {!check.automatic && <ChevronRight size={14} className="text-zinc-400 mt-1 shrink-0" />}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-2.5 backdrop-blur-sm shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-300 flex items-center gap-1.5 px-1">
            <Smartphone size={13} className="text-cyan-400" /> Sabit Kimlikler ve URL’ler
          </h3>
          {[
            ['bundle', 'iOS Bundle ID', STORE_IDENTIFIERS.iosBundleId],
            ['package', 'Android paket adı', STORE_IDENTIFIERS.androidPackageName],
            ['privacy', 'Gizlilik URL', urls.privacy],
            ['support', 'Destek URL', urls.support],
          ].map(([key, label, value]) => (
            <div key={key} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 px-3.5 py-2.5 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-500 block">{label}</span>
                <span className="text-[9px] font-mono text-zinc-300 block truncate mt-0.5">{value}</span>
              </div>
              <button onClick={() => copy(key, value)} className="p-2 text-zinc-400 hover:text-cyan-400 transition-colors" aria-label={`${label} kopyala`}>
                {copied === key ? <Check size={14} className="text-emerald-400" /> : <Clipboard size={14} />}
              </button>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-3 gap-2">
          {[
            ['Gizlilik', urls.privacy], ['Destek', urls.support], ['Koşullar', urls.terms],
          ].map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 py-3 text-[10px] font-bold text-zinc-300 flex items-center justify-center gap-1.5 active:scale-95 transition-all">
              {label}<ExternalLink size={11} className="text-zinc-500" />
            </a>
          ))}
        </section>

        <section className="rounded-3xl border border-amber-900/50 bg-amber-950/20 p-4 flex gap-2.5 backdrop-blur-sm">
          <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[9px] font-mono text-amber-200/80 leading-relaxed">
            PWA yayını mağaza yayını değildir. Tek kod tabanını korumak için önerilen yol Capacitor’dır.
            iOS paketi Mac üzerinde Xcode 26 ile, Android paketi API 36 hedefleyen imzalı AAB olarak üretilmelidir.
          </p>
        </section>
      </main>
    </div>
  </div>
  );
});

StoreReadinessModal.displayName = 'StoreReadinessModal';
export default StoreReadinessModal;
