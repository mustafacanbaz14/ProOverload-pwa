import React, { memo } from 'react';
import { X, BookOpen, AlertTriangle, Scale } from 'lucide-react';
import { evidenceByTopic, EVIDENCE_LINES, isContested } from '../utils/evidence';

/**
 * Kanıt defteri.
 *
 * Her kayıtta karşı görüş var ve bu bilinçli: karşı görüşü olmayan bir bulgu
 * ya gerçekten tartışmasızdır ya da eksik araştırılmıştır, ve hangisi olduğunu
 * yazmak okuyucunun hakkı.
 *
 * Çelişen konular ayrıca işaretleniyor. Uygulamanın en önemli iddiası bu:
 * hacim konusunda literatür bölünmüş ve uygulama taraf tutmuyor.
 */

const LINE_STYLE = {
  metaReg: 'border-cyan-900/50 bg-cyan-950/20 text-cyan-300',
  directTrial: 'border-emerald-900/50 bg-emerald-950/20 text-emerald-300',
  survey: 'border-zinc-700 bg-zinc-900 text-zinc-400',
};

const EvidenceModal = memo(({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const konular = evidenceByTopic();

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[93] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <BookOpen size={15} className="mr-2 text-cyan-400" /> Kanıt Defteri
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">
        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/15 p-3.5 space-y-2">
          <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1.5">
            <Scale size={12} /> Hacim konusunda literatür bölünmüş
          </span>
          <p className="text-[10px] font-mono text-zinc-300 leading-relaxed">
            Bir kanıt hattı "daha fazla set daha fazla kas" diyor. Diğeri, aynı
            soruyu doğrudan test ettiğinde fark bulamıyor. Uygulama hangisinin
            doğru olduğunu bildiğini iddia etmiyor: hacim hesapları tek bir
            çizgi değil, iki hattın arasındaki şerit üzerinden yapılıyor.
          </p>
          <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
            Neden çelişiyorlar: meta-regresyonlar ağırlıklı olarak antrenmansız
            ve kısa süreli çalışmaları topluyor; doğrudan denklik denemeleri
            antrenmanlı kişilerde fark bulmuyor. Ayrıca set başına tahmini etki
            (%0.24) bir bireyde ölçüm hatasının altında — yani ikisi de haklı
            olabilir ve fark tek bir kişide görünmeyecek kadar küçük olabilir.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {Object.values(EVIDENCE_LINES).map(l => (
            <span key={l.key} className={`text-[8px] font-bold px-1.5 py-1 rounded border ${LINE_STYLE[l.key]}`}>
              {l.label}
            </span>
          ))}
        </div>
        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
          {Object.values(EVIDENCE_LINES).map(l => `${l.label}: ${l.hint}`).join(' ')}
        </p>

        {konular.map(({ topic, items }) => (
          <section key={topic} className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-baseline gap-2">
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{topic}</span>
              {isContested(topic) && (
                <span className="text-[8px] font-bold text-amber-400 border border-amber-900/50 bg-amber-950/25 px-1.5 py-0.5 rounded">
                  ÇELİŞKİLİ
                </span>
              )}
            </div>
            <div className="divide-y divide-zinc-800/70">
              {items.map(e => (
                <div key={e.key} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${LINE_STYLE[e.line]}`}>
                      {EVIDENCE_LINES[e.line]?.label}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-zinc-200 leading-snug">{e.claim}</p>
                  <p className="text-[9px] font-mono text-zinc-500">{e.source} · {e.sample}</p>
                  <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
                    <span className="text-zinc-600">Uygulamada: </span>{e.usedFor}
                  </p>
                  <p className="text-[9px] font-mono text-amber-200/70 leading-relaxed flex items-start gap-1">
                    <AlertTriangle size={9} className="shrink-0 mt-0.5" />
                    <span><span className="text-amber-500/80">Karşı görüş: </span>{e.counterpoint}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <p className="text-[9px] font-mono text-zinc-600 leading-relaxed px-1">
          Her kayıtta karşı görüş var çünkü karşı görüşü olmayan bir bulgu ya
          gerçekten tartışmasızdır ya da eksik araştırılmıştır. Bu defterdeki
          en zayıf kayıt deneyim seviyesi: seviyenin hacim ihtiyacını ne kadar
          değiştirdiğini gösteren temiz bir doğrudan karşılaştırma yok.
          Uygulamanın ileri seviyede bandı genişletmesi tam olarak bu yüzden.
        </p>
      </div>
    </div>
  );
});

EvidenceModal.displayName = 'EvidenceModal';

export default EvidenceModal;
