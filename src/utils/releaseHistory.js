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

export const LATEST_RELEASE_NOTES = release(APP_VERSION, '2026-08-28', 'Güven Aralıklı İlerleme ve Tarihsel Veri Güveni', [
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
