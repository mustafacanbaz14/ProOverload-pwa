import { parseNumber } from './number.js';
import { detectMuscleGroup, isWorkingSet } from './helpers.js';

/**
 * Seans öncesi ısınma rutini.
 *
 * Uygulamada ısınma vardı ama yalnızca TEK HAREKET için: plaka hesaplayıcı
 * çalışma ağırlığına göre bir piramit üretiyordu. Seansın kendisinin ısınması
 * yoktu — oysa ilk ağır sete girmeden önce yapılan genel hazırlık, o
 * piramitten bağımsız ve ondan önce geliyor.
 *
 * Rutin seansın KASLARINDAN türetiliyor, sabit bir liste değil: bacak günüyle
 * itiş gününün hazırlığı aynı değil. Üç bölüm var ve sırası bilinçli:
 *
 *  1. NABIZ. Kısa genel ısınma; dokuların sıcaklığı ve kan akışı artıyor.
 *  2. HAREKETLİLİK. O seansta yüklenecek eklemlerin dinamik açılması.
 *     Statik esneme bilerek YOK: ağır set öncesi uzun statik esneme, kuvvet
 *     çıktısını geçici olarak düşürüyor.
 *  3. AKTİVASYON. Seansın ana hareketinin küçük ama sık ihmal edilen
 *     destekçileri.
 */

// Süreler dakika. Toplamı bilinçli olarak kısa: on dakikayı geçen bir ısınma
// çoğu kişide yapılmıyor ve yapılmayan rutinin faydası sıfır.
const PULSE = { key: 'pulse', label: 'Nabız', minutes: 4 };

/**
 * Kas grubuna göre hareketlilik ve aktivasyon önerileri.
 *
 * Hareket adları serbest metin: bunlar kayda geçen egzersizler değil, ısınma
 * talimatları. Kütüphaneye bağlamak, kütüphanede olmayan bir şeyi zorunlu
 * kılardı.
 */
const PREP = {
  'Göğüs': {
    mobility: ['Bant ile omuz dış rotasyonu 15 tekrar', 'Duvar göğüs açma 30 sn/taraf'],
    activation: ['Bant ile göğüs sıkma 20 tekrar', 'Şınav 10-15 tekrar'],
  },
  'Ön Omuz': {
    mobility: ['Kol çevirme 15 ileri / 15 geri', 'Sopa ile omuz geçişi 10 tekrar'],
    activation: ['Boş bar baş üstü basış 15 tekrar'],
  },
  'Yan Omuz': {
    mobility: ['Kol çevirme 15 ileri / 15 geri'],
    activation: ['Bant ile yan kaldırış 20 tekrar'],
  },
  'Arka Omuz': {
    mobility: ['Bant ile omuz dış rotasyonu 15 tekrar'],
    activation: ['Bant ile face pull 20 tekrar'],
  },
  'Kanat': {
    mobility: ['Ölü asılma 20-30 sn', 'Kedi-deve 10 tekrar'],
    activation: ['Skapular çekiş 12 tekrar'],
  },
  'Orta Sırt': {
    mobility: ['Göğüs omurga rotasyonu 8 tekrar/taraf'],
    activation: ['Bant ile kürek sıkma 20 tekrar'],
  },
  'Trapez': { mobility: ['Boyun yan esnetme 20 sn/taraf'], activation: [] },
  'Biseps': { mobility: [], activation: ['Hafif dambılla 15 tekrar curl'] },
  'Triseps': { mobility: ['Baş üstü triseps açma 20 sn/taraf'], activation: ['Bant ile pushdown 20 tekrar'] },
  'Quadriceps': {
    mobility: ['Vücut ağırlığıyla derin çömelme 10 tekrar', 'Ayak bileği duvara doğru itme 10 tekrar/taraf'],
    activation: ['Bant ile yan yürüyüş 15 adım/taraf'],
  },
  'Hamstring': {
    mobility: ['Bacak sallama 12 tekrar/taraf', 'Tek bacak menteşe 10 tekrar/taraf'],
    activation: ['Kalça köprüsü 15 tekrar'],
  },
  'Kalça': {
    mobility: ['90/90 kalça geçişi 8 tekrar/taraf'],
    activation: ['Bant ile kalça açma 20 tekrar', 'Kalça köprüsü 15 tekrar'],
  },
  'Baldır': { mobility: ['Ayak bileği çevirme 10 tekrar/taraf'], activation: ['Vücut ağırlığıyla topuk kaldırma 20 tekrar'] },
  'Karın': { mobility: ['Kedi-deve 10 tekrar'], activation: ['Ölü böcek 10 tekrar/taraf'] },
  'Bel': {
    mobility: ['Kedi-deve 10 tekrar', 'Kalça menteşesi tekniği 10 tekrar (boş bar)'],
    activation: ['Kuş-köpek 10 tekrar/taraf'],
  },
  'Önkol': { mobility: ['Bilek çevirme 15 tekrar'], activation: [] },
};

// Bir kasın rutine girmesi için seansta en az bu kadar set alması gerekiyor;
// yarım set katkı alan her kası ısıtmaya çalışmak rutini kullanılmaz uzunlukta
// yapıyordu.
const MIN_SETS_FOR_PREP = 2;

/**
 * Seansın hareketlerinden ısınma rutini üretir.
 *
 * @param exercises  şablon ya da aktif antrenman hareketleri
 * @returns { blocks, minutes, muscles, hasData }
 */
export const buildWarmupRoutine = (exercises = [], { customExercises = [] } = {}) => {
  const kasSet = new Map();

  (exercises || []).forEach(ex => {
    if (!ex?.name) return;
    const adet = Array.isArray(ex.sets)
      ? ex.sets.filter(isWorkingSet).length
      : Math.max(0, Math.round(parseNumber(ex.sets)));
    if (adet === 0) return;
    const { contributions } = detectMuscleGroup(ex.name, customExercises);
    Object.entries(contributions || {}).forEach(([kas, agirlik]) => {
      // Yalnızca birincil ve belirgin katkılar; çeyrek katkı ısınma gerektirmiyor.
      if (parseNumber(agirlik) < 0.5) return;
      kasSet.set(kas, (kasSet.get(kas) || 0) + adet * parseNumber(agirlik));
    });
  });

  const kaslar = [...kasSet.entries()]
    .filter(([, v]) => v >= MIN_SETS_FOR_PREP)
    .sort((a, b) => b[1] - a[1])
    .map(([kas]) => kas);

  if (kaslar.length === 0) return { blocks: [], minutes: 0, muscles: [], hasData: false };

  const benzersiz = (liste) => [...new Set(liste)];
  const mobility = benzersiz(kaslar.flatMap(k => PREP[k]?.mobility || [])).slice(0, 5);
  const activation = benzersiz(kaslar.flatMap(k => PREP[k]?.activation || [])).slice(0, 3);

  const blocks = [
    {
      ...PULSE,
      items: ['5-6 dakika hafif kardiyo — bisiklet, eliptik ya da tempolu yürüyüş. Nefes açılmalı ama zorlanmamalısın.'],
    },
    {
      key: 'mobility', label: 'Hareketlilik', minutes: 3, items: mobility,
      note: 'Dinamik hareketler. Ağır set öncesi uzun statik esneme kuvvet çıktısını geçici olarak düşürdüğü için burada yer almıyor.',
    },
    {
      key: 'activation', label: 'Aktivasyon', minutes: 2, items: activation,
      note: 'Hafif yük, yüksek tekrar. Amaç yormak değil, hedef kasla teması kurmak.',
    },
  ].filter(b => b.items.length > 0);

  return {
    blocks,
    minutes: blocks.reduce((t, b) => t + b.minutes, 0),
    muscles: kaslar,
    hasData: true,
    // Hareket bazlı ısınma piramidi buna EK: bu rutin seansın tamamı için,
    // piramit ilk ağır hareket için.
    note: 'Bu rutin seansın tamamı için. İlk ağır hareketin kendi ısınma piramidi ayrıca yapılır — plaka hesaplayıcı onu üretiyor.',
  };
};
