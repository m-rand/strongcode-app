'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/i18n';
import { useState, useRef, useEffect } from 'react';

const localeNames: Record<string, string> = {
  en: 'English',
  cs: 'Čeština',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const switchLanguage = (newLocale: string) => {
    const pathnameWithoutLocale = pathname.replace(/^\/(en|cs)/, '') || '/';
    const newPath = `/${newLocale}${pathnameWithoutLocale}`;
    router.push(newPath);
    setIsOpen(false);
  };

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
        title={`Current: ${localeNames[locale]}`}
      >
        {locale}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 py-1 rounded-lg shadow-lg border z-50 min-w-[120px]"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
          }}
        >
          {locales.map((lang) => (
            <button
              key={lang}
              onClick={() => switchLanguage(lang)}
              className="w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-secondary)] flex items-center gap-2"
              style={{
                color: locale === lang ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontWeight: locale === lang ? 600 : 400,
              }}
            >
              <span className="uppercase text-xs font-bold w-6">{lang}</span>
              <span>{localeNames[lang]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
