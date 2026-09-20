import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface AccessGuardProps {
  /** When false, shows the restricted message */
  allowed: boolean
  /** What page/feature is restricted */
  feature?: string
  /** Friendly message explaining why */
  reason?: string
  /** Where to redirect */
  redirectTo?: string
  redirectLabel?: string
  children: ReactNode
}

export function AccessGuard({
  allowed,
  feature = 'this section',
  reason = 'Your current role does not have access to this area.',
  redirectTo = '/',
  redirectLabel = 'Back to Dashboard',
  children,
}: AccessGuardProps) {
  if (allowed) return <>{children}</>

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Lock className="h-8 w-8 text-slate-400" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Access Restricted</h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {feature !== 'this section' && (
          <span className="font-medium text-slate-700">{feature}</span>
        )}{' '}
        {reason}
      </p>
      <Link
        to={redirectTo}
        className="mt-6 inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        {redirectLabel}
      </Link>
    </div>
  )
}
