import { api } from '@/lib/api'
import type { Lead, LeadInput, LeadListParams, LeadListResult, LeadSource } from '@/types/lead'

const SOURCE_TO_API: Record<string, string> = {
  'Website': 'Website',
  'Referral': 'Referral',
  'Trade Show': 'Trade_Show',
  'Cold Call': 'Cold_Call',
  'Email Campaign': 'Email_Campaign',
  'Social Media': 'Social_Media',
  'Partner': 'Partner',
}
const SOURCE_FROM_API: Record<string, LeadSource> = {
  'Website': 'Website',
  'Referral': 'Referral',
  'Trade_Show': 'Trade Show',
  'Cold_Call': 'Cold Call',
  'Email_Campaign': 'Email Campaign',
  'Social_Media': 'Social Media',
  'Partner': 'Partner',
}

interface ApiLead {
  id: string
  name?: string
  company?: string
  email?: string
  phone?: string
  source?: string
  status?: string
  value?: number
  ownerId?: string
  ownerName?: string
  ownerInitials?: string
  notes?: string
  tagIds?: string[]
  createdAt?: string
  convertedCustomerId?: string
}

interface ApiListResult {
  data: ApiLead[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function toInitials(name: string): string {
  return name.trim().split(/\s+/).map((p) => p[0]).filter(Boolean).join('').toUpperCase().slice(0, 2)
}

function fromApi(d: ApiLead): Lead {
  return {
    id: d.id,
    name: d.name ?? '',
    company: d.company ?? '',
    email: d.email ?? '',
    phone: d.phone ?? '',
    source: SOURCE_FROM_API[d.source ?? ''] ?? 'Website',
    status: (d.status as Lead['status']) ?? 'New',
    value: d.value ?? 0,
    owner: d.ownerName ?? '',
    ownerId: d.ownerId,
    notes: d.notes ?? '',
    createdAt: d.createdAt ?? new Date().toISOString(),
    convertedCustomerId: d.convertedCustomerId,
    tags: d.tagIds ?? [],
  }
}

function toApi(input: LeadInput): Record<string, unknown> {
  return {
    name: input.name,
    company: input.company,
    email: input.email,
    phone: input.phone,
    source: SOURCE_TO_API[input.source] ?? input.source,
    status: input.status,
    value: input.value,
    notes: input.notes,
    tagIds: input.tags ?? [],
    ownerId: input.ownerId ?? input.owner,
    ownerName: input.owner,
    ownerInitials: toInitials(input.owner),
  }
}

export const leadService = {
  async getLeads(params: LeadListParams = {}): Promise<LeadListResult> {
    const qs = new URLSearchParams()
    if (params.search)   qs.set('search', params.search)
    if (params.status && params.status !== 'All') qs.set('status', params.status)
    if (params.page)     qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))

    const res = await api.get<ApiListResult>(`/leads?${qs}`)
    return { ...res, data: res.data.map(fromApi) }
  },

  async getLead(id: string): Promise<Lead> {
    const d = await api.get<ApiLead>(`/leads/${id}`)
    return fromApi(d)
  },

  async createLead(input: LeadInput): Promise<Lead> {
    const d = await api.post<ApiLead>('/leads', toApi(input))
    return fromApi(d)
  },

  async updateLead(id: string, input: Partial<LeadInput>): Promise<Lead> {
    const payload: Record<string, unknown> = {}
    if (input.name !== undefined)    payload.name    = input.name
    if (input.company !== undefined) payload.company = input.company
    if (input.email !== undefined)   payload.email   = input.email
    if (input.phone !== undefined)   payload.phone   = input.phone
    if (input.source !== undefined)  payload.source  = SOURCE_TO_API[input.source] ?? input.source
    if (input.status !== undefined)  payload.status  = input.status
    if (input.value !== undefined)   payload.value   = input.value
    if (input.notes !== undefined)   payload.notes   = input.notes
    if (input.tags !== undefined)    payload.tagIds  = input.tags
    if (input.owner !== undefined) {
      payload.ownerName     = input.owner
      payload.ownerInitials = toInitials(input.owner)
      payload.ownerId       = input.ownerId ?? input.owner
    }
    const d = await api.patch<ApiLead>(`/leads/${id}`, payload)
    return fromApi(d)
  },

  async deleteLead(id: string): Promise<void> {
    await api.delete(`/leads/${id}`)
  },

  async findByEmail(email: string): Promise<Lead | null> {
    const res = await leadService.getLeads({ search: email, pageSize: 10 })
    return res.data.find((l) => l.email.toLowerCase() === email.toLowerCase()) ?? null
  },

  async getOwners(): Promise<string[]> {
    const res = await api.get<{ data: { name?: string }[] }>('/users?pageSize=100')
    return res.data.map((u) => u.name ?? '').filter(Boolean)
  },

  async bulkDeleteLeads(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => api.delete(`/leads/${id}`)))
  },

  async convertLead(id: string): Promise<Lead> {
    const d = await api.patch<ApiLead>(`/leads/${id}`, { status: 'Converted' })
    return fromApi(d)
  },
}
