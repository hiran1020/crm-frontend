import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import { DealCard } from '@/components/deals/DealCard'
import { KanbanColumn } from '@/components/deals/KanbanColumn'
import { WinLossModal } from '@/components/deals/WinLossModal'
import { useToast } from '@/components/common/ToastProvider'
import { useUpdateDealStage, useUpdateDealStageWithReason } from '@/hooks/useDeals'
import type { Customer } from '@/types/customer'
import type { Deal, DealStage } from '@/types/deal'

const STAGES: DealStage[] = [
  'New',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
]

interface KanbanBoardProps {
  deals: Deal[]
  customers: Customer[]
  onAddDeal: (stage: DealStage) => void
  onEdit: (deal: Deal) => void
  onDelete: (deal: Deal) => void
}

interface PendingMove {
  dealId: string
  stage: 'Won' | 'Lost'
}

export function KanbanBoard({
  deals,
  customers,
  onAddDeal,
  onEdit,
  onDelete,
}: KanbanBoardProps) {
  const { notify } = useToast()
  const updateStage = useUpdateDealStage()
  const updateStageWithReason = useUpdateDealStageWithReason()
  const [activeDealId, setActiveDealId] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)

  // Require 8px movement before drag starts — keeps click-to-edit working
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const activeDeal = activeDealId
    ? deals.find((d) => d.id === activeDealId)
    : null

  const activeDealCustomerName = activeDeal
    ? (() => {
        const c = customers.find((cu) => cu.id === activeDeal.customerId)
        return c ? `${c.firstName} ${c.lastName}` : 'Unknown'
      })()
    : ''

  const pendingDeal = pendingMove
    ? deals.find((d) => d.id === pendingMove.dealId)
    : null

  function handleDragStart(event: DragStartEvent) {
    setActiveDealId(String(event.active.id))
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDealId(null)

    const { active, over } = event
    if (!over) return

    const dealId = String(active.id)
    const newStage = String(over.id) as DealStage
    const deal = deals.find((d) => d.id === dealId)

    if (!deal || deal.stage === newStage) return

    if (newStage === 'Won' || newStage === 'Lost') {
      setPendingMove({ dealId, stage: newStage })
      return
    }

    try {
      await updateStage.mutateAsync({ id: dealId, stage: newStage })
      notify(`Moved to ${newStage}`)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not move deal',
        'error',
      )
    }
  }

  async function handleWinLossConfirm(reason: string) {
    if (!pendingMove) return

    try {
      await updateStageWithReason.mutateAsync({
        id: pendingMove.dealId,
        stage: pendingMove.stage,
        reason,
      })
      notify(`Moved to ${pendingMove.stage}`)
      setPendingMove(null)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not move deal',
        'error',
      )
    }
  }

  function handleWinLossClose() {
    setPendingMove(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={(e) => void handleDragEnd(e)}
      >
        <div className="kanban-scroll flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((deal) => deal.stage === stage)
            return (
              <KanbanColumn
                key={stage}
                stage={stage}
                deals={stageDeals}
                customers={customers}
                onAddDeal={onAddDeal}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )
          })}
        </div>

        {/* Floating card that follows the cursor while dragging */}
        <DragOverlay dropAnimation={null}>
          {activeDeal ? (
            <DealCard
              deal={activeDeal}
              customerName={activeDealCustomerName}
              onEdit={onEdit}
              onDelete={onDelete}
              dragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <WinLossModal
        open={Boolean(pendingMove)}
        stage={pendingMove?.stage ?? 'Won'}
        dealTitle={pendingDeal?.title ?? ''}
        busy={updateStageWithReason.isPending}
        onClose={handleWinLossClose}
        onConfirm={(reason) => void handleWinLossConfirm(reason)}
      />
    </>
  )
}
