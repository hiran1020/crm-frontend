import {
  CheckSquare,
  FileText,
  Mail,
  Phone,
  Users,
} from 'lucide-react'
import { useCustomerActivities } from '@/hooks/useActivities'
import type { ActivityType } from '@/types/activity'

interface CustomerActivitiesListProps {
  customerId: string
}

function ActivityIcon({ type }: { type: ActivityType }) {
  const icons: Record<ActivityType, typeof Phone> = {
    call: Phone,
    email: Mail,
    meeting: Users,
    note: FileText,
    task: CheckSquare,
  }

  const Icon = icons[type]
  const colors: Record<ActivityType, string> = {
    call: 'text-blue-600 bg-blue-50',
    email: 'text-emerald-600 bg-emerald-50',
    meeting: 'text-purple-600 bg-purple-50',
    note: 'text-yellow-600 bg-yellow-50',
    task: 'text-orange-600 bg-orange-50',
  }

  return (
    <div
      className={[
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
        colors[type],
      ].join(' ')}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </div>
  )
}

export function CustomerActivitiesList({
  customerId,
}: CustomerActivitiesListProps) {
  const activitiesQuery = useCustomerActivities(customerId)

  if (activitiesQuery.isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-14 rounded-lg border border-border bg-slate-100"
          />
        ))}
      </div>
    )
  }

  const activities = activitiesQuery.data ?? []

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-900">No activities yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Calls, emails, and meetings with this customer will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const date = new Date(activity.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-white p-3 shadow-sm"
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
              <p className="mt-0.5 text-xs text-slate-500">
                {date} · {activity.owner}
              </p>
            </div>
            {activity.completed ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Done
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
