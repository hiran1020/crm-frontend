import type { SavedView, SavedViewEntity } from '@/types/savedView'

const STORAGE_KEY = 'crm_saved_views_v1'

const seed: SavedView[] = [
  {
    id: 'sv-001',
    name: 'Active Enterprise Customers',
    entityType: 'customer',
    filters: { status: 'Active', search: 'Enterprise' },
    createdBy: 'Sarah Wilson',
    createdAt: '2026-01-10',
    isDefault: false,
  },
  {
    id: 'sv-002',
    name: 'My Open Deals',
    entityType: 'deal',
    filters: { stage: 'New', owner: 'Sarah Wilson' },
    createdBy: 'Sarah Wilson',
    createdAt: '2026-02-01',
    isDefault: false,
  },
  {
    id: 'sv-003',
    name: 'Hot Leads',
    entityType: 'lead',
    filters: { status: 'Qualified' },
    createdBy: 'David Chen',
    createdAt: '2026-03-05',
    isDefault: false,
  },
]

function loadDb(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedView[]) : structuredClone(seed)
  } catch {
    return structuredClone(seed)
  }
}

function saveDb(data: SavedView[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

let viewsDb: SavedView[] = loadDb()
let nextId = Math.max(0, ...viewsDb.map((v) => parseInt(v.id.replace('sv-', ''), 10) || 0)) + 1

export const savedViewStore = {
  getAll(): SavedView[] {
    return viewsDb
  },

  getByEntity(entityType: SavedViewEntity): SavedView[] {
    return viewsDb.filter((v) => v.entityType === entityType)
  },

  create(input: Omit<SavedView, 'id' | 'createdAt'>): SavedView {
    const view: SavedView = {
      ...input,
      id: `sv-${String(nextId).padStart(3, '0')}`,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    nextId += 1
    viewsDb = [view, ...viewsDb]
    saveDb(viewsDb)
    return view
  },

  update(id: string, input: Partial<SavedView>): SavedView {
    const index = viewsDb.findIndex((v) => v.id === id)
    if (index === -1) throw new Error(`SavedView ${id} not found`)
    const updated: SavedView = { ...viewsDb[index], ...input, id }
    viewsDb = [
      ...viewsDb.slice(0, index),
      updated,
      ...viewsDb.slice(index + 1),
    ]
    saveDb(viewsDb)
    return updated
  },

  remove(id: string): void {
    const exists = viewsDb.some((v) => v.id === id)
    if (!exists) throw new Error(`SavedView ${id} not found`)
    viewsDb = viewsDb.filter((v) => v.id !== id)
    saveDb(viewsDb)
  },

  setDefault(id: string, entityType: SavedViewEntity): void {
    viewsDb = viewsDb.map((v) => {
      if (v.entityType !== entityType) return v
      return { ...v, isDefault: v.id === id }
    })
    saveDb(viewsDb)
  },
}
