/**
 * Antrenman hedefi modu.
 *
 * Uygulamanın bütün varsayılanları HİPERTROFİYE göre ayarlıydı: 6-10 tekrar,
 * 120 saniye dinlenme, RIR 2 hedefi, çift ilerleme. Doğru bir varsayılan ama
 * tek varsayılan. Aynı kişi bir blok kuvvete, bir blok dayanıklılığa
 * çalışabiliyor ve o zaman altı ayrı ayarı elle değiştirmesi gerekiyordu —
 * biri unutulduğunda sistem kendi içinde çelişiyordu (5 tekrar hedefi ama
 * 90 saniye dinlenme gibi).
 *
 * Hedef modu bu ayarları TEK YERDEN kaydırıyor. Kaydırma bir dayatma değil:
 * kullanıcının elle yazdığı her değer (hareket bazlı aralık, şablon aralığı)
 * moddan üstün kalıyor. Mod yalnızca VARSAYILANI değiştiriyor.
 */

export const TRAINING_GOALS = {
  hypertrophy: {
    key: 'hypertrophy',
    label: 'Hipertrofi',
    short: 'Kas',
    repRange: { min: 6, max: 12 },
    restSeconds: 120,
    rirTarget: 2,
    progression: 'double',
    hint: 'Kas büyümesi',
    detail: 'Orta tekrar, orta dinlenme, tükenişe birkaç tekrar kala bitirme. Hacim en önemli değişken; uygulamanın varsayılan modu bu.',
  },
  strength: {
    key: 'strength',
    label: 'Kuvvet',
    short: 'Güç',
    repRange: { min: 3, max: 6 },
    restSeconds: 210,
    rirTarget: 2,
    progression: 'linear',
    hint: 'Maksimum güç',
    detail: 'Düşük tekrar, uzun dinlenme. Uzun dinlenme burada bir tercih değil şart: ağır setler arasında sinir sistemi toparlanmazsa sonraki set yükü kaldıramıyor ve uyaran kaybı hacim kaybından büyük oluyor.',
  },
  endurance: {
    key: 'endurance',
    label: 'Dayanıklılık',
    short: 'Day.',
    repRange: { min: 15, max: 25 },
    restSeconds: 60,
    rirTarget: 1,
    progression: 'double',
    hint: 'Kas dayanıklılığı',
    detail: 'Yüksek tekrar, kısa dinlenme. Hedef yedek tekrar bire iniyor çünkü yüksek tekrarda tükenişe yaklaşmadan uyaran oluşmuyor.',
  },
  maintain: {
    key: 'maintain',
    label: 'Koruma',
    short: 'Koru',
    repRange: { min: 8, max: 12 },
    restSeconds: 120,
    rirTarget: 3,
    progression: 'fixed',
    hint: 'Kazanımı koru',
    detail: 'Yoğun bir dönemde, sakatlık sonrasında ya da kalori açığında kazanımı korumak için. Yedek tekrar üçe çıkıyor ve ilerleme kuralı sabit: amaç ilerlemek değil, kaybetmemek. Koruma için gereken hacim büyüme için gerekenin belirgin altında.',
  },
};

export const TRAINING_GOAL_KEYS = Object.keys(TRAINING_GOALS);

export const findTrainingGoal = (key) => TRAINING_GOALS[key] || TRAINING_GOALS.hypertrophy;

/**
 * Modun getirdiği varsayılanlar, kullanıcının açık tercihleriyle birleşmiş
 * hali.
 *
 * `explicit` içindeki her alan moddan ÜSTÜN: kullanıcı bir değeri elle
 * yazdıysa mod onu ezmemeli. Mod değiştirmek elle yapılmış ayarları silmek
 * anlamına gelseydi, mod denemek pahalı bir iş olurdu.
 */
export const goalDefaults = (goalKey, explicit = {}) => {
  const hedef = findTrainingGoal(goalKey);
  return {
    goal: hedef,
    repRangeMin: explicit.repRangeMin ?? hedef.repRange.min,
    repRangeMax: explicit.repRangeMax ?? hedef.repRange.max,
    restSeconds: explicit.restSeconds ?? hedef.restSeconds,
    rirTarget: explicit.rirTarget ?? hedef.rirTarget,
    progression: explicit.progression ?? hedef.progression,
  };
};

/**
 * Mod değiştirildiğinde ayarlara yazılacak yama.
 *
 * Yalnızca modun kendi alanları yazılıyor; hareket bazlı aralıklar
 * (`repRangeOverrides`) ve şablon aralıkları hiç ellenmiyor.
 */
export const applyTrainingGoal = (settings = {}, goalKey) => {
  const hedef = findTrainingGoal(goalKey);
  return {
    ...settings,
    trainingGoal: hedef.key,
    repRangeMin: hedef.repRange.min,
    repRangeMax: hedef.repRange.max,
    restSeconds: hedef.restSeconds,
  };
};

/** Mod ile mevcut ayarlar arasında çelişki var mı. */
export const auditGoalConsistency = (settings = {}) => {
  const hedef = findTrainingGoal(settings.trainingGoal);
  const findings = [];

  const min = Number(settings.repRangeMin);
  const max = Number(settings.repRangeMax);
  if (min > 0 && max > 0 && (max < hedef.repRange.min || min > hedef.repRange.max)) {
    findings.push({
      key: 'rep-range',
      title: `Tekrar aralığı ${hedef.label} moduyla uyuşmuyor`,
      detail: `Genel aralık ${min}-${max}, ${hedef.label} modu ${hedef.repRange.min}-${hedef.repRange.max} bekliyor. İkisi birlikte çalışabilir ama bilerek seçilmiş olmalı.`,
    });
  }

  const dinlenme = Number(settings.restSeconds);
  // Yarıdan fazla sapma çelişki sayılıyor; küçük farklar kişisel tercih.
  if (dinlenme > 0 && Math.abs(dinlenme - hedef.restSeconds) > hedef.restSeconds * 0.5) {
    findings.push({
      key: 'rest',
      title: `Dinlenme süresi ${hedef.label} moduyla uyuşmuyor`,
      detail: `Ayarlı süre ${dinlenme} sn, ${hedef.label} modu ${hedef.restSeconds} sn civarını bekliyor. ${hedef.key === 'strength' ? 'Kuvvet modunda kısa dinlenme, ağır setlerin yükünü düşürüyor.' : 'Uzun dinlenme yüksek tekrarlı çalışmanın metabolik uyaranını azaltıyor.'}`,
    });
  }

  return { ok: findings.length === 0, findings, goal: hedef };
};
