import { delay } from '@/lib/delay'
import { crmUserStore } from '@/mock/crmUserStore'
import type { CrmUser, CrmUserInput } from '@/types/crmUser'

export const userService = {
  async getUsers(): Promise<CrmUser[]> {
    await delay(400)
    return crmUserStore.getAll()
  },

  async getUser(id: string): Promise<CrmUser> {
    await delay(350)
    const user = crmUserStore.getById(id)
    if (!user) throw new Error(`User ${id} not found`)
    return user
  },

  async createUser(input: CrmUserInput): Promise<CrmUser> {
    await delay(500)
    return crmUserStore.create(input)
  },

  async updateUser(id: string, input: CrmUserInput): Promise<CrmUser> {
    await delay(450)
    return crmUserStore.update(id, input)
  },

  async toggleUserStatus(id: string): Promise<CrmUser> {
    await delay(350)
    return crmUserStore.toggleStatus(id)
  },

  async deleteUser(id: string): Promise<void> {
    await delay(400)
    crmUserStore.remove(id)
  },
}
