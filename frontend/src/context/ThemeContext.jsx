import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'theme_preference';
const ACCENT_STORAGE_KEY = 'accent_color_preference';

const DEFAULT_ACCENT_BY_THEME = {
  light: '#3b82f6',
  dark: '#7dd3fc',
};

function isHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || ''));
}

function hexToRgb(value) {
  const hex = value.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function resolveInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveInitialAccent(theme) {
  const saved = localStorage.getItem(ACCENT_STORAGE_KEY);
  if (isHexColor(saved)) return saved;
  return DEFAULT_ACCENT_BY_THEME[theme] || DEFAULT_ACCENT_BY_THEME.light;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitialTheme);
  const [accentColor, setAccentColor] = useState(() => resolveInitialAccent(resolveInitialTheme()));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!isHexColor(accentColor)) return;
    const root = document.documentElement;
    root.style.setProperty('--brand-color', accentColor);
    root.style.setProperty('--brand-rgb', hexToRgb(accentColor));
    localStorage.setItem(ACCENT_STORAGE_KEY, accentColor);
  }, [accentColor]);

  const value = useMemo(() => ({
    theme,
    accentColor,
    isDark: theme === 'dark',
    setTheme,
    setAccentColor,
    toggleTheme: () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark')),
  }), [theme, accentColor]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
