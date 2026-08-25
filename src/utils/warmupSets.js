import { parseNumber } from './number.js';
import { isWorkingSet, detectMuscleGroup } from './helpers.js';
import { generateWarmup } from './plates.js';
import { detectEquipment } from './substitution.js';
import { SMALL_MUSCLE_GROUPS } from './constants.js';

/**
 * Hareket başına ısınma seti merdiveni.
 *
 * `generateWarmup` uygulamada zaten vardı ama YALNIZCA plaka hesaplayıcısında
 * kullanılıyordu: kullanıcı ağırlığı görüyor, sonra o setleri seansa elle
 * giriyordu. Pratikte kimse girmiyor — ısınma setleri kayda hiç düşmüyor ve
 * "bugün kaç set yaptım" sorusu ısınmayı hiç saymıyordu (ki bu doğru), ama
 * ısınmanın kendisi de planlanmış olmuyordu.
 *
 * Burası merdiveni seansa EKLENEBİLİR hale getiriyor: setler `warmup` tipiyle
 * giriyor, yani hacme sayılmıyorlar ama kayıtta duruyorlar ve bir sonraki
 * seansta ne yaptığın görünüyor.
 *
 * Merdiven, çalışma ağırlığına göre kuruluyor. Ağırlık nereden geliyor:
 *  1. Bu seansta zaten girilmiş bir çalışma seti varsa oradan,
 *  2. yoksa şablonda planlanmış ağırlıktan,
 *  3. o da yoksa geçmişteki son çalışma setinden.
 * Üçü de yoksa merdiven kurulmuyor — ısınma "neye ısınıyorum" sorusunun
 * cevabı olmadan anlamsız.
 */

// Küçük kas gruplarında ve hafif yüklerde uzun merdiven gereksiz: iki kademe
// yetiyor ve fazlası seansı uzatıyor.
const LIGHT_LOAD_THRESHOLD = 30;

/** Merdivenin dayanacağı çalışma ağırlığı. */
export const warmupTargetFor = (exercise, { history = null } = {}) => {
  const calisma = (exercise?.sets || []).filter(s => isWorkingSet(s) && parseNumber(s.weight) > 0);
  if (calisma.length > 0) {
    return { weight: Math.max(...calisma.map(s => parseNumber(s.weight))), source: 'session' };
  }
  const planli = (exercise?.sets || []).filter(s => parseNumber(s.weight) > 0);
  if (planli.length > 0) {
    return { weight: Math.max(...planli.map(s => parseNumber(s.weight))), source: 'template' };
  }
  const gecmis = (history?.sets || []).filter(s => isWorkingSet(s) && parseNumber(s.weight) > 0);
  if (gecmis.length > 0) {
    return { weight: Math.max(...gecmis.map(s => parseNumber(s.weight))), source: 'history' };
  }
  return null;
};

/**
 * Bir hareket için ısınma merdiveni.
 *
 * @returns { steps, target, source, reason } | null
 */
export const buildWarmupLadder = (exercise, {
  history = null, barWeight = 20, plates = null, customExercises = [],
} = {}) => {
  if (!exercise?.name) return null;

  // Zaten ısınma seti varsa ikinci kez eklenmemeli.
  const mevcutIsinma = (exercise.sets || []).filter(s => s?.setType === 'warmup').length;
  if (mevcutIsinma > 0) {
    return { steps: [], alreadyPresent: mevcutIsinma, reason: 'existing' };
  }

  const hedef = warmupTargetFor(exercise, { history });
  if (!hedef) return { steps: [], reason: 'no-target' };

  const { muscle } = detectMuscleGroup(exercise.name, customExercises);
  const kucukKas = SMALL_MUSCLE_GROUPS.includes(muscle);

  // Bar ağırlığı yalnızca BARBELL hareketlerinde anlamlı. Kabloya ya da
  // dambıla 20 kg taban uygulamak, hedef ağırlığın tamamını "bara takılamaz"
  // sayıp merdiveni boş bırakıyordu: yan kaldırışta hiç ısınma çıkmıyordu.
  const ekipman = detectEquipment(exercise.name);
  const etkinBar = ekipman?.key === 'barbell' ? barWeight : 0;

  const ham = generateWarmup(hedef.weight, etkinBar, plates || undefined);
  if (ham.length === 0) {
    return { steps: [], target: hedef.weight, source: hedef.source, reason: 'too-light' };
  }

  // Küçük kas grubu ya da hafif yükte merdiven kısalıyor: yan kaldırışa dört
  // kademe ısınma yapmak seansı uzatmaktan başka bir şey yapmıyor.
  const kisalt = kucukKas || hedef.weight <= LIGHT_LOAD_THRESHOLD;
  const steps = kisalt ? ham.slice(-2) : ham;

  return {
    steps,
    target: hedef.weight,
    source: hedef.source,
    shortened: kisalt,
    muscle,
    reason: null,
  };
};

/**
 * Merdiveni hareketin set listesine yazar.
 *
 * Isınma setleri BAŞA ekleniyor: sıra kayıtta da gerçeği yansıtmalı, ısınma
 * çalışma setlerinden önce yapılıyor.
 */
export const applyWarmupLadder = (exercise, ladder, generateId) => {
  if (!exercise || !ladder?.steps?.length) return exercise;
  const isinma = ladder.steps.map(step => ({
    id: generateId(),
    weight: String(step.weight),
    reps: String(step.reps),
    rir: 5,
    tempo: '',
    formRating: 8,
    setType: 'warmup',
  }));
  return { ...exercise, sets: [...isinma, ...(exercise.sets || [])] };
};

/** Eklenmiş ısınma setlerini geri alır. */
export const removeWarmupSets = (exercise) => {
  if (!exercise?.sets?.length) return exercise;
  const kalan = exercise.sets.filter(s => s?.setType !== 'warmup');
  return kalan.length === exercise.sets.length ? exercise : { ...exercise, sets: kalan };
};
