import type { CustomField } from '@/types/customField'

const STORAGE_KEY = 'crm_custom_fields_v1'

const seedFields: CustomField[] = [
  {
    id: 'CF-001',
    name: 'LinkedIn URL',
    key: 'linkedin_url',
    type: 'url',
    entityType: 'customer',
    required: false,
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'CF-002',
    name: 'Budget Range',
    key: 'budget_range',
    type: 'select',
    entityType: 'lead',
    required: false,
    options: ['<$10k', '$10k-$50k', '$50k-$200k', '$200k+'],
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'CF-003',
    name: 'Contract Signed',
    key: 'contract_signed',
    type: 'checkbox',
    entityType: 'deal',
    required: false,
    createdAt: '2026-08-01T00:00:00Z',
  },
]

let nextId = 4

function loadDb(): CustomField[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CustomField[]) : structuredClone(seedFields)
  } catch {
    return structuredClone(seedFields)
  }
}

function saveDb(data: CustomField[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

let fieldsDb: CustomField[] = loadDb()
nextId = Math.max(3, ...fieldsDb.map((f) => parseInt(f.id.replace('CF-', ''), 10) || 0)) + 1

export const customFieldStore = {
  getAll(): CustomField[] {
    return [...fieldsDb]
  },

  getByEntity(entityType: CustomField['entityType']): CustomField[] {
    return fieldsDb.filter((f) => f.entityType === entityType)
  },

  getById(id: string): CustomField | undefined {
    return fieldsDb.find((f) => f.id === id)
  },

  create(input: Omit<CustomField, 'id' | 'createdAt'>): CustomField {
    const field: CustomField = {
      ...input,
      id: `CF-${String(nextId).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    }
    nextId += 1
    fieldsDb = [field, ...fieldsDb]
    saveDb(fieldsDb)
    return field
  },

  update(id: string, input: Partial<Omit<CustomField, 'id' | 'createdAt'>>): CustomField {
    const index = fieldsDb.findIndex((f) => f.id === id)
    if (index === -1) throw new Error(`Custom field ${id} not found`)
    const updated: CustomField = { ...fieldsDb[index], ...input }
    fieldsDb = [...fieldsDb.slice(0, index), updated, ...fieldsDb.slice(index + 1)]
    saveDb(fieldsDb)
    return updated
  },

  remove(id: string): void {
    fieldsDb = fieldsDb.filter((f) => f.id !== id)
    saveDb(fieldsDb)
  },
}
