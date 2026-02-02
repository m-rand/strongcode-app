'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

export default function HomePage() {
  const t = useTranslations('home')
  const tNav = useTranslations('nav')
  const [activeSection, setActiveSection] = useState('')

  // Active section tracking
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[id]')
      const scrollPosition = window.scrollY + 150

      sections.forEach((section) => {
        const element = section as HTMLElement
        const offsetTop = element.offsetTop
        const height = element.offsetHeight
        const id = element.id

        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + height) {
          setActiveSection(id)
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm" style={{ background: 'rgba(var(--bg-primary-rgb), 0.95)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-[1200px] mx-auto px-5 h-16 flex items-center justify-between">
          <div className="text-xl font-light tracking-tight">{t('brand')}</div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-light">
            <a href="#intro" className="transition-colors" style={{ color: 'var(--text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}>{tNav('intro')}</a>
            <a href="#features" className="transition-colors" style={{ color: 'var(--text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}>{tNav('features')}</a>
            <a href="#how-it-works" className="transition-colors" style={{ color: 'var(--text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}>{tNav('howItWorks')}</a>
            <a href="#look-inside" className="transition-colors" style={{ color: 'var(--text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}>{tNav('lookInside')}</a>
            <a href="#price" className="transition-colors" style={{ color: 'var(--text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}>{tNav('price')}</a>
            <a href="#about" className="transition-colors" style={{ color: 'var(--text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}>{tNav('about')}</a>
          </nav>
          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Language Switcher */}
            <LanguageSwitcher />

            <Link
              href="/login"
              className="text-sm font-light transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              {tNav('login')}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-[1200px] mx-auto px-5 pt-24 md:pt-28">
        {/* Intro Section */}
        <section id="intro" className="section-gap scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-10">
            <nav className="hidden lg:block sticky top-24 self-start">
              <div className="space-y-4 pr-5 border-r" style={{ borderColor: 'var(--border-color)' }}>
                <a href="#intro-what" className={`block text-sm font-light transition-all ${activeSection === 'intro-what' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'intro-what' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('intro.what.navTitle')}
                </a>
                <a href="#intro-who" className={`block text-sm font-light transition-all ${activeSection === 'intro-who' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'intro-who' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('intro.who.navTitle')}
                </a>
                <a href="#intro-expect" className={`block text-sm font-light transition-all ${activeSection === 'intro-expect' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'intro-expect' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('intro.expect.navTitle')}
                </a>
              </div>
            </nav>

            <div className="stack-xl">
              <div id="intro-what" className="scroll-mt-24">
                <h1 className="hero-title heading-gap-lg">
                  {t('intro.what.title')}
                </h1>

                <div className="border-l-4 pl-8 my-8" style={{ borderColor: 'var(--accent-primary)' }}>
                  <blockquote className="text-2xl md:text-3xl font-light italic leading-tight mb-4">
                    {t('quote.text')}
                  </blockquote>
                  <cite className="block text-base font-light" style={{ color: 'var(--accent-primary)' }}>{t('quote.author')}</cite>
                </div>

                <p className="text-body">
                  {t('intro.what.description')}
                </p>
              </div>

              <div id="intro-who" className="scroll-mt-24">
                <h2 className="section-title heading-gap-md">
                  {t('intro.who.title')}
                </h2>
                <div className="stack-md">
                  <p className="text-body">
                    {t('intro.who.description')}
                  </p>
                  <ul className="space-y-2 text-body pl-6">
                    <li className="list-disc">{t('intro.who.point1')}</li>
                    <li className="list-disc">{t('intro.who.point2')}</li>
                    <li className="list-disc">{t('intro.who.point3')}
                      <ul className="pl-6 mt-2 space-y-1">
                        <li className="list-disc">{t('intro.who.lifts.powerlifts')}</li>
                        <li className="list-disc">{t('intro.who.lifts.militaryPress')}</li>
                        <li className="list-disc">{t('intro.who.lifts.kettlebellSquat')}</li>
                        <li className="list-disc">{t('intro.who.lifts.pullups')}</li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>

              <div id="intro-expect" className="scroll-mt-24">
                <h2 className="section-title heading-gap-md">
                  {t('intro.expect.title')}
                </h2>
                <div className="stack-md">
                  <p className="text-body">
                    {t('intro.expect.paragraph1')}
                  </p>
                  <p className="text-body">
                    {t('intro.expect.paragraph2')}
                  </p>
                  <p className="text-body">
                    {t('intro.expect.paragraph3')}
                  </p>
                </div>
              </div>
            </div>

            <aside className="hidden lg:block text-meta space-y-4">
              <div className="border-l-2 pl-4" style={{ borderColor: 'var(--border-color)' }}>
                {t('intro.what.sidebar1')}
              </div>
              <div className="border-l-2 pl-4" style={{ borderColor: 'var(--border-color)' }}>
                {t('intro.what.sidebar2')}
              </div>
            </aside>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="section-gap scroll-mt-24 border-t section-divider" style={{ borderColor: 'var(--border-color)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-10">
            <nav className="hidden lg:block sticky top-24 self-start">
              <div className="space-y-4 pr-5 border-r" style={{ borderColor: 'var(--border-color)' }}>
                <a href="#features-tailored" className={`block text-sm font-light transition-all ${activeSection === 'features-tailored' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'features-tailored' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('features.tailored.navTitle')}
                </a>
                <a href="#features-unique" className={`block text-sm font-light transition-all ${activeSection === 'features-unique' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'features-unique' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('features.unique.navTitle')}
                </a>
                <a href="#features-joyful" className={`block text-sm font-light transition-all ${activeSection === 'features-joyful' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'features-joyful' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('features.joyful.navTitle')}
                </a>
                <a href="#features-longterm" className={`block text-sm font-light transition-all ${activeSection === 'features-longterm' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'features-longterm' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('features.longterm.navTitle')}
                </a>
                <a href="#features-hypertrophy" className={`block text-sm font-light transition-all ${activeSection === 'features-hypertrophy' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'features-hypertrophy' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('features.hypertrophy.navTitle')}
                </a>
                <a href="#features-benefits" className={`block text-sm font-light transition-all ${activeSection === 'features-benefits' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'features-benefits' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('features.benefits.navTitle')}
                </a>
              </div>
            </nav>

            <div className="stack-xl">
              <h1 className="page-title heading-gap-lg">{t('features.title')}</h1>

              <div id="features-tailored" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('features.tailored.title')}
                </h2>
                <p className="text-body">
                  {t('features.tailored.description')}
                </p>
              </div>

              <div id="features-unique" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('features.unique.title')}
                </h2>
                <div className="stack-md">
                  <p className="text-body">
                    {t('features.unique.paragraph1')}
                  </p>
                  <p className="text-body">
                    {t('features.unique.paragraph2')}
                  </p>
                  <ul className="space-y-2 text-body pl-6">
                    <li className="list-disc">{t('features.unique.point1')}</li>
                    <li className="list-disc">{t('features.unique.point2')}</li>
                    <li className="list-disc">{t('features.unique.point3')}</li>
                  </ul>
                  <p className="text-body">
                    {t('features.unique.paragraph3')}
                  </p>
                </div>
              </div>

              <div id="features-joyful" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('features.joyful.title')}
                </h2>
                <p className="text-body">
                  {t('features.joyful.description')}
                </p>
              </div>

              <div id="features-longterm" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('features.longterm.title')}
                </h2>
                <div className="stack-md">
                  <p className="text-body">
                    {t('features.longterm.paragraph1')}
                  </p>
                  <p className="text-body">
                    {t('features.longterm.paragraph2')}
                  </p>
                </div>
              </div>

              <div id="features-hypertrophy" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('features.hypertrophy.title')}
                </h2>
                <p className="text-body">
                  {t('features.hypertrophy.description')}
                </p>
              </div>

              <div id="features-benefits" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('features.benefits.title')}
                </h2>
                <ul className="space-y-2 text-body pl-6">
                  <li className="list-disc">{t('features.benefits.point1')}</li>
                  <li className="list-disc">{t('features.benefits.point2')}</li>
                  <li className="list-disc">{t('features.benefits.point3')}</li>
                  <li className="list-disc">{t('features.benefits.point4')}</li>
                  <li className="list-disc">{t('features.benefits.point5')}</li>
                  <li className="list-disc">{t('features.benefits.point6')}</li>
                  <li className="list-disc">{t('features.benefits.point7')}</li>
                </ul>
              </div>
            </div>

            <aside className="hidden lg:block text-meta space-y-4">
              <div className="border-l-2 pl-4" style={{ borderColor: 'var(--border-color)' }}>
                {t('features.sidebar1')}
              </div>
              <div className="border-l-2 pl-4" style={{ borderColor: 'var(--border-color)' }}>
                {t('features.sidebar2')}
              </div>
            </aside>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="section-gap scroll-mt-24 border-t section-divider" style={{ borderColor: 'var(--border-color)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-10">
            <nav className="hidden lg:block sticky top-24 self-start">
              <div className="space-y-4 pr-5 border-r" style={{ borderColor: 'var(--border-color)' }}>
                <a href="#inputs" className={`block text-sm font-light transition-all ${activeSection === 'inputs' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'inputs' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('howItWorks.inputs.navTitle')}
                </a>
                <a href="#result" className={`block text-sm font-light transition-all ${activeSection === 'result' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'result' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('howItWorks.result.navTitle')}
                </a>
              </div>
            </nav>

            <div className="stack-xl">
              <div id="inputs" className="scroll-mt-24">
                <h1 className="page-title heading-gap-lg">{t('howItWorks.title')}</h1>
                <div className="stack-md">
                  <p className="text-body">
                    {t('howItWorks.inputs.paragraph1')}
                  </p>
                  <p className="text-body">
                    {t('howItWorks.inputs.paragraph2')}
                  </p>
                </div>
                <Link
                  href="/survey"
                  className="inline-block mt-6 px-8 py-3 text-white text-base font-light rounded hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  {t('howItWorks.inputs.buttonText')}
                </Link>
              </div>

              <div id="result" className="scroll-mt-24">
                <div className="stack-md">
                  <p className="text-body">
                    {t('howItWorks.result.paragraph1')}
                  </p>
                  <p className="text-body">
                    {t('howItWorks.result.paragraph2')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Look Inside Section */}
        <section id="look-inside" className="section-gap scroll-mt-24 border-t section-divider" style={{ borderColor: 'var(--border-color)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-10">
            <nav className="hidden lg:block sticky top-24 self-start">
              <div className="space-y-4 pr-5 border-r" style={{ borderColor: 'var(--border-color)' }}>
                <a href="#how-beginners" className={`block text-sm font-light transition-all ${activeSection === 'how-beginners' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'how-beginners' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('lookInside.beginners.navTitle')}
                </a>
                <a href="#how-model" className={`block text-sm font-light transition-all ${activeSection === 'how-model' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'how-model' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('lookInside.model.navTitle')}
                </a>
                <a href="#how-factors" className={`block text-sm font-light transition-all ${activeSection === 'how-factors' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'how-factors' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('lookInside.factors.navTitle')}
                </a>
                <a href="#how-dynamics" className={`block text-sm font-light transition-all ${activeSection === 'how-dynamics' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'how-dynamics' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('lookInside.dynamics.navTitle')}
                </a>
                <a href="#how-ladders" className={`block text-sm font-light transition-all ${activeSection === 'how-ladders' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'how-ladders' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('lookInside.ladders.navTitle')}
                </a>
              </div>
            </nav>

            <div className="stack-xl">
              <h1 className="page-title heading-gap-lg">{t('lookInside.title')}</h1>

              <div id="how-beginners" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('lookInside.beginners.title')}
                </h2>
                <p className="text-body">
                  {t('lookInside.beginners.description')}
                </p>
              </div>

              <div id="how-model" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('lookInside.model.title')}
                </h2>
                <p className="text-body">
                  {t('lookInside.model.description')}
                </p>
              </div>

              <div id="how-factors" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('lookInside.factors.title')}
                </h2>
                <div className="stack-md">
                  <p className="text-body">
                    {t('lookInside.factors.paragraph1')}
                  </p>
                  <p className="text-body">
                    {t('lookInside.factors.paragraph2')}
                  </p>
                  <ul className="space-y-2 text-body pl-6">
                    <li className="list-disc">{t('lookInside.factors.point1')}</li>
                    <li className="list-disc">{t('lookInside.factors.point2')}</li>
                    <li className="list-disc">{t('lookInside.factors.point3')}</li>
                    <li className="list-disc">{t('lookInside.factors.point4')}</li>
                  </ul>
                </div>
              </div>

              <div id="how-dynamics" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('lookInside.dynamics.title')}
                </h2>
                <div className="stack-md">
                  <p className="text-body">
                    {t('lookInside.dynamics.paragraph1')}
                  </p>
                  <p className="text-body">
                    <strong className="font-semibold">{t('lookInside.dynamics.paragraph2')}</strong>
                  </p>
                  <ul className="space-y-2 text-body pl-6">
                    <li className="list-disc"><strong className="font-semibold">{t('lookInside.dynamics.point1Title')}</strong> {t('lookInside.dynamics.point1')}</li>
                    <li className="list-disc"><strong className="font-semibold">{t('lookInside.dynamics.point2Title')}</strong> {t('lookInside.dynamics.point2')}</li>
                    <li className="list-disc"><strong className="font-semibold">{t('lookInside.dynamics.point3Title')}</strong> {t('lookInside.dynamics.point3')}</li>
                  </ul>
                  {t('lookInside.dynamics.keyTakeawayTitle') && (
                    <>
                      <h3 className="subsection-title heading-gap-sm mt-6">
                        {t('lookInside.dynamics.keyTakeawayTitle')}
                      </h3>
                      <p className="text-body">
                        {t('lookInside.dynamics.keyTakeaway')}
                      </p>
                    </>
                  )}
                  {!t('lookInside.dynamics.keyTakeawayTitle') && (
                    <p className="text-body mt-4">
                      {t('lookInside.dynamics.keyTakeaway')}
                    </p>
                  )}
                </div>
              </div>

              <div id="how-ladders" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('lookInside.ladders.title')}
                </h2>
                <p className="text-body">
                  {t('lookInside.ladders.description')}
                </p>
              </div>
            </div>

            <aside className="hidden lg:block text-meta space-y-4">
              <div className="border-l-2 pl-4" style={{ borderColor: 'var(--border-color)' }}>
                {t('lookInside.sidebar1')}
              </div>
              <div className="border-l-2 pl-4" style={{ borderColor: 'var(--border-color)' }}>
                {t('lookInside.sidebar2')}
              </div>
            </aside>
          </div>
        </section>

        {/* Price Section */}
        <section id="price" className="section-gap scroll-mt-24 border-t section-divider" style={{ borderColor: 'var(--border-color)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-10">
            <nav className="hidden lg:block sticky top-24 self-start">
              <div className="space-y-4 pr-5 border-r" style={{ borderColor: 'var(--border-color)' }}>
                <a href="#price-base" className={`block text-sm font-light transition-all ${activeSection === 'price-base' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'price-base' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('price.base.navTitle')}
                </a>
              </div>
            </nav>

            <div className="stack-xl">
              <h1 className="page-title heading-gap-lg">{t('price.title')}</h1>

              <div id="price-base" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('price.base.title')}
                </h2>
                <p className="text-3xl font-semibold mb-6" style={{ color: 'var(--accent-primary)' }}>
                  {t('price.base.amount')}
                </p>
                <div className="stack-md">
                  <p className="text-body">
                    {t('price.base.exampleIntro')}
                  </p>
                  <ul className="space-y-2 text-body pl-6">
                    <li className="list-disc">{t('price.base.example1')}</li>
                    <li className="list-disc">{t('price.base.example2')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <aside className="hidden lg:block text-meta space-y-4">
              <div className="border-l-2 pl-4" style={{ borderColor: 'var(--border-color)' }}>
                {t('price.sidebar1')}
              </div>
              <div className="border-l-2 pl-4" style={{ borderColor: 'var(--border-color)' }}>
                {t('price.sidebar2')}
              </div>
            </aside>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="section-gap scroll-mt-24 border-t section-divider" style={{ borderColor: 'var(--border-color)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_200px] gap-10">
            <nav className="hidden lg:block sticky top-24 self-start">
              <div className="space-y-4 pr-5 border-r" style={{ borderColor: 'var(--border-color)' }}>
                <a href="#about-intro" className={`block text-sm font-light transition-all ${activeSection === 'about-intro' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'about-intro' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('about.intro.navTitle')}
                </a>
                <a href="#about-vision" className={`block text-sm font-light transition-all ${activeSection === 'about-vision' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`} style={{ color: activeSection === 'about-vision' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {t('about.vision.navTitle')}
                </a>
              </div>
            </nav>

            <div className="stack-xl">
              <h1 className="page-title heading-gap-lg">{t('about.title')}</h1>

              <div id="about-intro" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('about.intro.title')}
                </h2>
                <div className="stack-md">
                  <p className="text-body">
                    {t('about.intro.description')}
                  </p>
                  <ul className="space-y-2 text-body pl-6">
                    <li className="list-disc">{t('about.intro.point1')}</li>
                    <li className="list-disc">{t('about.intro.point2')}</li>
                    <li className="list-disc">{t('about.intro.point3')}</li>
                    <li className="list-disc">{t('about.intro.point4')}</li>
                  </ul>
                </div>
              </div>

              <div id="about-vision" className="scroll-mt-24">
                <h2 className="subsection-title heading-gap-md">
                  {t('about.vision.title')}
                </h2>
                <p className="text-body">
                  {t('about.vision.description')}
                </p>
              </div>
            </div>

            <aside className="hidden lg:block text-meta space-y-4">
              <div className="border-l-2 pl-4" style={{ borderColor: 'var(--border-color)' }}>
                {t('about.sidebar1')}
              </div>
              <div className="border-l-2 pl-4" style={{ borderColor: 'var(--border-color)' }}>
                {t('about.sidebar2')}
              </div>
            </aside>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-gap py-16 md:py-24 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <div className="text-center px-6">
            <h2 className="section-title heading-gap-md">
              {t('cta.title')}
            </h2>
            <p className="text-body mb-8 max-w-2xl mx-auto">
              {t('cta.description')}
            </p>
            <Link
              href="/survey"
              className="inline-block px-10 py-4 text-white text-lg font-light rounded hover:opacity-90 transition-opacity"
              style={{ background: 'var(--accent-primary)' }}
            >
              {t('cta.buttonText')}
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="text-center text-meta">
            {t('footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  )
}
