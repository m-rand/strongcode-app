'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
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
    clientSlug: '',
    filename: '',
  })
  const [creating, setCreating] = useState(false)

  // Apply modal
  const [applyTemplate, setApplyTemplate] = useState<Template | null>(null)
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [applyForm, setApplyForm] = useState({ clientSlug: '', startDate: '' })
  const [applying, setApplying] = useState(false)

  // Edit modal
  const [editTemplate, setEditTemplate] = useState<Template | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const [editing, setEditing] = useState(false)

  // Delete
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)

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
    setCreateForm({ name: '', description: '', scope: 'full', lift: 'squat', clientSlug: '', filename: '' })
    fetchPrograms()
  }

  const openApply = (tmpl: Template) => {
    setApplyTemplate(tmpl)
    setApplyForm({ clientSlug: '', startDate: new Date().toISOString().split('T')[0] })
    fetchClients()
  }

  const openEdit = (tmpl: Template) => {
    setEditTemplate(tmpl)
    setEditForm({ name: tmpl.name, description: tmpl.description || '' })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim() || !createForm.clientSlug || !createForm.filename) return
    setCreating(true)
    setError('')
    try {
      const response = await fetch('/api/program-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || undefined,
          scope: createForm.scope,
          lift: createForm.scope === 'single_lift' ? createForm.lift : undefined,
          source: { clientSlug: createForm.clientSlug, filename: createForm.filename },
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

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTemplate || !editForm.name.trim()) return
    setEditing(true)
    setError('')
    try {
      const response = await fetch(`/api/program-templates/${editTemplate.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim(),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update template')
      setEditTemplate(null)
      fetchTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
    } finally {
      setEditing(false)
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

  const selectedProgram = programs.find(
    (p) => p.client === createForm.clientSlug && p.filename === createForm.filename,
  )

  const uniqueClients = [...new Map(programs.map((p) => [p.client, p.clientName])).entries()]

  const programsForClient = programs.filter((p) => p.client === createForm.clientSlug)

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
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.scope')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.block')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.weeks')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.source')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((tmpl) => (
                  <tr key={tmpl.slug} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tmpl.name}</div>
                      {tmpl.description && (
                        <div className="text-xs text-gray-500">{tmpl.description}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 max-w-[200px] truncate">
                      {tmpl.sourceProgramFilename || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openApply(tmpl)}
                          className="px-2 py-1 text-xs font-semibold rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          {t('apply')}
                        </button>
                        <button
                          onClick={() => openEdit(tmpl)}
                          className="px-2 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          {t('edit')}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectClient')}</label>
                <select
                  value={createForm.clientSlug}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, clientSlug: e.target.value, filename: '' }))}
                  disabled={programsLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                >
                  <option value="">{programsLoading ? '...' : '—'}</option>
                  {uniqueClients.map(([slug, name]) => (
                    <option key={slug} value={slug}>{name}</option>
                  ))}
                </select>
              </div>

              {createForm.clientSlug && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectProgram')}</label>
                  <select
                    required
                    value={createForm.filename}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, filename: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                  >
                    <option value="">—</option>
                    {programsForClient.map((p) => (
                      <option key={p.filename} value={p.filename}>
                        {p.filename} ({p.block}, {p.weeks}w)
                      </option>
                    ))}
                  </select>
                  {selectedProgram && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedProgram.block} / {selectedProgram.weeks} weeks / {selectedProgram.status}
                    </p>
                  )}
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
                disabled={creating || !createForm.name.trim() || !createForm.filename}
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

      {/* Edit Modal */}
      {editTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={handleEdit}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('edit')}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templateName')}</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('templateDescription')}</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditTemplate(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={editing || !editForm.name.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {editing ? t('saving') : t('save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
