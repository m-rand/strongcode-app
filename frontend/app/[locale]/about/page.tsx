'use client'

import { useTranslations } from 'next-intl'
import { SubpageHeader } from '@/components/SubpageHeader'

export default function AboutPage() {
  const t = useTranslations('aboutPage')

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

        </div>
      </main>
    </div>
  )
}
