import { api } from '@/lib/api'
import type { DashboardData } from '@/types/dashboard'

const OPEN_STAGES = ['New', 'Qualified', 'Proposal', 'Negotiation']

interface ApiOverview {
  totalCustomers: number
  activeLeads: number
  openDeals: number
}

interface ApiPipelineStage {
  stage: string
  count: number
  value: number
}

interface ApiWeightedStage {
  stage: string
  count: number
  rawValue: number
  weightedValue: number
}

interface ApiActivity {
  id: string
  title?: string
  owner?: string
  createdAt?: string
  dueDate?: string
}

interface ApiDeal {
  id: string
  title?: string
  amount?: number
  stage?: string
}

interface ApiListResult<T> {
  data: T[]
}

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    const [overview, pipelineRes, forecastRes, revenueRes, activitiesRes, dealsRes, tasksRes] =
      await Promise.all([
        api.get<ApiOverview>('/analytics/overview'),
        api.get<ApiListResult<ApiPipelineStage>>('/analytics/pipeline'),
        api.get<{ data: ApiWeightedStage[]; totalWeighted: number }>('/analytics/forecasting/weighted-pipeline'),
        api.get<ApiListResult<{ month: string; revenue: number }>>('/analytics/revenue'),
        api.get<ApiListResult<ApiActivity>>('/activities?pageSize=5'),
        api.get<ApiListResult<ApiDeal>>('/deals?pageSize=5'),
        api.get<ApiListResult<ApiActivity>>('/activities?type=task&completed=false&pageSize=3'),
      ])

    const pipeline = pipelineRes.data.filter((p) => OPEN_STAGES.includes(p.stage))
    const totalRevenue = pipeline.reduce((s, p) => s + p.value, 0)

    const wonRevenue = revenueRes.data.reduce((s, r) => s + r.revenue, 0)
    const openRawValue = forecastRes.data.reduce((s, r) => s + r.rawValue, 0)

    return {
      stats: {
        totalCustomers: overview.totalCustomers,
        totalLeads: overview.activeLeads,
        openDeals: overview.openDeals,
        totalRevenue,
      },
      pipeline,
      recentActivities: activitiesRes.data.map((a) => ({
        id: a.id,
        title: a.title ?? '',
        owner: a.owner ?? '',
        createdAt: a.createdAt ?? new Date().toISOString(),
      })),
      recentDeals: dealsRes.data.map((d) => ({
        id: d.id,
        title: d.title ?? '',
        amount: d.amount ?? 0,
        stage: d.stage ?? '',
      })),
      tasksDueSoon: tasksRes.data
        .filter((t) => Boolean(t.dueDate))
        .map((t) => ({
          id: t.id,
          title: t.title ?? '',
          dueDate: t.dueDate ?? '',
          owner: t.owner ?? '',
        })),
      forecast: {
        won: wonRevenue,
        weighted: forecastRes.totalWeighted,
        bestCase: wonRevenue + openRawValue,
      },
      teamPerformance: [],
    }
  },
}
