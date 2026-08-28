# ProOverload mağaza paketi

Bu klasör App Store ve Google Play başvurusunda kullanılacak metinleri, veri beyanı taslağını ve yayın kontrol listesini tek yerde tutar. Uygulama mağazaya gönderilmiş sayılmaz; PWA, iOS için doğrudan yüklenebilir bir App Store paketi değildir.

## Teknik yön

- Tek kod tabanını korumak için önerilen native katman: Capacitor.
- Kalıcı kimlikler: `tech.afacan.prooverload` (iOS Bundle ID ve Android package name).
- iOS üretim derlemesi Mac üzerinde Xcode 26 ve iOS 26 SDK veya üstüyle alınmalı.
- Google Play için 31 Ağustos 2026 sonrası hedef API 36 olmalı.
- Native paket eklenirken localStorage verisinin WebView kökeni değişebilir. Mevcut PWA kayıtları otomatik taşınmış varsayılmamalı; JSON dışa aktar / içe aktar akışı kabul testinin parçasıdır.

## Dosyalar

- `metadata.tr.json`: mağaza adı, kısa/uzun açıklama, anahtar kelimeler ve sabit kimlikler.
- `data-safety.md`: Apple App Privacy, Google Data Safety ve Health Apps beyanı için inceleme taslağı.
- `release-checklist.md`: hesap, paketleme, test ve gönderim sırası.

## Bilerek tamamlanmamış alanlar

`metadata.tr.json` içindeki `productionOrigin` ve `publicSupportEmail` uydurulmamıştır. Mağaza başvurusundan önce kalıcı alan adı ve kamuya açık gerçek iletişim kanalı eklenmelidir. Geçici Vercel deployment URL’si ürün kimliği olarak kullanılmamalıdır.
