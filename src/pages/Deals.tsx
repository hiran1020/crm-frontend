import { Plus } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { useToast } from '@/components/common/ToastProvider'
import { SavedViewsDropdown } from '@/components/common/SavedViewsDropdown'
import { DealFormModal } from '@/components/deals/DealFormModal'
import { KanbanBoard } from '@/components/deals/KanbanBoard'
import { useCustomers } from '@/hooks/useCustomers'
import { useUsers } from '@/hooks/useUsers'
import {
  useCreateDeal,
  useDeals,
  useDeleteDeal,
  useUpdateDeal,
} from '@/hooks/useDeals'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatCurrency } from '@/lib/format'
import type { DealFormValues } from '@/schemas/deal'
import type { Deal, DealStage } from '@/types/deal'

export function DealsPage() {
  usePageTitle('Sales Pipeline')
  const { notify } = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [defaultStage, setDefaultStage] = useState<DealStage>('New')
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null)
  const [ownerFilter, setOwnerFilter] = useState<string>('All')

  const dealsQuery = useDeals({ pageSize: 200 })
  const customersQuery = useCustomers({ pageSize: 200 })
  const { data: users = [] } = useUsers()
  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()
  const deleteDeal = useDeleteDeal()

  const deals = dealsQuery.data?.data ?? []
  const customers = customersQuery.data?.data ?? []

  const filteredDeals =
    ownerFilter === 'All' ? deals : deals.filter((d) => d.owner === ownerFilter)

  // Stats for the summary bar (from all deals, not filtered)
  const totalPipeline = deals
    .filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
    .reduce((sum, d) => sum + d.amount, 0)
  const wonRevenue = deals
    .filter((d) => d.stage === 'Won')
    .reduce((sum, d) => sum + d.amount, 0)
  const openCount = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost').length

  function openCreate(stage: DealStage = 'New') {
    setDefaultStage(stage)
    setEditingDeal(null)
    setFormOpen(true)
  }

  function openEdit(deal: Deal) {
    setEditingDeal(deal)
    setFormOpen(true)
  }

  async function handleFormSubmit(values: DealFormValues) {
    try {
      if (editingDeal) {
        await updateDeal.mutateAsync({ id: editingDeal.id, input: values })
        notify('Deal updated')
      } else {
        await createDeal.mutateAsync(values)
        notify('Deal created')
      }
      setFormOpen(false)
      setEditingDeal(null)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not save deal',
        'error',
      )
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingDeal) return

    try {
      await deleteDeal.mutateAsync(deletingDeal.id)
      notify('Deal deleted')
      setDeletingDeal(null)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not delete deal',
        'error',
      )
    }
  }

  if (dealsQuery.isError) {
    return (
      <ErrorState
        title="Could not load deals"
        message={
          dealsQuery.error instanceof Error
            ? dealsQuery.error.message
            : 'Unknown error'
        }
        onRetry={() => void dealsQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Sales Pipeline
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Track every deal from first contact to close.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add Deal
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Open deals
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{openCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Pipeline value
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(totalPipeline)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Won revenue
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {formatCurrency(wonRevenue)}
          </p>
        </div>
      </div>

      {/* Owner filter */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:border-brand-500 focus:ring-brand-100"
        >
          <option value="All">All owners</option>
          {users.map((u) => (
            <option key={u.id} value={u.name}>
              {u.name}
            </option>
          ))}
        </select>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          {filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''}
          {dealsQuery.isFetching && (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" aria-label="Refreshing" />
          )}
        </span>
        <SavedViewsDropdown
          entityType="deal"
          currentFilters={{ owner: ownerFilter }}
          onApplyView={(filters) => {
            setOwnerFilter(filters.owner ?? 'All')
          }}
        />
      </div>

      {/* Kanban board */}
      {dealsQuery.isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 min-w-[280px] animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <KanbanBoard
          deals={filteredDeals}
          customers={customers}
          onAddDeal={openCreate}
          onEdit={openEdit}
          onDelete={setDeletingDeal}
        />
      )}

      {/* Form modal */}
      <DealFormModal
        open={formOpen}
        deal={editingDeal}
        defaultStage={defaultStage}
        busy={createDeal.isPending || updateDeal.isPending}
        onClose={() => {
          setFormOpen(false)
          setEditingDeal(null)
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deletingDeal)}
        title="Delete deal?"
        description={
          deletingDeal
            ? `Remove "${deletingDeal.title}" from your pipeline? This cannot be undone in the current session.`
            : ''
        }
        busy={deleteDeal.isPending}
        onCancel={() => setDeletingDeal(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  )
}
