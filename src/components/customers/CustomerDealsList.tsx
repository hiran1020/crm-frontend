import { useCustomerDeals } from '@/hooks/useDeals'
import { formatCurrency } from '@/lib/format'
import type { DealStage } from '@/types/deal'

interface CustomerDealsListProps {
  customerId: string
}

function StageBadge({ stage }: { stage: DealStage }) {
  const styles: Record<DealStage, string> = {
    New: 'bg-slate-100 text-slate-700',
    Qualified: 'bg-blue-50 text-blue-700',
    Proposal: 'bg-yellow-50 text-yellow-700',
    Negotiation: 'bg-orange-50 text-orange-700',
    Won: 'bg-emerald-50 text-emerald-700',
    Lost: 'bg-red-50 text-red-700',
  }

  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[stage],
      ].join(' ')}
    >
      {stage}
    </span>
  )
}

export function CustomerDealsList({ customerId }: CustomerDealsListProps) {
  const dealsQuery = useCustomerDeals(customerId)

  if (dealsQuery.isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-16 rounded-lg border border-border bg-slate-100"
          />
        ))}
      </div>
    )
  }

  const deals = dealsQuery.data ?? []

  if (deals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-900">No deals yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Deals linked to this customer will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {deals.map((deal) => (
        <div
          key={deal.id}
          className="rounded-lg border border-border bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {deal.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Close: {deal.expectedCloseDate} · {deal.owner}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(deal.amount)}
              </p>
              <StageBadge stage={deal.stage} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
