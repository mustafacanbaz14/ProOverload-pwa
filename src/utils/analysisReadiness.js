import { parseNumber } from './number.js';

/**
 * Analiz kilitleri: bu kart neden boş.
 *
 * Uygulamadaki analizlerin çoğunun bir veri eşiği var ve bu doğru — dört
 * seanslık veriden plato çıkarmak, gürültüyü teşhis diye sunmak olurdu. Ama
 * eşik SESSİZ çalışıyordu: kart ya hiç görünmüyor ya da "yeterli veri yok"
 * yazıyordu. İkisi de aynı soruyu cevapsız bırakıyor — NE KADAR yeterli değil
 * ve ne girersem açılır.
 *
 * Kullanıcı açısından sonucu şu oluyordu: uygulamanın yarısının var olduğu
 * bile bilinmiyor. Bir kart hiç görünmediyse, o özelliğin eksik olduğu değil
 * var olmadığı sanılıyor.
 *
 * Bu modül eşikleri görünür kılıyor: her analiz için ne gerekiyor, elde ne
 * var, ne kadar kaldı. Ve en çok işe yarayan tarafı: hangi TEK veri türünü
 * girmenin en çok analizi açacağını söylüyor.
 *
 * Sayıları burada hesaplamıyor — uygulamadan alıyor. İkinci bir sayaç yazmak,
 * kartın "açık" dediği bir analizin boş görünmesi demek olurdu.
 */

/**
 * Analiz kaydı.
 *
 * `needs` içindeki her satır bir koşul: `count` sayaç anahtarı, `need` eşik.
 * Hepsi sağlanmalı — analizlerin çoğu tek bir sayıya değil birkaç şeyin
 * birlikte olmasına bağlı.
 */
export const ANALYSES = [
  {
    key: 'scorecard', label: 'Kas Karnesi', area: 'Analiz',
    needs: [{ count: 'workouts', need: 4, label: 'antrenman' }],
    value: 'Her kasa hacim, ilerleme ve sıklıktan tek not.',
  },
  {
    key: 'plateau', label: 'Plato Taraması', area: 'İlerleme',
    needs: [
      { count: 'exercisesWith4Sessions', need: 1, label: '4 seans yapılmış hareket' },
      { count: 'trainingDays', need: 21, label: 'gün antrenman geçmişi' },
    ],
    value: 'Duraklamış ve gerileyen hareketleri erken yakalar.',
  },
  {
    key: 'roi', label: 'Hareket Getirisi', area: 'İlerleme',
    needs: [{ count: 'exercisesWith4Sessions', need: 2, label: '4 seans yapılmış hareket' }],
    value: 'Hangi hareketin yatırdığın seti geri verdiğini gösterir.',
  },
  {
    key: 'response', label: 'Tepki Profili', area: 'Analiz',
    needs: [{ count: 'workouts', need: 8, label: 'antrenman' }, { count: 'exercisesWith4Sessions', need: 2, label: '4 seans yapılmış hareket' }],
    value: 'Hangi tekrar aralığı ve hacim bandında daha hızlı ilerlediğini ölçer.',
  },
  {
    key: 'drivers', label: 'Performans Sürücüleri', area: 'Koç',
    needs: [{ count: 'workouts', need: 11, label: 'antrenman' }],
    value: 'Uyku, protein ve dinlenmenin senin performansınla ilişkisini ölçer.',
  },
  {
    key: 'form', label: 'Form Eğrisi', area: 'Koç',
    needs: [{ count: 'trainingDays', need: 14, label: 'gün antrenman geçmişi' }, { count: 'workouts', need: 5, label: 'antrenman' }],
    value: 'Fitness ve yorgunluğu ayrı ayrı modelleyip toparlanma penceresini söyler.',
  },
  {
    key: 'blockCompare', label: 'Blok Karşılaştırma', area: 'Analiz',
    needs: [{ count: 'trainingDays', need: 56, label: 'gün antrenman geçmişi' }, { count: 'workouts', need: 10, label: 'antrenman' }],
    value: 'Son iki bloğun neyi değiştirdiğini ve ne ürettiğini yan yana koyar.',
  },
  {
    key: 'standards', label: 'Kuvvet Standartları', area: 'İlerleme',
    needs: [{ count: 'bodyWeight', need: 1, label: 'vücut ağırlığı kaydı' }, { count: 'mainLifts', need: 1, label: 'ana hareket' }],
    value: 'Ana hareketlerini kendi kilonuza göre konumlandırır.',
  },
  {
    key: 'sleepLink', label: 'Uyku × Performans', area: 'Koç',
    needs: [{ count: 'sleepNights', need: 10, label: 'gece uyku kaydı' }, { count: 'workouts', need: 8, label: 'antrenman' }],
    value: 'Uyku puanının seans kaliteni gerçekten değiştirip değiştirmediğini ölçer.',
  },
  {
    key: 'nutritionLink', label: 'Beslenme × Performans', area: 'Koç',
    needs: [{ count: 'nutritionDays', need: 12, label: 'gün beslenme kaydı' }, { count: 'workouts', need: 8, label: 'antrenman' }],
    value: 'Karbonhidrat ve protein alımının performansla ilişkisini kurar.',
  },
  {
    key: 'adaptiveRest', label: 'Ölçülmüş Dinlenme', area: 'Antrenman',
    needs: [{ count: 'restSamples', need: 12, label: 'ölçülmüş dinlenme' }],
    value: 'Kendi verinden kişiye özel dinlenme süresi çıkarır.',
  },
  {
    key: 'protocol', label: 'Koç Merkezi Protokolü', area: 'Koç',
    needs: [
      { count: 'lastWeekSessions', need: 2, label: 'geçen hafta antrenman' },
      { count: 'sleepNights', need: 3, label: 'gece uyku kaydı' },
    ],
    value: 'Geçen haftayı tek bir gelecek hafta kararına çevirir.',
  },
  {
    key: 'restingHr', label: 'Dinlenme Nabzı Sapması', area: 'Toparlanma',
    needs: [{ count: 'restingHrEntries', need: 7, label: 'sabah nabzı kaydı' }],
    value: 'Bildirilen değil ölçülen bir toparlanma sinyali verir.',
  },
  {
    key: 'painPattern', label: 'Ağrı Örüntüsü', area: 'Toparlanma',
    needs: [{ count: 'painEntries', need: 3, label: 'ağrı kaydı' }],
    value: 'Ağrılı günlerde hangi hareketlerin yapıldığını sayar.',
  },
  {
    key: 'ledger', label: 'Koç Karar Defteri', area: 'Koç',
    needs: [{ count: 'ledgerEntries', need: 1, label: 'uygulanmış tavsiye' }],
    value: 'Koçun tavsiyelerinin işe yarayıp yaramadığını ölçer.',
  },
  {
    key: 'bodyTrend', label: 'Vücut Eğilimi', area: 'Ölçüm',
    needs: [{ count: 'metricEntries', need: 4, label: 'ölçüm kaydı' }],
    value: 'Günlük dalgalanmadan arındırılmış kilo ve çevre eğilimi.',
  },
];

/** Tek analizin durumu. */
const durum = (analiz, counts) => {
  const kosullar = analiz.needs.map(n => {
    const have = Math.max(0, parseNumber(counts[n.count]));
    return { ...n, have, ok: have >= n.need, remaining: Math.max(0, n.need - have) };
  });
  const eksikler = kosullar.filter(k => !k.ok);
  // İlerleme en zayıf koşula göre: üç koşuldan ikisi tamsa ve biri hiç yoksa
  // "%66 hazır" demek analizin açılmaya yakın olduğunu ima ederdi.
  const oran = kosullar.length
    ? Math.min(...kosullar.map(k => Math.min(1, k.need > 0 ? k.have / k.need : 1)))
    : 1;
  return {
    ...analiz,
    ready: eksikler.length === 0,
    progress: Math.round(oran * 100),
    conditions: kosullar,
    missing: eksikler,
    // "En az bunu gir" cümlesi: en yakın eksik koşul.
    nearest: [...eksikler].sort((a, b) => a.remaining - b.remaining)[0] || null,
  };
};

/**
 * @param counts { workouts, trainingDays, exercisesWith4Sessions, sleepNights,
 *                 nutritionDays, metricEntries, restSamples, painEntries,
 *                 restingHrEntries, bodyWeight, mainLifts, lastWeekSessions,
 *                 ledgerEntries }
 */
export const buildAnalysisReadiness = (counts = {}) => {
  const satirlar = ANALYSES.map(a => durum(a, counts));
  const acik = satirlar.filter(r => r.ready);
  const kilitli = satirlar.filter(r => !r.ready).sort((a, b) => b.progress - a.progress);

  // Hangi tek veri türü en çok analizi açar. Kullanıcıya "şunu gir" demek,
  // on beş kilidi tek tek saymaktan çok daha işe yarar.
  const sayac = new Map();
  kilitli.forEach(r => r.missing.forEach(m => {
    const kayit = sayac.get(m.count) || { count: m.count, label: m.label, unlocks: 0, maxRemaining: 0 };
    kayit.unlocks += 1;
    kayit.maxRemaining = Math.max(kayit.maxRemaining, m.remaining);
    sayac.set(m.count, kayit);
  }));
  const darbogaz = [...sayac.values()].sort((a, b) => b.unlocks - a.unlocks || a.maxRemaining - b.maxRemaining);

  return {
    total: satirlar.length,
    ready: acik.length,
    locked: kilitli.length,
    rows: satirlar,
    unlocked: acik,
    lockedRows: kilitli,
    // En yakın kilit: bir sonraki hedef.
    next: kilitli[0] || null,
    bottleneck: darbogaz[0] || null,
    bottlenecks: darbogaz.slice(0, 3),
    // Tamamı açıldığında kart susuyor; her şey açıkken kilit listesi göstermek
    // ekranda yer kaplamaktan başka bir şey yapmaz.
    silent: kilitli.length === 0,
  };
};

// Eksik veriyi tekrar analiz ekranına yönlendirmek dairesel bir akıştı:
// kullanıcı aynı "yeterli veri yok" kartına geri dönüyordu. Her sayaç, verinin
// gerçekten girilebildiği ana göreve bağlanır.
export const actionForAnalysisCount = (count) => ({
  workouts: 'training',
  trainingDays: 'training',
  exercisesWith4Sessions: 'training',
  restSamples: 'training',
  mainLifts: 'training',
  lastWeekSessions: 'training',
  sleepNights: 'wellness',
  nutritionDays: 'nutrition',
  metricEntries: 'metrics',
  bodyWeight: 'metrics',
  restingHrEntries: 'cardio',
  painEntries: 'pain',
  ledgerEntries: 'ledger',
}[count] || 'history');

/** Koç kartı: tek bir veri türü çok sayıda analizi kilitliyorsa. */
export const readinessCoachItem = (report) => {
  const b = report?.bottleneck;
  if (!b || b.unlocks < 3) return null;
  return {
    key: 'analysis-lock',
    tone: 'info',
    action: actionForAnalysisCount(b.count),
    title: `${b.unlocks} analiz aynı veriyi bekliyor: ${b.label}`,
    detail: `Uygulamadaki ${report.total} analizden ${report.locked} tanesi henüz açılmadı ve bunların ${b.unlocks} tanesini kilitleyen tek şey aynı: ${b.label}. En çok eksik olanda ${b.maxRemaining} kayıt kaldı.`,
  };
};
