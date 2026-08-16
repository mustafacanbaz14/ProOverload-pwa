import { parseNumber } from './number.js';
import { estimate1RM, isWorkingSet } from './helpers.js';
import { toLocalDate, dayKey } from './dates.js';

/**
 * Kuvvet dengesi denetimi.
 *
 * Uygulama hacmi kas kas denetliyordu (MEV/MAV/MRV) ve hareket seçimini
 * profil olarak denetliyordu (gerilme/kısalma). Denetlenmeyen üçüncü bir şey
 * vardı: KUVVETİN kaslar arasındaki dağılımı.
 *
 * Hacim eşit olsa bile kuvvet eşit gelişmiyor. Klasik örnek, benchi 120'ye
 * çıkarken row'u 70'te kalan lifter: hacim tablosunda göğüs ve sırt yan yana
 * yeşil görünür, ama omuz eklemi çevresindeki kuvvet dengesi bozulmuştur ve
 * çekiş tarafı hem gelişimi hem eklem sağlığını sınırlar.
 *
 * ORANLAR KESİN DEĞİL, ARALIK. Literatürdeki değerler kişiden kişiye kol/bacak
 * uzunluğuna göre kayıyor; bu yüzden modül tek bir "doğru oran" söylemiyor,
 * bir bant veriyor ve yalnızca bandın DIŞINA çıkıldığında konuşuyor. Bandın
 * içindeyken sessiz kalmak, uyarıyı anlamlı kılan şey.
 */

/**
 * Oran tanımları.
 *
 * `of` bölünen, `to` bölen. `min`/`max` sağlıklı bant. Her tanım hangi
 * hareketlerden okunacağını kendi söylüyor; kullanıcı hangi varyantı
 * yapıyorsa en ağırı alınıyor.
 */
export const BALANCE_RULES = [
  {
    key: 'pushPull',
    label: 'Yatay itiş / çekiş',
    of: { label: 'Bench', patterns: [/barbell bench press/i, /dumbbell bench press/i, /machine chest press/i, /smith machine bench press/i] },
    to: { label: 'Row', patterns: [/barbell row/i, /pendlay row/i, /t-bar row/i, /seated cable row/i, /machine row/i, /chest supported row/i, /dumbbell row/i] },
    min: 0.9, max: 1.25,
    low: 'Çekiş, itişin önünde. Kendi başına bir sorun değil — sırt baskın bir lifter sağlıklıdır — ama göğüs gelişimi geride kalıyorsa hacmi oradan artırmak mantıklı.',
    high: 'İtiş, çekişin belirgin önünde. Bu dağılım omuz ekleminde öne doğru bir kuvvet dengesizliği bırakıyor; sırt hacmini artırmak hem eklem hem gelişim tarafında kazandırır.',
  },
  {
    key: 'squatDeadlift',
    label: 'Çömeliş / kalça menteşesi',
    of: { label: 'Squat', patterns: [/barbell back squat/i, /barbell front squat/i, /hack squat/i, /smith machine squat/i] },
    to: { label: 'Deadlift', patterns: [/conventional deadlift/i, /sumo deadlift/i, /trap bar deadlift/i, /romanian deadlift/i] },
    min: 0.7, max: 1.0,
    low: 'Kalça menteşesi çömelişin belirgin önünde. Quadriceps tarafı geride kalıyor olabilir; çömeliş varyantına hacim eklemek dengeyi toplar.',
    high: 'Çömeliş, kalça menteşesinin önünde. Arka zincir (hamstring, kalça, erektör) geride; bu hem diz çevresinde dengesiz yüklenme hem de gelişim boşluğu demek.',
  },
  {
    key: 'quadHam',
    label: 'Quadriceps / hamstring',
    of: { label: 'Leg Extension', patterns: [/leg extension/i, /leg press/i] },
    to: { label: 'Leg Curl', patterns: [/lying leg curl/i, /seated leg curl/i, /standing leg curl/i, /nordic/i, /glute ham raise/i] },
    min: 1.2, max: 2.2,
    low: 'Hamstring, quadriceps kuvvetine göre yüksek. Nadir bir tablo; ölçüm hareketlerinden biri yeterince zorlanmamış olabilir.',
    high: 'Quadriceps hamstringin çok önünde. Diz çevresinde en sık görülen dengesizlik; hamstring hacmini artırmak hem diz hem sprint/atlama tarafında kazandırır.',
  },
  {
    key: 'pressPull',
    label: 'Dikey itiş / çekiş',
    of: { label: 'OHP', patterns: [/overhead press/i, /\bohp\b/i, /seated dumbbell shoulder press/i, /machine shoulder press/i] },
    to: { label: 'Pulldown', patterns: [/lat pulldown/i, /weighted pull-?up/i, /pull-?up/i, /chin-?up/i] },
    min: 0.5, max: 0.9,
    low: 'Dikey çekiş, baş üstü itişin belirgin önünde. Omuz basışına hacim eklemek üst gövde dengesini toparlar.',
    high: 'Baş üstü itiş, dikey çekişin önünde. Kanat ve orta sırt geride kalıyor; bu, omuz kuşağının stabilitesini de etkiliyor.',
  },
];

// Bu kadar günden eski kayıtlar oranı bozuyor: altı ay önceki bench ile
// bugünkü row'u kıyaslamak, dengesizlik değil zaman farkı ölçer.
const WINDOW_DAYS = 120;
// Bir hareket için en az bu kadar çalışma seti olmalı; tek set bir tahmin,
// oran kurmaya yetmez.
const MIN_SETS = 3;

/** Kalıplara uyan hareketlerin en yüksek tahmini 1RM'i. */
const enIyi1RM = (workouts, patterns, { resolveLoad = null, since = null } = {}) => {
  let best = null;
  let setSayisi = 0;

  (workouts || []).forEach(w => {
    if (since && w?.date) {
      const d = toLocalDate(w.date);
      if (d && d < since) return;
    }
    (w?.exercises || []).forEach(ex => {
      if (!ex?.name || !patterns.some(p => p.test(ex.name))) return;
      (ex.sets || []).forEach(set => {
        if (!isWorkingSet(set)) return;
        const tekrar = parseNumber(set.reps);
        if (!(tekrar > 0)) return;
        const yuk = resolveLoad ? resolveLoad(ex.name, set.weight, w) : parseNumber(set.weight);
        if (!(yuk > 0)) return;
        setSayisi += 1;
        // 12 tekrarın üstünde 1RM tahmini hızla güvenilirliğini kaybediyor;
        // oranın iki tarafı farklı tekrar bölgelerinden gelirse fark gerçek
        // kuvvet farkı değil, formülün hatası olur.
        if (tekrar > 12) return;
        const tahmin = estimate1RM(yuk, tekrar, set.rir);
        if (!(tahmin > 0)) return;
        if (best === null || tahmin > best.value) {
          best = { value: Math.round(tahmin * 10) / 10, exercise: ex.name, date: w.date, weight: yuk, reps: tekrar };
        }
      });
    });
  });

  return best && setSayisi >= MIN_SETS ? best : null;
};

/**
 * Kuvvet dengesi raporu.
 *
 * Yalnızca İKİ tarafı da ölçülebilen oranlar döndürülüyor. Tek taraf eksikse
 * "dengesizlik yok" demek yanlış olurdu; o oran raporda `missing` olarak
 * görünüyor ve hangi hareketin eksik olduğunu söylüyor.
 */
export const buildStrengthBalance = (workouts = [], {
  resolveLoad = null,
  today = new Date(),
  windowDays = WINDOW_DAYS,
} = {}) => {
  const bugun = toLocalDate(dayKey(today));
  const since = bugun ? new Date(bugun) : null;
  if (since) since.setDate(bugun.getDate() - windowDays);

  const ratios = [];
  const missing = [];

  BALANCE_RULES.forEach(kural => {
    const a = enIyi1RM(workouts, kural.of.patterns, { resolveLoad, since });
    const b = enIyi1RM(workouts, kural.to.patterns, { resolveLoad, since });

    if (!a || !b) {
      missing.push({
        key: kural.key,
        label: kural.label,
        need: [!a && kural.of.label, !b && kural.to.label].filter(Boolean),
      });
      return;
    }

    const oran = Math.round((a.value / b.value) * 100) / 100;
    const durum = oran < kural.min ? 'low' : oran > kural.max ? 'high' : 'ok';
    // Bandın dışına ne kadar çıkıldığı: sıralama için.
    const sapma = durum === 'low' ? kural.min - oran : durum === 'high' ? oran - kural.max : 0;

    ratios.push({
      key: kural.key,
      label: kural.label,
      ratio: oran,
      min: kural.min,
      max: kural.max,
      status: durum,
      deviation: Math.round(sapma * 100) / 100,
      advice: durum === 'ok' ? '' : kural[durum],
      of: { ...a, label: kural.of.label },
      to: { ...b, label: kural.to.label },
    });
  });

  ratios.sort((a, b) => b.deviation - a.deviation);

  return {
    ratios,
    missing,
    hasData: ratios.length > 0,
    issues: ratios.filter(r => r.status !== 'ok'),
    windowDays,
  };
};

/** Kuvvet dengesinin günlük koç satırı. */
export const strengthBalanceCoachItem = (report) => {
  if (!report?.hasData || report.issues.length === 0) return null;
  const ilk = report.issues[0];
  return {
    key: ilk.key,
    title: `${ilk.label} oranı bandın dışında`,
    detail: `${ilk.of.label} ${ilk.of.value} kg / ${ilk.to.label} ${ilk.to.value} kg = ${ilk.ratio} (sağlıklı bant ${ilk.min}–${ilk.max}). ${ilk.advice}`,
  };
};
