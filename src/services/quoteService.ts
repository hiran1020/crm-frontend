import { delay } from '@/lib/delay'
import { quoteStore } from '@/mock/quoteStore'
import type { Quote, QuoteInput } from '@/types/quote'

export const quoteService = {
  async getAll(): Promise<Quote[]> {
    await delay(400)
    return quoteStore.getAll()
  },

  async getById(id: string): Promise<Quote> {
    await delay(300)
    const quote = quoteStore.getById(id)
    if (!quote) throw new Error('Quote not found')
    return quote
  },

  async getByDeal(dealId: string): Promise<Quote[]> {
    await delay(300)
    return quoteStore.getByDeal(dealId)
  },

  async getByCustomer(customerId: string): Promise<Quote[]> {
    await delay(300)
    return quoteStore.getByCustomer(customerId)
  },

  async create(input: QuoteInput): Promise<Quote> {
    await delay(500)
    return quoteStore.create(input)
  },

  async update(id: string, input: Partial<QuoteInput>): Promise<Quote> {
    await delay(500)
    return quoteStore.update(id, input)
  },

  async remove(id: string): Promise<void> {
    await delay(400)
    quoteStore.remove(id)
  },
}
