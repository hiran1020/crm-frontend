import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useState, useMemo } from 'react'
import { Download } from 'lucide-react'
import { useDeals } from '@/hooks/useDeals'
import { useLeads } from '@/hooks/useLeads'
import { useActivities } from '@/hooks/useActivities'
import { formatCurrency } from '@/lib/format'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useTheme } from '@/context/ThemeContext'
import { downloadCsv } from '@/lib/csv'
import { TabNav } from '@/components/common/TabNav'
import type { DealStage } from '@/types/deal'

const STAGES: DealStage[] = [
  'New',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
]

const STAGE_COLORS: Record<DealStage, string> = {
  New: '#94a3b8',
  Qualified: '#3b82f6',
  Proposal: '#eab308',
  Negotiation: '#f97316',
  Won: '#10b981',
  Lost: '#ef4444',
}

const LEAD_SOURCE_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f97316',
  '#8b5cf6',
  '#eab308',
  '#ec4899',
  '#06b6d4',
]

const ACTIVITY_COLORS: Record<string, string> = {
  call: '#3b82f6',
  email: '#8b5cf6',
  meeting: '#10b981',
  note: '#94a3b8',
  task: '#f97316',
}

// Generate realistic monthly revenue data
function getMonthlyRevenue() {
  const base = [32000, 28000, 41000, 35000, 52000, 47000, 61000, 55000, 68000, 72000, 65000, 89000]
  const months = [
    'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar',
    'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
  ]
  return months.map((month, i) => ({ month, revenue: base[i] }))
}

const monthlyData = getMonthlyRevenue()

type DatePreset = 'all' | '7d' | '30d' | '90d' | 'ytd' | 'custom'
type ReportTab = 'pipeline' | 'revenue' | 'activity'

function getPresetRange(preset: DatePreset): { from: string; to: string } | null {
  if (preset === 'all' || preset === 'custom') return null
  const now = new Date()
  const to = now.toISOString().slice(0, 10)
  let from: string
  switch (preset) {
    case '7d': from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10); break
    case '30d': from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10); break
    case '90d': from = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10); break
    case 'ytd': from = `${now.getFullYear()}-01-01`; break
    default: return null
  }
  return { from, to }
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={['mt-2 text-2xl font-bold', color ?? 'text-slate-900'].join(' ')}>{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-400">{sub}</p> : null}
    </div>
  )
}

function SkeletonCard() {
  return <div className="h-28 animate-pulse rounded-lg border border-border bg-slate-100" />
}

export function ReportsPage() {
  usePageTitle('Reports')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [activeTab, setActiveTab] = useState<ReportTab>('pipeline')
  const [preset, setPreset] = useState<DatePreset>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Adaptive colors for Recharts (can't use CSS classes inside SVG)
  const gridColor   = isDark ? '#2d4060' : '#f1f5f9'
  const tickColor   = isDark ? '#64748b' : '#64748b'
  const tooltipBg   = isDark ? '#0f1f35' : '#fff'
  const tooltipBorder = isDark ? '#2d4060' : '#e2e8f0'
  const tooltipText = isDark ? '#e2e8f0' : '#0f172a'
  const tooltipStyle = { backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, color: tooltipText, borderRadius: '6px' }

  const dealsQuery = useDeals({ pageSize: 500 })
  const leadsQuery = useLeads({ pageSize: 500 })
  const activitiesQuery = useActivities()

  const allDeals = dealsQuery.data?.data ?? []
  const allLeads = leadsQuery.data?.data ?? []
  const allActivities = activitiesQuery.data ?? []

  const isLoading = dealsQuery.isLoading || leadsQuery.isLoading

  // Resolve date range
  const dateRange = useMemo(() => {
    if (preset === 'custom') {
      return customFrom && customTo ? { from: customFrom, to: customTo } : null
    }
    return getPresetRange(preset)
  }, [preset, customFrom, customTo])

  // Filter deals and leads by date range
  const deals = useMemo(() => {
    if (!dateRange) return allDeals
    return allDeals.filter(
      (d) => d.createdAt >= dateRange.from && d.createdAt <= dateRange.to,
    )
  }, [allDeals, dateRange])

  const leads = useMemo(() => {
    if (!dateRange) return allLeads
    return allLeads.filter(
      (l) => l.createdAt >= dateRange.from && l.createdAt <= dateRange.to,
    )
  }, [allLeads, dateRange])

  const activities = useMemo(() => {
    if (!dateRange) return allActivities
    return allActivities.filter(
      (a) => (a.createdAt ?? '') >= dateRange.from && (a.createdAt ?? '') <= dateRange.to,
    )
  }, [allActivities, dateRange])

  // Derived data
  const wonDeals = deals.filter((d) => d.stage === 'Won')
  const lostDeals = deals.filter((d) => d.stage === 'Lost')
  const activeDeals = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost')

  const wonRevenue = wonDeals.reduce((s, d) => s + d.amount, 0)
  const lostValue = lostDeals.reduce((s, d) => s + d.amount, 0)
  const totalDeals = deals.length
  const avgDealSize = totalDeals > 0 ? deals.reduce((s, d) => s + d.amount, 0) / totalDeals : 0
  const winRate =
    wonDeals.length + lostDeals.length > 0
      ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
      : 0

  const pipelineData = STAGES.map((stage) => ({
    stage,
    count: deals.filter((d) => d.stage === stage).length,
    value: deals.filter((d) => d.stage === stage).reduce((s, d) => s + d.amount, 0),
  }))

  const wonDealVelocity = wonDeals
    .filter((d) => d.createdAt)
    .map((d) =>
      Math.floor(
        (new Date(d.expectedCloseDate).getTime() - new Date(d.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    )
  const avgVelocity =
    wonDealVelocity.length > 0
      ? Math.round(wonDealVelocity.reduce((s, d) => s + d, 0) / wonDealVelocity.length)
      : 0

  const leadSourceData = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.source] = (acc[l.source] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  // Activity report data
  const actByDay = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const dateStr = d.toISOString().slice(0, 10)
      return {
        date: dateStr.slice(5),
        count: allActivities.filter((a) => (a.createdAt ?? '').startsWith(dateStr)).length,
      }
    })
  }, [allActivities])

  const actByType = useMemo(() => Object.entries(
    allActivities.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1
      return acc
    }, {}),
  ).map(([type, count]) => ({ type, count })), [allActivities])

  const topOwners = useMemo(() => {
    const ownerMap = allActivities.reduce<Record<string, number>>((acc, a) => {
      acc[a.owner] = (acc[a.owner] ?? 0) + 1
      return acc
    }, {})
    return Object.entries(ownerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([owner, count]) => ({ owner, count }))
  }, [allActivities])

  function handleExport() {
    const rows = [
      { metric: 'Won Revenue', value: formatCurrency(wonRevenue) },
      { metric: 'Win Rate', value: `${winRate.toFixed(1)}%` },
      { metric: 'Avg Deal Size', value: formatCurrency(avgDealSize) },
      { metric: 'Active Deals', value: String(activeDeals.length) },
      { metric: 'Avg Deal Velocity (days)', value: String(avgVelocity) },
      ...pipelineData.map((p) => ({
        metric: `Pipeline - ${p.stage}`,
        value: `${p.count} deals / ${formatCurrency(p.value)}`,
      })),
    ]
    downloadCsv(rows, 'crm-report.csv')
  }

  const PRESET_LABEL: Record<DatePreset, string> = {
    all: 'All time',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    ytd: 'Year to date',
    custom: 'Custom range',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Reports</h2>
          <p className="mt-1 text-sm text-slate-500">
            Visual insights into your sales pipeline and performance.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" aria-hidden />
          Export Report
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as DatePreset)}
          className="h-9 rounded-md border border-border bg-white px-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          {(Object.keys(PRESET_LABEL) as DatePreset[]).map((p) => (
            <option key={p} value={p}>{PRESET_LABEL[p]}</option>
          ))}
        </select>
        {preset === 'custom' && (
          <>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 rounded-md border border-border bg-white px-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 rounded-md border border-border bg-white px-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </>
        )}
        {preset !== 'all' && (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Filtered to: {PRESET_LABEL[preset]}
          </span>
        )}
      </div>

      {/* Tabs */}
      <TabNav
        tabs={[
          { id: 'pipeline', label: 'Pipeline' },
          { id: 'revenue', label: 'Revenue' },
          { id: 'activity', label: 'Activity Report' },
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as ReportTab)}
      />

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <KpiCard label="Won Revenue" value={formatCurrency(wonRevenue)} sub={`${wonDeals.length} deals closed`} color="text-emerald-700" />
                <KpiCard label="Win Rate" value={`${winRate.toFixed(1)}%`} sub={`${wonDeals.length}W / ${lostDeals.length}L`} />
                <KpiCard label="Avg Deal Size" value={formatCurrency(avgDealSize)} sub={`Across ${totalDeals} deals`} />
                <KpiCard label="Active Deals" value={String(activeDeals.length)} sub="Excluding Won & Lost" />
                <KpiCard label="Avg Deal Velocity" value={`${avgVelocity} days`} sub="Avg days from create to close" />
              </>
            )}
          </div>

          {/* Pipeline Overview */}
          <ChartCard title="Sales Pipeline Overview" subtitle="Deal count and total value by stage">
            {isLoading ? (
              <div className="h-72 animate-pulse rounded bg-slate-100" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="stage" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} width={30} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => name === 'value' ? [formatCurrency(value), 'Value'] : [value, 'Count']} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" name="Count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {pipelineData.map((entry) => (
                      <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage as DealStage]} />
                    ))}
                  </Bar>
                  <Bar yAxisId="right" dataKey="value" name="Value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Lead Sources" subtitle="Lead count by acquisition channel">
              {isLoading ? (
                <div className="h-64 animate-pulse rounded bg-slate-100" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={leadSourceData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {leadSourceData.map((_entry, index) => (
                        <Cell key={index} fill={LEAD_SOURCE_COLORS[index % LEAD_SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Stage Funnel" subtitle="Deals by current stage">
              <div className="space-y-1">
                {STAGES.filter((s) => s !== 'Won' && s !== 'Lost').map((stage) => {
                  const count = deals.filter((d) => d.stage === stage).length
                  const pct = deals.length > 0 ? (count / deals.length) * 100 : 0
                  return (
                    <div key={stage} className="flex items-center gap-3 py-1.5">
                      <span className="w-24 text-right text-xs text-slate-500">{stage}</span>
                      <div className="flex-1 rounded-full bg-slate-100 h-5">
                        <div className="h-5 rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right text-xs font-medium text-slate-700">{count}</span>
                    </div>
                  )
                })}
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Won vs Lost" subtitle="Outcome breakdown">
              <div className="grid grid-cols-2 gap-6 py-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{wonDeals.length}</p>
                  <p className="mt-1 text-sm text-slate-500">Won Deals</p>
                  <p className="text-xs text-slate-400">{formatCurrency(wonRevenue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">{lostDeals.length}</p>
                  <p className="mt-1 text-sm text-slate-500">Lost Deals</p>
                  <p className="text-xs text-slate-400">{formatCurrency(lostValue)}</p>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Average Deal Velocity" subtitle="Days from deal creation to close (Won deals only)">
              {isLoading ? (
                <div className="h-20 animate-pulse rounded bg-slate-100" />
              ) : wonDeals.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No won deals to compute velocity</p>
              ) : (
                <div className="flex items-center gap-6 py-4">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-brand-600">{avgVelocity}</p>
                    <p className="mt-1 text-sm text-slate-500">Average days to close</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-slate-500">
                      Based on {wonDeals.length} closed deal{wonDeals.length !== 1 ? 's' : ''}.{' '}
                      Fastest: {Math.min(...wonDealVelocity)} days · Slowest: {Math.max(...wonDealVelocity)} days.
                    </p>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.min(100, (avgVelocity / 180) * 100)}%` }} />
                    </div>
                    <p className="text-xs text-slate-400">Relative to 180-day benchmark</p>
                  </div>
                </div>
              )}
            </ChartCard>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <ChartCard title="Monthly Revenue" subtitle="Trailing 12 months of won deal revenue">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} width={48} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Won Revenue" value={formatCurrency(wonRevenue)} sub={`${wonDeals.length} deals`} color="text-emerald-700" />
            <KpiCard label="Win Rate" value={`${winRate.toFixed(1)}%`} />
            <KpiCard label="Avg Deal Size" value={formatCurrency(avgDealSize)} />
            <KpiCard label="Avg Velocity" value={`${avgVelocity}d`} />
          </div>
        </div>
      )}

      {/* Activity Report Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <ChartCard title="Activities Per Day" subtitle="Last 30 days">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={actByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 11 }} interval={6} />
                <YAxis tick={{ fill: tickColor, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Activities" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Activities by Type" subtitle="Breakdown by activity type">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={actByType} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" tick={{ fill: tickColor, fontSize: 12 }} />
                  <YAxis type="category" dataKey="type" tick={{ fill: tickColor, fontSize: 12 }} width={60} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                    {actByType.map((entry, i) => (
                      <Cell key={i} fill={ACTIVITY_COLORS[entry.type] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top 5 Most Active Owners" subtitle="By activities logged">
              <div className="space-y-3 py-2">
                {topOwners.length === 0 ? (
                  <p className="text-center text-sm text-slate-400">No activity data</p>
                ) : topOwners.map((owner, i) => {
                  const max = topOwners[0].count
                  const pct = max > 0 ? (owner.count / max) * 100 : 0
                  return (
                    <div key={owner.owner} className="flex items-center gap-3">
                      <span className={[
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600',
                      ].join(' ')}>
                        {i + 1}
                      </span>
                      <span className="w-28 shrink-0 text-xs text-slate-700 truncate">{owner.owner}</span>
                      <div className="flex-1 h-5 rounded-md bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-md bg-purple-400 flex items-center px-1.5 text-[10px] font-semibold text-white"
                          style={{ width: `${pct}%` }}
                        >
                          {owner.count}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  )
}
