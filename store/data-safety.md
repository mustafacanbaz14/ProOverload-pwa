# Veri güvenliği ve sağlık beyanı taslağı

Bu belge başvuru formunun yerine geçmez. Son native paket, izinler ve üçüncü taraf kütüphaneler incelendikten sonra cevaplar yeniden doğrulanmalıdır.

## Mevcut veri akışı

| Veri / özellik | Saklama veya aktarım | Amaç |
| --- | --- | --- |
| Antrenman, kardiyo, beslenme, vücut, uyku, ağrı, adet döngüsü | Cihazdaki localStorage | Kullanıcıya takip ve analiz sunmak |
| JSON / CSV / Apple Health / Google Fit dışa aktarımı | Kullanıcının başlattığı yerel dosya | Veri taşınabilirliği |
| Besin arama metni veya barkod | Doğrudan Open Food Facts API’sine | Ürün ve besin değeri bulmak |
| Kamera görüntüsü | Cihazda geçici barkod çözümü; ProOverload saklamaz | Barkod okumak |
| PWA statik dosyaları | Service worker önbelleği | Çevrimdışı çalışma ve hızlı açılış |

Mevcut sürümde kullanıcı hesabı, ProOverload sunucusu, reklam SDK’sı veya üçüncü taraf analiz SDK’sı yoktur.

## Google Play Health Apps beyanı

Uygulamanın özelliklerine göre en az şu başlıklar kapsam içindedir:

- Activity and Fitness
- Nutrition and Weight Management
- Period Tracking
- Sleep Management
- Stress Management, Relaxation, Mental Acuity

Uygulama tıbbi cihaz olarak sunulmamalıdır. Mağaza açıklamasında şu anlam korunmalıdır: “Bu uygulama tıbbi cihaz değildir; herhangi bir hastalığı teşhis, tedavi, iyileştirme veya önleme amacı taşımaz. Tıbbi tavsiye için sağlık profesyoneline başvurun.”

## Google Data Safety incelemesi

Yerel sağlık kayıtlarının geliştirici sunucusuna gitmemesi önemli bir ayrımdır; yalnız cihazda işlenen veri her durumda “developer tarafından collected” sayılmaz. Buna rağmen Open Food Facts sorguları üçüncü tarafa ağ üzerinden gider. Son beyan şu kontrollerden sonra yapılmalıdır:

1. Native paketin eklediği SDK ve telemetri var mı?
2. Capacitor WebView veya çökme raporlama aracı cihaz kimliği gönderiyor mu?
3. Open Food Facts sorgusunda arama metni/barkod dışında parametre ekleniyor mu?
4. Kamera izni yalnız kullanıcı eylemi sırasında mı isteniyor?
5. Kullanıcı yerel veriyi silebiliyor ve yedekleyebiliyor mu?

## Apple App Privacy incelemesi

App Privacy formunda “collect”, cihaz dışına aktarım ve geliştirici/üçüncü tarafın erişimi açısından değerlendirilmelidir. Yerel antrenman ve sağlık kayıtlarını otomatik olarak “toplanıyor” diye işaretlemek de “hiç veri aktarılmıyor” demek de son paket görülmeden güvenilir değildir. Open Food Facts ve eklenecek native SDK’lar üçüncü taraf olarak değerlendirilmelidir.

HealthKit veya Health Connect ileride eklenirse ilgili sağlık veri türleri, amaç metinleri, izin kapsamı ve silme akışı bu belge ile iki mağaza beyanında güncellenmelidir.
