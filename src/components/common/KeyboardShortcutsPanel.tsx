import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Open global search' },
  { keys: ['Esc'], description: 'Close modal / dropdown' },
  { keys: ['?'], description: 'Show this shortcuts panel' },
  { keys: ['⌘', 'Enter'], description: 'Submit focused form' },
  { section: 'Navigation' },
  { keys: ['G', 'then', 'D'], description: 'Go to Dashboard' },
  { keys: ['G', 'then', 'C'], description: 'Go to Customers' },
  { keys: ['G', 'then', 'L'], description: 'Go to Leads' },
  { keys: ['G', 'then', 'P'], description: 'Go to Pipeline (Deals)' },
  { keys: ['G', 'then', 'A'], description: 'Go to Activities' },
  { keys: ['G', 'then', 'T'], description: 'Go to Tasks' },
]

export function KeyboardShortcutsPanel() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (e.key === '?') setOpen((prev) => !prev)
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Keyboard Shortcuts</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-1">
          {shortcuts.map((item, i) => {
            if ('section' in item) {
              return (
                <p
                  key={i}
                  className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  {item.section}
                </p>
              )
            }
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-slate-50"
              >
                <span className="text-sm text-slate-700">{item.description}</span>
                <div className="flex items-center gap-1">
                  {item.keys.map((key, ki) => (
                    key === 'then' ? (
                      <span key={ki} className="text-xs text-slate-400">then</span>
                    ) : (
                      <kbd
                        key={ki}
                        className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-slate-200 bg-slate-100 px-1.5 text-xs font-medium text-slate-700"
                      >
                        {key}
                      </kbd>
                    )
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Press <kbd className="rounded border border-slate-200 bg-slate-100 px-1 text-xs">?</kbd> to toggle
        </p>
      </div>
    </div>
  )
}
