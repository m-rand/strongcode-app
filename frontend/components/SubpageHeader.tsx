'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'
import { Logo } from './Logo'
import { useState } from 'react'

const NAV_ITEMS = [
  { key: 'intro', href: '/intro' },
  { key: 'features', href: '/features' },
  { key: 'howItWorks', href: '/how-it-works' },
  { key: 'lookInside', href: '/look-inside' },
  { key: 'about', href: '/about' },
] as const

export function SubpageHeader() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Extract the subpath after locale, e.g. /cs/intro → /intro
  const segments = pathname.split('/')
  const currentPath = '/' + (segments[2] || '')

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
        style={{
          background: 'rgba(var(--bg-primary-rgb), 0.92)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            <Logo className="w-7 h-7" />
            StrongCode
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-light tracking-wide uppercase">
            {NAV_ITEMS.map(({ key, href }) => {
              const isActive = currentPath === href
              return (
                <Link
                  key={key}
                  href={href}
                  className="transition-opacity hover:opacity-60 pb-0.5"
                  style={{
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                    borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  }}
                >
                  {t(key)}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Link
              href="/login"
              className="hidden md:inline text-sm font-light transition-opacity hover:opacity-60 ml-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('login')}
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden ml-2 p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 pt-16"
          style={{ background: 'var(--bg-primary)' }}
        >
          <nav className="flex flex-col items-center gap-6 pt-12 text-lg font-light tracking-wide uppercase">
            {NAV_ITEMS.map(({ key, href }) => {
              const isActive = currentPath === href
              return (
                <Link
                  key={key}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                  }}
                >
                  {t(key)}
                </Link>
              )
            })}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-4 text-base"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('login')}
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
