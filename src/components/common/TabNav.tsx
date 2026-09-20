interface Tab {
  id: string
  label: string
  count?: number
}

interface TabNavProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
}

export function TabNav({ tabs, activeTab, onChange }: TabNavProps) {
  return (
    <div className="border-b border-border">
      {/* Horizontal scroll on mobile so tabs never wrap or overflow */}
      <nav
        className="-mb-px flex gap-1 overflow-x-auto scrollbar-none"
        aria-label="Tabs"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={[
                'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
              ].join(' ')}
            >
              {tab.label}
              {tab.count !== undefined ? (
                <span
                  className={[
                    'rounded-full px-1.5 py-0.5 text-xs font-medium',
                    isActive
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-slate-100 text-slate-600',
                  ].join(' ')}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
