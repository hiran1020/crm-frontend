import type { CustomerStatus } from '@/types/customer'

export function StatusBadge({ status }: { status: CustomerStatus }) {
  const isActive = status === 'Active'

  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        isActive
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-600',
      ].join(' ')}
    >
      {status}
    </span>
  )
}
