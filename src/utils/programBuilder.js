import { parseNumber } from './number.js';
import { MUSCLE_GROUPS, getVolumeLandmarks } from './constants.js';
import { detectMuscleGroup } from './helpers.js';
import { detectEquipment } from './substitution.js';
import { lengthBias } from './selectionAudit.js';

/**
 * Program üretici.
 *
 * Hazır programlar (3.8) üç sabit seçenek sunuyordu; işe yarıyordu ama "4 gün
 * antrenman yapabiliyorum, salonumda barbell yok ve kanadım geride" diyen
 * kişiye verecek bir cevabı yoktu. Burası o cevabı üretiyor: gün sayısı,
 * ekipman, deneyim ve öncelikli kaslardan yola çıkıp şablonları ve haftalık
 * planı kuruyor.
 *
 * TASARIMIN ÖZÜ: set sayıları elle ayarlanmıyor, YAKINSATILIYOR.
 *
 * İlk denemede her kasa hedeflenen hacim doğrudan yazılsa sonuç şaşmaz biçimde
 * yanlış çıkıyor, çünkü hareketler yan kaslara da yazıyor: göğse 12 set
 * yazdığında tricepse 6 set daha gidiyor ve triceps kendi doğrudan setleriyle
 * birlikte tavanı aşıyor. Bunu baştan hesaplamak, hareket seçimi değiştikçe
 * bozulan bir kağıt üstü hesap olurdu.
 *
 * Bunun yerine üretici taslağı kuruyor, uygulamanın KENDİ hacim çözümleyicisini
 * (previewTemplateVolume ile aynı katkı modeli) çalıştırıyor, tavanı aşan kastan
 * set kısıp eşiğin altında kalana set ekliyor ve bunu sonuç oturana kadar
 * yineliyor. Yani programın doğruluğunu iddia etmiyor, ölçüyor.
 *
 * 3.8'de hazır programların hacim iddiası yanlış çıkmıştı; bu modül aynı hatayı
 * yapısal olarak yapamıyor.
 */

/* ---------------------------------------------------------------- ekipman */

/**
 * Ekipman profilleri.
 *
 * Salon donanımı hareket seçiminin en sert kısıtı: "kanat için ne yapayım"
 * sorusunun cevabı barfiks çekebilen biriyle sadece makine bulabilen kişide
 * aynı değil. Profil, adaylardan hangilerinin kullanılabileceğini süzüyor.
 */
export const EQUIPMENT_PROFILES = [
  {
    key: 'full', label: 'Tam donanımlı salon',
    hint: 'Barbell, dambıl, makine ve kablo — hepsi var',
    allows: () => true,
  },
  {
    key: 'machines', label: 'Makine ve kablo',
    hint: 'Serbest ağırlık yok ya da tercih etmiyorsun',
    allows: (key) => key === 'machine' || key === 'cable' || key === 'dumbbell',
  },
  {
    key: 'home', label: 'Ev / dambıl',
    hint: 'Dambıl ve vücut ağırlığı; makine yok',
    allows: (key) => key === 'dumbbell' || key === 'bodyweight',
  },
];

export const findEquipmentProfile = (key) =>
  EQUIPMENT_PROFILES.find(p => p.key === key) || EQUIPMENT_PROFILES[0];

/* ------------------------------------------------------------------ bölme */

const PUSH = ['Göğüs', 'Ön Omuz', 'Yan Omuz', 'Triseps'];
const PULL = ['Kanat', 'Orta Sırt', 'Arka Omuz', 'Biseps', 'Trapez'];
const LEGS = ['Quadriceps', 'Hamstring', 'Kalça', 'Baldır'];
const CORE = ['Karın', 'Bel'];
const UPPER = [...PUSH, ...PULL];
const FULL_BODY = [...UPPER, ...LEGS, ...CORE];
const QUAD_LEGS = ['Quadriceps', 'Baldır'];
const POSTERIOR_LEGS = ['Hamstring', 'Kalça', ...CORE];
const TORSO = ['Göğüs', 'Kanat', 'Orta Sırt', 'Trapez'];
const LIMBS = ['Ön Omuz', 'Yan Omuz', 'Arka Omuz', 'Biseps', 'Triseps', ...LEGS, ...CORE];
const SHOULDERS_ARMS = ['Ön Omuz', 'Yan Omuz', 'Arka Omuz', 'Biseps', 'Triseps'];

/**
 * Gün sayısına göre bölme.
 *
 * Kural, sıklık ve toparlanmanın kesiştiği yerden çıkıyor: az günde tüm vücut
 * (her kas haftada 2-3 kez uyarılabilsin), çok günde bölünmüş (tek seansa
 * sığmayacak hacim güne yayılabilsin). Günler haftaya dinlenme kalacak şekilde
 * dağıtılıyor; arka arkaya aynı bölgeyi çalıştıran bir plan üretilmiyor.
 */
export const SPLIT_PRESETS = [
  {
    id: 'fullbody-2', daysPerWeek: 2, recommended: true,
    name: 'Full Body 2 Gün',
    summary: 'İki dengeli tam vücut günü',
    tags: ['En az gün', 'Tüm kaslar 2×'],
    rationale: 'İki günde bölmeye yer yok: her seans tüm vücudu görmeli, yoksa bazı kaslar haftada bir bile uyarılmaz. Hacim düşük kalır ama koruma eşiğinin üstüne çıkar.',
    days: [
      { name: 'Tüm Vücut A', groups: [...FULL_BODY] },
      { name: 'Tüm Vücut B', groups: [...FULL_BODY] },
    ],
    schedule: { mon: 0, thu: 1 },
  },
  {
    id: 'fullbody-3', daysPerWeek: 3, recommended: true,
    name: 'Full Body 3 Gün',
    summary: 'Sık teknik tekrarı ve dengeli dağılım',
    tags: ['Dengeli', 'Tüm kaslar 3×'],
    rationale: 'Haftada üç gün için tüm vücut hâlâ en verimlisi: her kas üç kez uyarılır, seans başına hacim düşük kaldığı için yorgunluk birikmez.',
    days: [
      { name: 'Tüm Vücut A', groups: [...FULL_BODY] },
      { name: 'Tüm Vücut B', groups: [...FULL_BODY] },
      { name: 'Tüm Vücut C', groups: [...FULL_BODY] },
    ],
    schedule: { mon: 0, wed: 1, fri: 2 },
  },
  {
    id: 'hybrid-3', daysPerWeek: 3,
    name: 'İtiş+Bacak / Çekiş+Bacak / Tam Vücut',
    summary: 'Üst ve alt vücudu aynı gün eşleştir',
    tags: ['Hibrit', 'Her kas 2×'],
    rationale: 'İtiş kaslarını ön bacakla, çekiş kaslarını arka bacakla birleştirir; üçüncü tam vücut günü her bölgeye ikinci uyaranı verir. Klasik bölmelerden sıkılan ama üç günde sıklığı korumak isteyenler için.',
    days: [
      { name: 'İtiş + Ön Bacak', groups: [...PUSH, ...QUAD_LEGS] },
      { name: 'Çekiş + Arka Bacak', groups: [...PULL, ...POSTERIOR_LEGS] },
      { name: 'Tam Vücut Tamamlama', groups: [...FULL_BODY] },
    ],
    schedule: { mon: 0, wed: 1, fri: 2 },
  },
  {
    id: 'upper-lower-4', daysPerWeek: 4, recommended: true,
    name: 'Üst / Alt 4 Gün',
    summary: 'İki üst ve iki alt vücut günü',
    tags: ['Dengeli', 'Kolay toparlanma'],
    rationale: 'Dört günde üst/alt, her bölgeyi haftada iki kez çalıştırır ve seans başına hacmi makul tutar. Tüm vücut bu hacimde tek seansa sığmaz.',
    days: [
      { name: 'Üst A', groups: [...UPPER] },
      { name: 'Alt A', groups: [...LEGS, ...CORE] },
      { name: 'Üst B', groups: [...UPPER] },
      { name: 'Alt B', groups: [...LEGS, ...CORE] },
    ],
    schedule: { mon: 0, tue: 1, thu: 2, fri: 3 },
  },
  {
    id: 'push-pull-legs-4', daysPerWeek: 4,
    name: 'İtiş+Bacak / Çekiş+Bacak 4 Gün',
    summary: 'Her seansta bir üst ve bir alt bölüm',
    tags: ['Hibrit', 'Bacakla birleştir'],
    rationale: 'İtiş ve çekiş günlerinin yanına dönüşümlü olarak ön veya arka bacak ekler. Böylece dört günün tamamı karma çalışılırken her bölge haftada iki kez uyarılır ve ayrı bir uzun bacak gününe ihtiyaç kalmaz.',
    days: [
      { name: 'İtiş + Ön Bacak A', groups: [...PUSH, ...QUAD_LEGS] },
      { name: 'Çekiş + Arka Bacak A', groups: [...PULL, ...POSTERIOR_LEGS] },
      { name: 'İtiş + Arka Bacak B', groups: [...PUSH, ...POSTERIOR_LEGS] },
      { name: 'Çekiş + Ön Bacak B', groups: [...PULL, ...QUAD_LEGS] },
    ],
    schedule: { mon: 0, tue: 1, thu: 2, fri: 3 },
  },
  {
    id: 'torso-limbs-4', daysPerWeek: 4,
    name: 'Gövde / Uzuvlar 4 Gün',
    summary: 'Göğüs-sırt ile omuz-kol-bacağı ayır',
    tags: ['Alternatif', 'Kol önceliği'],
    rationale: 'Göğüs ve sırtı aynı seansta, omuz-kol-bacağı başka seansta toplar. Kolları üst günün sonuna bırakmak istemeyen ve antagonist kasları birlikte çalıştırmayı seven kullanıcılar için.',
    days: [
      { name: 'Gövde A', groups: [...TORSO] },
      { name: 'Uzuvlar A', groups: [...LIMBS] },
      { name: 'Gövde B', groups: [...TORSO] },
      { name: 'Uzuvlar B', groups: [...LIMBS] },
    ],
    schedule: { mon: 0, tue: 1, thu: 2, fri: 3 },
  },
  {
    id: 'fullbody-4', daysPerWeek: 4,
    name: 'Dalgalı Tam Vücut 4 Gün',
    summary: 'Her gün üst vücut, dönüşümlü ön/arka bacak',
    tags: ['Yüksek sıklık', 'Az set/gün'],
    rationale: 'Üst vücudu dört güne yayarken ön ve arka bacağı dönüşümlü çalıştırır. Böylece her seans bütün vücuttan bir bölüm içerir fakat başlangıç seviyesinde arka zincir hacmi gereksiz biçimde tavana çıkmaz.',
    days: [
      { name: 'Tam Vücut A · Ön Bacak', groups: [...UPPER, ...QUAD_LEGS] },
      { name: 'Tam Vücut B · Arka Bacak', groups: [...UPPER, ...POSTERIOR_LEGS] },
      { name: 'Tam Vücut C · Ön Bacak', groups: [...UPPER, ...QUAD_LEGS] },
      { name: 'Tam Vücut D · Arka Bacak', groups: [...UPPER, ...POSTERIOR_LEGS] },
    ],
    schedule: { mon: 0, tue: 1, thu: 2, sat: 3 },
  },
  {
    id: 'upper-lower-ppl-5', daysPerWeek: 5, recommended: true,
    name: 'Üst / Alt / İtiş / Çekiş / Alt 5 Gün',
    summary: 'Üst-alt ile itiş-çekişi birleştir',
    tags: ['Dengeli', 'Bacak önceliği'],
    rationale: 'Beş gün, üst/alt ile itiş-çekiş arasında bir melez ister: bölgeler haftada iki kez döner, beşinci gün en çok hacim isteyen bacağa gider.',
    days: [
      { name: 'Üst A', groups: [...UPPER] },
      { name: 'Alt A', groups: [...LEGS, ...CORE] },
      { name: 'İtiş', groups: [...PUSH] },
      { name: 'Çekiş', groups: [...PULL] },
      { name: 'Alt B', groups: [...LEGS, ...CORE] },
    ],
    schedule: { mon: 0, tue: 1, thu: 2, fri: 3, sat: 4 },
  },
  {
    id: 'hybrid-5', daysPerWeek: 5,
    name: 'İtiş+Bacak / Çekiş+Bacak Hibrit 5 Gün',
    summary: 'Bacağı üst günlere dağıt, ortada üst vücut ekle',
    tags: ['Hibrit', 'Kısa bacak blokları'],
    rationale: 'Ön ve arka bacak hacmini itiş-çekiş günlerine dağıtır; ortadaki üst vücut günü göğüs ve sırta üçüncü, daha küçük bir uyaran verir. Tek bir ağır bacak gününü sevmeyenler için.',
    days: [
      { name: 'İtiş + Ön Bacak', groups: [...PUSH, ...QUAD_LEGS] },
      { name: 'Çekiş + Arka Bacak', groups: [...PULL, ...POSTERIOR_LEGS] },
      { name: 'Üst Tamamlama', groups: [...UPPER] },
      { name: 'İtiş + Arka Bacak', groups: [...PUSH, ...POSTERIOR_LEGS] },
      { name: 'Çekiş + Ön Bacak', groups: [...PULL, ...QUAD_LEGS] },
    ],
    schedule: { mon: 0, tue: 1, wed: 2, fri: 3, sat: 4 },
  },
  {
    id: 'full-upper-lower-5', daysPerWeek: 5,
    name: 'Üst / Alt + Tam Vücut 5 Gün',
    summary: 'İki üst, iki alt ve bir karma gün',
    tags: ['Yüksek sıklık', 'Dengeli'],
    rationale: 'İki üst ve iki alt güne eklenen tam vücut günü bütün kaslara üçüncü bir küçük uyaran sağlar. Aynı kası sık çalıştırmayı seven ama her gün tam vücut istemeyenler için.',
    days: [
      { name: 'Üst A', groups: [...UPPER] },
      { name: 'Alt A', groups: [...LEGS, ...CORE] },
      { name: 'Tam Vücut', groups: [...FULL_BODY] },
      { name: 'Üst B', groups: [...UPPER] },
      { name: 'Alt B', groups: [...LEGS, ...CORE] },
    ],
    schedule: { mon: 0, tue: 1, thu: 2, fri: 3, sat: 4 },
  },
  {
    id: 'ppl-6', daysPerWeek: 6, recommended: true,
    name: 'Push / Pull / Legs 6 Gün',
    summary: 'İtiş, çekiş ve bacak; iki tur',
    tags: ['İleri', 'Kısa seanslar'],
    rationale: 'Altı günde itiş-çekiş-bacak iki tur döner. Her kas haftada iki kez, seans başına hacim düşük; toparlanma kapasitesi yüksek olanlar için.',
    days: [
      { name: 'İtiş A', groups: [...PUSH] },
      { name: 'Çekiş A', groups: [...PULL] },
      { name: 'Bacak A', groups: [...LEGS, ...CORE] },
      { name: 'İtiş B', groups: [...PUSH] },
      { name: 'Çekiş B', groups: [...PULL] },
      { name: 'Bacak B', groups: [...LEGS, ...CORE] },
    ],
    schedule: { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5 },
  },
  {
    id: 'arnold-6', daysPerWeek: 6,
    name: 'Göğüs+Sırt / Omuz+Kol / Bacak 6 Gün',
    summary: 'Antagonist üst vücut kaslarını eşleştir',
    tags: ['Arnold tipi', 'Kol önceliği'],
    rationale: 'Göğüs ve sırtı aynı gün, omuz ve kolları ayrı gün çalıştırır; bacak günü döngüyü tamamlar. Üst günün sonunda kol çalışmak yerine kollara taze başlamak isteyenler için.',
    days: [
      { name: 'Göğüs + Sırt A', groups: [...TORSO] },
      { name: 'Omuz + Kol A', groups: [...SHOULDERS_ARMS] },
      { name: 'Bacak A', groups: [...LEGS, ...CORE] },
      { name: 'Göğüs + Sırt B', groups: [...TORSO] },
      { name: 'Omuz + Kol B', groups: [...SHOULDERS_ARMS] },
      { name: 'Bacak B', groups: [...LEGS, ...CORE] },
    ],
    schedule: { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5 },
  },
];

export const SPLITS = Object.fromEntries(
  [2, 3, 4, 5, 6].map(days => [days, SPLIT_PRESETS.find(p => p.daysPerWeek === days && p.recommended)]),
);

export const getSplitOptions = (daysPerWeek) =>
  SPLIT_PRESETS.filter(p => p.daysPerWeek === Number(daysPerWeek));

export const findSplitPreset = (splitId, daysPerWeek = 4) =>
  SPLIT_PRESETS.find(p => p.id === splitId && p.daysPerWeek === Number(daysPerWeek))
  || SPLITS[Number(daysPerWeek)]
  || SPLITS[4];

export const SPLIT_DAY_OPTIONS = Object.keys(SPLITS).map(Number).sort((a, b) => a - b);

/* ------------------------------------------------------------- hareketler */

/**
 * Kas başına aday hareketler, rolüne göre.
 *
 * `anchor`  seansı açan, en çok yük kaldırılan hareket
 * `stretch` kasın uzun boyda yüklendiği hareket (3.9 denetiminin aradığı)
 * `extra`   hacim tamamlamak için eklenen üçüncü hareket
 *
 * Her rol için birden fazla aday var çünkü ekipman profili listeyi süzüyor;
 * tek aday bırakılsaydı ev profilinde çoğu kas boş kalırdı. Sıra tercih sırası:
 * ilk uygun aday seçilir.
 *
 * Aynı hareketin iki farklı güne düşmesi engellenmiyor (Üst A ve Üst B aynı
 * bench'i kullanabilir) ama üretici önce KULLANILMAMIŞ adayı deniyor; böylece
 * B günü kendiliğinden farklı bir açıya kayıyor.
 */
const POOL = {
  'Göğüs': {
    anchor: ['Barbell Bench Press', 'Dumbbell Bench Press', 'Machine Chest Press', 'Incline Barbell Bench Press', 'Push-ups'],
    stretch: ['Incline Dumbbell Fly', 'Incline Dumbbell Press', 'Pec Deck Fly', 'Machine Fly', 'Cable Fly (Low to High)', 'Deficit Push-ups'],
    extra: ['Cable Crossover', 'Machine Incline Press', 'Hex Press', 'Weighted Push-ups'],
  },
  'Kanat': {
    anchor: ['Pull-up', 'Lat Pulldown', 'Assisted Pull-up', 'Close Grip Lat Pulldown'],
    stretch: ['Dumbbell Pullover', 'Straight Arm Pulldown', 'Machine Pullover', 'Cable Lat Prayer', 'Neutral Grip Pull-up'],
    extra: ['Single Arm Lat Pulldown', 'Reverse Grip Lat Pulldown', 'Chin-up'],
  },
  'Orta Sırt': {
    anchor: ['Barbell Row', 'Seated Cable Row', 'Machine Row', 'Dumbbell Row', 'Inverted Row'],
    stretch: ['Chest Supported Dumbbell Row', 'Chest Supported Row', 'Seal Row', 'Chest Supported T-Bar Row'],
    extra: ['Machine Low Row', 'Single Arm Cable Row', 'Kroc Row'],
  },
  'Trapez': {
    anchor: ['Dumbbell Shrug', 'Cable Shrug', 'Barbell Shrug', 'Smith Machine Shrug'],
    stretch: [],
    extra: ['Trap Bar Shrug'],
  },
  'Ön Omuz': {
    anchor: ['Overhead Press (OHP)', 'Seated Dumbbell Shoulder Press', 'Machine Shoulder Press', 'Dumbbell Shoulder Press'],
    stretch: [],
    extra: ['Arnold Press', 'Cable Front Raise'],
  },
  'Yan Omuz': {
    anchor: ['Lateral Raise (Dumbbell)', 'Machine Lateral Raise', 'Seated Lateral Raise'],
    stretch: ['Lateral Raise (Cable)', 'Leaning Cable Lateral Raise', 'Incline Lateral Raise', 'Lu Lateral Raise'],
    extra: ['Cable Upright Row', 'Dumbbell Upright Row'],
  },
  'Arka Omuz': {
    anchor: ['Reverse Pec Deck', 'Rear Delt Fly (Dumbbell)', 'Machine Reverse Fly', 'Bent Over Lateral Raise'],
    stretch: ['Cable Rear Delt Fly', 'Reverse Cable Fly'],
    extra: ['Rope Face Pull', 'Face Pull'],
  },
  'Biseps': {
    anchor: ['Dumbbell Bicep Curl', 'Cable Bicep Curl', 'Barbell Bicep Curl', 'Machine Bicep Curl'],
    stretch: ['Incline Dumbbell Curl', 'Bayesian Cable Curl', 'Incline Cable Curl', 'Preacher Curl', 'Machine Preacher Curl'],
    extra: ['Hammer Curl', 'Rope Hammer Curl', 'EZ Bar Curl'],
  },
  'Triseps': {
    anchor: ['Rope Pushdown', 'Tricep Pushdown', 'Close Grip Bench Press', 'Diamond Push-ups', 'V-Bar Pushdown'],
    stretch: ['Cable Overhead Tricep Extension', 'Tricep Overhead Extension', 'Skull Crusher', 'Lying Dumbbell Extension', 'Bench Dip'],
    extra: ['Single Arm Pushdown', 'Reverse Grip Pushdown', 'Tricep Kickback'],
  },
  'Önkol': {
    anchor: ['Wrist Curl', 'Cable Wrist Curl', 'Reverse Curl'],
    stretch: [],
    extra: ['Farmer\'s Hold', 'Reverse Wrist Curl'],
  },
  'Quadriceps': {
    anchor: ['Barbell Back Squat', 'Leg Press', 'Hack Squat', 'Goblet Squat', 'Smith Machine Squat'],
    stretch: ['Bulgarian Split Squat', 'Pendulum Squat', 'Heels Elevated Squat', 'Cyclist Squat', 'Barbell Front Squat', 'Step Down'],
    extra: ['Leg Extension', 'Walking Lunges', 'Reverse Lunge'],
  },
  'Hamstring': {
    anchor: ['Romanian Deadlift (RDL)', 'Lying Leg Curl', 'Seated Leg Curl', 'Single Leg Romanian Deadlift'],
    stretch: ['Seated Leg Curl', 'Romanian Deadlift (RDL)', 'Good Morning', 'Nordic Hamstring Curl', 'Glute Ham Raise'],
    extra: ['Standing Leg Curl', 'Kneeling Leg Curl', 'Slider Leg Curl'],
  },
  'Kalça': {
    anchor: ['Hip Thrust', 'Machine Hip Thrust', 'Barbell Glute Bridge', 'Single Leg Hip Thrust'],
    stretch: ['Sumo Deadlift', 'Bulgarian Split Squat', 'Cable Pull Through'],
    extra: ['Cable Glute Kickback', 'Hip Abduction Machine', 'Seated Hip Abduction'],
  },
  'Baldır': {
    anchor: ['Standing Calf Raise', 'Leg Press Calf Raise', 'Smith Machine Calf Raise', 'Single Leg Calf Raise'],
    stretch: ['Seated Calf Raise', 'Donkey Calf Raise', 'Seated Single Leg Calf Raise'],
    extra: ['Hack Squat Calf Raise'],
  },
  'Karın': {
    anchor: ['Cable Crunch', 'Machine Crunch', 'Ab Crunch Machine', 'Plank'],
    stretch: ['Hanging Leg Raise', 'Hanging Knee Raise', 'Ab Wheel Rollout', 'Decline Sit-up'],
    extra: ['Pallof Press', 'Russian Twist', 'Bicycle Crunch'],
  },
  'Bel': {
    anchor: ['Reverse Hyperextension', 'Superman Hold', 'Bird Dog'],
    stretch: ['Rack Pull', 'Conventional Deadlift', 'Jefferson Curl'],
    extra: [],
  },
};

/**
 * Doğrudan programlanan kaslar.
 *
 * Ön omuz, trapez, önkol ve bel listede yok: dördü de basış, çekiş ve
 * çömeliş hareketlerinden bol dolaylı hacim alıyor ve doğrudan çalışılmaları
 * çoğu kişide gerekmiyor. Yakınsama sırasında koruma eşiğinin altında
 * kalırlarsa yine de hareket ekleniyor — kural "hiç çalışma" değil, "önce
 * dolaylı hacme bak".
 */
const DIRECT_MUSCLES = [
  'Göğüs', 'Kanat', 'Orta Sırt', 'Yan Omuz', 'Arka Omuz', 'Biseps', 'Triseps',
  'Quadriceps', 'Hamstring', 'Kalça', 'Baldır', 'Karın',
];

/** Bir hareketin ekipman profiline uyup uymadığı. */
const uygunMu = (name, profile) => {
  const eq = detectEquipment(name);
  // Ekipmanı tanınmayan hareket (örn. "Nordic Hamstring Curl") her profilde
  // kabul ediliyor: bilinmiyor diye elemek, ev profilinde havuzu boşaltırdı.
  return !eq || profile.allows(eq.key);
};

/** Rol için profile uyan, henüz kullanılmamış ilk aday. */
const adaySec = (muscle, role, profile, kullanilan, tercihEdilen = new Set()) => {
  const liste = POOL[muscle]?.[role] || [];
  const uygun = liste
    .filter(ad => uygunMu(ad, profile))
    .sort((a, b) => Number(tercihEdilen.has(b)) - Number(tercihEdilen.has(a)));
  return uygun.find(ad => !kullanilan.has(ad)) || uygun[0] || null;
};

/* ------------------------------------------------------------- yakınsama */

// Bir kasın bir günde en az bu kadar seti olmalı; altında kalan set o kası
// "çalışıldı" saymaya yetmiyor (frequency.js ile aynı eşik).
const MIN_SETS_PER_DAY = 2;
// Tek harekette bundan fazla set verimli değil; fazlası ikinci harekete gider.
const MAX_SETS_PER_EXERCISE = 5;
// Seans başına set tavanı. Bunun üstünde son hareketler yorgun yapılıyor ve
// eklenen set uyaran değil yorgunluk getiriyor. İki günlük bölmede haftalık
// hacmi asıl sınırlayan kısıt bu: iki seans on iki kasa koruma eşiği kadar
// hacim veremiyor ve rapor bunu MEV altı olarak dürüstçe söylüyor.
const MAX_SETS_PER_SESSION = 30;
// Faz başına tur sınırı; sonsuz döngüye karşı. Fazlar tek yönlü olduğu için
// normal çalışmada çok daha önce sonlanıyorlar.
const MAX_PASSES = 60;

/** Taslaktaki hareketlerden hacim tablosu — previewTemplateVolume ile aynı model. */
const hacimHesapla = (days, customExercises) => {
  const byMuscle = {};
  days.forEach(day => {
    day.exercises.forEach(ex => {
      const { contributions } = detectMuscleGroup(ex.name, customExercises);
      Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
        byMuscle[kas] = (byMuscle[kas] || 0) + ex.sets * agirlik;
      });
    });
  });
  return byMuscle;
};

/**
 * Programı üretir.
 *
 * @returns { split, days, report, ... } — report ÖLÇÜLEN hacim tablosu
 */
export const buildProgram = ({
  daysPerWeek = 4,
  splitId = null,
  experienceLevel = 'intermediate',
  equipment = 'full',
  priority = [],
  preferredExercises = [],
  customExercises = [],
} = {}) => {
  const split = findSplitPreset(splitId, daysPerWeek);
  const profile = findEquipmentProfile(equipment);
  const oncelik = new Set((priority || []).filter(Boolean));
  const tercihEdilen = new Set(preferredExercises || []);

  const landmarks = Object.fromEntries(
    MUSCLE_GROUPS.map(m => [m, getVolumeLandmarks(m, experienceLevel)]));

  // Hedef, verimli bandın ALT ucuna yakın: MEV + bandın dörtte biri. Öncelikli
  // kaslarda dörtte üçüne çıkıyor.
  //
  // İlk denemede hedef bandın ortasıydı ve üretilen program haftada 120+ sete
  // çıkıyordu — teknik olarak sınırlar içindeydi ama ilk haftasından itibaren
  // toparlanmayı zorlayan bir programdı. Hacim eklemek mezosikliğin işi:
  // üretici seni MEV'in biraz üstünde başlatır, blok her hafta yukarı taşır.
  // Tavandan başlanırsa bloğa artıracak yer kalmaz.
  const hedef = {};
  DIRECT_MUSCLES.forEach(m => {
    const { mev, mav } = landmarks[m];
    const bant = Math.max(0, mav - mev);
    hedef[m] = Math.round(mev + bant * (oncelik.has(m) ? 0.75 : 0.25));
  });

  // --- taslak: her gün, o günün kasları için hareketler ---
  const kullanilan = new Set();
  const gunler = split.days.map(gun => ({ name: gun.name, groups: gun.groups, exercises: [] }));

  DIRECT_MUSCLES.forEach(kas => {
    const gunIndexleri = gunler
      .map((g, i) => (g.groups.includes(kas) ? i : -1))
      .filter(i => i >= 0);
    if (gunIndexleri.length === 0) return;

    const gunBasi = Math.max(MIN_SETS_PER_DAY, Math.round(hedef[kas] / gunIndexleri.length));

    gunIndexleri.forEach(i => {
      // Gerilmede yükleyen hareket ÖNCE seçiliyor: 3.9 denetiminin aradığı şey
      // bu ve her kasta bir tane olduğundan emin olmanın en kolay yolu, onu
      // isteğe bağlı değil zorunlu kılmak.
      const gerilme = adaySec(kas, 'stretch', profile, kullanilan, tercihEdilen);
      const ana = adaySec(kas, 'anchor', profile, kullanilan, tercihEdilen);
      const secilen = [];

      if (gunBasi <= MAX_SETS_PER_EXERCISE && (ana || gerilme)) {
        secilen.push({ name: gerilme || ana, sets: gunBasi });
      } else {
        const parcalar = [ana, gerilme].filter(Boolean);
        if (parcalar.length === 0) return;
        const her = Math.max(MIN_SETS_PER_DAY, Math.round(gunBasi / parcalar.length));
        parcalar.forEach(ad => secilen.push({ name: ad, sets: her }));
      }

      secilen.forEach(s => {
        kullanilan.add(s.name);
        const mevcut = gunler[i].exercises.find(e => e.name === s.name);
        if (mevcut) mevcut.sets += s.sets;
        else gunler[i].exercises.push({ ...s, muscle: kas });
      });
    });
  });

  // --- yakınsama: ölç, düzelt, tekrar ölç ---
  //
  // Düzeltme TEK YÖNLÜ fazlara bölünmüş. İlk yazımda tek bir döngü hem set
  // kısıp hem set ekliyordu ve salınıyordu: kalçadan kısılan set hamstringi
  // eşiğin altına düşürüyor, hamstringe eklenen set kalçayı tavanın üstüne
  // çıkarıyor, tur sınırına kadar bu böyle gidiyordu. Her faz yalnızca
  // azalttığı ya da yalnızca artırdığı için tek başına sonlanması garanti.
  let pas = 0;

  /**
   * Bu hareketten bir set kısmak HİÇBİR kası koruma eşiğinin altına düşürmüyor mu?
   *
   * Yalnızca hareketin birincil kasına bakmak yetmiyordu ve bu sessiz bir hata
   * üretiyordu: seans tavanı için bir kanat hareketi kısıldığında orta sırta
   * yazdığı yarım set de gidiyor, orta sırt 8'den 7.5'e düşüyor ve rapor
   * "MEV altı" diyordu. Kısma kararı, hareketin BESLEDİĞİ bütün kaslara
   * bakmak zorunda.
   */
  const kismaGuvenli = (ex, olculen) => {
    const { contributions } = detectMuscleGroup(ex.name, customExercises);
    return Object.entries(contributions || {}).every(([kas, agirlik]) => {
      const esik = landmarks[kas]?.mev;
      if (!esik) return true;
      return (olculen[kas] || 0) - parseNumber(agirlik) >= esik;
    });
  };

  /** Bir kastan bir set kısar; kısacak yer bulamazsa false döner. */
  const birSetKis = (kas, olculen) => {
    const kendi = gunler
      .flatMap((g, i) => g.exercises.map(e => ({ ...e, gun: i })))
      .filter(e => e.muscle === kas && e.sets > MIN_SETS_PER_DAY)
      .sort((a, b) => b.sets - a.sets);
    if (kendi.length > 0) {
      gunler[kendi[0].gun].exercises.find(e => e.name === kendi[0].name).sets -= 1;
      return true;
    }
    // Kendi hareketi kalmadıysa fazlalık tamamen DOLAYLI katkıdan geliyor
    // (kalça hem çömelişten hem kalça itişinden besleniyor). En çok katkı veren
    // yabancı hareketten kısılır — ama sahibi kendi eşiğinin altına düşmeyecekse.
    const disKaynak = gunler
      .flatMap((g, i) => g.exercises.map(e => ({ ...e, gun: i })))
      .filter(e => {
        if (e.sets <= MIN_SETS_PER_DAY) return false;
        const { contributions } = detectMuscleGroup(e.name, customExercises);
        if (!(parseNumber(contributions?.[kas]) > 0)) return false;
        return kismaGuvenli(e, olculen);
      })
      .sort((a, b) => b.sets - a.sets);
    if (disKaynak.length === 0) return false;
    gunler[disKaynak[0].gun].exercises.find(e => e.name === disKaynak[0].name).sets -= 1;
    return true;
  };

  /** Bir kasa bir set ekler; ekleyecek yer bulamazsa false döner. */
  const birSetEkle = (kas) => {
    const mevcut = gunler
      .flatMap((g, i) => g.exercises.map(e => ({ ...e, gun: i })))
      .filter(e => e.muscle === kas && e.sets < MAX_SETS_PER_EXERCISE)
      .sort((a, b) => a.sets - b.sets);
    if (mevcut.length > 0) {
      gunler[mevcut[0].gun].exercises.find(e => e.name === mevcut[0].name).sets += 1;
      return true;
    }
    // Bu kasın hiç hareketi yok ya da hepsi doldu: yeni hareket ekle.
    const rol = (POOL[kas]?.stretch || []).some(ad => uygunMu(ad, profile)) ? 'stretch' : 'anchor';
    const yeni = adaySec(kas, rol, profile, kullanilan, tercihEdilen)
      || adaySec(kas, 'anchor', profile, kullanilan, tercihEdilen)
      || adaySec(kas, 'extra', profile, kullanilan, tercihEdilen);
    if (!yeni) return false;
    const gunIndexleri = gunler
      .map((g, i) => (g.groups.includes(kas) ? i : -1))
      .filter(i => i >= 0);
    // Bölmede o kasın günü yoksa (örn. bel) en az dolu güne eklenir.
    const adaylar = gunIndexleri.length > 0 ? gunIndexleri : gunler.map((_, i) => i);
    const enBos = adaylar
      .map(i => ({ i, yuk: gunler[i].exercises.reduce((t, e) => t + e.sets, 0) }))
      .sort((a, b) => a.yuk - b.yuk)[0].i;
    kullanilan.add(yeni);
    const varOlan = gunler[enBos].exercises.find(e => e.name === yeni);
    if (varOlan) varOlan.sets += MIN_SETS_PER_DAY;
    else gunler[enBos].exercises.push({ name: yeni, sets: MIN_SETS_PER_DAY, muscle: kas });
    return true;
  };

  /** Yalnızca kısan faz: hiçbir kas `tavan(kas)` değerini aşmayana kadar. */
  const kismaFazi = (tavan) => {
    for (let i = 0; i < MAX_PASSES; i += 1) {
      const olculen = hacimHesapla(gunler, customExercises);
      const asan = MUSCLE_GROUPS.find(kas => (olculen[kas] || 0) > tavan(kas));
      if (!asan) return;
      pas += 1;
      if (!birSetKis(asan, olculen)) {
        // Bu kas için kısacak yer yok; kalanları denemeye devam etmek için
        // listeden çıkarmak gerekiyor, yoksa faz kilitlenir.
        const digerleri = MUSCLE_GROUPS.filter(k => k !== asan && (olculen[k] || 0) > tavan(k));
        if (digerleri.length === 0) return;
        if (!birSetKis(digerleri[0], olculen)) return;
      }
    }
  };

  /** Yalnızca ekleyen faz: hiçbir kas kendi MEV'inin altında kalmayana kadar. */
  const eklemeFazi = () => {
    const vazgecilen = new Set();
    for (let i = 0; i < MAX_PASSES; i += 1) {
      const olculen = hacimHesapla(gunler, customExercises);
      const eksik = MUSCLE_GROUPS.find(kas =>
        !vazgecilen.has(kas) && (olculen[kas] || 0) < landmarks[kas].mev);
      if (!eksik) return;
      pas += 1;
      if (!birSetEkle(eksik)) vazgecilen.add(eksik);
    }
  };

  /**
   * Öncelikli kasları hedeflerine çıkaran faz.
   *
   * Bu faz olmadan öncelik seçmek hiçbir şeyi değiştirmiyordu: taslak hedefi
   * yükseltiyor ama ilk kısma fazı fazlalığı hemen geri alıyordu, çünkü kısma
   * ölçütü herkes için aynı tavandı. Öncelik, MEV tabanının üstüne çıkan ayrı
   * bir taban olarak uygulanmak zorunda.
   */
  const oncelikFazi = () => {
    const vazgecilen = new Set();
    for (let i = 0; i < MAX_PASSES; i += 1) {
      const olculen = hacimHesapla(gunler, customExercises);
      const eksik = [...oncelik].find(kas =>
        !vazgecilen.has(kas)
        && landmarks[kas]
        && (olculen[kas] || 0) < Math.min(hedef[kas] ?? 0, landmarks[kas].mav));
      if (!eksik) return;
      pas += 1;
      if (!birSetEkle(eksik)) vazgecilen.add(eksik);
    }
  };

  /** Seans başı set tavanı: bir günün taşıyabileceğinden fazlası verimli değil. */
  const seansFazi = () => {
    for (let i = 0; i < MAX_PASSES; i += 1) {
      const olculen = hacimHesapla(gunler, customExercises);
      const dolu = gunler
        .map((g, idx) => ({ idx, yuk: g.exercises.reduce((t, e) => t + e.sets, 0) }))
        .filter(g => g.yuk > MAX_SETS_PER_SESSION)
        .sort((a, b) => b.yuk - a.yuk)[0];
      if (!dolu) return;
      pas += 1;
      // Hiçbir kası eşiğin altına düşürmeyen en büyük hareketten kısılır.
      // Öncelikli kaslar en sona bırakılıyor: kullanıcı bir kası özellikle
      // seçtiyse, seansı kısaltmanın bedelini ilk ödeyecek yer orası olmamalı.
      const aday = gunler[dolu.idx].exercises
        .filter(e => e.sets > MIN_SETS_PER_DAY && kismaGuvenli(e, olculen))
        .sort((a, b) => (oncelik.has(a.muscle) - oncelik.has(b.muscle)) || b.sets - a.sets)[0];
      if (!aday) return;
      aday.sets -= 1;
    }
  };

  // Sıra önemli: önce fazlalık atılır (verimli bandın üstü), sonra eksik
  // tamamlanır, sonra ekleme yüzünden TAVANI (MRV) aşan varsa geri alınır.
  // Son kısma MAV'a değil MRV'ye bakıyor; MAV'a dönseydi az önce eklenen
  // setleri sökerek eklemeyi anlamsız kılardı.
  kismaFazi(kas => landmarks[kas].mav);
  eklemeFazi();
  oncelikFazi();
  kismaFazi(kas => landmarks[kas].mrv);
  seansFazi();


  // Hareket sırası: bileşke hareketler önce, izolasyon sonra. Yorgunken en çok
  // yük kaldıran hareketi yapmak hem riskli hem verimsiz.
  //
  // Ölçüt havuzdaki rol DEĞİL, hareketin kaç kası birden yüklediği. Rolle
  // sıralarken üst gün "Lateral Raise" ile açılıyordu: yan omuzun ana hareketi
  // o, ama lat pulldown'dan önce yapılacak bir hareket değil. Katkı sayısı
  // bileşkeliğin doğrudan ölçüsü ve zaten elimizde.
  const bilesenlik = (name) => {
    const { contributions } = detectMuscleGroup(name, customExercises);
    return Object.values(contributions || {}).reduce((t, w) => t + parseNumber(w), 0);
  };
  gunler.forEach(g => {
    const skor = new Map(g.exercises.map(e => [e.name, bilesenlik(e.name)]));
    g.exercises.sort((a, b) => skor.get(b.name) - skor.get(a.name) || b.sets - a.sets);
  });

  const olculen = hacimHesapla(gunler, customExercises);
  const report = MUSCLE_GROUPS.map(kas => {
    const { mev, mav, mrv } = landmarks[kas];
    const hacim = Math.round((olculen[kas] || 0) * 4) / 4;
    return {
      muscle: kas, volume: hacim, mev, mav, mrv,
      belowMev: hacim > 0 && hacim < mev,
      aboveMrv: hacim > mrv,
      priority: oncelik.has(kas),
    };
  });

  return {
    split,
    days: gunler,
    report,
    passes: pas,
    totalSets: gunler.reduce((t, g) => t + g.exercises.reduce((s, e) => s + e.sets, 0), 0),
    sessionCap: MAX_SETS_PER_SESSION,
    // Seans tavanını aşan günler. İki günlük bölmede bu kaçınılmaz olabiliyor:
    // on iki kasa koruma eşiği kadar hacim vermekle seansı makul tutmak aynı
    // anda mümkün değil. Üretici sessizce birini seçmek yerine ikisini de
    // raporluyor; hangisinden vazgeçileceği kullanıcının kararı.
    overloadedDays: gunler
      .map(g => ({ name: g.name, sets: g.exercises.reduce((s, e) => s + e.sets, 0) }))
      .filter(g => g.sets > MAX_SETS_PER_SESSION),
    belowMev: report.filter(r => r.belowMev).map(r => r.muscle),
    aboveMrv: report.filter(r => r.aboveMrv).map(r => r.muscle),
    // Gerilmede yükleyen hareketi olmayan kaslar: 3.9 denetiminin sorduğu soru,
    // burada üretim anında sorulmuş oluyor.
    //
    // Ölçüt, o EKİPMAN PROFİLİNDE gerilme adayı bulunup bulunmadığı. Ev
    // profilinde arka deltoidin kabloya bağlı iki adayı da eleniyor ve
    // kütüphanede dambılla uzun boyda yükleyen bir arka deltoid hareketi yok;
    // bunu eksik saymak, kapatılması imkânsız bir kusur bildirmek olurdu.
    withoutStretch: DIRECT_MUSCLES.filter(kas => {
      const adayVar = (POOL[kas]?.stretch || []).some(ad => uygunMu(ad, profile));
      if (!adayVar) return false;
      return !gunler.some(g => g.exercises.some(e => e.muscle === kas && lengthBias(e.name) === 'stretch'));
    }),
  };
};

/**
 * Üretilen programı uygulamanın biçimine çevirir: şablonlar + haftalık plan.
 *
 * Hazır programlarla aynı sözleşme (instantiateStarterProgram): setler boş
 * ağırlıkla açılıyor, şablon adlarının önüne program adı geliyor.
 */
export const instantiateProgram = (built, generateId, { name } = {}) => {
  if (!built) return null;
  const programAdi = name || built.split.name;

  const templates = built.days.map(gun => ({
    id: generateId(),
    name: `${programAdi} — ${gun.name}`,
    createdAt: new Date().toISOString(),
    exercises: gun.exercises.map(ex => ({
      name: ex.name,
      supersetId: null,
      sets: Array.from({ length: ex.sets }, () => ({
        weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal',
      })),
    })),
  }));

  const days = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
  Object.entries(built.split.schedule).forEach(([gunKey, index]) => {
    const template = templates[index];
    if (!template) return;
    days[gunKey] = [{ id: generateId(), type: 'workout', templateId: template.id, time: '' }];
  });

  return { templates, plan: { id: generateId(), name: programAdi, days } };
};

/** Sihirbazda öncelik seçilebilecek kaslar. */
export const PRIORITY_MUSCLES = DIRECT_MUSCLES;
export const MAX_PRIORITY = 2;
