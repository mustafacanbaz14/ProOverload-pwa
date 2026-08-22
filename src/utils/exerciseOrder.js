import { detectMuscleGroup } from './helpers.js';
import { lengthBias } from './selectionAudit.js';

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
