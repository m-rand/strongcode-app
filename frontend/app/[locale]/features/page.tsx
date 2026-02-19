'use client'

import { useTranslations } from 'next-intl'
import { SubpageHeader } from '@/components/SubpageHeader'

export default function FeaturesPage() {
  const t = useTranslations('featuresPage')

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

          </div>
        </div>
      </main>
    </div>
  )
}
