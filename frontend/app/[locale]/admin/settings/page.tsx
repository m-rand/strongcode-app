'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function AdminSettingsPage() {
  const locale = useLocale()
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch('/api/settings/program-instructions')
        if (!response.ok) throw new Error('Failed to load settings')
        const data = await response.json()
        if (!cancelled) {
          setInstructions(typeof data?.instructions === 'string' ? data.instructions : '')
        }
      } catch {
        if (!cancelled) setMessage('Failed to load settings')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage('')
      const response = await fetch('/api/settings/program-instructions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save settings')
      }
      setMessage('Saved')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href={`/${locale}/admin/dashboard`} className="text-blue-600 hover:text-blue-800">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Global Program Instructions
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            These instructions are shown automatically in every client program.
          </p>

          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={12}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500"
            placeholder={loading ? 'Loading...' : 'Write default rules / FAQ here.'}
          />

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {message && (
              <span className={`text-sm ${message === 'Saved' ? 'text-green-700' : 'text-red-600'}`}>
                {message}
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
