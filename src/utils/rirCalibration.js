import { parseNumber } from './number.js';
import { isWorkingSet } from './helpers.js';

/**
 * RIR kalibrasyonu.
 *
 * Uygulamanın en çok güvendiği tek alan RIR: etkili set sayımı, tahmini 1RM,
 * seans içi yük ayarı ve hazır oluşluk yorumu hep buna dayanıyor. Ama RIR
 * ölçülen değil BİLDİRİLEN bir sayı ve literatürde tekrar tekrar görülen şey,
 * deneyimsiz lifterların yedek tekrarlarını sistematik olarak fazla tahmin
 * etmesi: "3 tekrarım kalmıştı" diyen kişi çoğu zaman 0-1 tekrar uzaktadır.
 *
 * Doğrudan ölçmek mümkün değil (kimse her seti başarısızlığa taşımıyor) ama
 * DOLAYLI bir kanıt var: aynı ağırlıkta arka arkaya yapılan setler.
 *
 * Bir sette "RIR 3" bildirip aynı ağırlıkta bir sonraki sette tekrar sayısı
 * neredeyse hiç düşmüyorsa, gerçekten yedek vardı. Aynı bildirimden sonra
 * tekrarlar çöküyorsa yedek yoktu — yani RIR olduğundan yüksek bildirilmiş.
 *
 * Modül bunu iddia olarak değil EĞİLİM olarak sunuyor; tek bir çift hiçbir şey
 * söylemez, örüntü söyler.
 */

// Kalibrasyon için en az bu kadar ardışık çift gerekiyor. Altında çıkan sonuç
// gürültüden ayırt edilemiyor.
const MIN_PAIRS = 8;
// Bildirilen RIR bu değerin altındaysa çift kullanılmıyor: RIR 0-1'de zaten
// düşüş beklenir, bilgi taşımaz.
const MIN_REPORTED_RIR = 2;
// Sapma bu eşiği geçmeden "kalibrasyon bozuk" denmiyor; ölçüm gürültülü.
const BIAS_THRESHOLD = 0.8;

/**
 * Bir RIR bildiriminden sonra beklenen tekrar düşüşü.
 *
 * Aynı ağırlıkta ikinci sette tipik düşüş, yedek tekrar sayısıyla ters
 * orantılı: yedeği bol olan set ikinci turda neredeyse aynı tekrarı verir,
 * sınırda yapılan set belirgin düşer. Katsayı literatürdeki tekrar-düşüş
 * gözlemlerinden değil, bu uygulamanın kendi verisinden kalibre edilebilecek
 * kaba bir referans — bu yüzden sonuç mutlak değil, karşılaştırmalı okunuyor.
 */
const beklenenDusus = (rir) => {
  const r = Math.max(0, parseNumber(rir));
  // RIR 0 -> ~2.5 tekrar düşüş, RIR 4 -> ~0.5 tekrar düşüş.
  return Math.max(0.3, 2.5 - r * 0.5);
};

/**
 * Ardışık, aynı ağırlıklı set çiftlerinden RIR sapmasını çıkarır.
 *
 * @returns { hasData, pairs, bias, verdict, advice }
 *   bias > 0  bildirilen RIR gerçekten YÜKSEK (yedek abartılmış)
 *   bias < 0  bildirilen RIR düşük (kişi kendini olduğundan yorgun sanıyor)
 */
export const buildRirCalibration = (workouts = [], { minPairs = MIN_PAIRS } = {}) => {
  const ciftler = [];

  (workouts || []).forEach(w => {
    (w?.exercises || []).forEach(ex => {
      const setler = (ex?.sets || []).filter(isWorkingSet);
      for (let i = 0; i < setler.length - 1; i += 1) {
        const a = setler[i];
        const b = setler[i + 1];
        const agirlikA = parseNumber(a.weight);
        const agirlikB = parseNumber(b.weight);
        // Aynı ağırlık şart: yük değişirse tekrar farkı yorgunluğu değil
        // yükü ölçer.
        if (!(agirlikA > 0) || agirlikA !== agirlikB) continue;

        const tekrarA = parseNumber(a.reps);
        const tekrarB = parseNumber(b.reps);
        if (!(tekrarA > 0) || !(tekrarB > 0)) continue;

        const rir = parseNumber(a.rir);
        if (a.rir === '' || a.rir === undefined || a.rir === null) continue;
        if (rir < MIN_REPORTED_RIR) continue;

        const gercekDusus = tekrarA - tekrarB;
        const beklenen = beklenenDusus(rir);
        // Düşüş beklenenden BÜYÜKSE yedek abartılmıştı. Farkı RIR birimine
        // çevirmek için beklenen düşüşün RIR'e göre eğimini (0.5) kullanıyoruz.
        const sapma = (gercekDusus - beklenen) / 0.5;

        ciftler.push({
          exercise: ex.name,
          date: w.date,
          reportedRir: rir,
          drop: gercekDusus,
          expectedDrop: Math.round(beklenen * 10) / 10,
          bias: Math.round(sapma * 100) / 100,
        });
      }
    });
  });

  if (ciftler.length < minPairs) {
    return { hasData: false, pairs: ciftler.length, needed: minPairs, bias: 0, verdict: 'unknown', advice: '' };
  }

  const ortalama = ciftler.reduce((t, c) => t + c.bias, 0) / ciftler.length;
  const bias = Math.round(ortalama * 100) / 100;

  let verdict = 'calibrated';
  let advice = 'Bildirdiğin RIR, setler arası tekrar düşüşüyle tutarlı. Etkili set sayımı ve tahmini 1RM bu sayıya güvenebilir.';

  if (bias >= BIAS_THRESHOLD) {
    verdict = 'overestimating';
    advice = `Aynı ağırlıkta ikinci setlerdeki tekrar kaybı, bildirdiğin yedeğin ortalama ${Math.abs(bias).toFixed(1)} tekrar fazla olduğunu gösteriyor. Yani "RIR 3" dediğin setler pratikte RIR ${Math.max(0, Math.round(3 - bias))} civarında. Bu, etkili set sayımını ve tahmini 1RM'i olduğundan iyimser yapıyor; setleri bir tık daha zorlamak ya da RIR'i bir kademe düşük bildirmek tabloyu düzeltir.`;
  } else if (bias <= -BIAS_THRESHOLD) {
    verdict = 'underestimating';
    advice = `Tekrar kaybın bildirdiğin yedeğe göre ortalama ${Math.abs(bias).toFixed(1)} tekrar AZ. Setlerinde sandığından daha çok yedek kalıyor olabilir; hedef aralığın üst ucunda kalıp ağırlığı artırmayı deneyebilirsin.`;
  }

  // Hareket bazında en sapan üçü: kalibrasyon genelde tek tip harekette bozuk
  // oluyor (izolasyonda yedek tahmini bileşkeden daha zor).
  const kasBazli = new Map();
  ciftler.forEach(c => {
    const liste = kasBazli.get(c.exercise) || [];
    liste.push(c.bias);
    kasBazli.set(c.exercise, liste);
  });
  const byExercise = [...kasBazli.entries()]
    .filter(([, list]) => list.length >= 3)
    .map(([name, list]) => ({
      name,
      pairs: list.length,
      bias: Math.round((list.reduce((t, n) => t + n, 0) / list.length) * 100) / 100,
    }))
    .sort((a, b) => Math.abs(b.bias) - Math.abs(a.bias))
    .slice(0, 3);

  return { hasData: true, pairs: ciftler.length, needed: minPairs, bias, verdict, advice, byExercise };
};

/** RIR kalibrasyonunun günlük koç satırı. */
export const rirCoachItem = (report) => {
  if (!report?.hasData || report.verdict === 'calibrated' || report.verdict === 'unknown') return null;
  return {
    title: report.verdict === 'overestimating'
      ? 'Bildirdiğin RIR gerçeğin üstünde'
      : 'Setlerinde bildirdiğinden çok yedek var',
    detail: `${report.pairs} ardışık set çiftinden çıkan eğilim. ${report.advice}`,
  };
};
