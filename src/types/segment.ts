export type SegmentConditionField = 'status' | 'owner' | 'company' | 'jobTitle' | 'createdAt' | 'tag'
export type SegmentConditionOp = 'is' | 'is_not' | 'contains' | 'not_contains' | 'before' | 'after'

export interface SegmentCondition {
  id: string
  field: SegmentConditionField
  op: SegmentConditionOp
  value: string
}

export type SegmentLogic = 'AND' | 'OR'

export interface Segment {
  id: string
  name: string
  description?: string
  entityType: 'customer' | 'lead'
  logic: SegmentLogic
  conditions: SegmentCondition[]
  createdBy: string
  createdAt: string
  color: string
}
