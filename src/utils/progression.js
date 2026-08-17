import { parseNumber } from './number.js';
import { isWorkingSet, estimate1RM } from './helpers.js';
import { SMALL_MUSCLE_GROUPS } from './constants.js';

/**
 * Hareket başına ilerleme kuralı.
 *
 * `suggestNextTarget` tek bir sabit algoritma uyguluyordu ve o algoritma
 * herkesin her hareketi için doğru değil. Bench press ile yan kaldırış aynı
 * kuralla ilerletilemez: birinde 2,5 kg'lık sıçrama makul, diğerinde iki
 * haftalık kazancı bir anda istemek demek. Aynı şekilde tek tekrar maksimumu
 * peşindeki biriyle hacim peşindeki biri aynı kuralı kullanmaz.
 *
 * Dört kural var ve hepsi AYNI VERİDEN besleniyor (son seansın çalışma
 * setleri); fark, "ne zaman ağırlık artar" sorusuna verdikleri cevapta.
 *
 * Kural seçilmemiş hareketler `double` kullanıyor — hipertrofi için en yaygın
 * ve en bağışlayıcı olan o.
 */

export const PROGRESSION_RULES = {
  double: {
    key: 'double',
    label: 'Çift İlerleme',
    short: 'Çift',
    hint: 'Aralığın üstüne çık, sonra ağırlığı artır',
    detail: 'Önce tekrarı hedef aralığın üst ucuna kadar çıkarırsın; BÜTÜN setlerde üst uca ulaştığında ağırlık artar ve tekrar alt uca döner. Hipertrofi için en yaygın kural: yük artışını hak edilene kadar geciktirdiği için tekniği koruyor.',
  },
  linear: {
    key: 'linear',
    label: 'Doğrusal',
    short: 'Doğrusal',
    hint: 'Her seans ağırlığı artır',
    detail: 'Hedef tekrarı tutturduğun her seansta ağırlık artar. Yeni başlayanlarda hızlı sonuç verir; ileri seviyede birkaç haftada tıkanır çünkü vücut o hızda uyum sağlayamaz.',
  },
  rir: {
    key: 'rir',
    label: 'RIR Tabanlı',
    short: 'RIR',
    hint: 'Yedek tekrar hedefe göre ayarla',
    detail: 'Ağırlık, RIR hedefine göre ayarlanır: yedek tekrarın hedeften fazlaysa yük artar, azsa düşer. Efor algısına güvenen ve seansları arasında performansı dalgalanan için en esnek kural.',
  },
  fixed: {
    key: 'fixed',
    label: 'Sabit',
    short: 'Sabit',
    hint: 'Ağırlığı kendim ayarlarım',
    detail: 'Uygulama ağırlık önermez, yalnızca geçmişi gösterir. Teknik çalışması, rehabilitasyon ya da ısınma amaçlı hareketler için.',
  },
};

export const PROGRESSION_KEYS = Object.keys(PROGRESSION_RULES);

export const findProgressionRule = (key) => PROGRESSION_RULES[key] || PROGRESSION_RULES.double;

/** Ayarlardaki kuralı okur; yazılmamışsa varsayılan çift ilerleme. */
export const progressionFor = (exerciseName, overrides = {}) =>
  findProgressionRule((overrides || {})[exerciseName]);

export const setProgressionRule = (overrides = {}, exerciseName, key) => {
  const sonraki = { ...(overrides || {}) };
  // Varsayılana dönüş kaydı silmekle yapılıyor: her harekete satır yazmak
  // ayarları gereksiz şişirirdi.
  if (!key || key === 'double') delete sonraki[exerciseName];
  else if (PROGRESSION_KEYS.includes(key)) sonraki[exerciseName] = key;
  return sonraki;
};

/** Küçük kas gruplarında 2,5 kg'lık sıçrama çok büyük kalır. */
const artisAdimi = (muscle) => (SMALL_MUSCLE_GROUPS.includes(muscle) ? 1.25 : 2.5);

/**
 * Seçilen kurala göre bir sonraki seans hedefi.
 *
 * @returns { weight, reps, strategy, note, rule } | null
 */
export const nextTargetByRule = (previousSets = [], {
  repRangeMin = 6, repRangeMax = 10, muscle = null, rule = 'double', targetRir = 2,
} = {}) => {
  const calisma = (previousSets || [])
    .filter(s => isWorkingSet(s) && parseNumber(s.reps) > 0);
  if (calisma.length === 0) return null;

  const enAgir = Math.max(...calisma.map(s => parseNumber(s.weight)));
  const tepeSetler = calisma.filter(s => parseNumber(s.weight) === enAgir);
  const ortTekrar = Math.round(
    tepeSetler.reduce((t, s) => t + parseNumber(s.reps), 0) / tepeSetler.length);
  const ortRir = tepeSetler.reduce((t, s) => t + parseNumber(s.rir), 0) / tepeSetler.length;
  const adim = artisAdimi(muscle);
  const kural = findProgressionRule(rule);

  if (kural.key === 'fixed') {
    return {
      weight: enAgir,
      reps: ortTekrar,
      strategy: 'fixed',
      rule: kural.key,
      note: `Son seans ${enAgir} kg × ${ortTekrar}. Bu harekette ağırlığı sen ayarlıyorsun.`,
    };
  }

  if (kural.key === 'linear') {
    // Hedef tekrarı tutturduysa artır; tutturamadıysa aynı yükte tekrar dene.
    const tutturdu = ortTekrar >= repRangeMin;
    return tutturdu
      ? {
        weight: Number((enAgir + adim).toFixed(2)),
        reps: repRangeMin,
        strategy: 'load',
        rule: kural.key,
        note: `${ortTekrar} tekrar yapıldı, alt hedef ${repRangeMin}; ağırlık +${adim} kg.`,
      }
      : {
        weight: enAgir,
        reps: repRangeMin,
        strategy: 'hold',
        rule: kural.key,
        note: `${ortTekrar} tekrar, alt hedef ${repRangeMin}. Ağırlık aynı kalsın; hedefi tutturunca artacak.`,
      };
  }

  if (kural.key === 'rir') {
    const fark = ortRir - targetRir;
    // Bir tam yedek tekrarlık sapma yük ayarını hak ediyor; altındaki fark
    // ölçüm gürültüsü sayılıyor çünkü RIR tahmini o hassasiyette değil.
    if (fark >= 1) {
      return {
        weight: Number((enAgir + adim).toFixed(2)),
        reps: ortTekrar,
        strategy: 'load',
        rule: kural.key,
        note: `RIR ${ortRir.toFixed(1)}, hedef ${targetRir}; yedek tekrar fazla, ağırlık +${adim} kg.`,
      };
    }
    if (fark <= -1) {
      const hafif = Number((enAgir - adim).toFixed(2));
      return {
        weight: Math.max(0, hafif),
        reps: ortTekrar,
        strategy: 'reset',
        rule: kural.key,
        note: `RIR ${ortRir.toFixed(1)}, hedef ${targetRir}; yük fazla, −${adim} kg.`,
      };
    }
    return {
      weight: enAgir,
      reps: ortTekrar,
      strategy: 'hold',
      rule: kural.key,
      note: `RIR ${ortRir.toFixed(1)} hedefin (${targetRir}) etrafında; ağırlık aynı kalsın.`,
    };
  }

  // --- çift ilerleme (varsayılan) ---
  // Ağırlık ancak BÜTÜN tepe setler üst uca ulaştığında artıyor. Ortalamaya
  // bakmak yanıltıcıydı: 12-8-8 ortalaması 9 çıkıyor ve "aralığın içindesin"
  // deniyordu, oysa ilk set dışında hedef tutturulmamıştı.
  const hepsiUstUcta = tepeSetler.every(s => parseNumber(s.reps) >= repRangeMax);
  if (hepsiUstUcta && ortRir >= 0.5) {
    return {
      weight: Number((enAgir + adim).toFixed(2)),
      reps: repRangeMin,
      strategy: 'load',
      rule: kural.key,
      note: `Bütün setler ${repRangeMax} tekrara ulaştı; ağırlık +${adim} kg, tekrar ${repRangeMin}'e döner.`,
    };
  }
  if (ortRir === 0 && ortTekrar < repRangeMin) {
    const hafif = Number((enAgir * 0.95).toFixed(2));
    return {
      weight: hafif,
      reps: repRangeMin,
      strategy: 'reset',
      rule: kural.key,
      note: `Aralığın altında tükendin; %5 azalt (${hafif} kg) ve temiz tekrarla geri tırman.`,
    };
  }
  return {
    weight: enAgir,
    reps: Math.min(repRangeMax, ortTekrar + 1),
    strategy: 'reps',
    rule: kural.key,
    note: `Aynı ağırlıkta ${Math.min(repRangeMax, ortTekrar + 1)} tekrar hedefle; üst uca ulaşınca yük artar.`,
  };
};

/**
 * Bir sonraki seansın hedef kartı: şablondaki her hareket için somut hedef.
 *
 * Hedefler tek tek hareket ekranında görünüyordu; seansa başlamadan önce
 * "bugün ne yapacağım" sorusunun toplu cevabı yoktu ve kullanıcı salonda
 * hareket hareket geçmişe bakıyordu.
 */
export const buildNextSessionTargets = (template, workouts = [], {
  repRangeFor: araligiBul = null, resolveLoad = null, overrides = {}, customExercises = [], muscleOf = null,
} = {}) => {
  if (!template?.exercises?.length) return null;

  const gecmis = new Map();
  (workouts || []).forEach(w => {
    (w.exercises || []).forEach(ex => {
      if (!ex?.name || gecmis.has(ex.name)) return;
      gecmis.set(ex.name, { date: w.date, workout: w, sets: ex.sets || [] });
    });
  });

  const satirlar = template.exercises.map(ex => {
    const son = gecmis.get(ex.name);
    const aralik = araligiBul ? araligiBul(ex.name) : { min: 6, max: 10 };
    const kural = progressionFor(ex.name, overrides);
    if (!son) {
      return {
        name: ex.name,
        rule: kural,
        firstTime: true,
        target: null,
        lastDate: null,
        note: 'İlk kez yapılacak; rahat bir ağırlıkla başla ve tekniği oturt.',
      };
    }

    const setler = resolveLoad
      ? son.sets.map(s => ({ ...s, weight: resolveLoad(ex.name, s.weight, son.workout) }))
      : son.sets;

    return {
      name: ex.name,
      rule: kural,
      firstTime: false,
      lastDate: son.date,
      target: nextTargetByRule(setler, {
        repRangeMin: aralik.min,
        repRangeMax: aralik.max,
        muscle: muscleOf ? muscleOf(ex.name, customExercises) : null,
        rule: kural.key,
      }),
      lastBest: (() => {
        const calisma = setler.filter(s => isWorkingSet(s) && parseNumber(s.reps) > 0);
        if (calisma.length === 0) return null;
        const enIyi = calisma.reduce((best, s) => (
          estimate1RM(s.weight, s.reps, s.rir) > estimate1RM(best.weight, best.reps, best.rir) ? s : best));
        return { weight: parseNumber(enIyi.weight), reps: parseNumber(enIyi.reps), rir: parseNumber(enIyi.rir) };
      })(),
    };
  });

  return {
    templateName: template.name,
    rows: satirlar,
    // İlerleme bekleyen hareket sayısı: kaçında ağırlık artacak.
    loadIncreases: satirlar.filter(r => r.target?.strategy === 'load').length,
    firstTimers: satirlar.filter(r => r.firstTime).length,
  };
};
