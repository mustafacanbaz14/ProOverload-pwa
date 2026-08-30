import React, { memo } from 'react';
import { Plus, Trash2, Waves, ArrowUp, ArrowDown } from 'lucide-react';
import {
  SWIM_STROKES, SET_KINDS, POOL_LENGTHS, emptyCardioSet, summarizeSets, isSwim,
} from '../utils/cardioSets';

/**
 * Kardiyo set defteri düzenleyicisi.
 *
 * "45 dakika yüzme" ile "8 × 100 m serbest" arasındaki farkı kaydeden yer.
 * Satır başına tekrar sayısı tutuluyor çünkü sekiz ayrı satır açmak hem
 * yazmayı hem okumayı zorlaştırıyordu.
 *
 * Süre saniye olarak isteniyor: bir yüzme setinde "1:35" yazmak için iki alan
 * açmak, telefonda tek alandan daha yavaş. Özet satırında m:ss olarak geri
 * gösteriliyor.
 */

const kucukAlan = 'w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 text-center font-mono text-[11px] text-zinc-200 outline-none focus:border-cyan-500';

const CardioSetEditor = memo(({ activityKey, rows = [], onChange, poolLength = '25', onChangePool }) => {
  const yuzme = isSwim(activityKey);
  const ozet = summarizeSets(rows, activityKey, { poolLength: Number(poolLength) || 25 });

  const guncelle = (index, patch) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };
  const ekle = () => {
    // Yeni satır sonuncunun kopyası: bir yüzme seansında satırlar birbirine
    // çok benziyor ve her seferinde sıfırdan doldurmak gereksiz.
    const son = rows[rows.length - 1];
    onChange([...rows, son ? { ...son, seconds: '', strokeCount: '' } : emptyCardioSet(activityKey)]);
  };
  const sil = (index) => onChange(rows.filter((_, i) => i !== index));
  const tasi = (index, yon) => {
    const hedef = index + yon;
    if (hedef < 0 || hedef >= rows.length) return;
    const next = [...rows];
    [next[index], next[hedef]] = [next[hedef], next[index]];
    onChange(next);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center">
          <Waves size={12} className="mr-1.5 text-cyan-400" /> Set defteri
        </span>
        {yuzme && onChangePool && (
          <div className="flex gap-1">
            {POOL_LENGTHS.map(p => (
              <button
                key={p.key}
                onClick={() => onChangePool(p.key)}
                aria-pressed={String(poolLength) === p.key}
                title="Havuz uzunluğu — SWOLF hesabı buna göre yapılıyor"
                className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors ${String(poolLength) === p.key ? 'border-cyan-600 bg-cyan-950/25 text-cyan-300' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
          Set defteri isteğe bağlı. Doldurursan süre ve mesafe buradan çıkar;
          doldurmazsan yukarıdaki alanlar kullanılmaya devam eder.
        </p>
      ) : (
        <div className="space-y-2">
          {/* Başlık satırı: alanların ne olduğu her satırda tekrar edilmesin. */}
          <div className="grid grid-cols-[28px_46px_1fr_46px_46px_28px] gap-1 px-0.5">
            {['×', 'm', yuzme ? 'stil' : 'tip', 'sn', 'dinl.', ''].map((h, i) => (
              <span key={`${h}-${i}`} className="text-[8px] font-mono text-zinc-400 text-center">{h}</span>
            ))}
          </div>

          {rows.map((row, i) => (
            <div key={i} className="space-y-1">
              <div className="grid grid-cols-[28px_46px_1fr_46px_46px_28px] gap-1 items-center">
                <input
                  type="number" inputMode="numeric" min="1" value={row.reps ?? 1}
                  onChange={(e) => guncelle(i, { reps: e.target.value })}
                  aria-label="Tekrar" className={kucukAlan}
                />
                <input
                  type="number" inputMode="numeric" min="0" value={row.distance ?? ''}
                  onChange={(e) => guncelle(i, { distance: e.target.value })}
                  aria-label="Mesafe (m)" className={kucukAlan}
                />
                {yuzme ? (
                  <select
                    value={row.stroke || 'free'}
                    onChange={(e) => guncelle(i, { stroke: e.target.value })}
                    aria-label="Stil"
                    className={`${kucukAlan} text-left px-1.5`}
                  >
                    {SWIM_STROKES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                ) : (
                  <select
                    value={row.kind || 'work'}
                    onChange={(e) => guncelle(i, { kind: e.target.value })}
                    aria-label="Set tipi"
                    className={`${kucukAlan} text-left px-1.5`}
                  >
                    {SET_KINDS.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
                  </select>
                )}
                <input
                  type="number" inputMode="numeric" min="0" value={row.seconds ?? ''}
                  onChange={(e) => guncelle(i, { seconds: e.target.value })}
                  aria-label="Set süresi (sn)" className={kucukAlan}
                />
                <input
                  type="number" inputMode="numeric" min="0" value={row.restSeconds ?? ''}
                  onChange={(e) => guncelle(i, { restSeconds: e.target.value })}
                  aria-label="Dinlenme (sn)" className={kucukAlan}
                />
                <button
                  onClick={() => sil(i)}
                  aria-label="Satırı sil"
                  className="text-zinc-500 active:text-red-500 flex justify-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Yüzmede ek satır: set tipi ve kulaç sayısı. İkinci satıra
                  alındı çünkü ilk satır telefonda zaten dolu. */}
              <div className="grid grid-cols-[1fr_60px_auto_auto] gap-1 items-center pl-0.5">
                {yuzme ? (
                  <select
                    value={row.kind || 'work'}
                    onChange={(e) => guncelle(i, { kind: e.target.value })}
                    aria-label="Set tipi"
                    className={`${kucukAlan} text-left px-1.5`}
                  >
                    {SET_KINDS.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
                  </select>
                ) : <span />}
                {yuzme ? (
                  <input
                    type="number" inputMode="numeric" min="0" value={row.strokeCount ?? ''}
                    onChange={(e) => guncelle(i, { strokeCount: e.target.value })}
                    placeholder="kulaç"
                    aria-label="Toplam kulaç sayısı"
                    className={kucukAlan}
                  />
                ) : <span />}
                <button onClick={() => tasi(i, -1)} disabled={i === 0} aria-label="Yukarı taşı"
                  className="text-zinc-500 active:text-cyan-400 disabled:opacity-25 px-1"><ArrowUp size={11} /></button>
                <button onClick={() => tasi(i, 1)} disabled={i === rows.length - 1} aria-label="Aşağı taşı"
                  className="text-zinc-500 active:text-cyan-400 disabled:opacity-25 px-1"><ArrowDown size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={ekle}
        className="w-full rounded-xl border border-dashed border-zinc-700 py-2 text-[10px] font-bold text-zinc-400 active:text-zinc-100 flex items-center justify-center gap-1.5"
      >
        <Plus size={12} /> Set satırı ekle
      </button>

      {ozet.hasData && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 space-y-1">
          <p className="text-[10px] font-mono text-zinc-300">
            <strong className="text-cyan-400">{ozet.totalDistance} m</strong> · {ozet.totalMinutes} dk
            {ozet.avgPaceLabel && <> · ana set temposu <strong className="text-cyan-400">{ozet.avgPaceLabel}</strong></>}
            {ozet.avgSwolf && <> · SWOLF {ozet.avgSwolf}</>}
          </p>
          {ozet.byStroke.length > 1 && (
            <p className="text-[9px] font-mono text-zinc-500">
              {ozet.byStroke.map(s => `${s.stroke.label} ${s.distance} m (%${s.share})`).join(' · ')}
            </p>
          )}
          <p className="text-[9px] font-mono text-zinc-400 leading-relaxed">
            Tempo yalnızca ANA setlerden hesaplanıyor; ısınma ve soğuma dahil
            edilseydi ortalama her seansta olduğundan yavaş görünürdü.
            {ozet.avgSwolf && ' SWOLF bir havuz uzunluğunun süresi ile o uzunlukta atılan kulaç sayısının toplamı: aynı tempoyu daha az kulaçla tutmak teknik gelişimi gösterir.'}
          </p>
        </div>
      )}
    </div>
  );
});

CardioSetEditor.displayName = 'CardioSetEditor';

export default CardioSetEditor;
