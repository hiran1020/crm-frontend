import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { userFormSchema, type UserFormValues } from '@/schemas/user'
import type { CrmUser } from '@/types/crmUser'

interface UserFormModalProps {
  open: boolean
  user?: CrmUser | null
  busy?: boolean
  onClose: () => void
  onSubmit: (values: UserFormValues) => Promise<void> | void
}

const defaultValues: UserFormValues = {
  name: '',
  email: '',
  role: 'sales_agent',
  status: 'active',
  phone: '',
  jobTitle: '',
  department: '',
}

export function UserFormModal({
  open,
  user,
  busy = false,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const isEdit = Boolean(user)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!open) return
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone ?? '',
        jobTitle: user.jobTitle ?? '',
        department: user.department ?? '',
      })
    } else {
      reset(defaultValues)
    }
  }, [open, user, reset])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-2 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-lg sm:p-6"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
      >
        <h2 id="user-form-title" className="text-lg font-semibold text-slate-900">
          {isEdit ? 'Edit team member' : 'Invite team member'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? 'Update this team member\'s details.'
            : 'Add a new member to your CRM workspace.'}
        </p>

        {!isEdit ? (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-800">
              Demo: the new member's password will be <strong>password</strong>
            </p>
          </div>
        ) : null}

        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            void handleSubmit(async (values) => {
              await onSubmit(values)
            })(e)
          }}
        >
          <Field label="Full name" error={errors.name?.message}>
            <input
              {...register('name')}
              className={inputClass(errors.name)}
              autoComplete="name"
              autoFocus
              placeholder="Jane Smith"
            />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input
              type="email"
              {...register('email')}
              className={inputClass(errors.email)}
              autoComplete="email"
              placeholder="jane@company.com"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role" error={errors.role?.message}>
              <select {...register('role')} className={inputClass(errors.role)}>
                <option value="sales_agent">Sales Agent</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <select {...register('status')} className={inputClass(errors.status)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <Field label="Phone" error={errors.phone?.message}>
            <input
              type="tel"
              {...register('phone')}
              className={inputClass(errors.phone)}
              autoComplete="tel"
              placeholder="+1-555-000-0000"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job title" error={errors.jobTitle?.message}>
              <input
                {...register('jobTitle')}
                className={inputClass(errors.jobTitle)}
                placeholder="Account Executive"
              />
            </Field>
            <Field label="Department" error={errors.department?.message}>
              <input
                {...register('department')}
                className={inputClass(errors.department)}
                placeholder="Sales"
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Invite member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}

function inputClass(error?: { message?: string }) {
  return [
    'h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2',
    error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
      : 'border-border focus:border-brand-500 focus:ring-brand-100',
  ].join(' ')
}
