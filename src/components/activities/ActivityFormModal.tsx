import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/context/AuthContext'
import {
  activityFormSchema,
  type ActivityFormValues,
} from '@/schemas/activity'
import type { ActivityType } from '@/types/activity'

interface ActivityContext {
  relatedTo: string
  relatedType: 'customer' | 'lead' | 'deal'
  relatedName: string
}

interface ActivityFormModalProps {
  open: boolean
  defaultType?: ActivityType
  /** Pre-fills the related entity (e.g. when opened from CustomerDetails) */
  context?: ActivityContext
  busy?: boolean
  onClose: () => void
  onSubmit: (values: ActivityFormValues) => Promise<void> | void
}

const TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Phone Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  task: 'Task',
}

export function ActivityFormModal({
  open,
  defaultType,
  context,
  busy = false,
  onClose,
  onSubmit,
}: ActivityFormModalProps) {
  const { data: users = [] } = useUsers()
  const { user: authUser } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      type: 'call',
      title: '',
      description: '',
      owner: '',
      completed: false,
      dueDate: '',
      priority: 'medium',
    },
    mode: 'onBlur',
  })

  const selectedType = watch('type')

  useEffect(() => {
    if (!open) return
    const defaultUser = users.find((u) => u.id === authUser?.id) ?? users[0]
    reset({
      type: defaultType ?? 'call',
      title: '',
      description: '',
      owner: defaultUser?.name ?? '',
      completed: false,
      dueDate: '',
      priority: 'medium',
    })
  }, [open, defaultType, reset, users, authUser])

  if (!open) return null

  const titleLabel =
    selectedType === 'note'
      ? 'Note content'
      : selectedType === 'task'
        ? 'Task description'
        : 'Subject / summary'

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-2 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-form-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-lg sm:p-6"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
      >
        <h2
          id="activity-form-title"
          className="text-lg font-semibold text-slate-900"
        >
          Log activity
        </h2>

        {context ? (
          <p className="mt-1 text-sm text-slate-500">
            Related to:{' '}
            <span className="font-medium text-slate-700">{context.relatedName}</span>
            {' '}
            <span className="capitalize text-slate-400">({context.relatedType})</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">
            Record a call, email, meeting, note, or task.
          </p>
        )}

        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            void handleSubmit(async (values) => {
              await onSubmit(values)
            })(e)
          }}
        >
          {/* Type */}
          <Field label="Activity type" error={errors.type?.message}>
            <select {...register('type')} className={inputClass(errors.type)}>
              {(
                ['call', 'email', 'meeting', 'note', 'task'] as ActivityType[]
              ).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>

          {/* Title */}
          <Field label={titleLabel} error={errors.title?.message}>
            <input
              {...register('title')}
              className={inputClass(errors.title)}
              placeholder={
                selectedType === 'note'
                  ? 'Write your note here…'
                  : selectedType === 'task'
                    ? 'What needs to be done?'
                    : 'What happened?'
              }
            />
          </Field>

          {/* Description — hide for tasks (title is already descriptive) */}
          {selectedType !== 'task' ? (
            <Field label="Details (optional)" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={3}
                className={[
                  'w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 resize-none',
                  errors.description
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-border focus:border-brand-500 focus:ring-brand-100',
                ].join(' ')}
                placeholder="Additional context…"
              />
            </Field>
          ) : null}

          {/* Task-specific fields */}
          {selectedType === 'task' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Due date" error={errors.dueDate?.message}>
                <input
                  type="date"
                  {...register('dueDate')}
                  className={inputClass(errors.dueDate)}
                />
              </Field>
              <Field label="Priority" error={errors.priority?.message}>
                <select
                  {...register('priority')}
                  className={inputClass(errors.priority)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </Field>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Owner */}
            <Field label="Owner" error={errors.owner?.message}>
              <select {...register('owner')} className={inputClass(errors.owner)}>
                <option value="">Select owner…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>

            {/* Completed (only meaningful for non-tasks) */}
            {selectedType !== 'task' ? (
              <Field label="Status" error={undefined}>
                <div className="flex h-10 items-center">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      {...register('completed')}
                      className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
                    />
                    Mark as completed
                  </label>
                </div>
              </Field>
            ) : null}
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
              {busy ? 'Saving…' : 'Save activity'}
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
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
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
