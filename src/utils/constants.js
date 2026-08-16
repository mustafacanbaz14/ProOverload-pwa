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
  // Aktivite başına seans hedefi: { swim: { sets, setDistance, minutes, ... } }.
  // Hedef koymak zorunlu değil; kardiyo kaydı ve kalori hesabı hedefsiz çalışır.
  activityTargets: {},
  // Koç hafızası: ertelenen ve kapatılan madde anahtarları.
  coachMemory: { snoozed: {}, dismissed: [] },
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
 * Seçili deneyim seviyesine göre ölçeklenmiş hacim referansları.
 * Tam sayıya yuvarlanır; MEV<MAV<MRV sırası her koşulda korunur.
 */
export const getVolumeLandmarks = (muscle, level = 'intermediate') => {
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
export const APP_VERSION = '6.6';

export const LATEST_RELEASE_NOTES = {
  version: APP_VERSION,
  title: 'ProOverload 6.6',
  date: '2026-08-16',
  items: [
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
