import { parseNumber } from './number.js';
import { isWorkingSet, estimate1RM } from './helpers.js';

/**
 * Tekrar bazlı rekorlar.
 *
 * Uygulama hareket başına TEK bir rekor tutuyordu: en yüksek tahmini 1RM.
 * Bu, gerçekte yapılmış hiçbir seti göstermiyor — bir formülün çıktısı. Salonda
 * "beş tekrarda en iyim neydi" diye sorulduğunda cevap yoktu ve kullanıcı
 * geçmişi elle tarıyordu.
 *
 * Artık her tekrar bandının kendi rekoru var ve hepsi GERÇEKTEN YAPILMIŞ
 * setler. Tahmin yalnızca sıralama için kullanılıyor, gösterilen sayı değil.
 *
 * Bantlar tek tek tekrar değil aralık: 5 ile 6 tekrar arasındaki fark
 * pratikte rekor sayılacak kadar anlamlı değil ve her tekrara ayrı satır
 * açmak tabloyu okunmaz yapardı.
 */

export const REP_BANDS = [
  { key: '1', label: '1-2', min: 1, max: 2, hint: 'Maksimum kuvvet' },
  { key: '3', label: '3-5', min: 3, max: 5, hint: 'Kuvvet' },
  { key: '6', label: '6-8', min: 6, max: 8, hint: 'Kuvvet-hipertrofi' },
  { key: '9', label: '9-12', min: 9, max: 12, hint: 'Hipertrofi' },
  { key: '13', label: '13-20', min: 13, max: 20, hint: 'Metabolik' },
  { key: '21', label: '21+', min: 21, max: Infinity, hint: 'Dayanıklılık' },
];

const bandFor = (reps) => REP_BANDS.find(b => reps >= b.min && reps <= b.max) || null;

/**
 * Bir hareketin tekrar bandı bazında rekorları.
 *
 * Aynı bantta iki set varsa daha AĞIR olan kazanıyor; eşit ağırlıkta daha çok
 * tekrar yapan. Isınma setleri sayılmıyor.
 */
export const repRecordsFor = (exerciseName, workouts = [], { resolveLoad = null } = {}) => {
  const enIyiler = new Map();

  (workouts || []).forEach(w => {
    (w.exercises || []).forEach(ex => {
      if (ex?.name !== exerciseName) return;
      (ex.sets || []).forEach(s => {
        if (!isWorkingSet(s)) return;
        const tekrar = parseNumber(s.reps);
        const yuk = resolveLoad ? parseNumber(resolveLoad(exerciseName, s.weight, w)) : parseNumber(s.weight);
        if (tekrar <= 0 || yuk <= 0) return;

        const band = bandFor(tekrar);
        if (!band) return;

        const aday = {
          band: band.key,
          bandLabel: band.label,
          hint: band.hint,
          weight: yuk,
          reps: tekrar,
          rir: parseNumber(s.rir),
          date: w.date,
          // estimate1RM 15 toplam tekrarın üstünde 0 döndürüyor: Epley o
          // bölgede güvenilir değil ve uydurma bir sayı üretmektense boş
          // bırakmak doğru. Burada null'a çevriliyor ki arayüz "0 kg" gibi
          // yanlış bir değer göstermesin.
          e1rm: (() => {
            const t = estimate1RM(yuk, tekrar, s.rir);
            return t > 0 ? Math.round(t * 10) / 10 : null;
          })(),
        };
        const mevcut = enIyiler.get(band.key);
        if (!mevcut
          || aday.weight > mevcut.weight
          || (aday.weight === mevcut.weight && aday.reps > mevcut.reps)) {
          enIyiler.set(band.key, aday);
        }
      });
    });
  });

  const satirlar = REP_BANDS.map(b => enIyiler.get(b.key)).filter(Boolean);
  return {
    exercise: exerciseName,
    rows: satirlar,
    hasData: satirlar.length > 0,
    // En yüksek tahmini 1RM hangi banttan geliyor: kullanıcının en güçlü
    // olduğu tekrar aralığı. Kuvvet çalışanla hacim çalışanı ayırıyor.
    //
    // Tahmini olmayan yüksek tekrar bantları yarışa girmiyor; hepsi
    // tahminsizse karşılaştırılacak ortak birim yok ve alan boş kalıyor.
    strongestBand: (() => {
      const olculebilir = satirlar.filter(r => r.e1rm > 0);
      return olculebilir.length > 0
        ? olculebilir.reduce((best, r) => (r.e1rm > best.e1rm ? r : best))
        : null;
    })(),
  };
};

/**
 * Yeni set bir tekrar rekoru mu.
 *
 * Seans sırasında anında geri bildirim için: rekor kutlaması şimdiye kadar
 * yalnızca genel 1RM rekorunda çıkıyordu, oysa "on tekrarda en iyim" de bir
 * rekor ve çok daha sık geliyor — yani daha sık motive ediyor.
 */
export const isRepRecord = (exerciseName, set, workouts = [], { resolveLoad = null, excludeWorkoutId = null } = {}) => {
  const tekrar = parseNumber(set?.reps);
  const yuk = parseNumber(set?.weight);
  if (tekrar <= 0 || yuk <= 0 || !isWorkingSet(set)) return null;
  const band = bandFor(tekrar);
  if (!band) return null;

  const gecmis = (workouts || []).filter(w => w.id !== excludeWorkoutId);
  const onceki = repRecordsFor(exerciseName, gecmis, { resolveLoad }).rows.find(r => r.band === band.key);

  if (!onceki) return { band: band.key, bandLabel: band.label, first: true, previous: null };
  if (yuk > onceki.weight || (yuk === onceki.weight && tekrar > onceki.reps)) {
    return { band: band.key, bandLabel: band.label, first: false, previous: onceki };
  }
  return null;
};
