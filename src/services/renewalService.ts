import { api } from '@/lib/api'
import type { Renewal } from '@/types/renewal'

interface ApiRenewal {
  id: string
  customerId?: string
  customerName?: string
  contractValue?: number
  renewalDate?: string
  status?: string
  owner?: string
  probability?: number
  notes?: string
  lastContactDate?: string
  createdAt?: string
}

function fromApi(d: ApiRenewal): Renewal {
  return {
    id: d.id,
    customerId: d.customerId ?? '',
    customerName: d.customerName ?? '',
    contractValue: d.contractValue ?? 0,
    renewalDate: d.renewalDate ?? '',
    status: (d.status as Renewal['status']) ?? 'upcoming',
    owner: d.owner ?? '',
    probability: d.probability ?? 0,
    notes: d.notes,
    lastContactDate: d.lastContactDate,
    createdAt: d.createdAt ?? new Date().toISOString(),
  }
}

export const renewalService = {
  async getAll(): Promise<Renewal[]> {
    const res = await api.get<{ data: ApiRenewal[] }>('/renewals?pageSize=200')
    return res.data.map(fromApi)
  },

  async getByCustomer(customerId: string): Promise<Renewal[]> {
    const res = await api.get<{ data: ApiRenewal[] }>(`/renewals?customerId=${customerId}&pageSize=100`)
    return res.data.map(fromApi)
  },

  async getDueWithin(days: number): Promise<Renewal[]> {
    const res = await api.get<{ data: ApiRenewal[] }>(`/renewals?dueDays=${days}&pageSize=200`)
    return res.data.map(fromApi)
  },

  async create(input: Omit<Renewal, 'id' | 'createdAt'>): Promise<Renewal> {
    const d = await api.post<ApiRenewal>('/renewals', input)
    return fromApi(d)
  },

  async update(id: string, input: Partial<Omit<Renewal, 'id' | 'createdAt'>>): Promise<Renewal> {
    const d = await api.patch<ApiRenewal>(`/renewals/${id}`, input)
    return fromApi(d)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/renewals/${id}`)
  },
}
