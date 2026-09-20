import { Check, Copy, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useToast } from '@/components/common/ToastProvider'
import { TabNav } from '@/components/common/TabNav'

// ---------- Types ----------
interface Webhook {
  id: string
  url: string
  events: string[]
  secretKey: string
  active: boolean
  createdAt: string
  lastTriggered?: string
}

interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  lastUsed?: string
}

// ---------- Storage ----------
const WEBHOOKS_KEY = 'crm_webhooks'
const API_KEYS_KEY = 'crm_api_keys'

function loadWebhooks(): Webhook[] {
  try {
    const raw = localStorage.getItem(WEBHOOKS_KEY)
    return raw ? (JSON.parse(raw) as Webhook[]) : []
  } catch {
    return []
  }
}

function saveWebhooks(data: Webhook[]) {
  try {
    localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(data))
  } catch { /* quota */ }
}

const SEED_KEY: ApiKey = {
  id: 'key-001',
  name: 'Demo API Key',
  key: 'pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  createdAt: '2026-01-01',
}

function loadApiKeys(): ApiKey[] {
  try {
    const raw = localStorage.getItem(API_KEYS_KEY)
    return raw ? (JSON.parse(raw) as ApiKey[]) : [SEED_KEY]
  } catch {
    return [SEED_KEY]
  }
}

function saveApiKeys(data: ApiKey[]) {
  try {
    localStorage.setItem(API_KEYS_KEY, JSON.stringify(data))
  } catch { /* quota */ }
}

// ---------- Sub-components ----------
const BASE_URL = 'https://api.pulsecrm.io/v1'

const ENDPOINTS = [
  { method: 'GET', path: '/customers', description: 'List all customers' },
  { method: 'POST', path: '/customers', description: 'Create a customer' },
  { method: 'GET', path: '/customers/:id', description: 'Get a customer by ID' },
  { method: 'PUT', path: '/customers/:id', description: 'Update a customer' },
  { method: 'DELETE', path: '/customers/:id', description: 'Delete a customer' },
  { method: 'GET', path: '/leads', description: 'List all leads' },
  { method: 'POST', path: '/leads', description: 'Create a lead' },
  { method: 'GET', path: '/leads/:id', description: 'Get a lead by ID' },
  { method: 'PUT', path: '/leads/:id', description: 'Update a lead' },
  { method: 'GET', path: '/deals', description: 'List all deals' },
  { method: 'POST', path: '/deals', description: 'Create a deal' },
  { method: 'PUT', path: '/deals/:id', description: 'Update a deal' },
  { method: 'GET', path: '/activities', description: 'List all activities' },
  { method: 'POST', path: '/activities', description: 'Log an activity' },
  { method: 'GET', path: '/tickets', description: 'List all support tickets' },
  { method: 'POST', path: '/tickets', description: 'Create a ticket' },
  { method: 'PUT', path: '/tickets/:id', description: 'Update a ticket' },
]

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-emerald-100 text-emerald-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
}

const WEBHOOK_EVENTS = [
  'customer.created',
  'customer.updated',
  'customer.deleted',
  'lead.created',
  'lead.converted',
  'deal.created',
  'deal.stage_changed',
  'deal.won',
  'deal.lost',
  'ticket.created',
  'ticket.resolved',
]

function generateSecret(): string {
  const arr = new Uint8Array(24)
  crypto.getRandomValues(arr)
  return 'whsec_' + Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateApiKey(): string {
  const arr = new Uint8Array(20)
  crypto.getRandomValues(arr)
  return 'pk_live_' + Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function maskKey(key: string): string {
  if (key.length <= 12) return '••••••••'
  return key.slice(0, 12) + '••••••••' + key.slice(-4)
}

const TABS = ['docs', 'webhooks', 'keys'] as const
type TabId = (typeof TABS)[number]

const TAB_LABELS: Record<TabId, string> = {
  docs: 'API Documentation',
  webhooks: 'Webhooks',
  keys: 'API Keys',
}

// ---------- Add Webhook Modal ----------
interface AddWebhookModalProps {
  open: boolean
  onClose: () => void
  onAdd: (webhook: Omit<Webhook, 'id' | 'createdAt'>) => void
}

function AddWebhookModal({ open, onClose, onAdd }: AddWebhookModalProps) {
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const secretKey = generateSecret()

  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    )
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Add Webhook</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Endpoint URL *</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-9 w-full rounded-md border border-border px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="https://your-server.com/webhook"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Events</label>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map((event) => (
                <label key={event} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="h-4 w-4 rounded"
                  />
                  <span className="font-mono text-xs">{event}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Secret Key (auto-generated)</label>
            <p className="rounded-md bg-slate-50 border border-border px-3 py-2 font-mono text-xs text-slate-600 break-all">
              {secretKey}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button
              type="button"
              disabled={!url || selectedEvents.length === 0}
              onClick={() => {
                onAdd({ url, events: selectedEvents, secretKey, active: true })
                setUrl('')
                setSelectedEvents([])
                onClose()
              }}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Add Webhook
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Main Page ----------
export function APIWebhooksPage() {
  usePageTitle('API & Webhooks')
  const { notify } = useToast()
  const [tab, setTab] = useState<TabId>('docs')
  const [webhooks, setWebhooks] = useState<Webhook[]>(loadWebhooks)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(loadApiKeys)
  const [addWebhookOpen, setAddWebhookOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newKeyVisible, setNewKeyVisible] = useState<string | null>(null)

  function copyToClipboard(text: string, id: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  function addWebhook(data: Omit<Webhook, 'id' | 'createdAt'>) {
    const webhook: Webhook = {
      ...data,
      id: `wh-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    const updated = [webhook, ...webhooks]
    setWebhooks(updated)
    saveWebhooks(updated)
    notify('Webhook added')
  }

  function toggleWebhook(id: string) {
    const updated = webhooks.map((w) =>
      w.id === id ? { ...w, active: !w.active } : w,
    )
    setWebhooks(updated)
    saveWebhooks(updated)
  }

  function removeWebhook(id: string) {
    const updated = webhooks.filter((w) => w.id !== id)
    setWebhooks(updated)
    saveWebhooks(updated)
    notify('Webhook removed')
  }

  function generateNewApiKey() {
    const key = generateApiKey()
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: `API Key ${apiKeys.length + 1}`,
      key,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    const updated = [newKey, ...apiKeys]
    setApiKeys(updated)
    saveApiKeys(updated)
    setNewKeyVisible(key)
    notify('API key generated')
  }

  function revokeApiKey(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    const updated = apiKeys.filter((k) => k.id !== id)
    setApiKeys(updated)
    saveApiKeys(updated)
    notify('API key revoked')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">API &amp; Webhooks</h2>
        <p className="mt-1 text-sm text-slate-500">
          Integrate PulseCRM with your systems using the REST API or webhooks.
        </p>
      </div>

      <TabNav
        tabs={TABS.map((t) => ({ id: t, label: TAB_LABELS[t] }))}
        activeTab={tab}
        onChange={(t) => setTab(t as TabId)}
      />

      {/* API Documentation Tab */}
      {tab === 'docs' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Base URL</h3>
            <div className="flex items-center gap-2 rounded-md bg-slate-50 border border-border px-3 py-2 font-mono text-sm text-slate-700">
              <span className="flex-1">{BASE_URL}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(BASE_URL, 'base-url')}
                className="shrink-0 text-slate-400 hover:text-brand-600"
                aria-label="Copy base URL"
              >
                {copiedId === 'base-url' ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Authentication</h3>
            <p className="text-sm text-slate-600 mb-3">
              Include your API key in the Authorization header as a Bearer token.
            </p>
            <div className="rounded-md bg-slate-900 px-4 py-3 font-mono text-xs text-emerald-400">
              Authorization: Bearer YOUR_API_KEY
            </div>
          </div>
          <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-slate-900">Endpoints</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 text-xs text-slate-500">
                  <th className="px-4 py-2 text-left font-medium w-20">Method</th>
                  <th className="px-4 py-2 text-left font-medium">Path</th>
                  <th className="px-4 py-2 text-left font-medium">Description</th>
                  <th className="px-4 py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ENDPOINTS.map((ep, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <span className={['rounded px-2 py-0.5 text-xs font-semibold', METHOD_COLORS[ep.method] ?? ''].join(' ')}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-700">{ep.path}</td>
                    <td className="px-4 py-2 text-slate-600">{ep.description}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`${BASE_URL}${ep.path}`, `ep-${i}`)}
                        className="text-slate-400 hover:text-brand-600"
                        aria-label="Copy endpoint URL"
                      >
                        {copiedId === `ep-${i}` ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Active Webhooks ({webhooks.length})</h3>
            <button
              type="button"
              onClick={() => setAddWebhookOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add Webhook
            </button>
          </div>
          {webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-white px-6 py-16 text-center">
              <h3 className="text-base font-semibold text-slate-900">No webhooks configured</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Add a webhook to receive real-time event notifications in your systems.
              </p>
              <button
                type="button"
                onClick={() => setAddWebhookOpen(true)}
                className="mt-5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Add Webhook
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <div key={wh.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono text-sm font-medium text-slate-900 break-all">
                          {wh.url}
                        </p>
                        <span className={['rounded-full px-2 py-0.5 text-xs font-medium', wh.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'].join(' ')}>
                          {wh.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {wh.events.map((e) => (
                          <span key={e} className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                            {e}
                          </span>
                        ))}
                      </div>
                      {wh.lastTriggered && (
                        <p className="mt-1 text-xs text-slate-400">
                          Last triggered: {wh.lastTriggered}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleWebhook(wh.id)}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        {wh.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeWebhook(wh.id)}
                        className="rounded p-1 text-slate-400 hover:text-red-600"
                        aria-label="Remove webhook"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <AddWebhookModal
            open={addWebhookOpen}
            onClose={() => setAddWebhookOpen(false)}
            onAdd={addWebhook}
          />
        </div>
      )}

      {/* API Keys Tab */}
      {tab === 'keys' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">API Keys</h3>
            <button
              type="button"
              onClick={generateNewApiKey}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Generate Key
            </button>
          </div>
          {newKeyVisible && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800 mb-2">
                Copy your new API key now — it will not be shown again.
              </p>
              <div className="flex items-center gap-2 rounded-md bg-white border border-border px-3 py-2 font-mono text-xs text-slate-700">
                <span className="flex-1 break-all">{newKeyVisible}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(newKeyVisible, 'new-key')}
                  className="shrink-0 text-slate-400 hover:text-brand-600"
                >
                  {copiedId === 'new-key' ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setNewKeyVisible(null)}
                className="mt-2 text-xs text-emerald-700 hover:underline"
              >
                I've copied the key
              </button>
            </div>
          )}
          <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Key</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-left font-medium">Last Used</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{key.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{maskKey(key.key)}</td>
                    <td className="px-4 py-3 text-slate-600">{key.createdAt}</td>
                    <td className="px-4 py-3 text-slate-500">{key.lastUsed ?? 'Never'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => revokeApiKey(key.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
