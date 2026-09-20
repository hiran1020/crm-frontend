import { leadsSeed } from '@/mock/leads'
import type {
  Lead,
  LeadInput,
  LeadListParams,
  LeadListResult,
} from '@/types/lead'

/**
 * In-memory store that simulates a database.
 * Services call this; pages never import it.
 */

const STORAGE_KEY = 'crm_leads_v1'

function loadDb(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Lead[]) : structuredClone(leadsSeed)
  } catch {
    return structuredClone(leadsSeed)
  }
}

function saveDb(data: Lead[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

function parseId(id: string, prefix: string): number {
  return parseInt(id.replace(prefix, ''), 10) || 0
}

let leadsDb: Lead[] = loadDb()
let nextId = Math.max(0, ...leadsDb.map((l) => parseId(l.id, 'LED-'))) + 1

function compareLeads(
  a: Lead,
  b: Lead,
  sortBy: NonNullable<LeadListParams['sortBy']>,
  sortDir: 'asc' | 'desc',
): number {
  let result = 0

  switch (sortBy) {
    case 'name':
      result = a.name.localeCompare(b.name)
      break
    case 'company':
      result = a.company.localeCompare(b.company)
      break
    case 'value':
      result = a.value - b.value
      break
    case 'status':
      result = a.status.localeCompare(b.status)
      break
    case 'createdAt':
      result = a.createdAt.localeCompare(b.createdAt)
      break
    default:
      result = 0
  }

  return sortDir === 'asc' ? result : -result
}

export const leadStore = {
  list(params: LeadListParams = {}): LeadListResult {
    const {
      search = '',
      status = 'All',
      owner = 'All',
      sortBy = 'name',
      sortDir = 'asc',
      page = 1,
      pageSize = 10,
    } = params

    const query = search.trim().toLowerCase()

    let filtered = leadsDb.filter((lead) => {
      const matchesSearch =
        !query ||
        lead.name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query)

      const matchesStatus = status === 'All' || lead.status === status
      const matchesOwner = owner === 'All' || lead.owner === owner

      return matchesSearch && matchesStatus && matchesOwner
    })

    filtered = [...filtered].sort((a, b) => compareLeads(a, b, sortBy, sortDir))

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

  getById(id: string): Lead | undefined {
    return leadsDb.find((lead) => lead.id === id)
  },

  findByEmail(email: string): Lead | undefined {
    return leadsDb.find(
      (lead) => lead.email.toLowerCase() === email.toLowerCase(),
    )
  },

  create(input: LeadInput): Lead {
    const lead: Lead = {
      ...input,
      id: `LED-${String(nextId).padStart(3, '0')}`,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    nextId += 1
    leadsDb = [lead, ...leadsDb]
    saveDb(leadsDb)
    return lead
  },

  update(id: string, input: LeadInput): Lead {
    const index = leadsDb.findIndex((lead) => lead.id === id)
    if (index === -1) {
      throw new Error(`Lead ${id} not found`)
    }

    const updated: Lead = {
      ...leadsDb[index],
      ...input,
      id,
    }
    leadsDb = [
      ...leadsDb.slice(0, index),
      updated,
      ...leadsDb.slice(index + 1),
    ]
    saveDb(leadsDb)
    return updated
  },

  remove(id: string): void {
    const exists = leadsDb.some((lead) => lead.id === id)
    if (!exists) {
      throw new Error(`Lead ${id} not found`)
    }
    leadsDb = leadsDb.filter((lead) => lead.id !== id)
    saveDb(leadsDb)
  },

  bulkRemove(ids: string[]): void {
    const idSet = new Set(ids)
    leadsDb = leadsDb.filter((lead) => !idSet.has(lead.id))
    saveDb(leadsDb)
  },

  convertLead(id: string, customerId: string): Lead {
    const index = leadsDb.findIndex((lead) => lead.id === id)
    if (index === -1) {
      throw new Error(`Lead ${id} not found`)
    }

    const updated: Lead = {
      ...leadsDb[index],
      status: 'Converted',
      convertedCustomerId: customerId,
    }
    leadsDb = [
      ...leadsDb.slice(0, index),
      updated,
      ...leadsDb.slice(index + 1),
    ]
    saveDb(leadsDb)
    return updated
  },

  getOwners(): string[] {
    return [...new Set(leadsDb.map((lead) => lead.owner))].sort()
  },
}
