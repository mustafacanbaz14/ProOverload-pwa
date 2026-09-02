export const STORE_IDENTIFIERS = {
  iosBundleId: 'tech.afacan.prooverload',
  androidPackageName: 'tech.afacan.prooverload',
};

export const STORE_PATHS = {
  privacy: '/privacy.html',
  support: '/support.html',
  terms: '/terms.html',
};

const automatic = (key, label, detail) => ({ key, label, detail, automatic: true, done: true });
const manual = (key, label, detail) => ({ key, label, detail, automatic: false });

export const STORE_READINESS_GROUPS = {
  foundation: {
    label: 'Web ve Politika Temeli',
    checks: [
      automatic('privacyPage', 'Gizlilik politikası', 'Uygulama içinden ve doğrudan URL ile erişilebilir.'),
      automatic('supportPage', 'Destek merkezi', 'Kurulum, yedekleme, hata bildirimi ve veri silme adımları açıklandı.'),
      automatic('termsPage', 'Kullanım koşulları', 'Tahminlerin sınırı ve tıbbi cihaz olmadığı açıkça yazıldı.'),
      automatic('dataInventory', 'Veri envanteri', 'Yerel veriler, kamera ve Open Food Facts aktarımı ayrı ayrı bildirildi.'),
      automatic('backupFlow', 'Yedekleme ve geri yükleme', 'JSON yedeği ile kullanıcı verisi cihazlar arasında taşınabiliyor.'),
      automatic('pwaIdentity', 'PWA kimliği', 'Manifest kimliği, kapsamı, yönü, kategori ve kısayollar tanımlı.'),
      automatic('accessibleViewport', 'Uygulama içi yazı ölçeği', 'İstem dışı tarayıcı zoomu kapalı; okunabilirlik Ayarlar içindeki kalıcı punto seçimiyle yönetiliyor.'),
      automatic('accessibleNavigation', 'Erişilebilir gezinme', 'Ana içerik atlama bağlantısı, sayfa duyurusu, görünür klavye odağı ve anlamlı diyalog etiketleri bulunuyor.'),
      automatic('reducedMotion', 'Hareket ve kontrast uyumu', 'İşletim sisteminin azaltılmış hareket, yüksek kontrast ve zorunlu renk tercihleri destekleniyor.'),
      automatic('resilientUpdate', 'Güvenli PWA güncellemesi', 'Yeni paket etkin antrenmanı bölmüyor; bağlantı ve bekleyen güncelleme durumu kullanıcıya görünür açıklanıyor.'),
      automatic('recoveryDiagnostics', 'Hata kurtarma paketi', 'Acil yedek, yeniden yükleme, kişisel veri içermeyen tanı bilgisi ve destek adımı aynı güvenli ekranda.'),
      automatic('releaseChecks', 'Yayın öncesi otomatik denetim', 'Sürüm, ikon, politika ve manifest hataları build aşamasını durduruyor.'),
      manual('publicContact', 'Kamuya açık destek e-postası', 'App Store destek sayfasında gerçek bir e-posta veya yasal iletişim bilgisi gerekir.'),
    ],
  },
  ios: {
    label: 'Apple App Store',
    checks: [
      manual('iosDeveloperAccount', 'Apple Developer hesabı', 'Bireysel veya kuruluş hesabı doğrulanmalı.'),
      manual('iosBundleId', 'Bundle ID kaydı', `${STORE_IDENTIFIERS.iosBundleId} Apple Developer portalında ayrılmalı.`),
      manual('iosNativeShell', 'Capacitor iOS kabuğu', 'PWA tek başına App Store paketi değildir; iOS projesi ve native köprü gerekir.'),
      manual('iosXcodeBuild', 'Xcode 26 üretim derlemesi', 'Güncel iOS 26 SDK ile imzalı Archive/TestFlight build’i alınmalı.'),
      manual('iosScreenshots', 'iPhone ekran görüntüleri', 'En az bir, en fazla on mağaza ekran görüntüsü hazırlanmalı.'),
      manual('iosPrivacyAnswers', 'App Privacy beyanı', 'Uygulama ve üçüncü tarafların veri davranışı App Store Connect’te cevaplanmalı.'),
      manual('iosAgeRating', 'Yaş derecelendirmesi', 'Güncel yaş derecelendirme soruları tamamlanmalı.'),
      manual('iosTestFlight', 'TestFlight kabul testi', 'Gerçek iPhone’da yedek, kamera, bildirim ve çevrimdışı akış denenmeli.'),
    ],
  },
  android: {
    label: 'Google Play',
    checks: [
      manual('androidDeveloperAccount', 'Play geliştirici doğrulaması', 'Play Console hesabı ve geliştirici kimliği doğrulanmalı.'),
      manual('androidPackageName', 'Paket adı kaydı', `${STORE_IDENTIFIERS.androidPackageName} kalıcı uygulama kimliği olarak ayrılmalı.`),
      manual('androidNativeShell', 'Android paketi', 'Capacitor veya doğrulanmış TWA ile Android App Bundle üretilmeli.'),
      manual('androidTargetApi', 'Android 16 / API 36', '31 Ağustos 2026 sonrası yeni uygulama ve güncellemeler API 36 hedeflemeli.'),
      manual('androidSigning', 'Play App Signing ve AAB', 'Üretim anahtarı güvenli saklanmalı ve imzalı AAB yüklenmeli.'),
      manual('androidScreenshots', 'Telefon ekran görüntüleri', 'Mağaza görselleri gerçek uygulama arayüzünü göstermeli.'),
      manual('androidDataSafety', 'Veri Güvenliği formu', 'Yerel sağlık verisi ve Open Food Facts ağ isteği doğru beyan edilmeli.'),
      manual('androidHealthDeclaration', 'Sağlık Uygulamaları beyanı', 'Aktivite, beslenme, adet döngüsü, uyku ve stres özellikleri beyan edilmeli.'),
      manual('androidClosedTest', 'Kapalı test', 'Gerçek cihazlarda kurulum, güncelleme ve veri koruma akışı doğrulanmalı.'),
    ],
  },
};

export const normalizeStoreChecklist = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, done]) => done === true));
};

const resolveGroup = (group, checklist) => {
  const checks = group.checks.map(check => ({
    ...check,
    done: check.automatic ? true : checklist[check.key] === true,
  }));
  const done = checks.filter(check => check.done).length;
  return { ...group, checks, done, total: checks.length, percent: Math.round((done / checks.length) * 100) };
};

export const buildStoreReadiness = (value = {}) => {
  const checklist = normalizeStoreChecklist(value);
  const groups = Object.fromEntries(Object.entries(STORE_READINESS_GROUPS)
    .map(([key, group]) => [key, resolveGroup(group, checklist)]));
  const all = Object.values(groups).flatMap(group => group.checks);
  const done = all.filter(check => check.done).length;
  const next = all.find(check => !check.done) || null;
  return {
    groups,
    done,
    total: all.length,
    percent: Math.round((done / all.length) * 100),
    next,
    storeReady: all.every(check => check.done),
  };
};

export const storeUrls = (origin = '') => {
  const base = String(origin || '').replace(/\/$/, '');
  return Object.fromEntries(Object.entries(STORE_PATHS).map(([key, path]) => [key, `${base}${path}`]));
};
