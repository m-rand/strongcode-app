'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

interface Template {
  id: number
  slug: string
  name: string
  description: string | null
  scope: 'full' | 'single_lift'
  lift: string | null
  block: 'prep' | 'comp'
  weeks: number
  infoSummary?: string | null
  sourceProgramFilename: string | null
  createdAt: string
  createdBy: string | null
}

interface ProgramSummary {
  filename: string
  client: string
  clientName: string
  block: string
  weeks: number
  status: string
}

interface ClientSummary {
  slug: string
  name: string
}

const LIFT_LABELS: Record<string, string> = {
  squat: 'Squat',
  bench_press: 'Bench Press',
  deadlift: 'Deadlift',
}

export default function AdminTemplatesPage() {
  const router = useRouter()
  const t = useTranslations('admin.templates')
  const locale = useLocale()

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filters
  const [blockFilter, setBlockFilter] = useState('')
  const [scopeFilter, setScopeFilter] = useState('')
  const [liftFilter, setLiftFilter] = useState('')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [programs, setPrograms] = useState<ProgramSummary[]>([])
  const [programsLoading, setProgramsLoading] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    scope: 'full' as 'full' | 'single_lift',
    lift: 'squat' as string,
    sourceProgramKey: '',
    block: 'prep' as 'prep' | 'comp',
    weeks: 4,
  })
  const [creating, setCreating] = useState(false)

  // Apply modal
  const [applyTemplate, setApplyTemplate] = useState<Template | null>(null)
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [applyForm, setApplyForm] = useState({ clientSlug: '', startDate: '' })
  const [applying, setApplying] = useState(false)

  // Delete
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [duplicatingSlug, setDuplicatingSlug] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (blockFilter) params.set('block', blockFilter)
      if (scopeFilter) params.set('scope', scopeFilter)
      if (liftFilter) params.set('lift', liftFilter)
      const qs = params.toString()
      const response = await fetch(`/api/program-templates${qs ? `?${qs}` : ''}`)
      if (!response.ok) throw new Error('Failed to load templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [blockFilter, scopeFilter, liftFilter])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const fetchPrograms = async () => {
    setProgramsLoading(true)
    try {
      const response = await fetch('/api/programs')
      if (!response.ok) throw new Error('Failed to load programs')
      const data = await response.json()
      setPrograms(data.programs || [])
    } catch {
      setError('Failed to load programs')
    } finally {
      setProgramsLoading(false)
    }
  }

  const fetchClients = async () => {
    setClientsLoading(true)
    try {
      const response = await fetch('/api/clients')
      if (!response.ok) throw new Error('Failed to load clients')
      const data = await response.json()
      const list = Array.isArray(data?.clients) ? data.clients : []
      setClients(list.map((c: { slug: string; name: string }) => ({ slug: c.slug, name: c.name })))
    } catch {
      setError('Failed to load clients')
    } finally {
      setClientsLoading(false)
    }
  }

  const openCreate = () => {
    setShowCreate(true)
    setCreateForm({
      name: '',
      description: '',
      scope: 'full',
      lift: 'squat',
      sourceProgramKey: '',
      block: 'prep',
      weeks: 4,
    })
    fetchPrograms()
  }

  const openApply = (tmpl: Template) => {
    setApplyTemplate(tmpl)
    setApplyForm({ clientSlug: '', startDate: new Date().toISOString().split('T')[0] })
    fetchClients()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const selected = programs.find((p) => `${p.client}::${p.filename}` === createForm.sourceProgramKey)
    if (!createForm.name.trim()) return
    setCreating(true)
    setError('')
    try {
      let payloadProgram: unknown = undefined
      if (selected) {
        const programResponse = await fetch(
          `/api/programs/${encodeURIComponent(selected.client)}/${encodeURIComponent(selected.filename)}`,
        )
        const programData = await programResponse.json()
        if (!programResponse.ok || !programData?.program) {
          throw new Error(programData?.error || 'Failed to load source program')
        }
        payloadProgram = programData.program
      }

      const response = await fetch('/api/program-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || undefined,
          scope: createForm.scope,
          lift: createForm.scope === 'single_lift' ? createForm.lift : undefined,
          block: createForm.block,
          weeks: createForm.weeks,
          ...(payloadProgram ? { program: payloadProgram } : {}),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create template')
      setShowCreate(false)
      setSuccess(t('created'))
      setTimeout(() => setSuccess(''), 3000)
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
    } finally {
      setCreating(false)
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!applyTemplate || !applyForm.clientSlug) return
    setApplying(true)
    setError('')
    try {
      const response = await fetch('/api/program-templates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSlug: applyForm.clientSlug,
          startDate: applyForm.startDate || undefined,
          fullTemplateSlug: applyTemplate.scope === 'full' ? applyTemplate.slug : undefined,
          liftTemplates: applyTemplate.scope === 'single_lift'
            ? { [applyTemplate.lift!]: applyTemplate.slug }
            : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to apply template')
      setApplyTemplate(null)
      setSuccess(t('applied'))
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply template')
    } finally {
      setApplying(false)
    }
  }

  const handleDelete = async (tmpl: Template) => {
    if (!confirm(t('confirmDelete', { name: tmpl.name }))) return
    setDeletingSlug(tmpl.slug)
    setError('')
    try {
      const response = await fetch(`/api/program-templates/${tmpl.slug}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to delete template')
      setSuccess(t('deleted'))
      setTimeout(() => setSuccess(''), 3000)
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    } finally {
      setDeletingSlug(null)
    }
  }

  const handleDuplicate = async (tmpl: Template) => {
    setDuplicatingSlug(tmpl.slug)
    setError('')
    try {
      const response = await fetch(`/api/program-templates/${encodeURIComponent(tmpl.slug)}/duplicate`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to duplicate template')

      const duplicated = data?.template as Template | undefined
      setSuccess('Template duplicated')
      setTimeout(() => setSuccess(''), 3000)
      if (duplicated?.slug) {
        router.push(`/${locale}/admin/create?editTemplate=${encodeURIComponent(duplicated.slug)}`)
        return
      }
      await fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate template')
    } finally {
      setDuplicatingSlug(null)
    }
  }

  const selectedProgram = programs.find(
    (p) => `${p.client}::${p.filename}` === createForm.sourceProgramKey,
  )
  const uniqueSourcePrograms = programs.filter((program, index, all) => (
    all.findIndex((candidate) => (
      candidate.client === program.client && candidate.filename === program.filename
    )) === index
  ))

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
              <Link href={`/${locale}/admin/dashboard`} className="text-blue-600 hover:text-blue-800 text-sm">
                {t('backToDashboard')}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            </div>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              + {t('createTemplate')}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800"
          >
            <option value="">{t('table.block')}: {t('filterAll')}</option>
            <option value="prep">Prep</option>
            <option value="comp">Comp</option>
          </select>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800"
          >
            <option value="">{t('table.scope')}: {t('filterAll')}</option>
            <option value="full">{t('scopeFull')}</option>
            <option value="single_lift">{t('scopeSingleLift')}</option>
          </select>
          <select
            value={liftFilter}
            onChange={(e) => setLiftFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800"
          >
            <option value="">{t('table.lift')}: {t('filterAll')}</option>
            <option value="squat">Squat</option>
            <option value="bench_press">Bench Press</option>
            <option value="deadlift">Deadlift</option>
          </select>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noTemplates')}</h3>
            <p className="text-gray-600 mb-6">{t('noTemplatesDescription')}</p>
            <button
              onClick={openCreate}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('createFromProgram')}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.scope')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.block')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.weeks')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">INFO</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((tmpl) => (
                  <tr key={tmpl.slug} className="hover:bg-gray-50">
                    <td className="px-6 py-4 align-top min-w-[360px]">
                      <div className="text-sm font-medium text-gray-900 break-words">{tmpl.name}</div>
                      {tmpl.description && (
                        <div className="text-xs text-gray-500 break-words whitespace-normal">{tmpl.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tmpl.scope === 'full' ? 'bg-purple-100 text-purple-800' : 'bg-cyan-100 text-cyan-800'
                      }`}>
                        {tmpl.scope === 'full' ? t('scopeFull') : LIFT_LABELS[tmpl.lift || ''] || tmpl.lift}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tmpl.block === 'prep' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {tmpl.block}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tmpl.weeks}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 min-w-[260px]">
                      {tmpl.infoSummary || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/${locale}/admin/create?editTemplate=${encodeURIComponent(tmpl.slug)}`}
                          className="px-2 py-1 text-xs font-semibold rounded bg-gray-600 text-white hover:bg-gray-700"
                        >
                          {t('edit')}
                        </Link>
                        <button
                          onClick={() => openApply(tmpl)}
                          className="px-2 py-1 text-xs font-semibold rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          {t('apply')}
                        </button>
                        <button
                          onClick={() => handleDuplicate(tmpl)}
                          disabled={duplicatingSlug === tmpl.slug}
                          className="px-2 py-1 text-xs font-semibold rounded bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
                        >
                          {duplicatingSlug === tmpl.slug ? 'Duplicating...' : 'Duplicate'}
                        </button>
                        <button
                          onClick={() => handleDelete(tmpl)}
                          disabled={deletingSlug === tmpl.slug}
                          className="px-2 py-1 text-xs font-semibold rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {deletingSlug === tmpl.slug ? t('deleting') : t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('createTemplateTitle')}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templateName')}</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                  placeholder="e.g. Heavy squat prep 4w"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templateDescription')}</label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('table.scope')}</label>
                  <select
                    value={createForm.scope}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, scope: e.target.value as 'full' | 'single_lift' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                  >
                    <option value="full">{t('scopeFull')} ({t('allLifts')})</option>
                    <option value="single_lift">{t('scopeSingleLift')}</option>
                  </select>
                </div>
                {createForm.scope === 'single_lift' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('table.lift')}</label>
                    <select
                      value={createForm.lift}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, lift: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                    >
                      <option value="squat">Squat</option>
                      <option value="bench_press">Bench Press</option>
                      <option value="deadlift">Deadlift</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectProgram')}</label>
                <select
                  value={createForm.sourceProgramKey}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, sourceProgramKey: e.target.value }))}
                  disabled={programsLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                >
                  <option value="">{programsLoading ? '...' : 'No source program (new template)'}</option>
                  {uniqueSourcePrograms.map((p) => (
                    <option key={`${p.client}::${p.filename}`} value={`${p.client}::${p.filename}`}>
                      {p.clientName} — {p.filename} ({p.block}, {p.weeks}w)
                    </option>
                  ))}
                </select>
                {selectedProgram && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedProgram.clientName} / {selectedProgram.block} / {selectedProgram.weeks} weeks / {selectedProgram.status}
                  </p>
                )}
              </div>

              {!createForm.sourceProgramKey && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('table.block')}</label>
                    <select
                      value={createForm.block}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, block: e.target.value as 'prep' | 'comp' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                    >
                      <option value="prep">Prep</option>
                      <option value="comp">Comp</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('table.weeks')}</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={createForm.weeks}
                      onChange={(e) => {
                        const numeric = Number(e.target.value)
                        setCreateForm((prev) => ({
                          ...prev,
                          weeks: Number.isFinite(numeric) ? Math.max(1, Math.min(6, Math.round(numeric))) : 4,
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={creating || !createForm.name.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {creating ? t('saving') : t('save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Apply Modal */}
      {applyTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={handleApply}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-1">{t('applyToClient')}</h2>
            <p className="text-sm text-gray-500 mb-4">
              {applyTemplate.name} ({applyTemplate.block}, {applyTemplate.weeks}w)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectClient')}</label>
                <select
                  required
                  value={applyForm.clientSlug}
                  onChange={(e) => setApplyForm((prev) => ({ ...prev, clientSlug: e.target.value }))}
                  disabled={clientsLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                >
                  <option value="">{clientsLoading ? '...' : '—'}</option>
                  {clients.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectStartDate')}</label>
                <input
                  type="date"
                  value={applyForm.startDate}
                  onChange={(e) => setApplyForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                />
              </div>

              {applyTemplate.scope === 'single_lift' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  This is a single-lift template ({LIFT_LABELS[applyTemplate.lift || '']}).
                  The apply endpoint requires all three lifts — use the API with liftTemplates to compose multiple single-lift templates.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setApplyTemplate(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={applying || !applyForm.clientSlug || applyTemplate.scope === 'single_lift'}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
              >
                {applying ? t('applying') : t('apply')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
