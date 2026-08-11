/**
 * Hazır başlangıç programları.
 *
 * Uygulama boş açılıyordu: şablon yok, haftalık plan yok, ilk kullanıcı her
 * şeyi sıfırdan kurmak zorundaydı. Program kurmak da uygulamanın en zor işi —
 * hangi hareket, kaç set, hangi gün sorularının hepsi bir arada.
 *
 * Buradaki programlar hazır cevap veriyor ama KİLİTLİ DEĞİL: kurulduktan sonra
 * normal şablona dönüşüyorlar, hareket eklenip çıkarılabiliyor. Amaç doğru
 * programı dayatmak değil, boş sayfayı ortadan kaldırmak.
 *
 * Set sayıları haftalık toplamı MEV ile MAV arasına oturtacak şekilde seçildi;
 * kurulduktan sonra uygulamanın kendi hacim analizi zaten doğrulayabiliyor.
 * Sıklık arttıkça seans başına set azalıyor, haftalık toplam korunuyor.
 */

export const STARTER_PROGRAMS = [
  {
    key: 'fullbody3',
    name: 'Full Body 3 Gün',
    level: 'Yeni başlayan',
    daysPerWeek: 3,
    summary: 'Her seansta tüm vücut; haftada 3 gün',
    rationale: 'Yeni başlayanda sınır hacim değil teknik ve toparlanma. Her kası haftada üç kez, az setle çalışmak hem tekrar sayısını hem öğrenme hızını artırıyor. Günler arasında en az bir gün boşluk kalacak şekilde yerleştirilir.',
    // Gün anahtarı -> gün indeksi. Araya dinlenme günü giriyor.
    schedule: { mon: 0, wed: 1, fri: 2 },
    days: [
      {
        name: 'Tam Vücut A',
        exercises: [
          { name: 'Barbell Back Squat', sets: 3 },
          { name: 'Barbell Bench Press', sets: 3 },
          { name: 'Seated Cable Row', sets: 3 },
          { name: 'Lateral Raise (Dumbbell)', sets: 3 },
          { name: 'Standing Calf Raise', sets: 3 },
          { name: 'Cable Crunch', sets: 3 },
        ],
      },
      {
        name: 'Tam Vücut B',
        exercises: [
          { name: 'Romanian Deadlift (RDL)', sets: 3 },
          { name: 'Lat Pulldown', sets: 4 },
          { name: 'Overhead Press (OHP)', sets: 3 },
          { name: 'Leg Press', sets: 3 },
          { name: 'Face Pull', sets: 3 },
          { name: 'Dumbbell Shrug', sets: 2 },
          { name: 'Standing Calf Raise', sets: 3 },
        ],
      },
      {
        name: 'Tam Vücut C',
        exercises: [
          { name: 'Leg Press', sets: 3 },
          { name: 'Incline Dumbbell Press', sets: 3 },
          { name: 'Chest Supported Row', sets: 4 },
          { name: 'Lateral Raise (Dumbbell)', sets: 3 },
          { name: 'Barbell Bicep Curl', sets: 2 },
          { name: 'Tricep Pushdown', sets: 2 },
          { name: 'Superman Hold', sets: 2 },
        ],
      },
    ],
  },

  {
    key: 'upperlower4',
    name: 'Üst / Alt 4 Gün',
    level: 'Orta',
    daysPerWeek: 4,
    summary: 'İki üst, iki alt vücut günü',
    rationale: 'Her kas grubu haftada iki kez çalışıyor ve seans başına set sayısı makul kalıyor. Orta seviyede hacim ihtiyacı artıyor ama tek seansta karşılanamıyor; ikiye bölmek en pratik çözüm.',
    schedule: { mon: 0, tue: 1, thu: 2, fri: 3 },
    days: [
      {
        name: 'Üst A (İtiş ağırlıklı)',
        exercises: [
          { name: 'Barbell Bench Press', sets: 4 },
          { name: 'Overhead Press (OHP)', sets: 3 },
          { name: 'Lat Pulldown', sets: 4 },
          { name: 'Lateral Raise (Dumbbell)', sets: 4 },
          { name: 'Rear Delt Fly (Dumbbell)', sets: 3 },
          { name: 'Tricep Pushdown', sets: 3 },
        ],
      },
      {
        name: 'Alt A (Diz ağırlıklı)',
        exercises: [
          { name: 'Barbell Back Squat', sets: 4 },
          { name: 'Romanian Deadlift (RDL)', sets: 3 },
          { name: 'Leg Extension', sets: 3 },
          { name: 'Standing Calf Raise', sets: 4 },
          { name: 'Cable Crunch', sets: 4 },
        ],
      },
      {
        name: 'Üst B (Çekiş ağırlıklı)',
        exercises: [
          { name: 'Barbell Row', sets: 5 },
          { name: 'Incline Dumbbell Press', sets: 4 },
          { name: 'Lat Pulldown', sets: 4 },
          { name: 'Cable Crossover', sets: 3 },
          { name: 'Face Pull', sets: 3 },
          { name: 'Dumbbell Shrug', sets: 3 },
          { name: 'Lateral Raise (Dumbbell)', sets: 4 },
          { name: 'Barbell Bicep Curl', sets: 3 },
        ],
      },
      {
        name: 'Alt B (Kalça ağırlıklı)',
        exercises: [
          { name: 'Hip Thrust', sets: 4 },
          { name: 'Bulgarian Split Squat', sets: 3 },
          { name: 'Lying Leg Curl', sets: 3 },
          { name: 'Leg Press', sets: 3 },
          { name: 'Standing Calf Raise', sets: 4 },
          { name: 'Hanging Leg Raise', sets: 3 },
        ],
      },
    ],
  },

  {
    key: 'ppl6',
    name: 'Push / Pull / Legs 6 Gün',
    level: 'İleri',
    daysPerWeek: 6,
    summary: 'İtiş, çekiş ve bacak; haftada iki tur',
    rationale: 'Yüksek hacmi altı güne yaymak seans başına set sayısını düşük tutuyor, böylece son setlerin kalitesi korunuyor. Toparlanma talebi yüksek: uyku ve beslenme oturmadan sürdürmek zor.',
    schedule: { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5 },
    days: [
      {
        name: 'Push A',
        exercises: [
          { name: 'Barbell Bench Press', sets: 4 },
          { name: 'Overhead Press (OHP)', sets: 3 },
          { name: 'Incline Dumbbell Press', sets: 3 },
          { name: 'Lateral Raise (Dumbbell)', sets: 5 },
          { name: 'Tricep Pushdown', sets: 3 },
        ],
      },
      {
        name: 'Pull A',
        exercises: [
          { name: 'Pull-up', sets: 4 },
          { name: 'Barbell Row', sets: 3 },
          { name: 'Seated Cable Row', sets: 3 },
          { name: 'Face Pull', sets: 3 },
          { name: 'Barbell Shrug', sets: 3 },
          { name: 'Barbell Bicep Curl', sets: 3 },
        ],
      },
      {
        name: 'Legs A',
        exercises: [
          { name: 'Barbell Back Squat', sets: 4 },
          { name: 'Romanian Deadlift (RDL)', sets: 3 },
          { name: 'Leg Press', sets: 3 },
          { name: 'Lying Leg Curl', sets: 3 },
          { name: 'Standing Calf Raise', sets: 5 },
          { name: 'Cable Crunch', sets: 3 },
        ],
      },
      {
        name: 'Push B',
        exercises: [
          { name: 'Incline Dumbbell Press', sets: 4 },
          { name: 'Dips', sets: 3 },
          { name: 'Cable Crossover', sets: 3 },
          { name: 'Lateral Raise (Dumbbell)', sets: 5 },
          { name: 'Skull Crusher', sets: 3 },
        ],
      },
      {
        name: 'Pull B',
        exercises: [
          { name: 'Lat Pulldown', sets: 4 },
          { name: 'Chest Supported Row', sets: 3 },
          { name: 'Rear Delt Fly (Dumbbell)', sets: 3 },
          { name: 'Barbell Shrug', sets: 3 },
          { name: 'Hammer Curl', sets: 3 },
          { name: 'Hanging Leg Raise', sets: 3 },
        ],
      },
      {
        name: 'Legs B',
        exercises: [
          { name: 'Hip Thrust', sets: 4 },
          { name: 'Bulgarian Split Squat', sets: 3 },
          { name: 'Leg Extension', sets: 3 },
          { name: 'Lying Leg Curl', sets: 3 },
          { name: 'Standing Calf Raise', sets: 5 },
          { name: 'Reverse Hyperextension', sets: 3 },
        ],
      },
    ],
  },
];

export const findStarterProgram = (key) =>
  STARTER_PROGRAMS.find(p => p.key === key) || null;

/**
 * Programı uygulamanın kendi biçimine çevirir: şablonlar + haftalık plan.
 *
 * Şablon adlarının önüne program adı geliyor ("Üst / Alt 4 Gün — Üst A"),
 * çünkü kullanıcı birden fazla program kurabiliyor ve şablon listesinde
 * "Üst A" tek başına hangi programa ait olduğunu söylemiyor.
 *
 * @param generateId kimlik üreteci (helpers.generateId)
 * @returns { templates, plan }
 */
export const instantiateStarterProgram = (program, generateId) => {
  if (!program) return null;

  const templates = program.days.map(day => ({
    id: generateId(),
    name: `${program.name} — ${day.name}`,
    createdAt: new Date().toISOString(),
    // Setler boş ağırlıkla açılıyor: hedefi uygulama ilk seanstan sonra
    // geçmişten öğreniyor, uydurma bir başlangıç ağırlığı vermek yanlış olurdu.
    exercises: day.exercises.map(ex => ({
      name: ex.name,
      supersetId: null,
      sets: Array.from({ length: ex.sets }, () => ({
        weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal',
      })),
    })),
  }));

  const days = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
  Object.entries(program.schedule).forEach(([dayKey, index]) => {
    const template = templates[index];
    if (!template) return;
    days[dayKey] = [{ id: generateId(), type: 'workout', templateId: template.id, time: '' }];
  });

  return {
    templates,
    plan: { id: generateId(), name: program.name, days },
  };
};
