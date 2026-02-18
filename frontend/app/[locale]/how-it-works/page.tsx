'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function HowItWorksPage() {
  const t = useTranslations('howItWorksPage')

  return (
    <div className="min-h-screen pt-24 pb-20" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-4xl mx-auto px-6">

        {/* Page title */}
        <h1 className="page-title mb-16 md:mb-20">
          {t('titleLine1')}<br />
          <span style={{ color: 'var(--accent-primary)' }}>{t('titleLine2')}</span>
        </h1>

        {/* Inputs */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('inputs.title')}</h2>
          <div className="space-y-5 max-w-2xl">
            <p className="text-body">{t('inputs.paragraph1')}</p>
            <p className="text-body">{t('inputs.paragraph2')}</p>
          </div>
          <div className="mt-8">
            <Link
              href="/survey"
              className="inline-block px-10 py-4 text-white text-base font-semibold uppercase tracking-wider rounded hover:opacity-90 transition-opacity"
              style={{ background: 'var(--accent-primary)' }}
            >
              {t('inputs.buttonText')}
            </Link>
          </div>
        </section>

        {/* Result */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('result.title')}</h2>
          <div className="space-y-5 max-w-2xl">
            <p className="text-body">{t('result.paragraph1')}</p>
            <p className="text-body">{t('result.paragraph2')}</p>
          </div>
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
