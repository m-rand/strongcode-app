'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function FeaturesPage() {
  const t = useTranslations('featuresPage')

  return (
    <div className="min-h-screen pt-24 pb-20" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-4xl mx-auto px-6">

        {/* Page title */}
        <h1 className="page-title mb-16 md:mb-20">
          {t('titleLine1')}<br />
          <span style={{ color: 'var(--accent-primary)' }}>{t('titleLine2')}</span>
        </h1>

        {/* Individually Tailored */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('tailored.title')}</h2>
          <p className="text-body max-w-2xl">{t('tailored.description')}</p>
        </section>

        {/* Unique */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('unique.title')}</h2>
          <div className="space-y-5 max-w-2xl">
            <p className="text-body">{t('unique.paragraph1')}</p>
            <p className="text-body font-semibold" style={{ color: 'var(--text-primary)' }}>{t('unique.paragraph2')}</p>
            <ul className="space-y-3">
              {(['point1', 'point2', 'point3'] as const).map((key) => (
                <li key={key} className="flex items-start gap-3 text-body">
                  <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent-primary)' }} />
                  {t(`unique.${key}`)}
                </li>
              ))}
            </ul>
            <p className="text-body">{t('unique.paragraph3')}</p>
          </div>
        </section>

        {/* Variety */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('variety.title')}</h2>
          <p className="text-body max-w-2xl">{t('variety.description')}</p>
        </section>

        {/* Long term */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('longterm.title')}</h2>
          <div className="space-y-5 max-w-2xl">
            <p className="text-body">{t('longterm.paragraph1')}</p>
            <p className="text-body">{t('longterm.paragraph2')}</p>
          </div>
        </section>

        {/* Hypertrophy */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('hypertrophy.title')}</h2>
          <p className="text-body max-w-2xl">{t('hypertrophy.description')}</p>
        </section>

        {/* Benefits */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('benefits.title')}</h2>
          <ul className="space-y-3 max-w-2xl">
            {([1, 2, 3, 4, 5, 6, 7] as const).map((i) => (
              <li key={i} className="flex items-start gap-3 text-body">
                <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent-primary)' }} />
                {t(`benefits.point${i}`)}
              </li>
            ))}
          </ul>
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
