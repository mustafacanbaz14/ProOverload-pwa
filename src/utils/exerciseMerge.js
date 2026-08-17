import { DEFAULT_EXERCISES } from './constants.js';
import { foldForSearch } from './helpers.js';

/**
 * İki hareketi tek harekete birleştirme.
 *
 * Uygulamanın erken sürümlerinde kütüphanede olmayan bir hareketi kullanıcı
 * elle ekliyordu. Sonraki sürümlerde aynı hareket kütüphaneye girince ortada
 * AYNI İŞİ ANLATAN İKİ AD kalıyor: "Kablo Yan Kaldırış" ve "Cable Lateral
 * Raise". Uygulama bunları iki ayrı hareket sayıyor, dolayısıyla:
 *
 *  - rekorlar ikiye bölünüyor, hiçbiri gerçek rekoru göstermiyor,
 *  - hacim eğrisi kopuk görünüyor, gelişim izlenemiyor,
 *  - hareket listesi iki kopyayla şişiyor ve hangisinin seçileceği belirsiz.
 *
 * Birleştirme kullanıcının GEÇMİŞİNİ SİLMEDEN bu ikiliği kapatıyor: kaybeden
 * adın geçtiği her yer kazanan adla değiştiriliyor, kaybeden hareketin tanımı
 * kütüphaneden kalkıyor.
 *
 * Adlar tek bir yerde durmuyor; bu yüzden birleştirme AYNI ANDA sekiz yeri
 * gezmek zorunda (geçmiş, aktif seans, şablonlar, özel hareket tanımları,
 * görünürlük listeleri, kuvvet hedefleri, tekrar aralıkları, ağrı günlüğü).
 * Bir tanesi atlanırsa kullanıcı birleştirdiği hareketi bir yerlerde hâlâ
 * ayrı görüyor ve bu, hiç birleştirmemekten daha kafa karıştırıcı.
 *
 * Yapılan iş geri alınabilir: `applyExerciseMerge` değiştirdiği her koleksiyonun
 * eski halini döndürmüyor — bunun yerine çağıran taraf yalnızca değişen
 * koleksiyonları geri yazıyor (bkz. App.jsx). Böylece geri alma, birleştirme
 * sırasında yapılmış BAŞKA bir değişikliği ezmiyor.
 */

/**
 * Ad karşılaştırması: büyük/küçük harf, Türkçe karakter ve fazla boşluk farkını
 * yok sayar. Boşluk katlaması burada yapılıyor, `foldForSearch`'te değil —
 * arama kutusunda kullanıcı boşluk yazarken eşleşme davranışı değişmemeli.
 */
export const foldExerciseName = (text) => foldForSearch(text).trim().replace(/\s+/g, ' ');

const ayniAd = (a, b) => {
  const x = foldExerciseName(a);
  return Boolean(x) && x === foldExerciseName(b);
};

/**
 * Birleştirilecek çifte göre "bu kayıt kaybedene mi ait" ölçütü.
 *
 * İki kip var, çünkü birleştirmenin iki farklı işi var:
 *
 *  - FARKLI adlar ("Kablo Yan Kaldırış" → "Cable Lateral Raise"): eşleşme
 *    katlanmış ad üzerinden, yazım farkları da toplansın diye.
 *  - AYNI adın farklı YAZIMLARI ("cable lateral raise" → "Cable Lateral
 *    Raise"): katlanmış adları zaten eşit, dolayısıyla katlanmış eşleşme
 *    kazananın kendi kayıtlarını da "kaybeden" sayar ve önizlemede sayıları
 *    şişirirdi. Burada ölçüt harfi harfine eşitlik.
 */
const esleyiciKur = (loser, winner) => {
  const yazimBirlestirme = foldExerciseName(loser) === foldExerciseName(winner);
  return yazimBirlestirme
    ? (name) => name === loser
    : (name) => ayniAd(name, loser);
};

/** Bir adın sözlükteki (yerleşik ya da özel) karşılığı. */
const isCustom = (name, customExercises = []) =>
  (customExercises || []).some(ex => ayniAd(typeof ex === 'object' ? ex.name : ex, name));

const isBuiltin = (name) => DEFAULT_EXERCISES.some(ex => ayniAd(ex.name ?? ex, name));

/**
 * Kütüphanedeki yazımın BİREBİR aynısı mı.
 *
 * `isBuiltin` katlanmış karşılaştırma yapıyor, yani "cable lateral raise" da
 * yerleşik sayılıyor — kas eşlemesi için doğru davranış. Ama kazananı seçerken
 * ayrım gerekiyor: iki yazım da yerleşikse tercih edilmesi gereken, kütüphanede
 * gerçekten yazdığı gibi duran olan.
 */
const isExactBuiltin = (name) => DEFAULT_EXERCISES.some(ex => (ex.name ?? ex) === name);

/**
 * Bir hareketin geçmişteki ağırlığı: kaç seansta, kaç sette, en son ne zaman.
 *
 * Birleştirmede hangi adın kazanacağına karar verirken tek başına "hangisi
 * yerleşik" yetmiyor; kullanıcı 40 seans boyunca kendi adını kullanmış
 * olabilir. Sayılar kararı kullanıcıya bırakmak için gösteriliyor.
 */
export const exerciseFootprint = (name, workouts = [], esler = null) => {
  const uyar = esler || ((other) => ayniAd(other, name));
  let sessions = 0;
  let sets = 0;
  let firstDate = null;
  let lastDate = null;

  (workouts || []).forEach(w => {
    const eslesen = (w?.exercises || []).filter(ex => uyar(ex?.name));
    if (eslesen.length === 0) return;
    sessions += 1;
    eslesen.forEach(ex => { sets += (ex.sets || []).length; });
    if (!firstDate || w.date < firstDate) firstDate = w.date;
    if (!lastDate || w.date > lastDate) lastDate = w.date;
  });

  return { name, sessions, sets, firstDate, lastDate };
};

/**
 * Birleştirmeye aday ikilileri bulur.
 *
 * Aday olma ölçütü DAR tutuldu: yalnızca katlanmış adı birebir aynı olan
 * çiftler öneriliyor ("Cable Lateral Raise" / "cable lateral raise"). Benzer
 * adları (örn. "Incline Press" / "Incline Bench Press") otomatik önermek
 * tehlikeli — bunlar gerçekten farklı hareketler olabilir ve birleştirme
 * geçmişi değiştiriyor. Benzer ama aynı olmayan adlar için kullanıcı ikiliyi
 * elle seçiyor.
 */
export const findMergeCandidates = (customExercises = [], workouts = []) => {
  const tumAdlar = new Map();

  const ekle = (name, kaynak) => {
    if (typeof name !== 'string' || !name.trim()) return;
    const anahtar = foldExerciseName(name);
    if (!tumAdlar.has(anahtar)) tumAdlar.set(anahtar, new Map());
    const grup = tumAdlar.get(anahtar);
    if (!grup.has(name)) grup.set(name, new Set());
    grup.get(name).add(kaynak);
  };

  DEFAULT_EXERCISES.forEach(ex => ekle(ex.name ?? ex, 'builtin'));
  (customExercises || []).forEach(ex => ekle(typeof ex === 'object' ? ex.name : ex, 'custom'));
  (workouts || []).forEach(w => (w?.exercises || []).forEach(ex => ekle(ex?.name, 'history')));

  // Ayak izi BİREBİR yazım üzerinden sayılıyor. Katlanmış eşleşme kullanılsaydı
  // her yazım aynı sayıları alır, varyantlar birbirinden ayırt edilemez ve
  // "hangisini daha çok kullanmışım" sorusu cevapsız kalırdı.
  const bilgi = (name) => ({
    ...exerciseFootprint(name, workouts, (other) => other === name),
    builtin: isBuiltin(name),
    exactBuiltin: isExactBuiltin(name),
    custom: isCustom(name, customExercises),
  });
  // Kütüphanedeki birebir yazım varsayılan kazanan; yoksa geçmişi en ağır olan.
  // Son iki ölçüt belirlilik için: eşit ağırlıktaki iki yazımda en son
  // kullanılan kazanıyor (kullanıcının şu an yazdığı biçim o), o da eşitse ada
  // göre sabit sıra — aynı veriye her açılışta aynı öneri çıksın diye.
  const sirala = (liste) => liste.slice().sort((a, b) =>
    (Number(b.exactBuiltin) - Number(a.exactBuiltin))
    || (b.sets - a.sets) || (b.sessions - a.sessions)
    || String(b.lastDate || '').localeCompare(String(a.lastDate || ''))
    || a.name.localeCompare(b.name));

  const adaylar = [];
  const kesinAnahtarlar = new Set();

  tumAdlar.forEach((grup, anahtar) => {
    if (grup.size < 2) return;
    kesinAnahtarlar.add(anahtar);
    const sirali = sirala([...grup.keys()].map(bilgi));
    adaylar.push({
      key: anahtar, variants: sirali, suggestedWinner: sirali[0].name, certain: true,
    });
  });

  // İkinci tur: "Romanian Deadlift" ile "Romanian Deadlift (RDL)" gibi, yalnızca
  // parantezli ekle ayrılan çiftler. İki koşul birden aranıyor:
  //
  //  1. Sade çekirdeğin KENDİSİ de bir ad olarak var olmalı. Bu olmadan
  //     "Cable Fly (High to Low)" ile "Cable Fly (Low to High)" eşlenirdi —
  //     bunlar gerçekten farklı hareketler ve birleştirilirlerse veri bozulur.
  //  2. Gruptaki adlardan en az biri kütüphane dışından gelmeli. Kütüphanenin
  //     kendi içinde kopya yok; kopyayı üreten şey kullanıcının elle eklediği
  //     ya da geçmişte kalmış bir ad.
  //
  // Bu tur KESİN sayılmıyor; onay ekranında ayrı işaretleniyor.
  const cekirdek = new Map();
  tumAdlar.forEach((_, anahtar) => {
    const sade = anahtar.replace(/\s*\([^)]*\)\s*/g, ' ').trim().replace(/\s+/g, ' ');
    if (!sade) return;
    if (!cekirdek.has(sade)) cekirdek.set(sade, new Set());
    cekirdek.get(sade).add(anahtar);
  });

  cekirdek.forEach((anahtarlar, sade) => {
    if (anahtarlar.size < 2 || !anahtarlar.has(sade)) return;
    const adlar = [...anahtarlar]
      .filter(a => !kesinAnahtarlar.has(a))
      .flatMap(a => [...(tumAdlar.get(a)?.keys() || [])]);
    if (adlar.length < 2) return;
    const sirali = sirala(adlar.map(bilgi));
    if (sirali.every(v => v.exactBuiltin)) return;
    adaylar.push({
      key: `loose-${sade}`, variants: sirali, suggestedWinner: sirali[0].name, certain: false,
    });
  });

  return adaylar.sort((a, b) =>
    (Number(b.certain) - Number(a.certain)) || (b.variants.length - a.variants.length));
};

/**
 * Birleştirmenin ne yapacağının önizlemesi.
 *
 * Geçmişi değiştiren bir işlem onaysız çalışmamalı; kullanıcı kaç seansın ve
 * kaç şablonun etkileneceğini ÖNCEDEN görmeli.
 */
export const previewExerciseMerge = (loser, winner, {
  workouts = [], templates = [], settings = {}, activeWorkout = null,
} = {}) => {
  if (!loser || !winner || loser === winner) return null;

  const esler = esleyiciKur(loser, winner);
  const kayit = exerciseFootprint(loser, workouts, esler);
  const kazananKayit = exerciseFootprint(winner, workouts, (n) => n === winner);
  const sablonlar = (templates || []).filter(t =>
    (t?.exercises || []).some(ex => esler(ex?.name)));

  const hedefler = (settings.strengthGoals || []).filter(g => esler(g?.exercise)).length;
  const araliklar = Object.keys(settings.repRangeOverrides || {}).filter(k => esler(k)).length;
  const agriKayitlari = (settings.painLog || []).filter(p => esler(p?.exercise)).length;
  const aktifte = (activeWorkout?.exercises || []).some(ex => esler(ex?.name));

  return {
    loser,
    winner,
    sessions: kayit.sessions,
    sets: kayit.sets,
    firstDate: kayit.firstDate,
    lastDate: kayit.lastDate,
    templates: sablonlar.length,
    templateNames: sablonlar.map(t => t.name).slice(0, 4),
    strengthGoals: hedefler,
    repRanges: araliklar,
    painEntries: agriKayitlari,
    inActiveWorkout: aktifte,
    // Aynı adın iki yazımı birleştiriliyorsa kullanıcıya söylenmesi gereken
    // şey farklı: geçmiş "taşınmıyor", yalnızca tek yazımda toplanıyor.
    spellingOnly: foldExerciseName(loser) === foldExerciseName(winner),
    // Kazananın kendi geçmişi: birleşince toplam ne olacak.
    winnerSessions: kazananKayit.sessions,
    totalSessionsAfter: kayit.sessions + kazananKayit.sessions,
    // Hiçbir şeye dokunmayacak bir birleştirme kullanıcıya "işe yaradı" hissi
    // verir ama aslında yalnızca tanımı siler; bunu ayrıca söylemek gerekiyor.
    touchesNothing: kayit.sessions === 0 && sablonlar.length === 0
      && hedefler === 0 && araliklar === 0 && agriKayitlari === 0 && !aktifte,
  };
};

/**
 * Bir hareket listesinde adı değiştirir; aynı seansta hem eski hem yeni ad
 * varsa iki satırı tek satırda toplar — birleştirmeden sonra "aynı hareket iki
 * kez" görünmesi hatalı olurdu.
 *
 * Toplama yapılırken hedef satır KOPYALANIYOR. Kaynak diziden gelen nesneyi
 * yerinde değiştirmek, henüz yazılmamış bir geçmiş kaydını sessizce bozardı;
 * geri alma da işe yaramazdı çünkü geri yazılacak "eski" nesne çoktan
 * değişmiş olurdu.
 */
const listedeDegistir = (exercises = [], esler, winner) => {
  let degisti = false;
  const cikti = [];

  (exercises || []).forEach(ex => {
    if (!esler(ex?.name)) { cikti.push(ex); return; }
    degisti = true;

    const i = cikti.findIndex(x => x?.name === winner);
    if (i >= 0) {
      cikti[i] = { ...cikti[i], sets: [...(cikti[i].sets || []), ...(ex.sets || [])] };
      return;
    }
    cikti.push({ ...ex, name: winner });
  });

  return degisti ? cikti : exercises;
};

/**
 * Birleştirmeyi uygular ve YALNIZCA değişen koleksiyonları döndürür.
 *
 * Değişmeyen koleksiyon `undefined` dönüyor; çağıran taraf da yalnızca dönen
 * alanları yazıyor. Böylece hiç dokunulmamış bir koleksiyon gereksiz yere
 * yeniden yazılıp React'te alt ağacı yeniden render etmiyor.
 */
export const applyExerciseMerge = (loser, winner, {
  workouts = [], templates = [], customExercises = [], settings = {}, activeWorkout = null,
} = {}) => {
  if (!loser || !winner || loser === winner) return null;

  const esler = esleyiciKur(loser, winner);

  const yeniWorkouts = (workouts || []).map(w => {
    const liste = listedeDegistir(w?.exercises, esler, winner);
    return liste === w?.exercises ? w : { ...w, exercises: liste };
  });
  const workoutsDegisti = yeniWorkouts.some((w, i) => w !== workouts[i]);

  const yeniTemplates = (templates || []).map(t => {
    const liste = listedeDegistir(t?.exercises, esler, winner);
    return liste === t?.exercises ? t : { ...t, exercises: liste };
  });
  const templatesDegisti = yeniTemplates.some((t, i) => t !== templates[i]);

  // Kaybeden adın TANIMI kütüphaneden kalkıyor. Kazanan yerleşik bir hareketse
  // kendi kuralı zaten var; kazanan da özelse tanımı olduğu gibi kalıyor.
  const yeniCustom = (customExercises || [])
    .filter(ex => !esler(typeof ex === 'object' ? ex.name : ex));
  const customDegisti = yeniCustom.length !== (customExercises || []).length;

  const adDegistir = (liste = []) => (liste || []).map(n => (esler(n) ? winner : n));
  const benzersiz = (liste = []) => [...new Set(liste)];

  const yeniSettings = { ...settings };
  let settingsDegisti = false;

  ['hiddenExercises', 'pinnedExercises', 'hidden1RMExercises'].forEach(anahtar => {
    const mevcut = settings[anahtar] || [];
    if (!mevcut.some(n => esler(n))) return;
    yeniSettings[anahtar] = benzersiz(adDegistir(mevcut));
    settingsDegisti = true;
  });

  if ((settings.strengthGoals || []).some(g => esler(g?.exercise))) {
    yeniSettings.strengthGoals = (settings.strengthGoals || [])
      .map(g => (esler(g?.exercise) ? { ...g, exercise: winner } : g));
    settingsDegisti = true;
  }

  const araliklar = settings.repRangeOverrides || {};
  if (Object.keys(araliklar).some(k => esler(k))) {
    const sonraki = {};
    Object.entries(araliklar).forEach(([anahtar, deger]) => {
      // Kazananın kendi aralığı varsa o kalıyor: kullanıcının kazanan hareket
      // için bilerek yazdığı değeri kaybedeninkiyle ezmek veri kaybı olurdu.
      if (esler(anahtar)) {
        if (!Object.keys(araliklar).some(k => k === winner)) sonraki[winner] = deger;
        return;
      }
      sonraki[anahtar] = deger;
    });
    yeniSettings.repRangeOverrides = sonraki;
    settingsDegisti = true;
  }

  if ((settings.painLog || []).some(p => esler(p?.exercise))) {
    yeniSettings.painLog = (settings.painLog || [])
      .map(p => (esler(p?.exercise) ? { ...p, exercise: winner } : p));
    settingsDegisti = true;
  }

  let yeniActive;
  if (activeWorkout) {
    const liste = listedeDegistir(activeWorkout.exercises, esler, winner);
    if (liste !== activeWorkout.exercises) yeniActive = { ...activeWorkout, exercises: liste };
  }

  return {
    workouts: workoutsDegisti ? yeniWorkouts : undefined,
    templates: templatesDegisti ? yeniTemplates : undefined,
    customExercises: customDegisti ? yeniCustom : undefined,
    settings: settingsDegisti ? yeniSettings : undefined,
    activeWorkout: yeniActive,
  };
};
