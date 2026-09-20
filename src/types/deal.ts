export type DealStage = 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost'

export interface Deal {
  id: string
  title: string
  customerId: string
  amount: number
  stage: DealStage
  owner: string
  expectedCloseDate: string
  description?: string
  probability?: number
  createdAt: string
  closedReason?: string
}

export type DealInput = Omit<Deal, 'id' | 'createdAt' | 'closedReason'>

export interface DealListParams {
  search?: string
  stage?: DealStage | 'All'
  owner?: string | 'All'
  sortBy?: 'title' | 'amount' | 'stage' | 'expectedCloseDate'
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface DealListResult {
  data: Deal[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
