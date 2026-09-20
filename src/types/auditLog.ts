export type AuditAction = 'create' | 'update' | 'delete' | 'status_change' | 'stage_change' | 'login' | 'export'
export type AuditEntity = 'customer' | 'lead' | 'deal' | 'activity' | 'ticket' | 'user'

export interface AuditLogEntry {
  id: string
  action: AuditAction
  entity: AuditEntity
  entityId: string
  entityLabel: string
  actor: string
  actorRole: string
  changes?: Record<string, { from: unknown; to: unknown }>
  createdAt: string
  ip?: string
}
