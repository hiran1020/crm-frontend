import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight, ExternalLink, Mail, Pencil, Phone, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/lib/format'
import { computeLeadScore, scoreLabel } from '@/lib/leadScore'
import type { Lead, LeadStatus } from '@/types/lead'

type LeadSortField = 'name' | 'company' | 'value' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

const STATUS_OPTIONS: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Lost', 'Converted']

const statusSelectStyles: Record<LeadStatus, string> = {
  New: 'text-blue-700 bg-blue-50',
  Contacted: 'text-yellow-700 bg-yellow-50',
  Qualified: 'text-emerald-700 bg-emerald-50',
  Lost: 'text-red-700 bg-red-50',
  Converted: 'text-purple-700 bg-purple-50',
}

interface LeadTableProps {
  leads: Lead[]
  sortBy: LeadSortField
  sortDir: SortDirection
  onSort: (field: LeadSortField) => void
  onEdit: (lead: Lead) => void
  onDelete: (lead: Lead) => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: (ids: string[]) => void
  onStatusChange?: (id: string, status: LeadStatus) => void
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean
  direction: SortDirection
}) {
  if (!active) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" aria-hidden />
  }
  return direction === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-brand-600" aria-hidden />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-brand-600" aria-hidden />
  )
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortDir,
  onSort,
  className = '',
}: {
  label: string
  field: LeadSortField
  sortBy: LeadSortField
  sortDir: SortDirection
  onSort: (field: LeadSortField) => void
  className?: string
}) {
  const active = sortBy === field

  return (
    <th scope="col" className={['px-4 py-3 text-left', className].join(' ')}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase hover:text-slate-800"
      >
        {label}
        <SortIcon active={active} direction={sortDir} />
      </button>
    </th>
  )
}

/* ── Expandable LeadRow ─────────────────────────────────────────────────── */
function LeadRow({
  lead, isSelected, onToggleSelect, onEdit, onDelete, onStatusChange,
}: {
  lead: Lead
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onEdit: (l: Lead) => void
  onDelete: (l: Lead) => void
  onStatusChange?: (id: string, status: LeadStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const score = computeLeadScore(lead)
  const { label: scoreLabel_, color } = scoreLabel(score)

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
            aria-label={`Select ${lead.name}`}
            checked={isSelected}
            onChange={() => onToggleSelect(lead.id)}
            className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
          />
        </td>

        {/* Name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Link to={`/leads/${lead.id}`} onClick={e => e.stopPropagation()}
              className="font-medium text-brand-700 hover:underline">
              {lead.name}
            </Link>
            <span className="text-slate-400">
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 sm:hidden">
            {lead.company} · {formatCurrency(lead.value)}
          </p>
        </td>

        <td className="hidden px-4 py-3 text-slate-700 sm:table-cell">{lead.company}</td>
        <td className="hidden px-4 py-3 text-slate-700 md:table-cell">{lead.email}</td>
        <td className="hidden px-4 py-3 text-slate-700 lg:table-cell">{lead.source}</td>
        <td className="hidden px-4 py-3 font-medium text-slate-700 sm:table-cell">{formatCurrency(lead.value)}</td>

        {/* Status */}
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          {onStatusChange ? (
            <select value={lead.status}
              onChange={e => onStatusChange(lead.id, e.target.value as LeadStatus)}
              aria-label={`Status for ${lead.name}`}
              className={['inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border-0 outline-none cursor-pointer appearance-none', statusSelectStyles[lead.status]].join(' ')}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <span className={['inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', statusSelectStyles[lead.status]].join(' ')}>
              {lead.status}
            </span>
          )}
        </td>

        <td className="hidden px-4 py-3 text-slate-700 lg:table-cell">{lead.owner}</td>
        <td className="hidden px-4 py-3 md:table-cell">
          <span title={`Score: ${score}/100`}
            className={['inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', color].join(' ')}>
            {scoreLabel_}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex justify-end gap-1">
            <button type="button" aria-label={`Edit ${lead.name}`} onClick={() => onEdit(lead)}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" aria-label={`Delete ${lead.name}`} onClick={() => onDelete(lead)}
              className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded ? (
        <tr className="bg-slate-50/80">
          <td colSpan={10} className="px-6 py-4 accordion-open">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2 space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <a href={`mailto:${lead.email}`}
                    className="flex items-center gap-2 text-sm text-brand-600 hover:underline"
                    onClick={e => e.stopPropagation()}>
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {lead.email}
                  </a>
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`}
                      className="flex items-center gap-2 text-sm text-slate-700 hover:text-brand-600"
                      onClick={e => e.stopPropagation()}>
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {lead.phone}
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span><span className="font-medium text-slate-700">Source:</span> {lead.source}</span>
                  <span><span className="font-medium text-slate-700">Owner:</span> {lead.owner}</span>
                  <span><span className="font-medium text-slate-700">Score:</span> {score}/100 ({scoreLabel_})</span>
                </div>
                {lead.notes ? (
                  <div className="rounded-md bg-white border border-border p-3">
                    <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                    <p className="text-sm text-slate-700 line-clamp-2">{lead.notes}</p>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  to={`/leads/${lead.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  onClick={e => e.stopPropagation()}>
                  <ExternalLink className="h-4 w-4" />
                  View Lead
                </Link>
                <button type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(lead) }}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Edit Lead
                </button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

export function LeadTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="animate-pulse space-y-0">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex gap-4 border-b border-border px-4 py-4 last:border-b-0"
          >
            <div className="h-4 w-32 rounded bg-slate-100" />
            <div className="h-4 w-40 rounded bg-slate-100" />
            <div className="hidden h-4 w-24 rounded bg-slate-100 md:block" />
            <div className="ml-auto h-4 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function LeadTable({
  leads,
  sortBy,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onStatusChange,
}: LeadTableProps) {
  const pageIds = leads.map((l) => l.id)
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))
  const someSelected = pageIds.some((id) => selectedIds.has(id)) && !allSelected

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
                ref={(el) => {
                  if (el) el.indeterminate = someSelected
                }}
                onChange={() => onToggleSelectAll(pageIds)}
                className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
              />
            </th>
            <SortableHeader
              label="Lead"
              field="name"
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={onSort}
            />
            <SortableHeader
              label="Company"
              field="company"
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={onSort}
              className="hidden sm:table-cell"
            />
            <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase md:table-cell">
              Email
            </th>
            <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase lg:table-cell">
              Source
            </th>
            <SortableHeader
              label="Value"
              field="value"
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={onSort}
              className="hidden sm:table-cell"
            />
            <SortableHeader
              label="Status"
              field="status"
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={onSort}
            />
            <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase lg:table-cell">
              Owner
            </th>
            <th scope="col" className="hidden px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase md:table-cell">
              Score
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              isSelected={selectedIds.has(lead.id)}
              onToggleSelect={onToggleSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
