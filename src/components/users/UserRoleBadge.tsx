import type { UserRole } from '@/types/user'

const ROLE_STYLES: Record<UserRole, string> = {
  admin:       'bg-purple-100 text-purple-700',
  manager:     'bg-blue-100 text-blue-700',
  sales_agent: 'bg-slate-100 text-slate-700',
  support:     'bg-violet-100 text-violet-700',
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin:       'Admin',
  manager:     'Manager',
  sales_agent: 'Sales Agent',
  support:     'Support Agent',
}

interface UserRoleBadgeProps {
  role: UserRole
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        ROLE_STYLES[role] ?? 'bg-slate-100 text-slate-700',
      ].join(' ')}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}
