import { parseNumber } from './number.js';
import { dayKey, toLocalDate, formatDay } from './dates.js';

/**
 * Koç karar defteri.
 *
 * Koç her gün tavsiye veriyordu ama hiçbiri geri dönüp KONTROL EDİLMİYORDU.
 * Kullanıcı "göğüse iki set ekle" tavsiyesini uyguluyor, üç hafta geçiyor ve
 * ne olduğunu kimse bilmiyor. Bu, koçu yanlış olamayan bir şeye çeviriyordu:
 * yanlış olamayan bir tavsiye, doğru da olamaz.
 *
 * Defter tavsiyeyi iki ayrı ölçüyle takip ediyor ve ikisini karıştırmıyor:
 *
 *  UYGULAMA — tavsiye edilen şey gerçekten yapıldı mı. Hacim eklenecekti,
 *             eklendi mi. Bu bir sonuç değil, sonucun ön koşulu.
 *  SONUÇ    — asıl bakılan şey: o kasın ya da hareketin tahmini 1RM'i ne oldu.
 *
 * Ayrı tutulmalarının sebebi şu: uygulanmamış bir tavsiye BAŞARISIZ değildir,
 * sadece denenmemiştir. İkisini tek sayıya katmak koçun isabet oranını
 * kullanıcının uygulamadığı tavsiyelerle aşağı çekerdi — ve o oran artık
 * hiçbir şey ölçmezdi.
 *
 * Ölçüm penceresi üç hafta: daha kısası antrenman gürültüsünü sonuç sanmak,
 * daha uzunu tavsiyenin etkisini araya giren on başka değişikliğe karıştırmak.
 */

// Tavsiye bu kadar gün sonra ölçülüyor.
export const LEDGER_REVIEW_DAYS = 21;
// Defter bu uzunlukta tutuluyor; eskiler düşüyor. Ayarların içinde duran bir
// koleksiyon sınırsız büyüyemez.
export const MAX_LEDGER_ENTRIES = 60;
// Sonucu "değişti" saymak için gereken en küçük yüzde. Tahmini 1RM'de %2'nin
// altı ölçüm hatası kadar; onu başarı diye yazmak defteri değersizleştirir.
const RESULT_THRESHOLD = 2;

export const LEDGER_VERDICTS = {
  worked: { key: 'worked', label: 'İşe yaradı', tone: 'good' },
  flat: { key: 'flat', label: 'Fark etmedi', tone: 'info' },
  backfired: { key: 'backfired', label: 'Ters gitti', tone: 'warn' },
  'not-applied': { key: 'not-applied', label: 'Uygulanmadı', tone: 'muted' },
};

/**
 * Koç maddesi → hangi ölçüyle takip edileceği.
 *
 * Her tavsiye ölçülebilir değil. "Uyku puanını gir" tavsiyesinin 1RM karşılığı
 * yok ve olmadığı halde bir sayı uydurmak defterin tamamına olan güveni
 * bitirirdi. Ölçülemeyenler de deftere giriyor ama isabet oranına sayılmıyor.
 */
export const LEDGER_PLANS = {
  volume: ['volume', 'weak-link', 'frequency', 'frequency-plan', 'no-week', 'selection', 'mesocycle', 'muscle-scorecard'],
  progress: ['plateau', 'plateau-decline', 'rotation', 'order', 'exercise-order', 'pr-watch', 'standards', 'technique-overuse', 'rir', 'effort', 'exercise-roi', 'response-profile'],
  sessions: ['consistency', 'deload-return', 'coach-protocol'],
  recovery: ['deload', 'deload-running', 'acwr', 'readiness-low', 'sleep', 'resting-hr', 'form-overreach', 'form-fresh', 'block-compare'],
};

/**
 * Eşleşme TAM: önek eşleşmesi denenmişti ve sessizce yanlış sınıflandırıyordu.
 * "sleep-missing" ("uyku puanını gir") anahtarı "sleep" önekine takılıp
 * toparlanma müdahalesi sayılıyordu; bu da uygulama ölçütünü tersine çeviriyor
 * ve bir veri girişi hatırlatmasını "haftalık seansı azalttın mı" diye
 * ölçmeye kalkıyordu.
 */
const planKindFor = (key) => {
  if (!key) return 'none';
  const entry = Object.entries(LEDGER_PLANS).find(([, keys]) => keys.includes(key));
  return entry ? entry[0] : 'none';
};

/**
 * Tavsiyeyi ölçülebilir bir kayda çevirir.
 *
 * `sources` uygulamadan geliyor: modül kendi başına hacim ya da 1RM
 * hesaplamıyor. Aynı sayıyı ikinci bir yerde hesaplamak, ekranda görünenle
 * defterde yazanın ayrışması demek.
 *
 * @param sources.weeklyVolumeOf(muscle) → son tam haftanın set hacmi
 * @param sources.bestE1rmOf({ muscle, exercise }) → o kapsamdaki en iyi 1RM
 * @param sources.weeklySessions() → son dört haftanın haftalık seans ortalaması
 */
export const snapshotDecision = (item, sources = {}, { now = new Date(), id } = {}) => {
  if (!item?.key) return null;
  const kind = planKindFor(item.key);
  const muscle = item.muscle || null;
  const exercise = item.exercise || null;

  const olc = (fn, ...args) => {
    const v = parseNumber(typeof fn === 'function' ? fn(...args) : 0);
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
  };

  // Uygulama ölçüsü tavsiyenin türüne göre değişiyor; sonuç ölçüsü daima
  // tahmini 1RM, çünkü sorulan soru her zaman aynı: daha güçlü mü oldun.
  // Kas bilinmiyorsa TOPLAM haftalık hacim ölçülüyor. Tek bir kasın hacmini
  // sıfır diye kaydetmek, üç hafta sonra "değişiklik olmadı" sonucunu garanti
  // ederdi ve her tavsiye "denenmedi" damgası yerdi.
  const compliance = kind === 'sessions' || kind === 'recovery'
    ? { kind: 'sessions', label: 'haftalık seans', baseline: olc(sources.weeklySessions) }
    : {
      kind: 'volume',
      label: muscle ? 'haftalık set' : 'haftalık toplam set',
      muscle,
      baseline: olc(sources.weeklyVolumeOf, muscle),
    };

  const result = {
    kind: 'e1rm', label: 'tahmini 1RM', muscle, exercise,
    baseline: olc(sources.bestE1rmOf, { muscle, exercise }),
  };

  const bugun = toLocalDate(now) || new Date();
  const inceleme = new Date(bugun);
  inceleme.setDate(bugun.getDate() + LEDGER_REVIEW_DAYS);

  return {
    id: id || `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key: item.key,
    title: item.title || '',
    area: item.area || item.action || 'genel',
    kind,
    decidedAt: dayKey(bugun),
    // Sayısal karşılığı olmayan tavsiyeye ölçüm tarihi yazılmıyor: hiç
    // gelmeyecek bir ölçümü bekliyormuş gibi göstermek, defteri kalıcı olarak
    // "iş var" durumunda bırakırdı.
    reviewOn: kind === 'none' ? '' : dayKey(inceleme),
    decision: 'applied',
    compliance,
    result,
    outcome: null,
  };
};

/** Kararı deftere yazar. Aynı madde açık kayıttayken ikinci kez girmiyor. */
export const logDecision = (ledger = [], entry) => {
  if (!entry?.id) return Array.isArray(ledger) ? ledger : [];
  const liste = Array.isArray(ledger) ? ledger : [];
  // Aynı anahtar hâlâ ölçülmeyi bekliyorsa ikinci kayıt açmak, tek bir
  // değişikliği iki kere puanlamak olurdu.
  if (liste.some(e => e.key === entry.key && !e.outcome)) return liste;
  return [entry, ...liste].slice(0, MAX_LEDGER_ENTRIES);
};

/** Kullanıcının reddettiği tavsiye: ölçülmüyor ama sayılıyor. */
export const logRejection = (ledger = [], item, { now = new Date(), id } = {}) => {
  if (!item?.key) return Array.isArray(ledger) ? ledger : [];
  const liste = Array.isArray(ledger) ? ledger : [];
  return [{
    id: id || `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key: item.key,
    title: item.title || '',
    area: item.area || item.action || 'genel',
    kind: planKindFor(item.key),
    decidedAt: dayKey(now),
    reviewOn: '',
    decision: 'rejected',
    compliance: null,
    result: null,
    outcome: null,
  }, ...liste].slice(0, MAX_LEDGER_ENTRIES);
};

/** Ölçüm zamanı gelmiş, henüz kapatılmamış kayıtlar. */
export const dueEntries = (ledger = [], now = new Date()) => {
  const bugun = dayKey(now);
  return (Array.isArray(ledger) ? ledger : []).filter(e =>
    e?.decision === 'applied' && !e.outcome && e.kind !== 'none'
    && e.reviewOn && e.reviewOn <= bugun);
};

/**
 * Kaydı ölçüp kapatır.
 *
 * Uygulama ve sonuç ayrı değerlendiriliyor: yapılmamış bir tavsiye
 * "başarısız" değil "denenmemiş" sayılıyor.
 */
export const settleEntry = (entry, { complianceValue, resultValue }, now = new Date()) => {
  if (!entry || entry.outcome) return entry;

  const uygulamaSonrasi = parseNumber(complianceValue);
  const uygulamaOnce = parseNumber(entry.compliance?.baseline);
  const sonucSonrasi = parseNumber(resultValue);
  const sonucOnce = parseNumber(entry.result?.baseline);

  // "Uygulandı" ölçütü yönden bağımsız: koç hacmi azaltmayı da önerebiliyor.
  // Değişimin YÖNÜ değil, gerçekten bir değişiklik olup olmadığı bakılıyor —
  // hangi yönün doğru olduğuna tavsiyenin türü karar veriyor.
  const azaltma = entry.kind === 'recovery';
  const fark = uygulamaSonrasi - uygulamaOnce;
  const complianceMet = azaltma ? fark < -0.5 : fark > 0.5;

  const deltaPct = sonucOnce > 0
    ? Math.round(((sonucSonrasi - sonucOnce) / sonucOnce) * 1000) / 10
    : 0;

  let verdict;
  if (!complianceMet) verdict = 'not-applied';
  else if (deltaPct >= RESULT_THRESHOLD) verdict = 'worked';
  else if (deltaPct <= -RESULT_THRESHOLD) verdict = 'backfired';
  else verdict = 'flat';

  return {
    ...entry,
    outcome: {
      measuredOn: dayKey(now),
      complianceValue: Math.round(uygulamaSonrasi * 100) / 100,
      complianceMet,
      resultValue: Math.round(sonucSonrasi * 100) / 100,
      deltaPct,
      verdict,
    },
  };
};

/** Defterin tamamını tek geçişte ölçer. */
export const settleDue = (ledger = [], measure, now = new Date()) => {
  const due = dueEntries(ledger, now);
  if (due.length === 0) return { ledger: Array.isArray(ledger) ? ledger : [], settled: 0 };
  const kapali = new Set(due.map(e => e.id));
  return {
    ledger: ledger.map(e => (kapali.has(e.id) ? settleEntry(e, measure(e) || {}, now) : e)),
    settled: due.length,
  };
};

/**
 * Koçun kendi karnesi.
 *
 * `hitRate` yalnızca UYGULANMIŞ tavsiyeler üzerinden hesaplanıyor. Denenmemiş
 * bir tavsiyeyi başarısızlığa yazmak, oranı kullanıcının davranışının ölçüsü
 * yapardı — oysa ölçülmek istenen koçun kendisi.
 */
export const ledgerStats = (ledger = []) => {
  const liste = (Array.isArray(ledger) ? ledger : []).filter(e => e?.id);
  const kapali = liste.filter(e => e.outcome);
  const denenen = kapali.filter(e => e.outcome.complianceMet);
  const isabet = denenen.filter(e => e.outcome.verdict === 'worked');
  const ters = denenen.filter(e => e.outcome.verdict === 'backfired');

  const alanlar = new Map();
  denenen.forEach(e => {
    const kayit = alanlar.get(e.area) || { area: e.area, tested: 0, worked: 0 };
    kayit.tested += 1;
    if (e.outcome.verdict === 'worked') kayit.worked += 1;
    alanlar.set(e.area, kayit);
  });

  return {
    logged: liste.length,
    applied: liste.filter(e => e.decision === 'applied').length,
    rejected: liste.filter(e => e.decision === 'rejected').length,
    settled: kapali.length,
    tested: denenen.length,
    worked: isabet.length,
    backfired: ters.length,
    flat: denenen.length - isabet.length - ters.length,
    notApplied: kapali.length - denenen.length,
    // Beş ölçümün altında oran yazmak yanıltıcı: iki denemenin biri tutunca
    // "%50 isabet" çıkıyor ve bu bir bilgi değil.
    hitRate: denenen.length >= 5 ? Math.round((isabet.length / denenen.length) * 100) : null,
    byArea: [...alanlar.values()].sort((a, b) => b.tested - a.tested),
    open: liste.filter(e => e.decision === 'applied' && !e.outcome && e.kind !== 'none').length,
    // Uygulandı ama ölçülemeyecek olanlar ayrı sayılıyor: "uyku puanını gir"
    // tavsiyesinin 1RM karşılığı yok ve olmadığı halde bir sayı uydurmak
    // defterin tamamına olan güveni bitirirdi.
    unmeasurable: liste.filter(e => e.decision === 'applied' && e.kind === 'none').length,
  };
};

/** Deftere göre bir kasa/harekete dair geçmiş deneme özeti. */
export const historyFor = (ledger = [], { muscle = null, exercise = null } = {}) =>
  (Array.isArray(ledger) ? ledger : []).filter(e =>
    e?.outcome && ((muscle && e.result?.muscle === muscle) || (exercise && e.result?.exercise === exercise)));

/** İnsan okunur satır. */
export const describeEntry = (entry) => {
  if (!entry) return '';
  const tarih = formatDay(entry.decidedAt);
  if (entry.decision === 'rejected') return `${tarih} · uygulanmadı (reddedildi)`;
  if (!entry.outcome) {
    return `${tarih} · ${entry.reviewOn ? `${formatDay(entry.reviewOn)} tarihinde ölçülecek` : 'ölçüm planlanmadı'}`;
  }
  const o = entry.outcome;
  if (!o.complianceMet) {
    return `${tarih} · değişiklik kayıtlara yansımadı, bu yüzden ölçülemedi`;
  }
  const yon = o.deltaPct > 0 ? '+' : '';
  return `${tarih} · ${entry.compliance.baseline} → ${o.complianceValue} ${entry.compliance.label}, sonuç ${yon}%${o.deltaPct}`;
};

/** Koç kartı: ölçüm zamanı gelmiş kayıtlar ya da karne. */
export const ledgerCoachItem = (stats, due = []) => {
  if (due.length > 0) {
    return {
      key: 'coach-ledger',
      tone: 'info',
      title: `${due.length} tavsiyenin sonucu ölçülmeyi bekliyor`,
      detail: `Üç hafta önce uyguladığın ${due.length} tavsiyenin ne işe yaradığı şimdi ölçülebilir. Defteri açtığında kendiliğinden hesaplanıyor: hangisi işe yaradı, hangisi fark etmedi.`,
    };
  }
  if (stats?.hitRate === null || !stats?.hitRate) return null;
  // Karne yalnızca dikkat çekecek kadar iyi ya da kötüyse gösteriliyor.
  if (stats.hitRate >= 40 && stats.hitRate <= 75) return null;
  return {
    key: 'coach-ledger',
    tone: stats.hitRate > 75 ? 'good' : 'warn',
    title: `Uyguladığın tavsiyelerin %${stats.hitRate}'i işe yaradı`,
    detail: stats.hitRate > 75
      ? `${stats.tested} ölçülmüş tavsiyeden ${stats.worked} tanesi ölçülebilir bir ilerleme getirdi. Bu oran koçun değil senin de karnen: tavsiyeleri uyguluyorsun.`
      : `${stats.tested} ölçülmüş tavsiyeden yalnızca ${stats.worked} tanesi ilerleme getirdi. Bu, tavsiyelerin yanlış olduğu anlamına gelmiyor ama üç haftalık pencerede ölçülebilir bir fark üretmiyorlar — daha büyük değişiklikler denemek gerekebilir.`,
  };
};
