import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/customers/StatusBadge'
import { TagBadge } from '@/components/common/TagBadge'
import { useTags } from '@/hooks/useTags'
import type { Customer, CustomerSortField, SortDirection } from '@/types/customer'

interface CustomerTableProps {
  customers: Customer[]
  sortBy: CustomerSortField
  sortDir: SortDirection
  onSort: (field: CustomerSortField) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  isLoading?: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: (ids: string[]) => void
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" aria-hidden />
  return direction === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5 text-brand-600" aria-hidden />
    : <ArrowDown className="h-3.5 w-3.5 text-brand-600" aria-hidden />
}

function SortableHeader({
  label, field, sortBy, sortDir, onSort, className = '',
}: {
  label: string; field: CustomerSortField; sortBy: CustomerSortField
  sortDir: SortDirection; onSort: (f: CustomerSortField) => void; className?: string
}) {
  return (
    <th scope="col" className={['px-4 py-3 text-left', className].join(' ')}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800"
      >
        {label}
        <SortIcon active={sortBy === field} direction={sortDir} />
      </button>
    </th>
  )
}

export function CustomerTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="animate-pulse space-y-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-border px-4 py-4 last:border-b-0">
            <div className="h-4 w-32 rounded bg-slate-100" />
            <div className="h-4 w-40 rounded bg-slate-100" />
            <div className="hidden h-4 w-48 rounded bg-slate-100 md:block" />
            <div className="ml-auto h-4 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Expandable row ── */
function CustomerRow({
  customer,
  allTags,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
}: {
  customer: Customer
  allTags: ReturnType<typeof useTags>
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onEdit: (c: Customer) => void
  onDelete: (c: Customer) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const name = `${customer.firstName} ${customer.lastName}`

  return (
    <>
      <tr
        className={[
          'cursor-pointer transition-colors',
          isSelected ? 'bg-brand-50/60' : expanded ? 'bg-slate-50/60' : 'hover:bg-slate-50/30',
        ].join(' ')}
        onClick={() => setExpanded(v => !v)}
      >
        {/* Checkbox */}
        <td className="w-10 px-4 py-3" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            aria-label={`Select ${name}`}
            checked={isSelected}
            onChange={() => onToggleSelect(customer.id)}
            className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
          />
        </td>

        {/* Name + avatar */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {customer.avatar ? (
              <img src={customer.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" aria-hidden />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700" aria-hidden>
                {customer.firstName[0]}{customer.lastName[0]}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/customers/${customer.id}`}
                  onClick={e => e.stopPropagation()}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {name}
                </Link>
                <span className="text-slate-400">
                  {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 sm:hidden">{customer.company}</p>
              <p className="mt-0.5 text-xs text-slate-400 hidden sm:block">{customer.jobTitle}</p>
              {customer.tags && customer.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {customer.tags.slice(0, 2).map(tagId => {
                    const tag = allTags.find(t => t.id === tagId)
                    return tag ? <TagBadge key={tagId} tag={tag} /> : null
                  })}
                  {customer.tags.length > 2 ? (
                    <span className="text-[10px] text-slate-400">+{customer.tags.length - 2}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </td>

        <td className="hidden px-4 py-3 text-slate-700 sm:table-cell">{customer.company}</td>
        <td className="hidden px-4 py-3 text-slate-700 md:table-cell">{customer.email}</td>
        <td className="px-4 py-3"><StatusBadge status={customer.status} /></td>
        <td className="hidden px-4 py-3 text-slate-700 lg:table-cell">{customer.owner}</td>
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex justify-end gap-1">
            <button type="button" aria-label={`Edit ${name}`} onClick={() => onEdit(customer)}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" aria-label={`Delete ${name}`} onClick={() => onDelete(customer)}
              className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded ? (
        <tr className="bg-slate-50/80">
          <td colSpan={7} className="px-6 py-4 accordion-open">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Contact info */}
              <div className="space-y-2 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contact Details</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <a href={`mailto:${customer.email}`}
                    className="flex items-center gap-2 text-sm text-brand-600 hover:underline"
                    onClick={e => e.stopPropagation()}>
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                    {customer.email}
                  </a>
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`}
                      className="flex items-center gap-2 text-sm text-slate-700 hover:text-brand-600"
                      onClick={e => e.stopPropagation()}>
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                      {customer.phone}
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span><span className="font-medium text-slate-700">Company:</span> {customer.company}</span>
                  <span><span className="font-medium text-slate-700">Title:</span> {customer.jobTitle}</span>
                  <span><span className="font-medium text-slate-700">Owner:</span> {customer.owner}</span>
                  <span><span className="font-medium text-slate-700">Since:</span> {customer.createdAt}</span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex flex-col gap-2">
                <Link
                  to={`/customers/${customer.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  View Profile
                </Link>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(customer) }}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit Customer
                </button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

/* ── Table ── */
export function CustomerTable({
  customers, sortBy, sortDir, onSort, onEdit, onDelete,
  selectedIds, onToggleSelect, onToggleSelectAll,
}: CustomerTableProps) {
  const allTags = useTags()
  const pageIds = customers.map(c => c.id)
  const allSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id))
  const someSelected = pageIds.some(id => selectedIds.has(id)) && !allSelected

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="border-b border-border bg-slate-50">
          <tr>
            <th scope="col" className="w-10 px-4 py-3">
              <input
                type="checkbox"
                aria-label="Select all on this page"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected }}
                onChange={() => onToggleSelectAll(pageIds)}
                className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
              />
            </th>
            <SortableHeader label="Customer" field="name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortableHeader label="Company" field="company" sortBy={sortBy} sortDir={sortDir} onSort={onSort} className="hidden sm:table-cell" />
            <SortableHeader label="Email" field="email" sortBy={sortBy} sortDir={sortDir} onSort={onSort} className="hidden md:table-cell" />
            <SortableHeader label="Status" field="status" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
            <SortableHeader label="Owner" field="owner" sortBy={sortBy} sortDir={sortDir} onSort={onSort} className="hidden lg:table-cell" />
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {customers.map(customer => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              allTags={allTags}
              isSelected={selectedIds.has(customer.id)}
              onToggleSelect={onToggleSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
