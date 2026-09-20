import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Customer } from '@/types/customer'
import type { Lead } from '@/types/lead'
import type { Deal } from '@/types/deal'

type EntityType = 'customer' | 'lead' | 'deal'

/** Action keys — parent maps these to real handlers */
export type InsightActionKey =
  | 'log_call'
  | 'log_meeting'
  | 'log_email'
  | 'log_note'
  | 'send_email'
  | 'create_quote'
  | 'view_activities'

interface Insight {
  icon: typeof Flame
  headline: string
  explanation: string
  actionLabel: string
  actionKey: InsightActionKey
  color: string
}

/* ── Insight generators ────────────────────────────────────────────────── */

function getCustomerInsights(customer: Customer): Insight[] {
  const insights: Insight[] = []

  if (customer.status === 'Active') {
    insights.push({
      icon: TrendingUp,
      headline: 'Upsell opportunity',
      explanation:
        "This customer's engagement level suggests they may be open to premium features or additional services.",
      actionLabel: 'Schedule discovery call',
      actionKey: 'log_call',
      color: 'emerald',
    })
  }

  if (customer.tags?.includes('VIP') || customer.tags?.includes('Enterprise')) {
    insights.push({
      icon: Target,
      headline: 'High-value account',
      explanation:
        'This is a VIP account. Prioritize regular check-ins and personalized outreach to maintain the relationship.',
      actionLabel: 'Schedule QBR',
      actionKey: 'log_meeting',
      color: 'purple',
    })
  }

  if (customer.status === 'Inactive') {
    insights.push({
      icon: AlertTriangle,
      headline: 'Re-engagement recommended',
      explanation:
        'This customer has been inactive. A win-back campaign or personal outreach could restore the relationship.',
      actionLabel: 'Send re-engagement email',
      actionKey: 'send_email',
      color: 'amber',
    })
  }

  if (insights.length === 0) {
    insights.push({
      icon: Flame,
      headline: 'Build stronger connection',
      explanation:
        'Log a recent interaction to keep this customer record fresh and improve relationship tracking.',
      actionLabel: 'Log activity',
      actionKey: 'log_call',
      color: 'blue',
    })
  }

  return insights.slice(0, 3)
}

function getLeadInsights(lead: Lead): Insight[] {
  const insights: Insight[] = []

  if (lead.status === 'Qualified') {
    insights.push({
      icon: Flame,
      headline: 'Hot lead — recommend immediate follow-up',
      explanation: `Score 85/100. This lead is qualified and ready for proposal stage. Acting quickly increases close probability by 3×.`,
      actionLabel: 'Create proposal',
      actionKey: 'create_quote',
      color: 'orange',
    })
  }

  if (lead.value > 50000) {
    insights.push({
      icon: Target,
      headline: 'High-value opportunity',
      explanation: `This lead represents a ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(lead.value)} opportunity. Consider involving a senior rep.`,
      actionLabel: 'Log note for team',
      actionKey: 'log_note',
      color: 'purple',
    })
  }

  if (lead.status === 'New') {
    insights.push({
      icon: AlertTriangle,
      headline: 'New lead — first contact within 24 h',
      explanation:
        'New leads contacted within 24 hours are 7× more likely to convert. Schedule a first touch soon.',
      actionLabel: 'Schedule first call',
      actionKey: 'log_call',
      color: 'amber',
    })
  }

  if (lead.status === 'Lost') {
    insights.push({
      icon: TrendingUp,
      headline: 'Consider re-engagement',
      explanation:
        'Lost leads sometimes become customers 6–12 months later. A light-touch check-in could reopen this opportunity.',
      actionLabel: 'Send check-in email',
      actionKey: 'send_email',
      color: 'blue',
    })
  }

  if (lead.status === 'Contacted') {
    insights.push({
      icon: Flame,
      headline: 'Move to Qualified',
      explanation:
        'You\'ve made contact — now is the time to qualify this lead. Log the call outcome and update the status.',
      actionLabel: 'Log call outcome',
      actionKey: 'log_call',
      color: 'blue',
    })
  }

  if (insights.length === 0) {
    insights.push({
      icon: Flame,
      headline: 'Keep momentum',
      explanation:
        'Log your next planned action to keep this lead progressing through the pipeline.',
      actionLabel: 'Log activity',
      actionKey: 'log_call',
      color: 'blue',
    })
  }

  return insights.slice(0, 3)
}

function getDealInsights(deal: Deal): Insight[] {
  const insights: Insight[] = []

  const createdDaysAgo = Math.floor(
    (Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  )

  const stageAvgDays: Record<string, number> = {
    New: 7,
    Qualified: 14,
    Proposal: 21,
    Negotiation: 18,
  }

  const avgDays = stageAvgDays[deal.stage]

  if (avgDays && createdDaysAgo > avgDays * 1.5) {
    insights.push({
      icon: AlertTriangle,
      headline: `At risk — deal aging in ${deal.stage}`,
      explanation: `This deal has been in ${deal.stage} for ${createdDaysAgo} days (avg ${avgDays} days). Consider escalating or re-engaging.`,
      actionLabel: 'Schedule follow-up',
      actionKey: 'log_call',
      color: 'red',
    })
  }

  if (deal.stage === 'Negotiation') {
    insights.push({
      icon: Target,
      headline: 'Negotiation stage — close it',
      explanation:
        'Deals in negotiation with a clear next step close 40% faster. Ensure you have a defined next meeting.',
      actionLabel: 'Book closing call',
      actionKey: 'log_meeting',
      color: 'orange',
    })
  }

  if (deal.amount > 50000) {
    insights.push({
      icon: TrendingUp,
      headline: 'High-value deal — involve leadership',
      explanation:
        'Deals above $50k benefit from executive sponsorship. Consider looping in a senior stakeholder.',
      actionLabel: 'Request exec sponsor',
      actionKey: 'log_note',
      color: 'purple',
    })
  }

  if (deal.stage === 'Proposal') {
    insights.push({
      icon: Flame,
      headline: 'Follow up on proposal',
      explanation:
        'Proposals without follow-up within 3 days have a 60% lower close rate. Reach out to check in.',
      actionLabel: 'Send follow-up email',
      actionKey: 'log_email',
      color: 'blue',
    })
  }

  if (insights.length === 0) {
    insights.push({
      icon: Flame,
      headline: 'On track',
      explanation:
        'This deal is progressing at a healthy pace. Keep up regular engagement to maintain momentum.',
      actionLabel: 'Log next action',
      actionKey: 'log_call',
      color: 'emerald',
    })
  }

  return insights.slice(0, 3)
}

/* ── Color map ─────────────────────────────────────────────────────────── */

const colorMap: Record<string, { bg: string; icon: string; btn: string }> = {
  emerald: {
    bg:  'bg-emerald-50 border-emerald-200',
    icon:'text-emerald-600',
    btn: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 active:bg-emerald-300',
  },
  purple: {
    bg:  'bg-purple-50 border-purple-200',
    icon:'text-purple-600',
    btn: 'bg-purple-100 text-purple-800 hover:bg-purple-200 active:bg-purple-300',
  },
  amber: {
    bg:  'bg-amber-50 border-amber-200',
    icon:'text-amber-600',
    btn: 'bg-amber-100 text-amber-800 hover:bg-amber-200 active:bg-amber-300',
  },
  orange: {
    bg:  'bg-orange-50 border-orange-200',
    icon:'text-orange-600',
    btn: 'bg-orange-100 text-orange-800 hover:bg-orange-200 active:bg-orange-300',
  },
  blue: {
    bg:  'bg-blue-50 border-blue-200',
    icon:'text-blue-600',
    btn: 'bg-blue-100 text-blue-800 hover:bg-blue-200 active:bg-blue-300',
  },
  red: {
    bg:  'bg-red-50 border-red-200',
    icon:'text-red-600',
    btn: 'bg-red-100 text-red-800 hover:bg-red-200 active:bg-red-300',
  },
}

/* ── Component ─────────────────────────────────────────────────────────── */

export interface AIInsightsPanelProps {
  entityType: EntityType
  entityId: string
  entityData: Customer | Lead | Deal
  /**
   * Called when the user clicks an action button.
   * The parent opens the right modal / navigates based on the key.
   * If omitted, a sensible default navigation is used.
   */
  onAction?: (key: InsightActionKey) => void
}

export function AIInsightsPanel({
  entityType,
  entityId: _entityId,
  entityData,
  onAction,
}: AIInsightsPanelProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  /** Index of the insight currently being actioned (shows spinner) */
  const [busyIndex, setBusyIndex] = useState<number | null>(null)
  /** Indices of insights that have been acted on — removed from the list */
  const [dismissedIndices, setDismissedIndices] = useState<Set<number>>(new Set())

  const allInsights =
    entityType === 'customer'
      ? getCustomerInsights(entityData as Customer)
      : entityType === 'lead'
        ? getLeadInsights(entityData as Lead)
        : getDealInsights(entityData as Deal)

  // Only show insights that haven't been dismissed yet
  const visibleInsights = allInsights.filter((_, i) => !dismissedIndices.has(i))
  const allDone = visibleInsights.length === 0

  function handleAction(index: number, key: InsightActionKey) {
    if (busyIndex !== null) return
    setBusyIndex(index)

    // After brief delay: open the action, then mark this insight as done
    setTimeout(() => {
      setBusyIndex(null)
      // Mark the insight as acted on — it slides away
      setDismissedIndices(prev => new Set([...prev, index]))

      if (onAction) {
        onAction(key)
        return
      }
      // Fallback navigation when no handler provided
      switch (key) {
        case 'create_quote':    navigate('/quotes');      break
        case 'view_activities': navigate('/activities');  break
        default:                navigate('/activities');  break
      }
    }, 500)
  }

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 shadow-sm">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-purple-800">
          <Sparkles className="h-4 w-4 text-purple-600" aria-hidden />
          AI Insights
          {!open && !allDone && (
            <span className="rounded-full bg-purple-200 px-2 py-0.5 text-[11px] font-medium text-purple-700">
              {visibleInsights.length}
            </span>
          )}
          {allDone && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              All done ✓
            </span>
          )}
        </span>
        {open
          ? <ChevronUp className="h-4 w-4 text-purple-600" aria-hidden />
          : <ChevronDown className="h-4 w-4 text-purple-600" aria-hidden />}
      </button>

      {/* Insight cards */}
      {open ? (
        <div className="accordion-open border-t border-purple-200 px-4 pb-4 pt-3 space-y-3">
          {allDone ? (
            /* All insights actioned */
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <span className="text-lg">✓</span>
              </div>
              <p className="text-sm font-medium text-emerald-700">All suggestions actioned!</p>
              <p className="text-xs text-slate-400">Great work. Check back after logging new activities.</p>
              <button
                type="button"
                onClick={() => setDismissedIndices(new Set())}
                className="mt-1 text-xs text-purple-500 hover:underline"
              >
                Reset suggestions
              </button>
            </div>
          ) : (
            allInsights.map((insight, i) => {
              // Skip dismissed
              if (dismissedIndices.has(i)) return null

              const colors = colorMap[insight.color] ?? colorMap['blue']
              const Icon = insight.icon
              const isBusy = busyIndex === i

              return (
                <div
                  key={i}
                  className={['rounded-lg border p-3 transition-all', colors.bg].join(' ')}
                >
                  <div className="flex items-start gap-2">
                    <Icon
                      className={['mt-0.5 h-4 w-4 shrink-0', colors.icon].join(' ')}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {insight.headline}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                        {insight.explanation}
                      </p>
                      <button
                        type="button"
                        disabled={isBusy || busyIndex !== null}
                        onClick={() => handleAction(i, insight.actionKey)}
                        className={[
                          'mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                          colors.btn,
                          isBusy ? 'opacity-70 cursor-wait' : 'cursor-pointer',
                        ].join(' ')}
                      >
                        {isBusy ? (
                          <>
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                            Applying…
                          </>
                        ) : (
                          <>
                            <span aria-hidden>→</span>
                            {insight.actionLabel}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {!allDone && (
          <p className="text-center text-xs text-purple-400">
            ✨ Powered by AI (demo — insights based on your actual CRM data)
          </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
