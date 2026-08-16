import { parseNumber } from './number.js';
import { isWorkingSet, isWarmupSet } from './helpers.js';
import { formatDay } from './dates.js';

/**
 * Veri sağlığı denetimi.
 *
 * Uygulamanın bütün hesapları (1RM, hacim, ACWR, adaptif TDEE, kuvvet dengesi)
 * geçmiş kayıtlardan çıkıyor. Tek bir yanlış giriş — 100 yerine 1000 kg, 8
 * yerine 80 tekrar — bu hesapların hepsini birden bozuyor ve bozulma SESSİZ
 * oluyor: grafikte bir sıçrama görünüyor, sebebi görünmüyor.
 *
 * Bu modül kayıtları tarayıp şüpheli olanları buluyor. Şüpheli, "yanlış"
 * demek değil: 200 kg'lık bir set gerçek olabilir. Bu yüzden hiçbir kayıt
 * kendiliğinden değiştirilmiyor, yalnızca gösteriliyor ve düzeltme kullanıcıda
 * kalıyor. Tek istisna, düzeltilmesi tartışmasız olan boş kayıtlar.
 */

// Bu sınırların üstü "insan sınırında değil" değil, "yazım hatası ihtimali
// yüksek" demek. Dünya rekorları bunların altında kalıyor ama asıl amaç
// 100 -> 1000 gibi fazladan sıfırları yakalamak.
const MAX_WEIGHT_KG = 500;
const MAX_REPS = 100;
const MAX_SETS_PER_EXERCISE = 30;

export const HEALTH_SEVERITY = { high: 3, medium: 2, low: 1 };

const bulgu = (kind, severity, title, detail, extra = {}) => ({
  kind, severity, title, detail, ...extra,
});

/**
 * Antrenman kayıtlarını tarar.
 *
 * @returns { findings, counts, hasIssues, scanned }
 */
export const auditWorkoutData = (workouts = []) => {
  const findings = [];
  const tarihSayaci = new Map();
  let taranan = 0;

  (workouts || []).forEach(w => {
    if (!w?.id) return;
    taranan += 1;

    if (w.date) {
      const liste = tarihSayaci.get(w.date) || [];
      liste.push(w);
      tarihSayaci.set(w.date, liste);
    }

    const hareketler = w.exercises || [];

    // Tamamen boş antrenman: hiç hareketi yok ya da hiç seti yok.
    const toplamSet = hareketler.reduce((t, ex) => t + (ex.sets || []).length, 0);
    if (toplamSet === 0) {
      findings.push(bulgu(
        'emptyWorkout', 'medium',
        'Boş antrenman kaydı',
        'Bu kayıtta hiç set yok. Hacim ve sıklık hesaplarına "antrenman yapıldı" olarak giriyor ama içi boş; büyük ihtimalle yanlışlıkla kaydedilmiş.',
        { workoutId: w.id, date: w.date, label: w.name || 'Antrenman' }));
      return;
    }

    hareketler.forEach(ex => {
      const setler = ex?.sets || [];

      if (setler.length > MAX_SETS_PER_EXERCISE) {
        findings.push(bulgu(
          'tooManySets', 'low',
          `${ex.name}: ${setler.length} set`,
          `Tek harekette ${setler.length} set olağandışı. Kayıt çoğaltılmış olabilir.`,
          { workoutId: w.id, date: w.date, exercise: ex.name }));
      }

      setler.forEach((set, i) => {
        const agirlik = parseNumber(set?.weight);
        const tekrar = parseNumber(set?.reps);
        const calisma = isWorkingSet(set);

        if (agirlik > MAX_WEIGHT_KG) {
          findings.push(bulgu(
            'weightOutlier', 'high',
            `${ex.name}: ${agirlik} kg`,
            `${agirlik} kg büyük olasılıkla fazladan bir basamak (örn. 100 yerine 1000). Bu tek set, hareketin tahmini 1RM'ini ve tüm hacim grafiklerini bozuyor.`,
            { workoutId: w.id, date: w.date, exercise: ex.name, setIndex: i, value: agirlik }));
        }

        if (tekrar > MAX_REPS) {
          findings.push(bulgu(
            'repsOutlier', 'high',
            `${ex.name}: ${tekrar} tekrar`,
            `${tekrar} tekrar olağandışı; hacim (ağırlık × tekrar) buradan şişiyor.`,
            { workoutId: w.id, date: w.date, exercise: ex.name, setIndex: i, value: tekrar }));
        }

        // Tekrar girilmiş ama ağırlık boş: vücut ağırlıklı hareketlerde normal,
        // ağırlık isteyen bir harekette veri kaybı.
        if (calisma && tekrar > 0 && !(agirlik > 0) && !isWarmupSet(set)) {
          findings.push(bulgu(
            'zeroWeight', 'low',
            `${ex.name}: ağırlık girilmemiş`,
            'Tekrar var ama ağırlık boş. Vücut ağırlıklı bir hareketse sorun yok; değilse bu set tonaj ve 1RM hesabına girmiyor.',
            { workoutId: w.id, date: w.date, exercise: ex.name, setIndex: i }));
        }

        // Ağırlık var, tekrar yok: set hacme hiç sayılmıyor.
        if (calisma && agirlik > 0 && !(tekrar > 0)) {
          findings.push(bulgu(
            'zeroReps', 'medium',
            `${ex.name}: tekrar girilmemiş`,
            'Ağırlık var ama tekrar boş. Bu set hiçbir hacim hesabına girmiyor — yarım kalmış bir kayıt.',
            { workoutId: w.id, date: w.date, exercise: ex.name, setIndex: i }));
        }
      });
    });
  });

  // Aynı güne birden fazla kayıt: bölünmüş seans olabilir (meşru) ama
  // kopyalanmış kayıt da olabilir. Aynı gün AYNI ADLA birden fazla kayıt daha
  // güçlü bir şüphe.
  tarihSayaci.forEach((liste, tarih) => {
    if (liste.length < 2) return;
    const adlar = liste.map(w => w.name || '');
    const tekrarEdenAd = adlar.find((ad, i) => ad && adlar.indexOf(ad) !== i);
    if (!tekrarEdenAd) return;
    findings.push(bulgu(
      'duplicateDay', 'medium',
      `${formatDay(tarih, 'short', { weekday: true })}: aynı adla ${liste.length} kayıt`,
      `Aynı gün "${tekrarEdenAd}" adıyla birden fazla antrenman var. Bölünmüş bir seans olabilir; kopyalanmış bir kayıtsa o günün hacmi iki kez sayılıyor.`,
      { date: tarih, label: tekrarEdenAd }));
  });

  const sirala = (a, b) => (HEALTH_SEVERITY[b.severity] - HEALTH_SEVERITY[a.severity])
    || String(b.date || '').localeCompare(String(a.date || ''));
  findings.sort(sirala);

  const counts = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {});

  return {
    findings,
    counts,
    scanned: taranan,
    hasIssues: findings.length > 0,
    // Yüksek önemdeki bulgular hesapları gerçekten bozanlar; sayıyı ayrı
    // veriyoruz ki arayüz "3 sorun" ile "3 ciddi sorun"u karıştırmasın.
    criticalCount: findings.filter(f => f.severity === 'high').length,
  };
};

/**
 * Boş antrenman kayıtlarını siler.
 *
 * Yalnızca hiç seti olmayan kayıtlar. Diğer bulgular otomatik düzeltilmiyor:
 * 600 kg'lık bir set yanlış olabilir ama doğru da olabilir ve kullanıcının
 * verisini tahminle değiştirmek, bozuk veriden daha kötü.
 *
 * Göç gibi İDEMPOTENT: ikinci çağrıda silecek bir şey bulamaz.
 */
export const removeEmptyWorkouts = (workouts = []) => {
  const kalan = (workouts || []).filter(w => {
    const toplam = (w?.exercises || []).reduce((t, ex) => t + (ex?.sets || []).length, 0);
    return toplam > 0;
  });
  return { workouts: kalan, removed: (workouts || []).length - kalan.length };
};

/** Veri sağlığının günlük koç satırı. */
export const dataHealthCoachItem = (report) => {
  if (!report?.hasIssues || report.criticalCount === 0) return null;
  const ilk = report.findings.find(f => f.severity === 'high');
  return {
    title: `${report.criticalCount} kayıt hesapları bozuyor`,
    detail: `${ilk.title} — ${ilk.detail} Araçlar → Veri Sağlığı'ndan hepsini görebilirsin.`,
  };
};
