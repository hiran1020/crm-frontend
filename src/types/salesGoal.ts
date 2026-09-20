export type GoalPeriod = 'monthly' | 'quarterly' | 'annual'
export type GoalMetric = 'revenue' | 'deals_won' | 'leads_converted' | 'activities'

export interface SalesGoal {
  id: string
  name: string
  metric: GoalMetric
  target: number
  period: GoalPeriod
  year: number
  quarter?: number  // 1-4 for quarterly
  month?: number    // 1-12 for monthly
  owner: string     // 'all' or specific owner name
  current: number   // computed from actual data
  createdAt: string
}
