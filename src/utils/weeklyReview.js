import { parseNumber } from './number.js';
import { MUSCLE_GROUPS, getVolumeLandmarks, volumeStatusOf } from './constants.js';
import { detectMuscleGroup, isCompletedWorkingSet, calcTonnage, calcEffectiveSets } from './helpers.js';
import { weekBounds, dayKey, formatRange } from './dates.js';
import { computeSleepScore } from './wellness.js';

/**
 * Haftalık gözden geçirme.
 *
 * Günlük koç "bugün ne yapmalıyım" sorusunu cevaplıyor; haftalık kararlar
 * (hacim artır/azalt, deload, kalori ayarı) günlük ölçekte görünmüyor çünkü tek
 * gün gürültülü. Burası haftayı kapatıp bir sonrakine SOMUT ayar önerisi
 * üretiyor.
 *
 * Varsayılan olarak GEÇEN tam haftaya bakıyor: içinde bulunulan hafta henüz
 * bitmediği için "hacim eksik" demek yanıltıcı olurdu.
 */

/** Verilen haftanın pazartesi anahtarını üretir; yoksa geçen tam hafta. */
export const lastCompletedWeekStart = (today = new Date()) => {
  const buHafta = weekBounds(dayKey(today));
  const gecen = new Date(buHafta.start);
  gecen.setDate(gecen.getDate() - 7);
  return dayKey(gecen);
};

const withinWeek = (date, startKey, endKey) => date >= startKey && date <= endKey;

/**
 * @param opts.weekStart       'YYYY-MM-DD' pazartesi; verilmezse geçen tam hafta
 * @param opts.workouts        tüm antrenmanlar
 * @param opts.planDays        computeWeekPlan(...).days — planlanan hafta
 * @param opts.wellness        uyku/zihin kayıtları
 * @param opts.energyWeeks     groupByWeek çıktısı (kalori dengesi için)
 * @param opts.nutritionGoal   'cut' | 'bulk' | 'maintain'
 */
export const buildWeeklyReview = ({
  weekStart,
  workouts = [],
  customExercises = [],
  experienceLevel = 'intermediate',
  planDays = [],
  wellness = [],
  energyWeeks = [],
  nutritionGoal = 'bulk',
  today = new Date(),
} = {}) => {
  const basKey = weekStart || lastCompletedWeekStart(today);
  const sinir = weekBounds(basKey);
  if (!sinir) return null;
  const { startKey, endKey } = sinir;

  const haftaninSeanslari = workouts.filter(w => withinWeek(w.date, startKey, endKey));
  const agirlikSeanslari = haftaninSeanslari.filter(w => (w.exercises || []).length > 0);

  // Önceki hafta, kıyas için: "arttı mı azaldı mı" sorusu tek haftadan çıkmaz.
  const oncekiBas = new Date(sinir.start);
  oncekiBas.setDate(oncekiBas.getDate() - 7);
  const oncekiSinir = weekBounds(dayKey(oncekiBas));
  const oncekiSeanslar = workouts.filter(w =>
    withinWeek(w.date, oncekiSinir.startKey, oncekiSinir.endKey) && (w.exercises || []).length > 0);

  const hacimHesapla = (list) => {
    const out = {};
    list.forEach(w => (w.exercises || []).forEach(ex => {
      const sets = (ex.sets || []).filter(isCompletedWorkingSet).length;
      if (sets === 0) return;
      const { contributions } = detectMuscleGroup(ex.name, customExercises);
      Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
        out[kas] = Math.round(((out[kas] || 0) + sets * agirlik) * 4) / 4;
      });
    }));
    return out;
  };

  const muscleVolume = hacimHesapla(agirlikSeanslari);
  const oncekiHacim = hacimHesapla(oncekiSeanslar);

  const statuses = MUSCLE_GROUPS.map(muscle => {
    const volume = parseNumber(muscleVolume[muscle]);
    const { mev, mav, mrv } = getVolumeLandmarks(muscle, experienceLevel);
    return {
      muscle, volume, mev, mav, mrv,
      status: volumeStatusOf(volume, muscle, experienceLevel),
      change: Math.round((volume - parseNumber(oncekiHacim[muscle])) * 4) / 4,
    };
  });

  const under = statuses.filter(s => s.status === 'under' || s.status === 'none');
  const over = statuses.filter(s => s.status === 'over');
  const optimal = statuses.filter(s => s.status === 'optimal');

  /* --- plan uyumu --- */
  const planliGun = planDays.filter(d => !d.isOffDay).length;
  const yapilanGun = new Set(agirlikSeanslari.map(w => w.date)).size;

  /* --- toparlanma --- */
  const geceler = wellness
    .filter(r => withinWeek(r.date, startKey, endKey) && r.sleep)
    .map(r => computeSleepScore(r.sleep))
    .filter(Boolean);
  const uykuOrt = geceler.length
    ? Math.round(geceler.reduce((s, x) => s + x.score, 0) / geceler.length)
    : null;
  const uykuSureOrt = geceler.length
    ? Math.round(geceler.reduce((s, x) => s + (x.asleep || 0), 0) / geceler.length)
    : null;

  const hazirSkorlar = agirlikSeanslari
    .map(w => parseNumber(w.readiness?.score))
    .filter(v => v > 0);
  const hazirOrt = hazirSkorlar.length
    ? Math.round(hazirSkorlar.reduce((s, v) => s + v, 0) / hazirSkorlar.length)
    : null;

  /* --- enerji --- */
  const enerji = energyWeeks.find(w => w.weekStart === startKey) || null;

  const ozet = {
    range: formatRange(startKey, endKey),
    startKey,
    endKey,
    training: {
      sessions: agirlikSeanslari.length,
      days: yapilanGun,
      plannedDays: planliGun,
      effectiveSets: agirlikSeanslari.reduce((s, w) => s + calcEffectiveSets(w.exercises), 0),
      tonnage: agirlikSeanslari.reduce((s, w) => s + calcTonnage(w.exercises), 0),
      previousSessions: oncekiSeanslar.length,
      previousEffectiveSets: oncekiSeanslar.reduce((s, w) => s + calcEffectiveSets(w.exercises), 0),
      adaptedSessions: agirlikSeanslari.filter(w => w.adaptation).length,
      recoverySessions: agirlikSeanslari.filter(w => w.adaptation?.mode === 'recovery').length,
    },
    volume: { statuses, under, over, optimal, muscleVolume },
    recovery: { sleepScore: uykuOrt, sleepMinutes: uykuSureOrt, nights: geceler.length, readiness: hazirOrt },
    energy: enerji,
    hasData: agirlikSeanslari.length > 0 || geceler.length > 0 || Boolean(enerji),
  };

  return { ...ozet, adjustments: ayarlar(ozet, nutritionGoal) };
};

/**
 * Bir sonraki hafta için somut ayarlar.
 *
 * "Daha çok çalış" gibi öğüt yok; her madde sayı içeriyor çünkü kullanıcı bu
 * ekrandan çıkıp programı düzenleyecek ve ne kadar değiştireceğini bilmesi
 * gerekiyor. Sıra önemli: aynı hafta hem hacim ekleyip hem deload yapmak
 * çelişir, bu yüzden toparlanma sinyali hacim artışını bastırıyor.
 */
const ayarlar = (ozet, nutritionGoal) => {
  const out = [];
  const { training, volume, recovery, energy } = ozet;

  if (!ozet.hasData) {
    return [{
      key: 'no-data', tone: 'info',
      title: 'Bu haftaya ait kayıt yok',
      detail: 'Antrenman, uyku veya beslenme kaydı girilmemiş. Gözden geçirme bir sonraki haftadan itibaren anlam kazanır.',
    }];
  }

  // Toparlanma sorunu varsa hacim artışı önerilmez.
  const toparlanmaSorunu = (recovery.readiness !== null && recovery.readiness < 50)
    || (recovery.sleepMinutes !== null && recovery.sleepMinutes < 380)
    || training.adaptedSessions >= 2;

  if (volume.over.length > 0) {
    const isim = volume.over.map(s => s.muscle).slice(0, 3).join(', ');
    out.push({
      key: 'over', tone: 'warn',
      title: `${isim} tavanın üstünde`,
      detail: `${volume.over.map(s => `${s.muscle} ${s.volume} set (MRV ${s.mrv})`).join(', ')}. Gelecek hafta bu bölgelerde 3-4 set azalt; tavanın üstünde kalan hacim gelişme değil birikmiş yorgunluk üretir.`,
    });
  }

  if (toparlanmaSorunu) {
    const sebep = [];
    if (recovery.readiness !== null && recovery.readiness < 50) sebep.push(`hazır oluşluk ortalaması ${recovery.readiness}/100`);
    if (recovery.sleepMinutes !== null && recovery.sleepMinutes < 380) sebep.push(`uyku ortalaması ${Math.floor(recovery.sleepMinutes / 60)} sa ${recovery.sleepMinutes % 60} dk`);
    if (training.adaptedSessions >= 2) sebep.push(`${training.adaptedSessions} seans hazır oluşluğa göre azaltıldı`);
    out.push({
      key: 'recovery', tone: 'warn',
      title: 'Önce toparlanma, sonra hacim',
      detail: `${sebep.join(' ve ')}. Hacim eklemek yerine gelecek hafta mevcut hacmi koru; uyku 7 saatin üstüne çıkana kadar yük artırmak çoğunlukla geri tepiyor.`,
    });
  } else if (volume.under.length > 0) {
    const eksik = volume.under.slice(0, 3);
    out.push({
      key: 'under', tone: 'info',
      title: `${eksik.map(s => s.muscle).join(', ')} koruma eşiğinin altında`,
      detail: `${eksik.map(s => `${s.muscle} ${s.volume}/${s.mev}`).join(', ')}. Eksik olan set sayısı toplamda ${eksik.reduce((s, x) => s + Math.max(0, Math.ceil(x.mev - x.volume)), 0)}; bunu bir güne yığmak yerine iki güne bölmek daha iyi tolere edilir.`,
    });
  } else if (volume.optimal.length > 0 && volume.over.length === 0) {
    out.push({
      key: 'progress', tone: 'good',
      title: 'Hacim verimli aralıkta',
      detail: 'Bütün bölgeler MEV–MAV arasında. Hacmi artırmak yerine aynı hacimde ağırlık/tekrar üzerinden ilerlemek bu noktada daha verimli; hacim ancak ilerleme durduğunda artırılır.',
    });
  }

  if (training.plannedDays > 0 && training.days < training.plannedDays) {
    out.push({
      key: 'adherence', tone: 'warn',
      title: `Planda ${training.plannedDays} gün vardı, ${training.days} gün yapıldı`,
      detail: training.plannedDays - training.days >= 2
        ? 'İki günden fazla sapma programın kendisiyle ilgili olabilir: haftada kaç güne gerçekten vakit ayırabildiğine göre planı küçültmek, her hafta eksik kapatmaktan daha iyi sonuç veriyor.'
        : 'Tek gün sapma normal. Kaçan günü telafi etmek yerine bir sonraki haftaya normal devam et.',
    });
  }

  if (energy && energy.days >= 5) {
    const kg = energy.kg;
    const yon = nutritionGoal === 'cut' ? -1 : nutritionGoal === 'bulk' ? 1 : 0;
    const uyumsuz = yon !== 0 && Math.sign(kg) !== yon && Math.abs(kg) > 0.1;
    if (uyumsuz) {
      out.push({
        key: 'energy', tone: 'warn',
        title: `Kalori dengesi hedefin ters yönünde (${kg > 0 ? '+' : ''}${kg} kg)`,
        detail: nutritionGoal === 'cut'
          ? `Haftalık denge ${energy.balance} kcal fazla. Kesme döneminde günlük alımı yaklaşık ${Math.round(Math.abs(energy.balance) / 7)} kcal düşürmek dengeyi hedefe çevirir.`
          : `Haftalık denge ${energy.balance} kcal açık. Kütle döneminde günlük alımı yaklaşık ${Math.round(Math.abs(energy.balance) / 7)} kcal artırmak gerekir.`,
      });
    } else if (Math.abs(kg) > 0.9) {
      out.push({
        key: 'energy-fast', tone: 'warn',
        title: `Değişim hızı yüksek (${kg > 0 ? '+' : ''}${kg} kg/hafta)`,
        detail: nutritionGoal === 'cut'
          ? 'Haftada 1 kg üstü kayıp yağsız kütle kaybı riskini artırır. Açığı yaklaşık yarıya indirmek kas korumasını iyileştirir.'
          : 'Haftada 1 kg üstü alım büyük ölçüde yağ olarak birikir. Fazlayı yarıya indirmek kazanımın kalitesini artırır.',
      });
    }
  }

  if (recovery.nights > 0 && recovery.nights < 4) {
    out.push({
      key: 'sleep-data', tone: 'info',
      title: `Bu hafta ${recovery.nights} gece uyku kaydı var`,
      detail: 'Uyku ortalaması dört geceden az kayıtla güvenilir değil; toparlanma önerileri de bu yüzden zayıf kalıyor.',
    });
  }

  return out;
};
