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
      includeAssets: ['apple-touch-icon-v5.png', 'pwa-v5-192x192.png', 'pwa-v5-512x512.png'],
      workbox: {
        // Mobil dinlenme bildiriminin üzerine dokununca kurulu PWA'ya dön.
        importScripts: ['sw-notification.js'],
        // Barkod tarayıcı (zxing) ~450 KB ve zaten çevrimiçi ürün sorgusuyla
        // birlikte çalışıyor; ilk kuruluma yük olmasın diye önbelleğe alınmıyor,
        // ihtiyaç anında indirilip çalışma zamanı önbelleğine yazılıyor.
        globIgnores: ['**/BarcodeScannerModal-*.js'],
        runtimeCaching: [{
          urlPattern: /\/assets\/BarcodeScannerModal-.*\.js$/,
          handler: 'CacheFirst',
          options: { cacheName: 'barcode-scanner' }
        }]
      },
      manifest: {
        name: 'ProOverload Tracker',
        short_name: 'ProOverload',
        description: 'Advanced Workout and Nutrition Tracker',
        lang: 'tr',
        theme_color: '#080806',
        background_color: '#080806',
        display: 'standalone',
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
