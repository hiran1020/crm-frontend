import { delay } from '@/lib/delay'
import { savedViewStore } from '@/mock/savedViewStore'
import type { SavedView, SavedViewEntity } from '@/types/savedView'

export const savedViewService = {
  async getAll(): Promise<SavedView[]> {
    await delay(200)
    return savedViewStore.getAll()
  },

  async getByEntity(entityType: SavedViewEntity): Promise<SavedView[]> {
    await delay(200)
    return savedViewStore.getByEntity(entityType)
  },

  async create(input: Omit<SavedView, 'id' | 'createdAt'>): Promise<SavedView> {
    await delay(400)
    return savedViewStore.create(input)
  },

  async update(id: string, input: Partial<SavedView>): Promise<SavedView> {
    await delay(400)
    return savedViewStore.update(id, input)
  },

  async remove(id: string): Promise<void> {
    await delay(300)
    savedViewStore.remove(id)
  },

  async setDefault(id: string, entityType: SavedViewEntity): Promise<void> {
    await delay(300)
    savedViewStore.setDefault(id, entityType)
  },
}
