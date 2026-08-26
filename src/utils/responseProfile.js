import { parseNumber } from './number.js';
import { estimate1RM, isCompletedWorkingSet, detectMuscleGroup } from './helpers.js';
import { getVolumeLandmarks } from './constants.js';

/**
 * Tepki profili: SENİN neye tepki verdiğin.
 *
 * Uygulamanın bütün varsayılanları popülasyon ortalamalarından geliyor —
 * 6-10 tekrar, haftada iki gün, MEV ile MAV arası hacim. Bunlar iyi
 * başlangıç değerleri ama hiçbiri kişinin kendi kaydına bakmıyor. Oysa kayıt
 * yeterince uzunsa cevap orada duruyor: bu kişi hangi tekrar aralığında,
 * hangi hacim bandında ve hangi sıklıkta gerçekten daha hızlı ilerlemiş.
 *
 * Ölçü, seans BAŞINA tahmini 1RM kazancı. Neden seans başına: haftalık ölçmek
 * daha çok antrenman yapan bandı otomatik kazandırırdı — "haftada üç gün
 * çalışınca daha çok ilerliyorsun" bir keşif değil, tanım.
 *
 * Her kazanç, onu ÜRETEN seansın bandına yazılıyor: bir sonraki seansta
 * görülen artış, bir öncekinde yapılan işin sonucudur.
 *
 * Sınırları açıkça söyleniyor: bu bir deney değil gözlem. İnsan ağır çalıştığı
 * dönemde genellikle daha dinlenmiş ve daha motive olur; bandların farkı bu
 * dönemlerin farkını da içeriyor. Karar vermek için değil, denemeye nereden
 * başlanacağını seçmek için.
 */

// Bir bandın hakkında konuşulabilmesi için gereken gözlem sayısı.
const MIN_OBSERVATIONS = 6;
// Tek bir ölçüm hatasının bandı ele geçirmemesi için kazanç bu yüzdede kırpılıyor.
const GAIN_CAP = 15;
// İki bandın farkı bu puanın altındaysa "aynı" sayılıyor.
const MEANINGFUL_GAP = 0.25;

export const REP_BANDS = [
  { key: 'heavy', label: '1-5 tekrar', min: 1, max: 5, hint: 'kuvvet ağırlıklı' },
  { key: 'lowMid', label: '6-8 tekrar', min: 6, max: 8, hint: 'ağır hipertrofi' },
  { key: 'mid', label: '9-12 tekrar', min: 9, max: 12, hint: 'klasik hipertrofi' },
  { key: 'high', label: '13-20 tekrar', min: 13, max: 20, hint: 'metabolik' },
  { key: 'veryHigh', label: '20+ tekrar', min: 21, max: 999, hint: 'dayanıklılık ucu' },
];

export const VOLUME_BANDS = [
  { key: 'belowMev', label: 'Eşik altı', hint: 'MEV altında' },
  { key: 'mevMav', label: 'MEV–MAV', hint: 'koruma ile optimum arası' },
  { key: 'mavMrv', label: 'MAV–MRV', hint: 'optimum ile tavan arası' },
  { key: 'overMrv', label: 'Tavan üstü', hint: 'MRV üstünde' },
];

export const FREQUENCY_BANDS = [
  { key: 'f1', label: 'Haftada 1×', min: 1, max: 1 },
  { key: 'f2', label: 'Haftada 2×', min: 2, max: 2 },
  { key: 'f3', label: 'Haftada 3+×', min: 3, max: 99 },
];

const repBandFor = (reps) => REP_BANDS.find(b => reps >= b.min && reps <= b.max) || null;

const volumeBandFor = (volume, { mev, mav, mrv }) => {
  if (volume < mev) return 'belowMev';
  if (volume <= mav) return 'mevMav';
  if (volume <= mrv) return 'mavMrv';
  return 'overMrv';
};

const frequencyBandFor = (count) => FREQUENCY_BANDS.find(b => count >= b.min && count <= b.max) || null;

/**
 * Kırpılmış ortalama: uçlardan %10 atılıp kalanın ortalaması.
 *
 * Burada ortanca kullanılamıyor, çünkü ilerleme kesikli: kimse her seans
 * ağırlık artırmıyor, haftada bir artırıyor. Böyle bir seride gözlemlerin
 * yarısı tam sıfır çıkıyor ve ortanca sıfıra oturuyor — bütün bantlar "hiç
 * ilerleme yok" görünürdü.
 *
 * Kırpılmış ortalama iki tarafı da veriyor: uçtaki rekor seansı ya da ölçüm
 * hatası dışarıda kalıyor, ama sıfırlarla artışların karışımından gerçek bir
 * ortalama çıkıyor.
 */
const kirpilmisOrtalama = (dizi) => {
  if (dizi.length === 0) return 0;
  const s = [...dizi].sort((a, b) => a - b);
  const kirp = Math.floor(s.length * 0.1);
  const kalan = s.length > 4 ? s.slice(kirp, s.length - kirp) : s;
  return kalan.reduce((t, x) => t + x, 0) / kalan.length;
};

const haftaAnahtari = (tarih) => {
  const d = new Date(tarih);
  if (Number.isNaN(d.getTime())) return '';
  const g = d.getDay();
  const pzt = new Date(d);
  pzt.setHours(0, 0, 0, 0);
  pzt.setDate(d.getDate() - g + (g === 0 ? -6 : 1));
  return `${pzt.getFullYear()}-${String(pzt.getMonth() + 1).padStart(2, '0')}-${String(pzt.getDate()).padStart(2, '0')}`;
};

/**
 * @param options.experienceLevel hacim bandları için MEV/MAV/MRV ölçeği
 * @param options.resolveLoad     vücut ağırlığı taşıyan hareketlerde yük çözücü
 */
export const buildResponseProfile = (workouts = [], customExercises = [], {
  experienceLevel = 'intermediate', resolveLoad = null,
} = {}) => {
  const sirali = [...(workouts || [])]
    .filter(w => w?.date && (w.exercises || []).length > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sirali.length < 8) {
    return { hasData: false, sessions: sirali.length, repBands: [], volumeBands: [], frequencyBands: [] };
  }

  // Hafta → kas → { hacim, o kası çalıştıran seans sayısı }. Hacim bandı ve
  // sıklık bandı bu tablodan okunuyor; ikisi de tek bir seansın değil o
  // HAFTANIN özelliği.
  const haftalik = new Map();
  sirali.forEach(w => {
    const hafta = haftaAnahtari(w.date);
    if (!hafta) return;
    const tablo = haftalik.get(hafta) || new Map();
    const buSeansKaslari = new Map();
    (w.exercises || []).forEach(ex => {
      const setler = (ex.sets || []).filter(isCompletedWorkingSet).length;
      if (setler === 0) return;
      const { contributions } = detectMuscleGroup(ex.name, customExercises);
      Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
        buSeansKaslari.set(kas, (buSeansKaslari.get(kas) || 0) + setler * agirlik);
      });
    });
    buSeansKaslari.forEach((hacim, kas) => {
      const kayit = tablo.get(kas) || { volume: 0, sessions: 0 };
      kayit.volume += hacim;
      // Yarım set katkısı "o kas çalışıldı" saymaya yetmiyor: bench press'in
      // tricepse yazdığı katkı sıklığı şişirirdi.
      if (hacim >= 2) kayit.sessions += 1;
      tablo.set(kas, kayit);
    });
    haftalik.set(hafta, tablo);
  });

  // Hareket bazında seans serisi.
  const seriler = new Map();
  sirali.forEach(w => {
    (w.exercises || []).forEach(ex => {
      const calisma = (ex.sets || []).filter(isCompletedWorkingSet);
      if (calisma.length === 0) return;
      const e1rmler = calisma.map(s => {
        const yuk = resolveLoad ? resolveLoad(ex.name, s.weight, w) : s.weight;
        return estimate1RM(yuk, s.reps, s.rir);
      }).filter(v => v > 0);
      if (e1rmler.length === 0) return;
      const tekrarlar = calisma.map(s => parseNumber(s.reps)).filter(r => r > 0);
      if (tekrarlar.length === 0) return;

      const liste = seriler.get(ex.name) || [];
      liste.push({
        date: w.date,
        week: haftaAnahtari(w.date),
        e1rm: Math.max(...e1rmler),
        meanReps: tekrarlar.reduce((t, r) => t + r, 0) / tekrarlar.length,
        sets: calisma.length,
      });
      seriler.set(ex.name, liste);
    });
  });

  const gozlemler = [];
  seriler.forEach((seri, ad) => {
    if (seri.length < 3) return;
    const { muscle } = detectMuscleGroup(ad, customExercises);
    const esikler = getVolumeLandmarks(muscle, experienceLevel);

    for (let i = 0; i < seri.length - 1; i += 1) {
      const su = seri[i];
      const sonraki = seri[i + 1];
      const gecenGun = (new Date(sonraki.date) - new Date(su.date)) / 86400000;
      // Bir aydan uzun aradan sonraki değişim o seansın sonucu değil.
      if (!(gecenGun > 0 && gecenGun <= 28)) continue;
      if (su.e1rm <= 0) continue;

      const ham = ((sonraki.e1rm - su.e1rm) / su.e1rm) * 100;
      const kazanc = Math.max(-GAIN_CAP, Math.min(GAIN_CAP, ham));
      const haftaKaydi = haftalik.get(su.week)?.get(muscle);

      gozlemler.push({
        exercise: ad,
        muscle,
        date: su.date,
        gain: kazanc,
        repBand: repBandFor(Math.round(su.meanReps))?.key || null,
        volumeBand: haftaKaydi ? volumeBandFor(haftaKaydi.volume, esikler) : null,
        frequencyBand: haftaKaydi ? frequencyBandFor(haftaKaydi.sessions)?.key || null : null,
      });
    }
  });

  const bandOzeti = (tanimlar, alan) => tanimlar.map(b => {
    const kayitlar = gozlemler.filter(g => g[alan] === b.key);
    return {
      ...b,
      observations: kayitlar.length,
      enough: kayitlar.length >= MIN_OBSERVATIONS,
      // Kırpılmış ortalama: uçlar atılıyor ama sıfırlarla artışların karışımı
      // korunuyor.
      gainPerSession: kayitlar.length ? Math.round(kirpilmisOrtalama(kayitlar.map(g => g.gain)) * 100) / 100 : 0,
      exercises: new Set(kayitlar.map(g => g.exercise)).size,
    };
  });

  const repBands = bandOzeti(REP_BANDS, 'repBand');
  const volumeBands = bandOzeti(VOLUME_BANDS, 'volumeBand');
  const frequencyBands = bandOzeti(FREQUENCY_BANDS, 'frequencyBand');

  const enIyi = (bandlar) => {
    const gecerli = bandlar.filter(b => b.enough);
    if (gecerli.length < 2) return null;
    const sirali2 = [...gecerli].sort((a, b) => b.gainPerSession - a.gainPerSession);
    const fark = sirali2[0].gainPerSession - sirali2.at(-1).gainPerSession;
    // İki band arasında anlamlı fark yoksa "en iyi" demek uydurmak olur.
    if (fark < MEANINGFUL_GAP) return { ...sirali2[0], tie: true, gap: Math.round(fark * 100) / 100 };
    return { ...sirali2[0], tie: false, gap: Math.round(fark * 100) / 100, worst: sirali2.at(-1) };
  };

  const bestRep = enIyi(repBands);
  const bestVolume = enIyi(volumeBands);
  const bestFrequency = enIyi(frequencyBands);

  return {
    hasData: gozlemler.length >= MIN_OBSERVATIONS * 2,
    sessions: sirali.length,
    observations: gozlemler.length,
    exercises: seriler.size,
    repBands,
    volumeBands,
    frequencyBands,
    best: { rep: bestRep, volume: bestVolume, frequency: bestFrequency },
    identity: describeIdentity(bestRep, bestVolume, bestFrequency),
  };
};

/** Profilin tek cümlelik özeti — yalnızca ayrım gerçekten varsa. */
export const describeIdentity = (bestRep, bestVolume, bestFrequency) => {
  const parcalar = [];
  if (bestRep && !bestRep.tie) {
    parcalar.push(`${bestRep.label} bandında seans başına %${bestRep.gainPerSession} ilerlemişsin`
      + ` (${bestRep.worst.label} bandında %${bestRep.worst.gainPerSession})`);
  }
  if (bestVolume && !bestVolume.tie) {
    parcalar.push(`hacim ${bestVolume.label} aralığındayken daha iyi tepki vermişsin`);
  }
  if (bestFrequency && !bestFrequency.tie) {
    parcalar.push(`${bestFrequency.label.toLowerCase()} çalıştığın kaslar daha hızlı ilerlemiş`);
  }
  if (parcalar.length === 0) return null;
  return parcalar.join('; ') + '.';
};

/** Koç kartı: yalnızca varsayılandan belirgin biçimde ayrışan bir profil varsa. */
export const responseProfileCoachItem = (profile) => {
  const r = profile?.best?.rep;
  if (!r || r.tie || !profile.hasData) return null;
  // Varsayılan aralıkla aynı sonucu söyleyen bir kart bilgi taşımıyor.
  if (r.key === 'mid' || r.key === 'lowMid') return null;
  return {
    key: 'response-profile',
    tone: 'info',
    title: `${r.label} bandında daha hızlı ilerliyorsun`,
    detail: `${profile.observations} seans geçişinde ölçüldü: bu bantta seans başına %${r.gainPerSession}, en yavaş bantta %${r.worst.gainPerSession} kazanç. Bu bir deney değil gözlem — ağır çalıştığın dönemler aynı zamanda daha dinlenmiş olduğun dönemler de olabilir. Yine de bir sonraki bloğu buradan kurmayı denemeye değer.`,
  };
};
