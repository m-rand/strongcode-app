'use client';

import { useState, useRef, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

const themeConfig: Record<Theme, { label: string; icon: string }> = {
  light: { label: 'Light', icon: '☀️' },
  dark: { label: 'Dark', icon: '🌙' },
  system: { label: 'Auto', icon: '💻' },
};

const themes: Theme[] = ['light', 'dark', 'system'];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved && themes.includes(saved)) {
      setCurrentTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme('system');
    }
  }, []);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyTheme = (theme: Theme) => {
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
  };

  const selectTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    setIsOpen(false);
  };

  const displayText = currentTheme === 'system' ? 'auto' : currentTheme;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-8 rounded-lg transition-all duration-200 hover:scale-105 text-xs font-bold uppercase tracking-wider border flex items-center justify-center cursor-pointer"
        style={{
          color: 'var(--text-primary)',
          borderColor: 'var(--border-color)',
          backgroundColor: isOpen ? 'var(--bg-secondary)' : 'transparent',
        }}
        title={`Theme: ${themeConfig[currentTheme].label}`}
      >
        {displayText}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 py-1 rounded-lg shadow-lg border z-50 min-w-[120px]"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
          }}
        >
          {themes.map((theme) => (
            <button
              key={theme}
              onClick={() => selectTheme(theme)}
              className="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-secondary)] flex items-center gap-2"
              style={{
                color: currentTheme === theme ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontWeight: currentTheme === theme ? 600 : 400,
              }}
            >
              <span>{themeConfig[theme].icon}</span>
              <span>{themeConfig[theme].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
