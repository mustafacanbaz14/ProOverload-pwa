import { parseNumber } from './number.js';
import { isWorkingSet } from './helpers.js';

/**
 * Yoğunluk teknikleri: ne zaman, nasıl ve hacme nasıl sayılıyor.
 *
 * Uygulamada drop, rest-pause ve tükeniş set tipleri vardı ama yalnızca birer
 * ETİKETTİ: rozet gösteriliyor, dinlenme süresi kısalıyor, hepsi bu. Nasıl
 * uygulanacağı, ne sıklıkta kullanılacağı ve hacme nasıl sayıldığı hiçbir
 * yerde yazmıyordu. Etiketi bilip tekniği bilmemek, tekniği yanlış uygulamanın
 * en kısa yolu.
 *
 * Hacim sayımı önemli: bir drop set üç ayrı düşüşten oluşsa bile TEK bir
 * uyaran; üç set gibi saymak haftalık hacmi olduğundan yüksek gösterir ve
 * MRV hesabını bozar. Uygulama bunları zaten tek set sayıyor — burada bu
 * kararın gerekçesi de yazılı.
 */

export const TECHNIQUE_GUIDE = {
  normal: {
    key: 'normal',
    label: 'Normal Set',
    when: 'Hacmin çoğunluğu',
    how: 'Hedef tekrar aralığında, tükenişe 1-3 tekrar kala bitir. Hipertrofinin ana yakıtı bu setler; gerisi çeşni.',
    volume: 'Bir set olarak sayılır.',
    caution: null,
  },
  warmup: {
    key: 'warmup',
    label: 'Isınma Seti',
    when: 'Her hareketin başında',
    how: 'Hedef ağırlığın %40-60\'ıyla birkaç tekrar. Amaç yorulmak değil, eklemi ve sinir sistemini o harekete hazırlamak.',
    volume: 'Hacme HİÇ sayılmaz — uyaran vermiyor, hazırlık yapıyor.',
    caution: null,
  },
  drop: {
    key: 'drop',
    label: 'Drop Set',
    when: 'Bir hareketin SON setinde',
    how: 'Tükenişe kadar git, ağırlığı hemen %20-30 azalt, dinlenmeden tekrar tükenişe git. İki düşüş yeter; üçüncüsü yorgunluk getiriyor, uyaran getirmiyor.',
    volume: 'Düşüşler ayrı set değil, TEK set sayılır. Üç düşüşü üç set saymak haftalık hacmi şişirir ve tavan hesabını bozar.',
    caution: 'Bileşke hareketlerde (çömeliş, ölü kaldırış) teknik bozulduğu için önerilmiyor; izolasyon ve makine hareketlerinde güvenli.',
  },
  rest_pause: {
    key: 'rest_pause',
    label: 'Rest-Pause',
    when: 'Zaman kısıtlıyken, son sette',
    how: 'Tükenişe git, 15-20 saniye bekle, aynı ağırlıkla tekrar tükenişe git. İki üç mini set. Kısa aralar tekniğin parçası, dinlenme değil.',
    volume: 'Mini setlerin tamamı TEK set sayılır.',
    caution: 'Yorgunluk maliyeti yüksek; hareket başına haftada bir kez yeter.',
  },
  failure: {
    key: 'failure',
    label: 'Tükeniş (Failure)',
    when: 'Seyrek — hareket başına haftada en fazla bir set',
    how: 'Tekniği bozmadan bir tekrar daha yapamayacağın noktaya kadar git.',
    volume: 'Bir set olarak sayılır.',
    caution: 'Her sette tükenişe gitmek toparlanmayı, bir sonraki setin performansını ve haftalık toplam hacmi düşürüyor. Uyaran artışı, kaybettiğin hacmi karşılamıyor.',
  },
};

export const TECHNIQUE_KEYS = Object.keys(TECHNIQUE_GUIDE);

export const techniqueInfo = (key) => TECHNIQUE_GUIDE[key] || TECHNIQUE_GUIDE.normal;

// Yoğunluk teknikleri: toplam çalışma setinin bu oranını aşarsa fazla.
// Teknikler bir baharat; hacmin kendisi olduklarında toparlanmayı yiyorlar.
const INTENSITY_SHARE_LIMIT = 0.2;
// Değerlendirme için gereken en az çalışma seti.
const MIN_SETS = 20;

/**
 * Tekniklerin ne sıklıkta kullanıldığı ve fazla kaçıp kaçmadığı.
 *
 * Uyarı eşiği bilerek yüksek: teknik kullanmak kusur değil, tekniğin hacmin
 * yerini alması kusur.
 */
export const buildTechniqueReport = (workouts = [], { sessions = 8 } = {}) => {
  const sonSeanslar = [...(workouts || [])]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, sessions);

  const sayac = Object.fromEntries(TECHNIQUE_KEYS.map(k => [k, 0]));
  let calismaSeti = 0;
  const hareketBasi = new Map();

  sonSeanslar.forEach(w => {
    (w.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(s => {
        const tip = TECHNIQUE_KEYS.includes(s?.setType) ? s.setType : 'normal';
        sayac[tip] += 1;
        if (!isWorkingSet(s) || parseNumber(s.reps) <= 0) return;
        calismaSeti += 1;
        if (tip === 'drop' || tip === 'rest_pause' || tip === 'failure') {
          hareketBasi.set(ex.name, (hareketBasi.get(ex.name) || 0) + 1);
        }
      });
    });
  });

  const yogun = sayac.drop + sayac.rest_pause + sayac.failure;
  const oran = calismaSeti > 0 ? yogun / calismaSeti : 0;

  return {
    hasData: calismaSeti >= MIN_SETS,
    sessions: sonSeanslar.length,
    workingSets: calismaSeti,
    counts: sayac,
    intensitySets: yogun,
    share: Math.round(oran * 100),
    overused: calismaSeti >= MIN_SETS && oran > INTENSITY_SHARE_LIMIT,
    limitPercent: INTENSITY_SHARE_LIMIT * 100,
    // En çok teknik uygulanan hareketler.
    topExercises: [...hareketBasi.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  };
};

/** Koç kartı: yalnızca teknikler hacmin yerini almaya başladığında konuşuyor. */
export const techniqueCoachItem = (report) => {
  if (!report?.hasData || !report.overused) return null;
  return {
    key: 'technique-overuse',
    tone: 'warn',
    title: `Çalışma setlerinin %${report.share}'i yoğunluk tekniği`,
    detail: `Son ${report.sessions} seansta ${report.workingSets} çalışma setinin ${report.intensitySets} tanesi drop, rest-pause ya da tükeniş. Bu teknikler set başına uyaranı artırıyor ama yorgunluk maliyeti çok daha hızlı artıyor: bir sonraki setin, bir sonraki seansın ve haftalık toplam hacmin altını oyuyorlar. Sağlıklı oran %${report.limitPercent} civarı — gerisi normal set olmalı.`
      + (report.topExercises.length > 0
        ? ` En yoğun kullanıldığı yer: ${report.topExercises.map(x => `${x.name} (${x.count})`).join(', ')}.`
        : ''),
  };
};
