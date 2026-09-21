import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ReactNode } from 'react'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { useCustomers } from '@/hooks/useCustomers'
import { useUsers } from '@/hooks/useUsers'
import { useAuth } from '@/context/AuthContext'
import { dealFormSchema, type DealFormValues } from '@/schemas/deal'
import type { Deal, DealStage } from '@/types/deal'

interface DealFormModalProps {
  open: boolean
  deal?: Deal | null
  defaultStage?: DealStage
  busy?: boolean
  onClose: () => void
  onSubmit: (values: DealFormValues) => Promise<void> | void
}

export function DealFormModal({
  open,
  deal,
  defaultStage,
  busy = false,
  onClose,
  onSubmit,
}: DealFormModalProps) {
  const isEdit = Boolean(deal)

  const customersQuery = useCustomers({ pageSize: 50 })
  const customers = customersQuery.data?.data ?? []
  const { data: users = [] } = useUsers()
  const { user: authUser } = useAuth()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema) as Resolver<DealFormValues>,
    defaultValues: {
      title: '', customerId: '', customerName: '', customerCompany: '',
      amount: 0, stage: 'New', owner: '', ownerId: '',
      expectedCloseDate: '', description: '', probability: undefined,
    },
    mode: 'onBlur',
  })

  const STAGE_PROBABILITY: Record<DealStage, number> = {
    New: 10, Qualified: 25, Proposal: 50, Negotiation: 75, Won: 100, Lost: 0,
  }

  const watchedStage = useWatch({ control, name: 'stage' })
  useEffect(() => {
    if (watchedStage) {
      setValue('probability', STAGE_PROBABILITY[watchedStage as DealStage], { shouldDirty: false })
    }
  }, [watchedStage, setValue])

  useEffect(() => {
    if (!open) return

    const defaultUser = users.find((u) => u.id === authUser?.id) ?? users[0]

    if (deal) {
      const matchedUser = users.find((u) => u.id === deal.ownerId)
        ?? users.find((u) => u.name === deal.owner)
      reset({
        title: deal.title,
        customerId: deal.customerId,
        customerName: deal.customerName ?? '',
        customerCompany: deal.customerCompany ?? '',
        amount: deal.amount,
        stage: deal.stage,
        owner: matchedUser?.name ?? deal.owner,
        ownerId: matchedUser?.id ?? '',
        expectedCloseDate: deal.expectedCloseDate,
        description: deal.description ?? '',
        probability: deal.probability,
      })
    } else {
      reset({
        title: '', customerId: '', customerName: '', customerCompany: '',
        amount: 0, stage: defaultStage ?? 'New',
        owner: defaultUser?.name ?? '', ownerId: defaultUser?.id ?? '',
        expectedCloseDate: '', description: '', probability: undefined,
      })
    }
  }, [open, deal, defaultStage, reset, users, authUser])

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
        aria-labelledby="deal-form-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-lg sm:p-6"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      >
        <h2 id="deal-form-title" className="text-lg font-semibold text-slate-900">
          {isEdit ? 'Edit deal' : 'Add deal'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit ? 'Update deal details and stage.' : 'Create a new deal in your pipeline.'}
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            void handleSubmit(async (values) => { await onSubmit(values) })(event)
          }}
        >
          <Field label="Title" error={errors.title?.message}>
            <input {...register('title')} className={inputClass(errors.title)}
              placeholder="e.g. Enterprise License Renewal" autoFocus />
          </Field>

          <Field label="Customer" error={errors.customerId?.message}>
            <select
              className={inputClass(errors.customerId)}
              {...register('customerId')}
              onChange={(e) => {
                const c = customers.find((x) => x.id === e.target.value)
                setValue('customerId', e.target.value, { shouldValidate: true })
                setValue('customerName', c ? `${c.firstName} ${c.lastName}` : '')
                setValue('customerCompany', c?.company ?? '')
              }}
            >
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} — {c.company}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount ($)" error={errors.amount?.message}>
              <input type="number" min="0" step="100"
                {...register('amount', { valueAsNumber: true })} className={inputClass(errors.amount)} />
            </Field>
            <Field label="Stage" error={errors.stage?.message}>
              <select {...register('stage')} className={inputClass(errors.stage)}>
                <option value="New">New</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
            <Field label="Expected close date" error={errors.expectedCloseDate?.message}>
              <input type="date" {...register('expectedCloseDate')} className={inputClass(errors.expectedCloseDate)} />
            </Field>
          </div>

          <Field label="Description" error={errors.description?.message}>
            <textarea {...register('description')} rows={3}
              className={[inputClass(errors.description), 'h-auto resize-none py-2'].join(' ')}
              placeholder="Optional deal notes or context…" />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={busy}
              className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add deal'}
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
