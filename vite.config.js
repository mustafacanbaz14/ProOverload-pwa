import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Kayıt main.jsx'te elle yapılıyor (yeni sürümde otomatik yenileme için);
      // eklenti de enjekte ederse çift kayıt olurdu.
      injectRegister: null,
      // PNG uzantıları varsayılan Workbox globuna girmiyor; ikonlar burada.
      // HTML/CSS yasal sayfalar glob tarafından zaten alınır, buraya da yazmak
      // aynı URL'yi iki kez precache listesine eklerdi.
      includeAssets: ['apple-touch-icon-v5.png', 'pwa-v5-192x192.png', 'pwa-v5-512x512.png'],
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        // Yasal ve destek sayfaları React kabuğuna düşmemeli. Mağaza
        // inceleme ekibi uygulama verisi olmadan doğrudan URL'yi açabilmeli.
        navigateFallbackDenylist: [/^\/privacy(?:\.html)?$/, /^\/support(?:\.html)?$/, /^\/terms(?:\.html)?$/],
        // Mobil dinlenme bildiriminin üzerine dokununca kurulu PWA'ya dön.
        importScripts: ['sw-notification.js'],
        // Barkod tarayıcı (zxing) ~450 KB ve zaten çevrimiçi ürün sorgusuyla
        // birlikte çalışıyor; ilk kuruluma yük olmasın diye önbelleğe alınmıyor,
        // ihtiyaç anında indirilip çalışma zamanı önbelleğine yazılıyor.
        globIgnores: ['**/BarcodeScannerModal-*.js'],
        runtimeCaching: [{
          urlPattern: /\/assets\/BarcodeScannerModal-.*\.js$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'barcode-scanner',
            expiration: { maxEntries: 2, maxAgeSeconds: 30 * 24 * 60 * 60 },
          }
        }]
      },
      manifest: {
        id: '/',
        name: 'ProOverload Tracker',
        short_name: 'ProOverload',
        description: 'Antrenman, beslenme, vücut gelişimi ve toparlanmayı cihazında takip eden kişisel fitness koçu.',
        lang: 'tr',
        start_url: '/?source=pwa',
        scope: '/',
        theme_color: '#080806',
        background_color: '#080806',
        display: 'standalone',
        orientation: 'portrait-primary',
        categories: ['health', 'fitness', 'lifestyle'],
        prefer_related_applications: false,
        shortcuts: [
          { name: 'Antrenman', short_name: 'Antrenman', description: 'Antrenman merkezini aç', url: '/?view=training&source=shortcut', icons: [{ src: 'pwa-v5-192x192.png', sizes: '192x192' }] },
          { name: 'Beslenme', short_name: 'Beslenme', description: 'Bugünün beslenmesini aç', url: '/?view=nutrition&source=shortcut', icons: [{ src: 'pwa-v5-192x192.png', sizes: '192x192' }] },
          { name: 'Gelişim', short_name: 'Gelişim', description: 'Gelişim ve analiz ekranını aç', url: '/?view=progress&source=shortcut', icons: [{ src: 'pwa-v5-192x192.png', sizes: '192x192' }] },
        ],
        icons: [
          {
            src: 'pwa-v5-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-v5-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-v5-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    manifest: true,
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
})
