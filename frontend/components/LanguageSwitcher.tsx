'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/i18n';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    // Remove current locale from pathname
    const pathnameWithoutLocale = pathname.replace(/^\/(en|cs)/, '') || '/';

    // Build new path with new locale
    const newPath = `/${newLocale}${pathnameWithoutLocale}`;

    router.push(newPath);
  };

  return (
    <div className="flex gap-2">
      {locales.map((lang) => (
        <button
          key={lang}
          onClick={() => switchLanguage(lang)}
          className={`px-3 py-1 rounded transition-all ${
            locale === lang
              ? 'font-bold'
              : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            backgroundColor: locale === lang ? 'var(--accent-primary)' : 'transparent',
            color: locale === lang ? 'white' : 'var(--text-primary)',
          }}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
