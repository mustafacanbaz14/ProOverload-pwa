import { parseNumber } from './number.js';
import { formatDay } from './dates.js';

/**
 * Hareket başına seans notu.
 *
 * Seansın tamamı için bir not alanı vardı ("bugün yorgundum"). Ama salonda
 * tutulmak istenen notların çoğu HAREKETE ait ve bir sonraki seansta o
 * hareketin başında hatırlanması gerekiyor: "sehpa dördüncü delik", "sol omuz
 * son sette sıkıştı", "bu makinede pim iki numara". Seans notuna yazılınca
 * kayboluyorlardı — kimse üç hafta önceki seansın not alanını açmıyor.
 *
 * Kurulum notu (`setupNote`) ile karıştırılmamalı: o KALICI bir ayar,
 * hareketin her seansında geçerli. Buradaki not O SEANSA ait bir gözlem ve
 * zaman içinde değişiyor; ikisini aynı alana koymak, kalıcı ayarın geçici
 * gözlemlerle üst üste yazılması demekti.
 *
 * Not setin değil hareketin üstünde duruyor: set bazında not almak pratikte
 * kimsenin yapmadığı bir ayrıntı ve arayüzü şişiriyor.
 */

// Aynı hareketin geçmişinden en fazla bu kadar not hatırlatılıyor. Beş yıllık
// bir geçmişte otuz not göstermek, hiç göstermemekle aynı kapıya çıkıyor.
const MAX_RECALL = 3;
// Bundan eski notlar hatırlatılmıyor: altı ay önceki "sehpa dördüncü delik"
// notu büyük ihtimalle artık geçerli değil.
const RECALL_DAYS = 120;

export const NOTE_MAX_LENGTH = 240;

export const normalizeNote = (text) =>
  String(text || '').trim().slice(0, NOTE_MAX_LENGTH);

/**
 * Bir hareketin geçmiş seans notları, yeniden eskiye.
 *
 * @returns [{ date, note, label }]
 */
export const notesFor = (exerciseName, workouts = [], { today = new Date(), excludeWorkoutId = null } = {}) => {
  if (!exerciseName) return [];
  const sinir = new Date(today);
  sinir.setDate(sinir.getDate() - RECALL_DAYS);

  const out = [];
  [...(workouts || [])]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .forEach(w => {
      if (out.length >= MAX_RECALL) return;
      if (w.id === excludeWorkoutId) return;
      const d = new Date(`${w.date}T00:00:00`);
      if (!Number.isNaN(d.getTime()) && d < sinir) return;
      (w.exercises || []).forEach(ex => {
        if (ex?.name !== exerciseName) return;
        const not = normalizeNote(ex.note);
        if (!not) return;
        out.push({ date: w.date, note: not, label: formatDay(w.date, 'short') });
      });
    });

  return out.slice(0, MAX_RECALL);
};

/** Hareketin notunu günceller; boş not alanı tamamen siliyor. */
export const setExerciseNote = (exercise, text) => {
  const not = normalizeNote(text);
  if (!not) {
    if (!exercise?.note) return exercise;
    const { note: _cikan, ...kalan } = exercise;
    return kalan;
  }
  return { ...exercise, note: not };
};

/**
 * Geçmişte not alınmış hareketlerin listesi — arama ve geçmiş taraması için.
 */
export const allNotedExercises = (workouts = []) => {
  const harita = new Map();
  (workouts || []).forEach(w => {
    (w.exercises || []).forEach(ex => {
      const not = normalizeNote(ex?.note);
      if (!not || !ex?.name) return;
      if (!harita.has(ex.name)) harita.set(ex.name, []);
      harita.get(ex.name).push({ date: w.date, note: not });
    });
  });
  return [...harita.entries()]
    .map(([name, notes]) => ({
      name,
      notes: notes.sort((a, b) => String(b.date).localeCompare(String(a.date))),
      count: notes.length,
      latest: notes[0],
    }))
    .sort((a, b) => String(b.latest.date).localeCompare(String(a.latest.date)));
};

/** Kaç hareket not taşıyor — arayüzde rozet için. */
export const noteCount = (workout) =>
  (workout?.exercises || []).filter(ex => parseNumber(normalizeNote(ex?.note).length) > 0).length;
