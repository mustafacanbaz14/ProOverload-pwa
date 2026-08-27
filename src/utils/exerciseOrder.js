import { detectMuscleGroup } from './helpers.js';
import { lengthBias } from './selectionAudit.js';
import { estimateDuration } from './templates.js';

export const ORDER_PROFILES = {
  performance: {
    key: 'performance', label: 'Performans', short: 'Ağır Önce',
    detail: 'Bileşke hareketleri öne alır, aynı kasın ağır hareketlerini mümkün olduğunca serpiştirir.',
  },
  priority: {
    key: 'priority', label: 'Kas Önceliği', short: 'Öncelik',
    detail: 'Seçtiğin kasa en çok katkı veren hareketleri, kendi aralarında bileşkeler önce olacak şekilde öne alır.',
  },
  alternate: {
    key: 'alternate', label: 'İtiş–Çekiş Dönüşümü', short: 'Dönüşümlü',
    detail: 'İtiş, çekiş, bacak ve merkez bloklarını sırayla dağıtarak yerel yorgunluğu azaltmayı hedefler.',
  },
  upperLower: {
    key: 'upperLower', label: 'Üst–Alt Dönüşümü', short: 'Üst / Alt',
    detail: 'Tüm vücut günlerinde üst ve alt vücut hareketlerini dönüşümlü dizer.',
  },
  stretch: {
    key: 'stretch', label: 'Uzun Boy Önceliği', short: 'Gerilme',
    detail: 'Kasın uzun boyda yüklendiği hareketleri yorgunluk artmadan önceye taşır; bileşkeler yine korunur.',
  },
  familiar: {
    key: 'familiar', label: 'Bildiğim Hareketler', short: 'Tanıdık',
    detail: 'Geçmişte yaptığın hareketleri önceye alır; yeni hareketleri daha sonra uygularsın.',
  },
  preExhaust: {
    key: 'preExhaust', label: 'Bilinçli Ön Yorgunluk', short: 'Ön Yorgunluk',
    detail: 'Seçili kasın izolasyonunu bileşkesinden önceye alır. Bileşke performansını düşürebilir; yalnız bilinçli tercih olarak kullanılmalı.',
    caution: true,
  },
  manual: {
    key: 'manual', label: 'Elle Sıralama', short: 'Manuel',
    detail: 'Mevcut sırayı korur; oklarla yaptığın değişiklikleri otomatik olarak bozmaz.',
  },
};

const UPPER_MUSCLES = new Set([
  'Göğüs', 'Kanat', 'Orta Sırt', 'Trapez', 'Ön Omuz', 'Yan Omuz', 'Arka Omuz',
  'Biseps', 'Triseps', 'Önkol',
]);
const LOWER_MUSCLES = new Set(['Quadriceps', 'Hamstring', 'Kalça', 'Baldır']);
const PUSH_MUSCLES = new Set(['Göğüs', 'Ön Omuz', 'Yan Omuz', 'Triseps']);
const PULL_MUSCLES = new Set(['Kanat', 'Orta Sırt', 'Trapez', 'Arka Omuz', 'Biseps', 'Önkol']);

/**
 * Hareket sırası denetimi.
 *
 * Uygulama bir seansta HANGİ hareketlerin ve KAÇ SETİN olduğunu denetliyordu
 * ama SIRAYI hiç sormuyordu. Oysa aynı hareket listesi farklı sırayla farklı
 * sonuç veriyor: en çok yük kaldırılan hareket, o kas ön yorgunken yapılırsa
 * daha az yükle çalışılıyor ve o hareketin asıl katkısı küçülüyor.
 *
 * Üç şeye bakılıyor:
 *
 *  1. İZOLASYON BİLEŞKENİN ÖNÜNDE. Aynı kası çalıştıran bir izolasyon
 *     hareketi bileşkeden önce geliyorsa bileşkede kullanılabilecek yük
 *     düşüyor. (Bilinçli ön yorgunluk bir teknik — o yüzden uyarı, yasak değil.)
 *  2. ARKA ARKAYA AYNI KAS BİLEŞKESİ. İki ağır bileşke hareketi peş peşe
 *     geldiğinde ikincisi neredeyse her zaman düşük performansla yapılıyor.
 *  3. GERİLME HAREKETİ EN SONDA. Kasın uzun boyda yüklendiği hareket seansın
 *     en yorgun anına bırakılmışsa, en değerli uyaran en zayıf halde veriliyor.
 *
 * Hepsi UYARI, hiçbiri hata: sıralamanın tek doğrusu yok ve bilinçli tercihler
 * bu kalıplara benziyor. Modül ne yapıldığını söylüyor, ne yapılacağını değil.
 */

/** Bileşke mi: birden fazla kasa tam ya da yarım katkı veriyorsa. */
const bilesikMi = (name, customExercises = []) => {
  const { contributions, mechanics } = detectMuscleGroup(name, customExercises);
  if (mechanics === 'Isolation') return false;
  const anlamli = Object.values(contributions || {}).filter(w => w >= 0.5).length;
  return anlamli >= 2;
};

const exerciseKey = (exercise, index = 0) => exercise?.uid || `${exercise?.name || 'exercise'}-${index}`;

const exerciseMeta = (exercise, index, customExercises, performedNames) => {
  const detected = detectMuscleGroup(exercise.name, customExercises);
  const contributionTotal = Object.values(detected.contributions || {})
    .reduce((total, value) => total + (Number(value) || 0), 0);
  const muscle = detected.muscle;
  return {
    exercise,
    index,
    key: exerciseKey(exercise, index),
    muscle,
    contributions: detected.contributions || {},
    mechanics: detected.mechanics || '',
    compound: bilesikMi(exercise.name, customExercises),
    compoundScore: contributionTotal,
    stretch: lengthBias(exercise.name) === 'stretch',
    known: performedNames?.has?.(exercise.name) || false,
    pushPull: PUSH_MUSCLES.has(muscle) ? 'push'
      : PULL_MUSCLES.has(muscle) ? 'pull'
        : LOWER_MUSCLES.has(muscle) ? 'legs' : 'core',
    upperLower: UPPER_MUSCLES.has(muscle) ? 'upper'
      : LOWER_MUSCLES.has(muscle) ? 'lower' : 'core',
  };
};

const linkedToNext = (current, next) => Boolean(
  next && (current?.superset
    || (current?.supersetId && next?.supersetId && current.supersetId === next.supersetId)),
);

/** Süperset zincirlerini tek blok tutar; profil uygulamak komşuluğu bozmaz. */
const orderBlocks = (exercises, customExercises, performedNames) => {
  const list = (exercises || [])
    .map(exercise => (typeof exercise === 'string' ? { name: exercise } : exercise))
    .filter(exercise => exercise?.name);
  const blocks = [];
  for (let index = 0; index < list.length; index += 1) {
    const members = [exerciseMeta(list[index], index, customExercises, performedNames)];
    while (index < list.length - 1 && linkedToNext(list[index], list[index + 1])) {
      index += 1;
      members.push(exerciseMeta(list[index], index, customExercises, performedNames));
    }
    const contributions = {};
    members.forEach(member => Object.entries(member.contributions).forEach(([muscle, value]) => {
      contributions[muscle] = (contributions[muscle] || 0) + (Number(value) || 0);
    }));
    const primary = Object.entries(contributions).sort((a, b) => b[1] - a[1])[0]?.[0]
      || members[0].muscle;
    blocks.push({
      members,
      originalIndex: members[0].index,
      contributions,
      primary,
      compound: members.some(member => member.compound),
      compoundScore: members.reduce((sum, member) => sum + member.compoundScore, 0),
      stretch: members.some(member => member.stretch),
      known: members.filter(member => member.known).length,
      pushPull: PUSH_MUSCLES.has(primary) ? 'push'
        : PULL_MUSCLES.has(primary) ? 'pull'
          : LOWER_MUSCLES.has(primary) ? 'legs' : 'core',
      upperLower: UPPER_MUSCLES.has(primary) ? 'upper'
        : LOWER_MUSCLES.has(primary) ? 'lower' : 'core',
    });
  }
  return blocks;
};

const performanceSort = (a, b) => Number(b.compound) - Number(a.compound)
  || b.compoundScore - a.compoundScore
  || Number(b.stretch) - Number(a.stretch)
  || a.originalIndex - b.originalIndex;

const alternateBlocks = (blocks, key) => {
  const waiting = [...blocks];
  const ordered = [];
  let previous = null;
  while (waiting.length) {
    const different = waiting.findIndex(block => block[key] !== previous);
    const pick = different >= 0 ? different : 0;
    const [next] = waiting.splice(pick, 1);
    ordered.push(next);
    previous = next[key];
  }
  return ordered;
};

const orderReason = (block, profile, priorityMuscle) => {
  if (block.members.length > 1) return 'Süperset bloğu birlikte korundu';
  if (profile === 'priority' && priorityMuscle && (block.contributions[priorityMuscle] || 0) > 0) {
    return `${priorityMuscle} önceliği`;
  }
  if (profile === 'preExhaust' && priorityMuscle && !block.compound
    && (block.contributions[priorityMuscle] || 0) > 0) return `${priorityMuscle} ön yorgunluğu`;
  if (profile === 'familiar' && block.known > 0) return 'Geçmişte yaptığın hareket';
  if (profile === 'stretch' && block.stretch) return 'Uzun boyda yükleme';
  if (profile === 'alternate') return `${block.pushPull === 'push' ? 'İtiş' : block.pushPull === 'pull' ? 'Çekiş' : block.pushPull === 'legs' ? 'Bacak' : 'Merkez'} dönüşümü`;
  if (profile === 'upperLower') return `${block.upperLower === 'upper' ? 'Üst' : block.upperLower === 'lower' ? 'Alt' : 'Merkez'} vücut dönüşümü`;
  if (block.compound) return 'Yüksek bileşkelik';
  if (block.stretch) return 'Gerilmede yükleme';
  return 'Aksesuar / izolasyon';
};

/**
 * Aynı hareket listesini farklı, açıkça adlandırılmış amaçlara göre sıralar.
 * Otomatik sıralama set sayısını veya hareket seçimini değiştirmez.
 */
export const suggestOrderByProfile = (exercises = [], {
  profile = 'performance', priorityMuscle = '', customExercises = [], performedNames = new Set(),
} = {}) => {
  const list = (exercises || [])
    .map(exercise => (typeof exercise === 'string' ? { name: exercise } : exercise))
    .filter(exercise => exercise?.name);
  if (list.length < 2 || profile === 'manual') {
    return {
      changed: false,
      order: list,
      profile: ORDER_PROFILES[profile] || ORDER_PROFILES.manual,
      reasons: list.map(() => 'Elle belirlenen sıra'),
      blocks: list.length,
    };
  }

  const blocks = orderBlocks(list, customExercises, performedNames);
  let ordered = [...blocks].sort(performanceSort);
  if (profile === 'priority') {
    ordered.sort((a, b) => Number((b.contributions[priorityMuscle] || 0) > 0)
      - Number((a.contributions[priorityMuscle] || 0) > 0)
      || (b.contributions[priorityMuscle] || 0) - (a.contributions[priorityMuscle] || 0)
      || performanceSort(a, b));
  } else if (profile === 'alternate') {
    ordered = alternateBlocks(ordered, 'pushPull');
  } else if (profile === 'upperLower') {
    ordered = alternateBlocks(ordered, 'upperLower');
  } else if (profile === 'stretch') {
    ordered.sort((a, b) => Number(b.compound) - Number(a.compound)
      || Number(b.stretch) - Number(a.stretch)
      || b.compoundScore - a.compoundScore
      || a.originalIndex - b.originalIndex);
  } else if (profile === 'familiar') {
    ordered.sort((a, b) => b.known - a.known || performanceSort(a, b));
  } else if (profile === 'preExhaust') {
    ordered.sort((a, b) => {
      const rank = block => {
        const contributes = priorityMuscle && (block.contributions[priorityMuscle] || 0) > 0;
        if (contributes && !block.compound) return 0;
        if (contributes && block.compound) return 1;
        return block.compound ? 2 : 3;
      };
      return rank(a) - rank(b) || performanceSort(a, b);
    });
  }

  const order = ordered.flatMap(block => block.members.map(member => member.exercise));
  const reasons = ordered.flatMap(block => block.members.map(() => orderReason(block, profile, priorityMuscle)));
  return {
    changed: order.some((exercise, index) => exerciseKey(exercise, index) !== exerciseKey(list[index], index)),
    order,
    reasons,
    blocks: ordered.length,
    profile: ORDER_PROFILES[profile] || ORDER_PROFILES.performance,
    caution: Boolean(ORDER_PROFILES[profile]?.caution),
  };
};

const draftDuration = (exercises, restSeconds) => {
  if (!(exercises || []).length) return 0;
  const list = exercises || [];
  return estimateDuration(list.map((exercise, index) => {
    let start = index;
    while (start > 0 && list[start - 1]?.superset) start -= 1;
    const inGroup = exercise.superset || (index > 0 && list[index - 1]?.superset);
    return {
      ...exercise,
      supersetId: exercise.supersetId || (inGroup ? `draft-${start}` : null),
      sets: Array.from({ length: Math.max(0, Number(exercise.sets) || 0) }, () => ({ setType: 'normal' })),
    };
  }), restSeconds);
};

/** Seansı hareket silmeden süre bütçesine yaklaştırır; hiçbir hareket 2 set altına inmez. */
export const trimSessionToMinutes = (exercises = [], {
  targetMinutes = 60, restSeconds = 120, priorityMuscle = '', customExercises = [],
} = {}) => {
  const next = exercises.map(exercise => ({ ...exercise }));
  const changes = [];
  for (let pass = 0; pass < 80 && draftDuration(next, restSeconds) > targetMinutes; pass += 1) {
    const candidates = next.map((exercise, index) => {
      const detected = detectMuscleGroup(exercise.name, customExercises);
      return {
        index,
        sets: Number(exercise.sets) || 0,
        priority: Number(detected.contributions?.[priorityMuscle]) || 0,
        compound: bilesikMi(exercise.name, customExercises),
      };
    }).filter(candidate => candidate.sets > 2)
      .sort((a, b) => a.priority - b.priority
        || Number(a.compound) - Number(b.compound)
        || b.index - a.index
        || b.sets - a.sets);
    if (!candidates.length) break;
    const candidate = candidates[0];
    next[candidate.index].sets = candidate.sets - 1;
    changes.push({ name: next[candidate.index].name, from: candidate.sets, to: candidate.sets - 1 });
  }
  return {
    exercises: next,
    changes,
    beforeMinutes: draftDuration(exercises, restSeconds),
    afterMinutes: draftDuration(next, restSeconds),
    reached: draftDuration(next, restSeconds) <= targetMinutes,
  };
};

/** Farklı kasların iki izolasyonunu basit bir süperset adayı olarak bulur. */
export const suggestSupersetOpportunity = (exercises = [], { customExercises = [] } = {}) => {
  const list = exercises || [];
  if (list.some((exercise, index) => exercise.superset || linkedToNext(exercise, list[index + 1]))) return null;
  const candidates = list.map((exercise, index) => ({
    exercise, index,
    muscle: detectMuscleGroup(exercise.name, customExercises).muscle,
    compound: bilesikMi(exercise.name, customExercises),
  })).filter(item => !item.compound);
  for (let first = 0; first < candidates.length; first += 1) {
    const second = candidates.slice(first + 1).find(item => item.muscle !== candidates[first].muscle);
    if (second) return {
      firstUid: candidates[first].exercise.uid,
      secondUid: second.exercise.uid,
      firstName: candidates[first].exercise.name,
      secondName: second.exercise.name,
      detail: `${candidates[first].muscle} ile ${second.muscle} izolasyonları; ağır bileşkeler etkilenmeden zaman kazandırabilir.`,
    };
  }
  return null;
};

export const applySupersetOpportunity = (exercises = [], opportunity) => {
  if (!opportunity) return exercises;
  const keyMatches = (exercise, uid, name) => (uid ? exercise.uid === uid : exercise.name === name);
  const firstIndex = exercises.findIndex(exercise => keyMatches(exercise, opportunity.firstUid, opportunity.firstName));
  const secondIndex = exercises.findIndex(exercise => keyMatches(exercise, opportunity.secondUid, opportunity.secondName));
  if (firstIndex < 0 || secondIndex < 0 || firstIndex === secondIndex) return exercises;
  const first = { ...exercises[firstIndex], superset: true };
  const second = { ...exercises[secondIndex], superset: false };
  const remaining = exercises.filter((_, index) => index !== firstIndex && index !== secondIndex)
    .map(exercise => ({ ...exercise }));
  const insertion = Math.min(firstIndex, remaining.length);
  remaining.splice(insertion, 0, first, second);
  return remaining.map((exercise, index) => (index === remaining.length - 1
    ? { ...exercise, superset: false } : exercise));
};

/**
 * @param exercises  [{ name }] — seans ya da şablon sırasıyla
 * @returns { findings, hasIssues }
 */
export const auditExerciseOrder = (exercises = [], { customExercises = [] } = {}) => {
  const liste = (exercises || [])
    .map(ex => (typeof ex === 'string' ? { name: ex } : ex))
    .filter(ex => ex?.name)
    .map((ex, i) => ({
      index: i,
      name: ex.name,
      muscle: detectMuscleGroup(ex.name, customExercises).muscle,
      compound: bilesikMi(ex.name, customExercises),
      bias: lengthBias(ex.name),
    }));

  const findings = [];
  if (liste.length < 2) return { findings, hasIssues: false, exercises: liste };

  // 1. İzolasyon, aynı kasın bileşkesinden önce mi.
  liste.forEach((ex, i) => {
    if (ex.compound) return;
    const sonrakiBilesik = liste.slice(i + 1).find(x => x.compound && x.muscle === ex.muscle);
    if (!sonrakiBilesik) return;
    findings.push({
      key: 'isolation-first',
      severity: 'medium',
      index: i,
      title: `${ex.name}, ${sonrakiBilesik.name} hareketinden önce`,
      detail: `${ex.muscle} izolasyonu bileşke hareketten önce yapılınca bileşkede kaldırabileceğin yük düşüyor ve o hareketin asıl katkısı küçülüyor. Bilinçli ön yorgunluk uyguluyorsan sıra doğru; değilse bileşkeyi öne al.`,
    });
  });

  // 2. Arka arkaya aynı kasın iki ağır bileşkesi.
  liste.forEach((ex, i) => {
    const sonraki = liste[i + 1];
    if (!sonraki || !ex.compound || !sonraki.compound) return;
    if (ex.muscle !== sonraki.muscle) return;
    findings.push({
      key: 'back-to-back-compound',
      severity: 'low',
      index: i,
      title: `${ex.name} ve ${sonraki.name} peş peşe`,
      detail: `Aynı kasın iki ağır bileşke hareketi arka arkaya geldiğinde ikincisi neredeyse her zaman düşük performansla yapılıyor. Araya başka bir kasın hareketini koymak, ikinci bileşkeye daha taze girmeni sağlıyor.`,
    });
  });

  // 3. Gerilmede yükleyen hareket seansın sonunda mı.
  const gerilmeler = liste.filter(x => x.bias === 'stretch');
  gerilmeler.forEach(ex => {
    // Yalnızca son çeyrekteyse ve o kasın başka gerilme hareketi yoksa.
    const sonCeyrek = ex.index >= Math.ceil(liste.length * 0.75);
    if (!sonCeyrek) return;
    const baskaVar = gerilmeler.some(x => x.muscle === ex.muscle && x.index < ex.index);
    if (baskaVar) return;
    findings.push({
      key: 'stretch-last',
      severity: 'low',
      index: ex.index,
      title: `${ex.name} seansın sonunda`,
      detail: `${ex.muscle} için gerilmede yükleyen tek hareket bu ve en yorgun anda yapılıyor. Uzun boyda yüklenme büyüme uyaranının en değerli parçası; biraz öne almak aynı setten daha çok kazandırıyor.`,
    });
  });

  return {
    exercises: liste,
    findings: findings.sort((a, b) => a.index - b.index),
    hasIssues: findings.length > 0,
  };
};

/** Koç kartı için tek satır; yalnızca orta şiddetli bulgu varsa konuşuyor. */
export const orderCoachItem = (report, { context = 'şablon' } = {}) => {
  if (!report?.hasIssues) return null;
  const onemli = report.findings.find(f => f.severity === 'medium');
  if (!onemli) return null;
  return {
    key: 'exercise-order',
    tone: 'info',
    title: onemli.title,
    detail: `${onemli.detail} (${context})`,
  };
};

/**
 * Denetimin bulgularına göre önerilen sıra.
 *
 * Kural üç kademeli ve TEK yönlü çalışıyor, yani sonuç deterministik:
 *
 *  1. Bileşke hareketler önce, izolasyonlar sonra. En çok yük kaldırılan iş
 *     kas taze iken yapılmalı.
 *  2. Bileşkeler içinde aynı kasın hareketleri arka arkaya gelmesin —
 *     ikincisi neredeyse her zaman düşük performansla yapılıyor.
 *  3. İzolasyonlar içinde gerilmede yükleyenler önce. Uzun boyda yüklenme
 *     büyüme uyaranının en değerli parçası; en yorgun ana bırakılmamalı.
 *
 * Süperset bağı olan hareketler TEK BLOK olarak taşınıyor: kendi iç sıraları ve
 * komşulukları korunuyor. Böylece otomatik düzenleme kullanıcının kurduğu bağı
 * koparmadan bütün bloğu daha uygun bir yere alabiliyor.
 */
export const suggestOrder = (exercises = [], { customExercises = [] } = {}) => {
  const result = suggestOrderByProfile(exercises, { profile: 'performance', customExercises });
  const locked = (exercises || []).filter((exercise, index, list) => (
    exercise?.superset || linkedToNext(exercise, list[index + 1]) || exercise?.supersetId
  )).length;
  return { ...result, locked };
};
