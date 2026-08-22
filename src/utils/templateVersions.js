import { parseNumber } from './number.js';

/**
 * Şablon sürüm geçmişi.
 *
 * Şablonu düzenlemek geri alınamaz bir işlemdi: bir hareketi çıkarıp
 * kaydettikten sonra eski hali hiçbir yerde durmuyordu. Üç aydır kullandığı
 * programı "biraz deneyeyim" diye değiştiren biri, beğenmediğinde eski
 * düzeni hatırlamak zorunda kalıyordu.
 *
 * Artık her kaydetme öncesinde şablonun o anki hali geçmişe yazılıyor ve tek
 * dokunuşla geri dönülebiliyor.
 *
 * Ne saklanıyor: hareket adları, set sayıları ve süperset bağları — yani
 * şablonun YAPISI. Setlerin ağırlık/tekrar değerleri saklanmıyor; onlar bir
 * sonraki seansın başlangıç değerleri, geçmişin parçası değil ve her
 * kaydetmede değiştikleri için geçmişi anlamsız yere şişirirlerdi.
 */

// Şablon başına saklanacak sürüm sayısı. Sınırsız tutmak, yıllar içinde
// yedekleme dosyasını sessizce şişirirdi ve on üstü sürüme kimse bakmıyor.
export const MAX_VERSIONS = 8;

/** Bir şablonun geçmişe yazılacak özeti. */
export const snapshotTemplate = (template, { label = '' } = {}) => {
  if (!template?.exercises?.length) return null;
  return {
    savedAt: new Date().toISOString(),
    name: template.name || '',
    label,
    exercises: template.exercises.map(ex => ({
      name: ex.name,
      sets: (ex.sets || []).length,
      supersetId: ex.supersetId || null,
      ...(ex.backup ? { backup: ex.backup } : {}),
      ...(ex.plannedTechnique ? { plannedTechnique: ex.plannedTechnique } : {}),
    })),
    totalSets: template.exercises.reduce((t, ex) => t + (ex.sets || []).length, 0),
  };
};

/** İki sürüm arasında yapısal fark var mı — aynı halin iki kez yazılmasını önler. */
export const sameStructure = (a, b) => {
  if (!a || !b) return false;
  if (a.name !== b.name) return false;
  if (a.exercises.length !== b.exercises.length) return false;
  return a.exercises.every((ex, i) => {
    const o = b.exercises[i];
    return ex.name === o.name
      && ex.sets === o.sets
      && (ex.supersetId || null) === (o.supersetId || null)
      && (ex.backup || '') === (o.backup || '')
      && (ex.plannedTechnique || '') === (o.plannedTechnique || '');
  });
};

/**
 * Kaydetmeden ÖNCE çağrılıyor: mevcut hali geçmişe iter.
 *
 * Değişiklik yoksa geçmişe dokunulmuyor. Şablonu açıp hiçbir şey
 * değiştirmeden kaydeden kullanıcı, geçmişini aynı kaydın kopyalarıyla
 * doldurmuş olmamalı.
 */
export const pushVersion = (history = [], template, { label = '' } = {}) => {
  const yeni = snapshotTemplate(template, { label });
  if (!yeni) return history || [];
  const mevcut = history || [];
  if (mevcut.length > 0 && sameStructure(mevcut[0], yeni)) return mevcut;
  return [yeni, ...mevcut].slice(0, MAX_VERSIONS);
};

/**
 * Sürümü şablona geri yazar.
 *
 * Setlerin ağırlık ve tekrar değerleri KORUNUYOR: aynı hareket geri gelen
 * sürümde de varsa, o hareketin mevcut set değerleri taşınıyor. Eski yapıya
 * dönmek, öğrenilmiş yükleri çöpe atmayı gerektirmiyor.
 */
export const restoreVersion = (template, version, generateId) => {
  if (!template || !version?.exercises?.length) return null;
  const eskiSetler = new Map((template.exercises || []).map(ex => [ex.name, ex.sets || []]));

  return {
    ...template,
    name: version.name || template.name,
    exercises: version.exercises.map(ex => {
      const kaynak = eskiSetler.get(ex.name) || [];
      const adet = Math.max(1, parseNumber(ex.sets) || 1);
      return {
        name: ex.name,
        supersetId: ex.supersetId || null,
        ...(ex.backup ? { backup: ex.backup } : {}),
        ...(ex.plannedTechnique ? { plannedTechnique: ex.plannedTechnique } : {}),
        sets: Array.from({ length: adet }, (_, i) => (kaynak[i]
          ? { ...kaynak[i], id: kaynak[i].id || generateId() }
          : { id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal' })),
      };
    }),
  };
};

/**
 * İki sürüm arasındaki farkın insan okunur özeti.
 *
 * "3 gün önce kaydedildi" tek başına hangi sürüme döneceğini seçmeye
 * yetmiyor; ne değiştiğini görmek gerekiyor.
 */
export const describeVersionDiff = (version, current) => {
  const simdi = snapshotTemplate(current);
  if (!version || !simdi) return null;

  const eskiAdlar = version.exercises.map(e => e.name);
  const yeniAdlar = simdi.exercises.map(e => e.name);
  const eklenen = yeniAdlar.filter(n => !eskiAdlar.includes(n));
  const cikarilan = eskiAdlar.filter(n => !yeniAdlar.includes(n));

  const setFarki = [];
  version.exercises.forEach(ex => {
    const o = simdi.exercises.find(x => x.name === ex.name);
    if (o && o.sets !== ex.sets) setFarki.push({ name: ex.name, from: ex.sets, to: o.sets });
  });

  // Sıra değişimi ayrı bir fark: hareket listesi aynı kalıp yalnızca sırası
  // değiştiğinde özet "yapı aynı" diyordu. Oysa sıra hipertrofide anlamlı bir
  // karar — hangi hareketin taze yapıldığını belirliyor — ve kullanıcı tam da
  // onu değiştirmiş olabilir.
  const ortakAdlar = eskiAdlar.filter(n => yeniAdlar.includes(n));
  const siraDegisti = ortakAdlar.some((ad, i) => {
    const digerleri = yeniAdlar.filter(n => eskiAdlar.includes(n));
    return digerleri[i] !== ad;
  });

  return {
    added: eklenen,
    removed: cikarilan,
    setChanges: setFarki,
    setDelta: simdi.totalSets - version.totalSets,
    reordered: siraDegisti,
    identical: eklenen.length === 0 && cikarilan.length === 0
      && setFarki.length === 0 && !siraDegisti,
    summary: (() => {
      const parcalar = [];
      if (cikarilan.length > 0) parcalar.push(`${cikarilan.length} hareket çıkarılmış`);
      if (eklenen.length > 0) parcalar.push(`${eklenen.length} hareket eklenmiş`);
      if (setFarki.length > 0) parcalar.push(`${setFarki.length} harekette set sayısı değişmiş`);
      if (siraDegisti) parcalar.push('sıra değişmiş');
      return parcalar.length > 0 ? parcalar.join(', ') : 'Yapı aynı';
    })(),
  };
};
