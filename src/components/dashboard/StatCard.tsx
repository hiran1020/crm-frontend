interface StatCardProps {
  label: string
  value: string
  hint?: string
  onClick?: () => void
}

export function StatCard({ label, value, hint, onClick }: StatCardProps) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={[
        'rounded-lg border border-border bg-white p-5 shadow-sm text-left w-full',
        onClick ? 'hover:border-brand-300 hover:shadow-md transition-shadow cursor-pointer' : '',
      ].join(' ')}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </Tag>
  )
}
