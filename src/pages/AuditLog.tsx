import { ClipboardList, Shield, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react'
import { useState, useCallback } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuditLog } from '@/hooks/useAuditLog'
import { formatRelativeDate } from '@/lib/format'
import type { AuditEntity } from '@/types/auditLog'

// Only the 3 actions the backend actually stores
const BACKEND_ACTIONS = [
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
] as const

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-700',
  update: 'bg-blue-50 text-blue-700',
  delete: 'bg-red-50 text-red-700',
  status_change: 'bg-amber-50 text-amber-700',
  stage_change: 'bg-orange-50 text-orange-700',
  login: 'bg-slate-100 text-slate-700',
  export: 'bg-purple-50 text-purple-700',
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  status_change: 'Status changed',
  stage_change: 'Stage changed',
  login: 'Logged in',
  export: 'Exported',
}

const ENTITY_OPTIONS: { value: AuditEntity; label: string }[] = [
  { value: 'customer', label: 'Customer' },
  { value: 'lead', label: 'Lead' },
  { value: 'deal', label: 'Deal' },
  { value: 'activity', label: 'Activity' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'user', label: 'User' },
]

const ENTITY_COLORS: Record<AuditEntity, string> = {
  customer: 'bg-blue-100 text-blue-700',
  lead: 'bg-emerald-100 text-emerald-700',
  deal: 'bg-yellow-100 text-yellow-700',
  activity: 'bg-purple-100 text-purple-700',
  ticket: 'bg-pink-100 text-pink-700',
  user: 'bg-slate-100 text-slate-700',
}

const PAGE_SIZE = 20

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const inputCls =
  'h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export function AuditLogPage() {
  usePageTitle('Audit Log')
  const permissions = usePermissions()

  const [search, setSearch] = useState('')
  const [entity, setEntity] = useState<AuditEntity | 'all'>('all')
  const [action, setAction] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const resetFilters = useCallback(() => {
    setSearch('')
    setEntity('all')
    setAction('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }, [])

  const hasFilters = search || entity !== 'all' || action !== 'all' || dateFrom || dateTo

  const { data, isLoading, isFetching } = useAuditLog({
    search: search || undefined,
    entity: entity === 'all' ? undefined : entity,
    action: action === 'all' ? undefined : action,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const entries = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  if (!permissions.canManageTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="mb-4 h-12 w-12 text-slate-300" aria-hidden />
        <h2 className="text-lg font-semibold text-slate-900">Admin access required</h2>
        <p className="mt-1 text-sm text-slate-500">
          The audit log is only accessible to Admin users.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Audit Log</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track all actions performed in the CRM for compliance and accountability.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <ClipboardList className="h-3 w-3" aria-hidden />
          Admin only
        </span>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">Search</label>
            <input
              type="search"
              placeholder="Actor name or entity…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className={inputCls}
            />
          </div>

          {/* Entity */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Entity type</label>
            <select
              value={entity}
              onChange={(e) => { setEntity(e.target.value as AuditEntity | 'all'); setPage(1) }}
              className={inputCls}
            >
              <option value="all">All entities</option>
              {ENTITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Action</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1) }}
              className={inputCls}
            >
              <option value="all">All actions</option>
              {BACKEND_ACTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Date range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className={inputCls}
                aria-label="From date"
              />
              <span className="shrink-0 text-xs text-slate-400">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className={inputCls}
                aria-label="To date"
              />
            </div>
          </div>
        </div>

        {/* Active filter chips + clear */}
        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                Search: <strong>{search}</strong>
                <button onClick={() => { setSearch(''); setPage(1) }} className="ml-0.5 text-slate-400 hover:text-slate-700"><X className="h-3 w-3" /></button>
              </span>
            )}
            {entity !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                Entity: <strong>{ENTITY_OPTIONS.find(o => o.value === entity)?.label}</strong>
                <button onClick={() => { setEntity('all'); setPage(1) }} className="ml-0.5 text-slate-400 hover:text-slate-700"><X className="h-3 w-3" /></button>
              </span>
            )}
            {action !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                Action: <strong>{BACKEND_ACTIONS.find(a => a.value === action)?.label}</strong>
                <button onClick={() => { setAction('all'); setPage(1) }} className="ml-0.5 text-slate-400 hover:text-slate-700"><X className="h-3 w-3" /></button>
              </span>
            )}
            {(dateFrom || dateTo) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                Date: <strong>{dateFrom || '…'} – {dateTo || '…'}</strong>
                <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }} className="ml-0.5 text-slate-400 hover:text-slate-700"><X className="h-3 w-3" /></button>
              </span>
            )}
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600"
            >
              <RotateCcw className="h-3 w-3" />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results summary */}
      {!isLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>{total} entr{total !== 1 ? 'ies' : 'y'} found</span>
          {isFetching && (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" aria-label="Refreshing" />
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-white" />
          ))
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-border bg-white p-10 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
            <p className="mt-2 text-sm font-medium text-slate-700">No entries found</p>
            {hasFilters && (
              <button onClick={resetFilters} className="mt-2 text-sm text-brand-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {getInitials(entry.actor)}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Action line */}
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="font-semibold text-slate-900">{entry.actor}</span>
                    <span className="text-xs capitalize text-slate-400">
                      ({entry.actorRole.replace(/_/g, ' ')})
                    </span>
                    <span className={[
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      ACTION_COLORS[entry.action] ?? 'bg-slate-100 text-slate-700',
                    ].join(' ')}>
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>
                    <span className={[
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      ENTITY_COLORS[entry.entity] ?? 'bg-slate-100 text-slate-700',
                    ].join(' ')}>
                      {entry.entity.charAt(0).toUpperCase() + entry.entity.slice(1)}
                    </span>
                    <span className="truncate font-medium text-slate-800">{entry.entityLabel}</span>
                  </div>

                  {/* Field-level changes */}
                  {entry.changes && Object.keys(entry.changes).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(entry.changes).map(([field, change]) => (
                        <span key={field} className="rounded-md bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
                          <span className="font-medium">{field}</span>:{' '}
                          <span className="text-red-600 line-through">{String(change.from ?? '—')}</span>
                          {' → '}
                          <span className="text-emerald-600">{String(change.to ?? '—')}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>{formatRelativeDate(entry.createdAt)}</span>
                    {entry.ip && <span>IP: {entry.ip}</span>}
                    <span className="hidden font-mono text-slate-300 sm:inline">{entry.id}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
          <p className="text-sm text-slate-500">
            Page <span className="font-medium text-slate-900">{page}</span> of{' '}
            <span className="font-medium text-slate-900">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
