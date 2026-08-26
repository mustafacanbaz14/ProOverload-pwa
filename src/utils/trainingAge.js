import { estimate1RM, isCompletedWorkingSet } from './helpers.js';

/**
 * Antrenman yaşı tahmini.
 *
 * Deneyim seviyesi hacim bandını belirleyen en güçlü ayar ama kullanıcı onu
 * kurulumda bir kez seçiyor ve bir daha dönüp bakmıyor. İki yıl sonra hâlâ
 * "Yeni Başlayan" olarak duran bir hesap, bütün hacim hedeflerini sistematik
 * olarak düşük tutuyor.
 *
 * Modül seviyeyi ÖNERİYOR, uygulamıyor. Bunun sebebi tahminin doğası: kayıt
 * geçmişi kişinin antrenman yaşını değil UYGULAMAYI KULLANMA yaşını ölçüyor.
 * On yıldır çalışan biri uygulamaya dün başlamış olabilir. Bu yüzden öneri
 * daima "kayıtlarına göre" diye çerçeveleniyor ve elle seçim her zaman kazanıyor.
 *
 * Üç sinyal kullanılıyor ve üçü de tek başına yetersiz:
 *  - SÜRE: ilk kayıttan bugüne geçen zaman. Ama ara verilmiş olabilir.
 *  - YOĞUNLUK: haftalık ortalama seans. Tutarlılığın ölçüsü.
 *  - İLERLEME HIZI: tahmini 1RM'in artış oranı. Acemide hızlı, ileri seviyede
 *    yavaş — bu, deneyimin en doğrudan göstergesi ama en gürültülü olanı.
 */

const HAFTA = 7 * 86400000;

// Bu kadar aktif haftanın altında hiçbir öneri yapılmıyor.
const MIN_WEEKS = 6;

export const buildTrainingAge = (workouts = [], { resolveLoad = null } = {}) => {
  const sirali = [...(workouts || [])]
    .filter(w => w?.date && (w.exercises || []).length > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sirali.length < 8) {
    return { hasData: false, sessions: sirali.length, suggestion: null };
  }

  const ilk = new Date(sirali[0].date);
  const son = new Date(sirali.at(-1).date);
  const gecenHafta = Math.max(1, Math.round((son - ilk) / HAFTA));
  const aktifHaftalar = new Set(sirali.map(w => {
    const d = new Date(w.date);
    const g = d.getDay();
    const pzt = new Date(d);
    pzt.setHours(0, 0, 0, 0);
    pzt.setDate(d.getDate() - g + (g === 0 ? -6 : 1));
    return pzt.toISOString().slice(0, 10);
  })).size;

  if (aktifHaftalar < MIN_WEEKS) {
    return { hasData: false, sessions: sirali.length, weeks: aktifHaftalar, suggestion: null };
  }

  const haftalikSeans = Math.round((sirali.length / gecenHafta) * 10) / 10;

  // İlerleme hızı: ana hareketlerin tahmini 1RM'inde ilk ve son üçte bir.
  const seriler = new Map();
  sirali.forEach(w => (w.exercises || []).forEach(ex => {
    const en = Math.max(0, ...(ex.sets || []).filter(isCompletedWorkingSet).map(s => {
      const yuk = resolveLoad ? resolveLoad(ex.name, s.weight, w) : s.weight;
      return estimate1RM(yuk, s.reps, s.rir);
    }));
    if (en > 0) seriler.set(ex.name, [...(seriler.get(ex.name) || []), en]);
  }));

  const hizlar = [];
  seriler.forEach(seri => {
    if (seri.length < 6) return;
    const dilim = Math.max(1, Math.round(seri.length / 3));
    const bas = seri.slice(0, dilim).reduce((t, x) => t + x, 0) / dilim;
    const sonD = seri.slice(-dilim).reduce((t, x) => t + x, 0) / dilim;
    if (bas > 0) hizlar.push(((sonD - bas) / bas) * 100);
  });
  // Aylık yüzde ilerleme.
  const aySayisi = Math.max(1, gecenHafta / 4.33);
  const ilerlemeHizi = hizlar.length
    ? Math.round(((hizlar.reduce((t, x) => t + x, 0) / hizlar.length) / aySayisi) * 100) / 100
    : null;

  // Puanlama: her sinyal 0-100, ortalamaları seviyeye çevriliyor.
  const surePuan = Math.min(100, (aktifHaftalar / 104) * 100);
  const yogunlukPuan = Math.min(100, (haftalikSeans / 4) * 100);
  // Aylık %3+ ilerleme acemi işareti; %0.5 altı ileri seviye işareti.
  const hizPuan = ilerlemeHizi === null ? 50
    : Math.min(100, Math.max(0, (1 - Math.min(3, Math.max(0, ilerlemeHizi)) / 3) * 100));

  // Süre en güvenilir sinyal; ilerleme hızı en gürültülüsü, o yüzden en az
  // ağırlığı o taşıyor.
  const puan = Math.round(surePuan * 0.5 + yogunlukPuan * 0.2 + hizPuan * 0.3);
  const seviye = puan >= 62 ? 'advanced' : puan >= 32 ? 'intermediate' : 'beginner';

  return {
    hasData: true,
    sessions: sirali.length,
    weeks: aktifHaftalar,
    spanWeeks: gecenHafta,
    sessionsPerWeek: haftalikSeans,
    monthlyProgress: ilerlemeHizi,
    score: puan,
    suggestion: seviye,
    // Güven düşükse arayüz öneriyi daha yumuşak sunuyor.
    confidence: aktifHaftalar >= 26 && hizlar.length >= 3 ? 'high'
      : aktifHaftalar >= 12 ? 'medium' : 'low',
    reasons: [
      `${aktifHaftalar} aktif hafta kayıtlı`,
      `haftada ortalama ${haftalikSeans} seans`,
      ilerlemeHizi === null
        ? 'ilerleme hızı ölçülemedi'
        : `tahmini 1RM ayda %${ilerlemeHizi} değişiyor`,
    ],
  };
};

/**
 * Koç kartı: yalnızca öneri seçili seviyeden FARKLIYSA ve güven düşük değilse.
 *
 * Aynı seviyeyi öneren bir kart hiçbir şey söylemiyor; düşük güvenle seviye
 * değiştirmeye ikna etmek ise kullanıcıyı kendi bilgisinden uzaklaştırırdı.
 */
export const trainingAgeCoachItem = (report, currentLevel = 'intermediate') => {
  if (!report?.hasData || !report.suggestion) return null;
  if (report.suggestion === currentLevel) return null;
  if (report.confidence === 'low') return null;
  const etiket = { beginner: 'Yeni Başlayan', intermediate: 'Orta', advanced: 'İleri' };
  return {
    key: 'training-age',
    tone: 'info',
    title: `Kayıtların ${etiket[report.suggestion]} seviyeye işaret ediyor`,
    detail: `Şu an ${etiket[currentLevel]} seçili. Gerekçe: ${report.reasons.join(', ')}. `
      + 'Seviye hacim bandını hem kaydırıyor hem genişletiyor, o yüzden fark eder. '
      + 'Ama bu tahmin uygulamayı kullanma geçmişini ölçüyor, antrenman yaşını değil — '
      + 'uygulamaya sonradan başladıysan kendi bildiğin doğru.',
  };
};
