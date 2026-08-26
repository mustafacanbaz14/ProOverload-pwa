import { parseNumber } from './number.js';
import { estimate1RM, isCompletedWorkingSet, detectMuscleGroup } from './helpers.js';
import { formatDay } from './dates.js';

/**
 * Blok karşılaştırma: ne değişti ve ne üretti.
 *
 * Uygulama "bu hafta geçen haftaya göre" karşılaştırmasını yapıyordu ama tek
 * hafta bir blok değil: bir haftanın hacmi tatil, hastalık ya da yoğun bir iş
 * haftası yüzünden düşebilir ve bunun programla ilgisi yoktur. Antrenman
 * kararları dört-altı haftalık ölçekte veriliyor, karşılaştırma da orada
 * yapılmalı.
 *
 * Asıl tasarım kararı GİRDİ ile ÇIKTIyı ayırmak. Hacim, sıklık, şiddet ve
 * hareket sayısı senin seçtiğin şeyler — girdiler. Tahmini 1RM ise sonuç.
 * İkisini aynı listede karıştırmak, "hacmim %20 arttı" ile "gücüm %3 arttı"yı
 * eşit iki başarı gibi gösterirdi; oysa birincisi yalnızca ikincisinin bedeli.
 *
 * Çıktı ölçümünde tek kritik nokta: yalnızca İKİ BLOKTA DA yapılmış hareketler
 * karşılaştırılıyor. Yeni bir harekete başlamak ortalama 1RM'i düşürüyor
 * (teknik henüz oturmamış), bırakmak yükseltiyor. Ortak olmayanları saymak,
 * hareket değiştirmeyi gelişim ya da gerileme diye okumak olurdu.
 */

const ortalama = (dizi) => (dizi.length ? dizi.reduce((t, x) => t + x, 0) / dizi.length : 0);

/** Tek pencerenin ham özeti. */
const pencereOzeti = (workouts, customExercises, resolveLoad, weeks) => {
  const setler = [];
  const hareketler = new Map();
  // Yapılan hareketler ayrı sayılıyor: e1RM tablosu yalnızca tahmin
  // üretilebilen hareketleri tutuyor (Epley 15 tekrarın üstünde sayı
  // vermiyor) ve "farklı hareket" girdisi bu yüzden eksik çıkıyordu.
  const yapilan = new Set();
  const kaslar = new Map();
  let tonaj = 0;
  let etkiliSet = 0;
  let sure = 0;
  let sureliSeans = 0;

  workouts.forEach(w => {
    if (parseNumber(w.duration) > 0) { sure += parseNumber(w.duration); sureliSeans += 1; }
    (w.exercises || []).forEach(ex => {
      const calisma = (ex.sets || []).filter(isCompletedWorkingSet);
      if (calisma.length === 0) return;
      yapilan.add(ex.name);
      const { contributions } = detectMuscleGroup(ex.name, customExercises);
      Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
        kaslar.set(kas, (kaslar.get(kas) || 0) + calisma.length * agirlik);
      });

      let enIyi = 0;
      calisma.forEach(s => {
        const yuk = parseNumber(resolveLoad ? resolveLoad(ex.name, s.weight, w) : s.weight);
        const tekrar = parseNumber(s.reps);
        tonaj += yuk * tekrar;
        if (parseNumber(s.rir) <= 3) etkiliSet += 1;
        setler.push({ reps: tekrar, rir: parseNumber(s.rir) });
        enIyi = Math.max(enIyi, estimate1RM(yuk, s.reps, s.rir));
      });
      if (enIyi > 0) hareketler.set(ex.name, [...(hareketler.get(ex.name) || []), enIyi]);
    });
  });

  return {
    sessions: workouts.length,
    weeks: Math.max(1, weeks),
    sets: setler.length,
    effectiveSets: etkiliSet,
    tonnage: Math.round(tonaj),
    meanReps: Math.round(ortalama(setler.map(s => s.reps)) * 10) / 10,
    meanRir: Math.round(ortalama(setler.map(s => s.rir)) * 10) / 10,
    exercises: yapilan.size,
    meanDuration: sureliSeans ? Math.round(sure / sureliSeans) : 0,
    byExercise: hareketler,
    byMuscle: kaslar,
  };
};

const satir = (key, label, kind, before, after, unit = '', higherIsBetter = true) => {
  const fark = after - before;
  const yuzde = before > 0 ? Math.round((fark / before) * 1000) / 10 : null;
  return {
    key, label, kind, unit, higherIsBetter,
    before: Math.round(before * 10) / 10,
    after: Math.round(after * 10) / 10,
    delta: Math.round(fark * 10) / 10,
    deltaPct: yuzde,
    changed: Math.abs(yuzde ?? 0) >= 5,
  };
};

/**
 * @param options.weeks       her bloğun uzunluğu (varsayılan 4 hafta)
 * @param options.resolveLoad vücut ağırlığı taşıyan hareketlerde yük çözücü
 */
export const buildBlockCompare = (workouts = [], customExercises = [], {
  weeks = 4, resolveLoad = null, now = new Date(),
} = {}) => {
  const bitis = new Date(now);
  const ortaNokta = new Date(bitis);
  ortaNokta.setDate(bitis.getDate() - weeks * 7);
  const baslangic = new Date(bitis);
  baslangic.setDate(bitis.getDate() - weeks * 14);

  // Sıralama burada yapılıyor: çağıran taraf listeyi yeniden eskiye
  // veriyor olabilir ve tarih aralığı etiketi ters yazılıyordu.
  const hepsi = (workouts || []).filter(w => w?.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const yeni = hepsi.filter(w => new Date(w.date) >= ortaNokta && new Date(w.date) <= bitis);
  const eski = hepsi.filter(w => new Date(w.date) >= baslangic && new Date(w.date) < ortaNokta);

  if (yeni.length < 3 || eski.length < 3) {
    return {
      hasData: false, weeks,
      reason: `Karşılaştırma için her iki blokta da en az üç antrenman gerekiyor (şu an ${eski.length} ve ${yeni.length}).`,
    };
  }

  // Haftalık değerler seçilen pencere uzunluğuna bölünüyor, kayıt görülen
  // takvim haftası sayısına değil: dört haftalık bir pencere beş ayrı takvim
  // haftasına taşabiliyor ve iki bloğun bölenleri farklı çıkıyordu.
  const a = pencereOzeti(eski, customExercises, resolveLoad, weeks);
  const b = pencereOzeti(yeni, customExercises, resolveLoad, weeks);

  // Çıktı: yalnızca iki blokta da yapılmış hareketler.
  const ortak = [...b.byExercise.keys()].filter(ad => a.byExercise.has(ad));
  const hareketDegisimleri = ortak.map(ad => {
    const once = Math.max(...a.byExercise.get(ad));
    const sonra = Math.max(...b.byExercise.get(ad));
    return {
      name: ad,
      before: once,
      after: sonra,
      deltaPct: once > 0 ? Math.round(((sonra - once) / once) * 1000) / 10 : 0,
    };
  }).sort((x, y) => y.deltaPct - x.deltaPct);

  const ortalamaDegisim = hareketDegisimleri.length
    ? Math.round(ortalama(hareketDegisimleri.map(h => h.deltaPct)) * 10) / 10
    : null;

  const girdiler = [
    satir('sessions', 'Haftalık seans', 'input', a.sessions / a.weeks, b.sessions / b.weeks),
    satir('sets', 'Haftalık çalışma seti', 'input', a.sets / a.weeks, b.sets / b.weeks, ' set'),
    satir('effective', 'Haftalık etkili set', 'input', a.effectiveSets / a.weeks, b.effectiveSets / b.weeks, ' set'),
    satir('tonnage', 'Haftalık tonaj', 'input', a.tonnage / a.weeks, b.tonnage / b.weeks, ' kg'),
    // Ortalama RIR düştükçe şiddet artıyor; "yüksek daha iyi" değil.
    satir('rir', 'Ortalama RIR', 'input', a.meanRir, b.meanRir, '', false),
    satir('reps', 'Ortalama tekrar', 'input', a.meanReps, b.meanReps),
    satir('exercises', 'Farklı hareket', 'input', a.exercises, b.exercises),
    satir('duration', 'Ortalama seans süresi', 'input', a.meanDuration, b.meanDuration, ' dk'),
  ].filter(r => r.before > 0 || r.after > 0);

  const kasDegisimleri = [...new Set([...a.byMuscle.keys(), ...b.byMuscle.keys()])]
    .map(kas => {
      const once = (a.byMuscle.get(kas) || 0) / a.weeks;
      const sonra = (b.byMuscle.get(kas) || 0) / b.weeks;
      return {
        muscle: kas,
        before: Math.round(once * 10) / 10,
        after: Math.round(sonra * 10) / 10,
        delta: Math.round((sonra - once) * 10) / 10,
      };
    })
    .filter(k => Math.abs(k.delta) >= 1)
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));

  const enBuyukGirdi = [...girdiler]
    .filter(r => r.changed && r.key !== 'exercises')
    .sort((x, y) => Math.abs(y.deltaPct) - Math.abs(x.deltaPct))[0] || null;

  return {
    hasData: true,
    weeks,
    ranges: {
      previous: `${formatDay(eski[0]?.date)} – ${formatDay(eski.at(-1)?.date)}`,
      current: `${formatDay(yeni[0]?.date)} – ${formatDay(yeni.at(-1)?.date)}`,
    },
    inputs: girdiler,
    muscles: kasDegisimleri,
    shared: hareketDegisimleri.length,
    dropped: [...a.byExercise.keys()].filter(ad => !b.byExercise.has(ad)),
    added: [...b.byExercise.keys()].filter(ad => !a.byExercise.has(ad)),
    outcome: {
      meanChange: ortalamaDegisim,
      gainers: hareketDegisimleri.filter(h => h.deltaPct > 1).slice(0, 5),
      losers: [...hareketDegisimleri].reverse().filter(h => h.deltaPct < -1).slice(0, 5),
    },
    biggestInput: enBuyukGirdi,
    verdict: describeBlocks(enBuyukGirdi, ortalamaDegisim, hareketDegisimleri.length),
  };
};

/**
 * Girdi değişimi ile çıktıyı tek cümlede birleştirir.
 *
 * Cümle iddialı kurulmuyor: iki blok arasında değişen tek şey hacim değil.
 * Uyku, iş yoğunluğu, beslenme ve mevsim de değişti. Söylenebilecek en fazla
 * şey ikisinin birlikte hareket ettiği.
 */
export const describeBlocks = (input, meanChange, sharedCount) => {
  if (meanChange === null || sharedCount < 2) {
    return 'İki blokta da yapılmış yeterli ortak hareket yok; çıktı karşılaştırması güvenilir değil.';
  }
  const sonuc = meanChange > 1
    ? `ortak hareketlerde tahmini 1RM ortalama %${meanChange} arttı`
    : meanChange < -1
      ? `ortak hareketlerde tahmini 1RM ortalama %${Math.abs(meanChange)} düştü`
      : 'ortak hareketlerde tahmini 1RM neredeyse değişmedi';

  if (!input) return `Girdilerde belirgin bir değişiklik yok ve ${sonuc}.`;

  const yon = input.deltaPct > 0 ? 'arttı' : 'azaldı';
  return `${input.label} %${Math.abs(input.deltaPct)} ${yon} ve ${sonuc}.`
    + ' İki blok arasında değişen tek şey bu olmadığı için nedensellik çıkarılamaz;'
    + ' ama bir sonraki bloğu kurarken bakılacak ilk yer burası.';
};

/** Koç kartı: girdi belirgin arttığı halde çıktı gelmediyse. */
export const blockCoachItem = (report) => {
  if (!report?.hasData || report.shared < 3) return null;
  const g = report.biggestInput;
  const c = report.outcome.meanChange;
  if (!g || c === null) return null;
  // Yalnızca dikkat çeken durum: yük arttı, sonuç gelmedi.
  if (!(g.deltaPct > 15 && g.higherIsBetter && c <= 0)) return null;
  return {
    key: 'block-compare',
    tone: 'warn',
    title: 'Yük arttı ama sonuç gelmedi',
    detail: `Son ${report.weeks} haftada ${g.label.toLowerCase()} %${g.deltaPct} arttı; buna karşılık iki blokta da yaptığın ${report.shared} hareketin tahmini 1RM ortalaması %${Math.abs(c)} ${c < 0 ? 'düştü' : 'değişmedi'}. Daha fazla hacim eklemeden önce toparlanma, uyku ve beslenme tarafına bakmak daha olası bir çözüm.`,
  };
};
