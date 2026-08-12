import { parseNumber } from './number.js';
import { DEFAULT_EXERCISES } from './constants.js';
import { detectMuscleGroup } from './helpers.js';

/**
 * Hareket seçimi denetimi.
 *
 * Uygulama "kaç set" sorusunu her açıdan yanıtlıyordu (MEV/MAV/MRV, sıklık,
 * blok planı) ama "hangi hareket" sorusuna hiç bakmıyordu. Oysa aynı 16 set
 * iki farklı hareket seçimiyle çok farklı sonuç verir: tek bir hareketten
 * gelen 16 set, ya da kasın hiç gerilmediği 16 set, hacim tablosunda kusursuz
 * görünürken uyaranın bir kısmını boşa harcar.
 *
 * Üç şeye bakılıyor:
 *
 *  1. GERİLMEDE YÜKLENME. Kas uzun boydayken yüklendiğinde büyüme uyaranının
 *     daha güçlü olduğu literatürde tekrar tekrar görülüyor. Bir kasın haftalık
 *     hacminin tamamı tepe kasılma hareketlerinden geliyorsa bu uyaran eksik.
 *  2. TEK HAREKETE BAĞIMLILIK. Hacmin ezici çoğunluğu tek hareketten geliyorsa
 *     o hareketin yüklediği lif bölgesi ve eklem açısı dışında kalan her yer
 *     az uyarılıyor; ayrıca hareket bir sebeple yapılamadığında o kasın haftası
 *     tamamen çöküyor.
 *  3. YALNIZCA DOLAYLI HACİM. Kas hiçbir harekette hedef değil, hepsinde yan
 *     katkı olarak sayılıyorsa hacim tablosu "yeterli" derken kas doğrudan
 *     çalışılmamış oluyor.
 *
 * Modül hacmi DEĞERLENDİRMEZ — o iş weekPlan'ın. Buradaki bulgular hacim doğru
 * olduğunda bile geçerli; ikisi birbirinin yerine geçmiyor.
 */

/**
 * Hareketin hedef kası hangi kas boyunda yüklediği.
 *
 * Sıra önemli: ilk eşleşen kural kazanır. Özel adlar (örn. "Cable Rear Delt
 * Fly") genel kalıplardan (örn. `/fly/`) ÖNCE gelmeli, yoksa yanlış sınıfa
 * düşerler. Eşleşmeyen her hareket 'mid' sayılır — orta açıklıkta yüklenen
 * bileşke hareketlerin çoğu buraya düşer ve bu bir kusur değil.
 */
export const LENGTH_BIAS_RULES = [
  // --- gerilmede yüklenen, genel kalıptan önce gelmesi gereken özel adlar ---
  // Kabloda kol gövdenin önünden geçerken arka deltoid gergin kalır; makine ve
  // dambıl varyantlarında aynı noktada yük düşer.
  { bias: 'stretch', re: /cable rear delt fly|reverse cable fly/i },
  // Baldır kaldırışları leg press kuralından önce: "Leg Press Calf Raise".
  { bias: 'stretch', re: /calf raise/i },
  // Karın: asılı ve tekerlek hareketlerinde gövde açılırken karın gergin yüklenir.
  { bias: 'stretch', re: /ab wheel|hanging (knee|leg|oblique) raise|dragon flag|toes to bar|decline sit-?up/i },

  // --- kısalmada yüklenen (tepe kasılma) ---
  { bias: 'short', re: /crossover|squeeze press|hex press|fly \(high to low\)/i },
  { bias: 'short', re: /shrug/i },
  { bias: 'short', re: /leg extension/i },
  // Kalça açıkken hamstring diz tarafında kısalır; oturarak yapılan varyant ayrı.
  { bias: 'short', re: /(lying|standing|kneeling|slider) leg curl/i },
  { bias: 'short', re: /hip thrust|glute bridge|frog pump|kickback|abduction|adduction|lateral walk/i },
  { bias: 'short', re: /pushdown|tate press/i },
  { bias: 'short', re: /concentration curl|drag curl|waiter curl|curl 21s/i },
  { bias: 'short', re: /reverse pec deck|machine reverse fly|rear delt fly|bent over lateral raise|face pull|y-raise|powell raise|cuban press/i },
  { bias: 'short', re: /crunch|sit-?up|russian twist|bicycle|dead bug|hollow|plank|pallof|side bend|v-ups|woodchopper|l-sit|stir the pot/i },
  { bias: 'short', re: /superman|bird dog|reverse hyperextension/i },

  // --- gerilmede yüklenen ---
  { bias: 'stretch', re: /\bfly\b/i },
  { bias: 'stretch', re: /pullover|lat prayer|straight arm pulldown/i },
  { bias: 'stretch', re: /pulldown|pull-?up|chin-?up/i },
  { bias: 'stretch', re: /chest supported|seal row/i },
  // "Leaning Cable Lateral Raise" gibi araya kelime giren adlar için sıralı
  // eşleşme gerekiyor; bitişik kalıp (`leaning lateral raise`) bunları kaçırır.
  // Kabloda kol gövdenin arkasındayken yan deltoid gergin yüklenir.
  { bias: 'stretch', re: /(incline|leaning|lu|cable)\b.*lateral raise|lateral raise \(cable\)/i },
  // Yan omuzdaki gibi araya kelime giren adlar var: "Incline Dumbbell Curl",
  // "Bayesian Cable Curl". Bitişik kalıp ikisini de kaçırıyordu ve bu, biseps
  // gerilme adaylarının hepsini eleyen sessiz bir hataydı.
  { bias: 'stretch', re: /(incline|bayesian|overhead cable|preacher)\b.*curl/i },
  { bias: 'stretch', re: /overhead (tricep )?extension|french press|skull ?crusher|lying dumbbell extension|cable overhead/i },
  { bias: 'stretch', re: /sissy|hack squat|pendulum|heels elevated|cyclist squat|front squat|pause squat|deficit|split squat|step down|leg press/i },
  { bias: 'stretch', re: /romanian deadlift|\brdl\b|good morning|seated leg curl|nordic|glute ham raise/i },
  { bias: 'stretch', re: /jefferson curl|rack pull|conventional deadlift|sumo deadlift/i },
  { bias: 'stretch', re: /dumbbell (bench|incline|decline) press|(incline|decline) dumbbell press|\bdips?\b|guillotine/i },
];

export const LENGTH_BIAS_LABEL = {
  stretch: 'Gerilmede',
  short: 'Kısalmada',
  mid: 'Orta açıklık',
};

/** Bir hareketin kas boyu profili: 'stretch' | 'short' | 'mid'. */
export const lengthBias = (exerciseName = '') => {
  const ad = String(exerciseName);
  const kural = LENGTH_BIAS_RULES.find(r => r.re.test(ad));
  return kural ? kural.bias : 'mid';
};

// Tek hareketin haftalık hacmin bu kadarını taşıması "bağımlılık" sayılır.
// %70 bilinçli olarak yüksek: iki hareketli bir program (10 + 4 set) uyarı
// almamalı, asıl hedef 14 setin 12'sini tek harekete yıkan program.
const SINGLE_SOURCE_RATIO = 0.7;

// Bu hacmin altındaki kaslar denetlenmiyor. Zaten hacmi düşük bir kasta
// "hareket çeşitliliği" tartışmak sırayı şaşırtmak olur; önce hacim gelir.
const MIN_AUDIT_VOLUME = 4;

/**
 * "Gerilmede yükleme yok" uyarısının çalışmadığı kaslar.
 *
 * Bu üç kasın doğrudan çalıştırıldığı hareketlerin hepsi kısalmada yüklüyor ve
 * bunun ayrı bir karşılığı yok: trapez shrug'ın tepesinde, ön deltoid baş üstü
 * basışın kilitlenmesinde, önkol bilek bükücünün üstünde çalışıyor. Katkı
 * ölçütüyle öneri üretilebiliyor (deadlift trapeze, dambıl basış ön deltoide)
 * ama bunlar "gerilme eksiğini kapatmak için" seçilecek hareketler değil;
 * uyarı, karşılığı olmayan bir eksik bildirmiş olurdu.
 */
const STRETCH_EXEMPT = new Set(['Trapez', 'Ön Omuz', 'Önkol']);

/**
 * Bir kas için gerilmede yükleyen aday hareketler.
 *
 * Liste türetiliyor, elle yazılmıyor: kütüphaneye yeni hareket eklendiğinde
 * öneriler kendiliğinden güncelleniyor ve iki yerin ayrışma ihtimali kalkıyor.
 *
 * Ölçüt "birincil kas" değil, "belirgin katkı" (≥ 0.5). Kalça bunu zorunlu
 * kılıyor: Bulgarian split squat ya da RDL kalçayı gerilmede fena halde
 * yüklüyor ama ikisinin de birincil kası başka. Birincil şartı konsaydı kalçaya
 * verilecek tek öneri sumo deadlift olurdu.
 */
export const stretchOptionsFor = (muscle, { customExercises = [], exclude = [] } = {}) => {
  const disarida = new Set(exclude);
  const havuz = [...DEFAULT_EXERCISES, ...customExercises.map(e => e?.name).filter(Boolean)];
  return havuz.filter(ad => {
    if (disarida.has(ad) || lengthBias(ad) !== 'stretch') return false;
    const { muscle: birincil, contributions } = detectMuscleGroup(ad, customExercises);
    return birincil === muscle || parseNumber(contributions?.[muscle]) >= 0.5;
  });
};

/**
 * Haftalık plandaki hareket seçimini denetler.
 *
 * `statuses`, computeWeekPlan'ın kas kas çıktısı; her satırda o kasa katkı
 * veren hareketlerin dökümü (`sources`) var. Denetim tamamen bu dökümden
 * yürüyor, ayrı bir hesap yapmıyor — hacim tablosuyla aynı sayılara bakması
 * için.
 */
export const auditExerciseSelection = (statuses = [], { customExercises = [] } = {}) => {
  const findings = [];

  statuses.forEach(s => {
    const hacim = parseNumber(s?.volume);
    if (!(hacim >= MIN_AUDIT_VOLUME)) return;

    const kaynaklar = Array.isArray(s.sources) ? s.sources : [];
    if (kaynaklar.length === 0) return;

    // Aynı hareket birden fazla güne dağılmış olabilir; hareket adında toplanır.
    const harekete = new Map();
    kaynaklar.forEach(k => {
      const onceki = harekete.get(k.name);
      if (onceki) onceki.volume += parseNumber(k.volume);
      else harekete.set(k.name, { name: k.name, volume: parseNumber(k.volume), dayLabel: k.dayLabel });
    });
    const hareketler = [...harekete.values()]
      .map(h => ({ ...h, bias: lengthBias(h.name), primary: detectMuscleGroup(h.name, customExercises).muscle === s.muscle }))
      .sort((a, b) => b.volume - a.volume);

    const issues = [];
    const gerilmeHacmi = hareketler.filter(h => h.bias === 'stretch').reduce((t, h) => t + h.volume, 0);
    const dogrudan = hareketler.filter(h => h.primary);

    if (dogrudan.length === 0) {
      issues.push({
        key: 'indirectOnly',
        severity: 'high',
        title: 'Yalnızca dolaylı hacim',
        detail: `${s.muscle} hiçbir harekette hedef kas değil; ${Math.round(hacim)} setin tamamı yan katkı olarak birikiyor. Hacim tablosu yeterli görünse de bu kas doğrudan çalışılmıyor.`,
      });
    }

    if (gerilmeHacmi === 0 && !STRETCH_EXEMPT.has(s.muscle)) {
      issues.push({
        key: 'noStretch',
        severity: 'medium',
        title: 'Gerilmede yükleme yok',
        detail: `Bu kasın ${Math.round(hacim)} setinin hiçbiri kasın uzun boyda yüklendiği bir hareketten gelmiyor. Gerilmede yüklenen hareketler büyüme uyaranını artırdığı için haftalık hacmin bir kısmını oraya kaydırmak, set eklemeden kazanç sağlar.`,
      });
    }

    const en = hareketler[0];
    const pay = hacim > 0 ? en.volume / hacim : 0;
    if (hareketler.length > 1 && pay >= SINGLE_SOURCE_RATIO) {
      issues.push({
        key: 'single',
        severity: 'low',
        title: 'Tek harekete bağımlı',
        detail: `Hacmin %${Math.round(pay * 100)}'i ${en.name} hareketinden geliyor. Tek bir eklem açısı ve yük eğrisi baskın kalıyor; ayrıca o hareket yapılamadığında kasın haftası boşa düşüyor.`,
      });
    } else if (hareketler.length === 1) {
      issues.push({
        key: 'single',
        severity: 'low',
        title: 'Tek hareketle çalışılıyor',
        detail: `${Math.round(hacim)} setin tamamı ${en.name} hareketinden geliyor. İkinci bir hareket farklı bir eklem açısı ve yük eğrisi ekler.`,
      });
    }

    if (issues.length === 0) return;

    const gerilmeOnerisi = issues.some(i => i.key === 'noStretch' || i.key === 'indirectOnly')
      ? stretchOptionsFor(s.muscle, { customExercises, exclude: hareketler.map(h => h.name) }).slice(0, 3)
      : [];

    findings.push({
      muscle: s.muscle,
      volume: Math.round(hacim * 4) / 4,
      exercises: hareketler,
      stretchVolume: Math.round(gerilmeHacmi * 4) / 4,
      issues,
      suggestions: gerilmeOnerisi,
    });
  });

  const agirlik = { high: 3, medium: 2, low: 1 };
  const puan = (f) => Math.max(...f.issues.map(i => agirlik[i.severity] || 0));
  findings.sort((a, b) => puan(b) - puan(a) || b.volume - a.volume);

  // Denetlenen kas sayısı: bulgusu olmayanlar da sayılmalı, yoksa "3 kasta
  // sorun var" ifadesi kaç kastan üçü olduğunu söylemiyor.
  const denetlenen = statuses.filter(s => parseNumber(s?.volume) >= MIN_AUDIT_VOLUME).length;

  return {
    findings,
    audited: denetlenen,
    clean: denetlenen > 0 && findings.length === 0,
    hasData: denetlenen > 0,
  };
};

/** Denetimin günlük koç satırı. */
export const selectionCoachItem = (report) => {
  if (!report?.hasData || report.findings.length === 0) return null;
  const ilk = report.findings[0];
  const konu = ilk.issues[0];
  return {
    muscle: ilk.muscle,
    title: `${ilk.muscle}: ${konu.title.toLowerCase()}`,
    detail: konu.detail,
  };
};
