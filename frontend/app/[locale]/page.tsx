'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export default function HomePage() {
  const t = useTranslations('home')
  const tNav = useTranslations('nav')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* ──────────────────────── HEADER ──────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
        style={{
          background: 'rgba(var(--bg-primary-rgb), 0.92)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t('brand')}
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-light tracking-wide uppercase">
            {(['features', 'howItWorks', 'price', 'about'] as const).map((key) => (
              <a
                key={key}
                href={`#${key === 'howItWorks' ? 'how-it-works' : key}`}
                className="transition-opacity hover:opacity-60"
                style={{ color: 'var(--text-primary)' }}
              >
                {tNav(key)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Link
              href="/login"
              className="text-sm font-light transition-opacity hover:opacity-60 ml-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {tNav('login')}
            </Link>
          </div>
        </div>
      </header>

      {/* ──────────────────────── HERO ──────────────────────── */}
      <section className="min-h-screen pt-16 px-6 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-4 py-12 lg:py-0">
            {/* Left — Typography */}
            <div className="space-y-8 lg:space-y-10">
              <h1 className="hero-title">
                {t('hero.titleLine1')}<br />
                <span style={{ color: 'var(--accent-primary)' }}>{t('hero.titleLine2')}</span><br />
                {t('hero.titleLine3')}
              </h1>

              <p className="text-subtitle max-w-lg">
                {t('hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link
                  href="/survey"
                  className="inline-block px-10 py-4 text-white text-base font-semibold uppercase tracking-wider rounded hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  {t('hero.cta')}
                </Link>
                <span className="text-meta">{t('hero.ctaNote')}</span>
              </div>
            </div>

            {/* Right — Image with accent offset shadow */}
            <div className="lg:pl-4">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=800&fit=crop&q=80"
                  alt="Gym interior"
                  className="w-full h-80 lg:h-[580px] object-cover rounded-lg shadow-2xl relative z-10"
                />
                <div
                  className="absolute -bottom-4 -left-4 w-full h-full rounded-lg -z-0"
                  style={{ background: 'var(--accent-primary)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────── MARQUEE STRIP ──────────────────────── */}
      <div
        className="py-5 overflow-hidden border-y"
        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
      >
        <div className="marquee-track">
          <span className="marquee-content text-sm font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-secondary)' }}>
            {t('marquee')}&nbsp;&nbsp;·&nbsp;&nbsp;{t('marquee')}&nbsp;&nbsp;·&nbsp;&nbsp;{t('marquee')}&nbsp;&nbsp;·&nbsp;&nbsp;
          </span>
          <span className="marquee-content text-sm font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-secondary)' }} aria-hidden="true">
            {t('marquee')}&nbsp;&nbsp;·&nbsp;&nbsp;{t('marquee')}&nbsp;&nbsp;·&nbsp;&nbsp;{t('marquee')}&nbsp;&nbsp;·&nbsp;&nbsp;
          </span>
        </div>
      </div>

      {/* ──────────────────────── WHAT IS STRONGCODE ──────────────────────── */}
      <section id="features" className="py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-12 lg:gap-20">
            {/* Left — Text */}
            <div className="space-y-8">
              <h2 className="section-title">
                {t('what.titleLine1')}<br />
                <span style={{ color: 'var(--accent-primary)' }}>{t('what.titleLine2')}</span>
              </h2>

              <p className="text-body max-w-lg">
                {t('what.description')}
              </p>

              <p className="text-body font-semibold max-w-lg" style={{ color: 'var(--text-primary)' }}>
                {t('what.highlight')}
              </p>

              <a
                href="#how-it-works"
                className="flickr-link inline-flex items-center gap-3 text-base font-bold uppercase tracking-wider"
                style={{ color: 'var(--accent-primary)' }}
              >
                <span className="border-b-2" style={{ borderColor: 'var(--accent-primary)' }}>{tNav('howItWorks')}</span>
                <svg className="arrow w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
            </div>

            {/* Right — Image */}
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&h=600&fit=crop&q=80"
                alt="Barbell closeup"
                className="w-full h-72 lg:h-96 object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────── HOW IT WORKS ──────────────────────── */}
      <section
        id="how-it-works"
        className="py-20 md:py-32 px-6"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title mb-16 md:mb-20">
            {t('howItWorks.titleLine1')}<br />
            <span style={{ color: 'var(--accent-primary)' }}>{t('howItWorks.titleLine2')}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {([1, 2, 3] as const).map((step) => (
              <div key={step} className="space-y-4">
                <div
                  className="text-6xl md:text-7xl font-black leading-none"
                  style={{ color: 'var(--accent-primary)', opacity: 0.25 }}
                >
                  {t(`howItWorks.step${step}.number`)}
                </div>
                <h3 className="subsection-title">
                  {t(`howItWorks.step${step}.title`)}
                </h3>
                <p className="text-body">
                  {t(`howItWorks.step${step}.description`)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <Link
              href="/survey"
              className="flickr-link inline-flex items-center gap-3 text-base font-bold uppercase tracking-wider"
              style={{ color: 'var(--accent-primary)' }}
            >
              <span className="border-b-2" style={{ borderColor: 'var(--accent-primary)' }}>{t('hero.cta')}</span>
              <svg className="arrow w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────── WHO IS IT FOR ──────────────────────── */}
      <section className="py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-20">
            {/* Left — Image */}
            <div className="relative order-2 lg:order-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop&q=80"
                alt="Powerlifting"
                className="w-full h-72 lg:h-96 object-cover rounded-lg"
              />
            </div>

            {/* Right — Text */}
            <div className="space-y-8 order-1 lg:order-2">
              <h2 className="section-title">
                {t('whoFor.titleLine1')}<br />
                <span style={{ color: 'var(--accent-primary)' }}>{t('whoFor.titleLine2')}</span>
              </h2>

              <p className="text-body max-w-lg">
                {t('whoFor.description')}
              </p>

              <ul className="space-y-3">
                {([1, 2, 3, 4] as const).map((i) => (
                  <li key={i} className="flex items-start gap-3 text-body">
                    <span
                      className="mt-2 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: 'var(--accent-primary)' }}
                    />
                    {t(`whoFor.point${i}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────── FEATURES GRID ──────────────────────── */}
      <section
        className="py-20 md:py-32 px-6"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title mb-16 md:mb-20">
            {t('featureCards.titleLine1')}<br />
            <span style={{ color: 'var(--accent-primary)' }}>{t('featureCards.titleLine2')}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {(['tailored', 'unique', 'longterm', 'flexible'] as const).map((key) => (
              <div
                key={key}
                className="p-8 md:p-10 rounded-lg border transition-shadow hover:shadow-lg"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}
              >
                <h3 className="subsection-title mb-4">
                  {t(`featureCards.${key}.title`)}
                </h3>
                <p className="text-body">
                  {t(`featureCards.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────── QUOTE ──────────────────────── */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <blockquote
            className="text-2xl md:text-4xl font-light italic leading-snug mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            &ldquo;{t('quote.text')}&rdquo;
          </blockquote>
          <cite className="text-base font-semibold not-italic" style={{ color: 'var(--accent-primary)' }}>
            {t('quote.author')}
          </cite>
        </div>
      </section>

      {/* ──────────────────────── PRICE ──────────────────────── */}
      <section
        id="price"
        className="py-20 md:py-32 px-6"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-12 lg:gap-20">
            {/* Left — Big price */}
            <div className="space-y-6">
              <h2 className="section-title">
                {t('pricing.titleLine1')}
              </h2>

              <div className="flex items-baseline gap-3 mt-8">
                <span className="text-7xl md:text-8xl font-black" style={{ color: 'var(--accent-primary)' }}>
                  {t('pricing.amount')}
                </span>
                <div className="text-body">
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('pricing.currency')}</div>
                  <div>{t('pricing.unit')}</div>
                </div>
              </div>
            </div>

            {/* Right — Examples */}
            <div className="space-y-6 lg:pt-16">
              <div
                className="p-6 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}
              >
                <p className="text-body">{t('pricing.example1')}</p>
              </div>
              <div
                className="p-6 rounded-lg border"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}
              >
                <p className="text-body">{t('pricing.example2')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────── COACH ──────────────────────── */}
      <section id="about" className="py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-20">
            {/* Left — Text */}
            <div className="space-y-8">
              <h2 className="section-title">
                {t('coach.titleLine1')}<br />
                <span style={{ color: 'var(--accent-primary)' }}>{t('coach.titleLine2')}</span>
              </h2>

              <h3 className="subsection-title" style={{ color: 'var(--accent-primary)' }}>
                {t('coach.name')}
              </h3>

              <p className="text-body max-w-lg">
                {t('coach.description')}
              </p>

              <ul className="space-y-3">
                {([1, 2, 3, 4] as const).map((i) => (
                  <li key={i} className="flex items-start gap-3 text-body">
                    <span
                      className="mt-2 w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: 'var(--accent-primary)' }}
                    />
                    {t(`coach.point${i}`)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — Photo with accent offset shadow */}
            <div className="relative">
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
          </div>
        </div>
      </section>

      {/* ──────────────────────── CTA ──────────────────────── */}
      <section
        className="py-20 md:py-28 px-6"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="section-title">
            {t('ctaSection.titleLine1')}<br />
            <span style={{ color: 'var(--accent-primary)' }}>{t('ctaSection.titleLine2')}</span>
          </h2>

          <p className="text-subtitle">
            {t('ctaSection.description')}
          </p>

          <Link
            href="/survey"
            className="inline-block px-12 py-5 text-white text-lg font-semibold uppercase tracking-wider rounded hover:opacity-90 transition-opacity"
            style={{ background: 'var(--accent-primary)' }}
          >
            {t('ctaSection.button')}
          </Link>
        </div>
      </section>

      {/* ──────────────────────── FOOTER ──────────────────────── */}
      <footer className="border-t py-8" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-meta">
            {t('footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  )
}
