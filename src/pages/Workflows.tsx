import { GitBranch, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useToast } from '@/components/common/ToastProvider'

interface WorkflowAction {
  type: string
  label: string
}

interface WorkflowData {
  id: string
  name: string
  description: string
  active: boolean
  trigger: string
  triggerLabel: string
  actions: WorkflowAction[]
  lastRun?: string
  createdAt: string
}

const STORAGE_KEY = 'crm_workflows_v1'

const seedWorkflows: WorkflowData[] = [
  {
    id: 'WF-001',
    name: 'New Lead → Assign & Notify',
    description: 'Automatically assign new leads to a rep and create a follow-up task.',
    active: true,
    trigger: 'lead_created',
    triggerLabel: 'Lead Created',
    actions: [
      { type: 'assign_owner', label: 'Assign to rep (round-robin)' },
      { type: 'create_task', label: 'Create follow-up task (1 day)' },
    ],
    lastRun: '2026-09-18T10:00:00Z',
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'WF-002',
    name: 'Deal Won → Create Task',
    description: 'When a deal is marked as Won, create an onboarding task automatically.',
    active: true,
    trigger: 'deal_won',
    triggerLabel: 'Deal Stage = Won',
    actions: [
      { type: 'create_task', label: 'Create onboarding task' },
      { type: 'send_notification', label: 'Notify manager' },
    ],
    lastRun: '2026-09-15T14:00:00Z',
    createdAt: '2026-08-05T00:00:00Z',
  },
  {
    id: 'WF-003',
    name: 'Lead Converted → Move to Customer',
    description: 'When a lead is converted, automatically create a customer record.',
    active: false,
    trigger: 'lead_converted',
    triggerLabel: 'Lead Converted',
    actions: [
      { type: 'create_customer', label: 'Create customer record' },
      { type: 'create_task', label: 'Schedule welcome call' },
    ],
    createdAt: '2026-08-10T00:00:00Z',
  },
  {
    id: 'WF-004',
    name: 'Overdue Task Alert',
    description: 'Send a notification when a task is past its due date.',
    active: true,
    trigger: 'task_overdue',
    triggerLabel: 'Task Past Due Date',
    actions: [
      { type: 'send_notification', label: 'Notify task owner' },
      { type: 'send_notification', label: 'Notify manager (if 2+ days overdue)' },
    ],
    lastRun: '2026-09-19T08:00:00Z',
    createdAt: '2026-08-15T00:00:00Z',
  },
]

function loadWorkflows(): WorkflowData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WorkflowData[]) : structuredClone(seedWorkflows)
  } catch {
    return structuredClone(seedWorkflows)
  }
}

function saveWorkflows(data: WorkflowData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* quota */ }
}

const TRIGGER_OPTIONS = [
  { value: 'lead_created', label: 'Lead Created' },
  { value: 'lead_converted', label: 'Lead Converted' },
  { value: 'deal_won', label: 'Deal Stage = Won' },
  { value: 'deal_lost', label: 'Deal Stage = Lost' },
  { value: 'task_overdue', label: 'Task Past Due Date' },
  { value: 'customer_created', label: 'Customer Created' },
  { value: 'deal_stage_change', label: 'Deal Stage Changed' },
]

const ACTION_TYPE_OPTIONS = [
  { value: 'assign_owner', label: 'Assign Owner' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'send_email', label: 'Send Email' },
  { value: 'change_status', label: 'Change Status' },
  { value: 'create_customer', label: 'Create Customer Record' },
]

interface WorkflowEditorModalProps {
  open: boolean
  workflow?: WorkflowData | null
  onClose: () => void
  onSave: (wf: Omit<WorkflowData, 'id' | 'createdAt'>) => void
}

function WorkflowEditorModal({ open, workflow, onClose, onSave }: WorkflowEditorModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)
  const [trigger, setTrigger] = useState('lead_created')
  const [actions, setActions] = useState<WorkflowAction[]>([{ type: 'create_task', label: 'Create task' }])

  useEffect(() => {
    if (!open) return
    if (workflow) {
      setName(workflow.name)
      setDescription(workflow.description)
      setActive(workflow.active)
      setTrigger(workflow.trigger)
      setActions(workflow.actions.length > 0 ? workflow.actions : [{ type: 'create_task', label: '' }])
    } else {
      setName('')
      setDescription('')
      setActive(true)
      setTrigger('lead_created')
      setActions([{ type: 'create_task', label: '' }])
    }
  }, [open, workflow])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const triggerLabel = TRIGGER_OPTIONS.find((t) => t.value === trigger)?.label ?? trigger
    onSave({ name, description, active, trigger, triggerLabel, actions })
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
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {workflow ? 'Edit Workflow' : 'Create Workflow'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Name *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Status:</span>
            <button
              type="button"
              onClick={() => setActive((v) => !v)}
              className={[
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600',
              ].join(' ')}
            >
              {active ? 'Active' : 'Inactive'}
            </button>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Trigger</span>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {TRIGGER_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">Actions</span>
            <div className="space-y-2">
              {actions.map((action, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={action.type}
                    onChange={(e) => {
                      const newType = e.target.value
                      const newLabel = ACTION_TYPE_OPTIONS.find((a) => a.value === newType)?.label ?? ''
                      setActions((prev) =>
                        prev.map((a, idx) => idx === i ? { type: newType, label: newLabel } : a)
                      )
                    }}
                    className="h-9 flex-1 rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    {ACTION_TYPE_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                  {actions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setActions((prev) => prev.filter((_, idx) => idx !== i))}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActions((prev) => [...prev, { type: 'create_task', label: 'Create task' }])}
              className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              + Add Action
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              {workflow ? 'Save changes' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function WorkflowsPage() {
  usePageTitle('Workflows')
  const { notify } = useToast()
  const [workflows, setWorkflows] = useState<WorkflowData[]>(loadWorkflows)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WorkflowData | null>(null)

  function toggleActive(id: string) {
    setWorkflows((prev) => {
      const updated = prev.map((wf) => wf.id === id ? { ...wf, active: !wf.active } : wf)
      saveWorkflows(updated)
      return updated
    })
  }

  function handleSave(data: Omit<WorkflowData, 'id' | 'createdAt'>) {
    setWorkflows((prev) => {
      let updated: WorkflowData[]
      if (editing) {
        updated = prev.map((wf) => wf.id === editing.id ? { ...wf, ...data } : wf)
        notify('Workflow updated', 'success')
      } else {
        const newWf: WorkflowData = {
          ...data,
          id: `WF-${String(Date.now()).slice(-4)}`,
          createdAt: new Date().toISOString(),
        }
        updated = [newWf, ...prev]
        notify('Workflow created', 'success')
      }
      saveWorkflows(updated)
      return updated
    })
    setModalOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Workflows</h2>
          <p className="mt-1 text-sm text-slate-500">
            Automate repetitive tasks and processes to save time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Create Workflow
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-10 text-center">
          <GitBranch className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
          <p className="mt-2 text-sm text-slate-500">No workflows yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workflows.map((wf) => (
            <div key={wf.id} className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{wf.name}</h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{wf.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(wf.id)}
                  className="ml-3 shrink-0"
                  title={wf.active ? 'Deactivate' : 'Activate'}
                >
                  {wf.active ? (
                    <ToggleRight className="h-6 w-6 text-emerald-500" aria-hidden />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-slate-400" aria-hidden />
                  )}
                </button>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 w-14 shrink-0">Trigger:</span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {wf.triggerLabel}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-slate-500 w-14 shrink-0 pt-0.5">Actions:</span>
                  <div className="flex flex-wrap gap-1">
                    {wf.actions.map((action, i) => (
                      <span key={i} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {action.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {wf.lastRun && <span>Last run: {new Date(wf.lastRun).toLocaleDateString()}</span>}
                  <span className={[
                    'rounded-full px-2 py-0.5 font-medium',
                    wf.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600',
                  ].join(' ')}>
                    {wf.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setEditing(wf); setModalOpen(true) }}
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-900">Workflow execution is a UI preview</p>
        <p className="mt-0.5 text-xs text-amber-700">
          Workflows defined here are saved but do not execute automatically. Connect a backend to enable real automation.
        </p>
      </div>

      <WorkflowEditorModal
        open={modalOpen}
        workflow={editing}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
      />
    </div>
  )
}
