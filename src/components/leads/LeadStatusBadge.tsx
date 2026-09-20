import type { LeadStatus } from '@/types/lead'

const styles: Record<LeadStatus, string> = {
  New: 'bg-blue-50 text-blue-700',
  Contacted: 'bg-yellow-50 text-yellow-700',
  Qualified: 'bg-emerald-50 text-emerald-700',
  Lost: 'bg-red-50 text-red-700',
  Converted: 'bg-purple-50 text-purple-700',
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status],
      ].join(' ')}
    >
      {status}
    </span>
  )
}
