'use client'

import { useSession, signOut } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

type AdminNotification = {
  programFilename: string
  clientSlug: string
  clientName: string
  week: number
  lift: string
  sessionLetter: string
  performedDate: string
  loggedSets: number
  completedSets: number
  lastLoggedAt: string
}

function liftLabel(lift: string): string {
  if (lift === 'bench_press') return 'BP'
  if (lift === 'deadlift') return 'DL'
  return 'SQ'
}

function formatRelativeTime(dateIso: string, locale: string): string {
  const target = new Date(dateIso).getTime()
  if (Number.isNaN(target)) return dateIso
  const diffMs = target - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const absMinutes = Math.abs(diffMinutes)

  if (absMinutes < 60) return rtf.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')
  const diffDays = Math.round(diffHours / 24)
  return rtf.format(diffDays, 'day')
}

function notificationKey(item: AdminNotification): string {
  return [
    item.clientSlug,
    item.programFilename,
    item.week,
    item.lift,
    item.sessionLetter,
    item.performedDate,
    item.lastLoggedAt,
  ].join('|')
}

export default function AdminDashboard() {
  const t = useTranslations('admin.dashboard')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { data: session } = useSession()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsError, setNotificationsError] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [seenNotificationKeys, setSeenNotificationKeys] = useState<Set<string>>(new Set())

  const markNotificationsAsSeen = (items: AdminNotification[]) => {
    if (!items.length) return
    setSeenNotificationKeys((prev) => {
      const next = new Set(prev)
      for (const item of items) {
        next.add(notificationKey(item))
      }
      return next
    })
  }

  useEffect(() => {
    let cancelled = false

    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true)
        setNotificationsError('')
        const response = await fetch('/api/admin/notifications')
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load notifications')
        }
        if (!cancelled) {
          const loaded = Array.isArray(data?.notifications) ? data.notifications : []
          setNotifications(loaded)
          if (showNotifications) {
            markNotificationsAsSeen(loaded)
          }
        }
      } catch (error) {
        if (!cancelled) {
          setNotificationsError(error instanceof Error ? error.message : 'Failed to load notifications')
        }
      } finally {
        if (!cancelled) setNotificationsLoading(false)
      }
    }

    fetchNotifications()
    const intervalId = window.setInterval(fetchNotifications, 60000)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [showNotifications])

  const unreadNotificationsCount = notifications.filter(
    (item) => !seenNotificationKeys.has(notificationKey(item)),
  ).length

  const submitPasswordChange = async (event: React.FormEvent) => {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    const emailChanged = newEmail.trim().length > 0 && newEmail.trim().toLowerCase() !== (session?.user?.email || '').toLowerCase()
    const passwordChanged = newPassword.length > 0 || confirmPassword.length > 0

    if (!emailChanged && !passwordChanged) {
      setPasswordError(tCommon('noAccountChanges'))
      return
    }

    if (passwordChanged && newPassword.length < 8) {
      setPasswordError(tCommon('passwordTooShort'))
      return
    }

    if (passwordChanged && newPassword !== confirmPassword) {
      setPasswordError(tCommon('passwordMismatch'))
      return
    }

    try {
      setPasswordLoading(true)
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, newEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPasswordError(data.error || tCommon('passwordUpdateFailed'))
        return
      }

      setCurrentPassword('')
      setNewEmail('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage(tCommon('accountUpdated'))
      setShowPasswordForm(false)

      if (data.emailChanged) {
        await signOut({ callbackUrl: `/${locale}/login` })
      }
    } catch {
      setPasswordError(tCommon('passwordUpdateFailed'))
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p style={{ color: 'var(--text-secondary)' }}>{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('title')}
            </h1>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <button
                onClick={() => {
                  const nextOpen = !showNotifications
                  setShowNotifications(nextOpen)
                  if (nextOpen) {
                    markNotificationsAsSeen(notifications)
                  }
                }}
                className="px-3 py-2 text-sm rounded border flex items-center gap-2"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              >
                <span>{t('notifications.headerButton')}</span>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowPasswordForm((prev) => !prev)}
                className="px-3 py-2 text-sm rounded border"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              >
                {tCommon('changePassword')}
              </button>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {session.user?.name} ({session.user?.email})
              </span>
              <button
                onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                {tNav('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showNotifications && (
          <section
            className="mb-6 rounded-lg border p-4"
            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
          >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('notifications.title')}
            </h2>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t('notifications.refreshHint')}
            </span>
          </div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            {t('notifications.description')}
          </p>

          {notificationsLoading ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('notifications.loading')}
            </p>
          ) : notificationsError ? (
            <p className="text-sm text-red-600">{notificationsError}</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('notifications.empty')}
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {notifications.map((item, index) => (
                <div
                  key={`${item.clientSlug}-${item.programFilename}-${item.week}-${item.lift}-${item.sessionLetter}-${item.performedDate}-${index}`}
                  className="rounded border px-3 py-2"
                  style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      <span className="font-semibold">{item.clientName}</span>
                      {' · '}
                      {`W${item.week} ${liftLabel(item.lift)} ${item.sessionLetter}`}
                      {' · '}
                      {item.performedDate}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatRelativeTime(item.lastLoggedAt, locale)}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {t('notifications.sets', {
                        completed: item.completedSets,
                        logged: item.loggedSets,
                      })}
                    </span>
                    <Link
                      href={`/${locale}/client/programs/${encodeURIComponent(item.programFilename)}?adminPreview=1&client=${encodeURIComponent(item.clientSlug)}`}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {t('notifications.viewProgram')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          </section>
        )}

        {showPasswordForm && (
          <form
            onSubmit={submitPasswordChange}
            className="mb-6 p-4 rounded-lg border"
            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder={tCommon('newEmail')}
                className="input-field"
              />
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder={tCommon('currentPassword')}
                className="input-field"
                required
              />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder={tCommon('newPassword')}
                className="input-field"
                minLength={8}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={tCommon('confirmPassword')}
                className="input-field"
                minLength={8}
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-4 py-2 text-sm rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              >
                {passwordLoading ? tCommon('updatingPassword') : tCommon('changePassword')}
              </button>
              {passwordError && <span className="text-sm text-red-600">{passwordError}</span>}
              {passwordMessage && <span className="text-sm text-green-600">{passwordMessage}</span>}
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Program Card */}
          <Link href={`/${locale}/admin/create`}>
            <div
              className="rounded-lg p-6 transition-shadow cursor-pointer"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('cards.createProgram.title')}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('cards.createProgram.description')}
              </p>
            </div>
          </Link>

          {/* Import Program Card */}
          <Link href={`/${locale}/admin/import`}>
            <div
              className="rounded-lg p-6 transition-shadow cursor-pointer"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('cards.importProgram.title')}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('cards.importProgram.description')}
              </p>
            </div>
          </Link>

          {/* Clients Card */}
          <Link href={`/${locale}/admin/clients`}>
            <div
              className="rounded-lg p-6 transition-shadow cursor-pointer"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('cards.clients.title')}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('cards.clients.description')}
              </p>
            </div>
          </Link>

          {/* Programs Card */}
          <Link href={`/${locale}/admin/programs`}>
            <div
              className="rounded-lg p-6 transition-shadow cursor-pointer"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('cards.programs.title')}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('cards.programs.description')}
              </p>
            </div>
          </Link>

          {/* Templates Card */}
          <Link href={`/${locale}/admin/templates`}>
            <div
              className="rounded-lg p-6 transition-shadow cursor-pointer"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-orange-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('cards.templates.title')}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('cards.templates.description')}
              </p>
            </div>
          </Link>

          {/* Pending Surveys Card */}
          <Link href={`/${locale}/admin/surveys`}>
            <div
              className="rounded-lg p-6 transition-shadow cursor-pointer"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('cards.surveys.title')}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('cards.surveys.description')}
              </p>
            </div>
          </Link>

          {/* Settings Card */}
          <Link href={`/${locale}/admin/settings`}>
            <div
              className="rounded-lg p-6 transition-shadow cursor-pointer"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center mb-4">
                <div className="bg-slate-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 011.35-.936l1.3.744a1 1 0 001.02 0l1.3-.744a1 1 0 011.35.936l.066 1.495a1 1 0 00.587.86l1.356.62a1 1 0 01.51 1.31l-.51 1.407a1 1 0 000 .684l.51 1.407a1 1 0 01-.51 1.31l-1.356.62a1 1 0 00-.587.86l-.066 1.495a1 1 0 01-1.35.936l-1.3-.744a1 1 0 00-1.02 0l-1.3.744a1 1 0 01-1.35-.936l-.066-1.495a1 1 0 00-.587-.86l-1.356-.62a1 1 0 01-.51-1.31l.51-1.407a1 1 0 000-.684l-.51-1.407a1 1 0 01.51-1.31l1.356-.62a1 1 0 00.587-.86l.066-1.495z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Settings
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Manage global instructions shown in all client programs.
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
