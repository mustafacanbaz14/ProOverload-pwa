import { parseNumber } from './number.js';
import { detectMuscleGroup } from './helpers.js';
import { buildPainReport, findRegion } from './painLog.js';

/**
 * Ağrı koruması.
 *
 * Ağrı günlüğü (6.1) bölge bölge ağrıyı kaydediyordu ve koç bunu bildiriyordu,
 * ama iki sistem birbirinden habersizdi: omzu üç haftadır ağrıyan biri
 * antrenman ekranında bench press'i açtığında hiçbir şey görmüyordu. Uyarının
 * asıl işe yarayacağı an tam orası — sete girmeden önce.
 *
 * Modül ağrılı BÖLGEYİ, o bölgeyi yükleyen HAREKETLERE bağlıyor ve seans
 * ekranında işaretliyor.
 *
 * İki tasarım kararı:
 *
 *  - HAREKETİ ENGELLEMİYOR. Ağrıyla çalışıp çalışmama kararı kullanıcının;
 *    uygulamanın işi kararı görünür kılmak, yerine geçmek değil. Uyarının
 *    yanında ikame kısayolu duruyor ama hareket normal şekilde yapılabiliyor.
 *  - EŞİK YÜKSEK. Her hafif rahatsızlıkta her hareketi işaretlemek, uyarıyı
 *    birkaç günde görünmez yapıyor. Yalnızca sürüyor ya da şiddetli sayılan
 *    bölgeler hareketlere bağlanıyor.
 */

/**
 * Bölge → o bölgeyi belirgin biçimde yükleyen hareket kalıpları.
 *
 * Kas eşlemesinden türetilemiyor: omuz ağrısının sorumlusu "ön deltoid" kası
 * değil, omuz ekleminin baş üstü ve geniş tutuşlu basış/çekişlerde girdiği
 * pozisyon. Eklem yükü ile kas katkısı farklı şeyler ve karıştırılırsa
 * lateral raise ile bench press aynı riskte görünüyor.
 */
export const REGION_LOADERS = {
  shoulder: {
    patterns: [
      /bench press/i, /overhead press/i, /\bohp\b/i, /shoulder press/i, /arnold/i,
      /\bdips?\b/i, /behind the neck/i, /upright row/i, /push press/i, /viking press/i,
      /wide grip bench/i, /guillotine/i, /snatch|clean|jerk/i, /muscle-?up/i,
    ],
    note: 'Baş üstü basış ve geniş tutuşlu basışlar omuz ekleminde en yüksek yükü bırakıyor.',
    safer: ['Machine Chest Press', 'Incline Dumbbell Press', 'Landmine Press', 'Neutral Grip Pull-up', 'Cable Crossover'],
  },
  elbow: {
    patterns: [/skull ?crusher/i, /french press/i, /overhead (tricep )?extension/i, /close grip bench/i, /pushdown/i, /curl/i, /chin-?up/i],
    note: 'Triseps uzatmaları ve tam gerilmeli curl varyantları dirsek tendonlarını en çok zorlayanlar.',
    safer: ['Machine Chest Press', 'Rope Pushdown', 'Hammer Curl', 'Cable Bicep Curl'],
  },
  wrist: {
    patterns: [/bench press/i, /push-?up/i, /front squat/i, /clean/i, /wrist curl/i, /reverse curl/i, /overhead press/i],
    note: 'Bileğin geriye bükülü yük taşıdığı hareketler; düz bar tutuş açısını kilitliyor.',
    safer: ['Dumbbell Bench Press', 'Machine Chest Press', 'Hammer Curl', 'Safety Bar Squat'],
  },
  lowBack: {
    patterns: [/deadlift/i, /good morning/i, /barbell row/i, /pendlay/i, /back squat/i, /front squat/i, /zercher/i, /rack pull/i, /clean/i, /overhead press/i],
    note: 'Yükü omurga üzerinden taşıyan hareketler; kalça menteşesi ve serbest çömelişler başta.',
    safer: ['Leg Press', 'Chest Supported Row', 'Machine Row', 'Seated Leg Curl', 'Hack Squat'],
  },
  hip: {
    patterns: [/squat/i, /deadlift/i, /lunge/i, /hip thrust/i, /step-?up/i, /good morning/i, /leg press/i],
    note: 'Derin kalça fleksiyonu ve kalça menteşesi hareketleri.',
    safer: ['Leg Extension', 'Seated Leg Curl', 'Box Squat', 'Cable Glute Kickback'],
  },
  knee: {
    patterns: [/squat/i, /lunge/i, /leg extension/i, /leg press/i, /step-?up/i, /step down/i, /sissy/i, /hack squat/i, /pistol/i],
    note: 'Diz fleksiyonunun derin olduğu ve diz önü yükün yüksek olduğu hareketler.',
    safer: ['Romanian Deadlift (RDL)', 'Seated Leg Curl', 'Hip Thrust', 'Box Squat'],
  },
  ankle: {
    patterns: [/calf raise/i, /squat/i, /lunge/i, /jump/i, /box step/i, /sled/i],
    note: 'Ayak bileğinin tam açıya gittiği ve sıçrama içeren hareketler.',
    safer: ['Leg Press', 'Seated Leg Curl', 'Leg Extension'],
  },
  neck: {
    patterns: [/shrug/i, /overhead press/i, /behind the neck/i, /upright row/i, /front squat/i],
    note: 'Trapez yüklenmesi ve boynun yük altında pozisyon aldığı hareketler.',
    safer: ['Chest Supported Row', 'Machine Row', 'Cable Rear Delt Fly'],
  },
};

/** Bir hareketin hangi ağrılı bölgeleri yüklediği. */
export const regionsLoadedBy = (exerciseName, regionKeys = Object.keys(REGION_LOADERS)) => {
  const ad = String(exerciseName || '');
  if (!ad) return [];
  return regionKeys.filter(key => (REGION_LOADERS[key]?.patterns || []).some(p => p.test(ad)));
};

/**
 * Uyarı verilecek bölgeler.
 *
 * Yalnızca SÜRÜYOR ya da ŞİDDETLİ bölgeler bağlanıyor. Ağrı günlüğü zaten
 * hafif kayıtları eleyerek geliyor; burada ikinci bir süzgeç var çünkü seans
 * ekranında her hareketin üstünde bir uyarı görmek, uyarının tamamını
 * görünmez yapıyor.
 */
export const activePainRegions = (painLog = [], { workouts = [], today = new Date() } = {}) => {
  const rapor = buildPainReport(painLog, { workouts, today });
  if (!rapor.hasData) return [];
  return rapor.regions
    .filter(r => r.persistent || r.high)
    .map(r => ({
      key: r.region,
      label: r.label,
      average: r.average,
      peak: r.peak,
      persistent: r.persistent,
      trend: r.trend,
      loader: REGION_LOADERS[r.region] || null,
    }))
    .filter(r => r.loader);
};

/**
 * Bir hareket için ağrı uyarısı.
 *
 * @returns { regions, note, safer, severity } | null
 */
export const painWarningFor = (exerciseName, activeRegions = [], { customExercises = [] } = {}) => {
  if (!exerciseName || activeRegions.length === 0) return null;
  const anahtarlar = activeRegions.map(r => r.key);
  const yuklenen = regionsLoadedBy(exerciseName, anahtarlar);
  if (yuklenen.length === 0) return null;

  const eslesen = activeRegions.filter(r => yuklenen.includes(r.key));
  const enSert = eslesen.slice().sort((a, b) => b.average - a.average)[0];

  // İkame önerileri: aynı kası çalıştıran ve o bölgeyi yüklemeyen hareketler.
  // Kalıp listesi elle yazıldığı için burada ikinci kez süzülüyor — listede
  // yanlışlıkla kalmış bir hareket öneri olarak çıkmasın.
  const { muscle } = detectMuscleGroup(exerciseName, customExercises);
  const guvenli = (enSert.loader.safer || [])
    .filter(ad => regionsLoadedBy(ad, anahtarlar).length === 0)
    .slice(0, 3);

  return {
    regions: eslesen.map(r => r.label),
    primaryRegion: enSert,
    muscle,
    note: enSert.loader.note,
    safer: guvenli,
    severity: enSert.persistent && enSert.average >= 6 ? 'high' : 'medium',
  };
};

/**
 * Bir seansın tamamı için ağrı taraması.
 *
 * Seans başlamadan önce "bugünkü programda üç hareket omzunu yüklüyor"
 * demek, hareket hareket uyarmaktan daha kullanışlı: kullanıcı programı
 * baştan değiştirme fırsatı buluyor.
 */
export const scanSessionForPain = (exercises = [], activeRegions = [], { customExercises = [] } = {}) => {
  const bulgular = (exercises || [])
    .map(ex => {
      const uyari = painWarningFor(ex?.name, activeRegions, { customExercises });
      return uyari ? { name: ex.name, ...uyari } : null;
    })
    .filter(Boolean);

  return {
    findings: bulgular,
    hasWarnings: bulgular.length > 0,
    regions: [...new Set(bulgular.flatMap(b => b.regions))],
  };
};

/** Ağrı korumasının günlük koç satırı. */
export const painGuardCoachItem = (scan, activeRegions = []) => {
  if (!scan?.hasWarnings) return null;
  const bolge = activeRegions.find(r => scan.regions.includes(r.label));
  const adlar = scan.findings.slice(0, 3).map(f => f.name).join(', ');
  return {
    key: 'pain-guard',
    title: `Bugünkü programda ${scan.findings.length} hareket ${scan.regions.join(' / ').toLowerCase()} bölgesini yüklüyor`,
    detail: `${adlar}${scan.findings.length > 3 ? ` ve ${scan.findings.length - 3} hareket daha` : ''}. ${bolge ? `${bolge.label} ağrısı ortalama ${bolge.average}/10 ve sürüyor. ` : ''}Hareketleri çıkarmak zorunda değilsin — ağrısız hareket aralığında çalışmak, yükü düşürmek ya da ikame etmek de seçenek. Karar senin; uygulamanın işi kararı görünür kılmak.`,
  };
};

export const painRegionLabel = (key) => findRegion(key)?.label || key;
export const parsePainSeverity = (value) => parseNumber(value);
