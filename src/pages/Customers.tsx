import { Download, Plus, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermissions } from '@/hooks/usePermissions'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Pagination } from '@/components/common/Pagination'
import { useToast } from '@/components/common/ToastProvider'
import { CSVImportModal } from '@/components/common/CSVImportModal'
import { SavedViewsDropdown } from '@/components/common/SavedViewsDropdown'
import { CustomerFilters } from '@/components/customers/CustomerFilters'
import { CustomerFormModal } from '@/components/customers/CustomerFormModal'
import {
  CustomerTable,
  CustomerTableSkeleton,
} from '@/components/customers/CustomerTable'
import { downloadCsv } from '@/lib/csv'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  useBulkDeleteCustomers,
  useCreateCustomer,
  useCustomerOwners,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from '@/hooks/useCustomers'
import { useUsers } from '@/hooks/useUsers'
import { customerService } from '@/services/customerService'
import type { CustomerFormValues } from '@/schemas/customer'
import type {
  Customer,
  CustomerInput,
  CustomerSortField,
  CustomerStatus,
  SortDirection,
} from '@/types/customer'

const PAGE_SIZE = 10

export function CustomersPage() {
  usePageTitle('Customers')
  const { notify } = useToast()
  const permissions = usePermissions()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [status, setStatus] = useState<CustomerStatus | 'All'>('All')
  const [owner, setOwner] = useState<string>('All')
  const [sortBy, setSortBy] = useState<CustomerSortField>('name')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)

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

  const customersQuery = useCustomers(listParams)
  const ownersQuery = useCustomerOwners()
  const { data: users = [] } = useUsers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()
  const bulkDelete = useBulkDeleteCustomers()

  const owners = ownersQuery.data ?? []
  const result = customersQuery.data
  const customers = result?.data ?? []
  const isInitialLoading = customersQuery.isLoading && !customersQuery.data
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

  function handleSort(field: CustomerSortField) {
    if (sortBy === field) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
    resetToFirstPage()
  }

  function openCreate() {
    setEditingCustomer(null)
    setFormOpen(true)
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer)
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

  async function handleFormSubmit(values: CustomerFormValues) {
    try {
      if (editingCustomer) {
        await updateCustomer.mutateAsync({
          id: editingCustomer.id,
          input: values,
        })
        notify('Customer updated')
      } else {
        const existing = await customerService.findByEmail(values.email)
        if (existing) {
          notify('A customer with this email already exists', 'error')
          return
        }
        await createCustomer.mutateAsync(values)
        notify('Customer created')
        resetToFirstPage()
      }
      setFormOpen(false)
      setEditingCustomer(null)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not save customer',
        'error',
      )
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingCustomer) {
      return
    }

    try {
      await deleteCustomer.mutateAsync(deletingCustomer.id)
      notify('Customer deleted')
      setDeletingCustomer(null)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(deletingCustomer.id)
        return next
      })
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not delete customer',
        'error',
      )
    }
  }

  async function handleBulkDeleteConfirm() {
    try {
      await bulkDelete.mutateAsync([...selectedIds])
      notify(`${selectedIds.size} customer${selectedIds.size !== 1 ? 's' : ''} deleted`)
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not delete customers',
        'error',
      )
    }
  }

  async function handleExportCsv() {
    setExportBusy(true)
    try {
      const allResult = await customerService.getCustomers({ pageSize: 1000 })
      const rows = allResult.data.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        company: c.company,
        jobTitle: c.jobTitle,
        status: c.status,
        owner: c.owner,
        createdAt: c.createdAt,
      }))
      downloadCsv(rows, 'customers.csv')
    } catch {
      notify('Could not export customers', 'error')
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

    for (const row of rows) {
      try {
        const mapped: Partial<CustomerInput> = {}
        for (const [csvCol, crmField] of Object.entries(mapping)) {
          if (crmField === '__skip__') continue
          const val = row[csvCol] ?? ''
          if (crmField === 'firstName') mapped.firstName = val
          else if (crmField === 'lastName') mapped.lastName = val
          else if (crmField === 'email') mapped.email = val
          else if (crmField === 'phone') mapped.phone = val
          else if (crmField === 'company') mapped.company = val
          else if (crmField === 'jobTitle') mapped.jobTitle = val
          else if (crmField === 'status') mapped.status = (val === 'Inactive' ? 'Inactive' : 'Active')
          else if (crmField === 'owner') mapped.owner = val || ''
        }

        if (!mapped.email) { skipped++; continue }

        const existing = await customerService.findByEmail(mapped.email)
        if (existing) { skipped++; continue }

        const ownerName = mapped.owner ?? ''
        const matchedUser = users.find((u) => u.name === ownerName)
        await createCustomer.mutateAsync({
          firstName: mapped.firstName ?? '',
          lastName: mapped.lastName ?? '',
          email: mapped.email,
          phone: mapped.phone ?? '',
          company: mapped.company ?? '',
          jobTitle: mapped.jobTitle ?? '',
          status: mapped.status ?? 'Active',
          owner: ownerName,
          ownerId: matchedUser?.id ?? '',
        })
        imported++
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    if (imported > 0) {
      notify(`Imported ${imported} customer${imported !== 1 ? 's' : ''}`, 'success')
      resetToFirstPage()
    }

    return { imported, skipped, errors }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Customers</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, and manage your customer list.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {permissions.canExportData ? (
            <>
              <button
                type="button"
                onClick={() => void handleExportCsv()}
                disabled={exportBusy}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:gap-2 sm:px-4"
              >
                <Download className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{exportBusy ? 'Exporting…' : 'Export'}</span>
                <span className="sm:hidden">{exportBusy ? '…' : 'Export'}</span>
              </button>
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:gap-2 sm:px-4"
              >
                <Upload className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Import</span>
                <span className="sm:hidden">Import</span>
              </button>
            </>
          ) : null}
          {permissions.canCreateCustomer ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:gap-2 sm:px-4"
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1">
          <CustomerFilters
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
          entityType="customer"
          currentFilters={{ search, status, owner }}
          onApplyView={(filters) => {
            setSearch(filters.search ?? '')
            setStatus((filters.status as CustomerStatus | 'All') ?? 'All')
            setOwner(filters.owner ?? 'All')
            resetToFirstPage()
          }}
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-brand-700">
            {selectedIds.size} customer{selectedIds.size !== 1 ? 's' : ''} selected
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

      {customersQuery.isError ? (
        <ErrorState
          title="Could not load customers"
          message={
            customersQuery.error instanceof Error
              ? customersQuery.error.message
              : 'Unknown error'
          }
          onRetry={() => void customersQuery.refetch()}
        />
      ) : isInitialLoading ? (
        <CustomerTableSkeleton />
      ) : customers.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No matching customers' : 'No customers yet'}
          description={
            hasActiveFilters
              ? 'Try clearing search or filters to see more results.'
              : 'Add your first customer to start building your CRM pipeline.'
          }
          actionLabel={hasActiveFilters ? undefined : 'Add Customer'}
          onAction={hasActiveFilters ? undefined : openCreate}
        />
      ) : (
        <>
          <CustomerTable
            customers={customers}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            onEdit={(c) =>
              permissions.canEditCustomer(c.owner) ? openEdit(c) : undefined
            }
            onDelete={(c) =>
              permissions.canDeleteCustomer(c.owner)
                ? setDeletingCustomer(c)
                : undefined
            }
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
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

      <CustomerFormModal
        open={formOpen}
        customer={editingCustomer}
        busy={createCustomer.isPending || updateCustomer.isPending}
        onClose={() => {
          setFormOpen(false)
          setEditingCustomer(null)
        }}
        onSubmit={handleFormSubmit}
      />

      <CSVImportModal
        open={importOpen}
        entityType="customer"
        onClose={() => setImportOpen(false)}
        onImport={handleImportCsv}
      />

      <ConfirmDialog
        open={Boolean(deletingCustomer)}
        title="Delete customer?"
        description={
          deletingCustomer
            ? `Remove ${deletingCustomer.firstName} ${deletingCustomer.lastName} from your customer list? This cannot be undone in the current session.`
            : ''
        }
        busy={deleteCustomer.isPending}
        onCancel={() => setDeletingCustomer(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.size} customer${selectedIds.size !== 1 ? 's' : ''}?`}
        description="This will permanently remove the selected customers. This cannot be undone in the current session."
        busy={bulkDelete.isPending}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => void handleBulkDeleteConfirm()}
      />
    </div>
  )
}
