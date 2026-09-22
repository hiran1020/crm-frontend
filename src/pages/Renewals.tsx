import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useToast } from '@/components/common/ToastProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { useRenewals, useCreateRenewal, useUpdateRenewal, useDeleteRenewal } from '@/hooks/useRenewals'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Renewal, RenewalStatus } from '@/types/renewal'

const STATUS_COLORS: Record<RenewalStatus, string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  in_negotiation: 'bg-purple-100 text-purple-700',
  renewed: 'bg-emerald-100 text-emerald-700',
  churned: 'bg-red-100 text-red-700',
  at_risk: 'bg-orange-100 text-orange-700',
}

const STATUS_LABELS: Record<RenewalStatus, string> = {
  upcoming: 'Upcoming',
  in_negotiation: 'In Negotiation',
  renewed: 'Renewed',
  churned: 'Churned',
  at_risk: 'At Risk',
}

function daysUntil(dateStr: string): number {
  return Math.floor(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
}

function rowUrgency(renewal: Renewal): string {
  const days = daysUntil(renewal.renewalDate)
  if (renewal.status === 'renewed' || renewal.status === 'churned') return ''
  if (days < 0) return 'bg-red-500/10'
  if (renewal.status === 'at_risk') return 'bg-orange-500/10'
  if (days < 30) return 'bg-yellow-500/10'
  return ''
}

interface RenewalFormModalProps {
  open: boolean
  renewal?: Renewal | null
  busy?: boolean
  onClose: () => void
  onSubmit: (data: Omit<Renewal, 'id' | 'createdAt'>) => Promise<void>
}

function RenewalFormModal({ open, renewal, busy = false, onClose, onSubmit }: RenewalFormModalProps) {
  const isEdit = Boolean(renewal)
  const { data: users = [] } = useUsers()
  const { user: authUser } = useAuth()
  const [customerId, setCustomerId] = useState(renewal?.customerId ?? '')
  const [customerName, setCustomerName] = useState(renewal?.customerName ?? '')
  const [contractValue, setContractValue] = useState(renewal?.contractValue ?? 0)
  const [renewalDate, setRenewalDate] = useState(renewal?.renewalDate ?? '')
  const [status, setStatus] = useState<RenewalStatus>(renewal?.status ?? 'upcoming')
  const [owner, setOwner] = useState(renewal?.owner ?? '')
  const [probability, setProbability] = useState(renewal?.probability ?? 80)
  const [notes, setNotes] = useState(renewal?.notes ?? '')

  useEffect(() => {
    if (!open) return
    const defaultUser = users.find((u) => u.id === authUser?.id) ?? users[0]
    if (renewal) {
      setCustomerId(renewal.customerId)
      setCustomerName(renewal.customerName)
      setContractValue(renewal.contractValue)
      setRenewalDate(renewal.renewalDate)
      setStatus(renewal.status)
      setOwner(renewal.owner)
      setProbability(renewal.probability)
      setNotes(renewal.notes ?? '')
    } else {
      setCustomerId('')
      setCustomerName('')
      setContractValue(0)
      setRenewalDate('')
      setStatus('upcoming')
      setOwner(defaultUser?.name ?? '')
      setProbability(80)
      setNotes('')
    }
  }, [open, renewal, users, authUser])

  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const inputCls = 'h-9 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          {isEdit ? 'Edit Renewal' : 'Add Renewal'}
        </h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void onSubmit({
              customerId,
              customerName,
              contractValue,
              renewalDate,
              status,
              owner,
              probability,
              notes: notes || undefined,
            })
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name *</label>
              <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} placeholder="Customer name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer ID</label>
              <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputCls} placeholder="CUS-001" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contract Value *</label>
              <input required type="number" min={0} value={contractValue} onChange={(e) => setContractValue(parseFloat(e.target.value) || 0)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Renewal Date *</label>
              <input required type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as RenewalStatus)} className={inputCls}>
                {(Object.keys(STATUS_LABELS) as RenewalStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Owner</label>
              <select value={owner} onChange={(e) => setOwner(e.target.value)} className={inputCls}>
                {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Probability ({probability}%)</label>
            <input type="range" min={0} max={100} value={probability} onChange={(e) => setProbability(parseInt(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {busy ? 'Saving…' : isEdit ? 'Save' : 'Add Renewal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function RenewalsPage() {
  usePageTitle('Renewals')
  const { notify } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editingRenewal, setEditingRenewal] = useState<Renewal | null>(null)

  const renewalsQuery = useRenewals()
  const createRenewal = useCreateRenewal()
  const updateRenewal = useUpdateRenewal()
  const deleteRenewal = useDeleteRenewal()

  const renewals = renewalsQuery.data ?? []
  const totalValue = renewals.reduce((s, r) => s + r.contractValue, 0)
  const atRiskValue = renewals
    .filter((r) => r.status === 'at_risk')
    .reduce((s, r) => s + r.contractValue, 0)
  const upcomingIn30 = renewals.filter(
    (r) => daysUntil(r.renewalDate) <= 30 && r.status !== 'renewed' && r.status !== 'churned',
  ).length

  async function handleCreate(data: Omit<Renewal, 'id' | 'createdAt'>) {
    try {
      await createRenewal.mutateAsync(data)
      notify('Renewal added')
      setFormOpen(false)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not add renewal', 'error')
    }
  }

  async function handleEdit(data: Omit<Renewal, 'id' | 'createdAt'>) {
    if (!editingRenewal) return
    try {
      await updateRenewal.mutateAsync({ id: editingRenewal.id, input: data })
      notify('Renewal updated')
      setEditingRenewal(null)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update renewal', 'error')
    }
  }

  if (renewalsQuery.isError) {
    return (
      <ErrorState
        title="Could not load renewals"
        message={renewalsQuery.error instanceof Error ? renewalsQuery.error.message : 'Unknown error'}
        onRetry={() => void renewalsQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Renewal Management</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track contract renewals and manage churn risk.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add Renewal
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Renewal Value</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">At Risk Value</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">{formatCurrency(atRiskValue)}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Due in 30 Days</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{upcomingIn30}</p>
        </div>
      </div>

      {/* Table */}
      {renewalsQuery.isLoading ? (
        <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden animate-pulse">
          <div className="h-10 bg-slate-50 border-b border-border" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-border last:border-b-0">
              <div className="h-4 flex-1 rounded bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
              <div className="h-4 w-24 rounded bg-slate-100" />
              <div className="h-4 w-20 rounded bg-slate-100" />
              <div className="h-4 w-16 rounded bg-slate-100" />
              <div className="h-4 w-20 rounded bg-slate-100" />
              <div className="h-4 w-12 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : renewals.length === 0 ? (
        <EmptyState
          title="No renewals tracked"
          description="Add contract renewals to track upcoming expirations and at-risk accounts."
          actionLabel="Add Renewal"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="rounded-lg border border-border bg-white shadow-sm overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-right font-medium">Contract Value</th>
                <th className="px-4 py-3 text-left font-medium">Renewal Date</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Probability</th>
                <th className="px-4 py-3 text-left font-medium">Owner</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {renewals
                .sort((a, b) => a.renewalDate.localeCompare(b.renewalDate))
                .map((renewal) => {
                  const days = daysUntil(renewal.renewalDate)
                  return (
                    <tr key={renewal.id} className={['hover:bg-slate-50', rowUrgency(renewal)].join(' ')}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{renewal.customerName}</p>
                        {renewal.lastContactDate && (
                          <p className="text-xs text-slate-400">
                            Last contact: {formatDate(renewal.lastContactDate)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(renewal.contractValue)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800">{formatDate(renewal.renewalDate)}</p>
                        <p className={['text-xs font-medium', days < 30 ? 'text-red-600' : days < 60 ? 'text-yellow-600' : 'text-slate-400'].join(' ')}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={['rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[renewal.status]].join(' ')}>
                          {STATUS_LABELS[renewal.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 shrink-0 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={['h-full rounded-full', renewal.probability >= 70 ? 'bg-emerald-500' : renewal.probability >= 40 ? 'bg-yellow-500' : 'bg-red-500'].join(' ')}
                              style={{ width: `${renewal.probability}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{renewal.probability}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{renewal.owner}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingRenewal(renewal)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                            aria-label={`Edit ${renewal.customerName}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete renewal for "${renewal.customerName}"?`)) {
                                void deleteRenewal.mutateAsync(renewal.id).then(() => notify('Renewal deleted'))
                              }
                            }}
                            disabled={deleteRenewal.isPending}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            aria-label={`Delete ${renewal.customerName}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}

      <RenewalFormModal
        open={formOpen}
        busy={createRenewal.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
      <RenewalFormModal
        open={Boolean(editingRenewal)}
        renewal={editingRenewal}
        busy={updateRenewal.isPending}
        onClose={() => setEditingRenewal(null)}
        onSubmit={handleEdit}
      />
    </div>
  )
}
