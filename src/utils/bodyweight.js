import { parseNumber } from './number.js';

/**
 * Vücut ağırlıklı hareketlerin yükü.
 *
 * Sorun: barfiks 4×10 yapan biri ağırlık alanına 0 yazıyor (ya da boş
 * bırakıyor) çünkü ek ağırlık takmıyor. Uygulama bunu "sıfır yük" sayıyordu ve
 * sonuç şuydu:
 *
 *   - tonaj 0 → haftalık hacim istatistiği bu seansı hiç görmüyor
 *   - tahmini 1RM 0 → rekor hiç oluşmuyor, seans raporu boş çıkıyor
 *   - progresyon önerisi üretilemiyor
 *
 * Yani kalistenik ağırlıklı çalışan biri için uygulamanın yarısı sessizce
 * çalışmıyordu. Oysa bu hareketlerde ağırlık alanının anlamı EK ağırlık; asıl
 * yük vücudun kendisi.
 *
 * Kaldıraç oranı: her hareket vücudun tamamını kaldırmıyor. Şınavda eller
 * vücut ağırlığının tamamını taşımıyor, ayaklar bir kısmını yere aktarıyor —
 * ölçümler standart şınavda ~%64 veriyor. Barfiks ve dipte ise vücudun tamamı
 * asılı olduğu için oran 1.
 *
 * Liste bilerek DAR tutuldu. Yalnızca "vücut ağırlığı yükün kendisidir" diye
 * kabul gören hareketler var. Bulgarian split squat gibi çoğunlukla dambılla
 * yapılan hareketler dışarıda: oraya vücut ağırlığı eklemek yükü şişirirdi.
 * Yardımlı (assisted) varyantlar da dışarıda, çünkü orada ağırlık alanı ek yük
 * değil DESTEK miktarını gösteriyor — eklemek tam ters yönde hata olurdu.
 */
/**
 * Model dışı bırakılan varyantlar.
 *
 * Makine ve yardımlı varyantlarda ağırlık alanı ek yük değil DESTEK miktarını
 * gösteriyor; vücut ağırlığı eklemek tam ters yönde hata olurdu. Ayrı bir liste
 * çünkü ad içinde nereye geldiği değişiyor ("Assisted Pull-up" ama "Machine
 * Chest Dip") ve negatif lookbehind bunu güvenilir yakalayamıyor.
 */
const DESTEKLI = /machine|assisted|smith/i;

export const BODYWEIGHT_MOVEMENTS = [
  // Tam asılı: vücudun tamamı yükte.
  { pattern: /muscle-?up/i, factor: 1, label: 'Muscle-up' },
  { pattern: /pull-?up|chin-?up/i, factor: 1, label: 'Barfiks' },
  { pattern: /bench dip/i, factor: 0.4, label: 'Sehpa dip' },
  { pattern: /\bdips?\b/i, factor: 1, label: 'Dip' },

  // Şınav ailesi: gövde açısı taşınan payı değiştiriyor.
  { pattern: /incline push-?up/i, factor: 0.5, label: 'Eğik şınav' },
  { pattern: /(decline|deficit|weighted) push-?up/i, factor: 0.75, label: 'Ters eğik şınav' },
  { pattern: /push-?up/i, factor: 0.64, label: 'Şınav' },

  // Yatay çekiş: gövde yere yakınlaştıkça pay artıyor, ortalama alınıyor.
  { pattern: /inverted row/i, factor: 0.6, label: 'Ters kürek' },

  // Tek bacak üstünde çömelme: kaldırılan bacak yükten düşüyor.
  { pattern: /pistol squat/i, factor: 0.85, label: 'Pistol squat' },
];

/**
 * Bir hareketin vücut ağırlığı kaldıraç oranı; değilse null.
 *
 * Kullanıcı kendi eşlemesinde `bodyweightFactor` tanımladıysa o kazanıyor —
 * ad kalıbı her varyantı yakalayamaz ve kullanıcının kendi hareketi olabilir.
 */
export const bodyweightFactorOf = (name, customList = []) => {
  const kayit = (customList || []).find(ex => (typeof ex === 'object' ? ex.name : ex) === name);
  if (kayit && typeof kayit === 'object' && kayit.bodyweightFactor !== undefined) {
    const f = parseNumber(kayit.bodyweightFactor);
    return f > 0 ? f : null;
  }
  const ad = String(name || '');
  if (DESTEKLI.test(ad)) return null;
  const eslesme = BODYWEIGHT_MOVEMENTS.find(m => m.pattern.test(ad));
  return eslesme ? eslesme.factor : null;
};

export const isBodyweightMovement = (name, customList) =>
  bodyweightFactorOf(name, customList) !== null;

/**
 * Ağırlık alanının hangi anlamda yazıldığını tanıma eşiği.
 *
 * İki farklı alışkanlık var ve ikisi de makul:
 *   EK   — "barfiks, ek yok" → 0 yazılır
 *   TOPLAM — "barfiks, 80 kiloyum" → 80 yazılır
 *
 * Uygulama 3.3'e kadar toplam yazanları destekliyordu; 3.3 ek yük varsaydı ve
 * toplam yazanların kayıtlarını iki katına çıkardı. Kullanıcının alışkanlığını
 * geriye dönük değiştirmek veri bozmak demek, bu yüzden set bazında tanınıyor.
 *
 * Eşik TAŞINAN yüke göre: şınavda taşınan yük vücut ağırlığının %64'ü, dolayısıyla
 * "toplam" yazan biri 80 değil 51 yazar. Ham vücut ağırlığına bakan bir eşik bunu
 * kaçırırdı.
 *
 * Yanılma payı: ek yükü taşınan yükün %70'ini geçen çok güçlü bir sporcu
 * (80 kg vücutla +56 kg barfiks) yanlış sınıflanır. Nadir ve denetim aracında
 * görünür kılınıyor.
 */
const TOTAL_ENTRY_THRESHOLD = 0.7;

/**
 * Bu set "toplam ağırlık" olarak mı yazılmış?
 *
 * @returns true = alan zaten vücut ağırlığını içeriyor, üstüne ekleme
 */
export const looksLikeTotalEntry = (setWeight, carriedKg) =>
  parseNumber(setWeight) >= carriedKg * TOTAL_ENTRY_THRESHOLD && carriedKg > 0;

/**
 * Bir setin GERÇEK yükü: ek ağırlık + taşınan vücut ağırlığı.
 *
 * Vücut ağırlığı bilinmiyorsa (hiç ölçüm yok) eski davranışa dönülüyor —
 * uydurma bir kilo koymaktansa eksik hesap dürüst.
 *
 * @param opts.entryStyle 'auto'  — set bazında tanı (varsayılan, karışık geçmişi kurtarır)
 *                        'added' — alan daima EK yük
 *                        'total' — alan daima toplam yük, hiç ekleme yapma
 * @param opts.bodyweightEnabled false ise model tamamen devre dışı.
 */
export const effectiveLoad = (exerciseName, setWeight, {
  bodyWeightKg = 0,
  customExercises = [],
  bodyweightEnabled = true,
  entryStyle = 'auto',
} = {}) => {
  const ek = parseNumber(setWeight);
  if (!bodyweightEnabled || entryStyle === 'total') return ek;

  const oran = bodyweightFactorOf(exerciseName, customExercises);
  const kilo = parseNumber(bodyWeightKg);
  if (oran === null || !(kilo > 0)) return ek;

  const tasinan = kilo * oran;
  // 'auto': alan taşınan yüke yakınsa kullanıcı toplamı yazmış demektir.
  if (entryStyle === 'auto' && looksLikeTotalEntry(ek, tasinan)) return ek;

  return Math.round((tasinan + ek) * 100) / 100;
};

/** Arayüzde "ek yükün yanında ne kadar vücut ağırlığı sayıldı" bilgisi. */
export const bodyweightPortion = (exerciseName, { bodyWeightKg = 0, customExercises = [], bodyweightEnabled = true } = {}) => {
  if (!bodyweightEnabled) return null;
  const oran = bodyweightFactorOf(exerciseName, customExercises);
  const kilo = parseNumber(bodyWeightKg);
  if (oran === null || !(kilo > 0)) return null;
  return {
    factor: oran,
    kg: Math.round(kilo * oran * 10) / 10,
    label: oran === 1 ? 'vücut ağırlığı' : `vücut ağırlığının %${Math.round(oran * 100)}'i`,
  };
};
