import { useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'dark' | 'light';
type Theme = 'dark' | 'light';
// Older toggles saved a permanent override without offering an automatic option.
const THEME_STORAGE_KEY = 'siifmart_theme_preference';

const getStoredPreference = (): ThemePreference => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : 'system';
  } catch {
    return 'system';
  }
};
const getSystemTheme = (): Theme => (
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark' : 'light'
);

export function useTheme() {
  const [themePreference, setPreference] = useState<ThemePreference>(getStoredPreference);
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme);
  const theme = themePreference === 'system' ? systemTheme : themePreference;

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;
    const handleChange = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? 'dark' : 'light');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const setThemePreference = (preference: ThemePreference) => {
    setPreference(preference);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // The current session still follows the selected appearance without storage.
    }
  };
  const toggleTheme = () => setThemePreference(theme === 'dark' ? 'light' : 'dark');
  return { theme, themePreference, setThemePreference, toggleTheme };
}
