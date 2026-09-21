import { api } from '@/lib/api'
import type { Activity, ActivityInput } from '@/types/activity'

interface ApiActivity {
  id: string
  type?: string
  title?: string
  description?: string
  relatedTo?: string
  relatedType?: string
  relatedName?: string
  owner?: string
  createdAt?: string
  completed?: boolean
  dueDate?: string
  priority?: string
}

interface ApiListResult {
  data: ApiActivity[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function fromApi(d: ApiActivity): Activity {
  return {
    id: d.id,
    type: (d.type as Activity['type']) ?? 'note',
    title: d.title ?? '',
    description: d.description,
    relatedTo: d.relatedTo,
    relatedType: d.relatedType as Activity['relatedType'],
    relatedName: d.relatedName,
    owner: d.owner ?? '',
    createdAt: d.createdAt ?? new Date().toISOString(),
    completed: d.completed ?? false,
    dueDate: d.dueDate,
    priority: d.priority as Activity['priority'],
  }
}

async function fetchActivities(params: {
  relatedTo?: string
  relatedType?: string
  type?: string
  completed?: boolean
  page?: number
  pageSize?: number
} = {}): Promise<Activity[]> {
  const qs = new URLSearchParams()
  if (params.relatedTo)             qs.set('relatedTo', params.relatedTo)
  if (params.relatedType)           qs.set('relatedType', params.relatedType)
  if (params.type)                  qs.set('type', params.type)
  if (params.completed !== undefined) qs.set('completed', String(params.completed))
  if (params.page)                  qs.set('page', String(params.page))
  qs.set('pageSize', String(params.pageSize ?? 50))

  const res = await api.get<ApiListResult>(`/activities?${qs}`)
  return res.data.map(fromApi)
}

export const activityService = {
  async getActivities(): Promise<Activity[]> {
    return fetchActivities({ pageSize: 100 })
  },

  async getTasks(): Promise<Activity[]> {
    return fetchActivities({ type: 'task', pageSize: 100 })
  },

  async getActivitiesByCustomer(customerId: string): Promise<Activity[]> {
    return fetchActivities({ relatedTo: customerId, relatedType: 'customer', pageSize: 100 })
  },

  async getActivitiesByLead(leadId: string): Promise<Activity[]> {
    return fetchActivities({ relatedTo: leadId, relatedType: 'lead', pageSize: 100 })
  },

  async getActivitiesByDeal(dealId: string): Promise<Activity[]> {
    return fetchActivities({ relatedTo: dealId, relatedType: 'deal', pageSize: 100 })
  },

  async getActivity(id: string): Promise<Activity> {
    const d = await api.get<ApiActivity>(`/activities/${id}`)
    return fromApi(d)
  },

  async createActivity(input: ActivityInput): Promise<Activity> {
    const d = await api.post<ApiActivity>('/activities', input)
    return fromApi(d)
  },

  async updateActivity(id: string, input: Partial<ActivityInput>): Promise<Activity> {
    const d = await api.patch<ApiActivity>(`/activities/${id}`, input)
    return fromApi(d)
  },

  async markComplete(id: string): Promise<Activity> {
    const d = await api.patch<ApiActivity>(`/activities/${id}`, { completed: true })
    return fromApi(d)
  },

  async deleteActivity(id: string): Promise<void> {
    await api.delete(`/activities/${id}`)
  },
}
