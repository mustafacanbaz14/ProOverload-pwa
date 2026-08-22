import { parseNumber } from './number.js';
import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';
import { detectMuscleGroup } from './helpers.js';
import { WEEKDAY_KEYS } from './programDraft.js';

/**
 * Kas sıklık planlayıcı.
 *
 * `frequency.js` GEÇMİŞE bakıyor: geçen haftalarda hangi kası kaç kez
 * çalıştın. Doğru ama geç — hafta bittikten sonra öğreniyorsun. Bu modül
 * PLANA bakıyor: kurduğun haftalık program her kası kaç kez uyaracak,
 * hangi kas tek uyaranda kalmış, hangi iki gün arka arkaya aynı kası
 * yüklüyor.
 *
 * Sıklık hipertrofide hacimden bağımsız bir değişken değil ama bağımsız bir
 * kısıt: aynı haftalık hacim iki güne bölündüğünde tek güne yığıldığından
 * daha iyi sonuç veriyor, çünkü protein sentezi yanıtı yaklaşık iki günde
 * sönüyor. Haftada bir çalışılan kas, haftanın beş gününü uyaransız geçiriyor.
 *
 * Bir kasın "çalışılmış" sayılması için o günde en az iki etkili seti olmalı
 * — tek set bir uyaran değil, yolda geçerken alınan bir katkı.
 */

// Bir günde bu kadar setin altı "o kas çalışıldı" saymaya yetmiyor.
// frequency.js ile aynı eşik: iki modülün farklı sayması, aynı ekranda
// çelişen iki sayı göstermek olurdu.
const MIN_SETS_PER_DAY = 2;

// Hedef sıklık. Büyük kaslarda ikiden aza inmek hacmi tek güne yığıyor;
// küçük kaslar zaten dolaylı hacimden besleniyor.
const DEFAULT_TARGET = 2;

/**
 * Plandaki her günün kas kas set dağılımı.
 *
 * @param planDays  { mon: [{ templateId }], ... }
 * @param templates şablon listesi
 */
export const planMuscleDays = (planDays = {}, templates = [], { customExercises = [] } = {}) => {
  const byId = new Map((templates || []).map(t => [t.id, t]));
  const gunler = [];

  WEEKDAY_KEYS.forEach(key => {
    const slotlar = (planDays?.[key] || []).filter(x => x?.type === 'workout');
    if (slotlar.length === 0) return;

    const byMuscle = {};
    const adlar = [];
    slotlar.forEach(slot => {
      const t = byId.get(slot.templateId);
      if (!t) return;
      adlar.push(t.name);
      (t.exercises || []).forEach(ex => {
        const setSayisi = (ex.sets || []).length;
        if (setSayisi === 0) return;
        const { contributions } = detectMuscleGroup(ex.name, customExercises);
        Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
          byMuscle[kas] = (byMuscle[kas] || 0) + setSayisi * parseNumber(agirlik);
        });
      });
    });

    gunler.push({
      weekday: key,
      templates: adlar,
      byMuscle,
      // Yalnızca eşiği geçen kaslar "çalışıldı" sayılıyor.
      trained: Object.entries(byMuscle)
        .filter(([, v]) => v >= MIN_SETS_PER_DAY)
        .map(([k]) => k),
    });
  });

  return gunler;
};

/**
 * Sıklık raporu: her kas planda kaç gün uyarılıyor.
 *
 * @returns { rows, underTargeted, backToBack, hasData }
 */
export const buildFrequencyPlan = (planDays = {}, templates = [], {
  customExercises = [], experienceLevel = 'intermediate', targets = {},
} = {}) => {
  const gunler = planMuscleDays(planDays, templates, { customExercises });
  if (gunler.length === 0) return { hasData: false, rows: [], days: [] };

  const rows = MUSCLE_GROUPS.map(kas => {
    const calisilanGunler = gunler.filter(g => g.trained.includes(kas));
    const hacim = gunler.reduce((t, g) => t + (g.byMuscle[kas] || 0), 0);
    const hedef = Math.max(1, Math.round(parseNumber(targets?.[kas]) || DEFAULT_TARGET));
    const { mev } = getVolumeLandmarks(kas, experienceLevel);
    return {
      muscle: kas,
      frequency: calisilanGunler.length,
      target: hedef,
      volume: Math.round(hacim * 4) / 4,
      mev,
      days: calisilanGunler.map(g => g.weekday),
      // Hacmi eşiğin üstünde ama tek güne yığılmışsa bu ayrı bir uyarı:
      // hacim tablosu "yeterli" derken sıklık yetersiz olabiliyor.
      concentrated: calisilanGunler.length === 1 && hacim >= mev,
      below: calisilanGunler.length > 0 && calisilanGunler.length < hedef,
      untrained: calisilanGunler.length === 0 && hacim > 0,
    };
  }).filter(r => r.volume > 0);

  /**
   * Arka arkaya gelen günlerde tekrarlanan kaslar.
   *
   * Aynı kası iki gün üst üste yüklemek sıklığı artırmıyor, toparlanmayı
   * kesiyor: ikinci gün henüz onarım bitmeden geliyor ve o setler
   * öncekinin üstüne uyaran eklemek yerine yorgunluk ekliyor.
   */
  const backToBack = [];
  gunler.forEach((gun, i) => {
    const sonraki = gunler[i + 1] || (i === gunler.length - 1 ? gunler[0] : null);
    if (!sonraki || sonraki === gun) return;
    const a = WEEKDAY_KEYS.indexOf(gun.weekday);
    const b = WEEKDAY_KEYS.indexOf(sonraki.weekday);
    // Haftanın sonu ile başı da komşu.
    const komsu = b === a + 1 || (a === 6 && b === 0);
    if (!komsu) return;
    const ortak = gun.trained.filter(k => sonraki.trained.includes(k));
    if (ortak.length > 0) {
      backToBack.push({ from: gun.weekday, to: sonraki.weekday, shared: ortak });
    }
  });

  return {
    hasData: true,
    days: gunler,
    rows: rows.sort((a, b) => a.frequency - b.frequency || b.volume - a.volume),
    underTargeted: rows.filter(r => r.below || r.untrained),
    concentrated: rows.filter(r => r.concentrated),
    backToBack,
    trainingDays: gunler.length,
  };
};

/** Koç kartı: yalnızca hacmi yeterken sıklığı yetersiz olan kaslar için. */
export const frequencyPlanCoachItem = (report) => {
  if (!report?.hasData) return null;
  // En anlamlı sinyal: hacim tablosu yeterli derken tek güne yığılmış kaslar.
  const yigilan = report.concentrated;
  if (yigilan.length === 0) return null;
  const isim = yigilan.slice(0, 3).map(r => `${r.muscle} (${r.volume} set)`).join(', ');
  return {
    key: 'frequency-plan',
    tone: 'info',
    title: `${yigilan.length} kasın haftalık hacmi tek güne yığılmış`,
    detail: `${isim} planında haftada bir kez çalışılıyor. Hacim koruma eşiğinin üstünde, yani hacim tablosu sorun göstermiyor — ama protein sentezi yanıtı yaklaşık iki günde sönüyor ve bu kaslar haftanın kalanını uyaransız geçiriyor. Aynı hacmi ikiye bölmek, toplamı hiç artırmadan daha iyi sonuç veriyor.`,
  };
};
