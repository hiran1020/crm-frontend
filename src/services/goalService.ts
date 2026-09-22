import { api } from '@/lib/api'
import type { SalesGoal } from '@/types/salesGoal'

interface ApiGoal {
  id: string
  name?: string
  metric?: string
  target?: number
  period?: string
  year?: number
  quarter?: number
  month?: number
  owner?: string
  current?: number
  createdAt?: string
}

function fromApi(d: ApiGoal): SalesGoal {
  return {
    id: d.id,
    name: d.name ?? '',
    metric: (d.metric as SalesGoal['metric']) ?? 'revenue',
    target: d.target ?? 0,
    period: (d.period as SalesGoal['period']) ?? 'monthly',
    year: d.year ?? new Date().getFullYear(),
    quarter: d.quarter,
    month: d.month,
    owner: d.owner ?? 'all',
    current: d.current ?? 0,
    createdAt: d.createdAt ?? new Date().toISOString(),
  }
}

export const goalService = {
  async getAll(): Promise<SalesGoal[]> {
    const res = await api.get<{ data: ApiGoal[] }>('/goals?pageSize=200')
    return res.data.map(fromApi)
  },

  async getByOwner(owner: string): Promise<SalesGoal[]> {
    const res = await api.get<{ data: ApiGoal[] }>(`/goals?owner=${encodeURIComponent(owner)}&pageSize=200`)
    return res.data.map(fromApi)
  },

  async create(input: Omit<SalesGoal, 'id' | 'createdAt' | 'current'>): Promise<SalesGoal> {
    const d = await api.post<ApiGoal>('/goals', input)
    return fromApi(d)
  },

  async update(id: string, input: Partial<Omit<SalesGoal, 'id' | 'createdAt'>>): Promise<SalesGoal> {
    const d = await api.patch<ApiGoal>(`/goals/${id}`, input)
    return fromApi(d)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/goals/${id}`)
  },
}
