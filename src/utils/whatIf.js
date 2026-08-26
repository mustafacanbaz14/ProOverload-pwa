import { parseNumber } from './number.js';
import { VOLUME_BANDS } from './responseProfile.js';

/**
 * Senaryo: "şunu değiştirsem ne olur".
 *
 * Uygulama ne yapman gerektiğini söylüyordu ama sonucunu denemeden görmenin
 * yolu yoktu. "Göğsüne iki set ekle" tavsiyesini uygulayan biri, üç hafta
 * sonra sonucu görüyor; beğenmezse üç hafta gitmiş oluyor. Program kurmanın
 * en pahalı tarafı bu gecikme.
 *
 * Senaryo bu gecikmeyi kısaltmıyor — kısaltamaz — ama kararı verirken elde
 * olan bilgiyi görünür kılıyor. Üç şeyi birden söylüyor:
 *
 *  1. YENİ KONUM. Değişiklikten sonra hacim hangi banda düşüyor: eşiğin
 *     altında mı, tavanın üstünde mi.
 *  2. KENDİ GEÇMİŞİN. O bantta daha önce çalışılmışsa, o dönemde ne olduğu.
 *     Bu bir tahmin değil, geçmişin özeti — ve modül farkı her seferinde
 *     yazıyor.
 *  3. BEDEL. Kaç dakika ve kaç set. Hacim eklemek bedava değil; asıl kısıt
 *     çoğu insanda motivasyon değil takvim.
 *
 * Tahmin üretmemesi bilinçli. Hacim-tepki ilişkisi kişide ölçülebilir ama
 * ölçüm için gereken veri miktarı tipik bir kullanıcıda yok; "iki set eklersen
 * %1.4 daha hızlı ilerlersin" demek uydurulmuş bir kesinlik olurdu.
 */

// Bir set için kabaca harcanan dakika: setin kendisi + dinlenme.
const SET_MINUTES = (restSeconds) => (Math.max(30, parseNumber(restSeconds) || 120) + 40) / 60;

export const SCENARIO_KINDS = {
  addSets: { key: 'addSets', label: 'Set ekle' },
  removeSets: { key: 'removeSets', label: 'Set çıkar' },
  splitDays: { key: 'splitDays', label: 'Güne böl' },
};

const bandKey = (hacim, { mev, mav, mrv }) => {
  if (hacim < mev) return 'belowMev';
  if (hacim <= mav) return 'mevMav';
  if (hacim <= mrv) return 'mavMrv';
  return 'overMrv';
};

const bandLabel = (key) => VOLUME_BANDS.find(b => b.key === key)?.label || key;

/**
 * Tek senaryonun sonucu.
 *
 * @param change.muscle       hangi kas
 * @param change.deltaSets    haftalık set değişimi (+/-)
 * @param change.frequency    yeni haftalık sıklık (opsiyonel)
 * @param context.current     { volume, frequency }
 * @param context.landmarks   { mev, mav, mrv }
 * @param context.profile     buildResponseProfile çıktısı (opsiyonel)
 * @param context.restSeconds süre hesabı için
 */
export const buildScenario = (change = {}, context = {}) => {
  const kas = change.muscle;
  const mevcutHacim = Math.max(0, parseNumber(context.current?.volume));
  const mevcutSiklik = Math.max(0, parseNumber(context.current?.frequency));
  const esikler = context.landmarks || { mev: 8, mav: 16, mrv: 22 };
  const delta = Math.round(parseNumber(change.deltaSets));
  const yeniHacim = Math.max(0, Math.round((mevcutHacim + delta) * 10) / 10);
  const yeniSiklik = change.frequency ? Math.max(1, Math.round(parseNumber(change.frequency))) : mevcutSiklik;

  const oncekiBand = bandKey(mevcutHacim, esikler);
  const sonrakiBand = bandKey(yeniHacim, esikler);

  // Kendi geçmişi: o bantta gözlem var mı.
  const bandKaydi = (context.profile?.volumeBands || []).find(b => b.key === sonrakiBand) || null;
  const oncekiKayit = (context.profile?.volumeBands || []).find(b => b.key === oncekiBand) || null;
  const siklikKaydi = (context.profile?.frequencyBands || [])
    .find(b => yeniSiklik >= b.min && yeniSiklik <= b.max) || null;

  const dakika = Math.round(Math.abs(delta) * SET_MINUTES(context.restSeconds));

  const uyarilar = [];
  if (sonrakiBand === 'overMrv') {
    uyarilar.push(`${yeniHacim} kesirli set kanıtsız bölgede. Bu hacimde ek fayda gösteren doğrudan bir deneme yok; zararlı olduğu da gösterilmedi. Kesin olan tek şey harcanan zaman.`);
  }
  if (sonrakiBand === 'belowMev') {
    uyarilar.push(`${yeniHacim} kesirli set eşiğin (${esikler.mev}) altında. Bu hacimde ölçülebilir bir uyaran beklenmiyor — iki kanıt hattı da burada anlaşıyor.`);
  }
  if (delta > 0 && yeniSiklik <= 1 && yeniHacim > esikler.mav) {
    uyarilar.push('Hacim tek güne yığılıyor. Protein sentezi yanıtı yaklaşık iki günde söndüğü için aynı hacmi ikiye bölmek toplamı hiç artırmadan daha iyi sonuç veriyor.');
  }

  return {
    muscle: kas,
    deltaSets: delta,
    from: { volume: mevcutHacim, band: oncekiBand, bandLabel: bandLabel(oncekiBand), frequency: mevcutSiklik },
    to: { volume: yeniHacim, band: sonrakiBand, bandLabel: bandLabel(sonrakiBand), frequency: yeniSiklik },
    crossesBand: oncekiBand !== sonrakiBand,
    minutesPerWeek: delta >= 0 ? dakika : -dakika,
    warnings: uyarilar,
    // Kanıt: yalnızca gerçekten gözlem varsa. Yoksa açıkça "veri yok" deniyor;
    // boş bir alan bırakmak, cevabı olumlu sanmaya yol açardı.
    evidence: bandKaydi?.enough
      ? {
        band: bandLabel(sonrakiBand),
        observations: bandKaydi.observations,
        gainPerSession: bandKaydi.gainPerSession,
        compare: oncekiKayit?.enough
          ? { band: bandLabel(oncekiBand), gainPerSession: oncekiKayit.gainPerSession }
          : null,
      }
      : null,
    frequencyEvidence: siklikKaydi?.enough
      ? { label: siklikKaydi.label, observations: siklikKaydi.observations, gainPerSession: siklikKaydi.gainPerSession }
      : null,
    summary: describeScenario({
      muscle: kas, delta, mevcutHacim, yeniHacim,
      sonrakiBand, dakika, kanit: bandKaydi?.enough ? bandKaydi : null,
      oncekiKayit: oncekiKayit?.enough ? oncekiKayit : null,
    }),
  };
};

const describeScenario = ({ muscle, delta, mevcutHacim, yeniHacim, sonrakiBand, dakika, kanit, oncekiKayit }) => {
  const yon = delta > 0 ? 'eklemek' : 'çıkarmak';
  const bas = delta === 0
    ? `${muscle} hacmi değişmiyor.`
    : `${muscle} hacmine haftada ${Math.abs(delta)} set ${yon}: ${mevcutHacim} → ${yeniHacim} set (${bandLabel(sonrakiBand)}), haftada ${dakika > 0 ? `~${dakika} dakika` : 'süre farkı yok'}${delta > 0 ? ' daha' : ' daha az'}.`;

  if (!kanit) {
    return `${bas} Bu bantta yeterli geçmiş verin yok, o yüzden ne olacağına dair söyleyebileceğim bir şey yok — deneyip ölçmek gerekiyor.`;
  }
  const karsilastirma = oncekiKayit && oncekiKayit.key !== kanit.key
    ? ` Şu anki bandında (${oncekiKayit.label}) bu değer %${oncekiKayit.gainPerSession}.`
    : '';
  // Bant istatistiği BÜTÜN kaslardan toplanıyor ve cümlede bu açıkça
  // söyleniyor. Kas bazında bölmek doğru olurdu ama tek bir kas için yeterli
  // gözlem tipik bir kullanıcıda hiç birikmiyor; "senin göğsün bu bantta şöyle
  // tepki verdi" demek, aslında bütün kasların ortalamasını o kasa yazmak olur.
  return `${bas} Geçmişinde bu hacim bandında (bütün kaslarında toplam) ${kanit.observations} seans geçişi var`
    + ` ve o dönemlerde seans başına ortalama %${kanit.gainPerSession} ilerlemişsin.${karsilastirma}`
    + ' Bu bir tahmin değil, geçmişin özeti: o dönemlerde değişen tek şey hacim değildi.';
};

/**
 * Otomatik senaryo listesi.
 *
 * Kullanıcının kendi senaryosunu kurması için önce ne sorabileceğini bilmesi
 * gerekiyor; boş bir form kimseye bir şey sordurmuyor. Bu yüzden mevcut
 * duruma göre üç-dört anlamlı soru hazır geliyor.
 */
export const suggestScenarios = (muscleStates = [], context = {}) => {
  const oneriler = [];

  muscleStates.forEach(m => {
    const esikler = m.landmarks || {};
    const hacim = parseNumber(m.volume);
    if (hacim <= 0) return;

    if (hacim < esikler.mev) {
      oneriler.push({
        kind: 'addSets', muscle: m.muscle,
        deltaSets: Math.ceil(esikler.mev - hacim),
        label: `${m.muscle}: eşiğin üstüne çık`,
      });
    } else if (hacim > esikler.mrv) {
      oneriler.push({
        kind: 'removeSets', muscle: m.muscle,
        deltaSets: -Math.ceil(hacim - esikler.mrv),
        label: `${m.muscle}: kanıtsız bölgeden in`,
      });
    } else if (hacim < esikler.mav) {
      oneriler.push({
        kind: 'addSets', muscle: m.muscle,
        deltaSets: Math.min(4, Math.ceil(esikler.mav - hacim)),
        label: `${m.muscle}: optimuma yaklaş`,
      });
    }

    if (parseNumber(m.frequency) <= 1 && hacim >= (esikler.mav || 99) * 0.6) {
      oneriler.push({
        kind: 'splitDays', muscle: m.muscle, deltaSets: 0, frequency: 2,
        label: `${m.muscle}: aynı hacmi iki güne böl`,
      });
    }
  });

  return oneriler.slice(0, 6).map(o => ({
    ...o,
    result: buildScenario(o, {
      ...context,
      current: {
        volume: muscleStates.find(m => m.muscle === o.muscle)?.volume || 0,
        frequency: muscleStates.find(m => m.muscle === o.muscle)?.frequency || 0,
      },
      landmarks: muscleStates.find(m => m.muscle === o.muscle)?.landmarks,
    }),
  }));
};

/** Senaryonun toplam bedeli: birden fazla senaryo birlikte uygulanırsa. */
export const totalCost = (scenarios = []) => {
  const dakika = scenarios.reduce((t, s) => t + parseNumber(s.result?.minutesPerWeek ?? s.minutesPerWeek), 0);
  const set = scenarios.reduce((t, s) => t + parseNumber(s.result?.deltaSets ?? s.deltaSets), 0);
  return {
    minutesPerWeek: Math.round(dakika),
    deltaSets: Math.round(set * 10) / 10,
    // Haftada bir saatten fazla ek yük, program değişikliği değil hayat
    // değişikliği; bunu söylemeden öneri yapmak dürüst olmaz.
    heavy: dakika > 60,
  };
};
