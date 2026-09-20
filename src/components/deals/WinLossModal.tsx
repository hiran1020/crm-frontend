import { useRef, useState } from 'react'

interface WinLossModalProps {
  open: boolean
  stage: 'Won' | 'Lost'
  dealTitle: string
  busy: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function WinLossModal({
  open,
  stage,
  dealTitle,
  busy,
  onClose,
  onConfirm,
}: WinLossModalProps) {
  const [reason, setReason] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  if (!open) return null

  const isWon = stage === 'Won'
  const title = isWon ? 'Mark as Won' : 'Mark as Lost'
  const confirmLabel = isWon ? 'Mark Won' : 'Mark Lost'
  const confirmClass = isWon
    ? 'rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50'
    : 'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'

  function handleConfirm() {
    onConfirm(reason)
    setReason('')
  }

  function handleClose() {
    setReason('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="win-loss-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-xl">
        <h2
          id="win-loss-modal-title"
          className="text-base font-semibold text-slate-900"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500 truncate">{dealTitle}</p>

        <div className="mt-4">
          <label
            htmlFor="win-loss-reason"
            className="block text-sm font-medium text-slate-700"
          >
            Reason{' '}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="win-loss-reason"
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What was the deciding factor?"
            rows={3}
            className="mt-1.5 h-20 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:border-brand-500 focus:ring-brand-100 resize-none"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={confirmClass}
          >
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
