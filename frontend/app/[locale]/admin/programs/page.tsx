'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'

interface Program {
  filename: string
  client: string
  clientName: string
  block: string
  startDate: string
  weeks: number
  status: string
  hasSessions: boolean
  filePath: string
}

export default function ProgramsListPage() {
  const { data: session } = useSession()
  const t = useTranslations('admin.programs')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/programs')
      if (!response.ok) throw new Error('Failed to load programs')

      const data = await response.json()
      setPrograms(data.programs || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${locale}/admin/dashboard`} className="text-blue-600 hover:text-blue-800">
                {t('backToDashboard')}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/${locale}/admin/import`}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                📥 {t('import')}
              </Link>
              <Link
                href={`/${locale}/admin/create`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + {t('createNew')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {programs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noPrograms')}</h3>
            <p className="text-gray-600 mb-6">
              {t('noProgramsDescription')}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href={`/${locale}/admin/create`}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {t('createProgram')}
              </Link>
              <Link
                href={`/${locale}/admin/import`}
                className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                {t('importProgram')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.client')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.block')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.start')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.weeks')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {programs.map((program, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {program.clientName}
                      </div>
                      <div className="text-xs text-gray-500">{program.filename}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          program.block === 'prep'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {program.block}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.startDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {program.weeks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          program.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : program.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {program.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {program.hasSessions ? (
                        <span className="text-green-600 text-sm">✓ {t('hasSessionsYes')}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">{t('hasSessionsNo')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/${locale}/admin/programs/${program.client}/${encodeURIComponent(program.filename)}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t('view')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
