const THEME_STORAGE_KEY = 'linux-ai-helper-theme';

export type ThemePreference = 'light' | 'dark';

export function saveThemePreference(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to save theme preference:', error);
  }
}

export function loadThemePreference(): ThemePreference | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return null;
  } catch (error) {
    console.warn('Failed to load theme preference:', error);
    return null;
  }
}

