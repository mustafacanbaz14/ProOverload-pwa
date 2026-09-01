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

const RELEASE_8_9 = release('8.9', '2026-08-29', 'Sadeleştirme: Duvar Yerine Liste', [
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
]);

const RELEASE_9_0 = release('9.0', '2026-08-29', 'Yayın Güvenilirliği', [
  item('Vercel Yanlış Negatifi Düzeltildi', 'Mağaza güvenlik denetimi vercel.json dosyasındaki boşluklara bağımlı metin araması yapıyordu; Vercel dosyayı sıkıştırınca doğru yapı yanlış biçimde hatalı sayılıyordu.'),
  item('Semantik Yapı Denetimi', 'Başlık kuralları ve SPA yönlendirmesi artık JSON olarak ayrıştırılıyor; girinti, satır sonu veya anahtarlar arasındaki boşluk değişse de aynı yapı aynı sonucu veriyor.'),
  item('Güvenlik Başlıkları Korundu', 'X-Content-Type-Options, X-Frame-Options, Referrer-Policy ve Permissions-Policy kontrolleri kaldırılmadı; yalnız kırılgan doğrulama yöntemi düzeltildi.'),
  item('Yerel ve Bulut Build Eşitliği', 'Bilgisayarda geçen üretim kapısının Vercel Linux ortamında da aynı yapı için geçmesi sağlandı; yayın sonucu artık dosya biçimlendirmesine bağlı değil.'),
  item('PWA ve Kullanıcı Verisi Değişmedi', 'Bu bakım sürümü localStorage anahtarlarına, veri şemasına, PWA önbellek modeline veya Claude ile eklenen v8.9 arayüz sadeleştirmelerine dokunmuyor.'),
]);

const RELEASE_9_1 = release('9.1', '2026-08-30', 'Bugün Odaklı Ana Ekran', [
  item('Basit Mod Gerçekten Basit', 'Ana ekran artık bütün analizleri aynı anda göstermiyor; günün kararı, planı ve yapılacak ilk iş üstte kalırken ayrıntılar istenince açılıyor.'),
  item('Tek Haftalık Durum Kapısı', 'Hazır oluşluk, deload, kas haritası, ACWR, itme–çekme dengesi ve kas hacmi tek Haftalık Durum bölümünde toplandı.'),
  item('Kapalıyken Anlamlı Özet', 'Haftalık bölüm kapalıyken antrenman, etkili set, eşik altındaki kaslar, tavan aşımı, toparlanma uyarısı ve yük durumu tek bakışta görülebiliyor.'),
  item('Koç Ayrıntıları İsteğe Bağlı', 'Kapasite puanı, uzun koç önerileri ve karar defteri basit modda tek Koç Ayrıntıları düğmesinin arkasına alındı; hiçbir öneri silinmedi.'),
  item('Üç Görev Odaklı Kısayol', 'Antrenman, Hızlı Kayıt ve Araçlar ana ekranda eşit ve belirgin dokunma alanlarıyla doğrudan erişilebilir hale getirildi.'),
  item('Ayrıntılı Mod Korundu', 'Ayrıntılı arayüzü seçen kullanıcı koç içeriğini ve haftalık analizleri açık görmeye devam ediyor; uzman kullanım akışı daraltılmadı.'),
  item('Harita İhtiyaç Anında', 'İnteraktif SVG kas haritası basit modda haftalık ayrıntı açılmadan yüklenmiyor; ilk ekranın gereksiz değerlendirme işi azaltıldı.'),
  item('Veri ve PWA Yapısı Korundu', 'Bu arayüz sürümü localStorage anahtarlarını, kullanıcı kayıtlarını, yedek biçimini veya çevrimdışı PWA davranışını değiştirmiyor.'),
  item('Beş Sürümlük UX Yol Haritası', 'Antrenman kurma, beslenme ve enerji, gelişim ve arşiv ile mağaza kalitesini kapsayan sonraki dört sadeleştirme sürümü belgelenerek sabitlendi.'),
]);

const RELEASE_9_3 = release('9.3', '2026-08-30', 'Program Akışı ve Günlük Beslenme', [
  item('Tek Yönlendirmeli Program Akışı', 'Antrenman Merkezi program amacı, taslak, hareket düzenleme ve haftalık kontrolü tek baskın başlangıç kartında sıralıyor; dağınık oluşturma yolları ikincil seçeneklere indi.'),
  item('Kayıpsız Sihirbaz Taslağı', 'Program sihirbazındaki gün, düzen, ekipman, kas önceliği, hareket sırası, takvim ve ikame seçimleri her değişiklikte cihazda otomatik korunuyor.'),
  item('Kayıpsız Elle Program Taslağı', 'Program adı, günler, hareketler, setler, sıralama ve haftalık plan tercihi kaydediliyor; pencere kapansa veya uygulama yenilense bile taslak geri yükleniyor.'),
  item('Taslağa Tek Dokunuşla Dönüş', 'Antrenman Merkezi en son değiştirilen sihirbaz veya düzenleyici taslağını tanıyor, adım ve gün özetini göstererek doğru ekrana geri götürüyor.'),
  item('Mevcut Şablonlarda Sade Eylemler', 'Basit görünümde şablon kartı önce başlatma ve sihirbazla düzenlemeyi gösteriyor; elle düzenleme, kopyalama ve silme tek Diğer menüsünde korunuyor.'),
  item('Tek Günlük Kalori Denklemi', 'Baz hedef, bugünün ortalamadan harcama farkı, alınan enerji ve kalan kalori aynı satırda gösteriliyor; egzersizin iki kez eklenmediği açıkça belirtiliyor.'),
  item('Üç Ana Beslenme Eylemi', 'Besin veya barkod ekleme, günlük toplam makro girişi ve kaydetme ekranın tek hızlı işlem sırası oldu; aynı işi tekrarlayan görünüm seçicileri kaldırıldı.'),
  item('Kademeli Ayrıntı Katmanı', 'Şablonlar, geçmişten kopyalama, kalori ayrıntısı ve güne özel NEAT ayarları kapalı özetlerin arkasında duruyor; ileri özellikler silinmeden ilk ekran sadeleşti.'),
  item('Tahmin Kaynağı ve Güveni', 'Kalori hedefi kilo eğilimiyle kalibre edilmişse güven düzeyiyle, yeterli veri yoksa vücut ölçümü ve aktiviteden üretilen tahmin olarak işaretleniyor.'),
  item('Geçmiş Gün Doğrudan Düzenleme', 'Tarih seçici, günlük özet ve kayıt alanı aynı akışta kaldı; geçmiş günün öğünleri, toplam makroları, suyu ve enerji girdileri ayrı arşiv yolculuğu olmadan değiştirilebiliyor.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'Yeni taslaklar ayrı ve güvenli localStorage anahtarlarında tutuluyor; mevcut antrenman, şablon, beslenme, yedek ve çevrimdışı çalışma şemaları değiştirilmedi.'),
  item('491 Çekirdek Kontrol', 'Taslak sınırlandırma, bozuk hareket temizleme ve en güncel akışı seçme senaryoları regresyon ağına eklendi; mevcut kas sınıflandırma ve mağaza kontrolleri korunuyor.'),
]);

const RELEASE_9_5 = release('9.5', '2026-08-30', 'Hedef Merkezi, Birleşik Arşiv ve İlk Kullanım', [
  item('Tek Hedef Merkezi', 'Kilo, yağ oranı, yağsız kütle, FFMI, çevre, kaliper ve hareket ağırlığı hedefleri dört sekmeli tek bir merkezde toplandı; mevcut hedef kayıtları değiştirilmedi.'),
  item('Otomatik ve Sabit Hedef Ayrımı', 'İlişkili kompozisyon hedefleri artık otomatik hesaplanan veya kullanıcı tarafından sabitlenen olarak açıkça etiketleniyor; tek dokunuşla sabitleme ve otomatik hesaba dönüş var.'),
  item('Birleşik Gün Arşivi', 'Antrenman, kardiyo, vücut ölçümü, beslenme ve enerji aynı gün kartında gösteriliyor; mevcut tür bazlı arşiv ekranları ayrıntılı kullanım için korunuyor.'),
  item('Ay, Hafta ve Gün Dili', 'Birleşik arşiv mevcut ay ve hafta katmanlarını kullanıyor, her günlük kartta tarih ile haftanın gününü birlikte gösteriyor ve ortak arama bütün kayıt türlerini tarıyor.'),
  item('Karttan Doğrudan Düzenleme', 'Birleşik gün kartındaki antrenman, aktivite, ölçüm ve beslenme satırları ilgili düzenleme ekranını tek dokunuşla açıyor; ölçüm varsa kıyaslama da doğrudan erişilebilir.'),
  item('Dört Adımlı İlk Kurulum', 'Kısa ilk kullanım turu hedef, deneyim, arayüz ve başlangıç listesini kapsıyor; koruma hedefindeki eski anahtar tutarsızlığı da giderildi.'),
  item('Güvenli Örnek Program', 'Yeni kullanıcı isterse düzenlenebilir bir başlangıç programı kurabiliyor; örnek özellik sahte antrenman veya beslenme geçmişi üretmediği için analiz verisini kirletmiyor.'),
  item('Aranabilir ve Filtrelenebilir Ayarlar', 'Ayarlar sekiz anlamlı kategoriye ayrıldı; dinlenme, tema veya NEAT gibi terimler yazıldığında ilgili grup ve bağımlı açıklamalar birlikte gösteriliyor.'),
  item('Bağlamsal Ayar Kısayolları', 'Antrenman, beslenme ve vücut ekranları kendi ayar kategorisini doğrudan açıyor; kullanıcı uzun ayar listesinin başından hedefini aramak zorunda kalmıyor.'),
  item('İki Katmanlı Yardım', 'Ayar kategorileri önce kısa bir özet gösteriyor, ayrıntılı açıklama yalnız kullanıcı açarsa görünüyor; ileri bilgi korunurken ilk bakıştaki metin yükü azaltıldı.'),
  item('Yayın Kalite Kapısı', 'PWA güncellemesi, çevrimdışı fallback, aktif antrenman koruması, yedek akışı, erişilebilir yazı ölçeği, güvenli alan ve sürüm notları her üretim buildinde otomatik denetleniyor.'),
  item('Mobil Yayın Kontrolü', 'Gerçek cihazda yedek geri yükleme, çevrimdışı açılış, iPhone güvenli alanı, büyük yazı, kamera izni ve güncelleme senaryoları için kalıcı yayın kontrol listesi eklendi.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v9.5 yeni bir kalıcı veri anahtarı veya kırıcı şema eklemiyor; mevcut localStorage kayıtları, yedek biçimi ve ana ekrana kurulmuş PWA güncelleme akışı korunuyor.'),
]);

const RELEASE_9_6 = release('9.6', '2026-08-30', 'Sade Ayarlar ve Gün Gün Enerji', [
  item('Ayarlar Artık Bir Ana Menü', 'Ayarlar açıldığında bütün kontroller tek uzun sayfaya yığılmıyor; sekiz büyük konu kartı gösteriliyor ve yalnız seçilen kategorinin içeriği açılıyor.'),
  item('Koç Yöntemi Veriden Ayrıldı', 'Antrenman hedefi, hacim felsefesi, kademeli etkili set ve koç odağı yedekleme araçlarından ayrılıp Koç & Yöntem başlığında toplandı.'),
  item('Daha Anlaşılır Ayar Araması', 'Arama yalnız başlıklara değil NEAT, punto, kilit ekranı, dinlenme ve program kodu gibi günlük kullanılan terimlere de bakıyor.'),
  item('Kategori İçinde Kaybolmadan Gezinme', 'Seçili ayarın adı başlıkta gösteriliyor; sabit geri düğmesi kategori ana ekranına tek dokunuşla dönüyor ve bağlamsal Antrenman, Beslenme, Vücut kısayolları korunuyor.'),
  item('Beslenmeden Gün Gün Enerji', 'Beslenme ekranının üst özetine alınan, yakılan, denge ve harcama kaynaklarını doğrudan Gün Gün sekmesinde açan görünür bir kısayol eklendi.'),
  item('Arşivden Tarihe Doğrudan Geçiş', 'Geçmiş ekranı genel Gün Gün Kalori düğmesi taşıyor; günlük beslenme satırındaki alev düğmesi seçilen tarihin harcama dökümünü doğrudan açıyor.'),
  item('Ana Ekranda Yazılı Kalori Kısayolu', 'Koç kartındaki yalnız ikon olan enerji düğmesi Kalori etiketi kazandı; işlevi bilmek için simgeyi tahmin etmek gerekmiyor.'),
  item('Bir Yıllık Enerji Görünümü', 'Gün Gün enerji tablosu son 60 gün yerine son 365 günü kapsıyor; geçmiş vücut bağlamı, harcama kaynakları ve güne özel NEAT düzenlemesi korunuyor.'),
  item('Beş Sürümlük Sadeleştirme Planı', 'Aktif antrenman, koç ve analiz, günlük arşiv ve mağaza öncesi ürün bütünlüğünü kapsayan v9.7–v10.0 yol haritası belgelendi.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v9.6 yeni localStorage anahtarı veya kırıcı veri göçü eklemiyor; mevcut kayıt, yedek ve çevrimdışı güncelleme yapısı değişmiyor.'),
]);

const RELEASE_9_7 = release('9.7', '2026-08-30', 'Luxury Dark & Light UI ve Tam Tasarım Modernizasyonu', [
  item('Luxury Dark & Light UI', 'Tüm uygulama obsidyen–altın (karanlık) ve fildişi–bronz (aydınlık) renk temalarıyla lüks bir tasarım sistemine taşındı.'),
  item('24+ Modal ve Dialog Yenilendi', 'Bütün pencereler standart role="dialog", aria-modal="true", backdrop blur ve modern rounded-3xl cam gövde ile sıfırdan modernize edildi.'),
  item('Lüks Başlık ve Navigasyon', 'luxury-header, luxury-icon-button ve luxury-segmented tab barları ile dokunmatik dostu mikro-etkileşimler sağlandı.'),
  item('Beslenme & Tarif Kütüphanesi', 'Porsiyon hesaplayıcı, lüks kartlar ve şablon seçiciler yeni cam morfolojisi ile baştan tasarlandı.'),
  item('Mağaza Hazırlık ve Güvenlik Panosu', 'Platform bazlı sekmeler, sabit kimlikler ve otomatik doğrulama maddeleri lüks görsel kartlarla sunuldu.'),
  item('Veri Sağlığı ve İkame Motoru', 'Depolama bütünlüğü, kas grubu analizi ve hareket alternatifleri şık tipografi hiyerarşisiyle yeniden düzenlendi.'),
  item('Hızlı Kayıt ve Hızlı Eylemler', 'Dokunma hedefleri büyütüldü, aktif basma efektleri (active scale) ve görsel geri bildirimler güçlendirildi.'),
  item('Performans ve Sıfır Regresyon', '492 çekirdek doğrulama testi, 16 kas grubu kuralı ve sıkı performans bütçeleri eksiksiz korundu.'),
]);

const RELEASE_9_8 = release('9.8', '2026-08-30', 'Arayüz Akıcılığı, Kart Estetiği ve Dokunsal Zarafet', [
  item('Dokunsal Mikro-Etkileşimler', 'Hızlı işlemler, şablon kartları, sayaçlar ve sekmeler için fiziksel yay basma hissi veren active-scale ve mikro-geçişler entegre edildi.'),
  item('Rafine Metrik & Koç Kartları', 'Günün Koçu, haftalık durum ve aktivite kartları cam derinliği, iç gölgeler ve yüksek kontrastlı tipografi ile zenginleştirildi.'),
  item('Aktif Seans & Dinlenme Sayacı', 'Canlı antrenman dinlenme sayacı, tempo, set tipleri ve seans düğmeleri pürüzsüz dokunma alanlarına kavuşturuldu.'),
  item('Şablon Kütüphanesi & Arama', 'Şablon arama, filtreleme, favori rozetleri ve sihirbaz eylemleri şık kart modülleri olarak yeniden işlendi.'),
  item('Akıllı Ayar Anahtarları', 'Ayar anahtarları (toggle switches) ve kategori panoları modern dokunsal cam estetiğine uyarlandı.'),
  item('Tüm Doğrulama Testleri Yeşil', '492 temel test, 16 kas grubu ve 56 hareket kuralı, mağaza ve performans kapıları eksiksiz korundu.'),
]);

const RELEASE_9_9 = release('9.9', '2026-08-30', 'Kullanıcı Deneyimi, Hızlı Kayıt ve Ergonomi Odaklı Geliştirmeler', [
  item('Hızlı Su Ekleme Kısayolları', 'Beslenme ekranında tek dokunuşla +250ml ve +500ml su ekleme kısayolları ile hidrasyon takibi kolaylaştırıldı.'),
  item('Gelişmiş Seans & Plaka Ergonomisi', 'Aktif antrenman ekranında hareket kartları, plaka hesaplayıcı ve özel dinlenme süresi kontrolleri tek dokunuşla erişilebilir kılındı.'),
  item('Geçmiş & Arşiv Navigasyonu', 'Tüm kayıtlar, ağırlık, aktivite, ölçüm ve besin sekmeleri rafine dokunsal geri bildirim ve hızlı arama ile yenilendi.'),
  item('Vücut Ölçüm & Hedef Merkezi', 'Son durum özeti ve kıyaslama butonları cam kart morfolojisi ve yüksek netlikli metrik kutularıyla güncellendi.'),
  item('Pürüzsüz Mikro-Animasyonlar', 'Dokunmatik butonlarda ve kartlarda akıcı yay efektleri (active-scale) ile dokunma ergonomisi güçlendirildi.'),
  item('Eksiksiz Doğrulama ve Sıfır Regresyon', '492 çekirdek test, 16 kas grubu ve 56 hareket kuralı, mağaza hazırlık kapıları sıfır hata ile korundu.'),
]);

const RELEASE_10_0 = release('10.0', '2026-08-30', 'ProOverload 10.0 — Üst Düzey Kullanıcı Deneyimi ve Rafine Tasarım', [
  item('Kapsamlı Besin & Porsiyon Arayüzü', 'Besin arama ve barkod tarama penceresinde hızlı gramaj (50g, 100g, 150g, 200g) ve favori ekleme butonları optimize edildi.'),
  item('Kardiyo & Aktivite Seans Girişi', 'Hızlı süre seçicileri (15, 20, 30, 45, 60 dk) ve çoklu aktivite kaydetme butonları modern cam tonlarına kavuşturuldu.'),
  item('Araçlar ve Yardımcılar Merkezi', 'Mezosiklik, plaka hesabı, uyku, ağrı ve koç defteri gibi tüm araçlar arama destekli zarif liste formatında sunuldu.'),
  item('Seans İçi Yük & Set İpuçları', 'Yorgunluk düşüşü, geçmiş set hatırlatıcıları ve dinamik yük tavsiyeleri yüksek kontrastlı mikro kartlar haline getirildi.'),
  item('Bütünsel Dokunmatik Konfor', 'Mobil cihazlarda tek elle kullanımı destekleyen genişletilmiş dokunma alanları ve güvenli alan (safe-area) uyumu kusursuzlaştırıldı.'),
  item('492/492 Test ve Tam Güvenilirlik', 'Tüm biyomekanik kurallar, enerji formülleri, veri kurtarma ve performans sınırları eksiksiz doğrulandı.'),
]);

const RELEASE_10_1 = release('10.1', '2026-08-30', 'Haftalık Planlama & Program Sihirbazı Zarafeti', [
  item('Haftalık Plan & Gün Atama', 'Haftalık program özeti, antrenman ve kardiyo slot ekleme butonları lüks cam paneller ve sezgisel dokunma efektleriyle yenilendi.'),
  item('Yönlendirmeli Program Sihirbazı', 'Sihirbazın adım navigasyonu ve "Önce Düzenle / Direkt Kur" aksiyon butonları zengin mor–indigo gradyanlar ve derin gölgelerle zenginleştirildi.'),
  item('Haftalık Çakışma & Uyum Analizi', 'Seans çakışma asistanı ve kas hacmi dağılımı görsel uyarı rozetleriyle netleştirildi.'),
  item('Gelişmiş Dokunma Geri Bildirimi', 'Tüm modal butonlarında fiziksel basma hissi veren mikro-ölçeklendirmeler (active:scale-[0.98]) standartlaştırıldı.'),
  item('Tam Doğrulama ve Sıfır Regresyon', '492 birim testi, 16 kas grubu ve 56 hareket kuralı, mağaza ve performans kapıları başarıyla geçti.'),
]);

const RELEASE_10_2 = release('10.2', '2026-08-30', 'Üstün Metin Okunabilirliği ve Tipografi Netliği', [
  item('Yüksek Kontrastlı Metin Hiyerarşisi', 'Koyu arayüz zeminlerinde okunması güç olan soluk ve karanlık metin renkleri yüksek kontrastlı, kristal netliğinde tipografiyle yenilendi.'),
  item('Koç ve Kapasite Sinyalleri', 'Koç brifingi, kapasite puanı, dayanaklar, kısıtlamalar ve öneri ayrıntıları her türlü ekran parlaklığında kusursuz okunabilir kılındı.'),
  item('Geçmiş ve Zaman Çizelgesi Netliği', 'Arşiv zaman çizelgesi, hafta ve ay gruplamaları, aktivite ve enerji dökümleri belirgin etiketlerle güçlendirildi.'),
  item('Analiz ve İlerleme Görselleri', 'Kas hacim eşikleri, çalışma sıklığı, 1RM seans sayıları ve beslenme analizi tabloları geliştirilmiş kontrast ile yeniden tasarlandı.'),
  item('Seans İçi İpuçları ve Notlar', 'Aktif antrenman ekranındaki seans hacmi, ısınma rehberi ve hareket notu giriş alanları net ve erişilebilir hale getirildi.'),
  item('492/492 Test ve Bütünlük', 'Tüm birim testleri, 16 kas grubu kuralı ve performans bütçeleri sıfır hata ile doğrulandı.'),
]);

const RELEASE_10_3 = release('10.3', '2026-08-30', 'Kapsamlı Kullanıcı Deneyimi, Hızlı Ağırlık Stepper ve Hidrasyon Komuta Merkezi', [
  item('Ana Ekran 4-Aksiyon Komuta Merkezi', 'Ana sayfaya Antrenman, Hızlı Kayıt, Program Planı ve Araçlar için lüks degrade efektli ve canlı durum rozetli 4’lü hızlı erişim bloğu eklendi.'),
  item('Hızlı Su Takibi ve Anında Ekleme', 'Ana ekranda doğrudan tek dokunuşla +250ml ve +500ml su ekleme kısayolları ve interaktif sıvı dolum barı entegre edildi.'),
  item('Aktif Seansta Hızlı Ağırlık Ayarlayıcılar', 'Set giriş satırlarına salonda klavye ile uğraşmayı sonlandıran tek dokunuşlu -2.5, +1.25, +2.5 ve +5 kg mikro-adımlama butonları eklendi.'),
  item('Görsel Makro Dağılım ve Oran Çubuğu', 'Beslenme ekranında Protein, Karbonhidrat ve Yağ kalorilerinin günlük yüzdesel dağılımını canlı gösteren renkli gösterge şeridi sunuldu.'),
  item('Rafine Dokunmatik Ergonomi', 'Tüm set tamamlama butonları, dokunmatik kısayollar ve modal geçişleri daha geniş dokunma alanları ve hassas mikro-etkileşimlerle donatıldı.'),
  item('492/492 Test ve Bütünlük', 'Tüm hesaplama motorları, kas kuralları ve performans bütçeleri tam uyumla doğrulandı.'),
]);

const RELEASE_10_4 = release('10.4', '2026-08-31', 'Okunabilir Tipografi, Sıfır Kontrast Hatası ve Alt Sayfa Modalleri', [
  item('Tüm Metin Ölçeği İki Punto Büyüdü', 'Arayüzdeki en küçük yazı boyutları 7–13 punto aralığından 9–15 punto aralığına taşındı. Salonda telefonu uzaktan okumak, küçük etiketleri zorlanmadan seçmek mümkün.'),
  item('En Küçük Yazı Artık Ayarı Dinliyor', 'En küçük punto kademesi yazı boyutu ayarının dışında kalmıştı; 51 kullanım noktası ayarı görmezden geliyordu. Artık ölçeğin tamamı ayarla birlikte büyüyor.'),
  item('Sıfır Kontrast Hatası', 'Beş ana ekranda ölçülen 31 WCAG AA kontrast ihlalinin tamamı giderildi. Soluk gri metinler bir kademe açıldı, beyaz yazı taşıyan renkli zeminler bir kademe koyulaştı.'),
  item('Altın Zeminde Okunur Metin', 'Birincil butonların altın degradesi en koyu tonda bitiyordu; üzerindeki metin kaybolmaya yakındı. Degrade artık bir kademe açık tonda kapanıyor.'),
  item('Yoğun Modaller Alt Sayfaya Dönüştü', 'Blok karşılaştırma, koç defteri, kanıt paneli ve senaryo pencereleri telefonda ortalanmış kart yerine alt sayfa olarak açılıyor. Kart biçimi 97 punto dikey, 32 punto yatay alanı boşa harcarken içerik yine de kayıyordu.'),
  item('İçeriğe Göre Büyüyen Sayfa', 'Alt sayfa sabit yükseklikte değil: kısa içerik kadar yer kaplıyor, uzun içerikte ekranın tamamına yaklaşıyor. Üstte her koşulda kapatma için bir şerit kalıyor.'),
  item('Çentik ve Home Indicator Koruması', 'Kenardan kenara açılan sayfalarda içerik artık çentiğin ve alt çubuğun altına girmiyor; güvenli alan payları hesaba katılıyor.'),
  item('Kilitlenen Haftalık Plan Düğmesi', 'Ana ekrandan haftalık planı açan düğme tanımsız bir işlevi çağırıyor ve uygulamayı çökertiyordu. Düğme doğru pencereyi açıyor.'),
  item('Devre Dışı Durumlar Korundu', '83 dosyada yapılan renk düzeltmesi sırasında devre dışı buton ve alanların soluk görünümü bilinçli olarak dokunulmadan bırakıldı; pasif olan pasif görünmeye devam ediyor.'),
  item('492/492 Test ve Bütünlük', 'Tüm hesaplama motorları, kas kuralları, mağaza ve performans kapıları sıfır hata ile doğrulandı.'),
]);

const RELEASE_10_5 = release('10.5', '2026-08-31', 'Salonda Kullanılabilirlik: 44 Punto Dokunma Tabanı ve İsteğe Bağlı Hazır Oluşluk', [
  item('Her Dokunma Hedefi En Az 44 Punto', 'Beş ekran ve altı analiz sekmesinde ölçülen 208 dokunma hedefi 44 puntonun altındaydı; en küçüğü 23×17 puntoydu — gereken alanın beşte biri. Taban tek yerden verildi, artık hiçbiri altında değil.'),
  item('Set Giriş Alanları Büyüdü', 'Kilo, tekrar ve RIR alanları 40 punto yüksekliğindeydi ve tekrar alanı yalnızca 49 punto genişti. Uygulamanın en çok dokunulan yeri burası; 66 girdinin tamamı tabana çekildi.'),
  item('Hazır Oluşluk Artık Bir Kapı Değil', 'Antrenmana başlamak beş kaydırıcılı bir formun arkasındaydı. Puanlama isteğe bağlı hale geldi: doğrudan başlayabilir ya da paneli açıp bugünü puanlayabilirsin.'),
  item('Uydurma Hazır Oluşluk Puanı Kaldırıldı', 'Kaydırıcılara hiç dokunmasan bile varsayılanlar gerçek veri gibi kaydediliyor, 60/100 puan üretiyor ve reçete edilen ağırlıkları değiştiriyordu. Puanlamazsan artık kayda hazır oluşluk yazılmıyor ve seans uyarlanmıyor.'),
  item('Hareket Adı Yeniden Okunabilir', 'Aktif seansta hareket başlığı satırındaki altı ikon 264 puntoyu yiyor, geriye hareket adına 26 punto kalıyordu. Ad artık satırı alıyor.'),
  item('Etiketli Hareket Menüsü', 'Yukarı/aşağı taşı, süperset, alternatifler, kas eşlemesi ve çıkar eylemleri tek menüde ve artık yazıyla. Altı çıplak ikonun ne yaptığı tahmin edilmek zorunda değil.'),
  item('Geçen Seans Satırı Gizlenmiyor', 'Bir önceki seansın setleri gizli kaydırma çubuğu ardında ekran dışında kalıyordu. Setler arasında bakılan referans veri artık satıra sığmıyorsa alta iniyor.'),
  item('Sayısal Alanlarda Sayı Klavyesi', 'Dört alan mobilde tam klavye açıyordu; hepsi ondalık tuş takımına geçti.'),
  item('Analiz Sekmesi ve Özet Satırları', 'Altı analiz sekmesi satıra sığmıyor, "BESLENME" kırpılıyordu. Kart özetleri de ortalarından kesiliyordu; artık iki satıra iniyorlar.'),
  item('Başlık ve Kalan Kontrast Hataları', 'Aktif seanstaki hedef ve rekor satırlarının kontrastı eşiğin altındaydı, giderildi. Uygulama başlığı üç satıra bölünmüyor; üst çubuk 110 puntodan 76 puntoya indi.'),
  item('492/492 Test ve Bütünlük', 'Tüm hesaplama motorları, kas kuralları, mağaza ve performans kapıları sıfır hata ile doğrulandı.'),
]);

const RELEASE_10_6 = release('10.6', '2026-08-31', 'Vücut Haritası Sabit, Arayüz Sadeleşti', [
  item('Vücut Haritası Ana Ekranda Sabit', 'Uygulamanın tek bakışta okunan görseli katlanan bir bölümün içindeydi ve varsayılan kapalıydı. Artık ana ekranda her zaman açık; sayısal ayrıntılar katlı kalmaya devam ediyor.'),
  item('Seçili Antrenmanın Haritası', 'Antrenman sekmesindeki akıllı seçim artık hangi bölgeleri çalıştıracağını haritada gösteriyor. "Bugün ne çalışayım" kararı, gerekçe listesinden çok daha hızlı okunuyor.'),
  item('Tek Gövde Yazı Tipi', 'Arayüzün neredeyse tüm düz metni daktilo yazısıyla diziliyordu — 1557 kullanım. Cümleler terminal çıktısına benziyordu. Aynı sınıf artık gövde yazı tipini tabular rakamlarla veriyor: sayılar sütun halinde hizalanmaya devam ediyor, cümleler normal okunuyor.'),
  item('Renk Artık Anlam Taşıyor', 'Ana ekrandaki dört hızlı işlem kartı dört ayrı vurgu rengi taşıyordu; her birinde gradyan, renkli ikon kutusu, renkli gölge ve bir rozet vardı. Hiçbiri öne çıkmıyordu. Tek yüzey kaldı ve vurgu yalnızca birincil eylemde.'),
  item('Boş Durum Artık Yeşil Değil', 'Hiç besin girilmemişken günlük hedef parlak yeşille yazılıyordu — iyi bir durum gibi. Uyku puanlanmamışken de mor. İkisi de nötre alındı; renk yalnızca hedefin aşılması gibi gerçek bir duruma ayrıldı.'),
  item('Anlamsız Rozetler Kaldırıldı', 'Kart başlıklarının yanındaki "Merkez", "Hızlı" ve "Haftalık" etiketleri, başlığın söylediğinden fazlasını söylemiyordu.'),
  item('Parlama Döngüsü Kapatıldı', 'Birincil kartın üstünden 5,5 saniyede bir geçen parlama efekti kaldırıldı. Sürekli tekrar eden dekoratif hareket dikkati içerikten çekiyordu.'),
  item('Ekran Geçişi Hızlandı', 'Her sekme değişiminde tüm ekran yüzde 30 opaklıktan yükseliyordu. Süre 0,32 saniyeden 0,18 saniyeye indi; uygulama artık her dokunuşta yeniden yükleniyormuş gibi durmuyor.'),
  item('Sade Ekran Başlıkları', 'Sekme adını birebir tekrarlayan "Antrenman Merkezi" ve "Gelişim Merkezi" üst satırları kaldırıldı; "Güncelleme Merkezi" artık Sürüm Notları.'),
  item('492/492 Test ve Bütünlük', 'Tüm hesaplama motorları, kas kuralları, mağaza ve performans kapıları sıfır hata ile doğrulandı.'),
]);

const RELEASE_10_7 = release('10.7', '2026-08-31', 'Birleşik Menü ve Açık Gezinme', [
  item('Yazılı Üst Çubuk Eylemleri', 'Üç metinsiz simge yerine ne yaptığı açıkça görülen Ekle ve Menü düğmeleri geldi. Hızlı kayıt hâlâ tek dokunuş uzakta.'),
  item('Tek Uygulama Menüsü', 'Arama, ayarlar, tüm araçlar ve beş ana bölüm tek bir yazılı menüde toplandı; seyrek kullanılan küresel eylemler artık dağınık değil.'),
  item('Bulunduğun Bölüm Görünür', 'Menü açıldığında mevcut bölüm Buradasın etiketiyle işaretleniyor; kullanıcı hangi ekranın aktif olduğunu tahmin etmek zorunda kalmıyor.'),
  item('Görev Odaklı Açıklamalar', 'Bugün, Antrenman, Beslenme, Gelişim ve Geçmiş satırları yalnız isim değil, o bölümde yapılabilecek işi de kısa biçimde anlatıyor.'),
  item('Bütün Kısayollar Korundu', 'Alt gezinme, Hızlı Kayıt, Ana Sayfa ve ekran içi bağlamsal kısayollar aynen çalışıyor; sadeleştirme hiçbir özelliği veya erişim yolunu kaldırmadı.'),
  item('Beş Sürümlük UX Yol Haritası', 'Günlük kayıt çalışma alanı, yönlendirilmiş antrenman akışı, koç/analiz karar katmanları ve mağaza öncesi erişilebilirlik v10.8–v11.1 için planlandı.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v10.7 yeni localStorage anahtarı, veri şeması veya göç eklemiyor; mevcut kayıtlar, yedekler ve çevrimdışı çalışma değişmiyor.'),
  item('Otomatik Yayın Kalite Kapısı', 'Birleşik menü, yazılı üst çubuk eylemleri ve yeni yol haritası mevcut regresyon, mağaza ve performans kontrollerine eklendi.'),
]);

const RELEASE_10_8 = release('10.8', '2026-08-31', 'Günlük Kayıt Çalışma Alanı', [
  item('Tek Günlük Kayıt Merkezi', 'Antrenman, kardiyo, beslenme, vücut ölçümü, uyku, zihin ve esneme kayıtları aynı tarih bağlamında tek görev alanında toplandı.'),
  item('Tarihi Kaybetmeden Düzenleme', 'Geçmiş bir güne geçildiğinde ilgili kayıt türüne aynı tarihle gidiliyor; kullanıcı her pencerede günü yeniden seçmek zorunda kalmıyor.'),
  item('Kayıt Durumu Tek Bakışta', 'Her satır o gün veri olup olmadığını ve temel özeti gösteriyor; eksik alanlar zorunlu yapılacaklar gibi değil isteğe bağlı kayıt noktaları gibi sunuluyor.'),
  item('Günün Enerji Özeti', 'Alınan kalori, hesaplanan harcama ve enerji dengesi günlük merkezin üstünde görünürken ayrıntılı kalori dökümüne doğrudan geçilebiliyor.'),
  item('Tarihe Özel Su Kaydı', 'Bugün veya geçmişte seçilen gün için 250 ve 500 mililitrelik su ekleme kısayolları aynı çalışma alanında kullanılabiliyor.'),
  item('İki Doğrudan Erişim', 'Ana sayfadaki Günün Kayıtları kartı ve birleşik uygulama menüsü aynı günlük merkeze bağlandı; ayrıntılı sekmeler korunmaya devam ediyor.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v10.8 yeni kalıcı veri anahtarı veya şema göçü eklemiyor; mevcut localStorage kayıtları, yedekler ve çevrimdışı çalışma biçimi korunuyor.'),
]);

const RELEASE_10_9 = release('10.9', '2026-08-31', 'Yönlendirilmiş Antrenman Yaşam Döngüsü', [
  item('Üç Aşamalı Antrenman Akışı', 'Hazırla, Çalış ve Değerlendir aşamaları antrenman seçimi, aktif seans ve seans raporu boyunca aynı görsel dil ile birbirine bağlandı.'),
  item('Başlamadan Önce Plan Özeti', 'Seçilen şablonun hareket sayısı, çalışma seti ve tahmini süresi hazır oluşluk penceresinde görünür; kullanıcı neye başlayacağını önceden bilir.'),
  item('Ses ve Bildirim Ön Kontrolü', 'Dinlenme uyarısının ses motoru antrenmandan önce kullanıcı dokunuşuyla sınanabiliyor; bildirim izni ve ses hazırlığı açık sonuçla gösteriliyor.'),
  item('Canlı Seansta Tek Sonraki Eylem', 'Aktif antrenmanın üstünde sıradaki hareket ve set baskın bir kartta gösteriliyor; tek dokunuşla ilgili harekete kaydırılıyor veya seans değerlendirmesine geçiliyor.'),
  item('Ayrıntılar Varsayılan Kapalı', 'Hazır oluşluk, tempo, hayalet seans, zaman sıkışması, hacim ve ısınma araçları kaldırılmadan Seans Ayrıntıları katmanında toplandı.'),
  item('Sonraki Seans Odağı', 'Seans raporu rekor, performans değişimi ve plan uyumunu kullanarak tek bir sonraki adım çıkarıyor; rapor yalnız geçmişi anlatmakla kalmıyor.'),
  item('Rapordan Analize Geçiş', 'Seans sonu değerlendirmesinden doğrudan 1RM analizine geçilebiliyor; rapor ile uzun dönem inceleme arasındaki kopukluk kaldırıldı.'),
  item('İstem Dışı Yakınlaştırma Kapatıldı', 'iPhone’da küçük giriş alanına dokununca oluşan otomatik zoom ile iki parmak/double-tap sayfa yakınlaştırması kapatıldı; okunabilirlik Ayarlar içindeki punto seçimiyle yönetilmeye devam ediyor.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v10.9 mevcut localStorage, PWA güncelleme, aktif antrenman ve yedek yapısını değiştirmeden yalnız görev akışını ve rapor çıktısını geliştiriyor.'),
]);

const RELEASE_10_10 = release('10.10', '2026-08-31', 'Sade Gezinme ve Odaklı Ayarlar', [
  item('Tek Gezinme Sistemi', 'Bugün, Antrenman, Beslenme, Gelişim ve Geçmiş geçişleri yalnız alt menüde tutuldu; aynı beş bölümü tekrar eden üst menü kaldırıldı.'),
  item('Ayarlar Artık Doğrudan Açılıyor', 'Üst çubuktaki dişli simgesi kategori ana ekranını tek dokunuşla açıyor; araya uygulama menüsü girmiyor.'),
  item('Arama Her Ekranda Bir Dokunuş Uzakta', 'Üst çubuktaki ayrı arama düğmesi sayfa, araç, hareket, şablon ve geçmiş kayıtlara doğrudan erişimi koruyor.'),
  item('Kayıp Kısayol Yok', 'Günün Kayıtları ve Tüm Araçlar küresel arama komutlarına eklendi; birleşik menü kaldırılırken hiçbir görev yolu kaybolmadı.'),
  item('Telefon İçin Tam Ekran Ayarlar', 'Ayarlar küçük bir kart yerine telefon ekranını kullanan, güvenli alanlara uyan ve kaydırması daha doğal bir çalışma alanına dönüştürüldü.'),
  item('Tek Sütunlu Okunabilir Kategoriler', 'Sekiz ayar kategorisi telefonda küçük iki sütunlu kutular yerine ikon, başlık ve açıklaması rahat okunan tek sütunlu satırlar halinde gösteriliyor.'),
  item('Ayar ve Bölüm Ayrımı Açık', 'Ayar ana ekranı yalnız tercih, yöntem, cihaz, veri ve gizlilik kontrollerini içerdiğini; uygulama bölümlerinin alt menüden açıldığını açıkça belirtiyor.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v10.10 yeni localStorage anahtarı veya şema göçü eklemiyor; mevcut kayıtlar, yedek biçimi ve çevrimdışı çalışma korunuyor.'),
]);

const RELEASE_10_11 = release('10.11', '2026-08-31', 'Günlük Eylem Hiyerarşisi', [
  item('Ana Sayfada Tek Baskın Eylem', 'Dört eşit hızlı işlem kartı yerine antrenman başlatma tek ana eylem olarak gösteriliyor; günlük kayıt, program ve araçlar sakin yardımcı kısayollar olarak korunuyor.'),
  item('Daha Az Görsel Gürültü', 'Ana sayfanın hızlı işlem alanı tek bir yüzeyde toplandı; tekrarlanan kart kenarlıkları ve eşit vurgu yarışı azaltıldı.'),
  item('Okunabilir Koç Göstergeleri', 'Uyku, hazır oluş ve kalori değerleri ile seans sonundaki Kalori/Uyku düğmeleri daha büyük yazı ve en az 44 piksellik dokunma alanı kullanıyor.'),
  item('Hızlı Kayıtta Tarama Kolaylığı', 'Altı renkli kutu, ikon–başlık–açıklama düzenindeki tek sütunlu satırlara dönüştürüldü; kayıtlı alanlar açık bir Kayıtlı etiketiyle işaretleniyor.'),
  item('Günlük Kayıt İlerlemesi', 'Hızlı kayıt başlığı o gün kaç kayıt alanının dolu olduğunu gösteriyor; kullanıcı eksikliği kart kart açmadan anlayabiliyor.'),
  item('Tam Ekran Araç Merkezi', 'Araçlar telefonda küçük bir pencere yerine tam ekran çalışma alanı kullanıyor; arama ve kategori filtreleri kaydırmadan erişilebilir kalıyor.'),
  item('Araç Kategori Filtreleri', 'Antrenman, Enerji & Beslenme, Toparlanma ve Ölçüm & Rapor kategorileri tek dokunuşla süzülebiliyor; 29 araçlık uzun listede arama zorunlu değil.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v10.11 yalnız arayüz hiyerarşisini değiştiriyor; localStorage kayıtları, yedek biçimi ve çevrimdışı çalışma aynı kalıyor.'),
]);

const RELEASE_10_12 = release('10.12', '2026-09-01', 'Ana Sekmelerde Okunabilirlik ve Yönlendirme', [
  item('Ortak Sayfa Başlığı', 'Antrenman, Beslenme, Gelişim ve Geçmiş ekranları aynı başlık, kısa açıklama ve bağlamsal eylem hiyerarşisini kullanıyor; bölüm değiştirince ekranın amacı yeniden öğrenilmiyor.'),
  item('Gelişim Ekranı Artık Kendini Açıklıyor', 'Vücut, hedef, analiz ve kadın döngüsü alt sekmelerinin üstüne belirgin bir Gelişim başlığı ve kısa kapsam açıklaması eklendi.'),
  item('Okunabilir Arşiv Filtreleri', 'Beş sıkışık ve sekiz piksellik arşiv sekmesi, yatay kaydırılabilen 44 piksellik filtre düğmelerine dönüştürüldü; kayıt sayıları ayrı rozetlerde gösteriliyor.'),
  item('Arşivde Yönlendiren Boş Durumlar', 'Boş antrenman, aktivite, ölçüm ve beslenme listeleri yalnız eksikliği bildirmiyor; uygun kayıt ekranını açıyor. Sonuçsuz aramada tek dokunuşla filtre temizleniyor.'),
  item('Beslenmede İşlem Sırası Net', 'Besin arama ve günlük toplam iki giriş yolu olarak yan yana duruyor; kaydetme eylemi bunlardan ayrılan tam genişlikte birincil düğme oldu.'),
  item('Kalori Denklemi Daha Okunabilir', 'Baz hedef, gün farkı, alınan ve kalan değerlerinin etiketleri büyütüldü; makro başlıkları ile hedef metinlerinin kontrastı güçlendirildi.'),
  item('Küçük Dokunma Alanları Büyütüldü', 'Beslenme tarihi, ayar, öğün/toplam modu, su ekleme ve su girişi kontrolleri mobilde en az 44 piksellik hedef kullanıyor.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v10.12 yalnız arayüz ve erişilebilirlik katmanını değiştiriyor; localStorage şeması, yedek biçimi, hesaplamalar ve çevrimdışı çalışma aynı kalıyor.'),
]);

const RELEASE_10_13 = release('10.13', '2026-09-01', 'Odaklı Görev Ekranları', [
  item('Basit Görünüm Gerçekten Sade', 'Basit görünüm artık yalnız birkaç analiz kartını değil; antrenman önerisinin kanıtını, ilerleme bloklarını, alternatif program kurma yollarını ve ileri vücut hesaplarını da kapalı başlatıyor.'),
  item('Antrenman Önerisi Tek Kararla Başlıyor', 'Önerilen seansın adı, kısa gerekçesi ve Başlat eylemi görünür kalıyor; büyük kas haritası, risk açıklaması ve puan yöntemi Neden bu seans düğmesiyle açılıyor.'),
  item('İlerleme Blokları Özetlendi', 'Etkin bloklar ekranda uzun liste oluşturmuyor; kaç hareketin sürdüğü tek satırda görülüyor ve ayrıntılı reçeteler isteğe bağlı açılıyor.'),
  item('Program Kurma Yolları Katmanlandı', 'Yönlendirmeli program veya yarım kalan taslak birincil eylem olarak kalıyor; hazır program, elle kurma, adım şeması ve sıfırdan başlama ikinci katmana alındı.'),
  item('Şablon Kontrolleri Büyütüldü', 'Yeni şablon, tümü/favoriler, favori ve başlat kontrolleri mobilde en az 44 piksellik dokunma hedefi kullanıyor.'),
  item('Vücut Kaydında Ana İş Önde', 'Basit görünümde hızlı kaydetme eylemi ekranın üstüne taşındı. Kayıt tarihi, mevcut profil, hesaplanan kompozisyon ve vücut oranları kısa özetlerle kapalı başlıyor.'),
  item('Vücut Ayrıntıları Kaybolmadı', 'Kaliper, mezura, BMI, FFMI, BMR, oran ve hedef hesapları kaldırılmadı; başlığa dokunulduğunda aynı biçimde kullanılmaya devam ediyor.'),
  item('Geçmiş Ekranı Daha Hızlı Açılıyor', 'Her açılışta yer kaplayan Geçmişe kayıt ekle kartı kaldırıldı; aynı işlem başlıktaki belirgin Ekle düğmesinden açılan tarihli panele dönüştürüldü.'),
  item('Ana Sayfa Su Kontrolleri Erişilebilir', 'Su ekleme ve Beslenmeye geçiş kontrolleri 44 piksellik hedeflere çıkarıldı; yalnız simge kullanan geçişe ekran okuyucu etiketi eklendi.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v10.13 görünür bilgi miktarını azaltıyor fakat özellik, hesaplama veya kayıt silmiyor; localStorage, yedek ve çevrimdışı çalışma değişmedi.'),
]);

const RELEASE_10_14 = release('10.14', '2026-09-01', 'Sade Şablon Düzenleme', [
  item('Hareket Seçici Yeniden Çalışıyor', 'Modalın dışına taşan hareket listesi doğru panel içine alındı. Şablona hareket ekleme ve mevcut hareketi değiştirme telefonda yeniden görünür ve kaydırılabilir.'),
  item('Düzenle Artık Gizli Değil', 'Şablon kartlarında en sık bakım eylemi olan Düzenle doğrudan görünür; sihirbaz, kopyalama ve silme daha seyrek kullanılan Diğer İşlemler katmanında durur.'),
  item('Temel Editör Önce Geliyor', 'Şablon düzenleyici açıldığında ad, süre, set, kalori, hareket sırası ve kaydetme görünür; hacim, seans sihirbazı, vurgu ve öneriler İleri planlama ve analiz başlığından açılır.'),
  item('Hareket Satırları Sadeleşti', 'Sekiz küçük simge yerine büyük set azalt/artır, değiştir ve sıra düğmeleri kullanılıyor. Süperset, en üste/alta taşıma, plan ayarı ve çıkarma tek hareket işlemleri panelinde korundu.'),
  item('Taslak Aynı Kipte Açılıyor', 'Elle hazırlanmış yarım taslak geri açıldığında artık kendiliğinden sihirbaz kipine geçmiyor; kullanıcı kaldığı sade çalışma düzenine dönüyor.'),
  item('Ana Sayfada Daha Az Gürültü', 'Basit görünümde şablon kartları Başlat ve favori eylemlerine odaklanıyor; düzenleme ve silme Antrenman bölümündeki belirgin yönetim akışında kalıyor.'),
  item('Mobil Dokunma Alanları Büyüdü', 'Şablon düzenleme, set sayısı, sıra ve varsayılan set kontrolleri tek elle kullanılabilecek daha büyük hedeflere çıkarıldı.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v10.14 localStorage şemasını, yedek biçimini, mevcut şablonları ve çevrimdışı çalışma davranışını değiştirmiyor.'),
]);

const RELEASE_10_15 = release('10.15', '2026-09-01', 'Tek Görevli Günlük Ekranlar', [
  item('Beslenme Özeti Sadeleşti', 'Basit görünümde teknik dört parçalı kalori denklemi yerine hedef, alınan ve yakılan değerleri okunuyor; tam denklem Detaylı görünümde korunuyor.'),
  item('Günlük Toplama Doğrudan Geçiş', 'Günlük Toplam düğmesi makro girişini seçip editöre götürüyor; boş ilk öğün artık basit görünümde kendiliğinden açılmıyor.'),
  item('Tek Kaydetme Eylemi', 'Beslenme ve Vücut ekranlarında basit modda aynı işi yapan ikinci kaydetme düğmeleri kaldırıldı; kayıt işlevi değişmedi.'),
  item('Analizler Tek Çatı Altında', 'Su hedefi, enerji dengesi, yedi günlük beslenme tablosu ve gerçek harcama tek Takip ve Analiz başlığında toplandı.'),
  item('Koçta Yinelenen Başlatma Yok', 'Plan veya kardiyo bulunmayan basit ana ekranda ikinci Serbest Başlat düğmesi gösterilmiyor; tek baskın Antrenmanı Başlat eylemi kalıyor.'),
  item('Daha Kısa Antrenman Rehberi', 'Basit Antrenman ekranı Hazırla, Çalış ve Değerlendir aşamalarını açıklama satırları olmadan gösteriyor; Detaylı görünüm aynı rehberi koruyor.'),
  item('Arşivde Daha Az Gürültü', 'Basit görünümde tekrarlanan öğretici kart kaldırıldı; arama, filtre, geçmişe ekleme ve gün gün kalori erişimi görünür kaldı.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v10.15 yalnız görünür bilgi hiyerarşisini değiştiriyor; localStorage, yedek biçimi, hesaplamalar ve çevrimdışı çalışma aynı kalıyor.'),
]);

const RELEASE_10_16 = release('10.16', '2026-09-01', 'Okunur Analiz ve Sade Aktif Seans', [
  item('Analiz Seçimi Artık Okunuyor', 'Altı dar sekme tek satıra sıkışmıyor; ikonlu 3×2 düzen, her seçeneğe en az 44 piksellik dokunma alanı veriyor.'),
  item('Her Analiz Amacını Açıklıyor', 'Seçilen Vücut, 1RM, Hacim, Plan, Besin veya Koç ekranının neyi cevapladığı kısa bir bağlam satırında görülüyor.'),
  item('Basit Hacim Analizi Duvar Değil', 'Hacim-doz, öncelik, program, kalite ve sıklık bölümleri basit görünümde kapalı başlıyor; veri ve hesapların tamamı başlıklardan açılıyor.'),
  item('1RM Seçimi Yol Üstünden Çekildi', 'Hareket seçildikten sonra uzun arama listesi basit görünümde kapanıyor; grafik görünür kalıyor ve hareket değiştirme tek başlıktan yapılıyor.'),
  item('Koç Kanıtı İsteğe Bağlı', 'Derin Koç görünümündeki plato ve yetmezlik kartları basit modda otomatik açılmıyor; Karar ekranı ilk durak olmaya devam ediyor.'),
  item('Beslenme Analizi Katmanlandı', 'Kalori ortalaması, hedef ve enerji dengesi önde; makro dağılımı, tutarlılık, grafik ve günlük tablo tek ayrıntı başlığında korunuyor.'),
  item('Aktif Seansta Setler Önce', 'Isınma, seans notu, şablon planı ve kas katkısı her harekette ayrı şeritler oluşturmak yerine tek Hareket ayrıntıları alanında toplanıyor.'),
  item('Kritik Seans Bilgileri Gizlenmedi', 'Ağrı uyarısı, vücut ağırlığı hesabı, kurulum notu ve progresyon reçetesi set girişinin yanında görünür kalıyor.'),
  item('Detaylı Görünüm Korundu', 'Ayrıntılı arayüzü seçen kullanıcı analiz ve hareket bilgilerini önceki gibi açık görmeye devam ediyor.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v10.16 yalnız arayüz hiyerarşisini değiştiriyor; localStorage, yedek biçimi, hesaplamalar ve çevrimdışı çalışma değişmiyor.'),
]);

const RELEASE_10_17 = release('10.17', '2026-09-01', 'Daha Kısa Günlük Akışlar', [
  item('Ana Ekran Günlük Karara Odaklandı', 'Basit görünümde global Ekle ile aynı işi yapan Günlük kısayolu tekrar gösterilmiyor; Antrenmanı Başlat, Program ve Araçlar kalıyor.'),
  item('Kas Haritası Kaybolmadan Katlandı', '430 piksellik interaktif ısı haritası basit görünümde Haftalık Durum açıldığında hazırlanıyor; detaylı görünümde önceki gibi açık başlıyor.'),
  item('Ana Sayfa Yaklaşık Yüzde 27 Kısaldı', '393×852 ölçümünde basit ana ekran 2,2 ekran kaydırmadan 1,6 ekrana indi; günlük ana eylemler ilk görünümde kalıyor.'),
  item('Beslenmede Tek Ana Kayıt Yolu', 'Besin Ekle ve Günlük Toplam eylemleri üstte bir kez gösteriliyor; aynı Besin Bul ve Boş Öğün düğmeleri basit editörde tekrarlanmıyor.'),
  item('Giriş Modu Tek Kontrole İndi', 'Basit görünümde Öğünler ve Toplam için iki sekme yerine mevcut modu açıklayan tek değiştir düğmesi kullanılıyor.'),
  item('Seyrek Gün Ayarları Tek Çatıda', 'Boş öğün, güne özel NEAT, şablon, geçmişten kopyalama ve kalori detayı Diğer kayıt yolları altında toplandı.'),
  item('NEAT Ayarına Doğrudan Geçiş', 'Güne Özel Hareket seçildiğinde editör doğru konuma kayıyor ve yalnız o tarihe ait hareket modu ile çarpan paneli açık geliyor.'),
  item('Beslenme Ekranı Ölçülebilir Biçimde Sade', 'Görünür eylem sayısı 23’ten 19’a, kaydırma oranı 1,7 ekrandan 1,5 ekrana indi; kayıt ve analiz işlevleri korunuyor.'),
  item('Detaylı Görünüm Değişmedi', 'İki giriş sekmesi, NEAT paneli, alt Besin Bul ve Boş Öğün kontrolleri detaylı modda önceki yerlerinde kalıyor.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v10.17 veri şemasını, localStorage kayıtlarını, yedek biçimini, hesaplamaları veya çevrimdışı çalışma davranışını değiştirmiyor.'),
]);

export const LATEST_RELEASE_NOTES = release(APP_VERSION, '2026-09-01', 'Tek Seçimli Sade Ekranlar', [
  item('Analiz Duvarı Tek Seçime İndi', 'Basit görünümde Vücut, 1RM, Hacim, Plan, Besin ve Koç seçenekleri aynı anda altı düğme olarak yarışmıyor; mevcut alanı ve amacını anlatan tek mobil seçici kullanılıyor.'),
  item('Telefonun Kendi Seçicisi Kullanılıyor', 'Analiz ve arşiv alanı değiştirilirken iOS/Android’in alışıldık native seçim arayüzü açılıyor; seçeneklerin tamamı erişilebilir kalıyor.'),
  item('Arşiv Filtreleri Tek Kontrolde', 'Tümü, Ağırlık, Aktivite, Ölçüm ve Besin filtreleri basit modda tek açıklamalı seçicide toplandı; seçili türün kayıt sayısı ve kapsamı doğrudan görülüyor.'),
  item('Vücut Kaydı Önce Geliyor', 'Basit Vücut ekranında günlük ana iş olan ölçümü kaydetme, hedef ve geçmiş araçlarından önce gösteriliyor.'),
  item('Ölçüm Araçları Tek Çatıda', 'Hedef Merkezi, geçmiş ölçüm kıyaslama ve vücut hesaplama ayarları tek Hedefler ve Ölçüm Araçları başlığından açılıyor.'),
  item('Detaylı Mod Aynen Korundu', 'Altı analiz sekmesi, beş arşiv filtresi ve vücut araçlarının doğrudan düğmeleri Detaylı görünümde önceki yerlerinde kalıyor.'),
  item('Kesilen Uygulama Adı Düzeltildi', '393 piksel genişlikte üst çubuktaki Hypertrophy LAB adı artık Ekle düğmesinin altında kesilmiyor; arama ve ayar dokunma alanları küçültülmedi.'),
  item('Tekrar Eden Açıklama Kaldırıldı', 'Basit analiz seçicisi hem aktif alanı hem amacını anlattığı için aynı bilgiyi ikinci kartta tekrar göstermiyor.'),
  item('İşlev Kaybı Yok', 'Yeni seçiciler yalnız görünür kontrol sayısını azaltıyor; bütün analiz, arşiv, hedef, kıyaslama ve ayar yolları çalışmaya devam ediyor.'),
  item('PWA ve Kullanıcı Verisi Korundu', 'v10.18 localStorage anahtarlarını, veri şemasını, yedek biçimini, hesaplamaları ve çevrimdışı çalışma davranışını değiştirmiyor.'),
]);

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
  RELEASE_10_17,
  RELEASE_10_16,
  RELEASE_10_15,
  RELEASE_10_14,
  RELEASE_10_13,
  RELEASE_10_12,
  RELEASE_10_11,
  RELEASE_10_10,
  RELEASE_10_9,
  RELEASE_10_8,
  RELEASE_10_7,
  RELEASE_10_6,
  RELEASE_10_5,
  RELEASE_10_4,
  RELEASE_10_3,
  RELEASE_10_2,
  RELEASE_10_1,
  RELEASE_10_0,
  RELEASE_9_9,
  RELEASE_9_8,
  RELEASE_9_7,
  RELEASE_9_6,
  RELEASE_9_5,
  RELEASE_9_3,
  RELEASE_9_1,
  RELEASE_9_0,
  RELEASE_8_9,
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
