import { delay } from '@/lib/delay'
import { customFieldStore } from '@/mock/customFieldStore'
import type { CustomField } from '@/types/customField'

export const customFieldService = {
  async getCustomFields(entityType?: CustomField['entityType']): Promise<CustomField[]> {
    await delay(200)
    return entityType ? customFieldStore.getByEntity(entityType) : customFieldStore.getAll()
  },

  async getCustomField(id: string): Promise<CustomField> {
    await delay(150)
    const field = customFieldStore.getById(id)
    if (!field) throw new Error(`Custom field ${id} not found`)
    return field
  },

  async createCustomField(input: Omit<CustomField, 'id' | 'createdAt'>): Promise<CustomField> {
    await delay(400)
    return customFieldStore.create(input)
  },

  async updateCustomField(id: string, input: Partial<Omit<CustomField, 'id' | 'createdAt'>>): Promise<CustomField> {
    await delay(400)
    return customFieldStore.update(id, input)
  },

  async deleteCustomField(id: string): Promise<void> {
    await delay(300)
    customFieldStore.remove(id)
  },
}
