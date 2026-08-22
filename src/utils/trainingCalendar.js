import { parseNumber } from './number.js';
import { isWorkingSet, getLocalDateString } from './helpers.js';
import { toLocalDate } from './dates.js';

/**
 * Yıllık antrenman takvimi.
 *
 * Tutarlılık kartı sayılarla anlatıyordu: haftada kaç gün, kaç hafta üst üste.
 * Doğru ama soyut. Aynı veriyi gün gün bir ızgarada göstermek, sayının
 * söyleyemediğini söylüyor — nerede boşluk var, hangi ay çöktü, tatil sonrası
 * ne kadar sürdü toparlanmak. Uzun vadeli sürekliliği tek bakışta gösteren
 * şey bu.
 *
 * Yoğunluk ETKİLİ SETLE ölçülüyor, seans sayısıyla değil: yirmi dakikalık bir
 * tamamlama seansıyla iki saatlik bacak gününü aynı renkte göstermek, ızgarayı
 * "gittim/gitmedim" tablosuna indirger ve asıl bilgiyi siler.
 */

// Yoğunluk basamakları (etkili set). Sınırlar tipik bir seansın etrafında
// seçildi: 1-8 hafif/tamamlama, 9-16 normal, 17-24 ağır, 25+ çok ağır.
const LEVELS = [0, 8, 16, 24];

export const intensityLevel = (sets) => {
  if (sets <= 0) return 0;
  if (sets <= LEVELS[1]) return 1;
  if (sets <= LEVELS[2]) return 2;
  if (sets <= LEVELS[3]) return 3;
  return 4;
};

export const LEVEL_LABELS = ['yok', 'hafif', 'normal', 'ağır', 'çok ağır'];

/** Bir günün toplam etkili seti (ısınma sayılmıyor). */
const gunSetleri = (workout) => (workout?.exercises || [])
  .reduce((t, ex) => t + (ex.sets || [])
    .filter(s => isWorkingSet(s) && parseNumber(s.reps) > 0).length, 0);

/**
 * Gün gün ızgara: son N hafta, pazartesiden başlayan tam haftalar.
 *
 * Izgara tam haftalarla hizalanıyor; yarım hafta ile başlayan bir tablo
 * sütunları kaydırıyor ve "salıları hep boş" gibi olmayan bir örüntü
 * gösteriyordu.
 */
export const buildTrainingCalendar = (workouts = [], { weeks = 26, today = new Date() } = {}) => {
  const gunler = new Map();
  let toplamSet = 0;

  (workouts || []).forEach(w => {
    if (!w?.date) return;
    const setler = gunSetleri(w);
    const mevcut = gunler.get(w.date) || { date: w.date, sets: 0, sessions: 0, names: [] };
    mevcut.sets += setler;
    mevcut.sessions += 1;
    if (w.name) mevcut.names.push(w.name);
    gunler.set(w.date, mevcut);
    toplamSet += setler;
  });

  // Bu haftanın pazartesisi (JS'te pazar 0; pazartesi başlangıcına çeviriliyor).
  const bugun = new Date(today);
  bugun.setHours(0, 0, 0, 0);
  const haftaninGunu = (bugun.getDay() + 6) % 7;
  const buHaftaPzt = new Date(bugun);
  buHaftaPzt.setDate(bugun.getDate() - haftaninGunu);

  const baslangic = new Date(buHaftaPzt);
  baslangic.setDate(buHaftaPzt.getDate() - (weeks - 1) * 7);

  const bugunStr = getLocalDateString(bugun);
  const sutunlar = [];
  for (let h = 0; h < weeks; h += 1) {
    const hafta = [];
    for (let g = 0; g < 7; g += 1) {
      const d = new Date(baslangic);
      d.setDate(baslangic.getDate() + h * 7 + g);
      const key = getLocalDateString(d);
      const kayit = gunler.get(key);
      hafta.push({
        date: key,
        sets: kayit?.sets || 0,
        sessions: kayit?.sessions || 0,
        names: kayit?.names || [],
        level: intensityLevel(kayit?.sets || 0),
        future: key > bugunStr,
        today: key === bugunStr,
        month: d.getMonth(),
      });
    }
    sutunlar.push(hafta);
  }

  const gorunen = sutunlar.flat().filter(d => !d.future);
  const calisilan = gorunen.filter(d => d.sessions > 0);

  return {
    weeks: sutunlar,
    hasData: calisilan.length > 0,
    totalDays: calisilan.length,
    totalSets: toplamSet,
    windowDays: gorunen.length,
    // En uzun kesintisiz hafta serisi: her hafta en az bir seans.
    streakWeeks: (() => {
      let en = 0;
      let simdi = 0;
      sutunlar.forEach(hafta => {
        const gecmisGunler = hafta.filter(d => !d.future);
        if (gecmisGunler.length === 0) return;
        if (gecmisGunler.some(d => d.sessions > 0)) { simdi += 1; en = Math.max(en, simdi); }
        else simdi = 0;
      });
      return en;
    })(),
    // En uzun ara: arka arkaya kaç gün boş geçti.
    longestGap: (() => {
      let en = 0;
      let simdi = 0;
      gorunen.forEach(d => {
        if (d.sessions > 0) simdi = 0;
        else { simdi += 1; en = Math.max(en, simdi); }
      });
      return en;
    })(),
    averagePerWeek: sutunlar.length > 0
      ? Math.round((calisilan.length / Math.max(1, sutunlar.filter(h => h.some(d => !d.future)).length)) * 10) / 10
      : 0,
  };
};

/** Ay etiketleri: ızgaranın üstüne, ayın ilk haftasına hizalı. */
export const calendarMonthLabels = (calendar) => {
  const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const etiketler = [];
  let sonAy = -1;
  (calendar?.weeks || []).forEach((hafta, i) => {
    const ay = hafta[0]?.month;
    if (ay !== sonAy) {
      etiketler.push({ index: i, label: AYLAR[ay] || '' });
      sonAy = ay;
    }
  });
  return etiketler;
};

/** Bir günün insan okunur özeti (dokunulduğunda gösterilecek). */
export const describeCalendarDay = (day) => {
  if (!day || day.sessions === 0) return null;
  const tarih = toLocalDate(day.date);
  return {
    date: day.date,
    label: tarih ? tarih.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }) : day.date,
    sets: day.sets,
    sessions: day.sessions,
    names: [...new Set(day.names)],
    level: LEVEL_LABELS[day.level],
  };
};
