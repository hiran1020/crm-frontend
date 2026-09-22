import { Bookmark, BookmarkCheck, ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSavedViews, useCreateSavedView, useDeleteSavedView } from '@/hooks/useSavedViews'
import type { SavedView, SavedViewEntity } from '@/types/savedView'

interface Props {
  entityType: SavedViewEntity
  currentFilters: Record<string, string>
  onApplyView: (filters: Record<string, string>) => void
}

/** Returns true if two filter maps are semantically equal (ignores empty/All values) */
function filtersMatch(a: Record<string, string>, b: Record<string, string>): boolean {
  const norm = (f: Record<string, string>) =>
    Object.fromEntries(Object.entries(f).filter(([, v]) => v && v !== 'All' && v !== ''))
  const na = norm(a)
  const nb = norm(b)
  const keys = new Set([...Object.keys(na), ...Object.keys(nb)])
  for (const k of keys) if (na[k] !== nb[k]) return false
  return true
}

export function SavedViewsDropdown({ entityType, currentFilters, onApplyView }: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const viewsQuery = useSavedViews(entityType)
  const createView = useCreateSavedView()
  const deleteView = useDeleteSavedView()

  const views = viewsQuery.data ?? []
  const activeView = views.find((v: SavedView) => filtersMatch(v.filters, currentFilters))

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  async function handleSaveView() {
    if (!newName.trim()) return
    await createView.mutateAsync({
      name: newName.trim(),
      entityType,
      filters: currentFilters,
      createdBy: user?.id ?? '',
    })
    setNewName('')
    setSaving(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
          activeView
            ? 'border-brand-400 bg-brand-50 text-brand-700'
            : 'border-border text-slate-700 hover:bg-slate-50',
        ].join(' ')}
        title={activeView ? `Active: ${activeView.name}` : 'Saved views'}
      >
        {activeView
          ? <BookmarkCheck className="h-4 w-4" aria-hidden />
          : <Bookmark className="h-4 w-4" aria-hidden />}
        {activeView ? activeView.name : 'Saved Views'}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-border bg-white shadow-lg">
          {viewsQuery.isLoading ? (
            <p className="px-4 py-3 text-sm text-slate-400">Loading…</p>
          ) : viewsQuery.isError ? (
            <p className="px-4 py-3 text-sm text-red-500">Could not load saved views.</p>
          ) : views.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">No saved views yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {views.map((view: SavedView) => {
                const isActive = filtersMatch(view.filters, currentFilters)
                return (
                  <li
                    key={view.id}
                    className={[
                      'flex items-center justify-between gap-2 px-3 py-2',
                      isActive ? 'bg-brand-50' : 'hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onApplyView(view.filters)
                        setOpen(false)
                      }}
                      className={[
                        'flex-1 text-left text-sm',
                        isActive ? 'font-medium text-brand-700' : 'text-slate-800 hover:text-brand-600',
                      ].join(' ')}
                    >
                      {view.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`Delete saved view "${view.name}"?`)) return
                        void deleteView.mutateAsync(view.id)
                      }}
                      disabled={deleteView.isPending}
                      className="shrink-0 rounded p-0.5 text-slate-400 hover:text-red-600 disabled:opacity-50"
                      aria-label={`Delete view ${view.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="border-t border-border p-3">
            {saving ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleSaveView()
                    if (e.key === 'Escape') setSaving(false)
                  }}
                  placeholder="View name…"
                  className="flex-1 rounded-md border border-border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => void handleSaveView()}
                  disabled={createView.isPending || !newName.trim()}
                  className="rounded-md bg-brand-600 px-2 py-1 text-xs text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setSaving(false)}
                  className="rounded-md p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSaving(true)}
                className="inline-flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-600"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Save current view
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
