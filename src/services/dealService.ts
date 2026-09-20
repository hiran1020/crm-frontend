import { delay } from '@/lib/delay'
import { dealStore } from '@/mock/dealStore'
import type {
  Deal,
  DealInput,
  DealListParams,
  DealListResult,
  DealStage,
} from '@/types/deal'

/**
 * Deal service — UI and hooks call this, never the mock store directly.
 * Later: replace bodies with fetch('/api/deals...').
 */
export const dealService = {
  async getDeals(params: DealListParams = {}): Promise<DealListResult> {
    await delay(450)
    return dealStore.list(params)
  },

  async getDeal(id: string): Promise<Deal> {
    await delay(350)
    const deal = dealStore.getById(id)
    if (!deal) {
      throw new Error('Deal not found')
    }
    return deal
  },

  async getDealsByCustomer(customerId: string): Promise<Deal[]> {
    await delay(350)
    return dealStore.getDealsByCustomer(customerId)
  },

  async createDeal(input: DealInput): Promise<Deal> {
    await delay(500)
    return dealStore.create(input)
  },

  async updateDeal(id: string, input: DealInput): Promise<Deal> {
    await delay(500)
    return dealStore.update(id, input)
  },

  async deleteDeal(id: string): Promise<void> {
    await delay(400)
    dealStore.remove(id)
  },

  async updateStage(id: string, stage: DealStage): Promise<Deal> {
    await delay(300)
    return dealStore.updateStage(id, stage)
  },

  async updateDealWithReason(
    id: string,
    stage: DealStage,
    reason: string,
  ): Promise<Deal> {
    await delay(300)
    return dealStore.updateStageWithReason(id, stage, reason)
  },
}
