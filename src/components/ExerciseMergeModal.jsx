import React, { useState, useMemo, memo } from 'react';
import { X, Merge, AlertTriangle, ArrowRight, Search, CheckCircle2 } from 'lucide-react';
import { formatDay } from '../utils/dates';
import { foldForSearch } from '../utils/helpers';

/**
 * Hareket birleştirme ekranı.
 *
 * Geçmişi değiştiren tek işlem bu, o yüzden akış üç adıma bölündü: neyin
 * birleşeceğini SEÇ, ne olacağını GÖR, sonra onayla. Tek dokunuşla
 * birleştirmek teknik olarak mümkündü ama yanlış çifti seçen kullanıcı
 * aylarca biriken kaydını fark etmeden başka bir hareketin altına taşırdı.
 */
const ExerciseMergeModal = memo(({
  isOpen, onClose, candidates = [], allNames = [], previewFor, onMerge,
}) => {
  // { loser, winner } — kullanıcı ikisini de değiştirebiliyor.
  const [pair, setPair] = useState(null);
  const [query, setQuery] = useState('');
  const [manual, setManual] = useState(null); // elle seçimde ilk tıklanan ad
  const [confirmArmed, setConfirmArmed] = useState(false);

  const preview = useMemo(
    () => (pair ? previewFor?.(pair.loser, pair.winner) : null),
    [pair, previewFor]);

  const arananlar = useMemo(() => {
    const q = foldForSearch(query.trim());
    if (!q) return [];
    return allNames.filter(n => foldForSearch(n).includes(q)).slice(0, 8);
  }, [query, allNames]);

  if (!isOpen) return null;

  const secimiKapat = () => { setPair(null); setConfirmArmed(false); };

  const elleSec = (name) => {
    if (!manual) { setManual(name); return; }
    if (manual === name) { setManual(null); return; }
    // İlk seçilen kaybeden, ikinci seçilen kazanan; yönü onay ekranında
    // tek dokunuşla ters çevirmek mümkün.
    setPair({ loser: manual, winner: name });
    setManual(null);
    setQuery('');
    setConfirmArmed(false);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[92] flex flex-col h-[100dvh] max-w-[420px] mx-auto">
      <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 shrink-0 pt-safe">
        <h3 className="text-[12px] font-bold text-zinc-100 uppercase tracking-wider flex items-center">
          <Merge size={15} className="mr-2 text-amber-400" /> Hareket Birleştir
        </h3>
        <button onClick={onClose} className="text-zinc-400 active:text-zinc-100 p-2 -mr-1" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-3 pb-safe">

        {!pair && (
          <>
            <p className="text-[9px] font-mono text-zinc-500 leading-relaxed bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              Uygulamada olmayan bir hareketi elle eklediysen ve sonradan aynı
              hareket kütüphaneye girdiyse, ikisi ayrı hareket sayılıyor:
              rekorların bölünüyor, hacim eğrisi kopuk görünüyor. Birleştirme
              geçmişi SİLMEDEN tek isim altında topluyor.
            </p>

            {candidates.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1 block">
                  Bulunan Kopyalar
                </span>
                {candidates.map(aday => (
                  <div key={aday.key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${aday.certain
                        ? 'border-amber-900/60 bg-amber-950/20 text-amber-300'
                        : 'border-zinc-700 bg-zinc-950 text-zinc-500'}`}>
                        {aday.certain ? 'AYNI AD' : 'OLASI'}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-600">
                        {aday.variants.length} yazım
                      </span>
                    </div>
                    {aday.variants.map(v => (
                      <div key={v.name} className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-zinc-300 truncate min-w-0">
                          {v.name}
                          {v.exactBuiltin && <span className="text-[8px] text-cyan-500 ml-1">kütüphane</span>}
                          {v.custom && <span className="text-[8px] text-purple-400 ml-1">özel</span>}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-600 shrink-0">
                          {v.sessions} seans · {v.sets} set
                        </span>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {aday.variants.filter(v => v.name !== aday.suggestedWinner).map(v => (
                        <button
                          key={v.name}
                          onClick={() => { setPair({ loser: v.name, winner: aday.suggestedWinner }); setConfirmArmed(false); }}
                          className="bg-amber-950/30 border border-amber-900/60 text-amber-300 px-2 py-1 rounded-lg text-[9px] font-bold active:bg-amber-900/30"
                        >
                          {v.name} → {aday.suggestedWinner}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                Elle Seç
              </span>
              <p className="text-[9px] font-mono text-zinc-600 leading-relaxed">
                Adları farklı yazılmış hareketler otomatik bulunamıyor — birbirine
                benzeyen adlar gerçekten farklı hareketler olabiliyor ve
                birleştirme geçmişi değiştiriyor. Önce BIRAKILACAK adı, sonra
                KALACAK adı seç.
              </p>
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2">
                <Search size={12} className="text-zinc-600 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={manual ? `"${manual}" hangi harekete taşınsın?` : 'Hareket ara…'}
                  className="flex-1 bg-transparent text-[11px] text-zinc-200 outline-none min-w-0"
                />
              </div>
              {manual && (
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-300">
                  <span className="truncate">Bırakılacak: {manual}</span>
                  <button onClick={() => setManual(null)} className="text-zinc-600 active:text-red-400 shrink-0">
                    <X size={11} />
                  </button>
                </div>
              )}
              <div className="space-y-1">
                {arananlar.map(name => (
                  <button
                    key={name}
                    onClick={() => elleSec(name)}
                    disabled={name === manual}
                    className="w-full text-left bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-300 active:bg-zinc-800 disabled:opacity-30"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {candidates.length === 0 && (
              <p className="text-[9px] font-mono text-emerald-300/70 px-1">
                <CheckCircle2 size={10} className="inline mr-1" />
                Otomatik bulunan kopya yok.
              </p>
            )}
          </>
        )}

        {pair && preview && (
          <div className="space-y-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-red-300 truncate min-w-0 flex-1">{preview.loser}</span>
                <ArrowRight size={13} className="text-zinc-600 shrink-0" />
                <span className="text-[11px] font-bold text-emerald-300 truncate min-w-0 flex-1 text-right">{preview.winner}</span>
              </div>
              <button
                onClick={() => { setPair({ loser: pair.winner, winner: pair.loser }); setConfirmArmed(false); }}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-400 py-1.5 rounded-lg text-[9px] font-bold active:bg-zinc-800"
              >
                Yönü ters çevir
              </button>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                Ne değişecek
              </span>
              {preview.touchesNothing ? (
                <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                  Bu adın hiçbir kaydı yok. Birleştirme yalnızca hareketin
                  tanımını listeden kaldıracak; geçmişte taşınacak bir şey yok.
                </p>
              ) : (
                <ul className="space-y-1 text-[10px] font-mono text-zinc-400">
                  {preview.sessions > 0 && (
                    <li>
                      · <strong className="text-zinc-200">{preview.sessions} seans</strong>, {preview.sets} set
                      {preview.firstDate && (
                        <span className="text-zinc-600"> ({formatDay(preview.firstDate, 'short')} – {formatDay(preview.lastDate, 'short')})</span>
                      )}
                    </li>
                  )}
                  {preview.templates > 0 && (
                    <li>· <strong className="text-zinc-200">{preview.templates} şablon</strong>
                      <span className="text-zinc-600"> ({preview.templateNames.join(', ')})</span>
                    </li>
                  )}
                  {preview.strengthGoals > 0 && <li>· {preview.strengthGoals} kuvvet hedefi</li>}
                  {preview.repRanges > 0 && <li>· {preview.repRanges} tekrar aralığı</li>}
                  {preview.painEntries > 0 && <li>· {preview.painEntries} ağrı kaydı</li>}
                  {preview.inActiveWorkout && <li className="text-amber-300">· devam eden antrenman</li>}
                </ul>
              )}

              {preview.spellingOnly ? (
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed pt-1">
                  Bu ikisi aynı adın iki yazımı. Geçmiş bir yere taşınmıyor,
                  yalnızca tek yazımda toplanıyor.
                </p>
              ) : preview.winnerSessions > 0 && (
                <p className="text-[9px] font-mono text-zinc-600 leading-relaxed pt-1">
                  "{preview.winner}" adının kendi {preview.winnerSessions} seansı var;
                  birleşince toplam {preview.totalSessionsAfter} seans olacak.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-amber-900/50 bg-amber-950/15 p-3 flex items-start gap-2">
              <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
              <span className="text-[9px] font-mono text-amber-300/85 leading-relaxed">
                "{preview.loser}" hareketinin tanımı listeden kalkacak, kayıtları
                "{preview.winner}" adına yazılacak. İşlem geri alınabilir — bildirim
                çubuğundaki geri al düğmesiyle.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={secimiKapat}
                className="rounded-xl border border-zinc-800 bg-zinc-900 py-3 text-[10px] font-bold text-zinc-400 active:bg-zinc-800"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  if (!confirmArmed) { setConfirmArmed(true); return; }
                  onMerge?.(preview.loser, preview.winner);
                  secimiKapat();
                  onClose();
                }}
                className={`rounded-xl py-3 text-[10px] font-bold uppercase tracking-wider text-white ${confirmArmed ? 'bg-red-600 active:bg-red-700' : 'bg-amber-600 active:bg-amber-700'}`}
              >
                {confirmArmed ? 'Tekrar Dokun: Birleştir' : 'Birleştir'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ExerciseMergeModal.displayName = 'ExerciseMergeModal';

export default ExerciseMergeModal;
