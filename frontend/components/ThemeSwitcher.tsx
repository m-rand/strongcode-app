'use client';

import { useEffect, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark' | 'system';

const themes: Theme[] = ['light', 'dark', 'system'];
const THEME_EVENT = 'strongcode-theme-change';

function subscribeHydration() {
  return () => {};
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const saved = localStorage.getItem('theme') as Theme | null;
  return saved && themes.includes(saved) ? saved : 'system';
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleThemeChange = () => onStoreChange();

  window.addEventListener('storage', handleThemeChange);
  window.addEventListener(THEME_EVENT, handleThemeChange);
  mediaQuery.addEventListener('change', handleThemeChange);

  return () => {
    window.removeEventListener('storage', handleThemeChange);
    window.removeEventListener(THEME_EVENT, handleThemeChange);
    mediaQuery.removeEventListener('change', handleThemeChange);
  };
}

export function ThemeSwitcher() {
  const currentTheme = useSyncExternalStore<Theme>(subscribe, getStoredTheme, () => 'system');
  const mounted = useSyncExternalStore<boolean>(subscribeHydration, () => true, () => false);

  function applyTheme(theme: Theme) {
    let isDark = false;
    if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = theme === 'dark';
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme]);

  const cycleTheme = () => {
    const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
    localStorage.setItem('theme', nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const stableTheme = mounted ? currentTheme : 'system';
  const displayText = stableTheme === 'system' ? 'auto' : stableTheme;

  return (
    <button
      onClick={cycleTheme}
      className="w-16 h-8 rounded-lg transition-all duration-200 hover:scale-105 text-xs font-bold uppercase tracking-wider border flex items-center justify-center cursor-pointer"
      style={{
        color: 'var(--text-primary)',
        borderColor: 'var(--border-color)',
        backgroundColor: 'transparent',
      }}
      title={`Theme: ${displayText}`}
    >
      {displayText}
    </button>
  );
}
