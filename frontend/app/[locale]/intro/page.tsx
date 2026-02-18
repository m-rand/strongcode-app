'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function IntroPage() {
  const t = useTranslations('introPage')

  return (
    <div className="min-h-screen pt-24 pb-20" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-4xl mx-auto px-6">

        {/* Page title */}
        <h1 className="page-title mb-16 md:mb-20">
          {t('titleLine1')}<br />
          <span style={{ color: 'var(--accent-primary)' }}>{t('titleLine2')}</span>
        </h1>

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

        {/* Back link */}
        <Link
          href="/"
          className="flickr-link inline-flex items-center gap-3 text-base font-bold uppercase tracking-wider"
          style={{ color: 'var(--accent-primary)' }}
        >
          <svg className="arrow w-5 h-5 rotate-180" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="border-b-2" style={{ borderColor: 'var(--accent-primary)' }}>
            {t('titleLine2')}
          </span>
        </Link>
      </div>
    </div>
  )
}
