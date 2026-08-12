import { useEffect } from 'react';

export const useDisplayPreferences = (settings) => {
  useEffect(() => {
    const light = settings.theme === 'light';
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    document.documentElement.dataset.accent = settings.accentTheme === 'rose' ? 'rose' : 'cyan';
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', light ? '#f4efe5' : settings.accentTheme === 'rose' ? '#160b12' : '#080806');
  }, [settings.theme, settings.accentTheme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(settings.fontScale || 1));
  }, [settings.fontScale]);
};
