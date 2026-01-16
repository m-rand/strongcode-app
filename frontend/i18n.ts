import { getRequestConfig } from 'next-intl/server';

// Define supported locales
export const locales = ['en', 'cs'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the request
  let locale = await requestLocale;

  // Validate and fallback to default
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    timeZone: 'Europe/Prague',
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
