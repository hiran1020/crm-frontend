import { Pin, PinOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getPinned,
  isPinned,
  togglePin,
  unpinRecord,
} from '@/lib/pinnedRecords'
import type { PinnedEntityType } from '@/lib/pinnedRecords'

interface PinButtonProps {
  id: string
  type: PinnedEntityType
  label: string
  sub: string
  href: string
  className?: string
}

export function PinButton({ id, type, label, sub, href, className }: PinButtonProps) {
  const [pinned, setPinned] = useState(() => isPinned(id))

  useEffect(() => {
    setPinned(isPinned(id))
  }, [id])

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const nowPinned = togglePin({ id, type, label, sub, href })
    setPinned(nowPinned)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={pinned ? 'Unpin record' : 'Pin for quick access'}
      title={pinned ? 'Unpin' : 'Pin to sidebar'}
      className={[
        'rounded-md p-1.5 transition-colors',
        pinned
          ? 'text-amber-500 hover:bg-amber-50'
          : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500',
        className ?? '',
      ].join(' ')}
    >
      <Pin className={['h-4 w-4', pinned ? 'fill-amber-400' : ''].join(' ')} />
    </button>
  )
}

export function PinnedRecordsPanel({ onNavClick }: { onNavClick?: () => void }) {
  const [records, setRecords] = useState(() => getPinned())

  function refresh() {
    setRecords(getPinned())
  }

  if (records.length === 0) return null

  const TYPE_COLORS: Record<PinnedEntityType, string> = {
    customer: 'bg-blue-800 text-blue-200',
    lead:     'bg-purple-800 text-purple-200',
    deal:     'bg-emerald-800 text-emerald-200',
  }

  return (
    <div className="border-t border-slate-700 px-3 py-2">
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Pinned
      </p>
      {records.map(r => (
        <div key={r.id} className="flex items-center gap-1 rounded-md text-slate-300 hover:bg-sidebar-hover">
          <Link
            to={r.href}
            onClick={() => { onNavClick?.(); setTimeout(refresh, 100) }}
            className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5"
          >
            <span className={[
              'flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold uppercase',
              TYPE_COLORS[r.type],
            ].join(' ')}>
              {r.type[0]}
            </span>
            <span className="truncate text-xs">{r.label}</span>
          </Link>
          <button
            type="button"
            onClick={() => { unpinRecord(r.id); refresh() }}
            className="shrink-0 rounded p-1 text-slate-600 hover:text-slate-300"
            aria-label={`Unpin ${r.label}`}
          >
            <PinOff className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
