# ProOverload kullanıcı deneyimi yol haritası

Bu planın amacı özellik azaltmak değil, sık kullanılan işleri öne çıkarıp ileri
seviye ayrıntıları ihtiyaç anında göstermektir. PWA, localStorage ve mevcut veri
şemaları sürümler boyunca korunur.

## Tasarım ilkeleri

- Basit mod varsayılandır; ayrıntılı mod bütün ileri kontrolleri açık tutar.
- Her ekranda tek bir baskın eylem ve en fazla üç hızlı eylem bulunur.
- Uzun analizler kaybolmaz; anlamlı bir özetin arkasında açılır.
- Aynı iş farklı sekmelerden erişilebilir, fakat aynı ekranda gereksiz tekrar edilmez.
- Boş durumlar kullanıcıya bir sonraki işi söyler; teknik terimler kısa açıklama taşır.
- Dokunma hedefi, yazı boyutu, kontrast ve iPhone güvenli alanları her sürümde test edilir.

## 9.1 — Bugün odaklı ana ekran

Durum: Uygulandı.

- Koç kartının karar, plan ve ana eylemi ilk bakışta kalır.
- Kapasite, uzun öneriler ve koç defteri basit modda “Koç ayrıntıları” altında açılır.
- Antrenman, hızlı kayıt ve araçlar görev odaklı üç kısayolda toplanır.
- Hazır oluşluk, deload, kas haritası, ACWR, itme/çekme ve kas hacmi tek “Haftalık Durum” bölümünde korunur.
- Haftalık bölüm basit modda kapalı, ayrıntılı modda açık başlar.
- Ağır SVG kas haritası yalnız ayrıntı açıldığında yüklenir.

## 9.2 — Antrenman ve program oluşturma akışı

Durum: Uygulandı.

- Şablon, sihirbaz ve hareket kütüphanesini tek yönlendirilmiş akışta birleştir.
- Program amacı → günler → hareketler → setler → haftalık kontrol adımlarını kullan.
- Taslağı otomatik koru; çıkıp dönünce kayıp yaşanmasın.
- Hareket ekleme, değiştirme ve sıralamayı aynı satırda erişilebilir yap.
- Mevcut programı sihirbazla düzenlemeyi, sıfırdan kurmakla aynı kolaylığa getir.

## 9.3 — Beslenme ve enerji sadeleştirmesi

Durum: Uygulandı.

- Günlük hedef, alınan, yakılan ve kalan enerjiyi tek denklemde göster.
- Besin, öğün toplamı, barkod ve manuel günlük toplamı tek hızlı ekleme kapısından aç.
- Makro ayrıntıları, TEF, NEAT ve enerji kaynaklarını kademeli göster.
- Geçmiş gün düzenlemelerini gün özetinden doğrudan erişilebilir yap.
- Belirsiz tahminleri kesin veri gibi göstermeyip kaynak ve güven düzeyiyle işaretle.

## 9.4 — Gelişim, hedefler ve arşiv

Durum: Uygulandı (v9.5 birleşik yayını).

- Kilo, yağ oranı, FFMI, çevre, kaliper ve güç hedeflerini tek hedef merkezinde topla.
- İlişkili hedeflerin otomatik hesaplanan ve kullanıcı tarafından sabitlenen alanlarını ayır.
- Arşivi ay → hafta → gün düzeninde, ortak arama ve filtrelerle sadeleştir.
- Vücut, antrenman, kardiyo, beslenme ve enerji geçmişini aynı tarih dilinde göster.
- Düzenleme ve karşılaştırma eylemlerini kayıt kartından tek dokunuşla aç.

## 9.5 — İlk kullanım, ayarlar ve mağaza kalitesi

Durum: Uygulandı.

- İlk açılışta kısa kurulum, örnek veri ve tamamlanabilir başlangıç kontrol listesi sun.
- Ayarları ara, kategoriye göre filtrele ve ilgili ekrandan bağlamsal ayara git.
- Yardım metinlerini kısa açıklama + isteğe bağlı ayrıntılı rehber olarak iki katmanlı yap.
- Erişilebilirlik, çevrimdışı kullanım, güncelleme, yedek/geri yükleme ve veri kaybı senaryolarını mağaza sürümü öncesi uçtan uca test et.
- Her yayın için sürüm notu, performans bütçesi ve mobil görsel regresyon kontrolü uygula.

## 9.6 — Ayarlar ve enerjiye kısa erişim

Durum: Uygulandı.

- Ayarlar açıldığında bütün kontrolleri tek uzun sayfaya yığmak yerine sekiz konu kartı göster.
- Veri aktarımı ile koç/hesap yöntemlerini ayrı başlıklara ayır; kategori içinden tek dokunuşla geri dön.
- Aramayı kategori adları, açıklamalar ve günlük kullanılan terimler üzerinden çalıştır.
- Kalori ayrıntısını ana ekran, Beslenme ve Geçmiş içinden görünür metinli kısayollarla aç.
- Geçmişteki bir beslenme kaydından doğrudan seçilen günün harcama dökümüne geç.
- Gün Gün enerji tablosunun erişimini son 60 günden son 365 güne çıkar; mevcut güne özel NEAT düzenleme işlevini koru.

## 9.7 — Aktif antrenman sadeliği

Durum: Planlandı.

- Aktif antrenmanda sıradaki set, kilo, tekrar ve RIR girişini tek baskın çalışma alanında topla.
- Isınma, not, plaka, süperset ve hareket değiştirme işlevlerini bağlamsal ikinci katmana al.
- Dinlenme sayacını seans akışına sabitle; ses ve bildirim sorunlarını aynı yerde tanılanabilir yap.
- Tek elle kullanım, büyük yazı ve iPhone güvenli alanlarını gerçek seans akışıyla doğrula.

## 9.8 — Koç ve analiz karar hiyerarşisi

Durum: Planlandı.

- Koç ekranında önce karar, sonra gerekçe, en sonda ham veri düzenini kullan.
- Aynı sinyali farklı kartlarda tekrarlamak yerine tek kaynak ve bağlamsal kısayollar oluştur.
- Analizleri “şimdi ne yapmalıyım?” sorusuna göre gruplandır; bilimsel ayrıntıları açılır kanıt katmanında koru.
- Eksik veriyi risk veya başarısızlık gibi göstermeyen ortak güven dili kullan.

## 9.9 — Günlük kayıt ve arşiv akışı

Durum: Planlandı.

- Antrenman, kardiyo, beslenme, enerji, vücut ve uyku için ortak günlük merkez oluştur.
- Kayıt ekleme ve düzenlemeyi aynı tarih bağlamında tut; sekmeler arası gidip gelmeyi azalt.
- Arşiv araması, kayıt türü ve tarih filtrelerini kalıcı olmayan tek kontrol satırında birleştir.
- Ay → hafta → gün katmanlarını küçük ekran ve büyük yazıda yeniden doğrula.

## 10.0 — Mağaza öncesi ürün bütünlüğü

Durum: Planlandı.

- Alt gezinme, başlık, modal ve boş durumlar için ortak tasarım bileşenleri ve metin dili uygula.
- İlk kullanım turunu gerçek görevlerle ölç; kurulumdan ilk kayda kadar gereksiz adımları kaldır.
- Erişilebilirlik, çevrimdışı açılış, PWA güncelleme, yedek kurtarma ve performans bütçesini yayın kapısına bağla.
- App Store ve Play Store ekran görüntülerinden önce karanlık/açık tema ve kadın/erkek görsel varyantlarını uçtan uca denetle.
- Hiçbir mevcut kayıt türünü veya ileri özelliği kaldırmadan v10 ürün yüzeyini sabitle.
