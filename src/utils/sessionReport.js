import { parseNumber } from './number.js';
import { calcEffectiveSets, estimate1RM, isWorkingSet, isCompletedWorkingSet, detectMuscleGroup } from './helpers.js';

/**
 * Seans sonu raporu.
 *
 * Antrenman bitince kayıt sessizce listeye ekleniyordu; "bugün geçen seferden
 * iyi miydim" sorusu cevapsız kalıyor ve kullanıcı bunu ancak analiz sekmesine
 * gidip aramaya kalkarsa öğreniyordu. Geri bildirim döngüsünün kapanacağı yer
 * seansın hemen sonrası.
 *
 * Karşılaştırma AYNI HAREKET üzerinden yapılıyor, seans toplamı üzerinden değil:
 * tonaj hareket değişince ya da set sayısı farklıyken yanıltıcı olur, oysa
 * "squat'ta tahmini 1RM 2 kg arttı" doğrudan okunabilir bir cümle.
 */

/** Bir hareketin o seanstaki en iyi tahmini 1RM'i ve tonajı. */
const exerciseStats = (exercise, resolveLoad = null, workout = null) => {
  const working = (exercise?.sets || []).filter(isCompletedWorkingSet);
  let best = 0;
  let bestSet = null;
  let tonnage = 0;
  working.forEach(set => {
    // Gerçek yük: barfiks/dip gibi hareketlerde ağırlık alanı yalnızca EK yük.
    const kg = resolveLoad ? resolveLoad(exercise.name, set.weight, workout) : parseNumber(set.weight);
    const reps = parseNumber(set.reps);
    tonnage += kg * reps;
    const e1rm = estimate1RM(kg, reps, set.rir);
    if (e1rm > best) { best = e1rm; bestSet = set; }
  });
  return { sets: working.length, best: Math.round(best * 10) / 10, bestSet, tonnage: Math.round(tonnage) };
};

/**
 * Şablonun o anki halini seansa gömer. Şablon daha sonra düzenlense veya
 * silinse bile geçmişteki "planlanan" değer değişmez.
 */
export const snapshotTemplatePlan = (template) => {
  if (!template?.name || !Array.isArray(template.exercises)) return null;
  const exercises = template.exercises
    .map(exercise => ({
      name: exercise?.name || '',
      sets: (exercise?.sets || []).filter(isWorkingSet).length,
    }))
    .filter(exercise => exercise.name && exercise.sets > 0);
  if (exercises.length === 0) return null;
  return { name: template.name, exercises };
};

/** Şablondaki planlanan setlerle gerçekten tamamlanan setleri kıyaslar. */
export const buildPlanAdherence = (workout) => {
  const plan = workout?.plannedTemplate;
  if (!plan || !Array.isArray(plan.exercises) || plan.exercises.length === 0) return null;

  const planned = new Map();
  plan.exercises.forEach(exercise => {
    const name = typeof exercise?.name === 'string' ? exercise.name : '';
    const sets = Math.max(0, Number(exercise?.sets) || 0);
    if (name && sets > 0) planned.set(name, (planned.get(name) || 0) + sets);
  });
  if (planned.size === 0) return null;

  const actual = new Map();
  (workout.exercises || []).forEach(exercise => {
    const sets = (exercise.sets || []).filter(isCompletedWorkingSet).length;
    if (sets > 0) actual.set(exercise.name, (actual.get(exercise.name) || 0) + sets);
  });

  let matchedSets = 0;
  let extraSets = 0;
  const missedExercises = [];
  const completedExercises = [];
  planned.forEach((plannedSets, name) => {
    const actualSets = actual.get(name) || 0;
    matchedSets += Math.min(plannedSets, actualSets);
    extraSets += Math.max(0, actualSets - plannedSets);
    if (actualSets > 0) completedExercises.push(name);
    else missedExercises.push(name);
  });
  const extraExercises = [...actual.keys()].filter(name => !planned.has(name));
  extraExercises.forEach(name => { extraSets += actual.get(name) || 0; });

  const plannedSets = [...planned.values()].reduce((sum, sets) => sum + sets, 0);
  const completedSets = [...actual.values()].reduce((sum, sets) => sum + sets, 0);
  const percent = plannedSets > 0 ? Math.min(100, Math.round((matchedSets / plannedSets) * 100)) : 0;

  return {
    templateName: plan.name || workout.name || 'Şablon',
    plannedSets,
    completedSets,
    matchedSets,
    percent,
    plannedExercises: planned.size,
    completedPlannedExercises: completedExercises.length,
    missedExercises,
    extraExercises,
    extraSets,
    label: percent >= 90 ? 'Plan tamamlandı' : percent >= 70 ? 'Büyük ölçüde tamamlandı' : 'Plan kısmen tamamlandı',
  };
};

/**
 * @param workout      biten antrenman
 * @param history      diğer antrenmanlar (bu seans HARİÇ), tarihe göre azalan
 * @param opts.customExercises kas eşlemeleri
 * @param opts.previousRecords bu seanstan önceki kişisel rekorlar (Map)
 */
export const buildSessionReport = (workout, history = [], {
  customExercises = [],
  previousRecords = new Map(),
  resolveLoad = null,
} = {}) => {
  const exercises = (workout?.exercises || []).filter(ex => (ex.sets || []).some(isCompletedWorkingSet));
  if (exercises.length === 0) return null;

  // Aynı hareketin en son yapıldığı seans — hareket bazında ayrı ayrı aranıyor,
  // çünkü program değişmiş olabilir ve "geçen Push günü" her hareket için aynı
  // güne denk gelmeyebiliyor.
  const sonSeans = (name) => {
    for (const w of history) {
      if (w.id === workout.id) continue;
      const ex = (w.exercises || []).find(e => e.name === name);
      if (ex && (ex.sets || []).some(isCompletedWorkingSet)) {
        // Geçen seans da kendi tarihindeki vücut ağırlığıyla çözülüyor;
        // yoksa kilo değişimi sahte bir ilerleme/gerileme üretirdi.
        return { date: w.date, stats: exerciseStats(ex, resolveLoad, w) };
      }
    }
    return null;
  };

  const satirlar = exercises.map(ex => {
    const simdi = exerciseStats(ex, resolveLoad, workout);
    const onceki = sonSeans(ex.name);
    const rekor = previousRecords.get?.(ex.name) || null;

    // Tahmini 1RM formülü 15 tekrarın üstünde geçersiz (0 döner). Yüksek
    // tekrarlı izolasyon hareketlerinde ölçü 1RM değil hacim yükü olmalı;
    // yoksa lateral raise her seans "1RM 0" görünüyordu.
    const olcu = simdi.best > 0 ? 'e1rm' : 'tonnage';
    const simdiDeger = olcu === 'e1rm' ? simdi.best : simdi.tonnage;
    const oncekiDeger = onceki
      ? (olcu === 'e1rm' ? onceki.stats.best : onceki.stats.tonnage)
      : null;

    // Rekor yalnızca 1RM ölçülebilen hareketlerde ilan ediliyor ve hem kayıtlı
    // rekoru hem de geçen seansı geçmesi gerekiyor. Tek başına kayıtlı rekora
    // bakmak, rekor listesi eksikse yanlış kutlama üretiyordu.
    const esik = Math.max(
      parseNumber(rekor?.e1rm),
      olcu === 'e1rm' ? (onceki?.stats.best || 0) : 0,
    );
    const yeniRekor = olcu === 'e1rm' && simdi.best > 0 && simdi.best > esik + 0.5;

    const fark = oncekiDeger > 0
      ? Math.round((simdiDeger - oncekiDeger) * 10) / 10
      : null;

    return {
      name: ex.name,
      muscle: detectMuscleGroup(ex.name, customExercises).muscle,
      sets: simdi.sets,
      tonnage: simdi.tonnage,
      best: simdi.best,
      bestSet: simdi.bestSet,
      // Hangi ölçüyle kıyaslandığı arayüzde yazılıyor; "1RM" ile "hacim"
      // karşılaştırmasını aynı sütunda göstermek yanıltıcı olurdu.
      metric: olcu,
      value: simdiDeger,
      previousDate: onceki?.date || null,
      previousValue: oncekiDeger,
      previousSets: onceki?.stats.sets ?? null,
      delta: fark,
      // Yüzde, ağır ve hafif hareketleri aynı ölçekte karşılaştırılabilir kılar.
      deltaPct: fark !== null && oncekiDeger > 0
        ? Math.round((fark / oncekiDeger) * 1000) / 10
        : null,
      isPR: yeniRekor,
      isNew: !onceki,
    };
  });

  const ilerleyen = satirlar.filter(r => r.delta !== null && r.delta > 0);
  const gerileyen = satirlar.filter(r => r.delta !== null && r.delta < 0);
  const records = satirlar.filter(r => r.isPR);
  const planAdherence = buildPlanAdherence(workout);

  // Bu seansın kas hacmi katkısı: haftalık tabloya ne eklendi.
  const byMuscle = {};
  exercises.forEach(ex => {
    const sets = (ex.sets || []).filter(isCompletedWorkingSet).length;
    const { contributions } = detectMuscleGroup(ex.name, customExercises);
    Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
      byMuscle[kas] = Math.round(((byMuscle[kas] || 0) + sets * agirlik) * 4) / 4;
    });
  });

  return {
    date: workout.date,
    name: workout.name,
    // Şablon kimliği raporda tutuluyor ki seans sonu ekranı aynı şablonun bir
    // önceki seansını bulup kıyaslayabilsin.
    workoutId: workout.id || null,
    sourceTemplateId: workout.sourceTemplateId || null,
    duration: parseNumber(workout.duration),
    tonnage: satirlar.reduce((s, r) => s + r.tonnage, 0),
    effectiveSets: calcEffectiveSets(workout.exercises),
    exercises: satirlar,
    records,
    improved: ilerleyen,
    declined: gerileyen,
    adaptation: workout.adaptation || null,
    planAdherence,
    byMuscle,
    topMuscles: Object.entries(byMuscle).sort((a, b) => b[1] - a[1]).slice(0, 3),
    headline: baslik({ records, ilerleyen, gerileyen, satirlar }),
  };
};

/**
 * Tek cümlelik özet.
 *
 * Sıralama önemli: rekor en güçlü haber, sonra ilerleme, sonra gerileme.
 * Hiçbiri yoksa "aynı kaldı" demek de bilgidir — koruma haftalarında beklenen
 * sonuç budur ve sessiz kalmak başarısızlık gibi okunur.
 */
const baslik = ({ records, ilerleyen, gerileyen, satirlar }) => {
  if (records.length > 0) {
    return records.length === 1
      ? `${records[0].name} hareketinde yeni rekor.`
      : `${records.length} harekette yeni rekor.`;
  }
  if (ilerleyen.length > gerileyen.length && ilerleyen.length > 0) {
    return `${ilerleyen.length} harekette geçen seansın üstüne çıktın.`;
  }
  if (gerileyen.length > 0 && ilerleyen.length === 0) {
    return `${gerileyen.length} harekette geçen seansın altında kaldın.`;
  }
  const yeni = satirlar.filter(r => r.isNew).length;
  if (yeni === satirlar.length) return 'İlk kez yapılan hareketler — bundan sonraki seanslar buna göre kıyaslanacak.';
  return 'Performans geçen seansla aynı seviyede.';
};
