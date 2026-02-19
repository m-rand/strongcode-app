'use client'

import { useTranslations } from 'next-intl'
import { SubpageHeader } from '@/components/SubpageHeader'

export default function LookInsidePage() {
  const t = useTranslations('lookInsidePage')

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

          </div>
        </div>
      </main>
    </div>
  )
}
