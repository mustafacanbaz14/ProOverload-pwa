import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = file => readFileSync(resolve(root, file), 'utf8');
const failures = [];
const passed = [];
const check = (condition, label) => (condition ? passed : failures).push(label);

const index = read('index.html');
const app = read('src/App.jsx');
const css = read('src/index.css');
const navbar = read('src/components/Navbar.jsx');
const onboarding = read('src/components/OnboardingModal.jsx');
const activeWorkout = read('src/components/ActiveWorkoutView.jsx');
const releaseNotes = read('src/components/ReleaseNotesModal.jsx');
const errorBoundary = read('src/components/AppErrorBoundary.jsx');
const checklist = read('docs/RELEASE_CHECKLIST.md');

check(/<html\s+lang="tr"/i.test(index), 'Belge dili Türkçe');
check(app.includes('href="#main-content"') && app.includes('id="main-content"'), 'Ana içerik atlama bağlantısı bağlı');
check(app.includes('tabIndex="-1"') && app.includes('aria-label={`${activeViewLabel} içeriği`}'), 'Ana görünüm programatik odak ve ad taşıyor');
check(app.includes('aria-live="polite"') && app.includes('`${activeViewLabel} açıldı`'), 'Sekme değişimi ekran okuyucuya duyuruluyor');
check(navbar.includes('aria-label="Ana gezinme"') && navbar.includes("aria-current={isActive ? 'page'"), 'Alt gezinme seçili sayfayı açıklıyor');
check(css.includes('.skip-link:focus') && css.includes(':focus-visible'), 'Atlama bağlantısı ve görünür klavye odağı var');
check(css.includes('@media (prefers-reduced-motion: reduce)'), 'Azaltılmış hareket tercihi destekleniyor');
check(css.includes('@media (prefers-contrast: more)') && css.includes('@media (forced-colors: active)'), 'Yüksek kontrast ve zorunlu renkler destekleniyor');
check(css.includes('min-height: 2.75rem') && css.includes('min-width: 2.75rem'), 'Genel dokunma hedefi en az 44 piksel');
check(css.includes('font-size: max(16px, 1rem)') && css.includes('--font-scale'), 'iOS form yakınlaştırması ve punto ölçeği birlikte yönetiliyor');

check(onboarding.includes('aria-labelledby="onboarding-title"') && onboarding.includes('aria-describedby="onboarding-purpose"'), 'İlk kurulum diyaloğu adlandırılmış');
check(onboarding.includes("['Hedef', 'İlk kayıt', 'Özet']") && onboarding.includes('Kurulum adımı {step + 1} / 3'), 'Üç adımlı kurulum görünür ve sesli ilerleme taşıyor');
check(onboarding.includes("document.addEventListener('keydown', onKeyDown)") && onboarding.includes("event.key !== 'Tab'"), 'İlk kurulum odağı diyaloğun içinde tutuluyor');
check(['metrics', 'training', 'nutrition', 'sleep'].every(key => onboarding.includes(`key: '${key}'`)), 'İlk kayıt dört temel göreve yönleniyor');
check(app.includes('onFinish={(patch, starterKey, firstAction)') && app.includes("sleep: () => openWellness('sleep')"), 'Kurulum seçilen ilk kayıt ekranını gerçekten açıyor');

check(app.includes('Çevrimdışı çalışıyorsun') && activeWorkout.includes('setlerin cihazda kaydedilmeye devam ediyor'), 'Çevrimdışı durum normal ve aktif seansta görünür');
check(activeWorkout.includes('Yeni sürüm hazır: seans bitince veri kaybetmeden uygulanacak.'), 'Ertelenen PWA güncellemesi aktif seansta açıklanıyor');
check(releaseNotes.includes('role="dialog"') && releaseNotes.includes('role="tablist"') && releaseNotes.includes('role="tabpanel"'), 'Sürüm notu diyaloğu ve sekmeleri semantik');
check(errorBoundary.includes('role="alert"') && errorBoundary.includes('Hata Bilgisini Kopyala'), 'Kurtarma ekranı acil uyarı ve tanı kopyası sunuyor');
check(errorBoundary.includes('Acil Yedeği İndir') && errorBoundary.includes('href="/support.html"'), 'Kurtarma ekranı yedek ve destek yolunu koruyor');
check(checklist.includes('VoiceOver') && checklist.includes('azaltılmış hareket'), 'Gerçek cihaz erişilebilirlik turu belgelenmiş');

if (failures.length) {
  console.error(`Erişilebilirlik kapısı başarısız — ${failures.length} hata:`);
  failures.forEach(item => console.error(`  - ${item}`));
  process.exit(1);
}

console.log(`Erişilebilirlik kapısı geçti — ${passed.length} otomatik kontrol.`);
