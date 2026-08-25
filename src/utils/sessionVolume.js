import { parseNumber } from './number.js';
import { isWorkingSet, detectMuscleGroup } from './helpers.js';
import { getVolumeLandmarks } from './constants.js';

/**
 * Seans içi kalan hacim sayacı.
 *
 * Hacim tablosu haftayı BİTTİKTEN SONRA anlatıyordu; seansın ortasında "bu
 * kastan bu hafta kaç set kaldı" sorusunun cevabı yoktu. Oysa karar tam
 * orada veriliyor: son hareketi bırakayım mı, bir set daha ekleyeyim mi.
 *
 * Sayaç ÜÇ parçayı topluyor:
 *  1. Bu hafta daha önce yapılmış setler,
 *  2. bu seansta şimdiye kadar GİRİLMİŞ setler,
 *  3. bu seansta planlanmış ama henüz girilmemiş setler.
 *
 * Üçüncüsü önemli: planlanan setler sayılmazsa sayaç "MEV'e 6 set var" der,
 * kullanıcı hareket ekler, oysa o setler zaten programda duruyordur. İkisi
 * ayrı gösteriliyor ki kullanıcı hangisinin gerçekleşmiş olduğunu bilsin.
 */

/** Bir hareket listesinden kas kas set dağılımı. */
const hacimDagilimi = (exercises = [], { customExercises = [], onlyEntered = false } = {}) => {
  const out = {};
  (exercises || []).forEach(ex => {
    if (!ex?.name) return;
    const setler = (ex.sets || []).filter(s => {
      if (!isWorkingSet(s)) return false;
      return onlyEntered ? parseNumber(s.reps) > 0 : true;
    });
    if (setler.length === 0) return;
    const { contributions } = detectMuscleGroup(ex.name, customExercises);
    Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
      out[kas] = (out[kas] || 0) + setler.length * parseNumber(agirlik);
    });
  });
  return out;
};

/** Haftanın başlangıcı (pazartesi) — hafta içi hacim için. */
const haftaBasi = (today = new Date()) => {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

/**
 * @returns { rows, hasData } — rows: kas kas mevcut, planlanan, hedef
 */
export const buildSessionVolume = (activeWorkout, workouts = [], {
  customExercises = [], experienceLevel = 'intermediate', today = new Date(),
} = {}) => {
  if (!activeWorkout?.exercises?.length) return { rows: [], hasData: false };

  const bas = haftaBasi(today);
  const basStr = `${bas.getFullYear()}-${String(bas.getMonth() + 1).padStart(2, '0')}-${String(bas.getDate()).padStart(2, '0')}`;

  // Bu haftanın ÖNCEKİ seansları: devam eden seans iki kez sayılmamalı.
  const oncekiler = (workouts || []).filter(w => w.date >= basStr && w.id !== activeWorkout.id);
  const haftaHacmi = {};
  oncekiler.forEach(w => {
    const d = hacimDagilimi(w.exercises, { customExercises, onlyEntered: true });
    Object.entries(d).forEach(([kas, v]) => { haftaHacmi[kas] = (haftaHacmi[kas] || 0) + v; });
  });

  const girilen = hacimDagilimi(activeWorkout.exercises, { customExercises, onlyEntered: true });
  const tumu = hacimDagilimi(activeWorkout.exercises, { customExercises, onlyEntered: false });

  const kaslar = new Set([...Object.keys(girilen), ...Object.keys(tumu)]);
  const rows = [...kaslar].map(kas => {
    const onceki = Math.round((haftaHacmi[kas] || 0) * 4) / 4;
    const bugunGirilen = Math.round((girilen[kas] || 0) * 4) / 4;
    const bugunPlanli = Math.round(((tumu[kas] || 0) - (girilen[kas] || 0)) * 4) / 4;
    const { mev, mav, mrv } = getVolumeLandmarks(kas, experienceLevel);
    const simdi = onceki + bugunGirilen;
    const beklenen = simdi + bugunPlanli;
    return {
      muscle: kas,
      priorWeek: onceki,
      entered: bugunGirilen,
      planned: bugunPlanli,
      current: simdi,
      projected: beklenen,
      mev,
      mav,
      mrv,
      // Planlananlar dahil edildiğinde bile eşiğin altında mı.
      shortOfMev: beklenen < mev,
      toMev: Math.max(0, Math.round((mev - beklenen) * 4) / 4),
      // Tavanı aşacak mı: seans içinde set eklemeden önce görülmesi gereken şey.
      willExceedMrv: beklenen > mrv,
      overBy: Math.max(0, Math.round((beklenen - mrv) * 4) / 4),
    };
  }).sort((a, b) => b.projected - a.projected);

  return {
    rows,
    hasData: rows.length > 0,
    weekStart: basStr,
    shortOfMev: rows.filter(r => r.shortOfMev),
    willExceedMrv: rows.filter(r => r.willExceedMrv),
  };
};
