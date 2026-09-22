import type { ActivityType } from '@/types/activity'

type CompletedFilter = 'All' | 'Completed' | 'Pending'

interface ActivityFiltersProps {
  type: ActivityType | 'All'
  owner: string
  completed: CompletedFilter
  owners: string[]
  onTypeChange: (type: ActivityType | 'All') => void
  onOwnerChange: (owner: string) => void
  onCompletedChange: (completed: CompletedFilter) => void
}

export function ActivityFilters({
  type,
  owner,
  completed,
  owners,
  onTypeChange,
  onOwnerChange,
  onCompletedChange,
}: ActivityFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span className="sr-only sm:not-sr-only">Type</span>
        <select
          value={type}
          onChange={(event) =>
            onTypeChange(event.target.value as ActivityType | 'All')
          }
          aria-label="Filter by type"
          className="h-10 min-w-36 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="All">All types</option>
          <option value="call">Phone Call</option>
          <option value="email">Email</option>
          <option value="meeting">Site Visit</option>
          <option value="note">Note</option>
          <option value="task">Task</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span className="sr-only sm:not-sr-only">Owner</span>
        <select
          value={owner}
          onChange={(event) => onOwnerChange(event.target.value)}
          aria-label="Filter by owner"
          className="h-10 min-w-44 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="All">All owners</option>
          {owners.map((ownerName) => (
            <option key={ownerName} value={ownerName}>
              {ownerName}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span className="sr-only sm:not-sr-only">Status</span>
        <select
          value={completed}
          onChange={(event) =>
            onCompletedChange(event.target.value as CompletedFilter)
          }
          aria-label="Filter by completion"
          className="h-10 min-w-36 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="All">All statuses</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
        </select>
      </label>
    </div>
  )
}
