export const FORM_RATINGS = Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `${i + 1}/10` }));

export const FAT_METHOD_LABELS = { skinfold: 'Kaliper Bazlı', navy: 'Mezura Bazlı', average: 'Ortalama', manual: 'Manuel' };

export const DEFAULT_SETTINGS = {
  autoCopyLastSet: true, nutritionGoal: 'bulk', proteinPerFfmBulk: 2.2, proteinPerFfmCut: 2.6,
  lockScreenActivity: true, keepScreenAwake: true,
  autoRestTimer: true, restSeconds: 120, restAlert: true,
  // Dinlenme süresi harekete göre önerilsin mi. Kapalıysa genel restSeconds
  // kullanılır — ağır squat ile lateral raise aynı süreyi paylaşır.
  smartRest: true,
  // Barfiks/dip/şınav gibi hareketlerde taşınan vücut ağırlığı yüke sayılsın mı.
  // Kapatınca ağırlık alanı mutlak yük olarak okunur (toplam ağırlığı elle
  // girenler için).
  bodyweightLoad: true,
  // Ağırlık alanının anlamı: 'auto' set bazında tanır (karışık geçmişi kurtarır),
  // 'added' daima ek yük, 'total' daima toplam yük sayar.
  bodyweightEntry: 'auto',
  // Salonun plaka envanteri (kg, tek plaka). Boş bırakılamaz; normalizePlates
  // boş listeyi varsayılana çeviriyor.
  availablePlates: [25, 20, 15, 10, 5, 2.5, 1.25],
  repRangeMin: 6, repRangeMax: 10,
  experienceLevel: 'intermediate',
  // Hareket seçiminde varsayılan olarak yalnızca daha önce yapılmış hareketler
  // listelenir; gerisi arama ile bulunur.
  pickerShowAll: false,
  // Kullanıcının kendi görünürlük listesi: hiddenExercises yapılmış olsa bile
  // listeden çıkarır, pinnedExercises hiç yapılmamış olsa bile listeye sokar.
  hiddenExercises: [],
  pinnedExercises: [],
  // 1RM analiz listesinin kendi gizleme listesi — antrenman seçimindekinden ayrı.
  hidden1RMExercises: [],
  // Haftalık programlar: adlandırılmış liste, her gün saatli slot dizisi.
  // Biri "aktif" seçilir ve ana ekrandaki teorik hesaplar onu kullanır.
  weekPlans: [],
  activePlanId: '',
  // Eski tek program biçimi (gün -> şablon kimliği). Yalnızca göç için
  // duruyor; yazma artık weekPlans üzerinden yapılıyor.
  weekPlan: {},
  // Ana sayfadaki 16 satırlık kas hacmi listesi varsayılan olarak kapalı.
  showMuscleVolume: false,
  // Vücut kompozisyonu hedefleri. Boş string = hedef konulmamış; ölçüm kaydına
  // değil ayarlara yazılıyor çünkü hedef zaman içinde sabit bir niyet, o günün
  // ölçümü değil.
  goalWeight: '',
  goalBodyFat: '',
  goalFFM: '',
  goalFFMI: '',
  // Çevre ve kaliper hedefleri ölçüm kayıtlarından ayrı tutulur; geçmiş kayıt
  // düzenlenirken hedef yanlışlıkla geçmiş güne yazılmaz.
  goalMeasurements: {},
  goalSkinfolds: {},
  // Hareket performans hedefleri: örn. Bench Press 150 kg × 1 tekrar.
  // Ölçüm hedefleri gibi ayarlarda tutulur; geçmiş antrenman kayıtları değişmez.
  strengthGoals: [],
  // Eklem ağrısı günlüğü: { date, region, severity, note, exercise }.
  // Ayrı bir depolama anahtarı yerine ayarlarda; strengthGoals gibi küçük ve
  // yedeklemeye zaten dahil olan bir koleksiyon.
  painLog: [],
  // Hareket bazlı tekrar aralığı: { 'Barbell Bench Press': { min, max } }.
  // Yazılmayan hareketler kas grubu varsayılanına, o da yoksa genel aralığa düşer.
  repRangeOverrides: {},
  // Hareket bazlı ilerleme kuralı: { 'Barbell Bench Press': 'linear' }.
  // Yazılmayan hareketler çift ilerleme kullanıyor; varsayılanı da yazmak
  // ayarları her hareket için bir satırla şişirirdi.
  progressionRules: {},
  // Dinlenme bitince sistem bildirimi. Varsayılan kapalı: izin isteği
  // kullanıcı açıkça istediğinde sorulmalı.
  restNotification: false,
  // Müzik önceliği. Açıkken kilit ekranı kartı hiç başlatılmıyor; kart
  // duyulmaz bir ses döngüsüyle var olduğu ve cihazda tek bir "Şu An Çalınan"
  // oturumu olabildiği için ikisi aynı anda yaşayamıyor.
  musicPriority: false,
  // Dinlenme bitiş uyarısının şiddeti: 'soft' | 'strong' | 'insistent'.
  // Varsayılan 'strong' — eski tek bip müzik çalarken duyulmuyordu.
  restAlertIntensity: 'strong',
  // 7.1 uyarı merkezi. Ton ve ses düzeyi birbirinden ayrıdır; ön uyarı ses
  // donanımının saatine baştan yazıldığı için arka plan timer'ına bağlı kalmaz.
  restAlertTone: 'ascending',
  restAlertVolume: 0.85,
  restPreAlertSeconds: 10,
  restVisualAlert: true,
  // Dinlenme boyunca ses motorunu ayakta tutar. Ekran kapanınca tarayıcı hem
  // sayfayı donduruyor hem motoru askıya alıyordu ve zamanlanmış uyarı hiç
  // çalmıyordu. Duyulmayan bir çıkış sayfayı "ses çalıyor" sınıfında tutuyor.
  // Varsayılan açık: kapalıyken uyarı ekran kapalıyken kaçabiliyor.
  restKeepAwake: true,
  // Kas bazında kişisel haftalık hacim hedefi: { 'Yan Omuz': { mev, mav, mrv } }.
  // Yazılmayan kaslar literatür değerlerini kullanmaya devam ediyor.
  volumeTargets: {},
  // Su takibi: { '2026-08-24': 2300 } — gün başına toplam mililitre.
  // Her bardağı ayrı satır tutmak kimsenin sürdüremediği bir alışkanlık;
  // amaç günün toplamını bilmek.
  waterLog: {},
  waterHeatBonus: false,
  // Antrenman hedefi modu: tekrar aralığı, dinlenme ve ilerleme
  // varsayılanlarını tek yerden kaydırıyor. Elle yazılmış hareket ve şablon
  // aralıkları moddan üstün kalıyor.
  trainingGoal: 'hypertrophy',
  // Hareket adı → saniye. Yazılmayan hareketler akıllı/genel süreye düşer.
  exerciseRestOverrides: {},
  // Kardiyo hedefi: { preset, lowMinutes, highSessions }. Boş bırakılan
  // sayılar önayarın değerini kullanıyor.
  cardioGoal: { preset: 'off', lowMinutes: '', highSessions: '' },
  // Nabız bölgesi yöntemi: 'max' (maksimumun yüzdesi) | 'hrr' (Karvonen).
  // Karvonen dinlenme nabzı ister; yoksa sessizce 'max' kullanılır.
  zoneMethod: 'max',
  restingHr: '',
  // Elle girilen maksimum nabız. Doluysa Tanaka tahmininin yerine geçiyor:
  // formül bir popülasyon ortalaması, saha testi kişinin kendi değeri.
  maxHrManual: '',
  // Havuz uzunluğu (m). SWOLF bir havuz uzunluğu için tanımlı.
  poolLength: '25',
  // Sabah dinlenme nabzı günlüğü: [{ date, bpm }]. Tek bir ayar değeri
  // yerine seri tutuluyor çünkü asıl bilgi tabandan sapmada.
  restingHrLog: [],
  // Kardiyo seans şablonları: set defterinin yapısını saklıyor.
  cardioTemplates: [],
  // Aktivite başına seans hedefi: { swim: { sets, setDistance, minutes, ... } }.
  // Hedef koymak zorunlu değil; kardiyo kaydı ve kalori hesabı hedefsiz çalışır.
  activityTargets: {},
  // Koç hafızası: ertelenen ve kapatılan madde anahtarları.
  coachMemory: { snoozed: {}, dismissed: [] },
  // Koç odağı: madde önceliklerini kaydırıyor. Maddeleri silmiyor ve sağlık
  // maddelerini hiçbir odakta geri itmiyor.
  coachFocus: 'balanced',
  // Koç karar defteri: uygulanan tavsiyeler ve üç hafta sonra ölçülen
  // sonuçları. Koçu yanlış olabilir hale getiren şey bu — yanlış olamayan bir
  // tavsiye doğru da olamaz.
  coachLedger: [],
  // Kadın profillerinde döngü takibinin takvim varsayımları. Günlük belirtiler
  // ayrı `cycle` localStorage anahtarında tutulur.
  cycleConfig: { cycleLength: 28, periodLength: 5, hormonalContraception: false },
  // Haftalık kayıp/alım hızı tercihi (goals.js CUT_RATES / BULK_RATES anahtarı).
  // Boş = döneme göre varsayılan ("Ölçülü") kullanılır.
  paceRate: '',
  // Günlük hareket (NEAT) hesabı: 'auto' artık yöntemi, 'level' aktivite
  // seviyesi çarpanı, 'steps' adım sayısı, 'manual' doğrudan kcal.
  neatMode: 'auto',
  activityLevel: 'light',
  neatManual: '',
  // BMI gösterimi: 'standard' klasik aralıklar, 'athletic' kas kütlesini
  // hesaba katan aralıklar.
  bmiMode: 'athletic',
  // Deload (boşaltma) durumu: { active, startDate, days, preset }.
  // Süre dolduğunda kayıt silinmiyor, deloadState onu kapalı sayıyor.
  deload: { active: false, startDate: '', days: 7, preset: 'volume' },
  // Mezosiklik (blok): { active, startDate, weeks, baseline, feedback }.
  // baseline blok başlarken dondurulan kas hacimleri; feedback hafta -> kas ->
  // toparlanma anahtarı. Deload gibi süre dolunca silinmiyor, kapalı sayılıyor.
  mesocycle: { active: false, startDate: '', weeks: 5, baseline: {}, feedback: {} },
  // 6.0 Koç Merkezi: geçen haftadan üretilen protokol ve kullanıcının aktive
  // ettiği kararların küçük geçmişi. Şablonların kendisi değiştirilmez.
  coachProtocol: null,
  coachHistory: [],
  // Görünüm teması: 'dark' | 'light'
  theme: 'dark',
  // Marka vurgu rengi temadan bağımsızdır. Kadın profili pembe paleti
  // kullanabilir; varsayılan mevcut cyan görünümü korur.
  accentTheme: 'cyan',
  // Yazı büyüklüğü çarpanı (kök font-size). 1 = varsayılan.
  fontScale: 1,
  // Basit görünüm günlük kararları öne çıkarıp gelişmiş kartları kapalı başlatır;
  // hiçbir özellik kaldırılmaz, ayrıntılar tek dokunuşla açılır.
  interfaceMode: 'simple',
  // Yerel/çevrimiçi besinlerin küçük kopyaları. Ayarlarda tutulduğu için ayrıca
  // bir localStorage anahtarı ve göç adımı gerektirmez.
  favoriteFoods: [],
  // İlk kullanım turu yalnızca yeni ve boş veri havuzunda otomatik açılır.
  onboardingComplete: false,
  // NEAT için kullanıcı çarpanı: otomatik/seviye hesabını ölçekler.
  neatMultiplier: 1,
  // v2.5.5'te hatalı biçimde geçmişe yayılan günlük NEAT alanları bir kez
  // temizlenir. Sonraki sürümlerde kullanıcının bilinçli tek-gün istisnaları korunur.
  dayNeatModelVersion: 1,
};

export const DELETE_LABELS = {
  workout: 'Antrenman kaydı', metric: 'Ölçüm kaydı', nutrition: 'Beslenme kaydı',
  template: 'Antrenman şablonu', mealTemplate: 'Öğün şablonu', dayTemplate: 'Beslenme şablonu',
  cardio: 'Kardiyo kaydı'
};

export const BACKUP_KEYS = [
  'workouts', 'templates', 'customExercises', 'customFoods', 'recentFoods',
  'metricsHistory', 'nutritionHistory', 'mealTemplates', 'dayTemplates',
  'wellness', 'cycleHistory', 'settings',
];

export const DEFAULT_EXERCISES = [
  "Barbell Back Squat", "Barbell Front Squat", "Zercher Squat", "Hack Squat", "Bulgarian Split Squat", "Leg Press", "Walking Lunges",
  "Romanian Deadlift (RDL)", "Conventional Deadlift", "Sumo Deadlift", "Trap Bar Deadlift", "Good Morning",
  "Nordic Hamstring Curl", "Lying Leg Curl", "Seated Leg Curl", "Leg Extension", "Hip Thrust", "Standing Calf Raise", "Seated Calf Raise",
  "Barbell Bench Press", "Incline Barbell Bench Press", "Dumbbell Bench Press", "Incline Dumbbell Press", "Decline Bench Press",
  "Pec Deck Fly", "Cable Crossover", "Machine Chest Press", "Dips", "Push-ups",
  "Pull-up", "Chin-up", "Barbell Row", "Pendlay Row", "T-Bar Row", "Chest Supported Row", "Meadows Row", "Dumbbell Row",
  "Seated Cable Row", "Lat Pulldown", "Straight Arm Pulldown", "Machine Row",
  "Overhead Press (OHP)", "Dumbbell Shoulder Press", "Arnold Press", "Machine Shoulder Press", "Push Press",
  "Lateral Raise (Dumbbell)", "Lateral Raise (Cable)", "Machine Lateral Raise", "Face Pull", "Reverse Pec Deck",
  "Rear Delt Fly (Dumbbell)", "Upright Row",
  "Barbell Shrug", "Dumbbell Shrug",
  "Barbell Bicep Curl", "Dumbbell Bicep Curl", "Hammer Curl", "Incline Dumbbell Curl", "Preacher Curl", "Cable Bicep Curl",
  "Tricep Pushdown", "Tricep Overhead Extension", "Skull Crusher", "Close Grip Bench Press", "Tricep Kickback",
  "Wrist Curl", "Reverse Wrist Curl", "Reverse Curl",
  "Cable Crunch", "Hanging Leg Raise", "Hanging Knee Raise", "Ab Wheel Rollout", "Plank", "Side Plank",
  "Russian Twist", "Decline Sit-up", "Cable Woodchopper", "Farmer's Walk",

  // --- v0.6 eklemeleri ---
  "Incline Dumbbell Fly", "Cable Fly (Low to High)", "Machine Fly", "Smith Machine Bench Press",
  "Diamond Push-ups",
  "Inverted Row", "Seated Row (Wide Grip)", "Single Arm Lat Pulldown", "Barbell Pullover", "Rack Pull",
  "Landmine Press", "Cable Rear Delt Fly", "Y-Raise",
  "EZ Bar Curl", "Zottman Curl", "Cable Hammer Curl", "Cable Overhead Tricep Extension",
  "Goblet Squat", "Belt Squat", "Smith Machine Squat", "Sissy Squat", "Single Leg Press",
  "Standing Leg Curl", "Glute Ham Raise", "Cable Pull Through",
  "Leg Press Calf Raise", "Smith Machine Calf Raise",
  "Behind the Back Wrist Curl",

  // --- v0.7 eklemeleri ---
  // Göğüs
  "Incline Cable Fly", "Decline Dumbbell Press", "Floor Press", "Guillotine Press",
  "Weighted Push-ups", "Deficit Push-ups", "Smith Machine Incline Press", "Machine Chest Dip",
  // Sırt
  "Seal Row", "Kroc Row", "Gorilla Row", "Single Arm Cable Row", "Chest Supported T-Bar Row",
  "Wide Grip Pull-up", "Neutral Grip Pull-up", "Weighted Pull-up", "Assisted Pull-up",
  "Reverse Grip Lat Pulldown", "Kneeling Cable Pullover", "Machine Pullover",
  // Omuz
  "Seated Dumbbell Shoulder Press", "Z Press", "Viking Press", "Behind the Neck Press",
  "Leaning Cable Lateral Raise", "Lu Lateral Raise", "Cable Front Raise", "Plate Front Raise",
  "Bent Over Lateral Raise", "Reverse Cable Fly",
  // Trapez
  "Trap Bar Shrug", "Cable Shrug", "Smith Machine Shrug",
  // Kol
  "Cable Preacher Curl", "Machine Preacher Curl", "Bayesian Cable Curl", "Drag Curl",
  "Barbell Curl 21s", "Concentration Curl", "Cross Body Hammer Curl",
  "Rope Pushdown", "V-Bar Pushdown", "JM Press", "Bench Dip",
  // Önkol
  "Wrist Roller", "Plate Pinch Hold", "Dead Hang", "Farmer's Hold",
  // Bacak
  "Reverse Lunge", "Curtsy Lunge", "Box Step-up", "Box Squat", "Pause Squat",
  "Pendulum Squat", "Standing Leg Extension", "Single Leg Romanian Deadlift",
  "Hip Abduction Machine", "Hip Adduction Machine",
  // Kalça
  "Single Leg Hip Thrust", "Machine Hip Thrust", "Frog Pump", "Cable Glute Kickback",
  // Baldır
  "Single Leg Calf Raise",
  // Karın & Bel
  "Machine Crunch", "Toes to Bar", "Dragon Flag", "Pallof Press", "Dead Bug",
  "Hollow Body Hold", "V-Ups", "Bicycle Crunch", "Weighted Plank",
  "Reverse Hyperextension", "Jefferson Curl", "Superman Hold", "Bird Dog",

  // --- v0.9 eklemeleri ---
  // Göğüs
  "Cable Fly (High to Low)", "Hex Press", "Plate Squeeze Press", "Wide Grip Bench Press",
  "Spoto Press", "Larsen Press", "Machine Incline Press", "Banded Push-ups",
  // Sırt
  "Rope Face Pull", "Chest Supported Dumbbell Row", "Barbell Shrug Behind Back",
  "Wide Grip Seated Row", "Close Grip Lat Pulldown", "Machine High Row",
  "Machine Low Row", "Renegade Row", "Dumbbell Pullover", "Archer Pull-up",
  "Scapular Pull-up", "Cable Lat Prayer",
  // Omuz
  "Machine Reverse Fly", "Cable Upright Row", "Dumbbell Upright Row",
  "Seated Lateral Raise", "Incline Lateral Raise", "Cuban Press", "Powell Raise",
  "Landmine Lateral Raise",
  // Kol
  "Incline Cable Curl", "Machine Bicep Curl", "Rope Hammer Curl", "Waiter Curl",
  "Overhead Cable Curl", "Reverse Grip Pushdown", "Single Arm Pushdown",
  "French Press", "Lying Dumbbell Extension", "Tate Press",
  // Önkol
  "Cable Wrist Curl", "Hammer Wrist Rotation", "Towel Hang",
  // Bacak
  "Front Foot Elevated Split Squat", "Heels Elevated Squat",
  "Cyclist Squat", "Barbell Step-up", "Lateral Lunge", "Deficit Reverse Lunge",
  "Seated Hip Abduction", "Copenhagen Adduction", "Banded Lateral Walk",
  "Single Leg Leg Extension", "Kneeling Leg Curl", "Slider Leg Curl",
  // Kalça
  "Barbell Glute Bridge", "Cable Hip Abduction", "Step Down",
  // Baldır
  "Donkey Calf Raise", "Hack Squat Calf Raise", "Seated Single Leg Calf Raise",
  // Karın & Bel
  "Cable Side Bend", "Suitcase Carry", "Hanging Oblique Raise", "Copenhagen Plank",
  "Ab Crunch Machine", "Stir the Pot", "Standing Cable Crunch", "L-Sit Hold",
  "Weighted Decline Sit-up", "Landmine Rotation"
].sort();

// 16 kas grubu. Ayrım hipertrofi hacim takibinin gerektirdiği çözünürlüğe göre:
//  - Deltoid üç başa ayrıldı. Bench+OHP yapan biri ön deltoidi doldurur ama yan
//    deltoide hiç dokunmaz; tek "Omuz" kovası bunu gizliyordu.
//  - Trapez sırttan ayrıldı: shrug/deadlift trapeze, row/pulldown kanata yüklenir.
//  - Sırt kanat (dikey çekiş) ve orta sırt (yatay çekiş) olarak ikiye bölündü.
export const MUSCLE_GROUPS = [
  'Göğüs', 'Kanat', 'Orta Sırt', 'Trapez',
  'Ön Omuz', 'Yan Omuz', 'Arka Omuz',
  'Biseps', 'Triseps', 'Önkol',
  'Quadriceps', 'Hamstring', 'Kalça', 'Baldır',
  'Karın', 'Bel'
];

// Görsel gruplama (ana ekrandaki hacim rehberi 16 satırı tek listede vermesin diye)
export const MUSCLE_SECTIONS = [
  { title: 'Üst Gövde — İtme', muscles: ['Göğüs', 'Ön Omuz', 'Yan Omuz', 'Triseps'] },
  { title: 'Üst Gövde — Çekme', muscles: ['Kanat', 'Orta Sırt', 'Trapez', 'Arka Omuz'] },
  { title: 'Kollar', muscles: ['Biseps', 'Önkol'] },
  { title: 'Alt Gövde', muscles: ['Quadriceps', 'Hamstring', 'Kalça', 'Baldır'] },
  { title: 'Gövde Merkezi', muscles: ['Karın', 'Bel'] },
];

// Küçük kas grupları: progresyonda 2.5 kg yerine 1.25 kg adımla ilerler.
export const SMALL_MUSCLE_GROUPS = [
  'Biseps', 'Triseps', 'Önkol', 'Ön Omuz', 'Yan Omuz', 'Arka Omuz',
  'Baldır', 'Trapez', 'Orta Sırt'
];

// Eski kas adları -> yeni taksonomi. Yalnızca kullanıcının kaydettiği özel
// hareketler için kullanılır; antrenman kayıtları kas adı tutmaz.
//
// DİKKAT: Eski 'Ön Kol' BİSEPS demekti. Yeni taksonomideki 'Önkol' ise bilek
// bölgesi. Aradaki tek fark bir boşluk; yanlış eşleşme sessiz veri bozulmasıdır.
// scripts/verify-muscles.mjs bunu ayrıca kontrol eder.
//
// null = hacme sayılmaz (eski 'Diğer' zaten hiçbir zaman sayılmıyordu).
export const LEGACY_MUSCLE_MAP = {
  'Ön Kol': 'Biseps',
  'Arka Kol': 'Triseps',
  'Ön Bacak': 'Quadriceps',
  'Arka Bacak': 'Hamstring',
  'Kalf': 'Baldır',
  // Bölünen gruplar: eski kurallarda 'Sırt' birincil olduğu her hareket
  // (pulldown, row, pullover) lat baskındı; 'Omuz' ise özel harekette
  // çoğunlukla yan deltoid izolasyonu anlamına geliyordu.
  'Sırt': 'Kanat',
  'Omuz': 'Yan Omuz',
  // v16 formundaki, hacim sisteminde karşılığı olmayan seçenekler
  'Bacak': 'Quadriceps',
  'Kol': 'Biseps',
  'Merkez': 'Karın',
  'Diğer': null,
  // Değişmeyenler açıkça yazılır: tablonun idempotent olması buna dayanıyor.
  'Göğüs': 'Göğüs',
  'Kalça': 'Kalça',
  'Karın': 'Karın',
  'Bel': 'Bel',
};

// Hareket -> kas katkı ağırlıkları.
//
// Bir set, çalıştırdığı her kasa aynı oranda uyaran vermez. Ağırlıklar
// hipertrofi hacim sayımında yaygın kullanılan kademeyi izler:
//   1     birincil hedef    — hareketin asıl çalıştırdığı, yorgunluğu belirleyen kas
//   0.5   belirgin yardımcı — büyüme uyaranı alacak kadar yüklenir
//   0.25  hafif katkı       — stabilizasyon veya kısmi yüklenme
//
// Örnek: Barbell Bench Press -> Göğüs 1, Triseps 0.5, Ön Omuz 0.5.
// Incline'da ön deltoid payı korunur; Decline'da omuz açısı azaldığı için 0.25'e düşer.
//
// Sıra kritiktir: ilk eşleşen kural kazanır, bu yüzden özel kalıplar üsttedir.
// Korunması gereken üç tuzak:
//   - "leg curl" genel /curl/ kuralından ÖNCE olmalı (yoksa biseps sayılır)
//   - "close grip bench" göğüs kurallarından ÖNCE olmalı (triseps baskın)
//   - genel /curl/ "incline" kuralından ÖNCE olmalı ("Incline Dumbbell Curl")
export const EXERCISE_RULES = [
  // Copenhagen adduktor hareketidir; adında "plank" geçtiği için aşağıdaki
  // genel /plank/ kuralından ÖNCE yakalanmak zorunda.
  [/copenhagen/, 'Legs', { 'Kalça': 1, 'Karın': 0.5 }],

  // --- KARIN & BEL ---
  [/ab wheel|rollout/, 'Core', { 'Karın': 1, 'Bel': 0.25 }],
  [/woodchop|cable twist/, 'Core', { 'Karın': 1 }],
  [/hanging (leg|knee|oblique) raise|toes to bar|captain'?s chair|sit-?up|crunch|dead bug|pallof|russian twist|plank|hollow|side bend|l-?sit|stir the pot|landmine (rotation|twist)/, 'Core', { 'Karın': 1 }],
  [/back extension|hyper-?extension|reverse hyper/, 'Core', { 'Bel': 1, 'Kalça': 0.5, 'Hamstring': 0.5 }],
  // "Jefferson Curl" adında curl geçer ama omurga hareketidir; biseps kuralından
  // çok önce yakalanmak zorunda.
  [/jefferson curl/, 'Core', { 'Bel': 1, 'Hamstring': 0.5 }],
  [/superman|bird dog/, 'Core', { 'Bel': 1, 'Kalça': 0.25 }],
  [/dragon flag|\bv-?ups?\b|windshield wiper/, 'Core', { 'Karın': 1 }],
  // Farmer's walk öncelikle kavrama çalışmasıdır; trapez yükü taşır.
  [/farmer|suitcase carry|carry/, 'Core', { 'Önkol': 1, 'Trapez': 0.5, 'Karın': 0.5, 'Bel': 0.25 }],

  // --- BALDIR ---
  [/calf raise|calf press|donkey calf/, 'Legs', { 'Baldır': 1 }],

  // --- KALÇA BASKIN ---
  // Glute Ham Raise adında 'glute' geçse de hamstring baskın bir harekettir;
  // genel glute kuralından önce yakalanmalı.
  [/glute ham raise|\bghr\b/, 'Legs', { 'Hamstring': 1, 'Kalça': 0.5 }],
  [/pull through/, 'Legs', { 'Kalça': 1, 'Hamstring': 0.5 }],
  // Abduksiyon gluteus medius/minimus, adduksiyon adduktor magnus çalıştırır.
  // Ayrı bir adduktor grubu yok; ikisi de kalça bütçesine yazılır.
  [/hip abduction|abductor machine|hip adduction|adductor machine|clamshell|banded (lateral|side) walk|monster walk/, 'Legs', { 'Kalça': 1 }],
  [/hip thrust|glute bridge|glute kickback|frog pump|glute/, 'Legs', { 'Kalça': 1, 'Hamstring': 0.25 }],

  // --- HAMSTRING BASKIN (genel /curl/ kuralından önce olmalı) ---
  [/nordic|leg curl|hamstring curl/, 'Legs', { 'Hamstring': 1 }],
  [/romanian deadlift|\brdl\b|stiff-?leg/, 'Legs', { 'Hamstring': 1, 'Kalça': 0.5, 'Bel': 0.5, 'Önkol': 0.25 }],
  [/good morning/, 'Legs', { 'Hamstring': 1, 'Bel': 0.5, 'Kalça': 0.25 }],

  // --- DEADLIFT VARYANTLARI ---
  // Sumo'da duruş dik olduğu için kalça/quad payı artar, bel payı azalır.
  [/sumo deadlift/, 'Legs', { 'Kalça': 1, 'Quadriceps': 0.5, 'Hamstring': 0.5, 'Bel': 0.5, 'Trapez': 0.25, 'Önkol': 0.5 }],
  [/trap bar deadlift|hex bar/, 'Legs', { 'Quadriceps': 1, 'Kalça': 0.5, 'Bel': 0.5, 'Trapez': 0.5, 'Önkol': 0.5 }],
  [/rack pull/, 'Legs', { 'Bel': 1, 'Trapez': 0.5, 'Kanat': 0.5, 'Kalça': 0.5, 'Önkol': 0.5 }],
  [/deadlift/, 'Legs', { 'Bel': 1, 'Kalça': 1, 'Hamstring': 0.5, 'Trapez': 0.5, 'Önkol': 0.5, 'Kanat': 0.25 }],

  // --- QUAD BASKIN ---
  [/leg extension/, 'Legs', { 'Quadriceps': 1 }],
  [/hack squat|leg press/, 'Legs', { 'Quadriceps': 1, 'Kalça': 0.5 }],
  [/front squat|zercher/, 'Legs', { 'Quadriceps': 1, 'Kalça': 0.5, 'Bel': 0.5, 'Karın': 0.25 }],
  [/bulgarian|split squat|lunge|step-?up|step[- ]down/, 'Legs', { 'Quadriceps': 1, 'Kalça': 0.5, 'Hamstring': 0.25 }],
  [/squat/, 'Legs', { 'Quadriceps': 1, 'Kalça': 0.5, 'Hamstring': 0.25, 'Bel': 0.25 }],

  // --- OMUZ İZOLASYON (üç baş ayrı) ---
  [/face pull/, 'Pull', { 'Arka Omuz': 1, 'Trapez': 0.5, 'Orta Sırt': 0.25 }],
  // "Reverse Cable Fly" gibi araya kelime giren adlar da yakalanmalı.
  // "Bent Over Lateral Raise" arka deltoiddir; yan omuz kuralından önce gelmeli.
  [/reverse pec|rear delt|reverse \w* ?fly|bent[- ]over (lateral|dumbbell) raise|powell raise/, 'Pull', { 'Arka Omuz': 1, 'Orta Sırt': 0.25 }],
  [/y-?raise/, 'Pull', { 'Arka Omuz': 1, 'Trapez': 0.5 }],
  [/lateral raise|side raise/, 'Push', { 'Yan Omuz': 1 }],
  [/front raise/, 'Push', { 'Ön Omuz': 1 }],
  [/upright row/, 'Pull', { 'Yan Omuz': 1, 'Trapez': 0.5, 'Biseps': 0.25 }],
  [/shrug/, 'Pull', { 'Trapez': 1 }],

  // --- OMUZ BİLEŞKE ---
  // Dikey baslarda yük ön deltoiddedir; yan baş yalnızca kısmi katkı alır.
  [/landmine press/, 'Push', { 'Ön Omuz': 1, 'Göğüs': 0.5, 'Triseps': 0.5 }],
  // Cuban press dış rotasyon + bas birleşimi; rotator manşet ve arka baş
  // baskın. Genel /press/ yakalayıcısına düşerse göğüs sanılırdı.
  [/cuban press/, 'Push', { 'Arka Omuz': 1, 'Yan Omuz': 0.5, 'Ön Omuz': 0.5, 'Trapez': 0.25 }],
  // Ense arkası baste omuz dış rotasyonda olduğu için yan baş payı belirgin artar.
  [/behind the neck press|bradford press/, 'Push', { 'Ön Omuz': 1, 'Yan Omuz': 0.5, 'Triseps': 0.5, 'Trapez': 0.25 }],
  [/overhead press|\bohp\b|shoulder press|arnold press|military press|push press|\bz press\b|viking press/, 'Push', { 'Ön Omuz': 1, 'Triseps': 0.5, 'Yan Omuz': 0.25, 'Trapez': 0.25 }],

  // --- KOL ---
  // Close grip bench triceps baskındır; göğüs kuralından önce yakalanmalı.
  [/close grip bench/, 'Push', { 'Triseps': 1, 'Göğüs': 0.5, 'Ön Omuz': 0.25 }],
  [/diamond push/, 'Push', { 'Triseps': 1, 'Göğüs': 0.5 }],
  // "Bench Dip" genel /dips?/ kuralından, "JM Press" genel /press/ kuralından
  // önce yakalanmalı — ikisi de triseps hareketidir.
  [/bench dip|jm press/, 'Push', { 'Triseps': 1, 'Göğüs': 0.25 }],
  // "Lying Leg Curl" yukarıda yakalandığı için buradaki lying...extension güvenli.
  [/tricep|skull crusher|pushdown|kickback|overhead extension|lying \w+ extension|french press|tate press/, 'Push', { 'Triseps': 1 }],
  // Önkol izolasyonu genel /curl/ kuralından önce yakalanmalı.
  // Dikkat: burada çıplak /grip/ KULLANILAMAZ — "Seated Row (Wide Grip)",
  // "Neutral Grip Pulldown" gibi hareketleri önkol sanardı.
  [/wrist curl|reverse wrist|wrist roller|grip trainer|plate pinch|(dead|towel) hang|barbell hold|wrist rotation/, 'Pull', { 'Önkol': 1 }],
  [/reverse curl/, 'Pull', { 'Önkol': 1, 'Biseps': 0.5 }],
  [/hammer/, 'Pull', { 'Biseps': 1, 'Önkol': 0.5 }],
  // Bacak curl'leri yukarıda yakalandığı için buradaki genel /curl/ güvenlidir.
  // Göğüs kurallarından önce gelmesi şart: aksi halde "Incline Dumbbell Curl"
  // eğik bas hareketi sanılıp göğüs sayılırdı.
  [/preacher|bicep|concentration|spider|curl/, 'Pull', { 'Biseps': 1, 'Önkol': 0.25 }],

  // --- SIRT ---
  // Dikey çekiş kanat baskın, yatay çekiş orta sırt baskın.
  [/straight arm pulldown|pullover|lat prayer/, 'Pull', { 'Kanat': 1 }],
  [/pull-?up|chin-?up|lat pulldown|pulldown/, 'Pull', { 'Kanat': 1, 'Biseps': 0.5, 'Orta Sırt': 0.25, 'Önkol': 0.25 }],
  // Serbest ağırlıkla öne eğik çekişlerde bel izometrik olarak belirgin yüklenir.
  [/pendlay|barbell row|t-?bar row|meadows/, 'Pull', { 'Orta Sırt': 1, 'Kanat': 0.5, 'Biseps': 0.5, 'Bel': 0.5, 'Arka Omuz': 0.25, 'Önkol': 0.25 }],
  [/\brow\b/, 'Pull', { 'Orta Sırt': 1, 'Kanat': 0.5, 'Biseps': 0.5, 'Arka Omuz': 0.25, 'Önkol': 0.25 }],

  // --- GÖĞÜS ---
  [/pec deck|\bfly\b|crossover/, 'Push', { 'Göğüs': 1 }],
  [/\bdips?\b/, 'Push', { 'Göğüs': 1, 'Triseps': 0.5, 'Ön Omuz': 0.25 }],
  [/decline.*(press|bench|fly)/, 'Push', { 'Göğüs': 1, 'Triseps': 0.5, 'Ön Omuz': 0.25 }],
  [/incline.*(press|bench|fly)/, 'Push', { 'Göğüs': 1, 'Ön Omuz': 0.5, 'Triseps': 0.5 }],
  // Floor press'te hareket açıklığı kısıtlı, yük triseps üzerine kayar.
  [/floor press/, 'Push', { 'Göğüs': 1, 'Triseps': 0.5, 'Ön Omuz': 0.25 }],
  [/bench press|chest press|push-?up/, 'Push', { 'Göğüs': 1, 'Triseps': 0.5, 'Ön Omuz': 0.5 }],

  // --- GENEL YAKALAYICI (en sonda) ---
  [/press/, 'Push', { 'Göğüs': 1, 'Ön Omuz': 0.5, 'Triseps': 0.5 }],
];

// Yazma daima en yeni sürüme yapılır; okuma eskiye doğru geriye düşer.
// _v16 anahtarları taksonomi göçünden sonra da SİLİNMEZ — geri dönüş yedeğidir.
export const STORAGE_VERSION = '_v17';
export const STORAGE_VERSIONS = ['_v17', '_v16', '_v15', '_v14', '_v13'];

export const BODY_METRICS = [
  { key: 'weight', label: 'Vücut Ağırlığı', unit: 'kg' },
  { key: 'neck', label: 'Boyun', unit: 'cm' },
  { key: 'shoulder', label: 'Omuz', unit: 'cm' },
  { key: 'chest', label: 'Göğüs', unit: 'cm' },
  { key: 'arm', label: 'Kol', unit: 'cm' },
  { key: 'waist', label: 'Bel (Göbek)', unit: 'cm' },
  { key: 'hip', label: 'Kalça', unit: 'cm' },
  { key: 'thigh', label: 'Uyluk (Bacak)', unit: 'cm' },
  { key: 'calf', label: 'Kalf', unit: 'cm' },
  { key: 'wrist', label: 'El Bileği', unit: 'cm' }
];

export const SET_TYPES = {
  normal: { label: 'Normal Set', badge: 'N', bgClass: 'bg-zinc-950 border-zinc-800', textClass: 'text-cyan-400 bg-cyan-950/30' },
  warmup: { label: 'Isınma Seti', badge: 'W', bgClass: 'bg-zinc-950/50 border-orange-900/40', textClass: 'text-orange-400 bg-orange-950/30' },
  drop: { label: 'Drop Set', badge: 'D', bgClass: 'bg-purple-950/20 border-purple-900/50', textClass: 'text-purple-400 bg-purple-950/30' },
  failure: { label: 'Tükeniş (Failure)', badge: 'F', bgClass: 'bg-red-950/20 border-red-900/50', textClass: 'text-red-400 bg-red-950/30' },
  rest_pause: { label: 'Rest-Pause', badge: 'RP', bgClass: 'bg-emerald-950/20 border-emerald-900/50', textClass: 'text-emerald-400 bg-emerald-950/30' },
};

export const SET_TYPE_KEYS = ['normal', 'warmup', 'drop', 'failure', 'rest_pause'];

// Şablonda PLANLANABİLECEK teknikler. Isınma burada yok: ısınma her hareketin
// başında zaten var ve planlanacak bir şey değil. Teknik şablona yazıldığında
// seansta hatırlatma olarak çıkıyor, seti otomatik işaretlemiyor —
// uygulanıp uygulanmadığına kullanıcı karar veriyor.
export const PLANNABLE_TECHNIQUES = ['drop', 'rest_pause', 'failure'];

// Haftalık set hacmi referansları (kas grubu başına):
//   MEV  koruma için gereken en az hacim
//   MAV  gelişimin en verimli olduğu aralığın üst ucu
//   MRV  toparlanmanın bozulmaya başladığı tavan
// Eski tek 'Sırt' bütçesi (10/18/25) Kanat/Orta Sırt/Trapez'e, 'Omuz' (8/16/22)
// üç deltoid başına bölündü. Bölmeden sonra eski değerler bırakılsaydı herkesin
// panosu bir gecede "kronik düşük hacim" görünürdü.
//
// Ön deltoid ve kalça her basış/çömeliş hareketinden bol dolaylı hacim aldığı
// için MEV'leri düşük; yan ve arka deltoid yüksek hacme iyi yanıt verdiği için
// MRV'leri yüksek.
// Haftalık set hacmi referansları — ORTA SEVİYE temel alınmıştır.
//
//   MEV  (Minimum Effective Volume)  büyümenin başladığı en az hacim
//   MAV  (Maximum Adaptive Volume)   gelişimin en verimli olduğu aralığın üstü
//   MRV  (Maximum Recoverable Volume) toparlanmanın bozulduğu tavan
//
// Değerler hipertrofi literatüründe yaygın kullanılan aralıklara dayanır.
// Dikkat çeken üç nokta:
//  - Ön deltoid ve kalça her basış/çömeliş hareketinden bol dolaylı hacim alır;
//    MEV'leri bu yüzden çok düşüktür, doğrudan çalışmaya çoğu kişide gerek kalmaz.
//  - Yan ve arka deltoid küçük, hızlı toparlanan kaslardır; MRV'leri yüksektir.
//  - Bel (erektörler) her bileşke hareketten yorulur ve yavaş toparlanır;
//    doğrudan hacmi düşük tutmak gerekir.
export const MUSCLE_VOLUME_LANDMARKS = {
  'Göğüs': { mev: 8, mav: 16, mrv: 22 },
  'Kanat': { mev: 10, mav: 18, mrv: 25 },
  'Orta Sırt': { mev: 8, mav: 16, mrv: 22 },
  'Trapez': { mev: 4, mav: 14, mrv: 26 },
  'Ön Omuz': { mev: 2, mav: 10, mrv: 14 },
  'Yan Omuz': { mev: 8, mav: 18, mrv: 26 },
  'Arka Omuz': { mev: 6, mav: 16, mrv: 26 },
  'Biseps': { mev: 8, mav: 16, mrv: 24 },
  'Triseps': { mev: 6, mav: 12, mrv: 18 },
  'Önkol': { mev: 2, mav: 10, mrv: 18 },
  'Quadriceps': { mev: 8, mav: 14, mrv: 20 },
  'Hamstring': { mev: 4, mav: 12, mrv: 18 },
  'Kalça': { mev: 2, mav: 10, mrv: 16 },
  'Baldır': { mev: 8, mav: 14, mrv: 20 },
  'Karın': { mev: 4, mav: 16, mrv: 24 },
  'Bel': { mev: 4, mav: 8, mrv: 10 },
};

// Deneyim seviyesine göre hacim ölçeklemesi.
//
// Acemi bir lifter az hacimle büyür ama iş kapasitesi düşüktür; ileri seviyede
// uyaran eşiği yükselirken toparlanma kapasitesi de artar. Çarpanlar temel
// (orta seviye) tabloya uygulanır.
export const EXPERIENCE_LEVELS = [
  {
    key: 'beginner',
    label: 'Yeni Başlayan',
    hint: '0-1 yıl · Az hacimle hızlı gelişim, iş kapasitesi düşük',
    mev: 0.7, mav: 0.7, mrv: 0.7,
  },
  {
    key: 'intermediate',
    label: 'Orta',
    hint: '1-3 yıl · Referans değerler bu seviyeye göre belirlendi',
    mev: 1, mav: 1, mrv: 1,
  },
  {
    key: 'advanced',
    label: 'İleri',
    hint: '3+ yıl · Uyaran eşiği ve toparlanma kapasitesi yüksek',
    mev: 1.2, mav: 1.2, mrv: 1.25,
  },
];

/**
 * Kullanıcının kendi hacim hedefleri: { 'Yan Omuz': { mev, mav, mrv } }.
 *
 * NEDEN MODÜL DÜZEYİNDE BİR KAYIT: `getVolumeLandmarks` uygulamanın kırk iki
 * ayrı yerinden çağrılıyor — koç, hacim tablosu, ısı haritası, program
 * üreticisi, haftalık projeksiyon, mezosiklik. Kişisel hedefi parametre olarak
 * geçirmek bu çağrıların HEPSİNİ değiştirmeyi gerektirirdi ve bir tanesinin
 * atlanması, uygulamanın bir köşesinde eski değerlerin yaşamaya devam etmesi
 * demekti: kullanıcı hedefini değiştirdiği halde ısı haritası eski renkte
 * kalırdı ve bunun sebebini kimse bulamazdı.
 *
 * Hedefler zaten uygulama genelinde tek bir kullanıcı tercihi; onları tek bir
 * yerde tutmak modelin kendisine uygun. Kayıt boşken davranış birebir eskisi
 * gibi — Node'da çalışan doğrulama betikleri de bu yüzden etkilenmiyor.
 */
let volumeTargetOverrides = {};

/** Ayarlar yüklendiğinde/değiştiğinde bir kez çağrılıyor. */
export const setVolumeTargetOverrides = (overrides) => {
  volumeTargetOverrides = overrides && typeof overrides === 'object' ? overrides : {};
};

export const getVolumeTargetOverrides = () => volumeTargetOverrides;

/**
 * Seçili deneyim seviyesine göre ölçeklenmiş hacim referansları.
 * Tam sayıya yuvarlanır; MEV<MAV<MRV sırası her koşulda korunur.
 *
 * Kullanıcı o kas için kendi hedefini yazdıysa deneyim ölçeklemesi
 * UYGULANMIYOR: kişisel değer zaten o kişinin kendi kapasitesi, üstüne bir de
 * seviye çarpanı bindirmek onu kullanıcının yazmadığı bir sayıya taşırdı.
 */
export const getVolumeLandmarks = (muscle, level = 'intermediate') => {
  const kisisel = volumeTargetOverrides[muscle];
  if (kisisel && kisisel.mrv > 0) {
    const mev = Math.max(1, Math.round(kisisel.mev));
    const mav = Math.max(mev, Math.round(kisisel.mav));
    const mrv = Math.max(mav, Math.round(kisisel.mrv));
    return { mev, mav, mrv, custom: true };
  }

  const base = MUSCLE_VOLUME_LANDMARKS[muscle];
  if (!base) return { mev: 6, mav: 16, mrv: 22 };

  const scale = EXPERIENCE_LEVELS.find(l => l.key === level) || EXPERIENCE_LEVELS[1];
  const mev = Math.max(1, Math.round(base.mev * scale.mev));
  const mav = Math.max(mev + 1, Math.round(base.mav * scale.mav));
  const mrv = Math.max(mav + 1, Math.round(base.mrv * scale.mrv));
  return { mev, mav, mrv };
};

/**
 * Haftalık hacmin hangi durumda olduğunu söyler.
 *
 * Tek kaynak: ana sayfa listesi, ısı haritası, kas detayı ve haftalık program
 * daha önce aynı dört durumu farklı renklerle gösteriyordu (biri MEV altını
 * cyan, diğeri amber; biri "Yüksek"i cyan, diğeri amber yapıyordu).
 */
export const volumeStatusOf = (volume, muscle, level = 'intermediate') => {
  const { mev, mav, mrv } = getVolumeLandmarks(muscle, level);
  if (!volume) return 'none';
  if (volume < mev) return 'under';
  if (volume <= mav) return 'optimal';
  if (volume <= mrv) return 'high';
  return 'over';
};

/**
 * Durum renkleri. Merdiven tek yönlü okunur:
 * gri(pasif) → amber(eksik) → yeşil(verimli) → turuncu(tavana yakın) → kırmızı(aşım).
 *
 * Cyan bilinçli olarak yok: uygulamanın her yerinde "birincil aksiyon" rengi,
 * durum göstergesinde kullanılınca uyarılar "iyi" gibi okunuyordu.
 */
/**
 * Akut:kronik yük oranının (ACWR) risk sınıfı.
 *
 * `hasEnoughData` yanlışken sınıflandırma yapılmaz: kronik yük geçmişi
 * oluşmadan hesaplanan oran anlamsızdır ve yeni kullanıcıyı boşuna korkutur.
 *
 * 1.3'ten sonra doğrudan kırmızıya geçmek yerine 1.3-1.5 arası ayrı bir
 * "dikkat" bandı var; literatürde de bu aralık yüksek risk değil, izlenmesi
 * gereken bölge olarak geçiyor.
 */
/**
 * ACWR durumu.
 *
 * ACWR GÖRELİ bir ölçüdür: kendi son 28 gününle kıyaslar. Ara verip sonra
 * normal bir haftaya dönen biri, mutlak yükü hâlâ çok düşük olsa bile yüksek
 * oran görür. Bu yüzden yalnızca orana bakıp "Riskli" demek yanıltıcıydı —
 * kullanıcı hiçbir kasta verimli tavanı (MAV) geçmemişken alarm alıyordu.
 *
 * Çözüm: yüksek oran ancak MUTLAK yük de anlamlı seviyedeyse risk sayılır.
 * `nearCeiling`, en az bir kasın MAV'ına ulaşıp ulaşmadığını söyler. Ulaşmamışsa
 * hızlı artış "Yükseliyor" olarak bilgi amaçlı gösterilir; düşük bir tabandan
 * hacmi artırmak zaten olması gereken şeydir, uyarı konusu değildir.
 */
export const acwrStatusOf = (acwr, hasEnoughData, nearCeiling = true) => {
  if (!hasEnoughData) return 'insufficient';
  const value = Number(acwr);
  if (!Number.isFinite(value) || value <= 0) return 'insufficient';
  if (value < 0.8) return 'low';
  if (value <= 1.3) return 'optimal';
  // Oran yükselmiş: mutlak yük tavana yaklaşmadıysa bu bir risk değil, rampa.
  if (!nearCeiling) return 'ramping';
  if (value <= 1.5) return 'caution';
  return 'high';
};

export const ACWR_STATUS = {
  insufficient: { label: 'Yeterli Veri Yok', text: 'text-zinc-500' },
  low: { label: 'Yetersiz', text: 'text-blue-400' },
  optimal: { label: 'İdeal', text: 'text-emerald-500' },
  ramping: { label: 'Yükseliyor', text: 'text-cyan-400' },
  caution: { label: 'Dikkat', text: 'text-amber-400' },
  high: { label: 'Riskli', text: 'text-red-500' },
};

/** Durumun kısa açıklaması — kartın altında tek satır olarak gösterilir. */
export const ACWR_HINT = {
  insufficient: 'İlk kayıttan 21 gün geçince hesaplanır.',
  low: 'Yük son haftalarda düşmüş. Hacmi kademeli artırabilirsin.',
  optimal: 'Yük artışı toparlanma kapasitenle uyumlu.',
  ramping: 'Hacim hızlı artıyor ama mutlak yük hâlâ tavanın altında.',
  caution: 'Artış hızlı ve bazı kaslar verimli tavanda. Bu hafta sabit kal.',
  high: 'Artış hızlı ve hacim tavanda. Set sayısını düşürmeyi düşün.',
};

/** ACWR'ın anlamlı sayılması için ilk kayıttan bu yana geçmesi gereken gün. */
export const ACWR_MIN_DAYS = 21;

export const VOLUME_STATUS = {
  none: { label: 'Çalışılmadı', chip: 'text-zinc-500 border-zinc-800 bg-zinc-950', bar: 'bg-zinc-700', text: 'text-zinc-500', hex: '#27272a' },
  under: { label: 'Koruma altı', chip: 'text-amber-400 border-amber-900/40 bg-amber-950/40', bar: 'bg-amber-500', text: 'text-amber-400', hex: '#fbbf24' },
  optimal: { label: 'Verimli', chip: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/40', bar: 'bg-emerald-500', text: 'text-emerald-400', hex: '#34d399' },
  high: { label: 'Yüksek', chip: 'text-orange-400 border-orange-900/40 bg-orange-950/40', bar: 'bg-orange-500', text: 'text-orange-400', hex: '#f97316' },
  over: { label: 'Tavan üstü', chip: 'text-red-400 border-red-900/40 bg-red-950/40', bar: 'bg-red-500', text: 'text-red-400', hex: '#ef4444' },
};

/**
 * Ekranda ve yedeklerde görünen sürüm.
 *
 * Asıl kaynak `package.json`; burada elle tutulmasının tek sebebi bu modülün
 * hem Vite hem de düz Node (verify betikleri) tarafından okunması ve JSON
 * import'unun iki ortamda farklı davranması. İkisinin ayrışması sessiz hatalar
 * üretiyordu (sürüm notları açılmıyor, yedek eski sürümü yazıyor), bu yüzden
 * `scripts/verify-core.mjs` iki değerin eşitliğini test ediyor — ayrışırsa
 * build kırılır.
 */
export const APP_VERSION = '7.8';

export const LATEST_RELEASE_NOTES = {
  version: APP_VERSION,
  title: 'ProOverload 7.8',
  date: '2026-08-26',
  items: [
    {
      title: 'Program Zekâsı ve Sağlık Skoru',
      desc: 'Program oluşturucu taslağın tamamını hacim bandı, kas başına dağılım, seans süresi, gün dengesi ve temel hareket örüntüleriyle birlikte 0–100 arasında denetliyor. Skor tek başına hüküm değil: beş alt puan ve her kesintinin gerekçesi aynı kartta görünüyor. Bölgesel uzmanlaşma bilinçliyse düşük örüntü puanının hata olmadığı da açıkça yazıyor.'
    },
    {
      title: 'Üç Program Amacı',
      desc: 'Program yazarken Gelişim, Koruma veya Toparlanma amacı seçilebiliyor. Gelişim kişisel verimli bandı, Koruma daha düşük zaman maliyetli bir kestirimi, Toparlanma ise geçici azaltmayı kullanıyor. Koruma ve toparlanma sayıları kesin fizyolojik eşik diye değil, şeffaf planlama kestirimi olarak etiketleniyor.'
    },
    {
      title: 'Üç Kasa Kadar Öncelik',
      desc: 'Program oluşturucuda en fazla üç öncelikli kas seçiliyor. Otomatik dengeleme set eklerken bu kasları önce ele alıyor; süre kısaltırken onları taşıyan setleri en son azaltıyor. Sınır konmasının sebebi her kası öncelik yapmanın hiçbir kasa öncelik vermemekle aynı olması.'
    },
    {
      title: 'Tek Dokunuşla Set Dengeleme',
      desc: 'Mevcut hareketler korunarak kas hacimleri seçilen banda yaklaştırılıyor. Hareket eklenmiyor veya silinmiyor; bir harekette en fazla altı set, azaltmada en az iki set korunuyor. Eksik kasa uygun hareket yoksa sistem sessizce başka kasa set yazmak yerine hareket eklemek gerektiğini söylüyor.'
    },
    {
      title: 'Seans Süresi Bütçesi',
      desc: '45, 60, 75 veya 90 dakikalık üst sınır seçiliyor ve her gün gerçek dinlenme ayarına göre yeniden tahmin ediliyor. Bütçeyi aşan günün kaç dakika taştığı denetimde görünür; toplam set sayısının makul görünmesi artık uzun bir seansı gizlemiyor.'
    },
    {
      title: 'Hareket Silmeden Süreye Sığdır',
      desc: 'Süre düzeltme düğmesi düşük öncelikli setleri gün gün azaltıyor. Hiçbir hareket silinmiyor ve hiçbir hareket iki setin altına inmiyor. Buna rağmen süre aşımı sürüyorsa uygulama sayı uydurmak yerine hareket seçimini değiştirmek gerektiğini belirtiyor.'
    },
    {
      title: 'Günleri Haftaya Eşit Yay',
      desc: 'Program günleri tek dokunuşla toparlanma boşlukları bırakacak biçimde pazartesiden pazara yayılıyor. Gün sırası, hareket sırası, setler ve süpersetler değişmiyor; yalnız haftanın günleri yeniden atanıyor.'
    },
    {
      title: 'Kas × Gün Dağılım Matrisi',
      desc: 'Programın en çok çalıştırdığı kasların hangi günde kaç katkı seti aldığı tablo halinde gösteriliyor. Böylece haftalık toplam doğru olsa bile bütün hacmin tek güne yığıldığı durum, kas kas görünür hale geliyor.'
    },
    {
      title: 'Kişisel Optimal Hacim Bandı',
      desc: 'Analiz → Hacim ekranı popülasyon başlangıç aralığını, performansın korunduğu tamamlanmış haftalarla kişiselleştiriyor. Tek bir en iyi sayı üretilmiyor; alt ve üst sınır gösteriliyor. Dört haftadan az veya ölçülemeyen geçmişte sistem kişiselleşmiş gibi davranmıyor.'
    },
    {
      title: 'Optimal Hacimde Veri Güveni',
      desc: 'Her kas için kayıtlı hafta, gerçekten değerlendirilebilen hafta, toparlanan hafta ve güven yüzdesi ayrı gösteriliyor. Ardından performans ölçümü olmayan son hafta “toparlanamadı” sayılmıyor; bilinmeyen ile başarısız ilk kez veri modelinde ayrılıyor.'
    },
    {
      title: 'Toparlanma Ayarlı Hacim',
      desc: 'Koç kapasite verisinin güveni en az yüzde 60 ise kişisel banda geçici bir ayar uygulanıyor: güçlü durumda en fazla +1, düşük durumda en fazla −2 set. Düşük güvenli uyku veya hazır oluş verisi hacmi değiştirmiyor. Bu ayar kalıcı hedefleri ya da şablonu sessizce yazmıyor.'
    },
    {
      title: 'Düşük Getirili Hacim Adayı',
      desc: 'Aktif plan kişisel üst bandı geçtiğinde fazlalık “junk volume” diye kesin hükümle etiketlenmiyor. Bunun yerine azaltma deneyi için düşük getirili hacim adayı olarak gösteriliyor; kaç set olduğu ve kararın hangi güven düzeyine dayandığı açık kalıyor.'
    },
    {
      title: 'Aktif Plan ve Optimal Bant Karşılaştırması',
      desc: 'Her planlı kas için mevcut set, güncel hedef aralığı, eksik set veya üst sınır fazlası yan yana geliyor. Yalnız aktif plandaki kaslar sayılıyor; programın bilerek hedeflemediği on altı kasın tamamı uyarıya dönüşmüyor.'
    },
    {
      title: 'Dört Haftalık Hacim Deneyi',
      desc: 'Seçilen kas için başlangıç, kontrollü artış, üst sınır denemesi ve boşaltma haftasından oluşan dört adımlı rampa gösteriliyor. Toparlanma zayıfsa üçüncü hafta artmıyor. Bu bir otomatik uygulama değil; her adımın devam koşulu yazılı bir deney planı.'
    },
    {
      title: 'Optimal Hacim Koç Entegrasyonu',
      desc: 'Koç aktif plandaki en belirgin hacim açığını veya yüksek güvenli fazlalığı tek ölçülebilir madde olarak gösteriyor. Tavsiye Program ekranına gider, Hacim kategorisinde süzülür ve Uyguladım denirse karar defterinde üç hafta sonra ölçülebilir.'
    },
    {
      title: 'Program Müdahaleleri Geri Alınabilir ve Görünür',
      desc: 'Otomatik set dengeleme ve süre düzeltme kaç set eklediğini veya çıkardığını işlem sonrasında yazıyor. Program kaydedilene kadar değişiklik taslakta kalıyor; arka planda şablon, aktif plan veya localStorage kaydı değiştirilmiyor.'
    },
    {
      title: 'Koç Karar Panosu',
      desc: 'Koçun onlarca ayrı maddesi artık tek bir karar panosunda üç soruya cevap veriyor: bugün kapasitem ne, önce ne yapmalıyım ve karar neye dayanıyor. Eski kartlar kaldırılmadı; derin analiz sekmesinde korunuyor. Yeni pano onların yerine ikinci bir hesap yapmıyor, mevcut sonuçları açıklanabilir bir sıraya sokuyor.'
    },
    {
      title: 'Çoklu Sinyalli Günlük Kapasite',
      desc: 'Hazır oluşluk, uyku, dinlenme nabzı, ağrı günlüğü, fitness–yorgunluk eğrisi ve yakın dönem yükü aynı başlangıç kartında birleşiyor. Tek bir kötü gece veya tek bir yüksek sayı otomatik hüküm vermiyor. Ağrı ise daha yüksek ağırlıkla değerlendirilerek diğer iyi sinyallerin içinde kaybolmuyor. Bu bir tıbbi skor değil; antrenman kararını başlatan şeffaf bir özet.'
    },
    {
      title: 'Veri Güveni ve Eksik Veriyi Cezalandırmama',
      desc: 'Kapasite puanının yanında ayrı bir veri güveni yüzdesi var. Girilmemiş uyku ya da nabız sıfır puan sayılmıyor; o sinyal hesap dışı bırakılıyor ve güven düşüyor. Kullanılabilir ağırlığın %40 altındaysa uygulama sahte bir kesin sayı göstermek yerine “Veri Az” diyor. Böylece kayıt eksikliği kötü toparlanma gibi görünmüyor.'
    },
    {
      title: 'Koç Sinyal Dökümü',
      desc: 'Kapasite puanına dokununca onu oluşturan altı sinyal tek tek açılıyor: değer, renk, kısa yorum ve kaynağın öz bildirim mi, doğrudan ölçüm mü, yoksa tahmin modeli mi olduğu görünür. Kullanıcı bir toplam puana inanmak zorunda kalmıyor; hangi parçaya katılmadığını görebiliyor.'
    },
    {
      title: 'Bugün / Bu Hafta / İzle Zaman Ufukları',
      desc: 'Koç maddeleri artık tek uzun listede değil. Bugünü değiştiren ağrı ve toparlanma kararları “Bugün”, program ve hacim düzenlemeleri “Bu Hafta”, düşük aciliyetli örüntüler “İzle” altında. Her ufukta kaç madde olduğu yazıyor; uzun vadeli bir gözlemin acil uyarı gibi görünmesi engelleniyor.'
    },
    {
      title: 'Konu Süzgeci ve Üç Öncelik',
      desc: 'Sağlık, toparlanma, hacim, ilerleme, beslenme, düzen ve kardiyo başlıkları tek dokunuşla süzülebiliyor. Panonun üstünde ayrıca en fazla üç uygulanabilir görev var. Saf bilgi ve olumlu durumlar görev yapılmıyor; yapılacak bir eylemi olmayan karta “görev” demek yalnızca baskı üretirdi.'
    },
    {
      title: 'Neden Bu Öneri?',
      desc: 'Her koç maddesi artık dayanağını açıyor: doğrudan kayıt, çoklu kayıt eğilimi, tahmin modeli veya uygulama kuralı. Güven sınıfı ve yorumun sınırı da yanında. Model çıktısı teşhis gibi, tek kayıt da uzun dönem kanıtı gibi sunulmuyor. İlgili ekrana geçiş ve “Uyguladım” kaydı aynı satırda korunuyor.'
    },
    {
      title: '7 / 28 / 84 Günlük Eş Dönem Karşılaştırması',
      desc: 'Analiz → Koç → Dönem ekranı seçilen son 7, 28 veya 84 günü hemen öncesindeki AYNI uzunlukla karşılaştırıyor. Takvim ayları kullanılmıyor; 31 günlük ayı 28 günlük ayla kıyaslayıp pencere farkını gelişim sanmak engelleniyor. İki dönemin tarih aralıkları açıkça yazıyor.'
    },
    {
      title: 'Dört Alanda Tek Karşılaştırma',
      desc: 'Antrenman (seans, etkili set, tonaj, süre, kardiyo, hareket çeşitliliği), toparlanma (hazır oluşluk, uyku, dinlenme nabzı), beslenme (kalori, protein, kayıtlı gün) ve vücut (kilo, bel, yağ oranı) aynı yöntemle yan yana geliyor. Alanlar ayrı sekmelerde; işlev kaybolmadan ekran kalabalığı azaltıldı.'
    },
    {
      title: 'Anlamlı Değişim Süzgeci',
      desc: 'Her küçük fark renkli ok almıyor. Set ve tonajda yüzdesel, uyku ve hazır oluşlukta puan, kalori ve protein gibi alanlarda pratik mutlak eşikler var. “Yalnızca anlamlı değişimler” seçildiğinde günlük gürültü saklanıyor. Yönü hedefe bağlı olan kilo, kalori ve hacim otomatik iyi/kötü diye etiketlenmiyor.'
    },
    {
      title: 'Veri Kapsamı ve Darboğaz',
      desc: 'Dönem analizinin üstünde hazır oluşluk, uyku, beslenme ve vücut ölçümünün kapsama oranı var. En zayıf alan ayrıca belirtiliyor. Örneğin kalori yalnızca iki gün girildiyse dönem farkının bir kısmının kayıt sıklığından gelebileceği açıkça yazıyor; eksik veri sessizce kesin sonuca dönüşmüyor.'
    },
    {
      title: 'Antrenman Ritmi ve Kopyalanabilir Özet',
      desc: 'Seansların pazartesiden pazara hangi günlere yığıldığı yedi sütunlu ritim görünümünde gösteriliyor. Hem dönem analizi hem koç özeti tek dokunuşla düz metin olarak kopyalanabiliyor; antrenörle paylaşmak veya notlara almak için ekran görüntüsü gerekmiyor.'
    },
    {
      title: 'Koç Kalibrasyonu',
      desc: 'Karar defteri artık yalnız genel isabeti değil uygulama oranını, konu bazlı isabeti, son beş tavsiyenin önceki beşe göre yönünü ve iki kez ters sonuç veren tavsiyeyi de gösteriyor. Beş ölçümden önce genel oran, üç ölçümden önce konu oranı yazılmıyor. Uygulanmayan tavsiye yine başarısız sayılmıyor; koçun doğruluğu ile kullanıcının uygulaması birbirine karıştırılmıyor.'
    },
    {
      title: 'Koç Karar Defteri: Tavsiye İşe Yaradı mı',
      desc: 'Koç her gün tavsiye veriyordu ama hiçbiri geri dönüp kontrol edilmiyordu. Kullanıcı "göğsüne iki set ekle" tavsiyesini uyguluyor, üç hafta geçiyor ve ne olduğunu kimse bilmiyor. Bu, koçu yanlış olamayan bir şeye çeviriyordu — ve yanlış olamayan bir tavsiye doğru da olamaz. Artık koç kartındaki her maddede "Uyguladım" var: dokunduğunda o anki haftalık hacim ve tahmini 1RM not ediliyor, üç hafta sonra tekrar ölçülüyor. Defter iki şeyi AYRI takip ediyor ve karıştırmıyor: tavsiye edilen şey gerçekten yapıldı mı (uygulama) ve sonuç ne oldu (tahmini 1RM). Ayrı tutulmalarının sebebi şu: uygulanmamış bir tavsiye BAŞARISIZ değildir, sadece denenmemiştir. İsabet oranı yalnızca gerçekten uygulanmış tavsiyelerden hesaplanıyor — denenmemişleri saymak, oranı koçun değil kullanıcının davranışının ölçüsü yapardı. Beş ölçümün altında oran hiç yazılmıyor: iki denemenin biri tutunca çıkan "%50 isabet" bir bilgi değil. Ölçüm penceresi üç hafta: daha kısası antrenman gürültüsünü sonuç sanmak, daha uzunu tavsiyenin etkisini araya giren on başka değişikliğe karıştırmak.'
    },
    {
      title: 'Performans Sürücüleri: Sende Ne İşe Yarıyor',
      desc: 'Uygulama uyku, hazır oluşluk, protein, dinlenme günü ve kiloyu ayrı ayrı kaydediyordu; hepsinin gerekçesi "performansı etkiler" idi. Ama hangisinin SENİN performansını etkilediği hiç ölçülmüyordu — literatür ortalama bir insanı anlatıyor. Zor kısım "iyi seans"ı tanımlamaktı: toplam tonaj işe yaramaz, çünkü bacak günü her zaman kol gününden ağırdır ve bu bir performans farkı değil program farkı. Burada her seans KENDİ hareketlerinin son beş seansına göre puanlanıyor, yani bacak günüyle kol günü aynı ölçekte. Sonra dokuz sinyalin her biri bu puanla karşılaştırılıyor ve ekranda korelasyon katsayısı değil anlaşılır olan gösteriliyor: en yüksek üçte birlik dilimde seanslar ortalama ne kadar iyi geçti. Ayrıca kişisel bir EŞİK aranıyor — "hazır oluşluk 60 altındaysa ağırlık artırma" gibi bir kural herkes için aynı yerde değil; kesme noktası iki tarafta da yeterli seans kalacak şekilde farkı en büyüten yerden çıkıyor. Modül nedensellik iddia etmiyor ve bunu her çıktısında yazıyor: iyi uyunan gün genellikle stresin de düşük olduğu gündür.'
    },
    {
      title: 'Tepki Profili: Hangi Tekrar Aralığı Sende Çalışıyor',
      desc: 'Uygulamanın bütün varsayılanları popülasyon ortalamalarından geliyor — 6-10 tekrar, haftada iki gün, MEV ile MAV arası hacim. İyi başlangıç değerleri ama hiçbiri kişinin kendi kaydına bakmıyor. Oysa kayıt yeterince uzunsa cevap orada: bu kişi hangi tekrar aralığında, hangi hacim bandında ve hangi sıklıkta gerçekten daha hızlı ilerlemiş. Ölçü SEANS BAŞINA tahmini 1RM kazancı — haftalık ölçmek daha çok antrenman yapan bandı otomatik kazandırırdı ("haftada üç gün çalışınca daha çok ilerliyorsun" bir keşif değil, tanım). Her kazanç onu ÜRETEN seansın bandına yazılıyor: bir sonraki seansta görülen artış, bir öncekinde yapılan işin sonucu. İki bandın farkı küçükse "en iyi" seçilmiyor — uydurmak olurdu. Yeterli gözlemi olmayan bantlar gizlenmiyor, gri gösteriliyor: "bu bantta hiç çalışmamışsın" bilgisi de en az sonucun kendisi kadar değerli.'
    },
    {
      title: 'Hareket Getirisi: Hangi Hareket Yerini Hak Ediyor',
      desc: 'Program kurarken sorulan soru hep "hangi hareketi ekleyeyim" oluyor; asla "hangisini çıkarayım" değil. Oysa seans süresi sabit ve her hareket başka bir hareketin yerini alıyor. Duraklama ile VERİM aynı şey değil: ilerleyen ama bunun için haftada on iki set yiyen bir hareket, altı setle aynı kazancı veren hareketten pahalı. Ölçü, yatırılan on set başına tahmini 1RM kazancı. İki tuzağa karşı önlem var. Birincisi izolasyon haksızlığı: lateral raise ile squat aynı ölçekte ilerlemiyor ve mutlak sıralama izolasyonları hep en dibe yazardı — bu yüzden asıl sıralama KAS İÇİNDE. İkincisi yeni hareket yanılgısı: ilk haftalardaki sıçrama kas kazancı değil teknik öğrenmesi, o yüzden en az dört seans ve yirmi bir gün isteniyor. Düşük getirili bir hareket kötü hareket değil — eklem dostu olduğu ya da bir zayıf noktayı hedeflediği için tutuluyor olabilir; modül bunu söylüyor ve silme kararını vermiyor.'
    },
    {
      title: 'Kas Karnesi',
      desc: 'Bir kasın durumu üç ayrı ekrandan okunuyordu: hacim tablosundan yeterli mi, 1RM grafiğinden ilerliyor mu, sıklık kartından yeterince bölünmüş mü. Üçü de ayrı ayrı doğru ama kullanıcı "göğsüm iyi gidiyor mu" diye sorduğunda üç ekranı gezip kendi sentezini yapmak zorundaydı ve çoğunlukla yapmıyordu. Karne üçünü tek nota indiriyor: hacim 40, tahmini 1RM ilerlemesi 40, sıklık 20 puan. Asıl değerli olan notun kendisi değil yanındaki SINIRLAYICI ETKEN — "Göğüs C" bir şey söylemiyor, "Göğüs C, sınırlayan hacim" ne yapılacağını söylüyor. İlerlemesi ölçülemeyen kaslara sıfır değil nötr puan veriliyor: ölçemediğimiz için cezalandırmak yanlış olurdu. Hiçbir seansta iki set almamış kaslar hiç notlanmıyor — çömelişin bele yazdığı çeyrek setler bir "bel programı" değil ve bunlara not vermek en düşük notu her zaman aynı yan etki kasına yazdırıp asıl sorunlu kası listenin ortasında bırakıyordu.'
    },
    {
      title: 'Sessiz Sinyaller: Kural Yazılmamış Değişimler',
      desc: 'Uygulamadaki bütün uyarılar kural tabanlı: birinin oturup "hacim MEV altına düşerse uyar" diye yazması gerekti. Bu iyi çalışıyor ama kaçınılmaz bir kör noktası var — yalnızca önceden düşünülmüş şeyleri yakalıyor. Set başına ortalama tekrarın iki haftada belirgin düşmesi hiçbir kuralı tetiklemiyor, çünkü kimse o kuralı yazmadı; oysa ağırlık aynıyken tekrarın düşmesi çoğu zaman ilk sinyal. Bu kart kural yazmıyor, DEĞİŞİM arıyor: dokuz seriye aynı soruyu soruyor — son ölçümler kendi geçmişinin normal dalgalanmasına göre sıra dışı mı. Ortalama ve standart sapma yerine ortanca ve MAD kullanılıyor, çünkü tek bir rekor seansı ya da hasta geçirilen bir hafta ikisini birlikte şişirip gerçek değişimi normal gösteriyor. Düzenli bir eğilim (sürekli artan tonaj gibi) uyarı üretmiyor: aranan şey eğilim değil eğilimden sapma. Bulgular teşhis değil — aynı düşüşü yeni bir programa geçmek de üretir ve o iyi haberdir.'
    },
    {
      title: 'Blok Karşılaştırma: Ne Değişti, Ne Üretti',
      desc: 'Uygulama "bu hafta geçen haftaya göre" karşılaştırmasını yapıyordu ama tek hafta bir blok değil: bir haftanın hacmi tatil, hastalık ya da yoğun bir iş haftası yüzünden düşebilir ve bunun programla ilgisi yoktur. Antrenman kararları dört-altı haftalık ölçekte veriliyor, karşılaştırma da orada yapılmalı. Asıl tasarım kararı GİRDİ ile ÇIKTIyı ayırmak: hacim, sıklık, şiddet ve hareket sayısı senin seçtiklerin; tahmini 1RM ise sonuç. İkisini aynı listede karıştırmak "hacmim %20 arttı" ile "gücüm %3 arttı"yı eşit iki başarı gibi gösterirdi, oysa birincisi yalnızca ikincisinin bedeli. Çıktı ölçümünde tek kritik nokta: yalnızca İKİ BLOKTA DA yapılmış hareketler karşılaştırılıyor. Yeni bir harekete başlamak ortalama 1RM\'i düşürüyor (teknik henüz oturmamış), bırakmak yükseltiyor; ortak olmayanları saymak hareket değiştirmeyi gelişim ya da gerileme diye okumak olurdu.'
    },
    {
      title: 'Senaryo: Şunu Değiştirsem Ne Olur',
      desc: 'Uygulama ne yapman gerektiğini söylüyordu ama sonucunu denemeden görmenin yolu yoktu. Tavsiyeyi uygulayan biri sonucu üç hafta sonra görüyor; beğenmezse üç hafta gitmiş oluyor. Program kurmanın en pahalı tarafı bu gecikme. Senaryo gecikmeyi kısaltmıyor — kısaltamaz — ama kararı verirken elde olan bilgiyi görünür kılıyor: değişiklikten sonra hacim hangi banda düşüyor, o bantta senin geçmişinde ne olmuş ve bedeli kaç dakika. Mevcut duruma göre hazır sorular üretiliyor, çünkü boş bir form kimseye bir şey sordurmuyor. Tahmin üretmemesi bilinçli: hacim-tepki ilişkisi kişide ölçülebilir ama gereken veri miktarı tipik bir kullanıcıda yok ve "iki set eklersen %1.4 daha hızlı ilerlersin" demek uydurulmuş bir kesinlik olurdu. Veri yoksa kart bunu açıkça söylüyor — boş bir alan bırakmak cevabı olumlu sanmaya yol açardı.'
    },
    {
      title: 'Koç Odağı',
      desc: 'Koç maddelerinin önceliği kodun içine sabitlenmişti ve bu sabitler herkes için aynıydı. Ama aynı uygulamayı kullanan iki kişi aynı şeyi istemiyor: biri kas kazanmaya çalışıyor, diğeri omzunu bir daha sakatlamamaya. İkisine de aynı sırayla aynı sekiz maddeyi göstermek, ikisinin de kendi maddesini listenin ortasında bulması demek. Altı odak var: Dengeli, Kas Kazanımı, Kuvvet, Sakatlıksız Kalmak, Düzen Kurmak, Yağ Kaybı. Odak maddeleri SİLMİYOR, sıralarını kaydırıyor — bir maddeyi tamamen kapatmak kullanıcının işi ve erteleme/kapatma zaten var. Tek istisna kasıtlı: sağlık ve toparlanma maddeleri hiçbir odakta geri itilmiyor. "Kas kazanımı" odağı seçen biri, eklem ağrısı uyarısını görmemeyi seçmiş olmuyor; bir tercih ekranının kullanıcıyı sakatlığa götürebilmesi kabul edilebilir bir tasarım değil. Seçilen odak koç kartının başlığında rozet olarak duruyor: etkisi görünmeyen bir ayar unutulur.'
    },
    {
      title: 'Analiz Kilitleri: Bu Kart Neden Boş',
      desc: 'Uygulamadaki analizlerin çoğunun bir veri eşiği var ve bu doğru — dört seanslık veriden plato çıkarmak, gürültüyü teşhis diye sunmak olurdu. Ama eşik SESSİZ çalışıyordu: kart ya hiç görünmüyor ya da "yeterli veri yok" yazıyordu. İkisi de aynı soruyu cevapsız bırakıyor: ne kadar yeterli değil ve ne girersem açılır. Kullanıcı açısından sonucu şuydu — uygulamanın yarısının var olduğu bile bilinmiyordu; bir kart hiç görünmediyse o özelliğin eksik olduğu değil VAR OLMADIĞI sanılıyor. Artık on altı analizin her biri için ne gerektiği, elde ne olduğu ve ne kadar kaldığı yazıyor. En işe yarayan tarafı da şu: hangi TEK veri türünü girmenin en çok analizi açacağını söylüyor. İlerleme yüzdesi en zayıf koşula göre hesaplanıyor — üç koşuldan ikisi tamsa ve biri hiç yoksa "%66 hazır" demek, analizin açılmaya yakın olduğunu ima ederdi. Hepsi açıksa kart kendini gizliyor.'
    },
    {
      title: 'Hayalet Seans: Geçen Seferle Canlı Yarış',
      desc: 'Seans sonu raporu "geçen sefere göre ne değişti" sorusunu seans BİTTİKTEN sonra cevaplıyordu. Ama o cevabın işe yarayacağı an seansın içi: son sette bir tekrar daha yapıp yapmama kararı orada veriliyor ve o an elinde karşılaştırma yok. Artık aynı şablonun bir önceki seansı yanına konuyor ve set set ilerlerken "şu an öndesin / gerisin" yazıyor. Her boş setin üstünde geçen seferin aynı sıradaki seti görünüyor — hedef vermiyor, sadece hatırlatıyor. Karşılaştırma SET SIRASINA göre: aynı hareketin üçüncü seti üçüncü setle kıyaslanıyor, çünkü ortalama almak yanıltıcıydı; dört set yerine üç yapan biri "daha az tonaj" görünüp aslında her sette daha iyi olabiliyor. Yalnızca iki tarafta da yapılmış setler sayılıyor: henüz girilmemiş setler için "gerisin" demek haksız olurdu. Şablon yoksa aynı hareketleri en çok paylaşan seans hayalet oluyor, yani serbest çalışan da yarışabiliyor.'
    },
    {
      title: 'Vaktim Az: Seansı Akıllıca Kısalt',
      desc: '"Bugün sadece 30 dakikam var" durumunda iki seçenek vardı: seansı hiç yapmamak ya da rastgele hareket atlayıp neyi kaybettiğini bilmemek. İkincisi daha kötü, çünkü atlanan hep SONDAKİ hareketler oluyor ve programın sonunda bazen bir kasın tek hareketi duruyor. Artık 30/45/60 dakika seçiyorsun ve seans değere göre kısalıyor: bileşke hareketler, bir kasın tek hareketi ve gerilmede yükleyenler en son elden çıkıyor. ÖNCE set kısılıyor, sonra hareket atılıyor — üç seti ikiye indirmek bir hareketi tamamen atmaktan her zaman daha az kayıp. Hiçbir hareket iki setin altına inmiyor. Kısaltma tek harekete yığılmıyor, kayıp seansa yayılıyor. Ve değişiklik önce GÖSTERİLİYOR: neyin neden çıkarıldığı yazıyor, sen onaylıyorsun.'
    },
    {
      title: 'Zayıf Halka: Önce Neyi Düzelteyim',
      desc: 'Uygulama gelişimi beş ayrı pencereden anlatıyordu — kuvvet standartları, kas dengesi, hacim tablosu, durgunluk taraması, seçim denetimi. Hepsi doğru ama hiçbiri en önemli soruyu cevaplamıyordu: önce neyi düzelteyim. Kullanıcı beş ekranda beş ayrı uyarı görüyor ve hangisinin acil olduğunu bilmiyordu. Artık hepsi tek sıralı listede. Sıralama ETKİ × KESİNLİK: bir kasın koruma eşiğinin altında olması standartlarda geride olmasından daha büyük etki (biri büyümeyi durduruyor, diğeri yalnızca karşılaştırmalı bir konum), ve az veriye dayanan tahminler yüksek etkili olsalar bile aşağı iniyor. Modül yeni hesap YAPMIYOR: aynı hesabı ikinci kez yapmak iki farklı sayı üretme riski taşırdı.'
    },
    {
      title: 'Form Eğrisi: Fitness ve Yorgunluk',
      desc: 'Uygulama yükü tek bir sayı olarak görüyordu: bu haftanın hacmi. Ama antrenmanın etkisi iki zıt bileşenden oluşuyor ve ikisi FARKLI HIZDA sönüyor. Fitness yavaş birikip yavaş sönüyor (haftalar), yorgunluk hızlı birikip hızlı sönüyor (günler). Form ikisinin farkı — ağır bir haftadan sonra performansın neden düşük göründüğünü ve birkaç gün hafifleyince neden beklenenden yükseğe çıktığını açıklayan şey bu. Deload\'un neden işe yaradığının modeli. Üç eğri birlikte çiziliyor ve "kaç gün dinlenirsem toparlanırım" sorusuna sayı veriliyor. Bu bir kesin tahmin aracı değil: sabitler kişiye göre değişiyor ve burada literatürün yaygın değerleri kullanılıyor — işe yarayan taraf mutlak sayı değil eğilim.'
    },
    {
      title: 'Programı Güncelle: Ölçümü Plana Uygula',
      desc: 'Uygulama geçen haftanın ne söylediğini biliyordu ama bunu plana uygulamak tamamen elle yapılıyordu: beş ekranı gezip şablonları tek tek açıp set sayılarını değiştirmek. Pratikte kimse yapmıyor, yani ölçümlerin çoğu okunup unutuluyordu. Artık ölçümler somut önerilere çevriliyor: hangi şablonda hangi harekete kaç set eklenecek ya da çıkarılacak. Set eklenirken EN AZ seti olan hareket seçiliyor (hacmi tek harekete yığmak yerine dağıtmak daha iyi uyaran veriyor), çıkarılırken en çok seti olan. Haftada en fazla dört set ekleniyor — daha fazlası neyin işe yaradığını anlaşılmaz yapar. Form modeli yorgunluk birikimi gösteriyorsa hacim artışı önerileri otomatik gizleniyor. Hiçbiri kendiliğinden uygulanmıyor: sessizce değişen bir program güvenilmez bir programdır.'
    },
    {
      title: 'Yıl Özeti',
      desc: 'Uygulama her şeyi hafta ve blok ölçeğinde anlatıyordu; en uzun pencere on iki hafta. Ama bir yıl çalışmış birinin merak ettiği şey o ölçekte değil: kaç seans, ne kadar ağırlık, hangi hareket ne kadar ilerledi, en uzun seri neydi. Sayılar zaten kayıttaydı, hiçbir yerde toplanmıyordu. En çok gelişen hareketler ORANA göre sıralanıyor: 20 kiloluk bir hareketin 5 kg artması, 150 kiloluk bir hareketin 5 kg artmasından çok daha büyük bir gelişim; mutlak farkla sıralasaydık ağır hareketler her zaman kazanırdı. Takvim yılı değil bugünden geriye on iki ay — ocak ayında "bu yıl 3 seans yaptın" demek anlamsız olurdu.'
    },
    {
      title: 'Hareket Keşfi',
      desc: 'Kütüphanede iki yüzden fazla hareket var ve tipik kullanıcı yirmi otuzunu kullanıyor. Kalanı arama kutusunda duruyor ama kimse "bugün hiç denemediğim bir hareket bulayım" diye aramıyor — arama, ne aradığını bilene yarıyor. Bu kart tersini yapıyor: geçmişindeki BOŞLUKLARDAN yola çıkıp öneriyor. Üç tür boşluk arıyor: koruma eşiğinin altında kalan kaslar, hep aynı tek hareketle çalışılan kaslar (o hareket yapılamadığında o kasın haftası tamamen çöküyor) ve gerilmede yükleyen hareketi hiç olmayan kaslar. Öneriler yalnızca fiilen KULLANDIĞIN ekipmanlardan seçiliyor — barbell\'ı olmayan birine barbell hareketi önermek öneriyi çöpe atmak. Kas başına en fazla iki öneri: sınır olmadan en büyük boşluk bütün listeyi dolduruyordu.'
    },
    {
      title: 'Ölçülmüş Dinlenme Süresi',
      desc: 'Dinlenme süresi öneriliyordu ama açık döngüydü: önerinin işe yarayıp yaramadığı hiç ölçülmüyordu. 7.2\'den beri her set kendinden önceki gerçek beklemeyi taşıyor ve bu döngüyü kapatmayı mümkün kılıyor. Artık aynı harekette AYNI AĞIRLIKTA, farklı sürelerden sonra kaç tekrar yapıldığına bakılıp kişiye özel bir süre çıkarılıyor. Ölçüt tekrar kaybı: kaybın kabul edilebilir seviyeye indiği EN KISA süre aranıyor — daha uzun dinlenmek kaybı azaltmıyorsa yalnızca seansı uzatıyor. Kas grubu bazında hesaplanıyor çünkü hareket başına örneklem çoğu kullanıcıda yetersiz kalıyor.'
    },
    {
      title: 'Program Paylaşım Kodu',
      desc: 'Şablonlar cihazda kilitliydi. QR kodu yedeğin TAMAMINI taşıyor — bir arkadaşına tek bir programı vermek için bütün verini paylaşmak gerekiyordu, ki bu makul değil. Artık her şablonun kendi metin kodu var: mesajdan, nottan, e-postadan geçiyor. Kod programın YAPISINI taşıyor (hareketler, set sayıları, süperset bağları, tekrar aralıkları, planlanan teknikler) ama ağırlıkları taşımıyor: başkasının yükünü senin programına yazmak yanlış bir başlangıç değeri önermek olurdu. Kod sürümlü, yani biçim değişirse eski kodlar tanınmaya devam ediyor ve tanınmayan bir kod sessizce yanlış veri üretmek yerine açıkça reddediliyor — hatanın ne olduğu da yazıyor.'
    },
    {
      title: 'Antrenman Hedefi Modu',
      desc: 'Uygulamanın bütün varsayılanları hipertrofiye göre ayarlıydı: 6-10 tekrar, 120 saniye dinlenme, çift ilerleme. Doğru bir varsayılan ama tek varsayılan. Aynı kişi bir blok kuvvete, bir blok dayanıklılığa çalışabiliyor ve o zaman altı ayrı ayarı elle değiştirmesi gerekiyordu — biri unutulduğunda sistem kendi içinde çelişiyordu (5 tekrar hedefi ama 90 saniye dinlenme gibi). Artık dört mod var: Hipertrofi, Kuvvet (3-6 tekrar, 210 sn — uzun dinlenme burada tercih değil şart, sinir sistemi toparlanmazsa sonraki set yükü kaldıramıyor), Dayanıklılık (15-25 tekrar, 60 sn, hedef RIR 1) ve Koruma (RIR 3, sabit ilerleme — amaç ilerlemek değil kaybetmemek). Mod yalnızca VARSAYILANI değiştiriyor: hareket ya da şablon için elle yazdığın değerler dokunulmadan kalıyor, çünkü mod denemek ayarlarını silmek anlamına gelmemeli.'
    },
    {
      title: 'Isınma Setlerini Tek Dokunuşla Ekle',
      desc: 'Isınma merdivenini hesaplayan kod uygulamada zaten vardı ama yalnızca plaka hesaplayıcısında kullanılıyordu: ağırlıkları görüyor, sonra setleri seansa elle giriyordun. Pratikte kimse girmiyor. Artık hareketin yanındaki düğme merdiveni doğrudan sete yazıyor. Setler ısınma tipiyle giriyor, yani hacme sayılmıyorlar ama kayıtta duruyorlar. Merdiven çalışma ağırlığına göre kuruluyor: önce bu seansta girilmiş sete, yoksa şablonda planlanana, o da yoksa geçmişteki son çalışma setine bakıyor. Bar ağırlığı yalnızca barbell hareketlerinde uygulanıyor — kabloya 20 kg taban koymak yan kaldırışta merdiveni tamamen boş bırakıyordu. Küçük kas gruplarında ve hafif yüklerde merdiven iki kademeye iniyor; yan kaldırışa dört kademe ısınma seansı uzatmaktan başka bir şey yapmıyor.'
    },
    {
      title: 'Hareket Başına Seans Notu',
      desc: 'Seansın tamamı için bir not alanı vardı ama salonda tutulmak istenen notların çoğu HAREKETE ait ve bir sonraki seansta o hareketin başında hatırlanması gerekiyor: "sehpa dördüncü delik", "sol omuz son sette sıkıştı", "bu makinede pim iki numara". Seans notuna yazılınca kayboluyorlardı, çünkü kimse üç hafta önceki seansın not alanını açmıyor. Artık her hareketin kendi not satırı var ve o hareketin geçmiş notları hemen altında görünüyor. Kurulum notundan farklı: o KALICI bir ayar, bu O SEANSA ait bir gözlem. Dört aydan eski notlar hatırlatılmıyor — o kadar eski bir "sehpa deliği" notu büyük ihtimalle artık geçerli değil.'
    },
    {
      title: 'Tek Taraflı Hareketlerde Sol/Sağ Takibi',
      desc: 'Tek kol ve tek bacak hareketleri kayda tek bir set olarak giriyordu, oysa o set iki farklı performans: solda 10, sağda 12 tekrar yapmış olabilirsin ve uygulama ikisini de göremiyordu. Artık setin tarafı işaretlenebiliyor ve iki taraf yan yana toplanıyor. Ayrı bir set tipi AÇILMADI: taraf isteğe bağlı bir alan, yazılmayan setler eskisi gibi duruyor, yani geçmiş bozulmuyor ve takip yalnızca istediğin harekette çalışıyor. Taraf seçici de yalnızca adı tek taraflı çalışmayı çağrıştıran hareketlerde çıkıyor. Denge taraması tek seansın farkına değil, BİRKAÇ SEANSTA AYNI YÖNDE tekrarlanan farka bakıyor — bir günlük fark rastlantı, tekrarlanan fark örüntü. %10 altındaki fark hiç konuşulmuyor; o kadarı ölçüm gürültüsü.'
    },
    {
      title: 'Seans İçi Kalan Hacim Sayacı',
      desc: 'Hacim tablosu haftayı bittikten SONRA anlatıyordu; seansın ortasında "bu kastan bu hafta kaç set kaldı" sorusunun cevabı yoktu. Oysa karar tam orada veriliyor: son hareketi bırakayım mı, bir set daha ekleyeyim mi. Sayaç üç parçayı topluyor: bu hafta daha önce yapılanlar, bu seansta girilenler ve bu seansta planlanmış ama henüz girilmemiş setler. Üçüncüsü kritik — planlananları saymamak "MEV için 6 set açık" deyip zaten programda duran setleri görmezden gelmek olurdu. Tavanı aşacak kaslar ayrıca kırmızıyla uyarıyor, yani set eklemeden önce görüyorsun.'
    },
    {
      title: 'Rekor Zaman Çizelgesi',
      desc: 'Rekorlar hareket başına tutuluyordu: bir hareketin profilini açınca en iyisini görüyordun. Ama "son üç ayda kaç rekor kırdım", "hangi bölge ilerliyor" soruları için on beş profili tek tek açmak gerekiyordu. Artık hepsi tek listede, yeniden eskiye. Rekor tanımı ileriye doğru kuruluyor: bir set YAPILDIĞI GÜN rekor olduysa listede kalıyor, sonradan geçilmiş olması onu düşürmüyor — bugünün gözünden bakıp geçmişteki başarıları silmek olmazdı. İlk kez yapılan hareketler ayrı sayılıyor, çünkü onlar ilerleme değil başlangıç. Son rekorun üstünden kaç gün geçtiği de yazıyor: durgunluğun en basit göstergesi.'
    },
    {
      title: 'İki Hareketi Yan Yana Karşılaştır',
      desc: '"Bench mi incline mı daha iyi gidiyor", "kabloya geçtiğim hareket eskisinden daha mı iyi ilerliyor", "hangisini bırakayım" — bu sorular iki profili açıp göz kararı kıyaslamayı gerektiriyordu. Artık seans sayısı, toplam set, en iyi ve şu anki 1RM, haftalık artış ve tonaj yan yana. Haftalık artış toplam farktan değil ilk ve son ölçüm arasındaki süreye bölünerek hesaplanıyor: iki yıldır yaptığın hareket iki aydır yaptığını her zaman yenerdi ve bu bir ilerleme farkı değil süre farkı olurdu. Ekran iddia üretmiyor — hangisinin "daha iyi" olduğunu söylemiyor, çünkü bu kişiye, ekipmana ve hedefe bağlı. Boy yüklenmesinde de kazanan yok; ikisi de değerli.'
    },
    {
      title: 'Tek Tekrar Maksimum Test Protokolü',
      desc: 'Uygulama 1RM\'i her yerde tahmin ediyor ve bu çoğu iş için yeterli, ama tahmin tekrar sayısı arttıkça sapıyor. Gerçek maksimumu ölçmek isteyen için hiçbir rehber yoktu: ne ısınma merdiveni, ne deneme seçimi. Artık üç kademeli ısınma ve üç deneme planı çıkıyor, aralarında beş dakika dinlenmeyle. İlk deneme KESİN kaldırılacak bir yük: başarısız bir ilk deneme hem güveni hem kalan denemeleri harcıyor. Üçten fazla deneme yok, çünkü yorgunluk birikince test gerçek maksimumu olduğundan düşük ölçtürüyor — testin kendisi sonucu bozuyor. Başarısız denemeler kayda hiç yazılmıyor: sıfır tekrarlı bir set hacim ve rekor hesabında anlamsız olurdu.'
    },
    {
      title: 'Su Takibi',
      desc: 'Beslenme tarafı kaloriyi ve makroyu ayrıntılı izliyordu ama suyu hiç saymıyordu. Oysa performansa etkisi doğrudan: vücut ağırlığının yaklaşık %2\'si kadar sıvı kaybı kuvvet çıktısını ölçülebilir biçimde düşürüyor. Hedef vücut ağırlığından türetiliyor, sabit "2 litre" değil — 55 kiloluk biriyle 100 kiloluk birinin ihtiyacı aynı olamaz. Antrenman gününe ve istersen sıcak havaya ek pay veriliyor ve sayının nereden geldiği kartta yazıyor. Kayıt gün bazında toplam olarak tutuluyor, her bardak ayrı satır değil: amaç günün toplamını bilmek ve her yudumu kaydetmek kimsenin sürdüremediği bir alışkanlık. Koç yalnızca dört günden fazla takip varsa ve ortalama hedefin dörtte üçünün altındaysa konuşuyor.'
    },
    {
      title: 'Haftalık Planı Takvime Aktar',
      desc: 'Plan uygulamanın içinde duruyordu ve hayatının geri kalanı başka bir takvimde; antrenman saatini telefonun takvimine elle girmek gerekiyordu. Artık haftalık plan takvim dosyası (.ics) olarak indiriliyor. Etkinlikler haftalık tekrarlı: her hafta ayrı etkinlik üretmek takvimi doldururdu ve plan değişince eskilerini temizlemek imkânsız olurdu — tek tekrarlı etkinlik tek silme işlemiyle kalkıyor. Süre şablonun kendi tahmininden geliyor, hareket listesi de etkinliğin açıklamasına yazılıyor. Dosya olarak iniyor, bir servise gönderilmiyor: uygulama çevrimdışı çalışıyor ve hiçbir veri dışarı çıkmıyor.'
    },
    {
      title: 'Dört Yeni Düzen',
      desc: 'ÜST / ALT / TAM VÜCUT (3 gün): ilk iki gün bölünmüş olduğu için seans başına hacim makul kalıyor, üçüncü gün tam vücut olduğu için her kas haftada iki kez uyarılıyor — üç günde en dengeli seçeneklerden biri. İTİŞ / ÇEKİŞ / BACAK / ÜST (4 gün): klasik üçlü bölmenin haftada bir uyaran sorununu dördüncü bir üst gün ekleyerek çözüyor, bacak tek ağır günde kalıyor. İTİŞ / ÇEKİŞ / BACAK / ÜST / ALT (5 gün): haftanın ilk yarısı Push-Pull-Legs, ikinci yarısı Üst-Alt. İki yaklaşımın da iyi tarafını alıyor ve altı güne çıkmadan sıklığı ikiye tamamlıyor — PPL sevip haftada bir uyarımın az geldiğini düşünenler için en doğrudan çözüm. GÖVDE / UZUVLAR / BACAK / GÖVDE / UZUVLAR (5 gün): itiş-çekiş ayrımında omuz ve kol hep büyük bir bileşkeden sonra yorgun halde çalışılıyor; bu bölme onları kendi gününde taze başlatıyor. Dördü de üreticinin altın testinden geçiyor: her kas koruma eşiğinin üstünde, tavanın altında ve gerilmede yükleyen en az bir harekete sahip.'
    },
    {
      title: 'Program Üretici Artık Kendi Hareketlerini de Kullanıyor',
      desc: 'Aday havuzu elle yazılmış sabit bir listeydi. Sonucu şuydu: kütüphanede olmayan bir hareketi elle ekleyen kullanıcı onu uygulamanın her yerinde kullanabiliyor ama program üretici onu HİÇ seçmiyordu — kendi salonundaki makineyi tanıtan biri, ürettiği programda o makineyi asla görmüyordu. Artık özel hareketler birincil kaslarının havuzuna giriyor ve rolleri ad kalıbından çıkarılıyor: gerilmede yükleyen bir hareketse o role, değilse listenin sonuna. Sona eklenmeleri yerleşik hareketlerin önce denenmesini garantiliyor; kendi hareketin ancak onlar tükendiğinde ya da "bildiğim hareketleri öne al" seçiliyken geliyor. Bu arada sessiz bir hata da çıktı: hacim tamamlama yolu dışlama listesini atlıyordu, yani yapamadığını söylediğin bir hareket programa girebiliyordu. Düzeltildi.'
    },
    {
      title: 'Dalgalı Periyotlama: Gün Vurgusu',
      desc: 'Uygulamanın ilerleme modeli haftalıktı — mezosiklik hacmi haftadan haftaya artırıyor, ilerleme kuralı seanstan seansa yükü ayarlıyor. Ama haftanın İÇİNDE bir yapı yoktu: aynı kası haftada iki kez çalışan biri iki seansı da aynı tekrar aralığında yapıyordu. Artık her güne ağır, orta veya hafif vurgu verilebiliyor ve bu vurgu o günün tekrar aralıklarını kaydırıyor (ağır üç basamak aşağı, hafif dört basamak yukarı; hafif günde hedef yedek tekrar bire iniyor çünkü yüksek tekrarda tükenişe yaklaşmak uyaranın şartı). Aralık genişliği korunuyor: 6-10 ağır vurguda 3-7 oluyor, anlamsızca genişlemiyor. Aynı kasın iki seansını farklı aralıklarda çalışmak ağır günde mekanik gerilim, hafif günde metabolik stres ve daha az eklem yükü veriyor; toplam hacim aynı kalırken toparlanma kolaylaşıyor.'
    },
    {
      title: 'Şablonda Yedek Hareket',
      desc: '"Makine dolu" ya da "bugün omzum ağrıyor" durumunda seansın ortasında hareket aramak gerekiyordu. Artık her hareketin yanına şablonda bir yedek yazılabiliyor ve seansta tek dokunuşla geçiliyor. Öneriler kas katkı profiline göre geliyor, yani elle aramak da gerekmiyor. Geçildiğinde asıl hareket yedek olarak yazılıyor — geri dönmek de tek dokunuş. Setlerin ağırlık ve tekrar değerleri temizleniyor: başka bir hareketin yükünü yeni harekete taşımak yanlış bir başlangıç değeri önermek olurdu.'
    },
    {
      title: 'Şablon Sürüm Geçmişi',
      desc: 'Şablonu düzenlemek geri alınamaz bir işlemdi: bir hareketi çıkarıp kaydettikten sonra eski hali hiçbir yerde durmuyordu. Üç aydır kullandığı programı "biraz deneyeyim" diye değiştiren biri, beğenmediğinde eski düzeni hatırlamak zorunda kalıyordu. Artık her kaydetmeden önce şablonun o anki hali geçmişe yazılıyor ve şablon önizlemesinden tek dokunuşla geri dönülebiliyor. Ne değiştiği de yazıyor — "3 gün önce" tek başına hangi sürüme döneceğini seçmeye yetmiyor. Geri dönmek de bir değişiklik sayılıyor: şu anki hal geçmişe yazılıyor, yani geri aldıktan sonra yeni haline de dönebilirsin. Setlerin ağırlıkları korunuyor; eski yapıya dönmek öğrenilmiş yükleri çöpe atmayı gerektirmiyor.'
    },
    {
      title: 'Şablonda Planlanan Teknik',
      desc: 'Drop set ve rest-pause seansın ortasında akla geliyordu, yani plan değil doğaçlamaydı. Artık şablonda hareket bazında planlanabiliyor ve seansta hatırlatma olarak çıkıyor. Seti otomatik işaretlemiyor: uygulanıp uygulanmadığına yorgunluğa bakarak sen karar veriyorsun. Isınma planlanabilir teknikler arasında yok — her hareketin başında zaten var ve planlanacak bir şey değil.'
    },
    {
      title: 'Şablona Özel Tekrar Aralığı',
      desc: 'Tekrar aralığı ya geneldi ya harekete özeldi; şablona bağlı değildi. Oysa aynı hareket kuvvet şablonunda 4-6, hipertrofi şablonunda 10-14 olmalı ve tek bir değer ikisini birden anlatamıyordu. Artık aralık şablonun içinde yaşıyor. Öncelik sırası net: şablona yazılmışsa o, yoksa hareketin kendi aralığı, o da yoksa genel ayar. Gün vurgusu varsa aralık ayrıca kaydırılıyor ve seansta hangi sayının nereden geldiği rozet olarak yazıyor.'
    },
    {
      title: 'Kas Sıklık Planlayıcı',
      desc: 'Sıklık analizi GEÇMİŞE bakıyordu: geçen haftalarda hangi kası kaç kez çalıştın. Doğru ama geç — hafta bittikten sonra öğreniyorsun. Yeni planlayıcı PLANA bakıyor: kurduğun haftalık program her kası kaç kez uyaracak. En değerli uyarı şu: hacmi koruma eşiğinin üstünde ama tek güne yığılmış kaslar. Hacim tablosu bunları sorun göstermiyor çünkü toplam yeterli — ama protein sentezi yanıtı yaklaşık iki günde sönüyor ve o kas haftanın kalanını uyaransız geçiriyor. Aynı hacmi ikiye bölmek, toplamı hiç artırmadan daha iyi sonuç veriyor. Arka arkaya gelen günlerde tekrarlanan kaslar da işaretleniyor; hafta sonu ile pazartesi de komşu sayılıyor.'
    },
    {
      title: 'Hareket Sırasını Tek Dokunuşla Düzelt',
      desc: '7.2 hareket sırasını denetliyor ama düzeltmeyi kullanıcıya bırakıyordu. Artık şablon düzenleyicide önerilen sıra tek dokunuşla uygulanıyor. Kural üç kademeli ve deterministik: bileşkeler önce, aynı kasın bileşkeleri serpiştirilerek (peş peşe gelen ikinci bileşke neredeyse her zaman düşük performansla yapılıyor), izolasyonlar içinde gerilmede yükleyenler önce. Süpersetli hareketler DOKUNULMADAN kalıyor: bağ komşuluk demek ve sıralamayı değiştirmek onu koparırdı; kullanıcı bir süperset kurmuşsa bu bilinçli bir karar.'
    },
    {
      title: 'Uyarı Çaldı mı Diye Bakıyor',
      desc: '7.1 askıya alınmış ses motorunu uyandırma sorununu çözmüştü ama "bazen geliyor bazen gelmiyor" devam ediyordu; sebebi başkaymış. Uyarı, sayaç BAŞLARKEN ses donanımının saatine yazılıyor — böylece JavaScript arka planda yavaşlasa bile doğru anda çalabiliyor. Yazma başarılı olunca uygulama "ses halloldu" varsayıp bitişteki yedek çalmayı atlıyordu. Ama ses motoru yazmadan SONRA askıya alınabiliyor: ekran kapanınca, uygulama arka plana atılınca, iOS bir kesinti yaşayınca. O durumda zamanlanan notalar hiç çalmıyor ve yedek de atlandığı için sonuç tam sessizlik oluyordu. Artık ölçüt "zamanlama başarılı mıydı" değil, "ses GERÇEKTEN çaldı mı": en az bir nota bittiğinde bayrak kalkıyor, kalkmadıysa uygulama uyarının kaçtığını anlayıp anında telafi çalıyor. Telafi bir pencereyle sınırlı — sayfa donmuş ve on dakika sonra döndüysen o dinlenme çoktan bitmiştir ve o anda yüksek sesle uyarı çalmak bilgi değil şaşkınlık üretir; geç kalınan durumda görsel uyarı ve bildirim yine çıkıyor, yalnızca ses susuyor.'
    },
    {
      title: 'Ekran Kapalıyken ve Müzik Çalarken',
      desc: 'Ekran kapanınca tarayıcı iki şeyi birden yapıyor: sayfayı donduruyor (JavaScript sayacı durduğu için bildirim çıkmıyor) ve ses motorunu askıya alıyor (zamanlanmış notalar çalmıyor). Artık dinlenme sayacı çalışırken duyulmayacak kadar düşük ama sıfır olmayan bir ses akışı sürüyor; bu, sayfayı tarayıcının gözünde "ses çalıyor" sınıfında tutuyor ve donmasını geciktiriyor. Frekans duyma eşiğinin altında seçildi, kazanç da ayrıca çok düşük — hiçbir hoparlörde duyulmuyor. Önemlisi bu bir "Şu An Çalınan" oturumu DEĞİL: müziğini durdurmuyor, üstüne biniyor. Ayarlardan kapatılabiliyor; kapalıyken pil biraz daha az harcanır ama uyarı yine kaçabilir.'
    },
    {
      title: 'İşletim Sistemine Zamanlanan Bildirim',
      desc: 'Bildirim şimdiye kadar sayaç bitince, yani uygulamanın kodu çalışabiliyorsa gösteriliyordu; sayfa donmuşsa bildirim de yoktu. Destekleyen tarayıcılarda bildirim artık sayaç BAŞLARKEN işletim sistemine yazılıyor ve uygulamanın durumundan bağımsız olarak zamanında çıkıyor. Sayaç erken durdurulursa zamanlanmış bildirim geri alınıyor. Desteklemeyen tarayıcıda hiçbir şey değişmiyor — ve test panelinde tarayıcının bunu destekleyip desteklemediği açıkça yazıyor, böylece uyarının neye dayandığı belirsiz kalmıyor.'
    },
    {
      title: 'Uyarı Tanılama Paneli',
      desc: 'Ses gelmediğinde sebebini tahmin etmek gerekiyordu. Ayarlardaki test artık dört şeyi ayrı ayrı gösteriyor: ses motoru hangi durumda, bildirim izni verilmiş mi, tarayıcı bildirimi önceden zamanlayabiliyor mu, ses motoru ayakta tutma açık mı. Zamanlanmış bildirim desteklenmiyorsa ne yapılması gerektiği de yazıyor.'
    },
    {
      title: 'Kas Başına Kişisel Hacim Hedefi',
      desc: 'MEV/MAV/MRV değerleri literatür ortalaması ve deneyim seviyesine göre ölçekleniyordu — doğru bir başlangıç ama kişisel değil. Aynı seviyedeki iki kişinin aynı kastaki toparlanma kapasitesi belirgin farklı olabiliyor ve kişi bunu birkaç blok sonra kendi verisinden öğreniyor; "benim omzum 22 sette iyi topluyor" bilgisinin uygulamada tutulacak yeri yoktu. Artık her kas için kendi değerlerini yazabiliyorsun ve bunlar uygulamanın HER YERİNDE geçerli: hacim tablosu, ısı haritası, koç uyarıları, program üreticisi, haftalık projeksiyon. Yalnızca değiştirdiğin kas kaydediliyor, gerisi literatürde kalıyor. Kişisel değere deneyim çarpanı uygulanmıyor — yazdığın sayı zaten senin kapasiten. Geçmişinden öneri de çıkıyor: iyi toparladığın en yüksek haftalık hacme göre. "İyi toparlama" dolaylı ölçülüyor (sonraki hafta o kasın gücü düşmemişse) ve bilinmeyen hafta iyimser sayılmıyor, çünkü öyle saymak toparlayamadığın bir hacmi hedef olarak önermek olurdu.'
    },
    {
      title: 'Antrenman Takvimi',
      desc: 'Tutarlılık kartı aynı veriyi sayıyla anlatıyordu: haftada kaç gün, kaç hafta üst üste. Doğru ama soyut. Artık gün gün bir ızgara var: nerede boşluk kaldığı, hangi ayın çöktüğü, aradan sonra toparlanmanın ne kadar sürdüğü tek bakışta görünüyor. Renk yoğunluğu ETKİLİ SET sayısını gösteriyor, seans sayısını değil — yirmi dakikalık tamamlama seansıyla iki saatlik bacak gününü aynı renkte göstermek ızgarayı "gittim/gitmedim" tablosuna indirir ve asıl bilgiyi siler. Bir güne dokununca o günün ayrıntısı çıkıyor; altında en uzun kesintisiz seri ve en uzun ara duruyor.'
    },
    {
      title: 'Hareket Sırası Denetimi',
      desc: 'Uygulama bir seansta hangi hareketlerin ve kaç setin olduğunu denetliyordu ama SIRAYI hiç sormuyordu. Oysa aynı liste farklı sırayla farklı sonuç veriyor: en çok yük kaldırılan hareket, o kas ön yorgunken yapılırsa daha az yükle çalışılıyor ve o hareketin asıl katkısı küçülüyor. Üç şeye bakılıyor — aynı kasın izolasyonu bileşkeden önce mi geliyor, iki ağır bileşke peş peşe mi, ve gerilmede yükleyen tek hareket seansın en yorgun anına mı bırakılmış. Hepsi uyarı, hiçbiri hata: sıralamanın tek doğrusu yok ve bilinçli ön yorgunluk gibi tercihler bu kalıplara benziyor. Modül ne yapıldığını söylüyor, ne yapılacağını değil.'
    },
    {
      title: 'Güvenilir Dinlenme Uyarısı',
      desc: 'Askıya alınmış ses motoru artık uyandırılmadan nota zamanlamıyor; resume işlemi gerçekten tamamlanana kadar bekleniyor. Uyarı, sayaç başlarken AudioContext saatine yazıldığı için JavaScript arka planda yavaşlasa bile doğru anda çalabiliyor. Mobil bildirim doğrudan Notification constructor yerine service worker üzerinden gösteriliyor. Aynı anda ses, titreşim, kalıcı bildirim ve isteğe bağlı tam ekran ışık uyarısı birlikte çalışıyor.'
    },
    {
      title: 'Kişisel Uyarı Merkezi',
      desc: 'Yükselen, dijital ve zil tınıları; bağımsız ses düzeyi; 5/10/15 saniyelik ön uyarı; ses motoru durumunu gösteren tanılama ve gerçek ayarlarla test düğmesi eklendi. Seans sırasında yalnız o seans için sessize alma ve uyarıyı tekrar çalma da dinlenme kartında.'
    },
    {
      title: 'Dinlenme Sayacı Kontrolleri',
      desc: 'Sayaç artık duraklatılıp kaldığı yerden sürdürülebiliyor. -15, +15 ve +30 saniye düğmeleri gerçek dinlenme başlangıcını bozmadan hedefi değiştiriyor. Önceden +30 düğmesi gerçek bekleme ölçümünü sıfırlıyordu; bu da dinlenme analizini olduğundan kısa gösteriyordu.'
    },
    {
      title: 'Hareket Özel Dinlenme ve Sıradaki Set',
      desc: 'Her hareket için otomatik öneriyi geçersiz kılan kalıcı bir dinlenme süresi seçilebiliyor. Dinlenme kartı sıradaki hareketi, set numarasını, kilo/tekrar/RIR hedefini gösteriyor. Setler tek dokunuşla tamamlandı veya geri alındı olarak işaretlenebiliyor; bu durum sıradaki set hesabının ve seans ilerlemesinin veri kaynağı.'
    },
    {
      title: 'Hareket Başına İlerleme Kuralı',
      desc: 'Uygulama tek bir sabit ilerleme algoritması uyguluyordu ve o algoritma her hareket için doğru değil: bench press ile yan kaldırış aynı kuralla ilerletilemez, birinde makul olan sıçrama diğerinde iki haftalık kazancı bir anda istemek demek. Artık her hareketin kendi kuralı var. ÇİFT İLERLEME (varsayılan) tekrarı aralığın üst ucuna kadar çıkarır, BÜTÜN setler üst uca ulaştığında ağırlığı artırır — ortalamaya bakmıyor, çünkü 12-8-8 ortalaması 9 çıkıp "aralıktasın" derken ilk set dışında hedef tutturulmamış oluyordu. DOĞRUSAL her başarılı seansta artırır. RIR TABANLI yedek tekrar hedefine göre ayarlar; bir tam tekrardan küçük sapmaları yok sayar çünkü RIR tahmini o hassasiyette değil. SABİT hiç öneri vermez, teknik ve rehabilitasyon çalışmaları için. Kural, hareketin profil ekranından seçiliyor.'
    },
    {
      title: 'Bugünkü Hedefler Kartı',
      desc: 'Hedefler tek tek hareket ekranında görünüyordu; seansa başlamadan önce "bugün ne yapacağım" sorusunun toplu cevabı yoktu ve salonda hareket hareket geçmişe bakmak gerekiyordu. Artık şablon önizlemesinde bütün hareketlerin hedefi bir arada: hangi ağırlık, kaç tekrar, geçen sefer ne yapılmıştı ve kaç harekette ağırlık artıyor. Her satır o hareketin kendi ilerleme kuralından çıkıyor.'
    },
    {
      title: 'Durgunluk Tespiti ve Çıkış Yolu',
      desc: 'Uygulama tek tek seansları değerlendiriyordu — bu seans geçen seferden iyi miydi, rekor kırıldı mı. Ama hipertrofide asıl karar daha yavaş bir ölçekte veriliyor: bir hareket haftalardır ilerlemiyorsa yapılacak şey daha çok denemek değil DEĞİŞTİRMEK. Artık her hareket taranıyor ve üç seanstır en iyisini geçemeyen ya da en iyisinin %5 altına düşen hareketler işaretleniyor. Ölçüt tahmini 1RM eğilimi: tonaj set sayısıyla oynayınca yanıltıyor, tekrar ağırlık değişince kıyaslanamıyor, ikisini tek sayıda birleştiren bu. Çıkış önerileri en ucuz müdahaleden başlıyor: bir hafta yükü geri çek, tekrar aralığını değiştir, varyanta geç. Hareketi tamamen bırakmak en sona bırakıldı çünkü yeni harekette teknik öğrenme süresi var ve o süre boyunca sayılar zaten düşük görünür.'
    },
    {
      title: 'Tekrar Bazlı Rekorlar',
      desc: 'Hareket başına TEK bir rekor tutuluyordu: en yüksek tahmini 1RM. Bu gerçekte yapılmış hiçbir seti göstermiyor, bir formülün çıktısı. "Beş tekrarda en iyim neydi" diye sorulduğunda cevap yoktu. Artık altı tekrar bandının (1-2, 3-5, 6-8, 9-12, 13-20, 21+) her birinin kendi rekoru var ve hepsi gerçekten yapılmış setler. En güçlü olduğun bant da işaretleniyor — kuvvet çalışanla hacim çalışanı ayırıyor. On beş toplam tekrarın üstünde 1RM tahmini gösterilmiyor: formül o bölgede güvenilir değil ve uydurma bir sayı üretmektense boş bırakmak doğru. Seans sırasında bant rekoru kırınca da kutlama çıkıyor; genel 1RM rekorundan çok daha sık geldiği için çok daha sık motive ediyor.'
    },
    {
      title: 'Gerçek Dinlenme Süresi',
      desc: 'Uygulama dinlenme süresi öneriyor ve kronometre çalıştırıyordu ama gerçekte ne kadar dinlenildiğini hiç kaydetmiyordu. Dolayısıyla en sık sorulan sorulardan birinin cevabı yoktu: "setler arası acele ettiğim için mi tekrar düşüyor, yoksa gerçekten yorgun muyum". Artık her set kendinden önceki bekleme süresini taşıyor. Rapor iki şey ölçüyor: gerçekte ne kadar dinlenildiği ve kısa dinlenmenin tekrar maliyeti. Maliyet yalnızca AYNI AĞIRLIKTAKİ ardışık setlerde hesaplanıyor — yük değişince tekrar farkı dinlenmeden değil ağırlıktan gelir ve karşılaştırma anlamsızlaşır. Koç yalnızca kayıp set başına bir tekrarı geçtiğinde konuşuyor; kısa dinlenmek tek başına bir kusur değil, metabolik çalışma bilerek de yapılabilir.'
    },
    {
      title: 'Antrenman Saati ve Performans',
      desc: 'Seansın ne zaman yapıldığı kaydediliyor ama hiç kullanılmıyordu. Oysa günün saati performansı ölçülebilir biçimde etkiliyor ve bu etki kişiye özel — genel bir "öğleden sonra çalış" tavsiyesi kimseye bir şey söylemez, kendi kaydından çıkan cevap söyler. Altı saat dilimi karşılaştırılıyor. Ölçüt seans ortalaması DEĞİL: sabah bench, akşam bacak yapan biri için o karşılaştırma anlamsız olurdu. Bunun yerine her hareket kendi ortalamasına göre normalleştiriliyor — "bu hareketi bu saatte yaptığında kendi ortalamandan yüzde kaç iyisin". Üç puandan küçük farklar gürültü sayılıp söylenmiyor.'
    },
    {
      title: 'Yoğunluk Teknikleri Rehberi ve Denetimi',
      desc: 'Drop set, rest-pause ve tükeniş set tipleri vardı ama yalnızca birer etiketti: rozet görünüyor, dinlenme kısalıyor, hepsi bu. Nasıl uygulanacağı, ne sıklıkta kullanılacağı ve hacme nasıl sayıldığı hiçbir yerde yazmıyordu. Artık her tekniğin ne zaman, nasıl ve hangi uyarıyla kullanılacağı yazılı — ve hacim sayımının gerekçesi de: bir drop set üç düşüşten oluşsa bile TEK uyaran, üç set saymak haftalık hacmi şişirip tavan hesabını bozardı. Ayrıca oran denetleniyor: çalışma setlerinin beşte birinden fazlası yoğunluk tekniğiyse koç uyarıyor, çünkü bu teknikler set başına uyaranı artırırken yorgunluk maliyetini çok daha hızlı artırıyor ve bir sonraki setin, bir sonraki seansın ve haftalık toplam hacmin altını oyuyorlar.'
    },
    {
      title: 'İki Yeni Üç Günlük Düzen',
      desc: 'Üç günde iki seçenek vardı: tam vücut ya da itiş+bacak / çekiş+bacak / tam vücut. İkisi de eklendi. İTİŞ+BACAK / ÇEKİŞ+BACAK / İTİŞ+ÇEKİŞ bacak hacmini ilk iki güne bölüp üçüncü günü tamamen üst vücuda ayırıyor; tam vücut varyantından farkı, üçüncü gün bacak görmediği için ilk iki günün bacak yorgunluğunun toparlanacak zaman bulması, buna karşılık üst vücudun haftada üç kez uyarılması. PUSH / PULL / LEGS 3 GÜN ise klasik üçlü bölme. Dürüst olmak gerekirse hipertrofi için üç günde yapılabilecek en iyi seçim değil — her kas haftada yalnızca bir kez uyarılıyor, aynı üç günde tam vücut ya da hibrit düzen iki üç kez uyarır — ama bölgeye tam odaklanmayı sevenler için artık var ve gerekçesi ekranda yazıyor.'
    },
    {
      title: 'Sihirbaz: Seansa Ayırabildiğin Süre',
      desc: 'Sihirbaz herkese aynı 30 setlik seans tavanını uyguluyordu. Oysa tavanı pratikte süre belirliyor: 45 dakikası olan biri için 30 set üretmek programı ilk haftadan uygulanamaz yapıyor, kullanıcı da ya seansı yarıda bırakıyor ya da dinlenmeleri kısıp bütün setleri bozuyor. Artık 45 / 60 / 75 / 90 dakika seçiliyor ve tavan buna göre (15 / 20 / 25 / 30 set) ayarlanıyor. Seçtiğin süre seçtiğin bölmeye sığmıyorsa üretici bunu saklamıyor: en yüklü günün kaç set olduğunu, neden kısamadığını (kısmak kasları koruma eşiğinin altına düşürüyor) ve aynı hacim için kaç gün gerektiğini söylüyor.'
    },
    {
      title: 'Sihirbaz: Antrenman Günlerini Kendin Seç',
      desc: 'Bölmeler hazır bir takvimle geliyordu — Pazartesi / Çarşamba / Cuma gibi — ve bu, hafta sonu çalışan biri için sabit bir yanlış varsayımdı. Artık hangi günler gelebileceğini seçiyorsun; bölmenin gün sırası korunuyor çünkü o sıra toparlanma açısından anlamlı. Seçtiğin günler arka arkaya gelip aynı kasları yüklüyorsa uyarı çıkıyor ve hangi kasların çakıştığı yazıyor. Uyarı ENGEL DEĞİL: bazen tek seçenek arka arkaya iki gündür ve o da hiç çalışmamaktan iyidir.'
    },
    {
      title: 'Sihirbaz: Hareket Sabitleme ve Yeniden Üretme',
      desc: 'Üretilen programı beğenmediğinde tek seçenek kurup elle düzeltmekti. Artık beğendiğin hareketleri kilitleyip gerisini yeniden ürettirebiliyorsun. Yeniden üretim rastgele değil: aday listesi bir kademe kaydırılıyor, yani aynı varyant numarası her zaman aynı programı veriyor ve ileri geri gezinebiliyorsun. Kilitli hareketler yalnızca korunmuyor, set kısma fazlarından da muaf tutuluyor — sabitlediğin hareket yakınsama sırasında sessizce küçültülmemeli.'
    },
    {
      title: 'Sihirbaz: Tek Hareketi Değiştirme',
      desc: 'Kontrol adımında herhangi bir hareketin yanındaki değiştir düğmesi, aynı kas katkı profiline en yakın alternatifleri getiriyor. Seçtiğin hareket otomatik olarak kilitleniyor, çünkü bilerek seçtiğin bir hareketi bir sonraki üretimde kaybetmek anlamsız olurdu.'
    },
    {
      title: 'Sihirbaz: Yapamadığın Hareketleri Dışla',
      desc: 'Ekipman profili kaba bir süzgeç: salonda barbell var ama omzun izin vermiyorsa bench press havuzda kalmaya devam ediyor ve üretilen programı her seferinde elle düzeltmek gerekiyordu. Artık dışlama listesi var ve dışlanan hareket aday havuzundan tamamen çıkıyor — "önerilmesin" değil, "hiç seçilmesin". Ağrı günlüğün sürüyor işaretli bölgeler içeriyorsa o bölgeleri yükleyen hareketler hazır aday olarak sunuluyor; dışlama kararı yine senin. Bir kasın bütün adayları çıkarsa üretici o kası atlıyor ve raporda hacmi eksik gösteriyor — sessizce yasaklı hareketi seçmektense eksiği söylemek doğru.'
    },
    {
      title: 'Sihirbaz: Kurmadan Önce Mevcut Programınla Karşılaştır',
      desc: 'Sihirbaz üretilen programın raporunu gösteriyordu ama tek başına. Oysa zaten bir programı olan biri için asıl soru "bu program iyi mi" değil, "buna geçersem ne değişir". Artık aktif planınla yan yana: gün sayısı, haftalık set ve kas kas hacim farkı. Koruma eşiğinin altına düşen ya da tavanı aşan kaslar ayrıca uyarı olarak, eşiğin altından kurtulanlar da ayrıca çıkıyor. İki taraf da aynı katkı modelinden geçiyor, yani gördüğün fark yöntem farkı değil program farkı.'
    },
    {
      title: 'Sihirbaz: Düzen Kartlarında Ölçülen Sayılar',
      desc: 'Düzen seçerken kartlar yalnızca açıklama gösteriyordu; hangi bölmenin kaç set ürettiğini görmek için sonuna kadar gitmek gerekiyordu. Artık seçili kartın altında haftalık set, en yüklü günün set sayısı ve koruma eşiğinin altında kalan kas sayısı anında görünüyor — bölmeler arasında gidip gelerek karşılaştırmak mümkün.'
    },
    {
      title: 'Şablonda Süperset Artık Bozulmuyor',
      desc: 'Gerçek bir hataydı: süperset bağı şablon düzenleyicide "bir sonrakiyle birlikte" bayrağı olarak tutuluyordu ama şablonun kendisi paylaşılan bir kimlik bekliyordu ve kaydetme adımı bu alanı tümden düşürüyordu. Sonuç olarak var olan bir şablonu düzenleyip kaydetmek bütün süpersetleri sessizce siliyor, düzenleme kipinde yeni süperset kurmak da hiç işe yaramıyordu. Artık dönüşüm iki yönlü çalışıyor: şablonu düzenlemeye açarken bağlar geri okunuyor, kaydederken gerçek kimliğe çevriliyor. Zincirleme bağlar (üç hareket arka arkaya) tek grup oluyor. Hareket taşındığında bağ koparılıyor — bağ komşuluk demek, hareket eski eşinden ayrıldığında bağın anlamı kalmıyor.'
    },
    {
      title: 'Hareket Birleştirme ve Geçmiş Aktarma',
      desc: 'Uygulamanın erken sürümlerinde kütüphanede olmayan bir hareketi elle eklediysen ve o hareket sonradan kütüphaneye girdiyse, ortada aynı işi anlatan iki ad kalıyordu: rekorlar ikiye bölünüyor, hacim eğrisi kopuk görünüyor, listede iki kopya duruyordu. Artık birleştirilebiliyorlar. Hangi adın kalacağını sen seçiyorsun ve birleştirme ONAYDAN ÖNCE ne olacağını gösteriyor: kaç seans, kaç set, hangi şablonlar, kaç kuvvet hedefi. Ad sekiz ayrı yerde geçiyor (geçmiş, devam eden seans, şablonlar, hareket tanımları, görünürlük listeleri, kuvvet hedefleri, tekrar aralıkları, ağrı günlüğü) ve hepsi birden güncelleniyor — biri atlanırsa birleştirdiğin hareketi bir yerlerde hâlâ ayrı görürsün, bu da hiç birleştirmemekten kötüdür. İşlem geri alınabilir. Aynı adın iki yazımı otomatik bulunuyor; adları gerçekten farklı olanları elle seçiyorsun, çünkü benzer adlar bazen gerçekten farklı hareketlerdir ve birleştirme geçmişi değiştirir.'
    },
    {
      title: 'Hareket Değiştirme Dört Yerde',
      desc: 'Beğenmediğin bir hareketi çıkarıp yenisini eklemek sırayı, set sayısını ve süperset bağını bozuyordu. Artık YERİNDE değiştiriliyor: hazır programı kurmadan önce ("Değiştirerek kur" ile programı taslak olarak açıp düzenleyebiliyorsun), şablon önizlemesinde tek dokunuşla, canlı seans sırasında ve şablon düzenleyicide. Her dört yerde de aynı kası çalıştıran alternatifler kas katkı profiline göre en üstte öneriliyor — kütüphanede iki yüzden fazla hareket var ve "aynı işi gören başka ne var" sorusunu elle aratmak, değiştirme özelliğini pratikte kullanılmaz yapıyordu. Şablonda değiştirirken setlerin ağırlık ve tekrar değerleri sıfırlanıyor: başka bir hareketin yükünü yeni harekete taşımak yanlış bir başlangıç değeri önermek olurdu.'
    },
    {
      title: 'En Üste ve En Alta Taşıma',
      desc: 'Hareket sıralaması yalnızca tek adım yukarı ve aşağı yapılabiliyordu; sekiz hareketlik bir günde son hareketi başa almak yedi dokunuş demekti. Artık iki ayrı düğme var. Uzun basış yerine ayrı düğme tercih edildi çünkü dokunmatikte uzun basış keşfedilmiyor.'
    },
    {
      title: 'Günler Arası Hareket Taşıma',
      desc: 'Program yazarken en sık yapılan düzeltme "bu hareket yanlış günde" oluyordu ve tek yolu silip öbür günde yeniden eklemekti; set sayısı da kayboluyordu. Artık hareket doğrudan başka güne taşınabiliyor ya da kopyalanabiliyor — kopyalama ayrı bir kip, çünkü aynı bileşke hareketi iki güne koymak meşru bir tercih. Hedef günde aynı hareket zaten varsa işlem yapılmıyor: aynı günde iki kez aynı hareket, hacim hesabında sessizce iki kat sayılırdı.'
    },
    {
      title: 'Program Yazarken Haftalık Hacim',
      desc: 'Şablon oluşturucu yalnızca AÇIK OLAN GÜNÜN hacmini gösteriyordu. Oysa MEV/MAV/MRV kararları haftalık: gün gün bakarak program yazan biri, her günü makul görünen ama haftalık toplamı koruma eşiğinin altında kalan bir program üretebiliyordu. Artık bütün günlerin toplamı anlık görünüyor; koruma eşiğinin altındaki ve tavanın üstündeki kaslar ayrıca yazılıyor. Gösterilen değer ÜST SINIR: şablonda henüz RIR yok, bütün setler etkili varsayılıyor.'
    },
    {
      title: 'Program Taslağında Hareket Seçimi Denetimi',
      desc: 'Aynı 16 set iki farklı hareket seçimiyle çok farklı sonuç verir: tek bir hareketten gelen 16 set ya da kasın hiç gerilmediği 16 set, hacim tablosunda kusursuz görünürken uyaranın bir kısmını harcar. Seçim denetimi şimdiye kadar yalnızca kurulmuş programa bakıyordu; artık taslak yazılırken de çalışıyor. Üç şeye bakıyor: hacmin tamamı tepe kasılma hareketlerinden mi geliyor, tek harekete mi bağımlı, yoksa kas hiçbir harekette hedef değil de yalnızca yan katkı olarak mı sayılıyor.'
    },
    {
      title: 'Ağrı Koruması',
      desc: 'Ağrı günlüğü 6.1 den beri var ama hareket listesiyle hiçbir bağlantısı yoktu: omzun iki haftadır ağrırken uygulama bench press satırını hiçbir şey olmamış gibi açıyordu. Artık sekiz vücut bölgesi hareket adlarıyla eşleşiyor ve yalnızca SÜRÜYOR ya da ŞİDDETLİ işaretlenmiş ağrılar sete girmeden hemen önce uyarı veriyor: hangi bölge, bu hareket o bölgeyi neden yüklüyor ve aynı kası çalıştırmaya devam eden daha az zorlayıcı seçenekler. Hareket ENGELLENMİYOR — karar senin, uygulamanın işi kararı görünür kılmak. Eşik bilerek yüksek tutuldu: her küçük sızıda uyarı çıkarsa uyarılar okunmaz olur.'
    },
    {
      title: 'Seansın Tahmini Bitiş Saati',
      desc: 'Salonda en sık sorulan pratik soru "kaç dakikam kaldı" idi ve cevabı yoktu; sonuçta son hareketler ya aceleye geliyor ya da seans planlanandan yarım saat uzuyordu. Artık girilen setlerin gerçek temposundan bir tahmin çıkıyor: kalan dakika ve saat olarak bitiş. Tahmin şablonun teorik süresinden değil O SEANSIN kendi temposundan üretiliyor; üçüncü setten önce konuşmuyor ve set başına süre makul aralığın dışına çıkarsa (uzun bir ara verilmişse) sessiz kalıyor — yanlış bir sayı, sayı olmamasından kötüdür.'
    },
    {
      title: 'Geçen Seferle Karşılaştırma',
      desc: 'Seans sonu raporu bugünü tek başına anlatıyordu; "geçen sefere göre iyi miydim" sorusu iki kaydı elle açıp göz kararıyla kıyaslamayı gerektiriyordu. Artık aynı şablonun bir önceki seansı otomatik bulunuyor ve HAREKET bazında karşılaştırılıyor: hangi hareket kaç kg tonaj kazandı, en ağır set ne kadar çıktı, hangisi geriledi, hangisi yeni. Karşılaştırma hareket bazında, çünkü toplam tonaj hareket değişince yanıltır — bir hareketi bırakıp diğerini eklemek tonajda düşüş gibi görünür ama gerileme değildir.'
    },
    {
      title: 'Kardiyo Seans Şablonları',
      desc: '8 × 100 m serbest gibi bir set defterini her seferinde elle kurmak, defteri hiç kullanmamanın en kısa yoluydu. Artık defterli her kayıt tek dokunuşla şablona dönüşüyor ve bir sonraki seansta hazır yükleniyor. Şablon yalnızca PLAN alanlarını taşıyor — mesafe, stil, set tipi, dinlenme; ölçümleri (gerçek süre, kulaç sayısı) taşımıyor, çünkü onlar o seansa ait. En çok kullanılan şablon listenin başında duruyor.'
    },
    {
      title: 'Haftalık Gözden Geçirmede Kardiyo',
      desc: 'Hafta değerlendirilirken kardiyo hiç görünmüyordu; oysa bacak toparlanmasından en çok çalan iş o. Artık özet kartında seans sayısı, toplam dakika, mesafe ve düşük/orta/yüksek şiddet dağılımı var. Gelecek hafta önerilerine de giriyor ama yalnızca 30 dakikayı aşan bir değişim ya da üçten fazla yüksek şiddet seansı varsa — her hafta "kardiyo yaptın" demek bilgi değil gürültü.'
    },
    {
      title: 'Kardiyo CSV Dışa Aktarma',
      desc: 'CSV dışa aktarımda setler, ölçümler ve beslenme vardı; kardiyo yoktu. Set defteri seansın yapısını tutuyor ama tabloya hiç düşmüyordu. Artık her SET ayrı satır: tarih, aktivite, tempo, set no, tekrar, mesafe, stil, set tipi, süre, dinlenme, tempo ve SWOLF. Defteri olmayan kayıtlar tek satır olarak yine çıkıyor, böylece eski geçmiş de dışarı alınabiliyor.'
    },
    {
      title: 'Koç Çakışma Kuralı',
      desc: 'Koç aynı anda hem "şu hareketten rekor denemesi yap" hem de "o bölgende ağrı var" diyebiliyordu; çelişkili iki öneri arasında kalan kullanıcı ikisini de dinlemiyor. Ağrı koruması artık rekor takibini, hacim uyarısını ve rotasyon önerisini bastırıyor. Sağlık uyarısı ile performans önerisi çarpıştığında kazanan her zaman sağlık uyarısıdır.'
    },
    {
      title: 'Yüzme Set Defteri',
      desc: 'Kardiyo kaydı tek satırdı: aktivite, süre, tempo. Yürüyüş için yeterli ama "45 dakika yüzme" cümlesi 8 x 100 m serbest ile 1500 m düz yüzmeyi aynı kefeye koyuyor. Artık set defteri var: her satırda tekrar, mesafe, stil ve süre. Sekiz stil seçilebiliyor — serbest, sırtüstü, kurbağalama, kelebek, karışık, teknik, ayak, kol — ve her birinin kendi MET çarpanı var; kelebek ağırlıklı bir seans aynı süredeki teknik çalışmasından belirgin daha pahalı. Satır başına tekrar tutuluyor: sekiz ayrı satır açmak hem yazmayı hem okumayı zorlaştırıyordu. Defter doldurulduğunda süre ve mesafe ORADAN çıkıyor, elle yazılmıyor — iki sayının sessizce ayrışmasına açık kapı bırakmamak için.'
    },
    {
      title: 'SWOLF ve Stil Dağılımı',
      desc: 'Kulaç sayısı girilirse SWOLF hesaplanıyor: bir havuz uzunluğunun süresi ile o uzunlukta atılan kulaç sayısının toplamı. Yüzmede verimliliğin standart ölçüsü — aynı tempoyu daha az kulaçla tutmak teknik gelişimi gösteriyor. Havuz uzunluğu (25 / 50 m) seçilebiliyor çünkü SWOLF bir uzunluk için tanımlı; ilk yazımda set mesafesi üzerinden hesaplanıyordu ve 100 m lik bir sette 133 gibi anlamsız bir sayı üretiyordu. Seans özetinde stil dağılımı da çıkıyor: hangi stilde kaç metre ve toplamın yüzde kaçı.'
    },
    {
      title: 'İnterval ve Kürek Set Defteri',
      desc: 'Aynı defter koşu intervalinde, kürekte ve bisiklette de açılıyor. Yüzmede "stil" ne ise burada "tip" o: ana set, ısınma, soğuma, toparlanma. Ayrım tempoyu doğru hesaplamak için şart — ısınma ve soğuma ortalamaya katılırsa her seansta tempo olduğundan yavaş görünüyor ve gelişim takibi bozuluyor.'
    },
    {
      title: 'Elle Maksimum Nabız',
      desc: 'Bölge sınırları Tanaka formülünden hesaplanıyordu ve o bir POPÜLASYON ortalaması; kişiler arası sapma 10-12 atım. Saha testiyle kendi maksimumunu bilen biri için tahmini dayatmak bütün bölgeleri sistematik olarak kaydırıyordu. Artık elle girilebiliyor ve girilen değer her zaman kazanıyor; hangi kaynağın kullanıldığı ekranda yazıyor. 120-230 dışındaki değerler kabul edilmiyor — 400 gibi bir yazım hatası bütün bölgeleri anlamsız yapardı. Ölçme yöntemi de anlatılıyor: iyi ısındıktan sonra 3-5 dakika tam çabayla çıkış ve o sırada görülen tepe nabız.'
    },
    {
      title: 'Sabah Dinlenme Nabzı Takibi',
      desc: 'Dinlenme nabzı tek bir ayar değeriydi ve yalnızca Karvonen hesabında kullanılıyordu. Asıl değeri zaman içindeki değişiminde: sabah nabzının kendi tabanının üstüne çıkması, toparlanma borcunun en erken göstergelerinden biri. Uygulamanın diğer toparlanma sinyalleri (uyku, hazır oluşluk, ACWR) hep bildirilen ya da türetilen verilerdi; bu ÖLÇÜLEN bir sayı. Taban 28 günün ortalaması ve son ölçümü dışarıda bırakıyor — bugünün değerini kendi ortalamasının içine katmak sapmayı küçültürdü. Tek bir yüksek gün yorumlanmıyor; koç ancak üst üste üç gün yüksekse konuşuyor.'
    },
    {
      title: 'Kardiyo Rekorları',
      desc: 'Ağırlık tarafında rekorlar hem izleniyor hem kutlanıyordu; kardiyoda hiçbir karşılığı yoktu. Artık mesafe başına en iyi süreler tutuluyor: yüzmede 50-1500 m, koşuda 400 m-10 km, kürekte 500-5000 m, bisiklette 5-40 km. İki kaynaktan okunuyor — set defteri satırları ve tek satırlık kayıtlar. Rekor yalnızca TAM eşleşen mesafede sayılıyor; 1200 m lik bir yüzmeden 1000 m rekoru türetmek tempoyu sabit varsaymak olurdu ve o varsayım çoğu zaman yanlış.'
    },
    {
      title: 'Stil Bazlı Tempo Eğilimi',
      desc: 'Tempo karşılaştırması yalnızca aynı stil ve aynı set tipi içinde yapılıyor. Kelebek temposunu serbest temposuyla kıyaslamak gerileme gibi görünürdü; ısınma setini ana setle kıyaslamak da öyle.'
    },
    {
      title: 'Kuvvet Standartları',
      desc: 'Uygulama kuvveti hep kendi geçmişine göre ölçüyordu: 1RM eğilimi, rekorlar, kuvvet dengesi. Doğru ama eksik bir çerçeve — "bench 100 kg" cümlesinin ne anlama geldiğini söylemiyor. 60 kiloluk biri için olağanüstü olan sayı, 110 kiloluk biri için başlangıç. Artık altı ana harekette vücut ağırlığının katı olarak nerede durduğun gösteriliyor: yeni başlayan, acemi, orta, ileri, elit. Kadın ve erkek için ayrı tablolar var; tek tablo kullanmak kadınlarda her hareketi olduğundan kötü gösteriyordu. Sonuç bir not değil bir konum — hangi bandın içindesin ve bir sonrakine kaç kilo kaldı.'
    },
    {
      title: 'Şiddet (RIR) Dağılımı',
      desc: 'Etkili set sayımı RIR 3 ve altını hacme katıyor, üstünü katmıyordu. Bu ikili ayrım hacim için yeterli ama antrenmanın karakterini göstermiyor: iki kişi de haftada 16 etkili set yapıyor olabilir, biri hepsini RIR 3\'te diğeri hepsini RIR 0\'da. Bunlar aynı program değil. Artık setler dört kovaya ayrılıyor ve iki uç da uyarı üretiyor — hep başarısızlığa gitmek toparlanmayı, hep RIR 4+ kalmak uyaranı bozuyor. RIR girilmemiş setler dağılıma katılmıyor: boş bir alanı bir kovaya koymak olmayan veriden sonuç üretmek olurdu.'
    },
    {
      title: 'Hareket Rotasyonu',
      desc: 'Duraklama hareket bazında zaten yakalanıyordu ama bir soru yanıtsızdı: bu hareketi ne kadar süredir yapıyorsun? İkisi aynı şey değil. Sekiz haftadır yapılan ve duraklamış bir hareket yorgunluk ya da beslenme sorunu olabilir; kırk haftadır yapılan ve duraklamış bir hareket muhtemelen verebileceği uyaranın sonuna gelmiştir. Öneri yalnızca iki koşul birlikte sağlanınca çıkıyor — hareket 16 haftadan eski VE ilerleme durmuş. Hareket değiştirmenin bedeli var (teknik oturana kadar birkaç seans, yük karşılaştırılabilirliğinin bozulması), o yüzden tek başına eskilik yeterli değil.'
    },
    {
      title: 'Vücut Oranları',
      desc: 'Her çevre ölçüsü tek tek izleniyordu: kol 38\'den 39\'a çıktı, bel 84\'te sabit. Estetik algı ise mutlak santimlerden değil oranlardan geliyor. Beş oran eklendi ve iki türü ayrı tutuluyor: estetik oranlar (omuz/bel, göğüs/bel, uyluk/bel) hedeflenebiliyor, çerçeve oranları (kol/bilek) ise hedef değil bağlam — bilek çevresi iskelet yapısının değişmeyen göstergesi olduğu için kolun kendi çerçevesine göre nerede olduğunu söylüyor. Eksik ölçüsü olan oran hiç hesaplanmıyor.'
    },
    {
      title: 'Seans Isınma Rutini',
      desc: 'Isınma vardı ama yalnızca tek hareket için: plaka hesaplayıcı çalışma ağırlığına göre piramit üretiyordu. Seansın kendisinin hazırlığı yoktu. Artık antrenman ekranında o seansın kaslarından türetilen bir rutin var — nabız, hareketlilik, aktivasyon. Bacak günüyle itiş gününün hazırlığı aynı değil. Statik esneme bilerek yok: ağır set öncesi uzun statik esneme kuvvet çıktısını geçici olarak düşürüyor. Toplam süre kısa tutuldu; on dakikayı geçen bir ısınma çoğu kişide yapılmıyor ve yapılmayan rutinin faydası sıfır.'
    },
    {
      title: 'Deload Sonrası Dönüş Planı',
      desc: 'Deload süre dolunca kendiliğinden kapanıyor ve o anda hiçbir şey söylenmiyordu. Kullanıcı iki hatadan birini yapıyordu: bir anda eski hacme dönmek (deloadun kazandırdığı tazelik ilk seansta harcanıyor) ya da boşaltmayı uzatmak (boşaltma fiilen bir hacim düşüşüne dönüşüyor). Artık iki haftalık kademeli plan gösteriliyor: ilk hafta yükü koruyup hacmi %80\'e çıkar, ikinci hafta tam hacme dön. Yük ilk haftada artırılmıyor — aynı ağırlığın ne kadar kolay geldiği, artışın ne olacağını da söylüyor. Plan yalnızca deload SÜRESİ DOLDUYSA çıkıyor; elle kapatıldıysa boşaltma yarıda kesilmiştir ve kademeli dönüş önermek yanlış olurdu.'
    },
    {
      title: 'Antrenman Çevresi Beslenme',
      desc: 'Günlük toplamlar izleniyordu ve bu hipertrofi için doğru öncelik — toplamlar zamanlamadan çok daha belirleyici. Ama toplam doğruyken bile bir boşluk kalıyordu: antrenmana aç girmek ya da günün proteininin tamamını akşam yemek, aynı toplamla daha kötü bir seans üretiyor. Koç artık seansın iki yanına bakıyor: planlı antrenman öncesi karbonhidrat düşükse, seans sonrası protein büyük ölçüde eksikse ya da protein az sayıda öğüne yığılmışsa uyarıyor. Bilerek mütevazı — "anabolik pencere" gibi dar zaman iddiaları literatürde büyük ölçüde geri çekildi.'
    },
    {
      title: 'Kardiyo & Aktivite Sekmesi',
      desc: 'Kardiyo, analiz ekranındaki bir kartın içinde sıkışıyordu; ağırlık antrenmanının kendi ekranı varken kardiyonun olmaması, uygulamanın ona bir ek özellik gibi davrandığı anlamına geliyordu. Antrenman sekmesi ikiye ayrıldı: Ağırlık ve Kardiyo & Aktivite. Yeni sekmenin kendi üç bölümü var — Koç (hedef, şiddet dağılımı, bugün ne yapmalı), Hedefler (aktivite başına seans planı) ve Kayıtlar (tempo eğilimi, bölge, geçmiş).'
    },
    {
      title: 'Aktivite Seans Hedefleri',
      desc: 'Haftalık hedef "ne kadar" sorusunu yanıtlıyor ama seansın içini boş bırakıyordu: havuza giderken akılda "8 x 100 m, aralarda 30 saniye" gibi somut bir plan oluyor ve unutuluyor. Artık aktivite başına set sayısı, set mesafesi, toplam mesafe, süre ve dinlenme hedefi girilebiliyor. Hepsi isteğe bağlı — yüzmede set ve mesafe anlamlı, bisiklette yalnızca süre anlamlı olabilir; boş bırakılan alan hedef sayılmıyor. Set ve mesafe birlikte verilirse özet "8 x 100 m" olarak birleştiriliyor.'
    },
    {
      title: 'Karvonen (%HRR) Yöntemi',
      desc: 'Bölge sınırları tek yöntemle hesaplanıyordu: maksimum nabzın yüzdesi. Bu yöntem dinlenme nabzını yok sayıyor ve iyi antrenmanlı birinde zone 2 gereğinden düşük çıkıyor. Artık yöntem seçilebiliyor. Fark küçük değil: 30 yaşında, dinlenme nabzı 55 olan biri için zone 2 üst sınırı maks yöntemiyle 131, Karvonen ile 147. Karvonen seçili ama dinlenme nabzı girilmemişse sessizce maks yöntemine düşülüyor — eksik veriyle yanlış bir sayı üretmektense bilinen yöntemi kullanmak doğru — ve hangi yöntemin kullanıldığı arayüzde yazıyor.'
    },
    {
      title: 'Hedefsiz Veri Girişi ve Nabızdan Kalori',
      desc: 'Kardiyo kaydı, hedef koymayı gerektirmiyor: bölge, tempo ve kalori her koşulda hesaplanıyor. Ortalama nabız girilirse kalori artık MET tablosundan değil nabızdan hesaplanıyor (Keytel denklemi) — MET tabanlı hesap aynı "45 dakika bisiklet" için herkese aynı sayıyı veriyor, oysa nabız kişinin o seansta gerçekten ne kadar zorlandığının doğrudan ölçüsü. Düşük nabızlarda formül güvenilirliğini kaybettiği için orada MET hesabına dönülüyor ve hangi yöntemin kullanıldığı gösteriliyor.'
    },
    {
      title: 'Ağırlık Alanı Artık Kendini Anlatıyor',
      desc: 'Vücut ağırlıklı hareketlerde alanın anlamı bir ayardı ama sonucu hiçbir yerde görünmüyordu: kullanıcı barfikste 10 yazıyor, tonaj 92 kg üzerinden hesaplanıyor ve bu dönüşüm yazmıyordu. Sayının nereden geldiği görünmeyince ayarın doğru olup olmadığı da anlaşılmıyordu. Artık hareketin üstünde tabanın kendisi, nereden geldiği ve canlı toplam yazıyor: "Taban 82 kg (vücut ağırlığı, 82 kg seans kaydından) — alana yalnızca EK yükü yaz. Şu an: 82 + 10 = 92 kg." Ayarlar ekranında da seçilen moda göre somut bir örnek gösteriliyor.'
    },
    {
      title: 'Geçmiş Artık Ölçüm Düzenlemesinden Etkilenmiyor',
      desc: 'Vücut ağırlıklı hareketlerin yükü, o tarihe kadarki en son ölçümden hesaplanıyordu. Bu, geçmişi kırılgan yapıyordu: bir ölçümü silmek ya da düzeltmek yıllar önceki barfiks tonajını sessizce değiştiriyordu. Artık önce antrenmanın KENDİ kaydındaki kilo (seans kaydedilirken dondurulan değer) kullanılıyor, o yoksa en yakın ölçüme düşülüyor. Yani "o antrenmanda kaç kilodaysan" o baz alınıyor ve sonradan yapılan düzenlemeler geçmişi bozmuyor.'
    },
    {
      title: 'Tempo ve Bölge Kayıt Listesinde',
      desc: 'Kardiyo kayıtları artık bölge etiketi, tempo ve nabızla birlikte listeleniyor. Mesafeli aktivitelerde tempo eğilimi de çıkıyor — hızlanıyor, sabit ya da yavaşlıyor.'
    },
    {
      title: 'Müzik Üstünde Duyulan Dinlenme Uyarısı',
      desc: 'Eski uyarı 880 Hz seviyesinde iki kısa bipti ve müzik çalarken pratikte kayboluyordu — tek frekanslı kısa bir sinüs, müziğin spektrumunun içinde eriyor. Üç şey değişti. Tını: tek sinüs yerine yükselen üç notalı bir dizi ve her notada bir üst harmonik; geniş spektrumlu ve yükselen bir ses çok daha zor gözden kaçıyor. Tekrar: dizi bir kez değil, seçilen şiddete göre iki ya da dört kez çalıyor. Ses: kazanç belirgin yükseltildi ve kırpılmayı önlemek için kompresör eklendi. Titreşim deseni de uzadı — tek kısa titreşim telefon cepteyken hissedilmiyordu. Ayarlardan Hafif / Belirgin / Israrcı seçiliyor ve dokununca örnek çalıyor. Sistem bildirimi de artık ekranda kalıcı.'
    },
    {
      title: 'Nabız Bölgeleri',
      desc: 'Kardiyo iki eksende tutuluyordu: aktivite ve tempo. İkisi kalori için yeterli ama ne YAPILDIĞINI söylemiyor — "45 dakika koşu", zone 2 dayanıklılık koşusuyla interval seansını aynı kefeye koyuyor. Artık her kayıt bir bölgeye oturuyor: Z1 toparlanma, Z2 aerobik taban, Z3 tempo, Z4 eşik, Z5 maksimal. Yaş girilmişse maksimum nabız Tanaka formülüyle (208 − 0.7 × yaş) hesaplanıp bölge sınırları atım cinsinden gösteriliyor. Nabız girmezsen bölge aktivite ve tempodan tahmin ediliyor; girersen tahmin yerine ölçüm kullanılıyor.'
    },
    {
      title: 'Kardiyo Hedefleri',
      desc: 'Beş önayar: Hedef yok, Sağlık (150 dk + 1 seans), Hipertrofiyi Koru (90 dk + 1), Yağ Kaybı (180 dk + 2), Dayanıklılık (240 dk + 2). Hedef iki sayıdan oluşuyor — haftalık düşük şiddet dakikası ve yüksek şiddet seans sayısı — çünkü kardiyoda toplam süre tek başına yanıltıcı. Hipertrofi önayarının bilerek düşük tutulduğunu belirtmek gerek: kas kazanımı öncelikliyken kardiyo toparlanmadan çalıyor ve "daha çok kardiyo daha iyi" varsayımı orada geçerli değil.'
    },
    {
      title: 'Kardiyo Koçu',
      desc: 'Hedefe göre nerede olduğun, hacmin bölgelere nasıl dağıldığı ve bugün ne yapman gerektiği tek kartta. Günün önerisi bacak gününü ve hazır oluşluğu hesaba katıyor: bacak günündeysen yüksek şiddet önerilmiyor, düşük şiddet öneriliyor çünkü zone 2 bacak toparlanmasına dokunmuyor. Koç kartında da bir satır olarak çıkıyor.'
    },
    {
      title: 'Orta Yoğunluk Tuzağı Denetimi',
      desc: 'Kardiyonun yarısından fazlası zone 3 bandında geçiyorsa uyarı çıkıyor. Bu bölge taban geliştirmek için fazla yorucu, üst uç geliştirmek için fazla hafif — en yaygın kardiyo hatası. Ayrıca düşük şiddet payı yüzde yetmişin altına düşerse polarize dağılım hatırlatılıyor: hacmin çoğunu zone 2 bandına indirip küçük bir kısmını zone 4-5 bandına çıkarmak, aynı süreyle daha çok kazandırıyor.'
    },
    {
      title: 'Kardiyo Yerleşimi',
      desc: 'Yüksek şiddet kardiyo bacak günüyle aynı güne denk geldiğinde uyarı çıkıyor. Aynı gün zorunluysa sıra söyleniyor: ağırlık önce, kardiyo sonra — ters sırada çömeliş performansı ölçülebilir biçimde düşüyor. Koç çelişki motoruna da bağlandı: dağılım bozukken "bugün kardiyo ekle" demek kendi kendiyle çelişirdi, o yüzden susturuluyor.'
    },
    {
      title: 'Mesafe ve Tempo',
      desc: 'Koşu, yüzme, bisiklet ve kürekte mesafe girilebiliyor; süreyle birlikte tempo çıkıyor (yüzmede 100 m, diğerlerinde km başına). Tempo eğilimi yalnızca AYNI aktivite ve AYNI şiddet sınıfı içinde karşılaştırılıyor — zone 2 koşusunun temposunu interval seansıyla kıyaslamak "gerileme" gibi görünüyordu, oysa iki farklı iş. Mesafe alanı yalnızca ölçmenin anlamlı olduğu aktivitelerde çıkıyor; HIIT için "kaç km" sormak anlamsız bir sayı üretirdi.'
    },
    {
      title: 'Müzik Çakışması Düzeltildi',
      desc: 'Antrenman sırasında müzik dinlerken uygulamayı açınca müzik susuyordu; müziği başlatınca da kilit ekranındaki antrenman kartı kayboluyordu. Sebep şu: kart, duyulmaz bir ses döngüsü çalarak var oluyor ve bir cihazda aynı anda yalnızca TEK bir "Şu An Çalınan" oturumu olabiliyor. İkisini birden çalıştırmak mümkün değil — bu tekniğin sınırı, düzeltilebilecek bir hata değil. Düzeltilen şey davranış: uygulama artık müziğe DİRENMİYOR. Müzik odağı aldığında kart sessizce kapanıyor, kendiliğinden geri gelip müziği tekrar kesmeye çalışmıyor ve ne olduğu bir bildirimle açıklanıyor. Kartı hiç istemiyorsan Ayarlar → Müzik Önceliği ile tamamen kapatabilirsin; o zaman müziğin hiçbir noktada kesilmez.'
    },
    {
      title: 'Koç: Erteleme ve Kapatma',
      desc: 'Aynı madde, okuyup bilinçli olarak görmezden gelmiş olsan bile her gün aynı yerde duruyordu — ve hep aynı şeyi söyleyen bir uyarı, bir süre sonra hiçbir şey söylemeyen bir uyarıya dönüşüyor. Artık her maddenin altında Ertele (bir hafta) ve Bir daha gösterme var. Gizlenen madde sayısı kartta görünür kalıyor ve tek dokunuşla hepsi geri açılabiliyor.'
    },
    {
      title: 'Koç: Çelişki Çözümü',
      desc: 'Maddeler birbirinden habersiz üretiliyordu ve aynı anda zıt şeyler söyleyebiliyorlardı: "deload zamanı geldi" ile "bu kaslara set ekle" yan yana durunca hangisinin yapılacağı belirsiz kalıyor, koçun tamamına olan güven düşüyordu. Artık üst öncelikli bir kararla çelişen maddeler susturuluyor — deload haftasında hacim ve rekor tavsiyeleri, eklem ağrısı varken rekor denemesi, plan uyumu düşükken program büyütme. Susturma sessiz değil: kaç maddenin neden susturulduğu kartta yazıyor.'
    },
    {
      title: 'Hafta Sonu Projeksiyonu',
      desc: 'Koç haftanın ortasında "şu kaslar koruma eşiğinin altında" diyordu ve bu çoğu zaman yanlış alarmdı: çarşamba günü bacak hacminin düşük olması normal, çünkü bacak günü cuma. Uyarı kalan planlı günleri hesaba katmıyordu. Artık doğru soru soruluyor: hafta bu planla biterse nerede kapanır? Üç sonuç var ve üçü farklı şey söylüyor — kalan günler eşiği kapatıyorsa koç susuyor, kapatmıyorsa kaç set eksik kaldığı yazıyor, planlı günler bittiyse bunun artık bir karar olduğu söyleniyor.'
    },
    {
      title: 'Rekor Eşiği',
      desc: 'Rekor ancak kırıldıktan sonra kutlanıyordu; oysa asıl işe yaradığı an öncesi. Bugün çalışacağın hareketlerden biri rekoruna yakınsa koç somut hedef veriyor: "122.5 kg ile 5 tekrar yaparsan geçersin, 125 kg ile 4 tekrar da yeter." Hedef tahmini 1RM üzerinden hesaplanıyor ama sana ağırlık ve tekrar olarak söyleniyor — "1RM\'ini 2 kg artır" salonda uygulanabilir bir cümle değil. Vücut ağırlıklı hareketlerde taşınan yük de hesaba katılıyor.'
    },
    {
      title: 'RIR Kalibrasyonu',
      desc: 'Uygulamanın en çok güvendiği alan RIR: etkili set sayımı, tahmini 1RM ve seans içi yük ayarı hep buna dayanıyor. Ama RIR ölçülen değil BİLDİRİLEN bir sayı ve yedek tekrarları fazla tahmin etmek çok yaygın. Doğrudan ölçmek mümkün değil — kimse her seti başarısızlığa taşımıyor — ama dolaylı bir kanıt var: aynı ağırlıkta ardışık setler. "RIR 3" deyip ikinci sette tekrarlar çöküyorsa yedek yoktu. Analiz ekranında bu eğilim, hangi hareketlerde daha bozuk olduğuyla birlikte gösteriliyor.'
    },
    {
      title: 'Hareket Sırası Denetimi',
      desc: 'En çok yük kaldıran bileşke hareket seansın sonuna kalırsa hem risk artıyor hem uyaran düşüyor: yorgunken kaldırılan 100 kg, dinçken kaldırılan 100 kg ile aynı şey değil. Son seansta bir bileşke birden fazla izolasyondan sonra yapıldıysa uyarı çıkıyor. Ölçüt hareketin adı değil, kaç kası birden yüklediği — uygulamanın kendi kas eşleme tablosundan geliyor.'
    },
    {
      title: 'Süre Verimliliği',
      desc: 'Aynı 20 set 50 dakikada da 110 dakikada da yapılabilir ve ikisi farklı seanslardır. Set başına dakika bunu tek sayıyla gösteriyor: çok yüksekse dinlenmeler dağılmış, çok düşükse dinlenme yetersiz kalıp sonraki setlerin tekrarları düşüyor demek. Hacim aynı görünürken uyaranın değiştiği yer burası.'
    },
    {
      title: 'Ağrı Takibi',
      desc: 'Hazır oluşluk formu seans başına tek bir eklem ağrısı puanı alıyordu ve o puan seansın hesabına girip kayboluyordu. Araçlar → Ağrı Takibi bölgeyi ve zamanı tutuyor: omuz, dirsek, bilek, bel, kalça, diz, ayak bileği, boyun. Üç kayıttan sonra bölge bazında trend (azalıyor / sabit / artıyor) ve ağrılı günlerde en sık yapılan hareketler görünüyor. Hareket listesi bir NEDEN iddiası değil, sadece birlikte görülme sayısı — hangi hareketi elemeyi deneyeceğinin başlangıç noktası.'
    },
    {
      title: 'Kuvvet Dengesi',
      desc: 'Hacim kas kas denetleniyordu, hareket seçimi profil olarak denetleniyordu; kuvvetin kaslar arasındaki DAĞILIMI denetlenmiyordu. Analiz ekranına dört oran geldi: yatay itiş/çekiş, çömeliş/kalça menteşesi, quadriceps/hamstring, dikey itiş/çekiş. Benchi 120\'ye çıkarken row\'u 70\'te kalan biri hacim tablosunda iki tarafı da yeşil görür ama omuz çevresindeki denge bozulmuştur. Oranlar tek bir doğru sayı değil bir BANT olarak veriliyor ve yalnızca bandın dışına çıkıldığında konuşuluyor; kol/bacak uzunluğu oranı kişiden kişiye kaydırıyor.'
    },
    {
      title: 'Tutarlılık ve Plan Uyumu',
      desc: 'En belirleyici değişken ölçülmüyordu: programa gerçekten uyulup uyulmadığı. Analiz ekranında 12 haftalık gün ızgarası, hafta bazında seri ve son dört haftanın plan uyumu var. İki soru ayrı tutuluyor çünkü biri iyiyken diğeri kötü olabiliyor: haftada altı gün planlayıp üç yapan biriyle üç planlayıp üçünü de yapan biri aynı seriyi görür ama aynı durumda değildir. Uyum gün gün eşleşmeye değil hafta içindeki sayıya bakıyor — pazartesi planlanan seansı salı yapmak program kaydırmaktır, uygulamamak değil.'
    },
    {
      title: 'Veri Sağlığı Denetimi',
      desc: 'Uygulamanın bütün hesapları (1RM, hacim, ACWR, adaptif TDEE, kuvvet dengesi) geçmiş kayıtlardan çıkıyor ve tek bir yanlış giriş — 100 yerine 1000 kg — hepsini birden sessizce bozuyor. Araçlar → Veri Sağlığı aykırı ağırlık ve tekrarları, yarım kalmış setleri (ağırlık var tekrar yok), boş antrenmanları ve aynı gün aynı adla kopyalanmış kayıtları buluyor. Yalnızca boş kayıtlar tek dokunuşla siliniyor; 600 kg\'lık bir set yanlış olabilir ama doğru da olabilir ve kullanıcının verisini tahminle değiştirmek bozuk veriden daha kötü.'
    },
    {
      title: 'Hareket Bazlı Tekrar Aralığı',
      desc: 'Tekrar aralığı tek bir genel ayardı ve bütün hareketlere aynı uygulanıyordu; seans içi yük ayarı lateral raise\'de "8 tekrar yaptın, ağırlığı artır" diyordu, oysa o hareket 15 tekrarda daha iyi çalışıyor. Artık üç katman var: hareket için yazdığın aralık, o yoksa kas grubunun varsayılanı (yan omuz 12-20, çömeliş 6-12, baldır 10-20), o da yoksa genel ayar. Kas grubu varsayılanları olmasaydı özelliğin faydası 250 hareketi tek tek ayarlamana bağlı kalırdı. Hareket profilinden değiştirilebiliyor.'
    },
    {
      title: 'Şablonda Süperset',
      desc: 'Süperset yalnızca canlı antrenmanda kurulabiliyordu, yani her seans elle yeniden bağlanıyordu. Program Oluştur ekranındaki zincir düğmesi hareketi bir sonrakiyle bağlıyor ve bağ şablondan seansa aynen taşınıyor. Bağ komşuluk olarak saklanıyor, paylaşılan kimlik olarak değil: hareketler yukarı aşağı taşınabildiği için paylaşılan kimlik, taşımadan sonra artık yan yana olmayan iki hareketi bağlı gösterebiliyordu.'
    },
    {
      title: 'Dinlenme Bitince Bildirim',
      desc: 'Ses ve titreşim telefon sessizdeyken ya da uygulama arka plandayken yetmiyordu: salonda ekran kapanıyor, sayaç bitiyor, kimse fark etmiyor. Ayarlardan açılan sistem bildirimi ekran kapalıyken de görünüyor. İzin uygulama açılışında değil, anahtarı açtığında isteniyor.'
    },
    {
      title: 'Koç Merkezi',
      desc: 'Antrenman, uyku, hazır oluşluk, hacim ve enerji verileri tek merkezde açıklanabilir bir haftalık karara dönüşüyor.'
    },
    {
      title: 'Güven Puanlı Haftalık Protokol',
      desc: 'Önerinin veri kapsamı görünür. Yetersiz kayıtla protokol aktive edilemiyor; nedenler ve eksik veriler açıkça gösteriliyor.'
    },
    {
      title: 'Toparlanma Protokolü',
      desc: 'Toparlanma sinyalleri birikirse yalnızca o haftanın seanslarında çalışma setleri kontrollü azalıyor; şablon ve kayıtlı yükler korunuyor.'
    },
    {
      title: 'Karar Hafızası',
      desc: 'Aktive edilen haftalık kararlar geçmişte saklanıyor; günlük koç aktif protokolü hatırlatıyor ve seans raporu uygulanan uyarlamayı gösteriyor.'
    }
  ]
};
