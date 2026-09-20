import { ArrowLeft, Check, Pencil, Printer, Send, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useToast } from '@/components/common/ToastProvider'
import { ErrorState } from '@/components/common/ErrorState'
import { QuoteFormModal } from '@/components/quotes/QuoteFormModal'
import { useQuote, useUpdateQuote, useDeleteQuote } from '@/hooks/useQuotes'
import { formatCurrency, formatDate } from '@/lib/format'
import { APP_NAME } from '@/constants/auth'
import type { QuoteInput, QuoteStatus } from '@/types/quote'

const STATUS_COLORS: Record<QuoteStatus, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Sent: 'bg-blue-100 text-blue-700',
  Viewed: 'bg-purple-100 text-purple-700',
  Accepted: 'bg-emerald-100 text-emerald-700',
  Declined: 'bg-red-100 text-red-700',
  Expired: 'bg-orange-100 text-orange-700',
}

export function QuoteDetailsPage() {
  const { quoteId } = useParams<{ quoteId: string }>()
  const navigate = useNavigate()
  const { notify } = useToast()
  const [editOpen, setEditOpen] = useState(false)

  const quoteQuery = useQuote(quoteId ?? '')
  const updateQuote = useUpdateQuote()
  const deleteQuote = useDeleteQuote()

  usePageTitle(quoteQuery.data ? `${quoteQuery.data.quoteNumber} - ${quoteQuery.data.title}` : 'Quote')

  if (!quoteId) return <ErrorState message="No quote ID" />

  if (quoteQuery.isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-100" />
        <div className="h-64 rounded-lg bg-slate-100" />
      </div>
    )
  }

  if (quoteQuery.isError || !quoteQuery.data) {
    return (
      <ErrorState
        title="Could not load quote"
        message={
          quoteQuery.error instanceof Error ? quoteQuery.error.message : 'Unknown error'
        }
        onRetry={() => void quoteQuery.refetch()}
      />
    )
  }

  const quote = quoteQuery.data

  async function handleEdit(input: QuoteInput) {
    try {
      await updateQuote.mutateAsync({ id: quote.id, input })
      notify('Quote updated')
      setEditOpen(false)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update', 'error')
    }
  }

  async function changeStatus(status: QuoteStatus) {
    const now = new Date().toISOString().slice(0, 10)
    try {
      await updateQuote.mutateAsync({
        id: quote.id,
        input: {
          status,
          sentAt: status === 'Sent' ? now : quote.sentAt,
          viewedAt: status === 'Viewed' ? now : quote.viewedAt,
          acceptedAt: status === 'Accepted' ? now : quote.acceptedAt,
        },
      })
      notify(`Quote marked as ${status}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update status', 'error')
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete quote "${quote.title}"? This cannot be undone.`)) return
    try {
      await deleteQuote.mutateAsync(quote.id)
      notify('Quote deleted')
      navigate('/quotes')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate('/quotes')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Quotes
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print
          </button>
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit
          </button>
          {quote.status === 'Draft' && (
            <button
              type="button"
              onClick={() => void changeStatus('Sent')}
              disabled={updateQuote.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden />
              Send Quote
            </button>
          )}
          {(quote.status === 'Sent' || quote.status === 'Viewed') && (
            <>
              <button
                type="button"
                onClick={() => void changeStatus('Accepted')}
                disabled={updateQuote.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" aria-hidden />
                Accept
              </button>
              <button
                type="button"
                onClick={() => void changeStatus('Declined')}
                disabled={updateQuote.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden />
                Decline
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Quote document */}
      <div className="rounded-lg border border-border bg-white p-8 shadow-sm print:shadow-none print:border-none">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-2xl font-bold text-slate-900">{APP_NAME}</p>
            <p className="mt-1 text-sm text-slate-500">Sales CRM Platform</p>
            <p className="text-sm text-slate-500">hello@pulsecrm.io</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">{quote.quoteNumber}</p>
            <p className="mt-1 text-sm text-slate-500">
              Date: {formatDate(quote.createdAt)}
            </p>
            <p className="text-sm text-slate-500">
              Valid Until: {formatDate(quote.validUntil)}
            </p>
            <div className="mt-2">
              <span
                className={[
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  STATUS_COLORS[quote.status],
                ].join(' ')}
              >
                {quote.status}
              </span>
            </div>
          </div>
        </div>

        {/* Customer info */}
        <div className="mb-8 rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
            Prepared For
          </p>
          <p className="text-lg font-semibold text-slate-900">{quote.customerName ?? '—'}</p>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-slate-900 mb-6">{quote.title}</h2>

        {/* Line items */}
        <div className="mb-6 overflow-x-auto rounded-lg border border-border">
          <table className="min-w-[480px] w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-medium text-slate-500">
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right w-16">Qty</th>
                <th className="px-4 py-3 text-right w-28">Unit Price</th>
                <th className="px-4 py-3 text-right w-16">Disc %</th>
                <th className="px-4 py-3 text-right w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quote.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-slate-800">{item.description}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {item.discount ? `${item.discount}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span>-{formatCurrency(quote.discountAmount)}</span>
              </div>
            )}
            {quote.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax ({quote.tax}%)</span>
                <span>
                  {formatCurrency(
                    (quote.subtotal - quote.discountAmount) * (quote.tax / 100),
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(quote.notes || quote.terms) && (
          <div className="grid gap-6 sm:grid-cols-2 border-t border-border pt-6">
            {quote.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Notes
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
            {quote.terms && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Payment Terms
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{quote.terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-border pt-4 text-xs text-slate-400 text-center">
          Created by {quote.createdBy} · {APP_NAME}
          {quote.sentAt ? ` · Sent: ${formatDate(quote.sentAt)}` : ''}
          {quote.acceptedAt ? ` · Accepted: ${formatDate(quote.acceptedAt)}` : ''}
        </div>
      </div>

      <QuoteFormModal
        open={editOpen}
        quote={quote}
        busy={updateQuote.isPending}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
      />
    </div>
  )
}
