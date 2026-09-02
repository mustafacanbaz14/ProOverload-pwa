import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const failures = [];
const passed = [];

const check = (condition, label) => {
  if (condition) passed.push(label);
  else failures.push(label);
};

const packageJson = JSON.parse(read('package.json'));
const metadata = JSON.parse(read('store/metadata.tr.json'));
const constants = read('src/utils/constants.js');
const vite = read('vite.config.js');
const index = read('index.html');
const main = read('src/main.jsx');
const css = read('src/index.css');
const releaseChecklist = read('docs/RELEASE_CHECKLIST.md');
const screenshotMatrix = read('docs/STORE_SCREENSHOT_MATRIX.md');
// Vercel build ortamı yapılandırma dosyasını normalize/minify edebilir.
// Bu nedenle boşluklara bağlı ham metin araması yerine JSON yapısını denetle.
const vercel = JSON.parse(read('vercel.json'));

check(constants.includes(`export const APP_VERSION = '${packageJson.version}'`), 'Paket ve uygulama sürümü aynı');
check(metadata.appVersion === packageJson.version, 'Mağaza metadatası güncel sürümde');
check(/user-scalable\s*=\s*no/i.test(index) && /maximum-scale\s*=\s*1(?:\.0)?/i.test(index), 'PWA viewport yakınlaştırması kilitli');
check(main.includes("'gesturestart'") && main.includes('event.touches?.length > 1'), 'iOS çoklu dokunma yakınlaştırması engelleniyor');
check(css.includes('font-size: max(16px, 1rem)') && css.includes('--font-scale'), 'iOS odak zoomu kapalı ve uygulama punto ayarı korunuyor');
check(index.includes('apple-mobile-web-app-capable'), 'Apple PWA metası var');
check(index.includes('mobile-web-app-capable'), 'Genel mobil uygulama metası var');
check(releaseChecklist.includes('VoiceOver veya TalkBack') && releaseChecklist.toLocaleLowerCase('tr').includes('azaltılmış hareket'), 'Gerçek cihaz erişilebilirlik senaryoları kayıtlı');
check(['açık tema', 'koyu tema', 'kadın profil', 'erkek profil'].every(marker => screenshotMatrix.toLocaleLowerCase('tr').includes(marker)), 'Mağaza ekran görüntüsü varyantları tanımlı');
check(screenshotMatrix.includes('393') && screenshotMatrix.includes('430'), 'Mağaza ekran görüntüsü mobil taşma ölçütleri tanımlı');

[
  "id: '/'", "start_url: '/?source=pwa'", "scope: '/'", "orientation: 'portrait-primary'",
  "categories: ['health', 'fitness', 'lifestyle']", 'shortcuts:', 'prefer_related_applications: false',
].forEach(marker => check(vite.includes(marker), `Manifest alanı: ${marker}`));

const legal = [
  ['public/privacy.html', ['localStorage', 'Open Food Facts', 'tıbbi cihaz değildir', 'Kamera']],
  ['public/support.html', ['GitHub Issues', 'Yedek İndir', 'tıbbi cihaz değildir']],
  ['public/terms.html', ['Tıbbi hizmet değildir', 'Tahminlerin sınırı', 'Yerel veri']],
];
for (const [path, markers] of legal) {
  check(existsSync(resolve(root, path)), `${path} mevcut`);
  const content = read(path);
  markers.forEach(marker => check(content.includes(marker), `${path}: ${marker}`));
  check(content.includes(packageJson.version), `${path} sürümü güncel`);
}
const globalHeaderRule = Array.isArray(vercel.headers)
  ? vercel.headers.find(rule => rule?.source === '/:path*')
  : null;
const globalHeaderKeys = new Set(
  Array.isArray(globalHeaderRule?.headers)
    ? globalHeaderRule.headers.map(header => header?.key).filter(Boolean)
    : [],
);
const hasSpaRewrite = Array.isArray(vercel.rewrites)
  && vercel.rewrites.some(rule => rule?.destination === '/index.html');

check(Boolean(globalHeaderRule), 'Global güvenlik başlığı yolu var');
check(hasSpaRewrite, 'SPA yönlendirmesi var');
['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy']
  .forEach(header => check(globalHeaderKeys.has(header), `Güvenlik başlığı: ${header}`));

const pngSize = (path) => {
  const bytes = readFileSync(resolve(root, path));
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};
check(pngSize('public/pwa-v5-192x192.png').join('x') === '192x192', '192px PWA ikonu doğru');
check(pngSize('public/pwa-v5-512x512.png').join('x') === '512x512', '512px PWA ikonu doğru');
check(pngSize('public/apple-touch-icon-v5.png').join('x') === '180x180', '180px Apple ikonu doğru');

const appleSubtitleLength = [...metadata.apple.subtitle].length;
const googleShortLength = [...metadata.googlePlay.shortDescription].length;
check(appleSubtitleLength <= 30, `Apple alt başlığı 30 karakteri aşmıyor (${appleSubtitleLength})`);
check(Buffer.byteLength(metadata.apple.keywords, 'utf8') <= 100, 'Apple anahtar kelimeleri 100 baytı aşmıyor');
check(googleShortLength <= 80, `Play kısa açıklaması 80 karakteri aşmıyor (${googleShortLength})`);
check(metadata.submission.androidTargetApi >= 36, 'Android hedef API 36 veya üstü');
check(metadata.identity.iosBundleId === metadata.identity.androidPackageName, 'Platform kimlikleri tek ürün adı kullanıyor');

if (failures.length) {
  console.error(`Mağaza hazırlık denetimi başarısız — ${failures.length} hata:`);
  failures.forEach(item => console.error(`  - ${item}`));
  process.exit(1);
}

console.log(`Mağaza hazırlık denetimi geçti — ${passed.length} otomatik kontrol.`);
if (!metadata.urls.productionOrigin) console.warn('  Bekleyen manuel adım: kalıcı üretim alan adı metadata dosyasına eklenmeli.');
if (!metadata.submission.publicSupportEmail) console.warn('  Bekleyen manuel adım: kamuya açık destek e-postası eklenmeli.');
