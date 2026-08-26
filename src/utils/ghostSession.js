import { parseNumber } from './number.js';
import { isWorkingSet, estimate1RM } from './helpers.js';

/**
 * Hayalet seans: geçen seferle CANLI yarış.
 *
 * Seans sonu raporu "geçen sefere göre ne değişti" sorusunu seans BİTTİKTEN
 * sonra cevaplıyordu. Ama o cevabın işe yarayacağı an seansın içi: son sette
 * bir tekrar daha yapıp yapmama kararı orada veriliyor ve o an elinde
 * karşılaştırma yok.
 *
 * Hayalet, aynı şablonun bir önceki seansını yanına koyuyor ve set set
 * ilerlerken "şu an öndesin / gerisin" diyor. Yarışın kendisi bir uyaran:
 * geçen seferi bir sayı olarak görmek, o sayıyı geçmeyi kolaylaştırıyor.
 *
 * Karşılaştırma SET SIRASINA göre yapılıyor, hareket adına göre değil sadece:
 * aynı hareketin üçüncü seti üçüncü setle kıyaslanıyor. Ortalama almak
 * yanıltıcıydı — dört set yerine üç yapan biri "daha az tonaj" görünüp
 * aslında her sette daha iyi olabiliyor.
 */

/** Bir seansın hareket → set dizisi haritası. */
const setHaritasi = (workout, resolveLoad = null) => {
  const harita = new Map();
  (workout?.exercises || []).forEach(ex => {
    if (!ex?.name) return;
    const setler = (ex.sets || [])
      .filter(s => isWorkingSet(s) && parseNumber(s.reps) > 0)
      .map(s => {
        const yuk = resolveLoad ? parseNumber(resolveLoad(ex.name, s.weight, workout)) : parseNumber(s.weight);
        return {
          weight: yuk,
          reps: parseNumber(s.reps),
          rir: parseNumber(s.rir),
          volume: yuk * parseNumber(s.reps),
          e1rm: estimate1RM(yuk, s.reps, s.rir),
        };
      });
    if (setler.length > 0) harita.set(ex.name, setler);
  });
  return harita;
};

/**
 * Karşılaştırılacak hayalet seansı seçer.
 *
 * Öncelik aynı şablonun son seansı. Şablon yoksa aynı hareketleri en çok
 * paylaşan son seans — serbest çalışan biri de hayaletsiz kalmasın.
 */
export const pickGhost = (activeWorkout, workouts = []) => {
  if (!activeWorkout) return null;
  const gecmis = (workouts || [])
    .filter(w => w.id !== activeWorkout.id && (w.exercises || []).length > 0)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  if (gecmis.length === 0) return null;

  if (activeWorkout.sourceTemplateId) {
    const ayni = gecmis.find(w => w.sourceTemplateId === activeWorkout.sourceTemplateId);
    if (ayni) return { workout: ayni, match: 'template' };
  }

  const bugunku = new Set((activeWorkout.exercises || []).map(e => e.name).filter(Boolean));
  if (bugunku.size === 0) return null;

  let enIyi = null;
  gecmis.slice(0, 20).forEach(w => {
    const ortak = (w.exercises || []).filter(e => bugunku.has(e.name)).length;
    if (ortak === 0) return;
    if (!enIyi || ortak > enIyi.shared) enIyi = { workout: w, shared: ortak, match: 'exercises' };
  });
  // Yarısından azı örtüşüyorsa karşılaştırma yanıltıcı olur.
  if (!enIyi || enIyi.shared < Math.ceil(bugunku.size / 2)) return null;
  return enIyi;
};

/**
 * Canlı yarış durumu.
 *
 * @returns { hasGhost, rows, ahead, behind, totalDelta, pace }
 */
export const buildGhostRace = (activeWorkout, ghostWorkout, { resolveLoad = null } = {}) => {
  if (!activeWorkout || !ghostWorkout) return { hasGhost: false, rows: [] };

  const simdi = setHaritasi(activeWorkout, resolveLoad);
  const hayalet = setHaritasi(ghostWorkout, resolveLoad);
  if (hayalet.size === 0) return { hasGhost: false, rows: [] };

  const adlar = [...new Set([...simdi.keys(), ...hayalet.keys()])];
  const rows = adlar.map(name => {
    const a = simdi.get(name) || [];
    const b = hayalet.get(name) || [];
    // Yalnızca İKİ TARAFTA DA yapılmış setler karşılaştırılıyor: henüz
    // girilmemiş setler için "gerisin" demek haksız olurdu.
    const ortakAdet = Math.min(a.length, b.length);
    const suAnki = a.slice(0, ortakAdet).reduce((t, s) => t + s.volume, 0);
    const hayaletHacim = b.slice(0, ortakAdet).reduce((t, s) => t + s.volume, 0);

    return {
      name,
      done: a.length,
      ghostSets: b.length,
      compared: ortakAdet,
      volume: Math.round(suAnki),
      ghostVolume: Math.round(hayaletHacim),
      delta: Math.round(suAnki - hayaletHacim),
      // Set set fark: hangi sette geride kaldığını görmek için.
      sets: Array.from({ length: Math.max(a.length, b.length) }, (_, i) => ({
        index: i + 1,
        now: a[i] || null,
        ghost: b[i] || null,
        delta: a[i] && b[i] ? Math.round(a[i].volume - b[i].volume) : null,
      })),
      remaining: Math.max(0, b.length - a.length),
    };
  }).filter(r => r.ghostSets > 0 || r.done > 0);

  const toplamFark = rows.reduce((t, r) => t + r.delta, 0);
  const yapilan = rows.reduce((t, r) => t + r.done, 0);
  const hayaletToplam = rows.reduce((t, r) => t + r.ghostSets, 0);

  return {
    hasGhost: true,
    date: ghostWorkout.date,
    name: ghostWorkout.name,
    rows: rows.sort((a, b) => a.delta - b.delta),
    ahead: rows.filter(r => r.delta > 0).length,
    behind: rows.filter(r => r.delta < 0).length,
    totalDelta: toplamFark,
    doneSets: yapilan,
    ghostSets: hayaletToplam,
    // İlerleme yüzdesi: hayaletin kaçta kaçını geçtin.
    progress: hayaletToplam > 0 ? Math.min(100, Math.round((yapilan / hayaletToplam) * 100)) : 0,
    // Tek cümlelik durum. Karşılaştırılan set yoksa sessiz kalıyor —
    // "0 kg öndesin" bilgi değil gürültü.
    status: (() => {
      const karsilastirilan = rows.reduce((t, r) => t + r.compared, 0);
      if (karsilastirilan === 0) return null;
      if (toplamFark > 0) return { tone: 'ahead', text: `${toplamFark} kg öndesin` };
      if (toplamFark < 0) return { tone: 'behind', text: `${Math.abs(toplamFark)} kg gerisin` };
      return { tone: 'even', text: 'Başa başsın' };
    })(),
  };
};

/**
 * Sıradaki set için hayaletin ne yaptığı.
 *
 * Salonda asıl işe yarayan bilgi bu: "geçen sefer bu sette 80 kg × 8
 * yapmıştın". Hedef vermiyor, sadece geçmişi hatırlatıyor.
 */
export const ghostTargetFor = (exerciseName, setIndex, ghostWorkout, { resolveLoad = null } = {}) => {
  if (!exerciseName || !ghostWorkout) return null;
  const hayalet = setHaritasi(ghostWorkout, resolveLoad).get(exerciseName);
  if (!hayalet || setIndex < 0 || setIndex >= hayalet.length) return null;
  const s = hayalet[setIndex];
  return { weight: s.weight, reps: s.reps, rir: s.rir, setIndex: setIndex + 1 };
};
