'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

export default function NewClientPage() {
  const t = useTranslations('admin.newClient')
  const tClients = useTranslations('admin.clients')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skill_level: 'intermediate',
    squat: '',
    bench_press: '',
    deadlift: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          skill_level: formData.skill_level,
          one_rm: (formData.squat || formData.bench_press || formData.deadlift) ? {
            squat: parseFloat(formData.squat) || 0,
            bench_press: parseFloat(formData.bench_press) || 0,
            deadlift: parseFloat(formData.deadlift) || 0
          } : null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('createFailed'))
      }

      router.push(`/${locale}/admin/clients/${data.slug}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/admin/clients`}
              className="text-blue-600 hover:text-blue-800"
            >
              ← {tClients('title')}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('basicInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('namePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('skillLevel')}
                </label>
                <select
                  value={formData.skill_level}
                  onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">{tClients('skillLevels.beginner')}</option>
                  <option value="intermediate">{tClients('skillLevels.intermediate')}</option>
                  <option value="advanced">{tClients('skillLevels.advanced')}</option>
                  <option value="elite">{tClients('skillLevels.elite')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Initial 1RM (optional) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t('initialOneRM')}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('initialOneRMDescription')}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Squat (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.squat}
                  onChange={(e) => setFormData({ ...formData, squat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bench Press (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.bench_press}
                  onChange={(e) => setFormData({ ...formData, bench_press: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadlift (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.deadlift}
                  onChange={(e) => setFormData({ ...formData, deadlift: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href={`/${locale}/admin/clients`}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {tCommon('cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('creating') : t('createClient')}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
