import { APP_VERSION } from './constants.js';

const item = (title, desc) => ({ title, desc });
const release = (version, date, title, items) => ({ version, date, title, items });

/**
 * Sürüm notları constants.js içinde tek ve giderek büyüyen bir dizi olarak
 * tutuluyordu. Son güncelleme penceresi bu yüzden 6.0'dan bugüne her maddeyi
 * "yeni" diye gösteriyordu. Burada sürümler gerçek gruplar halinde ve yalnız
 * bu pencere açıldığında indirilen ayrı parçada tutulur.
 */
const RELEASE_8_2 = release('8.2', '2026-08-27', 'Hareket İlerleme Blokları', [
  item('Hareket İlerleme Blokları', 'Her hareket için başlangıç yükü, hedef, hafta, seans sıklığı, set, tekrar bandı ve RIR içeren ayrı bir çok haftalı blok kurulabiliyor.'),
  item('Beş Yükleme Modeli', 'Çift ilerleme, RIR oto-regülasyon, tepe set + geri çekme, ağır–orta–hafif dalga ve teknik/sabit yük modelleri ayrı reçeteler üretiyor.'),
  item('Seans Seans Blok Takvimi', 'Üç ila on iki haftalık takvimde her seansın set, yük, tekrar, RIR ve fazı önceden görülebiliyor.'),
  item('Geçmişten Güvenli Başlangıç', 'Blok formu son tamamlanan performansı ve harekete özel tekrar bandını başlangıç önerisi olarak kullanıyor; vücut ağırlıklı harekette ek yük ile toplam yük karıştırılmıyor.'),
  item('Özel Mikro Yük Adımı', 'Hareket başına 0,25–20 kg artış adımı seçilebiliyor ve bütün reçeteler kullanılabilir yük adımına yuvarlanıyor.'),
  item('Somut Performans Hedefi', 'Hedef kilo, tekrar ve RIR birlikte saklanıyor; ETA hesabı bu birleşik hedefin tahmini 1RM karşılığına göre çalışıyor.'),
  item('Eğilimden ETA ve Güven', 'En az dört ölçümlü seans olduğunda doğrusal e1RM eğiliminden tahmini hedef tarihi ve düşük/orta/yüksek güven düzeyi çıkarılıyor; veri yetmiyorsa tarih uydurulmuyor.'),
  item('Tepe Set ve Back-off Reçetesi', 'Bir ağır tepe setinin ardından seçilebilir yüzdeyle hafifleyen hacim setleri tek reçetede gösteriliyor.'),
  item('İsteğe Bağlı Hafifletme Haftası', 'Son hafta tam antrenman kesintisi dayatmak yerine yaklaşık yüzde 10 yük ve yüzde 50 set azaltımı seçilebiliyor.'),
  item('Kaçırılan Hedef Toparlama Merdiveni', 'Tek kötü seans alarm veya yük düşüşü üretmiyor; hedef bir kez tekrarlanıyor, iki ardışık belirgin kaçırmada yük yalnız yüzde 5 geri çekiliyor.'),
  item('RIR ile Gerçek Oto-regülasyon', 'RIR modelinde son seansın ortalama yedek tekrarı hedefle karşılaştırılıyor; anlamlı farkta yük bir adım artıyor veya azalıyor.'),
  item('Hazır Oluşa Özel Günlük Ayar', 'Kritik/orta hazır oluş ve etkin deload yalnız o günün reçetesini değiştiriyor; blok takvimi ve geçmiş hedefleri yeniden yazılmıyor.'),
  item('Aktif Antrenmanda Donmuş Reçete', 'Seans başlarken o güne ait hedef hareket kaydına donduruluyor. Plan daha sonra değişse bile geçmişte ne hedeflendiği korunuyor.'),
  item('Boş Setlere Tek Dokunuş', 'Reçete yalnız boş çalışma setlerinin kilo ve RIR alanlarını dolduruyor, eksik set yuvalarını ekliyor; girilmiş kilo, tekrar ve tamamlanmış setleri ezmiyor.'),
  item('Canlı ve Tarihsel Uyum', 'Aktif seansta kaç hedef setin tutulduğu canlı izleniyor; kaydedilen seanslardan blok uyum yüzdesi, tam/kısmi/kaçan hedef dağılımı üretiliyor.'),
  item('Merkezi Blok Panosu', 'Antrenman Merkezi bütün etkin blokları sıradaki reçete, tamamlanan seans ve uyum oranıyla tek listede gösteriyor; satıra dokununca hareket profili açılıyor.'),
  item('Geçmişi Korumalı Yeni Döngü', 'Tamamlanan veya değiştirilecek blok tek dokunuşla yeni kimlik ve bugünün tarihiyle yeniden başlatılabiliyor; eski seans reçeteleri geçmişte kalıyor.'),
  item('Yedek ve İçe Aktarma Koruması', 'Plan reçetesi ve set hedef anlık görüntüsü localStorage ile yedekte korunuyor; bozuk dış veriler güvenli biçime normalleştiriliyor.'),
]);

const RELEASE_8_3 = release('8.3', '2026-08-27', 'İlk Açılış Performansı ve Kod Bölme', [
  item('İlk Açılış Paketi %26 Küçüldü', 'Ana uygulama parçası yaklaşık 1,12 MB’tan 0,82 MB’a indirildi. Ağır ekran kodları artık uygulama ilk açılırken değerlendirilmek zorunda değil.'),
  item('Sekme Bazlı Kod Bölme', 'Antrenman, beslenme, gelişim ve arşiv ekranları ayrı parçalara ayrıldı; yalnız kullanıcı ilgili sekmeye geçtiğinde çalıştırılıyor.'),
  item('Analizleri İkinci Kez Bölme', 'Gelişim Merkezi içindeki vücut, ayrıntılı analiz ve kadın döngüsü ekranları da birbirinden ayrıldı. Analiz ekranını açmak diğer iki ekranı gereksiz yere çalıştırmıyor.'),
  item('Seyrek Araçları Geç Yükleme', 'Hızlı Kayıt ve Hazır Programlar pencereleri ilk açılış paketinden çıkarıldı; yalnız gerçekten açıldıklarında yükleniyor.'),
  item('Kesintisiz Yükleme İskeleti', 'Ayrı parçalar indirilirken boş veya donmuş ekran yerine temaya uyumlu hafif bir hazırlık görünümü gösteriliyor.'),
  item('Hareket Kütüphanesi Kademeli Render', '252 hareketi aynı anda DOM’a basmak yerine ilk 40 hareket gösteriliyor; sonraki gruplar tek dokunuşla ekleniyor. Arama ve kas filtreleri tam veri üzerinde çalışmaya devam ediyor.'),
  item('Şablon Kütüphanesi Kademeli Render', 'Büyük program arşivlerinde ilk 12 şablon çiziliyor; arama, favoriler ve düzenleme özellikleri korunarak sonraki şablonlar isteğe göre açılıyor.'),
  item('Build Performans Bütçesi', 'İlk JavaScript, gzip, CSS ve en büyük geç yüklenen parça için sınırlar eklendi. Gelecek bir değişiklik paketi yeniden şişirirse yayın derlemesi artık otomatik olarak duruyor.'),
  item('Makine Tarafından Okunabilir Rapor', 'Her üretim derlemesi dist/performance-report.json dosyasına gerçek ilk yük, gzip ve parça ölçülerini yazıyor.'),
  item('PWA Önbellek Bakımı', 'Eski Workbox önbellekleri otomatik temizleniyor; ekran parçaları çevrimdışı kullanım için önbellekte korunurken büyük barkod motoru kontrollü çalışma zamanı önbelleğinde tutuluyor.'),
  item('Çekirdek Antrenman Yolu Korundu', 'Ana sayfa ve aktif antrenman ekranı çekirdek pakette bırakıldı. İkincil bir ekran indirilirken devam eden seansın görünürlüğü veya set kaydı askıya alınmıyor.'),
  item('Gerçek İlk Yük Bağımlılık Hesabı', 'Bütçe kontrolü yalnız index dosyasına bakmıyor; Vite manifest üzerinden React ve ikon gibi statik bağımlılıkları da ilk yük toplamına katıyor.'),
  item('Gerçek Gzip Ölçümü', 'Sıkıştırılmış bütçe dosya boyutundan tahmin edilmiyor; üretilen her ilk-yük dosyası gzip ile yeniden sıkıştırılıp toplam ağ boyutu ölçülüyor.'),
  item('Çevrimdışı Navigasyon Güvencesi', 'Yeni ekran parçaları varken doğrudan açılan PWA yolları index uygulama kabuğuna düşüyor ve eski sürüm önbellekleri yükseltme sonrasında temizleniyor.'),
]);

const RELEASE_8_5 = release('8.5', '2026-08-28', 'Güven Aralıklı İlerleme ve Tarihsel Veri Güveni', [
  item('Aykırı Değere Dayanıklı Eğilim', 'Hedef tahmini tek bir sıra dışı seansın çizgiyi sürüklemesini azaltan Theil–Sen eğilimiyle hesaplanıyor.'),
  item('Asgari Veri Eşiği', 'Uygulama artık en az altı geçerli seans ve 21 günlük zaman açıklığı olmadan hedef tarihi uydurmuyor.'),
  item('Üç Ayrı Hedef Senaryosu', 'İyimser, mevcut eğilim ve temkinli senaryolar tek kesin tarih yerine başlangıç–bitiş aralığı üretiyor.'),
  item('Geriye Dönük Tahmin Testi', 'Motor geçmiş seride bir sonraki performansı saklayarak tahmin ediyor; ortalama kg hatası kullanıcıya açıkça gösteriliyor.'),
  item('Çok Sinyalli Güven Puanı', 'Güven seviyesi yalnız R² ile değil seans sayısı, zaman açıklığı, uyum ve geriye dönük hata kalitesiyle belirleniyor.'),
  item('Planlı Deload Süzgeci', 'Bilerek hafifletilen seanslar kalıcı güç kaybı gibi yorumlanıp hedef eğilimini aşağı çekmiyor.'),
  item('Frekans ve Uyum Bağlamı', 'Gerçek seans sıklığı, planlanan sıklık ve blok uyumu tahminin yanında görünür bağlam olarak tutuluyor; nedensellik iddiası yapılmıyor.'),
  item('Tahmin Anlık Görüntüleri', 'Bloklu bir seans kaydedildiğinde o günkü hedef aralığı donduruluyor; aynı gün yinelenmiyor ve son 36 tahmin saklanıyor.'),
  item('Tahmin Geçmişi Arayüzü', 'Hareket profilinde son üç tahmin aralığı gösteriliyor; tahminin zaman içinde yakınlaşıp uzaklaştığı izlenebiliyor.'),
  item('İmzalı Enerji Geçmişi', 'Kaydedilen günlük enerji dökümü hesap girdisi imzasıyla saklanıyor; sonraki genel NEAT ayarı veya yeni vücut ölçümü eski günü değiştirmiyor.'),
  item('Bilinçli Yeniden Hesaplama', 'Geçmiş günün makrosu, adımı veya aktivitesi gerçekten düzenlenirse imza değişiyor ve yalnız o gün yeniden hesaplanıyor.'),
  item('Seans Günü Vücut Bağlamı', 'Yeni antrenmanlar kilo, BMR, yağ oranı, FFM ve FFMI bağlamını tarihsel anlık görüntü olarak saklıyor.'),
  item('Geçmiş Kalori Düzeltmesi', 'Ağırlık ve kardiyo kalorisi yeni ölçümle geçmişe doğru değişmek yerine varsa kayıt günündeki kilo snapshotını kullanıyor.'),
  item('Yedek Şeması v5', 'Koleksiyonlar tek kayıt defterinden yedekleniyor; bozuk dizi, ayar ve tahmin geçmişi güvenli ve idempotent biçimde onarılıyor.'),
  item('İki Yeni Sorumluluk Hook’u', 'İlerleme blokları ile tarihsel enerji hesapları App bileşeninden ayrıldı; aynı kuralın farklı ekranlarda sapma riski azaltıldı.'),
  item('Aktif Antrenmanı Geç Yükleme', 'Aktif seans ekranı yalnız antrenman başlatıldığında indiriliyor; ana sayfanın ilk açılış işi azaltıldı.'),
  item('Olay Bazlı Kod Bölme', 'Program kurucu, CSV, takvim ve program kodu araçları yalnız ilgili düğmeye basıldığında yükleniyor.'),
  item('Daha Sıkı Performans Bütçesi', 'Ölçülen yeni ilk yük temel alınarak JavaScript sınırı 900 KB’den 820 KB’ye, gzip sınırı 305 KB’den 285 KB’ye indirildi.'),
  item('İstatistiksel Sınırların Açıklanması', 'Hedef aralığı ve hata değeri tahmin olarak etiketleniyor; uygulama sonucu garanti eden bir tarih göstermiyor.'),
]);

const RELEASE_8_6 = release('8.6', '2026-08-28', 'Mağaza Hazırlığı ve Ürün Güveni', [
  item('Mağaza Hazırlık Merkezi', 'Ayarlar içinde web temeli, Apple App Store ve Google Play adımları ayrı ilerleme oranlarıyla izleniyor.'),
  item('Kalıcı Hazırlık Kontrolü', 'Geliştirici hesabı, paketleme, ekran görüntüsü ve mağaza beyanı gibi elle tamamlanan maddeler cihazda saklanıyor; otomatik maddeler değiştirilemiyor.'),
  item('Yanlış Hazır İddiası Yok', 'PWA yayını mağaza yayını gibi gösterilmiyor. iOS native paket, Xcode build’i veya Android AAB yoksa merkez bunu açık engel olarak tutuyor.'),
  item('Uygulama İçi Gizlilik', 'Gizlilik politikası Ayarlar’dan tek dokunuşla ve uygulamadan bağımsız doğrudan URL ile açılıyor.'),
  item('Veri Akışı Envanteri', 'Antrenman, beslenme, vücut, uyku, ağrı ve adet döngüsü verilerinin cihazda tutulduğu; dışarı giden işlemlerin hangileri olduğu açıklandı.'),
  item('Kamera ve Barkod Şeffaflığı', 'Kamera karelerinin saklanmadığı, yalnız barkodun çözüldüğü ve sorgunun Open Food Facts’e gönderildiği politika metnine eklendi.'),
  item('Destek Merkezi', 'Yedekleme, PWA güncellemesi, bildirim sesi, kamera izni ve güvenli hata bildirme adımları ayrı destek sayfasında toplandı.'),
  item('Kullanım Koşulları', 'Kalori, NEAT, vücut kompozisyonu, hacim ve hedef tarihi sonuçlarının tahmin olduğu; uygulamanın tıbbi cihaz olmadığı açıkça sınırlandı.'),
  item('Doğrudan Yasal Bağlantılar', 'Gizlilik, destek ve koşullar React durumu ya da localStorage çalışmasa bile statik sayfa olarak erişilebilir.'),
  item('Temel Web Güvenlik Başlıkları', 'İçerik türü koklama ve başka sayfada çerçeveleme engellendi; kamera yalnız aynı kökene açılırken mikrofon ve konum kapalı tutuluyor.'),
  item('Zengin PWA Kimliği', 'Manifest artık sabit kimlik, başlangıç adresi, kapsam, portre yönü ve Health/Fitness/Lifestyle kategorileri içeriyor.'),
  item('Uygulama Kısayolları', 'Destekleyen Android ana ekranlarında Antrenman, Beslenme ve Gelişim ekranları doğrudan açılabiliyor.'),
  item('Erişilebilir Yakınlaştırma', 'Viewport içindeki kullanıcı yakınlaştırmasını engelleyen maximum-scale ve user-scalable kısıtları kaldırıldı.'),
  item('İkon Boyutu Doğrulaması', '192, 512 ve Apple 180 piksel ikonları üretimden önce PNG başlığından makineyle kontrol ediliyor.'),
  item('Mağaza Build Kapısı', 'Sürüm eşleşmesi, manifest alanları, yasal sayfalar, açıklama sınırları, ikonlar ve yönlendirmeler bozulursa yayın derlemesi duruyor.'),
  item('Türkçe Mağaza Metin Paketi', 'App Store ve Google Play için ad, alt başlık, kısa/uzun açıklama, anahtar kelime ve ürün kimlikleri sürüm kontrollü dosyada hazırlandı.'),
  item('Veri Güvenliği Taslağı', 'Apple App Privacy, Google Data Safety ve Health Apps beyanında incelenecek veri yolları ve belirsiz noktalar kayıt altına alındı.'),
  item('Native Yayın Yol Haritası', 'Capacitor, iOS Bundle ID, Android paket adı, Xcode 26, API 36, imzalama, TestFlight ve kapalı test adımları sıralandı.'),
  item('Sabit Platform Kimliği', 'iOS ve Android için tech.afacan.prooverload kimliği tek ürün kaynağında tanımlandı; mağaza kaydı açılmadan önce değiştirilmesi gerekiyorsa tek noktadan görülüyor.'),
  item('Kamu İletişimi Engeli', 'Destek e-postası bilinmediği için uydurulmadı. Mağaza hazırlık merkezi ve metadata bunu başvuru öncesi zorunlu manuel adım olarak gösteriyor.'),
]);

export const LATEST_RELEASE_NOTES = release(APP_VERSION, '2026-08-29', 'Sadeleştirme: Duvar Yerine Liste', [
  item('Analiz Ekranı Bölümlendi', 'Hacim sekmesi ölçüldüğünde 10,8 ekran kaydırma, 236 dokunulabilir öğe ve 12.000 karakter metindi. Kartların hepsi aynı anda açıktı: her sürümde bir kart daha eklenmiş, hiçbiri kapanmamıştı. Kartlar beş bölüme ayrıldı ve yalnızca ilki açık geliyor. Sonuç: 4 ekran, 49 öğe, 3.860 karakter.'),
  item('Kapalıyken de Bilgi Veriyor', 'Bölüm başlıkları kapalıyken bile içindeki kart sayısını ve tek satırlık özeti gösteriyor; "burada ne var" sorusu açmadan cevaplanıyor. Hangi bölümün açık olduğu ayarlara yazılmıyor — o anki niyet, kalıcı tercih değil.'),
  item('Derin Analiz de Bölümlendi', 'Koç sekmesinin Derin panosu 3,6 ekran ve 17 uzun paragraftı; üç bölüme ayrıldı ve 2 ekrana indi.'),
  item('Koç Maddeleri Katlandı', 'Ana ekranda her koç maddesi tam paragrafıyla açıktı; ortalama 160, en uzunu 307 karakter. Artık başlık duruyor, gerekçe dokununca açılıyor. Erteleme ve kapatma bağlantıları da yalnızca madde açıkken görünüyor. Ana ekran metni 2.001 karakterden 1.331 karaktere indi.'),
  item('Birincil Eylem Fold Üstünde', '"Antrenman Başlat" ana ekranda 2,5 ekran aşağıdaydı: uygulamanın en sık yapılan işi, en çok kaydırma isteyen yerdeydi. Kartların sırası zamanla büyüdükçe düğme aşağı itilmişti. Artık koç kartının hemen altında ve ilk ekranda.'),
  item('Çift Başlat Düğmesi Kaldırıldı', 'Koç kartı zaten bağlama duyarlı bir başlat düğmesi taşıyor. Planlı bir şablon varsa "Planlananı Başlat" der ve alttaki serbest başlatmadan gerçekten farklı bir iş yapar; plan yoksa ikisi de aynı şeyi yapıyordu. Yan yana duran iki özdeş birincil eylem artık yok.'),
  item('Yedekleme Uyarısı Alarm Olmaktan Çıktı', 'Uygulamayı açan kişinin ilk gördüğü şey turuncu bir veri kaybı uyarısıydı — üstelik hiç verisi olmayan yeni kullanıcıda bile. Artık yalnızca korunmaya değer bir geçmiş varken (en az üç antrenman) ve ekranın üstünde değil eylemin altında, tek satır olarak çıkıyor.'),
  item('Araçlarda Arama', 'Araçlar menüsü yirmi dokuz girişe çıkmıştı; aradığını bilen için gezinmek, bilmeyen için okumak zorlaşmıştı. Arama kutusu ikisini birden çözüyor: başlık, açıklama ve grup adı birlikte aranıyor, yazılmadığında gruplar olduğu gibi duruyor.'),
  item('667 Satır Ölü Kod Silindi', 'Sürüm notlarının bir kopyası constants.js içinde kalmıştı ve kimse okumuyordu; arayüz de doğrulama betiği de releaseHistory.js’den okuyor. Ölü kopya sürüm 8.7’ye çıkmışken hâlâ "ProOverload 7.9" başlığını taşıyordu — yani yanlış olduğu fark edilmeden yaşayabiliyordu.'),
  item('Hiçbir Özellik Kaldırılmadı', 'Bu sürüm bir sadeleştirme sürümü ama hiçbir analiz, kart ya da araç silinmedi. Değişen tek şey varsayılan olarak neyin açık geldiği: uygulama artık her şeyi aynı anda anlatmak yerine sorulunca anlatıyor.'),
])

const RELEASE_8_7 = release('8.7', '2026-08-29', 'Yerel Veri Güveni ve Depolama Katmanı', [
  item('Merkezi Veri Deposu', 'Kalıcı verinin okuma ve yazma yolları tek bir depo arayüzünde toplandı; ekran kodu localStorage anahtar ayrıntılarına bağımlı değil.'),
  item('Tek Koleksiyon Sözlüğü', 'Antrenman, şablon, beslenme, ölçüm, toparlanma, döngü ve ayar alanlarının kalıcı kapsamı tek listede tanımlandı.'),
  item('Bütünlük Manifesti', 'Her kalıcı alan için anahtar, güncelleme zamanı, kayıt sayısı, boyut ve sağlama toplamı ayrı ve küçük bir manifestte tutuluyor.'),
  item('İçerik İmzası', 'Kayıt içeriği FNV-1a sağlama toplamıyla izleniyor; son başarılı yazımdan sonra beklenmedik bir değişim varsa Veri Sağlığı bunu görünür kılıyor.'),
  item('Bozuk JSON Kurtarması', 'En yeni anahtar ayrıştırılamazsa uygulama açılışı durmuyor; sağlam v16–v13 kopyaları sırayla deneniyor.'),
  item('Null Gölgeleme Koruması', 'Yarım bir güncellemenin null değeri, eski sürümde duran sağlam kullanıcı verisini artık gölgeleyemiyor.'),
  item('Geri Dönüş Kopyaları Korundu', 'Eski sürüm anahtarları otomatik silinmiyor veya taşınmıyor; cihaz içi kurtarma yolu olarak yerinde kalıyor.'),
  item('Veri Önce Yazılır', 'Asıl kullanıcı verisi manifestten önce kaydediliyor. Bütünlük kaydı başarısız olsa bile başarılı veri yazımı geçersiz sayılmıyor.'),
  item('Manifest Otorite Değil', 'İmza uyuşmazlığı kullanıcı verisini reddetmiyor; veri açılıyor ve bulgu raporlanıyor. Denetim katmanı yeni bir veri kaybı sebebi olamıyor.'),
  item('Sürümlü Yerleşim Göçü', 'Cihaz içi depolama düzeni için yedek şemasından bağımsız, idempotent ve kayıtlı bir migration altyapısı eklendi.'),
  item('Depolama Sağlığı Panosu', 'Veri Sağlığı ekranı okunan alan, imzalı alan, geri kazanılan alan ve bütünlük bulgularını anlaşılır biçimde gösteriyor.'),
  item('Sessiz Kayıp Uyarısı', 'Kota dolması veya depolama engeli merkezi hata sınıflandırmasından geçiyor; aynı hata yağmuruna karşı mevcut toast kısıtlaması korunuyor.'),
  item('Acil Yedekte Aynı Okuyucu', 'React açılmadan çalışan acil kurtarma yedeği de normal uygulamayla aynı sürüm geri dönüş kurallarını kullanıyor.'),
  item('Salt Okunur Kurtarma', 'Acil hata ekranı yazma yetkisi olmasa bile mevcut kayıtları okuyup standart yedek biçiminde dışarı çıkarabiliyor.'),
  item('488 Çekirdek Kontrol', 'Bozuk veri, null gölgelemesi, checksum farkı, manifest hatası, engelli depolama, tanımsız koleksiyon ve eski sürüm kurtarması otomatik regresyon testlerine eklendi.'),
  item('Native Depoya Hazır Sınır', 'Arayüz localStorage davranışını korurken gelecekte IndexedDB veya native SQLite adaptörüne geçiş için tek bir teknik sınır oluşturuldu.'),
]);

const RELEASE_8_8 = release('8.8', '2026-08-29', 'Hızlı Açılış ve Akıcı Gezinme', [
  item('Aşamalı Ana Ekran', 'Uygulama kabuğu, başlık ve alt gezinme önce açılıyor; ana ekran ayrı bir Suspense sınırında hazırlanıyor.'),
  item('Görünürlük Bazlı Isı Haritası', 'İnteraktif SVG kas haritası kullanıcı bölüme yaklaşana kadar değerlendirilmez; sabit ayrılmış alan sayfa sıçramasını engeller.'),
  item('Ertelenmiş Şablon Hesapları', 'Ana sayfanın altındaki şablon süre ve kas katkısı hesapları yalnız kullanıcı bölüme yaklaşınca çalışır.'),
  item('Niyet Bazlı Sekme Hazırlığı', 'Alt gezinmede odak, işaretçi veya dokunma başladığında hedef ekranın kodu tıklama tamamlanmadan hazırlanmaya başlar.'),
  item('Boş Zamanda Antrenman Hazırlığı', 'Veri tasarrufu kapalı bağlantılarda en sık kullanılan Antrenman ve aktif seans ekranı ilk boyadan sonra tarayıcının boş zamanında hazırlanır.'),
  item('Bağlantı Duyarlı Ön Yükleme', 'Veri tasarrufu veya 2G bağlantı algılanırsa arka plandaki hazırlık atlanır; hız için gereksiz veri tüketilmez.'),
  item('Akıcı Düşük Öncelikli Geçiş', 'Büyük sekme değişimleri React geçişi olarak işlenir; mevcut ekran dokunma geri bildirimini korurken yeni bölüm hazırlanır.'),
  item('Görünür Geçiş Durumu', 'Sekme hazırlanırken başlığın altında ince bir durum çizgisi ve ekran okuyucu duyurusu gösterilir; donmuş uygulama hissi azaltılır.'),
  item('Bağlamsal Yükleme Metni', 'Genel “sayfa yükleniyor” yerine Antrenman, Beslenme, Gelişim veya Geçmiş bölümünün hangisinin hazırlandığı yazılır.'),
  item('Sekme Konumu Hafızası', 'Başka sekmeye gidip dönünce önceki kaydırma konumu aynı uygulama oturumunda korunur.'),
  item('Aktif Sekmeyle Başa Dön', 'Seçili alt sekmeye yeniden dokunmak uzun sayfayı doğrudan başa taşır; tarayıcı animasyon desteğine bağımlı değildir.'),
  item('Uzun Liste Boya Tasarrufu', 'Destekleyen tarayıcılar arşiv ve şablon listelerindeki ekran dışı kartların yerleşim ve boya işini görünene kadar erteler.'),
  item('Gelişim Alt Sekme Hazırlığı', 'Vücut, Analiz ve Döngü alt sekmeleri odak veya işaretçi niyetinde hazırlanır; 135 KB’lık analiz ekranı gereksiz yere önceden çalıştırılmaz.'),
  item('Kararlı React Önbelleği', 'ReactDOM istemcisi ve zamanlayıcı uygulama kodundan ayrıldı; kütüphane sürümü değişmedikçe özellik güncellemelerinde aynı PWA önbellek parçası yeniden kullanılır.'),
  item('Sıkı Performans Kapısı', 'Ölçülen v8.8 tabanına göre ilk JavaScript, gzip, CSS ve en büyük geç parça bütçeleri düşürüldü; sonraki sürüm fark edilmeden eski ağırlığa dönemeyecek.'),
  item('PWA ve Veri Yapısı Korundu', 'Kod bölme ve geçiş değişiklikleri localStorage anahtarlarını, v8.7 bütünlük manifestini ve çevrimdışı veri modelini değiştirmez.'),
]);

const RELEASE_8_1 = release('8.1', '2026-08-27', 'Antrenman Sihirbazı ve Sıra Motoru', [
  item('Mevcut Şablona Sihirbaz', 'Şablon kütüphanesi ve önizlemeden “Sihirbazla İyileştir” açılıyor. Eski şablonun hareket, set, süperset, teknik ve tekrar aralığı alanları düzenlemeye taşınıyor.'),
  item('Ayrı Hareket Sırası Adımı', 'Yeni program sihirbazına Düzen, Ekipman ve Öncelikten ayrı bir Sıra adımı eklendi. Hareket seçimiyle sıra kararı birbirine karıştırılmıyor.'),
  item('Yedi Sıralama Profili', 'Performans, kas önceliği, itiş–çekiş dönüşümü, üst–alt dönüşümü, uzun-boy yükleme, bilinen hareketler ve bilinçli ön yorgunluk ayrı seçenekler oldu.'),
  item('Ön Yorgunluk Takası', 'İzolasyonu bileşkeden önce koyan profil artık açıkça performans takası olarak etiketleniyor; uygulama bunu evrensel olarak daha iyi göstermiyor.'),
  item('Manuel Sıra İnce Ayarı', 'Sihirbaz önizlemesinde hareketler tek basamak yukarı/aşağı taşınabiliyor. Değişiklik yalnız ilgili günün sırasına uygulanıyor.'),
  item('En Üste ve En Alta Taşıma', 'Uzun seanslarda art arda dokunmak yerine hareketi tek dokunuşla listenin başına veya sonuna alma seçenekleri eklendi.'),
  item('Sıra Gerekçeleri', 'Her hareketin yanında neden o konuma geldiği gösteriliyor: bileşkelik, seçili kas, dönüşüm, gerilmede yükleme veya geçmişte yapılmış olma.'),
  item('Süperset Blok Koruması', 'Otomatik sıralama süperset eşlerini ayırmıyor; zinciri tek blok olarak birlikte taşıyor.'),
  item('Seans Tasarım Sihirbazı', 'Şablon düzenleyicide hedef sıra, öncelikli kas, süre bütçesi ve uygulanabilir öneriler tek kartta toplandı.'),
  item('Hareket Silmeden Süreye Sığdırma', 'Seans süre hedefini aşıyorsa düşük öncelikli setler azaltılıyor; hiçbir hareket silinmiyor ve hiçbir hareket iki setin altına indirilmiyor.'),
  item('Basit Süperset Önerisi', 'Farklı kasların uygun izolasyonları için zaman kazandırabilecek bir çift öneriliyor; ağır bileşkeler otomatik eşlenmiyor.'),
  item('Önce–Sonra Özeti', 'Sihirbaz açıldığı andaki ve güncel hareket, set ve tahmini süre değerleri yan yana gösteriliyor.'),
  item('Sihirbazı Sıfırlama', 'Sıra, set ve öneri uygulamaları tek dokunuşla sihirbazın açıldığı ilk hale döndürülebiliyor.'),
  item('Altı İkame Amacı', 'Hareket alternatifleri artık en yakın, bildiğim, yeni, kontrollü ekipman, gerilmede yükleme ve izolasyon amaçlarına göre yeniden sıralanabiliyor.'),
  item('Takvim Seçimini Koruma', 'Sihirbazdan ayrıntılı düzenleyiciye geçerken seçilen antrenman günleri artık kaybolmuyor.'),
]);

const RELEASE_8_0 = release('8.0', '2026-08-27', 'Plan Gerçekleşmesi ve Sürüm Arşivi', [
  item('Plan Gerçekleşme Skoru', 'Aktif programın uygulanması; seans katılımı, planlı setler, planlı hareketler, gün kayması ve süre doğruluğuyla 0–100 arasında özetleniyor. Eksik ölçümler sıfır yazılmıyor.'),
  item('Ayrı Veri Güveni', 'Skorun yanında kaç tam hafta, kaç anlık şablon kaydı ve ne kadar plan kapsaması bulunduğu gösteriliyor. Geçmişte aktif plan sürümünün saklanmadığı dönemlerde kesinlik özellikle sınırlanıyor.'),
  item('Sekiz Haftalık Uyum Eğilimi', 'Her haftanın tarih aralığı, eşleşen/planlanan seans sayısı, planlı set tamamlama oranı ve plansız ek seansları ayrı satırda gösteriliyor.'),
  item('Şablon Bazında Güvenilirlik', 'Aktif programdaki her şablon için beklenen ve gerçekleşen seans, planlı set yüzdesi, ortalama gün kayması ve gerçek/tahmini süre yan yana geliyor.'),
  item('Planlı Set ve Hareket Takibi', 'Seans başlangıcında kaydedilen şablon anlık görüntüsü kullanılıyor. Şablon daha sonra değişse veya silinse bile geçmişte gerçekten planlanan set ve hareketler korunuyor.'),
  item('Gün Kayması Analizi', 'Seansın planlandığı gün ile yapıldığı gün arasındaki ortalama kayma ölçülüyor. Bir günü kaydırmak kaçırmak sayılmıyor; yalnız düzen öngörülebilirliği olarak raporlanıyor.'),
  item('Süre Kalibrasyonu', 'Şablonun tahmini süresi ile gerçekleşen seans süresi karşılaştırılıyor. Süre kaydı olmayan seanslar doğruluk puanını düşürmüyor.'),
  item('Kas Hacmi Teslimi', 'Güncel haftada her kas için gerçekleşen katkı seti, aktif programın teorik seti ve gerçekleşme yüzdesi gösteriliyor. Bu yüzde fizyolojik yeterlilik değil, plana teslim oranıdır.'),
  item('Plansız Seansları Ayırma', 'Serbest veya başka programa ait seanslar kaybolmuyor fakat aktif program uyumunu yapay biçimde yükseltmiyor; ayrı bir toplam olarak tutuluyor.'),
  item('Telafi Günü Önerisi', 'Geçmiş planlı seans kaçtıysa haftanın kalan off/aktif toparlanma günlerinden takvim sıkışması en düşük ilk boşluk gösteriliyor. Boş gün kalmadığında seansları üst üste yığmak önerilmiyor.'),
  item('Gerçekçi Program Sadeleştirme', 'En az üç tamamlanmış haftada uyum yüzde 70’in altındaysa, kâğıttaki gün sayısı yerine fiilen sürdürülen seans ortalamasına yakın bir program öneriliyor.'),
  item('Seans Bazında Uyum Geçmişi', 'Son ölçülen seansların set tamamlama yüzdesi, gün kayması ve plan adı tek listede izlenebiliyor.'),
  item('Koç Entegrasyonu', 'Düşük uyumda koç daha fazla hacim önermek yerine programı sadeleştirme, kaçan seansı taşıma veya sürekli atlanan seti bilinçli kaldırma maddesi üretiyor.'),
  item('Yeni Güncelleme Merkezi', 'Son Güncelleme yalnız 8.0 maddelerini gösteriyor. Geçmiş sekmesinde 7.9–6.0 sürümleri tarihleri ve kendi kapsamlarıyla ayrı ayrı açılıyor.'),
]);

const PAST_RELEASES = [
  RELEASE_8_8,
  RELEASE_8_7,
  RELEASE_8_6,
  RELEASE_8_5,
  RELEASE_8_3,
  RELEASE_8_2,
  RELEASE_8_1,
  RELEASE_8_0,
  release('7.9', '2026-08-26', 'Doz–Yanıt Hacim Modeli', [
    item('Belirsizlik şeritleri', 'Kesin MEV/MAV/MRV hükmü yerine eşik, yüksek verim, tartışmalı ve kanıtsız hacim bölgeleri getirildi.'),
    item('Kanıt ve set sayımı', 'Kanıt defteri, doğrudan/kesirli/toplam set karşılaştırması ve seçilebilir hacim felsefesi eklendi.'),
    item('Yakınlık reçetesi', 'Hareket tipine göre hedef RIR, kademeli etkili set ve sabit hacimli blok seçenekleri eklendi.'),
  ]),
  release('7.8', '2026-08-26', 'Program Zekâsı ve Kişisel Hacim', [
    item('Program zekâsı', 'Program amacı, kas önceliği, süre bütçesi, beş alt skor ve tek dokunuşlu taslak düzeltmeleri eklendi.'),
    item('Optimal hacim laboratuvarı', 'Kişisel aralık, veri güveni, aktif plan farkları ve dört haftalık hacim deneyi eklendi.'),
  ]),
  release('7.7', '2026-08-26', 'Koç Karar Panosu', [
    item('Açıklanabilir kapasite', 'Uyku, hazır oluş, ağrı, nabız ve yük sinyalleri eksik veriyi cezalandırmadan birleşti.'),
    item('Eş dönem analizi', '7/28/84 günlük aynı uzunluklu dönem kıyası ve anlamlı değişim süzgeci eklendi.'),
  ]),
  release('7.6', '2026-08-26', 'Ölçülen Koç ve Performans', [
    item('Karar defteri', 'Uygulanan koç kararları üç hafta sonra performans ve uygulama ölçüleriyle değerlendirilmeye başladı.'),
    item('Kas ve hareket analizleri', 'Performans sürücüleri, kas karnesi, hareket yatırım getirisi ve sapma gözcüsü eklendi.'),
  ]),
  release('7.5', '2026-08-26', 'Seans Planlama Araçları', [
    item('Hayalet ve zaman sıkışması', 'Geçmiş seansla canlı yarış, süre daralınca güvenli set azaltma ve zayıf halka sıralaması eklendi.'),
    item('Analiz hazırlığı', 'Her analizin kaç kayıtla açılacağı ve ortak veri darboğazı görünür hale geldi.'),
  ]),
  release('7.4', '2026-08-26', 'Set ve Hareket Ayrıntıları', [
    item('Isınma merdiveni', 'Hareket yüküne göre hazırlık setleri, geçmiş hareket notu ve sağ/sol taraf takibi eklendi.'),
    item('Seans hacmi', 'Antrenman sırasında kas bazında biriken setler ve su takibi getirildi.'),
  ]),
  release('7.3', '2026-08-22', 'Program Düzenleri ve Dalgalanma', [
    item('Yeni program düzenleri', 'Birleşik itiş+bacak ve çekiş+bacak dahil yeni haftalık düzenler eklendi.'),
    item('Dalgalı periyotlama', 'Ağır, orta ve hafif gün vurguları şablon ve seans akışına bağlandı.'),
  ]),
  release('7.2', '2026-08-22', 'Dinlenme ve Hacim Hedefleri', [
    item('Kaçmayan dinlenme uyarısı', 'Ses, titreşim, ön uyarı ve sistem bildirimi birlikte çalışan dinlenme uyarısı eklendi.'),
    item('Kişisel hacim hedefleri', 'Kas bazında elle hedef, öneri ve varsayılana dönüş akışı getirildi.'),
  ]),
  release('7.1', '2026-08-20', 'Seans Kontrol Merkezi', [
    item('Canlı seans yönetimi', 'Seans temposu, sıradaki set ipucu ve dinlenme uyarısı tanılama araçları tek ekranda toplandı.'),
  ]),
  release('7.0', '2026-08-17', 'İlerleme Kuralları', [
    item('Hareket bazında ilerleme', 'Çift ilerleme ve yük/tekrar kuralları hareket bazında seçilebilir hale geldi.'),
    item('Durgunluk tespiti', 'Tek kötü seans yerine çoklu seans eğilimiyle plato taraması eklendi.'),
  ]),
  release('6.9', '2026-08-17', 'Program Sihirbazı Yenilemesi', [item('Daha fazla düzen', 'İki yeni üç günlük düzen ve kalça hareket havuzu düzeltmesi eklendi.')]),
  release('6.8', '2026-08-17', 'Şablon ve Hareket Bakımı', [item('Daha güvenli düzenleme', 'Süperset bağlantıları düzeltildi; hareket birleştirme ve şablon bakım araçları eklendi.')]),
  release('6.7', '2026-08-17', 'Ağrı Koruması ve Seans Tahmini', [item('Antrenman öncesi koruma', 'Ağrı bölgelerini yükleyen hareket uyarısı ve daha gerçekçi seans süresi tahmini eklendi.')]),
  release('6.6', '2026-08-16', 'Yüzme ve Nabız Ayrıntıları', [item('Kardiyo ayrıntıları', 'Yüzme set defteri, elle maksimum nabız ve ayrıntılı tempo kayıtları eklendi.')]),
  release('6.5', '2026-08-16', 'Kuvvet Standartları', [item('Kuvvet bağlamı', 'Vücut ağırlığına göre kuvvet standartları ve kardiyo şiddet dağılımı eklendi.')]),
  release('6.4', '2026-08-16', 'Kardiyo Merkezi', [item('Ayrı kardiyo sekmesi', 'Karvonen bölgeleri, aktivite hedefleri ve net ağırlık alanı getirildi.')]),
  release('6.3', '2026-08-16', 'Kardiyo Koçu', [item('Nabız bölgeleri', 'Hedefe göre kardiyo koçu, nabız bölgeleri ve duyulur dinlenme uyarısı eklendi.')]),
  release('6.2', '2026-08-16', 'Koç Hafızası', [item('Daha kontrollü bildirimler', 'Müzik/medya çakışması giderildi; koç maddeleri ertelenebilir ve kapatılabilir hale geldi.')]),
  release('6.1', '2026-08-16', 'Sağlık ve Tutarlılık', [item('Yeni takip katmanları', 'Ağrı günlüğü, kuvvet dengesi, antrenman serisi ve plan uyumu eklendi.')]),
  release('6.0', '2026-08-15', 'Koç Merkezi', [item('Haftalık protokol', 'Çoklu sinyalli Koç Merkezi, güven puanı ve kontrollü toparlanma protokolü eklendi.')]),
];

export const RELEASE_HISTORY = [LATEST_RELEASE_NOTES, ...PAST_RELEASES];

export const findRelease = (version) => RELEASE_HISTORY.find(entry => entry.version === version) || null;
