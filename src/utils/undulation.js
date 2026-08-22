import { normalizeRepRange } from './exerciseTargets.js';

/**
 * Dalgalı periyotlama: gün bazlı ağır / orta / hafif vurgu.
 *
 * Uygulamanın ilerleme modeli HAFTALIK: mezosiklik hacmi haftadan haftaya
 * artırıyor, ilerleme kuralı seanstan seansa yükü ayarlıyor. Ama haftanın
 * İÇİNDE bir yapı yoktu — aynı kası haftada iki kez çalışan biri iki seansı
 * da aynı tekrar aralığında yapıyordu.
 *
 * Oysa aynı kasın iki seansını farklı aralıklarda çalışmak (biri 5-8, diğeri
 * 12-15) iki şeyi birden veriyor: ağır günde mekanik gerilim, hafif günde
 * metabolik stres ve daha az eklem yükü. Toplam hacim aynı kalırken
 * toparlanma kolaylaşıyor, çünkü iki ağır seans üst üste binmiyor.
 *
 * Vurgu bir DAYATMA DEĞİL: şablona yazılan bir etiket ve o şablonun tekrar
 * aralığını kaydırıyor. İstenmezse günler "standart" kalıyor ve hiçbir şey
 * değişmiyor.
 */

export const EMPHASIS_MODES = {
  standard: {
    key: 'standard',
    label: 'Standart',
    short: 'Std',
    shift: 0,
    rirTarget: 2,
    hint: 'Hareketin kendi tekrar aralığı',
    detail: 'Gün için özel bir vurgu yok; her hareket kendi tekrar aralığında çalışılır.',
  },
  heavy: {
    key: 'heavy',
    label: 'Ağır',
    short: 'Ağır',
    // Aralığı aşağı kaydırıyor: daha az tekrar, daha çok yük.
    shift: -3,
    rirTarget: 2,
    hint: 'Daha az tekrar, daha çok yük',
    detail: 'Tekrar aralığı üç basamak aşağı kayar. Mekanik gerilim yüksek, set başına yorgunluk düşük. Bileşke hareketlerin günü; izolasyonda çok düşük tekrar tekniği bozuyor.',
  },
  moderate: {
    key: 'moderate',
    label: 'Orta',
    short: 'Orta',
    shift: 0,
    rirTarget: 2,
    hint: 'Klasik hipertrofi aralığı',
    detail: 'Hareketin kendi aralığı korunur. Hacmin çoğunluğunun geldiği yer burası.',
  },
  light: {
    key: 'light',
    label: 'Hafif',
    short: 'Hafif',
    // Yukarı kaydırıyor: daha çok tekrar, daha az eklem yükü.
    shift: 4,
    rirTarget: 1,
    hint: 'Daha çok tekrar, daha az eklem yükü',
    detail: 'Tekrar aralığı dört basamak yukarı kayar ve hedef yedek tekrar bire iner — yüksek tekrarda tükenişe yaklaşmak uyaranın şartı. Eklemler dinlenirken kas çalışmaya devam eder; ağır günün ertesinde iyi oturuyor.',
  },
};

export const EMPHASIS_KEYS = Object.keys(EMPHASIS_MODES);

export const findEmphasis = (key) => EMPHASIS_MODES[key] || EMPHASIS_MODES.standard;

/**
 * Vurguya göre kaydırılmış tekrar aralığı.
 *
 * Alt sınır 1'in, üst sınır 30'un dışına çıkmıyor ve aralık genişliği
 * korunuyor: 6-10 (genişlik 4) ağır vurguda 3-7 oluyor, 2-10 gibi anlamsız
 * biçimde genişlemiyor.
 */
export const shiftRepRange = (range, emphasisKey) => {
  const vurgu = findEmphasis(emphasisKey);
  const taban = normalizeRepRange(range?.min, range?.max);
  if (vurgu.shift === 0) return { ...taban, emphasis: vurgu.key, shifted: false };

  const genislik = taban.max - taban.min;
  const min = Math.max(1, Math.min(30 - genislik, taban.min + vurgu.shift));
  return {
    min,
    max: min + genislik,
    emphasis: vurgu.key,
    shifted: true,
    baseMin: taban.min,
    baseMax: taban.max,
  };
};

/**
 * Bir haftalık plan için vurgu önerisi.
 *
 * Kural: aynı kası birden fazla gören günler farklı vurgu almalı. Tek gören
 * günler standart kalıyor — dalgalanmanın anlamı tekrar eden uyaranı
 * çeşitlendirmek; haftada bir çalışılan bir kasta kaydırma yapmak yalnızca
 * o kası tek bir aralığa hapsetmek olurdu.
 *
 * İlk gören gün AĞIR: hafta başında toparlanma en iyi durumda ve ağır iş
 * oraya konmalı. Sonrakiler sırayla hafif ve orta.
 *
 * @param days [{ name, muscles: [] }]
 * @returns [{ name, emphasis, reason }]
 */
export const suggestEmphasis = (days = []) => {
  const sayac = new Map();
  (days || []).forEach(gun => {
    (gun.muscles || []).forEach(kas => sayac.set(kas, (sayac.get(kas) || 0) + 1));
  });

  // Bir günün "tekrar eden" sayılması için kaslarının çoğu birden fazla günde
  // görünmeli; tek bir ortak kas günü dalgalanmaya sokmaya yetmiyor.
  const gorulen = new Map();

  return (days || []).map(gun => {
    const kaslar = gun.muscles || [];
    const tekrarEden = kaslar.filter(k => (sayac.get(k) || 0) > 1);
    if (kaslar.length === 0 || tekrarEden.length < Math.ceil(kaslar.length / 2)) {
      return { name: gun.name, emphasis: 'standard', reason: 'Bu günün kasları haftada bir kez çalışılıyor; dalgalanmaya gerek yok.' };
    }

    // Bu günün kasları kaçıncı kez görülüyor.
    const sira = Math.max(...tekrarEden.map(k => (gorulen.get(k) || 0))) + 1;
    tekrarEden.forEach(k => gorulen.set(k, sira));

    if (sira === 1) {
      return { name: gun.name, emphasis: 'heavy', reason: 'Haftanın ilk uyaranı; toparlanma en iyi durumdayken ağır iş buraya.' };
    }
    if (sira === 2) {
      return { name: gun.name, emphasis: 'light', reason: 'Aynı kasların ikinci günü; yüksek tekrarla eklemleri dinlendirip hacmi koruyor.' };
    }
    return { name: gun.name, emphasis: 'moderate', reason: 'Üçüncü uyaran; klasik hipertrofi aralığında tamamlıyor.' };
  });
};

/**
 * Şablona yazılmış vurgunun seansta uygulanmış hali.
 *
 * @returns { emphasis, repRange, rirTarget } | null (vurgu yoksa)
 */
export const applyEmphasis = (emphasisKey, repRange) => {
  if (!emphasisKey || emphasisKey === 'standard') return null;
  const vurgu = findEmphasis(emphasisKey);
  return {
    emphasis: vurgu,
    repRange: shiftRepRange(repRange, emphasisKey),
    rirTarget: vurgu.rirTarget,
  };
};

/**
 * Haftanın vurgu dağılımı dengeli mi.
 *
 * Bütün günleri ağır yapmak dalgalanma değil, sadece daha zor bir hafta.
 */
export const auditEmphasis = (assignments = []) => {
  const gecerli = (assignments || []).filter(a => a?.emphasis && a.emphasis !== 'standard');
  if (gecerli.length < 2) return { ok: true, findings: [] };

  const sayac = {};
  gecerli.forEach(a => { sayac[a.emphasis] = (sayac[a.emphasis] || 0) + 1; });
  const findings = [];

  const agir = sayac.heavy || 0;
  if (agir === gecerli.length) {
    findings.push({
      key: 'all-heavy',
      title: 'Bütün günler ağır',
      detail: 'Her günü ağır yapmak dalgalanma değil, yalnızca daha zor bir hafta. Aynı kasın ikinci gününü hafif vurguya almak toparlanmayı kolaylaştırıyor ve haftalık hacmi korumanı sağlıyor.',
    });
  }
  if (agir > Math.ceil(gecerli.length / 2)) {
    findings.push({
      key: 'heavy-share',
      title: `${agir} günün ${gecerli.length} tanesi ağır`,
      detail: 'Ağır günlerin payı yarıdan fazla. Ağır çalışma eklem ve sinir sistemi yorgunluğunu hacimden daha hızlı biriktiriyor; dengeyi ortaya çekmek bloğun sonuna kadar dayanmanı sağlıyor.',
    });
  }

  return { ok: findings.length === 0, findings, counts: sayac };
};
