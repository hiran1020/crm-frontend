import { activitiesSeed } from '@/mock/activities'
import type { Activity, ActivityInput } from '@/types/activity'

/**
 * In-memory store that simulates a database.
 * Services call this; pages never import it.
 */

const STORAGE_KEY = 'crm_activities_v1'

function loadDb(): Activity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Activity[]) : structuredClone(activitiesSeed)
  } catch {
    return structuredClone(activitiesSeed)
  }
}

function saveDb(data: Activity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

function parseId(id: string, prefix: string): number {
  return parseInt(id.replace(prefix, ''), 10) || 0
}

let activitiesDb: Activity[] = loadDb()
let nextId = Math.max(0, ...activitiesDb.map((a) => parseId(a.id, 'ACT-'))) + 1

export const activityStore = {
  getAll(): Activity[] {
    return [...activitiesDb].sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    )
  },

  getByCustomer(customerId: string): Activity[] {
    return activitiesDb
      .filter(
        (activity) =>
          activity.relatedTo === customerId && activity.relatedType === 'customer',
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  getByLead(leadId: string): Activity[] {
    return activitiesDb
      .filter(
        (activity) =>
          activity.relatedTo === leadId && activity.relatedType === 'lead',
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  getByDeal(dealId: string): Activity[] {
    return activitiesDb
      .filter(
        (activity) =>
          activity.relatedTo === dealId && activity.relatedType === 'deal',
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  getByType(type: Activity['type']): Activity[] {
    return activitiesDb
      .filter((activity) => activity.type === type)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  getTasks(): Activity[] {
    return activitiesDb
      .filter((activity) => activity.type === 'task')
      .sort((a, b) => {
        // Sort by dueDate, then by createdAt
        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate)
        }
        if (a.dueDate) return -1
        if (b.dueDate) return 1
        return b.createdAt.localeCompare(a.createdAt)
      })
  },

  create(input: ActivityInput): Activity {
    const activity: Activity = {
      ...input,
      id: `ACT-${String(nextId).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    }
    nextId += 1
    activitiesDb = [activity, ...activitiesDb]
    saveDb(activitiesDb)
    return activity
  },

  update(id: string, input: Partial<ActivityInput>): Activity {
    const index = activitiesDb.findIndex((activity) => activity.id === id)
    if (index === -1) {
      throw new Error(`Activity ${id} not found`)
    }

    const updated: Activity = {
      ...activitiesDb[index],
      ...input,
      id,
    }
    activitiesDb = [
      ...activitiesDb.slice(0, index),
      updated,
      ...activitiesDb.slice(index + 1),
    ]
    saveDb(activitiesDb)
    return updated
  },

  remove(id: string): void {
    const exists = activitiesDb.some((activity) => activity.id === id)
    if (!exists) {
      throw new Error(`Activity ${id} not found`)
    }
    activitiesDb = activitiesDb.filter((activity) => activity.id !== id)
    saveDb(activitiesDb)
  },

  markComplete(id: string): Activity {
    const index = activitiesDb.findIndex((activity) => activity.id === id)
    if (index === -1) {
      throw new Error(`Activity ${id} not found`)
    }
    const updated: Activity = { ...activitiesDb[index], completed: true }
    activitiesDb = [
      ...activitiesDb.slice(0, index),
      updated,
      ...activitiesDb.slice(index + 1),
    ]
    saveDb(activitiesDb)
    return updated
  },
}
