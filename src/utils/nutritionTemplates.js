import { parseNumber } from './number.js';
import { caloriesFromMacros } from './nutritionStats.js';

const copy = (value) => JSON.parse(JSON.stringify(value));

const cleanMeal = (meal = {}) => ({
  name: String(meal.name || 'Öğün').trim() || 'Öğün',
  calories: Math.round(parseNumber(meal.calories) || caloriesFromMacros(meal.protein, meal.carbs, meal.fats)),
  protein: parseNumber(meal.protein),
  carbs: parseNumber(meal.carbs),
  fats: parseNumber(meal.fats),
  ...(parseNumber(meal.fiber) > 0 ? { fiber: parseNumber(meal.fiber) } : {}),
  ...(parseNumber(meal.sugars) > 0 ? { sugars: parseNumber(meal.sugars) } : {}),
  ...(parseNumber(meal.sodium) > 0 ? { sodium: parseNumber(meal.sodium) } : {}),
  ...(meal.serving ? { serving: copy(meal.serving) } : {}),
  ...(meal.source ? { source: copy(meal.source) } : {}),
});

export const createMealTemplate = (meal, name, idFactory, createdAt = new Date().toISOString()) => ({
  id: idFactory(),
  kind: 'meal',
  name: String(name || meal?.name || 'Öğün Şablonu').trim() || 'Öğün Şablonu',
  createdAt,
  meal: cleanMeal(meal),
});

export const createRecipeTemplate = (
  name,
  ingredients = [],
  servings = 1,
  idFactory,
  createdAt = new Date().toISOString(),
) => {
  const safeServings = Math.max(1, Math.round(parseNumber(servings) || 1));
  const cleanedIngredients = ingredients.map(cleanMeal);
  const totals = cleanedIngredients.reduce((sum, meal) => ({
    calories: sum.calories + parseNumber(meal.calories),
    protein: sum.protein + parseNumber(meal.protein),
    carbs: sum.carbs + parseNumber(meal.carbs),
    fats: sum.fats + parseNumber(meal.fats),
    fiber: sum.fiber + parseNumber(meal.fiber),
    sugars: sum.sugars + parseNumber(meal.sugars),
    sodium: sum.sodium + parseNumber(meal.sodium),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugars: 0, sodium: 0 });
  const perServing = Object.fromEntries(Object.entries(totals).map(([key, value]) => [
    key,
    key === 'calories' ? Math.round(value / safeServings) : Math.round(value / safeServings * 10) / 10,
  ]));

  return {
    id: idFactory(),
    kind: 'recipe',
    name: String(name || 'Tarif').trim() || 'Tarif',
    createdAt,
    servings: safeServings,
    ingredients: cleanedIngredients,
    meal: {
      name: String(name || 'Tarif').trim() || 'Tarif',
      ...perServing,
      source: { type: 'recipe', label: 'Kayıtlı tarif' },
      serving: { amount: 1, unit: 'porsiyon' },
    },
  };
};

export const createDayTemplate = (record, name, idFactory, createdAt = new Date().toISOString()) => ({
  id: idFactory(),
  kind: 'day',
  name: String(name || 'Gün Şablonu').trim() || 'Gün Şablonu',
  createdAt,
  entryMode: record?.entryMode || 'meals',
  meals: (record?.meals || []).map(cleanMeal),
  waterMl: parseNumber(record?.waterMl),
});

export const instantiateMealTemplate = (template, idFactory) => ({
  ...copy(template?.meal || {}),
  id: idFactory(),
  source: {
    type: template?.kind === 'recipe' ? 'recipe' : 'template',
    label: template?.kind === 'recipe' ? 'Kayıtlı tarif' : 'Öğün şablonu',
    templateId: template?.id,
  },
});

export const instantiateDayTemplate = (template, date, idFactory) => ({
  date,
  entryMode: template?.entryMode || 'meals',
  meals: (template?.meals || []).map(meal => ({
    ...copy(meal),
    id: idFactory(),
    source: { type: 'day-template', label: 'Gün şablonu', templateId: template?.id },
  })),
  waterMl: parseNumber(template?.waterMl),
  // Günlük enerji/NEAT alanları kasıtlı olarak yoktur. Eski günün hareket
  // varsayımlarını yeni tarihe taşımak kalori geçmişini geriye dönük değiştirirdi.
});

