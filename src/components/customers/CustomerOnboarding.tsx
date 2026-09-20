import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { useOnboarding, useStartOnboarding, useUpdateOnboardingStep } from '@/hooks/useOnboarding'
import { formatDate } from '@/lib/format'
import type { OnboardingStepStatus } from '@/types/onboarding'

interface Props {
  customerId: string
}

const STATUS_LABELS: Record<OnboardingStepStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  skipped: 'Skipped',
}

function nextStatus(current: OnboardingStepStatus): OnboardingStepStatus {
  if (current === 'pending') return 'in_progress'
  if (current === 'in_progress') return 'completed'
  if (current === 'completed') return 'pending'
  return 'pending'
}

export function CustomerOnboarding({ customerId }: Props) {
  const planQuery = useOnboarding(customerId)
  const startOnboarding = useStartOnboarding()
  const updateStep = useUpdateOnboardingStep()

  const plan = planQuery.data

  if (planQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm animate-pulse">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded bg-slate-100" />
          ))}
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="text-sm text-slate-500">
            No onboarding plan has been started for this customer.
          </p>
          <button
            type="button"
            disabled={startOnboarding.isPending}
            onClick={() => void startOnboarding.mutateAsync(customerId)}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {startOnboarding.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Start Onboarding
          </button>
        </div>
      </div>
    )
  }

  const completedCount = plan.steps.filter(
    (s) => s.status === 'completed' || s.status === 'skipped',
  ).length
  const totalCount = plan.steps.length
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-900">{plan.templateName}</h3>
          <span
            className={[
              'rounded-full px-2 py-0.5 text-xs font-medium',
              plan.status === 'completed'
                ? 'bg-emerald-100 text-emerald-700'
                : plan.status === 'paused'
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-blue-100 text-blue-700',
            ].join(' ')}
          >
            {plan.status === 'active'
              ? 'In Progress'
              : plan.status === 'completed'
                ? 'Completed'
                : 'Paused'}
          </span>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 shrink-0">
            {completedCount} of {totalCount} steps
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Target: {formatDate(plan.targetCompletionDate)}
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {[...plan.steps]
          .sort((a, b) => a.order - b.order)
          .map((step) => {
            const isDone = step.status === 'completed'
            const isInProgress = step.status === 'in_progress'
            const isBusy = updateStep.isPending && updateStep.variables?.stepId === step.id

            return (
              <div
                key={step.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    void updateStep.mutateAsync({
                      planId: plan.id,
                      stepId: step.id,
                      status: nextStatus(step.status),
                      customerId,
                    })
                  }
                  className="mt-0.5 shrink-0 text-slate-400 hover:text-brand-600 disabled:opacity-50"
                  aria-label={`Toggle step: ${step.title}`}
                >
                  {isBusy ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : isInProgress ? (
                    <Circle className="h-5 w-5 text-blue-500 fill-blue-100" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={[
                        'text-sm font-medium',
                        isDone ? 'line-through text-slate-400' : 'text-slate-800',
                      ].join(' ')}
                    >
                      {step.title}
                    </p>
                    <span
                      className={[
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                        isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : isInProgress
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-500',
                      ].join(' ')}
                    >
                      {STATUS_LABELS[step.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    {step.assignedTo ? (
                      <span>Assigned to: {step.assignedTo}</span>
                    ) : null}
                    {step.dueDate ? (
                      <span>Due: {formatDate(step.dueDate)}</span>
                    ) : null}
                    {step.completedAt ? (
                      <span>Completed: {formatDate(step.completedAt)}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
