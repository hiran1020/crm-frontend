import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Mail,
  Phone,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useUser, useUserStats } from '@/hooks/useUsers'
import { useDeals } from '@/hooks/useDeals'
import { useActivities } from '@/hooks/useActivities'
import { UserRoleBadge } from '@/components/users/UserRoleBadge'
import { ErrorState } from '@/components/common/ErrorState'
import { ActivityList } from '@/components/activities/ActivityList'
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/format'

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string | undefined
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value ?? '—'}</p>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={[
          'mt-1.5 text-2xl font-bold',
          color ?? 'text-slate-900',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-100" />
      <div className="flex items-start gap-5">
        <div className="h-24 w-24 rounded-full bg-slate-100" />
        <div className="space-y-2 pt-2">
          <div className="h-6 w-48 rounded bg-slate-100" />
          <div className="h-4 w-24 rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  )
}

export function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const userQuery = useUser(userId ?? '')
  usePageTitle(userQuery.data?.name ?? 'Team Member')

  const dealsQuery = useDeals({ pageSize: 500 })
  const activitiesQuery = useActivities()

  const user = userQuery.data
  const stats = useUserStats(user?.name ?? '')

  if (!userId) return <ErrorState message="No user ID found in URL" />
  if (userQuery.isLoading) return <PageSkeleton />
  if (userQuery.isError) return <ErrorState message="Could not load team member" />
  if (!user) return null

  const allDeals = dealsQuery.data?.data ?? []
  const allActivities = activitiesQuery.data ?? []

  const recentDeals = allDeals
    .filter((d) => d.owner === user.name)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  const recentActivities = allActivities
    .filter((a) => a.owner === user.name)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate('/team')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Team Members
      </button>

      {/* Header */}
      <div className="flex items-start gap-5">
        <div
          className={[
            'flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-3xl font-bold',
            user.role === 'admin'
              ? 'bg-purple-100 text-purple-700'
              : user.role === 'manager'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-brand-100 text-brand-700',
          ].join(' ')}
        >
          {user.avatarInitials}
        </div>
        <div className="pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-slate-900">{user.name}</h2>
            <UserRoleBadge role={user.role} />
            <span
              className={[
                'rounded-full px-2 py-0.5 text-xs font-medium',
                user.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500',
              ].join(' ')}
            >
              {user.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
          {user.jobTitle ? (
            <p className="mt-1 text-sm text-slate-500">
              {user.jobTitle}
              {user.department ? ` · ${user.department}` : ''}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: info */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Contact information</h3>
            <div className="mt-4 space-y-1">
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={Phone} label="Phone" value={user.phone} />
              <InfoRow icon={Briefcase} label="Job title" value={user.jobTitle} />
              <InfoRow icon={Building2} label="Department" value={user.department} />
              <InfoRow
                icon={Calendar}
                label="Member since"
                value={formatDate(user.createdAt)}
              />
              <InfoRow
                icon={Calendar}
                label="Last login"
                value={user.lastLoginAt ? formatRelativeDate(user.lastLoginAt) : undefined}
              />
            </div>
          </div>
        </div>

        {/* Right: stats + activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats grid */}
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Customers owned" value={String(stats.customersOwned)} />
            <StatCard label="Leads owned" value={String(stats.leadsOwned)} />
            <StatCard label="Open deals" value={String(stats.openDeals)} />
            <StatCard
              label="Deals won"
              value={String(stats.wonDeals)}
              color="text-emerald-700"
            />
            <StatCard
              label="Won revenue"
              value={formatCurrency(stats.wonRevenue)}
              color="text-emerald-700"
            />
            <StatCard
              label="Activities logged"
              value={String(stats.activitiesLogged)}
            />
          </div>

          {/* Recent activities */}
          <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Recent activities</h3>
            {activitiesQuery.isLoading ? (
              <div className="mt-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="mt-4">
                <ActivityList activities={recentActivities} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">No activities yet</p>
            )}
          </section>

          {/* Recent deals */}
          <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Recent deals</h3>
            {dealsQuery.isLoading ? (
              <div className="mt-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-slate-100" />
                ))}
              </div>
            ) : recentDeals.length > 0 ? (
              <div className="mt-4 space-y-2">
                {recentDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{deal.title}</p>
                      <p className="text-xs text-slate-500">{deal.stage}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {formatCurrency(deal.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">No deals owned</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
