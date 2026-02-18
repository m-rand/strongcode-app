'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function LookInsidePage() {
  const t = useTranslations('lookInsidePage')

  return (
    <div className="min-h-screen pt-24 pb-20" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-4xl mx-auto px-6">

        {/* Page title */}
        <h1 className="page-title mb-16 md:mb-20">
          {t('titleLine1')}<br />
          <span style={{ color: 'var(--accent-primary)' }}>{t('titleLine2')}</span>
        </h1>

        {/* Why not for beginners */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('beginners.title')}</h2>
          <p className="text-body max-w-2xl">{t('beginners.description')}</p>
        </section>

        {/* Training model */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('model.title')}</h2>
          <p className="text-body max-w-2xl">{t('model.description')}</p>
        </section>

        {/* Key factors */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('factors.title')}</h2>
          <div className="space-y-5 max-w-2xl">
            <p className="text-body">{t('factors.paragraph1')}</p>
            <p className="text-body font-semibold" style={{ color: 'var(--text-primary)' }}>{t('factors.paragraph2')}</p>
            <ul className="space-y-3">
              {([1, 2, 3, 4] as const).map((i) => (
                <li key={i} className="flex items-start gap-3 text-body">
                  <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent-primary)' }} />
                  {t(`factors.point${i}`)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Training dynamics */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('dynamics.title')}</h2>
          <div className="space-y-5 max-w-2xl">
            <p className="text-body">{t('dynamics.paragraph1')}</p>
            <p className="text-body font-semibold" style={{ color: 'var(--text-primary)' }}>{t('dynamics.paragraph2')}</p>
            <ul className="space-y-4">
              {([1, 2, 3] as const).map((i) => (
                <li key={i} className="text-body">
                  <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {t(`dynamics.point${i}Title`)}
                  </strong>{' '}
                  {t(`dynamics.point${i}`)}
                </li>
              ))}
            </ul>
            <p className="text-body font-semibold italic" style={{ color: 'var(--accent-primary)' }}>
              {t('dynamics.keyTakeaway')}
            </p>
          </div>
        </section>

        {/* Ladders */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('ladders.title')}</h2>
          <p className="text-body max-w-2xl">{t('ladders.description')}</p>
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
