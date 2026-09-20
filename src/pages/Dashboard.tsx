import { useNavigate } from 'react-router-dom'
import { PipelineChart } from '@/components/dashboard/PipelineChart'
import { RevenueGoal } from '@/components/dashboard/RevenueGoal'
import { StatCard } from '@/components/dashboard/StatCard'
import { SupportDashboard } from '@/components/dashboard/SupportDashboard'
import { UserRoleBadge } from '@/components/users/UserRoleBadge'
import { LiveUpdateBadge } from '@/components/common/LiveUpdateBadge'
import { useDashboard } from '@/hooks/useDashboard'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermissions } from '@/hooks/usePermissions'
import { useRealTimeRefresh } from '@/hooks/useRealTimeRefresh'
import { formatCurrency } from '@/lib/format'
import type { UserRole } from '@/types/user'

const MEMBER_ROLES: Record<string, UserRole> = {
  'Sarah Wilson': 'manager',
  'David Chen': 'sales_agent',
  'Emily Rodriguez': 'sales_agent',
}

export function DashboardPage() {
  usePageTitle('Dashboard')
  const navigate = useNavigate()
  const { isSupport } = usePermissions()

  // Support agents get a help-desk-focused dashboard
  if (isSupport) return <SupportDashboard />

  const { data, isLoading, isError, error, refetch } = useDashboard()
  useRealTimeRefresh([['customers', 'list'], ['deals', 'list'], ['tickets', 'list']] as const)

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-lg border border-border bg-slate-100"
            />
          ))}
        </div>
        <div className="h-28 animate-pulse rounded-lg border border-border bg-slate-100" />
        <div className="h-80 animate-pulse rounded-lg border border-border bg-slate-100" />
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800"
        role="alert"
      >
        <p className="font-medium">Could not load dashboard</p>
        <p className="mt-1 text-sm">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 rounded-md bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-800"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white p-10 text-center text-slate-500">
        No dashboard data yet.
      </div>
    )
  }

  const { stats, pipeline, recentActivities, recentDeals, tasksDueSoon, forecast, teamPerformance } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
        <LiveUpdateBadge />
      </div>
      {/* Stat cards — clickable, navigate to relevant pages */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total customers"
          value={String(stats.totalCustomers)}
          hint="Click to view all →"
          onClick={() => navigate('/customers')}
        />
        <StatCard
          label="New leads"
          value={String(stats.totalLeads)}
          hint="Click to view all →"
          onClick={() => navigate('/leads')}
        />
        <StatCard
          label="Open deals"
          value={String(stats.openDeals)}
          hint="Click to view pipeline →"
          onClick={() => navigate('/deals')}
        />
        <StatCard
          label="Pipeline revenue"
          value={formatCurrency(stats.totalRevenue)}
          hint="Active + negotiation deals"
        />
      </div>

      {/* Revenue Forecast */}
      <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Revenue Forecast</h2>
        <p className="mt-1 text-xs text-slate-500">
          Won deals, weighted pipeline, and best-case scenario
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
              Committed (Won)
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {formatCurrency(forecast.won)}
            </p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
              Weighted Pipeline
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-700">
              {formatCurrency(forecast.weighted)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Best Case
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-700">
              {formatCurrency(forecast.bestCase)}
            </p>
          </div>
        </div>
      </section>

      {/* Revenue Goal tracker */}
      <RevenueGoal wonRevenue={forecast.won} />

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-border bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Sales pipeline
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Deal value by stage — see Reports for full breakdown
          </p>
          <div className="mt-4">
            <PipelineChart data={pipeline} />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Tasks due soon
            </h2>
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="text-xs text-brand-600 hover:underline"
            >
              View all
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {tasksDueSoon.map((task) => (
              <li
                key={task.id}
                className="rounded-md border border-border px-3 py-2"
              >
                <p className="text-sm font-medium text-slate-800">
                  {task.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Due {task.dueDate} · {task.owner}
                </p>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="mt-4 w-full rounded-md border border-border py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Go to Tasks →
          </button>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent activities
            </h2>
            <button
              type="button"
              onClick={() => navigate('/activities')}
              className="text-xs text-brand-600 hover:underline"
            >
              View all
            </button>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {recentActivities.map((activity) => (
              <li key={activity.id} className="py-3">
                <p className="text-sm text-slate-800">{activity.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {activity.owner} ·{' '}
                  {new Date(activity.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent deals</h2>
            <button
              type="button"
              onClick={() => navigate('/deals')}
              className="text-xs text-brand-600 hover:underline"
            >
              View all
            </button>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {recentDeals.map((deal) => (
              <li key={deal.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/deals/${deal.id}`)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left hover:opacity-75"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {deal.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{deal.stage}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(deal.amount)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Team Performance */}
      {teamPerformance && teamPerformance.length > 0 ? (
        <section>
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Team Performance · This Month
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teamPerformance.map((member) => (
              <div
                key={member.name}
                className="rounded-lg border border-border bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{member.name}</p>
                    {MEMBER_ROLES[member.name] ? (
                      <UserRoleBadge role={MEMBER_ROLES[member.name]} />
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Deals Won</p>
                    <p className="mt-0.5 text-lg font-semibold text-emerald-700">{member.dealsWon}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Revenue</p>
                    <p className="mt-0.5 text-lg font-semibold text-slate-900">{formatCurrency(member.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Leads Converted</p>
                    <p className="mt-0.5 text-lg font-semibold text-slate-900">{member.leadsConverted}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Activities</p>
                    <p className="mt-0.5 text-lg font-semibold text-slate-900">{member.activitiesLogged}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
