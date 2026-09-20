import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useToast } from '@/components/common/ToastProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { QuoteFormModal } from '@/components/quotes/QuoteFormModal'
import { useQuotes, useCreateQuote, useDeleteQuote } from '@/hooks/useQuotes'
import { formatCurrency, formatDate } from '@/lib/format'
import type { QuoteInput, QuoteStatus } from '@/types/quote'

const STATUS_COLORS: Record<QuoteStatus, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Sent: 'bg-blue-100 text-blue-700',
  Viewed: 'bg-purple-100 text-purple-700',
  Accepted: 'bg-emerald-100 text-emerald-700',
  Declined: 'bg-red-100 text-red-700',
  Expired: 'bg-orange-100 text-orange-700',
}

export function QuotesPage() {
  usePageTitle('Quotes')
  const navigate = useNavigate()
  const { notify } = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'All'>('All')

  const quotesQuery = useQuotes()
  const createQuote = useCreateQuote()
  const deleteQuote = useDeleteQuote()

  const allQuotes = quotesQuery.data ?? []
  const filtered =
    statusFilter === 'All'
      ? allQuotes
      : allQuotes.filter((q) => q.status === statusFilter)

  const acceptedTotal = allQuotes
    .filter((q) => q.status === 'Accepted')
    .reduce((s, q) => s + q.total, 0)
  const pendingCount = allQuotes.filter(
    (q) => q.status === 'Sent' || q.status === 'Viewed',
  ).length
  const conversionRate =
    allQuotes.length > 0
      ? Math.round(
          (allQuotes.filter((q) => q.status === 'Accepted').length /
            allQuotes.length) *
            100,
        )
      : 0

  async function handleCreate(input: QuoteInput) {
    try {
      const quote = await createQuote.mutateAsync(input)
      notify('Quote created')
      setFormOpen(false)
      navigate(`/quotes/${quote.id}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create quote', 'error')
    }
  }

  if (quotesQuery.isError) {
    return (
      <ErrorState
        title="Could not load quotes"
        message={
          quotesQuery.error instanceof Error
            ? quotesQuery.error.message
            : 'Unknown error'
        }
        onRetry={() => void quotesQuery.refetch()}
      />
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Quotes &amp; Proposals</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage customer quotes and proposals.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Quote
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Accepted Value
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatCurrency(acceptedTotal)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Pending Quotes
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Conversion Rate
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{conversionRate}%</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(['All', 'Draft', 'Sent', 'Viewed', 'Accepted', 'Declined', 'Expired'] as const).map(
          (s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={[
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              {s}
            </button>
          ),
        )}
      </div>

      {/* Table */}
      {quotesQuery.isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No quotes found"
          description="Create your first quote or proposal to get started."
          actionLabel="New Quote"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-medium">Quote #</th>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Valid Until</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {quote.quoteNumber}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {quote.title}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{quote.customerName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_COLORS[quote.status],
                      ].join(' ')}
                    >
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatCurrency(quote.total)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(quote.validUntil)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/quotes/${quote.id}`)}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete quote "${quote.title}"?`)) {
                            void deleteQuote.mutateAsync(quote.id).then(() => {
                              notify('Quote deleted')
                            })
                          }
                        }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <QuoteFormModal
        open={formOpen}
        busy={createQuote.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  )
}

