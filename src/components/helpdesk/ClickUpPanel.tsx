/**
 * ClickUp integration settings panel — rendered inside the Integrations page.
 * Lets the user enter their Personal API Token and configure the target list.
 */
import { CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  DEFAULT_CONFIG,
  getClickUpConfig,
  saveClickUpConfig,
  type ClickUpConfig,
} from '@/lib/clickupConfig'
import { verifyClickUpToken } from '@/services/clickupService'

export function ClickUpSettingsPanel() {
  const [config, setConfig] = useState<ClickUpConfig>(() => getClickUpConfig())
  const [saved, setSaved] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; name?: string; error?: string } | null>(null)
  const [showToken, setShowToken] = useState(false)

  // Persist on every change
  useEffect(() => {
    saveClickUpConfig(config)
  }, [config])

  async function handleVerify() {
    if (!config.apiToken.trim()) return
    setVerifying(true)
    setVerifyResult(null)
    const result = await verifyClickUpToken(config.apiToken.trim())
    setVerifyResult(result)
    if (result.valid) {
      setConfig(prev => ({ ...prev, enabled: true }))
    }
    setVerifying(false)
  }

  function handleSave() {
    saveClickUpConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    const fresh = { ...DEFAULT_CONFIG }
    setConfig(fresh)
    saveClickUpConfig(fresh)
    setVerifyResult(null)
  }

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {config.enabled && config.apiToken ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-800">ClickUp integration active</p>
            <p className="text-xs text-emerald-600">
              Tickets push to{' '}
              <a href={config.listUrl} target="_blank" rel="noreferrer"
                className="underline hover:text-emerald-800">
                {config.listName}
              </a>
            </p>
          </div>
          <a href={config.listUrl} target="_blank" rel="noreferrer"
            className="ml-auto shrink-0 text-emerald-600 hover:text-emerald-800">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <XCircle className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          <p className="text-sm text-slate-600">
            ClickUp integration not configured. Enter your API token below.
          </p>
        </div>
      )}

      {/* API Token */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Personal API Token
          <a href="https://app.clickup.com/settings/apps" target="_blank" rel="noreferrer"
            className="ml-2 text-xs text-brand-600 hover:underline font-normal">
            Get your token ↗
          </a>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showToken ? 'text' : 'password'}
              value={config.apiToken}
              onChange={e => setConfig(prev => ({ ...prev, apiToken: e.target.value, enabled: false }))}
              placeholder="pk_XXXXXXXX..."
              className="h-10 w-full rounded-md border border-border bg-white pr-16 pl-3 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="button"
              onClick={() => setShowToken(v => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              {showToken ? 'Hide' : 'Show'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => void handleVerify()}
            disabled={!config.apiToken.trim() || verifying}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {verifying ? 'Verifying…' : 'Verify'}
          </button>
        </div>

        {/* Verify result */}
        {verifyResult ? (
          <p className={['mt-1.5 text-xs', verifyResult.valid ? 'text-emerald-600' : 'text-red-600'].join(' ')}>
            {verifyResult.valid
              ? `✓ Connected as ${verifyResult.name}`
              : `✕ ${verifyResult.error}`}
          </p>
        ) : null}
      </div>

      {/* Target list config */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Workspace ID
          </label>
          <input
            type="text"
            value={config.workspaceId}
            onChange={e => setConfig(prev => ({ ...prev, workspaceId: e.target.value }))}
            className="h-10 w-full rounded-md border border-border bg-white px-3 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="8447923"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Target List ID
          </label>
          <input
            type="text"
            value={config.listId}
            onChange={e => setConfig(prev => ({ ...prev, listId: e.target.value }))}
            className="h-10 w-full rounded-md border border-border bg-white px-3 font-mono text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="900700247859"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          List name (display only)
        </label>
        <input
          type="text"
          value={config.listName}
          onChange={e => setConfig(prev => ({ ...prev, listName: e.target.value }))}
          className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          placeholder="Fixes and Improvements"
        />
      </div>

      {/* Pre-filled workspace info */}
      <div className="rounded-lg border border-border bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          FleetPanda Workspace (pre-configured)
        </p>
        <div className="space-y-1 text-xs text-slate-600">
          <p><span className="font-medium">Workspace:</span> CRM PURSE · ID <code className="bg-slate-200 px-1 rounded">8447923</code></p>
          <p>
            <span className="font-medium">Default list:</span>{' '}
            <a href="https://app.clickup.com/" target="_blank" rel="noreferrer"
              className="text-brand-600 hover:underline">
              Fixes and Improvements (Eng space)
            </a>
          </p>
          <p><span className="font-medium">Available statuses:</span> to do → in progress → dev testing → pull request → QA → done</p>
        </div>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-white p-4">
        <div>
          <p className="text-sm font-medium text-slate-900">Enable integration</p>
          <p className="text-xs text-slate-500">Allow pushing tickets from the Help Desk to ClickUp</p>
        </div>
        <button
          type="button"
          onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
          disabled={!config.apiToken.trim()}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40',
            config.enabled ? 'bg-brand-600' : 'bg-slate-200',
          ].join(' ')}
          role="switch"
          aria-checked={config.enabled}
        >
          <span className={[
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            config.enabled ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-slate-400 hover:text-red-500 hover:underline"
        >
          Reset to defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={[
            'rounded-md px-4 py-2 text-sm font-medium text-white transition-colors',
            saved ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-brand-700',
          ].join(' ')}
        >
          {saved ? '✓ Saved' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
