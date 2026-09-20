import type { Activity } from '@/types/activity'
import type { Deal } from '@/types/deal'
import type { Ticket } from '@/types/ticket'

export interface HealthScoreBreakdown {
  total: number
  activityScore: number   // 0-30
  dealScore: number       // 0-30
  supportScore: number    // 0-20
  statusScore: number     // 0-20
  label: 'Healthy' | 'Needs Attention' | 'At Risk'
  color: string           // CSS color class
}

export function computeHealthScore(params: {
  activities: Activity[]
  deals: Deal[]
  tickets: Ticket[]
  status: 'Active' | 'Inactive'
}): HealthScoreBreakdown {
  const { activities, deals, tickets, status } = params

  // Activity recency score
  const sorted = [...activities].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
  const lastActivity = sorted[0]
  let activityScore = 0
  if (lastActivity) {
    const days = Math.floor(
      (Date.now() - new Date(lastActivity.createdAt).getTime()) /
        (1000 * 60 * 60 * 24),
    )
    if (days < 7) activityScore = 30
    else if (days < 30) activityScore = 20
    else if (days < 60) activityScore = 10
  }

  // Deal health score
  let dealScore = 0
  if (deals.some((d) => d.stage === 'Won')) dealScore = 30
  else if (deals.some((d) => !['Won', 'Lost'].includes(d.stage))) dealScore = 20

  // Support score (open critical/high tickets)
  const openCritical = tickets.filter(
    (t) =>
      t.status !== 'Resolved' &&
      t.status !== 'Closed' &&
      (t.priority === 'Critical' || t.priority === 'High'),
  ).length
  let supportScore = 20
  if (openCritical === 1) supportScore = 10
  else if (openCritical >= 2) supportScore = 0

  // Status score
  const statusScore = status === 'Active' ? 20 : 0

  const total = activityScore + dealScore + supportScore + statusScore
  const label =
    total >= 80 ? 'Healthy' : total >= 50 ? 'Needs Attention' : 'At Risk'
  const color =
    total >= 80
      ? 'text-emerald-600'
      : total >= 50
        ? 'text-yellow-600'
        : 'text-red-600'

  return { total, activityScore, dealScore, supportScore, statusScore, label, color }
}
