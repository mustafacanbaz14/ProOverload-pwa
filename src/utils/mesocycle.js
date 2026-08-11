import { parseNumber } from './number.js';
import { dayKey, toLocalDate, formatRange } from './dates.js';
import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';

/**
 * Mezosiklik (blok) planlama.
 *
 * Uygulamadaki haftalık program SABİTTİ: kurulduğu haftadan sonsuza kadar aynı
 * set sayısı. Oysa hipertrofi programlaması bir blok işidir — hacim koruma
 * eşiğinin (MEV) biraz üstünden başlar, her hafta bir miktar artar, toparlanma
 * tavanına (MRV) yaklaşınca boşaltma haftasıyla sıfırlanır ve blok yeniden
 * başlar. Uygulama MEV/MAV/MRV'yi zaten biliyordu ama bunları ZAMANA yaymanın
 * bir yolu yoktu; bu modül o eksiği kapatıyor.
 *
 * İki tasarım kararı:
 *
 *  - ARTIŞ SABİT DEĞİL. Her hafta körlemesine +1 set eklemek, toparlanması
 *    farklı kasları aynı hızda yükler. Artış, o kas için geçen haftanın
 *    geri bildirimine bağlı: kolay geldiyse +2, yerindeyse +1, zorladıysa +0.
 *    Bu, hacmi kişinin kendi toparlanmasına göre kalibre eder.
 *  - HEDEF ÜRETİLİR, ŞABLON DEĞİŞTİRİLMEZ. Modül "bu hafta kanat 14 set olmalı"
 *    der ve hangi harekete kaç set ekleneceğini söyler; şablonu kendiliğinden
 *    yazmaz. Otomatik yazsaydı kullanıcının elle yaptığı düzenlemeler her hafta
 *    sessizce ezilirdi.
 */

/**
 * Blok uzunlukları. Son hafta daima boşaltma (deload) haftasıdır.
 *
 * Kısa blok toparlanması hızlı ya da hacme yeni başlayanlar için; uzun blok
 * MRV'ye ulaşmak için daha çok yükleme haftası bırakır ama yorgunluk birikimi
 * daha fazladır.
 */
export const MESOCYCLE_PRESETS = [
  {
    key: 'short', weeks: 4, label: '4 hafta',
    summary: '3 yükleme + 1 boşaltma',
    detail: 'Yorgunluk hızlı birikiyorsa ya da hacim tavanına yakın başlıyorsan. Kısa blok, MRV\'ye varmadan boşaltmaya geçer.',
  },
  {
    key: 'standard', weeks: 5, label: '5 hafta',
    summary: '4 yükleme + 1 boşaltma',
    detail: 'Çoğu orta seviye için varsayılan. MEV üstünden başlayıp MAV–MRV bandına çıkmaya yetecek kadar hafta bırakır.',
  },
  {
    key: 'long', weeks: 6, label: '6 hafta',
    summary: '5 yükleme + 1 boşaltma',
    detail: 'Düşük hacimden başlıyorsan ya da toparlanman iyiyse. Uzun blokta son haftalar MRV\'ye dayanır; boşaltma şart olur.',
  },
];

export const findMesoPreset = (weeks) =>
  MESOCYCLE_PRESETS.find(p => p.weeks === Math.round(parseNumber(weeks))) || MESOCYCLE_PRESETS[1];

/**
 * Haftalık geri bildirim seçenekleri ve karşılık gelen set artışı.
 *
 * Tek soru soruluyor ("o kas nasıl geldi?") çünkü pompa, ağrı ve performansı
 * ayrı ayrı sormak her hafta 16 kas × 3 soru demek; kimse doldurmaz. Üç
 * seçenek, artış kararı için yeterli çözünürlük veriyor.
 */
export const RECOVERY_FEEDBACK = [
  {
    key: 'easy', label: 'Kolay geldi', step: 2,
    hint: 'Ertesi gün ağrı yok, pompa azdı, tekrarlar arttı',
    detail: 'Uyaran toparlanma kapasitenin altında kalmış. İki set birden eklenir.',
  },
  {
    key: 'ok', label: 'Yerinde', step: 1,
    hint: 'Hafif ağrı, iyi pompa, performans korundu',
    detail: 'Hacim doğru bantta. Normal artış: bir set.',
  },
  {
    key: 'hard', label: 'Zorladı', step: 0,
    hint: 'Ağrı sonraki seansa kaldı ya da performans düştü',
    detail: 'Toparlanma sınırındasın. Bu hafta hacim sabit kalır; artış eklemek kazanç değil kayıp getirir.',
  },
];

export const findFeedback = (key) =>
  RECOVERY_FEEDBACK.find(f => f.key === key) || null;

const DEFAULT_STEP = 1;

/** Boş/kapalı mezosiklik ayarı. */
export const emptyMesocycle = () => ({
  active: false, startDate: '', weeks: 5, baseline: {}, feedback: {},
});

/**
 * Bloğun bugünkü durumu.
 *
 * Deload'daki gibi süre dolduğunda ayar kendiliğinden YAZILMIYOR, burada
 * "expired" olarak hesaplanıyor: zamanın geçmesi bir kullanıcı eylemi değil ve
 * render sırasında state yazmak React Compiler kurallarına aykırı.
 *
 * @returns { active, expired, weekIndex, totalWeeks, isDeload, phase, weeksLeft, rangeLabel, weekRangeLabel }
 */
export const mesocycleState = (meso, today = dayKey(new Date())) => {
  const toplam = Math.max(2, Math.round(parseNumber(meso?.weeks) || 5));
  const kapali = {
    active: false, expired: false, weekIndex: 0, totalWeeks: toplam,
    isDeload: false, phase: 'off', weeksLeft: 0, rangeLabel: '', weekRangeLabel: '',
  };
  if (!meso?.active || !meso?.startDate) return kapali;

  const bas = toLocalDate(meso.startDate);
  const bugun = toLocalDate(today);
  if (!bas || !bugun) return kapali;

  const bitis = new Date(bas);
  bitis.setDate(bas.getDate() + toplam * 7 - 1);
  const aralik = formatRange(meso.startDate, dayKey(bitis));

  const gecen = Math.floor((bugun - bas) / 86400000);
  // Başlangıç ileri bir tarihe alınmışsa blok henüz başlamamıştır.
  if (gecen < 0) return { ...kapali, rangeLabel: aralik };
  if (gecen >= toplam * 7) return { ...kapali, expired: true, rangeLabel: aralik };

  const haftaIndex = Math.floor(gecen / 7) + 1;
  const haftaBas = new Date(bas);
  haftaBas.setDate(bas.getDate() + (haftaIndex - 1) * 7);
  const haftaSon = new Date(haftaBas);
  haftaSon.setDate(haftaBas.getDate() + 6);

  const isDeload = haftaIndex === toplam;
  return {
    active: true,
    expired: false,
    weekIndex: haftaIndex,
    totalWeeks: toplam,
    isDeload,
    phase: isDeload ? 'deload' : 'accumulation',
    weeksLeft: toplam - haftaIndex,
    rangeLabel: aralik,
    weekRangeLabel: formatRange(dayKey(haftaBas), dayKey(haftaSon)),
  };
};

/**
 * Bir kasın verilen haftadaki hedef set sayısı.
 *
 * Artış birikimlidir: 2. hafta 1. haftanın geri bildirimine, 3. hafta 1. ve
 * 2.'nin toplamına bakar. Geri bildirim girilmemiş hafta için varsayılan +1
 * kullanılır — kullanıcı formu doldurmadı diye blok durmamalı.
 *
 * MRV tavandır: hedef hiçbir koşulda toparlanma sınırını aşmaz. Tavana
 * değildiyse `capped` işaretlenir, çünkü o noktadan sonra hacim eklemek
 * değil boşaltmaya geçmek gerekir.
 */
export const muscleTarget = (muscle, {
  baseline = 0,
  weekIndex = 1,
  totalWeeks = 5,
  experienceLevel = 'intermediate',
  feedback = {},
} = {}) => {
  const { mev, mav, mrv } = getVolumeLandmarks(muscle, experienceLevel);
  const bas = Math.max(0, Math.round(parseNumber(baseline)));
  const isDeload = weekIndex >= totalWeeks;

  if (isDeload) {
    // Boşaltma haftası bloğun BAŞLANGIÇ hacminin yarısı — son haftanın değil.
    // Son hafta zaten tavana yakındır; yarısı hâlâ yorucu bir hacim olurdu.
    const hedef = bas > 0 ? Math.max(2, Math.round(bas * 0.5)) : 0;
    return { muscle, baseline: bas, target: hedef, delta: hedef - bas, mev, mav, mrv, capped: false, belowMev: false, phase: 'deload' };
  }

  let hedef = bas;
  for (let h = 1; h < weekIndex; h += 1) {
    const secim = findFeedback(feedback?.[String(h)]?.[muscle]);
    hedef += secim ? secim.step : DEFAULT_STEP;
  }

  const capped = hedef >= mrv;
  hedef = Math.min(hedef, mrv);
  return {
    muscle, baseline: bas, target: hedef, delta: hedef - bas,
    mev, mav, mrv, capped, belowMev: hedef < mev, phase: 'accumulation',
  };
};

/**
 * Bloğun bu haftaki tüm kas hedefleri.
 *
 * Sıra MUSCLE_GROUPS'tan gelir ki liste uygulamanın geri kalanıyla aynı
 * düzende dursun. Blok var olan programı ilerletir, yeni kas eklemez.
 *
 * Eşik 0 değil TRACK_THRESHOLD: bench press'in trapeze yazdığı çeyrek setler
 * yuvarlanınca "1 set trapez" görünüyor ve o kas hedef listesine giriyordu.
 * Çalışılmayan bir kası her hafta bir set artırmak, bloğun ilerlettiği şeyin
 * ne olduğunu bulanıklaştırıyor.
 */
const TRACK_THRESHOLD = 2;

export const weeklyTargets = (baseline = {}, {
  weekIndex = 1,
  totalWeeks = 5,
  experienceLevel = 'intermediate',
  feedback = {},
} = {}) =>
  MUSCLE_GROUPS
    .filter(m => parseNumber(baseline[m]) >= TRACK_THRESHOLD)
    .map(m => muscleTarget(m, {
      baseline: baseline[m], weekIndex, totalWeeks, experienceLevel, feedback,
    }));

/**
 * Hedefle mevcut programı karşılaştırıp uygulanabilir talimat üretir.
 *
 * "Kanat 14 set olmalı" tek başına iş görmüyor; kullanıcı hangi güne hangi
 * harekete ekleyeceğini bilmiyor. `sources` (computeWeekPlan'dan gelen
 * hareket dökümü) en çok katkı veren hareketi veriyor, talimat oraya yazılıyor.
 */
export const targetInstructions = (targets = [], statuses = []) => {
  const byMuscle = new Map(statuses.map(s => [s.muscle, s]));
  return targets
    .map(t => {
      const durum = byMuscle.get(t.muscle);
      const mevcut = Math.round(parseNumber(durum?.volume));
      const fark = t.target - mevcut;
      // En çok katkı veren hareket: set eklenecek ya da kısılacak ilk yer.
      const kaynak = (durum?.sources || [])[0] || null;

      let action = 'hold';
      if (fark >= 1) action = 'add';
      else if (fark <= -1) action = 'remove';

      // Metin "mevcut → hedef" ifadesini TEKRARLAMIYOR; o sayılar satırın
      // sağında zaten duruyor, burada yazmak aynı bilgiyi iki kez gösteriyordu.
      const fiil = action === 'add' ? 'ekle' : 'çıkar';
      let text;
      if (action === 'hold') {
        text = 'Hedefte — bu hafta dokunma.';
      } else if (kaynak) {
        text = `${kaynak.name} (${kaynak.dayLabel}) hareketine ${Math.abs(fark)} set ${fiil}.`;
      } else {
        text = `${Math.abs(fark)} set ${fiil}.`;
      }

      return { ...t, current: mevcut, diff: fark, action, source: kaynak, text };
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
};

/**
 * Bloğun günlük koç satırı.
 *
 * Boşaltma haftası ayrı ele alınıyor: o hafta yapılacak iş hacim eklemek değil,
 * bilerek geri çekilmek. Karıştırılırsa boşaltmanın anlamı kalmıyor.
 */
export const mesocycleCoachItem = (state, instructions = []) => {
  if (!state?.active) return null;

  if (state.isDeload) {
    return {
      title: `Boşaltma haftası (${state.weekIndex}/${state.totalWeeks})`,
      detail: 'Blok bu hafta boşalıyor: setler yarıya iner, ağırlık korunur. Bu hafta ilerleme aramak değil, yorgunluğu boşaltmak amaç — gelecek bloğun başlangıç hacmi buna bağlı.',
    };
  }

  const artacak = instructions.filter(i => i.action === 'add');
  const tavan = instructions.filter(i => i.capped);

  if (tavan.length > 0 && state.weeksLeft <= 1) {
    return {
      title: `Blok sonuna geliyor (${state.weekIndex}/${state.totalWeeks})`,
      detail: `${tavan.map(t => t.muscle).join(', ')} toparlanma tavanına (MRV) dayandı. Gelecek hafta boşaltma haftası; hacim eklenmeyecek.`,
    };
  }

  if (artacak.length === 0) {
    return {
      title: `Blok ${state.weekIndex}. hafta`,
      detail: 'Bu haftanın hedefleri mevcut programınla örtüşüyor; set eklemene gerek yok. Hafta sonunda kas kas geri bildirim gir, gelecek haftanın artışı ona göre belirlenecek.',
    };
  }

  const ilk = artacak.slice(0, 3).map(i => `${i.muscle} +${i.diff}`).join(', ');
  return {
    title: `Blok ${state.weekIndex}. hafta: ${artacak.length} kasta hacim artışı`,
    detail: `${ilk}${artacak.length > 3 ? ` ve ${artacak.length - 3} kas daha` : ''}. Artışlar geçen haftanın geri bildirimine göre hesaplandı.`,
  };
};
