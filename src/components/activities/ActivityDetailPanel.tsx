import {
  CheckSquare,
  FileText,
  Mail,
  Phone,
  Users,
  X,
  Calendar,
  User,
  Link as LinkIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate, formatRelativeDate } from '@/lib/format'
import type { Activity, ActivityType } from '@/types/activity'

const TYPE_META: Record<ActivityType, { icon: typeof Phone; color: string; bg: string; label: string }> = {
  call:    { icon: Phone,       color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Phone Call'  },
  email:   { icon: Mail,        color: 'text-emerald-600',bg: 'bg-emerald-50',label: 'Email'       },
  meeting: { icon: Users,       color: 'text-purple-600', bg: 'bg-purple-50', label: 'Site Visit'  },
  note:    { icon: FileText,    color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Note'        },
  task:    { icon: CheckSquare, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Task'        },
}

const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-blue-100 text-blue-700',
}

function relatedHref(activity: Activity): string | null {
  if (!activity.relatedTo) return null
  if (activity.relatedType === 'customer') return `/customers/${activity.relatedTo}`
  if (activity.relatedType === 'lead')     return `/leads/${activity.relatedTo}`
  if (activity.relatedType === 'deal')     return `/deals/${activity.relatedTo}`
  return null
}

interface ActivityDetailPanelProps {
  activity: Activity | null
  onClose: () => void
}

export function ActivityDetailPanel({ activity, onClose }: ActivityDetailPanelProps) {
  if (!activity) return null

  const meta = TYPE_META[activity.type]
  const Icon = meta.icon
  const href = relatedHref(activity)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-slate-900/30"
        aria-hidden
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Activity details"
        className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col bg-white shadow-2xl"
        onKeyDown={e => e.key === 'Escape' && onClose()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={['flex h-9 w-9 items-center justify-center rounded-full', meta.bg].join(' ')}>
              <Icon className={['h-5 w-5', meta.color].join(' ')} aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{meta.label}</p>
              <p className={['text-xs font-medium', activity.completed ? 'text-emerald-600' : 'text-slate-500'].join(' ')}>
                {activity.completed ? '✓ Completed' : 'Pending'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div>
            <h2 className={[
              'text-lg font-semibold leading-snug',
              activity.completed ? 'line-through text-slate-400' : 'text-slate-900',
            ].join(' ')}>
              {activity.title}
            </h2>
          </div>

          {/* Description */}
          {activity.description ? (
            <div className="rounded-lg border border-border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Details</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {activity.description}
              </p>
            </div>
          ) : null}

          {/* Meta grid */}
          <div className="rounded-lg border border-border bg-white divide-y divide-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <User className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="w-20 text-xs text-slate-500 shrink-0">Owner</span>
              <span className="text-sm font-medium text-slate-800">{activity.owner}</span>
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
              <Calendar className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="w-20 text-xs text-slate-500 shrink-0">Logged</span>
              <div>
                <p className="text-sm font-medium text-slate-800">{formatDate(activity.createdAt)}</p>
                <p className="text-xs text-slate-400">{formatRelativeDate(activity.createdAt)}</p>
              </div>
            </div>

            {activity.type === 'task' && activity.dueDate ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <Calendar className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <span className="w-20 text-xs text-slate-500 shrink-0">Due date</span>
                <p className={['text-sm font-medium', activity.dueDate < new Date().toISOString().slice(0, 10) && !activity.completed ? 'text-red-600' : 'text-slate-800'].join(' ')}>
                  {formatDate(activity.dueDate)}
                </p>
              </div>
            ) : null}

            {activity.type === 'task' && activity.priority ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <CheckSquare className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <span className="w-20 text-xs text-slate-500 shrink-0">Priority</span>
                <span className={['rounded px-2 py-0.5 text-xs font-medium capitalize', PRIORITY_BADGE[activity.priority] ?? 'bg-slate-100 text-slate-600'].join(' ')}>
                  {activity.priority}
                </span>
              </div>
            ) : null}

            {href ? (
              <div className="flex items-center gap-3 px-4 py-3">
                <LinkIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <span className="w-20 text-xs text-slate-500 shrink-0 capitalize">{activity.relatedType}</span>
                <Link
                  to={href}
                  onClick={onClose}
                  className="text-sm font-medium text-brand-600 hover:underline truncate"
                >
                  {activity.relatedName ?? activity.relatedTo}
                </Link>
              </div>
            ) : null}
          </div>

          {/* Type-specific context */}
          {activity.type === 'email' ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Email Activity</p>
              <p className="text-sm text-emerald-800">This email was logged as a CRM activity. No real email was sent through the system.</p>
            </div>
          ) : null}

          {activity.type === 'call' && !activity.completed ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Call Pending</p>
              <p className="text-sm text-blue-800">This call has not been marked complete. Update it once the call has taken place.</p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs text-slate-400 text-center">
            Activity ID: <span className="font-mono">{activity.id}</span>
          </p>
        </div>
      </aside>
    </>
  )
}
