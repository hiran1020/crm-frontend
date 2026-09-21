import { useEffect, useRef, useState } from 'react'
import {
  TotpMultiFactorGenerator,
  multiFactor,
  type TotpSecret,
} from 'firebase/auth'
import QRCode from 'qrcode'
import { X, ShieldCheck, Smartphone, Copy, Check } from 'lucide-react'
import { firebaseAuth } from '@/lib/firebase'

type Step = 'qr' | 'verify' | 'done'

interface Props {
  open: boolean
  userEmail: string
  onClose: () => void
  onEnrolled: () => void
}

export function TwoFactorSetupModal({ open, userEmail, onClose, onEnrolled }: Props) {
  const [step, setStep] = useState<Step>('qr')
  const [secret, setSecret] = useState<TotpSecret | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const otpRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setStep('qr'); setSecret(null); setQrDataUrl(''); setOtp(''); setError(null)
      return
    }
    void initSecret()
  }, [open])

  useEffect(() => {
    if (step === 'verify') setTimeout(() => otpRef.current?.focus(), 100)
  }, [step])

  async function initSecret() {
    const user = firebaseAuth.currentUser
    if (!user) return
    try {
      const session = await multiFactor(user).getSession()
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(session)
      setSecret(totpSecret)
      const uri = totpSecret.generateQrCodeUrl(userEmail, 'CRM')
      const dataUrl = await QRCode.toDataURL(uri, { width: 200, margin: 1 })
      setQrDataUrl(dataUrl)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/unsupported-first-factor' || code.includes('unsupported')) {
        setError('Multi-factor authentication is not enabled for this project. Enable it in the Firebase console under Authentication → Sign-in method.')
      } else {
        setError('Could not start 2FA setup. Please try again.')
      }
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!secret || otp.length !== 6) return
    const user = firebaseAuth.currentUser
    if (!user) { setError('Not authenticated.'); return }
    setBusy(true)
    setError(null)
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, otp)
      await multiFactor(user).enroll(assertion, 'Authenticator app')
      setStep('done')
      onEnrolled()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/invalid-verification-code') {
        setError('Incorrect code. Check your authenticator app and try again.')
      } else {
        setError('Verification failed. Please try again.')
      }
      setOtp('')
    } finally {
      setBusy(false)
    }
  }

  async function copySecret() {
    if (!secret) return
    await navigator.clipboard.writeText(secret.secretKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-labelledby="2fa-title"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="2fa-title" className="text-lg font-semibold text-slate-900">
            Set up two-factor authentication
          </h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step: QR code */}
        {step === 'qr' && (
          <div className="mt-5 space-y-5">
            {error ? (
              <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : !qrDataUrl ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.).
                </p>

                <div className="flex justify-center">
                  <img src={qrDataUrl} alt="2FA QR code" width={200} height={200} className="rounded-lg border border-border p-2" />
                </div>

                {secret && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-slate-500">Or enter the key manually:</p>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-slate-50 px-3 py-2">
                      <code className="flex-1 break-all text-xs font-mono text-slate-800">{secret.secretKey}</code>
                      <button type="button" onClick={() => void copySecret()}
                        className="shrink-0 text-slate-400 hover:text-brand-600"
                        title="Copy secret key">
                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={onClose}
                    className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="button" onClick={() => setStep('verify')}
                    className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                    Next — verify code
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Verify OTP */}
        {step === 'verify' && (
          <form className="mt-5 space-y-5" onSubmit={e => void handleVerify(e)}>
            <div className="flex items-start gap-3 rounded-lg border border-border bg-slate-50 p-4">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
              <p className="text-sm text-slate-600">
                Open your authenticator app and enter the 6-digit code shown for <strong>CRM</strong>.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Verification code</label>
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(null) }}
                placeholder="000000"
                className="h-12 w-full rounded-md border border-border bg-white px-4 text-center text-2xl font-mono tracking-[0.5em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setStep('qr'); setOtp(''); setError(null) }}
                disabled={busy}
                className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Back
              </button>
              <button type="submit" disabled={busy || otp.length !== 6}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                {busy ? 'Verifying…' : 'Enable 2FA'}
              </button>
            </div>
          </form>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="mt-5 space-y-5">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <ShieldCheck className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">2FA enabled successfully</p>
                <p className="mt-1 text-xs text-slate-500">
                  Your account is now protected with two-factor authentication.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={onClose}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Done
              </button>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
