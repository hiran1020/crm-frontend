import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import type { LeadStatus } from '@/types/lead'

interface LeadFiltersProps {
  search: string
  status: LeadStatus | 'All'
  owner: string
  owners: string[]
  onSearchChange: (value: string) => void
  onStatusChange: (value: LeadStatus | 'All') => void
  onOwnerChange: (value: string) => void
  trailing?: ReactNode
}

export function LeadFilters({
  search,
  status,
  owner,
  owners,
  onSearchChange,
  onStatusChange,
  onOwnerChange,
  trailing,
}: LeadFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search leads..."
          aria-label="Search leads"
          className="h-10 w-full rounded-md border border-border bg-white pr-3 pl-9 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <span className="sr-only sm:not-sr-only">Status</span>
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as LeadStatus | 'All')
          }
          aria-label="Filter by status"
          className="h-10 min-w-36 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="All">All statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Lost">Lost</option>
          <option value="Converted">Converted</option>
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

      {trailing && <div className="lg:ml-auto">{trailing}</div>}
    </div>
  )
}
