import { Clock, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { customerStore } from '@/mock/customerStore'
import { dealStore } from '@/mock/dealStore'
import { leadStore } from '@/mock/leadStore'
import { getRecentlyViewed } from '@/lib/recentlyViewed'

interface SearchResult {
  id: string
  label: string
  sub: string
  href: string
  group: 'Customers' | 'Leads' | 'Deals'
}

function searchAll(query: string): SearchResult[] {
  if (query.trim().length < 2) return []

  const q = query.toLowerCase()

  const customers = customerStore
    .list({ search: q, pageSize: 4 })
    .data.map(
      (c): SearchResult => ({
        id: c.id,
        label: `${c.firstName} ${c.lastName}`,
        sub: c.company,
        href: `/customers/${c.id}`,
        group: 'Customers',
      }),
    )

  const leads = leadStore
    .list({ search: q, pageSize: 4 })
    .data.map(
      (l): SearchResult => ({
        id: l.id,
        label: l.name,
        sub: l.company,
        href: `/leads/${l.id}`,
        group: 'Leads',
      }),
    )

  const deals = dealStore
    .list({ search: q, pageSize: 4 })
    .data.map(
      (d): SearchResult => ({
        id: d.id,
        label: d.title,
        sub: d.stage,
        href: `/deals/${d.id}`,
        group: 'Deals',
      }),
    )

  return [...customers, ...leads, ...deals]
}

export function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 250)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = searchAll(debouncedQuery)

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.group]) acc[r.group] = []
    acc[r.group].push(r)
    return acc
  }, {})

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSelect(href: string) {
    navigate(href)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  function clear() {
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      {/* Mobile: full-screen search overlay triggered by the mobile search button in Header */}
      {/* Input */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search… (⌘K)"
          aria-label="Global search"
          aria-expanded={open && results.length > 0}
          aria-haspopup="listbox"
          className="h-9 w-56 rounded-md border border-border bg-slate-50 pr-8 pl-9 text-sm outline-none focus:border-brand-500 focus:w-72 focus:ring-2 focus:ring-brand-100 transition-all"
        />
        {query ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {open && debouncedQuery.trim().length === 0 ? (
        /* Recently viewed — show when search is open but empty */
        (() => {
          const recent = getRecentlyViewed()
          if (recent.length === 0) return null
          return (
            <div
              role="listbox"
              className="absolute top-full left-0 z-50 mt-1.5 w-80 rounded-lg border border-border bg-white py-2 shadow-xl"
            >
              <p className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Clock className="h-3 w-3" aria-hidden />
                Recently Viewed
              </p>
              {recent.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.href)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <span className={[
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold uppercase',
                    item.type === 'customer' ? 'bg-blue-100 text-blue-700' :
                    item.type === 'lead' ? 'bg-purple-100 text-purple-700' :
                    'bg-emerald-100 text-emerald-700',
                  ].join(' ')}>
                    {item.type[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          )
        })()
      ) : open && debouncedQuery.trim().length >= 2 ? (
        <div
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1.5 w-80 rounded-lg border border-border bg-white py-2 shadow-xl"
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">
              No results for &ldquo;{debouncedQuery}&rdquo;
            </p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group}
                </p>
                {items.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    role="option"
                    onClick={() => handleSelect(result.href)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {result.label}
                      </p>
                      <p className="text-xs text-slate-500">{result.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

