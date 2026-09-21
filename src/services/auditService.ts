import { api } from '@/lib/api'
import { userService } from '@/services/userService'
import type { AuditAction, AuditEntity, AuditLogEntry } from '@/types/auditLog'

export interface AuditLogParams {
  search?: string
  entity?: AuditEntity | 'all'
  action?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

interface ApiAuditEntry {
  id: string
  entityType: string
  entityId: string
  action: string
  actorId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  createdAt: string | { _seconds: number }
}

interface ApiListResult {
  data: ApiAuditEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function mapAction(action: string): AuditAction {
  if (action === 'created') return 'create'
  if (action === 'updated') return 'update'
  if (action === 'deleted') return 'delete'
  return (action as AuditAction) ?? 'update'
}

function toBackendAction(action: string): string {
  if (action === 'create') return 'created'
  if (action === 'update') return 'updated'
  if (action === 'delete') return 'deleted'
  return action
}

function parseDate(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && '_seconds' in (v as object)) {
    return new Date((v as { _seconds: number })._seconds * 1000).toISOString()
  }
  return new Date().toISOString()
}

function deriveLabel(record: Record<string, unknown> | null, entityType: string): string {
  if (!record) return entityType
  const label =
    record.name ??
    record.title ??
    (record.firstName ? `${record.firstName} ${record.lastName ?? ''}`.trim() : undefined) ??
    record.email ??
    record.id
  return label ? String(label) : entityType
}

function computeChanges(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): AuditLogEntry['changes'] {
  if (!before || !after) return undefined
  const skipFields = new Set(['updatedAt', 'createdAt', 'id'])
  const changes: AuditLogEntry['changes'] = {}
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const key of allKeys) {
    if (skipFields.has(key)) continue
    const from = before[key]
    const to = after[key]
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes![key] = { from, to }
    }
  }
  return Object.keys(changes!).length ? changes : undefined
}

function fromApi(d: ApiAuditEntry, userMap: Map<string, { name: string; role: string }>): AuditLogEntry {
  const user = d.actorId ? userMap.get(d.actorId) : null
  const recordForLabel = d.after ?? d.before
  return {
    id: d.id,
    action: mapAction(d.action),
    entity: (d.entityType as AuditEntity) ?? 'customer',
    entityId: d.entityId,
    entityLabel: deriveLabel(recordForLabel, d.entityType),
    actor: user?.name ?? d.actorId ?? 'System',
    actorRole: user?.role ?? 'user',
    changes: computeChanges(d.before, d.after),
    createdAt: parseDate(d.createdAt),
  }
}

async function fetchUserMap(): Promise<Map<string, { name: string; role: string }>> {
  try {
    const users = await userService.getUsers({ pageSize: 200 })
    return new Map(users.map((u) => [u.id, { name: u.name, role: u.role }]))
  } catch {
    return new Map()
  }
}

export interface AuditLogResult {
  data: AuditLogEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const auditService = {
  async getAuditLog(params: AuditLogParams = {}): Promise<AuditLogResult> {
    const qs = new URLSearchParams()
    if (params.entity && params.entity !== 'all') qs.set('entityType', params.entity)
    if (params.action && params.action !== 'all') qs.set('action', toBackendAction(params.action))
    const pageSize = params.pageSize ?? 20
    const page = params.page ?? 1
    qs.set('pageSize', String(pageSize))
    qs.set('page', String(page))

    const [res, userMap] = await Promise.all([
      api.get<ApiListResult>(`/audit-log?${qs}`),
      fetchUserMap(),
    ])

    let entries = res.data.map((d) => fromApi(d, userMap))

    if (params.search) {
      const q = params.search.toLowerCase()
      entries = entries.filter(
        (e) => e.actor.toLowerCase().includes(q) || e.entityLabel.toLowerCase().includes(q),
      )
    }
    if (params.from) {
      entries = entries.filter((e) => e.createdAt >= params.from!)
    }
    if (params.to) {
      entries = entries.filter((e) => e.createdAt <= params.to! + 'T23:59:59Z')
    }

    return {
      data: entries,
      total: res.total,
      page: res.page,
      pageSize: res.pageSize,
      totalPages: res.totalPages,
    }
  },

  async getEntityAuditLog(entity: AuditEntity, entityId: string): Promise<AuditLogEntry[]> {
    const qs = new URLSearchParams({ entityType: entity, entityId, pageSize: '100' })
    const [res, userMap] = await Promise.all([
      api.get<ApiListResult>(`/audit-log?${qs}`),
      fetchUserMap(),
    ])
    return res.data.map((d) => fromApi(d, userMap))
  },
}
