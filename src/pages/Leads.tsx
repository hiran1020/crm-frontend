import { Download, Plus, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Pagination } from '@/components/common/Pagination'
import { useToast } from '@/components/common/ToastProvider'
import { CSVImportModal } from '@/components/common/CSVImportModal'
import { SavedViewsDropdown } from '@/components/common/SavedViewsDropdown'
import { LeadFilters } from '@/components/leads/LeadFilters'
import { LeadFormModal } from '@/components/leads/LeadFormModal'
import { LeadTable, LeadTableSkeleton } from '@/components/leads/LeadTable'
import { MOCK_OWNERS } from '@/constants/auth'
import { downloadCsv } from '@/lib/csv'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  useBulkDeleteLeads,
  useCreateLead,
  useDeleteLead,
  useLeadOwners,
  useLeads,
  useUpdateLead,
} from '@/hooks/useLeads'
import { leadService } from '@/services/leadService'
import type { LeadFormValues } from '@/schemas/lead'
import type { Lead, LeadInput, LeadStatus } from '@/types/lead'

type LeadSortField = 'name' | 'company' | 'value' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 10

export function LeadsPage() {
  usePageTitle('Leads')
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [status, setStatus] = useState<LeadStatus | 'All'>('All')
  const [owner, setOwner] = useState<string>('All')
  const [sortBy, setSortBy] = useState<LeadSortField>('name')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const listParams = useMemo(
    () => ({
      search: debouncedSearch,
      status,
      owner,
      sortBy,
      sortDir,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedSearch, status, owner, sortBy, sortDir, page],
  )

  const leadsQuery = useLeads(listParams)
  const ownersQuery = useLeadOwners()
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()
  const bulkDelete = useBulkDeleteLeads()

  const owners = ownersQuery.data ?? [...MOCK_OWNERS]
  const result = leadsQuery.data
  const leads = result?.data ?? []
  const isInitialLoading = leadsQuery.isLoading && !leadsQuery.data
  const hasActiveFilters =
    debouncedSearch.trim() !== '' || status !== 'All' || owner !== 'All'

  useEffect(() => {
    if (result && result.page !== page) {
      setPage(result.page)
    }
  }, [result, page])

  function resetToFirstPage() {
    setPage(1)
    setSelectedIds(new Set())
  }

  function handleSort(field: LeadSortField) {
    if (sortBy === field) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
    resetToFirstPage()
  }

  function openCreate() {
    setEditingLead(null)
    setFormOpen(true)
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead)
    setFormOpen(true)
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleToggleSelectAll(ids: string[]) {
    const allSelected = ids.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        ids.forEach((id) => next.delete(id))
      } else {
        ids.forEach((id) => next.add(id))
      }
      return next
    })
  }

  async function handleStatusChange(id: string, newStatus: LeadStatus) {
    const lead = leads.find((l) => l.id === id)
    if (!lead) return
    try {
      await updateLead.mutateAsync({
        id,
        input: {
          name: lead.name,
          company: lead.company,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: newStatus,
          value: lead.value,
          owner: lead.owner,
          notes: lead.notes,
        },
      })
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not update status',
        'error',
      )
    }
  }

  async function handleFormSubmit(values: LeadFormValues) {
    try {
      if (editingLead) {
        await updateLead.mutateAsync({ id: editingLead.id, input: values })
        notify('Lead updated')
      } else {
        const existing = await leadService.findByEmail(values.email)
        if (existing) {
          notify('A lead with this email already exists', 'error')
          return
        }
        await createLead.mutateAsync(values)
        notify('Lead created')
        resetToFirstPage()
      }
      setFormOpen(false)
      setEditingLead(null)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not save lead',
        'error',
      )
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingLead) return

    try {
      await deleteLead.mutateAsync(deletingLead.id)
      notify('Lead deleted')
      setDeletingLead(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(deletingLead.id)
        return next
      })
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not delete lead',
        'error',
      )
    }
  }

  async function handleBulkDeleteConfirm() {
    try {
      await bulkDelete.mutateAsync([...selectedIds])
      notify(`${selectedIds.size} lead${selectedIds.size !== 1 ? 's' : ''} deleted`)
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not delete leads',
        'error',
      )
    }
  }

  async function handleExportCsv() {
    setExportBusy(true)
    try {
      const allResult = await leadService.getLeads({ pageSize: 1000 })
      const rows = allResult.data.map((l) => ({
        id: l.id,
        name: l.name,
        company: l.company,
        email: l.email,
        phone: l.phone,
        source: l.source,
        status: l.status,
        value: l.value,
        owner: l.owner,
        notes: l.notes,
        createdAt: l.createdAt,
      }))
      downloadCsv(rows, 'leads.csv')
    } catch {
      notify('Could not export leads', 'error')
    } finally {
      setExportBusy(false)
    }
  }

  async function handleImportCsv(
    rows: Record<string, string>[],
    mapping: Record<string, string>,
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    let imported = 0
    let skipped = 0
    const errors: string[] = []

    const VALID_SOURCES = ['Website', 'Referral', 'Trade Show', 'Cold Call', 'Email Campaign', 'Social Media', 'Partner']
    const VALID_STATUSES = ['New', 'Contacted', 'Qualified', 'Lost', 'Converted']

    for (const row of rows) {
      try {
        const mapped: Partial<LeadInput> = {}
        for (const [csvCol, crmField] of Object.entries(mapping)) {
          if (crmField === '__skip__') continue
          const val = row[csvCol] ?? ''
          if (crmField === 'name') mapped.name = val
          else if (crmField === 'company') mapped.company = val
          else if (crmField === 'email') mapped.email = val
          else if (crmField === 'phone') mapped.phone = val
          else if (crmField === 'source') mapped.source = VALID_SOURCES.includes(val) ? val as LeadInput['source'] : 'Website'
          else if (crmField === 'value') mapped.value = parseFloat(val) || 0
          else if (crmField === 'owner') mapped.owner = val || MOCK_OWNERS[0]
          else if (crmField === 'status') mapped.status = VALID_STATUSES.includes(val) ? val as LeadInput['status'] : 'New'
          else if (crmField === 'notes') mapped.notes = val
        }

        if (!mapped.email) { skipped++; continue }

        const existing = await leadService.findByEmail(mapped.email)
        if (existing) { skipped++; continue }

        await createLead.mutateAsync({
          name: mapped.name ?? '',
          company: mapped.company ?? '',
          email: mapped.email,
          phone: mapped.phone ?? '',
          source: mapped.source ?? 'Website',
          status: mapped.status ?? 'New',
          value: mapped.value ?? 0,
          owner: mapped.owner ?? MOCK_OWNERS[0],
          notes: mapped.notes ?? '',
          tags: [],
        })
        imported++
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    if (imported > 0) {
      notify(`Imported ${imported} lead${imported !== 1 ? 's' : ''}`, 'success')
      resetToFirstPage()
    }

    return { imported, skipped, errors }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Leads</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage your sales leads from first contact to conversion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleExportCsv()}
            disabled={exportBusy}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            {exportBusy ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" aria-hidden />
            Import CSV
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Lead
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1">
          <LeadFilters
            search={search}
            status={status}
            owner={owner}
            owners={owners}
            onSearchChange={(value) => {
              setSearch(value)
              resetToFirstPage()
            }}
            onStatusChange={(value) => {
              setStatus(value)
              resetToFirstPage()
            }}
            onOwnerChange={(value) => {
              setOwner(value)
              resetToFirstPage()
            }}
          />
        </div>
        <SavedViewsDropdown
          entityType="lead"
          currentFilters={{ search, status, owner }}
          onApplyView={(filters) => {
            setSearch(filters.search ?? '')
            setStatus((filters.status as LeadStatus | 'All') ?? 'All')
            setOwner(filters.owner ?? 'All')
            resetToFirstPage()
          }}
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-brand-700">
            {selectedIds.size} lead{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {leadsQuery.isError ? (
        <ErrorState
          title="Could not load leads"
          message={
            leadsQuery.error instanceof Error
              ? leadsQuery.error.message
              : 'Unknown error'
          }
          onRetry={() => void leadsQuery.refetch()}
        />
      ) : isInitialLoading ? (
        <LeadTableSkeleton />
      ) : leads.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No matching leads' : 'No leads yet'}
          description={
            hasActiveFilters
              ? 'Try clearing search or filters to see more results.'
              : 'Add your first lead to start tracking your sales pipeline.'
          }
          actionLabel={hasActiveFilters ? undefined : 'Add Lead'}
          onAction={hasActiveFilters ? undefined : openCreate}
        />
      ) : (
        <>
          <LeadTable
            leads={leads}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            onEdit={openEdit}
            onDelete={setDeletingLead}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onStatusChange={(id, newStatus) => void handleStatusChange(id, newStatus)}
          />
          <Pagination
            page={result?.page ?? page}
            totalPages={result?.totalPages ?? 1}
            total={result?.total ?? 0}
            pageSize={PAGE_SIZE}
            onPageChange={(p) => {
              setPage(p)
              setSelectedIds(new Set())
            }}
          />
        </>
      )}

      <LeadFormModal
        open={formOpen}
        lead={editingLead}
        busy={createLead.isPending || updateLead.isPending}
        onClose={() => {
          setFormOpen(false)
          setEditingLead(null)
        }}
        onSubmit={handleFormSubmit}
      />

      <CSVImportModal
        open={importOpen}
        entityType="lead"
        onClose={() => setImportOpen(false)}
        onImport={handleImportCsv}
      />

      <ConfirmDialog
        open={Boolean(deletingLead)}
        title="Delete lead?"
        description={
          deletingLead
            ? `Remove ${deletingLead.name} from your leads list? This cannot be undone in the current session.`
            : ''
        }
        busy={deleteLead.isPending}
        onCancel={() => setDeletingLead(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.size} lead${selectedIds.size !== 1 ? 's' : ''}?`}
        description="This will permanently remove the selected leads. This cannot be undone in the current session."
        busy={bulkDelete.isPending}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => void handleBulkDeleteConfirm()}
      />
    </div>
  )
}
