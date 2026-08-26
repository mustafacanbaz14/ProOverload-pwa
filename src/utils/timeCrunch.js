import { parseNumber } from './number.js';
import { isWorkingSet, detectMuscleGroup } from './helpers.js';
import { lengthBias } from './selectionAudit.js';
import { estimateDuration } from './templates.js';

/**
 * Zaman sıkışması: seansı akıllıca kısaltma.
 *
 * "Bugün sadece 30 dakikam var" durumunda kullanıcının iki seçeneği vardı:
 * seansı hiç yapmamak ya da rastgele hareket atlayıp neyi kaybettiğini
 * bilmemek. İkisi de kötü — özellikle ikincisi, çünkü atlanan genellikle
 * SONDAKİ hareketler oluyor ve program sonuna izolasyonları değil bazen
 * bir kasın tek hareketini koymuş oluyorsun.
 *
 * Kısaltma neyin daha değerli olduğuna göre yapılıyor. Değer sırası:
 *
 *  1. BİLEŞKE hareketler. En çok kas kütlesini uyarıyorlar; zaman kısıtlıysa
 *     korunacak ilk şey bunlar.
 *  2. Bir kasın TEK hareketi. O hareketi atmak o kası seanstan tamamen
 *     çıkarıyor; iki hareketi olan kastan bir tane atmak ise yalnızca
 *     hacmi azaltıyor.
 *  3. GERİLMEDE yükleyen hareketler. Uyaranın en değerli parçası.
 *
 * Önce SET kısılıyor, sonra hareket atılıyor: üç seti ikiye indirmek, bir
 * hareketi tamamen atmaktan her zaman daha az kayıp. Her hareketin en az
 * iki seti korunuyor — tek set o kası "çalışıldı" saymaya yetmiyor.
 */

const MIN_SETS_KEPT = 2;

/** Bir hareketin korunma önceliği: yüksek olan en son elden çıkıyor. */
const oncelikPuani = (ex, { customExercises = [], kasSayaci = new Map() } = {}) => {
  const { muscle, contributions, mechanics } = detectMuscleGroup(ex.name, customExercises);
  const anlamli = Object.values(contributions || {}).filter(w => w >= 0.5).length;
  const bilesik = mechanics !== 'Isolation' && anlamli >= 2;

  let puan = 0;
  if (bilesik) puan += 100;
  // O kasın seanstaki tek hareketi mi.
  if ((kasSayaci.get(muscle) || 0) <= 1) puan += 60;
  if (lengthBias(ex.name) === 'stretch') puan += 25;
  // Sıra da bir sinyal: kullanıcı önemli olanı öne koymuş olabilir.
  puan += Math.max(0, 20 - (ex.__index || 0) * 3);
  return { score: puan, muscle, compound: bilesik };
};

/**
 * Seansı verilen dakikaya sığdıracak plan.
 *
 * @returns { fits, plan, dropped, trimmed, before, after }
 */
export const planTimeCrunch = (exercises = [], targetMinutes, {
  restSeconds = 120, customExercises = [],
} = {}) => {
  const liste = (exercises || [])
    .map((ex, i) => ({ ...ex, __index: i }))
    .filter(ex => ex?.name && (ex.sets || []).length > 0);
  if (liste.length === 0) return { fits: true, plan: [], dropped: [], trimmed: [] };

  const hedef = Math.max(10, parseNumber(targetMinutes));
  const sureHesapla = (l) => estimateDuration(l, restSeconds);
  const oncekiSure = sureHesapla(liste);
  if (oncekiSure <= hedef) {
    return { fits: true, plan: liste, dropped: [], trimmed: [], before: oncekiSure, after: oncekiSure };
  }

  const kasSayaci = new Map();
  liste.forEach(ex => {
    const { muscle } = detectMuscleGroup(ex.name, customExercises);
    kasSayaci.set(muscle, (kasSayaci.get(muscle) || 0) + 1);
  });

  const puanli = liste.map(ex => ({ ex, ...oncekiPuanGuvenli(ex, customExercises, kasSayaci) }));
  // Çalışma kopyası: setleri kısarken özgün nesneler bozulmasın.
  let plan = puanli.map(p => ({
    ...p,
    sets: (p.ex.sets || []).slice(),
  }));
  const trimmed = [];
  const dropped = [];

  // 1. AŞAMA: en düşük öncelikliden başlayarak set kıs.
  let guvenlik = 0;
  while (sureHesapla(plan.map(p => ({ ...p.ex, sets: p.sets }))) > hedef && guvenlik < 200) {
    guvenlik += 1;
    // Adaylar: en az iki seti korunacak kadar seti olanlar. Yalnızca en düşük
    // öncelikliyi seçmek bir hareketi tabana kadar tıraşlarken diğerini el
    // değmemiş bırakıyordu; onun yerine düşük öncelikli YARIDAN, en çok seti
    // olan kısılıyor. Böylece kayıp seansa yayılıyor.
    const adaylar = plan
      .filter(p => p.sets.filter(isWorkingSet).length > MIN_SETS_KEPT)
      .sort((a, b) => a.score - b.score);
    if (adaylar.length === 0) break;
    const dusukYari = adaylar.slice(0, Math.max(1, Math.ceil(adaylar.length / 2)));
    const aday = dusukYari.sort((a, b) =>
      b.sets.filter(isWorkingSet).length - a.sets.filter(isWorkingSet).length
      || a.score - b.score)[0];
    // Son çalışma setini at.
    const sonIndex = aday.sets.map(isWorkingSet).lastIndexOf(true);
    if (sonIndex < 0) break;
    aday.sets = aday.sets.filter((_, i) => i !== sonIndex);
    const kayit = trimmed.find(t => t.name === aday.ex.name);
    if (kayit) kayit.removed += 1;
    else trimmed.push({ name: aday.ex.name, removed: 1 });
  }

  // 2. AŞAMA: hâlâ sığmıyorsa en düşük öncelikli hareketi tamamen çıkar.
  guvenlik = 0;
  while (sureHesapla(plan.map(p => ({ ...p.ex, sets: p.sets }))) > hedef && plan.length > 1 && guvenlik < 50) {
    guvenlik += 1;
    const sirali = [...plan].sort((a, b) => a.score - b.score);
    const atilan = sirali[0];
    plan = plan.filter(p => p !== atilan);
    dropped.push({
      name: atilan.ex.name,
      muscle: atilan.muscle,
      compound: atilan.compound,
      // Neden atıldığı yazılıyor: sessizce silinen bir hareket, kullanıcının
      // programına neden uymadığını bilmemesi demek.
      reason: atilan.compound
        ? 'Bileşke ama süre yetmedi'
        : `${atilan.muscle} için ikinci hareket`,
    });
    // Atılan hareketin kısılmış setleri de kayıttan düşsün.
    const i = trimmed.findIndex(t => t.name === atilan.ex.name);
    if (i >= 0) trimmed.splice(i, 1);
  }

  const sonuc = plan.map(p => ({ ...p.ex, sets: p.sets }));
  const sonrakiSure = sureHesapla(sonuc);

  return {
    fits: sonrakiSure <= hedef,
    // `__index` yalnızca puanlama için eklenmişti; dışarı sızmamalı.
    plan: sonuc.map(ex => {
      const kopya = { ...ex };
      delete kopya.__index;
      return kopya;
    }),
    dropped,
    trimmed,
    before: oncekiSure,
    after: sonrakiSure,
    target: hedef,
    setsBefore: liste.reduce((t, ex) => t + (ex.sets || []).filter(isWorkingSet).length, 0),
    setsAfter: sonuc.reduce((t, ex) => t + (ex.sets || []).filter(isWorkingSet).length, 0),
  };
};

/** Puanlama yardımcısı — `__index` alanı dışarı sızmasın diye ayrı. */
const oncekiPuanGuvenli = (ex, customExercises, kasSayaci) =>
  oncelikPuani(ex, { customExercises, kasSayaci });

/** Kısaltmanın insan okunur özeti. */
export const describeTimeCrunch = (result) => {
  if (!result) return null;
  if (result.fits && result.dropped.length === 0 && result.trimmed.length === 0) {
    return 'Seans zaten hedef süreye sığıyor.';
  }
  const parcalar = [];
  if (result.trimmed.length > 0) {
    const toplam = result.trimmed.reduce((t, x) => t + x.removed, 0);
    parcalar.push(`${toplam} set kısıldı`);
  }
  if (result.dropped.length > 0) parcalar.push(`${result.dropped.length} hareket çıkarıldı`);
  const bas = parcalar.join(', ');
  return `${bas}: ${result.before} dk → ${result.after} dk.`
    + (result.fits ? '' : ' Hedef süreye yine de sığmıyor; bileşke hareketler korunuyor.');
};
