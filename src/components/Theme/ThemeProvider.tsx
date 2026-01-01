import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, themes } from './themes';
import { loadThemePreference, saveThemePreference, ThemePreference } from '../../utils/storage';

interface ThemeContextType {
  theme: Theme;
  colors: typeof themes.dark;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = loadThemePreference();
    if (saved) {
      return saved;
    }
    // Verificar preferência do sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });


  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveThemePreference(newTheme as ThemePreference);
  };

  const colors = themes[theme];

  // Aplicar tema ao documento
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--bg-color', colors.background);
    document.documentElement.style.setProperty('--surface-color', colors.surface);
    document.documentElement.style.setProperty('--text-color', colors.text);
    document.documentElement.style.setProperty('--text-secondary-color', colors.textSecondary);
    document.documentElement.style.setProperty('--accent-color', colors.accent);
    document.documentElement.style.setProperty('--success-color', colors.success);
    document.documentElement.style.setProperty('--warning-color', colors.warning);
    document.documentElement.style.setProperty('--error-color', colors.error);
    document.documentElement.style.setProperty('--border-color', colors.border);
    document.documentElement.style.setProperty('--user-message-bg', colors.userMessageBg);
    document.documentElement.style.setProperty('--agent-message-bg', colors.agentMessageBg);
  }, [theme, colors]);

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

