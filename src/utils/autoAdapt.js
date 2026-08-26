import { parseNumber } from './number.js';

/**
 * Otomatik haftalık program uyarlaması.
 *
 * Uygulama geçen haftanın ne söylediğini biliyordu: hangi kas eşiğin altında,
 * hangisi tavanı aşmış, hangi hareket durmuş, toparlanma nasıl. Ama bu
 * bilgiyi PLANA uygulamak tamamen elle yapılıyordu — kullanıcı beş ekranı
 * gezip şablonları tek tek açıp set sayılarını değiştiriyordu. Pratikte
 * kimse yapmıyor, yani ölçümlerin çoğu okunup unutuluyordu.
 *
 * Bu modül ölçümleri SOMUT DEĞİŞİKLİK ÖNERİLERİNE çeviriyor: hangi şablonda
 * hangi harekete kaç set eklenecek ya da çıkarılacak. Öneriler tek tek
 * onaylanıyor; hiçbiri kendiliğinden uygulanmıyor.
 *
 * NEDEN OTOMATİK UYGULANMIYOR: program kullanıcının kararı ve sessizce
 * değişen bir program güvenilmez bir programdır. Uygulamanın işi değişikliği
 * hazırlamak, onaylamak değil.
 */

// Bir seferde en fazla bu kadar set ekleniyor. Hacmi bir haftada iki katına
// çıkarmak toparlanmayı zorlar ve neyin işe yaradığı anlaşılamaz.
const MAX_ADD_PER_WEEK = 4;
const MAX_REMOVE_PER_WEEK = 6;

/**
 * Değişiklik önerileri.
 *
 * @param sources { volumeStatuses, plateaus, frequency, formCurve }
 */
export const buildAdaptations = (sources = {}, templates = [], {
  customExercises = [], detectMuscle = null,
} = {}) => {
  const oneriler = [];
  const kasHareketleri = new Map();

  // Hangi kas hangi şablonda hangi hareketten besleniyor.
  (templates || []).forEach(t => {
    (t.exercises || []).forEach(ex => {
      if (!ex?.name || !detectMuscle) return;
      const { muscle, contributions } = detectMuscle(ex.name, customExercises);
      // Birincil katkısı olmayan hareketten set eklemek/çıkarmak hedef kası
      // istenen kadar etkilemiyor; yalnızca birincil hareketler aday.
      if (parseNumber(contributions?.[muscle]) < 1) return;
      if (!kasHareketleri.has(muscle)) kasHareketleri.set(muscle, []);
      kasHareketleri.get(muscle).push({
        templateId: t.id,
        templateName: t.name,
        exercise: ex.name,
        sets: (ex.sets || []).length,
      });
    });
  });

  // 1. Eşiğin altındaki kaslara set ekle.
  (sources.volumeStatuses || [])
    .filter(s => s?.status === 'below' && parseNumber(s.volume) > 0)
    .forEach(s => {
      const adaylar = kasHareketleri.get(s.muscle) || [];
      if (adaylar.length === 0) {
        oneriler.push({
          key: `add-missing-${s.muscle}`,
          kind: 'note',
          muscle: s.muscle,
          title: `${s.muscle} için programda hareket yok`,
          detail: `Haftalık ${s.volume} set koruma eşiğinin (${s.mev}) altında ve şablonlarında bu kası BİRİNCİL olarak çalıştıran hareket yok. Set eklenecek yer olmadığı için bu düzeltme elle yapılmalı: önce bir hareket eklemek gerekiyor.`,
          manual: true,
        });
        return;
      }
      const eksik = Math.min(MAX_ADD_PER_WEEK, Math.ceil(s.mev - s.volume));
      // En az seti olan harekete ekleniyor: hacmi dengeli dağıtmak, tek
      // hareketi şişirmekten daha iyi bir uyaran dağılımı veriyor.
      const hedef = adaylar.slice().sort((a, b) => a.sets - b.sets)[0];
      oneriler.push({
        key: `add-${s.muscle}`,
        kind: 'addSets',
        muscle: s.muscle,
        templateId: hedef.templateId,
        templateName: hedef.templateName,
        exercise: hedef.exercise,
        amount: eksik,
        title: `${hedef.exercise}: +${eksik} set`,
        detail: `${s.muscle} haftalık ${s.volume} kesirli set ile eşiğin (${s.mev}) altında — bu, iki kanıt hattının da anlaştığı tek bölge. En az seti olan harekete ekleniyor; hacmi tek harekete yığmak yerine dağıtmak daha iyi uyaran veriyor. Bir haftada en fazla ${MAX_ADD_PER_WEEK} set ekleniyor — daha fazlası neyin işe yaradığını anlaşılmaz yapar.`,
      });
    });

  // 2. Tavanı aşan kaslardan set çıkar.
  (sources.volumeStatuses || [])
    .filter(s => s?.status === 'over')
    .forEach(s => {
      const adaylar = kasHareketleri.get(s.muscle) || [];
      if (adaylar.length === 0) return;
      const fazla = Math.min(MAX_REMOVE_PER_WEEK, Math.ceil(s.volume - s.mrv));
      const hedef = adaylar.slice().sort((a, b) => b.sets - a.sets)[0];
      const cikarilabilir = Math.min(fazla, Math.max(0, hedef.sets - 2));
      if (cikarilabilir <= 0) return;
      oneriler.push({
        key: `remove-${s.muscle}`,
        kind: 'removeSets',
        muscle: s.muscle,
        templateId: hedef.templateId,
        templateName: hedef.templateName,
        exercise: hedef.exercise,
        amount: cikarilabilir,
        title: `${hedef.exercise}: ${cikarilabilir} set çıkar`,
        detail: `${s.muscle} haftalık ${s.volume} kesirli set — bu hacimde ek fayda gösteren doğrudan bir deneme yok. Zararlı olduğu gösterilmedi; ama o setlerin karşılığı belirsiz ve zamanı kesin. En çok seti olan hareketten kısılıyor ve hiçbir hareket iki setin altına inmiyor.`,
      });
    });

  // 3. Durgun hareketler için varyant öner.
  (sources.plateaus?.items || [])
    .filter(p => p.status === 'stalling' || p.status === 'regressing')
    .slice(0, 2)
    .forEach(p => {
      const yer = (templates || []).find(t => (t.exercises || []).some(ex => ex.name === p.name));
      if (!yer) return;
      oneriler.push({
        key: `swap-${p.name}`,
        kind: 'swapSuggestion',
        muscle: p.muscle,
        templateId: yer.id,
        templateName: yer.name,
        exercise: p.name,
        title: `${p.name} için varyant dene`,
        detail: p.status === 'regressing'
          ? `En iyi değerinin %${p.dropPercent} altında. Önce toparlanmaya bakılmalı; sorun orada değilse aynı kası farklı bir açıyla yükleyen bir varyant uyaranı tazeliyor.`
          : `${p.sessionsSinceBest} seanstır ilerlemiyor. Varyanta geçmek kazandığın gücü korurken uyaranı tazeliyor; birkaç blok sonra bu harekete dönebilirsin.`,
        // Bir set değişikliği değil, bir karar önerisi: hangi varyanta
        // geçileceğini uygulama seçemez.
        manual: true,
      });
    });

  // 4. Tek güne yığılmış kasları böl.
  (sources.frequency?.concentrated || []).slice(0, 2).forEach(r => {
    oneriler.push({
      key: `split-${r.muscle}`,
      kind: 'splitSuggestion',
      muscle: r.muscle,
      title: `${r.muscle} hacmini ikiye böl`,
      detail: `${r.volume} setin tamamı tek günde. Aynı hacmi iki güne bölmek toplamı hiç artırmadan daha iyi sonuç veriyor. Hangi güne taşınacağı programın yapısına bağlı olduğu için bu değişiklik elle yapılmalı.`,
      manual: true,
    });
  });

  // 5. Form modeli aşırı yüklenme diyorsa hacim artışı ERTELENİYOR.
  const asiriYuk = Boolean(sources.formCurve?.overreached);

  return {
    items: asiriYuk
      // Yorgunluk zaten yüksekken hacim eklemek, modelin söylediğinin tam
      // tersi olurdu.
      ? oneriler.filter(o => o.kind !== 'addSets')
      : oneriler,
    hasData: oneriler.length > 0,
    deferred: asiriYuk ? oneriler.filter(o => o.kind === 'addSets').length : 0,
    overreached: asiriYuk,
    applicable: oneriler.filter(o => !o.manual).length,
  };
};

/**
 * Onaylanan öneriyi şablonlara uygular.
 *
 * @returns yeni şablon listesi (değişiklik yoksa aynısı)
 */
export const applyAdaptation = (templates = [], suggestion, generateId) => {
  if (!suggestion?.templateId || suggestion.manual) return templates;
  if (suggestion.kind !== 'addSets' && suggestion.kind !== 'removeSets') return templates;

  return (templates || []).map(t => {
    if (t.id !== suggestion.templateId) return t;
    return {
      ...t,
      exercises: (t.exercises || []).map(ex => {
        if (ex.name !== suggestion.exercise) return ex;
        const mevcut = ex.sets || [];
        if (suggestion.kind === 'addSets') {
          const yeni = Array.from({ length: suggestion.amount }, () => ({
            id: generateId(), weight: '', reps: '', rir: 2, tempo: '', formRating: 8, setType: 'normal',
          }));
          return { ...ex, sets: [...mevcut, ...yeni] };
        }
        // Çıkarmada en az iki set korunuyor.
        const kalacak = Math.max(2, mevcut.length - suggestion.amount);
        return { ...ex, sets: mevcut.slice(0, kalacak) };
      }),
    };
  });
};
