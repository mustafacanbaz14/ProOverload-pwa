# ProOverload kullanıcı deneyimi yol haritası

Amaç özellik azaltmak değil, aynı özellikleri daha az karar ve daha az gezinme
ile kullanılabilir hale getirmektir. PWA, localStorage, yedek biçimi ve mevcut
kayıtlar bütün sürümlerde korunur.

## Tamamlanan temel

v9.1–v11.1 arasında ana ekran, program oluşturma, beslenme, hedefler, arşiv,
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

## 10.13 — Odaklı görev ekranları

Durum: Uygulandı.

- Basit görünümde antrenman önerisinin kanıtını ve kas haritasını isteğe bağlı katmana al.
- İlerleme bloklarını uzun liste yerine sayılı özet başlığıyla kapalı başlat.
- Program kurmada yönlendirmeli yolu öne çıkar; hazır ve elle kurma seçeneklerini ikinci katmanda koru.
- Vücut ekranında hızlı kaydetmeyi yukarı taşı; tarih, profil, kompozisyon ve oranları özet başlıklarına dönüştür.
- Geçmişe kayıt eklemeyi sürekli kart yerine başlık eylemiyle açılan panele çevir.
- Şablon ve su kontrollerindeki küçük dokunma hedeflerini büyüt.
- PWA, localStorage, hesaplama ve yedek biçimini değiştirme.

## 10.14 — Sade şablon düzenleme

Durum: Uygulandı.

- Mobil hareket seçicide listeyi modal kartının içinde tut; ekran dışına taşma ve görünmez liste hatasını kapat.
- Şablon kartlarında Düzenle eylemini doğrudan göster; seyrek bakım işlemlerini tek Diğer İşlemler katmanında topla.
- Editörde temel hareket, set, sıra ve kaydetme işini öne al; hacim ve uzman araçlarını isteğe bağlı başlıkta koru.
- Hareket başına küçük simge sırasını büyük, anlamı açık kontroller ve tek işlem paneliyle değiştir.
- Elle hazırlanan taslağı geri açarken kullanıcıyı istemeden sihirbaz kipine geçirme.
- Ana sayfanın basit görünümünde şablon bakım düğmelerini azalt; tam yönetimi Antrenman bölümünde açık tut.
- PWA, localStorage, mevcut şablonlar ve yedek biçimini değiştirme.

## 10.15 — Tek görevli günlük ekranlar

Durum: Uygulandı.

- Basit Beslenme özetinde teknik dört parçalı denklemi üç anlaşılır değere indir; tam denklem Detaylı görünümde kalsın.
- Günlük toplam seçildiğinde kullanıcıyı doğrudan makro editörüne götür; boş ilk öğünü kendiliğinden açma.
- Beslenmede aynı anda görünen ikinci kaydetme düğmesini kaldır; günlük kayıt için tek birincil eylem kullan.
- Su hedefi, enerji dengesi, yedi günlük tablo ve gerçek harcamayı tek Takip ve Analiz katmanında topla.
- Basit Vücut ekranında yinelenen alt kaydetme düğmesini kaldır; bütün ölçüm alanları ve hedefler korunmaya devam etsin.
- Basit Antrenman ekranında üç aşama rehberini kısa göster; aktif seans ve rapor aşamalarını değiştirme.
- Koçta plan veya kardiyo yokken yinelenen Serbest Başlat eylemini kaldır; ana sayfanın tek baskın başlatma düğmesini kullan.
- Basit Arşivde işlev öğretmeyen açıklama kartını gizle; arama, tür filtreleri, kalori detayı ve geçmişe ekleme görünür kalsın.
- PWA, localStorage, hesaplama ve yedek biçimini değiştirme.

## 10.16 — Okunur analiz ve sade aktif seans

Durum: Uygulandı.

- Altı analiz türünü tek dar satır yerine ikonlu, 3×2 ve 44 piksellik dokunma hedefli düzende göster.
- Seçili analizin hangi soruyu cevapladığını kısa bağlam satırıyla açıkla.
- Basit görünümde hacim, derin koç ve ileri beslenme analizlerini kapalı başlat; bütün kartları tek dokunuşla koru.
- 1RM hareketi seçildikten sonra uzun seçim listesini kapat; grafik ve değiştirme erişimini görünür tut.
- Aktif seansta ısınma, not, şablon planı ve kas katkısını hareket başına tek ayrıntı alanında topla.
- Ağrı, vücut ağırlığı hesabı, kurulum ve progresyon gibi set güvenliğini etkileyen bilgileri görünür bırak.
- Detaylı görünüm, PWA, localStorage, hesaplama ve yedek biçimini değiştirme.

## 10.17 — Daha kısa günlük akışlar

Durum: Uygulandı.

- Basit ana ekranda üst çubuktaki Ekle ile yinelenen Günlük kısayolunu kaldır; Program ve Araçlar erişimini koru.
- Kas haritasını Haftalık Durum paneline taşı; basit görünümde isteğe bağlı, detaylı görünümde açık başlat.
- Beslenmede Besin Ekle, Günlük Toplam ve Kaydet eylemlerini tek baskın giriş katmanı olarak bırak.
- Basit editörde iki mod sekmesini tek giriş şekli değiştirme kontrolüne indir.
- Boş öğün ve güne özel NEAT ayarını şablon/kopyalama araçlarıyla aynı Diğer kayıt yolları çatısında topla.
- Güne özel hareket ayarından editöre otomatik kaydır ve ilgili paneli açık getir.
- Detaylı görünüm, PWA, localStorage, hesaplamalar ve yedek biçimini değiştirme.

## 10.18 — Tek seçimli sade ekranlar

Durum: Uygulandı.

- Basit analiz görünümünde altı eş zamanlı sekmeyi tek açıklamalı mobil seçiciye indir; Detaylı görünümü koru.
- Basit arşiv görünümünde beş kayıt filtresini seçili türün sayısını ve amacını gösteren tek kontrole indir.
- Vücut ekranında günlük kaydetmeyi hedef ve kıyaslama araçlarından önce göster.
- Hedef, geçmiş kıyaslama ve hesaplama ayarlarını tek Ölçüm Araçları başlığında topla.
- Üst çubukta uygulama adının 393 piksel telefonda kesilmesini gider; Ekle, Ara ve Ayarlar dokunma hedeflerini koru.
- PWA, localStorage, hesaplama, detaylı görünüm ve yedek biçimini değiştirme.

## 10.19 — Odaklı antrenman ve sade kardiyo

Durum: Uygulandı.

- Basit Antrenman ekranını Bugün, Program ve Şablonlar amaçlarına ayır; detaylı görünümde bütün alanları birlikte koru.
- Günlük başlatma ve son seansı tekrarlamayı program oluşturma ile şablon bakımından ayır.
- Kardiyo alt gezinmesini Bugün, Plan ve Geçmiş diliyle günlük göreve göre adlandır.
- Kardiyo amacını taşan yatay düğmeler yerine bütün seçenekleri gösteren yerel seçiciye dönüştür.
- Nabız bölgeleri, hesap yöntemi ve sabah ölçümünü basit görünümde tek isteğe bağlı teknik alana taşı.
- Geçmiş kardiyoda son kayıtları önde; tempo, şablon ve rekorları tek analiz katmanında tut.
- Şampanya ve Gül vurgu renklerine koyu/açık temalı Safir paletini ekle ve bütün profillere aç.
- PWA, localStorage, hesaplamalar, detaylı görünüm ve yedek biçimini değiştirme.

## 10.20 — Odaklı beslenme ve anlaşılır gelişim

Durum: Uygulandı.

- Basit Beslenme ekranını Kayıt, Özet ve Analiz amaçlarına ayır; aynı anda yalnız seçilen işi göster.
- Varsayılan Kayıt alanında besin arama, günlük toplam, su, öğün ve tek kaydetme eylemini koru.
- Kaydetme düğmesini giriş alanının sonuna taşı; seyrek şablon, kopyalama ve güne özel hareket yollarını günlük işten sonra göster.
- Kalori hedefi ve makro özetini ayrı Özet görünümünde tek mobil ekrana sığdır.
- Enerji dengesi, 7 günlük tablo ve gerçek harcamayı yalnız Analiz istendiğinde aç.
- Gelişim merkezinde Vücut & Hedefler / Analizler dilini basit modda Ölçüm / Analiz olarak kısalt.
- Gelişim başlığını seçilen göreve göre Ölçüm ve hedefler, İlerlemeni incele veya Döngü takibi olarak değiştir.
- Dokunma hedeflerini, erişilebilir basılı durumlarını ve açıklayıcı alt metinleri koru.
- Detaylı görünümde bütün beslenme, ölçüm, analiz ve döngü işlevlerini birlikte göstermeye devam et.
- PWA, localStorage, hesaplamalar ve yedek biçimini değiştirme.

## 10.21 — Güvenli antrenman önerileri ve katmanlı arşiv

Durum: Uygulandı.

- Şablon sıralamasını öneri zorunluluğundan ayır; yeterli veri ve belirgin fark yoksa öneri gösterme.
- Aktif programdaki bugünkü seansı algoritmik seçim gibi değil, kullanıcının planı olarak etiketle.
- Tamamlanmış seans, toparlanma engeli ve güncel ağrı yüklenmesinde öneri kartını bastır.
- Basit Antrenman ekranından yinelenen hazırlık şemasını kaldır ve seçilen amaca göre başlığı değiştir.
- Serbest başlatma ile son seansı tekrarlamayı güveni sınırlı hacim önerisinin önünde tut.
- Geçmiş aramasını ikincil enerji aracından önce göster.
- Basit antrenman ve beslenme arşiv kartlarında yoğun ayrıntıları tek dokunuşla açılır hale getir.
- Ay değiştiren haftayı bölmeden, en yeni gerçek kayıt tarihinin ayı altında göster.
- Öneri yokluğu, yakın puan, plan ayrımı ve tarih klasörlemesini regresyon testine bağla.
- PWA, localStorage, hesaplamalar, detaylı görünüm ve yedek biçimini değiştirme.

## 11.0 — Koç ve analiz karar katmanları

Durum: Uygulandı.

- Koçta önce yapılacak işi, sonra en fazla üç farklı konu, ardından isteğe bağlı kanıt ve güven sınırını göster.
- Deload, ağrı, düşük hazır oluşluk ve düşük uyumla çelişen hacim tavsiyelerini gerçek karar anahtarı üzerinden sustur.
- Yetersiz veriyi olumsuz performans sonucu gibi göstermeyen ortak dil ve veri tamamlama adımları kullan.
- Boş Bugün döneminde başlamayıp ilk dolu zaman ufkunu otomatik seç.
- Belirsiz “Aç” düğmeleri yerine hedefi yaz; koçtan kayıt, program, ayar ve karar defterine doğrudan geç.
- Hacim çelişkisi, veri yönlendirmesi, konu çeşitliliği ve eksik veri dilini regresyon testine bağla.
- PWA, localStorage, hesaplamalar ve yedek biçimini değiştirme.

## 11.1 — Mağaza öncesi ilk kullanım ve erişilebilirlik

Durum: Uygulandı. Kamuya açık destek e-postası mağaza başvurusu öncesinde
ürün sahibi tarafından ayrıca tanımlanacak.

- İlk açılışı hedef seçimi → ilk kayıt → özet biçiminde üç adıma indir; ilk iş olarak ölçüm, antrenman, beslenme veya uyku ekranını doğrudan aç.
- Kullanıcı kurulumdan çıkınca ya da başlangıç programı seçince sahte sağlık veya antrenman geçmişi oluşturma.
- VoiceOver/TalkBack ilişkileri, klavye odak kapanı, ana içeriğe geç bağlantısı, büyük yazı, azaltılmış hareket ve yüksek kontrast senaryolarını yayın kapısına ekle.
- Çevrimdışı durumu uygulama ve canlı seans içinde görünür tut; aktif seansta bekleyen PWA güncellemesinin ne zaman uygulanacağını açıkla.
- Acil yedek akışını koru; kişisel kayıt içermeyen hata tanısını kopyalama ve destek sayfasına erişim ekle.
- Güncelleme merkezini dialog, sekme ve panel ilişkileriyle ekran okuyucuya anlaşılır hale getir.
- Mağaza ekran görüntüleri için açık/koyu tema ile kadın/erkek görsel varyantlarını aynı bilgi hiyerarşisinde sabitle.
- Gizlilik, destek ve koşul metinlerini sürümle; kamuya açık destek e-postasını mağaza gönderiminden önce tamamlanacak manuel iş olarak bırak.
