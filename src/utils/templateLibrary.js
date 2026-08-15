import { foldForSearch } from './helpers.js';

const timeOf = (value) => {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

/**
 * Şablon kütüphanesinin tek sıralama ve arama kuralı.
 * Favoriler önce, ardından en son kullanılanlar ve yeni oluşturulanlar gelir.
 * Arama yalnız ada değil, şablondaki hareketlere de bakar.
 */
export const organizeTemplates = (templates = [], { query = '', favoritesOnly = false } = {}) => {
  const folded = foldForSearch(query).trim();
  return (Array.isArray(templates) ? [...templates] : [])
    .filter(template => !favoritesOnly || template?.favorite)
    .filter(template => {
      if (!folded) return true;
      const haystack = [template?.name, ...(template?.exercises || []).map(ex => ex?.name)]
        .filter(Boolean)
        .join(' ');
      return foldForSearch(haystack).includes(folded);
    })
    .sort((a, b) => {
      if (Boolean(a?.favorite) !== Boolean(b?.favorite)) return a?.favorite ? -1 : 1;
      const used = timeOf(b?.lastUsedAt) - timeOf(a?.lastUsedAt);
      if (used) return used;
      const created = timeOf(b?.createdAt) - timeOf(a?.createdAt);
      if (created) return created;
      return String(a?.name || '').localeCompare(String(b?.name || ''), 'tr');
    });
};

export const toggleTemplateFavorite = (templates = [], id) =>
  templates.map(template => template.id === id
    ? { ...template, favorite: !template.favorite }
    : template);

export const markTemplateUsed = (templates = [], id, usedAt = new Date().toISOString()) =>
  templates.map(template => template.id === id
    ? {
      ...template,
      lastUsedAt: usedAt,
      useCount: Math.max(0, Number(template.useCount) || 0) + 1,
    }
    : template);

export const duplicateTemplate = (template, generateId, createdAt = new Date().toISOString()) => {
  if (!template || typeof generateId !== 'function') return null;
  return {
    ...template,
    id: generateId(),
    name: `${template.name || 'Adsız Şablon'} (kopya)`,
    createdAt,
    favorite: false,
    lastUsedAt: null,
    useCount: 0,
    exercises: (template.exercises || []).map(exercise => ({
      ...exercise,
      id: generateId(),
      sets: (exercise.sets || []).map(set => ({ ...set, id: generateId() })),
    })),
  };
};
