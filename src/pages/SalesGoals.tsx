import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useToast } from '@/components/common/ToastProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { useGoals, useCreateGoal, useDeleteGoal } from '@/hooks/useGoals'
import { useUsers } from '@/hooks/useUsers'
import { formatCurrency } from '@/lib/format'
import type { SalesGoal, GoalMetric, GoalPeriod } from '@/types/salesGoal'

const METRIC_LABELS: Record<GoalMetric, string> = {
  revenue: 'Revenue',
  deals_won: 'Deals Won',
  leads_converted: 'Leads Converted',
  activities: 'Activities',
}

const PERIOD_LABELS: Record<GoalPeriod, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
}

function formatGoalValue(metric: GoalMetric, value: number): string {
  if (metric === 'revenue') return formatCurrency(value)
  return String(value)
}

function periodLabel(goal: SalesGoal): string {
  const now = new Date()
  if (goal.period === 'annual') return `Annual ${goal.year}`
  if (goal.period === 'quarterly') return `Q${goal.quarter ?? ''} ${goal.year}`
  const monthName = new Date(goal.year, (goal.month ?? now.getMonth() + 1) - 1).toLocaleDateString(
    'en-US',
    { month: 'short' },
  )
  return `${monthName} ${goal.year}`
}

interface NewGoalFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: Omit<SalesGoal, 'id' | 'createdAt' | 'current'>) => Promise<void>
  busy: boolean
}

function NewGoalModal({ open, onClose, onSubmit, busy }: NewGoalFormProps) {
  const now = new Date()
  const [name, setName] = useState('')
  const [metric, setMetric] = useState<GoalMetric>('revenue')
  const [target, setTarget] = useState(0)
  const [period, setPeriod] = useState<GoalPeriod>('monthly')
  const [owner, setOwner] = useState<string>('')
  const { data: users = [] } = useUsers()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const quarter = Math.ceil(month / 3)

  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const inputCls = 'h-9 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">New Sales Goal</h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void onSubmit({
              name,
              metric,
              target,
              period,
              year,
              quarter: period === 'quarterly' ? quarter : undefined,
              month: period === 'monthly' ? month : undefined,
              owner,
            })
          }}
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Goal Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Q4 Revenue Target" autoFocus />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Metric</label>
              <select value={metric} onChange={(e) => setMetric(e.target.value as GoalMetric)} className={inputCls}>
                {(Object.keys(METRIC_LABELS) as GoalMetric[]).map((m) => (
                  <option key={m} value={m}>{METRIC_LABELS[m]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target *</label>
              <input required type="number" min={1} value={target} onChange={(e) => setTarget(parseFloat(e.target.value) || 0)} className={inputCls} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value as GoalPeriod)} className={inputCls}>
                {(Object.keys(PERIOD_LABELS) as GoalPeriod[]).map((p) => (
                  <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Owner</label>
              <select value={owner} onChange={(e) => setOwner(e.target.value)} className={inputCls}>
                <option value="all">All Team</option>
                {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy || !name || target <= 0} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {busy ? 'Creating…' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function SalesGoalsPage() {
  usePageTitle('Sales Goals')
  const { notify } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'team' | 'individual'>('team')

  const goalsQuery = useGoals()
  const createGoal = useCreateGoal()
  const deleteGoal = useDeleteGoal()

  const allGoals = goalsQuery.data ?? []
  const goals =
    viewMode === 'team'
      ? allGoals.filter((g) => g.owner === 'all')
      : allGoals.filter((g) => g.owner !== 'all')

  async function handleCreate(input: Omit<SalesGoal, 'id' | 'createdAt' | 'current'>) {
    try {
      await createGoal.mutateAsync(input)
      notify('Goal created')
      setFormOpen(false)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create goal', 'error')
    }
  }

  if (goalsQuery.isError) {
    return (
      <ErrorState
        title="Could not load goals"
        message={goalsQuery.error instanceof Error ? goalsQuery.error.message : 'Unknown error'}
        onRetry={() => void goalsQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Sales Goals</h2>
          <p className="mt-1 text-sm text-slate-500">
            Track progress toward team and individual sales targets.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Goal
        </button>
      </div>

      {/* Toggle */}
      <div className="inline-flex rounded-lg border border-border bg-slate-50 p-1">
        {(['team', 'individual'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={[
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize',
              viewMode === mode
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Goals grid */}
      {goalsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-slate-100" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description={`No ${viewMode} goals have been created yet. Add one to start tracking progress.`}
          actionLabel="New Goal"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0
            const color =
              pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            const textColor =
              pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'
            return (
              <div key={goal.id} className="rounded-lg border border-border bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{goal.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {METRIC_LABELS[goal.metric]} · {periodLabel(goal)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {goal.owner === 'all' ? 'All Team' : goal.owner}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete goal "${goal.name}"?`)) {
                        void deleteGoal.mutateAsync(goal.id).then(() => notify('Goal deleted'))
                      }
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete goal"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className={['font-semibold', textColor].join(' ')}>
                      {formatGoalValue(goal.metric, goal.current)}
                    </span>
                    <span className="text-slate-500">
                      of {formatGoalValue(goal.metric, goal.target)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={['h-full rounded-full transition-all', color].join(' ')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className={['mt-1 text-xs font-medium text-right', textColor].join(' ')}>
                    {pct}%
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <NewGoalModal
        open={formOpen}
        busy={createGoal.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  )
}
