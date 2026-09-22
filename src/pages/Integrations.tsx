import { Plug, Settings, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ClickUpSettingsPanel } from '@/components/helpdesk/ClickUpPanel'

interface Integration {
  id: string
  name: string
  description: string
  category: string
  color: string
  initial: string
}

const INTEGRATIONS: Integration[] = [
  { id: 'salesforce', name: 'Salesforce', description: 'Sync contacts, leads, and opportunities with Salesforce CRM.', category: 'CRM', color: '#00A1E0', initial: 'SF' },
  { id: 'hubspot', name: 'HubSpot', description: 'Connect your HubSpot account to sync contacts and deals.', category: 'CRM', color: '#FF7A59', initial: 'HS' },
  { id: 'slack', name: 'Slack', description: 'Get notifications and alerts directly in your Slack channels.', category: 'Communication', color: '#4A154B', initial: 'SL' },
  { id: 'gmail', name: 'Gmail', description: 'Log emails automatically and track opens from Gmail.', category: 'Email', color: '#EA4335', initial: 'GM' },
  { id: 'zapier', name: 'Zapier', description: 'Connect to 5,000+ apps through Zapier automation workflows.', category: 'Automation', color: '#FF4A00', initial: 'ZP' },
  { id: 'stripe', name: 'Stripe', description: 'Sync payment and subscription data from Stripe.', category: 'Payments', color: '#635BFF', initial: 'ST' },
  { id: 'twilio', name: 'Twilio', description: 'Enable SMS and voice call tracking through Twilio.', category: 'Communication', color: '#F22F46', initial: 'TW' },
  { id: 'linkedin', name: 'LinkedIn Sales Navigator', description: 'Find and connect with leads using LinkedIn Sales Navigator.', category: 'Prospecting', color: '#0077B5', initial: 'LN' },
]

const STORAGE_KEY = 'crm_integrations'

function loadConnected(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function saveConnected(data: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* quota */ }
}

interface MockOAuthModalProps {
  integration: Integration | null
  onClose: () => void
  onConnect: () => void
}

function MockOAuthModal({ integration, onClose, onConnect }: MockOAuthModalProps) {
  const [step, setStep] = useState<'redirect' | 'done'>('redirect')

  useEffect(() => {
    if (!integration) return
    setStep('redirect')
    const t = setTimeout(() => setStep('done'), 1500)
    return () => clearTimeout(t)
  }, [integration])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (integration) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [integration, onClose])

  if (!integration) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white mb-4"
          style={{ backgroundColor: integration.color }}
        >
          {integration.initial}
        </div>

        {step === 'redirect' ? (
          <>
            <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full animate-pulse rounded-full bg-brand-500" style={{ width: '60%' }} />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Redirecting to {integration.name}…
            </p>
            <p className="mt-1 text-xs text-slate-500">Please wait</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-900">
              This is a demo — no real connection is made
            </p>
            <p className="mt-1 text-xs text-slate-500">
              In production, this would redirect to {integration.name}&apos;s OAuth flow.
            </p>
            <button
              type="button"
              onClick={() => { onConnect(); onClose() }}
              className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Simulate Connection
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-2 text-xs text-slate-400 hover:text-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export function IntegrationsPage() {
  usePageTitle('Integrations')
  const [connected, setConnected] = useState<Record<string, boolean>>(loadConnected)
  const [connecting, setConnecting] = useState<Integration | null>(null)

  function toggleConnect(integration: Integration) {
    if (connected[integration.id]) {
      setConnected((prev) => {
        const updated = { ...prev, [integration.id]: false }
        saveConnected(updated)
        return updated
      })
    } else {
      setConnecting(integration)
    }
  }

  function handleConnect() {
    if (!connecting) return
    setConnected((prev) => {
      const updated = { ...prev, [connecting.id]: true }
      saveConnected(updated)
      return updated
    })
  }

  const categories = [...new Set(INTEGRATIONS.map((i) => i.category))]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Integrations</h2>
        <p className="mt-1 text-sm text-slate-500">
          Connect your CRM with the tools your team already uses.
        </p>
      </div>

      {categories.map((category) => (
        <div key={category}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {category}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.filter((i) => i.category === category).map((integration) => {
              const isConnected = connected[integration.id] ?? false
              return (
                <div
                  key={integration.id}
                  className="rounded-lg border border-border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                      style={{ backgroundColor: integration.color }}
                    >
                      {integration.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {integration.name}
                        </h4>
                        <span
                          className={[
                            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                            isConnected
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500',
                          ].join(' ')}
                        >
                          {isConnected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                        {integration.description}
                      </p>
                      {isConnected && (
                        <p className="mt-1 text-xs text-slate-400">
                          Last synced: 2 hours ago
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {isConnected ? (
                      <button
                        type="button"
                        onClick={() => toggleConnect(integration)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        <X className="h-3 w-3" aria-hidden />
                        Disconnect
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleConnect(integration)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                      >
                        <Plug className="h-3 w-3" aria-hidden />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* ClickUp — Deep Integration (real API) */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Deep Integrations
          </h3>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
            Real API
          </span>
        </div>
        <div className="rounded-lg border border-violet-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: '#7B68EE' }}>
              CU
            </div>
            <div>
              <p className="font-semibold text-slate-900">ClickUp</p>
              <p className="text-xs text-slate-500">
                Push Help Desk tickets directly to your ClickUp dev workspace. Configured for your engineering backlog.
              </p>
            </div>
            <div className="ml-auto">
              <Settings className="h-5 w-5 text-violet-400" aria-hidden />
            </div>
          </div>
          <ClickUpSettingsPanel />
        </div>
      </div>

      <MockOAuthModal
        integration={connecting}
        onClose={() => setConnecting(null)}
        onConnect={handleConnect}
      />
    </div>
  )
}
