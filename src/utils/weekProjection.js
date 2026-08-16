import { parseNumber } from './number.js';
import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';
import { previewTemplateVolume } from './templates.js';
import { detectMuscleGroup } from './helpers.js';

/**
 * Hafta sonu projeksiyonu.
 *
 * Koç, haftanın ortasında "şu kaslar koruma eşiğinin altında" diyordu ve bu
 * çoğu zaman YANLIŞ bir alarmdı: çarşamba günü bacak hacminin düşük olması
 * normal, çünkü bacak günü cuma. Uyarı, kalan planlı günleri hesaba katmıyordu.
 *
 * Bu modül soruyu doğru soruyor: "hafta ŞU ANDAKİ planla biterse nerede
 * kapanır?" Üç ayrı sonuç çıkıyor ve üçü farklı şeyler söylüyor:
 *
 *  - onTrack   kalan günler eşiği kapatıyor, yapılacak bir şey yok
 *  - atRisk    kalan günlerle bile eşik kapanmıyor, ama hafta bitmedi
 *  - missed    plan bitti, eşik kapanmadı; artık ancak plan dışı seans kapatır
 *
 * Ayrım önemli çünkü "atRisk" bir plan düzeltmesi, "missed" ise bir karar:
 * fazladan seans mı, yoksa bu haftayı koruma haftası saymak mı.
 */

const gunSirasi = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** Bugünün plan gün anahtarı (pazartesi başlangıçlı). */
export const planDayKeyOf = (date = new Date()) => gunSirasi[(date.getDay() + 6) % 7];

/**
 * Haftalık plandan KALAN günlerin teorik hacmini çıkarır.
 *
 * "Kalan" bugünü DE içeriyor: bugünün seansı henüz yapılmadıysa hâlâ
 * yapılabilir. Bugün zaten çalışıldıysa çağıran taraf `includeToday: false`
 * geçiyor, yoksa aynı hacim iki kez sayılırdı.
 */
export const remainingPlannedVolume = (planResult, templates = [], {
  today = new Date(),
  includeToday = true,
  customExercises = [],
} = {}) => {
  const bugunKey = planDayKeyOf(today);
  const bugunIndex = gunSirasi.indexOf(bugunKey);
  const byId = new Map((templates || []).map(t => [t.id, t]));

  const byMuscle = {};
  // Birincil hedefler ayrı tutuluyor: bir kasın programda olup olmadığını
  // dolaylı katkı belirlemiyor. Çömeliş hamstringe yarım set yazıyor ama
  // hamstringi çalıştıran bir program değil bu.
  const primary = new Set();
  let sets = 0;
  let days = 0;

  (planResult?.days || []).forEach(gun => {
    const i = gunSirasi.indexOf(gun.key);
    if (i < bugunIndex) return;
    if (i === bugunIndex && !includeToday) return;
    if (!gun.workouts || gun.workouts.length === 0) return;

    days += 1;
    gun.workouts.forEach(slot => {
      const template = slot.template || byId.get(slot.templateId);
      if (!template) return;
      const { byMuscle: m, totalSets } = previewTemplateVolume(template.exercises, customExercises);
      sets += totalSets;
      Object.entries(m).forEach(([kas, v]) => { byMuscle[kas] = (byMuscle[kas] || 0) + v; });
      (template.exercises || []).forEach(ex => {
        if (!ex?.name) return;
        primary.add(detectMuscleGroup(ex.name, customExercises).muscle);
      });
    });
  });

  return { byMuscle, sets, days, primary };
};

/**
 * Haftanın nerede kapanacağı.
 *
 * @param actualVolume bu hafta GERÇEKLEŞEN hacim (kas -> set)
 */
export const buildWeekProjection = (actualVolume = {}, planResult, templates = [], {
  today = new Date(),
  includeToday = true,
  experienceLevel = 'intermediate',
  customExercises = [],
  // Bu hafta GERÇEKTEN doğrudan çalışılmış kaslar. Plan dışı yapılan seanslar
  // da programın parçası; yalnızca plana bakmak onları görmezden gelirdi.
  trainedMuscles = [],
} = {}) => {
  const kalan = remainingPlannedVolume(planResult, templates, { today, includeToday, customExercises });

  // Programda sayılan kaslar: kalan planda ya da bu hafta yapılanlarda
  // BİRİNCİL hedef olanlar.
  const hedeflenen = new Set([...(kalan.primary || []), ...(trainedMuscles || [])]);

  const rows = MUSCLE_GROUPS.map(kas => {
    const { mev, mav, mrv } = getVolumeLandmarks(kas, experienceLevel);
    const simdi = Math.round(parseNumber(actualVolume[kas]) * 4) / 4;
    const eklenecek = Math.round(parseNumber(kalan.byMuscle[kas]) * 4) / 4;
    const projeksiyon = Math.round((simdi + eklenecek) * 4) / 4;

    // Programın HİÇ çalıştırmadığı kas bir hafta sapması değil, program
    // tercihi: haftalık plan denetiminin işi. Bu ayrım yapılmadan projeksiyon
    // her hafta on dört kası birden "risk altında" diye bildiriyordu ve
    // uyarının tamamı gürültüye dönüşüyordu.
    const programda = hedeflenen.has(kas);

    let status = 'untrained';
    if (programda) {
      if (projeksiyon < mev) status = kalan.days > 0 ? 'atRisk' : 'missed';
      else if (projeksiyon > mrv) status = 'over';
      else status = 'onTrack';
    }

    return {
      muscle: kas, current: simdi, planned: eklenecek, projected: projeksiyon,
      mev, mav, mrv, status, inProgram: programda,
      // Eşiği kapatmak için kaç set eksik kalıyor.
      gap: projeksiyon < mev ? Math.ceil(mev - projeksiyon) : 0,
    };
  });

  const atRisk = rows.filter(r => r.status === 'atRisk');
  const missed = rows.filter(r => r.status === 'missed');
  const over = rows.filter(r => r.status === 'over');

  return {
    rows,
    remainingDays: kalan.days,
    remainingSets: kalan.sets,
    atRisk, missed, over,
    // Programda hiç çalışılmayan kaslar bu listelere girmiyor: onlar bir
    // "hafta sapması" değil, program tercihi. Haftalık plan denetiminin işi.
    hasData: (planResult?.days || []).length > 0,
    clean: atRisk.length === 0 && missed.length === 0 && over.length === 0,
  };
};

/**
 * Projeksiyonun günlük koç satırı.
 *
 * Eski "şu kaslar MEV altında" uyarısının yerine geçmesi için tasarlandı:
 * kalan planlı günler eşiği kapatıyorsa hiçbir şey söylemiyor.
 */
export const projectionCoachItem = (projection) => {
  if (!projection?.hasData) return null;

  if (projection.missed.length > 0) {
    const adlar = projection.missed.slice(0, 3).map(r => `${r.muscle} (${r.gap} set)`).join(', ');
    return {
      key: 'projection-missed',
      title: `Planlı günler bitti, ${projection.missed.length} kas eşiğin altında kapanıyor`,
      detail: `${adlar}${projection.missed.length > 3 ? ' ve diğerleri' : ''}. Bu hafta artık ancak plan dışı bir seansla kapanır; kapatmayacaksan hafta büyüme değil koruma haftası olarak geçer ve bu bir başarısızlık değil, bilinçli bir tercih olmalı.`,
    };
  }

  if (projection.atRisk.length > 0) {
    const adlar = projection.atRisk.slice(0, 3).map(r => `${r.muscle} (${r.gap} set)`).join(', ');
    return {
      key: 'projection-risk',
      title: `${projection.atRisk.length} kas planlı günlerle bile eşiğin altında kalıyor`,
      detail: `${adlar}${projection.atRisk.length > 3 ? ' ve diğerleri' : ''}. Kalan ${projection.remainingDays} planlı günde bu setleri eklemek yeterli — hafta bitmeden düzeltilebilir bir açık.`,
    };
  }

  return null;
};
