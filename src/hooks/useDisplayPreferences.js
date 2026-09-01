import { useEffect } from 'react';

export const useDisplayPreferences = (settings) => {
  useEffect(() => {
    const light = settings.theme === 'light';
    const accent = ['rose', 'sapphire'].includes(settings.accentTheme) ? settings.accentTheme : 'cyan';
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    document.documentElement.dataset.accent = accent;
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', light ? '#f4efe5' : accent === 'rose' ? '#160b12' : accent === 'sapphire' ? '#091426' : '#080806');
  }, [settings.theme, settings.accentTheme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(settings.fontScale || 1));
  }, [settings.fontScale]);
};
