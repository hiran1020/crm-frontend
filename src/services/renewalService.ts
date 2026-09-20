import { delay } from '@/lib/delay'
import { renewalStore } from '@/mock/renewalStore'
import type { Renewal } from '@/types/renewal'

export const renewalService = {
  async getAll(): Promise<Renewal[]> {
    await delay(400)
    return renewalStore.getAll()
  },

  async getByCustomer(customerId: string): Promise<Renewal[]> {
    await delay(300)
    return renewalStore.getByCustomer(customerId)
  },

  async getDueWithin(days: number): Promise<Renewal[]> {
    await delay(300)
    return renewalStore.getDueWithin(days)
  },

  async create(input: Omit<Renewal, 'id' | 'createdAt'>): Promise<Renewal> {
    await delay(500)
    return renewalStore.create(input)
  },

  async update(
    id: string,
    input: Partial<Omit<Renewal, 'id' | 'createdAt'>>,
  ): Promise<Renewal> {
    await delay(500)
    return renewalStore.update(id, input)
  },

  async remove(id: string): Promise<void> {
    await delay(400)
    renewalStore.remove(id)
  },
}
