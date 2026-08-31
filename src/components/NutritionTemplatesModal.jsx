import React, { memo, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, ChefHat, Plus, Save, Trash2, Utensils, X } from 'lucide-react';
import { dailyTotals } from '../utils/nutritionStats';
import {
  createDayTemplate, createMealTemplate, createRecipeTemplate,
  instantiateDayTemplate, instantiateMealTemplate,
} from '../utils/nutritionTemplates';
import { generateId } from '../utils/helpers';

const NutritionTemplatesModal = memo(({
  isOpen,
  onClose,
  currentNutritionForm,
  setCurrentNutritionForm,
  mealTemplates = [],
  setMealTemplates,
  dayTemplates = [],
  setDayTemplates,
}) => {
  const [tab, setTab] = useState('saved');
  const [name, setName] = useState('');
  const [servings, setServings] = useState(2);
  const [notice, setNotice] = useState('');
  const meals = Array.isArray(currentNutritionForm?.meals) ? currentNutritionForm.meals : [];
  const totals = useMemo(() => dailyTotals(currentNutritionForm), [currentNutritionForm]);

  if (!isOpen) return null;

  const inform = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  };

  const saveDay = () => {
    if (meals.length === 0) return;
    const template = createDayTemplate(currentNutritionForm, name || 'Standart Günüm', generateId);
    setDayTemplates(prev => [template, ...prev]);
    setName('');
    inform('Gün şablonu kaydedildi.');
  };

  const saveMeal = (meal) => {
    setMealTemplates(prev => [createMealTemplate(meal, meal.name, generateId), ...prev]);
    inform('Öğün şablonu kaydedildi.');
  };

  const saveRecipe = () => {
    if (!name.trim() || meals.length === 0) return;
    setMealTemplates(prev => [createRecipeTemplate(name, meals, servings, generateId), ...prev]);
    setName('');
    inform('Tarif porsiyon hesabıyla kaydedildi.');
  };

  const applyMeal = (template) => {
    setCurrentNutritionForm(prev => ({
      ...prev,
      entryMode: 'meals',
      meals: [...(prev.meals || []), instantiateMealTemplate(template, generateId)],
    }));
    inform('Öğün bugüne eklendi.');
  };

  const applyDay = (template) => {
    const instance = instantiateDayTemplate(template, currentNutritionForm.date, generateId);
    setCurrentNutritionForm(prev => ({ ...prev, ...instance, energySnapshot: null }));
    inform('Gün içeriği uygulandı; hareket ayarları korunmadı.');
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="nutrition-templates-title" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[108] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[88dvh] shadow-2xl shadow-black/80">
        <header className="luxury-header px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div>
            <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-orange-400">Beslenme Kütüphanesi</span>
            <h2 id="nutrition-templates-title" className="text-[12px] font-black text-zinc-100 uppercase tracking-wider">Şablonlar & Tarifler</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Şablonları kapat" className="luxury-icon-button"><X size={18} /></button>
        </header>

        <div className="p-3.5 bg-zinc-950/95 border-b border-zinc-800/80 shrink-0">
          <div className="luxury-segmented grid grid-cols-3 gap-1 bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
            {[
              { key: 'saved', label: 'Kayıtlılar', icon: BookOpen },
              { key: 'day', label: 'Gün Kaydet', icon: CalendarDays },
              { key: 'recipe', label: 'Tarif Yap', icon: ChefHat },
            ].map(item => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`rounded-xl py-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${active ? 'bg-orange-700 text-white shadow-md shadow-orange-950/40' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Icon size={13} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-3.5 pb-safe">
          {notice && <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/40 px-3.5 py-2.5 text-[10px] font-bold text-emerald-300 shadow-sm backdrop-blur-sm">{notice}</div>}

          {tab === 'saved' && (
            <>
              {mealTemplates.length === 0 && dayTemplates.length === 0 && (
                <div className="rounded-3xl border border-dashed border-zinc-800 p-8 text-center bg-zinc-900/30">
                  <Utensils size={24} className="mx-auto text-zinc-500 mb-2" />
                  <p className="text-xs font-bold text-zinc-300">Henüz kayıtlı şablon yok</p>
                  <p className="text-[9px] font-mono text-zinc-500 mt-1 leading-relaxed">Sık yediğin bir öğünü, bütün bir günü veya tarifi bir kez kaydet.</p>
                </div>
              )}
              {dayTemplates.map(template => {
                const summary = dailyTotals(template);
                return (
                  <article key={template.id} className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-2 backdrop-blur-sm shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div><span className="text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">Gün Şablonu</span><h3 className="text-xs font-black text-zinc-100">{template.name}</h3><p className="text-[9px] font-mono text-zinc-500 mt-0.5">{template.meals?.length || 0} öğün · {summary.calories} kcal</p></div>
                      <button type="button" onClick={() => setDayTemplates(prev => prev.filter(item => item.id !== template.id))} aria-label={`${template.name} şablonunu sil`} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                    <button type="button" onClick={() => applyDay(template)} className="w-full mt-2 rounded-2xl bg-cyan-950/40 border border-cyan-900/60 py-2.5 text-[10px] font-black uppercase tracking-wider text-cyan-300 active:scale-[0.98] transition-all">Bu Güne Uygula</button>
                  </article>
                );
              })}
              {mealTemplates.map(template => (
                <article key={template.id} className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-2 backdrop-blur-sm shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div><span className="text-[8px] font-mono font-bold text-orange-400 uppercase tracking-widest block">{template.kind === 'recipe' ? `${template.servings} porsiyonluk tarif` : 'Öğün Şablonu'}</span><h3 className="text-xs font-black text-zinc-100">{template.name}</h3><p className="text-[9px] font-mono text-zinc-500 mt-0.5">1 porsiyon · {template.meal?.calories || 0} kcal · P {template.meal?.protein || 0}</p></div>
                    <button type="button" onClick={() => setMealTemplates(prev => prev.filter(item => item.id !== template.id))} aria-label={`${template.name} şablonunu sil`} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <button type="button" onClick={() => applyMeal(template)} className="w-full mt-2 rounded-2xl bg-orange-950/40 border border-orange-900/60 py-2.5 text-[10px] font-black uppercase tracking-wider text-orange-300 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"><Plus size={13} />Bugüne Ekle</button>
                </article>
              ))}
            </>
          )}

          {tab === 'day' && (
            <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-3.5 backdrop-blur-sm shadow-sm">
              <div><h3 className="text-xs font-black text-zinc-100 uppercase tracking-wide">Bugünün düzenini kaydet</h3><p className="text-[9px] font-mono text-zinc-500 mt-1">{meals.length} öğün · {totals.calories} kcal. Günlük hareket ve kalori hesabı şablona alınmaz.</p></div>
              <input value={name} onChange={event => setName(event.target.value)} placeholder="Örn: Antrenman günü" className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-orange-500 transition-colors" />
              <button type="button" onClick={saveDay} disabled={meals.length === 0} className="w-full rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 py-3 text-[11px] font-black uppercase tracking-wider text-white disabled:opacity-40 shadow-lg shadow-orange-950/50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"><Save size={14} />Gün Şablonunu Kaydet</button>
              <div className="border-t border-zinc-800/80 pt-3.5 space-y-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 block px-1">Tek Öğün Kaydet</span>
                {meals.map(meal => <button key={meal.id} type="button" onClick={() => saveMeal(meal)} className="w-full flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950/70 px-3.5 py-2.5 text-left active:scale-[0.98] transition-all"><span className="text-[10px] font-bold text-zinc-200 truncate">{meal.name}</span><Save size={13} className="text-orange-400 shrink-0" /></button>)}
              </div>
            </section>
          )}

          {tab === 'recipe' && (
            <section className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-3.5 backdrop-blur-sm shadow-sm">
              <div><h3 className="text-xs font-black text-zinc-100 uppercase tracking-wide">Öğünlerden tarif oluştur</h3><p className="text-[9px] font-mono text-zinc-500 mt-1">Bugündeki {meals.length} satır malzeme kabul edilir. Toplam değer seçtiğin porsiyon sayısına bölünür.</p></div>
              <input value={name} onChange={event => setName(event.target.value)} placeholder="Tarif adı" className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 outline-none focus:border-orange-500 transition-colors" />
              <label className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5"><span className="text-[10px] font-bold text-zinc-400">Kaç porsiyon?</span><input type="number" inputMode="decimal" min="1" max="20" value={servings} onChange={event => setServings(Math.max(1, Math.min(20, Number(event.target.value) || 1)))} className="w-16 bg-zinc-900 border border-zinc-800 rounded-xl py-1 text-center font-mono text-orange-400 font-bold" /></label>
              <div className="grid grid-cols-4 gap-1.5 text-center">{[['Kcal', Math.round(totals.calories / servings)], ['Protein', Math.round(totals.protein / servings)], ['Karb.', Math.round(totals.carbs / servings)], ['Yağ', Math.round(totals.fats / servings)]].map(([label, value]) => <div key={label} className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 py-2"><span className="text-[8px] font-mono text-zinc-500 uppercase block">{label}</span><strong className="text-[11px] font-mono text-zinc-200 font-black">{value}</strong></div>)}</div>
              <button type="button" onClick={saveRecipe} disabled={!name.trim() || meals.length === 0} className="w-full rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 py-3 text-[11px] font-black uppercase tracking-wider text-white disabled:opacity-40 shadow-lg shadow-orange-950/50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"><ChefHat size={14} />Tarifi Kaydet</button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
});

NutritionTemplatesModal.displayName = 'NutritionTemplatesModal';
export default NutritionTemplatesModal;
