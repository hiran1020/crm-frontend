import { delay } from '@/lib/delay'
import { auditLogStore } from '@/mock/auditLogStore'
import type { AuditEntity, AuditLogEntry } from '@/types/auditLog'

export interface AuditLogParams {
  search?: string
  entity?: AuditEntity | 'all'
  action?: string
  from?: string
  to?: string
}

export const auditService = {
  async getAuditLog(params: AuditLogParams = {}): Promise<AuditLogEntry[]> {
    await delay(300)
    let entries = auditLogStore.getAll()

    if (params.search) {
      const q = params.search.toLowerCase()
      entries = entries.filter(
        (e) =>
          e.actor.toLowerCase().includes(q) ||
          e.entityLabel.toLowerCase().includes(q),
      )
    }

    if (params.entity && params.entity !== 'all') {
      entries = entries.filter((e) => e.entity === params.entity)
    }

    if (params.action && params.action !== 'all') {
      entries = entries.filter((e) => e.action === params.action)
    }

    if (params.from) {
      entries = entries.filter((e) => e.createdAt >= params.from!)
    }

    if (params.to) {
      entries = entries.filter((e) => e.createdAt <= params.to!)
    }

    return entries
  },

  async getEntityAuditLog(entity: AuditEntity, entityId: string): Promise<AuditLogEntry[]> {
    await delay(200)
    return auditLogStore.getByEntity(entity, entityId)
  },

  async logAction(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<AuditLogEntry> {
    await delay(100)
    return auditLogStore.log(entry)
  },
}
