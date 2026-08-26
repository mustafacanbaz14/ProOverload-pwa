/**
 * Koç odağı.
 *
 * Koç maddelerinin önceliği kodun içine sabitlenmişti ve bu sabitler herkes
 * için aynıydı. Ama aynı uygulamayı kullanan iki kişi aynı şeyi istemiyor:
 * biri kas kazanmaya çalışıyor, diğeri omzunu bir daha sakatlamamaya. İkisine
 * de aynı sırayla aynı sekiz maddeyi göstermek, ikisinin de kendi maddesini
 * listenin ortasında bulması demek.
 *
 * Odak, öncelikleri KAYDIRIYOR — silmiyor. Bir maddeyi tamamen kapatmak
 * kullanıcının işi (erteleme ve kapatma zaten var); odağın işi hangi konunun
 * öne çıkacağını belirlemek.
 *
 * Tek istisna kasıtlı: SAĞLIK VE TOPARLANMA maddeleri hiçbir odakta geri
 * itilmiyor. "Kas kazanımı" odağı seçen biri, eklem ağrısı uyarısını görmemeyi
 * seçmiş olmuyor. Bir tercih ekranının kullanıcıyı sakatlığa götürebilmesi
 * kabul edilebilir bir tasarım değil.
 */

// Koç maddesi anahtarı → konu başlığı. Anahtar listede yoksa 'other'.
export const ITEM_CATEGORIES = {
  volume: ['volume', 'no-week', 'frequency', 'frequency-plan', 'selection', 'weak-link', 'mesocycle', 'muscle-scorecard'],
  progress: ['plateau', 'plateau-decline', 'pr-watch', 'standards', 'rotation', 'order', 'exercise-order', 'rir', 'effort', 'exercise-roi', 'response-profile', 'perf-driver', 'technique-overuse'],
  recovery: ['deload', 'deload-running', 'deload-return', 'readiness-low', 'sleep', 'sleep-missing', 'resting-hr', 'acwr', 'form-overreach', 'form-fresh', 'rest-quality', 'time-of-day', 'adaptive-rest', 'block-compare', 'anomaly'],
  health: ['joint', 'pain', 'pain-guard', 'side-balance', 'balance', 'cycle', 'cycle-upcoming'],
  nutrition: ['protein', 'calories', 'peri-nutrition', 'hydration'],
  consistency: ['consistency', 'plan', 'dataHealth', 'metric', 'analysis-lock', 'coach-ledger', 'coach-protocol', 'conflict'],
  cardio: ['cardio', 'cardio-todo', 'cardio-balance'],
};

// Hiçbir odakta geri itilmeyen konular.
export const PROTECTED_CATEGORIES = ['health', 'recovery'];

/**
 * Eşleşme tam yapılıyor. Önek eşleşmesi ("sleep" → "sleep-missing") kısa
 * yoldan çalışıyor gibi görünüyor ama yeni bir anahtar eklendiğinde sessizce
 * yanlış kategoriye düşürüyor; listeye açıkça yazmak bir satır daha ama
 * hatası görünür.
 */
export const categoryOf = (key) => {
  if (!key) return 'other';
  const bulunan = Object.entries(ITEM_CATEGORIES).find(([, keys]) => keys.includes(key));
  return bulunan ? bulunan[0] : 'other';
};

/**
 * `boosts` öncelik sayısından ÇIKARILIYOR: koçta küçük sayı önde demek.
 * Pozitif değer öne çeker, negatif değer geri iter.
 */
export const COACH_FOCUSES = {
  balanced: {
    key: 'balanced', label: 'Dengeli', icon: 'scale',
    desc: 'Varsayılan sıra. Hiçbir konu öne çekilmiyor ya da geri itilmiyor.',
    boosts: {},
  },
  muscle: {
    key: 'muscle', label: 'Kas Kazanımı', icon: 'dumbbell',
    desc: 'Hacim, sıklık ve hareket seçimi öne geçer; kardiyo ve ölçüm hatırlatmaları geri düşer.',
    boosts: { volume: 2, progress: 1, nutrition: 1, cardio: -1, consistency: -1 },
  },
  strength: {
    key: 'strength', label: 'Kuvvet', icon: 'trending-up',
    desc: 'İlerleme, standartlar ve dinlenme kalitesi öne geçer; hacim uyarıları arkaya düşer.',
    boosts: { progress: 2, recovery: 1, volume: -1, nutrition: -1 },
  },
  health: {
    key: 'health', label: 'Sakatlıksız Kalmak', icon: 'shield',
    desc: 'Ağrı, denge ve toparlanma en öne geçer; hacim artırma tavsiyeleri en arkaya.',
    boosts: { health: 3, recovery: 2, volume: -2, progress: -1 },
  },
  consistency: {
    key: 'consistency', label: 'Düzen Kurmak', icon: 'calendar',
    desc: 'Plana uyum, veri girişi ve devamlılık öne geçer; ince ayar tavsiyeleri arkaya.',
    boosts: { consistency: 3, volume: -1, progress: -2 },
  },
  fatloss: {
    key: 'fatloss', label: 'Yağ Kaybı', icon: 'flame',
    desc: 'Beslenme, kardiyo ve ölçüm öne geçer; hacim artırma tavsiyeleri geri düşer.',
    boosts: { nutrition: 3, cardio: 2, consistency: 1, volume: -2 },
  },
};

export const findFocus = (key) => COACH_FOCUSES[key] || COACH_FOCUSES.balanced;

/**
 * Odağı listeye uygular.
 *
 * Sıralama kararlı: aynı ayarlanmış önceliğe sahip maddeler girdi sırasını
 * koruyor. Aksi halde kart her açılışta biraz farklı sıralanır ve kullanıcı
 * aradığı maddeyi bulamaz.
 */
export const applyCoachFocus = (items = [], focusKey = 'balanced') => {
  const odak = findFocus(focusKey);
  const liste = (items || []).map((item, i) => {
    const kategori = categoryOf(item.key);
    const ham = odak.boosts[kategori] || 0;
    // Korunan konular yalnızca öne çekilebiliyor, geri itilemiyor.
    const kaydirma = PROTECTED_CATEGORIES.includes(kategori) ? Math.max(0, ham) : ham;
    return {
      ...item,
      category: kategori,
      focusShift: kaydirma,
      // Öncelik 1'in altına inmesin: sıra değişsin ama ölçek bozulmasın.
      adjustedPriority: Math.max(1, (item.priority || 3) - kaydirma),
      __index: i,
    };
  });

  liste.sort((a, b) => a.adjustedPriority - b.adjustedPriority || a.__index - b.__index);

  return {
    focus: odak,
    items: liste.map((x) => {
      const temiz = { ...x };
      // Sıralama için eklenen girdi indeksi dışarı sızmamalı.
      delete temiz.__index;
      return temiz;
    }),
    // Kaç maddenin yeri değişti: kullanıcı odağın bir şey yaptığını görsün.
    shifted: liste.filter(x => x.focusShift !== 0).length,
    protectedCount: liste.filter(x => PROTECTED_CATEGORIES.includes(x.category)).length,
  };
};

/** Odağın ne yaptığının tek satırlık özeti. */
export const describeFocus = (result) => {
  if (!result?.focus) return '';
  if (result.focus.key === 'balanced') return 'Varsayılan sıra kullanılıyor.';
  const koruma = result.protectedCount > 0
    ? ` ${result.protectedCount} sağlık/toparlanma maddesi hiçbir odakta geri itilmiyor.`
    : '';
  return `${result.focus.label} odağı ${result.shifted} maddenin sırasını değiştirdi.${koruma}`;
};
