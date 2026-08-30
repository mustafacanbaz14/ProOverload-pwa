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

- Kilo, yağ oranı, FFMI, çevre, kaliper ve güç hedeflerini tek hedef merkezinde topla.
- İlişkili hedeflerin otomatik hesaplanan ve kullanıcı tarafından sabitlenen alanlarını ayır.
- Arşivi ay → hafta → gün düzeninde, ortak arama ve filtrelerle sadeleştir.
- Vücut, antrenman, kardiyo, beslenme ve enerji geçmişini aynı tarih dilinde göster.
- Düzenleme ve karşılaştırma eylemlerini kayıt kartından tek dokunuşla aç.

## 9.5 — İlk kullanım, ayarlar ve mağaza kalitesi

- İlk açılışta kısa kurulum, örnek veri ve tamamlanabilir başlangıç kontrol listesi sun.
- Ayarları ara, kategoriye göre filtrele ve ilgili ekrandan bağlamsal ayara git.
- Yardım metinlerini kısa açıklama + isteğe bağlı ayrıntılı rehber olarak iki katmanlı yap.
- Erişilebilirlik, çevrimdışı kullanım, güncelleme, yedek/geri yükleme ve veri kaybı senaryolarını mağaza sürümü öncesi uçtan uca test et.
- Her yayın için sürüm notu, performans bütçesi ve mobil görsel regresyon kontrolü uygula.
