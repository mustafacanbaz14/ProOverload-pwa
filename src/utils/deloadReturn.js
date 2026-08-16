import { parseNumber } from './number.js';
import { toLocalDate, dayKey, formatDay } from './dates.js';

/**
 * Deload sonrası dönüş planı.
 *
 * Deload modu boşaltma haftası boyunca hedefleri ölçekliyordu ve süre dolunca
 * kendiliğinden kapanıyordu. Kapanış anında hiçbir şey söylenmiyordu ve
 * kullanıcı iki hatadan birini yapıyordu:
 *
 *  - Boşaltma öncesi hacme BİR ANDA dönmek. Deloadun kazandırdığı tazelik ilk
 *    seansta harcanıyor ve ikinci hafta yine tükenmiş oluyor.
 *  - Boşaltmayı UZATMAK. Kendini iyi hissettiği için düşük hacimde kalmak,
 *    boşaltmayı fiilen bir hacim düşüşüne çeviriyor.
 *
 * Doğru olan, iki hafta içinde kademeli dönüş: ilk hafta yükü koruyup hacmi
 * kısmen geri getirmek, ikinci hafta tam hacme dönmek. Yük ilk haftada
 * artırılmıyor — deload sonrası performans genelde yükselmiş oluyor ve aynı
 * ağırlıkta daha kolay gelen setler, artışın ne kadar olacağını da söylüyor.
 */

// Dönüş penceresi: deload bittikten sonra bu kadar gün boyunca plan gösteriliyor.
const RETURN_WINDOW_DAYS = 14;

export const RETURN_STEPS = [
  {
    key: 'week1', dayFrom: 0, dayTo: 6,
    label: 'İlk hafta — hacmi geri al',
    setScale: 0.8, loadScale: 1,
    detail: 'Set sayısını boşaltma öncesinin yaklaşık %80\'ine çıkar, ağırlığı deload öncesi seviyede tut. Aynı yük bu hafta daha kolay gelecek; ne kadar kolay geldiği gelecek haftanın artışını belirliyor.',
  },
  {
    key: 'week2', dayFrom: 7, dayTo: 13,
    label: 'İkinci hafta — tam hacim',
    setScale: 1, loadScale: 1.02,
    detail: 'Tam hacme dön. Yükü ancak ilk hafta setler hedef tekrar aralığının üst ucunda ve yedek tekrarla bittiyse artır — his değil, tekrar sayısı karar versin.',
  },
];

/**
 * Deload bitti mi, bittiyse dönüşün neresindeyiz.
 *
 * `deload` ayarı ile `deloadState` çıktısı birlikte okunuyor: durum kapalı ama
 * `expired` ise boşaltma tamamlanmış demek. Kullanıcı ayarı elle kapattıysa
 * `expired` gelmiyor ve plan gösterilmiyor — o durumda deload yarıda
 * kesilmiştir ve kademeli dönüş önermek yanlış olur.
 */
export const buildDeloadReturn = (deload, state, { today = new Date() } = {}) => {
  if (!state?.expired || !deload?.startDate) return { active: false };

  const bas = toLocalDate(deload.startDate);
  const bugun = toLocalDate(dayKey(today));
  if (!bas || !bugun) return { active: false };

  const gunSayisi = Math.max(1, Math.round(parseNumber(deload.days) || 7));
  const bitis = new Date(bas);
  bitis.setDate(bas.getDate() + gunSayisi);

  const gecen = Math.floor((bugun - bitis) / 86400000);
  if (gecen < 0 || gecen >= RETURN_WINDOW_DAYS) return { active: false };

  const step = RETURN_STEPS.find(s => gecen >= s.dayFrom && gecen <= s.dayTo) || RETURN_STEPS[1];

  return {
    active: true,
    dayIndex: gecen + 1,
    totalDays: RETURN_WINDOW_DAYS,
    step,
    endedOn: dayKey(bitis),
    endedLabel: formatDay(dayKey(bitis), 'short', { weekday: true }),
    preset: state.preset,
    daysLeft: RETURN_WINDOW_DAYS - gecen,
  };
};

/** Dönüş planına göre bir hareketin önerilen set sayısı. */
export const returnSets = (normalSets, plan) => {
  const n = Math.round(parseNumber(normalSets));
  if (!plan?.active || !(n > 0)) return n;
  return Math.max(1, Math.round(n * plan.step.setScale));
};

/** Dönüş planının günlük koç satırı. */
export const deloadReturnCoachItem = (plan) => {
  if (!plan?.active) return null;
  return {
    key: 'deload-return',
    title: `Deload bitti — ${plan.step.label.toLowerCase()}`,
    detail: `Boşaltma ${plan.endedLabel} tarihinde tamamlandı. ${plan.step.detail} Bir anda eski hacme dönmek deloadun kazandırdığı tazeliği ilk seansta harcıyor; düşük hacimde kalmak ise boşaltmayı bir hacim düşüşüne çeviriyor.`,
  };
};
