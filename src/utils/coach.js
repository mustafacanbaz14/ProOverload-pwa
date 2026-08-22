import { parseNumber } from './number.js';
import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';

/**
 * Günün koçu — sıralanmış eylem listesi.
 *
 * Ana ekrandaki koç kartı tek cümle söylüyordu ("planın hazır"), ama günün asıl
 * kararı çoğu zaman başka yerde: uykun kötüyse plan hazır olması bir şey ifade
 * etmiyor, ya da haftanın son günü gelmiş ve iki kas hâlâ MEV altında.
 *
 * Burası o sinyalleri tek yerde toplayıp önceliklendiriyor. Her madde tek bir
 * SOMUT eylem söylüyor; "daha iyi beslen" gibi genel öğütler yok, çünkü onlar
 * kullanıcının o an ne yapacağını değiştirmiyor.
 *
 * Öncelik ölçeği:
 *   1 — bugünü değiştirir (sakatlık/toparlanma riski, planın kendisi)
 *   2 — bu haftayı değiştirir (hacim açığı, plan sapması)
 *   3 — bilgi ve fırsat (rekor denemesi, veri eksiği)
 */

const TONES = {
  danger: { key: 'danger', text: 'text-red-400', chip: 'border-red-900/50 bg-red-950/25' },
  warn: { key: 'warn', text: 'text-amber-400', chip: 'border-amber-900/50 bg-amber-950/20' },
  info: { key: 'info', text: 'text-cyan-400', chip: 'border-cyan-900/50 bg-cyan-950/20' },
  good: { key: 'good', text: 'text-emerald-400', chip: 'border-emerald-900/50 bg-emerald-950/20' },
};

export const COACH_TONES = TONES;

/** Haftanın kaçıncı günündeyiz (pazartesi = 1, pazar = 7). */
const haftaninGunu = (d = new Date()) => (d.getDay() === 0 ? 7 : d.getDay());

/**
 * @param ctx.readiness        readinessTrend çıktısı
 * @param ctx.sleep            computeSleepScore çıktısı (bu gece)
 * @param ctx.lastReadiness    son antrenmanın hazır oluşluk formu (eklem ağrısı için)
 * @param ctx.planDay          computeWeekPlan'ın bugünkü günü
 * @param ctx.doneToday        bugün kaydedilmiş antrenman sayısı
 * @param ctx.conflict         analyzeDayConflicts çıktısı
 * @param ctx.macros           bugünün makroları
 * @param ctx.targetProtein    hedef protein (g)
 * @param ctx.calorieRemaining hedefe göre kalan kcal (negatif = aşıldı)
 * @param ctx.muscleVolume     bu haftaki gerçekleşen hacim
 * @param ctx.experienceLevel  MEV/MAV eşikleri için
 * @param ctx.acwr             { acwr, hasEnoughData, nearCeiling }
 * @param ctx.daysSinceMetric  son ölçümden bu yana geçen gün
 * @param ctx.plateaus         buildPlateauInsights çıktısı
 */
export const buildCoachActions = (ctx = {}, now = new Date()) => {
  const {
    readiness, sleep, lastReadiness, planDay, doneToday = 0, conflict,
    macros = {}, targetProtein = 0, calorieRemaining = null,
    muscleVolume = {}, experienceLevel = 'intermediate',
    acwr, daysSinceMetric = null, plateaus = [], frequencyItem = null,
    deload = null, deloadSuggestion = null, gender = 'male', cycle = null,
    mesocycleItem = null, selectionItem = null, coachProtocol = null,
    painItem = null, balanceItem = null, consistencyItem = null, dataHealthItem = null,
    projectionItem = null, prItem = null, rirItem = null, orderItem = null,
    cardioItem = null,
    standardsItem = null, effortItem = null, rotationItem = null,
    ratioItem = null, returnItem = null, periItem = null, restingHrItem = null,
    painGuardItem = null,
    plateauItem = null,
    restQualityItem = null,
    timeOfDayItem = null,
    techniqueItem = null,
    exerciseOrderItem = null,
    frequencyPlanItem = null,
  } = ctx;

  const items = [];
  const ekle = (item) => items.push(item);

  /* --- 1. öncelik: bugünü değiştirenler --- */

  // Eklem ağrısı en son seansta yüksekse, hacim/uyku iyi olsa bile önce bu.
  const eklem = parseNumber(lastReadiness?.jointPain);
  if (eklem >= 7) {
    ekle({
      key: 'joint', priority: 1, tone: TONES.danger, action: 'workout',
      title: 'Eklem ağrısı yüksek kaydedilmiş',
      detail: 'Son seansta eklem ağrın 7+. Eklem ağrısı kas ağrısıyla aynı sinyal değildir. Bugün ağrısız hareket aralığı ve daha kolay kontrol edilen bir varyant seç; ağrı sürüyorsa yükü zorlamadan değerlendirme al.',
    });
  }

  // Ağrı koruması 1. öncelik: bugünkü programda ağrılı bölgeyi yükleyen
  // hareketler varsa, karar sete girmeden önce verilmeli.
  if (painGuardItem) {
    ekle({
      key: 'pain-guard', priority: 1, tone: TONES.warn, action: 'workout',
      title: painGuardItem.title,
      detail: painGuardItem.detail,
    });
  }

  // Durgunluk 2. öncelik: haftalardır ilerlemeyen bir harekette yapılacak şey
  // daha çok denemek değil değiştirmek, ve bu karar seans planından önce
  // verilmeli.
  if (plateauItem) {
    ekle({
      key: 'plateau', priority: 2, tone: plateauItem.tone === 'warn' ? TONES.warn : TONES.info, action: 'progress',
      title: plateauItem.title,
      detail: plateauItem.detail,
    });
  }

  // Teknik aşırı kullanımı: hacmin yerini almaya başladıysa toparlanmayı yiyor.
  if (techniqueItem) {
    ekle({
      key: 'technique-overuse', priority: 3, tone: TONES.warn, action: 'progress',
      title: techniqueItem.title,
      detail: techniqueItem.detail,
    });
  }

  // Dinlenme kalitesi ve günün saati: ikisi de "aynı emekle daha iyi sonuç"
  // maddeleri, o yüzden düşük öncelikli — acil bir şey söylemiyorlar.
  if (restQualityItem) {
    ekle({
      key: 'rest-quality', priority: 6, tone: TONES.info, action: 'progress',
      title: restQualityItem.title,
      detail: restQualityItem.detail,
    });
  }

  if (timeOfDayItem) {
    ekle({
      key: 'time-of-day', priority: 7, tone: TONES.info, action: 'progress',
      title: timeOfDayItem.title,
      detail: timeOfDayItem.detail,
    });
  }

  // Hareket sırası: aynı liste farklı sırayla farklı sonuç veriyor. Düşük
  // öncelikli, çünkü sıralamanın tek doğrusu yok ve bilinçli tercihler bu
  // kalıplara benziyor.
  // Sıklık planı: hacim tablosu yeterli derken tek güne yığılmış kaslar.
  if (frequencyPlanItem) {
    ekle({
      key: 'frequency-plan', priority: 4, tone: TONES.info, action: 'plan',
      title: frequencyPlanItem.title,
      detail: frequencyPlanItem.detail,
    });
  }

  if (exerciseOrderItem) {
    ekle({
      key: 'exercise-order', priority: 6, tone: TONES.info, action: 'workout',
      title: exerciseOrderItem.title,
      detail: exerciseOrderItem.detail,
    });
  }

  // Deload sürüyorsa uyarı değil durum bildirimi: kullanıcı zaten önlemi almış.
  if (deload?.active) {
    ekle({
      key: 'deload-running', priority: 1, tone: TONES.info, action: 'deload',
      title: `Deload ${deload.dayIndex}/${deload.totalDays}. gün`,
      detail: `${deload.preset.label} — ${deload.preset.summary}. Antrenman ekranındaki hedefler ölçekleniyor; ${deload.daysLeft} gün sonra kendiliğinden normale döner.`,
    });
  } else if (deloadSuggestion?.suggest) {
    ekle({
      key: 'deload', priority: 1, tone: TONES.warn, action: 'deload',
      title: 'Deload zamanı geldi',
      detail: `${deloadSuggestion.reasons.join('. ')}. Deload ekranından yaklaşımı ve süreyi seçersen hedefler kendiliğinden ölçeklenir.`,
    });
  } else if (readiness?.deloadOnerisi) {
    ekle({
      key: 'readiness-low', priority: 1, tone: TONES.warn, action: 'workout',
      title: 'Üst üste düşük hazır oluşluk',
      detail: `Son üç seansın ortalaması ${readiness.ortalama}/100. Hacim tavanı aşılmasa bile toparlanamıyorsun — bu hafta set sayısını %30 düşür, ağırlığı koru.`,
    });
  }

  // Dinlenme nabzı 1. öncelik: ölçülen (bildirilen değil) bir toparlanma
  // sinyali ve sürdürülen yükseklik bugünün kararını değiştiriyor.
  if (restingHrItem) {
    ekle({
      key: 'resting-hr', priority: 1,
      tone: restingHrItem.key === 'resting-hr' && /yüksek/.test(restingHrItem.title) ? TONES.warn : TONES.good,
      action: 'cardio',
      title: restingHrItem.title,
      detail: restingHrItem.detail,
    });
  }

  if (sleep && sleep.score < 55) {
    ekle({
      key: 'sleep', priority: 1, tone: TONES.warn, action: 'wellness',
      title: `Uyku puanı ${sleep.score}/100`,
      detail: sleep.asleep < 360
        ? 'Altı saatin altındaki uykuda maksimal güç ve teknik ölçülebilir şekilde düşer. Bugün rekor deneme; hedef tekrar aralığının alt sınırında çalış.'
        : 'Uyku kalitesi düşük. Şiddeti koru ama set sayısını azalt, son sette zorlamayı bırak.',
    });
  }

  // Döngü fazı tek başına performans düşüşü varsayımı değildir. Yalnızca o gün
  // kaydedilen ağrı/enerji/belirti yükü yüksekse planı değiştiren sinyal üretir.
  if (gender === 'female' && cycle?.severity === 'high') {
    ekle({
      key: 'cycle', priority: 1, tone: TONES.warn, action: 'cycle',
      title: 'Döngü belirtileri bugün yüksek',
      detail: cycle.advice.training,
    });
  } else if (gender === 'female' && cycle?.severity === 'moderate') {
    ekle({
      key: 'cycle', priority: 2, tone: TONES.info, action: 'cycle',
      title: 'Bugünkü belirtilere göre kontrol seti yap',
      detail: cycle.advice.training,
    });
  }

  // Aynı gün bacak + koşu gibi çakışmalar.
  if (conflict && (conflict.level.key === 'high' || conflict.level.key === 'medium')) {
    const ilk = conflict.items[0];
    ekle({
      key: 'conflict', priority: 1,
      tone: conflict.level.key === 'high' ? TONES.danger : TONES.warn,
      action: 'plan',
      title: ilk.title,
      detail: ilk.detail,
    });
  }

  // Planlanan antrenman henüz yapılmadıysa ve gün ilerlediyse hatırlat.
  if (planDay?.workouts?.length > 0 && doneToday === 0) {
    const ilk = planDay.workouts[0];
    ekle({
      key: 'plan', priority: 1, tone: TONES.info, action: 'workout',
      title: `${ilk.template.name} bugün planlı`,
      detail: `${planDay.sets} teorik set · ~${planDay.minutes} dk${ilk.time ? ` · ${ilk.time}` : ''}. Şablonla başlatınca geçen seansın ağırlıkları ve hedefleri hazır gelir.`,
    });
  }

  /* --- 2. öncelik: haftayı değiştirenler --- */

  if (coachProtocol?.active) {
    ekle({
      key: 'coach-protocol', priority: 2,
      tone: coachProtocol.mode === 'recovery' ? TONES.warn : TONES.info,
      action: 'coach',
      title: `Bu haftanın protokolü: ${coachProtocol.label}`,
      detail: `${coachProtocol.validUntil} tarihine kadar aktif · veri güveni ${coachProtocol.confidence?.score || 0}/100. ${coachProtocol.summary}`,
    });
  }

  // Hafta ilerledikçe MEV altındaki kaslar için uyarı sertleşir: pazartesi
  // "eksik" demek anlamsız, perşembeden sonra gerçekten sorun.
  const gun = haftaninGunu(now);
  // Projeksiyon hesaplanabildiyse (aktif haftalık program var) eski hacim
  // uyarısı tamamen susuyor — ikisi aynı şeyi farklı doğrulukla söylüyor.
  const projectionSilent = ctx.projectionAvailable === true;
  // Hafta hiç başlamadıysa "16 kas eksik" demek bilgi değil gürültü; o durum
  // ayrı ve tek bir maddeyle söyleniyor.
  const haftaBasladi = MUSCLE_GROUPS.some(m => parseNumber(muscleVolume[m]) > 0);
  if (gun >= 4 && !haftaBasladi) {
    ekle({
      key: 'no-week', priority: 2, tone: TONES.warn, action: 'workout',
      title: 'Bu hafta henüz antrenman yok',
      detail: `Haftanın ${gun}. günündesin ve kayıtlı set yok. Kalan günlerde tam programı sığdırmak yerine en çok geride kalan iki bölgeye kısa birer seans koymak daha gerçekçi.`,
    });
  } else if (projectionItem) {
    // Projeksiyon varsa hacim uyarısını O veriyor. Eski uyarı yalnızca "şu an"
    // eksik olana bakıyordu ve kalan planlı günleri saymıyordu: çarşamba günü
    // bacak hacminin düşük olması normalken alarm üretiyordu. Projeksiyon
    // sessizse gerçekten yapılacak bir şey yok demektir.
    ekle({
      key: 'volume', priority: 2, tone: TONES.warn, action: 'plan',
      title: projectionItem.title,
      detail: projectionItem.detail,
    });
  } else if (gun >= 4 && !projectionSilent) {
    const eksik = MUSCLE_GROUPS.filter(m => {
      const vol = parseNumber(muscleVolume[m]);
      return vol > 0 && vol < getVolumeLandmarks(m, experienceLevel).mev;
    });
    const hic = MUSCLE_GROUPS.filter(m => !(parseNumber(muscleVolume[m]) > 0));
    if (eksik.length > 0 || hic.length > 0) {
      const liste = [...eksik, ...hic].slice(0, 3);
      const kalan = (eksik.length + hic.length) - liste.length;
      ekle({
        key: 'volume', priority: 2, tone: TONES.warn, action: 'plan',
        title: `${liste.join(', ')}${kalan > 0 ? ` +${kalan}` : ''} koruma eşiğinin altında`,
        detail: `Haftanın ${gun}. günündesin. Bu kaslar MEV'in altında kalırsa hafta büyüme değil koruma haftası olur; kalan günlere 2-3 set eklemek yeterli.`,
      });
    }
  }

  const acwrDeger = parseNumber(acwr?.acwr);
  if (acwr?.hasEnoughData && acwr?.nearCeiling && acwrDeger > 1.5) {
    ekle({
      key: 'acwr', priority: 2, tone: TONES.warn, action: 'plan',
      title: `Yüklenme sıçraması (ACWR ${acwrDeger.toFixed(2)})`,
      detail: 'Son haftanın hacmi kronik ortalamanın belirgin üstünde. Sıçrama sakatlık riskini artırıyor; gelecek haftayı aynı seviyede tut, üstüne ekleme.',
    });
  }

  const protein = parseNumber(macros.protein);
  if (targetProtein > 0 && protein > 0 && protein < targetProtein * 0.75) {
    ekle({
      key: 'protein', priority: 2, tone: TONES.info, action: 'nutrition',
      title: `Protein ${Math.round(protein)}/${targetProtein} g`,
      detail: `${Math.round(targetProtein - protein)} g eksik. Kas koruma ve onarımı için asıl belirleyici günlük toplam; akşam öğününe tek porsiyon eklemek farkı çoğunlukla kapatıyor.`,
    });
  }

  if (calorieRemaining !== null && calorieRemaining < -300) {
    ekle({
      key: 'calories', priority: 2, tone: TONES.warn, action: 'nutrition',
      title: `Hedefin ${Math.abs(Math.round(calorieRemaining))} kcal üstündesin`,
      detail: 'Tek gün haftalık dengeyi bozmaz. Yarın telafi etmeye çalışmak yerine hedefe dön; sert telafi çoğunlukla ertesi güne de taşıyor.',
    });
  }

  /* --- 3. öncelik: fırsat ve veri --- */

  if (!sleep) {
    ekle({
      key: 'sleep-missing', priority: 3, tone: TONES.info, action: 'wellness',
      title: 'Uyku puanını hızlıca kaydet',
      detail: 'Saatleri bilmiyorsan bile 100 üzerinden genel puan gir. Koç toparlanma tavsiyesini bu sinyalle kişiselleştirir.',
    });
  }

  if (gender === 'female' && cycle?.daysUntilNext > 0 && cycle.daysUntilNext <= 3 && !cycle.hasEntry) {
    ekle({
      key: 'cycle-upcoming', priority: 3, tone: TONES.info, action: 'cycle',
      title: `Tahmini regl başlangıcına ${cycle.daysUntilNext} gün`,
      detail: 'Takvim tek başına antrenmanı değiştirmez. Ağrı, enerji veya uyku değişirse günlük kayda gir; öneri belirtilere göre ayarlanır.',
    });
  }

  // Zirve hazır oluşluk + planlı antrenman = rekor denemesi için uygun gün.
  if (readiness?.ortalama >= 80 && planDay?.workouts?.length > 0 && !readiness.deloadOnerisi) {
    ekle({
      key: 'pr', priority: 3, tone: TONES.good, action: 'workout',
      title: 'Rekor denemesi için uygun gün',
      detail: `Hazır oluşluk ortalaman ${readiness.ortalama}/100. İlk bileşik hareketde ağırlığı artırıp RIR 0-1 aralığında bir set deneyebilirsin.`,
    });
  }

  const durgun = plateaus.filter(p => p.state === 'decline').slice(0, 1);
  if (durgun.length > 0) {
    ekle({
      key: 'plateau', priority: 3, tone: TONES.warn, action: 'analysis',
      title: `${durgun[0].name} gerilemede`,
      detail: durgun[0].advice,
    });
  }

  // Hacim yeterli ama tek seansa yığılmışsa: acil değil, program kurarken
  // düzeltilecek bir şey. Bu yüzden 2. öncelik değil 3.
  if (frequencyItem) {
    ekle({
      key: 'frequency', priority: 3, tone: TONES.info, action: 'analysis',
      title: frequencyItem.title,
      detail: frequencyItem.detail,
    });
  }

  // Blok sürüyorsa haftanın hedefi 2. öncelik: bu haftanın programını
  // değiştiren bir bilgi, ama bugünün seansını değiştirmiyor.
  if (mesocycleItem) {
    ekle({
      key: 'mesocycle', priority: 2, tone: TONES.info, action: 'mesocycle',
      title: mesocycleItem.title,
      detail: mesocycleItem.detail,
    });
  }

  // Hareket seçimi hacimden bağımsız bir eksik; acil değil, program
  // düzenlenirken bakılacak bir şey.
  if (selectionItem) {
    ekle({
      key: 'selection', priority: 3, tone: TONES.info, action: 'plan',
      title: selectionItem.title,
      detail: selectionItem.detail,
    });
  }

  // Eklem ağrısı 1. öncelik: bugünün seansında hareket seçimini değiştiren
  // tek sinyal bu. Hacim ya da hedef tartışmasından önce gelir.
  if (painItem) {
    ekle({
      key: 'pain', priority: 1, tone: TONES.warn, action: 'pain',
      title: painItem.title,
      detail: painItem.detail,
    });
  }

  // Bozuk veri 2. öncelik: uygulamanın verdiği HER tavsiye bu kayıtlardan
  // çıkıyor, düzeltilmeden diğer uyarılara güvenmenin anlamı yok.
  if (dataHealthItem) {
    ekle({
      key: 'dataHealth', priority: 2, tone: TONES.warn, action: 'dataHealth',
      title: dataHealthItem.title,
      detail: dataHealthItem.detail,
    });
  }

  if (consistencyItem) {
    ekle({
      key: 'consistency', priority: 2, tone: TONES.info, action: 'analysis',
      title: consistencyItem.title,
      detail: consistencyItem.detail,
    });
  }

  // Kuvvet dengesi 3. öncelik: program düzenlenirken bakılacak bir şey,
  // bugünkü seansı değiştirmiyor.
  if (balanceItem) {
    ekle({
      key: 'balance', priority: 3, tone: TONES.info, action: 'analysis',
      title: balanceItem.title,
      detail: balanceItem.detail,
    });
  }

  // Rekor eşiği 2. öncelik: bugünün seansında somut bir hedef veriyor ama
  // kaçırılırsa bir şey kaybedilmiyor.
  if (prItem) {
    ekle({
      key: 'pr-watch', priority: 2, tone: TONES.good, action: 'workout',
      title: prItem.title,
      detail: prItem.detail,
    });
  }

  // Hareket sırası: bugünün seansını değiştirir ama sağlık/toparlanma
  // sinyallerinin arkasında kalmalı.
  if (orderItem) {
    ekle({
      key: 'order', priority: 2, tone: TONES.info, action: 'plan',
      title: orderItem.title,
      detail: orderItem.detail,
    });
  }

  // RIR kalibrasyonu 3. öncelik: bugünü değil, girdiğin verinin anlamını
  // düzelten bir bilgi.
  if (rirItem) {
    ekle({
      key: 'rir', priority: 3, tone: TONES.info, action: 'analysis',
      title: rirItem.title,
      detail: rirItem.detail,
    });
  }

  // Kardiyo 2. öncelik: haftayı değiştiren bir karar. Dengesizlik uyarısı
  // (çok yüksek şiddet, orta bölge tuzağı) hedefi tamamlamaktan önce geliyor;
  // yanlış dağılımla tamamlanan hedef, tamamlanmamış hedeften daha kötü.
  if (cardioItem) {
    ekle({
      key: cardioItem.key || 'cardio', priority: 2, tone: TONES.info, action: 'cardio',
      title: cardioItem.title,
      detail: cardioItem.detail,
    });
  }

  // Deload dönüşü 1. öncelik: bugünün seansının hacmini doğrudan belirliyor
  // ve pencere kısa (iki hafta), kaçırılırsa geri gelmiyor.
  if (returnItem) {
    ekle({
      key: 'deload-return', priority: 1, tone: TONES.info, action: 'workout',
      title: returnItem.title,
      detail: returnItem.detail,
    });
  }

  // Antrenman çevresi beslenme 2. öncelik: bugünü değiştiriyor ama seansın
  // kendisini değil, çevresini.
  if (periItem) {
    ekle({
      key: 'peri-nutrition', priority: 2, tone: TONES.warn, action: 'nutrition',
      title: periItem.title,
      detail: periItem.detail,
    });
  }

  // Şiddet dağılımı 2. öncelik: bu haftanın setlerini nasıl yapacağını
  // değiştiriyor.
  if (effortItem) {
    ekle({
      key: 'effort', priority: 2, tone: TONES.warn, action: 'analysis',
      title: effortItem.title,
      detail: effortItem.detail,
    });
  }

  // Rotasyon ve standartlar 3. öncelik: program düzenlenirken bakılacak,
  // bugünü değiştirmeyen bilgiler.
  if (rotationItem) {
    ekle({
      key: 'rotation', priority: 3, tone: TONES.info, action: 'analysis',
      title: rotationItem.title,
      detail: rotationItem.detail,
    });
  }

  if (standardsItem) {
    ekle({
      key: 'standards', priority: 3, tone: TONES.info, action: 'analysis',
      title: standardsItem.title,
      detail: standardsItem.detail,
    });
  }

  if (ratioItem) {
    ekle({
      key: 'ratio', priority: 3, tone: TONES.info, action: 'metrics',
      title: ratioItem.title,
      detail: ratioItem.detail,
    });
  }

  if (daysSinceMetric !== null && daysSinceMetric >= 10) {
    ekle({
      key: 'metric', priority: 3, tone: TONES.info, action: 'metrics',
      title: `${daysSinceMetric} gündür ölçüm yok`,
      detail: 'Gerçek günlük harcama (adaptif TDEE) kilo eğiliminden hesaplanıyor; ölçüm girilmezse kalori hedefleri formül tahmininde kalıyor.',
    });
  }

  // Hiçbir uyarı yoksa sessiz kalmak yerine durumu onaylıyoruz: kullanıcı
  // "her şey yolunda mı yoksa kart mı bozuk" diye düşünmesin.
  if (items.length === 0) {
    ekle({
      key: 'clear', priority: 3, tone: TONES.good, action: null,
      title: 'Acil bir şey yok',
      detail: 'Toparlanma, hacim ve beslenme tarafında bugün müdahale gerektiren bir sinyal görünmüyor. Planı uygula, ölçümleri düzenli gir.',
    });
  }

  return items.sort((a, b) => a.priority - b.priority);
};
