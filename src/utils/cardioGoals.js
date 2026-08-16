import { parseNumber } from './number.js';
import { toLocalDate, dayKey, weekBounds } from './dates.js';
import { describeCardioEntry, INTENSITY_CLASSES } from './cardioZones.js';

/**
 * Kardiyo hedefleri ve koçu.
 *
 * Kardiyo uygulamada bir KALORİ KAYNAĞI olarak duruyordu: aktivite seç, süre
 * yaz, harcama hesabına girsin. Antrenman olarak hiç değerlendirilmiyordu —
 * ne bir hedefi vardı, ne ilerlemesi ölçülüyordu, ne de ağırlık antrenmanıyla
 * nasıl dağıtılacağı söyleniyordu.
 *
 * Burada üç soru yanıtlanıyor:
 *
 *  1. NE KADAR? Haftalık düşük şiddet dakikası ve yüksek şiddet seans sayısı.
 *  2. NASIL DAĞILMIŞ? Hacmin çoğu düşük şiddette mi, yoksa hepsi orta bölgede
 *     mi sıkışmış? İkincisi "orta yoğunluk tuzağı" — hem yorgunluk birikiyor
 *     hem taban gelişmiyor.
 *  3. NE ZAMAN? Yüksek şiddet kardiyo ile bacak günü aynı ya da bitişik günde
 *     olduğunda ikisi de zarar görüyor.
 */

/**
 * Hedef önayarları.
 *
 * `lowMinutes` haftalık düşük şiddet (zone 1-2) dakikası, `highSessions`
 * yüksek şiddet (zone 4-5) seans sayısı.
 *
 * Sayılar amaca göre değişiyor ve en önemli fark hipertrofi tarafında:
 * kas kazanımı önceliğinde kardiyo, toparlanmayı ve kalori açığını bozmayacak
 * kadar tutuluyor. "Daha çok kardiyo daha iyi" varsayımı burada geçerli değil.
 */
export const CARDIO_GOAL_PRESETS = [
  {
    key: 'off', label: 'Hedef yok', lowMinutes: 0, highSessions: 0,
    summary: 'Kardiyo takip edilir ama hedef konmaz',
    detail: 'Kardiyo kayıtların kalori hesabına girmeye devam eder; koç kardiyo tarafında hiçbir şey söylemez.',
  },
  {
    key: 'health', label: 'Sağlık', lowMinutes: 150, highSessions: 1,
    summary: 'Haftada 150 dk düşük şiddet + 1 yüksek şiddet',
    detail: 'Genel sağlık kılavuzlarının yaygın eşiği. Ağırlık antrenmanını neredeyse hiç etkilemeyecek bir yük; kalp-damar sağlığı için taban.',
  },
  {
    key: 'hypertrophy', label: 'Hipertrofiyi Koru', lowMinutes: 90, highSessions: 1,
    summary: 'Haftada 90 dk düşük şiddet + en fazla 1 yüksek şiddet',
    detail: 'Kas kazanımı öncelikliyken kardiyo toparlanmadan çalıyor. Düşük şiddet ağırlıklı ve sınırlı tutuluyor; yüksek şiddet tek seansla sınırlanıyor çünkü bacak toparlanmasına en çok o dokunuyor.',
  },
  {
    key: 'fatloss', label: 'Yağ Kaybı', lowMinutes: 180, highSessions: 2,
    summary: 'Haftada 180 dk düşük şiddet + 2 yüksek şiddet',
    detail: 'Açığı diyetin tamamına yıkmamak için kardiyo hacmi yüksek tutuluyor. Ağırlık payı yine düşük şiddette: yüksek şiddeti artırmak açık dönemde toparlanmayı hızla zorluyor.',
  },
  {
    key: 'endurance', label: 'Dayanıklılık', lowMinutes: 240, highSessions: 2,
    summary: 'Haftada 240 dk düşük şiddet + 2 yüksek şiddet',
    detail: 'Koşu, yüzme veya bisiklette performans hedefi varsa. Hacmin çoğu tabanda, küçük bir kısmı eşik ve üstünde — polarize dağılım.',
  },
];

export const findCardioPreset = (key) =>
  CARDIO_GOAL_PRESETS.find(p => p.key === key) || CARDIO_GOAL_PRESETS[0];

export const emptyCardioGoal = () => ({ preset: 'off', lowMinutes: 0, highSessions: 0 });

/** Ayardan geçerli hedefi çıkarır; elle girilen değerler önayarı ezer. */
export const resolveCardioGoal = (goal) => {
  const preset = findCardioPreset(goal?.preset);
  if (preset.key === 'off') return { ...preset, lowMinutes: 0, highSessions: 0, active: false };
  const low = parseNumber(goal?.lowMinutes);
  const high = parseNumber(goal?.highSessions);
  return {
    ...preset,
    lowMinutes: low > 0 ? Math.round(low) : preset.lowMinutes,
    highSessions: high >= 0 && goal?.highSessions !== '' && goal?.highSessions !== undefined
      ? Math.round(high) : preset.highSessions,
    active: true,
  };
};

// Yüksek şiddet bir "seans" sayılması için en az bu kadar dakika sürmeli;
// beş dakikalık bir sprint bloğu haftalık kotayı doldurmuş sayılmamalı.
const HIGH_SESSION_MIN_MINUTES = 8;
// Orta bölge payı bunu geçerse "orta yoğunluk tuzağı" uyarısı çıkıyor.
const MIDDLE_TRAP_RATIO = 0.5;
// Düşük şiddet payı polarize dağılımda bunun altına inmemeli.
const LOW_SHARE_TARGET = 0.7;

/** Verilen haftadaki kardiyo kayıtlarını toplar. */
const haftaninKayitlari = (workouts = [], { today = new Date(), ...zoneOpts } = {}) => {
  const { start, end } = weekBounds(today);
  const kayitlar = [];
  (workouts || []).forEach(w => {
    const d = toLocalDate(w?.date);
    if (!d || d < start || d > end) return;
    (w.cardio || []).forEach(entry => {
      if (!(parseNumber(entry?.minutes) > 0)) return;
      kayitlar.push({ ...describeCardioEntry(entry, zoneOpts), date: w.date });
    });
  });
  return { kayitlar, start: dayKey(start), end: dayKey(end) };
};

/**
 * Haftalık kardiyo durumu ve hedefe göre ilerleme.
 *
 * @returns { active, low, high, middle, balance, findings, ... }
 */
export const buildCardioReport = (workouts = [], goal, {
  today = new Date(),
  planResult = null,
  ...zoneOpts
} = {}) => {
  const hedef = resolveCardioGoal(goal);
  const { kayitlar, start, end } = haftaninKayitlari(workouts, { today, ...zoneOpts });

  const dakika = { low: 0, middle: 0, high: 0 };
  kayitlar.forEach(k => { dakika[k.intensity.key] += k.minutes; });
  const toplam = dakika.low + dakika.middle + dakika.high;

  const yuksekSeanslar = kayitlar.filter(k => k.intensity.key === 'high' && k.minutes >= HIGH_SESSION_MIN_MINUTES);

  const byZone = {};
  kayitlar.forEach(k => { byZone[k.zone.key] = (byZone[k.zone.key] || 0) + k.minutes; });

  const findings = [];

  if (hedef.active) {
    const lowKalan = Math.max(0, hedef.lowMinutes - dakika.low);
    if (lowKalan > 0) {
      findings.push({
        key: 'lowShort', severity: 'info',
        title: `Düşük şiddet ${dakika.low}/${hedef.lowMinutes} dk`,
        detail: `${lowKalan} dakika eksik. Zone 2 tempo — konuşabildiğin hız — yürüyüş, eğimli bant ya da rahat bisikletle kapatılabilir; bu bölge ağırlık antrenmanının toparlanmasına dokunmuyor.`,
      });
    }
    if (yuksekSeanslar.length > hedef.highSessions) {
      findings.push({
        key: 'highOver', severity: 'warn',
        title: `Yüksek şiddet ${yuksekSeanslar.length}/${hedef.highSessions} seans`,
        detail: `Hedefin üstünde. Zone 4-5 çalışma bacak toparlanmasından en çok çalan kardiyo türü; fazlası ağırlık antrenmanının hacmini sessizce düşürüyor. Fazla seansları düşük şiddete çevirmek hem hacmi korur hem yorgunluğu azaltır.`,
      });
    } else if (yuksekSeanslar.length < hedef.highSessions) {
      findings.push({
        key: 'highShort', severity: 'info',
        title: `Yüksek şiddet ${yuksekSeanslar.length}/${hedef.highSessions} seans`,
        detail: 'Eşik ve üstü çalışma dayanıklılığın üst ucunu geliştiriyor ve düşük şiddetin tek başına veremediği bir uyaran taşıyor. Bacak gününden uzak bir güne koy.',
      });
    }
  }

  // Orta yoğunluk tuzağı: hedef olmasa da geçerli bir uyarı.
  if (toplam >= 40 && dakika.middle / toplam > MIDDLE_TRAP_RATIO) {
    findings.push({
      key: 'middleTrap', severity: 'warn',
      title: 'Kardiyonun çoğu orta bölgede',
      detail: `${Math.round((dakika.middle / toplam) * 100)}% zone 3'te geçiyor. Bu bölge taban geliştirmek için fazla yorucu, üst uç geliştirmek için fazla hafif — hacmin çoğunu zone 2'ye indirip küçük bir kısmını zone 4-5'e çıkarmak, aynı süreyle daha çok kazandırır.`,
    });
  } else if (toplam >= 40 && dakika.low / toplam < LOW_SHARE_TARGET && dakika.high > 0) {
    findings.push({
      key: 'lowShare', severity: 'info',
      title: `Düşük şiddet payı %${Math.round((dakika.low / toplam) * 100)}`,
      detail: 'Dayanıklılıkta yaygın yaklaşım hacmin yaklaşık %80\'ini düşük şiddete koymak. Payı artırmak toparlanmayı bozmadan hacim eklemenin en ucuz yolu.',
    });
  }

  // Yerleşim: yüksek şiddet kardiyo ile bacak günü çakışması.
  const bacakGunleri = new Set(
    (planResult?.days || [])
      .filter(g => (g.byMuscle?.Quadriceps || 0) >= 4 || (g.byMuscle?.Hamstring || 0) >= 4)
      .map(g => g.key));
  const gunSirasi = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const cakisan = yuksekSeanslar.filter(k => {
    const d = toLocalDate(k.date);
    if (!d) return false;
    const key = gunSirasi[(d.getDay() + 6) % 7];
    return bacakGunleri.has(key);
  });
  if (cakisan.length > 0) {
    findings.push({
      key: 'placement', severity: 'warn',
      title: 'Yüksek şiddet kardiyo bacak gününde',
      detail: `${cakisan.length} seans bacak günüyle aynı güne denk geliyor. Aynı gün yapılması gerekiyorsa ağırlık önce, kardiyo sonra — ters sırada çömeliş performansı ölçülebilir biçimde düşüyor. Mümkünse bacak gününden en az bir gün uzağa al.`,
    });
  }

  const puan = { warn: 2, info: 1 };
  findings.sort((a, b) => (puan[b.severity] || 0) - (puan[a.severity] || 0));

  return {
    active: hedef.active,
    goal: hedef,
    weekStart: start,
    weekEnd: end,
    entries: kayitlar,
    minutes: dakika,
    totalMinutes: toplam,
    highSessions: yuksekSeanslar.length,
    byZone,
    shares: toplam > 0
      ? {
        low: Math.round((dakika.low / toplam) * 100),
        middle: Math.round((dakika.middle / toplam) * 100),
        high: Math.round((dakika.high / toplam) * 100),
      }
      : { low: 0, middle: 0, high: 0 },
    findings,
    hasData: kayitlar.length > 0,
    // Hedef var, hafta tamamlanmış ve uyarı yok: bunu söylemek de bilgi.
    onTrack: hedef.active && findings.length === 0,
  };
};

/**
 * Bugün için kardiyo tavsiyesi.
 *
 * Hedefe kalan iş, bugünün ağırlık planı ve yorgunluk birlikte
 * değerlendiriliyor. Bacak günündeyse yüksek şiddet önerilmiyor.
 */
export const cardioSuggestionForToday = (report, { planDay = null, readinessScore = null } = {}) => {
  if (!report?.active) return null;

  const bacakGunu = (planDay?.byMuscle?.Quadriceps || 0) >= 4 || (planDay?.byMuscle?.Hamstring || 0) >= 4;
  const lowKalan = Math.max(0, report.goal.lowMinutes - report.minutes.low);
  const highKalan = Math.max(0, report.goal.highSessions - report.highSessions);

  if (highKalan > 0 && !bacakGunu && (readinessScore === null || readinessScore >= 60)) {
    return {
      kind: 'high',
      title: 'Bugün yüksek şiddet kardiyoya uygun',
      detail: `Haftalık ${report.goal.highSessions} seansın ${highKalan} tanesi kaldı ve bugün bacak günü değil. İnterval koşu, assault bike ya da HIIT — 15-25 dakika yeter. Ağırlık antrenmanı varsa kardiyoyu sonraya bırak.`,
    };
  }

  if (lowKalan > 0) {
    const oneri = Math.min(lowKalan, 45);
    return {
      kind: 'low',
      title: `${oneri} dakika düşük şiddet kardiyo`,
      detail: `Haftalık düşük şiddet hedefine ${lowKalan} dakika kaldı. Zone 2'de — konuşabildiğin tempoda — yürüyüş, eğimli bant veya rahat bisiklet. Bu bölge bacak toparlanmasına dokunmadığı için bacak gününde bile yapılabilir.`,
    };
  }

  return {
    kind: 'done',
    title: 'Haftalık kardiyo hedefi tamam',
    detail: `${report.minutes.low} dk düşük şiddet ve ${report.highSessions} yüksek şiddet seansı. Üstüne eklemek zorunda değilsin; kardiyo hacmini artırmak ancak ağırlık antrenmanın toparlanmasını bozmuyorsa kazanç.`,
  };
};

/** Kardiyo koçunun günlük satırı. */
export const cardioCoachItem = (report, suggestion) => {
  if (!report?.active) return null;

  // Uyarı varsa o öne çıkıyor: hedefi tamamlamak, yanlış dağılımla
  // tamamlamaktan daha az önemli.
  const uyari = report.findings.find(f => f.severity === 'warn');
  if (uyari) return { key: 'cardio-balance', title: uyari.title, detail: uyari.detail };

  if (suggestion && suggestion.kind !== 'done') {
    return { key: 'cardio-todo', title: suggestion.title, detail: suggestion.detail };
  }
  return null;
};

export const INTENSITY_ORDER = [INTENSITY_CLASSES.low, INTENSITY_CLASSES.middle, INTENSITY_CLASSES.high];
