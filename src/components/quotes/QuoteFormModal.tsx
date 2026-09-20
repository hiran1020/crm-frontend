import { Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCustomers } from '@/hooks/useCustomers'
import { useDeals } from '@/hooks/useDeals'
import { formatCurrency } from '@/lib/format'
import type { Quote, QuoteInput, QuoteLineItem, QuoteStatus } from '@/types/quote'

interface Props {
  open: boolean
  quote?: Quote | null
  busy?: boolean
  onClose: () => void
  onSubmit: (input: QuoteInput) => Promise<void>
}

function newLineItem(): QuoteLineItem {
  return {
    id: `li-${Date.now()}`,
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    total: 0,
  }
}

function computeLineTotal(item: QuoteLineItem): number {
  const base = item.quantity * item.unitPrice
  const discPct = item.discount ?? 0
  return base - base * (discPct / 100)
}

const STATUS_OPTIONS: QuoteStatus[] = [
  'Draft',
  'Sent',
  'Viewed',
  'Accepted',
  'Declined',
  'Expired',
]

const inputCls =
  'h-9 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export function QuoteFormModal({ open, quote, busy = false, onClose, onSubmit }: Props) {
  const { user } = useAuth()
  const customersQuery = useCustomers({ pageSize: 200 })
  const dealsQuery = useDeals({ pageSize: 200 })

  const customers = customersQuery.data?.data ?? []
  const deals = dealsQuery.data?.data ?? []

  const isEdit = Boolean(quote)

  const [title, setTitle] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [dealId, setDealId] = useState('')
  const [status, setStatus] = useState<QuoteStatus>('Draft')
  const [validUntil, setValidUntil] = useState('')
  const [tax, setTax] = useState(0)
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('Net 30')
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([newLineItem()])

  useEffect(() => {
    if (!open) return
    if (quote) {
      setTitle(quote.title)
      setCustomerId(quote.customerId ?? '')
      setDealId(quote.dealId ?? '')
      setStatus(quote.status)
      setValidUntil(quote.validUntil)
      setTax(quote.tax)
      setNotes(quote.notes ?? '')
      setTerms(quote.terms ?? 'Net 30')
      setLineItems(quote.lineItems.length > 0 ? quote.lineItems : [newLineItem()])
    } else {
      setTitle('')
      setCustomerId('')
      setDealId('')
      setStatus('Draft')
      const future = new Date()
      future.setDate(future.getDate() + 30)
      setValidUntil(future.toISOString().slice(0, 10))
      setTax(0)
      setNotes('')
      setTerms('Net 30')
      setLineItems([newLineItem()])
    }
  }, [open, quote])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  function updateLineItem(index: number, updates: Partial<QuoteLineItem>) {
    setLineItems((items) =>
      items.map((item, i) => {
        if (i !== index) return item
        const merged = { ...item, ...updates }
        return { ...merged, total: computeLineTotal(merged) }
      }),
    )
  }

  function addLineItem() {
    setLineItems((items) => [...items, newLineItem()])
  }

  function removeLineItem(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index))
  }

  const subtotal = lineItems.reduce((s, item) => s + item.total, 0)
  const discountAmount = lineItems.reduce((s, item) => {
    const d = item.discount ?? 0
    return s + item.quantity * item.unitPrice * (d / 100)
  }, 0)
  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * (tax / 100)
  const total = afterDiscount + taxAmount

  const selectedCustomer = customers.find((c) => c.id === customerId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: QuoteInput = {
      title,
      customerId: customerId || undefined,
      customerName: selectedCustomer
        ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
        : undefined,
      dealId: dealId || undefined,
      status,
      validUntil,
      lineItems,
      discountAmount,
      tax,
      notes: notes || undefined,
      terms: terms || undefined,
      createdBy: quote?.createdBy ?? user?.name ?? 'Unknown',
      sentAt: quote?.sentAt,
      viewedAt: quote?.viewedAt,
      acceptedAt: quote?.acceptedAt,
    }
    await onSubmit(input)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-form-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 id="quote-form-title" className="text-lg font-semibold text-slate-900">
              {isEdit ? 'Edit Quote' : 'New Quote'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {isEdit ? 'Update quote details and line items.' : 'Create a new quote or proposal.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-5" onSubmit={(e) => void handleSubmit(e)}>
          {/* Basic info */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              placeholder="Quote title"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={inputCls}
              >
                <option value="">— Select customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.company})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Related Deal (optional)
              </label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className={inputCls}
              >
                <option value="">— No deal —</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuoteStatus)}
                className={inputCls}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valid Until *</label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tax %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900">Line Items</h3>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500">
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-right font-medium w-16">Qty</th>
                    <th className="px-3 py-2 text-right font-medium w-28">Unit Price</th>
                    <th className="px-3 py-2 text-right font-medium w-16">Disc %</th>
                    <th className="px-3 py-2 text-right font-medium w-28">Total</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.map((item, i) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(i, { description: e.target.value })}
                          className="w-full rounded border border-border px-2 py-1 text-sm outline-none focus:border-brand-500"
                          placeholder="Item description"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(i, { quantity: parseInt(e.target.value) || 1 })
                          }
                          className="w-16 rounded border border-border px-2 py-1 text-sm text-right outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateLineItem(i, { unitPrice: parseFloat(e.target.value) || 0 })
                          }
                          className="w-28 rounded border border-border px-2 py-1 text-sm text-right outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.discount ?? 0}
                          onChange={(e) =>
                            updateLineItem(i, { discount: parseFloat(e.target.value) || 0 })
                          }
                          className="w-16 rounded border border-border px-2 py-1 text-sm text-right outline-none focus:border-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-slate-900">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => removeLineItem(i)}
                          disabled={lineItems.length === 1}
                          className="rounded p-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                          aria-label="Remove line item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add line item
            </button>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span className="text-red-600">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({tax}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1 font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
                placeholder="Internal or customer-facing notes…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Terms</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
                placeholder="Payment terms…"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !title || !validUntil}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
