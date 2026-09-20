import { Mail, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
}

const TEMPLATES: EmailTemplate[] = [
  {
    id: 'intro',
    name: 'Introduction',
    subject: 'Introduction – {ownerName} from PulseCRM',
    body: `Hi {contactName},

I hope this message finds you well. My name is {ownerName} and I work with companies like {company} to help streamline their sales process.

I'd love to schedule a quick 20-minute call to learn more about your current challenges and share how we might be able to help.

Would any time this week or next work for you?

Best regards,
{ownerName}`,
  },
  {
    id: 'follow-up',
    name: 'Follow-Up',
    subject: 'Following up – {company}',
    body: `Hi {contactName},

I wanted to follow up on my previous message. I know things get busy, so I thought I'd reach out one more time.

We've helped companies similar to {company} achieve significant improvements in their sales pipeline. I'd love to show you how.

Are you available for a brief call this week?

Best,
{ownerName}`,
  },
  {
    id: 'proposal',
    name: 'Proposal Sent',
    subject: 'Proposal for {company} – {dealTitle}',
    body: `Hi {contactName},

Thank you for our conversation earlier. As promised, I've attached the proposal for {dealTitle}.

Key highlights:
• Tailored solution for {company}'s specific needs
• Flexible implementation timeline
• Dedicated support throughout onboarding

Please review at your convenience. I'm happy to walk you through anything in detail — just let me know.

Looking forward to your feedback!

Best regards,
{ownerName}`,
  },
  {
    id: 'check-in',
    name: 'Check-In',
    subject: 'Checking in – {company}',
    body: `Hi {contactName},

Hope all is well! I'm reaching out to check in and see if you've had a chance to review the materials I sent over.

I'm here if you have any questions or would like to discuss next steps.

Best,
{ownerName}`,
  },
  {
    id: 'thanks',
    name: 'Thank You',
    subject: 'Thank you – {company}',
    body: `Hi {contactName},

Thank you so much for taking the time to meet with me today. It was great learning more about {company} and your goals.

I'll send over the next steps we discussed. In the meantime, please don't hesitate to reach out if anything comes to mind.

Really looking forward to working together!

Best regards,
{ownerName}`,
  },
]

function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/{(\w+)}/g, (_, key) => vars[key] ?? `{${key}}`)
}

interface EmailComposerModalProps {
  open: boolean
  toName?: string
  toEmail?: string
  company?: string
  dealTitle?: string
  onClose: () => void
  onSend: (subject: string, body: string) => void
  busy?: boolean
}

export function EmailComposerModal({
  open,
  toName = '',
  toEmail = '',
  company = '',
  dealTitle = '',
  onClose,
  onSend,
  busy = false,
}: EmailComposerModalProps) {
  const { user } = useAuth()
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const vars: Record<string, string> = {
    contactName: toName || 'there',
    company: company || 'your company',
    ownerName: user?.name ?? 'the team',
    dealTitle: dealTitle || 'our proposal',
  }

  useEffect(() => {
    if (!open) {
      setSelectedTemplate('')
      setSubject('')
      setBody('')
    }
  }, [open])

  function applyTemplate(templateId: string) {
    setSelectedTemplate(templateId)
    const t = TEMPLATES.find((t) => t.id === templateId)
    if (t) {
      setSubject(fillTemplate(t.subject, vars))
      setBody(fillTemplate(t.body, vars))
    }
  }

  function handleSend() {
    if (!subject.trim() || !body.trim()) return
    onSend(subject, body)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand-600" aria-hidden />
            <h2 className="text-base font-semibold text-slate-900">Compose Email</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Template sidebar */}
          <div className="w-44 shrink-0 border-r border-border bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Templates
            </p>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className={[
                  'mb-1 w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors',
                  selectedTemplate === t.id
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-200',
                ].join(' ')}
              >
                {t.name}
              </button>
            ))}
            <p className="mt-3 text-[10px] text-slate-400 leading-relaxed">
              Templates auto-fill with contact name, company, and your name.
            </p>
          </div>

          {/* Compose area */}
          <div className="flex min-h-0 flex-1 flex-col p-4 gap-3">
            {/* To */}
            <div className="flex items-center gap-2 rounded-md border border-border bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-400 font-medium w-6">To</span>
              <span className="text-slate-700">
                {toName ? `${toName} <${toEmail}>` : toEmail || '—'}
              </span>
            </div>

            {/* Subject */}
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              autoFocus
              className="h-10 rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />

            {/* Body */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email here, or select a template on the left…"
              className="flex-1 resize-none rounded-md border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 font-mono leading-relaxed"
            />

            <p className="text-xs text-slate-400">
              💡 This logs the email as an Activity on the record. No real email is sent.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <div className="text-xs text-slate-400">
            {body.length > 0 ? `${body.split('\n').length} lines · ${body.length} chars` : 'Empty'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={busy || !subject.trim() || !body.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Mail className="h-4 w-4" aria-hidden />
              {busy ? 'Sending…' : 'Log Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
