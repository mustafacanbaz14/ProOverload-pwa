import { parseNumber } from './number.js';
import { isCompletedWorkingSet } from './helpers.js';
import { formatDay } from './dates.js';

/**
 * Sessiz sinyaller: kural yazılmamış değişimler.
 *
 * Uygulamadaki bütün uyarılar KURAL tabanlı: birinin oturup "hacim MEV altına
 * düşerse uyar", "tahmini 1RM üç seans ilerlemezse uyar" diye yazması gerekti.
 * Bu iyi çalışıyor ama kaçınılmaz bir kör noktası var — yalnızca önceden
 * düşünülmüş şeyleri yakalıyor. Set başına ortalama tekrarın iki haftada
 * belirgin biçimde düşmesi hiçbir kuralı tetiklemiyor, çünkü kimse o kuralı
 * yazmadı; oysa ağırlık aynıyken tekrarın düşmesi çoğu zaman ilk sinyal.
 *
 * Bu modül kural yazmıyor: DEĞİŞİM arıyor. Her seriye aynı soruyu soruyor —
 * son ölçümler, kendi geçmişinin normal dalgalanmasına göre sıra dışı mı.
 *
 * Ortalama ve standart sapma yerine ORTANCA ve MAD kullanılıyor. Sebebi şu:
 * bir tek rekor seansı ya da hasta geçirilen bir hafta, ortalamayı da sapmayı
 * da birlikte şişiriyor ve gerçek bir değişimi normal görünür kılıyor.
 * Ortanca o tek noktadan etkilenmiyor.
 *
 * Modül TEŞHİS KOYMUYOR. "Tekrar sayın düştü" der, "aşırı antrenmandasın"
 * demez — aynı düşüşü yeni bir programa geçmek de, ağırlık artırmak da
 * üretir ve bunlardan ikincisi iyi haberdir. Söylediği şey yalnızca:
 * buraya bak, burada bir şey değişti.
 */

// Bu sayıdan az noktası olan seride "normal" diye bir şey tanımlanamıyor.
const MIN_POINTS = 9;
// Son kaç nokta "şu an" sayılıyor.
const RECENT_POINTS = 3;
// Kaç MAD uzaklıktan itibaren sıra dışı.
const Z_THRESHOLD = 2;
// Yüzde olarak en küçük anlamlı değişim. İstatistiksel olarak sıra dışı ama
// pratikte %3'lük bir kayma, bildirilmeye değmez.
const MIN_CHANGE_PCT = 8;
// Taban hiç oynamıyorsa (MAD = 0) yalnızca yüzdeye bakılıyor ve eşik yükseliyor.
const FLAT_BASELINE_PCT = 15;

const ortanca = (dizi) => {
  if (dizi.length === 0) return 0;
  const s = [...dizi].sort((a, b) => a - b);
  const o = Math.floor(s.length / 2);
  return s.length % 2 ? s[o] : (s[o - 1] + s[o]) / 2;
};

const mad = (dizi) => {
  if (dizi.length === 0) return 0;
  const m = ortanca(dizi);
  return ortanca(dizi.map(x => Math.abs(x - m)));
};

/** Tek serinin değerlendirmesi. */
export const scanSeries = (series, { recent = RECENT_POINTS } = {}) => {
  const noktalar = (series?.points || [])
    .filter(p => p && Number.isFinite(parseNumber(p.value)))
    .map(p => ({ date: p.date, value: parseNumber(p.value) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (noktalar.length < MIN_POINTS) {
    return { ...series, enough: false, points: noktalar.length, anomaly: false };
  }

  const son = noktalar.slice(-recent);
  const taban = noktalar.slice(0, -recent);
  const tabanOrtanca = ortanca(taban.map(p => p.value));
  const sonOrtanca = ortanca(son.map(p => p.value));
  const yayilim = mad(taban.map(p => p.value));

  if (tabanOrtanca === 0) return { ...series, enough: true, points: noktalar.length, anomaly: false };

  const degisimYuzde = ((sonOrtanca - tabanOrtanca) / Math.abs(tabanOrtanca)) * 100;
  // 1.4826, MAD'ı normal dağılımda standart sapmayla aynı ölçeğe getiren sabit.
  const olcek = yayilim * 1.4826;
  const z = olcek > 0 ? (sonOrtanca - tabanOrtanca) / olcek : 0;

  const duzTaban = olcek === 0;
  const anomali = duzTaban
    ? Math.abs(degisimYuzde) >= FLAT_BASELINE_PCT
    : Math.abs(z) >= Z_THRESHOLD && Math.abs(degisimYuzde) >= MIN_CHANGE_PCT;

  const yon = sonOrtanca > tabanOrtanca ? 'up' : 'down';
  const iyi = series.higherIsBetter === undefined
    ? null
    : (yon === 'up') === Boolean(series.higherIsBetter);

  return {
    ...series,
    enough: true,
    points: noktalar.length,
    baseline: Math.round(tabanOrtanca * 100) / 100,
    current: Math.round(sonOrtanca * 100) / 100,
    changePct: Math.round(degisimYuzde * 10) / 10,
    z: Math.round(z * 100) / 100,
    flatBaseline: duzTaban,
    anomaly: anomali,
    direction: yon,
    favorable: iyi,
    severity: Math.abs(z) >= 3 || Math.abs(degisimYuzde) >= 25 ? 'high' : 'medium',
    since: son[0]?.date || '',
    window: recent,
  };
};

/** Uygulama verisinden standart seri kümesi. */
export const buildAnomalySeries = ({
  workouts = [], metrics = [], sleepScores = {}, restingHrLog = [], resolveLoad = null,
} = {}) => {
  const sirali = [...(workouts || [])]
    .filter(w => w?.date && (w.exercises || []).length > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const tekrar = [];
  const setSayisi = [];
  const rir = [];
  const tonaj = [];
  const sure = [];
  const yukPerTekrar = [];

  sirali.forEach(w => {
    const setler = [];
    let agirlikToplam = 0;
    let tonajToplam = 0;
    (w.exercises || []).forEach(ex => {
      (ex.sets || []).filter(isCompletedWorkingSet).forEach(s => {
        const yuk = parseNumber(resolveLoad ? resolveLoad(ex.name, s.weight, w) : s.weight);
        const t = parseNumber(s.reps);
        setler.push({ reps: t, rir: parseNumber(s.rir), weight: yuk });
        agirlikToplam += yuk;
        tonajToplam += yuk * t;
      });
    });
    if (setler.length === 0) return;
    tekrar.push({ date: w.date, value: setler.reduce((t, s) => t + s.reps, 0) / setler.length });
    setSayisi.push({ date: w.date, value: setler.length });
    rir.push({ date: w.date, value: setler.reduce((t, s) => t + s.rir, 0) / setler.length });
    tonaj.push({ date: w.date, value: tonajToplam });
    if (agirlikToplam > 0) yukPerTekrar.push({ date: w.date, value: agirlikToplam / setler.length });
    if (parseNumber(w.duration) > 0) sure.push({ date: w.date, value: parseNumber(w.duration) });
  });

  return [
    { key: 'reps', label: 'Set başına ortalama tekrar', unit: '', higherIsBetter: true, points: tekrar,
      note: 'Ağırlık sabitken tekrarın düşmesi çoğu zaman toparlanmanın ilk görünen belirtisi; ama ağırlığı artırdıysan da düşer.' },
    { key: 'load', label: 'Set başına ortalama yük', unit: ' kg', higherIsBetter: true, points: yukPerTekrar,
      note: 'Hareket karışımı değiştiyse bu seri de değişir; tek başına ilerleme ölçüsü değil.' },
    { key: 'sets', label: 'Seans başına set', unit: ' set', higherIsBetter: true, points: setSayisi,
      note: 'Program değişikliği ya da zaman kısıtı; ikisi de aynı düşüşü üretiyor.' },
    { key: 'rir', label: 'Ortalama RIR', unit: '', higherIsBetter: false, points: rir,
      note: 'RIR yükseldiyse setler yetmezliğe uzak kalıyor demek.' },
    { key: 'tonnage', label: 'Seans tonajı', unit: ' kg', higherIsBetter: true, points: tonaj,
      note: 'Bacak günüyle kol gününün tonajı zaten farklı; bu seri yalnızca genel eğilim için.' },
    { key: 'duration', label: 'Seans süresi', unit: ' dk', higherIsBetter: null, points: sure,
      note: 'Sürenin uzaması dinlenmelerin uzadığına, kısalması seansın sıkıştırıldığına işaret edebilir.' },
    { key: 'bodyWeight', label: 'Vücut ağırlığı', unit: ' kg', higherIsBetter: null,
      points: (metrics || []).filter(m => parseNumber(m.weight) > 0).map(m => ({ date: m.date, value: parseNumber(m.weight) })),
      note: 'Hızlı bir kayma su dengesi de olabilir; iki haftadan uzun sürerse gerçek.' },
    { key: 'sleep', label: 'Uyku puanı', unit: '/100', higherIsBetter: true,
      points: Object.entries(sleepScores || {}).map(([date, value]) => ({ date, value: parseNumber(value) })),
      note: 'Uyku puanındaki kayma, birkaç hafta sonra performansta görünüyor.' },
    { key: 'restingHr', label: 'Dinlenme nabzı', unit: ' bpm', higherIsBetter: false,
      points: (restingHrLog || []).map(r => ({ date: r.date, value: parseNumber(r.bpm) })),
      note: 'Yükselen dinlenme nabzı toparlanma borcunun ölçülen (bildirilen değil) göstergesi.' },
  ].filter(s => (s.points || []).length > 0);
};

export const buildAnomalyWatch = (sources = {}, { recent = RECENT_POINTS } = {}) => {
  const seriler = buildAnomalySeries(sources).map(s => scanSeries(s, { recent }));
  const bulgular = seriler
    .filter(s => s.anomaly)
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z));

  return {
    hasData: seriler.some(s => s.enough),
    checked: seriler.filter(s => s.enough).length,
    pending: seriler.filter(s => !s.enough),
    series: seriler,
    findings: bulgular,
    top: bulgular[0] || null,
    // Hiçbir şey bulunmadıysa bu da bir bilgi: seriler sessiz demek, sistem
    // bozuk demek değil.
    quiet: bulgular.length === 0,
  };
};

export const describeFinding = (f) => {
  if (!f) return '';
  const yon = f.direction === 'up' ? 'yükseldi' : 'düştü';
  const nitelik = f.favorable === null ? '' : f.favorable ? ' (olumlu yönde)' : ' (dikkat isteyen yönde)';
  return `${f.label} son ${f.window} ölçümde ${f.baseline}${f.unit} → ${f.current}${f.unit} ${yon}`
    + ` (%${Math.abs(f.changePct)})${nitelik}. ${f.since ? `Değişim ${formatDay(f.since)} tarihinden itibaren.` : ''}`;
};

/** Koç kartı: yalnızca yüksek şiddetli ve olumsuz yöndeki tek bulgu. */
export const anomalyCoachItem = (report) => {
  const f = (report?.findings || []).find(x => x.severity === 'high' && x.favorable === false);
  if (!f) return null;
  return {
    key: 'anomaly',
    tone: 'warn',
    title: `${f.label} beklenenin dışına çıktı`,
    detail: `${describeFinding(f)} ${f.note} Bu bir teşhis değil; yalnızca kendi geçmişine göre sıra dışı olduğu için işaretlendi.`,
  };
};
