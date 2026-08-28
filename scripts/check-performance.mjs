import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const MANIFEST = path.join(DIST, '.vite', 'manifest.json');

const BUDGETS = {
  initialJs: 820 * 1024,
  initialJsGzip: 285 * 1024,
  initialCss: 140 * 1024,
  largestLazyJs: 480 * 1024,
};

const formatKb = bytes => `${(bytes / 1024).toFixed(1)} KB`;
const readSize = file => fs.statSync(path.join(DIST, file)).size;
const readGzipSize = file => gzipSync(fs.readFileSync(path.join(DIST, file))).length;

if (!fs.existsSync(MANIFEST)) {
  throw new Error('Vite manifest bulunamadı. build.manifest açık olmalı.');
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entryPair = Object.entries(manifest).find(([, item]) => item.isEntry);
if (!entryPair) throw new Error('Ana Vite giriş parçası bulunamadı.');

const initialRecords = new Set();
const visit = key => {
  if (initialRecords.has(key)) return;
  const record = manifest[key];
  if (!record) return;
  initialRecords.add(key);
  (record.imports || []).forEach(visit);
};
visit(entryPair[0]);

const initialJsFiles = [...initialRecords]
  .map(key => manifest[key]?.file)
  .filter(file => file?.endsWith('.js'));
const initialCssFiles = [...new Set([...initialRecords].flatMap(key => manifest[key]?.css || []))];
const allJsFiles = fs.readdirSync(path.join(DIST, 'assets'))
  .filter(file => file.endsWith('.js'))
  .map(file => `assets/${file}`);
const lazyJsFiles = allJsFiles.filter(file => !initialJsFiles.includes(file));

const report = {
  generatedAt: new Date().toISOString(),
  initialJs: initialJsFiles.reduce((sum, file) => sum + readSize(file), 0),
  initialJsGzip: initialJsFiles.reduce((sum, file) => sum + readGzipSize(file), 0),
  initialCss: initialCssFiles.reduce((sum, file) => sum + readSize(file), 0),
  largestLazyJs: lazyJsFiles.reduce((largest, file) => {
    const bytes = readSize(file);
    return bytes > largest.bytes ? { file, bytes } : largest;
  }, { file: null, bytes: 0 }),
  initialFiles: initialJsFiles,
};

const failures = [];
if (report.initialJs > BUDGETS.initialJs) failures.push(`İlk JS ${formatKb(report.initialJs)} > ${formatKb(BUDGETS.initialJs)}`);
if (report.initialJsGzip > BUDGETS.initialJsGzip) failures.push(`İlk gzip JS ${formatKb(report.initialJsGzip)} > ${formatKb(BUDGETS.initialJsGzip)}`);
if (report.initialCss > BUDGETS.initialCss) failures.push(`İlk CSS ${formatKb(report.initialCss)} > ${formatKb(BUDGETS.initialCss)}`);
if (report.largestLazyJs.bytes > BUDGETS.largestLazyJs) failures.push(`En büyük geç parça ${formatKb(report.largestLazyJs.bytes)} > ${formatKb(BUDGETS.largestLazyJs)}`);

fs.writeFileSync(
  path.join(DIST, 'performance-report.json'),
  JSON.stringify({ budgets: BUDGETS, ...report }, null, 2),
);

console.log(`Performans bütçesi: ilk JS ${formatKb(report.initialJs)} (${formatKb(report.initialJsGzip)} gzip), CSS ${formatKb(report.initialCss)}.`);
console.log(`En büyük geç parça: ${report.largestLazyJs.file || 'yok'} · ${formatKb(report.largestLazyJs.bytes)}.`);

if (failures.length) {
  throw new Error(`Performans bütçesi aşıldı:\n- ${failures.join('\n- ')}`);
}

console.log('Performans bütçeleri geçti.');
