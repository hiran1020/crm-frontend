export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Lost' | 'Converted'
export type LeadSource =
  | 'Website'
  | 'Referral'
  | 'Trade Show'
  | 'Cold Call'
  | 'Email Campaign'
  | 'Social Media'
  | 'Partner'

export interface Lead {
  id: string
  name: string
  company: string
  email: string
  phone: string
  source: LeadSource
  status: LeadStatus
  value: number
  owner: string
  ownerId?: string
  notes: string
  createdAt: string
  convertedCustomerId?: string
  tags?: string[]
}

export interface LeadListParams {
  search?: string
  status?: LeadStatus | 'All'
  owner?: string | 'All'
  sortBy?: 'name' | 'company' | 'value' | 'status' | 'createdAt'
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface LeadListResult {
  data: Lead[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type LeadInput = Omit<Lead, 'id' | 'createdAt' | 'convertedCustomerId'>
