import { api } from '@/lib/api'
import type { Deal, DealInput, DealListParams, DealListResult } from '@/types/deal'

interface ApiDeal {
  id: string
  title?: string
  customerId?: string
  customerName?: string
  customerCompany?: string
  amount?: number
  stage?: string
  ownerId?: string
  ownerName?: string
  ownerInitials?: string
  expectedCloseDate?: string
  description?: string
  probability?: number
  createdAt?: string
  closedReason?: string
}

interface ApiListResult {
  data: ApiDeal[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function toInitials(name: string): string {
  return name.trim().split(/\s+/).map((p) => p[0]).filter(Boolean).join('').toUpperCase().slice(0, 2)
}

function fromApi(d: ApiDeal): Deal {
  return {
    id: d.id,
    title: d.title ?? '',
    customerId: d.customerId ?? '',
    customerName: d.customerName,
    customerCompany: d.customerCompany,
    amount: d.amount ?? 0,
    stage: (d.stage as Deal['stage']) ?? 'New',
    owner: d.ownerName ?? '',
    ownerId: d.ownerId,
    expectedCloseDate: d.expectedCloseDate ?? '',
    description: d.description,
    probability: d.probability,
    createdAt: d.createdAt ?? new Date().toISOString(),
    closedReason: d.closedReason,
  }
}

function toApi(input: Partial<DealInput>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (input.title !== undefined)             payload.title             = input.title
  if (input.customerId !== undefined)        payload.customerId        = input.customerId
  if (input.customerName !== undefined)      payload.customerName      = input.customerName
  if (input.customerCompany !== undefined)   payload.customerCompany   = input.customerCompany
  if (input.amount !== undefined)            payload.amount            = input.amount
  if (input.stage !== undefined)             payload.stage             = input.stage
  if (input.expectedCloseDate !== undefined) payload.expectedCloseDate = input.expectedCloseDate
  if (input.description !== undefined)       payload.description       = input.description
  if (input.probability !== undefined)       payload.probability       = input.probability
  if (input.owner !== undefined) {
    payload.ownerName     = input.owner
    payload.ownerInitials = toInitials(input.owner)
    payload.ownerId       = input.ownerId ?? input.owner
  }
  return payload
}

export const dealService = {
  async getDeals(params: DealListParams = {}): Promise<DealListResult> {
    const qs = new URLSearchParams()
    if (params.search)   qs.set('search', params.search)
    if (params.stage && params.stage !== 'All') qs.set('stage', params.stage)
    if (params.page)     qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))

    const res = await api.get<ApiListResult>(`/deals?${qs}`)
    return { ...res, data: res.data.map(fromApi) }
  },

  async getDeal(id: string): Promise<Deal> {
    const d = await api.get<ApiDeal>(`/deals/${id}`)
    return fromApi(d)
  },

  async getDealsByCustomer(customerId: string): Promise<Deal[]> {
    const res = await api.get<ApiListResult>(`/deals?customerId=${customerId}&pageSize=100`)
    return res.data.map(fromApi)
  },

  async createDeal(input: DealInput): Promise<Deal> {
    const d = await api.post<ApiDeal>('/deals', toApi(input))
    return fromApi(d)
  },

  async updateDeal(id: string, input: Partial<DealInput>): Promise<Deal> {
    const d = await api.patch<ApiDeal>(`/deals/${id}`, toApi(input))
    return fromApi(d)
  },

  async updateStage(id: string, stage: Deal['stage']): Promise<Deal> {
    const d = await api.patch<ApiDeal>(`/deals/${id}/stage`, { stage })
    return fromApi(d)
  },

  async deleteDeal(id: string): Promise<void> {
    await api.delete(`/deals/${id}`)
  },

  async updateDealWithReason(id: string, stage: Deal['stage'], reason: string): Promise<Deal> {
    const d = await api.patch<ApiDeal>(`/deals/${id}`, { stage, closedReason: reason })
    return fromApi(d)
  },
}
