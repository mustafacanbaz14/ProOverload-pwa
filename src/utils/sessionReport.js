import { parseNumber } from './number.js';
import { calcTonnage, calcEffectiveSets, estimate1RM, isWorkingSet, detectMuscleGroup } from './helpers.js';

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
const exerciseStats = (exercise) => {
  const working = (exercise?.sets || []).filter(isWorkingSet);
  let best = 0;
  let bestSet = null;
  let tonnage = 0;
  working.forEach(set => {
    const kg = parseNumber(set.weight);
    const reps = parseNumber(set.reps);
    tonnage += kg * reps;
    const e1rm = estimate1RM(kg, reps, set.rir);
    if (e1rm > best) { best = e1rm; bestSet = set; }
  });
  return { sets: working.length, best: Math.round(best * 10) / 10, bestSet, tonnage: Math.round(tonnage) };
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
} = {}) => {
  const exercises = (workout?.exercises || []).filter(ex => (ex.sets || []).some(isWorkingSet));
  if (exercises.length === 0) return null;

  // Aynı hareketin en son yapıldığı seans — hareket bazında ayrı ayrı aranıyor,
  // çünkü program değişmiş olabilir ve "geçen Push günü" her hareket için aynı
  // güne denk gelmeyebiliyor.
  const sonSeans = (name) => {
    for (const w of history) {
      if (w.id === workout.id) continue;
      const ex = (w.exercises || []).find(e => e.name === name);
      if (ex && (ex.sets || []).some(s => isWorkingSet(s) && parseNumber(s.reps) > 0)) {
        return { date: w.date, stats: exerciseStats(ex) };
      }
    }
    return null;
  };

  const satirlar = exercises.map(ex => {
    const simdi = exerciseStats(ex);
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

  // Bu seansın kas hacmi katkısı: haftalık tabloya ne eklendi.
  const byMuscle = {};
  exercises.forEach(ex => {
    const sets = (ex.sets || []).filter(isWorkingSet).length;
    const { contributions } = detectMuscleGroup(ex.name, customExercises);
    Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
      byMuscle[kas] = Math.round(((byMuscle[kas] || 0) + sets * agirlik) * 4) / 4;
    });
  });

  return {
    date: workout.date,
    name: workout.name,
    duration: parseNumber(workout.duration),
    tonnage: calcTonnage(workout.exercises),
    effectiveSets: calcEffectiveSets(workout.exercises),
    exercises: satirlar,
    records,
    improved: ilerleyen,
    declined: gerileyen,
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
