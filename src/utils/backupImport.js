const ARRAY_FIELDS = [
  { key: 'workouts', alias: 'w', label: 'Antrenman' },
  { key: 'templates', alias: 't', label: 'Şablon' },
  { key: 'customExercises', label: 'Özel hareket' },
  { key: 'customFoods', label: 'Özel besin' },
  { key: 'recentFoods', label: 'Son besin' },
  { key: 'metricsHistory', alias: 'm', label: 'Vücut ölçümü' },
  { key: 'nutritionHistory', alias: 'n', label: 'Beslenme günü' },
  { key: 'wellness', label: 'Toparlanma günü' },
  { key: 'cycleHistory', label: 'Döngü günü' },
];

export const backupValue = (data, key, alias) => {
  if (!data || typeof data !== 'object') return undefined;
  if (Object.prototype.hasOwnProperty.call(data, key)) return data[key];
  return alias && Object.prototype.hasOwnProperty.call(data, alias) ? data[alias] : undefined;
};

/** Dosyayı state'e dokunmadan inceler; yanlış türleri başarı saymaz. */
export const inspectBackupPayload = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Dosyanın kök yapısı geçerli bir nesne değil.'], items: [], total: 0 };
  }

  const errors = [];
  const items = [];
  let recognized = 0;

  ARRAY_FIELDS.forEach(field => {
    const value = backupValue(data, field.key, field.alias);
    if (value === undefined) return;
    recognized += 1;
    if (!Array.isArray(value)) {
      errors.push(`${field.label} listesi geçersiz.`);
      return;
    }
    items.push({ key: field.key, label: field.label, count: value.length });
  });

  const settings = backupValue(data, 'settings', 's');
  if (settings !== undefined) {
    recognized += 1;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      errors.push('Ayarlar bölümü geçersiz.');
    } else {
      items.push({ key: 'settings', label: 'Ayarlar', count: Object.keys(settings).length, unit: 'seçenek' });
    }
  }

  if (recognized === 0) errors.push('Bu dosyada ProOverload verisi bulunamadı.');
  return {
    valid: errors.length === 0,
    errors,
    items,
    total: items.filter(item => item.key !== 'settings').reduce((sum, item) => sum + item.count, 0),
    version: typeof data.version === 'string' ? data.version : 'Bilinmiyor',
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : null,
  };
};

/** Aynı anahtardaki yedek kaydı kazanır; cihazdaki eşsiz kayıtlar korunur. */
export const mergeImportedRecords = (current = [], incoming = [], keyOf = item => item?.id) => {
  const safeCurrent = Array.isArray(current) ? current : [];
  const safeIncoming = Array.isArray(incoming) ? incoming : [];
  const incomingKeys = new Set(safeIncoming.map(keyOf).filter(key => key !== undefined && key !== null && key !== ''));
  const preserved = safeCurrent.filter(item => {
    const key = keyOf(item);
    return key === undefined || key === null || key === '' || !incomingKeys.has(key);
  });
  return [...safeIncoming, ...preserved];
};

export const backupImportSummary = (inspection) => inspection?.items
  ?.filter(item => item.key !== 'settings' && item.count > 0)
  .slice(0, 3)
  .map(item => `${item.count} ${item.label.toLocaleLowerCase('tr')}`)
  .join(' · ') || 'ayarlar';

