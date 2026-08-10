# ProOverload Tracker

Offline-first hipertrofi takip PWA'sı. React 19 + Vite + Tailwind v4. Tüm veri
tarayıcının `localStorage`'ında; sunucu yok.

## Sürüm numaralandırma

Sürüm **iki parçalıdır**: `MAJOR.MINOR`. Yama parçası kullanılmaz — `3.1.0` ya
da `3.1.2` gibi bir sürüm üretilmez.

- Her yayın MINOR'u bir artırır: `3.1` → `3.2` → `3.3` …
- MINOR `9`'a ulaştıktan sonraki yayın MAJOR'u artırır ve MINOR'u sıfırlar:
  `3.9` → `4.0`
- Ara değer yok. Tek satırlık bir düzeltme yayınlanıyorsa da MINOR bir artar.
- Commit başlığının sonuna sürüm parantez içinde eklenir:
  `Özet cümlesi (3.2)`

### İki yerde tutulmasının sebebi

Asıl kaynak `package.json`'daki `version`. `src/utils/constants.js` içindeki
`APP_VERSION` onun kopyasıdır; çünkü bu modülü hem Vite hem de düz Node
(`scripts/verify-*.mjs`) okuyor ve JSON import'u iki ortamda farklı davranıyor.

İkisinin ayrışması sessiz hatalar üretiyordu (sürüm notları açılmıyor, yedek
dosyası eski sürümü yazıyor). Bu yüzden `scripts/verify-core.mjs` üç şeyi test
ediyor ve ayrışırsa **build kırılır**:

1. `APP_VERSION === package.json`'daki `version`
2. Sürüm `^\d+\.\d+$` biçiminde (yama parçası yok)
3. `LATEST_RELEASE_NOTES.version` aynı sürüm

Yani sürüm yükseltirken üç yeri birlikte güncellemek gerekiyor: `package.json`,
`APP_VERSION` ve sürüm notları.

## Veri ve göç

- Depolama anahtarları sürümlü: `po_<ad>_v17` (`STORAGE_VERSION`).
- Okuma birkaç eski sürüme geriye düşer (`STORAGE_VERSIONS`), yazma daima en
  yeniye yapılır.
- Şekil değişikliği yapan her göç **idempotent** olmalı: yeni biçim dokunulmadan
  geçmeli, eski biçim taşınmalı. Kullanıcı verisi hiçbir durumda kaybolmaz.
- Ayarlara yeni alan eklerken `DEFAULT_SETTINGS`'e de eklenmeli; `mergeSettings`
  varsayılanların üstüne yayıyor.

## Hesap katmanı

`src/utils/` altındaki saf modüller React'e bağlı değil ve `node` ile doğrudan
çalıştırılıp test edilebilir. Bağımlılık yönü tek taraflı:

```
number.js / dates.js  →  (bağımsız yaprak)
nutritionStats, energyModel, cardio, wellness, goals, coach, interference
constants → helpers → templates → weekPlan
```

`helpers.js` ile `weekPlan.js` arasında döngü oluşmasın diye plan göçü ayrı bir
yaprak modülde (`planMigration.js`) duruyor.

## Doğrulama

- `npm run build` içinde `scripts/verify-muscles.mjs` çalışır: hareket → kas
  eşlemelerinin altın anahtar karşılaştırması. Kural eklerken mevcut
  sınıflandırmaların değişmediği buradan doğrulanır.
- `npx eslint src --quiet` temiz olmalı (React Compiler kuralları dahil).
- Arayüzü etkileyen değişiklikler tarayıcıda gerçek veriyle doğrulanır.

## Yazım

- Arayüz metinleri ve kod yorumları Türkçe.
- Yorum "ne yaptığını" değil "neden böyle" olduğunu anlatır.
