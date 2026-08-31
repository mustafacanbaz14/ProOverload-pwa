# ProOverload kullanıcı deneyimi yol haritası

Amaç özellik azaltmak değil, aynı özellikleri daha az karar ve daha az gezinme
ile kullanılabilir hale getirmektir. PWA, localStorage, yedek biçimi ve mevcut
kayıtlar bütün sürümlerde korunur.

## Tamamlanan temel

v9.1–v10.12 arasında ana ekran, program oluşturma, beslenme, hedefler, arşiv,
ayarlar, aktif seans, tipografi, dokunma hedefleri ve kas haritası yeniden
düzenlendi. Aşağıdaki plan bu tamamlanmış çalışmayı tekrar etmez; kalan bilgi
mimarisi ve görev akışı sorunlarına odaklanır.

## Ortak tasarım kuralları

- Sık kullanılan eylem görünür ve yazılıdır; anlamı yalnız simgeden çıkarılmaz.
- Her görev için bir ana yol vardır, bağlamsal kısayollar erişim kolaylığı için korunur.
- Özet önce, karar gerekçesi sonra, ham veri en son gösterilir.
- İleri özellikler silinmez; ilgili görev içinde ikinci katmana alınır.
- Boş durumlar yalnız eksikliği değil, atılacak sonraki adımı söyler.
- Büyük yazı, 44 punto dokunma hedefi, açık/koyu tema ve iPhone güvenli alanı her yayında sınanır.
- Kalıcı veri şeması yalnız zorunluysa değişir; her değişiklik göç ve geri dönüş testi ister.

## 10.7 — Birleşik uygulama menüsü

Durum: Uygulandı.

- Üst çubuktaki üç metinsiz simgeyi yazılı “Ekle” ve “Menü” eylemlerine indir.
- Arama, ayarlar, araçlar ve beş ana bölümü tek uygulama menüsünde topla.
- Kullanıcının bulunduğu bölümü menüde açıkça işaretle.
- Hızlı kayıt, alt gezinme ve ekran içi kısayolları koru; hiçbir erişim yolunu kaldırma.
- Menü ve hızlı kayıt pencerelerini ilk açılış paketinden ayrı yüklemeye devam et.

## 10.8 — Günlük kayıt çalışma alanı

Durum: Uygulandı.

- Bugünün antrenman, kardiyo, beslenme, su, enerji, uyku ve ölçüm durumunu tek günlük özet altında birleştir.
- Aynı tarih bağlamını kayıt türleri arasında koru; geçmiş gün düzenlerken tarih sıçramasını kaldır.
- “Eksik kayıt” listesini suçlayıcı alarm yerine tamamlanabilir günlük kontrol listesi olarak göster.
- Hızlı kayıt sonrası kullanıcıyı geldiği ekrana veya ilgili gün özetine geri götür.
- Mevcut Beslenme, Gelişim ve Geçmiş ekranlarını ayrıntılı kullanım için koru.

## 10.9 — Yönlendirilmiş antrenman yaşam döngüsü

Durum: Uygulandı.

- Antrenman öncesi seçim, canlı seans ve seans sonu değerlendirmeyi kesintisiz tek akış yap.
- Canlı seansta yalnız sıradaki çalışma eylemini baskın tut; araçları hareket bağlamındaki menüde koru.
- Akıllı progresyon önerisini “öneri, dayanak, kabul/elle değiştir” biçiminde sun.
- Seans bitişinde rekor, hacim, süre, plan uyumu ve sonraki seans notunu tek kısa raporda birleştir.
- Bildirim/ses izinlerini antrenmandan önce denetlenebilir hale getir; seans ortasında sürpriz sessizliği azalt.

## 10.10 — Sade gezinme ve odaklı ayarlar

Durum: Uygulandı.

- Beş ana bölüm için üst menüdeki ikinci gezinme listesini kaldır; alt menüyü tek kaynak yap.
- Üst çubuktan hızlı kayıt, küresel arama ve ayarlara doğrudan erişim ver.
- Günlük kayıt merkezi ile araçlar kısayolunu küresel aramada koru.
- Ayarları telefonda tam ekran, tek sütunlu ve okunabilir kategori listesi olarak sun.
- Ayar ekranında bölüm geçişi göstermeyip kapsamını tercih, yöntem, cihaz, veri ve gizlilikle sınırla.
- PWA, localStorage ve mevcut yedek biçimini değiştirme.

## 10.11 — Günlük eylem hiyerarşisi

Durum: Uygulandı.

- Ana sayfada antrenman başlatmayı tek baskın eylem yap; diğer kısayolları ikincil katmana al.
- Koç metrikleri ve küçük yardımcı düğmelerde okunabilirliği ve dokunma alanını büyüt.
- Hızlı kayıt seçeneklerini renkli kart ızgarası yerine tek sütunlu, durum etiketli listeye çevir.
- Araç merkezini mobilde tam ekran yap; aramaya ek olarak kategori filtreleri sun.
- Ana bölüm, ayar, hızlı kayıt ve araç merkezi rollerini görsel olarak birbirinden ayır.
- PWA, localStorage ve yedek biçimini değiştirme.

## 10.12 — Ana sekmelerde okunabilirlik ve yönlendirme

Durum: Uygulandı.

- Antrenman, Beslenme, Gelişim ve Geçmiş ekranlarında ortak başlık hiyerarşisi kullan.
- Geçmiş kayıt türlerini sıkışık beş sütun yerine okunabilir, yatay filtreler olarak sun.
- Boş arşiv durumlarında ilgili kayıt eylemini; sonuçsuz aramada filtre temizlemeyi göster.
- Beslenmede veri giriş yolları ile kaydetme eylemini görsel olarak ayır.
- Kalori denklemi, makro etiketleri ve sık kullanılan beslenme kontrollerini büyüt.
- PWA, localStorage, hesaplama ve yedek biçimini değiştirme.

## 11.0 — Koç ve analiz karar katmanları

Durum: Planlandı.

- Koçta önce bugünün kararı, sonra en fazla üç gerekçe, ardından isteğe bağlı kanıt göster.
- Aynı ACWR, hacim veya toparlanma sinyalini farklı kartlarda tekrarlamayı kaldır.
- Analizleri “ne yapmalıyım, neden, hangi veriye dayanıyor” düzeninde grupla.
- Yetersiz veriyi olumsuz sonuç gibi göstermeyen ortak güven dili ve veri tamamlama önerisi kullan.
- Koç önerisinden ilgili ayar, program veya kayıt ekranına doğrudan geçiş ekle.

## 11.1 — Mağaza öncesi ilk kullanım ve erişilebilirlik

Durum: Planlandı.

- İlk açılışı hedef seçimi → ilk kayıt → ilk anlamlı özet görevleriyle ölç ve gereksiz adımları kaldır.
- VoiceOver/TalkBack sırası, klavye odağı, büyük yazı ve renk körlüğü senaryolarını yayın kapısına ekle.
- Çevrimdışı ilk açılış, PWA güncellemesi, yarım kalan antrenman ve yedek kurtarma akışlarını uçtan uca doğrula.
- Mağaza ekran görüntüleri için açık/koyu tema ile kadın/erkek görsel varyantlarını aynı bilgi hiyerarşisinde sabitle.
- Destek e-postası, gizlilik metni, hata raporu ve sürüm notlarını mağaza başvurusu öncesi tamamla.
