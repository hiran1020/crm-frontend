import { useState } from 'react'
import { useToast } from '@/components/common/ToastProvider'
import { ActivityDetailPanel } from '@/components/activities/ActivityDetailPanel'
import { ActivityItem } from '@/components/activities/ActivityItem'
import {
  useDeleteActivity,
  useMarkActivityComplete,
} from '@/hooks/useActivities'
import type { Activity } from '@/types/activity'

interface ActivityListProps {
  activities: Activity[]
  groupByDate?: boolean
  /** Show mark-complete and delete action buttons */
  showActions?: boolean
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(thisWeekStart.getDate() - 7)

  const activityDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )

  if (activityDay.getTime() === today.getTime()) return 'Today'
  if (activityDay.getTime() === yesterday.getTime()) return 'Yesterday'
  if (activityDay >= thisWeekStart) return 'This week'

  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function groupActivities(activities: Activity[]): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>()
  const labelOrder: string[] = []

  for (const activity of activities) {
    const label = getDateLabel(activity.createdAt)
    if (!groups.has(label)) {
      groups.set(label, [])
      labelOrder.push(label)
    }
    groups.get(label)!.push(activity)
  }

  const ordered = new Map<string, Activity[]>()
  for (const label of labelOrder) {
    ordered.set(label, groups.get(label)!)
  }
  return ordered
}

export function ActivityList({
  activities,
  groupByDate = false,
  showActions = false,
}: ActivityListProps) {
  const { notify } = useToast()
  const markComplete = useMarkActivityComplete()
  const deleteActivity = useDeleteActivity()
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)

  if (activities.length === 0) return null

  async function handleMarkComplete(id: string) {
    try {
      await markComplete.mutateAsync(id)
      notify('Marked complete')
    } catch {
      notify('Could not update activity', 'error')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteActivity.mutateAsync(id)
      notify('Activity deleted')
    } catch {
      notify('Could not delete activity', 'error')
    }
  }

  const actionsBusy = markComplete.isPending || deleteActivity.isPending

  function renderItem(activity: Activity) {
    return (
      <ActivityItem
        key={activity.id}
        activity={activity}
        onMarkComplete={showActions ? (id) => void handleMarkComplete(id) : undefined}
        onDelete={showActions ? (id) => void handleDelete(id) : undefined}
        actionsBusy={actionsBusy}
        onClick={(a) => setSelectedActivity(a)}
      />
    )
  }

  const panel = (
    <ActivityDetailPanel
      activity={selectedActivity}
      onClose={() => setSelectedActivity(null)}
    />
  )

  if (!groupByDate) {
    return (
      <>
        <div className="space-y-2">
          {activities.map((activity) => renderItem(activity))}
        </div>
        {panel}
      </>
    )
  }

  const groups = groupActivities(activities)

  return (
    <>
      <div className="space-y-6">
        {Array.from(groups.entries()).map(([label, items]) => (
          <div key={label}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </h3>
            <div className="space-y-2">
              {items.map((activity) => renderItem(activity))}
            </div>
          </div>
        ))}
      </div>
      {panel}
    </>
  )
}
