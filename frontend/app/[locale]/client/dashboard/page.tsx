'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

interface OneRMEntry {
  date: string
  squat: number
  bench_press: number
  deadlift: number
  tested: boolean
  notes?: string
}

interface Program {
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
  const locale = useLocale()
  const router = useRouter()
  const { data: session, status } = useSession()

  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">{t('loading')}</p>
      </div>
    )
  }

  if (!session || session.user?.role !== 'client') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">{t('accessDenied')}</p>
      </div>
    )
  }

  const latestOneRM = clientData?.one_rm_history?.[0]
  const activeProgram = programs.find(p => p.status === 'active')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('welcome')}, {clientData?.name || session.user?.name}
              </h1>
              <p className="text-sm text-gray-600">{session.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              {tNav('logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current 1RM Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('currentOneRM')}</h2>
            {latestOneRM ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Squat</p>
                    <p className="text-2xl font-bold text-gray-900">{latestOneRM.squat}</p>
                    <p className="text-xs text-gray-500">kg</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Bench</p>
                    <p className="text-2xl font-bold text-gray-900">{latestOneRM.bench_press}</p>
                    <p className="text-xs text-gray-500">kg</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Deadlift</p>
                    <p className="text-2xl font-bold text-gray-900">{latestOneRM.deadlift}</p>
                    <p className="text-xs text-gray-500">kg</p>
                  </div>
                </div>
                <div className="text-center pt-4 border-t">
                  <p className="text-xs text-gray-500 uppercase">Total</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {latestOneRM.squat + latestOneRM.bench_press + latestOneRM.deadlift} kg
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('lastUpdated')}: {latestOneRM.date}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('noOneRM')}</p>
            )}
          </div>

          {/* Active Program Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('activeProgram')}</h2>
            {activeProgram ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    activeProgram.block === 'prep' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {activeProgram.block.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">{activeProgram.weeks} {t('weeks')}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
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
              <p className="text-gray-500 text-center py-4">{t('noActiveProgram')}</p>
            )}
          </div>

          {/* Survey Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('survey')}</h2>
            {clientData?.survey ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">
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
                <p className="text-sm text-gray-600 mb-4">{t('surveyNotCompleted')}</p>
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('allPrograms')} ({programs.length})
            </h2>
            {programs.length > 0 ? (
              <div className="space-y-2">
                {programs.slice(0, 3).map((program, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        program.block === 'prep' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {program.block}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">{program.startDate}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      program.status === 'active' ? 'bg-green-100 text-green-800' :
                      program.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {program.status}
                    </span>
                  </div>
                ))}
                {programs.length > 3 && (
                  <p className="text-sm text-gray-500 text-center pt-2">
                    +{programs.length - 3} {t('morePrograms')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{t('noPrograms')}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
