import { dealsSeed } from '@/mock/deals'
import type {
  Deal,
  DealInput,
  DealListParams,
  DealListResult,
  DealStage,
} from '@/types/deal'

/**
 * In-memory store that simulates a database.
 * Services call this; pages never import it.
 */

const STORAGE_KEY = 'crm_deals_v1'

function loadDb(): Deal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Deal[]) : structuredClone(dealsSeed)
  } catch {
    return structuredClone(dealsSeed)
  }
}

function saveDb(data: Deal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

function parseId(id: string, prefix: string): number {
  return parseInt(id.replace(prefix, ''), 10) || 0
}

let dealsDb: Deal[] = loadDb()
let nextId = Math.max(0, ...dealsDb.map((d) => parseId(d.id, 'DEAL-'))) + 1

function compareDeals(
  a: Deal,
  b: Deal,
  sortBy: NonNullable<DealListParams['sortBy']>,
  sortDir: 'asc' | 'desc',
): number {
  let result = 0

  switch (sortBy) {
    case 'title':
      result = a.title.localeCompare(b.title)
      break
    case 'amount':
      result = a.amount - b.amount
      break
    case 'stage':
      result = a.stage.localeCompare(b.stage)
      break
    case 'expectedCloseDate':
      result = a.expectedCloseDate.localeCompare(b.expectedCloseDate)
      break
    default:
      result = 0
  }

  return sortDir === 'asc' ? result : -result
}

export const dealStore = {
  list(params: DealListParams = {}): DealListResult {
    const {
      search = '',
      stage = 'All',
      owner = 'All',
      sortBy = 'title',
      sortDir = 'asc',
      page = 1,
      pageSize = 10,
    } = params

    const query = search.trim().toLowerCase()

    let filtered = dealsDb.filter((deal) => {
      const matchesSearch =
        !query ||
        deal.title.toLowerCase().includes(query) ||
        deal.owner.toLowerCase().includes(query)

      const matchesStage = stage === 'All' || deal.stage === stage
      const matchesOwner = owner === 'All' || deal.owner === owner

      return matchesSearch && matchesStage && matchesOwner
    })

    filtered = [...filtered].sort((a, b) =>
      compareDeals(a, b, sortBy, sortDir),
    )

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(Math.max(page, 1), totalPages)
    const start = (safePage - 1) * pageSize
    const data = filtered.slice(start, start + pageSize)

    return {
      data,
      total,
      page: safePage,
      pageSize,
      totalPages,
    }
  },

  getById(id: string): Deal | undefined {
    return dealsDb.find((deal) => deal.id === id)
  },

  getDealsByCustomer(customerId: string): Deal[] {
    return dealsDb.filter((deal) => deal.customerId === customerId)
  },

  create(input: DealInput): Deal {
    const deal: Deal = {
      ...input,
      id: `DEAL-${String(nextId).padStart(3, '0')}`,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    nextId += 1
    dealsDb = [deal, ...dealsDb]
    saveDb(dealsDb)
    return deal
  },

  update(id: string, input: DealInput): Deal {
    const index = dealsDb.findIndex((deal) => deal.id === id)
    if (index === -1) {
      throw new Error(`Deal ${id} not found`)
    }

    const updated: Deal = {
      ...dealsDb[index],
      ...input,
      id,
    }
    dealsDb = [
      ...dealsDb.slice(0, index),
      updated,
      ...dealsDb.slice(index + 1),
    ]
    saveDb(dealsDb)
    return updated
  },

  remove(id: string): void {
    const exists = dealsDb.some((deal) => deal.id === id)
    if (!exists) {
      throw new Error(`Deal ${id} not found`)
    }
    dealsDb = dealsDb.filter((deal) => deal.id !== id)
    saveDb(dealsDb)
  },

  updateStage(id: string, stage: DealStage): Deal {
    const index = dealsDb.findIndex((deal) => deal.id === id)
    if (index === -1) {
      throw new Error(`Deal ${id} not found`)
    }
    const updated: Deal = { ...dealsDb[index], stage }
    dealsDb = [
      ...dealsDb.slice(0, index),
      updated,
      ...dealsDb.slice(index + 1),
    ]
    saveDb(dealsDb)
    return updated
  },

  updateStageWithReason(id: string, stage: DealStage, reason: string): Deal {
    const index = dealsDb.findIndex((deal) => deal.id === id)
    if (index === -1) {
      throw new Error(`Deal ${id} not found`)
    }
    const updated: Deal = {
      ...dealsDb[index],
      stage,
      closedReason: reason || undefined,
    }
    dealsDb = [
      ...dealsDb.slice(0, index),
      updated,
      ...dealsDb.slice(index + 1),
    ]
    saveDb(dealsDb)
    return updated
  },

  getOwners(): string[] {
    return [...new Set(dealsDb.map((deal) => deal.owner))].sort()
  },
}
