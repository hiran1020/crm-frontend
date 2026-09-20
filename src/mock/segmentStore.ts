import type { Customer } from '@/types/customer'
import type { Lead } from '@/types/lead'
import type { Segment, SegmentCondition } from '@/types/segment'

const STORAGE_KEY = 'crm_segments_v1'

const seedSegments: Segment[] = [
  {
    id: 'SEG-001',
    name: 'VIP Customers',
    description: 'Active customers tagged as VIP',
    entityType: 'customer',
    logic: 'AND',
    conditions: [
      { id: 'c1', field: 'status', op: 'is', value: 'Active' },
      { id: 'c2', field: 'tag', op: 'is', value: 'VIP' },
    ],
    createdBy: 'Admin User',
    createdAt: '2026-08-01T00:00:00Z',
    color: '#8b5cf6',
  },
  {
    id: 'SEG-002',
    name: 'At Risk',
    description: 'Customers flagged as at risk of churning',
    entityType: 'customer',
    logic: 'OR',
    conditions: [
      { id: 'c1', field: 'tag', op: 'is', value: 'At Risk' },
    ],
    createdBy: 'Sarah Wilson',
    createdAt: '2026-08-05T00:00:00Z',
    color: '#ef4444',
  },
  {
    id: 'SEG-003',
    name: 'Hot Leads',
    description: 'Leads that are qualified and ready for outreach',
    entityType: 'lead',
    logic: 'AND',
    conditions: [
      { id: 'c1', field: 'status', op: 'is', value: 'Qualified' },
    ],
    createdBy: 'Sarah Wilson',
    createdAt: '2026-08-10T00:00:00Z',
    color: '#f97316',
  },
  {
    id: 'SEG-004',
    name: 'Inactive Accounts',
    description: 'Customers who are currently inactive',
    entityType: 'customer',
    logic: 'AND',
    conditions: [
      { id: 'c1', field: 'status', op: 'is', value: 'Inactive' },
    ],
    createdBy: 'Admin User',
    createdAt: '2026-08-15T00:00:00Z',
    color: '#94a3b8',
  },
]

let nextId = 5

function loadDb(): Segment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Segment[]) : structuredClone(seedSegments)
  } catch {
    return structuredClone(seedSegments)
  }
}

function saveDb(data: Segment[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

let segmentsDb: Segment[] = loadDb()
nextId = Math.max(4, ...segmentsDb.map((s) => parseInt(s.id.replace('SEG-', ''), 10) || 0)) + 1

function matchesCondition(
  condition: SegmentCondition,
  record: Customer | Lead,
): boolean {
  const { field, op, value } = condition

  let fieldValue: string
  if (field === 'tag') {
    const tags = (record as Customer).tags ?? []
    switch (op) {
      case 'is': return tags.some(t => t.toLowerCase() === value.toLowerCase())
      case 'is_not': return !tags.some(t => t.toLowerCase() === value.toLowerCase())
      case 'contains': return tags.some(t => t.toLowerCase().includes(value.toLowerCase()))
      case 'not_contains': return !tags.some(t => t.toLowerCase().includes(value.toLowerCase()))
      default: return false
    }
  }

  switch (field) {
    case 'status': fieldValue = (record as Customer).status ?? (record as Lead).status ?? ''; break
    case 'owner': fieldValue = record.owner ?? ''; break
    case 'company': fieldValue = record.company ?? ''; break
    case 'jobTitle': fieldValue = (record as Customer).jobTitle ?? ''; break
    case 'createdAt': fieldValue = record.createdAt ?? ''; break
    default: fieldValue = ''
  }

  switch (op) {
    case 'is': return fieldValue.toLowerCase() === value.toLowerCase()
    case 'is_not': return fieldValue.toLowerCase() !== value.toLowerCase()
    case 'contains': return fieldValue.toLowerCase().includes(value.toLowerCase())
    case 'not_contains': return !fieldValue.toLowerCase().includes(value.toLowerCase())
    case 'before': return fieldValue < value
    case 'after': return fieldValue > value
    default: return false
  }
}

export const segmentStore = {
  getAll(): Segment[] {
    return [...segmentsDb]
  },

  getById(id: string): Segment | undefined {
    return segmentsDb.find((s) => s.id === id)
  },

  create(input: Omit<Segment, 'id' | 'createdAt'>): Segment {
    const segment: Segment = {
      ...input,
      id: `SEG-${String(nextId).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    }
    nextId += 1
    segmentsDb = [segment, ...segmentsDb]
    saveDb(segmentsDb)
    return segment
  },

  update(id: string, input: Partial<Omit<Segment, 'id' | 'createdAt'>>): Segment {
    const index = segmentsDb.findIndex((s) => s.id === id)
    if (index === -1) throw new Error(`Segment ${id} not found`)
    const updated: Segment = { ...segmentsDb[index], ...input }
    segmentsDb = [...segmentsDb.slice(0, index), updated, ...segmentsDb.slice(index + 1)]
    saveDb(segmentsDb)
    return updated
  },

  remove(id: string): void {
    segmentsDb = segmentsDb.filter((s) => s.id !== id)
    saveDb(segmentsDb)
  },

  applySegment(segment: Segment, records: (Customer | Lead)[]): (Customer | Lead)[] {
    return records.filter((record) => {
      if (segment.logic === 'AND') {
        return segment.conditions.every((c) => matchesCondition(c, record))
      } else {
        return segment.conditions.some((c) => matchesCondition(c, record))
      }
    })
  },
}
