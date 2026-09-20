import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/lib/format'
import type { Deal } from '@/types/deal'

interface DealCardProps {
  deal: Deal
  customerName: string
  onEdit: (deal: Deal) => void
  onDelete: (deal: Deal) => void
  /** True when rendered inside DragOverlay — skips the draggable hook */
  dragOverlay?: boolean
}

export function DealCard({
  deal,
  customerName,
  onEdit,
  onDelete,
  dragOverlay = false,
}: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id, disabled: dragOverlay })

  const style = transform
    ? { transform: CSS.Transform.toString(transform) }
    : undefined

  const initials = deal.owner
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Calculate age in days
  const created = new Date(deal.createdAt)
  const now = new Date()
  const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))

  const isClosedStage = deal.stage === 'Won' || deal.stage === 'Lost'
  const ageIsOld = isClosedStage ? days > 30 : days > 60
  const ageClass = ageIsOld ? 'text-red-400' : 'text-slate-400'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'rounded-lg border bg-white p-3 shadow-sm transition-shadow',
        isDragging
          ? 'opacity-30 border-brand-300'
          : 'border-border hover:shadow-md',
        dragOverlay ? 'cursor-grabbing shadow-xl rotate-1' : 'cursor-grab',
      ].join(' ')}
    >
      <div className="flex items-start gap-1">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag ${deal.title}`}
          className="mt-0.5 shrink-0 cursor-grab rounded p-0.5 text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <Link
              to={`/deals/${deal.id}`}
              onClick={(e) => e.stopPropagation()}
              className="min-w-0 text-sm font-medium text-slate-900 leading-snug line-clamp-2 hover:text-brand-700"
            >
              {deal.title}
            </Link>
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                aria-label={`Edit ${deal.title}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(deal)
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${deal.title}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(deal)
                }}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <p className="mt-0.5 text-xs text-slate-500 truncate">{customerName}</p>

          <p className="mt-2 text-sm font-bold text-slate-900">
            {formatCurrency(deal.amount)}
          </p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-xs text-slate-500 truncate">
                Close: {deal.expectedCloseDate}
              </p>
              <span className={`text-xs shrink-0 ${ageClass}`}>{days}d</span>
            </div>
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700"
              title={deal.owner}
            >
              {initials}
            </div>
          </div>

          {deal.probability !== undefined ? (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Probability</span>
                <span>{deal.probability}%</span>
              </div>
              <div className="h-1 w-full rounded-full bg-slate-100">
                <div
                  className="h-1 rounded-full bg-brand-500"
                  style={{ width: `${deal.probability}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
