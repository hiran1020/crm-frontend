import {
  Bell,
  BriefcaseIcon,
  Check,
  CheckSquare,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useActivities, useMarkActivityComplete } from '@/hooks/useActivities'
import { useDeals } from '@/hooks/useDeals'
import { useLeads } from '@/hooks/useLeads'
import { useToast } from '@/components/common/ToastProvider'
import { formatRelativeDate } from '@/lib/format'

type NotifCategory = 'all' | 'tasks' | 'deals' | 'leads'

interface Notification {
  id: string
  type: 'task_due' | 'task_overdue' | 'deal_won' | 'deal_lost' | 'lead_converted' | 'lead_new'
  title: string
  body: string
  href: string
  time: string
  read: boolean
  icon: typeof Bell
  iconColor: string
  iconBg: string
}

const NOTIF_ICON: Record<Notification['type'], { icon: typeof Bell; color: string; bg: string }> = {
  task_due:       { icon: CheckSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
  task_overdue:   { icon: CheckSquare, color: 'text-red-600',    bg: 'bg-red-50'    },
  deal_won:       { icon: BriefcaseIcon,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  deal_lost:      { icon: BriefcaseIcon,  color: 'text-red-600',    bg: 'bg-red-50'    },
  lead_converted: { icon: UserCheck,  color: 'text-purple-600', bg: 'bg-purple-50' },
  lead_new:       { icon: UserPlus,   color: 'text-blue-600',   bg: 'bg-blue-50'   },
}

export function NotificationsPage() {
  usePageTitle('Notifications')
  const { notify } = useToast()
  const [category, setCategory] = useState<NotifCategory>('all')
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const activitiesQuery = useActivities()
  const dealsQuery = useDeals({ pageSize: 200 })
  const leadsQuery = useLeads({ pageSize: 200 })
  const markComplete = useMarkActivityComplete()

  const today = new Date().toISOString().slice(0, 10)

  const notifications = useMemo<Notification[]>(() => {
    const items: Notification[] = []

    // Overdue tasks
    const allTasks = (activitiesQuery.data ?? []).filter(
      (a) => a.type === 'task' && !a.completed && a.dueDate,
    )
    for (const task of allTasks) {
      const isOverdue = (task.dueDate ?? '') < today
      const isDueToday = task.dueDate === today
      if (!isOverdue && !isDueToday) continue
      const type: Notification['type'] = isOverdue ? 'task_overdue' : 'task_due'
      const style = NOTIF_ICON[type]
      items.push({
        id: `task-${task.id}`,
        type,
        title: isOverdue ? 'Overdue task' : 'Task due today',
        body: task.title,
        href: '/tasks',
        time: task.dueDate ?? today,
        read: false,
        icon: style.icon,
        iconColor: style.color,
        iconBg: style.bg,
      })
    }

    // Won / Lost deals (recent)
    const deals = dealsQuery.data?.data ?? []
    for (const deal of deals.filter((d) => d.stage === 'Won' || d.stage === 'Lost').slice(0, 5)) {
      const type: Notification['type'] = deal.stage === 'Won' ? 'deal_won' : 'deal_lost'
      const style = NOTIF_ICON[type]
      items.push({
        id: `deal-${deal.id}`,
        type,
        title: deal.stage === 'Won' ? '🎉 Deal won!' : 'Deal lost',
        body: deal.title,
        href: `/deals/${deal.id}`,
        time: deal.expectedCloseDate,
        read: false,
        icon: style.icon,
        iconColor: style.color,
        iconBg: style.bg,
      })
    }

    // Converted leads (recent)
    const leads = leadsQuery.data?.data ?? []
    for (const lead of leads.filter((l) => l.status === 'Converted').slice(0, 5)) {
      const style = NOTIF_ICON.lead_converted
      items.push({
        id: `lead-converted-${lead.id}`,
        type: 'lead_converted',
        title: 'Lead converted',
        body: `${lead.name} from ${lead.company}`,
        href: `/leads/${lead.id}`,
        time: lead.createdAt,
        read: false,
        icon: style.icon,
        iconColor: style.color,
        iconBg: style.bg,
      })
    }

    // New leads (this week)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    for (const lead of leads.filter((l) => l.createdAt >= sevenDaysAgo && l.status === 'New').slice(0, 3)) {
      const style = NOTIF_ICON.lead_new
      items.push({
        id: `lead-new-${lead.id}`,
        type: 'lead_new',
        title: 'New lead',
        body: `${lead.name} from ${lead.company} (${lead.source})`,
        href: `/leads/${lead.id}`,
        time: lead.createdAt,
        read: false,
        icon: style.icon,
        iconColor: style.color,
        iconBg: style.bg,
      })
    }

    return items
      .filter((n) => !dismissedIds.has(n.id))
      .sort((a, b) => b.time.localeCompare(a.time))
      .map((n) => ({ ...n, read: readIds.has(n.id) }))
  }, [activitiesQuery.data, dealsQuery.data, leadsQuery.data, readIds, dismissedIds, today])

  const filtered = useMemo(() => {
    if (category === 'all') return notifications
    if (category === 'tasks') return notifications.filter((n) => n.type.startsWith('task'))
    if (category === 'deals') return notifications.filter((n) => n.type.startsWith('deal'))
    if (category === 'leads') return notifications.filter((n) => n.type.startsWith('lead'))
    return notifications
  }, [notifications, category])

  const unreadCount = notifications.filter((n) => !n.read).length

  function markRead(id: string) {
    setReadIds((prev) => new Set([...prev, id]))
  }

  function markAllRead() {
    setReadIds(new Set(notifications.map((n) => n.id)))
  }

  function dismiss(id: string) {
    setDismissedIds((prev) => new Set([...prev, id]))
  }

  function clearAll() {
    setDismissedIds(new Set(notifications.map((n) => n.id)))
    notify('All notifications cleared')
  }

  async function completeTask(activityId: string, notifId: string) {
    try {
      await markComplete.mutateAsync(activityId)
      dismiss(notifId)
      notify('Task marked complete')
    } catch {
      notify('Could not update task', 'error')
    }
  }

  const isLoading = activitiesQuery.isLoading || dealsQuery.isLoading || leadsQuery.isLoading

  const CATEGORIES: { id: NotifCategory; label: string; icon: typeof Bell }[] = [
    { id: 'all',   label: 'All',   icon: Bell },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'deals', label: 'Deals', icon: BriefcaseIcon },
    { id: 'leads', label: 'Leads', icon: Users },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {notifications.length > 0 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllRead}
              className="text-sm text-brand-600 hover:underline"
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-slate-400 hover:text-red-600"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-white p-1 shadow-sm">
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setCategory(id)}
            className={[
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              category === id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50',
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg border border-border bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You're all caught up! New tasks, deals, and lead updates will appear here."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const Icon = notif.icon
            const isTask = notif.type.startsWith('task')
            const taskId = isTask ? notif.id.replace('task-', '') : ''

            return (
              <div
                key={notif.id}
                className={[
                  'group flex items-start gap-3 rounded-lg border p-4 shadow-sm transition-all',
                  notif.read
                    ? 'border-border bg-white opacity-70'
                    : 'border-border bg-white',
                ].join(' ')}
                onClick={() => markRead(notif.id)}
              >
                {/* Unread dot */}
                <div className="mt-1.5 shrink-0">
                  {!notif.read ? (
                    <div className="h-2 w-2 rounded-full bg-brand-600" />
                  ) : (
                    <div className="h-2 w-2" />
                  )}
                </div>

                {/* Icon */}
                <div
                  className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    notif.iconBg,
                  ].join(' ')}
                >
                  <Icon className={['h-4 w-4', notif.iconColor].join(' ')} aria-hidden />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {notif.title}
                      </p>
                      <Link
                        to={notif.href}
                        className="mt-0.5 block truncate text-sm font-medium text-slate-900 hover:text-brand-600"
                        onClick={() => markRead(notif.id)}
                      >
                        {notif.body}
                      </Link>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatRelativeDate(notif.time)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-2 flex items-center gap-2">
                    {isTask && !notif.read ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          void completeTask(taskId, notif.id)
                        }}
                        disabled={markComplete.isPending}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" aria-hidden />
                        Mark complete
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        dismiss(notif.id)
                      }}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Activity feed link */}
      <div className="rounded-lg border border-border bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-500">
          See all logged interactions in{' '}
          <Link to="/activities" className="text-brand-600 hover:underline">
            Activities
          </Link>{' '}
          and pending to-dos in{' '}
          <Link to="/tasks" className="text-brand-600 hover:underline">
            Tasks
          </Link>.
        </p>
      </div>
    </div>
  )
}
