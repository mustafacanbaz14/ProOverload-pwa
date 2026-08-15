import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';
import { detectMuscleGroup, isCompletedWorkingSet } from './helpers.js';
import { weekBounds, dayKey } from './dates.js';

/**
 * Kas çalışma sıklığı.
 *
 * Uygulama haftalık hacmi kas kas sayıyordu ama SIKLIĞI hiç görmüyordu: göğse
 * haftada 16 set yazmak, bunu tek güne sıkıştırmakla iki güne bölmek arasındaki
 * farkı ayırt etmiyordu. Oysa bu fark antrenman kalitesini doğrudan etkiliyor.
 *
 * Kanıt durumu dürüstçe: aynı haftalık hacimde daha yüksek sıklığın avantajı
 * ÖLÇÜLÜ ve küçük. Asıl mekanizma sıklığın kendisi değil, hacmin dağılması —
 * bir seansta üst üste yığılan setlerde son setlerin kalitesi düşüyor ve
 * pratikte o setler daha az işe yarıyor. Bu yüzden buradaki tavsiye "daha sık
 * çalış" değil, "yüksek hacmi tek seansa sıkıştırma" biçiminde kuruluyor.
 */

/**
 * Bir kası "o gün çalıştı" saymak için gereken en az hacim.
 *
 * Eşik olmasa bench press'in tricepse yazdığı yarım set bile "o gün triceps
 * çalıştı" sayılırdı ve sıklık her kas için şişerdi. İki set, bir kasın o
 * seansta gerçekten hedeflendiğini gösteren makul alt sınır.
 */
const SESSION_THRESHOLD = 2;

/**
 * Seans başına verimli set tavanı.
 *
 * Set sayısı arttıkça set başına katkı azalıyor; literatürde sık anılan aralık
 * 6-10 arası. Üst sınır alınıyor çünkü amaç alarm üretmek değil, gerçekten
 * aşırı yığılmış seansları işaretlemek.
 */
const SETS_PER_SESSION_CEILING = 10;

/**
 * Haftalık kas sıklığı ve dağılımı.
 *
 * @param workouts antrenman kayıtları
 * @param opts.weeks kaç TAM hafta geriye bakılacak
 * @returns { weeks, byMuscle: [...], trainedMuscles }
 */
export const buildFrequencyReport = (workouts = [], {
  customExercises = [],
  experienceLevel = 'intermediate',
  weeks = 4,
  today = new Date(),
} = {}) => {
  // İçinde bulunulan hafta henüz bitmediği için sıklık ortalamasını aşağı
  // çeker; yalnızca tamamlanmış haftalara bakılıyor.
  const buHafta = weekBounds(dayKey(today));
  const pencereBaslangic = new Date(buHafta.start);
  pencereBaslangic.setDate(pencereBaslangic.getDate() - weeks * 7);
  const ilkGun = dayKey(pencereBaslangic);
  const sonGun = dayKey(new Date(buHafta.start.getTime() - 86400000));

  // kas -> hafta -> { gunler: Set, hacim: number }
  const tablo = new Map();
  const haftalar = new Set();

  (workouts || []).forEach(workout => {
    const tarih = dayKey(workout?.date);
    if (!tarih || tarih < ilkGun || tarih > sonGun) return;
    const hafta = weekBounds(tarih).startKey;
    haftalar.add(hafta);

    // Bir seansta aynı kasa birden çok hareket katkı verebilir; önce gün
    // içinde toplanıyor, sonra eşiğe bakılıyor.
    const gunlukHacim = {};
    (workout.exercises || []).forEach(ex => {
      const setSayisi = (ex.sets || []).filter(isCompletedWorkingSet).length;
      if (setSayisi === 0) return;
      const { contributions } = detectMuscleGroup(ex.name, customExercises);
      Object.entries(contributions || {}).forEach(([kas, katki]) => {
        gunlukHacim[kas] = (gunlukHacim[kas] || 0) + setSayisi * katki;
      });
    });

    Object.entries(gunlukHacim).forEach(([kas, hacim]) => {
      const kasKaydi = tablo.get(kas) || new Map();
      const haftaKaydi = kasKaydi.get(hafta) || { gunler: new Map(), hacim: 0 };
      haftaKaydi.hacim += hacim;
      // Gün başına hacim ayrı tutuluyor: en yoğun seansın payı buradan çıkıyor.
      haftaKaydi.gunler.set(tarih, (haftaKaydi.gunler.get(tarih) || 0) + hacim);
      kasKaydi.set(hafta, haftaKaydi);
      tablo.set(kas, kasKaydi);
    });
  });

  const haftaSayisi = Math.max(1, haftalar.size);

  const byMuscle = MUSCLE_GROUPS.map(kas => {
    const kasKaydi = tablo.get(kas);
    if (!kasKaydi || kasKaydi.size === 0) {
      return {
        muscle: kas, trained: false, sessionsPerWeek: 0, weeklyVolume: 0,
        biggestSession: 0, concentration: 0, recommended: 0, verdict: 'none',
        advice: null,
      };
    }

    let toplamSeans = 0;
    let toplamHacim = 0;
    let enBuyukSeans = 0;

    kasKaydi.forEach(hafta => {
      // Eşiğin altında kalan günler "o kas çalıştı" sayılmıyor.
      const anlamliGunler = [...hafta.gunler.values()].filter(h => h >= SESSION_THRESHOLD);
      toplamSeans += anlamliGunler.length;
      toplamHacim += hafta.hacim;
      enBuyukSeans = Math.max(enBuyukSeans, ...[...hafta.gunler.values()]);
    });

    const seansHafta = Math.round((toplamSeans / haftaSayisi) * 10) / 10;
    const haftalikHacim = Math.round((toplamHacim / haftaSayisi) * 10) / 10;
    // Önerilen sıklık: haftalık hacmi seans tavanına bölmek.
    const onerilen = Math.max(1, Math.ceil(haftalikHacim / SETS_PER_SESSION_CEILING));

    const { mev } = getVolumeLandmarks(kas, experienceLevel);
    let verdict = 'ok';
    let advice = null;

    if (seansHafta === 0) {
      // Hacim var ama hiçbir gün eşiği geçmemiş: bu kas hedeflenmiyor, yalnızca
      // başka hareketlerin yan katkısıyla besleniyor.
      verdict = 'incidental';
      advice = 'Yalnızca başka hareketlerin yan katkısını alıyor; doğrudan hedefleyen bir hareket yok.';
    } else if (haftalikHacim < mev) {
      verdict = 'low-volume';
      advice = `Haftalık hacim koruma eşiğinin (MEV ${mev}) altında; sıklıktan önce hacim gerekiyor.`;
    } else if (enBuyukSeans > SETS_PER_SESSION_CEILING && seansHafta < onerilen) {
      verdict = 'concentrated';
      advice = `En yoğun seansta ${Math.round(enBuyukSeans)} set birikmiş. Aynı hacmi ${onerilen} seansa bölmek son setlerin kalitesini korur — sıklığın kendisi küçük bir fark, asıl kazanç setlerin yığılmaması.`;
    }

    return {
      muscle: kas,
      trained: true,
      sessionsPerWeek: seansHafta,
      weeklyVolume: haftalikHacim,
      biggestSession: Math.round(enBuyukSeans * 10) / 10,
      // En yoğun seansın haftalık hacme oranı: 1 = her şey tek güne yığılmış.
      concentration: haftalikHacim > 0
        ? Math.round((enBuyukSeans / haftalikHacim) * 100) / 100
        : 0,
      recommended: onerilen,
      verdict,
      advice,
    };
  });

  return {
    weeks: haftaSayisi,
    rangeStart: ilkGun,
    rangeEnd: sonGun,
    byMuscle,
    trainedMuscles: byMuscle.filter(m => m.trained).length,
    // Öne çıkarılacak olanlar: hacmi yeterli ama tek seansa sıkışmış kaslar.
    concentrated: byMuscle.filter(m => m.verdict === 'concentrated'),
    hasData: byMuscle.some(m => m.trained),
  };
};

/** Sıklık raporundan koç için tek maddelik özet; sorun yoksa null. */
export const frequencyCoachItem = (report) => {
  if (!report?.hasData || report.concentrated.length === 0) return null;
  const enKotu = [...report.concentrated].sort((a, b) => b.biggestSession - a.biggestSession)[0];
  return {
    muscle: enKotu.muscle,
    title: `${enKotu.muscle} tek seansa yığılmış`,
    detail: enKotu.advice,
  };
};
