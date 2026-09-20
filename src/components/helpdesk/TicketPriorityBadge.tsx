import type { TicketPriority } from '@/types/ticket'

const STYLES: Record<TicketPriority, string> = {
  Critical: 'bg-red-100 text-red-800 font-semibold',
  High:     'bg-orange-100 text-orange-800',
  Medium:   'bg-yellow-100 text-yellow-800',
  Low:      'bg-slate-100 text-slate-600',
}

const ICONS: Record<TicketPriority, string> = {
  Critical: '🔴',
  High:     '🟠',
  Medium:   '🟡',
  Low:      '⚪',
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={['inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs', STYLES[priority]].join(' ')}>
      <span aria-hidden>{ICONS[priority]}</span>
      {priority}
    </span>
  )
}
