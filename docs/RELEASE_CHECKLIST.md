# Mobil yayın kontrol listesi

Her mağaza/PWA yayını öncesinde otomatik build kapısına ek olarak aşağıdaki kısa
tur gerçek telefonda uygulanır. Otomatik kontroller yapısal hataları yakalar;
kamera izni, iOS ses politikası ve dokunma hissi gerçek cihaz kanıtı ister.

## Kritik veri akışı

- JSON yedeği indir; dosyanın tarih ve sürümünü kontrol et.
- Boş bir test profilinde yedeği önizle, kayıt sayılarını doğrula ve geri yükle.
- Antrenman, beslenme ve ölçüm kaydet; uygulamayı kapatıp açınca kayıtların durduğunu kontrol et.
- Aktif antrenman varken güncellemenin seansı bölmediğini kontrol et.

## PWA ve çevrimdışı

- iPhone ana ekran kurulumunda alt menü ve güvenli alanların taşmadığını kontrol et.
- Bir kez çevrimiçi aç, uçak moduna geç ve ana ekran/antrenman/arşivi yeniden aç.
- Yeni sürüm yayınından sonra PWA'yı silmeden sürüm rozetinin güncellendiğini kontrol et.
- Barkod tarayıcı ilk kullanımında kamera izni reddi ve kabulü akışlarını ayrı ayrı dene.

## Erişilebilirlik ve mobil görünüm

- 375×812 ve 430×932 genişliklerinde yatay taşma olmadığını doğrula.
- Ayarlardan En Büyük yazıyı seç; ana eylemler ve kapatma düğmeleri erişilebilir kalsın.
- Açık/koyu temada ana metin, pasif metin, hata ve başarı renklerini kontrol et.
- Yalnız ikon taşıyan düğmelerin ekran okuyucu etiketlerini kontrol et.
- VoiceOver veya TalkBack ile atlama bağlantısı → ana başlık → ana eylem → alt gezinme sırasını tamamla.
- Harici klavyede Tab ve Shift+Tab ile ilk kurulum odağının pencere dışına kaçmadığını doğrula.
- İşletim sisteminde azaltılmış hareketi aç; geçiş, yükleme ve kutlama animasyonlarının durduğunu kontrol et.
- Yüksek kontrast / zorunlu renk kipinde seçili sekmenin yalnız renge bağlı kalmadığını doğrula.

## İlk kullanım

- Boş profilde kurulumun Hedef → İlk kayıt → Özet olarak üç adımda tamamlandığını doğrula.
- Vücut, Antrenman, Beslenme ve Uyku seçeneklerinin her birinde bitişin doğru kayıt ekranını açtığını dene.
- Şimdilik kapat seçeneğinin sahte ölçüm, antrenman veya beslenme kaydı üretmediğini kontrol et.
- Başlangıç programı kurulduğunda gerçek antrenman geçmişi üretilmediğini ve programın düzenlenebilir olduğunu doğrula.

## Yayın kanıtı

- `npm run lint`
- `npm run build` (çekirdek, mağaza, yayın kalitesi ve performans kapıları)
- Mobil üretim URL'sinde ana akış duman testi
- Sürüm notu, mağaza metadatası ve politika sayfalarında aynı sürüm numarası
