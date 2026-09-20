export type SavedViewEntity = 'customer' | 'lead' | 'deal'

export interface SavedView {
  id: string
  name: string
  entityType: SavedViewEntity
  filters: Record<string, string>  // serialized filter state
  createdBy: string
  createdAt: string
  isDefault?: boolean
}
