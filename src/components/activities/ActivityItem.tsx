import {
  Check,
  CheckSquare,
  FileText,
  Mail,
  Phone,
  Trash2,
  Users,
} from 'lucide-react'
import type { Activity, ActivityType } from '@/types/activity'

interface ActivityItemProps {
  activity: Activity
  onMarkComplete?: (id: string) => void
  onDelete?: (id: string) => void
  actionsBusy?: boolean
  onClick?: (activity: Activity) => void
}

function ActivityIcon({ type }: { type: ActivityType }) {
  const icons: Record<ActivityType, typeof Phone> = {
    call: Phone,
    email: Mail,
    meeting: Users,
    note: FileText,
    task: CheckSquare,
  }

  const colors: Record<ActivityType, string> = {
    call: 'text-blue-600 bg-blue-50',
    email: 'text-emerald-600 bg-emerald-50',
    meeting: 'text-purple-600 bg-purple-50',
    note: 'text-yellow-600 bg-yellow-50',
    task: 'text-orange-600 bg-orange-50',
  }

  const Icon = icons[type]

  return (
    <div
      className={[
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
        colors[type],
      ].join(' ')}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </div>
  )
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export function ActivityItem({
  activity,
  onMarkComplete,
  onDelete,
  actionsBusy = false,
  onClick,
}: ActivityItemProps) {
  return (
    <div
      className={[
        'flex items-start gap-3 rounded-lg border border-border bg-white p-3 transition-shadow',
        activity.completed ? 'opacity-70' : '',
        onClick ? 'cursor-pointer hover:shadow-md' : '',
      ].join(' ')}
      onClick={onClick ? () => onClick(activity) : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(activity) } : undefined}
    >
      <ActivityIcon type={activity.type} />

      <div className="min-w-0 flex-1">
        <p
          className={[
            'text-sm font-medium',
            activity.completed
              ? 'text-slate-400 line-through'
              : 'text-slate-900',
          ].join(' ')}
        >
          {activity.title}
        </p>
        {activity.description ? (
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
            {activity.description}
          </p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
          <span>{formatRelativeDate(activity.createdAt)}</span>
          <span>·</span>
          <span>{activity.owner}</span>
          {activity.relatedName ? (
            <>
              <span>·</span>
              <span className="truncate">{activity.relatedName}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Status badge + actions */}
      <div className="flex shrink-0 items-center gap-1">
        {activity.completed ? (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Done
          </span>
        ) : (
          <>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {activity.type}
            </span>
            {onMarkComplete ? (
              <button
                type="button"
                onClick={() => onMarkComplete(activity.id)}
                disabled={actionsBusy}
                aria-label="Mark complete"
                title="Mark complete"
                className="rounded p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </>
        )}
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(activity.id)}
            disabled={actionsBusy}
            aria-label="Delete activity"
            title="Delete"
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
