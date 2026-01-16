'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

export default function ImportProgramPage() {
  const router = useRouter()
  const t = useTranslations('admin.import')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [file, setFile] = useState<File | null>(null)
  const [jsonContent, setJsonContent] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.json')) {
        setError(t('onlyJson'))
        return
      }
      setFile(selectedFile)
      setError('')

      // Read file content
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          JSON.parse(content) // Validate JSON
          setJsonContent(content)
        } catch (err) {
          setError(t('invalidJson'))
        }
      }
      reader.readAsText(selectedFile)
    }
  }

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    setJsonContent(content)
    if (content.trim()) {
      try {
        JSON.parse(content)
        setError('')
      } catch (err) {
        setError(t('invalidJson'))
      }
    }
  }

  const handleImport = async () => {
    if (!jsonContent) {
      setError(t('selectFileOrPaste'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const programData = JSON.parse(jsonContent)

      const response = await fetch('/api/import-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(programData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || t('importFailed'))
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/${locale}/admin/programs`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || t('importError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/admin/dashboard`} className="text-blue-600 hover:text-blue-800">
              {t('backToDashboard')}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Mode Toggle */}
          <div className="flex gap-4 mb-6 border-b border-gray-200 pb-4">
            <button
              onClick={() => setUploadMode('file')}
              className={`px-4 py-2 rounded-md ${
                uploadMode === 'file'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('uploadFile')}
            </button>
            <button
              onClick={() => setUploadMode('paste')}
              className={`px-4 py-2 rounded-md ${
                uploadMode === 'paste'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('pasteJson')}
            </button>
          </div>

          {/* File Upload Mode */}
          {uploadMode === 'file' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('selectJsonFile')}
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  {t('selectedFile')}: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </div>
          )}

          {/* Paste JSON Mode */}
          {uploadMode === 'paste' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pasteJsonContent')}
              </label>
              <textarea
                value={jsonContent}
                onChange={handlePasteChange}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder='{"schema_version": "1.0", "meta": {...}, ...}'
              />
            </div>
          )}

          {/* Preview Info */}
          {jsonContent && !error && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">{t('preview')}</h3>
              <div className="text-sm text-blue-800">
                {(() => {
                  try {
                    const data = JSON.parse(jsonContent)
                    return (
                      <div className="space-y-1">
                        <p><span className="font-medium">{t('previewClient')}:</span> {data.client?.name || 'N/A'}</p>
                        <p><span className="font-medium">{t('previewBlock')}:</span> {data.program_info?.block || 'N/A'}</p>
                        <p><span className="font-medium">{t('previewWeeks')}:</span> {data.program_info?.weeks || 'N/A'}</p>
                        <p><span className="font-medium">{t('previewDate')}:</span> {data.program_info?.start_date || 'N/A'}</p>
                        <p><span className="font-medium">{t('previewSessions')}:</span> {data.sessions ? t('yes') : t('noOnlyTargets')}</p>
                      </div>
                    )
                  } catch {
                    return null
                  }
                })()}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✓ {t('success')}
              </p>
            </div>
          )}

          {/* Schema Info */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">ℹ️ {t('jsonFormat')}</h3>
            <p className="text-xs text-gray-600 mb-2">
              {t('mustContain')}:
            </p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li><code className="bg-gray-200 px-1 rounded">schema_version</code>: "1.0"</li>
              <li><code className="bg-gray-200 px-1 rounded">meta</code>: metadata (filename, created_at, status, ...)</li>
              <li><code className="bg-gray-200 px-1 rounded">client</code>: name, delta, one_rm</li>
              <li><code className="bg-gray-200 px-1 rounded">program_info</code>: block, start_date, weeks</li>
              <li><code className="bg-gray-200 px-1 rounded">input</code>: {t('inputParams')}</li>
              <li><code className="bg-gray-200 px-1 rounded">calculated</code>: {t('calculatedTargets')}</li>
              <li><code className="bg-gray-200 px-1 rounded">sessions</code>: {t('sessionData')}</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              {t('seeSchema')} <code className="bg-gray-200 px-1 rounded">schemas/program-complete.schema.json</code>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleImport}
              disabled={!jsonContent || !!error || loading || success}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? t('importing') : t('import')}
            </button>
            <Link
              href={`/${locale}/admin/dashboard`}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-center"
            >
              {tCommon('cancel')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
