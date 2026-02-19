'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { SubpageHeader } from '@/components/SubpageHeader'

export default function IntroPage() {
  const t = useTranslations('introPage')

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

          {/* What is StrongCode */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('what.title')}</h2>
          <p className="text-body max-w-2xl">{t('what.description')}</p>
        </section>

        {/* Who is it for */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('who.title')}</h2>
          <p className="text-body max-w-2xl mb-6">{t('who.description')}</p>

          <ul className="space-y-3 mb-6">
            {(['point1', 'point2'] as const).map((key) => (
              <li key={key} className="flex items-start gap-3 text-body">
                <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent-primary)' }} />
                {t(`who.${key}`)}
              </li>
            ))}
          </ul>

          <p className="text-body max-w-2xl mb-4">{t('who.point3')}</p>
          <ul className="space-y-2 pl-6">
            {(['powerlifts', 'militaryPress', 'kettlebellSquat', 'pullups'] as const).map((lift) => (
              <li key={lift} className="text-body list-disc">{t(`who.lifts.${lift}`)}</li>
            ))}
          </ul>
        </section>

        {/* What to expect */}
        <section className="mb-16 md:mb-24">
          <h2 className="subsection-title mb-6">{t('expect.title')}</h2>
          <div className="space-y-5 max-w-2xl">
            <p className="text-body">{t('expect.paragraph1')}</p>
            <p className="text-body">{t('expect.paragraph2')}</p>
            <p className="text-body">{t('expect.paragraph3')}</p>
          </div>
        </section>

          </div>
        </div>
      </main>
    </div>
  )
}
