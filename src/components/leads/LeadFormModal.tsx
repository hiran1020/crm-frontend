import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { leadFormSchema, type LeadFormValues } from '@/schemas/lead'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/context/AuthContext'
import type { Lead } from '@/types/lead'

interface LeadFormModalProps {
  open: boolean
  lead?: Lead | null
  busy?: boolean
  onClose: () => void
  onSubmit: (values: LeadFormValues) => Promise<void> | void
}

export function LeadFormModal({
  open,
  lead,
  busy = false,
  onClose,
  onSubmit,
}: LeadFormModalProps) {
  const isEdit = Boolean(lead)
  const [apiError, setApiError] = useState<string | null>(null)
  const apiErrorRef = useRef<HTMLParagraphElement>(null)
  const { data: users = [] } = useUsers()
  const { user: authUser } = useAuth()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema) as Resolver<LeadFormValues>,
    defaultValues: {
      name: '', company: '', email: '', phone: '', source: 'Website',
      value: 0, owner: '', ownerId: '', status: 'New', notes: '',
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!open) return

    if (lead) {
      const matchedUser = users.find((u) => u.id === lead.ownerId)
        ?? users.find((u) => u.name === lead.owner)
      reset({
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        value: lead.value,
        owner: matchedUser?.name ?? lead.owner,
        ownerId: matchedUser?.id ?? '',
        status: lead.status,
        notes: lead.notes,
      })
    } else {
      const defaultUser = users.find((u) => u.id === authUser?.id) ?? users[0]
      reset({
        name: '', company: '', email: '', phone: '', source: 'Website',
        value: 0, owner: defaultUser?.name ?? '', ownerId: defaultUser?.id ?? '',
        status: 'New', notes: '',
      })
    }
    setApiError(null)
  }, [open, lead, reset, users, authUser])

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
        aria-labelledby="lead-form-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-lg sm:p-6"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      >
        <h2 id="lead-form-title" className="text-lg font-semibold text-slate-900">
          {isEdit ? 'Edit lead' : 'Add lead'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? 'Update fuel prospect details and status.' : 'Add a new fuel industry prospect.'}
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            void handleSubmit(async (values) => {
              try {
                await onSubmit(values)
                setApiError(null)
              } catch (err) {
                setApiError(err instanceof Error ? err.message : 'Could not save lead')
                setTimeout(() => apiErrorRef.current?.scrollIntoView({ block: 'nearest' }), 50)
              }
            })(event)
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact Name" error={errors.name?.message}>
              <input {...register('name')} className={inputClass(errors.name)} autoComplete="name" autoFocus placeholder="Decision maker's name" />
            </Field>
            <Field label="Company" error={errors.company?.message}>
              <input {...register('company')} className={inputClass(errors.company)} autoComplete="organization" placeholder="Fleet operator, trucking co., municipality…" />
            </Field>
          </div>

          <Field label="Email" error={errors.email?.message}>
            <input type="email" {...register('email')} className={inputClass(errors.email)} autoComplete="email" />
          </Field>

          <Field label="Phone" error={errors.phone?.message}>
            <input type="tel" {...register('phone')} className={inputClass(errors.phone)} autoComplete="tel" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Source" error={errors.source?.message}>
              <select {...register('source')} className={inputClass(errors.source)}>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Trade Show">Industry Event</option>
                <option value="Cold Call">Cold Outreach</option>
                <option value="Email Campaign">Email Campaign</option>
                <option value="Social Media">Social Media</option>
                <option value="Partner">Fleet Association</option>
              </select>
            </Field>
            <Field label="Estimated contract value ($)" error={errors.value?.message}>
              <input
                type="number" min="0" step="100"
                {...register('value', { valueAsNumber: true })}
                className={inputClass(errors.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" error={errors.status?.message}>
              <select {...register('status')} className={inputClass(errors.status)}>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Lost">Lost</option>
                <option value="Converted">Converted</option>
              </select>
            </Field>
            <Field label="Owner" error={errors.ownerId?.message ?? errors.owner?.message}>
              <select
                className={inputClass(errors.ownerId ?? errors.owner)}
                {...register('ownerId')}
                onChange={(e) => {
                  const selected = users.find((u) => u.id === e.target.value)
                  setValue('ownerId', e.target.value, { shouldValidate: true })
                  setValue('owner', selected?.name ?? e.target.value)
                }}
              >
                <option value="">Select owner…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Notes" error={errors.notes?.message}>
            <textarea
              {...register('notes')} rows={3}
              placeholder="Fleet size, fuel type, current supplier, estimated monthly volume…"
              className={[inputClass(errors.notes), 'h-auto resize-none py-2'].join(' ')}
            />
          </Field>

          {apiError && (
            <p ref={apiErrorRef} className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {apiError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={busy}
              className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
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

function inputClass(error?: { message?: string }) {
  return [
    'h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2',
    error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-border focus:border-brand-500 focus:ring-brand-100',
  ].join(' ')
}
