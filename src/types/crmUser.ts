import type { UserRole } from '@/types/user'

export interface CrmUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarInitials: string
  status: 'active' | 'inactive'
  phone?: string
  jobTitle?: string
  department?: string
  createdAt: string
  lastLoginAt?: string
}

export type CrmUserInput = Omit<CrmUser, 'id' | 'createdAt' | 'avatarInitials'>

export interface UserStats {
  customersOwned: number
  leadsOwned: number
  openDeals: number
  wonDeals: number
  wonRevenue: number
  activitiesLogged: number
}
