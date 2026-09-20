import { dealStore } from '@/mock/dealStore'
import { leadStore } from '@/mock/leadStore'
import { activityStore } from '@/mock/activityStore'
import type { SalesGoal, GoalMetric } from '@/types/salesGoal'

const STORAGE_KEY = 'crm_sales_goals_v1'

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1
const currentQuarter = Math.ceil(currentMonth / 3)

const seed: SalesGoal[] = [
  {
    id: 'GOAL-001',
    name: 'Annual Revenue Goal',
    metric: 'revenue',
    target: 500000,
    period: 'annual',
    year: currentYear,
    owner: 'all',
    current: 0,
    createdAt: '2026-01-01',
  },
  {
    id: 'GOAL-002',
    name: `Q${currentQuarter} Deals Won`,
    metric: 'deals_won',
    target: 15,
    period: 'quarterly',
    year: currentYear,
    quarter: currentQuarter,
    owner: 'all',
    current: 0,
    createdAt: '2026-01-01',
  },
  {
    id: 'GOAL-003',
    name: 'Monthly Leads Converted',
    metric: 'leads_converted',
    target: 5,
    period: 'monthly',
    year: currentYear,
    month: currentMonth,
    owner: 'Sarah Wilson',
    current: 0,
    createdAt: '2026-01-01',
  },
  {
    id: 'GOAL-004',
    name: 'Monthly Activities',
    metric: 'activities',
    target: 50,
    period: 'monthly',
    year: currentYear,
    month: currentMonth,
    owner: 'David Chen',
    current: 0,
    createdAt: '2026-01-01',
  },
]

function loadDb(): SalesGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SalesGoal[]) : structuredClone(seed)
  } catch {
    return structuredClone(seed)
  }
}

function saveDb(data: SalesGoal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

function computeCurrentValue(goal: SalesGoal): number {
  try {
    const allDeals = dealStore.list({ pageSize: 1000 }).data
    const allLeads = leadStore.list({ pageSize: 1000 }).data
    const allActivities = activityStore.getAll()

    const ownerFilter = goal.owner === 'all' ? undefined : goal.owner

    switch (goal.metric as GoalMetric) {
      case 'revenue': {
        const won = allDeals.filter(
          (d) => d.stage === 'Won' && (!ownerFilter || d.owner === ownerFilter),
        )
        return won.reduce((s, d) => s + d.amount, 0)
      }
      case 'deals_won': {
        return allDeals.filter(
          (d) => d.stage === 'Won' && (!ownerFilter || d.owner === ownerFilter),
        ).length
      }
      case 'leads_converted': {
        return allLeads.filter(
          (l) =>
            l.status === 'Converted' &&
            (!ownerFilter || l.owner === ownerFilter),
        ).length
      }
      case 'activities': {
        return allActivities.filter(
          (a) => !ownerFilter || a.owner === ownerFilter,
        ).length
      }
      default:
        return 0
    }
  } catch {
    return 0
  }
}

let goalsDb: SalesGoal[] = loadDb()
let nextId = Math.max(0, ...goalsDb.map((g) => parseInt(g.id.replace('GOAL-', ''), 10) || 0)) + 1

export const goalStore = {
  getAll(): SalesGoal[] {
    return goalsDb.map((g) => ({ ...g, current: computeCurrentValue(g) }))
  },

  getByOwner(owner: string): SalesGoal[] {
    return goalsDb
      .filter((g) => g.owner === owner || g.owner === 'all')
      .map((g) => ({ ...g, current: computeCurrentValue(g) }))
  },

  create(input: Omit<SalesGoal, 'id' | 'createdAt' | 'current'>): SalesGoal {
    const goal: SalesGoal = {
      ...input,
      id: `GOAL-${String(nextId).padStart(3, '0')}`,
      current: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    nextId += 1
    goalsDb = [goal, ...goalsDb]
    saveDb(goalsDb)
    return { ...goal, current: computeCurrentValue(goal) }
  },

  update(id: string, input: Partial<Omit<SalesGoal, 'id' | 'createdAt'>>): SalesGoal {
    const index = goalsDb.findIndex((g) => g.id === id)
    if (index === -1) throw new Error(`SalesGoal ${id} not found`)
    const updated: SalesGoal = { ...goalsDb[index], ...input, id }
    goalsDb = [
      ...goalsDb.slice(0, index),
      updated,
      ...goalsDb.slice(index + 1),
    ]
    saveDb(goalsDb)
    return { ...updated, current: computeCurrentValue(updated) }
  },

  remove(id: string): void {
    const exists = goalsDb.some((g) => g.id === id)
    if (!exists) throw new Error(`SalesGoal ${id} not found`)
    goalsDb = goalsDb.filter((g) => g.id !== id)
    saveDb(goalsDb)
  },
}
