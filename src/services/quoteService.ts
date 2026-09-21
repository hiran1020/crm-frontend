import { api } from '@/lib/api'
import type { Quote, QuoteInput } from '@/types/quote'

interface ApiQuote {
  id: string
  dealId?: string
  dealTitle?: string
  customerId?: string
  customerName?: string
  status?: string
  validUntil?: string
  notes?: string
  terms?: string
  subtotal?: number
  tax?: number
  total?: number
  lineItems?: Array<{
    id?: string
    description: string
    quantity: number
    unitPrice: number
    total: number
    discount?: number
  }>
  createdAt?: string
  updatedAt?: string
}

function fromApi(d: ApiQuote): Quote {
  const lineItems = (d.lineItems ?? []).map((li, i) => ({
    id: li.id ?? String(i),
    description: li.description,
    quantity: li.quantity,
    unitPrice: li.unitPrice,
    discount: li.discount,
    total: li.total,
  }))
  return {
    id: d.id,
    quoteNumber: `Q-${d.id.slice(0, 6).toUpperCase()}`,
    title: d.dealTitle ?? d.customerName ?? 'Quote',
    dealId: d.dealId,
    customerId: d.customerId,
    customerName: d.customerName,
    status: (d.status as Quote['status']) ?? 'Draft',
    validUntil: d.validUntil ?? '',
    lineItems,
    subtotal: d.subtotal ?? 0,
    discountAmount: 0,
    tax: d.tax ?? 0,
    total: d.total ?? 0,
    notes: d.notes,
    terms: d.terms,
    createdBy: '',
    createdAt: d.createdAt ?? new Date().toISOString(),
    updatedAt: d.updatedAt ?? new Date().toISOString(),
  }
}

function toApi(input: Partial<QuoteInput>): Record<string, unknown> {
  return {
    dealId: input.dealId,
    customerId: input.customerId,
    customerName: input.customerName,
    status: input.status,
    validUntil: input.validUntil,
    notes: input.notes,
    tax: input.tax ?? 0,
    lineItems: (input.lineItems ?? []).map((li) => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      total: li.total,
    })),
  }
}

export const quoteService = {
  async getAll(): Promise<Quote[]> {
    const res = await api.get<{ data: ApiQuote[] }>('/quotes?pageSize=200')
    return res.data.map(fromApi)
  },

  async getById(id: string): Promise<Quote> {
    const d = await api.get<ApiQuote>(`/quotes/${id}`)
    return fromApi(d)
  },

  async getByDeal(dealId: string): Promise<Quote[]> {
    const res = await api.get<{ data: ApiQuote[] }>(`/quotes?dealId=${dealId}&pageSize=100`)
    return res.data.map(fromApi)
  },

  async getByCustomer(customerId: string): Promise<Quote[]> {
    const res = await api.get<{ data: ApiQuote[] }>(`/quotes?customerId=${customerId}&pageSize=100`)
    return res.data.map(fromApi)
  },

  async create(input: QuoteInput): Promise<Quote> {
    const d = await api.post<ApiQuote>('/quotes', toApi(input))
    return fromApi(d)
  },

  async update(id: string, input: Partial<QuoteInput>): Promise<Quote> {
    const d = await api.patch<ApiQuote>(`/quotes/${id}`, toApi(input))
    return fromApi(d)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/quotes/${id}`)
  },
}
