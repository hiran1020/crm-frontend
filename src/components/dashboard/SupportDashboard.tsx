/**
 * Dashboard view for Support Agents — focuses on Help Desk metrics
 * instead of the sales-focused pipeline/forecast view.
 */
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Headphones,
  MessageSquare,
  Timer,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTickets } from '@/hooks/useTickets'
import { useActivities } from '@/hooks/useActivities'
import { LiveUpdateBadge } from '@/components/common/LiveUpdateBadge'
import { TicketStatusBadge } from '@/components/helpdesk/TicketStatusBadge'
import { TicketPriorityBadge } from '@/components/helpdesk/TicketPriorityBadge'
import { formatRelativeDate } from '@/lib/format'

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-slate-900',
  bg = 'bg-white',
}: {
  icon: typeof AlertCircle
  label: string
  value: string | number
  sub?: string
  color?: string
  bg?: string
}) {
  return (
    <div className={[bg, 'rounded-lg border border-border p-5 shadow-sm'].join(' ')}>
      <div className="flex items-center gap-3">
        <Icon className={['h-5 w-5', color].join(' ')} aria-hidden />
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className={['text-2xl font-bold', color].join(' ')}>{value}</p>
          {sub ? <p className="text-xs text-slate-400">{sub}</p> : null}
        </div>
      </div>
    </div>
  )
}

export function SupportDashboard() {
  const { user } = useAuth()
  const ticketsQuery = useTickets({ pageSize: 200 })
  const activitiesQuery = useActivities()

  const tickets = ticketsQuery.data?.data ?? []
  const activities = activitiesQuery.data ?? []

  const stats = useMemo(() => {
    const open     = tickets.filter(t => t.status === 'Open').length
    const critical = tickets.filter(t => t.status === 'Open' && t.priority === 'Critical').length
    const mine     = tickets.filter(t => t.assignedTo === user?.name && t.status !== 'Closed' && t.status !== 'Resolved').length
    const resolved = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length
    const pending  = tickets.filter(t => t.status === 'Pending').length
    return { open, critical, mine, resolved, pending }
  }, [tickets, user])

  const myOpenTickets = tickets
    .filter(t => t.assignedTo === user?.name && t.status !== 'Closed' && t.status !== 'Resolved')
    .sort((a, b) => {
      const order = { Critical: 0, High: 1, Medium: 2, Low: 3 }
      return order[a.priority] - order[b.priority]
    })
    .slice(0, 8)

  const recentActivities = [...activities]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  const unratedTickets = tickets.filter(
    t => t.status === 'Open' && t.priority === 'Critical' && t.assignedTo !== user?.name
  ).slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">
              Support Dashboard
            </h2>
            <LiveUpdateBadge />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {user?.name?.split(' ')[0]}. Here's your support queue.
          </p>
        </div>
        <Link
          to="/helpdesk"
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Headphones className="h-4 w-4" aria-hidden />
          Open Help Desk
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={AlertCircle}
          label="Open tickets"
          value={stats.open}
          sub="Waiting for resolution"
          color={stats.open > 5 ? 'text-red-600' : 'text-slate-900'}
        />
        <StatCard
          icon={Timer}
          label="Critical"
          value={stats.critical}
          sub="Urgent — needs immediate attention"
          color={stats.critical > 0 ? 'text-red-600' : 'text-emerald-600'}
          bg={stats.critical > 0 ? 'bg-red-50' : 'bg-white'}
        />
        <StatCard
          icon={MessageSquare}
          label="Assigned to me"
          value={stats.mine}
          sub="Your active tickets"
          color="text-brand-700"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={stats.resolved}
          sub="Closed & resolved"
          color="text-emerald-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* My tickets */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              My Open Tickets
            </h3>
            <Link to="/helpdesk" className="text-xs text-brand-600 hover:underline">
              View all
            </Link>
          </div>

          {myOpenTickets.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" aria-hidden />
              <p className="mt-2 text-sm font-medium text-emerald-600">All caught up!</p>
              <p className="text-xs text-slate-400">No open tickets assigned to you.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myOpenTickets.map(ticket => (
                <Link
                  key={ticket.id}
                  to={`/helpdesk/${ticket.id}`}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 hover:border-brand-300 hover:bg-slate-50/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-400 font-mono">{ticket.id}</span>
                      <TicketPriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-slate-900 line-clamp-1">
                      {ticket.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ticket.customerName ?? '—'} · {formatRelativeDate(ticket.updatedAt)}
                    </p>
                  </div>
                  <TicketStatusBadge status={ticket.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Critical unassigned */}
          {unratedTickets.length > 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-red-600" aria-hidden />
                <h3 className="text-sm font-semibold text-red-800">
                  Critical — Needs Attention
                </h3>
              </div>
              <div className="space-y-2">
                {unratedTickets.map(t => (
                  <Link
                    key={t.id}
                    to={`/helpdesk/${t.id}`}
                    className="flex items-center justify-between rounded-md bg-white p-2.5 text-xs hover:bg-red-50 transition-colors border border-red-100"
                  >
                    <span className="font-medium text-slate-800 truncate mr-2 max-w-[160px]">
                      {t.title}
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-red-400" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Recent activities */}
          <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" aria-hidden />
                <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              </div>
              <Link to="/activities" className="text-xs text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            {recentActivities.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No activities yet</p>
            ) : (
              <div className="space-y-2">
                {recentActivities.map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400 mt-1.5" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 line-clamp-1">{a.title}</p>
                      <p className="text-slate-400">{formatRelativeDate(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Queue Overview</h3>
            <div className="space-y-2">
              {[
                { label: 'Open',        count: stats.open,    color: 'bg-red-400' },
                { label: 'Pending',     count: stats.pending, color: 'bg-yellow-400' },
                { label: 'Resolved',    count: stats.resolved,color: 'bg-emerald-400' },
              ].map(({ label, count, color }) => {
                const total = tickets.length || 1
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <span className="w-14 text-slate-600">{label}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={['h-2 rounded-full', color].join(' ')} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-slate-700 font-medium">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
