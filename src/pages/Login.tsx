import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/context/AuthContext'
import { APP_NAME } from '@/constants/auth'
import { usePageTitle } from '@/hooks/usePageTitle'

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  usePageTitle('Sign In')
  const navigate = useNavigate()
  const { login } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginValues) {
    setServerError(null)
    try {
      await login(values.email, values.password)
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Login failed. Try again.',
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        {/* Logo / App name */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <span className="text-xl font-bold text-white">P</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-border bg-white p-8 shadow-sm">
          {serverError ? (
            <div
              className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {serverError}
            </div>
          ) : null}

          <form
            onSubmit={(event) => {
              void handleSubmit(onSubmit)(event)
            }}
            className="space-y-4"
          >
            <Field label="Email address" error={errors.email?.message}>
              <input
                type="email"
                {...register('email')}
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass(errors.email)}
              />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <input
                type="password"
                {...register('password')}
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputClass(errors.password)}
              />
            </Field>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-md bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 rounded-lg border border-border bg-slate-50 p-3 text-xs text-slate-500">
          <p className="mb-1.5 font-semibold text-slate-600">Demo accounts (password: <code className="font-mono">passwordCRM</code>)</p>
          <div className="space-y-0.5">
            {[
              { email: 'hiran.basnet2@gmail.com',  role: 'Admin' },
            ].map(({ email, role }) => (
              <div key={email} className="flex items-center justify-between gap-2">
                <code className="font-mono text-brand-700">{email}</code>
                <span className="text-slate-400">{role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  )
}

function inputClass(error?: { message?: string }) {
  return [
    'h-10 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-2',
    error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
      : 'border-border focus:border-brand-500 focus:ring-brand-100',
  ].join(' ')
}
