import { Mail, Plus, X, PlayCircle, PauseCircle, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useToast } from '@/components/common/ToastProvider'

type SequenceStatus = 'Active' | 'Paused' | 'Draft'

interface EmailStep {
  id: string
  delay: number
  subject: string
  body: string
}

interface EmailSequence {
  id: string
  name: string
  status: SequenceStatus
  trigger: string
  triggerLabel: string
  steps: EmailStep[]
  enrolledCount: number
  openRate: number
  createdAt: string
}

const STORAGE_KEY = 'crm_email_sequences'

const TRIGGER_OPTIONS = [
  { value: 'lead_created', label: 'Lead Created' },
  { value: 'deal_stage_change', label: 'Deal Stage Changed' },
  { value: 'manual', label: 'Manual Enrollment' },
  { value: 'customer_created', label: 'Customer Created' },
]

const seedSequences: EmailSequence[] = [
  {
    id: 'SEQ-001',
    name: 'New Lead Welcome',
    status: 'Active',
    trigger: 'lead_created',
    triggerLabel: 'Lead Created',
    steps: [
      { id: 's1', delay: 0, subject: 'Welcome! Here is what we can do for you', body: 'Hi {{name}},\n\nThank you for your interest. We would love to show you what {{company}} can do...' },
      { id: 's2', delay: 3, subject: 'Resources to help you get started', body: 'Hi {{name}},\n\nHere are some resources that might be helpful...' },
      { id: 's3', delay: 7, subject: 'Quick question for you', body: 'Hi {{name}},\n\nI wanted to follow up to see if you had any questions...' },
    ],
    enrolledCount: 47,
    openRate: 68,
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'SEQ-002',
    name: 'Trial Expiry Reminder',
    status: 'Active',
    trigger: 'manual',
    triggerLabel: 'Manual Enrollment',
    steps: [
      { id: 's1', delay: 7, subject: 'Your trial expires in 7 days', body: 'Hi {{name}},\n\nYour trial is ending soon. Here is how to upgrade...' },
      { id: 's2', delay: 3, subject: 'Your trial expires in 3 days — special offer inside', body: 'Hi {{name}},\n\nWe want to make it easy for you to stay. For a limited time...' },
      { id: 's3', delay: 1, subject: 'Last day of your trial', body: 'Hi {{name}},\n\nToday is your last day. Click here to continue...' },
    ],
    enrolledCount: 23,
    openRate: 74,
    createdAt: '2026-08-10T00:00:00Z',
  },
  {
    id: 'SEQ-003',
    name: 'Win-Back Campaign',
    status: 'Paused',
    trigger: 'manual',
    triggerLabel: 'Manual Enrollment',
    steps: [
      { id: 's1', delay: 0, subject: 'We miss you at {{company}}', body: 'Hi {{name}},\n\nIt has been a while! A lot has changed since you last used us...' },
      { id: 's2', delay: 14, subject: 'Special offer just for you', body: 'Hi {{name}},\n\nWe would love to have you back. Here is an exclusive offer...' },
    ],
    enrolledCount: 12,
    openRate: 45,
    createdAt: '2026-08-20T00:00:00Z',
  },
]

let nextStepId = Date.now()

function loadSequences(): EmailSequence[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as EmailSequence[]) : structuredClone(seedSequences)
  } catch {
    return structuredClone(seedSequences)
  }
}

function saveSequences(data: EmailSequence[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* quota */ }
}

function newStep(): EmailStep {
  return { id: `step-${nextStepId++}`, delay: 3, subject: '', body: '' }
}

const STATUS_STYLES: Record<SequenceStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Paused: 'bg-amber-50 text-amber-700',
  Draft: 'bg-slate-100 text-slate-600',
}

interface SequenceBuilderModalProps {
  open: boolean
  sequence?: EmailSequence | null
  onClose: () => void
  onSave: (seq: Omit<EmailSequence, 'id' | 'createdAt' | 'enrolledCount' | 'openRate'>) => void
}

function SequenceBuilderModal({ open, sequence, onClose, onSave }: SequenceBuilderModalProps) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState<SequenceStatus>('Draft')
  const [trigger, setTrigger] = useState('lead_created')
  const [steps, setSteps] = useState<EmailStep[]>([newStep()])

  useEffect(() => {
    if (!open) return
    if (sequence) {
      setName(sequence.name)
      setStatus(sequence.status)
      setTrigger(sequence.trigger)
      setSteps(sequence.steps.length > 0 ? sequence.steps : [newStep()])
    } else {
      setName('')
      setStatus('Draft')
      setTrigger('lead_created')
      setSteps([newStep()])
    }
  }, [open, sequence])

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
    onSave({ name, status, trigger, triggerLabel, steps })
  }

  function updateStep(id: string, patch: Partial<EmailStep>) {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s))
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
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {sequence ? 'Edit Sequence' : 'Create Sequence'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Sequence Name *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                required
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SequenceStatus)}
                className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
              </select>
            </label>
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
            <span className="mb-2 block text-sm font-medium text-slate-700">Email Steps</span>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={step.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Step {i + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600">
                        Send after
                        <input
                          type="number"
                          min={0}
                          value={step.delay}
                          onChange={(e) => updateStep(step.id, { delay: Number(e.target.value) })}
                          className="h-7 w-14 rounded-md border border-border bg-white px-2 text-xs outline-none focus:border-brand-500"
                        />
                        day{step.delay !== 1 ? 's' : ''}
                      </label>
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSteps((prev) => prev.filter((s) => s.id !== step.id))}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    value={step.subject}
                    onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                    placeholder="Email subject…"
                    className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100"
                  />
                  <textarea
                    value={step.body}
                    onChange={(e) => updateStep(step.id, { body: e.target.value })}
                    placeholder="Email body… Use {{name}}, {{company}} for personalization."
                    rows={3}
                    className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100 resize-none"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSteps((prev) => [...prev, newStep()])}
              className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              + Add Step
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
              {sequence ? 'Save changes' : 'Create Sequence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function EmailAutomationPage() {
  usePageTitle('Email Automation')
  const { notify } = useToast()
  const [sequences, setSequences] = useState<EmailSequence[]>(loadSequences)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EmailSequence | null>(null)

  function handleSave(data: Omit<EmailSequence, 'id' | 'createdAt' | 'enrolledCount' | 'openRate'>) {
    setSequences((prev) => {
      let updated: EmailSequence[]
      if (editing) {
        updated = prev.map((s) => s.id === editing.id ? { ...s, ...data } : s)
        notify('Sequence updated', 'success')
      } else {
        const newSeq: EmailSequence = {
          ...data,
          id: `SEQ-${String(Date.now()).slice(-4)}`,
          enrolledCount: 0,
          openRate: 0,
          createdAt: new Date().toISOString(),
        }
        updated = [newSeq, ...prev]
        notify('Sequence created', 'success')
      }
      saveSequences(updated)
      return updated
    })
    setModalOpen(false)
    setEditing(null)
  }

  function toggleStatus(id: string) {
    setSequences((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== id) return s
        const next: SequenceStatus = s.status === 'Active' ? 'Paused' : 'Active'
        return { ...s, status: next }
      })
      saveSequences(updated)
      return updated
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Email Automation</h2>
          <p className="mt-1 text-sm text-slate-500">
            Build drip campaigns and nurture sequences to engage leads and customers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Create Sequence
        </button>
      </div>

      {sequences.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-10 text-center">
          <Mail className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
          <p className="mt-2 text-sm text-slate-500">No sequences yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sequences.map((seq) => (
            <div key={seq.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                  <Mail className="h-4 w-4 text-amber-600" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{seq.name}</h3>
                    <span className={['rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[seq.status]].join(' ')}>
                      {seq.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {seq.steps.length} email{seq.steps.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Trigger: {seq.triggerLabel}</span>
                    <span>{seq.enrolledCount} enrolled</span>
                    <span>{seq.openRate}% open rate</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleStatus(seq.id)}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                    title={seq.status === 'Active' ? 'Pause' : 'Activate'}
                  >
                    {seq.status === 'Active' ? (
                      <PauseCircle className="h-4 w-4 text-amber-500" aria-hidden />
                    ) : (
                      <PlayCircle className="h-4 w-4 text-emerald-500" aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(seq); setModalOpen(true) }}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <FileText className="h-3.5 w-3.5 inline-block mr-1" aria-hidden />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-900">Email delivery is a UI preview</p>
        <p className="mt-0.5 text-xs text-amber-700">
          Sequences are saved but emails are not sent. Connect a mail provider (Sendgrid, Postmark) to enable real delivery.
        </p>
      </div>

      <SequenceBuilderModal
        open={modalOpen}
        sequence={editing}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
      />
    </div>
  )
}
