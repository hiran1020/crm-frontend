export type CustomerStatus = 'Active' | 'Inactive'

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  jobTitle: string
  status: CustomerStatus
  owner: string
  createdAt: string
  avatar?: string
  tags?: string[]
}

export type CustomerSortField =
  | 'name'
  | 'company'
  | 'email'
  | 'status'
  | 'owner'
  | 'createdAt'

export type SortDirection = 'asc' | 'desc'

export interface CustomerListParams {
  search?: string
  status?: CustomerStatus | 'All'
  owner?: string | 'All'
  sortBy?: CustomerSortField
  sortDir?: SortDirection
  page?: number
  pageSize?: number
}

export interface CustomerListResult {
  data: Customer[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type CustomerInput = Omit<Customer, 'id' | 'createdAt'>
