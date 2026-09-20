import type { DashboardData } from '@/types/dashboard'
import { activitiesSeed } from '@/mock/activities'
import { customerSeed } from '@/mock/customers'
import { dealsSeed } from '@/mock/deals'
import { leadsSeed } from '@/mock/leads'

const TEAM_MEMBERS = [
  { name: 'Sarah Wilson', initials: 'SW' },
  { name: 'David Chen', initials: 'DC' },
  { name: 'Emily Rodriguez', initials: 'ER' },
]

/**
 * Dashboard payload derived from other mock collections.
 * When Rails is connected, this becomes a single /dashboard API response
 * (or several endpoints) — the UI still goes through dashboardService.
 */
export function getDashboardMockData(): DashboardData {
  const openDeals = dealsSeed.filter(
    (deal) => deal.stage !== 'Won' && deal.stage !== 'Lost',
  )
  const totalRevenue = dealsSeed
    .filter((deal) => deal.stage === 'Won' || deal.stage === 'Negotiation')
    .reduce((sum, deal) => sum + deal.amount, 0)

  const stages = ['New', 'Qualified', 'Proposal', 'Negotiation'] as const

  const wonRevenue = dealsSeed
    .filter((d) => d.stage === 'Won')
    .reduce((s, d) => s + d.amount, 0)
  const weightedPipeline = openDeals.reduce(
    (s, d) => s + d.amount * ((d.probability ?? 20) / 100),
    0,
  )
  const bestCase =
    wonRevenue + openDeals.reduce((s, d) => s + d.amount, 0)

  return {
    stats: {
      totalCustomers: customerSeed.length,
      totalLeads: leadsSeed.length,
      openDeals: openDeals.length,
      totalRevenue,
    },
    pipeline: stages.map((stage) => {
      const stageDeals = dealsSeed.filter((deal) => deal.stage === stage)
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + deal.amount, 0),
      }
    }),
    recentActivities: activitiesSeed.slice(0, 5).map((activity) => ({
      id: activity.id,
      title: activity.title,
      owner: activity.owner,
      createdAt: activity.createdAt,
    })),
    recentDeals: dealsSeed.slice(0, 5).map((deal) => ({
      id: deal.id,
      title: deal.title,
      amount: deal.amount,
      stage: deal.stage,
    })),
    tasksDueSoon: activitiesSeed
      .filter(
        (a) => a.type === 'task' && !a.completed && a.dueDate !== undefined,
      )
      .slice(0, 3)
      .map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate ?? '',
        owner: a.owner,
      })),
    forecast: {
      won: wonRevenue,
      weighted: weightedPipeline,
      bestCase,
    },
    teamPerformance: TEAM_MEMBERS.map(({ name, initials }) => {
      const memberWonDeals = dealsSeed.filter(
        (d) => d.owner === name && d.stage === 'Won',
      )
      const memberLeadsConverted = leadsSeed.filter(
        (l) => l.owner === name && l.status === 'Converted',
      ).length
      const memberActivities = activitiesSeed.filter(
        (a) => a.owner === name,
      ).length
      return {
        name,
        initials,
        dealsWon: memberWonDeals.length,
        revenue: memberWonDeals.reduce((s, d) => s + d.amount, 0),
        leadsConverted: memberLeadsConverted,
        activitiesLogged: memberActivities,
      }
    }),
  }
}
