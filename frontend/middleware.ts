import { NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { auth } from '@/lib/auth';

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|cs)/, '') || '/';

  // Protected routes: verify JWT session (not just cookie existence)
  if (pathnameWithoutLocale.startsWith('/admin') || pathnameWithoutLocale.startsWith('/client')) {
    if (!request.auth) {
      const locale = pathname.match(/^\/(en|cs)/)?.[1] || defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access: clients can't access admin routes
    if (pathnameWithoutLocale.startsWith('/admin') && request.auth.user?.role !== 'admin') {
      const locale = pathname.match(/^\/(en|cs)/)?.[1] || defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/client/dashboard`, request.url));
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
