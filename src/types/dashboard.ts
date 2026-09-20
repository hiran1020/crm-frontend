export interface DashboardStats {
  totalCustomers: number
  totalLeads: number
  openDeals: number
  totalRevenue: number
}

export interface PipelineStageSummary {
  stage: string
  count: number
  value: number
}

export interface RevenueForecast {
  won: number
  weighted: number
  bestCase: number
}

export interface TeamMemberPerformance {
  name: string
  initials: string
  dealsWon: number
  revenue: number
  leadsConverted: number
  activitiesLogged: number
}

export interface DashboardData {
  stats: DashboardStats
  pipeline: PipelineStageSummary[]
  recentActivities: {
    id: string
    title: string
    owner: string
    createdAt: string
  }[]
  recentDeals: {
    id: string
    title: string
    amount: number
    stage: string
  }[]
  tasksDueSoon: {
    id: string
    title: string
    dueDate: string
    owner: string
  }[]
  forecast: RevenueForecast
  teamPerformance: TeamMemberPerformance[]
}
