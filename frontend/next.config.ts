import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/intro',
        destination: '/',
        permanent: true,
      },
      {
        source: '/:locale(en|cs)/intro',
        destination: '/:locale',
        permanent: true,
      },
      {
        source: '/how-it-works',
        destination: '/',
        permanent: true,
      },
      {
        source: '/:locale(en|cs)/how-it-works',
        destination: '/:locale',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
