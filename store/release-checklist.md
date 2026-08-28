# Native mağaza yayın kontrol listesi

## 1. Kimlik ve kamuya açık sayfalar

- [ ] Kalıcı üretim alan adı bağla.
- [ ] Kamuya açık destek e-postası oluştur ve `/support.html` ile `/privacy.html` sayfalarına ekle.
- [ ] Apple Developer ve Google Play geliştirici kimlik doğrulamalarını tamamla.
- [ ] `tech.afacan.prooverload` kimliğini iki platformda ayır.

## 2. Capacitor kabuğu

- [ ] Capacitor çekirdeği/CLI’sı ekle, `webDir` değerini `dist` yap.
- [ ] iOS ve Android projelerini ayrı klasörlerde üret.
- [ ] Kamera, bildirim ve ağ izinlerini yalnız gerekli kapsamla tanımla.
- [ ] iOS gizlilik purpose string’lerini ve Android izin bildirimlerini Türkçe/İngilizce hazırla.
- [ ] localStorage kökeni ve PWA → native JSON yedek geçişini gerçek cihazda dene.

## 3. Platform derlemeleri

- [ ] iOS: Xcode 26 + iOS 26 SDK, Archive, imzalama ve TestFlight.
- [ ] Android: API 36 hedefi, release keystore, Play App Signing ve AAB.
- [ ] Adaptive/monochrome Android ikonları ve iOS AppIcon seti hazırla.
- [ ] Açılış ekranı, safe area, klavye, geri tuşu, kamera ve çevrimdışı kullanım testlerini yap.

## 4. Mağaza içeriği ve politika

- [ ] Temiz demo verisiyle iPhone ve Android mağaza ekran görüntülerini üret.
- [ ] App Privacy ve Data Safety cevaplarını son binary/SDK listesine göre tamamla.
- [ ] Google Health Apps beyanında uygulamadaki beş sağlık özelliğini seç.
- [ ] Yaş derecelendirme sorularını ve sağlık/tıbbi cihaz durumunu cevapla.
- [ ] Uygulama açıklamasında tıbbi cihaz olmadığını ve tahmin sınırlarını koru.

## 5. Kabul testi

- [ ] Temiz kurulum → kayıt → yedek → kaldırma → yeniden kurulum → geri yükleme.
- [ ] Eski PWA yedeğini native pakete alma.
- [ ] Devam eden antrenmanda uygulama güncellemesi ve arka plan dönüşü.
- [ ] Kamera izni reddetme/kabul etme, çevrimdışı mod ve API hatası.
- [ ] Büyük yazı, açık/koyu tema, VoiceOver/TalkBack ve ekran yakınlaştırma.
- [ ] TestFlight ve Play kapalı testte en az bir tam antrenman haftası.
