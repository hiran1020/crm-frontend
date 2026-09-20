import { useCustomerActivities } from '@/hooks/useActivities'
import { useCustomerDeals } from '@/hooks/useDeals'
import { useTickets } from '@/hooks/useTickets'
import { useCustomer } from '@/hooks/useCustomers'
import { computeHealthScore } from '@/lib/healthScore'

interface Props {
  customerId: string
}

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const strokeColor =
    color === 'text-emerald-600'
      ? '#059669'
      : color === 'text-yellow-600'
        ? '#d97706'
        : '#dc2626'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <span
        className={['absolute text-2xl font-bold', color].join(' ')}
      >
        {score}
      </span>
    </div>
  )
}

function FactorBar({
  label,
  score,
  max,
}: {
  label: string
  score: number
  max: number
}) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
        <span>{label}</span>
        <span className="font-medium">
          {score}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function CustomerHealthScoreCard({ customerId }: Props) {
  const customerQuery = useCustomer(customerId)
  const activitiesQuery = useCustomerActivities(customerId)
  const dealsQuery = useCustomerDeals(customerId)
  const ticketsQuery = useTickets({ pageSize: 500 })

  const customer = customerQuery.data
  const activities = activitiesQuery.data ?? []
  const deals = dealsQuery.data ?? []
  const allTickets = ticketsQuery.data?.data ?? []
  const tickets = allTickets.filter((t) => t.customerId === customerId)

  const isLoading =
    customerQuery.isLoading ||
    activitiesQuery.isLoading ||
    dealsQuery.isLoading ||
    ticketsQuery.isLoading

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm animate-pulse">
        <div className="h-4 w-32 rounded bg-slate-100 mb-4" />
        <div className="flex gap-4">
          <div className="h-24 w-24 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 rounded bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const status = customer?.status ?? 'Active'
  const breakdown = computeHealthScore({ activities, deals, tickets, status })

  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">
        Customer Health Score
      </h3>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <ScoreCircle score={breakdown.total} color={breakdown.color} />
          <span className={['text-sm font-semibold', breakdown.color].join(' ')}>
            {breakdown.label}
          </span>
        </div>
        <div className="flex-1 space-y-3">
          <FactorBar label="Activity Recency" score={breakdown.activityScore} max={30} />
          <FactorBar label="Deal Health" score={breakdown.dealScore} max={30} />
          <FactorBar label="Support" score={breakdown.supportScore} max={20} />
          <FactorBar label="Account Status" score={breakdown.statusScore} max={20} />
        </div>
      </div>
    </div>
  )
}
