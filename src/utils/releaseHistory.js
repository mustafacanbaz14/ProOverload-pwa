import { APP_VERSION } from './constants.js';

const item = (title, desc) => ({ title, desc });
const release = (version, date, title, items) => ({ version, date, title, items });

/**
 * Sürüm notları constants.js içinde tek ve giderek büyüyen bir dizi olarak
 * tutuluyordu. Son güncelleme penceresi bu yüzden 6.0'dan bugüne her maddeyi
 * "yeni" diye gösteriyordu. Burada sürümler gerçek gruplar halinde ve yalnız
 * bu pencere açıldığında indirilen ayrı parçada tutulur.
 */
export const LATEST_RELEASE_NOTES = release(APP_VERSION, '2026-08-27', 'ProOverload 8.1', [
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
