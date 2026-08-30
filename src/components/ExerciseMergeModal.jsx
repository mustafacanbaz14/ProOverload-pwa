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
    <div role="dialog" aria-modal="true" aria-labelledby="exercise-merge-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[92] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">
        <div className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/80 backdrop-blur-md shrink-0">
          <h3 id="exercise-merge-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-widest flex items-center">
            <Merge size={16} className="mr-2 text-amber-400" /> Hareket Birleştirme
          </h3>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">

        {!pair && (
          <>
            <p className="text-[10px] font-mono text-zinc-400 leading-relaxed bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 backdrop-blur-sm">
              Uygulamada olmayan bir hareketi elle eklediysen ve sonradan aynı
              hareket kütüphaneye girdiyse, ikisi ayrı hareket sayılıyor:
              rekorların bölünüyor, hacim eğrisi kopuk görünüyor. Birleştirme
              geçmişi SİLMEDEN tek isim altında topluyor.
            </p>

            {candidates.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 block">
                  Bulunan Kopyalar
                </span>
                {candidates.map(aday => (
                  <div key={aday.key} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2.5 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border ${aday.certain
                        ? 'border-amber-900/60 bg-amber-950/40 text-amber-300'
                        : 'border-zinc-700 bg-zinc-950 text-zinc-500'}`}>
                        {aday.certain ? 'AYNI AD' : 'OLASI'}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500">
                        {aday.variants.length} yazım
                      </span>
                    </div>
                    {aday.variants.map(v => (
                      <div key={v.name} className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-zinc-300 truncate min-w-0">
                          {v.name}
                          {v.exactBuiltin && <span className="text-[8px] font-bold text-cyan-400 ml-1">kütüphane</span>}
                          {v.custom && <span className="text-[8px] font-bold text-purple-400 ml-1">özel</span>}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                          {v.sessions} seans · {v.sets} set
                        </span>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {aday.variants.filter(v => v.name !== aday.suggestedWinner).map(v => (
                        <button
                          key={v.name}
                          onClick={() => { setPair({ loser: v.name, winner: aday.suggestedWinner }); setConfirmArmed(false); }}
                          className="bg-amber-950/40 border border-amber-900/60 text-amber-300 hover:bg-amber-900/40 px-2.5 py-1 rounded-xl text-[9px] font-bold active:scale-95 transition-all"
                        >
                          {v.name} → {aday.suggestedWinner}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 space-y-2.5 backdrop-blur-sm">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                Elle Seçim
              </span>
              <p className="text-[9px] font-mono text-zinc-500 leading-relaxed">
                Adları farklı yazılmış hareketler otomatik bulunamıyor — birbirine
                benzeyen adlar gerçekten farklı hareketler olabiliyor ve
                birleştirme geçmişi değiştiriyor. Önce BIRAKILACAK adı, sonra
                KALACAK adı seç.
              </p>
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2">
                <Search size={14} className="text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={manual ? `"${manual}" hangi harekete taşınsın?` : 'Hareket ara…'}
                  className="flex-1 bg-transparent text-[11px] text-zinc-200 outline-none min-w-0"
                />
              </div>
              {manual && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-amber-300 bg-amber-950/30 border border-amber-900/50 rounded-xl p-2">
                  <span className="truncate flex-1">Bırakılacak: {manual}</span>
                  <button onClick={() => setManual(null)} className="luxury-icon-button w-6 h-6 text-zinc-500 hover:text-red-400">
                    <X size={12} />
                  </button>
                </div>
              )}
              {arananlar.length > 0 && (
                <div className="space-y-1 pt-1">
                  {arananlar.map(name => (
                    <button
                      key={name}
                      onClick={() => elleSec(name)}
                      disabled={name === manual}
                      className="w-full text-left bg-zinc-950/70 border border-zinc-800/60 hover:border-amber-600/50 rounded-xl px-3 py-2 text-[10px] text-zinc-300 active:bg-zinc-800 disabled:opacity-30 transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {candidates.length === 0 && (
              <p className="text-[10px] font-mono text-emerald-300/80 px-1">
                <CheckCircle2 size={12} className="inline mr-1 text-emerald-400" />
                Otomatik bulunan kopya yok.
              </p>
            )}
          </>
        )}

        {pair && preview && (
          <div className="space-y-3.5">
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-red-300 truncate min-w-0 flex-1">{preview.loser}</span>
                <ArrowRight size={14} className="text-zinc-500 shrink-0" />
                <span className="text-[11px] font-bold text-emerald-300 truncate min-w-0 flex-1 text-right">{preview.winner}</span>
              </div>
              <button
                onClick={() => { setPair({ loser: pair.winner, winner: pair.loser }); setConfirmArmed(false); }}
                className="w-full bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 py-2 rounded-xl text-[10px] font-bold active:scale-[0.98] transition-all"
              >
                Yönü Ters Çevir
              </button>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5 backdrop-blur-sm">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                Ne Değişecek
              </span>
              {preview.touchesNothing ? (
                <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                  Bu adın hiçbir kaydı yok. Birleştirme yalnızca hareketin
                  tanımını listeden kaldıracak; geçmişte taşınacak bir şey yok.
                </p>
              ) : (
                <ul className="space-y-1 text-[10px] font-mono text-zinc-400">
                  {preview.sessions > 0 && (
                    <li>
                      · <strong className="text-zinc-200">{preview.sessions} seans</strong>, {preview.sets} set
                      {preview.firstDate && (
                        <span className="text-zinc-500"> ({formatDay(preview.firstDate, 'short')} – {formatDay(preview.lastDate, 'short')})</span>
                      )}
                    </li>
                  )}
                  {preview.templates > 0 && (
                    <li>· <strong className="text-zinc-200">{preview.templates} şablon</strong>
                      <span className="text-zinc-500"> ({preview.templateNames.join(', ')})</span>
                    </li>
                  )}
                  {preview.strengthGoals > 0 && <li>· {preview.strengthGoals} kuvvet hedefi</li>}
                  {preview.repRanges > 0 && <li>· {preview.repRanges} tekrar aralığı</li>}
                  {preview.painEntries > 0 && <li>· {preview.painEntries} ağrı kaydı</li>}
                  {preview.inActiveWorkout && <li className="text-amber-300 font-bold">· devam eden antrenman</li>}
                </ul>
              )}

              {preview.spellingOnly ? (
                <p className="text-[9px] font-mono text-zinc-500 leading-relaxed pt-1">
                  Bu ikisi aynı adın iki yazımı. Geçmiş bir yere taşınmıyor,
                  yalnızca tek yazımda toplanıyor.
                </p>
              ) : preview.winnerSessions > 0 && (
                <p className="text-[9px] font-mono text-zinc-500 leading-relaxed pt-1">
                  "{preview.winner}" adının kendi {preview.winnerSessions} seansı var;
                  birleşince toplam {preview.totalSessionsAfter} seans olacak.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-3.5 flex items-start gap-2.5">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <span className="text-[9px] font-mono text-amber-200/90 leading-relaxed">
                "{preview.loser}" hareketinin tanımı listeden kalkacak, kayıtları
                "{preview.winner}" adına yazılacak. İşlem geri alınabilir — bildirim
                çubuğundaki geri al düğmesiyle.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={secimiKapat}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/80 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-400 active:scale-[0.98] transition-all"
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
                className={`rounded-2xl py-3 text-[10px] font-black uppercase tracking-wider text-white shadow-lg active:scale-[0.98] transition-all ${confirmArmed ? 'bg-red-600 active:bg-red-700 shadow-red-950/50' : 'bg-gradient-to-r from-amber-600 to-amber-500 shadow-amber-950/50'}`}
              >
                {confirmArmed ? 'Tekrar Dokun: Birleştir' : 'Birleştir'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
});

ExerciseMergeModal.displayName = 'ExerciseMergeModal';

export default ExerciseMergeModal;
