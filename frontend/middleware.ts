import { NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { auth } from '@/lib/auth';

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeDetection: false,
});

export default auth((request) => {
  const host = request.headers.get('host') || '';
  if (host === 'strong-code.com') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.hostname = 'www.strong-code.com';
    return NextResponse.redirect(redirectUrl, 308);
  }

  const { pathname } = request.nextUrl;
  const localeMatch = pathname.match(/^\/(en|cs)(?=\/|$)/);
  const locale = localeMatch?.[1] as (typeof locales)[number] | undefined;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|cs)(?=\/|$)/, '') || '/';
  const withLocale = (path: string) => (locale && locale !== defaultLocale ? `/${locale}${path}` : path);

  // Protected routes: verify JWT session (not just cookie existence)
  if (pathnameWithoutLocale.startsWith('/admin') || pathnameWithoutLocale.startsWith('/client')) {
    if (!request.auth) {
      const loginUrl = new URL(withLocale('/login'), request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access: clients can't access admin routes
    if (pathnameWithoutLocale.startsWith('/admin') && request.auth.user?.role !== 'admin') {
      return NextResponse.redirect(new URL(withLocale('/client/dashboard'), request.url));
    }
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
