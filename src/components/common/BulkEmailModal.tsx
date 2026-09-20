import { Mail, Send, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface Recipient {
  id: string
  name: string
  email: string
}

interface BulkEmailModalProps {
  open: boolean
  recipients: Recipient[]
  onClose: () => void
  onSend: (subject: string, body: string, recipients: Recipient[]) => Promise<void>
  busy?: boolean
}

const TEMPLATES = [
  { id: 'check-in',  name: 'Check-In',         subject: 'Checking in from {ownerName}' },
  { id: 'update',    name: 'Product Update',    subject: 'Exciting updates from {appName}' },
  { id: 'offer',     name: 'Special Offer',     subject: 'An exclusive offer for you' },
  { id: 'feedback',  name: 'Feedback Request',  subject: 'We\'d love your feedback' },
]

export function BulkEmailModal({
  open,
  recipients,
  onClose,
  onSend,
  busy = false,
}: BulkEmailModalProps) {
  const { user } = useAuth()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [showRecipients, setShowRecipients] = useState(false)

  if (!open) return null

  function applyTemplate(id: string) {
    const t = TEMPLATES.find(t => t.id === id)
    if (!t) return
    setSubject(t.subject.replace('{ownerName}', user?.name ?? 'the team').replace('{appName}', 'PulseCRM'))
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return
    await onSend(subject, body, recipients)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.key === 'Escape' && onClose()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand-600" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900">Bulk Email</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Recipients */}
        <div className="border-b border-border bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={() => setShowRecipients(p => !p)}
            className="flex w-full items-center justify-between text-sm"
          >
            <span className="text-slate-600">
              <span className="font-medium text-slate-900">{recipients.length}</span> recipient{recipients.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-brand-600">{showRecipients ? 'Hide' : 'Show'} list</span>
          </button>
          {showRecipients ? (
            <div className="mt-2 max-h-24 overflow-y-auto space-y-0.5">
              {recipients.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="h-4 w-4 rounded-full bg-brand-100 text-[9px] font-bold text-brand-700 flex items-center justify-center">
                    {r.name[0]}
                  </div>
                  <span>{r.name}</span>
                  <span className="text-slate-400">&lt;{r.email}&gt;</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Templates row */}
        <div className="flex gap-2 overflow-x-auto border-b border-border px-5 py-2">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.id)}
              className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Compose */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject line"
            autoFocus
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your message here…&#10;&#10;You can use {name} to personalize each email."
            className="flex-1 resize-none rounded-md border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <p className="text-xs text-slate-400">
            💡 Use <code className="bg-slate-100 px-1 rounded">{'{name}'}</code> to insert each recipient's name. Emails are logged as activities on each record.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-slate-400">
            Sending to {recipients.length} contact{recipients.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={busy || !subject.trim() || !body.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden />
              {busy ? 'Sending…' : `Send to ${recipients.length}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
