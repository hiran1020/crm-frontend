import {
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckSquare,
  Briefcase,
  User,
} from 'lucide-react'
import { useCustomerActivities, useLeadActivities } from '@/hooks/useActivities'
import { useCustomerDeals } from '@/hooks/useDeals'
import { useCustomer } from '@/hooks/useCustomers'
import { useLead } from '@/hooks/useLeads'
import { formatDate } from '@/lib/format'
import type { ActivityType } from '@/types/activity'

type TimelineEventType =
  | ActivityType
  | 'deal_created'
  | 'deal_won'
  | 'deal_lost'
  | 'record_created'

interface TimelineEvent {
  id: string
  date: string
  type: TimelineEventType
  title: string
  subtitle?: string
}

const TYPE_ICON: Record<TimelineEventType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  task: CheckSquare,
  deal_created: Briefcase,
  deal_won: Briefcase,
  deal_lost: Briefcase,
  record_created: User,
}

const TYPE_COLOR: Record<TimelineEventType, string> = {
  call: 'bg-blue-100 text-blue-600',
  email: 'bg-purple-100 text-purple-600',
  meeting: 'bg-emerald-100 text-emerald-600',
  note: 'bg-slate-100 text-slate-600',
  task: 'bg-amber-100 text-amber-600',
  deal_created: 'bg-indigo-100 text-indigo-600',
  deal_won: 'bg-emerald-100 text-emerald-700',
  deal_lost: 'bg-red-100 text-red-600',
  record_created: 'bg-brand-100 text-brand-600',
}

function getDateDivider(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (eventDay.getTime() === today.getTime()) return 'Today'
  if (eventDay.getTime() === yesterday.getTime()) return 'Yesterday'

  const diffDays = Math.floor(
    (today.getTime() - eventDay.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffDays < 7) return 'This week'

  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const Icon = TYPE_ICON[event.type]
  const color = TYPE_COLOR[event.type]

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${color}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </div>
        <div className="mt-1 flex-1 w-px bg-slate-200" />
      </div>
      <div className="pb-4 pt-0.5">
        <p className="text-sm font-medium text-slate-800">{event.title}</p>
        {event.subtitle ? (
          <p className="text-xs text-slate-500">{event.subtitle}</p>
        ) : null}
        <p className="mt-0.5 text-xs text-slate-400">{formatDate(event.date)}</p>
      </div>
    </div>
  )
}

interface CustomerTimelineProps {
  customerId: string
}

export function CustomerTimeline({ customerId }: CustomerTimelineProps) {
  const activitiesQuery = useCustomerActivities(customerId)
  const dealsQuery = useCustomerDeals(customerId)
  const customerQuery = useCustomer(customerId)

  const activities = activitiesQuery.data ?? []
  const deals = dealsQuery.data ?? []
  const customer = customerQuery.data

  const events: TimelineEvent[] = []

  // Add activities
  for (const a of activities) {
    events.push({
      id: `act-${a.id}`,
      date: a.createdAt,
      type: a.type,
      title: a.title,
      subtitle: a.owner,
    })
  }

  // Add deal events
  for (const d of deals) {
    events.push({
      id: `deal-${d.id}`,
      date: d.createdAt,
      type: 'deal_created',
      title: `Deal created: ${d.title}`,
      subtitle: `Owner: ${d.owner}`,
    })
    if (d.stage === 'Won') {
      events.push({
        id: `deal-won-${d.id}`,
        date: d.expectedCloseDate,
        type: 'deal_won',
        title: `Deal won: ${d.title}`,
      })
    } else if (d.stage === 'Lost') {
      events.push({
        id: `deal-lost-${d.id}`,
        date: d.expectedCloseDate,
        type: 'deal_lost',
        title: `Deal lost: ${d.title}`,
      })
    }
  }

  // Add record creation
  if (customer) {
    events.push({
      id: 'created',
      date: customer.createdAt,
      type: 'record_created',
      title: 'Customer record created',
    })
  }

  // Sort newest first
  events.sort((a, b) => b.date.localeCompare(a.date))

  if (activitiesQuery.isLoading || dealsQuery.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-7 w-7 rounded-full bg-slate-100 animate-pulse" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-4 w-48 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">No timeline events yet</p>
    )
  }

  // Group by date divider
  const groups = new Map<string, TimelineEvent[]>()
  for (const event of events) {
    const label = getDateDivider(event.date)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(event)
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([label, items]) => (
        <div key={label}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <div>
            {items.map((event) => (
              <TimelineItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

interface LeadTimelineProps {
  leadId: string
}

export function LeadTimeline({ leadId }: LeadTimelineProps) {
  const activitiesQuery = useLeadActivities(leadId)
  const leadQuery = useLead(leadId)

  const activities = activitiesQuery.data ?? []
  const lead = leadQuery.data

  const events: TimelineEvent[] = []

  for (const a of activities) {
    events.push({
      id: `act-${a.id}`,
      date: a.createdAt,
      type: a.type,
      title: a.title,
      subtitle: a.owner,
    })
  }

  if (lead) {
    events.push({
      id: 'created',
      date: lead.createdAt,
      type: 'record_created',
      title: 'Lead record created',
    })
  }

  events.sort((a, b) => b.date.localeCompare(a.date))

  if (activitiesQuery.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-7 w-7 rounded-full bg-slate-100 animate-pulse" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-4 w-48 rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">No timeline events yet</p>
    )
  }

  const groups = new Map<string, TimelineEvent[]>()
  for (const event of events) {
    const label = getDateDivider(event.date)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(event)
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([label, items]) => (
        <div key={label}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <div>
            {items.map((event) => (
              <TimelineItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
