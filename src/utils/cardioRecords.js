import { parseNumber } from './number.js';
import { findActivity } from './cardio.js';
import { summarizeSets, formatSeconds, isSwim } from './cardioSets.js';

/**
 * Kardiyo rekorları.
 *
 * Ağırlık tarafında rekorlar (1RM, tonaj) hem izleniyor hem kutlanıyordu;
 * kardiyoda hiçbir karşılığı yoktu. Oysa dayanıklılıkta ilerleme MESAFE
 * BAŞINA SÜRE ile ölçülüyor ve bu, uygulamanın zaten kaydettiği veriden
 * çıkarılabiliyor.
 *
 * İki kaynak var ve ikisi de kullanılıyor:
 *  - Set defteri satırları: "8 × 100 m" içindeki tek 100 m'nin süresi.
 *  - Tek satırlık kayıtlar: toplam mesafe ve süre.
 *
 * Rekor yalnızca TAM eşleşen mesafede sayılıyor: 1200 m'lik bir yüzmeden
 * "1000 m rekoru" türetmek, tempoyu sabit varsaymak olurdu ve o varsayım
 * çoğu zaman yanlış.
 */

/** Rekor tutulan mesafeler (metre), aktivite ailesine göre. */
export const RECORD_DISTANCES = {
  swim: [50, 100, 200, 400, 800, 1500],
  run: [400, 1000, 1609, 3000, 5000, 10000],
  row: [500, 1000, 2000, 5000],
  bike: [5000, 10000, 20000, 40000],
};

const FAMILY = {
  swim: 'swim',
  run: 'run', interval: 'run', zone2: 'run', walk: 'run', walk_incline: 'run', treadmill_walk: 'run',
  rower: 'row', ski_erg: 'row',
  bike: 'bike', spinning: 'bike', stationary_bike: 'bike',
};

export const familyOf = (activityKey) => FAMILY[activityKey] || null;

/** Mesafeyi okunabilir etikete çevirir. */
export const distanceLabel = (meters) => (meters >= 1000
  ? `${Math.round((meters / 1000) * 100) / 100} km`
  : `${meters} m`);

/**
 * Kayıtlardan mesafe bazlı en iyi süreler.
 *
 * @returns { records, hasData }
 */
export const buildCardioRecords = (workouts = [], { poolLength = 25 } = {}) => {
  // aile -> mesafe -> en iyi
  const enIyi = new Map();

  const kaydet = (aile, mesafe, saniye, meta) => {
    if (!(saniye > 0)) return;
    const anahtar = `${aile}|${mesafe}`;
    const mevcut = enIyi.get(anahtar);
    if (!mevcut || saniye < mevcut.seconds) {
      enIyi.set(anahtar, { family: aile, distance: mesafe, seconds: saniye, ...meta });
    }
  };

  (workouts || []).forEach(w => {
    (w.cardio || []).forEach(entry => {
      const aile = familyOf(entry?.type);
      if (!aile) return;
      const mesafeler = RECORD_DISTANCES[aile] || [];

      // 1) Set defteri satırları: her satır kendi mesafesinde bir deneme.
      if (Array.isArray(entry.sets) && entry.sets.length > 0) {
        summarizeSets(entry.sets, entry.type, { poolLength }).sets.forEach(r => {
          if (r.kind.key !== 'work') return;
          if (!mesafeler.includes(r.distance) || !(r.seconds > 0)) return;
          kaydet(aile, r.distance, r.seconds, {
            date: w.date,
            activity: entry.type,
            stroke: r.stroke?.key || null,
            source: 'set',
          });
        });
      }

      // 2) Tek satırlık kayıt: toplam mesafe tam eşleşiyorsa.
      const km = parseNumber(entry.distanceKm);
      const dk = parseNumber(entry.minutes);
      if (km > 0 && dk > 0) {
        const metre = Math.round(km * 1000);
        if (mesafeler.includes(metre)) {
          kaydet(aile, metre, dk * 60, {
            date: w.date, activity: entry.type, stroke: null, source: 'entry',
          });
        }
      }
    });
  });

  const records = [...enIyi.values()]
    .map(r => {
      const birim = isSwim(r.activity) ? 100 : 1000;
      return {
        ...r,
        label: distanceLabel(r.distance),
        timeLabel: formatSeconds(r.seconds),
        pace: (r.seconds / r.distance) * birim,
        paceLabel: `${formatSeconds((r.seconds / r.distance) * birim)} /${isSwim(r.activity) ? '100 m' : 'km'}`,
        activityInfo: findActivity(r.activity),
      };
    })
    .sort((a, b) => a.family.localeCompare(b.family) || a.distance - b.distance);

  const byFamily = {};
  records.forEach(r => {
    byFamily[r.family] = byFamily[r.family] || [];
    byFamily[r.family].push(r);
  });

  return { records, byFamily, hasData: records.length > 0 };
};

/**
 * Bu seansta kırılan rekorlar.
 *
 * Rekor listesi seansın KENDİSİ dışarıda bırakılarak kurulmalı; yoksa her
 * kayıt kendi kendisiyle karşılaştırılır ve her seans "rekor" görünür.
 */
export const recordsBrokenIn = (workout, previousRecords) => {
  if (!workout) return [];
  const onceki = new Map((previousRecords?.records || []).map(r => [`${r.family}|${r.distance}`, r]));
  const simdi = buildCardioRecords([workout]);
  return simdi.records.filter(r => {
    const eski = onceki.get(`${r.family}|${r.distance}`);
    return !eski || r.seconds < eski.seconds;
  });
};
