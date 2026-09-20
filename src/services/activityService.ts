import { delay } from '@/lib/delay'
import { activityStore } from '@/mock/activityStore'
import type { Activity, ActivityInput } from '@/types/activity'

/**
 * Activity service — UI and hooks call this, never the mock store directly.
 * Later: replace bodies with fetch('/api/activities...').
 */
export const activityService = {
  async getActivities(): Promise<Activity[]> {
    await delay(450)
    return activityStore.getAll()
  },

  async getActivitiesByCustomer(customerId: string): Promise<Activity[]> {
    await delay(350)
    return activityStore.getByCustomer(customerId)
  },

  async getActivitiesByLead(leadId: string): Promise<Activity[]> {
    await delay(350)
    return activityStore.getByLead(leadId)
  },

  async getActivitiesByDeal(dealId: string): Promise<Activity[]> {
    await delay(350)
    return activityStore.getByDeal(dealId)
  },

  async createActivity(input: ActivityInput): Promise<Activity> {
    await delay(500)
    return activityStore.create(input)
  },

  async updateActivity(id: string, input: Partial<ActivityInput>): Promise<Activity> {
    await delay(500)
    return activityStore.update(id, input)
  },

  async deleteActivity(id: string): Promise<void> {
    await delay(400)
    activityStore.remove(id)
  },

  async markComplete(id: string): Promise<Activity> {
    await delay(300)
    return activityStore.markComplete(id)
  },

  async getTasks(): Promise<Activity[]> {
    await delay(400)
    return activityStore.getTasks()
  },
}
