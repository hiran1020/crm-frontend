import { Filter, Plus, Pencil, Trash2, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useToast } from '@/components/common/ToastProvider'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import {
  useSegments,
  useCreateSegment,
  useUpdateSegment,
  useDeleteSegment,
} from '@/hooks/useSegments'
import { useCustomers } from '@/hooks/useCustomers'
import { useLeads } from '@/hooks/useLeads'
import { segmentService } from '@/services/segmentService'
import { useAuth } from '@/context/AuthContext'
import type {
  Segment,
  SegmentCondition,
  SegmentConditionField,
  SegmentConditionOp,
  SegmentLogic,
} from '@/types/segment'

const CONDITION_FIELDS: { value: SegmentConditionField; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'owner', label: 'Owner' },
  { value: 'company', label: 'Company' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'createdAt', label: 'Created At' },
  { value: 'tag', label: 'Tag' },
]

const CONDITION_OPS: { value: SegmentConditionOp; label: string }[] = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'before', label: 'before' },
  { value: 'after', label: 'after' },
]

const COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f97316',
  '#ef4444', '#eab308', '#ec4899', '#06b6d4',
]

interface SegmentFormState {
  name: string
  description: string
  entityType: 'customer' | 'lead'
  logic: SegmentLogic
  conditions: SegmentCondition[]
  color: string
}

function newCondition(): SegmentCondition {
  return {
    id: `c-${Date.now()}`,
    field: 'status',
    op: 'is',
    value: '',
  }
}

interface SegmentBuilderModalProps {
  open: boolean
  segment?: Segment | null
  customers: { id: string }[]
  leads: { id: string }[]
  onClose: () => void
  onSave: (data: SegmentFormState) => Promise<void>
}

function SegmentBuilderModal({
  open,
  segment,
  customers,
  leads,
  onClose,
  onSave,
}: SegmentBuilderModalProps) {
  const [form, setForm] = useState<SegmentFormState>({
    name: '',
    description: '',
    entityType: 'customer',
    logic: 'AND',
    conditions: [newCondition()],
    color: COLORS[0],
  })
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    if (segment) {
      setForm({
        name: segment.name,
        description: segment.description ?? '',
        entityType: segment.entityType,
        logic: segment.logic,
        conditions: segment.conditions.length > 0 ? segment.conditions : [newCondition()],
        color: segment.color,
      })
    } else {
      setForm({
        name: '',
        description: '',
        entityType: 'customer',
        logic: 'AND',
        conditions: [newCondition()],
        color: COLORS[0],
      })
    }
    setPreview(null)
  }, [open, segment])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Compute live preview
  useEffect(() => {
    const records = form.entityType === 'customer'
      ? customers as Parameters<typeof segmentService.previewSegmentSync>[1]
      : leads as Parameters<typeof segmentService.previewSegmentSync>[1]
    const tempSegment: Segment = {
      id: 'preview',
      name: form.name,
      entityType: form.entityType,
      logic: form.logic,
      conditions: form.conditions.filter((c) => c.value.trim()),
      createdBy: '',
      createdAt: '',
      color: form.color,
    }
    const count = segmentService.previewSegmentSync(tempSegment, records)
    setPreview(count)
  }, [form, customers, leads])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setBusy(true)
    try {
      await onSave(form)
    } finally {
      setBusy(false)
    }
  }

  function updateCondition(id: string, patch: Partial<SegmentCondition>) {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }

  function addCondition() {
    setForm((prev) => ({ ...prev, conditions: [...prev.conditions, newCondition()] }))
  }

  function removeCondition(id: string) {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c.id !== id),
    }))
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="segment-builder-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="segment-builder-title" className="text-lg font-semibold text-slate-900">
            {segment ? 'Edit Segment' : 'Create Segment'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Name *</span>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="e.g. VIP Customers"
                required
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Entity Type</span>
              <select
                value={form.entityType}
                onChange={(e) => setForm((p) => ({ ...p, entityType: e.target.value as 'customer' | 'lead' }))}
                className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="customer">Customers</option>
                <option value="lead">Leads</option>
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Description</span>
            <input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="Optional description"
            />
          </label>

          <div className="flex items-center gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Logic</span>
              <select
                value={form.logic}
                onChange={(e) => setForm((p) => ({ ...p, logic: e.target.value as SegmentLogic }))}
                className="h-9 rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="AND">Match ALL conditions (AND)</option>
                <option value="OR">Match ANY condition (OR)</option>
              </select>
            </label>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">Conditions</span>
            <div className="space-y-2">
              {form.conditions.map((cond, idx) => (
                <div key={cond.id} className="flex items-center gap-2">
                  {idx > 0 && (
                    <span className="w-8 shrink-0 text-center text-xs font-semibold text-slate-500">
                      {form.logic}
                    </span>
                  )}
                  {idx === 0 && <span className="w-8 shrink-0" />}
                  <select
                    value={cond.field}
                    onChange={(e) => updateCondition(cond.id, { field: e.target.value as SegmentConditionField })}
                    className="h-9 flex-1 rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    {CONDITION_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <select
                    value={cond.op}
                    onChange={(e) => updateCondition(cond.id, { op: e.target.value as SegmentConditionOp })}
                    className="h-9 flex-1 rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    {CONDITION_OPS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <input
                    value={cond.value}
                    onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                    className="h-9 flex-1 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    placeholder="Value"
                  />
                  {form.conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCondition(cond.id)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCondition}
              className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              + Add Condition
            </button>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">Color</span>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className={[
                    'h-6 w-6 rounded-full transition-transform',
                    form.color === c ? 'scale-125 ring-2 ring-slate-900 ring-offset-1' : '',
                  ].join(' ')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {preview !== null && (
            <p className="text-sm text-slate-600">
              Live preview: Matches{' '}
              <strong className="text-brand-700">{preview}</strong>{' '}
              {form.entityType === 'customer' ? 'customer' : 'lead'}
              {preview !== 1 ? 's' : ''}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !form.name.trim()}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? 'Saving…' : segment ? 'Save changes' : 'Create Segment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function SegmentsPage() {
  usePageTitle('Segments')
  const navigate = useNavigate()
  const { notify } = useToast()
  const { user } = useAuth()

  const { data: segments = [], isLoading } = useSegments()
  const { data: customersResult } = useCustomers({ pageSize: 1000 })
  const { data: leadsResult } = useLeads({ pageSize: 1000 })

  const customers = customersResult?.data ?? []
  const leads = leadsResult?.data ?? []

  const createSegment = useCreateSegment()
  const updateSegment = useUpdateSegment()
  const deleteSegment = useDeleteSegment()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Segment | null>(null)
  const [deleting, setDeleting] = useState<Segment | null>(null)

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(seg: Segment) {
    setEditing(seg)
    setModalOpen(true)
  }

  async function handleSave(data: SegmentFormState) {
    const input = {
      name: data.name,
      description: data.description,
      entityType: data.entityType,
      logic: data.logic,
      conditions: data.conditions,
      color: data.color,
      createdBy: user?.name ?? 'Unknown',
    }
    if (editing) {
      await updateSegment.mutateAsync({ id: editing.id, input })
      notify('Segment updated', 'success')
    } else {
      await createSegment.mutateAsync(input)
      notify('Segment created', 'success')
    }
    setModalOpen(false)
    setEditing(null)
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteSegment.mutateAsync(deleting.id)
    notify('Segment deleted', 'success')
    setDeleting(null)
  }

  function getMatchCount(segment: Segment): number {
    const records = segment.entityType === 'customer'
      ? customers as Parameters<typeof segmentService.previewSegmentSync>[1]
      : leads as Parameters<typeof segmentService.previewSegmentSync>[1]
    return segmentService.previewSegmentSync(segment, records)
  }

  function handleSegmentClick(seg: Segment) {
    const path = seg.entityType === 'customer' ? '/customers' : '/leads'
    sessionStorage.setItem('crm_segment_filter', JSON.stringify({ segmentId: seg.id, segmentName: seg.name }))
    navigate(path)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Segments</h2>
          <p className="mt-1 text-sm text-slate-500">
            Group customers and leads by shared characteristics for targeted outreach.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Create Segment
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-white" />
          ))}
        </div>
      ) : segments.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-10 text-center">
          <Filter className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
          <p className="mt-2 text-sm text-slate-500">No segments yet. Create your first segment.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((seg) => {
            const matchCount = getMatchCount(seg)
            return (
              <div
                key={seg.id}
                className="rounded-lg border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <h3 className="text-sm font-semibold text-slate-900">{seg.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(seg)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(seg)}
                      className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>

                {seg.description && (
                  <p className="mt-1 text-xs text-slate-500">{seg.description}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {seg.entityType === 'customer' ? 'Customers' : 'Leads'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {seg.conditions.length} condition{seg.conditions.length !== 1 ? 's' : ''}
                  </span>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {matchCount} match{matchCount !== 1 ? 'es' : ''}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSegmentClick(seg)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  View {seg.entityType === 'customer' ? 'Customers' : 'Leads'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <SegmentBuilderModal
        open={modalOpen}
        segment={editing}
        customers={customers}
        leads={leads}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete segment"
        description={`Are you sure you want to delete "${deleting?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
