import { parseNumber } from './number.js';
import { bodyweightFactorOf, looksLikeTotalEntry } from './bodyweight.js';
import { isWorkingSet, findMetricsForDate } from './helpers.js';

/**
 * Vücut ağırlıklı kayıtların yazım biçimi denetimi.
 *
 * Kullanıcıların iki alışkanlığı var ve geçmiş çoğu zaman KARIŞIK: bir dönem
 * "80" (toplam), sonra "0" (ek yok) yazılmış olabiliyor. Otomatik tanıma bunu
 * set bazında çözüyor ama kullanıcının ne olup bittiğini görmesi gerekiyor —
 * hesaplar sessizce iki farklı kurala göre yürüyorsa kimse sayılara güvenemez.
 *
 * Bu modül sayıyor, örnek gösteriyor ve isteğe bağlı olarak geçmişi TEK
 * biçime çeviriyor: alan daima "ek yük" olacak şekilde.
 */

/**
 * @returns {{
 *   total: number, added: number, uncertain: Array,
 *   byExercise: Array, hasMixed: boolean, canNormalize: boolean
 * }}
 */
export const auditBodyweightEntries = (workouts = [], {
  metricsHistory = [],
  currentMetrics = null,
  customExercises = [],
} = {}) => {
  const perExercise = new Map();
  let total = 0;
  let added = 0;
  const uncertain = [];

  (workouts || []).forEach(workout => {
    const olcum = findMetricsForDate(metricsHistory, workout?.date, currentMetrics);
    const kilo = parseNumber(olcum?.weight);

    (workout?.exercises || []).forEach(ex => {
      const oran = bodyweightFactorOf(ex.name, customExercises);
      if (oran === null || !(kilo > 0)) return;
      const tasinan = kilo * oran;

      (ex.sets || []).filter(isWorkingSet).forEach(set => {
        const yazilan = parseNumber(set.weight);
        const toplamMi = looksLikeTotalEntry(yazilan, tasinan);
        const kayit = perExercise.get(ex.name) || { name: ex.name, total: 0, added: 0, samples: [] };

        if (toplamMi) {
          total += 1;
          kayit.total += 1;
          if (kayit.samples.length < 3) {
            kayit.samples.push({
              date: workout.date, logged: yazilan,
              carried: Math.round(tasinan * 10) / 10,
              // Normalleştirmede alanın alacağı değer: negatife düşmesin.
              wouldBecome: Math.max(0, Math.round((yazilan - tasinan) * 10) / 10),
            });
          }
        } else {
          added += 1;
          kayit.added += 1;
        }

        // Eşiğe çok yakın setler otomatik tanımanın en kırılgan olduğu yer;
        // ayrıca listeleniyor ki kullanıcı gözle doğrulayabilsin.
        if (Math.abs(yazilan - tasinan * 0.7) < tasinan * 0.1 && yazilan > 0) {
          uncertain.push({ name: ex.name, date: workout.date, logged: yazilan, carried: Math.round(tasinan * 10) / 10 });
        }

        perExercise.set(ex.name, kayit);
      });
    });
  });

  const byExercise = [...perExercise.values()]
    .sort((a, b) => (b.total + b.added) - (a.total + a.added));

  return {
    total,
    added,
    uncertain: uncertain.slice(0, 8),
    byExercise,
    // Geçmişte iki biçim birden varsa kullanıcıya söylemek gerekiyor.
    hasMixed: total > 0 && added > 0,
    canNormalize: total > 0,
  };
};

/**
 * Geçmişi tek biçime çevirir: ağırlık alanı daima EK yük.
 *
 * Toplam yazılmış setlerden o tarihteki taşınan vücut ağırlığı düşülüyor.
 * Sonuç negatife düşemez — düşerse kullanıcı kendi kilosundan az bir sayı
 * yazmış demektir ve o veriyi tahmin etmeye çalışmak yerine 0 kabul etmek
 * daha dürüst.
 *
 * Antrenman nesneleri kopyalanıyor; yalnızca değişen setler yeniden yazılıyor.
 */
export const normalizeBodyweightEntries = (workouts = [], {
  metricsHistory = [],
  currentMetrics = null,
  customExercises = [],
} = {}) => {
  let changed = 0;

  const next = (workouts || []).map(workout => {
    const olcum = findMetricsForDate(metricsHistory, workout?.date, currentMetrics);
    const kilo = parseNumber(olcum?.weight);
    if (!(kilo > 0)) return workout;

    let workoutChanged = false;
    const exercises = (workout.exercises || []).map(ex => {
      const oran = bodyweightFactorOf(ex.name, customExercises);
      if (oran === null) return ex;
      const tasinan = kilo * oran;

      let exChanged = false;
      const sets = (ex.sets || []).map(set => {
        if (!isWorkingSet(set)) return set;
        const yazilan = parseNumber(set.weight);
        if (!looksLikeTotalEntry(yazilan, tasinan)) return set;

        const yeni = Math.max(0, Math.round((yazilan - tasinan) * 10) / 10);
        exChanged = true;
        changed += 1;
        return { ...set, weight: yeni === 0 ? '0' : String(yeni) };
      });

      if (!exChanged) return ex;
      workoutChanged = true;
      return { ...ex, sets };
    });

    return workoutChanged ? { ...workout, exercises } : workout;
  });

  return { workouts: next, changed };
};
