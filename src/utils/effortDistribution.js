import { parseNumber } from './number.js';
import { isWorkingSet, detectMuscleGroup } from './helpers.js';
import { toLocalDate, dayKey } from './dates.js';

/**
 * Şiddet (RIR) dağılımı.
 *
 * Uygulama "etkili set" sayıyordu: RIR 3 ve altındaki setler hacme giriyor,
 * üstündekiler girmiyor. Bu ikili ayrım hacim hesabı için yeterli ama
 * ANTRENMANIN KARAKTERİNİ göstermiyor. İki kişi de haftada 16 etkili set
 * yapıyor olabilir; biri hepsini RIR 3'te yapıyor, diğeri hepsini RIR 0'da.
 * Bunlar aynı program değil: birincisi uyaranın altında kalıyor olabilir,
 * ikincisi toparlanamıyor olabilir.
 *
 * Bu modül setleri dört kovaya ayırıyor ve dağılımın kendisine bakıyor. İki
 * uçtaki tablo da sorunlu:
 *
 *  - HEP KOLAY (RIR 4+): setler büyüme eşiğinin altında. Hacim tablosu bunu
 *    zaten dışarıda bırakıyor ama kullanıcı "16 set yaptım" diye biliyor.
 *  - HEP MAKSİMAL (RIR 0): her seti başarısızlığa taşımak, aynı hacmi
 *    RIR 1-2'de yapmaya göre belirgin daha fazla yorgunluk bırakıyor ve
 *    sonraki setlerin kalitesini düşürüyor.
 */

export const RIR_BUCKETS = [
  {
    key: 'failure', label: 'RIR 0', short: '0', color: 'text-red-400', bar: 'bg-red-500',
    test: (rir) => rir <= 0,
    hint: 'Başarısızlığa kadar. En yüksek uyaran ama en yüksek toparlanma maliyeti.',
  },
  {
    key: 'hard', label: 'RIR 1-2', short: '1-2', color: 'text-emerald-400', bar: 'bg-emerald-500',
    test: (rir) => rir >= 1 && rir <= 2,
    hint: 'Hipertrofi için en verimli bant: uyaran yüksek, yorgunluk yönetilebilir.',
  },
  {
    key: 'moderate', label: 'RIR 3', short: '3', color: 'text-cyan-400', bar: 'bg-cyan-500',
    test: (rir) => rir === 3,
    hint: 'Hâlâ etkili sayılıyor; hacmin bir kısmı burada olabilir.',
  },
  {
    key: 'easy', label: 'RIR 4+', short: '4+', color: 'text-zinc-500', bar: 'bg-zinc-600',
    test: (rir) => rir >= 4,
    hint: 'Büyüme eşiğinin altında. Isınma değilse bu setler hacme sayılmıyor.',
  },
];

const bucketOf = (rir) => RIR_BUCKETS.find(b => b.test(rir)) || null;

// Dağılım yorumlamak için gereken en az set sayısı.
const MIN_SETS = 15;
// Bu payın üstü "hep maksimal" sayılıyor.
const FAILURE_HEAVY = 0.4;
// Bu payın üstü "hep kolay" sayılıyor.
const EASY_HEAVY = 0.35;
// Verimli bandın (RIR 1-3) altına inmemesi beklenen pay.
const PRODUCTIVE_TARGET = 0.5;

/**
 * Son N gündeki çalışma setlerinin RIR dağılımı.
 *
 * RIR girilmemiş setler ayrı sayılıyor ve dağılıma KATILMIYOR: boş bir alanı
 * herhangi bir kovaya koymak, olmayan bir veriden sonuç üretmek olurdu.
 */
export const buildEffortDistribution = (workouts = [], {
  today = new Date(),
  days = 28,
  customExercises = [],
} = {}) => {
  const bugun = toLocalDate(dayKey(today));
  const sinir = bugun ? new Date(bugun) : null;
  if (sinir) sinir.setDate(bugun.getDate() - days);

  const sayac = Object.fromEntries(RIR_BUCKETS.map(b => [b.key, 0]));
  const kasBazli = new Map();
  let toplam = 0;
  let rirsiz = 0;

  (workouts || []).forEach(w => {
    const d = toLocalDate(w?.date);
    if (!d || (sinir && d < sinir)) return;
    (w.exercises || []).forEach(ex => {
      const { muscle } = detectMuscleGroup(ex?.name, customExercises);
      (ex?.sets || []).forEach(set => {
        if (!isWorkingSet(set)) return;
        if (!(parseNumber(set.reps) > 0)) return;
        if (set.rir === '' || set.rir === null || set.rir === undefined) { rirsiz += 1; return; }
        const kova = bucketOf(parseNumber(set.rir));
        if (!kova) return;
        sayac[kova.key] += 1;
        toplam += 1;
        if (muscle) {
          const kayit = kasBazli.get(muscle) || { muscle, total: 0, failure: 0, easy: 0 };
          kayit.total += 1;
          if (kova.key === 'failure') kayit.failure += 1;
          if (kova.key === 'easy') kayit.easy += 1;
          kasBazli.set(muscle, kayit);
        }
      });
    });
  });

  const buckets = RIR_BUCKETS.map(b => ({
    ...b,
    count: sayac[b.key],
    share: toplam > 0 ? Math.round((sayac[b.key] / toplam) * 100) : 0,
  }));

  const findings = [];
  const pay = (key) => (toplam > 0 ? sayac[key] / toplam : 0);

  if (toplam >= MIN_SETS) {
    if (pay('failure') > FAILURE_HEAVY) {
      findings.push({
        key: 'tooHard', severity: 'warn',
        title: `Setlerin %${Math.round(pay('failure') * 100)}'i başarısızlığa kadar`,
        detail: 'Her seti sonuna kadar götürmek, aynı hacmi RIR 1-2\'de yapmaya göre belirgin daha fazla yorgunluk bırakıyor ve seansın kalan setlerinin kalitesini düşürüyor. Başarısızlığı hareketin son setine saklamak, toplam uyaranı düşürmeden yorgunluğu azaltıyor.',
      });
    }
    if (pay('easy') > EASY_HEAVY) {
      findings.push({
        key: 'tooEasy', severity: 'warn',
        title: `Setlerin %${Math.round(pay('easy') * 100)}'i RIR 4 ve üstü`,
        detail: 'Bu setler büyüme eşiğinin altında ve hacim hesabına girmiyorlar. "16 set yaptım" ile "16 etkili set yaptım" arasındaki fark burada oluşuyor; setleri bir iki tekrar daha zorlamak, set eklemeden hacmi artırıyor.',
      });
    }
    const verimli = pay('hard') + pay('moderate');
    if (verimli < PRODUCTIVE_TARGET && findings.length === 0) {
      findings.push({
        key: 'scattered', severity: 'info',
        title: `Verimli bant payı %${Math.round(verimli * 100)}`,
        detail: 'Setlerin çoğu RIR 1-3 bandının dışında. Hipertrofide en iyi getiriyi bu bant veriyor; uçlara dağılmış bir dağılım aynı hacimle daha az kazandırıyor.',
      });
    }
  }

  // Kas bazında uçlar: genel dağılım dengeliyken tek bir kasta bozuk olabilir.
  const byMuscle = [...kasBazli.values()]
    .filter(m => m.total >= 6)
    .map(m => ({
      ...m,
      failureShare: Math.round((m.failure / m.total) * 100),
      easyShare: Math.round((m.easy / m.total) * 100),
    }))
    .sort((a, b) => (b.failureShare + b.easyShare) - (a.failureShare + a.easyShare))
    .slice(0, 4);

  return {
    buckets,
    total: toplam,
    withoutRir: rirsiz,
    findings,
    byMuscle,
    days,
    hasData: toplam >= MIN_SETS,
    // Yeterli veri yoksa bunu söylemek de bilgi: kullanıcı kartın neden boş
    // olduğunu bilmeli.
    needed: MIN_SETS,
  };
};

/** Şiddet dağılımının günlük koç satırı. */
export const effortCoachItem = (report) => {
  if (!report?.hasData) return null;
  const uyari = report.findings.find(f => f.severity === 'warn');
  if (!uyari) return null;
  return { key: 'effort', title: uyari.title, detail: uyari.detail };
};
