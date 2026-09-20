export type UserRole = 'admin' | 'manager' | 'sales_agent' | 'support'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatarInitials: string
}

/** Human-readable role labels */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin:       'Admin',
  manager:     'Manager',
  sales_agent: 'Sales Agent',
  support:     'Support Agent',
}

/** Role descriptions for the permissions matrix */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin:       'Full access to all features, user management, and system configuration.',
  manager:     'Manage team records, access reports and forecasting, convert leads.',
  sales_agent: 'Create and manage own records, view pipeline and activities.',
  support:     'Handle customer support tickets, view customer records and activities.',
}
