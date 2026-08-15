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
    <div role="dialog" aria-modal="true" aria-label="Beslenme şablonları ve tarifler" className="fixed inset-0 z-[108] bg-black/90 backdrop-blur-sm flex flex-col">
      <header className="pt-safe px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-orange-400">Beslenme Kütüphanesi</span>
          <h2 className="text-sm font-black text-zinc-100">Şablonlar & Tarifler</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Şablonları kapat" className="p-2 text-zinc-400"><X size={19} /></button>
      </header>

      <div className="grid grid-cols-3 gap-1.5 p-3 bg-zinc-950 border-b border-zinc-800">
        {[
          { key: 'saved', label: 'Kayıtlılar', icon: BookOpen },
          { key: 'day', label: 'Gün Kaydet', icon: CalendarDays },
          { key: 'recipe', label: 'Tarif Yap', icon: ChefHat },
        ].map(item => {
          const Icon = item.icon;
          return <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`rounded-xl border py-2 text-[10px] font-bold flex items-center justify-center gap-1.5 ${tab === item.key ? 'border-orange-600 bg-orange-950/30 text-orange-400' : 'border-zinc-800 text-zinc-500'}`}><Icon size={13} />{item.label}</button>;
        })}
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe">
        {notice && <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-[10px] font-bold text-emerald-400">{notice}</div>}

        {tab === 'saved' && (
          <>
            {mealTemplates.length === 0 && dayTemplates.length === 0 && (
              <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center">
                <Utensils size={24} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-xs font-bold text-zinc-400">Henüz kayıtlı şablon yok</p>
                <p className="text-[9px] font-mono text-zinc-600 mt-1">Sık yediğin bir öğünü, bütün bir günü veya tarifi bir kez kaydet.</p>
              </div>
            )}
            {dayTemplates.map(template => {
              const summary = dailyTotals(template);
              return (
                <article key={template.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div><span className="text-[9px] font-bold text-cyan-400 uppercase">Gün Şablonu</span><h3 className="text-xs font-bold text-zinc-100">{template.name}</h3><p className="text-[9px] font-mono text-zinc-500">{template.meals?.length || 0} öğün · {summary.calories} kcal</p></div>
                    <button type="button" onClick={() => setDayTemplates(prev => prev.filter(item => item.id !== template.id))} aria-label={`${template.name} şablonunu sil`} className="p-2 text-zinc-600 active:text-red-500"><Trash2 size={13} /></button>
                  </div>
                  <button type="button" onClick={() => applyDay(template)} className="w-full mt-2 rounded-xl bg-cyan-950/30 border border-cyan-900/50 py-2 text-[10px] font-bold text-cyan-400">Bu Güne Uygula</button>
                </article>
              );
            })}
            {mealTemplates.map(template => (
              <article key={template.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div><span className="text-[9px] font-bold text-orange-400 uppercase">{template.kind === 'recipe' ? `${template.servings} porsiyonluk tarif` : 'Öğün Şablonu'}</span><h3 className="text-xs font-bold text-zinc-100">{template.name}</h3><p className="text-[9px] font-mono text-zinc-500">1 porsiyon · {template.meal?.calories || 0} kcal · P {template.meal?.protein || 0}</p></div>
                  <button type="button" onClick={() => setMealTemplates(prev => prev.filter(item => item.id !== template.id))} aria-label={`${template.name} şablonunu sil`} className="p-2 text-zinc-600 active:text-red-500"><Trash2 size={13} /></button>
                </div>
                <button type="button" onClick={() => applyMeal(template)} className="w-full mt-2 rounded-xl bg-orange-950/30 border border-orange-900/50 py-2 text-[10px] font-bold text-orange-400"><Plus size={12} className="inline mr-1" />Bugüne Ekle</button>
              </article>
            ))}
          </>
        )}

        {tab === 'day' && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <div><h3 className="text-sm font-bold text-zinc-100">Bugünün düzenini kaydet</h3><p className="text-[9px] font-mono text-zinc-500 mt-1">{meals.length} öğün · {totals.calories} kcal. Günlük hareket ve kalori hesabı şablona alınmaz.</p></div>
            <input value={name} onChange={event => setName(event.target.value)} placeholder="Örn: Antrenman günü" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-100 outline-none focus:border-orange-500" />
            <button type="button" onClick={saveDay} disabled={meals.length === 0} className="w-full rounded-xl bg-orange-600 py-2.5 text-[11px] font-bold text-white disabled:opacity-40"><Save size={13} className="inline mr-1.5" />Gün Şablonunu Kaydet</button>
            <div className="border-t border-zinc-800 pt-3 space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Tek Öğün Kaydet</span>
              {meals.map(meal => <button key={meal.id} type="button" onClick={() => saveMeal(meal)} className="w-full flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-left"><span className="text-[10px] font-bold text-zinc-300 truncate">{meal.name}</span><Save size={12} className="text-orange-400 shrink-0" /></button>)}
            </div>
          </section>
        )}

        {tab === 'recipe' && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <div><h3 className="text-sm font-bold text-zinc-100">Öğünlerden tarif oluştur</h3><p className="text-[9px] font-mono text-zinc-500 mt-1">Bugündeki {meals.length} satır malzeme kabul edilir. Toplam değer seçtiğin porsiyon sayısına bölünür.</p></div>
            <input value={name} onChange={event => setName(event.target.value)} placeholder="Tarif adı" className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-100 outline-none focus:border-orange-500" />
            <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2"><span className="text-[10px] font-bold text-zinc-400">Kaç porsiyon?</span><input type="number" min="1" max="20" value={servings} onChange={event => setServings(Math.max(1, Math.min(20, Number(event.target.value) || 1)))} className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg py-1 text-center font-mono text-orange-400" /></label>
            <div className="grid grid-cols-4 gap-1.5 text-center">{[['Kcal', Math.round(totals.calories / servings)], ['Protein', Math.round(totals.protein / servings)], ['Karb.', Math.round(totals.carbs / servings)], ['Yağ', Math.round(totals.fats / servings)]].map(([label, value]) => <div key={label} className="rounded-lg bg-zinc-950 border border-zinc-800 py-2"><span className="text-[8px] text-zinc-600 block">{label}</span><strong className="text-[10px] font-mono text-zinc-300">{value}</strong></div>)}</div>
            <button type="button" onClick={saveRecipe} disabled={!name.trim() || meals.length === 0} className="w-full rounded-xl bg-orange-600 py-2.5 text-[11px] font-bold text-white disabled:opacity-40"><ChefHat size={13} className="inline mr-1.5" />Tarifi Kaydet</button>
          </section>
        )}
      </main>
    </div>
  );
});

NutritionTemplatesModal.displayName = 'NutritionTemplatesModal';
export default NutritionTemplatesModal;
