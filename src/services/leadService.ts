import { delay } from '@/lib/delay'
import { leadStore } from '@/mock/leadStore'
import type {
  Lead,
  LeadInput,
  LeadListParams,
  LeadListResult,
} from '@/types/lead'

/**
 * Lead service — UI and hooks call this, never the mock store directly.
 * Later: replace bodies with fetch('/api/leads...').
 */
export const leadService = {
  async getLeads(params: LeadListParams = {}): Promise<LeadListResult> {
    await delay(450)
    return leadStore.list(params)
  },

  async getLead(id: string): Promise<Lead> {
    await delay(350)
    const lead = leadStore.getById(id)
    if (!lead) {
      throw new Error('Lead not found')
    }
    return lead
  },

  async findByEmail(email: string): Promise<Lead | undefined> {
    await delay(200)
    return leadStore.findByEmail(email)
  },

  async createLead(input: LeadInput): Promise<Lead> {
    await delay(500)
    return leadStore.create(input)
  },

  async updateLead(id: string, input: LeadInput): Promise<Lead> {
    await delay(500)
    return leadStore.update(id, input)
  },

  async deleteLead(id: string): Promise<void> {
    await delay(400)
    leadStore.remove(id)
  },

  async bulkDeleteLeads(ids: string[]): Promise<void> {
    await delay(500)
    leadStore.bulkRemove(ids)
  },

  async convertLead(id: string): Promise<Lead> {
    await delay(500)
    return leadStore.convertLead(id, `CUS-${Date.now()}`)
  },

  async getOwners(): Promise<string[]> {
    await delay(200)
    return leadStore.getOwners()
  },
}
