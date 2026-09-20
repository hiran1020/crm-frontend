import { Search } from 'lucide-react'
import type { CustomerStatus } from '@/types/customer'

interface CustomerFiltersProps {
  search: string
  status: CustomerStatus | 'All'
  owner: string
  owners: string[]
  onSearchChange: (value: string) => void
  onStatusChange: (value: CustomerStatus | 'All') => void
  onOwnerChange: (value: string) => void
}

export function CustomerFilters({
  search,
  status,
  owner,
  owners,
  onSearchChange,
  onStatusChange,
  onOwnerChange,
}: CustomerFiltersProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Search — full width on all screen sizes */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search customers…"
          aria-label="Search customers"
          className="h-10 w-full rounded-md border border-border bg-white pr-3 pl-9 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {/* Filters — wrap naturally on mobile */}
      <div className="flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as CustomerStatus | 'All')}
          aria-label="Filter by status"
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:flex-none sm:min-w-36"
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select
          value={owner}
          onChange={(e) => onOwnerChange(e.target.value)}
          aria-label="Filter by owner"
          className="h-10 min-w-0 flex-1 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:flex-none sm:min-w-44"
        >
          <option value="All">All owners</option>
          {owners.map((ownerName) => (
            <option key={ownerName} value={ownerName}>
              {ownerName}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
