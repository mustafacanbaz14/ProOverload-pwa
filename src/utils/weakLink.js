import { parseNumber } from './number.js';

/**
 * Zayıf halka analizi.
 *
 * Uygulama gelişimi beş ayrı pencereden anlatıyor: kuvvet standartları, kas
 * dengesi, hacim tablosu, durgunluk taraması ve seçim denetimi. Hepsi doğru
 * ama hiçbiri "ÖNCE NEYİ DÜZELTEYİM" sorusunu cevaplamıyor. Kullanıcı beş
 * ekranda beş ayrı uyarı görüyor ve hangisinin daha acil olduğunu bilmiyor.
 *
 * Bu modül o beş sinyali tek bir sıralı listeye indiriyor. Sıralama
 * ETKİ × KESİNLİK ile yapılıyor:
 *
 *  ETKİ    — düzeltilirse ne kadar fark yaratır. Bir kasın koruma eşiğinin
 *            altında olması, aynı kasın standartlarda geride olmasından daha
 *            büyük bir etki: biri büyümeyi durduruyor, diğeri yalnızca
 *            karşılaştırmalı bir konum.
 *  KESİNLİK— sinyalin ne kadar sağlam veriye dayandığı. Dört haftalık
 *            hacim verisi, iki seanslık bir durgunluk şüphesinden güvenilir.
 *
 * Modül HESAP YAPMIYOR: girdilerin hepsi başka modüllerin çıktısı. İşi
 * birleştirmek ve sıralamak — aynı hesabı ikinci kez yapmak iki farklı sayı
 * üretme riski taşırdı.
 */

const SEVERITY = { high: 3, medium: 2, low: 1 };

/**
 * @param sources {
 *   volumeStatuses  weekPlan/dashboard çıktısı [{ muscle, volume, mev, mrv, status }]
 *   balance         strengthBalance raporu
 *   standards       strengthStandards raporu
 *   plateaus        plateau taraması
 *   selection       selectionAudit raporu
 *   frequency       frequencyPlanner raporu
 * }
 */
export const buildWeakLinks = (sources = {}, { limit = 5 } = {}) => {
  const bulgular = [];

  const ekle = (item) => {
    if (!item?.title) return;
    bulgular.push({
      confidence: 'medium',
      ...item,
      // Sıralama puanı: etki ağır basıyor ama kesinlik onu bastırabiliyor.
      // Düşük kesinlikli yüksek etki, yüksek kesinlikli orta etkinin önüne
      // geçmemeli — yoksa liste tahminlerle dolar.
      rank: (SEVERITY[item.impact] || 2) * 10 + (SEVERITY[item.confidence || 'medium'] || 2),
    });
  };

  // 1. Koruma eşiğinin altındaki kaslar. En yüksek etki: hacim yetersizse
  //    diğer hiçbir düzeltme işe yaramıyor.
  (sources.volumeStatuses || [])
    .filter(s => s?.status === 'below' && parseNumber(s.volume) > 0)
    .forEach(s => ekle({
      key: `volume-${s.muscle}`,
      area: 'Hacim',
      muscle: s.muscle,
      impact: 'high',
      confidence: 'high',
      title: `${s.muscle} koruma eşiğinin altında`,
      detail: `Haftalık ${s.volume} set, koruma eşiği ${s.mev}. Bu hacimde kas büyümesi değil ancak korunma bekleniyor. Eksik ${Math.max(0, Math.round((s.mev - s.volume) * 4) / 4)} set — bunu kapatmak listedeki her şeyden önce gelir.`,
      action: 'plan',
    }));

  // 2. Tavanı aşanlar. Yüksek etki ama ters yönde: fazlası toparlanmayı
  //    yiyor ve diğer kasların hacmini de dolaylı olarak baltalıyor.
  (sources.volumeStatuses || [])
    .filter(s => s?.status === 'over')
    .forEach(s => ekle({
      key: `overvolume-${s.muscle}`,
      area: 'Hacim',
      muscle: s.muscle,
      impact: 'high',
      confidence: 'high',
      title: `${s.muscle} tavanın üstünde`,
      detail: `Haftalık ${s.volume} set, tavan ${s.mrv}. Tavanın üstündeki hacim uyaran eklemiyor, toparlanmadan çalıyor — ve o toparlanma bütün kaslar için ortak.`,
      action: 'plan',
    }));

  // 3. Gerileyen hareketler. Durgunluktan daha acil: geriye gidiş genellikle
  //    toparlanma sorununun ilk görünen belirtisi.
  (sources.plateaus?.items || [])
    .filter(p => p.status === 'regressing')
    .forEach(p => ekle({
      key: `regress-${p.name}`,
      area: 'İlerleme',
      muscle: p.muscle,
      impact: 'high',
      confidence: p.sessions >= 6 ? 'high' : 'medium',
      title: `${p.name} geriliyor`,
      detail: `En iyi değerinin %${p.dropPercent} altında, ${p.sessions} seans ölçüldü. ${p.advice?.[0]?.detail || ''}`,
      action: 'progress',
    }));

  // 4. Sıklık: hacim yeterli ama tek güne yığılmış.
  (sources.frequency?.concentrated || []).forEach(r => ekle({
    key: `freq-${r.muscle}`,
    area: 'Sıklık',
    muscle: r.muscle,
    impact: 'medium',
    confidence: 'high',
    title: `${r.muscle} haftada tek gün`,
    detail: `${r.volume} setin tamamı bir güne yığılmış. Hacim yeterli ama protein sentezi yanıtı yaklaşık iki günde sönüyor; aynı hacmi ikiye bölmek toplamı hiç artırmadan daha iyi sonuç veriyor.`,
    action: 'plan',
  }));

  // 5. Kuvvet dengesizliği: sakatlık riski ve uzun vadeli tıkanma.
  (sources.balance?.imbalances || []).forEach(b => ekle({
    key: `balance-${b.key || b.label}`,
    area: 'Denge',
    impact: 'medium',
    confidence: b.confidence === 'low' ? 'low' : 'medium',
    title: b.title || `${b.label} dengesizliği`,
    detail: b.detail || b.hint || '',
    action: 'analysis',
  }));

  // 6. Durgunluk (gerileme değil): orta etki, çıkışı bilinen bir durum.
  (sources.plateaus?.items || [])
    .filter(p => p.status === 'stalling')
    .forEach(p => ekle({
      key: `stall-${p.name}`,
      area: 'İlerleme',
      muscle: p.muscle,
      impact: 'medium',
      confidence: p.sessions >= 6 ? 'high' : 'medium',
      title: `${p.name} ${p.sessionsSinceBest} seanstır ilerlemiyor`,
      detail: p.advice?.[0]?.detail || '',
      action: 'progress',
    }));

  // 7. Hareket seçimi: en düşük etki çünkü hacim ve sıklık doğruyken bile
  //    kazancı görece küçük — ama en ucuz düzeltme.
  (sources.selection?.findings || []).forEach(f => {
    const ilk = f.issues?.[0];
    if (!ilk) return;
    ekle({
      key: `selection-${f.muscle}-${ilk.key}`,
      area: 'Seçim',
      muscle: f.muscle,
      impact: ilk.severity === 'high' ? 'medium' : 'low',
      confidence: 'medium',
      title: `${f.muscle}: ${ilk.title}`,
      detail: ilk.detail || '',
      action: 'plan',
    });
  });

  // 8. Kuvvet standartlarında en geride kalan hareket.
  const enGeri = (sources.standards?.rows || [])
    .filter(r => parseNumber(r?.index) >= 0 || r?.index === -1)
    .sort((a, b) => parseNumber(a.index) - parseNumber(b.index))[0];
  if (enGeri?.exercise) {
    ekle({
      key: `standard-${enGeri.exercise}`,
      area: 'Standart',
      impact: 'low',
      confidence: 'medium',
      title: `${enGeri.exercise} standartlarda en geride`,
      detail: `Diğer ana hareketlerine göre en düşük konumda. Bu bir kusur değil bir tercih göstergesi olabilir; ama bilinçli bir tercih değilse dengeyi buradan kurmak en çok kazandıran yer.`,
      action: 'analysis',
    });
  }

  const sirali = bulgular.sort((a, b) => b.rank - a.rank);

  return {
    items: sirali.slice(0, limit),
    total: sirali.length,
    hasData: sirali.length > 0,
    // Alan bazında dağılım: sorunun nerede yoğunlaştığı.
    byArea: [...sirali.reduce((m, x) => m.set(x.area, (m.get(x.area) || 0) + 1), new Map())]
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count),
    primary: sirali[0] || null,
  };
};

/** Koç kartı: yalnızca en yüksek etkili tek bulgu. */
export const weakLinkCoachItem = (report) => {
  if (!report?.primary) return null;
  const p = report.primary;
  // Düşük etkili bir bulgu için koçta yer açmak, gerçekten acil olanların
  // görünürlüğünü azaltırdı.
  if (p.impact === 'low') return null;
  return {
    key: 'weak-link',
    tone: p.impact === 'high' ? 'warn' : 'info',
    // Kas adı maddeye ekleniyor: karar defteri "hangi kasın hacmi" sorusunu
    // maddenin başlığından çıkaramaz ve kassız bir kayıt ölçülemez.
    muscle: p.muscle || null,
    title: `Zayıf halka: ${p.title}`,
    detail: `${p.detail} ${report.total > 1 ? `Toplam ${report.total} bulgu var; bu listenin en üstündeki.` : ''}`,
    action: p.action,
  };
};
