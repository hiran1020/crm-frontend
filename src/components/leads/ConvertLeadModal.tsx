import type { Lead } from '@/types/lead'

interface ConvertLeadModalProps {
  open: boolean
  lead: Lead | null
  busy?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConvertLeadModal({
  open,
  lead,
  busy = false,
  onClose,
  onConfirm,
}: ConvertLeadModalProps) {
  if (!open || !lead) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="convert-lead-title"
        aria-describedby="convert-lead-description"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="convert-lead-title"
          className="text-lg font-semibold text-slate-900"
        >
          Convert {lead.name} to Customer?
        </h2>
        <p
          id="convert-lead-description"
          className="mt-2 text-sm text-slate-600"
        >
          This will mark the lead from{' '}
          <span className="font-medium">{lead.company}</span> as Converted. The
          lead record will be preserved and marked with a Converted status.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-md border border-border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? 'Converting…' : 'Convert to Customer'}
          </button>
        </div>
      </div>
    </div>
  )
}
