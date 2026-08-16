import { parseNumber } from './number.js';

/**
 * Antrenman çevresi beslenme.
 *
 * Uygulama günlük toplamları izliyordu: kalori, protein, karbonhidrat, yağ.
 * Bu hipertrofi için doğru öncelik sırası — toplamlar zamanlamadan çok daha
 * belirleyici. Ama toplam doğruyken bile bir boşluk kalıyor: antrenmana aç
 * girmek ya da günün proteininin tamamını akşam yemek, aynı toplamla daha
 * kötü bir seans ve daha yavaş toparlanma üretiyor.
 *
 * Modül bilerek MÜTEVAZI. "Anabolik pencere" gibi dar zaman iddiaları
 * literatürde büyük ölçüde geri çekildi; söylenen şey şu kadar: seansın iki
 * yanında yeterli protein ve seanstan önce yeterli karbonhidrat olsun,
 * protein güne yayılsın. Bunun ötesindeki hassasiyet, kimsenin uygulamadığı
 * ve ölçülebilir karşılığı zayıf bir tavsiye olurdu.
 */

// Öğün başına hedeflenen protein: günlük hedefin bu oranı. Dört öğüne yayılan
// bir günde her öğün toplamın dörtte birini taşıyor.
const MEAL_PROTEIN_SHARE = 0.22;
// Seans öncesi karbonhidrat için kaba eşik (g). Altındaysa uzun bir seansta
// son setlerde düşüş görülüyor.
const PRE_CARB_MIN = 40;
// Bu saatten sonra antrenman "akşam seansı" sayılıyor.
const EVENING_HOUR = 18;

/**
 * Bugünün beslenme durumunu antrenman planına göre yorumlar.
 *
 * @param opts.plannedToday   bugün antrenman planlı mı
 * @param opts.doneToday      bugün antrenman yapıldı mı
 * @param opts.hour           şu anki saat (test için verilebilir)
 * @returns { items, hasData }
 */
export const buildPeriNutrition = ({
  macros = {},
  targetProtein = 0,
  targetCalories = 0,
  plannedToday = false,
  doneToday = false,
  hour = new Date().getHours(),
  mealCount = 0,
} = {}) => {
  const protein = parseNumber(macros.protein);
  const karb = parseNumber(macros.carbs);
  const kalori = parseNumber(macros.calories);
  const hedefProtein = parseNumber(targetProtein);
  const hedefKalori = parseNumber(targetCalories);

  const items = [];

  // --- seans ÖNCESİ ---
  if (plannedToday && !doneToday) {
    if (karb < PRE_CARB_MIN) {
      items.push({
        key: 'preCarb', phase: 'before', severity: 'warn',
        title: `Antrenman öncesi karbonhidrat ${Math.round(karb)} g`,
        detail: `Bugün planlı bir seans var ve karbonhidrat alımı henüz düşük. Seanstan 1-2 saat önce ${PRE_CARB_MIN}-70 g karbonhidrat, uzun seansların son setlerinde görülen düşüşü belirgin azaltıyor. Zaman kısaysa daha kolay sindirilen bir kaynak seç.`,
      });
    }
    if (hedefProtein > 0 && protein < hedefProtein * 0.3) {
      items.push({
        key: 'preProtein', phase: 'before', severity: 'info',
        title: `Protein günün %${Math.round((protein / hedefProtein) * 100)}'inde`,
        detail: 'Seansa protein alımı düşükken girmek, toparlanmayı seans sonrasına yıkıyor. Antrenmandan önceki öğünde 30-40 g protein, seans sonrası aciliyetini de azaltıyor.',
      });
    }
  }

  // --- seans SONRASI ---
  if (doneToday) {
    const kalan = Math.max(0, hedefProtein - protein);
    if (hedefProtein > 0 && kalan > hedefProtein * 0.35) {
      items.push({
        key: 'postProtein', phase: 'after', severity: 'warn',
        title: `Proteinin ${Math.round(kalan)} g'ı kaldı`,
        detail: `Antrenman yapıldı ve günlük proteinin büyük kısmı hâlâ eksik. Kalanı tek öğüne sıkıştırmak yerine kalan öğünlere yaymak daha iyi: öğün başına ${Math.round(hedefProtein * MEAL_PROTEIN_SHARE)} g civarı bir dağılım, aynı toplamdan daha çok yararlanmanı sağlıyor.`,
      });
    }
    if (hedefKalori > 0 && kalori < hedefKalori * 0.5 && hour >= EVENING_HOUR) {
      items.push({
        key: 'postCalories', phase: 'after', severity: 'warn',
        title: `Kalorinin yarısından azı alınmış`,
        detail: 'Antrenman yapılmış ama gün kalori olarak çok geride. Bu tablo bilinçli bir açık değilse toparlanmayı ve kas kazanımını doğrudan sınırlıyor; akşam kalan kaloriyi kapatmak zorlaşmadan önce ara öğün ekle.',
      });
    }
  }

  // --- dağılım ---
  if (hedefProtein > 0 && mealCount > 0 && protein > 0) {
    const ogunBasi = protein / mealCount;
    const beklenen = hedefProtein * MEAL_PROTEIN_SHARE;
    if (mealCount <= 2 && ogunBasi > beklenen * 1.8) {
      items.push({
        key: 'spread', phase: 'day', severity: 'info',
        title: 'Protein az sayıda öğüne yığılmış',
        detail: `${mealCount} öğünde ortalama ${Math.round(ogunBasi)} g protein var. Toplam doğru olduğu sürece dağılımın etkisi küçük ama sıfır değil; üç dört öğüne yaymak, aynı toplamdan biraz daha iyi sonuç veriyor.`,
      });
    }
  }

  const puan = { warn: 2, info: 1 };
  items.sort((a, b) => (puan[b.severity] || 0) - (puan[a.severity] || 0));

  return { items, hasData: items.length > 0 };
};

/** Antrenman çevresi beslenmenin günlük koç satırı. */
export const periNutritionCoachItem = (report) => {
  if (!report?.hasData) return null;
  const ilk = report.items.find(i => i.severity === 'warn');
  if (!ilk) return null;
  return { key: 'peri-nutrition', title: ilk.title, detail: ilk.detail };
};
