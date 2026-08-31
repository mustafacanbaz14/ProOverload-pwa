import React, { memo, useState, useMemo } from 'react';
import {
  Merge, Target, ArrowLeftRight,
  X, Wrench, Brain, Dumbbell, CalendarPlus, CalendarRange, HeartPulse,
  Trophy, Flame, Calculator, ArrowRightLeft, Ruler, Moon, BatteryLow, Sparkles, ClipboardCheck, CalendarDays,
  Layers3, Wand2, Activity, Stethoscope, ShieldCheck, BookCheck, GitCompareArrows, FlaskConical, BookOpen, Search,
} from 'lucide-react';
import { foldForSearch } from '../utils/helpers';

/**
 * Araçlar merkezi.
 *
 * Ana sayfa zamanla yan yana yığılmış yedi düğmeyle ikinci bir gezinme çubuğuna
 * dönüşmüştü. Araçlar burada gruplanıyor; ana sayfada tek giriş kalıyor.
 *
 * Not: buradaki girişler diğer sekmelerdeki kısayolları KALDIRMAZ. Kalori
 * detayına Beslenme'den, ölçüm kıyaslamasına Vücut'tan ulaşmak hâlâ mümkün —
 * bir aracın birden fazla yerden açılması kullanıcıyı yormuyor, aksine
 * bulunduğu bağlamda erişim sağlıyor.
 */
const GROUPS = [
  {
    title: 'Antrenman',
    items: [
      { key: 'library', label: 'Hareket Kütüphanesi', hint: '250+ hareket, kas eşlemesi düzenleme', icon: Dumbbell, color: 'text-cyan-400' },
      { key: 'wizard', label: 'Program Sihirbazı', hint: 'Gün, ekipman ve önceliğe göre program üret', icon: Wand2, color: 'text-violet-400' },
      { key: 'starter', label: 'Hazır Programlar', hint: 'Full Body, Üst/Alt, PPL — tek dokunuşla kur', icon: Sparkles, color: 'text-amber-400' },
      { key: 'mesocycle', label: 'Mezosiklik', hint: 'Blok planı: hacim haftadan haftaya artar, sonda boşalır', icon: Layers3, color: 'text-cyan-400' },
      { key: 'builder', label: 'Program Oluştur', hint: 'Gün gün şablon yaz', icon: CalendarPlus, color: 'text-emerald-400' },
      { key: 'weekPlan', label: 'Haftalık Programlar', hint: 'Çoklu program, saatli kardiyo, çakışma asistanı', icon: CalendarRange, color: 'text-cyan-400' },
      { key: 'plates', label: 'Plaka Hesaplayıcı', hint: 'Bar yüklemesi ve ısınma setleri', icon: Calculator, color: 'text-amber-400' },
      { key: 'deload', label: 'Deload', hint: 'Boşaltma haftası kur; hedefler otomatik ölçeklenir', icon: BatteryLow, color: 'text-amber-400' },
    ],
  },
  {
    title: 'Enerji & Beslenme',
    items: [
      { key: 'cardio', label: 'Kardiyo / Aktivite Ekle', hint: 'Kondisyon, spor ve günlük aktiviteler', icon: HeartPulse, color: 'text-red-400' },
      { key: 'energy', label: 'Kalori Detayı', hint: 'Gün gün, hafta hafta harcama dökümü', icon: Flame, color: 'text-red-400' },
    ],
  },
  {
    title: 'Toparlanma',
    items: [
      { key: 'coach', label: 'Koç Merkezi', hint: 'Haftalık karar, veri güveni ve protokol geçmişi', icon: ShieldCheck, color: 'text-emerald-400' },
      { key: 'sleep', label: 'Uyku Takibi', hint: 'Yatış/uyanış saati, 100 üzerinden puan', icon: Moon, color: 'text-purple-400' },
      { key: 'pain', label: 'Ağrı Takibi', hint: 'Bölge bölge eklem ağrısı, trend ve hareket ilişkisi', icon: Activity, color: 'text-red-400' },
      { key: 'mind', label: 'Meditasyon & Esneme', hint: 'Günlük, haftalık, aylık log', icon: Brain, color: 'text-cyan-400' },
      { key: 'coachLedger', label: 'Koç Karar Defteri', hint: 'Uyguladığın tavsiyeler işe yaradı mı — ölçülmüş cevap', icon: BookCheck, color: 'text-emerald-400' },
    ],
  },
  {
    title: 'Ölçüm & Rapor',
    items: [
      { key: 'compare', label: 'Dönemsel Kıyaslama', hint: 'İki ölçümü yan yana karşılaştır', icon: ArrowRightLeft, color: 'text-cyan-400' },
      { key: 'guide', label: 'Ölçüm Rehberi', hint: 'Çevre ve kaliper ölçüm teknikleri', icon: Ruler, color: 'text-zinc-400' },
      { key: 'weeklyReview', label: 'Haftalık Gözden Geçirme', hint: 'Haftayı kapat, gelecek hafta için ayar al', icon: ClipboardCheck, color: 'text-emerald-400' },
      { key: 'dataHealth', label: 'Veri Sağlığı', hint: 'Aykırı değer, yarım kalmış set ve kopya kayıt taraması', icon: Stethoscope, color: 'text-emerald-400' },
      { key: 'mergeExercises', label: 'Hareket Birleştir', hint: 'Aynı hareketin iki kaydını tek isimde topla, geçmişi aktar', icon: Merge, color: 'text-amber-400' },
      { key: 'volumeTargets', label: 'Hacim Hedefleri', hint: 'Kas başına kendi hacim bandını yaz', icon: Target, color: 'text-cyan-400' },
      { key: 'compareExercises', label: 'Hareket Karşılaştır', hint: 'İki hareketin ilerlemesini yan yana koy', icon: ArrowLeftRight, color: 'text-cyan-400' },
      { key: 'autoAdapt', label: 'Programı Güncelle', hint: 'Geçen haftanın ölçümlerini plana uygula', icon: Wand2, color: 'text-violet-400' },
      { key: 'yearReview', label: 'Yıl Özeti', hint: 'Son on iki ayın tamamı tek ekranda', icon: Trophy, color: 'text-yellow-400' },
      { key: 'blockCompare', label: 'Blok Karşılaştırma', hint: 'Son iki blok: ne değişti, ne üretti', icon: GitCompareArrows, color: 'text-cyan-400' },
      { key: 'scenario', label: 'Senaryo', hint: '"Şu kasa iki set eklesem ne olur" sorusunun cevabı', icon: FlaskConical, color: 'text-violet-400' },
      { key: 'evidence', label: 'Kanıt Defteri', hint: 'Uygulamanın kullandığı her sayı, kaynağı ve karşı görüşü', icon: BookOpen, color: 'text-cyan-400' },
      { key: 'report', label: 'Gelişim Raporu', hint: 'Rekorlar ve dönem özeti', icon: Trophy, color: 'text-yellow-400' },
    ],
  },
];

const ToolsModal = memo(({ isOpen, onClose, onSelect, showCycle = false }) => {
  // Arama. Menü yirmi dokuz girişe çıktı ve dört başlık altında iki ekran
  // kaydırma gerektiriyordu: aradığını bilen kişi için gezinmek, bilmeyen için
  // de okumak zorlaşmıştı. Arama ikisini birden çözüyor — yazınca liste
  // daralıyor, yazmayınca gruplar olduğu gibi duruyor.
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');

  const gruplar = useMemo(() => {
    const tumu = GROUPS.map(group => ({
      ...group,
      items: showCycle && group.title === 'Toparlanma'
        ? [...group.items, { key: 'cycle', label: 'Döngü & Performans', hint: 'Belirti odaklı antrenman, kardiyo ve beslenme desteği', icon: CalendarDays, color: 'text-rose-400' }]
        : group.items,
    }));
    const q = foldForSearch(query).trim();
    const grouped = activeGroup === 'all' ? tumu : tumu.filter(group => group.title === activeGroup);
    if (!q) return grouped;
    return grouped
      .map(group => ({
        ...group,
        // Başlık, açıklama ve grup adı birlikte aranıyor: kullanıcı "kardiyo"
        // yazdığında grubun kendisi eşleşiyorsa içindekiler de gelmeli.
        items: group.items.filter(item =>
          foldForSearch(`${item.label} ${item.hint} ${group.title}`).includes(q)),
      }))
      .filter(group => group.items.length > 0);
  }, [activeGroup, query, showCycle]);

  if (!isOpen) return null;

  const sonucSayisi = gruplar.reduce((t, g) => t + g.items.length, 0);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tools-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[94] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-950 border-0 sm:border sm:border-zinc-800/90 rounded-none sm:rounded-3xl w-full max-w-md h-[100dvh] sm:h-auto sm:max-h-[90dvh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden">
        <div className="pt-safe px-4 py-3.5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/90 backdrop-blur-md shrink-0">
          <div className="min-w-0">
            <h3 id="tools-title" className="text-[13px] font-black text-zinc-100 tracking-tight flex items-center">
              <Wrench size={17} className="mr-2.5 text-cyan-400" /> Araçlar
            </h3>
            <span className="text-[9px] text-zinc-500 block mt-0.5">{sonucSayisi} yardımcı · kategori seç veya ara</span>
          </div>
          <button onClick={onClose} className="luxury-icon-button" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-zinc-800/70 shrink-0 space-y-2.5 bg-zinc-950/95">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim()) setActiveGroup('all');
              }}
              placeholder="Araç ara (örn. mezosiklik, kalori, deload)..."
              aria-label="Araçlarda ara"
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-zinc-100 font-mono outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar" aria-label="Araç kategorileri">
            {['all', ...GROUPS.map(group => group.title)].map(key => {
              const active = activeGroup === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setActiveGroup(key); setQuery(''); }}
                  aria-pressed={active}
                  className={`shrink-0 min-h-11 rounded-xl border px-3 text-[9px] font-bold transition-colors ${active ? 'border-cyan-700 bg-cyan-950/45 text-cyan-300' : 'border-zinc-800 bg-zinc-900 text-zinc-400'}`}
                >
                  {key === 'all' ? 'Tümü' : key}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 pb-safe">
          {sonucSayisi === 0 && (
            <p className="text-[10px] font-mono text-zinc-500 text-center py-8 leading-relaxed">
              &quot;{query}&quot; ile eşleşen araç bulunamadı.
            </p>
          )}
          {gruplar.map(group => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">{group.title}</h4>
              <div className="luxury-feature-card bg-gradient-to-br from-zinc-900/90 via-zinc-900/95 to-zinc-950 rounded-3xl border border-zinc-800/80 overflow-hidden divide-y divide-zinc-800/60 shadow-lg">
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => { onSelect(item.key); onClose(); }}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-zinc-800/60 hover:bg-zinc-800/30 transition-all text-left group"
                    >
                      <span className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center shrink-0 shadow-inner group-active:scale-95 transition-transform">
                        <Icon size={16} className={`${item.color} shrink-0`} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-[12px] font-bold text-zinc-100 block truncate leading-tight">{item.label}</span>
                        <span className="text-[10px] font-mono text-zinc-500 block truncate mt-0.5">{item.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <p className="text-[9px] font-mono text-zinc-500 leading-relaxed px-1">
            Bu araçların çoğuna ilgili sekmeden de ulaşabilirsin — kalori detayı
            Beslenme&apos;de, kıyaslama ve rehber Vücut&apos;ta duruyor.
          </p>
        </div>
      </div>
    </div>
  );
});

ToolsModal.displayName = 'ToolsModal';

export default ToolsModal;
