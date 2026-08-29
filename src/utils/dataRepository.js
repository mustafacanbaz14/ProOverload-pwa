import { STORAGE_VERSION, STORAGE_VERSIONS } from './constants.js';
import { persistenceErrorMessage } from './persist.js';

/**
 * localStorage yerleşim sürümü. Yedek dosyasının DATA_SCHEMA_VERSION değeriyle
 * aynı şey değildir: bu kayıt yalnız cihaz içindeki anahtarların bütünlüğünü
 * izler ve kullanıcı verisinin kendisini kopyalamaz.
 */
export const STORAGE_LAYOUT_VERSION = 1;
export const STORAGE_MANIFEST_KEY = 'po_storage_manifest_v1';

export const STORAGE_LAYOUT_MIGRATIONS = Object.freeze([
  Object.freeze({
    version: 1,
    description: 'Sürüm anahtarları için sağlama toplamı ve kayıt sayısı manifesti eklendi.',
  }),
]);

/** useAppPersistence ve loadPersistedState aynı koleksiyon sözlüğüne dayanır. */
export const PERSISTED_DATASET_NAMES = Object.freeze([
  'workouts', 'templates', 'custom_exercises', 'custom_foods', 'recent_foods',
  'meal_templates', 'day_templates', 'active_workout', 'metrics', 'nutrition',
  'wellness', 'cycle', 'settings',
]);
const PERSISTED_DATASET_SET = new Set(PERSISTED_DATASET_NAMES);

export const storageDatasetKey = (name, version = STORAGE_VERSION) => `po_${name}${version}`;

/** Küçük, bağımlılıksız ve tüm JS ortamlarında aynı sonucu veren FNV-1a. */
export const checksumText = (text = '') => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const utf8ByteLength = (text) => {
  let bytes = 0;
  for (const char of text) {
    const point = char.codePointAt(0);
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
};

const validObject = value => value && typeof value === 'object' && !Array.isArray(value);

const newManifest = now => ({
  schemaVersion: STORAGE_LAYOUT_VERSION,
  createdAt: now,
  updatedAt: now,
  migrations: STORAGE_LAYOUT_MIGRATIONS.map(item => ({ ...item, appliedAt: now })),
  datasets: {},
});

/** Manifest göçü veri anahtarlarına dokunmaz ve tekrar çalıştırıldığında değişmez. */
export const migrateStorageManifest = (input, now = new Date().toISOString()) => {
  if (!validObject(input)) {
    return { manifest: newManifest(now), applied: [...STORAGE_LAYOUT_MIGRATIONS] };
  }

  const sourceVersion = Math.max(0, Number(input.schemaVersion) || 0);
  if (sourceVersion > STORAGE_LAYOUT_VERSION) {
    return { manifest: input, applied: [], future: true };
  }

  const applied = sourceVersion < 1 ? [...STORAGE_LAYOUT_MIGRATIONS] : [];
  const priorMigrations = Array.isArray(input.migrations) ? input.migrations : [];
  const knownVersions = new Set(priorMigrations.map(item => Number(item?.version)));
  const migrations = [
    ...priorMigrations.filter(validObject),
    ...applied.filter(item => !knownVersions.has(item.version)).map(item => ({ ...item, appliedAt: now })),
  ];

  return {
    applied,
    future: false,
    manifest: {
      ...input,
      schemaVersion: STORAGE_LAYOUT_VERSION,
      createdAt: typeof input.createdAt === 'string' ? input.createdAt : now,
      updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : now,
      migrations,
      datasets: validObject(input.datasets) ? input.datasets : {},
    },
  };
};

const safeNow = now => {
  try { return now(); } catch { return new Date().toISOString(); }
};

/**
 * Uygulamanın kalıcı veri kapısı.
 *
 * - Asıl veri önce yazılır, manifest sonra güncellenir.
 * - Manifest bozukluğu kullanıcı verisini reddetmez; yalnız görünür bulgu olur.
 * - Eski `_v16…_v13` anahtarları okunur ama hiçbir zaman silinmez.
 * - Tüm hatalar sonuç nesnesine çevrilir; açılış/render akışına istisna kaçmaz.
 */
export const createDataRepository = (storage, {
  currentVersion = STORAGE_VERSION,
  versions = STORAGE_VERSIONS,
  now = () => new Date().toISOString(),
} = {}) => {
  const issues = [];
  const issueKeys = new Set();
  const checkedDatasets = new Set();
  const addIssue = (issue) => {
    const identity = `${issue.kind}:${issue.dataset || ''}:${issue.key || ''}`;
    if (issueKeys.has(identity)) return;
    issueKeys.add(identity);
    issues.push(issue);
  };

  // Acil kurtarma ekranı bilinçli olarak yalnız `getItem` veren salt-okunur bir
  // adaptörle çalışabilir. Okuma erişimi ile yazma erişimi aynı kabul edilmez.
  let available = Boolean(storage?.getItem);
  let manifestStatus = available ? 'missing' : 'unavailable';
  let manifest = null;

  if (!available) {
    addIssue({ kind: 'storageUnavailable', severity: 'high' });
  } else {
    let raw = null;
    try {
      raw = storage.getItem(STORAGE_MANIFEST_KEY);
    } catch {
      available = false;
      manifestStatus = 'unavailable';
      addIssue({ kind: 'storageUnavailable', severity: 'high', key: STORAGE_MANIFEST_KEY });
    }
    if (available && raw !== null && raw !== undefined) {
      try {
        const parsed = JSON.parse(raw);
        if (!validObject(parsed)) throw new TypeError('Manifest nesne değil');
        const migrated = migrateStorageManifest(parsed, safeNow(now));
        manifest = migrated.manifest;
        manifestStatus = migrated.future ? 'future' : migrated.applied.length > 0 ? 'migrated' : 'valid';
        if (migrated.future) {
          addIssue({ kind: 'manifestFutureVersion', severity: 'medium' });
        }
      } catch {
        manifestStatus = 'corrupt';
        addIssue({ kind: 'manifestCorrupt', severity: 'medium' });
      }
    }
  }

  const read = (name, defaultValue, parser = value => value) => {
    checkedDatasets.add(name);
    if (!PERSISTED_DATASET_SET.has(name)) {
      addIssue({ kind: 'unknownDataset', severity: 'high', dataset: name });
      return { value: defaultValue, sourceKey: null, issues: [...issues] };
    }
    if (!available) return { value: defaultValue, sourceKey: null, issues: [...issues] };

    const localIssuesBefore = issues.length;
    for (const version of versions) {
      const key = storageDatasetKey(name, version);
      let raw;
      try {
        raw = storage.getItem(key);
      } catch {
        available = false;
        manifestStatus = 'unavailable';
        addIssue({ kind: 'storageUnavailable', severity: 'high', dataset: name, key });
        break;
      }
      if (raw === null || raw === undefined) continue;

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        addIssue({ kind: 'corruptValue', severity: 'high', dataset: name, key });
        continue;
      }
      // Eski okuyucu `null` değerini kayıt yokmuş gibi kabul edip bir önceki
      // sürüme düşüyordu. Bu davranış korunmazsa sağlam `_v16` kopyası varken
      // bozuk/yarım bir güncellemenin `null` değeri veriyi gölgeler.
      if (parsed === null || parsed === undefined) continue;

      let value;
      try {
        value = parser(parsed);
      } catch {
        addIssue({ kind: 'normalizationFailed', severity: 'high', dataset: name, key });
        continue;
      }

      if (version !== currentVersion) {
        addIssue({ kind: 'legacyFallback', severity: 'medium', dataset: name, key });
      } else {
        const entry = manifest?.datasets?.[name];
        if (entry?.key && entry.key !== key) {
          addIssue({ kind: 'manifestKeyMismatch', severity: 'medium', dataset: name, key });
        } else if (entry?.checksum && entry.checksum !== checksumText(raw)) {
          addIssue({ kind: 'checksumMismatch', severity: 'high', dataset: name, key });
        }
      }

      return {
        value,
        sourceKey: key,
        sourceVersion: version,
        issues: issues.slice(localIssuesBefore),
      };
    }

    return {
      value: defaultValue,
      sourceKey: null,
      sourceVersion: null,
      issues: issues.slice(localIssuesBefore),
    };
  };

  const writeManifest = (name, key, serialized, value) => {
    if (manifestStatus === 'future') return false;
    const timestamp = safeNow(now);
    const base = manifest ? migrateStorageManifest(manifest, timestamp).manifest : newManifest(timestamp);
    const next = {
      ...base,
      updatedAt: timestamp,
      datasets: {
        ...base.datasets,
        [name]: {
          key,
          checksum: checksumText(serialized),
          bytes: utf8ByteLength(serialized),
          records: Array.isArray(value) ? value.length : value === null ? 0 : 1,
          updatedAt: timestamp,
        },
      },
    };
    try {
      storage.setItem(STORAGE_MANIFEST_KEY, JSON.stringify(next));
      manifest = next;
      manifestStatus = 'valid';
      return true;
    } catch {
      addIssue({ kind: 'manifestWriteFailed', severity: 'medium' });
      return false;
    }
  };

  const write = (name, value, onError) => {
    const key = storageDatasetKey(name, currentVersion);
    if (!PERSISTED_DATASET_SET.has(name)) {
      addIssue({ kind: 'unknownDataset', severity: 'high', dataset: name, key });
      return { ok: false, manifestOk: false, key };
    }
    if (!available || !storage?.setItem) {
      const error = new Error('Depolama kullanılamıyor');
      addIssue({ kind: 'writeFailed', severity: 'high', dataset: name, key });
      try { onError?.(persistenceErrorMessage(error), error); } catch { /* bildirim hatası veriyi etkilemez */ }
      return { ok: false, manifestOk: false, key };
    }

    try {
      const serialized = JSON.stringify(value);
      if (serialized === undefined) throw new TypeError('JSON çıktısı üretilemedi');
      storage.setItem(key, serialized);
      const manifestOk = writeManifest(name, key, serialized, value);
      return { ok: true, manifestOk, key, checksum: checksumText(serialized) };
    } catch (error) {
      addIssue({ kind: 'writeFailed', severity: 'high', dataset: name, key });
      try { onError?.(persistenceErrorMessage(error), error); } catch { /* bildirim hatası veriyi etkilemez */ }
      return { ok: false, manifestOk: false, key };
    }
  };

  const readRaw = (key, defaultValue = null) => {
    if (!available) return { value: defaultValue, ok: false };
    try {
      const value = storage.getItem(key);
      return { value: value ?? defaultValue, ok: true };
    } catch {
      available = false;
      manifestStatus = 'unavailable';
      addIssue({ kind: 'storageUnavailable', severity: 'high', key });
      return { value: defaultValue, ok: false };
    }
  };

  const writeRaw = (key, value, onError) => {
    if (!available || !storage?.setItem) {
      const error = new Error('Depolama kullanılamıyor');
      try { onError?.(persistenceErrorMessage(error), error); } catch { /* bildirim hatası önemsiz */ }
      return false;
    }
    try {
      storage.setItem(key, String(value));
      return true;
    } catch (error) {
      addIssue({ kind: 'rawWriteFailed', severity: 'medium', key });
      try { onError?.(persistenceErrorMessage(error), error); } catch { /* bildirim hatası önemsiz */ }
      return false;
    }
  };

  const health = () => {
    const currentIssues = issues.map(issue => ({ ...issue }));
    return {
      available,
      manifestStatus,
      schemaVersion: Number(manifest?.schemaVersion) || null,
      manifestUpdatedAt: manifest?.updatedAt || null,
      checkedDatasets: checkedDatasets.size,
      trackedDatasets: Object.keys(manifest?.datasets || {}).length,
      totalDatasets: PERSISTED_DATASET_NAMES.length,
      recoveredDatasets: new Set(currentIssues
        .filter(issue => issue.kind === 'legacyFallback')
        .map(issue => issue.dataset)).size,
      hasIssues: currentIssues.length > 0,
      hasCritical: currentIssues.some(issue => issue.severity === 'high'),
      issues: currentIssues,
    };
  };

  return { read, write, readRaw, writeRaw, health };
};

let browserRepository = null;

const browserStorage = () => {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
};

export const getBrowserDataRepository = () => {
  if (!browserRepository) browserRepository = createDataRepository(browserStorage());
  return browserRepository;
};
