import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = file => readFileSync(resolve(root, file), 'utf8');
const failures = [];
const passed = [];
const check = (condition, label) => (condition ? passed : failures).push(label);

const pkg = JSON.parse(read('package.json'));
const vite = read('vite.config.js');
const main = read('src/main.jsx');
const app = read('src/App.jsx');
const css = read('src/index.css');
const history = read('src/utils/releaseHistory.js');
const roadmap = read('docs/UX_ROADMAP.md');

check(history.includes(`release(APP_VERSION, '2026-08-30'`), 'Güncel sürüm notu APP_VERSION kullanıyor');
check(history.includes('PWA ve Kullanıcı Verisi'), 'Sürüm notu veri/PWA etkisini açıklıyor');
check(roadmap.includes('## 9.4') && roadmap.includes('## 9.5'), 'UX yol haritası 9.4 ve 9.5 kapsamını taşıyor');
check(vite.includes("registerType: 'autoUpdate'"), 'PWA otomatik güncelleme açık');
check(vite.includes('cleanupOutdatedCaches: true'), 'Eski PWA önbellekleri temizleniyor');
check(vite.includes("navigateFallback: 'index.html'"), 'Çevrimdışı SPA fallback tanımlı');
check(main.includes('onNeedRefresh()') && main.includes('updateSW(true)'), 'Yeni servis çalışanı etkinleştiriliyor');
check(main.includes('hasActiveWorkout()') && main.includes('deferAppUpdate'), 'Aktif antrenmanda güncelleme erteleniyor');
check(app.includes('BackupImportPreviewModal') && app.includes('createBackupPayload'), 'Yedek önizleme ve tam dışa aktarım akışı bağlı');
check(app.includes('AppErrorBoundary') || read('src/main.jsx').includes('AppErrorBoundary'), 'Açılış hata sınırı bağlı');
check(/pb-safe|pt-safe/.test(css), 'iPhone güvenli alan yardımcıları var');
check(css.includes('--font-scale'), 'Erişilebilir yazı ölçeği korunuyor');
check(existsSync(resolve(root, 'docs/RELEASE_CHECKLIST.md')), 'Manuel mobil yayın kontrol listesi mevcut');
check(pkg.scripts?.lint && pkg.scripts?.verify && pkg.scripts?.['check:performance'], 'Lint, regresyon ve performans komutları tanımlı');

if (failures.length) {
  console.error(`Yayın kalite kapısı başarısız — ${failures.length} hata:`);
  failures.forEach(item => console.error(`  - ${item}`));
  process.exit(1);
}

console.log(`Yayın kalite kapısı geçti — ${passed.length} otomatik kontrol.`);
