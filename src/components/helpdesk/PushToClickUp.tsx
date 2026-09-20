import { CheckCircle2, ExternalLink, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { isClickUpEnabled, getClickUpConfig } from '@/lib/clickupConfig'
import { pushTicketToClickUp } from '@/services/clickupService'
import type { Ticket } from '@/types/ticket'

interface PushToClickUpProps {
  ticket: Ticket
  /** Called with the ClickUp task ID + URL after a successful push */
  onPushed: (taskId: string, taskUrl: string) => void
  variant?: 'button' | 'icon'
  className?: string
}

export function PushToClickUpButton({
  ticket,
  onPushed,
  variant = 'button',
  className = '',
}: PushToClickUpProps) {
  const [pushing, setPushing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)

  const alreadyPushed = Boolean(ticket.clickupTaskId)
  const enabled = isClickUpEnabled()
  const config = getClickUpConfig()

  async function handlePush(e: React.MouseEvent) {
    e.stopPropagation()
    if (!enabled || pushing || alreadyPushed) return
    setPushing(true)
    setError(null)

    const result = await pushTicketToClickUp(ticket)
    setPushing(false)

    if (result.success && result.task) {
      onPushed(result.task.id, result.task.url)
    } else {
      setError(result.error ?? 'Unknown error')
      setShowError(true)
      setTimeout(() => setShowError(false), 5000)
    }
  }

  // Already pushed — show link to ClickUp task
  if (alreadyPushed) {
    return (
      <a
        href={ticket.clickupTaskUrl}
        target="_blank"
        rel="noreferrer"
        onClick={e => e.stopPropagation()}
        title="View in ClickUp"
        className={[
          'inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-emerald-700 hover:text-emerald-900',
          variant === 'button'
            ? 'border border-emerald-200 bg-emerald-50 px-3 py-1.5 hover:bg-emerald-100'
            : 'p-1',
          className,
        ].join(' ')}
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {variant === 'button' ? (
          <>
            In ClickUp
            <ExternalLink className="h-3 w-3" aria-hidden />
          </>
        ) : null}
      </a>
    )
  }

  // Not yet pushed
  if (!enabled) {
    return (
      <button
        type="button"
        disabled
        title="Configure ClickUp in Integrations to enable this"
        onClick={e => e.stopPropagation()}
        className={[
          'inline-flex cursor-not-allowed items-center gap-1.5 rounded-md text-xs font-medium opacity-40',
          variant === 'button'
            ? 'border border-border bg-white px-3 py-1.5 text-slate-600'
            : 'p-1 text-slate-400',
          className,
        ].join(' ')}
      >
        <Send className="h-3.5 w-3.5" aria-hidden />
        {variant === 'button' ? 'Push to ClickUp' : null}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => void handlePush(e)}
        disabled={pushing}
        title={`Push to ${config.listName} in ClickUp`}
        className={[
          'inline-flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors',
          variant === 'button'
            ? 'border border-violet-200 bg-violet-50 px-3 py-1.5 text-violet-700 hover:bg-violet-100 disabled:opacity-60'
            : 'p-1 text-violet-500 hover:text-violet-700 disabled:opacity-60',
          className,
        ].join(' ')}
      >
        {pushing
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          : <Send className="h-3.5 w-3.5" aria-hidden />}
        {variant === 'button' ? (pushing ? 'Pushing…' : 'Push to ClickUp') : null}
      </button>

      {/* Inline error tooltip */}
      {showError && error ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-red-200 bg-red-50 p-3 shadow-lg">
          <p className="text-xs font-medium text-red-700">Failed to push to ClickUp</p>
          <p className="mt-0.5 text-xs text-red-600 break-words">{error}</p>
          <p className="mt-1.5 text-xs text-red-500">
            Check your API token in{' '}
            <a href="/integrations" className="underline hover:text-red-700">Integrations</a>.
          </p>
        </div>
      ) : null}
    </div>
  )
}
