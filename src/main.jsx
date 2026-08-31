import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import { STORAGE_VERSION } from './utils/constants.js'
import { deferAppUpdate } from './pwaUpdate.js'

/*
 * Kurulu PWA kendi yazı ölçeğine sahip. iOS'un form alanına odaklanınca
 * yaptığı otomatik yakınlaştırma ve iki parmakla oluşan sayfa zoom'u, alt
 * gezinmeyi ekran dışına taşıyıp uygulama kabuğunu bozuyordu. Tek parmakla
 * kaydırma korunur; yalnız çoklu dokunma/gesture yakınlaştırması engellenir.
 */
const preventZoomGesture = event => event.preventDefault()
document.addEventListener('gesturestart', preventZoomGesture, { passive: false })
document.addEventListener('gesturechange', preventZoomGesture, { passive: false })
document.addEventListener('gestureend', preventZoomGesture, { passive: false })
document.addEventListener('touchmove', event => {
  if (event.touches?.length > 1) event.preventDefault()
}, { passive: false })

const hasActiveWorkout = () => {
  try {
    const raw = localStorage.getItem(`po_active_workout${STORAGE_VERSION}`)
    return Boolean(raw && raw !== 'null')
  } catch {
    return false
  }
}

/*
 * Otomatik güncelleme.
 *
 * Servis çalışanı yalnızca eklentinin enjekte ettiği betikle kaydediliyordu;
 * yeni sürüm indirilse bile sayfa yenilenmediği için ana ekrana eklenmiş
 * uygulamada eski sürüm görünmeye devam ediyordu. iOS uygulamayı kapatmayıp
 * askıya aldığından yeni çalışan hiç devreye girmiyor, kullanıcı silip yeniden
 * eklemek zorunda kalıyordu.
 *
 * Artık yeni sürüm hazır olunca devralıp sayfa yenileniyor; ayrıca saatte bir
 * ve uygulama her öne geldiğinde güncelleme kontrol ediliyor.
 */
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (hasActiveWorkout()) deferAppUpdate(() => updateSW(true))
    else updateSW(true) // skipWaiting + reload
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    const kontrolEt = () => registration.update().catch(() => { /* çevrimdışı olabilir */ });
    setInterval(kontrolEt, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') kontrolEt();
    });
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
