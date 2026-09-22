import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useDeals } from '@/hooks/useDeals'
import { useLeads } from '@/hooks/useLeads'
import { useActivities, useTasks } from '@/hooks/useActivities'
import { useCustomers } from '@/hooks/useCustomers'
import { useTickets } from '@/hooks/useTickets'

interface SmartListDefinition {
  id: string
  name: string
  description: string
  emoji: string
  targetPath: string
  targetFilters?: Record<string, string>
}

const SMART_LIST_DEFS: SmartListDefinition[] = [
  {
    id: 'overdue-tasks',
    name: 'Overdue Tasks',
    description: 'Tasks that are past their due date and not completed.',
    emoji: '⚠️',
    targetPath: '/tasks',
  },
  {
    id: 'stale-deals',
    name: 'Stalled Fuel Contracts',
    description: 'Fuel contracts with no activity in 14+ days.',
    emoji: '🕰️',
    targetPath: '/deals',
  },
  {
    id: 'hot-leads',
    name: 'Hot Fuel Prospects',
    description: 'Qualified fuel prospects ready for a proposal.',
    emoji: '🔥',
    targetPath: '/leads',
    targetFilters: { status: 'Qualified' },
  },
  {
    id: 'closing-this-week',
    name: 'Contracts Closing This Week',
    description: 'Fuel contracts with an expected close date in the next 7 days.',
    emoji: '📅',
    targetPath: '/deals',
  },
  {
    id: 'new-this-week',
    name: 'New Fuel Leads This Week',
    description: 'Fuel accounts and leads added in the last 7 days.',
    emoji: '🆕',
    targetPath: '/customers',
  },
  {
    id: 'critical-tickets',
    name: 'Critical Support Tickets',
    description: 'Open support tickets with Critical priority.',
    emoji: '🚨',
    targetPath: '/helpdesk',
  },
  {
    id: 'inactive-customers',
    name: 'Dormant Fuel Accounts',
    description: 'Fuel accounts with no logged activity in 90+ days.',
    emoji: '😴',
    targetPath: '/customers',
    targetFilters: { status: 'Inactive' },
  },
  {
    id: 'high-value-pipeline',
    name: 'High-Volume Pipeline',
    description: 'Fuel contracts worth more than $20,000 in active stages.',
    emoji: '💰',
    targetPath: '/deals',
  },
]

export function SmartListsPage() {
  usePageTitle('Smart Lists')
  const navigate = useNavigate()

  const dealsQuery = useDeals({ pageSize: 500 })
  const leadsQuery = useLeads({ pageSize: 500 })
  const activitiesQuery = useActivities()
  const tasksQuery = useTasks()
  const customersQuery = useCustomers({ pageSize: 500 })
  const ticketsQuery = useTickets({ pageSize: 500 })

  const deals = dealsQuery.data?.data ?? []
  const leads = leadsQuery.data?.data ?? []
  const activities = activitiesQuery.data ?? []
  const tasks = tasksQuery.data ?? []
  const customers = customersQuery.data?.data ?? []
  const tickets = ticketsQuery.data?.data ?? []

  const today = new Date().toISOString().slice(0, 10)
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const staleThreshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const inactiveThreshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  function getCount(id: string): number {
    switch (id) {
      case 'overdue-tasks':
        return tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < today).length
      case 'stale-deals':
        return deals.filter(
          (d) =>
            !['Won', 'Lost'].includes(d.stage) &&
            d.createdAt < staleThreshold,
        ).length
      case 'hot-leads':
        return leads.filter((l) => l.status === 'Qualified').length
      case 'closing-this-week':
        return deals.filter(
          (d) =>
            !['Won', 'Lost'].includes(d.stage) &&
            d.expectedCloseDate >= today &&
            d.expectedCloseDate <= in7Days,
        ).length
      case 'new-this-week':
        return (
          customers.filter((c) => c.createdAt >= weekAgo).length +
          leads.filter((l) => l.createdAt >= weekAgo).length
        )
      case 'critical-tickets':
        return tickets.filter(
          (t) =>
            t.priority === 'Critical' &&
            t.status !== 'Resolved' &&
            t.status !== 'Closed',
        ).length
      case 'inactive-customers':
        return customers.filter((c) => {
          const customerActivities = activities.filter(
            (a) => a.relatedTo === c.id && a.relatedType === 'customer',
          )
          if (customerActivities.length === 0) return true
          const last = customerActivities.sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
          )[0]
          return last.createdAt < inactiveThreshold
        }).length
      case 'high-value-pipeline':
        return deals.filter(
          (d) => !['Won', 'Lost'].includes(d.stage) && d.amount > 20000,
        ).length
      default:
        return 0
    }
  }

  const isLoading =
    dealsQuery.isLoading ||
    leadsQuery.isLoading ||
    customersQuery.isLoading ||
    ticketsQuery.isLoading

  const lastRefreshed = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Smart Lists</h2>
        <p className="mt-1 text-sm text-slate-500">
          Auto-maintained views of your fuel accounts, prospects, and contracts. Last refreshed at {lastRefreshed}.
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg border border-border bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SMART_LIST_DEFS.map((def) => {
            const count = getCount(def.id)
            return (
              <div
                key={def.id}
                className="rounded-lg border border-border bg-white p-5 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg leading-none">{def.emoji}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{def.name}</p>
                  </div>
                  <span
                    className={[
                      'rounded-full px-2.5 py-0.5 text-lg font-bold',
                      count > 0 ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500',
                    ].join(' ')}
                  >
                    {count}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex-1">{def.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Updated {lastRefreshed}</span>
                  <button
                    type="button"
                    onClick={() => navigate(def.targetPath)}
                    className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
                  >
                    View All
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
