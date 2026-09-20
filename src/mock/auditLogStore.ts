import type { AuditAction, AuditEntity, AuditLogEntry } from '@/types/auditLog'

let nextId = 21

const seedEntries: AuditLogEntry[] = [
  { id: 'AL-001', action: 'create', entity: 'customer', entityId: 'CUS-024', entityLabel: 'Janice Rhodes', actor: 'Sarah Wilson', actorRole: 'manager', createdAt: '2026-08-20T09:00:00Z', ip: '192.168.1.10' },
  { id: 'AL-002', action: 'update', entity: 'deal', entityId: 'DEAL-003', entityLabel: 'Apex Analytics Suite', actor: 'Sarah Wilson', actorRole: 'manager', changes: { stage: { from: 'Proposal', to: 'Negotiation' } }, createdAt: '2026-08-21T14:00:00Z', ip: '192.168.1.10' },
  { id: 'AL-003', action: 'create', entity: 'lead', entityId: 'LED-045', entityLabel: 'Marcus Chen', actor: 'David Chen', actorRole: 'sales_agent', createdAt: '2026-08-22T10:30:00Z', ip: '192.168.1.11' },
  { id: 'AL-004', action: 'status_change', entity: 'customer', entityId: 'CUS-018', entityLabel: 'Ronald Burke', actor: 'Emily Rodriguez', actorRole: 'sales_agent', changes: { status: { from: 'Active', to: 'Inactive' } }, createdAt: '2026-08-23T11:00:00Z', ip: '192.168.1.12' },
  { id: 'AL-005', action: 'delete', entity: 'lead', entityId: 'LED-032', entityLabel: 'Patricia Sullivan', actor: 'Admin User', actorRole: 'admin', createdAt: '2026-08-24T15:45:00Z', ip: '192.168.1.1' },
  { id: 'AL-006', action: 'stage_change', entity: 'deal', entityId: 'DEAL-007', entityLabel: 'TechCorp License', actor: 'David Chen', actorRole: 'sales_agent', changes: { stage: { from: 'Qualified', to: 'Proposal' } }, createdAt: '2026-08-25T09:15:00Z', ip: '192.168.1.11' },
  { id: 'AL-007', action: 'login', entity: 'user', entityId: 'USR-001', entityLabel: 'Sarah Wilson', actor: 'Sarah Wilson', actorRole: 'manager', createdAt: '2026-08-26T08:00:00Z', ip: '192.168.1.10' },
  { id: 'AL-008', action: 'export', entity: 'customer', entityId: '', entityLabel: 'All Customers (CSV)', actor: 'Admin User', actorRole: 'admin', createdAt: '2026-08-27T13:30:00Z', ip: '192.168.1.1' },
  { id: 'AL-009', action: 'create', entity: 'deal', entityId: 'DEAL-012', entityLabel: 'GlobalBank Integration', actor: 'Sarah Wilson', actorRole: 'manager', createdAt: '2026-08-28T10:00:00Z', ip: '192.168.1.10' },
  { id: 'AL-010', action: 'update', entity: 'customer', entityId: 'CUS-031', entityLabel: 'Diana Wells', actor: 'Emily Rodriguez', actorRole: 'sales_agent', changes: { phone: { from: '555-1234', to: '555-5678' } }, createdAt: '2026-08-29T14:20:00Z', ip: '192.168.1.12' },
  { id: 'AL-011', action: 'create', entity: 'activity', entityId: 'ACT-089', entityLabel: 'Follow-up call with Marcus', actor: 'David Chen', actorRole: 'sales_agent', createdAt: '2026-08-30T09:45:00Z', ip: '192.168.1.11' },
  { id: 'AL-012', action: 'status_change', entity: 'lead', entityId: 'LED-041', entityLabel: 'NextGen Startup', actor: 'Sarah Wilson', actorRole: 'manager', changes: { status: { from: 'New', to: 'Qualified' } }, createdAt: '2026-09-01T11:30:00Z', ip: '192.168.1.10' },
  { id: 'AL-013', action: 'delete', entity: 'activity', entityId: 'ACT-056', entityLabel: 'Old meeting note', actor: 'Admin User', actorRole: 'admin', createdAt: '2026-09-02T16:00:00Z', ip: '192.168.1.1' },
  { id: 'AL-014', action: 'update', entity: 'deal', entityId: 'DEAL-009', entityLabel: 'Retail Connect Pro', actor: 'Emily Rodriguez', actorRole: 'sales_agent', changes: { amount: { from: 15000, to: 18500 } }, createdAt: '2026-09-03T10:10:00Z', ip: '192.168.1.12' },
  { id: 'AL-015', action: 'stage_change', entity: 'deal', entityId: 'DEAL-011', entityLabel: 'CloudSync Deal', actor: 'David Chen', actorRole: 'sales_agent', changes: { stage: { from: 'Negotiation', to: 'Won' } }, createdAt: '2026-09-05T13:45:00Z', ip: '192.168.1.11' },
  { id: 'AL-016', action: 'create', entity: 'customer', entityId: 'CUS-036', entityLabel: 'Oliver Tang', actor: 'Emily Rodriguez', actorRole: 'sales_agent', createdAt: '2026-09-08T09:00:00Z', ip: '192.168.1.12' },
  { id: 'AL-017', action: 'login', entity: 'user', entityId: 'USR-004', entityLabel: 'Admin User', actor: 'Admin User', actorRole: 'admin', createdAt: '2026-09-10T08:05:00Z', ip: '192.168.1.1' },
  { id: 'AL-018', action: 'export', entity: 'lead', entityId: '', entityLabel: 'Qualified Leads (CSV)', actor: 'Sarah Wilson', actorRole: 'manager', createdAt: '2026-09-12T14:00:00Z', ip: '192.168.1.10' },
  { id: 'AL-019', action: 'update', entity: 'lead', entityId: 'LED-048', entityLabel: 'SkyTech Ventures', actor: 'David Chen', actorRole: 'sales_agent', changes: { owner: { from: 'Sarah Wilson', to: 'David Chen' } }, createdAt: '2026-09-15T11:20:00Z', ip: '192.168.1.11' },
  { id: 'AL-020', action: 'create', entity: 'ticket', entityId: 'TKT-023', entityLabel: 'Cannot export report', actor: 'Emily Rodriguez', actorRole: 'sales_agent', createdAt: '2026-09-18T15:00:00Z', ip: '192.168.1.12' },
]

let auditLog: AuditLogEntry[] = [...seedEntries]

export const auditLogStore = {
  log(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): AuditLogEntry {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `AL-${String(nextId).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    }
    nextId += 1
    auditLog = [newEntry, ...auditLog]
    return newEntry
  },

  getAll(): AuditLogEntry[] {
    return [...auditLog].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  },

  getByEntity(entity: AuditEntity, entityId: string): AuditLogEntry[] {
    return auditLog
      .filter((e) => e.entity === entity && e.entityId === entityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  clear(): void {
    auditLog = []
  },
}

export type { AuditAction, AuditEntity }
