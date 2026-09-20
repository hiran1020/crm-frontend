import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useDeals } from '@/hooks/useDeals'
import { useLeads } from '@/hooks/useLeads'
import { useActivities } from '@/hooks/useActivities'
import { formatCurrency } from '@/lib/format'
import { TabNav } from '@/components/common/TabNav'
import { useTheme } from '@/context/ThemeContext'

const TEAM_MEMBERS = ['Sarah Wilson', 'David Chen', 'Emily Rodriguez', 'Admin User']

const ACTIVITY_HEATMAP_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17]
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function generateHeatmap() {
  return WEEKDAYS.map((day) => ({
    day,
    ...Object.fromEntries(
      ACTIVITY_HEATMAP_HOURS.map((h) => [
        `h${h}`,
        Math.floor(Math.random() * 8) + (h >= 10 && h <= 14 ? 4 : 0),
      ]),
    ),
  }))
}

const HEATMAP_DATA = generateHeatmap()

const TABS = ['overview', 'pipeline', 'activities', 'team'] as const
type TabId = (typeof TABS)[number]

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  pipeline: 'Pipeline',
  activities: 'Activities',
  team: 'Team',
}

export function AnalyticsPage() {
  usePageTitle('Analytics')
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [tab, setTab] = useState<TabId>('overview')

  const gridColor = isDark ? '#2d4060' : '#f1f5f9'
  const tickColor = isDark ? '#64748b' : '#64748b'
  const tooltipBg = isDark ? '#0f1f35' : '#fff'
  const tooltipBorder = isDark ? '#2d4060' : '#e2e8f0'
  const tooltipText = isDark ? '#e2e8f0' : '#0f172a'

  const { data: dealsResult } = useDeals({ pageSize: 500 })
  const { data: leadsResult } = useLeads({ pageSize: 500 })
  const { data: activitiesData } = useActivities()

  const deals = dealsResult?.data ?? []
  const leads = leadsResult?.data ?? []
  const activities = activitiesData ?? []

  const wonDeals = deals.filter((d) => d.stage === 'Won')
  const lostDeals = deals.filter((d) => d.stage === 'Lost')

  // Conversion funnel
  const totalLeads = leads.length
  const contacted = leads.filter((l) => l.status !== 'New').length
  const qualified = leads.filter((l) => l.status === 'Qualified' || l.status === 'Converted').length
  const converted = leads.filter((l) => l.status === 'Converted').length
  const wonCount = wonDeals.length

  const funnelData = [
    { label: 'Total Leads', value: totalLeads, color: '#3b82f6' },
    { label: 'Contacted', value: contacted, color: '#8b5cf6' },
    { label: 'Qualified', value: qualified, color: '#f97316' },
    { label: 'Converted', value: converted, color: '#10b981' },
    { label: 'Won Deal', value: wonCount, color: '#059669' },
  ]

  // MoM mock deltas
  const momMetrics = [
    { label: 'New Leads', value: totalLeads, delta: '+12%', positive: true },
    { label: 'Won Deals', value: wonCount, delta: '+8%', positive: true },
    { label: 'Revenue', value: wonDeals.reduce((s, d) => s + d.amount, 0), delta: '+23%', positive: true, isCurrency: true },
    { label: 'Lost Deals', value: lostDeals.length, delta: '-5%', positive: true },
  ]

  // Pipeline: deal age by stage
  const stageAgeData = ['New', 'Qualified', 'Proposal', 'Negotiation'].map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage)
    const avgAge = stageDeals.length > 0
      ? Math.round(
          stageDeals.reduce(
            (s, d) => s + Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86400000),
            0,
          ) / stageDeals.length,
        )
      : 0
    return { stage, avgDays: avgAge, count: stageDeals.length }
  })

  // Close rate by source
  const sourceCloseRate = Object.entries(
    leads.reduce<Record<string, { total: number; converted: number }>>((acc, l) => {
      if (!acc[l.source]) acc[l.source] = { total: 0, converted: 0 }
      acc[l.source].total += 1
      if (l.status === 'Converted') acc[l.source].converted += 1
      return acc
    }, {}),
  ).map(([source, { total, converted: conv }]) => ({
    source,
    rate: Math.round((conv / total) * 100),
  }))

  // Activities by type
  const actByType = Object.entries(
    activities.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1
      return acc
    }, {}),
  ).map(([type, count]) => ({ type, count }))

  // Activities per day (last 14 days)
  const now = new Date()
  const actByDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (13 - i))
    const dateStr = d.toISOString().slice(0, 10)
    return {
      date: dateStr.slice(5),
      count: activities.filter((a) => a.createdAt?.slice(0, 10) === dateStr).length,
    }
  })

  // Team leaderboard
  const teamStats = TEAM_MEMBERS.map((name) => ({
    name,
    dealsWon: wonDeals.filter((d) => d.owner === name).length,
    revenue: wonDeals.filter((d) => d.owner === name).reduce((s, d) => s + d.amount, 0),
    leadsConverted: leads.filter((l) => l.owner === name && l.status === 'Converted').length,
    activities: activities.filter((a) => a.owner === name).length,
  })).sort((a, b) => b.dealsWon - a.dealsWon)

  const tooltipStyle = { backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, color: tooltipText }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Analytics</h2>
        <p className="mt-1 text-sm text-slate-500">
          Deep insights into your sales performance and team activity.
        </p>
      </div>

      <TabNav
        tabs={TABS.map((t) => ({ id: t, label: TAB_LABELS[t] }))}
        activeTab={tab}
        onChange={(t) => setTab(t as TabId)}
      />

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Conversion Funnel */}
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Conversion Funnel</h3>
            <div className="space-y-2">
              {funnelData.map((item, i) => {
                const pct = funnelData[0].value > 0
                  ? Math.round((item.value / funnelData[0].value) * 100)
                  : 0
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs text-slate-600">{item.label}</span>
                    <div className="flex-1 h-7 rounded-md bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-md flex items-center px-2 text-xs font-semibold text-white transition-all"
                        style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: item.color }}
                      >
                        {item.value}
                      </div>
                    </div>
                    <span className="w-10 shrink-0 text-xs text-slate-500 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* MoM Comparison */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {momMetrics.map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {m.isCurrency ? formatCurrency(m.value) : m.value}
                </p>
                <span
                  className={[
                    'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold',
                    m.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
                  ].join(' ')}
                >
                  {m.delta} vs last month
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Tab */}
      {tab === 'pipeline' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Average Deal Age by Stage (days)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageAgeData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="stage" tick={{ fill: tickColor, fontSize: 12 }} />
                <YAxis tick={{ fill: tickColor, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avgDays" name="Avg Days" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Close Rate by Lead Source (%)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sourceCloseRate} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="source" tick={{ fill: tickColor, fontSize: 11 }} />
                <YAxis tick={{ fill: tickColor, fontSize: 12 }} unit="%" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="rate" name="Close Rate %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Activities Tab */}
      {tab === 'activities' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Activity Volume (last 14 days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={actByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 11 }} />
                <YAxis tick={{ fill: tickColor, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Activities" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Activities by Type</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={actByType}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                    labelLine={false}
                  >
                    {actByType.map((_, i) => (
                      <Cell
                        key={i}
                        fill={['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#eab308'][i % 5]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Activity Heatmap (busiest times)</h3>
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr>
                      <th className="text-left font-medium text-slate-500 pr-2">Day</th>
                      {ACTIVITY_HEATMAP_HOURS.map((h) => (
                        <th key={h} className="text-center font-medium text-slate-500 px-1">{h}h</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HEATMAP_DATA.map((row) => (
                      <tr key={row.day}>
                        <td className="py-0.5 pr-2 font-medium text-slate-600">{row.day}</td>
                        {ACTIVITY_HEATMAP_HOURS.map((h) => {
                          const val = (row as Record<string, unknown>)[`h${h}`] as number
                          const intensity = Math.min(val / 10, 1)
                          return (
                            <td key={h} className="px-1 py-0.5 text-center">
                              <div
                                className="mx-auto h-5 w-5 rounded"
                                style={{
                                  backgroundColor: `rgba(99, 102, 241, ${intensity})`,
                                }}
                                title={`${val} activities`}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Tab */}
      {tab === 'team' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
            <div className="border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Team Leaderboard</h3>
            </div>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Rank</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Deals Won</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Revenue</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Leads Converted</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Activities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {teamStats.map((member, i) => (
                  <tr key={member.name} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span className={[
                        'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                          i === 1 ? 'bg-slate-100 text-slate-600' :
                            'bg-orange-50 text-orange-600',
                      ].join(' ')}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                          {member.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-slate-700">{member.dealsWon}</td>
                    <td className="px-5 py-3 text-right text-sm font-medium text-slate-900">{formatCurrency(member.revenue)}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-700">{member.leadsConverted}</td>
                    <td className="px-5 py-3 text-right text-sm text-slate-700">{member.activities}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Team Performance Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={[
                  { month: 'Apr', 'Sarah Wilson': 4, 'David Chen': 2, 'Emily Rodriguez': 3 },
                  { month: 'May', 'Sarah Wilson': 5, 'David Chen': 3, 'Emily Rodriguez': 2 },
                  { month: 'Jun', 'Sarah Wilson': 3, 'David Chen': 4, 'Emily Rodriguez': 4 },
                  { month: 'Jul', 'Sarah Wilson': 6, 'David Chen': 3, 'Emily Rodriguez': 5 },
                  { month: 'Aug', 'Sarah Wilson': 4, 'David Chen': 5, 'Emily Rodriguez': 3 },
                  { month: 'Sep', 'Sarah Wilson': 5, 'David Chen': 4, 'Emily Rodriguez': 4 },
                ]}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 12 }} />
                <YAxis tick={{ fill: tickColor, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="Sarah Wilson" stroke="#3b82f6" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="David Chen" stroke="#10b981" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="Emily Rodriguez" stroke="#f97316" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
