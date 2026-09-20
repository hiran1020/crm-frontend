import type { TicketStatus } from '@/types/ticket'

const STYLES: Record<TicketStatus, string> = {
  'Open':        'bg-red-50 text-red-700 border border-red-200',
  'In Progress': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Pending':     'bg-yellow-50 text-yellow-700 border border-yellow-200',
  'Resolved':    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Closed':      'bg-slate-100 text-slate-600 border border-slate-200',
}

const DOTS: Record<TicketStatus, string> = {
  'Open':        'bg-red-500',
  'In Progress': 'bg-blue-500',
  'Pending':     'bg-yellow-500',
  'Resolved':    'bg-emerald-500',
  'Closed':      'bg-slate-400',
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={['inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', STYLES[status]].join(' ')}>
      <span className={['h-1.5 w-1.5 rounded-full', DOTS[status]].join(' ')} aria-hidden />
      {status}
    </span>
  )
}
