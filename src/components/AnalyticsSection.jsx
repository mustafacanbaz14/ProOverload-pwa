import React, { memo, useState, Children } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Analiz bölümü: bir grup kartı tek başlık altında toplar.
 *
 * Hacim sekmesi ölçüldüğünde 10.8 EKRAN kaydırma, 236 dokunulabilir öğe ve
 * 12.000 karakter metin çıktı. Sebebi kartların kötü olması değil, hepsinin
 * aynı anda AÇIK durması: her sürümde bir kart daha eklendi ve hiçbiri
 * kapanmadı. Sonuçta en çok işe yarayan kart, on kartın altında kaldı.
 *
 * Bölüm iki şeyi birden yapıyor:
 *  - Varsayılan olarak KAPALI açılıyor, yani ekran bir listeye dönüşüyor.
 *  - Kapalıyken bile içindeki kart sayısını ve tek satırlık özeti gösteriyor,
 *    böylece "burada ne var" sorusu açmadan cevaplanıyor.
 *
 * `defaultOpen` yalnızca ilk bölümde açık: kullanıcı ekrana girdiğinde boş bir
 * başlık listesi görmemeli, en az bir şey okumaya hazır olmalı.
 *
 * Durum bileşende tutuluyor, ayarlara yazılmıyor. Hangi bölümü açtığı kalıcı
 * bir tercih değil o anki niyet; kalıcı yapsaydık kullanıcı bir kez açtığı
 * bölümü sonsuza kadar açık bulurdu ve duvar geri gelirdi.
 */
const AnalyticsSection = memo(({
  title,
  summary,
  icon: Icon,
  accentClass = 'text-cyan-400',
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  // Boş kartlar (veri yetersiz olduğu için null dönenler) sayıma girmemeli;
  // "4 kart" deyip iki tanesini göstermek güveni bozar.
  const count = Children.toArray(children).filter(Boolean).length;
  if (count === 0) return null;

  return (
    <section className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full px-4 py-3 flex items-center gap-3 text-left active:bg-zinc-800/60 transition-colors"
      >
        {Icon && (
          <span className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
            <Icon size={13} className={accentClass} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="text-[11px] font-bold text-zinc-100 block uppercase tracking-wider">{title}</span>
          <span className="text-[9px] font-mono text-zinc-500 block mt-0.5 truncate">
            {summary || `${count} kart`}
          </span>
        </span>
        <ChevronDown size={15} className={`text-zinc-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="p-2.5 pt-0 space-y-2.5">{children}</div>}
    </section>
  );
});

AnalyticsSection.displayName = 'AnalyticsSection';

export default AnalyticsSection;
