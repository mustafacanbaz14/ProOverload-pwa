import { parseNumber } from './number.js';
import { isCompletedWorkingSet, detectMuscleGroup } from './helpers.js';

/**
 * Yetmezliğe yakınlık reçetesi.
 *
 * Uygulama RIR'ı setin yanına yazdırıyordu ama hiçbir yerde HEDEFLEMİYORDU.
 * Bu boşluk hacim modeli değiştikten sonra kritik hale geldi: düşük hacimli
 * çalışmanın bütün dayanağı "daha az set ama yetmezliğe daha yakın". Hedef
 * verilmeden hacim düşürülürse geriye yalnızca daha az iş kalır.
 *
 * Robinson, Refalo ve ark. (2024) hipertrofinin yetmezliğe yaklaştıkça
 * arttığını, kuvvette ise ilişkinin ihmal edilebilir olduğunu buluyor. Bu iki
 * farklı çıkarım demek:
 *   - hipertrofi hedefi varsa yakınlık bir KALDIRAÇ,
 *   - kuvvet hedefi varsa yakınlığı zorlamanın karşılığı yok, yorgunluğu var.
 *
 * Hareket tipine göre ayrım da aynı mantıktan: çok eklemli ağır bileşke
 * hareketlerde yetmezliğe gitmenin bedeli (teknik bozulması, eklem yükü,
 * sonraki setleri yeme) izolasyondakinden yüksek. Bu bir güvenlik tercihi ve
 * literatürden çıkarılmış bir sayı değil — kartta böyle yazıyor.
 */

export const PROXIMITY_TARGETS = {
  compound: {
    key: 'compound', label: 'Bileşke', rir: [1, 2],
    hint: 'Çok eklemli ağır hareketler. Yetmezliğe gitmenin bedeli burada en yüksek.',
  },
  isolation: {
    key: 'isolation', label: 'İzolasyon', rir: [0, 1],
    hint: 'Tek eklemli hareketler. Teknik riski düşük, yetmezliğe yaklaşmanın maliyeti az.',
  },
  deload: {
    key: 'deload', label: 'Boşaltma', rir: [3, 4],
    hint: 'Amaç uyaran değil toparlanma. Yakınlık bilinçli olarak azaltılıyor.',
  },
  strength: {
    key: 'strength', label: 'Kuvvet bloğu', rir: [2, 3],
    hint: 'Kuvvette yakınlıkla kazanç arasında anlamlı ilişki bulunmadı; yorgunluk biriktirmeden çalışmak daha verimli.',
  },
};

export const findProximityTarget = (key) => PROXIMITY_TARGETS[key] || PROXIMITY_TARGETS.compound;

/** Bir hareketin varsayılan yakınlık hedefi. */
export const targetForExercise = (name, {
  customExercises = [], overrides = {}, deload = false, goal = 'hypertrophy',
} = {}) => {
  const elle = parseNumber((overrides || {})[name]);
  if (Number.isFinite(elle) && (overrides || {})[name] !== undefined && (overrides || {})[name] !== '') {
    return { rir: [elle, elle], source: 'manual', key: 'manual', label: 'Elle yazıldı' };
  }
  if (deload) return { ...findProximityTarget('deload'), source: 'deload' };
  if (goal === 'strength') return { ...findProximityTarget('strength'), source: 'goal' };

  const { mechanics, contributions } = detectMuscleGroup(name, customExercises);
  const anlamli = Object.values(contributions || {}).filter(w => w >= 0.5).length;
  const bilesik = mechanics !== 'Isolation' && anlamli >= 2;
  return { ...findProximityTarget(bilesik ? 'compound' : 'isolation'), source: 'auto' };
};

/** Hedefin tek satırlık metni. */
export const describeTarget = (t) => {
  if (!t) return '';
  const [alt, ust] = t.rir;
  return alt === ust ? `Hedef RIR ${alt}` : `Hedef RIR ${alt}-${ust}`;
};

/**
 * Gerçekleşen yakınlığı hedefle karşılaştırır.
 *
 * @param workouts antrenman kayıtları
 * @returns { hasData, rows, meanRir, tooFar, tooClose, verdict }
 */
export const buildProximityReport = (workouts = [], {
  customExercises = [], overrides = {}, weeks = 4, now = new Date(), goal = 'hypertrophy',
} = {}) => {
  const sinir = new Date(now);
  sinir.setDate(sinir.getDate() - weeks * 7);

  const hareketler = new Map();
  (workouts || [])
    .filter(w => w?.date && new Date(w.date) >= sinir)
    .forEach(w => (w.exercises || []).forEach(ex => {
      const calisma = (ex.sets || []).filter(isCompletedWorkingSet);
      if (calisma.length === 0) return;
      const rirler = calisma.map(s => parseNumber(s.rir)).filter(Number.isFinite);
      if (rirler.length === 0) return;
      const kayit = hareketler.get(ex.name) || { name: ex.name, rirs: [], sets: 0 };
      kayit.rirs.push(...rirler);
      kayit.sets += calisma.length;
      hareketler.set(ex.name, kayit);
    }));

  const rows = [...hareketler.values()]
    // Üç setin altında ortalama RIR bir eğilim değil, tek bir günün kaprisi.
    .filter(r => r.sets >= 3)
    .map(r => {
      const hedef = targetForExercise(r.name, { customExercises, overrides, goal });
      const ortalama = Math.round((r.rirs.reduce((t, x) => t + x, 0) / r.rirs.length) * 10) / 10;
      const [alt, ust] = hedef.rir;
      const durum = ortalama > ust + 0.5 ? 'far' : ortalama < alt - 0.5 ? 'close' : 'onTarget';
      return {
        name: r.name,
        sets: r.sets,
        meanRir: ortalama,
        target: hedef,
        targetLabel: describeTarget(hedef),
        status: durum,
        gap: durum === 'far' ? Math.round((ortalama - ust) * 10) / 10
          : durum === 'close' ? Math.round((alt - ortalama) * 10) / 10 : 0,
      };
    })
    .sort((a, b) => b.gap - a.gap);

  const tumRirler = rows.flatMap(r => Array(r.sets).fill(r.meanRir));
  const genelOrtalama = tumRirler.length
    ? Math.round((tumRirler.reduce((t, x) => t + x, 0) / tumRirler.length) * 10) / 10
    : null;
  const uzak = rows.filter(r => r.status === 'far');

  return {
    hasData: rows.length > 0,
    weeks,
    rows,
    meanRir: genelOrtalama,
    tooFar: uzak,
    tooClose: rows.filter(r => r.status === 'close'),
    onTarget: rows.filter(r => r.status === 'onTarget'),
    // Not: RIR kişinin KENDİ tahmini. İnsanlar yetmezliğe uzaklığını
    // sistematik olarak fazla tahmin ediyor, yani gerçek yakınlık burada
    // görünenden büyük olasılıkla daha uzak.
    caveat: 'RIR ölçülmüyor, tahmin ediliyor. Araştırmalar insanların yetmezliğe uzaklığını sistematik olarak fazla tahmin ettiğini gösteriyor: gerçek yakınlık burada görünenden muhtemelen daha uzak.',
  };
};

/**
 * Koç kartı.
 *
 * Yalnızca hacmi düşük OLMAYAN birine gösteriliyor: hacim eşiğin altındayken
 * "daha sert çalış" demek yanlış sırayla müdahale etmek olurdu.
 */
export const proximityCoachItem = (report, { volumeBelowThreshold = false } = {}) => {
  if (!report?.hasData || volumeBelowThreshold) return null;
  const uzak = report.tooFar;
  if (uzak.length < 2) return null;
  const ilk = uzak.slice(0, 3).map(r => r.name).join(', ');
  return {
    key: 'proximity',
    tone: 'info',
    title: `${uzak.length} harekette setler yetmezliğe uzak bitiyor`,
    detail: `${ilk} — ortalama RIR hedefin ${uzak[0].gap} tekrar üstünde. Hipertrofi setler yetmezliğe yaklaştıkça artıyor ve bu, hacim eklemeden kullanabileceğin bir kaldıraç. ${report.caveat}`,
  };
};
