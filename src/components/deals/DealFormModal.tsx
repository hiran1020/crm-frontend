import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { MOCK_OWNERS } from '@/constants/auth'
import { useCustomers } from '@/hooks/useCustomers'
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

const defaultValues: DealFormValues = {
  title: '',
  customerId: '',
  amount: 0,
  stage: 'New',
  owner: MOCK_OWNERS[0],
  expectedCloseDate: '',
  description: '',
  probability: undefined,
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

  const customersQuery = useCustomers({ pageSize: 100 })
  const customers = customersQuery.data?.data ?? []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const STAGE_PROBABILITY: Record<DealStage, number> = {
    New: 10,
    Qualified: 25,
    Proposal: 50,
    Negotiation: 75,
    Won: 100,
    Lost: 0,
  }

  const watchedStage = useWatch({ control, name: 'stage' })
  useEffect(() => {
    if (watchedStage) {
      setValue('probability', STAGE_PROBABILITY[watchedStage as DealStage], {
        shouldDirty: false,
      })
    }
  }, [watchedStage, setValue])

  useEffect(() => {
    if (!open) return

    if (deal) {
      reset({
        title: deal.title,
        customerId: deal.customerId,
        amount: deal.amount,
        stage: deal.stage,
        owner: deal.owner as (typeof MOCK_OWNERS)[number],
        expectedCloseDate: deal.expectedCloseDate,
        description: deal.description ?? '',
        probability: deal.probability,
      })
    } else {
      reset({
        ...defaultValues,
        stage: defaultStage ?? 'New',
      })
    }
  }, [open, deal, defaultStage, reset])

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
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
      >
        <h2
          id="deal-form-title"
          className="text-lg font-semibold text-slate-900"
        >
          {isEdit ? 'Edit deal' : 'Add deal'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? 'Update deal details and stage.'
            : 'Create a new deal in your pipeline.'}
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            void handleSubmit(async (values) => {
              await onSubmit(values)
            })(event)
          }}
        >
          <Field label="Title" error={errors.title?.message}>
            <input
              {...register('title')}
              className={inputClass(errors.title)}
              placeholder="e.g. Enterprise License Renewal"
              autoFocus
            />
          </Field>

          <Field label="Customer" error={errors.customerId?.message}>
            <select
              {...register('customerId')}
              className={inputClass(errors.customerId)}
            >
              <option value="">Select a customer...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName} — {customer.company}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount ($)" error={errors.amount?.message}>
              <input
                type="number"
                min="0"
                step="100"
                {...register('amount', { valueAsNumber: true })}
                className={inputClass(errors.amount)}
              />
            </Field>
            <Field label="Stage" error={errors.stage?.message}>
              <select
                {...register('stage')}
                className={inputClass(errors.stage)}
              >
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
            <Field label="Owner" error={errors.owner?.message}>
              <select
                {...register('owner')}
                className={inputClass(errors.owner)}
              >
                {MOCK_OWNERS.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Expected close date"
              error={errors.expectedCloseDate?.message}
            >
              <input
                type="date"
                {...register('expectedCloseDate')}
                className={inputClass(errors.expectedCloseDate)}
              />
            </Field>
          </div>

          <Field label="Description" error={errors.description?.message}>
            <textarea
              {...register('description')}
              rows={3}
              className={[inputClass(errors.description), 'h-auto resize-none py-2'].join(' ')}
              placeholder="Optional deal notes or context..."
            />
          </Field>

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
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add deal'}
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
