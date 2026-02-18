'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function AboutPage() {
  const t = useTranslations('aboutPage')

  return (
    <div className="min-h-screen pt-24 pb-20" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-4xl mx-auto px-6">

        {/* Page title */}
        <h1 className="page-title mb-16 md:mb-20">
          {t('titleLine1')}<br />
          <span style={{ color: 'var(--accent-primary)' }}>{t('titleLine2')}</span>
        </h1>

        {/* Coach profile */}
        <section className="mb-16 md:mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-12 lg:gap-20">
            <div className="space-y-6">
              <h2 className="subsection-title" style={{ color: 'var(--accent-primary)' }}>
                {t('intro.title')}
              </h2>
              <p className="text-body max-w-lg">{t('intro.description')}</p>
              <ul className="space-y-3">
                {([1, 2, 3, 4] as const).map((i) => (
                  <li key={i} className="flex items-start gap-3 text-body">
                    <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent-primary)' }} />
                    {t(`intro.point${i}`)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Placeholder photo */}
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop&q=80"
                alt="Coach"
                className="w-full h-72 lg:h-96 object-cover rounded-lg shadow-2xl relative z-10"
              />
              <div
                className="absolute -bottom-3 -right-3 w-full h-full rounded-lg -z-0"
                style={{ background: 'var(--accent-primary)' }}
              />
            </div>
          </div>
        </section>

        {/* Vision */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('vision.title')}</h2>
          <p className="text-body max-w-2xl">{t('vision.description')}</p>
        </section>

        {/* Back link */}
        <Link
          href="/"
          className="flickr-link inline-flex items-center gap-3 text-base font-bold uppercase tracking-wider"
          style={{ color: 'var(--accent-primary)' }}
        >
          <svg className="arrow w-5 h-5 rotate-180" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="border-b-2" style={{ borderColor: 'var(--accent-primary)' }}>StrongCode</span>
        </Link>
      </div>
    </div>
  )
}
