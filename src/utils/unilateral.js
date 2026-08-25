import { parseNumber } from './number.js';
import { isWorkingSet, estimate1RM } from './helpers.js';

/**
 * Tek taraflı hareketlerde sol/sağ takibi.
 *
 * Tek kol ve tek bacak hareketleri kayda TEK bir set olarak giriyordu: "Single
 * Arm Lat Pulldown 30 kg × 12". Ama o set aslında iki farklı performans —
 * kullanıcı sol tarafta 10, sağda 12 tekrar yapmış olabilir ve uygulama
 * ikisini de göremiyor. Asimetri hipertrofide ve sakatlık riskinde gerçek bir
 * konu; kuvvet dengesi analizi (`strengthBalance`) kaslar ARASI dengeye
 * bakıyor, bu ise aynı hareketin iki tarafına.
 *
 * Tasarım kararı: ayrı bir "set tipi" AÇILMADI. Set üzerinde isteğe bağlı bir
 * `side` alanı var ('left' | 'right'); yazılmayan setler eskisi gibi tek
 * kayıt olarak duruyor. Böylece geçmiş bozulmuyor ve tek taraflı takip
 * isteyen kullanıcı yalnızca istediği harekette kullanıyor.
 */

export const SIDES = [
  { key: 'left', label: 'Sol', short: 'S' },
  { key: 'right', label: 'Sağ', short: 'D' },
];

export const SIDE_KEYS = SIDES.map(s => s.key);

/** Hareket adı tek taraflı çalışmayı çağrıştırıyor mu. */
const UNILATERAL_PATTERNS = [
  /single[ -]?arm/i, /one[ -]?arm/i, /single[ -]?leg/i, /one[ -]?leg/i,
  /unilateral/i, /bulgarian/i, /split squat/i, /lunge/i, /step[ -]?up/i,
  /pistol/i, /concentration curl/i, /tek kol/i, /tek bacak/i,
];

export const isUnilateralName = (name) =>
  UNILATERAL_PATTERNS.some(p => p.test(String(name || '')));

/**
 * Bir hareketin taraf bazında özeti.
 *
 * Yalnızca TARAF YAZILMIŞ setler değerlendiriliyor. Taraf yazılmamış setler
 * "iki tarafı da kapsıyor" varsayılmıyor — böyle bir varsayım, tek taraflı
 * takibe yeni geçen kullanıcının eski kayıtlarını yanlış bir dengeye
 * dönüştürürdü.
 */
export const sideSummary = (sets = []) => {
  const taraflar = { left: [], right: [] };
  (sets || []).forEach(s => {
    if (!isWorkingSet(s) || !SIDE_KEYS.includes(s?.side)) return;
    if (parseNumber(s.reps) <= 0) return;
    taraflar[s.side].push(s);
  });

  const ozet = (liste) => {
    if (liste.length === 0) return null;
    const tonaj = liste.reduce((t, s) => t + parseNumber(s.weight) * parseNumber(s.reps), 0);
    const enIyi = liste.reduce((best, s) => (
      estimate1RM(s.weight, s.reps, s.rir) > estimate1RM(best.weight, best.reps, best.rir) ? s : best));
    return {
      sets: liste.length,
      reps: liste.reduce((t, s) => t + parseNumber(s.reps), 0),
      tonnage: Math.round(tonaj),
      topWeight: Math.max(...liste.map(s => parseNumber(s.weight))),
      e1rm: estimate1RM(enIyi.weight, enIyi.reps, enIyi.rir) || null,
    };
  };

  const sol = ozet(taraflar.left);
  const sag = ozet(taraflar.right);
  if (!sol || !sag) return { hasBoth: false, left: sol, right: sag };

  // Fark, güçlü tarafa oranla. Tonaj kullanılıyor çünkü hem yükü hem tekrarı
  // içeriyor; tek başına ağırlık tekrar farkını görmezden gelirdi.
  const buyuk = Math.max(sol.tonnage, sag.tonnage);
  const kucuk = Math.min(sol.tonnage, sag.tonnage);
  const fark = buyuk > 0 ? Math.round(((buyuk - kucuk) / buyuk) * 1000) / 10 : 0;

  return {
    hasBoth: true,
    left: sol,
    right: sag,
    stronger: sol.tonnage === sag.tonnage ? null : (sol.tonnage > sag.tonnage ? 'left' : 'right'),
    gapPercent: fark,
  };
};

// Bu oranın altındaki fark ölçüm gürültüsü: aynı kişi aynı gün iki tarafta
// bir tekrar fark yapabiliyor ve buna asimetri demek yanlış alarm olurdu.
const MEANINGFUL_GAP = 10;

/**
 * Geçmişteki tek taraflı hareketlerin denge taraması.
 *
 * Tek seansın farkı bir şey söylemiyor; birkaç seansta AYNI YÖNDE tekrarlanan
 * fark söylüyor. O yüzden ölçüt seans ortalaması değil, tutarlılık.
 */
export const scanSideBalance = (workouts = [], { sessions = 8, limit = 5 } = {}) => {
  const harita = new Map();

  [...(workouts || [])]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, sessions)
    .forEach(w => {
      (w.exercises || []).forEach(ex => {
        const ozet = sideSummary(ex.sets);
        if (!ozet.hasBoth) return;
        if (!harita.has(ex.name)) harita.set(ex.name, []);
        harita.get(ex.name).push({ date: w.date, ...ozet });
      });
    });

  const items = [...harita.entries()]
    .map(([name, kayitlar]) => {
      const anlamli = kayitlar.filter(k => k.gapPercent >= MEANINGFUL_GAP && k.stronger);
      // Aynı yönde tekrarlanıyor mu.
      const solGuclu = anlamli.filter(k => k.stronger === 'left').length;
      const sagGuclu = anlamli.filter(k => k.stronger === 'right').length;
      const baskin = solGuclu > sagGuclu ? 'left' : sagGuclu > solGuclu ? 'right' : null;
      const tutarli = baskin ? Math.max(solGuclu, sagGuclu) : 0;
      return {
        name,
        sessions: kayitlar.length,
        flaggedSessions: anlamli.length,
        consistentSessions: tutarli,
        stronger: baskin,
        averageGap: anlamli.length > 0
          ? Math.round((anlamli.reduce((t, k) => t + k.gapPercent, 0) / anlamli.length) * 10) / 10
          : 0,
        // En az iki seansta aynı yönde fark: rastlantı değil örüntü.
        persistent: tutarli >= 2,
      };
    })
    .filter(x => x.persistent)
    .sort((a, b) => b.averageGap - a.averageGap);

  return {
    items: items.slice(0, limit),
    total: items.length,
    hasData: items.length > 0,
    threshold: MEANINGFUL_GAP,
  };
};

/** Koç kartı için tek satır. */
export const sideBalanceCoachItem = (report) => {
  if (!report?.hasData) return null;
  const ilk = report.items[0];
  const zayif = ilk.stronger === 'left' ? 'sağ' : 'sol';
  return {
    key: 'side-balance',
    tone: 'info',
    title: `${ilk.name}: ${zayif} taraf %${ilk.averageGap} geride`,
    detail: `Son ${ilk.sessions} kaydın ${ilk.consistentSessions} tanesinde aynı yönde fark var, yani bu rastlantı değil bir örüntü. Zayıf tarafı ÖNCE çalışmak ve güçlü tarafta onun yaptığı tekrar sayısıyla yetinmek, farkı birkaç blok içinde kapatan en basit yöntem. Fark %${report.threshold} altındaysa uygulama sessiz kalıyor — o kadarı ölçüm gürültüsü.`
      + (report.total > 1 ? ` Toplam ${report.total} harekette süren fark var.` : ''),
  };
};
