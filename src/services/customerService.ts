import { api } from '@/lib/api'
import type {
  Customer,
  CustomerInput,
  CustomerListParams,
  CustomerListResult,
} from '@/types/customer'

interface ApiCustomer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  jobTitle?: string
  status: 'Active' | 'Inactive'
  ownerId?: string
  ownerName?: string
  ownerInitials?: string
  tagIds?: string[]
  createdAt?: string
}

function toInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function fromApi(d: ApiCustomer): Customer {
  return {
    id: d.id,
    firstName: d.firstName ?? '',
    lastName: d.lastName ?? '',
    email: d.email ?? '',
    phone: d.phone ?? '',
    company: d.company ?? '',
    jobTitle: d.jobTitle ?? '',
    status: d.status ?? 'Active',
    owner: d.ownerName ?? '',
    ownerId: d.ownerId,
    createdAt: d.createdAt ?? new Date().toISOString(),
    tags: d.tagIds ?? [],
  }
}

function toApi(input: CustomerInput): Record<string, unknown> {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    company: input.company,
    jobTitle: input.jobTitle,
    status: input.status,
    tagIds: input.tags ?? [],
    ownerId: input.ownerId ?? input.owner,
    ownerName: input.owner,
    ownerInitials: toInitials(input.owner),
  }
}

interface ApiListResult {
  data: ApiCustomer[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const customerService = {
  async getCustomers(params: CustomerListParams = {}): Promise<CustomerListResult> {
    const qs = new URLSearchParams()
    if (params.search)   qs.set('search', params.search)
    if (params.status && params.status !== 'All') qs.set('status', params.status)
    if (params.page)     qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))

    const res = await api.get<ApiListResult>(`/customers?${qs}`)
    return { ...res, data: res.data.map(fromApi) }
  },

  async getCustomer(id: string): Promise<Customer> {
    const d = await api.get<ApiCustomer>(`/customers/${id}`)
    return fromApi(d)
  },

  async createCustomer(input: CustomerInput): Promise<Customer> {
    const d = await api.post<ApiCustomer>('/customers', toApi(input))
    return fromApi(d)
  },

  async updateCustomer(id: string, input: Partial<CustomerInput>): Promise<Customer> {
    const payload: Record<string, unknown> = {}
    if (input.firstName !== undefined) payload.firstName = input.firstName
    if (input.lastName !== undefined)  payload.lastName  = input.lastName
    if (input.email !== undefined)     payload.email     = input.email
    if (input.phone !== undefined)     payload.phone     = input.phone
    if (input.company !== undefined)   payload.company   = input.company
    if (input.jobTitle !== undefined)  payload.jobTitle  = input.jobTitle
    if (input.status !== undefined)    payload.status    = input.status
    if (input.tags !== undefined)      payload.tagIds    = input.tags
    if (input.owner !== undefined) {
      payload.ownerName     = input.owner
      payload.ownerInitials = toInitials(input.owner)
      payload.ownerId       = input.ownerId ?? input.owner
    }
    const d = await api.patch<ApiCustomer>(`/customers/${id}`, payload)
    return fromApi(d)
  },

  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/customers/${id}`)
  },

  async getAll(): Promise<Customer[]> {
    const res = await customerService.getCustomers({ pageSize: 200 })
    return res.data
  },

  async findByEmail(email: string): Promise<Customer | null> {
    const res = await customerService.getCustomers({ search: email, pageSize: 10 })
    return res.data.find((c) => c.email.toLowerCase() === email.toLowerCase()) ?? null
  },

  async getOwners(): Promise<string[]> {
    const res = await api.get<{ data: { name?: string }[] }>('/users?pageSize=100')
    return res.data.map((u) => u.name ?? '').filter(Boolean)
  },

  async bulkDeleteCustomers(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => api.delete(`/customers/${id}`)))
  },
}
