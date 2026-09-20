import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { MOCK_OWNERS } from '@/constants/auth'
import {
  customerFormSchema,
  type CustomerFormValues,
} from '@/schemas/customer'
import { useCustomFields } from '@/hooks/useCustomFields'
import type { Customer } from '@/types/customer'

interface CustomerFormModalProps {
  open: boolean
  customer?: Customer | null
  busy?: boolean
  onClose: () => void
  onSubmit: (values: CustomerFormValues) => Promise<void> | void
}

const defaultValues: CustomerFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  jobTitle: '',
  status: 'Active',
  owner: MOCK_OWNERS[0],
}

export function CustomerFormModal({
  open,
  customer,
  busy = false,
  onClose,
  onSubmit,
}: CustomerFormModalProps) {
  const isEdit = Boolean(customer)
  const { data: customFields = [] } = useCustomFields('customer')
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({})

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!open) {
      return
    }

    if (customer) {
      reset({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        jobTitle: customer.jobTitle,
        status: customer.status,
        owner: customer.owner as (typeof MOCK_OWNERS)[number],
      })
      setCustomFieldValues(((customer as unknown as Record<string, unknown>).customFields as Record<string, unknown>) ?? {})
    } else {
      reset(defaultValues)
      setCustomFieldValues({})
    }
  }, [open, customer, reset])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-2 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-form-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-lg sm:p-6"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
      >
        <h2
          id="customer-form-title"
          className="text-lg font-semibold text-slate-900"
        >
          {isEdit ? 'Edit customer' : 'Add customer'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? 'Update contact details and ownership.'
            : 'Create a new customer record.'}
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            void handleSubmit(async (values) => {
              await onSubmit({ ...values, customFields: customFieldValues } as CustomerFormValues)
            })(event)
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" error={errors.firstName?.message}>
              <input
                {...register('firstName')}
                className={inputClass(errors.firstName)}
                autoComplete="given-name"
                autoFocus
              />
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              <input
                {...register('lastName')}
                className={inputClass(errors.lastName)}
                autoComplete="family-name"
              />
            </Field>
          </div>

          <Field label="Email" error={errors.email?.message}>
            <input
              type="email"
              {...register('email')}
              className={inputClass(errors.email)}
              autoComplete="email"
            />
          </Field>

          <Field label="Phone" error={errors.phone?.message}>
            <input
              type="tel"
              {...register('phone')}
              className={inputClass(errors.phone)}
              autoComplete="tel"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company" error={errors.company?.message}>
              <input
                {...register('company')}
                className={inputClass(errors.company)}
                autoComplete="organization"
              />
            </Field>
            <Field label="Job title" error={errors.jobTitle?.message}>
              <input
                {...register('jobTitle')}
                className={inputClass(errors.jobTitle)}
                autoComplete="organization-title"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" error={errors.status?.message}>
              <select {...register('status')} className={inputClass(errors.status)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Owner" error={errors.owner?.message}>
              <select {...register('owner')} className={inputClass(errors.owner)}>
                {MOCK_OWNERS.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {customFields.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Custom Fields</h3>
              <div className="space-y-3">
                {customFields.map((cf) => (
                  <div key={cf.id}>
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700">
                        {cf.name}
                        {cf.required && <span className="ml-1 text-red-500">*</span>}
                      </span>
                      {cf.type === 'text' && (
                        <input
                          type="text"
                          value={String(customFieldValues[cf.key] ?? '')}
                          onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [cf.key]: e.target.value }))}
                          className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        />
                      )}
                      {cf.type === 'url' && (
                        <input
                          type="url"
                          value={String(customFieldValues[cf.key] ?? '')}
                          onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [cf.key]: e.target.value }))}
                          placeholder="https://"
                          className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        />
                      )}
                      {cf.type === 'number' && (
                        <input
                          type="number"
                          value={String(customFieldValues[cf.key] ?? '')}
                          onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [cf.key]: e.target.value }))}
                          className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        />
                      )}
                      {cf.type === 'date' && (
                        <input
                          type="date"
                          value={String(customFieldValues[cf.key] ?? '')}
                          onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [cf.key]: e.target.value }))}
                          className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        />
                      )}
                      {cf.type === 'select' && (
                        <select
                          value={String(customFieldValues[cf.key] ?? '')}
                          onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [cf.key]: e.target.value }))}
                          className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        >
                          <option value="">Select…</option>
                          {(cf.options ?? []).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {cf.type === 'checkbox' && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={Boolean(customFieldValues[cf.key])}
                            onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [cf.key]: e.target.checked }))}
                            className="h-4 w-4"
                          />
                          <span className="text-slate-700">{cf.name}</span>
                        </label>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add customer'}
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
