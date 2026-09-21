import { useState } from 'react'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { Eye, EyeOff, X } from 'lucide-react'
import { firebaseAuth } from '@/lib/firebase'

interface Props {
  open: boolean
  userEmail: string
  onClose: () => void
  onSuccess: () => void
}

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Current password is incorrect.'
    case 'auth/weak-password': return 'New password is too weak (min. 8 characters).'
    case 'auth/requires-recent-login': return 'Session expired. Please log out and back in, then try again.'
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a moment and try again.'
    default: return 'Failed to update password. Please try again.'
  }
}

const inputCls = 'h-10 w-full rounded-md border border-border bg-white px-3 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export function ChangePasswordModal({ open, userEmail, onClose, onSuccess }: Props) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const mismatch = confirm.length > 0 && confirm !== next
  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    const user = firebaseAuth.currentUser
    if (!user) { setError('Not authenticated.'); return }
    setBusy(true)
    setError(null)
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(userEmail, current))
      await updatePassword(user, next)
      onSuccess()
    } catch (err: unknown) {
      setError(mapFirebaseError((err as { code?: string }).code ?? ''))
    } finally {
      setBusy(false)
    }
  }

  function close() {
    setCurrent(''); setNext(''); setConfirm(''); setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={close}>
      <div
        role="dialog" aria-modal="true" aria-labelledby="cpw-title"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="cpw-title" className="text-lg font-semibold text-slate-900">Change password</h2>
          <button type="button" onClick={close} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Enter your current password then choose a new one (min. 8 characters).
        </p>

        <form className="mt-5 space-y-4" onSubmit={e => void handleSubmit(e)}>
          {/* Current password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Current password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={current}
                onChange={e => setCurrent(e.target.value)}
                autoComplete="current-password"
                required
                className={inputCls}
                placeholder="Your current password"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
            <div className="relative">
              <input
                type={showNext ? 'text' : 'password'}
                value={next}
                onChange={e => setNext(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className={inputCls}
                placeholder="At least 8 characters"
              />
              <button type="button" tabIndex={-1} onClick={() => setShowNext(v => !v)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {next.length > 0 && next.length < 8 && (
              <p className="mt-1 text-xs text-amber-600">Must be at least 8 characters</p>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className={[
                'h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2',
                mismatch
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-border focus:border-brand-500 focus:ring-brand-100',
              ].join(' ')}
              placeholder="Repeat new password"
            />
            {mismatch && <p className="mt-1 text-xs text-red-600">Passwords don't match</p>}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={close} disabled={busy}
              className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={busy || !canSubmit}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
