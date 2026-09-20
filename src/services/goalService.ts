import { delay } from '@/lib/delay'
import { goalStore } from '@/mock/goalStore'
import type { SalesGoal } from '@/types/salesGoal'

export const goalService = {
  async getAll(): Promise<SalesGoal[]> {
    await delay(400)
    return goalStore.getAll()
  },

  async getByOwner(owner: string): Promise<SalesGoal[]> {
    await delay(300)
    return goalStore.getByOwner(owner)
  },

  async create(
    input: Omit<SalesGoal, 'id' | 'createdAt' | 'current'>,
  ): Promise<SalesGoal> {
    await delay(500)
    return goalStore.create(input)
  },

  async update(
    id: string,
    input: Partial<Omit<SalesGoal, 'id' | 'createdAt'>>,
  ): Promise<SalesGoal> {
    await delay(500)
    return goalStore.update(id, input)
  },

  async remove(id: string): Promise<void> {
    await delay(400)
    goalStore.remove(id)
  },
}
