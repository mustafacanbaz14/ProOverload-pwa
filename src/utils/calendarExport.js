import { WEEKDAY_KEYS } from './programDraft.js';
import { estimateDuration } from './templates.js';

/**
 * Haftalık planı takvim dosyasına (.ics) aktarma.
 *
 * Plan uygulamanın içinde duruyordu ve kullanıcının hayatının geri kalanı
 * başka bir takvimde. Antrenman saatini telefonun takvimine elle girmek
 * gerekiyordu; girilmediğinde de program günlük akışın dışında kalıyordu.
 *
 * Çıktı bir DOSYA, bir servis çağrısı değil: uygulama çevrimdışı çalışıyor ve
 * hiçbir veri dışarı gitmiyor. Dosya telefonun takvim uygulamasına
 * aktarılıyor.
 *
 * Etkinlikler HAFTALIK TEKRARLI (RRULE): her hafta ayrı etkinlik üretmek
 * takvimi doldururdu ve plan değiştiğinde eskilerini temizlemek imkânsız
 * olurdu. Tek bir tekrarlı etkinlik, tek bir silme işlemiyle kalkıyor.
 */

// ICS'te satır sonu CRLF olmak zorunda (RFC 5545); LF ile bazı takvim
// uygulamaları dosyayı hiç okumuyor.
const CRLF = '\r\n';

const ICS_DAYS = { mon: 'MO', tue: 'TU', wed: 'WE', thu: 'TH', fri: 'FR', sat: 'SA', sun: 'SU' };

/** Metni ICS kurallarına göre kaçırır: virgül, noktalı virgül ve ters bölü. */
const kacir = (text) => String(text || '')
  .replace(/\\/g, '\\\\')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,')
  .replace(/\r?\n/g, '\\n');

/** ICS zaman damgası: yerel saat, saat dilimi belirtmeden (floating time). */
const zaman = (date, hhmm) => {
  const [saat, dakika] = String(hhmm || '18:00').split(':').map(n => parseInt(n, 10) || 0);
  const d = new Date(date);
  d.setHours(saat, dakika, 0, 0);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
};

/** Bir sonraki verilen haftanın gününü bulur (bugün dahil). */
const sonrakiGun = (weekdayKey, from = new Date()) => {
  const hedef = WEEKDAY_KEYS.indexOf(weekdayKey);
  if (hedef < 0) return null;
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const bugun = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() + ((hedef - bugun + 7) % 7));
  return d;
};

/**
 * Haftalık plandan .ics içeriği üretir.
 *
 * @param plan     { name, days }
 * @param templates şablon listesi
 * @returns { text, events, filename } | null
 */
export const planToIcs = (plan, templates = [], {
  defaultTime = '18:00', restSeconds = 120, today = new Date(), weeks = 12,
} = {}) => {
  if (!plan?.days) return null;
  const byId = new Map((templates || []).map(t => [t.id, t]));

  const events = [];
  WEEKDAY_KEYS.forEach(key => {
    (plan.days[key] || []).filter(x => x?.type === 'workout').forEach((slot, i) => {
      const t = byId.get(slot.templateId);
      // Şablonu silinmiş slot takvime yazılmıyor: adı olmayan bir etkinlik
      // kullanıcıya hiçbir şey söylemez.
      if (!t) return;
      const baslangic = sonrakiGun(key, today);
      if (!baslangic) return;
      const dakika = Math.max(20, Math.round(estimateDuration(t.exercises, restSeconds)));
      events.push({
        uid: `po-${plan.id || 'plan'}-${key}-${i}@prooverload`,
        weekday: key,
        icsDay: ICS_DAYS[key],
        start: zaman(baslangic, slot.time || defaultTime),
        minutes: dakika,
        title: t.name,
        sets: (t.exercises || []).reduce((s, ex) => s + (ex.sets || []).length, 0),
        exercises: (t.exercises || []).map(ex => ex.name),
      });
    });
  });

  if (events.length === 0) return null;

  const damga = zaman(today, '00:00');
  const satirlar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ProOverload//Antrenman Plani//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${kacir(plan.name || 'Antrenman Planı')}`,
  ];

  events.forEach(e => {
    const bitis = (() => {
      const d = new Date(
        Number(e.start.slice(0, 4)), Number(e.start.slice(4, 6)) - 1, Number(e.start.slice(6, 8)),
        Number(e.start.slice(9, 11)), Number(e.start.slice(11, 13)),
      );
      d.setMinutes(d.getMinutes() + e.minutes);
      const p = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
    })();

    satirlar.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${damga}`,
      `DTSTART:${e.start}`,
      `DTEND:${bitis}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${e.icsDay};COUNT=${Math.max(1, weeks)}`,
      `SUMMARY:${kacir(e.title)}`,
      `DESCRIPTION:${kacir(`${e.sets} set · ${e.exercises.length} hareket\n${e.exercises.join('\n')}`)}`,
      'END:VEVENT',
    );
  });

  satirlar.push('END:VCALENDAR');

  return {
    text: satirlar.join(CRLF) + CRLF,
    events,
    filename: `ProOverload_${(plan.name || 'plan').replace(/[^\wğüşıöçĞÜŞİÖÇ -]/g, '')}.ics`,
  };
};
