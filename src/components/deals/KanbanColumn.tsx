import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { DealCard } from '@/components/deals/DealCard'
import { useTheme } from '@/context/ThemeContext'
import { formatCurrency } from '@/lib/format'
import type { Customer } from '@/types/customer'
import type { Deal, DealStage } from '@/types/deal'

interface KanbanColumnProps {
  stage: DealStage
  deals: Deal[]
  customers: Customer[]
  onAddDeal: (stage: DealStage) => void
  onEdit: (deal: Deal) => void
  onDelete: (deal: Deal) => void
}

// Top border accent — unchanged between themes
const columnHeaderColors: Record<DealStage, string> = {
  New: 'border-slate-400',
  Qualified: 'border-blue-400',
  Proposal: 'border-yellow-400',
  Negotiation: 'border-orange-400',
  Won: 'border-emerald-500',
  Lost: 'border-red-400',
}

// Badge inside column header — two sets, light and dark
const BADGE_LIGHT: Record<DealStage, string> = {
  New: 'bg-slate-100 text-slate-700',
  Qualified: 'bg-blue-50 text-blue-700',
  Proposal: 'bg-yellow-50 text-yellow-700',
  Negotiation: 'bg-orange-50 text-orange-700',
  Won: 'bg-emerald-50 text-emerald-700',
  Lost: 'bg-red-50 text-red-700',
}
const BADGE_DARK: Record<DealStage, string> = {
  New: 'bg-slate-700 text-slate-200',
  Qualified: 'bg-blue-900 text-blue-300',
  Proposal: 'bg-yellow-900 text-yellow-300',
  Negotiation: 'bg-orange-900 text-orange-300',
  Won: 'bg-emerald-900 text-emerald-300',
  Lost: 'bg-red-900 text-red-300',
}

// Drop-target highlight — light and dark
const OVER_LIGHT: Record<DealStage, string> = {
  New: 'bg-slate-100 ring-2 ring-slate-400',
  Qualified: 'bg-blue-50 ring-2 ring-blue-400',
  Proposal: 'bg-yellow-50 ring-2 ring-yellow-400',
  Negotiation: 'bg-orange-50 ring-2 ring-orange-400',
  Won: 'bg-emerald-50 ring-2 ring-emerald-500',
  Lost: 'bg-red-50 ring-2 ring-red-400',
}
const OVER_DARK: Record<DealStage, string> = {
  New: 'bg-slate-700 ring-2 ring-slate-400',
  Qualified: 'bg-blue-900 ring-2 ring-blue-500',
  Proposal: 'bg-yellow-900 ring-2 ring-yellow-500',
  Negotiation: 'bg-orange-900 ring-2 ring-orange-500',
  Won: 'bg-emerald-900 ring-2 ring-emerald-500',
  Lost: 'bg-red-900 ring-2 ring-red-500',
}

export function KanbanColumn({
  stage,
  deals,
  customers,
  onAddDeal,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const badgeColors = isDark ? BADGE_DARK : BADGE_LIGHT
  const overColors  = isDark ? OVER_DARK  : OVER_LIGHT
  const restingBg   = isDark ? 'bg-slate-800' : 'bg-slate-50'

  const totalValue = deals.reduce((sum, deal) => sum + deal.amount, 0)

  function getCustomerName(customerId: string): string {
    const customer = customers.find((c) => c.id === customerId)
    if (!customer) return 'Unknown'
    return `${customer.firstName} ${customer.lastName}`
  }

  return (
    <div
      className={[
        'flex min-w-[280px] max-w-[300px] flex-col rounded-lg border-t-2 transition-colors',
        columnHeaderColors[stage],
        isOver ? overColors[stage] : restingBg,
      ].join(' ')}
    >
      {/* Column header */}
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{stage}</h3>
            <span
              className={[
                'rounded-full px-2 py-0.5 text-xs font-medium',
                badgeColors[stage],
              ].join(' ')}
            >
              {deals.length}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500">
            {formatCurrency(totalValue)}
          </p>
        </div>
      </div>

      {/* Droppable card list */}
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-3 pt-1 min-h-[80px]"
      >
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            customerName={getCustomerName(deal.customerId)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        <button
          type="button"
          onClick={() => onAddDeal(stage)}
          className="mt-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm transition-all"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add deal
        </button>
      </div>
    </div>
  )
}
