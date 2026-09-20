import { customerSeed } from '@/mock/customers'
import type {
  Customer,
  CustomerInput,
  CustomerListParams,
  CustomerListResult,
  CustomerSortField,
} from '@/types/customer'

/**
 * In-memory store that simulates a database.
 * Services call this; pages never import it.
 */

const STORAGE_KEY = 'crm_customers_v1'

function loadDb(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Customer[]) : structuredClone(customerSeed)
  } catch {
    return structuredClone(customerSeed)
  }
}

function saveDb(data: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

function parseId(id: string, prefix: string): number {
  return parseInt(id.replace(prefix, ''), 10) || 0
}

let customersDb: Customer[] = loadDb()
let nextId = Math.max(0, ...customersDb.map((c) => parseId(c.id, 'CUS-'))) + 1

function fullName(customer: Customer): string {
  return `${customer.firstName} ${customer.lastName}`.toLowerCase()
}

function compareCustomers(
  a: Customer,
  b: Customer,
  sortBy: CustomerSortField,
  sortDir: 'asc' | 'desc',
): number {
  let result = 0

  switch (sortBy) {
    case 'name':
      result = fullName(a).localeCompare(fullName(b))
      break
    case 'company':
      result = a.company.localeCompare(b.company)
      break
    case 'email':
      result = a.email.localeCompare(b.email)
      break
    case 'status':
      result = a.status.localeCompare(b.status)
      break
    case 'owner':
      result = a.owner.localeCompare(b.owner)
      break
    case 'createdAt':
      result = a.createdAt.localeCompare(b.createdAt)
      break
    default:
      result = 0
  }

  return sortDir === 'asc' ? result : -result
}

export const customerStore = {
  list(params: CustomerListParams = {}): CustomerListResult {
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

    let filtered = customersDb.filter((customer) => {
      const matchesSearch =
        !query ||
        fullName(customer).includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.company.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query)

      const matchesStatus = status === 'All' || customer.status === status
      const matchesOwner = owner === 'All' || customer.owner === owner

      return matchesSearch && matchesStatus && matchesOwner
    })

    filtered = [...filtered].sort((a, b) =>
      compareCustomers(a, b, sortBy, sortDir),
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

  getById(id: string): Customer | undefined {
    return customersDb.find((customer) => customer.id === id)
  },

  findByEmail(email: string): Customer | undefined {
    return customersDb.find(
      (customer) => customer.email.toLowerCase() === email.toLowerCase(),
    )
  },

  create(input: CustomerInput): Customer {
    const customer: Customer = {
      ...input,
      id: `CUS-${String(nextId).padStart(3, '0')}`,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    nextId += 1
    customersDb = [customer, ...customersDb]
    saveDb(customersDb)
    return customer
  },

  update(id: string, input: CustomerInput): Customer {
    const index = customersDb.findIndex((customer) => customer.id === id)
    if (index === -1) {
      throw new Error(`Customer ${id} not found`)
    }

    const updated: Customer = {
      ...customersDb[index],
      ...input,
      id,
    }
    customersDb = [
      ...customersDb.slice(0, index),
      updated,
      ...customersDb.slice(index + 1),
    ]
    saveDb(customersDb)
    return updated
  },

  remove(id: string): void {
    const exists = customersDb.some((customer) => customer.id === id)
    if (!exists) {
      throw new Error(`Customer ${id} not found`)
    }
    customersDb = customersDb.filter((customer) => customer.id !== id)
    saveDb(customersDb)
  },

  bulkRemove(ids: string[]): void {
    const idSet = new Set(ids)
    customersDb = customersDb.filter((customer) => !idSet.has(customer.id))
    saveDb(customersDb)
  },

  getOwners(): string[] {
    return [...new Set(customersDb.map((customer) => customer.owner))].sort()
  },
}
