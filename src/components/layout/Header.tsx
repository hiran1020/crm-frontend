import { LogOut, Menu, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { NotificationsDropdown } from '@/components/layout/NotificationsDropdown'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { customerStore } from '@/mock/customerStore'
import { leadStore } from '@/mock/leadStore'
import { dealStore } from '@/mock/dealStore'

interface SearchResult { id: string; label: string; sub: string; href: string }

function searchAll(q: string): SearchResult[] {
  if (q.trim().length < 2) return []
  const ql = q.toLowerCase()
  return [
    ...customerStore.list({ search: ql, pageSize: 3 }).data.map(c => ({
      id: c.id, label: `${c.firstName} ${c.lastName}`, sub: c.company, href: `/customers/${c.id}`,
    })),
    ...leadStore.list({ search: ql, pageSize: 3 }).data.map(l => ({
      id: l.id, label: l.name, sub: l.company, href: `/leads/${l.id}`,
    })),
    ...dealStore.list({ search: ql, pageSize: 3 }).data.map(d => ({
      id: d.id, label: d.title, sub: d.stage, href: `/deals/${d.id}`,
    })),
  ]
}

/** Full-screen search overlay shown on mobile when the search icon is tapped */
function MobileSearchOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query, 250)
  const results = searchAll(debounced)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function go(href: string) { navigate(href); onClose() }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search customers, leads, deals…"
          className="flex-1 text-base outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
        />
        <button type="button" onClick={onClose} aria-label="Close search"
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Results */}
      <div className="overflow-y-auto">
        {debounced.trim().length >= 2 && results.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">No results for "{debounced}"</p>
        ) : results.length > 0 ? (
          <ul>
            {results.map(r => (
              <li key={r.id}>
                <button type="button" onClick={() => go(r.href)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{r.label}</p>
                    <p className="text-sm text-slate-500">{r.sub}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            Start typing to search customers, leads, and deals
          </p>
        )}
      </div>
    </div>
  )
}

interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
        {/* Left: hamburger + title */}
        <div className="flex min-w-0 items-center gap-2">
          {onMenuClick ? (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open navigation"
              className="shrink-0 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
            {title}
          </h1>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Desktop search — hidden on mobile */}
          <GlobalSearch />

          {/* Mobile search icon */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Search"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 sm:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          <NotificationsDropdown />
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-1.5 border-l border-border pl-2 sm:gap-2 sm:pl-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white"
                aria-hidden
                title={user.name}
              >
                {user.avatarInitials}
              </div>
              <div className="hidden leading-tight md:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs capitalize text-slate-500">
                  {{
                    admin:       'Admin',
                    manager:     'Manager',
                    sales_agent: 'Sales Agent',
                    support:     'Support Agent',
                  }[user.role] ?? user.role}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                aria-label="Log out"
                title="Log out"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* Mobile search overlay */}
      {mobileSearchOpen ? (
        <MobileSearchOverlay onClose={() => setMobileSearchOpen(false)} />
      ) : null}
    </>
  )
}
