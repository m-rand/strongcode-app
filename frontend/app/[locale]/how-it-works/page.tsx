'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { SubpageHeader } from '@/components/SubpageHeader'

export default function HowItWorksPage() {
  const t = useTranslations('howItWorksPage')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <SubpageHeader />

      <main className="py-20 md:py-32 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Title Section */}
          <div className="mb-12 md:mb-16">
            <h1 className="page-title uppercase mb-8" style={{ color: 'var(--text-primary)' }}>
              {t('titleLine1')}<br />
              <span style={{ color: 'var(--accent-primary)' }}>{t('titleLine2')}.</span>
            </h1>
            <p className="text-subtitle max-w-2xl">{t('subtitle')}</p>
          </div>

          <div className="max-w-4xl mx-auto">

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

          </div>
        </div>
      </main>
    </div>
  )
}
