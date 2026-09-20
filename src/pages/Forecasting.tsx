import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermissions } from '@/hooks/usePermissions'
import { useDeals } from '@/hooks/useDeals'
import { formatCurrency } from '@/lib/format'
import { useTheme } from '@/context/ThemeContext'
import { Shield } from 'lucide-react'
import type { Deal } from '@/types/deal'

const STAGE_PROBABILITY: Record<string, number> = {
  New: 10,
  Qualified: 30,
  Proposal: 50,
  Negotiation: 75,
  Won: 100,
  Lost: 0,
}

function getMonthLabel(monthsAgo: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsAgo)
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function buildMonthlyTrend(deals: Deal[]) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))
    return d.toISOString().slice(0, 7)
  })

  const wonByMonth = months.map((m) => ({
    label: new Date(m).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    actual: deals
      .filter((d) => d.stage === 'Won' && d.createdAt?.startsWith(m))
      .reduce((s, d) => s + d.amount, 0),
    projected: null as number | null,
  }))

  // Compute average monthly revenue from history
  const avgMonthly =
    wonByMonth.reduce((s, m) => s + m.actual, 0) / wonByMonth.length

  // Project next 3 months
  const projections = Array.from({ length: 3 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + i + 1)
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      actual: null as number | null,
      projected: Math.round(avgMonthly * (1 + (i + 1) * 0.05)),
    }
  })

  return [...wonByMonth, ...projections]
}

export function ForecastingPage() {
  usePageTitle('Forecasting')
  const permissions = usePermissions()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [sortBy, setSortBy] = useState<'weighted' | 'amount'>('weighted')

  const gridColor = isDark ? '#2d4060' : '#f1f5f9'
  const tickColor = '#64748b'
  const tooltipBg = isDark ? '#0f1f35' : '#fff'
  const tooltipBorder = isDark ? '#2d4060' : '#e2e8f0'
  const tooltipText = isDark ? '#e2e8f0' : '#0f172a'

  const { data: dealsResult } = useDeals({ pageSize: 500 })
  const deals = dealsResult?.data ?? []

  if (!permissions.canAccessReports) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-slate-300 mb-4" aria-hidden />
        <h2 className="text-lg font-semibold text-slate-900">Access restricted</h2>
        <p className="mt-1 text-sm text-slate-500">Forecasting is available to Managers and Admins.</p>
      </div>
    )
  }

  const openDeals = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')
  const wonRevenue = deals.filter((d) => d.stage === 'Won').reduce((s, d) => s + d.amount, 0)
  const weightedPipeline = openDeals.reduce(
    (s, d) => s + d.amount * ((d.probability ?? STAGE_PROBABILITY[d.stage] ?? 30) / 100),
    0,
  )

  const conservative = wonRevenue + weightedPipeline * 0.5
  const realistic = wonRevenue + weightedPipeline * 0.75
  const optimistic = wonRevenue + weightedPipeline * 0.9

  const monthlyTrend = buildMonthlyTrend(deals)

  const dealBreakdown = openDeals
    .map((d) => ({
      ...d,
      probability: d.probability ?? STAGE_PROBABILITY[d.stage] ?? 30,
      weighted: d.amount * ((d.probability ?? STAGE_PROBABILITY[d.stage] ?? 30) / 100),
    }))
    .sort((a, b) => (sortBy === 'weighted' ? b.weighted - a.weighted : b.amount - a.amount))

  const tooltipStyle = {
    backgroundColor: tooltipBg,
    border: `1px solid ${tooltipBorder}`,
    color: tooltipText,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Forecasting</h2>
        <p className="mt-1 text-sm text-slate-500">
          Revenue projections based on your current pipeline.
        </p>
      </div>

      {/* Scenarios */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Conservative', value: conservative, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', note: '50% of weighted pipeline + closed won' },
          { label: 'Realistic', value: realistic, color: 'text-brand-700', bg: 'bg-brand-50 border-brand-200', note: '75% of weighted pipeline + closed won' },
          { label: 'Optimistic', value: optimistic, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', note: '90% of weighted pipeline + closed won' },
        ].map((s) => (
          <div key={s.label} className={['rounded-lg border p-5 shadow-sm', s.bg].join(' ')}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className={['mt-2 text-2xl font-bold', s.color].join(' ')}>{formatCurrency(s.value)}</p>
            <p className="mt-1 text-xs text-slate-500">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Monthly Revenue Trend</h3>
        <p className="mb-4 text-xs text-slate-500">Historical actuals + projected (dashed)</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="label" tick={{ fill: tickColor, fontSize: 11 }} />
            <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: tickColor, fontSize: 11 }} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => [formatCurrency(value)]}
            />
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#3b82f6"
              fill="url(#actualGradient)"
              strokeWidth={2}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="projected"
              name="Projected"
              stroke="#10b981"
              fill="url(#projectedGradient)"
              strokeWidth={2}
              strokeDasharray="5 5"
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Deal Breakdown */}
      <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Open Deal Breakdown</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'weighted' | 'amount')}
              className="h-8 rounded-md border border-border bg-white px-2 text-xs text-slate-700 outline-none"
            >
              <option value="weighted">Weighted Value</option>
              <option value="amount">Deal Amount</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Deal</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Stage</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Owner</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Probability</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Weighted</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Close Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {dealBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">
                    No open deals in the pipeline.
                  </td>
                </tr>
              ) : (
                dealBreakdown.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-900 max-w-48 truncate">
                      {deal.title}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">{deal.owner}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-700">
                      {formatCurrency(deal.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">{deal.probability}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-brand-700">
                      {formatCurrency(deal.weighted)}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {deal.expectedCloseDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
