import { estimate1RM, isCompletedWorkingSet, detectMuscleGroup } from './helpers.js';
import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';

/**
 * Kas karnesi.
 *
 * Bir kasın durumu üç ayrı ekrandan okunuyordu: hacim tablosundan yeterli mi,
 * 1RM grafiğinden ilerliyor mu, sıklık kartından yeterince bölünmüş mü. Üçü de
 * ayrı ayrı doğru, ama kullanıcı "göğsüm iyi gidiyor mu" diye sorduğunda üç
 * ekranı gezip kendi sentezini yapmak zorundaydı ve çoğunlukla yapmıyordu.
 *
 * Karne üçünü tek nota indiriyor. Notun kendisi kabaca bir özet; asıl değerli
 * olan yanındaki SINIRLAYICI ETKEN — nota hangi bileşenin çektiği. "Göğüs C"
 * bir şey söylemiyor, "Göğüs C, sınırlayan şey hacim" ne yapılacağını söylüyor.
 *
 * Ağırlıklar keyfi değil ama kesin de değil; şu sıraya dayanıyor: yeterli
 * hacim olmadan ilerleme olmaz (40), ilerleme asıl ölçülen sonuçtur (40),
 * sıklık aynı hacmin daha iyi dağıtılmasıdır — gerçek ama daha küçük bir
 * etki (20).
 */

const VOLUME_WEIGHT = 40;
const STRENGTH_WEIGHT = 40;
const FREQUENCY_WEIGHT = 20;

// İlerleme puanının uçları: sekiz haftalık pencerede %6 artış tam not,
// %6 gerileme sıfır. Aradaki her şey doğrusal.
const STRENGTH_CEILING = 6;

export const GRADES = [
  { key: 'A', min: 85, label: 'A', tone: 'good', summary: 'Hacim, ilerleme ve sıklık birlikte yerinde.' },
  { key: 'B', min: 70, label: 'B', tone: 'good', summary: 'İyi durumda; küçük bir bileşen geride.' },
  { key: 'C', min: 55, label: 'C', tone: 'info', summary: 'Çalışıyor ama bir bileşen belirgin şekilde çekiyor.' },
  { key: 'D', min: 40, label: 'D', tone: 'warn', summary: 'Bu kas programda hak ettiği yeri bulmuyor.' },
  { key: 'E', min: 0, label: 'E', tone: 'warn', summary: 'Neredeyse hiç ilerleme yok; program değişikliği gerekiyor.' },
];

const gradeFor = (score) => GRADES.find(g => score >= g.min) || GRADES.at(-1);

const ortalama = (dizi) => (dizi.length ? dizi.reduce((t, x) => t + x, 0) / dizi.length : 0);

const haftaAnahtari = (tarih) => {
  const d = new Date(tarih);
  if (Number.isNaN(d.getTime())) return '';
  const g = d.getDay();
  const pzt = new Date(d);
  pzt.setHours(0, 0, 0, 0);
  pzt.setDate(d.getDate() - g + (g === 0 ? -6 : 1));
  return `${pzt.getFullYear()}-${String(pzt.getMonth() + 1).padStart(2, '0')}-${String(pzt.getDate()).padStart(2, '0')}`;
};

const hacimPuani = (hacim, { mev, mav, mrv }) => {
  if (hacim <= 0) return 0;
  if (hacim < mev) return Math.round(VOLUME_WEIGHT * 0.6 * (hacim / mev));
  if (hacim <= mav) return Math.round(34 + 6 * ((hacim - mev) / Math.max(1, mav - mev)));
  if (hacim <= mrv) return Math.round(40 - 6 * ((hacim - mav) / Math.max(1, mrv - mav)));
  // Tavanın üstü ceza alıyor ama sıfıra inmiyor: fazla hacim yine de hacim,
  // sorun uyaran eksikliği değil toparlanma.
  return Math.max(18, Math.round(34 - 4 * (hacim - mrv)));
};

const kuvvetPuani = (degisimYuzde) => {
  const kirpik = Math.max(-STRENGTH_CEILING, Math.min(STRENGTH_CEILING, degisimYuzde));
  return Math.round(((kirpik + STRENGTH_CEILING) / (2 * STRENGTH_CEILING)) * STRENGTH_WEIGHT);
};

const siklikPuani = (haftalikSeans) => {
  if (haftalikSeans <= 0) return 0;
  if (haftalikSeans >= 3) return FREQUENCY_WEIGHT;
  if (haftalikSeans >= 2) return Math.round(18 + 2 * (haftalikSeans - 2));
  // Haftada bir ile iki arası: ikiye çıkmanın kazancı gerçek ama küçük.
  return Math.round(10 + 8 * (haftalikSeans - 1));
};

/**
 * @param options.weeks           pencere (varsayılan 8 hafta)
 * @param options.experienceLevel MEV/MAV/MRV ölçeği
 * @param options.resolveLoad     vücut ağırlığı taşıyan hareketlerde yük çözücü
 */
export const buildMuscleScorecard = (workouts = [], customExercises = [], {
  weeks = 8, experienceLevel = 'intermediate', resolveLoad = null, now = new Date(),
} = {}) => {
  const sinir = new Date(now);
  sinir.setDate(sinir.getDate() - weeks * 7);

  const pencere = [...(workouts || [])]
    .filter(w => w?.date && new Date(w.date) >= sinir)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (pencere.length === 0) {
    return { hasData: false, rows: [], trained: [], untrained: [...MUSCLE_GROUPS], weeks };
  }

  // Kas → hafta → { hacim, seans }
  const tablo = new Map(MUSCLE_GROUPS.map(m => [m, new Map()]));
  // Kas → hareket → e1rm serisi
  const kuvvet = new Map(MUSCLE_GROUPS.map(m => [m, new Map()]));

  pencere.forEach(w => {
    const hafta = haftaAnahtari(w.date);
    const seansKaslari = new Map();

    (w.exercises || []).forEach(ex => {
      const calisma = (ex.sets || []).filter(isCompletedWorkingSet);
      if (calisma.length === 0) return;
      const { muscle, contributions } = detectMuscleGroup(ex.name, customExercises);

      Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
        if (!tablo.has(kas)) return;
        seansKaslari.set(kas, (seansKaslari.get(kas) || 0) + calisma.length * agirlik);
      });

      // İlerleme yalnızca BİRİNCİL kasa yazılıyor: bench press'in triceps
      // ilerlemesi diye bir şey yok, o hareketin ilerlemesi göğsün.
      if (!kuvvet.has(muscle)) return;
      const en = Math.max(0, ...calisma.map(s => {
        const yuk = resolveLoad ? resolveLoad(ex.name, s.weight, w) : s.weight;
        return estimate1RM(yuk, s.reps, s.rir);
      }));
      if (en <= 0) return;
      const seri = kuvvet.get(muscle).get(ex.name) || [];
      seri.push(en);
      kuvvet.get(muscle).set(ex.name, seri);
    });

    seansKaslari.forEach((hacim, kas) => {
      const haftaTablosu = tablo.get(kas);
      const kayit = haftaTablosu.get(hafta) || { volume: 0, sessions: 0 };
      kayit.volume += hacim;
      if (hacim >= 2) kayit.sessions += 1;
      haftaTablosu.set(hafta, kayit);
    });
  });

  const haftaSayisi = Math.max(1, new Set(pencere.map(w => haftaAnahtari(w.date))).size);

  const rows = MUSCLE_GROUPS.map(kas => {
    const haftalar = [...tablo.get(kas).values()];
    const toplamHacim = haftalar.reduce((t, h) => t + h.volume, 0);
    const toplamSeans = haftalar.reduce((t, h) => t + h.sessions, 0);
    if (toplamHacim <= 0) {
      return { muscle: kas, trained: false, incidental: false, score: 0, grade: gradeFor(0), weeklyVolume: 0 };
    }
    // Hiçbir seansta iki set almamış bir kas hedeflenmiyor demek: çömelişin
    // bele yazdığı çeyrek setler bir "bel programı" değil. Bunlara not vermek
    // karnenin en düşük notunu her zaman aynı yan etki kasına yazdırıyor ve
    // asıl sorunlu kası listenin ortasında bırakıyordu.
    if (toplamSeans === 0) {
      return {
        muscle: kas, trained: false, incidental: true, score: 0, grade: gradeFor(0),
        weeklyVolume: Math.round((toplamHacim / haftaSayisi) * 10) / 10,
      };
    }

    const haftalikHacim = Math.round((toplamHacim / haftaSayisi) * 10) / 10;
    const haftalikSeans = Math.round((toplamSeans / haftaSayisi) * 10) / 10;
    const esikler = getVolumeLandmarks(kas, experienceLevel);

    // İlerleme: bu kasın birincil hareketlerinin ilk ve son yarılarının
    // ortalamaları. Tek hareketin kaprisi bütün kasın notunu belirlemesin
    // diye hareket hareket hesaplanıp ortalanıyor.
    const degisimler = [];
    kuvvet.get(kas).forEach(seri => {
      if (seri.length < 3) return;
      const yari = Math.max(1, Math.floor(seri.length / 2));
      const bas = ortalama(seri.slice(0, yari));
      const son = ortalama(seri.slice(-yari));
      if (bas > 0) degisimler.push(((son - bas) / bas) * 100);
    });
    const degisim = degisimler.length ? ortalama(degisimler) : null;

    const hp = hacimPuani(haftalikHacim, esikler);
    // İlerleme ölçülemiyorsa nötr (yarı puan) veriliyor: ölçemediğimiz için
    // sıfır vermek, yeni başlanan bir kası cezalandırmak olurdu.
    const kp = degisim === null ? Math.round(STRENGTH_WEIGHT / 2) : kuvvetPuani(degisim);
    const sp = siklikPuani(haftalikSeans);
    const puan = Math.min(100, hp + kp + sp);

    const bilesenler = [
      { key: 'volume', label: 'Hacim', score: hp, max: VOLUME_WEIGHT, ratio: hp / VOLUME_WEIGHT },
      { key: 'strength', label: 'İlerleme', score: kp, max: STRENGTH_WEIGHT, ratio: kp / STRENGTH_WEIGHT, estimated: degisim === null },
      { key: 'frequency', label: 'Sıklık', score: sp, max: FREQUENCY_WEIGHT, ratio: sp / FREQUENCY_WEIGHT },
    ];
    // Sınırlayıcı etken KAYIP PUANA göre seçiliyor, orana göre değil.
    // Bileşenlerin tavanları farklı (40/40/20) ve oran karşılaştırması bunu
    // görmezden geliyordu: koruma eşiğinin altındaki bir kas, yirmi bir puan
    // kaybettiği halde on bir puan kaybeden sıklığın arkasında kalıyordu.
    // Sorulan soru "hangi bileşen oransal olarak zayıf" değil, "hangisini
    // düzeltmek notu en çok yükseltir".
    const sinirlayan = [...bilesenler]
      .filter(b => !b.estimated)
      .sort((a, b) => (b.max - b.score) - (a.max - a.score) || a.ratio - b.ratio)[0] || bilesenler[0];

    return {
      muscle: kas,
      trained: true,
      score: puan,
      grade: gradeFor(puan),
      weeklyVolume: haftalikHacim,
      weeklySessions: haftalikSeans,
      landmarks: esikler,
      strengthChange: degisim === null ? null : Math.round(degisim * 10) / 10,
      strengthExercises: degisimler.length,
      components: bilesenler,
      limiting: sinirlayan,
      advice: adviceFor(kas, sinirlayan, haftalikHacim, esikler, haftalikSeans),
    };
  });

  const calisilan = rows.filter(r => r.trained).sort((a, b) => b.score - a.score);

  return {
    hasData: calisilan.length > 0,
    weeks: haftaSayisi,
    rows,
    trained: calisilan,
    untrained: rows.filter(r => !r.trained && !r.incidental).map(r => r.muscle),
    // Yan etkiyle çalışılan kaslar ayrı listeleniyor: "hiç çalışmıyorsun"
    // demek yanlış olurdu, "programda hedeflenmiyor" doğru.
    incidental: rows.filter(r => r.incidental).map(r => r.muscle),
    best: calisilan[0] || null,
    worst: calisilan.at(-1) || null,
    average: calisilan.length ? Math.round(ortalama(calisilan.map(r => r.score))) : 0,
  };
};

/** Sınırlayıcı bileşene göre tek cümlelik yapılacak iş. */
export const adviceFor = (kas, sinirlayan, hacim, esikler, siklik) => {
  if (!sinirlayan) return '';
  if (sinirlayan.key === 'volume') {
    if (hacim < esikler.mev) {
      return `Haftalık ${hacim} set, koruma eşiği ${esikler.mev}. Notun asıl sebebi bu — ${Math.ceil(esikler.mev - hacim)} set eklemek diğer iki bileşeni de yukarı çeker.`;
    }
    if (hacim > esikler.mrv) {
      return `Haftalık ${hacim} set, tavan ${esikler.mrv}. Fazlası uyaran eklemiyor, toparlanmadan alıyor; ${Math.ceil(hacim - esikler.mrv)} set çıkarmak notu yükseltir.`;
    }
    return `Hacim aralıkta ama optimuma (${esikler.mav} set) uzak.`;
  }
  if (sinirlayan.key === 'frequency') {
    return siklik < 2
      ? `Haftada ${siklik}× çalışılıyor. Aynı hacmi ikiye bölmek toplamı hiç artırmadan daha iyi sonuç veriyor.`
      : 'Sıklık yeterli.';
  }
  return `Hacim ve sıklık yerinde ama tahmini 1RM ilerlemiyor. Sorun program yapısında değil ilerleme yönteminde: yük, tekrar ya da hareket seçiminden birini değiştir.`;
};

/** Koç kartı: en düşük notlu kas, yalnızca gerçekten düşükse. */
export const scorecardCoachItem = (report) => {
  const w = report?.worst;
  if (!w || !w.trained) return null;
  if (w.grade.key !== 'D' && w.grade.key !== 'E') return null;
  return {
    key: 'muscle-scorecard',
    tone: 'warn',
    muscle: w.muscle,
    title: `${w.muscle} karnesi ${w.grade.label} — sınırlayan: ${w.limiting.label.toLowerCase()}`,
    detail: `${report.weeks} haftalık pencerede ${w.score}/100. ${w.advice}`,
  };
};
