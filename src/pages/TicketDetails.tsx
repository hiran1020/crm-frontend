import {
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  Lock,
  MessageSquare,
  Pencil,
  Send,
  Tag,
  Trash2,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TicketFormModal } from '@/components/helpdesk/TicketFormModal'
import { TicketPriorityBadge } from '@/components/helpdesk/TicketPriorityBadge'
import { TicketStatusBadge } from '@/components/helpdesk/TicketStatusBadge'
import { PushToClickUpButton } from '@/components/helpdesk/PushToClickUp'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { useToast } from '@/components/common/ToastProvider'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import {
  useAddComment,
  useDeleteTicket,
  useLinkClickUpTask,
  useTicket,
  useUpdateTicket,
} from '@/hooks/useTickets'
import { formatDate, formatRelativeDate } from '@/lib/format'
import type { TicketFormValues } from '@/schemas/ticket'
import type { TicketStatus } from '@/types/ticket'

const STATUS_OPTIONS: TicketStatus[] = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed']

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-48 rounded bg-slate-100" />
      <div className="h-8 w-96 rounded bg-slate-100" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-lg bg-slate-100" />
        <div className="h-80 rounded-lg bg-slate-100 lg:col-span-2" />
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, children }: { icon: typeof User; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500 shrink-0 w-20">{label}</span>
        <div className="text-sm text-slate-800 text-right">{children}</div>
      </div>
    </div>
  )
}

export function TicketDetailsPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const { notify } = useToast()
  const { user } = useAuth()

  const ticketQuery  = useTicket(ticketId ?? '')
  const updateTicket    = useUpdateTicket()
  const deleteTicket    = useDeleteTicket()
  const addComment      = useAddComment()
  const linkClickUp     = useLinkClickUpTask()

  usePageTitle(ticketQuery.data ? ticketQuery.data.title : 'Ticket')

  const [formOpen, setFormOpen]         = useState(false)
  const [deleteOpen, setDeleteOpen]     = useState(false)
  const [replyBody, setReplyBody]       = useState('')
  const [replyInternal, setReplyInternal] = useState(false)

  if (!ticketId) return <ErrorState message="No ticket ID in URL" />
  if (ticketQuery.isLoading) return <PageSkeleton />
  if (ticketQuery.isError) {
    return <ErrorState title="Could not load ticket"
      message={ticketQuery.error instanceof Error ? ticketQuery.error.message : 'Unknown error'}
      onRetry={() => void ticketQuery.refetch()} />
  }

  const maybeTicket = ticketQuery.data
  if (!maybeTicket) return null
  const ticket = maybeTicket

  // Days open
  const daysOpen = Math.floor(
    (Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  async function handleFormSubmit(values: TicketFormValues) {
    try {
      await updateTicket.mutateAsync({ id: ticket.id, input: values })
      notify('Ticket updated')
      setFormOpen(false)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update ticket', 'error')
    }
  }

  async function handleStatusChange(status: TicketStatus) {
    try {
      await updateTicket.mutateAsync({ id: ticket.id, input: { status } })
      notify(`Status → ${status}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update status', 'error')
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteTicket.mutateAsync(ticket.id)
      notify('Ticket deleted')
      navigate('/helpdesk')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete ticket', 'error')
    }
  }

  async function handleReply() {
    if (!replyBody.trim()) return
    try {
      await addComment.mutateAsync({
        ticketId: ticket.id,
        input: {
          ticketId: ticket.id,
          author: user?.name ?? 'Agent',
          body: replyBody.trim(),
          isInternal: replyInternal,
        },
      })
      setReplyBody('')
      notify(replyInternal ? 'Internal note added' : 'Reply sent')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not add reply', 'error')
    }
  }

  const publicComments   = ticket.comments.filter(c => !c.isInternal)
  const internalComments = ticket.comments.filter(c => c.isInternal)

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[
        { label: 'Help Desk', href: '/helpdesk' },
        { label: ticket.id },
      ]} />

      {/* Title + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{ticket.id}</span>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 leading-snug">{ticket.title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Opened {daysOpen === 0 ? 'today' : `${daysOpen} day${daysOpen !== 1 ? 's' : ''} ago`}
            {ticket.customerName ? ` by ${ticket.customerName}` : ''}
            {' · '}{ticket.category}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Quick status change */}
          <select
            value={ticket.status}
            onChange={e => void handleStatusChange(e.target.value as TicketStatus)}
            disabled={updateTicket.isPending}
            className="h-9 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {/* Push to ClickUp */}
          <PushToClickUpButton
            ticket={ticket}
            variant="button"
            onPushed={async (taskId, taskUrl) => {
              try {
                await linkClickUp.mutateAsync({ id: ticket.id, taskId, taskUrl })
                notify('Ticket pushed to ClickUp successfully!')
              } catch {
                notify('Could not save ClickUp link', 'error')
              }
            }}
          />
          <button type="button" onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Pencil className="h-4 w-4" aria-hidden />
            Edit
          </button>
          <button type="button" onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: Details card */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Ticket Details</h3>

            <InfoRow icon={User} label="Assigned">
              <span>{ticket.assignedTo}</span>
            </InfoRow>
            <InfoRow icon={Building2} label="Customer">
              {ticket.customerName && ticket.customerId
                ? <Link to={`/customers/${ticket.customerId}`} className="text-brand-600 hover:underline">{ticket.customerName}</Link>
                : <span>{ticket.customerName ?? '—'}</span>}
            </InfoRow>
            <InfoRow icon={Tag} label="Category">
              <span>{ticket.category}</span>
            </InfoRow>
            <InfoRow icon={Calendar} label="Created">
              <span>{formatDate(ticket.createdAt)}</span>
            </InfoRow>
            <InfoRow icon={Clock} label="Updated">
              <span>{formatRelativeDate(ticket.updatedAt)}</span>
            </InfoRow>
            {ticket.resolvedAt ? (
              <InfoRow icon={Clock} label="Resolved">
                <span className="text-emerald-600">{formatDate(ticket.resolvedAt)}</span>
              </InfoRow>
            ) : null}
            <InfoRow icon={User} label="Reporter">
              <span>{ticket.createdBy}</span>
            </InfoRow>
            {ticket.clickupTaskUrl ? (
              <InfoRow icon={ExternalLink} label="ClickUp">
                <a
                  href={ticket.clickupTaskUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-600 hover:underline flex items-center gap-1"
                >
                  View task
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </InfoRow>
            ) : null}
          </div>

          {/* Description */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Description</h3>
            <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
              {ticket.description}
            </p>
          </div>

          {/* Internal notes summary */}
          {internalComments.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-amber-600" aria-hidden />
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  {internalComments.length} Internal Note{internalComments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="space-y-2">
                {internalComments.map(note => (
                  <div key={note.id} className="text-xs text-amber-800">
                    <span className="font-medium">{note.author}:</span>{' '}{note.body}
                    <span className="ml-2 text-amber-600">{formatRelativeDate(note.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* RIGHT: Conversation thread */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <MessageSquare className="h-4 w-4 text-slate-400" aria-hidden />
              <h3 className="text-sm font-semibold text-slate-900">
                Conversation
              </h3>
              <span className="ml-auto text-xs text-slate-400">
                {publicComments.length} message{publicComments.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Messages */}
            <div className="divide-y divide-border">
              {publicComments.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-slate-200" aria-hidden />
                  <p className="mt-2 text-sm text-slate-400">No replies yet. Add the first response below.</p>
                </div>
              ) : (
                publicComments.map(comment => {
                  const isAgent = ['Sarah Wilson', 'David Chen', 'Emily Rodriguez', 'Admin User'].includes(comment.author)
                  return (
                    <div key={comment.id} className={['px-5 py-4', isAgent ? 'bg-brand-50/30' : ''].join(' ')}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={[
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          isAgent ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600',
                        ].join(' ')}>
                          {comment.author.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-900">{comment.author}</span>
                          {isAgent ? <span className="ml-1.5 text-[10px] rounded bg-brand-100 text-brand-700 px-1 py-0.5 font-medium">Agent</span> : null}
                        </div>
                        <span className="ml-auto text-xs text-slate-400">{formatRelativeDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pl-9">
                        {comment.body}
                      </p>
                    </div>
                  )
                })
              )}
            </div>

            {/* Reply box */}
            <div className="border-t border-border p-5">
              <div className="mb-3 flex items-center gap-3">
                <button type="button"
                  onClick={() => setReplyInternal(false)}
                  className={['rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    !replyInternal ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'].join(' ')}>
                  Reply to customer
                </button>
                <button type="button"
                  onClick={() => setReplyInternal(true)}
                  className={['inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    replyInternal ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'].join(' ')}>
                  <Lock className="h-3 w-3" aria-hidden />
                  Internal note
                </button>
              </div>
              <textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                rows={4}
                placeholder={replyInternal
                  ? 'Add an internal note (not visible to customer)…'
                  : 'Write your reply to the customer…'}
                className={[
                  'w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus:ring-2',
                  replyInternal
                    ? 'border-amber-300 bg-amber-50 focus:border-amber-500 focus:ring-amber-100'
                    : 'border-border bg-white focus:border-brand-500 focus:ring-brand-100',
                ].join(' ')}
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {replyInternal
                    ? '🔒 Only visible to your team'
                    : '📧 Will be logged as an email activity'}
                </p>
                <button type="button" onClick={() => void handleReply()}
                  disabled={addComment.isPending || !replyBody.trim()}
                  className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                  <Send className="h-3.5 w-3.5" aria-hidden />
                  {addComment.isPending ? 'Sending…' : replyInternal ? 'Add Note' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TicketFormModal open={formOpen} ticket={ticket}
        busy={updateTicket.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit} />

      <ConfirmDialog open={deleteOpen} title="Delete ticket?"
        description={`Remove "${ticket.title}" and all ${ticket.comments.length} comments? This cannot be undone.`}
        busy={deleteTicket.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteConfirm()} />
    </div>
  )
}
