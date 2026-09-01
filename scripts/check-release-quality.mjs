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
const navbar = read('src/components/Navbar.jsx');
const globalSearch = read('src/components/GlobalSearchModal.jsx');
const dailyWorkspace = read('src/components/DailyWorkspaceModal.jsx');
const workoutStepper = read('src/components/WorkoutFlowStepper.jsx');
const activeWorkout = read('src/components/ActiveWorkoutView.jsx');
const sessionReport = read('src/components/SessionReportModal.jsx');
const homeView = read('src/components/HomeView.jsx');
const homeWeeklyOverview = read('src/components/HomeWeeklyOverview.jsx');
const todayCoach = read('src/components/TodayCoachCard.jsx');
const quickCapture = read('src/components/QuickCaptureModal.jsx');
const toolsModal = read('src/components/ToolsModal.jsx');
const viewHeader = read('src/components/ViewHeader.jsx');
const trainingView = read('src/components/TrainingView.jsx');
const nutritionView = read('src/components/NutritionView.jsx');
const progressHub = read('src/components/ProgressHubView.jsx');
const metricsView = read('src/components/MetricsView.jsx');
const bodyRatios = read('src/components/BodyRatiosCard.jsx');
const templateBuilder = read('src/components/TemplateBuilderModal.jsx');
const exerciseLibrary = read('src/components/ExerciseLibraryModal.jsx');
const analyticsView = read('src/components/AnalyticsView.jsx');

// Kontrolun amaci son surum notunun surumu APP_VERSION'dan almasi: boylece
// package.json ile ayrisamiyor. Tarih bu amacin parcasi degil — sabitlenmis
// olmasi kapinin her yeni yayinda yanlis alarm vermesine yol aciyordu.
check(/export const LATEST_RELEASE_NOTES = release\(APP_VERSION,/.test(history), 'Güncel sürüm notu APP_VERSION kullanıyor');
check(history.includes('PWA ve Kullanıcı Verisi'), 'Sürüm notu veri/PWA etkisini açıklıyor');
check(roadmap.includes('## 10.7') && roadmap.includes('## 10.17') && roadmap.includes('## 11.1'), 'UX yol haritası 10.7–11.1 kapsamını taşıyor');
check(app.includes('<span>Ekle</span>') && app.includes('aria-label="Uygulamada ara"') && app.includes('aria-label="Ayarları aç"'), 'Üst çubuk Ekle, Ara ve Ayarlar eylemlerini doğrudan sunuyor');
check(!app.includes('isAppMenuOpen') && !existsSync(resolve(root, 'src/components/AppMenuModal.jsx')), 'Tekrarlanan uygulama menüsü kaldırıldı');
check(['home', 'training', 'nutrition', 'progress', 'history'].every(key => navbar.includes(`key: '${key}'`)), 'Beş ana bölüm yalnız alt gezinmede korunuyor');
check(app.includes('isDailyWorkspaceOpen') && globalSearch.includes('Günün Kayıtları') && globalSearch.includes('Tüm Araçlar'), 'Günlük kayıt merkezi ve araçlar küresel aramada korunuyor');
check(['Antrenman', 'Kardiyo / Aktivite', 'Beslenme', 'Vücut Ölçümü', 'Uyku', 'Zihin & Esneme'].every(label => dailyWorkspace.includes(label)), 'Günlük merkez altı kayıt türünü aynı tarih bağlamında kapsıyor');
check(dailyWorkspace.includes('Kalori detayı') && dailyWorkspace.includes('Arşivde aç') && dailyWorkspace.includes('onAddWater'), 'Günlük merkez enerji, arşiv ve su eylemlerini koruyor');
check(['Hazırla', 'Çalış', 'Değerlendir'].every(label => workoutStepper.includes(label)), 'Antrenman yaşam döngüsü üç görünür aşama taşıyor');
check(activeWorkout.includes('Şimdi bunu yap') && activeWorkout.includes('Seans ayrıntıları') && activeWorkout.includes('WorkoutFlowStepper'), 'Canlı seans sonraki eylemi öne çıkarıp ayrıntıları katlıyor');
check(activeWorkout.includes('Hareket ayrıntıları') && activeWorkout.includes('secondaryInfoCount') && activeWorkout.includes("interfaceMode === 'detailed'"), 'Aktif seans ikincil hareket bilgisini basit görünümde katmanlıyor');
check(sessionReport.includes('Sonraki seans odağı') && sessionReport.includes('Analizde İncele') && sessionReport.includes('WorkoutFlowStepper'), 'Seans raporu sonraki odağı ve analiz geçişini gösteriyor');
check(index.includes('user-scalable=no') && main.includes("'gesturestart'") && css.includes('font-size: max(16px, 1rem)'), 'Mobil zoom kilidi ve uygulama içi punto ölçeği birlikte korunuyor');
check(settingsModal.includes("activeSection === 'home'") && settingsModal.includes("key: 'method'"), 'Ayarlar kategori ana ekranı ve Koç & Yöntem ayrımı korunuyor');
check(settingsModal.includes('h-[100dvh]') && settingsModal.includes('grid-cols-1 sm:grid-cols-2'), 'Ayarlar mobilde tam ekran ve tek sütunlu');
check(settingsModal.includes('Burada yalnız ayarlar bulunur') && settingsModal.includes('alttaki menüyü kullan'), 'Ayarlar ile ana bölüm gezinmesi açıkça ayrılıyor');
check(homeView.includes('Sıradaki eylem') && homeView.includes('Antrenmanı Başlat') && homeView.includes('visibleHelperActions'), 'Ana sayfa tek baskın eylem ve bağlamsal yardımcı kısayollar kullanıyor');
check(homeView.includes('visibleHelperActions') && homeView.includes("item.key !== 'daily'"), 'Basit ana ekran global Ekle ile yinelenen Günlük kısayolunu gizliyor');
check(homeWeeklyOverview.indexOf('Haftalık Durum') < homeWeeklyOverview.indexOf('Kas haritası günlük kararın önünde'), 'Kas haritası haftalık durum açılımının içinde hazırlanıyor');
check(todayCoach.includes('grid-cols-[1fr_58px_58px]') && todayCoach.includes('min-h-14'), 'Koç yardımcı eylemleri okunabilir dokunma alanında');
check(quickCapture.includes('completedCount') && quickCapture.includes('Kayıtlı') && quickCapture.includes('divide-y'), 'Hızlı kayıt tek sütunlu ve durum etiketli');
check(toolsModal.includes("activeGroup") && toolsModal.includes('h-[100dvh]') && toolsModal.includes('Araç kategorileri'), 'Araç merkezi tam ekran ve kategori filtreli');
check(viewHeader.includes('luxury-title') && [trainingView, nutritionView, historyView, progressHub].every(source => source.includes('<ViewHeader')), 'Dört ana görev ekranı ortak başlık hiyerarşisini kullanıyor');
check(historyView.includes('overflow-x-auto') && historyView.includes('aria-pressed') && historyView.includes('ArchiveEmptyState'), 'Arşiv filtreleri okunabilir ve boş durumlar eylem odaklı');
check(nutritionView.includes('Hızlı beslenme işlemleri') && nutritionView.includes('Değişiklikleri sakla') && nutritionView.includes('min-h-11'), 'Beslenme giriş ve kaydetme hiyerarşisi ile dokunma hedefleri korunuyor');
check(nutritionView.includes('Takip ve analiz ayrıntıları') && nutritionView.includes('data-nutrition-editor') && nutritionView.includes('(detailed && safeMeals.length === 1)'), 'Basit beslenme akışı editörü ve analizleri kademeli gösteriyor');
check(nutritionView.includes('Giriş şeklini değiştir') && nutritionView.includes('Güne Özel Hareket') && nutritionView.includes('openDayMovement'), 'Basit beslenme giriş modu ve güne özel hareket ayarı tek akıştan erişiliyor');
check(nutritionView.includes('{detailed && <div className="grid grid-cols-2 gap-2 pt-1">'), 'Yinelenen alt öğün araçları yalnız detaylı görünümde açık');
check(progressHub.includes('Gelişim Merkezi') && progressHub.includes('Gelişim görünümü'), 'Gelişim ekranı başlık ve alt görünüm bağlamı taşıyor');
check(analyticsView.includes('ANALYSIS_TABS') && analyticsView.includes('grid-cols-3') && analyticsView.includes('Grafik ve Günlük Ayrıntı'), 'Analiz gezinmesi okunabilir ve ileri beslenme verisi katmanlı');
check(analyticsView.includes('defaultOpen={detailed}') && analyticsView.includes('rm-picker-'), 'Basit analiz görünümü teknik kartları ve seçili 1RM listesini kapatıyor');
check(trainingView.includes('recommendationOverride') && trainingView.includes('progressionOverride') && trainingView.includes('programOptionsOverride'), 'Basit antrenman görünümü öneri, blok ve kurulum ayrıntılarını katmanlıyor');
check(trainingView.includes('compact={interfaceMode === \'simple\'}') && todayCoach.includes('showPrimaryAction'), 'Basit antrenman ve koç akışı yinelenen açıklama ve eylemleri azaltıyor');
check(trainingView.includes('Neden bu seans? Kas haritasını göster') && trainingView.includes('Hazır program ve elle kurma seçenekleri'), 'Antrenman ayrıntıları açık ve anlaşılır eylemlerle erişilebilir');
check(trainingView.includes('Diğer İşlemler') && trainingView.includes('> Düzenle</button>'), 'Şablon düzenleme doğrudan, seyrek işlemler ikinci katmanda');
check(templateBuilder.includes('İleri planlama ve analiz') && templateBuilder.includes('Hareket Ekle') && templateBuilder.includes('actionTarget'), 'Şablon editörü temel işi öne alıp ileri araçları katmanlıyor');
check(exerciseLibrary.includes('min-h-0 flex-1 overflow-y-auto') && exerciseLibrary.includes('shrink-0 border-t'), 'Hareket listesi ve seçim altlığı aynı modal panelinde akıyor');
check(metricsView.includes('Bugünkü Ölçümü Kaydet') && metricsView.includes('summary={`Yağ %') && bodyRatios.includes('defaultOpen'), 'Vücut kaydı üst eylem ve katlanabilir özetlerle sadeleşiyor');
check(metricsView.includes('{detailed && (') && historyView.includes("interfaceMode === 'detailed'"), 'Basit Vücut ve Arşiv ekranları yinelenen ikincil içeriği gizliyor');
check(historyView.includes("addOpen ? 'Kapat' : 'Geçmişe Ekle'") && historyView.includes('openAddPanel'), 'Geçmiş kayıt ekleme başlık eyleminden açılıyor');
check(homeView.includes('min-h-11') && homeView.includes('aria-label="Beslenme ekranına git"'), 'Ana sayfa su kontrolleri erişilebilir dokunma hedefi taşıyor');
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
