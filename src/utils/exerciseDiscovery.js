import { parseNumber } from './number.js';
import { DEFAULT_EXERCISES } from './constants.js';
import { detectMuscleGroup, isWorkingSet } from './helpers.js';
import { detectEquipment } from './substitution.js';
import { lengthBias } from './selectionAudit.js';

/**
 * Hareket keşfi: hiç yapmadığın ama boşluğunu dolduran hareketler.
 *
 * Kütüphanede iki yüzden fazla hareket var ve tipik bir kullanıcı bunların
 * yirmi otuzunu kullanıyor. Kalanı arama kutusunda duruyor ama kimse
 * "bugün hiç denemediğim bir hareket bulayım" diye aramıyor — arama, ne
 * aradığını bilene yarıyor.
 *
 * Bu modül tersini yapıyor: geçmişindeki BOŞLUKLARDAN yola çıkıp hareket
 * öneriyor. Boşluk üç türlü:
 *
 *  1. Bir kasın hacmi koruma eşiğinin altında ve o kas için hiç
 *     denenmemiş hareketler var.
 *  2. Bir kası hep aynı tek hareketle çalışıyorsun — o hareket bir sebeple
 *     yapılamadığında o kasın haftası tamamen çöküyor.
 *  3. Bir kasta hiç GERİLMEDE yükleyen hareket yok.
 *
 * Öneri rastgele değil: kullanıcının kullandığı EKİPMANLARDAN seçiliyor.
 * Barbell'ı olmayan birine barbell hareketi önermek, öneriyi çöpe atmak.
 */

// Bir hareketin "biliniyor" sayılması için gereken en az set.
const KNOWN_THRESHOLD = 3;

/** Kullanıcının fiilen kullandığı ekipmanlar. */
const kullanilanEkipmanlar = (workouts = []) => {
  const sayac = new Map();
  (workouts || []).forEach(w => {
    (w.exercises || []).forEach(ex => {
      const setler = (ex.sets || []).filter(isWorkingSet).length;
      if (setler === 0) return;
      const eq = detectEquipment(ex.name);
      if (!eq) return;
      sayac.set(eq.key, (sayac.get(eq.key) || 0) + setler);
    });
  });
  return sayac;
};

/**
 * @param volumeStatuses [{ muscle, volume, mev, status, sources }]
 * @returns { items, hasData, gaps }
 */
export const discoverExercises = (workouts = [], {
  volumeStatuses = [], customExercises = [], allNames = null, limit = 6,
} = {}) => {
  const havuz = allNames || [
    ...DEFAULT_EXERCISES,
    ...(customExercises || []).map(ex => (typeof ex === 'object' ? ex.name : ex)),
  ];

  // Geçmişte kaç set yapılmış.
  const yapilan = new Map();
  (workouts || []).forEach(w => {
    (w.exercises || []).forEach(ex => {
      if (!ex?.name) return;
      const setler = (ex.sets || []).filter(isWorkingSet).length;
      if (setler === 0) return;
      yapilan.set(ex.name, (yapilan.get(ex.name) || 0) + setler);
    });
  });

  const ekipman = kullanilanEkipmanlar(workouts);
  // Hiç kayıt yoksa ekipman süzgeci uygulanmıyor: yeni kullanıcıya "hiçbir
  // ekipmanın yok" demek, özelliği ilk günden kapatmak olurdu.
  const ekipmanSuzgeciAktif = ekipman.size >= 2;
  const uygunEkipman = (name) => {
    if (!ekipmanSuzgeciAktif) return true;
    const eq = detectEquipment(name);
    // Ekipmanı tanınmayan hareket kabul ediliyor: vücut ağırlığı hareketleri
    // çoğunlukla buraya düşüyor ve onlar herkeste var.
    return !eq || ekipman.has(eq.key);
  };

  // Kas bazında: hangi hareketler biliniyor, gerilme var mı.
  const kasBilgisi = new Map();
  yapilan.forEach((setler, name) => {
    const { muscle } = detectMuscleGroup(name, customExercises);
    if (!muscle) return;
    if (!kasBilgisi.has(muscle)) kasBilgisi.set(muscle, { known: [], stretch: 0, sets: 0 });
    const bilgi = kasBilgisi.get(muscle);
    bilgi.sets += setler;
    if (setler >= KNOWN_THRESHOLD) bilgi.known.push(name);
    if (lengthBias(name) === 'stretch' && setler >= KNOWN_THRESHOLD) bilgi.stretch += 1;
  });

  // Boşluklar.
  const gaps = [];
  (volumeStatuses || []).forEach(s => {
    if (s?.status === 'below' && parseNumber(s.volume) > 0) {
      gaps.push({ muscle: s.muscle, kind: 'lowVolume', weight: 3 });
    }
  });
  kasBilgisi.forEach((bilgi, muscle) => {
    if (bilgi.known.length === 1 && bilgi.sets >= 6) {
      gaps.push({ muscle, kind: 'singleExercise', weight: 2, only: bilgi.known[0] });
    }
    if (bilgi.stretch === 0 && bilgi.sets >= 6) {
      gaps.push({ muscle, kind: 'noStretch', weight: 2 });
    }
  });

  if (gaps.length === 0) return { items: [], gaps: [], hasData: false };

  // Her boşluk için hiç denenmemiş aday hareketler.
  const adaylar = new Map();
  gaps.forEach(gap => {
    havuz.forEach(name => {
      if ((yapilan.get(name) || 0) >= KNOWN_THRESHOLD) return;
      if (!uygunEkipman(name)) return;
      const { muscle, contributions } = detectMuscleGroup(name, customExercises);
      if (muscle !== gap.muscle) return;
      // Gerilme boşluğunda yalnızca gerilme hareketleri öneriliyor.
      if (gap.kind === 'noStretch' && lengthBias(name) !== 'stretch') return;

      const mevcut = adaylar.get(name) || {
        name,
        muscle,
        bias: lengthBias(name),
        equipment: detectEquipment(name)?.label || null,
        contributions,
        reasons: [],
        score: 0,
        neverTried: !yapilan.has(name),
      };
      mevcut.score += gap.weight;
      mevcut.reasons.push(
        gap.kind === 'lowVolume' ? `${gap.muscle} koruma eşiğinin altında`
          : gap.kind === 'singleExercise' ? `${gap.muscle} için tek hareket kullanıyorsun (${gap.only})`
            : `${gap.muscle} için gerilmede yükleyen hareketin yok`,
      );
      adaylar.set(name, mevcut);
    });
  });

  const sirali = [...adaylar.values()]
    // Hiç denenmemişler önce: keşfin amacı bu.
    .sort((a, b) => (Number(b.neverTried) - Number(a.neverTried)) || (b.score - a.score) || a.name.localeCompare(b.name));

  // Kas başına sınır. Sınır olmadan en yüksek puanlı tek boşluk bütün listeyi
  // dolduruyordu ve diğer boşluklar hiç görünmüyordu — oysa listenin amacı
  // boşlukları göstermek, en büyük boşluğu altı kez tekrarlamak değil.
  const kasSayaci = new Map();
  const items = [];
  sirali.forEach(x => {
    if (items.length >= limit) return;
    const adet = kasSayaci.get(x.muscle) || 0;
    if (adet >= 2) return;
    kasSayaci.set(x.muscle, adet + 1);
    items.push(x);
  });
  // Sınır yüzünden liste dolmadıysa kalanlardan tamamla.
  if (items.length < limit) {
    sirali.forEach(x => {
      if (items.length >= limit || items.includes(x)) return;
      items.push(x);
    });
  }

  return {
    items,
    gaps,
    hasData: items.length > 0,
    equipmentFiltered: ekipmanSuzgeciAktif,
    knownCount: [...yapilan.values()].filter(v => v >= KNOWN_THRESHOLD).length,
    poolSize: havuz.length,
  };
};
