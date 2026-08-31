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
const index = read('index.html');
const history = read('src/utils/releaseHistory.js');
const roadmap = read('docs/UX_ROADMAP.md');
const settingsModal = read('src/components/SettingsModal.jsx');
const energyModal = read('src/components/EnergyDetailModal.jsx');
const historyView = read('src/components/HistoryView.jsx');
const appMenu = read('src/components/AppMenuModal.jsx');
const dailyWorkspace = read('src/components/DailyWorkspaceModal.jsx');
const workoutStepper = read('src/components/WorkoutFlowStepper.jsx');
const activeWorkout = read('src/components/ActiveWorkoutView.jsx');
const sessionReport = read('src/components/SessionReportModal.jsx');

// Kontrolun amaci son surum notunun surumu APP_VERSION'dan almasi: boylece
// package.json ile ayrisamiyor. Tarih bu amacin parcasi degil — sabitlenmis
// olmasi kapinin her yeni yayinda yanlis alarm vermesine yol aciyordu.
check(/export const LATEST_RELEASE_NOTES = release\(APP_VERSION,/.test(history), 'Güncel sürüm notu APP_VERSION kullanıyor');
check(history.includes('PWA ve Kullanıcı Verisi'), 'Sürüm notu veri/PWA etkisini açıklıyor');
check(roadmap.includes('## 10.7') && roadmap.includes('## 11.1'), 'UX yol haritası 10.7–11.1 kapsamını taşıyor');
check(app.includes('isAppMenuOpen') && app.includes('<span>Ekle</span>') && app.includes('<span>Menü</span>'), 'Üst çubukta yazılı Ekle ve Menü eylemleri var');
check(appMenu.includes('Uygulamada ara') && appMenu.includes('Tüm Araçlar') && appMenu.includes('Ayarlar'), 'Birleşik menü arama, araçlar ve ayarları kapsıyor');
check(['home', 'training', 'nutrition', 'progress', 'history'].every(key => appMenu.includes(`key: '${key}'`)), 'Birleşik menü beş ana bölümü kapsıyor');
check(app.includes('isDailyWorkspaceOpen') && appMenu.includes('Günün kayıtlarını yönet'), 'Günlük kayıt merkezi ana uygulama ve menüye bağlı');
check(['Antrenman', 'Kardiyo / Aktivite', 'Beslenme', 'Vücut Ölçümü', 'Uyku', 'Zihin & Esneme'].every(label => dailyWorkspace.includes(label)), 'Günlük merkez altı kayıt türünü aynı tarih bağlamında kapsıyor');
check(dailyWorkspace.includes('Kalori detayı') && dailyWorkspace.includes('Arşivde aç') && dailyWorkspace.includes('onAddWater'), 'Günlük merkez enerji, arşiv ve su eylemlerini koruyor');
check(['Hazırla', 'Çalış', 'Değerlendir'].every(label => workoutStepper.includes(label)), 'Antrenman yaşam döngüsü üç görünür aşama taşıyor');
check(activeWorkout.includes('Şimdi bunu yap') && activeWorkout.includes('Seans ayrıntıları') && activeWorkout.includes('WorkoutFlowStepper'), 'Canlı seans sonraki eylemi öne çıkarıp ayrıntıları katlıyor');
check(sessionReport.includes('Sonraki seans odağı') && sessionReport.includes('Analizde İncele') && sessionReport.includes('WorkoutFlowStepper'), 'Seans raporu sonraki odağı ve analiz geçişini gösteriyor');
check(index.includes('user-scalable=no') && main.includes("'gesturestart'") && css.includes('font-size: max(16px, 1rem)'), 'Mobil zoom kilidi ve uygulama içi punto ölçeği birlikte korunuyor');
check(settingsModal.includes("activeSection === 'home'") && settingsModal.includes("key: 'method'"), 'Ayarlar kategori ana ekranı ve Koç & Yöntem ayrımı korunuyor');
check(app.includes('energyDetailEntry') && app.includes("openEnergyDetail('days'"), 'Kalori detayı tarih ve sekme bağlamıyla açılıyor');
check(historyView.includes('onOpenEnergyDay') && energyModal.includes('days: 365'), 'Arşivden Gün Gün enerji erişimi ve bir yıllık görünüm korunuyor');
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
