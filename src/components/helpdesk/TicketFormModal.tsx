import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ReactNode } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/context/AuthContext'
import { ticketFormSchema, type TicketFormValues } from '@/schemas/ticket'
import type { Ticket } from '@/types/ticket'

interface TicketFormModalProps {
  open: boolean
  ticket?: Ticket | null
  busy?: boolean
  onClose: () => void
  onSubmit: (values: TicketFormValues) => Promise<void> | void
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}

function cls(error?: { message?: string }) {
  return [
    'h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2',
    error ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
           : 'border-border focus:border-brand-500 focus:ring-brand-100',
  ].join(' ')
}

export function TicketFormModal({ open, ticket, busy = false, onClose, onSubmit }: TicketFormModalProps) {
  const { user } = useAuth()
  const { data: users = [] } = useUsers()
  const isEdit = Boolean(ticket)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema) as Resolver<TicketFormValues>,
    defaultValues: {
      title: '', description: '', status: 'Open', priority: 'Medium',
      category: 'Delivery Issue', assignedTo: '', assigneeId: '',
      customerId: '', customerName: '', createdBy: '',
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!open) return
    if (ticket) {
      const matchedUser = users.find((u) => u.name === ticket.assignedTo)
      reset({
        title: ticket.title, description: ticket.description,
        status: ticket.status, priority: ticket.priority,
        category: ticket.category,
        assignedTo: ticket.assignedTo,
        assigneeId: matchedUser?.id ?? '',
        customerId: ticket.customerId ?? '', customerName: ticket.customerName ?? '',
        createdBy: ticket.createdBy,
      })
    } else {
      const defaultUser = users.find((u) => u.id === user?.id) ?? users[0]
      reset({
        title: '', description: '', status: 'Open', priority: 'Medium',
        category: 'Delivery Issue',
        assignedTo: defaultUser?.name ?? '',
        assigneeId: defaultUser?.id ?? '',
        customerId: '', customerName: '',
        createdBy: user?.name ?? user?.email ?? '',
      })
    }
  }, [open, ticket, reset, users, user])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-2 sm:items-center sm:p-4"
      onClick={onClose}>
      <div role="dialog" aria-modal="true"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-lg sm:p-6"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.key === 'Escape' && onClose()}>
        <h2 className="text-lg font-semibold text-slate-900">
          {isEdit ? 'Edit ticket' : 'New support ticket'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? 'Update ticket details.' : 'Log a new customer support request.'}
        </p>

        <form className="mt-5 space-y-4"
          onSubmit={e => { void handleSubmit(async v => { await onSubmit(v) })(e) }}>

          <Field label="Title" error={errors.title?.message}>
            <input {...register('title')} autoFocus className={cls(errors.title)} placeholder="Short description of the issue" />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <textarea {...register('description')} rows={4}
              className={['w-full resize-none rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2',
                errors.description ? 'border-red-300 focus:ring-red-100' : 'border-border focus:border-brand-500 focus:ring-brand-100'].join(' ')}
              placeholder="Detailed description of the problem..." />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Priority" error={errors.priority?.message}>
              <select {...register('priority')} className={cls(errors.priority)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <select {...register('status')} className={cls(errors.status)}>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={errors.category?.message}>
              <select {...register('category')} className={cls(errors.category)}>
                <option value="Delivery Issue">Delivery Issue</option>
                <option value="Billing">Billing Dispute</option>
                <option value="Technical Support">Equipment Fault</option>
                <option value="General Inquiry">Account Setup</option>
                <option value="Bug">Fuel Quality</option>
                <option value="Feature Request">Other</option>
              </select>
            </Field>
            <Field label="Assigned to" error={errors.assignedTo?.message}>
              <select
                className={cls(errors.assignedTo)}
                value={watch('assigneeId') ?? ''}
                onChange={(e) => {
                  const selected = users.find((u) => u.id === e.target.value)
                  setValue('assigneeId', e.target.value)
                  setValue('assignedTo', selected?.name ?? e.target.value, { shouldValidate: true })
                }}
              >
                <option value="">Select assignee…</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name (optional)" error={errors.customerName?.message}>
              <input {...register('customerName')} className={cls(errors.customerName)} placeholder="e.g. Shelby Terrell" />
            </Field>
            <Field label="Reporter" error={errors.createdBy?.message}>
              <input {...register('createdBy')} className={cls(errors.createdBy)} placeholder="Who submitted this?" />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={busy}
              className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
