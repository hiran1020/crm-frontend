import { ClipboardList, Shield } from 'lucide-react'
import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuditLog } from '@/hooks/useAuditLog'
import { formatRelativeDate } from '@/lib/format'
import type { AuditAction, AuditEntity } from '@/types/auditLog'

const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
  status_change: 'changed status of',
  stage_change: 'changed stage of',
  login: 'logged in as',
  export: 'exported',
}

const ACTION_COLORS: Record<AuditAction, string> = {
  create: 'bg-emerald-50 text-emerald-700',
  update: 'bg-blue-50 text-blue-700',
  delete: 'bg-red-50 text-red-700',
  status_change: 'bg-amber-50 text-amber-700',
  stage_change: 'bg-orange-50 text-orange-700',
  login: 'bg-slate-100 text-slate-700',
  export: 'bg-purple-50 text-purple-700',
}

const ENTITY_LABELS: Record<AuditEntity, string> = {
  customer: 'Customer',
  lead: 'Lead',
  deal: 'Deal',
  activity: 'Activity',
  ticket: 'Ticket',
  user: 'User',
}

const ENTITY_COLORS: Record<AuditEntity, string> = {
  customer: 'bg-blue-100 text-blue-700',
  lead: 'bg-emerald-100 text-emerald-700',
  deal: 'bg-yellow-100 text-yellow-700',
  activity: 'bg-purple-100 text-purple-700',
  ticket: 'bg-pink-100 text-pink-700',
  user: 'bg-slate-100 text-slate-700',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function AuditLogPage() {
  usePageTitle('Audit Log')
  const permissions = usePermissions()
  const [search, setSearch] = useState('')
  const [entity, setEntity] = useState<AuditEntity | 'all'>('all')
  const [action, setAction] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: entries = [], isLoading } = useAuditLog({
    search: search || undefined,
    entity: entity === 'all' ? undefined : entity,
    action: action === 'all' ? undefined : action,
    from: dateFrom || undefined,
    to: dateTo || undefined,
  })

  if (!permissions.canManageTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-slate-300 mb-4" aria-hidden />
        <h2 className="text-lg font-semibold text-slate-900">Admin access required</h2>
        <p className="mt-1 text-sm text-slate-500">
          The audit log is only accessible to Admin users.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
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
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search actor or entity…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-56 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <select
          value={entity}
          onChange={(e) => setEntity(e.target.value as AuditEntity | 'all')}
          className="h-9 rounded-md border border-border bg-white px-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="all">All entities</option>
          {(Object.keys(ENTITY_LABELS) as AuditEntity[]).map((e) => (
            <option key={e} value={e}>{ENTITY_LABELS[e]}</option>
          ))}
        </select>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-9 rounded-md border border-border bg-white px-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="all">All actions</option>
          {(Object.keys(ACTION_LABELS) as AuditAction[]).map((a) => (
            <option key={a} value={a}>{a.replace('_', ' ')}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 rounded-md border border-border bg-white px-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 rounded-md border border-border bg-white px-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-slate-500">{entries.length} entries found</p>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-border bg-white"
            />
          ))
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-border bg-white p-10 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
            <p className="mt-2 text-sm text-slate-500">No audit log entries found</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                  {getInitials(entry.actor)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm">
                    <span className="font-semibold text-slate-900">{entry.actor}</span>
                    <span className="text-xs text-slate-400 capitalize">({entry.actorRole.replace('_', ' ')})</span>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        ACTION_COLORS[entry.action],
                      ].join(' ')}
                    >
                      {ACTION_LABELS[entry.action]}
                    </span>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        ENTITY_COLORS[entry.entity],
                      ].join(' ')}
                    >
                      {ENTITY_LABELS[entry.entity]}
                    </span>
                    <span className="font-medium text-slate-800">{entry.entityLabel}</span>
                  </div>

                  {entry.changes && Object.keys(entry.changes).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {Object.entries(entry.changes).map(([field, change]) => (
                        <span
                          key={field}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                        >
                          {field}:{' '}
                          <span className="text-red-600">{String(change.from)}</span>
                          {' → '}
                          <span className="text-emerald-600">{String(change.to)}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                    <span>{formatRelativeDate(entry.createdAt)}</span>
                    {entry.ip && <span>IP: {entry.ip}</span>}
                    <span className="font-mono text-slate-300">{entry.id}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
