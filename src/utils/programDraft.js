import { detectMuscleGroup } from './helpers.js';
import { getVolumeLandmarks } from './constants.js';
import { auditExerciseSelection } from './selectionAudit.js';

export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const SUGGESTED_WEEKDAYS = {
  1: ['mon'],
  2: ['mon', 'thu'],
  3: ['mon', 'wed', 'fri'],
  4: ['mon', 'tue', 'thu', 'fri'],
  5: ['mon', 'tue', 'wed', 'fri', 'sat'],
  6: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  7: WEEKDAY_KEYS,
};

export const suggestedWeekdays = (count = 1) =>
  (SUGGESTED_WEEKDAYS[Math.max(1, Math.min(7, Number(count) || 1))] || WEEKDAY_KEYS).slice();

export const nextUnusedWeekday = (days = []) => {
  const used = new Set((days || []).map(day => day.weekday).filter(Boolean));
  return WEEKDAY_KEYS.find(key => !used.has(key)) || 'mon';
};

export const addExercisesToDraftDay = (day, names = [], generateId, sets = 3) => {
  const current = Array.isArray(day?.exercises) ? day.exercises : [];
  const existing = new Set(current.map(ex => ex.name));
  const additions = (names || [])
    .filter(name => typeof name === 'string' && name.trim() && !existing.has(name))
    .map(name => ({ uid: generateId(), name, sets: Math.max(1, Math.min(12, Number(sets) || 3)), superset: false }));
  return { ...day, exercises: [...current, ...additions] };
};

/**
 * Bir hareketi SONRAKİ hareketle süperset yapar ya da bağı kaldırır.
 *
 * Bağ, hareketin üstünde `superset: true` bayrağı olarak duruyor ve "bir
 * sonrakiyle birlikte" anlamına geliyor. Taslakta paylaşılan bir kimlik
 * tutmak yerine bayrak kullanılmasının sebebi sıralama: hareketler yukarı
 * aşağı taşınabiliyor ve paylaşılan kimlik taşıma sonrası birbirine komşu
 * olmayan iki hareketi bağlı gösterebiliyordu. Bayrak her zaman komşuluğu
 * anlatıyor, şablona çevrilirken gerçek kimliğe dönüşüyor.
 *
 * Son hareket bağlanamaz: bağlanacak bir sonraki yok.
 */
export const toggleDraftSuperset = (day, uid) => {
  const liste = day?.exercises || [];
  const i = liste.findIndex(ex => ex.uid === uid);
  if (i < 0 || i === liste.length - 1) return day;
  return {
    ...day,
    exercises: liste.map((ex, idx) => idx === i ? { ...ex, superset: !ex.superset } : ex),
  };
};

export const replaceDraftExercise = (day, uid, name) => ({
  ...day,
  exercises: (day?.exercises || []).map(ex => ex.uid === uid ? { ...ex, name } : ex),
});

/**
 * Komşuluk bayraklarını gerçek süperset kimliklerine çevirir.
 *
 * Taslakta bağ `superset: true` ("bir sonrakiyle birlikte") olarak duruyor
 * çünkü hareketler taşınabiliyor ve paylaşılan bir kimlik taşıma sonrası
 * komşu olmayan iki hareketi bağlı gösterebiliyordu. Şablon tarafı ise
 * `supersetId` bekliyor. Dönüşüm bu iki dünyanın tek buluşma noktası.
 *
 * Zincir (a-b-c) tek grup oluyor: ActiveWorkoutView ikiden fazla üyeyi de
 * doğru gösteriyor.
 */
export const draftSupersetIds = (exercises = [], seed = 'g') => {
  const liste = exercises || [];
  return liste.map((ex, i) => {
    const bagli = (ex.superset && liste[i + 1]) || (i > 0 && liste[i - 1]?.superset);
    if (!bagli) return null;
    let bas = i;
    while (bas > 0 && liste[bas - 1]?.superset) bas -= 1;
    return `ss-${seed}-${bas}`;
  });
};

/**
 * Şablondaki `supersetId`'leri taslağın komşuluk bayrağına çevirir.
 *
 * Ters yön 6.8'e kadar hiç yazılmamıştı: var olan bir şablonu düzenlemeye
 * açmak süpersetleri sessizce düşürüyordu, kaydedince de gidiyorlardı. Bayrak
 * yalnızca KOMŞU hareketler aynı kimliği paylaşıyorsa konuyor — şablonda
 * araya başka hareket girmişse bağ zaten anlamını yitirmiş demektir.
 */
export const draftFlagsFromSupersetIds = (exercises = []) => {
  const liste = exercises || [];
  return liste.map((ex, i) => {
    const sonraki = liste[i + 1];
    return Boolean(ex?.supersetId && sonraki?.supersetId && ex.supersetId === sonraki.supersetId);
  });
};

/**
 * Bir hareketi listenin en başına ya da en sonuna taşır.
 *
 * Tek tek yukarı taşımak sekiz hareketlik bir günde yedi dokunuş demekti.
 * Taşınan hareketin süperset bağı KOPARILIYOR: bağ komşuluk demek, hareket
 * eski komşusundan ayrıldığında bağın anlamı kalmıyor. Eski komşunun bağı da
 * kalkıyor, yoksa artık var olmayan bir eşe işaret ederdi.
 */
export const moveDraftExerciseToEdge = (day, uid, edge = 'top') => {
  const liste = day?.exercises || [];
  const i = liste.findIndex(ex => ex.uid === uid);
  if (i < 0) return day;
  if ((edge === 'top' && i === 0) || (edge === 'bottom' && i === liste.length - 1)) return day;

  const kalan = liste.filter((_, idx) => idx !== i).map((ex, idx, dizi) => (
    // Taşınan hareketin ESKİ öncülü artık boşluğa bağlanıyor olurdu.
    idx === dizi.length - 1 ? { ...ex, superset: false } : ex
  ));
  const tasinan = { ...liste[i], superset: false };
  const yeni = edge === 'top' ? [tasinan, ...kalan] : [...kalan, tasinan];

  // Son hareket hiçbir zaman bağlı olamaz (bağlanacak sonraki yok).
  return {
    ...day,
    exercises: yeni.map((ex, idx) => (idx === yeni.length - 1 ? { ...ex, superset: false } : ex)),
  };
};

/**
 * Bir hareketi başka bir güne taşır ya da kopyalar.
 *
 * Program yazarken en sık yapılan düzeltme "bu hareket yanlış günde" oluyordu
 * ve tek yolu silip öbür günde yeniden eklemekti — set sayısı da kayboluyordu.
 * Kopyalama ayrı bir kip: aynı hareketi iki güne koymak (örn. üst/alt bölünmede
 * bileşke hareket) meşru bir tercih.
 *
 * Hedef günde aynı hareket zaten varsa işlem yapılmıyor: aynı günde iki kez
 * aynı hareket, hacim hesabında sessizce iki kat sayılırdı.
 */
export const moveDraftExerciseToDay = (days = [], fromIndex, uid, toIndex, { copy = false, generateId } = {}) => {
  const kaynak = days[fromIndex];
  const hedef = days[toIndex];
  if (!kaynak || !hedef || fromIndex === toIndex) return days;

  const ex = (kaynak.exercises || []).find(x => x.uid === uid);
  if (!ex) return days;
  if ((hedef.exercises || []).some(x => x.name === ex.name)) return days;

  const kopya = { ...ex, uid: generateId ? generateId() : `${uid}-copy`, superset: false };

  return days.map((day, i) => {
    if (i === toIndex) {
      // Hedefin son hareketi bağlı kalamaz: yeni gelen onun eşi değil.
      const mevcut = (day.exercises || []).map((x, idx, dizi) =>
        (idx === dizi.length - 1 ? { ...x, superset: false } : x));
      return { ...day, exercises: [...mevcut, kopya] };
    }
    if (i === fromIndex && !copy) {
      const kalan = (day.exercises || []).filter(x => x.uid !== uid);
      return {
        ...day,
        exercises: kalan.map((x, idx) => (idx === kalan.length - 1 ? { ...x, superset: false } : x)),
      };
    }
    return day;
  });
};

/**
 * Taslağın TAMAMI için haftalık hacim ve seçim denetimi.
 *
 * Şablon oluşturucu şimdiye kadar yalnızca AÇIK OLAN GÜNÜN hacmini
 * gösteriyordu. Ama hipertrofi kararları haftalık: bir kasın MEV'in altında
 * kalıp kalmadığı ancak bütün günler toplanınca görülüyor. Gün gün bakarak
 * program yazan biri, her günü makul görünen ama haftalık toplamı 4 set olan
 * bir program üretebiliyordu.
 *
 * Set sayısı doğrudan alınıyor, RIR yok: şablonda henüz efor bilgisi
 * olmadığı için gösterilen değer ÜST SINIR — "en iyi ihtimalle bu kadar".
 */
export const draftWeeklyVolume = (days = [], { customExercises = [], experienceLevel = 'intermediate' } = {}) => {
  const byMuscle = {};
  const sources = {};

  (days || []).forEach(day => {
    (day.exercises || []).forEach(ex => {
      const { contributions } = detectMuscleGroup(ex.name, customExercises);
      const setSayisi = Math.max(0, Number(ex.sets) || 0);
      if (setSayisi === 0) return;
      Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
        const katki = setSayisi * agirlik;
        byMuscle[kas] = Math.round(((byMuscle[kas] || 0) + katki) * 4) / 4;
        if (!sources[kas]) sources[kas] = [];
        sources[kas].push({ name: ex.name, volume: katki, dayLabel: day.name });
      });
    });
  });

  const statuses = Object.entries(byMuscle).map(([muscle, volume]) => {
    const { mev, mav, mrv } = getVolumeLandmarks(muscle, experienceLevel);
    const durum = volume < mev ? 'below' : volume > mrv ? 'over' : volume >= mav ? 'high' : 'ok';
    return { muscle, volume, mev, mav, mrv, status: durum, sources: sources[muscle] || [] };
  }).sort((a, b) => b.volume - a.volume);

  const audit = auditExerciseSelection(statuses, { customExercises });

  return {
    statuses,
    totalSets: (days || []).reduce((t, d) => t + (d.exercises || []).reduce((x, e) => x + (Number(e.sets) || 0), 0), 0),
    below: statuses.filter(s => s.status === 'below'),
    over: statuses.filter(s => s.status === 'over'),
    audit,
    hasData: statuses.length > 0,
  };
};

export const duplicateDraftDay = (days = [], index, generateId) => {
  if (!days[index] || days.length >= 7) return days;
  const source = days[index];
  const copy = {
    ...source,
    uid: generateId(),
    name: `${source.name} Kopya`,
    weekday: nextUnusedWeekday(days),
    exercises: (source.exercises || []).map(ex => ({ ...ex, uid: generateId() })),
  };
  const next = [...days];
  next.splice(index + 1, 0, copy);
  return next;
};

/** Sihirbaz çıktısını elle düzenlenebilir taslağa çevirir. */
export const draftFromGeneratedProgram = (built, generateId) => {
  if (!built?.days?.length) return null;
  const schedule = built.split?.schedule || {};
  const weekdayByIndex = new Map(Object.entries(schedule).map(([weekday, index]) => [index, weekday]));
  return {
    name: built.split?.name || 'Yeni Program',
    days: built.days.map((day, index) => ({
      name: day.name || `${index + 1}. Gün`,
      weekday: weekdayByIndex.get(index) || suggestedWeekdays(built.days.length)[index] || 'mon',
      exercises: (day.exercises || []).map(ex => ({
        uid: generateId(),
        name: ex.name,
        sets: Math.max(1, Math.min(12, Number(ex.sets) || 3)),
      })),
    })),
  };
};

/**
 * Hazır programı elle düzenlenebilir taslağa çevirir.
 *
 * Hazır programlar şimdiye kadar yalnızca "olduğu gibi kur" seçeneğiyle
 * geliyordu. Ekipmanı olmayan ya da bir hareketi yapamayan kullanıcı önce
 * kurup sonra gün gün düzeltmek zorundaydı; çoğu kişi bunu yapmadan programı
 * eksik uyguluyordu. Taslağa çevirmek, kurmadan önce değiştirmeyi mümkün
 * kılıyor.
 */
export const draftFromStarterProgram = (program, generateId) => {
  if (!program?.days?.length) return null;
  const schedule = program.schedule || {};
  const weekdayByIndex = new Map(Object.entries(schedule).map(([weekday, index]) => [index, weekday]));
  return {
    name: program.name || 'Hazır Program',
    days: program.days.map((day, index) => ({
      uid: generateId(),
      name: day.name || `${index + 1}. Gün`,
      weekday: weekdayByIndex.get(index) || suggestedWeekdays(program.days.length)[index] || 'mon',
      exercises: (day.exercises || []).map(ex => ({
        uid: generateId(),
        name: ex.name,
        sets: Math.max(1, Math.min(12, Number(ex.sets) || 3)),
        superset: false,
      })),
    })),
  };
};

/** Elle yazılan taslağı şablonlara ve isteğe bağlı aktif haftalık plana dönüştürür. */
export const instantiateDraftProgram = (programName, draftDays = [], generateId, createdAt = new Date().toISOString()) => {
  const filled = (draftDays || []).filter(day => (day.exercises || []).length > 0);
  const templates = filled.map(day => ({
    id: generateId(),
    name: `${programName} — ${day.name}`,
    createdAt,
    // Komşuluk bayrağı gerçek kimliğe çevriliyor: bayraklı hareket ve onu
    // izleyen hareket aynı kimliği paylaşıyor. Zincirleme bağlar (a-b-c) tek
    // grup oluyor; ActiveWorkoutView ikiden fazla üyeyi de doğru gösteriyor.
    exercises: day.exercises.map((ex, i) => ({
      name: ex.name,
      supersetId: draftSupersetIds(day.exercises, day.uid || 'g')[i],
      sets: Array.from({ length: Math.max(1, Number(ex.sets) || 1) }, () => ({
        id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal',
      })),
    })),
  }));

  const planDays = Object.fromEntries(WEEKDAY_KEYS.map(key => [key, []]));
  filled.forEach((day, index) => {
    const template = templates[index];
    const weekday = WEEKDAY_KEYS.includes(day.weekday) ? day.weekday : suggestedWeekdays(filled.length)[index];
    if (!template || !weekday) return;
    planDays[weekday].push({ id: generateId(), type: 'workout', templateId: template.id, time: '' });
  });

  return {
    templates,
    plan: { id: generateId(), name: programName, days: planDays },
  };
};
