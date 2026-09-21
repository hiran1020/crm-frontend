import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Headphones,
  MessageSquare,
  Plus,
  Search,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TicketFormModal } from '@/components/helpdesk/TicketFormModal'
import { TicketPriorityBadge } from '@/components/helpdesk/TicketPriorityBadge'
import { TicketStatusBadge } from '@/components/helpdesk/TicketStatusBadge'
import { PushToClickUpButton } from '@/components/helpdesk/PushToClickUp'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Pagination } from '@/components/common/Pagination'
import { useToast } from '@/components/common/ToastProvider'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useUsers } from '@/hooks/useUsers'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  useCreateTicket,
  useDeleteTicket,
  useLinkClickUpTask,
  useTicketStats,
  useTickets,
  useUpdateTicket,
} from '@/hooks/useTickets'
import { formatRelativeDate } from '@/lib/format'
import type { TicketFormValues } from '@/schemas/ticket'
import type { Ticket, TicketPriority, TicketStatus } from '@/types/ticket'

const PAGE_SIZE = 15

const STATUS_COUNTS_ICON = {
  Open:        { icon: AlertCircle,  color: 'text-red-600',    bg: 'bg-red-50' },
  'In Progress':{ icon: Clock,       color: 'text-blue-600',   bg: 'bg-blue-50' },
  Resolved:    { icon: CheckCircle2, color: 'text-emerald-600',bg: 'bg-emerald-50' },
  Closed:      { icon: CheckCircle2, color: 'text-slate-500',  bg: 'bg-slate-100' },
}

export function HelpdeskPage() {
  usePageTitle('Help Desk')
  const { notify } = useToast()
  const { data: users = [] } = useUsers()

  const [search, setSearch]   = useState('')
  const dSearch               = useDebouncedValue(search, 300)
  const [status, setStatus]   = useState<TicketStatus | 'All'>('All')
  const [priority, setPriority] = useState<TicketPriority | 'All'>('All')
  const [assignedTo, setAssignedTo] = useState<string>('All')
  const [page, setPage]       = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null)
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null)

  function toggleExpand(id: string) {
    setExpandedTicketId(prev => prev === id ? null : id)
  }

  const params = useMemo(() => ({
    search: dSearch, status, priority, assignedTo, page, pageSize: PAGE_SIZE,
  }), [dSearch, status, priority, assignedTo, page])

  const ticketsQuery  = useTickets(params)
  const allQuery      = useTicketStats()
  const createTicket  = useCreateTicket()
  const updateTicket  = useUpdateTicket()
  const linkClickUp   = useLinkClickUpTask()
  const deleteTicket  = useDeleteTicket()

  const result   = ticketsQuery.data
  const tickets  = result?.data ?? []
  const allTickets = allQuery.data?.data ?? []

  const stats = useMemo(() => ({
    open:       allTickets.filter(t => t.status === 'Open').length,
    inProgress: allTickets.filter(t => t.status === 'In Progress').length,
    resolved:   allTickets.filter(t => t.status === 'Resolved').length,
    closed:     allTickets.filter(t => t.status === 'Closed').length,
    critical:   allTickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length,
  }), [allTickets])

  function openCreate() { setEditingTicket(null); setFormOpen(true) }
  function openEdit(t: Ticket) { setEditingTicket(t); setFormOpen(true) }

  async function handleSubmit(values: TicketFormValues) {
    try {
      if (editingTicket) {
        await updateTicket.mutateAsync({ id: editingTicket.id, input: values })
        notify('Ticket updated')
      } else {
        await createTicket.mutateAsync(values)
        notify('Ticket created')
        setPage(1)
      }
      setFormOpen(false)
      setEditingTicket(null)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save ticket', 'error')
    }
  }

  async function handleDelete() {
    if (!deletingTicket) return
    try {
      await deleteTicket.mutateAsync(deletingTicket.id)
      notify('Ticket deleted')
      setDeletingTicket(null)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete ticket', 'error')
    }
  }

  const isLoading = ticketsQuery.isLoading && !ticketsQuery.data

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Headphones className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Help Desk</h2>
            <p className="text-sm text-slate-500">Track and resolve customer support requests.</p>
          </div>
        </div>
        <button type="button" onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" aria-hidden />
          New Ticket
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          { label: 'Open',        count: stats.open,        ...STATUS_COUNTS_ICON['Open'] },
          { label: 'In Progress', count: stats.inProgress,  ...STATUS_COUNTS_ICON['In Progress'] },
          { label: 'Resolved',    count: stats.resolved,    ...STATUS_COUNTS_ICON['Resolved'] },
          { label: 'Closed',      count: stats.closed,      ...STATUS_COUNTS_ICON['Closed'] },
        ] as const).map(({ label, count, icon: Icon, color, bg }) => (
          <button key={label} type="button"
            onClick={() => { setStatus(label as TicketStatus); setPage(1) }}
            className="rounded-lg border border-border bg-white p-4 text-left shadow-sm hover:border-brand-300 hover:shadow-md transition-all">
            <div className={['mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg', bg].join(' ')}>
              <Icon className={['h-4 w-4', color].join(' ')} aria-hidden />
            </div>
            <p className="text-2xl font-bold text-slate-900">{count}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </button>
        ))}
      </div>

      {stats.critical > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
          <p className="text-sm font-medium text-red-800">
            {stats.critical} critical ticket{stats.critical !== 1 ? 's' : ''} require{stats.critical === 1 ? 's' : ''} immediate attention
          </p>
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search tickets…"
            className="h-10 w-full rounded-md border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value as typeof status); setPage(1) }}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
          <option value="All">All statuses</option>
          {(['Open','In Progress','Pending','Resolved','Closed'] as TicketStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priority} onChange={e => { setPriority(e.target.value as typeof priority); setPage(1) }}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
          <option value="All">All priorities</option>
          {(['Critical','High','Medium','Low'] as TicketPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={assignedTo} onChange={e => { setAssignedTo(e.target.value); setPage(1) }}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
          <option value="All">All agents</option>
          {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {ticketsQuery.isError ? (
        <ErrorState title="Could not load tickets"
          message={ticketsQuery.error instanceof Error ? ticketsQuery.error.message : 'Unknown error'}
          onRetry={() => void ticketsQuery.refetch()} />
      ) : isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border border-border bg-slate-100" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState title="No tickets found"
          description="Try adjusting your filters, or create a new ticket."
          actionLabel="New Ticket" onAction={openCreate} />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            <table className="w-full text-sm" role="table">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Ticket</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">Customer</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">Priority</th>
                  <th className="hidden px-4 py-3 text-left lg:table-cell">Assigned</th>
                  <th className="hidden px-4 py-3 text-left lg:table-cell">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map(ticket => {
                  const isExpanded = expandedTicketId === ticket.id
                  const publicComments = ticket.comments.filter(c => !c.isInternal)
                  return (
                    <>
                      <tr
                        key={ticket.id}
                        className={['cursor-pointer transition-colors', isExpanded ? 'bg-brand-50/40' : 'hover:bg-slate-50'].join(' ')}
                        onClick={() => toggleExpand(ticket.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 text-slate-400 shrink-0">
                              {isExpanded
                                ? <ChevronDown className="h-4 w-4" />
                                : <ChevronRight className="h-4 w-4" />}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 line-clamp-1">
                                {ticket.title}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {ticket.id} · {ticket.category}
                                {ticket.comments.length > 0
                                  ? ` · ${ticket.comments.length} comment${ticket.comments.length !== 1 ? 's' : ''}`
                                  : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-slate-600 sm:table-cell" onClick={e => e.stopPropagation()}>
                          {ticket.customerName
                            ? <Link to={ticket.customerId ? `/customers/${ticket.customerId}` : '#'}
                                className="hover:text-brand-600">{ticket.customerName}</Link>
                            : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3"><TicketStatusBadge status={ticket.status} /></td>
                        <td className="hidden px-4 py-3 md:table-cell"><TicketPriorityBadge priority={ticket.priority} /></td>
                        <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{ticket.assignedTo.split(' ')[0]}</td>
                        <td className="hidden px-4 py-3 text-slate-500 lg:table-cell text-xs">{formatRelativeDate(ticket.updatedAt)}</td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {/* Push to ClickUp — icon only in the list */}
                            <PushToClickUpButton
                              ticket={ticket}
                              variant="icon"
                              onPushed={async (taskId, taskUrl) => {
                                try {
                                  await linkClickUp.mutateAsync({ id: ticket.id, taskId, taskUrl })
                                  notify('Pushed to ClickUp!')
                                } catch { notify('Could not save ClickUp link', 'error') }
                              }}
                            />
                            <button type="button" onClick={() => openEdit(ticket)}
                              className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                              Edit
                            </button>
                            <button type="button" onClick={() => setDeletingTicket(ticket)}
                              className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded ? (
                        <tr key={`${ticket.id}-expanded`} className="bg-slate-50/60">
                          <td colSpan={7} className="px-6 py-4 accordion-open">
                            <div className="grid gap-4 sm:grid-cols-3">
                              {/* Description */}
                              <div className="sm:col-span-2 space-y-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Description</p>
                                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">{ticket.description}</p>
                                </div>

                                {/* Latest comment */}
                                {publicComments.length > 0 ? (
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                                      <MessageSquare className="inline h-3 w-3 mr-1" />
                                      Latest reply
                                    </p>
                                    <div className="rounded-md border border-border bg-white p-3">
                                      <p className="text-xs font-medium text-slate-700">{publicComments[publicComments.length - 1].author}</p>
                                      <p className="mt-0.5 text-sm text-slate-600 line-clamp-2">
                                        {publicComments[publicComments.length - 1].body}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">No replies yet</p>
                                )}
                              </div>

                              {/* Quick actions */}
                              <div className="flex flex-col gap-2">
                                <Link
                                  to={`/helpdesk/${ticket.id}`}
                                  className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-4 w-4" aria-hidden />
                                  Open Ticket
                                </Link>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openEdit(ticket) }}
                                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  Edit Details
                                </button>
                                {ticket.customerName && ticket.customerId ? (
                                  <Link
                                    to={`/customers/${ticket.customerId}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    View Customer
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              {result?.total ?? 0} ticket{(result?.total ?? 0) !== 1 ? 's' : ''} total
              {ticketsQuery.isFetching && (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" aria-label="Refreshing" />
              )}
            </p>
            <Pagination page={result?.page ?? page} totalPages={result?.totalPages ?? 1}
              total={result?.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </div>
        </>
      )}

      <TicketFormModal open={formOpen} ticket={editingTicket}
        busy={createTicket.isPending || updateTicket.isPending}
        onClose={() => { setFormOpen(false); setEditingTicket(null) }}
        onSubmit={handleSubmit} />

      <ConfirmDialog open={Boolean(deletingTicket)} title="Delete ticket?"
        description={deletingTicket ? `Remove "${deletingTicket.title}"? All comments will also be deleted.` : ''}
        busy={deleteTicket.isPending}
        onCancel={() => setDeletingTicket(null)}
        onConfirm={() => void handleDelete()} />
    </div>
  )
}
