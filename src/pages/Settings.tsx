import { Bell, Check, Lock, Shield, X, Plus, Trash2, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { multiFactor } from 'firebase/auth'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useUsers } from '@/hooks/useUsers'
import { useCustomFields, useCreateCustomField, useDeleteCustomField } from '@/hooks/useCustomFields'
import { useToast } from '@/components/common/ToastProvider'
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal'
import { TwoFactorSetupModal } from '@/components/settings/TwoFactorModal'
import { firebaseAuth } from '@/lib/firebase'
import type { CustomField, CustomFieldType } from '@/types/customField'

const ROLE_LABELS: Record<string, string> = {
  admin:       'Admin',
  manager:     'Manager',
  sales_agent: 'Sales Agent',
  support:     'Support Agent',
}


function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  )
}

const PERMISSIONS_MATRIX: {
  capability: string
  admin: boolean
  manager: boolean
  agent: boolean
  support: boolean
}[] = [
  // Customers
  { capability: 'View customers',                   admin: true,  manager: true,  agent: true,  support: true  },
  { capability: 'Create / edit customers',           admin: true,  manager: true,  agent: true,  support: false },
  { capability: 'Delete customers',                  admin: true,  manager: true,  agent: false, support: false },
  // Leads & Sales
  { capability: 'View & manage leads',               admin: true,  manager: true,  agent: true,  support: false },
  { capability: 'Convert leads to customers',        admin: true,  manager: true,  agent: false, support: false },
  { capability: 'View & manage deals',               admin: true,  manager: true,  agent: true,  support: false },
  { capability: 'Move deal stages',                  admin: true,  manager: true,  agent: false, support: false },
  // Help Desk
  { capability: 'View Help Desk tickets',            admin: true,  manager: true,  agent: true,  support: true  },
  { capability: 'Create & reply to tickets',         admin: true,  manager: true,  agent: true,  support: true  },
  { capability: 'Change ticket status',              admin: true,  manager: true,  agent: true,  support: true  },
  { capability: 'Add internal notes',                admin: true,  manager: true,  agent: true,  support: true  },
  { capability: 'Push tickets to ClickUp',           admin: true,  manager: true,  agent: false, support: true  },
  // Data
  { capability: 'Bulk delete records',               admin: true,  manager: true,  agent: false, support: false },
  { capability: 'Export CSV data',                   admin: true,  manager: true,  agent: false, support: false },
  // Intelligence
  { capability: 'Access Reports & Analytics',        admin: true,  manager: true,  agent: false, support: false },
  { capability: 'Access Forecasting & Goals',        admin: true,  manager: true,  agent: false, support: false },
  // Admin
  { capability: 'Manage workflows & automation',     admin: true,  manager: true,  agent: false, support: false },
  { capability: 'Configure ClickUp integration',     admin: true,  manager: false, agent: false, support: true  },
  { capability: 'Manage team & users',               admin: true,  manager: false, agent: false, support: false },
  { capability: 'View Audit Log',                    admin: true,  manager: false, agent: false, support: false },
  { capability: 'API & Webhooks',                    admin: true,  manager: false, agent: false, support: false },
]

const CF_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  select: 'Select',
  checkbox: 'Checkbox',
  url: 'URL',
}

function AddCustomFieldForm({ onClose }: { onClose: () => void }) {
  const create = useCreateCustomField()
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [type, setType] = useState<CustomFieldType>('text')
  const [entityType, setEntityType] = useState<CustomField['entityType']>('customer')
  const [required, setRequired] = useState(false)
  const [options, setOptions] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !key.trim()) return
    await create.mutateAsync({
      name: name.trim(),
      key: key.trim().toLowerCase().replace(/\s+/g, '_'),
      type,
      entityType,
      required,
      options: type === 'select' ? options.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
    })
    onClose()
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 rounded-lg border border-border p-4 space-y-3 bg-slate-50">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-700">Field Name *</span>
          <input value={name} onChange={(e) => { setName(e.target.value); setKey(e.target.value.toLowerCase().replace(/\s+/g, '_')) }} required className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-700">Key (snake_case)</span>
          <input value={key} onChange={(e) => setKey(e.target.value)} className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-700">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value as CustomFieldType)} className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500">
            {(Object.keys(CF_TYPE_LABELS) as CustomFieldType[]).map((t) => <option key={t} value={t}>{CF_TYPE_LABELS[t]}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-700">Entity</span>
          <select value={entityType} onChange={(e) => setEntityType(e.target.value as CustomField['entityType'])} className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500">
            <option value="customer">Customer</option>
            <option value="lead">Lead</option>
            <option value="deal">Deal</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm pt-5">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="h-3.5 w-3.5" />
          <span className="text-xs text-slate-700">Required</span>
        </label>
      </div>
      {type === 'select' && (
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-700">Options (comma-separated)</span>
          <input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Option 1, Option 2, Option 3" className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500" />
        </label>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={create.isPending} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {create.isPending ? 'Adding…' : 'Add Field'}
        </button>
        <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">Cancel</button>
      </div>
    </form>
  )
}

export function SettingsPage() {
  usePageTitle('Settings')
  const { user } = useAuth()
  const { notify } = useToast()
  const { data: users = [] } = useUsers()
  const { data: customFields = [] } = useCustomFields()
  const deleteField = useDeleteCustomField()
  const [showAddField, setShowAddField] = useState(false)
  const [showChangePw, setShowChangePw] = useState(false)
  const [showSetup2fa, setShowSetup2fa] = useState(false)
  const [is2faEnabled, setIs2faEnabled] = useState(false)
  const [disabling2fa, setDisabling2fa] = useState(false)

  // Check 2FA enrollment status
  useEffect(() => {
    const fbUser = firebaseAuth.currentUser
    if (!fbUser) return
    const factors = multiFactor(fbUser).enrolledFactors
    setIs2faEnabled(factors.length > 0)
  }, [])

  async function handleDisable2fa() {
    const fbUser = firebaseAuth.currentUser
    if (!fbUser) return
    setDisabling2fa(true)
    try {
      const factors = multiFactor(fbUser).enrolledFactors
      for (const factor of factors) {
        await multiFactor(fbUser).unenroll(factor)
      }
      setIs2faEnabled(false)
      notify('Two-factor authentication disabled', 'success')
    } catch {
      notify('Failed to disable 2FA. Please try again.', 'error')
    } finally {
      setDisabling2fa(false)
    }
  }

  return (
    <>
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account, team, and application preferences.
        </p>
      </div>

      {/* My Profile */}
      <SectionCard
        title="My Profile"
        description="Your account information. Contact your admin to update your name or role."
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
            {user?.avatarInitials ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{user?.name ?? '—'}</p>
            <p className="text-xs text-slate-500 capitalize">
              {user ? ROLE_LABELS[user.role] : '—'}
            </p>
          </div>
        </div>

        <div className="divide-y divide-border rounded-md border border-border">
          <div className="px-4">
            <InfoRow label="Full name" value={user?.name ?? '—'} />
            <InfoRow label="Email" value={user?.email ?? '—'} />
            <InfoRow label="Role" value={user ? ROLE_LABELS[user.role] : '—'} />
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
          <Lock className="h-3 w-3" aria-hidden />
          Profile changes require backend access — available when Rails API is connected.
        </p>
      </SectionCard>

      {/* Team Members */}
      <SectionCard
        title="Team Members"
        description="Active users with access to this CRM workspace."
      >
        <div className="space-y-3">
          {users.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
                  {member.avatarInitials}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {ROLE_LABELS[member.role] ?? member.role}
                </span>
                {member.status === 'active' ? (
                  <span className="h-2 w-2 rounded-full bg-emerald-400" title="Active" />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard
        title="Notifications"
        description="Configure how and when you receive alerts."
      >
        <div className="space-y-3">
          {[
            { label: 'New lead assigned to me', enabled: true },
            { label: 'Deal stage change', enabled: true },
            { label: 'Task due today', enabled: true },
            { label: 'Customer activity updates', enabled: false },
            { label: 'Weekly pipeline summary', enabled: false },
          ].map((pref) => (
            <div
              key={pref.label}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm text-slate-700">{pref.label}</span>
              <span
                className={[
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  pref.enabled
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500',
                ].join(' ')}
              >
                {pref.enabled ? 'On' : 'Off'}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
          <Bell className="h-3 w-3" aria-hidden />
          Notification preferences will be configurable when the backend is connected.
        </p>
      </SectionCard>

      {/* Security */}
      <SectionCard
        title="Security"
        description="Manage your password and two-factor authentication."
      >
        <div className="space-y-3">
          {/* Password */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-slate-400" aria-hidden />
              <div>
                <p className="text-sm font-medium text-slate-900">Password</p>
                <p className="text-xs text-slate-500">Update your account password</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowChangePw(true)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Change
            </button>
          </div>

          {/* 2FA */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              {is2faEnabled
                ? <ShieldCheck className="h-5 w-5 text-emerald-500" aria-hidden />
                : <Lock className="h-5 w-5 text-slate-400" aria-hidden />
              }
              <div>
                <p className="text-sm font-medium text-slate-900">Two-factor authentication</p>
                <p className="text-xs text-slate-500">
                  {is2faEnabled
                    ? 'Enabled — TOTP authenticator app'
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
            </div>
            {is2faEnabled ? (
              <button
                type="button"
                onClick={() => void handleDisable2fa()}
                disabled={disabling2fa}
                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {disabling2fa ? 'Disabling…' : 'Disable'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSetup2fa(true)}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Custom Fields */}
      <SectionCard
        title="Custom Fields"
        description="Add extra fields to customers, leads, and deals to capture additional data."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Key</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Entity</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Required</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customFields.map((cf) => (
                <tr key={cf.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">{cf.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{cf.key}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {CF_TYPE_LABELS[cf.type]}
                    </span>
                  </td>
                  <td className="px-3 py-2 capitalize text-slate-700">{cf.entityType}</td>
                  <td className="px-3 py-2">
                    {cf.required ? (
                      <Check className="h-4 w-4 text-emerald-500" aria-label="Required" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300" aria-label="Optional" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => void deleteField.mutateAsync(cf.id)}
                      className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
              {customFields.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-xs text-slate-400">
                    No custom fields yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {showAddField ? (
          <AddCustomFieldForm onClose={() => setShowAddField(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setShowAddField(true)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add custom field
          </button>
        )}
      </SectionCard>

      {/* Permissions Matrix */}
      <SectionCard
        title="Permissions"
        description="Role-based access control for this CRM workspace."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-2.5 pr-4 text-left text-xs font-medium text-slate-500 w-56">Capability</th>
                <th className="py-2.5 px-3 text-center text-xs font-medium text-purple-700">Admin</th>
                <th className="py-2.5 px-3 text-center text-xs font-medium text-blue-700">Manager</th>
                <th className="py-2.5 px-3 text-center text-xs font-medium text-slate-600">Sales Agent</th>
                <th className="py-2.5 px-3 text-center text-xs font-medium text-violet-700">Support Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PERMISSIONS_MATRIX.map((row) => (
                <tr key={row.capability} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-2 pr-4 text-xs text-slate-700">{row.capability}</td>
                  {([row.admin, row.manager, row.agent, row.support] as boolean[]).map((allowed, i) => (
                    <td key={i} className="py-2 px-3 text-center">
                      {allowed ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-500" aria-label="Allowed" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-red-300" aria-label="Not allowed" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { role: 'Admin',         color: 'border-purple-200 bg-purple-50', text: 'text-purple-900', desc: 'Full access to all features, user management, and system config.' },
            { role: 'Manager',       color: 'border-blue-200 bg-blue-50',     text: 'text-blue-900',   desc: 'Manage team records, access reports, forecasting, and analytics.' },
            { role: 'Sales Agent',   color: 'border-slate-200 bg-slate-50',   text: 'text-slate-900',  desc: 'Create and manage own customer, lead, and deal records.' },
            { role: 'Support Agent', color: 'border-violet-200 bg-violet-50', text: 'text-violet-900', desc: 'Full Help Desk access, view customers, ClickUp integration.' },
          ].map((r) => (
            <div key={r.role} className={['rounded-md border p-3', r.color].join(' ')}>
              <p className={['text-xs font-semibold', r.text].join(' ')}>{r.role}</p>
              <p className="mt-0.5 text-xs text-slate-600">{r.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
          <Shield className="h-3 w-3" aria-hidden />
          Permissions are enforced server-side when the Rails API is connected.
        </p>
      </SectionCard>

      {/* Developer Tools */}
      <SectionCard
        title="Developer Tools"
        description="Reset demo data for testing purposes."
      >
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div>
            <p className="text-sm font-medium text-amber-900">Reset all demo data</p>
            <p className="text-xs text-amber-700">
              Clears localStorage and restores seed data on next reload.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const keys = [
                'crm_customers_v1',
                'crm_leads_v1',
                'crm_deals_v1',
                'crm_activities_v1',
              ]
              keys.forEach((k) => localStorage.removeItem(k))
              window.location.reload()
            }}
            className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Reset Data
          </button>
        </div>
      </SectionCard>
    </div>

    <ChangePasswordModal
      open={showChangePw}
      userEmail={user?.email ?? ''}
      onClose={() => setShowChangePw(false)}
      onSuccess={() => {
        setShowChangePw(false)
        notify('Password updated successfully', 'success')
      }}
    />

    <TwoFactorSetupModal
      open={showSetup2fa}
      userEmail={user?.email ?? ''}
      onClose={() => setShowSetup2fa(false)}
      onEnrolled={() => {
        setIs2faEnabled(true)
        setShowSetup2fa(false)
        notify('Two-factor authentication enabled', 'success')
      }}
    />
    </>
  )
}
