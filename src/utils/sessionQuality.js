import { parseNumber } from './number.js';
import { MUSCLE_GROUPS } from './constants.js';
import { isWorkingSet, isWarmupSet, detectMuscleGroup } from './helpers.js';

/**
 * Seans kalitesi: hareket sırası ve süre verimliliği.
 *
 * Uygulama seansın İÇERİĞİNİ (hacim, kas dağılımı) ve SONUCUNU (rapor, rekor)
 * ölçüyordu ama seansın nasıl geçtiğini ölçmüyordu. İki şey burada:
 *
 *  1. HAREKET SIRASI. En çok yük kaldıran bileşke hareket seansın sonuna
 *     kalırsa hem risk artıyor hem de o hareketin taşıdığı uyaran düşüyor:
 *     yorgunken kaldırılan 100 kg, dinçken kaldırılan 100 kg ile aynı
 *     uyaranı vermiyor. Kural basit ve tartışmasız: bileşkeler önce.
 *  2. SÜRE VERİMLİLİĞİ. Aynı 20 set 50 dakikada da 110 dakikada da yapılabilir.
 *     İkisi farklı seanslar; ikincisinde dinlenmeler dağılmış demektir. Set
 *     başına dakika bunu tek sayıyla gösteriyor.
 *
 * Modül "yanlış yaptın" demiyor. Ağır bir çömelişten sonra ikinci bir bileşke
 * yapmak bilinçli bir tercih olabilir; uzun seans sohbet değil ağır single'lar
 * yüzünden olabilir. Bulgular gösteriliyor, karar kullanıcıda.
 */

// Bir hareketin "bileşke" sayılması için toplam katkı ağırlığı bu eşiği
// geçmeli. Katkı toplamı, hareketin kaç kası birden yüklediğinin doğrudan
// ölçüsü ve zaten uygulamanın kendi kas eşleme tablosundan geliyor.
const COMPOUND_THRESHOLD = 1.75;
// Sıra ihlali sayılması için bileşkenin izolasyondan bu kadar sonra gelmesi
// gerekiyor. Bir sıra kayması genelde ekipman doluluğundan; ikisi örüntü.
const ORDER_TOLERANCE = 1;
// Set başına dakika bantları. Alt sınır teknik olarak imkânsıza yakın
// (dinlenmesiz), üst sınırın üstü dağılmış bir seans.
const FAST_MIN_PER_SET = 1.5;
const SLOW_MIN_PER_SET = 5.5;

/** Bir hareketin bileşke olup olmadığı ve katkı toplamı. */
export const compoundScore = (name, customExercises = []) => {
  const { contributions } = detectMuscleGroup(name, customExercises);
  return Object.values(contributions || {}).reduce((t, w) => t + parseNumber(w), 0);
};

/**
 * Bir antrenmanın (ya da şablonun) sıra ve verimlilik denetimi.
 *
 * @param exercises  [{ name, sets }]
 * @param opts.durationMinutes  seans süresi; yoksa verimlilik hesaplanmıyor
 */
export const auditSessionQuality = (exercises = [], {
  customExercises = [],
  durationMinutes = 0,
} = {}) => {
  const liste = (exercises || [])
    .map((ex, index) => {
      const calisma = (ex?.sets || []).filter(isWorkingSet).length;
      const isinma = (ex?.sets || []).filter(isWarmupSet).length;
      return {
        index,
        name: ex?.name || '',
        sets: calisma,
        warmups: isinma,
        score: compoundScore(ex?.name, customExercises),
      };
    })
    .filter(x => x.name && x.sets > 0);

  const findings = [];

  // --- sıra denetimi ---
  liste.forEach((ex, i) => {
    if (ex.score < COMPOUND_THRESHOLD) return;
    // Bu bileşkeden ÖNCE gelen izolasyonlar.
    const oncekiIzolasyon = liste.slice(0, i).filter(x => x.score < COMPOUND_THRESHOLD);
    if (oncekiIzolasyon.length <= ORDER_TOLERANCE) return;
    findings.push({
      kind: 'order',
      severity: oncekiIzolasyon.length >= 3 ? 'medium' : 'low',
      exercise: ex.name,
      title: `${ex.name} çok geç geliyor`,
      detail: `${oncekiIzolasyon.length} izolasyon hareketinden sonra yapılıyor (${oncekiIzolasyon.map(x => x.name).slice(0, 3).join(', ')}). En çok yük kaldıran hareket yorgunken yapılınca hem risk artıyor hem uyaran düşüyor; öne almak set eklemeden kazanç sağlar.`,
    });
  });

  // --- süre verimliliği ---
  const toplamSet = liste.reduce((t, x) => t + x.sets, 0);
  const isinmaSet = liste.reduce((t, x) => t + x.warmups, 0);
  const sure = parseNumber(durationMinutes);
  let efficiency = null;

  if (sure > 0 && toplamSet > 0) {
    const dakikaBasi = Math.round((sure / toplamSet) * 10) / 10;
    let pace = 'ok';
    if (dakikaBasi > SLOW_MIN_PER_SET) pace = 'slow';
    else if (dakikaBasi < FAST_MIN_PER_SET) pace = 'fast';

    efficiency = {
      minutes: Math.round(sure),
      workingSets: toplamSet,
      warmupSets: isinmaSet,
      minutesPerSet: dakikaBasi,
      pace,
      note: pace === 'slow'
        ? `Set başına ${dakikaBasi} dakika. Ağır bileşkelerde uzun dinlenme normaldir ama seansın tamamı bu tempodaysa dinlenmeler dağılmış demektir; aynı hacim daha kısa sürede yapılabilir.`
        : pace === 'fast'
          ? `Set başına ${dakikaBasi} dakika. Bu tempoda dinlenme çoğu bileşke hareket için yetersiz kalıyor ve sonraki setlerin tekrarları düşüyor — hacim aynı görünse de uyaran azalıyor.`
          : `Set başına ${dakikaBasi} dakika. Hacim ile süre arasındaki oran makul.`,
    };
  }

  // --- kas dağılımı: seans neye odaklanmış ---
  const byMuscle = {};
  liste.forEach(ex => {
    const { contributions } = detectMuscleGroup(ex.name, customExercises);
    Object.entries(contributions || {}).forEach(([kas, w]) => {
      byMuscle[kas] = (byMuscle[kas] || 0) + ex.sets * parseNumber(w);
    });
  });
  const focus = MUSCLE_GROUPS
    .map(kas => ({ muscle: kas, volume: Math.round((byMuscle[kas] || 0) * 4) / 4 }))
    .filter(x => x.volume > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 3);

  return {
    exercises: liste,
    findings,
    efficiency,
    focus,
    totalSets: toplamSet,
    hasData: liste.length > 0,
    clean: findings.length === 0,
  };
};

/** Seans kalitesinin günlük koç satırı; yalnızca sıra ihlalleri için. */
export const sessionQualityCoachItem = (report) => {
  if (!report?.hasData) return null;
  const ilk = report.findings.find(f => f.severity === 'medium');
  if (!ilk) return null;
  return {
    exercise: ilk.exercise,
    title: ilk.title,
    detail: ilk.detail,
  };
};
