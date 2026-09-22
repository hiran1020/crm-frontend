import { api } from '@/lib/api'
import type { SavedView, SavedViewEntity } from '@/types/savedView'

interface ApiSavedView {
  id: string
  name?: string
  entityType?: string
  filters?: Record<string, string>
  createdBy?: string
  createdAt?: string
  isDefault?: boolean
}

function fromApi(d: ApiSavedView): SavedView {
  return {
    id: d.id,
    name: d.name ?? '',
    entityType: (d.entityType as SavedView['entityType']) ?? 'customer',
    filters: d.filters ?? {},
    createdBy: d.createdBy ?? '',
    createdAt: d.createdAt ?? new Date().toISOString(),
    isDefault: d.isDefault ?? false,
  }
}

export const savedViewService = {
  async getAll(): Promise<SavedView[]> {
    const res = await api.get<{ data: ApiSavedView[] }>('/saved-views?pageSize=200')
    return res.data.map(fromApi)
  },

  async getByEntity(entityType: SavedViewEntity): Promise<SavedView[]> {
    const res = await api.get<{ data: ApiSavedView[] }>(
      `/saved-views?entityType=${entityType}&pageSize=200`,
    )
    return res.data.map(fromApi)
  },

  async create(input: Omit<SavedView, 'id' | 'createdAt'>): Promise<SavedView> {
    const d = await api.post<ApiSavedView>('/saved-views', input)
    return fromApi(d)
  },

  async update(id: string, input: Partial<SavedView>): Promise<SavedView> {
    const d = await api.patch<ApiSavedView>(`/saved-views/${id}`, input)
    return fromApi(d)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/saved-views/${id}`)
  },

  async setDefault(id: string, entityType: SavedViewEntity): Promise<void> {
    await api.patch(`/saved-views/${id}`, { isDefault: true, entityType })
  },
}
