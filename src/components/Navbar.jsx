import React, { memo } from 'react';
import { Activity, Dumbbell, Beef, LineChart, History } from 'lucide-react';

const Navbar = memo(({ view, setView, onPreload, isPending = false }) => {
  const navItems = [
    { key: 'home', label: 'Bugün', icon: Activity },
    { key: 'training', label: 'Antrenman', icon: Dumbbell },
    { key: 'nutrition', label: 'Beslenme', icon: Beef },
    { key: 'progress', label: 'Gelişim', icon: LineChart },
    { key: 'history', label: 'Geçmiş', icon: History },
  ];

  return (
    // Güvenli alan dolgusu DIŞ katmanda, sabit yükseklik İÇ katmanda olmak
    // zorunda. İkisi aynı elemanda olduğunda (h-16 + pb-safe) ana ekrana
    // eklenmiş uygulamada iOS'un ~34px alt güvenli alanı 64px'in içinden
    // düşüyordu; içerik 30px'e sıkışıp ikonlar tarayıcıdakinden küçük
    // görünüyordu. Tarayıcıda güvenli alan 0 olduğu için sorun fark edilmiyordu.
    <div className="luxury-nav-wrap fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto z-30 pb-safe">
      <nav className="luxury-nav" aria-label="Ana gezinme" aria-busy={isPending || undefined}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.key;
          const activate = () => {
            if (isActive) {
              document.querySelector(`[data-view-scroll="${item.key}"]`)
                ?.scrollTo({ top: 0, behavior: 'auto' });
              return;
            }
            setView(item.key);
          };
          return (
            <button
              key={item.key}
              onPointerEnter={() => onPreload?.(item.key)}
              onPointerDown={() => onPreload?.(item.key)}
              onFocus={() => onPreload?.(item.key)}
              onClick={activate}
              aria-label={`${item.label} sekmesi${isActive ? '; tekrar dokununca başa dön' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              className={`luxury-nav-item ${isActive ? 'is-active' : ''}`}
            >
              <span className="luxury-nav-icon"><Icon size={17} strokeWidth={isActive ? 2.25 : 1.8} /></span>
              <span className="luxury-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
