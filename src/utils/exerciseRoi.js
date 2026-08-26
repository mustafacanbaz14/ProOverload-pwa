import { estimate1RM, isCompletedWorkingSet, detectMuscleGroup } from './helpers.js';

/**
 * Hareket getirisi: hangi hareket yerini hak ediyor.
 *
 * Program kurarken sorulan soru hep "hangi hareketi ekleyeyim" oluyor; asla
 * "hangisini çıkarayım" değil. Oysa seans süresi sabit ve her hareket başka
 * bir hareketin yerini alıyor. Uygulama duraklamayı hareket bazında zaten
 * yakalıyordu ama duraklama ile VERİM aynı şey değil: ilerleyen ama bunun
 * için haftada on iki set yiyen bir hareket, altı setle aynı kazancı veren
 * hareketten pahalı.
 *
 * Ölçü: yatırılan on set başına tahmini 1RM kazancı. Set, seansta harcanan
 * paranın birimi — süre de yorgunluk da onunla ölçülüyor.
 *
 * İki tuzağa karşı önlem alınıyor:
 *
 *  1. İZOLASYON HAKSIZLIĞI. Lateral raise ile squat aynı ölçekte ilerlemiyor;
 *     mutlak sıralama izolasyonları her zaman en dibe yazardı. Bu yüzden asıl
 *     sıralama KAS İÇİNDE yapılıyor — aynı kası çalıştıran hareketler
 *     birbiriyle karşılaştırılıyor.
 *  2. YENİ HAREKET YANILGISI. Yeni başlanan bir harekette ilk haftalarda
 *     görülen sıçrama kas kazancı değil teknik öğrenmesi. Bu yüzden en az
 *     dört seans ve yirmi bir gün isteniyor.
 *
 * Düşük getirili bir hareket KÖTÜ hareket değil: eklem dostu olduğu için ya
 * da bir zayıf noktayı hedeflediği için tutuluyor olabilir. Modül bunu
 * söylüyor ve silme kararını vermiyor.
 */

const MIN_SESSIONS = 4;
const MIN_SPAN_DAYS = 21;

const ortalama = (dizi) => (dizi.length ? dizi.reduce((t, x) => t + x, 0) / dizi.length : 0);

/**
 * @param options.windowDays  bakılacak pencere (varsayılan 180 gün)
 * @param options.resolveLoad vücut ağırlığı taşıyan hareketlerde yük çözücü
 */
export const buildExerciseRoi = (workouts = [], customExercises = [], {
  windowDays = 180, resolveLoad = null, now = new Date(),
} = {}) => {
  const sinir = new Date(now);
  sinir.setDate(sinir.getDate() - windowDays);

  const seriler = new Map();
  [...(workouts || [])]
    .filter(w => w?.date && new Date(w.date) >= sinir)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(w => (w.exercises || []).forEach(ex => {
      const calisma = (ex.sets || []).filter(isCompletedWorkingSet);
      if (calisma.length === 0) return;
      const e1rmler = calisma.map(s => {
        const yuk = resolveLoad ? resolveLoad(ex.name, s.weight, w) : s.weight;
        return estimate1RM(yuk, s.reps, s.rir);
      }).filter(v => v > 0);
      if (e1rmler.length === 0) return;
      const liste = seriler.get(ex.name) || [];
      liste.push({ date: w.date, best: Math.max(...e1rmler), sets: calisma.length });
      seriler.set(ex.name, liste);
    }));

  const satirlar = [];
  seriler.forEach((seri, ad) => {
    if (seri.length < MIN_SESSIONS) return;
    const gun = (new Date(seri.at(-1).date) - new Date(seri[0].date)) / 86400000;
    if (gun < MIN_SPAN_DAYS) return;

    // Baş ve son üçte bir: tek seansın ucundan ölçmek, iyi ya da kötü bir
    // günü bütün hareketin verimi sanmak olurdu.
    const dilim = Math.max(1, Math.round(seri.length / 3));
    const bas = ortalama(seri.slice(0, dilim).map(s => s.best));
    const son = ortalama(seri.slice(-dilim).map(s => s.best));
    if (bas <= 0) return;

    const toplamSet = seri.reduce((t, s) => t + s.sets, 0);
    const kazanc = son - bas;
    const kazancYuzde = (kazanc / bas) * 100;
    const { muscle, mechanics } = detectMuscleGroup(ad, customExercises);

    satirlar.push({
      name: ad,
      muscle,
      mechanics,
      sessions: seri.length,
      days: Math.round(gun),
      sets: toplamSet,
      setsPerWeek: Math.round((toplamSet / Math.max(1, gun / 7)) * 10) / 10,
      from: Math.round(bas),
      to: Math.round(son),
      gain: Math.round(kazanc * 10) / 10,
      gainPct: Math.round(kazancYuzde * 10) / 10,
      // Ana ölçü: on set yatırım başına yüzde kazanç.
      roi: Math.round((kazancYuzde / toplamSet) * 100) / 10,
    });
  });

  // Kas içi sıralama: aynı kası çalıştıran hareketler birbirine göre
  // konumlanıyor, izolasyon bileşkeyle yarışmıyor.
  const kaslar = new Map();
  satirlar.forEach(r => {
    const liste = kaslar.get(r.muscle) || [];
    liste.push(r);
    kaslar.set(r.muscle, liste);
  });
  kaslar.forEach(liste => {
    liste.sort((a, b) => b.roi - a.roi);
    liste.forEach((r, i) => {
      r.rankInMuscle = i + 1;
      r.muscleCount = liste.length;
      // Aynı kasta en az iki hareket varsa, sondaki "aynı kas için daha iyi
      // bir seçenek zaten programında" demek. Tek hareketse çıkarmak o kası
      // programdan silmek olur; öneri yapılmıyor.
      r.underperforming = liste.length >= 2 && i === liste.length - 1
        && r.roi < liste[0].roi * 0.5 && r.setsPerWeek >= 3;
    });
  });

  const sirali = satirlar.sort((a, b) => b.roi - a.roi);
  const zayif = sirali.filter(r => r.underperforming);

  return {
    hasData: sirali.length >= 2,
    items: sirali,
    top: sirali.slice(0, 5),
    bottom: [...sirali].reverse().slice(0, 5),
    underperformers: zayif,
    byMuscle: [...kaslar.entries()]
      .map(([muscle, items]) => ({ muscle, items }))
      .filter(g => g.items.length >= 2)
      .sort((a, b) => b.items.length - a.items.length),
    totalSets: sirali.reduce((t, r) => t + r.sets, 0),
    windowDays,
  };
};

/** Koç kartı: yalnızca aynı kasta belirgin bir alternatifi olan zayıf hareket varsa. */
export const roiCoachItem = (report) => {
  const z = report?.underperformers?.[0];
  if (!z) return null;
  const daha = report.byMuscle.find(g => g.muscle === z.muscle)?.items?.[0];
  if (!daha || daha.name === z.name) return null;
  return {
    key: 'exercise-roi',
    tone: 'info',
    title: `${z.name} yatırdığın seti geri vermiyor`,
    detail: `${z.days} günde ${z.sets} çalışma seti yapıldı ve tahmini 1RM %${z.gainPct} değişti; aynı kasta ${daha.name} on set başına ${Math.round((daha.roi / Math.max(0.01, Math.abs(z.roi))) * 10) / 10} kat daha fazla getirmiş. Bu hareketin kötü olduğu anlamına gelmiyor — eklem dostu olduğu ya da bir zayıf noktayı hedeflediği için duruyor olabilir. Ama bilinçli bir tercih değilse setlerinin bir kısmını taşımayı denemeye değer.`,
  };
};

/** Bir hareketin getiri satırı — hareket profilinde tek satır göstermek için. */
export const roiFor = (report, name) =>
  (report?.items || []).find(r => r.name === name) || null;

export const describeRoi = (row) => {
  if (!row) return '';
  if (row.gainPct === 0) return `${row.sets} set yatırıldı, tahmini 1RM değişmedi.`;
  const yon = row.gainPct > 0 ? 'arttı' : 'düştü';
  return `${row.days} günde ${row.sets} set · ${row.from} → ${row.to} kg (%${Math.abs(row.gainPct)} ${yon})`
    + ` · on set başına %${row.roi}`;
};
