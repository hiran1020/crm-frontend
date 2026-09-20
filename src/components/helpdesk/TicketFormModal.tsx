import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { MOCK_OWNERS } from '@/constants/auth'
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

const defaults: TicketFormValues = {
  title: '', description: '', status: 'Open', priority: 'Medium',
  category: 'General Inquiry', assignedTo: MOCK_OWNERS[0],
  customerId: '', customerName: '', createdBy: '',
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
  const isEdit = Boolean(ticket)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: defaults,
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!open) return
    if (ticket) {
      reset({
        title: ticket.title, description: ticket.description,
        status: ticket.status, priority: ticket.priority,
        category: ticket.category, assignedTo: ticket.assignedTo as (typeof MOCK_OWNERS)[number],
        customerId: ticket.customerId ?? '', customerName: ticket.customerName ?? '',
        createdBy: ticket.createdBy,
      })
    } else {
      reset({ ...defaults, createdBy: user?.name ?? '', assignedTo: user?.name as (typeof MOCK_OWNERS)[number] ?? MOCK_OWNERS[0] })
    }
  }, [open, ticket, reset, user])

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
                <option value="Bug">Bug</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Billing">Billing</option>
                <option value="Technical Support">Technical Support</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </Field>
            <Field label="Assigned to" error={errors.assignedTo?.message}>
              <select {...register('assignedTo')} className={cls(errors.assignedTo)}>
                {MOCK_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
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
