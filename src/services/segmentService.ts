import { api } from '@/lib/api'
import type { Customer } from '@/types/customer'
import type { Lead } from '@/types/lead'
import type { Segment } from '@/types/segment'

// Map frontend op names to backend operator names
const OP_TO_API: Record<string, string> = {
  is:           'eq',
  is_not:       'ne',
  contains:     'contains',
  not_contains: 'ne',
  before:       'lt',
  after:        'gt',
}
const OP_FROM_API: Record<string, string> = {
  eq:       'is',
  ne:       'is_not',
  contains: 'contains',
  lt:       'before',
  gt:       'after',
}

interface ApiSegment {
  id: string
  name?: string
  description?: string
  entityType?: string
  criteria?: Array<{ field: string; operator: string; value: unknown }>
  createdAt?: string
  // passthrough fields stored by backend
  logic?: string
  color?: string
  createdBy?: string
}

function fromApi(d: ApiSegment): Segment {
  const conditions = (d.criteria ?? []).map((c, i) => ({
    id: String(i),
    field: c.field as Segment['conditions'][number]['field'],
    op: (OP_FROM_API[c.operator] ?? c.operator) as Segment['conditions'][number]['op'],
    value: String(c.value ?? ''),
  }))
  return {
    id: d.id,
    name: d.name ?? '',
    description: d.description,
    entityType: (d.entityType as Segment['entityType']) ?? 'customer',
    logic: (d.logic as Segment['logic']) ?? 'AND',
    conditions,
    createdBy: d.createdBy ?? '',
    createdAt: d.createdAt ?? new Date().toISOString(),
    color: d.color ?? '#6366f1',
  }
}

function toApi(input: Partial<Omit<Segment, 'id' | 'createdAt'>>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (input.name !== undefined)        payload.name        = input.name
  if (input.description !== undefined) payload.description = input.description
  if (input.entityType !== undefined)  payload.entityType  = input.entityType
  if (input.logic !== undefined)       payload.logic       = input.logic
  if (input.color !== undefined)       payload.color       = input.color
  if (input.createdBy !== undefined)   payload.createdBy   = input.createdBy
  if (input.conditions !== undefined) {
    payload.criteria = input.conditions.map(c => ({
      field: c.field,
      operator: OP_TO_API[c.op] ?? c.op,
      value: c.value,
    }))
  }
  return payload
}

export const segmentService = {
  async getSegments(): Promise<Segment[]> {
    const res = await api.get<{ data: ApiSegment[] }>('/segments?pageSize=200')
    return res.data.map(fromApi)
  },

  async getSegment(id: string): Promise<Segment> {
    const d = await api.get<ApiSegment>(`/segments/${id}`)
    return fromApi(d)
  },

  async createSegment(input: Omit<Segment, 'id' | 'createdAt'>): Promise<Segment> {
    const d = await api.post<ApiSegment>('/segments', toApi(input))
    return fromApi(d)
  },

  async updateSegment(
    id: string,
    input: Partial<Omit<Segment, 'id' | 'createdAt'>>,
  ): Promise<Segment> {
    const d = await api.patch<ApiSegment>(`/segments/${id}`, toApi(input))
    return fromApi(d)
  },

  async deleteSegment(id: string): Promise<void> {
    await api.delete(`/segments/${id}`)
  },

  async previewSegment(segmentId: string, _records: (Customer | Lead)[]): Promise<number> {
    const res = await api.get<{ count: number }>(`/segments/${segmentId}/evaluate`)
    return res.count
  },

  // TODO: move to backend — synchronous preview is not possible via API.
  // Replace callers with the async previewSegment instead.
  previewSegmentSync(_segment: Segment, _records: (Customer | Lead)[]): number {
    return 0
  },
}
