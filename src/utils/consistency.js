import { parseNumber } from './number.js';
import { dayKey, toLocalDate, weekBounds, formatDay, WEEKDAY_SHORT } from './dates.js';

/**
 * Tutarlılık ve plan uyumu.
 *
 * Uygulama hacmi, kuvveti ve toparlanmayı ölçüyordu ama en belirleyici
 * değişkeni ölçmüyordu: kişinin programa gerçekten uyup uymadığı. Mükemmel
 * kurulmuş bir programın haftada üç kez yapılan vasat bir programa üstünlüğü,
 * ancak yapılırsa var.
 *
 * İki ayrı soru var ve karıştırılmamalı:
 *
 *  - TUTARLILIK: hiç ara vermeden ne kadar süredir çalışıyorum? (seri)
 *  - PLAN UYUMU: planladığım günlerin kaçını yaptım? (oran)
 *
 * İkincisi olmadan birincisi yanıltıyor: haftada altı gün planlayıp üç gün
 * yapan biriyle üç gün planlayıp üçünü de yapan biri aynı seriyi görüyor ama
 * aynı durumda değiller.
 */

// Seri, tek bir kaçırılan günle kırılmıyor. Programlar haftada 2-6 gün;
// gün gün seri saymak antrenman takibinde anlamsız olurdu. Seri HAFTA
// biriminde sayılıyor: bir hafta içinde en az bir antrenman varsa hafta
// "tutulmuş" sayılıyor.
const MIN_WORKOUTS_PER_WEEK = 1;

/** İki tarih arasındaki tam hafta sayısı (pazartesi başlangıçlı). */
const haftaAnahtari = (date) => {
  const { start } = weekBounds(date);
  return dayKey(start);
};

/**
 * Haftalık tutarlılık ve seri.
 *
 * Bu haftanın kendisi seriyi KIRMIYOR ama seriye de sayılmıyor: salı günü
 * "serin bitti" demek haksız olurdu, henüz hafta bitmedi. Hafta içinde
 * antrenman yapıldıysa sayılıyor, yapılmadıysa görmezden geliniyor.
 */
export const buildConsistency = (workouts = [], { today = new Date(), weeks = 12 } = {}) => {
  const bugun = toLocalDate(dayKey(today));
  if (!bugun) return { hasData: false, weeks: [], currentStreak: 0, longestStreak: 0, days: [] };

  const gunler = new Map();
  (workouts || []).forEach(w => {
    if (!w?.date) return;
    const setSayisi = (w.exercises || []).reduce((t, ex) => t + (ex.sets || []).length, 0);
    const onceki = gunler.get(w.date) || { date: w.date, sessions: 0, sets: 0 };
    gunler.set(w.date, { ...onceki, sessions: onceki.sessions + 1, sets: onceki.sets + setSayisi });
  });

  // Hafta hafta geriye yürü.
  const buHafta = haftaAnahtari(bugun);
  const haftalar = [];
  for (let i = 0; i < weeks; i += 1) {
    const d = new Date(bugun);
    d.setDate(bugun.getDate() - i * 7);
    const anahtar = haftaAnahtari(d);
    const { start, end } = weekBounds(d);
    const icindekiler = [...gunler.values()].filter(g => {
      const gd = toLocalDate(g.date);
      return gd && gd >= start && gd <= end;
    });
    haftalar.push({
      key: anahtar,
      start: dayKey(start),
      end: dayKey(end),
      isCurrent: anahtar === buHafta,
      sessions: icindekiler.reduce((t, g) => t + g.sessions, 0),
      sets: icindekiler.reduce((t, g) => t + g.sets, 0),
      days: icindekiler.length,
    });
  }

  const tutuldu = (h) => h.sessions >= MIN_WORKOUTS_PER_WEEK;

  // Güncel seri: bu haftayı atlayarak başla (henüz bitmedi), ama bu hafta
  // zaten antrenman yapılmışsa seriye dahil et.
  let currentStreak = 0;
  for (let i = 0; i < haftalar.length; i += 1) {
    const h = haftalar[i];
    if (tutuldu(h)) currentStreak += 1;
    else if (h.isCurrent) continue;
    else break;
  }

  let longestStreak = 0;
  let sayac = 0;
  [...haftalar].reverse().forEach(h => {
    if (tutuldu(h)) { sayac += 1; longestStreak = Math.max(longestStreak, sayac); }
    else if (!h.isCurrent) sayac = 0;
  });

  // Son 12 haftanın gün ızgarası (ısı haritası için), eskiden yeniye.
  const izgara = [];
  const baslangic = new Date(bugun);
  baslangic.setDate(bugun.getDate() - (weeks * 7 - 1));
  for (let d = new Date(baslangic); d <= bugun; d.setDate(d.getDate() + 1)) {
    const k = dayKey(d);
    const kayit = gunler.get(k);
    izgara.push({
      date: k,
      weekday: d.getDay(),
      weekdayLabel: WEEKDAY_SHORT[d.getDay()],
      sets: kayit?.sets || 0,
      trained: Boolean(kayit),
    });
  }

  // Ortalama yalnızca KAYIT BAŞLADIKTAN sonraki tam haftalar üzerinden.
  // Pencerenin tamamına bölmek, beş haftalık geçmişi olan ve haftada iki gün
  // çalışan birine "0.7 gün/hafta" diyordu: kullanıcının henüz uygulamayı
  // kullanmadığı haftalar devamsızlık olarak sayılıyordu.
  const ilkKayit = [...gunler.keys()].sort()[0];
  const ilkTarih = ilkKayit ? toLocalDate(ilkKayit) : null;
  const aktifHaftalar = haftalar.filter(h => !h.isCurrent
    && (!ilkTarih || toLocalDate(h.end) >= ilkTarih));
  const ortalamaGun = aktifHaftalar.length > 0
    ? Math.round((aktifHaftalar.reduce((t, h) => t + h.days, 0) / aktifHaftalar.length) * 10) / 10
    : 0;

  return {
    hasData: gunler.size > 0,
    weeks: haftalar,
    days: izgara,
    currentStreak,
    longestStreak,
    averageDaysPerWeek: ortalamaGun,
    totalDays: gunler.size,
  };
};

/**
 * Plan uyumu: planlanan antrenman günlerinin kaçı yapıldı.
 *
 * Ölçüt gün eşleşmesi DEĞİL, hafta içindeki sayı. "Pazartesi planlıydı, salı
 * yaptım" bir başarısızlık değil; program kaydırılmıştır, uygulanmamış
 * değildir. Gün gün eşleştirmek gerçek hayatta kimsenin tutturamayacağı bir
 * ölçüt olurdu ve sayıyı anlamsız kılardı.
 */
export const buildAdherence = (workouts = [], planResult, { today = new Date(), weeks = 4 } = {}) => {
  const plananGun = parseNumber(planResult?.trainingDays);
  const bugun = toLocalDate(dayKey(today));
  if (!(plananGun > 0) || !bugun) {
    return { hasData: false, plannedPerWeek: plananGun || 0, weeks: [], rate: 0 };
  }

  const buHafta = haftaAnahtari(bugun);
  const satirlar = [];

  for (let i = 0; i < weeks; i += 1) {
    const d = new Date(bugun);
    d.setDate(bugun.getDate() - i * 7);
    const { start, end } = weekBounds(d);
    const anahtar = haftaAnahtari(d);
    const gunSeti = new Set(
      (workouts || [])
        .filter(w => {
          const wd = toLocalDate(w?.date);
          return wd && wd >= start && wd <= end;
        })
        .map(w => w.date));

    const yapilan = gunSeti.size;
    satirlar.push({
      key: anahtar,
      label: `${formatDay(dayKey(start), 'short')} – ${formatDay(dayKey(end), 'short')}`,
      isCurrent: anahtar === buHafta,
      planned: plananGun,
      done: yapilan,
      // Fazla yapmak uyumu %100'ün üstüne çıkarmıyor: plan uyumu bir
      // "tutturma" ölçüsü, bonus puan yeri değil.
      rate: Math.min(1, yapilan / plananGun),
    });
  }

  // Bu hafta ortalamaya girmiyor: yarısı geçmemiş bir haftayı tam hafta gibi
  // saymak oranı haksız yere düşürür.
  const tamamlanan = satirlar.filter(w => !w.isCurrent);
  const oran = tamamlanan.length > 0
    ? tamamlanan.reduce((t, w) => t + w.rate, 0) / tamamlanan.length
    : 0;

  return {
    hasData: tamamlanan.length > 0,
    plannedPerWeek: plananGun,
    weeks: satirlar,
    rate: Math.round(oran * 100) / 100,
    percent: Math.round(oran * 100),
  };
};

/** Tutarlılık ve uyumun günlük koç satırı. */
export const consistencyCoachItem = (consistency, adherence) => {
  if (!consistency?.hasData) return null;

  // Uyum düşükse asıl mesaj o: program değil, uygulanabilirliği sorun.
  if (adherence?.hasData && adherence.percent < 70) {
    return {
      title: `Plan uyumu %${adherence.percent}`,
      detail: `Haftada ${adherence.plannedPerWeek} gün planlıyorsun, ortalama ${Math.round(adherence.rate * adherence.plannedPerWeek * 10) / 10} gün yapıyorsun. Programı büyütmek yerine gün sayısını gerçekten gelebileceğin sayıya indirmek daha çok kas kazandırır — yapılmayan set hacim değildir.`,
    };
  }

  if (consistency.currentStreak >= 4) {
    return {
      title: `${consistency.currentStreak} hafta kesintisiz`,
      detail: `Haftada ortalama ${consistency.averageDaysPerWeek} gün. Tutarlılık, program seçiminden daha belirleyici bir değişken; bu seriyi korumak tek başına bir kazanç.`,
    };
  }

  return null;
};
