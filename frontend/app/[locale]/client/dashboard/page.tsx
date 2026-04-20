'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

interface OneRMEntry {
  date: string
  squat: number
  bench_press: number
  deadlift: number
  tested: boolean
  notes?: string
}

interface Program {
  id: number
  filename: string
  block: string
  startDate: string
  weeks: number
  status: string
  hasSessions: boolean
}

interface ClientData {
  name: string
  email: string
  skill_level: string
  one_rm_history: OneRMEntry[]
  survey?: any
}

export default function ClientDashboard() {
  const t = useTranslations('client.dashboard')
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const { data: session, status } = useSession()

  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`)
    }
  }, [status, router, locale])

  useEffect(() => {
    if (session?.user?.client_slug) {
      fetchClientData()
    }
  }, [session?.user?.client_slug])

  const fetchClientData = async () => {
    try {
      const response = await fetch(`/api/clients/${session?.user?.client_slug}`)
      if (!response.ok) throw new Error('Failed to load data')

      const data = await response.json()
      setClientData(data.client)
      setPrograms(data.programs || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('loading')}</p>
      </div>
    )
  }

  if (!session || session.user?.role !== 'client') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
        <p className="text-red-600">{t('accessDenied')}</p>
      </div>
    )
  }

  const latestOneRM = clientData?.one_rm_history?.[0]
  const activeProgram = programs.find(p => p.status === 'active')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('welcome')}, {clientData?.name || session.user?.name}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{session.user?.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <button
                onClick={() => setShowPasswordForm((prev) => !prev)}
                className="px-3 py-2 text-sm rounded border"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              >
                {tCommon('changePassword')}
              </button>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {error && (
          <div className="mb-6 p-4 border rounded-md" style={{ background: 'var(--bg-primary)', borderColor: '#fecaca' }}>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current 1RM Card */}
          <div className="rounded-lg p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('currentOneRM')}</h2>
            {latestOneRM ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>Squat</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{latestOneRM.squat}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>kg</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>Bench</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{latestOneRM.bench_press}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>kg</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>Deadlift</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{latestOneRM.deadlift}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>kg</p>
                  </div>
                </div>
                <div className="text-center pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>Total</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {latestOneRM.squat + latestOneRM.bench_press + latestOneRM.deadlift} kg
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {t('lastUpdated')}: {latestOneRM.date}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>{t('noOneRM')}</p>
            )}
          </div>

          {/* Active Program Card */}
          <div className="rounded-lg p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('activeProgram')}</h2>
            {activeProgram ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    activeProgram.block === 'prep' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {activeProgram.block.toUpperCase()}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{activeProgram.weeks} {t('weeks')}</span>
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('started')}: {activeProgram.startDate}
                </p>
                <Link
                  href={`/${locale}/client/programs/${encodeURIComponent(activeProgram.filename)}`}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  {t('viewProgram')}
                </Link>
              </div>
            ) : (
              <p className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>{t('noActiveProgram')}</p>
            )}
          </div>

          {/* Survey Card */}
          <div className="rounded-lg p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('survey')}</h2>
            {clientData?.survey ? (
              <div>
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {t('surveyCompleted')}: {new Date(clientData.survey.completed_at).toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US')}
                </p>
                <Link
                  href={`/${locale}/client/survey`}
                  className="inline-block px-4 py-2 border border-purple-300 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 text-sm"
                >
                  {t('updateSurvey')}
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{t('surveyNotCompleted')}</p>
                <Link
                  href={`/${locale}/client/survey`}
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  {t('fillSurvey')}
                </Link>
              </div>
            )}
          </div>

          {/* All Programs Card */}
          <div className="rounded-lg p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('allPrograms')} ({programs.length})
            </h2>
            {programs.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {programs.map((program) => (
                  <div key={program.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                    <div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        program.block === 'prep' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {program.block}
                      </span>
                      <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{program.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        program.status === 'active' ? 'bg-green-100 text-green-800' :
                        program.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {program.status}
                      </span>
                      <Link
                        href={`/${locale}/client/programs/${encodeURIComponent(program.filename)}`}
                        className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        {t('viewProgram')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>{t('noPrograms')}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
