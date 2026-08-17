import { parseNumber } from './number.js';
import { isWorkingSet } from './helpers.js';
import { formatDuration } from '../lockScreen.js';

/**
 * Seans temposu ve tahmini bitiş.
 *
 * Antrenman ekranında geçen süre görünüyordu ama KALAN süre görünmüyordu.
 * Salonda en sık sorulan pratik soru bu: "kaç dakikam kaldı, bu programı
 * yetiştirebilir miyim?" Cevabı olmayınca kullanıcı ya son hareketleri
 * aceleye getiriyor ya da yarım bırakıyor.
 *
 * Tahmin, o seansın KENDİ temposundan çıkıyor — şablonun teorik süresinden
 * değil. Aynı program kişiden kişiye ve günden güne farklı hızda yapılıyor;
 * sabit bir varsayım ilk beş dakikada yanlış çıkıyor.
 *
 * İlk setlerde tahmin verilmiyor: iki setlik bir örneklemden dakika/set
 * çıkarmak, ısınma setleri yüzünden sistematik olarak yanlış oluyor.
 */

// Tahmin için gereken en az tamamlanmış çalışma seti.
const MIN_SETS_FOR_ESTIMATE = 3;
// Tempo bu sınırların dışındaysa örneklem güvenilmez sayılıyor (uzun mola,
// unutulmuş kronometre).
const MIN_MINUTES_PER_SET = 0.6;
const MAX_MINUTES_PER_SET = 8;

/** Bir hareketin planlanan ve tamamlanan çalışma seti sayısı. */
const setDurumu = (exercises = []) => {
  let toplam = 0;
  let tamam = 0;
  (exercises || []).forEach(ex => {
    (ex?.sets || []).forEach(set => {
      if (!isWorkingSet(set)) return;
      toplam += 1;
      // "Tamamlandı" ölçütü AĞIRLIK alanının doldurulmuş olması. Tekrar
      // sayısı ölçüt olamıyor: şablondan başlatılan seansta hedef tekrarlar
      // baştan dolu geliyor ve seans daha ilk saniyede "bitti" görünüyordu.
      // Sıfır geçerli bir giriş (vücut ağırlığına ek yok), o yüzden sayıya
      // değil metnin boşluğuna bakılıyor.
      if (String(set.weight ?? '').trim() !== '') tamam += 1;
    });
  });
  return { toplam, tamam };
};

/**
 * Seansın kalan süresi ve tahmini bitişi.
 *
 * @param elapsedSeconds  kronometrenin gösterdiği geçen süre
 * @returns { hasEstimate, done, total, remaining, minutesPerSet, remainingMinutes, finishAt, ... }
 */
export const buildSessionPace = (activeWorkout, elapsedSeconds = 0, { now = new Date() } = {}) => {
  const { toplam, tamam } = setDurumu(activeWorkout?.exercises);
  const kalan = Math.max(0, toplam - tamam);
  const gecenDakika = Math.max(0, parseNumber(elapsedSeconds) / 60);

  const temel = {
    done: tamam, total: toplam, remaining: kalan,
    elapsedMinutes: Math.round(gecenDakika),
    progress: toplam > 0 ? Math.round((tamam / toplam) * 100) : 0,
    hasEstimate: false,
  };

  if (tamam < MIN_SETS_FOR_ESTIMATE || gecenDakika <= 0 || kalan === 0) {
    return {
      ...temel,
      // Neden tahmin yok: kullanıcı boş bir alan yerine sebebini görmeli.
      reason: kalan === 0 ? 'done'
        : tamam < MIN_SETS_FOR_ESTIMATE ? 'tooEarly' : 'noTime',
    };
  }

  const dakikaBasi = gecenDakika / tamam;
  if (dakikaBasi < MIN_MINUTES_PER_SET || dakikaBasi > MAX_MINUTES_PER_SET) {
    return { ...temel, reason: 'unreliable', minutesPerSet: Math.round(dakikaBasi * 10) / 10 };
  }

  const kalanDakika = Math.round(kalan * dakikaBasi);
  const bitis = new Date(now.getTime() + kalanDakika * 60000);

  return {
    ...temel,
    hasEstimate: true,
    minutesPerSet: Math.round(dakikaBasi * 10) / 10,
    remainingMinutes: kalanDakika,
    totalMinutes: Math.round(gecenDakika + kalanDakika),
    finishAt: bitis,
    finishLabel: `${String(bitis.getHours()).padStart(2, '0')}:${String(bitis.getMinutes()).padStart(2, '0')}`,
    elapsedLabel: formatDuration(parseNumber(elapsedSeconds)),
  };
};

/**
 * Aynı şablonun son iki seansını karşılaştırır.
 *
 * Geçmiş ekranı seansları tek tek gösteriyordu; "geçen sefere göre ne
 * değişti" sorusunu yanıtlamak için iki kaydı yan yana açıp göz kararı
 * kıyaslamak gerekiyordu. Karşılaştırma hareket hareket yapılıyor çünkü
 * toplam tonaj tek başına yanıltıcı: bir hareket ilerlerken diğeri
 * gerileyebiliyor ve toplam aynı kalabiliyor.
 */
export const compareSessions = (current, previous, { resolveLoad = null } = {}) => {
  if (!current || !previous) return { hasData: false, rows: [] };

  const ozet = (workout) => {
    const map = new Map();
    (workout.exercises || []).forEach(ex => {
      const setler = (ex.sets || []).filter(isWorkingSet).filter(s => parseNumber(s.reps) > 0);
      if (setler.length === 0) return;
      const tonaj = setler.reduce((t, s) => {
        const yuk = resolveLoad ? parseNumber(resolveLoad(ex.name, s.weight, workout)) : parseNumber(s.weight);
        return t + yuk * parseNumber(s.reps);
      }, 0);
      const enAgir = Math.max(...setler.map(s => (resolveLoad
        ? parseNumber(resolveLoad(ex.name, s.weight, workout))
        : parseNumber(s.weight))));
      map.set(ex.name, {
        name: ex.name,
        sets: setler.length,
        tonnage: Math.round(tonaj),
        topWeight: Number.isFinite(enAgir) ? enAgir : 0,
        reps: setler.reduce((t, s) => t + parseNumber(s.reps), 0),
      });
    });
    return map;
  };

  const simdi = ozet(current);
  const once = ozet(previous);
  const adlar = [...new Set([...simdi.keys(), ...once.keys()])];

  const rows = adlar.map(name => {
    const a = simdi.get(name);
    const b = once.get(name);
    const fark = (x, y) => (x ?? 0) - (y ?? 0);
    return {
      name,
      current: a || null,
      previous: b || null,
      status: !b ? 'new' : !a ? 'dropped' : 'both',
      tonnageDelta: fark(a?.tonnage, b?.tonnage),
      weightDelta: Math.round(fark(a?.topWeight, b?.topWeight) * 10) / 10,
      repsDelta: fark(a?.reps, b?.reps),
      setsDelta: fark(a?.sets, b?.sets),
    };
  }).sort((x, y) => Math.abs(y.tonnageDelta) - Math.abs(x.tonnageDelta));

  const toplamSimdi = [...simdi.values()].reduce((t, x) => t + x.tonnage, 0);
  const toplamOnce = [...once.values()].reduce((t, x) => t + x.tonnage, 0);

  return {
    hasData: rows.length > 0,
    rows,
    currentDate: current.date,
    previousDate: previous.date,
    tonnage: { current: toplamSimdi, previous: toplamOnce, delta: toplamSimdi - toplamOnce },
    improved: rows.filter(r => r.status === 'both' && r.tonnageDelta > 0).length,
    declined: rows.filter(r => r.status === 'both' && r.tonnageDelta < 0).length,
  };
};

/** Aynı şablondan yapılmış son iki seansı bulur. */
export const findComparableSessions = (workouts = [], templateId, { excludeId = null } = {}) => {
  const liste = (workouts || [])
    .filter(w => w.sourceTemplateId && w.sourceTemplateId === templateId && w.id !== excludeId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return liste.length >= 2 ? { current: liste[0], previous: liste[1] } : null;
};
