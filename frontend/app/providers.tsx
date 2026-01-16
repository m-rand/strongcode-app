'use client'

import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider } from 'next-intl'
import type { AbstractIntlMessages } from 'next-intl'

type ProvidersProps = {
  children: React.ReactNode
  messages?: AbstractIntlMessages
  locale?: string
}

export function Providers({ children, messages, locale }: ProvidersProps) {
  if (messages && locale) {
    return (
      <SessionProvider>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </SessionProvider>
    )
  }

  return <SessionProvider>{children}</SessionProvider>
}
