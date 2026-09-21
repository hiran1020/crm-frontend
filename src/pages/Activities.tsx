import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ActivityFilters } from '@/components/activities/ActivityFilters'
import { ActivityFormModal } from '@/components/activities/ActivityFormModal'
import { ActivityList } from '@/components/activities/ActivityList'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { useToast } from '@/components/common/ToastProvider'
import { useActivities, useCreateActivity } from '@/hooks/useActivities'
import { useUsers } from '@/hooks/useUsers'
import type { ActivityFormValues } from '@/schemas/activity'
import type { ActivityType } from '@/types/activity'

type CompletedFilter = 'All' | 'Completed' | 'Pending'

export function ActivitiesPage() {
  usePageTitle('Activities')
  const { notify } = useToast()
  const [type, setType] = useState<ActivityType | 'All'>('All')
  const [owner, setOwner] = useState('All')
  const [completed, setCompleted] = useState<CompletedFilter>('All')
  const [formOpen, setFormOpen] = useState(false)

  const activitiesQuery = useActivities()
  const createActivity = useCreateActivity()
  const { data: users = [] } = useUsers()

  const owners = users.map((u) => u.name)

  const filtered = useMemo(() => {
    const all = activitiesQuery.data ?? []
    return all.filter((activity) => {
      const matchesType = type === 'All' || activity.type === type
      const matchesOwner = owner === 'All' || activity.owner === owner
      const matchesCompleted =
        completed === 'All' ||
        (completed === 'Completed' && activity.completed) ||
        (completed === 'Pending' && !activity.completed)
      return matchesType && matchesOwner && matchesCompleted
    })
  }, [activitiesQuery.data, type, owner, completed])

  const hasActiveFilters =
    type !== 'All' || owner !== 'All' || completed !== 'All'

  async function handleSubmit(values: ActivityFormValues) {
    try {
      await createActivity.mutateAsync({
        type: values.type,
        title: values.title,
        description: values.description,
        owner: values.owner,
        completed: values.completed,
        dueDate: values.type === 'task' ? values.dueDate : undefined,
        priority: values.type === 'task' ? values.priority : undefined,
      })
      notify('Activity logged')
      setFormOpen(false)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not log activity',
        'error',
      )
    }
  }

  if (activitiesQuery.isError) {
    return (
      <ErrorState
        title="Could not load activities"
        message={
          activitiesQuery.error instanceof Error
            ? activitiesQuery.error.message
            : 'Unknown error'
        }
        onRetry={() => void activitiesQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Activities</h2>
          <p className="mt-1 text-sm text-slate-500">
            Log and track every interaction with customers, leads, and deals.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Log Activity
        </button>
      </div>

      <ActivityFilters
        type={type}
        owner={owner}
        completed={completed}
        owners={owners}
        onTypeChange={setType}
        onOwnerChange={setOwner}
        onCompletedChange={setCompleted}
      />

      {!activitiesQuery.isLoading && (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          {filtered.length} activit{filtered.length !== 1 ? 'ies' : 'y'}
          {activitiesQuery.isFetching && (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" aria-label="Refreshing" />
          )}
        </p>
      )}

      {activitiesQuery.isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border border-border bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No matching activities' : 'No activities yet'}
          description={
            hasActiveFilters
              ? 'Try clearing your filters to see more results.'
              : 'Activities will appear here as you log calls, emails, and meetings.'
          }
          actionLabel={hasActiveFilters ? undefined : 'Log Activity'}
          onAction={hasActiveFilters ? undefined : () => setFormOpen(true)}
        />
      ) : (
        <ActivityList activities={filtered} groupByDate showActions />
      )}

      <ActivityFormModal
        open={formOpen}
        busy={createActivity.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
