import { parseNumber } from './number.js';
import { isWorkingSet, estimate1RM } from './helpers.js';

/**
 * Antrenman saati ve performans.
 *
 * Uygulama seansın ne zaman yapıldığını kaydediyor ama hiç kullanmıyordu.
 * Oysa günün saati performansı ölçülebilir biçimde etkiliyor (vücut ısısı,
 * kortizol ritmi, o güne kadar yenen yemek) ve bu etki KİŞİYE ÖZEL — genel
 * bir "öğleden sonra antrenman yap" tavsiyesi kimseye bir şey söylemiyor.
 * Kendi kaydından çıkan cevap söylüyor.
 *
 * Ölçüt seans başına ortalama tahmini 1RM DEĞİL — hareket karışımı seanstan
 * seansa değişiyor ve sabah bench, akşam bacak yapan biri için karşılaştırma
 * anlamsız olurdu. Bunun yerine her hareket KENDİ ortalamasına göre
 * normalleştiriliyor: "bu hareketi bu saatte yaptığında kendi ortalamandan
 * yüzde kaç iyi/kötüsün".
 */

// Saat dilimleri. Dar dilimler örneklem başına birkaç seans bırakıyor ve
// gürültüyü eğilim gibi gösteriyordu.
export const TIME_SLOTS = [
  { key: 'earlyMorning', label: 'Erken Sabah', short: '05-08', from: 5, to: 8 },
  { key: 'morning', label: 'Sabah', short: '08-11', from: 8, to: 11 },
  { key: 'midday', label: 'Öğle', short: '11-14', from: 11, to: 14 },
  { key: 'afternoon', label: 'Öğleden Sonra', short: '14-17', from: 14, to: 17 },
  { key: 'evening', label: 'Akşam', short: '17-21', from: 17, to: 21 },
  { key: 'night', label: 'Gece', short: '21-05', from: 21, to: 29 },
];

export const slotForHour = (hour) => {
  const h = Number(hour);
  if (!Number.isFinite(h)) return null;
  const normal = h < 5 ? h + 24 : h;
  return TIME_SLOTS.find(s => normal >= s.from && normal < s.to) || null;
};

/** Seansın saati: `startedAt` varsa oradan, yoksa kayıt tarihinden çıkmıyor. */
const seansSaati = (workout) => {
  const kaynak = workout?.startedAt || workout?.timer?.startTime;
  if (!kaynak) return null;
  const d = new Date(kaynak);
  return Number.isNaN(d.getTime()) ? null : d.getHours();
};

// Bir dilimin değerlendirilebilmesi için gereken en az seans sayısı.
const MIN_SESSIONS_PER_SLOT = 3;
// Karşılaştırılabilir olması için bir hareketin en az kaç seansta olması gerektiği.
const MIN_SESSIONS_PER_EXERCISE = 3;

/**
 * Saat dilimi bazında performans.
 *
 * @returns { hasData, slots, best, worst, spread }
 */
export const buildTimeOfDayReport = (workouts = [], { resolveLoad = null } = {}) => {
  // 1) Hareket başına genel ortalama tahmini 1RM.
  const hareketToplam = new Map();
  const kayitlar = [];

  (workouts || []).forEach(w => {
    const saat = seansSaati(w);
    const dilim = saat === null ? null : slotForHour(saat);
    if (!dilim) return;

    (w.exercises || []).forEach(ex => {
      const calisma = (ex.sets || []).filter(s => isWorkingSet(s) && parseNumber(s.reps) > 0);
      if (calisma.length === 0) return;
      let enIyi = 0;
      calisma.forEach(s => {
        const yuk = resolveLoad ? parseNumber(resolveLoad(ex.name, s.weight, w)) : parseNumber(s.weight);
        const e = estimate1RM(yuk, s.reps, s.rir);
        if (e > enIyi) enIyi = e;
      });
      if (enIyi <= 0) return;

      if (!hareketToplam.has(ex.name)) hareketToplam.set(ex.name, { toplam: 0, adet: 0 });
      const h = hareketToplam.get(ex.name);
      h.toplam += enIyi;
      h.adet += 1;

      kayitlar.push({ slot: dilim.key, exercise: ex.name, e1rm: enIyi, date: w.date, workoutId: w.id });
    });
  });

  // 2) Her kaydı kendi hareketinin ortalamasına göre normalleştir.
  const dilimHarita = new Map(TIME_SLOTS.map(s => [s.key, { slot: s, toplamOran: 0, adet: 0, seanslar: new Set() }]));

  kayitlar.forEach(k => {
    const h = hareketToplam.get(k.exercise);
    if (!h || h.adet < MIN_SESSIONS_PER_EXERCISE) return;
    const ortalama = h.toplam / h.adet;
    if (ortalama <= 0) return;
    const d = dilimHarita.get(k.slot);
    d.toplamOran += k.e1rm / ortalama;
    d.adet += 1;
    d.seanslar.add(k.workoutId);
  });

  const slots = [...dilimHarita.values()]
    .filter(d => d.seanslar.size >= MIN_SESSIONS_PER_SLOT)
    .map(d => ({
      key: d.slot.key,
      label: d.slot.label,
      short: d.slot.short,
      sessions: d.seanslar.size,
      samples: d.adet,
      // 1.0 = kendi ortalaman. 1.04 = bu dilimde %4 daha iyisin.
      index: Math.round((d.toplamOran / d.adet) * 1000) / 1000,
    }))
    .sort((a, b) => b.index - a.index);

  if (slots.length < 2) {
    return { hasData: false, slots, sessionsNeeded: MIN_SESSIONS_PER_SLOT };
  }

  const enIyi = slots[0];
  const enKotu = slots[slots.length - 1];
  const fark = Math.round((enIyi.index - enKotu.index) * 1000) / 10;

  return {
    hasData: true,
    slots,
    best: enIyi,
    worst: enKotu,
    // Yüzde puan cinsinden fark. Küçükse anlamlı bir tercih yok demektir.
    spread: fark,
    // Üç puandan küçük fark ölçüm gürültüsü sayılıyor: seanslar arası doğal
    // dalgalanma zaten bu büyüklükte ve buna "sabahları daha güçlüsün"
    // demek olmayan bir örüntüyü varmış gibi sunmak olurdu.
    meaningful: fark >= 3,
  };
};

/** Koç kartı için tek satır. */
export const timeOfDayCoachItem = (report) => {
  if (!report?.hasData || !report.meaningful) return null;
  return {
    key: 'time-of-day',
    tone: 'info',
    title: `${report.best.label} saatlerinde %${report.spread} daha güçlüsün`,
    detail: `${report.best.short} arasında yaptığın seanslarda hareketler kendi ortalamanın üstünde, ${report.worst.short} arasında altında (${report.best.sessions} ve ${report.worst.sessions} seans). Program esnekse ağır seansları ${report.best.label.toLowerCase()} saatlerine almak, hiçbir şey değiştirmeden kazanç sağlıyor. Fark küçükse zorlama: düzenli gidebildiğin saat, teorik olarak en iyi saatten daha değerli.`,
  };
};
