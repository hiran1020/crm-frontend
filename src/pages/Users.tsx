import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermissions } from '@/hooks/usePermissions'
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useToggleUserStatus,
} from '@/hooks/useUsers'
import { useToast } from '@/components/common/ToastProvider'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { UserFormModal } from '@/components/users/UserFormModal'
import { UserTable, UserTableSkeleton } from '@/components/users/UserTable'
import type { UserFormValues } from '@/schemas/user'
import type { CrmUser } from '@/types/crmUser'
import type { UserRole } from '@/types/user'

export function UsersPage() {
  usePageTitle('Team Members')
  const { user: currentUser } = useAuth()
  const permissions = usePermissions()
  const { notify } = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<CrmUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CrmUser | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<CrmUser | null>(null)

  const usersQuery = useUsers()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const toggleStatus = useToggleUserStatus()

  const users = usersQuery.data ?? []

  const roleCounts = users.reduce<Record<UserRole, number>>(
    (acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1
      return acc
    },
    { admin: 0, manager: 0, sales_agent: 0, support: 0 },
  )

  function handleEdit(user: CrmUser) {
    setEditingUser(user)
    setFormOpen(true)
  }

  function handleDeleteRequest(user: CrmUser) {
    if (user.id === currentUser?.id) return
    setDeleteTarget(user)
  }

  function handleToggleStatus(user: CrmUser) {
    if (user.status === 'active') {
      setDeactivateTarget(user)
    } else {
      void doToggle(user)
    }
  }

  async function doToggle(user: CrmUser) {
    try {
      await toggleStatus.mutateAsync(user.id)
      notify(`${user.name} ${user.status === 'active' ? 'deactivated' : 'activated'}`)
    } catch {
      notify('Could not update status', 'error')
    }
  }

  async function handleFormSubmit(values: UserFormValues) {
    try {
      if (editingUser) {
        await updateUser.mutateAsync({ id: editingUser.id, input: values })
        notify('Team member updated')
      } else {
        await createUser.mutateAsync(values)
        notify('Team member invited')
      }
      setFormOpen(false)
      setEditingUser(null)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save team member', 'error')
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    try {
      await deleteUser.mutateAsync(deleteTarget.id)
      notify(`${deleteTarget.name} removed`)
      setDeleteTarget(null)
    } catch {
      notify('Could not remove team member', 'error')
    }
  }

  async function handleDeactivateConfirm() {
    if (!deactivateTarget) return
    await doToggle(deactivateTarget)
    setDeactivateTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Team Members</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your CRM workspace users, roles, and permissions.
          </p>
        </div>
        {permissions.canManageTeam ? (
          <button
            type="button"
            onClick={() => {
              setEditingUser(null)
              setFormOpen(true)
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Invite Member
          </button>
        ) : null}
      </div>

      {/* Role summary */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          {roleCounts.admin} Admin{roleCounts.admin !== 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          {roleCounts.manager} Manager{roleCounts.manager !== 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          {roleCounts.sales_agent} Sales Agent{roleCounts.sales_agent !== 1 ? 's' : ''}
        </span>
      </div>

      {usersQuery.isLoading ? (
        <UserTableSkeleton />
      ) : usersQuery.isError ? (
        <ErrorState message="Could not load team members" />
      ) : users.length === 0 ? (
        <EmptyState
          title="No team members"
          description="Invite your first team member to get started."
          actionLabel={permissions.canManageTeam ? 'Invite Member' : undefined}
          onAction={
            permissions.canManageTeam
              ? () => {
                  setEditingUser(null)
                  setFormOpen(true)
                }
              : undefined
          }
        />
      ) : (
        <UserTable
          users={users}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteRequest}
          currentUserId={currentUser?.id}
        />
      )}

      <UserFormModal
        open={formOpen}
        user={editingUser}
        busy={createUser.isPending || updateUser.isPending}
        onClose={() => {
          setFormOpen(false)
          setEditingUser(null)
        }}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove team member"
        description={`Are you sure you want to remove ${deleteTarget?.name ?? 'this member'}? This action cannot be undone.`}
        confirmLabel="Remove"
        busy={deleteUser.isPending}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Deactivate team member"
        description={`Are you sure you want to deactivate ${deactivateTarget?.name ?? 'this member'}? They will lose access to the CRM.`}
        confirmLabel="Deactivate"
        busy={toggleStatus.isPending}
        onConfirm={() => void handleDeactivateConfirm()}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  )
}
