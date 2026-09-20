import { Link } from 'react-router-dom'
import { Pencil, Power, Trash2 } from 'lucide-react'
import { UserRoleBadge } from '@/components/users/UserRoleBadge'
import { formatRelativeDate } from '@/lib/format'
import type { CrmUser } from '@/types/crmUser'

const AVATAR_ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  sales_agent: 'bg-brand-100 text-brand-700',
}

interface UserTableProps {
  users: CrmUser[]
  onEdit: (user: CrmUser) => void
  onToggleStatus: (user: CrmUser) => void
  onDelete: (user: CrmUser) => void
  currentUserId?: string
}

export function UserTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="animate-pulse space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-border px-4 py-4 last:border-b-0"
          >
            <div className="h-9 w-9 rounded-full bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 rounded bg-slate-100" />
              <div className="h-3 w-40 rounded bg-slate-100" />
            </div>
            <div className="hidden h-4 w-20 self-center rounded bg-slate-100 sm:block" />
            <div className="ml-auto h-4 w-16 self-center rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function UserTable({
  users,
  onEdit,
  onToggleStatus,
  onDelete,
  currentUserId,
}: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="border-b border-border bg-slate-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Member
            </th>
            <th
              scope="col"
              className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell"
            >
              Role
            </th>
            <th
              scope="col"
              className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell"
            >
              Job Title
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Status
            </th>
            <th
              scope="col"
              className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell"
            >
              Last Login
            </th>
            <th scope="col" className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => {
            const isSelf = user.id === currentUserId
            return (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                        AVATAR_ROLE_COLORS[user.role] ?? 'bg-brand-100 text-brand-700',
                      ].join(' ')}
                    >
                      {user.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/team/${user.id}`}
                        className="block truncate text-sm font-medium text-slate-900 hover:text-brand-600"
                      >
                        {user.name}
                        {isSelf ? (
                          <span className="ml-1.5 text-xs text-slate-400">(you)</span>
                        ) : null}
                      </Link>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <UserRoleBadge role={user.role} />
                </td>
                <td className="hidden px-4 py-3 text-sm text-slate-600 md:table-cell">
                  {user.jobTitle ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      user.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500',
                    ].join(' ')}
                  >
                    {user.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-slate-500 lg:table-cell">
                  {user.lastLoginAt ? formatRelativeDate(user.lastLoginAt) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      aria-label={`Edit ${user.name}`}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleStatus(user)}
                      aria-label={
                        user.status === 'active'
                          ? `Deactivate ${user.name}`
                          : `Activate ${user.name}`
                      }
                      title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      className={[
                        'rounded p-1.5 hover:bg-slate-100',
                        user.status === 'active'
                          ? 'text-amber-500 hover:text-amber-700'
                          : 'text-emerald-500 hover:text-emerald-700',
                      ].join(' ')}
                    >
                      <Power className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(user)}
                      disabled={isSelf}
                      aria-label={`Delete ${user.name}`}
                      title={isSelf ? 'Cannot delete yourself' : 'Delete user'}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
