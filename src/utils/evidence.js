/**
 * Kanıt defteri.
 *
 * Uygulama onlarca sayı gösteriyor — eşik 4 set, tavan 11 set/seans, hedef RIR
 * 1-2 — ve hiçbirinin nereden geldiği yazmıyordu. Bu iki ayrı soruna yol
 * açıyor: kullanıcı sayıya ya körü körüne inanıyor ya da hiç inanmıyor, ve
 * ikisi de kötü.
 *
 * Asıl mesele daha da keskin: hacim konusunda literatür BÖLÜNMÜŞ. Bir kanıt
 * hattı "daha fazla set daha fazla kas" diyor, diğeri doğrudan denemelerde
 * fark bulamıyor. Tek bir sayı gösterip kaynağı gizlemek, olmayan bir uzlaşı
 * varmış gibi davranmak olurdu.
 *
 * Bu yüzden her kayıtta `counterpoint` alanı var ve boş bırakılmıyor: karşı
 * görüşü olmayan bir bulgu, ya gerçekten tartışmasızdır ya da eksik
 * araştırılmıştır. Hangisi olduğunu yazmak okuyucunun hakkı.
 */

export const EVIDENCE_LINES = {
  metaReg: {
    key: 'metaReg', label: 'Meta-regresyon',
    hint: 'Çok sayıda çalışmayı toplulaştırır. Geniş kapsam, ama havuzun çoğu antrenmansız ve kısa süreli çalışma.',
  },
  directTrial: {
    key: 'directTrial', label: 'Doğrudan deneme',
    hint: 'Tek bir soruyu denetimli test eder. Dar kapsam, ama karıştırıcı değişkenler kontrollü.',
  },
  survey: {
    key: 'survey', label: 'Saha anketi',
    hint: 'İnsanların ne yaptığını ölçer, ne işe yaradığını değil.',
  },
};

export const EVIDENCE = [
  {
    key: 'fractional-counting',
    topic: 'Set sayımı',
    claim: 'Dolaylı setleri yarım sayan "kesirli" yöntem, sonuçları en iyi açıklayan sayım biçimi.',
    line: 'metaReg',
    source: 'Pelland ve ark., Sports Medicine, 2026',
    sample: '67 çalışma · 2058 katılımcı',
    usedFor: 'Uygulamanın katkı modeli (birincil 1, yardımcı 0.5, hafif 0.25) ve bütün hacim hesapları.',
    counterpoint: 'Sayım yönteminin kendisi bir modelleme tercihi; "0.5" katsayısı ölçülmüş bir fizyolojik değer değil, veriye en iyi uyan yuvarlak sayı.',
  },
  {
    key: 'volume-curve',
    topic: 'Haftalık hacim',
    claim: 'Hacim arttıkça hipertrofi artıyor; azalan verimle ama platosuz. ~12 sette set başına yaklaşık %0.24 kas artışı.',
    line: 'metaReg',
    source: 'Pelland ve ark., Sports Medicine, 2026',
    sample: '67 çalışma · 2058 katılımcı',
    usedFor: 'Doz-yanıt aralığının ALT ucu. Aynı hacimde daha düşük bir uyaran payı veriyor — yani "daha eklenecek yer var" diyen hat.',
    counterpoint: 'Havuzun büyük kısmı antrenmansız katılımcı ve 8-12 haftalık çalışma. Set başına %0.24, tek bir kişide ultrason ya da çevre ölçümünün hata payının altında — yani bireysel olarak ölçülemez bir fark.',
  },
  {
    key: 'equivalence-trial',
    topic: 'Haftalık hacim',
    claim: 'Haftada 9 kesirli set ile 36 kesirli set arasında kas alanı bakımından istatistiksel DENKLİK bulundu.',
    line: 'directTrial',
    source: 'Çok merkezli randomize denklik denemesi, 2025',
    sample: '120 randomize · 87 tamamladı · 12 hafta',
    usedFor: 'Doz-yanıt aralığının ÜST ucu. Aynı hacimde daha yüksek bir uyaran payı veriyor — yani "zaten yeterlisin" diyen hat. "Tartışmalı bölge" bandını da bu tanımlıyor.',
    counterpoint: 'Kas alanı çevre ve deri kıvrımı ölçümünden kestirildi; doğrudan görüntülemeye göre daha kaba bir ölçüt. Denklik göstermek, farkın olmadığını kanıtlamakla aynı şey değil — yalnızca varsa bile küçük olduğunu gösterir.',
  },
  {
    key: 'add-vs-maintain',
    topic: 'Hacim artışı',
    claim: 'Mevcut hacmin üstüne set eklemek, mevcut hacmi korumaktan daha iyi sonuç vermedi.',
    line: 'directTrial',
    source: 'Enes ve ark., Eur J Appl Physiol, 2024',
    sample: '42 kişi · kol içi randomizasyon · 12 hafta',
    usedFor: 'Koçun "set ekle" tavsiyesinin tek çözüm olmaktan çıkarılması.',
    counterpoint: 'Tek eklem hareketi (dirsek bükme) üzerinde yapıldı; büyük bileşke hareketlere genellenip genellenemeyeceği bilinmiyor.',
  },
  {
    key: 'set-progression',
    topic: 'Blok ilerlemesi',
    claim: 'Haftalık set artışı ile sabit hacim arasında kas boyutunda anlamlı fark yok.',
    line: 'directTrial',
    source: 'Enes ve ark., MSSE 2024 (31 erkek) ve J Sports Sci 2025 (30 kadın)',
    sample: '61 antrenmanlı katılımcı · 12 hafta',
    usedFor: 'Mezosiklikteki "Sabit Hacim" ilerleme kipi.',
    counterpoint: 'Her iki çalışmada da artan hacim kolunda kuvvette küçük bir avantaj bildirildi; örneklemler kas boyutundaki küçük farkları yakalamak için sınırlı olabilir.',
  },
  {
    key: 'minimum-dose',
    topic: 'Minimum doz',
    claim: 'Haftada iki-üç kez tek set, yetmezliğe kadar: antrenmanlı erkeklerde anlamlı 1RM artışı (toplam +12.09 kg).',
    line: 'metaReg',
    source: 'Androulakis-Korakakis, Fisher, Steele; Sports Medicine, 2020',
    sample: 'Sistematik derleme ve meta-analiz',
    usedFor: '"Minimum Etkili Doz" hacim felsefesi.',
    counterpoint: 'Sonuç ölçütü 1RM kuvveti, kas boyutu değil. Kuvvet ile hipertrofi doz-yanıtları farklı davranıyor — kuvvette azalan verim çok daha erken başlıyor.',
  },
  {
    key: 'session-ceiling',
    topic: 'Seans başı hacim',
    claim: 'Tek seansta kas başına ~11 kesirli setten sonra ek fayda ölçülemiyor (kuvvette ~2 doğrudan set).',
    line: 'metaReg',
    source: 'Seans başı hacim meta-regresyonu',
    sample: '67 çalışma · 2058 katılımcı',
    usedFor: 'Seans başı tavan uyarısı; program sihirbazı ve şablon düzenleyici.',
    counterpoint: 'Haftalık hacimden bağımsız bir kısıt olarak modellenmiş; ikisinin birbirini nasıl etkilediği doğrudan test edilmedi.',
  },
  {
    key: 'proximity',
    topic: 'Yetmezliğe yakınlık',
    claim: 'Setler yetmezliğe yaklaştıkça hipertrofi artıyor (düzleşerek). Kuvvette ilişki ihmal edilebilir.',
    line: 'metaReg',
    source: 'Robinson, Refalo ve ark., Sports Medicine, 2024',
    sample: '55 hipertrofi · 67 kuvvet çalışması',
    usedFor: 'Kademeli etkili set ağırlıkları ve yakınlık hedefleri.',
    counterpoint: 'RIR çalışmaların tarifinden KESTİRİLDİ, ölçülmedi. İnsanlar yetmezliğe uzaklığını sistematik olarak fazla tahmin ediyor — yani "RIR 2" denen setlerin bir kısmı aslında daha uzaktı.',
  },
  {
    key: 'volume-doubts',
    topic: 'Yöntem eleştirisi',
    claim: 'Doz-yanıt ilişkisini destekleyen çalışmalarda raporlanan büyüme, literatürün geri kalanından belirgin biçimde yüksek.',
    line: 'directTrial',
    source: 'Buckner, Hammert, Loenneke ve ark.',
    sample: 'Yöntem eleştirisi',
    usedFor: 'Eğrinin tek çizgi değil şerit olarak modellenmesi.',
    counterpoint: 'Bir ölçüm sorununa işaret etmek, ilişkinin olmadığını göstermez; eleştiri kendi başına bir bulgu değil.',
  },
  {
    key: 'physique-survey',
    topic: 'Saha pratiği',
    claim: 'Yarışmacı fizik sporcuları haftada göğüs 20-32, kanat 24-32, quadriceps 16-24 TOPLAM set bildiriyor.',
    line: 'survey',
    source: 'Frontiers in Sports and Active Living, 2025',
    sample: '154 yarışmacı sporcu',
    usedFor: 'Set sayımı kartındaki referans sütunu.',
    counterpoint: 'Anket ne işe yaradığını değil ne yapıldığını ölçüyor. Sayılar TOPLAM birimde; uygulamanın kesirli sayılarıyla doğrudan karşılaştırılamaz. Ayrıca bu sporcuların çoğu ilaç kullanıyor olabilir ve toparlanma kapasiteleri genellenemez.',
  },
  {
    key: 'training-status',
    topic: 'Deneyim seviyesi',
    claim: 'Pratik uzlaşı: acemi haftada 10 setin altında, orta seviye 10-20, ileri seviye 20+ set.',
    line: 'metaReg',
    source: 'Karma — meta-regresyonlarda seviye kovaryat olarak kontrol edildi',
    sample: 'Doğrudan bir moderasyon sonucu raporlanmadı',
    usedFor: 'Seviyeye göre bandın kaydırılması ve genişletilmesi.',
    counterpoint: 'Bu, kanıt defterindeki en zayıf kayıt. Seviyenin hacim ihtiyacını ne kadar değiştirdiğini gösteren temiz bir doğrudan karşılaştırma yok; sayılar uzman uzlaşısına dayanıyor. Uygulamanın ileri seviyede bandı GENİŞLETMESİ tam olarak bu yüzden: doğru cevabın nerede olduğu orada daha belirsiz.',
  },
];

export const findEvidence = (key) => EVIDENCE.find(e => e.key === key) || null;

export const evidenceByTopic = () => {
  const konular = new Map();
  EVIDENCE.forEach(e => {
    const liste = konular.get(e.topic) || [];
    liste.push(e);
    konular.set(e.topic, liste);
  });
  return [...konular.entries()].map(([topic, items]) => ({ topic, items }));
};

/** Bir konuda kanıt hatları çelişiyor mu. */
export const isContested = (topic) => {
  const hatlar = new Set(EVIDENCE.filter(e => e.topic === topic).map(e => e.line));
  return hatlar.has('metaReg') && hatlar.has('directTrial');
};
