// --- KİLİT EKRANI CANLI ANTRENMAN KARTI ---
//
// iOS'ta bir PWA gerçek Live Activity (ActivityKit / WidgetKit) oluşturamaz;
// bunlar yalnızca native uygulamalara açıktır. Web'de kilit ekranına bilgi
// düşürmenin çalışan tek yolu Media Session API'sinin "Şu An Çalınan" kartıdır.
//
// Nasıl çalışıyor:
//  - Duyulamayacak kadar düşük genlikli bir ses döngüsü çalınır (tam sessizlikte
//    iOS kartı göstermiyor). Ses çalarken kilit ekranında medya kartı belirir.
//  - Başlık / alt satır / albüm alanları hareket ve geçmiş set bilgisiyle doldurulur.
//  - Kapak görseli canvas'ta çizilir; metin alanlarına sığmayan detaylar (geçen
//    antrenmanın tüm setleri, etkili set sayısı) buraya yazılır.
//  - Geçen süre setPositionState ile bildirilir. iOS bu değeri kendi saatinden
//    ilerlettiği için ekran kapalıyken JavaScript dursa bile sayaç akmaya devam eder.
//  - Kilit ekranındaki oynat/duraklat düğmeleri antrenman kronometresine bağlanır.

const MAX_SESSION_SECONDS = 6 * 60 * 60; // Kaydırıcı için üst sınır (6 saat)

let audioEl = null;
let audioSrcUrl = null;
let artworkUrl = null;
let isActive = false;
// Kartı biz mi durdurduk yoksa başka bir uygulama mı ses odağını aldı?
// `pause` olayı iki durumda da geliyor; ayırt etmek için kendi duraklatmamızı
// işaretliyoruz.
let stoppingOurselves = false;
// Müzik yüzünden teslim edildi mi. Teslimden sonra kart YENİDEN BAŞLATILMIYOR;
// başlatmak müziği tekrar kesmek demek olurdu.
let yielded = false;
let onYieldCallback = null;
// Kapak görseli asenkron üretildiği için art arda gelen güncellemeler yarışabilir.
// Bu sayaç, geç tamamlanan eski bir çağrının yeni veriyi ezmesini engeller.
let updateSequence = 0;

// --- Sessize yakın WAV döngüsü (harici dosya gerektirmez) ---

const writeAscii = (view, offset, text) => {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
};

const createQuietLoopUrl = () => {
  const sampleRate = 8000;
  const numSamples = sampleRate; // 1 saniyelik döngü
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);   // PCM
  view.setUint16(22, 1, true);   // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // 20 Hz'lik, genliği 1/32768 olan bir dalga: hem duyulmaz hem de teknik olarak
  // "sessiz" sayılmadığı için iOS medya oturumunu canlı tutar.
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, Math.floor(i / 200) % 2 === 0 ? 1 : -1, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
};

// --- Kapak görseli ---

const wrapText = (ctx, text, maxWidth) => {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
};

export const formatDuration = (totalSeconds) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const drawArtwork = ({
  elapsedSeconds,
  exerciseName,
  previousSets,
  previousDate,
  effectiveSets,
  isPaused,
  restSecondsLeft,
  restTotalSeconds,
  exerciseIndex = 1,
  totalExercises = 1,
  completedSetsCount = 0,
  totalSetsCount = 0,
  targetText = '',
  supersetName = '',
}) => {
  const SIZE = 512;
  const PAD = 32;
  const W = SIZE - PAD * 2;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  const isResting = Number(restSecondsLeft) > 0;

  // Zemin
  ctx.fillStyle = '#080806';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.textBaseline = 'top';

  // Yardımcılar
  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  const label = (text, x, y, color = '#52525b', size = 15) => {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(text, x, y);
  };

  // ---------- ÜST ŞERİT: durum + ilerleme ----------
  // Dinlenmedeyken renk kodu değişir; kilide bakan biri tek bakışta
  // "çalışıyor mu, dinleniyor mu" ayırt edebilsin.
  const accent = isResting ? '#d8b66b' : isPaused ? '#8e8677' : '#34d399';
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, SIZE, 5);

  label(isPaused ? 'DURAKLATILDI' : isResting ? 'DİNLENME' : 'ÇALIŞMA', PAD, 24, accent, 16);

  ctx.textAlign = 'right';
  label(`${exerciseIndex}/${totalExercises} HAREKET · ${effectiveSets} SET`, SIZE - PAD, 24, '#52525b', 15);
  ctx.textAlign = 'left';

  // ---------- ANA SAYAÇ ----------
  // Dinlenmedeyken kalan süre öne çıkar; asıl merak edilen o.
  let y = 52;
  const mainSeconds = isResting ? restSecondsLeft : elapsedSeconds;
  ctx.fillStyle = isResting ? '#ecfeff' : isPaused ? '#a1a1aa' : '#fafafa';
  ctx.font = 'bold 92px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(formatDuration(mainSeconds), PAD, y);

  ctx.textAlign = 'right';
  if (isResting) {
    label('KALAN', SIZE - PAD, y + 24, '#67e8f9', 16);
    label(`SEANS ${Math.floor(elapsedSeconds / 60)} DK`, SIZE - PAD, y + 46, '#3f3f46', 14);
  } else {
    label('TOPLAM SÜRE', SIZE - PAD, y + 24, '#52525b', 16);
  }
  ctx.textAlign = 'left';

  y += 108;

  // ---------- DİNLENME İLERLEME ÇUBUĞU ----------
  if (isResting && restTotalSeconds > 0) {
    const ratio = Math.max(0, Math.min(1, restSecondsLeft / restTotalSeconds));
    ctx.fillStyle = '#18181b';
    roundRect(PAD, y, W, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#d8b66b';
    roundRect(PAD, y, Math.max(12, W * ratio), 12, 6);
    ctx.fill();
    y += 30;
  } else {
    y += 6;
  }

  // ---------- MEVCUT HAREKET ----------
  const cardH = supersetName ? 118 : 96;
  ctx.fillStyle = '#18181b';
  roundRect(PAD, y, W, cardH, 14);
  ctx.fill();
  ctx.fillStyle = accent;
  roundRect(PAD, y, 5, cardH, 3);
  ctx.fill();

  const innerX = PAD + 20;
  label(`SET ${completedSetsCount + 1}/${Math.max(completedSetsCount + 1, totalSetsCount)}`, innerX, y + 14, '#52525b', 14);

  ctx.fillStyle = '#fafafa';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  const nameLines = wrapText(ctx, exerciseName || 'Hareket seçilmedi', W - 40).slice(0, 1);
  ctx.fillText(nameLines[0] || '', innerX, y + 36);

  if (targetText) {
    label(`HEDEF: ${targetText}`, innerX, y + 70, '#34d399', 17);
  }
  if (supersetName) {
    label(`SÜPERSET → ${supersetName}`, innerX, y + (targetText ? 92 : 70), '#c084fc', 15);
  }

  y += cardH + 18;

  // ---------- GEÇEN ANTRENMAN ----------
  label(previousDate ? `GEÇEN ANTRENMAN · ${previousDate}` : 'GEÇEN ANTRENMAN', PAD, y, '#52525b', 15);
  y += 26;

  const sets = Array.isArray(previousSets) ? previousSets : [];
  if (sets.length === 0) {
    label('Bu hareket için geçmiş kayıt yok', PAD, y, '#3f3f46', 18);
  } else {
    // Setler yan yana kutularda: dikey listeden daha az yer kaplar ve
    // kilit ekranındaki küçük görselde daha okunaklı olur.
    const maxCols = 4;
    const shown = sets.slice(0, maxCols);
    const gap = 10;
    const boxW = (W - gap * (shown.length - 1)) / shown.length;

    shown.forEach((set, i) => {
      const x = PAD + i * (boxW + gap);
      ctx.fillStyle = '#18181b';
      roundRect(x, y, boxW, 74, 12);
      ctx.fill();

      ctx.textAlign = 'center';
      const cx = x + boxW / 2;

      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 26px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(`${set.weight || 0}`, cx, y + 12);

      ctx.fillStyle = '#71717a';
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillText(`× ${set.reps || 0}`, cx, y + 42);

      ctx.fillStyle = '#3f3f46';
      ctx.font = '13px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.fillText(`RIR ${set.rir ?? '-'}`, cx, y + 58);
      ctx.textAlign = 'left';
    });
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : null), 'image/png');
  });
};

// --- Genel API ---

export const isLockScreenSupported = () =>
  typeof navigator !== 'undefined' && 'mediaSession' in navigator;

/** Kart müzik yüzünden teslim edildi mi. */
export const isLockScreenYielded = () => yielded;

/** Kart şu anda çalışıyor mu. */
export const isLockScreenRunning = () => isActive;

/**
 * Kilit ekranı kartını başlatır. iOS ses çalmayı kullanıcı hareketine bağladığı
 * için bu fonksiyon mutlaka bir tıklama/dokunma akışı içinden çağrılmalıdır.
 *
 * MÜZİKLE ÇAKIŞMA. Kart, duyulmaz bir ses döngüsü çalarak var oluyor ve bir
 * cihazda aynı anda tek bir "Şu An Çalınan" oturumu olabiliyor. Bu yüzden kart
 * ile kullanıcının müziği aynı anda yaşayamıyor: kart başlarsa müzik susuyor,
 * müzik başlarsa işletim sistemi bizim sesimizi duraklatıp kartı düşürüyor.
 * Bu, tekniğin kendisinden gelen bir sınır, düzeltilebilecek bir hata değil.
 *
 * Düzeltilebilecek olan DAVRANIŞ: eskiden çakışma sessizce oluyordu ve
 * uygulama direniyordu. Artık müzik odağı aldığında kart teslim ediliyor,
 * kendiliğinden geri gelmeye çalışmıyor ve durum `onYield` ile bildiriliyor.
 */
export const startLockScreenActivity = async ({ onPause, onResume, onYield } = {}) => {
  if (!isLockScreenSupported()) return false;

  try {
    if (!audioEl) {
      audioSrcUrl = createQuietLoopUrl();
      audioEl = new Audio(audioSrcUrl);
      audioEl.loop = true;
      audioEl.volume = 1;      // kaynak zaten duyulmaz seviyede
      audioEl.preload = 'auto';
      audioEl.setAttribute('playsinline', '');

      // Ses odağını başka bir uygulama aldığında tarayıcı bu olayı gönderiyor.
      // Direnmek (yeniden play çağırmak) müziği tekrar keserdi; teslim ediyoruz.
      audioEl.addEventListener('pause', () => {
        if (stoppingOurselves || !isActive) return;
        isActive = false;
        yielded = true;
        try {
          navigator.mediaSession.metadata = null;
          navigator.mediaSession.playbackState = 'none';
        } catch { /* yoksay */ }
        try { onYieldCallback?.(); } catch { /* yoksay */ }
      });
    }

    onYieldCallback = onYield || null;
    yielded = false;
    await audioEl.play();
    isActive = true;

    navigator.mediaSession.playbackState = 'playing';

    // Kilit ekranındaki oynat/duraklat kronometreyi yönetir.
    if (onPause) navigator.mediaSession.setActionHandler('pause', () => onPause());
    if (onResume) navigator.mediaSession.setActionHandler('play', () => onResume());
    // Kartın ileri/geri sarma düğmeleri anlamsız olduğu için kapatılır.
    ['previoustrack', 'nexttrack', 'seekbackward', 'seekforward', 'seekto'].forEach((action) => {
      try { navigator.mediaSession.setActionHandler(action, null); } catch { /* desteklenmiyor */ }
    });

    return true;
  } catch {
    // Otomatik oynatma engellendi (kullanıcı hareketi dışında çağrılmış olabilir).
    isActive = false;
    return false;
  }
};

/**
 * Karttaki bilgileri günceller. Ekran kapalıyken JavaScript askıya alındığı için
 * en kritik çağrı, uygulama arka plana geçmeden hemen önce yapılandır.
 */
export const updateLockScreenActivity = async ({
  elapsedSeconds = 0,
  exerciseName = '',
  previousSets = [],
  previousDate = '',
  effectiveSets = 0,
  isPaused = false,
  restSecondsLeft = 0,
  restTotalSeconds = 0,
  exerciseIndex = 1,
  totalExercises = 1,
  completedSetsCount = 0,
  totalSetsCount = 0,
  targetText = '',
  supersetName = '',
}) => {
  if (!isLockScreenSupported() || !isActive) return;

  const mySequence = ++updateSequence;
  const isResting = restSecondsLeft > 0 && restTotalSeconds > 0;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  const summary = previousSets.length > 0
    ? previousSets.slice(0, 3).map((s) => `${s.weight || 0}×${s.reps || 0} (RIR ${s.rir ?? '-'})`).join('  ')
    : 'Geçmiş kayıt yok';

  const nextArtwork = await drawArtwork({
    elapsedSeconds,
    exerciseName,
    previousSets,
    previousDate,
    effectiveSets,
    isPaused,
    restSecondsLeft,
    restTotalSeconds,
    exerciseIndex,
    totalExercises,
    completedSetsCount,
    totalSetsCount,
    targetText,
    supersetName,
  });

  // Bu çağrı beklerken daha yenisi başladıysa sonucu at, aksi halde eski veriyi yazardık.
  if (mySequence !== updateSequence || !isActive) {
    if (nextArtwork) URL.revokeObjectURL(nextArtwork);
    return;
  }

  const setProgressStr = `Set ${completedSetsCount + 1}/${Math.max(completedSetsCount + 1, totalSetsCount)}`;
  const exProgressStr = `${exerciseIndex}/${totalExercises}. Hareket`;
  const timeStr = `${elapsedMinutes} Dk (${formatDuration(elapsedSeconds)})`;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: isResting
        ? `⏱️ Dinlenme: ${formatDuration(restSecondsLeft)} (${restSecondsLeft}s) · ${exerciseName || 'Antrenman'}`
        : `🏋️ ${exerciseName || 'Antrenman'} (${setProgressStr})`,
      artist: isResting
        ? `🏋️ ${exerciseName || 'Mevcut Hareket'} (${exProgressStr} · ${setProgressStr})`
        : `⏱️ Toplam Antrenman Süresi: ${timeStr} · ${exProgressStr}`,
      album: `⏱️ Antrenman Süresi: ${timeStr} · ${effectiveSets} Etkili Set · Geçen: ${summary}`,
      artwork: nextArtwork
        ? [{ src: nextArtwork, sizes: '512x512', type: 'image/png' }]
        : [],
    });

    navigator.mediaSession.playbackState = isPaused ? 'paused' : 'playing';

    // iOS konum durumunu kendi saatinden ilerletir; ekran kapalıyken JavaScript
    // dursa bile burada bildirilen sayaç akmaya devam eder. Set arasındayken
    // kullanıcıyı ilgilendiren asıl sayaç dinlenme olduğu için ona geçilir.
    if (navigator.mediaSession.setPositionState) {
      navigator.mediaSession.setPositionState(
        isResting
          ? {
            duration: restTotalSeconds,
            position: Math.min(Math.max(0, restTotalSeconds - restSecondsLeft), restTotalSeconds),
            playbackRate: 1,
          }
          : {
            duration: MAX_SESSION_SECONDS,
            position: Math.min(Math.max(0, elapsedSeconds), MAX_SESSION_SECONDS),
            playbackRate: isPaused ? 0.0001 : 1, // 0 kabul edilmiyor
          }
      );
    }
  } catch { /* metadata desteklenmiyor olabilir */ }

  // Önceki kapak görselini serbest bırak
  if (artworkUrl && artworkUrl !== nextArtwork) URL.revokeObjectURL(artworkUrl);
  artworkUrl = nextArtwork;
};

export const stopLockScreenActivity = () => {
  isActive = false;
  yielded = false;
  onYieldCallback = null;
  updateSequence++; // uçuşta olan güncellemeleri geçersiz kıl

  if (audioEl) {
    // Kendi duraklatmamız teslim sayılmamalı; dinleyici bu bayrağa bakıyor.
    stoppingOurselves = true;
    audioEl.pause();
    audioEl.currentTime = 0;
    stoppingOurselves = false;
  }

  if (isLockScreenSupported()) {
    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      ['play', 'pause'].forEach((action) => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch { /* yoksay */ }
      });
    } catch { /* yoksay */ }
  }

  if (artworkUrl) {
    URL.revokeObjectURL(artworkUrl);
    artworkUrl = null;
  }
};

// --- Dinlenme bitiş uyarısı ---
//
// MÜZİK ÜSTÜNDE DUYULMASI. Eski uyarı 880 Hz'de iki kısa bipti ve müzik
// çalarken pratikte kayboluyordu: tek frekanslı kısa bir sinüs, müziğin
// spektrumunun içinde eriyor.
//
// Üç şey değişti:
//
//  1. TINI. Tek sinüs yerine yükselen üç notalı bir dizi ve her notada temel
//     frekansın üstüne bir üst harmonik ekleniyor. Geniş spektrumlu ve
//     yükselen bir ses, sabit bir bipten çok daha zor gözden kaçıyor.
//  2. SÜRE VE TEKRAR. Dizi bir kez değil, seçilen şiddete göre birkaç kez
//     çalıyor. Müzikte bir cümlenin ortasına denk gelen tek bip kaçıyor;
//     aralıklı tekrar kaçmıyor.
//  3. SES SEVİYESİ. Kazanç belirgin biçimde yükseltildi ve kırpılmayı
//     önlemek için bir kompresör eklendi — kırpılan ses hem çirkin hem de
//     paradoksal olarak daha az fark ediliyor.
//
// AudioContext kullanılıyor, <audio> elementi değil: AudioContext çoğu
// platformda müzikle KARIŞIYOR, ses odağını almıyor. Yani uyarı müziği
// durdurmuyor, üstüne biniyor.

export const REST_ALERT_INTENSITIES = [
  {
    key: 'soft', label: 'Hafif', repeats: 1, gain: 0.35, gap: 0,
    hint: 'Tek dizi, düşük ses. Sessiz ortamda yeterli.',
  },
  {
    key: 'strong', label: 'Belirgin', repeats: 2, gain: 0.85, gap: 0.9,
    hint: 'İki dizi, yüksek ses. Müzik dinlerken de duyulur.',
  },
  {
    key: 'insistent', label: 'Israrcı', repeats: 4, gain: 1.0, gap: 1.1,
    hint: 'Dört dizi, en yüksek ses. Telefon cepteyken ve müzik açıkken bile kaçmaz.',
  },
];

/** Aynı uyarının üç farklı tınısı; ses yüksekliğinden bağımsız seçilir. */
export const REST_ALERT_TONES = [
  { key: 'ascending', label: 'Yükselen', hint: 'Üç notalı, müzik içinde kolay ayırt edilen varsayılan uyarı.' },
  { key: 'digital', label: 'Dijital', hint: 'Kısa ve keskin kare dalga; gürültülü salon için.' },
  { key: 'bell', label: 'Zil', hint: 'Daha yumuşak, iki notalı zil benzeri uyarı.' },
];

export const findRestAlertIntensity = (key) =>
  REST_ALERT_INTENSITIES.find(i => i.key === key) || REST_ALERT_INTENSITIES[1];

const ALERT_TONE_PROFILES = {
  ascending: { notes: [880, 1108.73, 1318.51], type: 'triangle', gap: 0.13, duration: 0.26 },
  digital: { notes: [1046.5, 1318.51, 1046.5], type: 'square', gap: 0.11, duration: 0.2 },
  bell: { notes: [783.99, 1174.66], type: 'sine', gap: 0.18, duration: 0.42 },
};

let alertCtx = null;
let alertPrimed = false;
let alertLastError = '';
let scheduledAlertTarget = 0;
let scheduledAlertNodes = [];
let alertScheduleSequence = 0;

const alertToneOf = (key) => ALERT_TONE_PROFILES[key] || ALERT_TONE_PROFILES.ascending;

/** AudioContext'i bir kez kurar; askıya alınmışsa UYANMASINI BEKLER. */
const ensureContext = async () => {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!alertCtx || alertCtx.state === 'closed') alertCtx = new Ctx();
  // Eski kod `resume()` Promise'ini beklemeden notaları zamanlıyordu. Özellikle
  // iOS arka plandan dönerken context hâlâ suspended kaldığı için çağrı başarılı
  // görünmesine rağmen ses çıkmıyordu.
  if (alertCtx.state === 'suspended' || alertCtx.state === 'interrupted') {
    try { await alertCtx.resume(); } catch (error) {
      alertLastError = error?.message || 'Ses motoru uyandırılamadı.';
    }
  }
  return alertCtx;
};

/**
 * Sessiz bir ses çalarak ses motorunu kullanıcı hareketiyle açar.
 *
 * iOS AudioContext'i yalnızca bir kullanıcı hareketi içinde başlatıyor.
 * Antrenman başlatılırken bir kez çağrılıyor; sonra dinlenme bittiğinde
 * (kullanıcı hareketi olmadan) ses çalınabiliyor.
 */
export const primeRestAlert = async () => {
  const ctx = await ensureContext();
  if (!ctx) return false;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);
    alertPrimed = ctx.state === 'running';
    alertLastError = alertPrimed ? '' : `Ses motoru ${ctx.state} durumunda.`;
    return alertPrimed;
  } catch (error) {
    alertLastError = error?.message || 'Ses motoru hazırlanamadı.';
    return false;
  }
};

/** Tek bir yükselen dizi çalar. */
const playSequence = (ctx, startAt, gainLevel, toneKey = 'ascending', collector = null, short = false) => {
  const profile = alertToneOf(toneKey);
  // Kompresör: üst üste binen notalar kırpılmasın, algılanan ses yüksek kalsın.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 8;
  comp.connect(ctx.destination);

  const notes = short ? profile.notes.slice(0, 1) : profile.notes;
  notes.forEach((freq, i) => {
    const t = startAt + i * profile.gap;
    // Temel + bir oktav üstü: geniş spektrum, müziğin içinde kaybolmuyor.
    [[freq, 1], [freq * 2, 0.45]].forEach(([f, oran]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      // Kare dalgaya yakın bir tını daha delici; sinüs müzikte eriyor.
      osc.type = f === freq ? profile.type : 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.001, gainLevel * oran), t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + profile.duration);
      osc.connect(g).connect(comp);
      osc.start(t);
      osc.stop(t + profile.duration + 0.02);
      if (collector) {
        collector.push(osc);
        osc.addEventListener('ended', () => {
          const index = collector.indexOf(osc);
          if (index >= 0) collector.splice(index, 1);
          if (collector === scheduledAlertNodes && collector.length === 0) scheduledAlertTarget = 0;
        }, { once: true });
      }
    });
  });
};

/** Zamanlanmış uyarıyı süre değişince/durdurulunca iptal eder. */
export const cancelScheduledRestAlert = () => {
  alertScheduleSequence += 1;
  [...scheduledAlertNodes].forEach(node => { try { node.stop(); } catch { /* zaten bitmiş olabilir */ } });
  scheduledAlertNodes = [];
  scheduledAlertTarget = 0;
};

/**
 * Uyarıyı sayaç BAŞLARKEN ses donanımının saatine yazar. JavaScript arka
 * planda yavaşlatılsa bile AudioContext çalışıyorsa uyarı doğru anda çalar.
 */
export const scheduleRestAlert = async (delaySeconds, {
  intensityKey = 'strong', toneKey = 'ascending', volume = 1, preAlertSeconds = 0,
} = {}) => {
  cancelScheduledRestAlert();
  const mySequence = alertScheduleSequence;
  const ctx = await ensureContext();
  if (mySequence !== alertScheduleSequence) return { ok: false, state: 'cancelled' };
  if (!ctx || ctx.state !== 'running') {
    alertLastError = ctx ? `Ses motoru ${ctx.state} durumunda.` : 'Web Audio desteklenmiyor.';
    return { ok: false, state: ctx?.state || 'unsupported' };
  }
  try {
    const delay = Math.max(0.05, Number(delaySeconds) || 0.05);
    const seviye = findRestAlertIntensity(intensityKey);
    const gain = Math.max(0.05, Math.min(1, Number(volume) || 1)) * seviye.gain;
    const finalAt = ctx.currentTime + delay;
    const pre = Math.max(0, Math.round(Number(preAlertSeconds) || 0));
    if (pre > 0 && delay > pre + 0.5) {
      playSequence(ctx, finalAt - pre, Math.min(0.22, gain * 0.35), toneKey, scheduledAlertNodes, true);
    }
    for (let i = 0; i < seviye.repeats; i += 1) {
      playSequence(ctx, finalAt + i * (seviye.gap || 0.9), gain, toneKey, scheduledAlertNodes);
    }
    scheduledAlertTarget = Date.now() + delay * 1000;
    alertPrimed = true;
    alertLastError = '';
    return { ok: true, state: ctx.state, targetAt: scheduledAlertTarget };
  } catch (error) {
    cancelScheduledRestAlert();
    alertLastError = error?.message || 'Uyarı zamanlanamadı.';
    return { ok: false, state: ctx.state };
  }
};

export const restAlertDiagnostics = () => ({
  supported: typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext),
  state: alertCtx?.state || 'not-started',
  primed: alertPrimed,
  scheduled: scheduledAlertNodes.length > 0,
  scheduledTarget: scheduledAlertTarget || null,
  error: alertLastError,
});

/**
 * Dinlenme bitiş sesi.
 *
 * @param intensityKey 'soft' | 'strong' | 'insistent'
 */
export const playRestAlert = async (intensityKey = 'strong', { toneKey = 'ascending', volume = 1 } = {}) => {
  try {
    const ctx = await ensureContext();
    if (!ctx || ctx.state !== 'running') {
      alertLastError = ctx ? `Ses motoru ${ctx.state} durumunda.` : 'Web Audio desteklenmiyor.';
      return { ok: false, ...restAlertDiagnostics() };
    }
    const seviye = findRestAlertIntensity(intensityKey);
    const now = ctx.currentTime;
    const gain = Math.max(0.05, Math.min(1, Number(volume) || 1)) * seviye.gain;
    for (let i = 0; i < seviye.repeats; i += 1) {
      playSequence(ctx, now + i * (seviye.gap || 0.9), gain, toneKey);
    }
    alertPrimed = true;
    alertLastError = '';
    // Context KAPATILMIYOR: her uyarıda yeni context açmak iOS'ta bir süre
    // sonra sessizliğe düşüyordu (açık context sayısı sınırlı).
    return { ok: true, ...restAlertDiagnostics() };
  } catch (error) {
    alertLastError = error?.message || 'Ses çalınamadı.';
    return { ok: false, ...restAlertDiagnostics() };
  }
};

/**
 * Titreşim.
 *
 * Desen şiddete göre uzuyor. Tek kısa titreşim telefon cepteyken ve yürürken
 * hissedilmiyor; uzun-kısa-uzun bir desen hissediliyor.
 */
export const vibrateAlert = (intensityKey = 'strong') => {
  const seviye = findRestAlertIntensity(intensityKey);
  const desen = seviye.key === 'soft'
    ? [140, 70, 140]
    : seviye.key === 'strong'
      ? [220, 90, 220, 90, 320]
      : [260, 100, 260, 100, 260, 100, 420];
  try { navigator.vibrate?.(desen); } catch { /* yoksay */ }
};


// --- Ekranı açık tutma (Wake Lock) ---
// Salonda telefonu bırakıp sete girerken ekranın kapanmaması için.

let wakeLock = null;

export const isWakeLockSupported = () =>
  typeof navigator !== 'undefined' && 'wakeLock' in navigator;

export const requestWakeLock = async () => {
  if (!isWakeLockSupported()) return false;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    // Uygulama arka plandan dönünce kilit düşer; çağıran taraf yeniden ister.
    wakeLock.addEventListener('release', () => { wakeLock = null; });
    return true;
  } catch {
    return false;
  }
};

export const releaseWakeLock = async () => {
  try {
    if (wakeLock) await wakeLock.release();
  } catch { /* yoksay */ }
  wakeLock = null;
};

export const hasWakeLock = () => wakeLock !== null;

// --- Dinlenme bitiş bildirimi ---
//
// Ses ve titreşim, telefon sessizdeyken ya da uygulama arka plandayken
// yetmiyor: salonda ekran kapanıyor, sayaç bitiyor ve kimse fark etmiyor.
// Bildirim, sistemin kendi kanalını kullandığı için ekran kapalıyken de
// görünüyor.
//
// İzin İSTEĞE BAĞLI ve kullanıcı eylemiyle isteniyor; uygulama açılışında
// izin kutusu çıkarmak hem rahatsız edici hem de tarayıcıların cezalandırdığı
// bir davranış.

export const isNotificationSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

export const notificationPermission = () =>
  (isNotificationSupported() ? Notification.permission : 'unsupported');

/** İzin ister; sonucu ('granted' | 'denied' | 'unsupported') döndürür. */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
};

/**
 * Dinlenme bittiğinde bildirim gösterir.
 *
 * Aynı `tag` kullanılıyor: arka arkaya biten sayaçlar bildirim yığmıyor,
 * sonuncusu öncekinin yerine geçiyor.
 */
export const showRestNotification = async (body = 'Sıradaki sete geç.') => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false;
  const options = {
    body,
    tag: 'po-rest',
    renotify: true,
    silent: false,
    requireInteraction: true,
    vibrate: [260, 100, 260, 100, 420],
    icon: '/pwa-v5-192x192.png',
    badge: '/pwa-v5-192x192.png',
    data: { url: '/' },
  };
  try {
    // Mobil tarayıcılarda Notification constructor güvenilir değil. MDN'nin
    // önerdiği kalıcı yöntem aktif service worker üzerinden showNotification.
    if ('serviceWorker' in navigator) {
      try {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise(resolve => setTimeout(() => resolve(null), 1200)),
        ]);
        if (registration?.showNotification) {
          await registration.showNotification('⏱ Dinlenme bitti', options);
          return true;
        }
      } catch { /* masaüstü constructor yedeğine düş */ }
    }
    const n = new Notification('⏱ Dinlenme bitti', options);
    n.onclick = () => { try { window.focus(); n.close(); } catch { /* yoksay */ } };
    // Bildirim ekranda takılı kalmasın; sayaç bilgisi kısa ömürlü.
    // requireInteraction desteklenmiyorsa bile bir süre sonra temizlensin.
    setTimeout(() => { try { n.close(); } catch { /* yoksay */ } }, 60000);
    return true;
  } catch {
    return false;
  }
};
