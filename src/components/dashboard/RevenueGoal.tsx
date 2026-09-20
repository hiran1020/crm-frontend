import { Pencil, Target, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getRevenueGoal, setRevenueGoal } from '@/lib/goal'
import { formatCurrency } from '@/lib/format'

interface RevenueGoalProps {
  wonRevenue: number
}

export function RevenueGoal({ wonRevenue }: RevenueGoalProps) {
  const [goal, setGoalState] = useState<number>(() => getRevenueGoal())
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(goal > 0 ? String(goal) : '')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [editing, goal])

  function saveGoal() {
    const parsed = parseInt(draft.replace(/[^0-9]/g, ''), 10)
    if (!isNaN(parsed) && parsed > 0) {
      setGoalState(parsed)
      setRevenueGoal(parsed)
    }
    setEditing(false)
  }

  function clearGoal() {
    setGoalState(0)
    setRevenueGoal(0)
    setEditing(false)
  }

  const pct = goal > 0 ? Math.min(100, Math.round((wonRevenue / goal) * 100)) : 0
  const remaining = goal > 0 ? Math.max(0, goal - wonRevenue) : 0
  const exceeded = goal > 0 && wonRevenue > goal

  const barColor =
    pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-brand-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400'

  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-brand-600" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900">Monthly Revenue Goal</h2>
        </div>
        <div className="flex items-center gap-1">
          {goal > 0 ? (
            <button
              type="button"
              onClick={clearGoal}
              aria-label="Clear goal"
              className="rounded p-1 text-slate-300 hover:text-slate-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit goal"
            className="rounded p-1 text-slate-400 hover:text-slate-700"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {goal === 0 && !editing ? (
        <div className="mt-3 text-center">
          <p className="text-sm text-slate-400">No goal set.</p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-1 text-xs text-brand-600 hover:underline"
          >
            Set a revenue goal →
          </button>
        </div>
      ) : editing ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-slate-500">$</span>
          <input
            ref={inputRef}
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveGoal()
              if (e.key === 'Escape') setEditing(false)
            }}
            placeholder="e.g. 250000"
            className="h-9 flex-1 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="button"
            onClick={saveGoal}
            className="h-9 rounded-md bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="h-9 rounded-md border border-border px-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-900">{formatCurrency(wonRevenue)}</span>
            <span className="text-slate-400">of {formatCurrency(goal)} goal</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={['h-3 rounded-full transition-all duration-500', barColor].join(' ')}
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span
              className={[
                'font-medium',
                pct >= 100 ? 'text-emerald-600' : '',
              ].join(' ')}
            >
              {pct}% {pct >= 100 ? '🎉 Goal achieved!' : 'of goal'}
            </span>
            {!exceeded ? (
              <span>{formatCurrency(remaining)} remaining</span>
            ) : (
              <span className="text-emerald-600">
                +{formatCurrency(wonRevenue - goal)} over goal
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
