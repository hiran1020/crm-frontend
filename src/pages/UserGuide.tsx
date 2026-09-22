import {
  Activity,
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Code2,
  Command,
  FileText,
  Filter,
  Headphones,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Tag,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'

/* ─── Section registry ───────────────────────────────────────────────────── */

interface Section { id: string; title: string; icon: typeof LayoutDashboard }

const SECTIONS: Section[] = [
  { id: 'getting-started', title: 'Getting Started',       icon: Zap            },
  { id: 'dashboard',       title: 'Dashboard',              icon: LayoutDashboard },
  { id: 'customers',       title: 'Customers',              icon: Users          },
  { id: 'leads',           title: 'Leads',                  icon: UserPlus       },
  { id: 'deals',           title: 'Sales Pipeline',         icon: Briefcase      },
  { id: 'quotes',          title: 'Quotes & Proposals',     icon: FileText       },
  { id: 'helpdesk',        title: 'Help Desk',              icon: Headphones     },
  { id: 'activities',      title: 'Activities',             icon: Activity       },
  { id: 'tasks',           title: 'Tasks',                  icon: CheckSquare    },
  { id: 'calendar',        title: 'Calendar',               icon: CalendarDays   },
  { id: 'reports',         title: 'Reports & Analytics',    icon: BarChart3      },
  { id: 'forecasting',     title: 'Forecasting & Goals',    icon: LineChart      },
  { id: 'renewals',        title: 'Renewals',               icon: RefreshCw      },
  { id: 'automation',      title: 'Segments & Automation',  icon: Filter         },
  { id: 'files-tags',      title: 'Files, Tags & AI',       icon: Tag            },
  { id: 'integrations',    title: 'ClickUp Integration',    icon: Code2          },
  { id: 'notifications',   title: 'Notifications',          icon: Bell           },
  { id: 'shortcuts',       title: 'Keyboard Shortcuts',     icon: Command        },
  { id: 'roles',           title: 'Roles & Permissions',    icon: Shield         },
  { id: 'faq',             title: 'FAQ',                    icon: HelpCircle     },
]

/* ─── Reusable building blocks ───────────────────────────────────────────── */

function GuideSection({ id, title, icon: Icon, children }: {
  id: string; title: string; icon: typeof LayoutDashboard; children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-slate-700">{children}</div>
    </section>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
      <p className="text-blue-800">{children}</p>
    </div>
  )
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
      <p className="text-amber-800">{children}</p>
    </div>
  )
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {i + 1}
          </span>
          <span className="leading-6 text-slate-700">{step}</span>
        </li>
      ))}
    </ol>
  )
}

function Kbd({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k, i) => (
        k === 'then' ? (
          <span key={i} className="text-xs text-slate-400">then</span>
        ) : (
          <kbd key={i} className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-slate-300 bg-slate-100 px-1.5 text-xs font-medium text-slate-700">
            {k}
          </kbd>
        )
      ))}
    </span>
  )
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-slate-700">{description}</span>
      <Kbd keys={keys} />
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: {
  icon: typeof LayoutDashboard; title: string; description: string
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <p className="font-medium text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export function UserGuidePage() {
  usePageTitle('User Guide')

  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState('getting-started')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    )
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const filteredSections = search.trim()
    ? SECTIONS.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : SECTIONS

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex gap-6">
      {/* Sticky ToC */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-4 space-y-1">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Contents</p>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter…"
              className="h-8 w-full rounded-md border border-border bg-white pl-8 pr-3 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          {filteredSections.map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={[
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                activeId === id
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {title}
            </button>
          ))}
        </div>
      </aside>

      {/* Content */}
      <div ref={contentRef} className="min-w-0 flex-1 space-y-12">

        {/* Hero card */}
        <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <FileText className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">PulseCRM User Guide</h1>
              <p className="mt-1 text-slate-500">
                Complete documentation for all roles — Sales, Management, Support, and Admin.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SECTIONS.slice(0, 6).map(({ id, title }) => (
                  <button key={id} type="button" onClick={() => scrollTo(id)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100">
                    {title} <ChevronRight className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── GETTING STARTED ────────────────────────────────────────── */}
        <GuideSection id="getting-started" title="Getting Started" icon={Zap}>
          <p>PulseCRM is a full-featured CRM supporting four distinct roles — each with a tailored experience and access level.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <FeatureCard icon={Users}      title="Customer Management" description="Store, segment, and track all your accounts with 360° profiles" />
            <FeatureCard icon={UserPlus}   title="Lead Tracking"       description="Capture, score, and convert leads with smart automation" />
            <FeatureCard icon={Briefcase}  title="Deal Pipeline"       description="Kanban board with drag-and-drop and win/loss tracking" />
            <FeatureCard icon={Headphones} title="Help Desk"           description="Full ticket queue with ClickUp integration for dev escalation" />
            <FeatureCard icon={BarChart3}  title="Reports & Analytics" description="Pipeline charts, forecasting, and team performance metrics" />
            <FeatureCard icon={Sparkles}   title="AI Insights"         description="Context-aware suggestions on every customer, lead, and deal" />
          </div>

          <h3 className="font-semibold text-slate-900">Demo accounts</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">Email</th>
                  <th className="px-4 py-2.5 text-left">Password</th>
                  <th className="px-4 py-2.5 text-left">Role</th>
                  <th className="px-4 py-2.5 text-left">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['admin@crm.com',  'password', 'Admin',         'Full access to every feature and setting'],
                  ['sarah@crm.com',  'password', 'Manager',       'Sales + reports, team records, forecasting'],
                  ['david@crm.com',  'password', 'Sales Agent',   'Own records, pipeline, activities'],
                  ['alex@crm.com',   'password', 'Support Agent', 'Help Desk focus — tickets, customers (view)'],
                ].map(([email, pw, role, access]) => (
                  <tr key={email}>
                    <td className="px-4 py-2.5 font-mono text-brand-600">{email}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-700">{pw}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{role}</td>
                    <td className="px-4 py-2.5 text-slate-500">{access}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold text-slate-900">Navigation</h3>
          <p>
            Use the <strong>left sidebar</strong> to move between modules. On mobile, tap <strong>☰</strong> to open the drawer.
            The sidebar adapts to your role — Support Agents see a violet "Support Agent" badge and a Help Desk-focused menu.
            A <strong>red badge</strong> on Tasks and Help Desk shows overdue/urgent counts.
          </p>

          <Tip>Press <strong>⌘K</strong> (Ctrl+K) anywhere to open global search across customers, leads, and deals. Press <strong>?</strong> to see all keyboard shortcuts.</Tip>
        </GuideSection>

        {/* ── DASHBOARD ────────────────────────────────────────────── */}
        <GuideSection id="dashboard" title="Dashboard" icon={LayoutDashboard}>
          <p>The Dashboard shows at a glance what matters most for your role.</p>

          <h3 className="font-semibold text-slate-900">Sales & Management dashboard</h3>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li><strong>4 stat cards</strong> — Total Customers, New Leads, Open Deals, Pipeline Revenue (click any to navigate)</li>
            <li><strong>Revenue Forecast</strong> — Committed (Won), Weighted Pipeline, Best Case</li>
            <li><strong>Monthly Revenue Goal</strong> — set your target; progress bar turns green as you close deals</li>
            <li><strong>Sales Pipeline chart</strong> — deal value by stage</li>
            <li><strong>Tasks Due Soon</strong> — overdue + today's tasks at a glance</li>
            <li><strong>Team Performance</strong> — deals won, revenue, and activities per rep</li>
            <li><strong>Recent Activities & Deals</strong> — clickable links to detail pages</li>
          </ul>

          <h3 className="font-semibold text-slate-900">Support Agent dashboard</h3>
          <p>When logged in as a Support Agent, the Dashboard shows a <strong>help-desk-focused view</strong>:</p>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li><strong>Open / Critical / Assigned to me / Resolved</strong> ticket counts</li>
            <li><strong>My Open Tickets</strong> — sorted by priority with direct links</li>
            <li><strong>Critical tickets</strong> panel — unassigned critical items needing action</li>
            <li><strong>Queue Overview</strong> — visual breakdown of ticket statuses</li>
          </ul>

          <Tip>The dashboard updates every 30 seconds. A pulsing green "Live" badge confirms real-time refresh is active.</Tip>
        </GuideSection>

        {/* ── CUSTOMERS ────────────────────────────────────────────── */}
        <GuideSection id="customers" title="Customers" icon={Users}>
          <p>Customers are existing accounts. Every deal must be linked to a customer. Support Agents can view customers but not create or edit them.</p>

          <h3 className="font-semibold text-slate-900">Customer 360° profile tabs</h3>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li><strong>Deals</strong> — linked deals with stage, amount, and close date</li>
            <li><strong>Activities</strong> — all logged calls, emails, meetings</li>
            <li><strong>Notes</strong> — note-type activities</li>
            <li><strong>Files</strong> — uploaded attachments (click any image/PDF to open the Document Viewer)</li>
            <li><strong>Timeline</strong> — chronological history of all events</li>
            <li><strong>360°</strong> — health score, pipeline value, open tickets, and upcoming tasks in one view</li>
            <li><strong>Onboarding</strong> — 5-step onboarding checklist with status tracking</li>
          </ul>

          <h3 className="font-semibold text-slate-900">Customer Health Score</h3>
          <p>Each customer has a <strong>0–100 health score</strong> computed from four factors:</p>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li>Activity recency (last interaction within 7 / 30 / 60 days)</li>
            <li>Deal status (Won deal = highest, active deal = medium, no deals = 0)</li>
            <li>Open critical support tickets (0 = full score, 2+ = 0)</li>
            <li>Account status (Active = +20 pts)</li>
          </ul>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">80+ = Healthy</span>
            <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700">50–79 = Needs Attention</span>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">&lt;50 = At Risk</span>
          </div>

          <h3 className="font-semibold text-slate-900">Avatar & Tags</h3>
          <p>Hover the avatar circle in the header to <strong>upload a profile photo</strong> (max 2 MB). Use <strong>Tags</strong> (VIP, Enterprise, At Risk, etc.) to segment customers — tags appear in the table and can be filtered.</p>

          <h3 className="font-semibold text-slate-900">Bulk actions</h3>
          <p>Check the box next to rows to select them. The <strong>selection bar</strong> appears with Delete and Export CSV options. Export requires Manager or Admin role.</p>

          <Tip>Click any customer row to expand an inline preview with email, phone, company info, and quick "View Profile" / "Edit" buttons — no need to navigate away.</Tip>
        </GuideSection>

        {/* ── LEADS ────────────────────────────────────────────────── */}
        <GuideSection id="leads" title="Leads" icon={UserPlus}>
          <Warning>Leads are not visible to Support Agents. Log in as Manager, Sales Agent, or Admin to access this module.</Warning>

          <h3 className="font-semibold text-slate-900">Lead Score</h3>
          <p>Every lead gets an automatic <strong>Hot / Warm / Cold</strong> badge (0–100) based on:</p>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li>Deal value: &gt;$20k = +40pts, &gt;$10k = +20pts, &gt;$5k = +10pts</li>
            <li>Status: Qualified = +30pts, Contacted = +15pts, Converted = +50pts</li>
            <li>Source: Referral/Partner = +20pts, Trade Show = +10pts, Website = +5pts</li>
          </ul>

          <h3 className="font-semibold text-slate-900">Quick status change</h3>
          <p>Click the colored status badge in any lead row to open a <strong>dropdown and change status inline</strong> — no need to open the full edit form.</p>

          <h3 className="font-semibold text-slate-900">Converting a lead</h3>
          <Steps steps={[
            "Open the lead's detail page.",
            'Click "Convert" (visible for Manager+ when status is not Converted or Lost).',
            'A Customer record is created automatically. The lead status changes to Converted.',
          ]} />
        </GuideSection>

        {/* ── DEALS ────────────────────────────────────────────────── */}
        <GuideSection id="deals" title="Sales Pipeline (Deals)" icon={Briefcase}>
          <Warning>The Pipeline is not visible to Support Agents.</Warning>

          <h3 className="font-semibold text-slate-900">Drag and drop</h3>
          <Steps steps={[
            'Grab the ⠿ grip handle on the left side of any deal card.',
            'Drag to the destination column. Columns highlight in colour as you hover.',
            'For Won or Lost: a modal asks for a win/loss reason before confirming.',
            'Click the deal title to open the Deal Details page.',
          ]} />

          <h3 className="font-semibold text-slate-900">Deal age indicator</h3>
          <p>Each card shows <strong>Nd</strong> (days since creation). Turns red when a deal has been idle too long (60+ days active, 30+ days closed).</p>

          <h3 className="font-semibold text-slate-900">Deal probability auto-suggest</h3>
          <p>When you select a stage in the form, the Probability field auto-fills (New=10%, Qualified=25%, Proposal=50%, Negotiation=75%). Override manually as needed.</p>

          <h3 className="font-semibold text-slate-900">Clone a deal</h3>
          <p>On any Deal Details page, click <strong>Clone</strong> to create a copy at New stage. Useful for renewals or multi-phase deals.</p>

          <Tip>Use the Owner filter above the Kanban board to focus on one rep's pipeline. Stage changes are restricted to Managers and Admins.</Tip>
        </GuideSection>

        {/* ── QUOTES ───────────────────────────────────────────────── */}
        <GuideSection id="quotes" title="Quotes & Proposals" icon={FileText}>
          <p>Create professional quotes linked to deals and customers. Each quote generates a printable document with line items, totals, and terms.</p>

          <h3 className="font-semibold text-slate-900">Quote statuses</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { s: 'Draft',    c: 'bg-slate-100 text-slate-600'   },
              { s: 'Sent',     c: 'bg-blue-100 text-blue-700'     },
              { s: 'Viewed',   c: 'bg-purple-100 text-purple-700' },
              { s: 'Accepted', c: 'bg-emerald-100 text-emerald-700'},
              { s: 'Declined', c: 'bg-red-100 text-red-700'       },
              { s: 'Expired',  c: 'bg-orange-100 text-orange-700' },
            ].map(({ s, c }) => <span key={s} className={['rounded-full px-2.5 py-0.5 text-xs font-medium', c].join(' ')}>{s}</span>)}
          </div>

          <h3 className="font-semibold text-slate-900">Creating a quote</h3>
          <Steps steps={[
            'Navigate to Quotes in the sidebar.',
            'Click "+ New Quote". Fill in title, link to a customer and optionally a deal.',
            'Add line items — each with description, quantity, unit price, and optional discount %.',
            'Set valid-until date, notes, and payment terms.',
            'Save as Draft, then click "Send Quote" when ready.',
          ]} />

          <h3 className="font-semibold text-slate-900">Printing a quote</h3>
          <p>Open the Quote Details page and click <strong>Print</strong>. The app hides all navigation chrome and renders a clean professional document.</p>
        </GuideSection>

        {/* ── HELP DESK ────────────────────────────────────────────── */}
        <GuideSection id="helpdesk" title="Help Desk" icon={Headphones}>
          <p>The Help Desk is the primary workspace for Support Agents and handles all customer support requests. All roles can view tickets; Support Agents have full access.</p>

          <h3 className="font-semibold text-slate-900">Ticket statuses</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { s: 'Open',        c: 'bg-red-50 text-red-700',     d: 'New, unresolved ticket' },
              { s: 'In Progress', c: 'bg-blue-50 text-blue-700',   d: 'Being actively worked on' },
              { s: 'Pending',     c: 'bg-yellow-50 text-yellow-700',d: 'Waiting for customer reply' },
              { s: 'Resolved',    c: 'bg-emerald-50 text-emerald-700', d: 'Solution provided' },
              { s: 'Closed',      c: 'bg-slate-100 text-slate-600', d: 'Fully closed' },
            ].map(({ s, c, d }) => (
              <div key={s} className="flex items-center gap-2">
                <span className={['rounded-full px-2.5 py-0.5 text-xs font-medium', c].join(' ')}>{s}</span>
                <span className="text-slate-600 text-xs">{d}</span>
              </div>
            ))}
          </div>

          <h3 className="font-semibold text-slate-900">Ticket list — expandable rows</h3>
          <p>Click any ticket row to <strong>expand an inline preview</strong> showing the description, latest reply, and quick action buttons (Open Ticket, Edit, View Customer) — without leaving the list.</p>

          <h3 className="font-semibold text-slate-900">Ticket conversation</h3>
          <p>Inside a ticket, use two reply modes:</p>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li><strong>Reply to customer</strong> (blue) — public, visible in the conversation thread</li>
            <li><strong>Internal note</strong> 🔒 (amber) — team-only, shown separately in a locked panel</li>
          </ul>

          <h3 className="font-semibold text-slate-900">ClickUp escalation</h3>
          <p>Click <strong>"Push to ClickUp"</strong> on any ticket to create a corresponding task in the dev workspace (<em>Eng → Fixes and Improvements</em>). The ticket shows a green "In ClickUp →" link once pushed. Configure the integration in <strong>Integrations → ClickUp</strong>.</p>
        </GuideSection>

        {/* ── ACTIVITIES ───────────────────────────────────────────── */}
        <GuideSection id="activities" title="Activities" icon={Activity}>
          <p>Activities log every customer interaction — calls, emails, meetings, notes, and tasks. Click any activity to open a <strong>detail slide-over panel</strong> on the right.</p>

          <h3 className="font-semibold text-slate-900">Activity types</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { t: 'Call',    c: 'bg-blue-50 text-blue-600',    d: 'Phone calls and voicemails' },
              { t: 'Email',   c: 'bg-emerald-50 text-emerald-600',d: 'Email threads (use Email Composer for templates)' },
              { t: 'Meeting', c: 'bg-purple-50 text-purple-600', d: 'In-person or video calls' },
              { t: 'Note',    c: 'bg-yellow-50 text-yellow-600', d: 'Written context and observations' },
              { t: 'Task',    c: 'bg-orange-50 text-orange-600', d: 'To-do items with due dates and priority' },
            ].map(({ t, c, d }) => (
              <div key={t} className="flex items-center gap-2">
                <span className={['rounded-full px-2.5 py-0.5 text-xs font-medium', c].join(' ')}>{t}</span>
                <span className="text-xs text-slate-600">{d}</span>
              </div>
            ))}
          </div>

          <h3 className="font-semibold text-slate-900">Email Composer</h3>
          <p>Click <strong>Email</strong> on any Customer or Lead detail page to open the Email Composer with 5 pre-built templates (Introduction, Follow-Up, Proposal Sent, Check-In, Thank You). Variables like <code className="bg-slate-100 px-1 rounded">{'{name}'}</code> are auto-filled.</p>

          <h3 className="font-semibold text-slate-900">Log from detail pages</h3>
          <p>Log activities from any Customer, Lead, or Deal detail page — the modal pre-fills the related record so you never have to type it manually.</p>
        </GuideSection>

        {/* ── TASKS ────────────────────────────────────────────────── */}
        <GuideSection id="tasks" title="Tasks" icon={CheckSquare}>
          <p>Tasks are activities of type "Task" grouped by urgency. <strong>Click any task card to expand</strong> its full details inline.</p>

          <h3 className="font-semibold text-slate-900">Expanded task view</h3>
          <p>Clicking a task shows:</p>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li>Full description text</li>
            <li>Owner, due date (with "N days overdue" label), related record link</li>
            <li><strong>Mark Complete</strong> button — saves instantly and removes from the group</li>
            <li><strong>Open [Customer/Lead/Deal]</strong> — jumps to the linked record</li>
            <li><strong>Delete Task</strong> button</li>
          </ul>

          <h3 className="font-semibold text-slate-900">Task groups</h3>
          <p>Each group header is <strong>collapsible</strong> — click the label to show/hide. Completed tasks start collapsed to reduce noise.</p>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li><span className="font-medium text-red-600">Overdue</span> — past due date (red label)</li>
            <li><span className="font-medium text-orange-600">Due today</span> — orange label</li>
            <li><span className="font-medium text-slate-700">Upcoming</span> — future or no due date</li>
            <li><span className="font-medium text-slate-400">Completed</span> — starts collapsed</li>
          </ul>

          <Tip>The sidebar shows a red badge on "Tasks" when you have overdue or due-today items. The bell icon also shows a notification count.</Tip>
        </GuideSection>

        {/* ── CALENDAR ─────────────────────────────────────────────── */}
        <GuideSection id="calendar" title="Calendar" icon={CalendarDays}>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li>Navigate months with ← → arrows or click <strong>Today</strong>.</li>
            <li>Colored dots represent activities by type. On mobile, weekday headers shrink to a single letter.</li>
            <li><strong>Click a day</strong> to see all events in a side panel with full activity details.</li>
            <li>Tasks appear on their <strong>due date</strong>; activities on their <strong>created date</strong>.</li>
          </ul>
        </GuideSection>

        {/* ── REPORTS ──────────────────────────────────────────────── */}
        <GuideSection id="reports" title="Reports & Analytics" icon={BarChart3}>
          <Warning>Reports and Analytics are visible to Managers and Admins only.</Warning>

          <h3 className="font-semibold text-slate-900">Reports page — 3 tabs</h3>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li><strong>Pipeline</strong> — KPI strip (Won Revenue, Win Rate, Avg Deal Size, Active Deals, Avg Velocity), bar chart by stage, stage funnel, Won vs Lost card</li>
            <li><strong>Revenue</strong> — Lead source pie chart, 12-month area chart</li>
            <li><strong>Activity Report</strong> — activities per day, breakdown by type, top contributors</li>
          </ul>

          <h3 className="font-semibold text-slate-900">Date range filter</h3>
          <p>Use the preset selector (Last 7 days / 30 days / 90 days / Year to date / Custom) to filter all charts to a specific period.</p>

          <h3 className="font-semibold text-slate-900">Analytics page</h3>
          <p>Deeper analysis with 4 tabs: Overview (conversion funnel, MoM comparison), Pipeline (deal age, close rates), Activities (heatmap, response times), Team (leaderboard, per-rep performance).</p>
        </GuideSection>

        {/* ── FORECASTING ──────────────────────────────────────────── */}
        <GuideSection id="forecasting" title="Forecasting & Goals" icon={LineChart}>
          <Warning>Forecasting and Sales Goals are visible to Managers and Admins only.</Warning>

          <h3 className="font-semibold text-slate-900">Forecasting page</h3>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li><strong>Three scenarios</strong> — Conservative (50% weighted), Realistic (75%), Optimistic (90%)</li>
            <li><strong>Monthly trend chart</strong> — historical actual + projected dashed line</li>
            <li><strong>Deal breakdown table</strong> — each open deal with weighted value and probability bar</li>
          </ul>

          <h3 className="font-semibold text-slate-900">Sales Goals</h3>
          <p>Set goals by metric (Revenue, Deals Won, Leads Converted, Activities), period (Monthly / Quarterly / Annual), and owner (All Team or individual). Progress bars color-code: green 80%+, yellow 50–79%, red &lt;50%.</p>

          <h3 className="font-semibold text-slate-900">Revenue Goal widget (Dashboard)</h3>
          <p>Click the pencil icon on the Dashboard Revenue Goal card to set a monthly target. The progress bar turns green when you achieve it — and shows "🎉 Goal achieved!" with the overage amount.</p>
        </GuideSection>

        {/* ── RENEWALS ─────────────────────────────────────────────── */}
        <GuideSection id="renewals" title="Renewals" icon={RefreshCw}>
          <p>Track contract renewals with dates, statuses, probability, and owner assignments.</p>
          <div className="flex flex-wrap gap-2">
            {[
              { s: 'Upcoming',       c: 'bg-blue-100 text-blue-700'   },
              { s: 'In Negotiation', c: 'bg-purple-100 text-purple-700'},
              { s: 'Renewed',        c: 'bg-emerald-100 text-emerald-700'},
              { s: 'At Risk',        c: 'bg-orange-100 text-orange-700'},
              { s: 'Churned',        c: 'bg-red-100 text-red-700'      },
            ].map(({ s, c }) => <span key={s} className={['rounded-full px-2.5 py-0.5 text-xs font-medium', c].join(' ')}>{s}</span>)}
          </div>
          <p>Renewal rows are <strong>color-coded by urgency</strong>: red for at-risk renewals due within 30 days, yellow for 30–60 days, green for 60+ days or already renewed.</p>
        </GuideSection>

        {/* ── AUTOMATION ───────────────────────────────────────────── */}
        <GuideSection id="automation" title="Segments & Automation" icon={Filter}>
          <h3 className="font-semibold text-slate-900">Segments</h3>
          <p>Build named groups of customers or leads using filter conditions (status, owner, tags, company). Logic can be <strong>AND</strong> (all conditions must match) or <strong>OR</strong> (any match). A live preview shows the matching count before you save.</p>

          <h3 className="font-semibold text-slate-900">Smart Lists</h3>
          <p>8 auto-maintained dynamic lists that update in real time:</p>
          <ul className="list-inside list-disc space-y-1 text-slate-600 columns-2">
            <li>Overdue Tasks</li>
            <li>Stale Deals (14+ days)</li>
            <li>Hot Leads (score ≥70)</li>
            <li>Closing This Week</li>
            <li>New This Week</li>
            <li>Critical Tickets</li>
            <li>Inactive Customers</li>
            <li>High Value Pipeline</li>
          </ul>

          <h3 className="font-semibold text-slate-900">Workflows</h3>
          <p>Visual workflow builder for automating repetitive actions — e.g., "Deal Won → Create Follow-Up Task". Configure triggers, conditions, and actions. Workflows are executed server-side when the Rails API is connected.</p>

          <h3 className="font-semibold text-slate-900">Email Automation</h3>
          <p>Build drip sequences with customizable email steps and delays (Day 1, Day 3, Day 7…). Templates support variables like <code className="bg-slate-100 px-1 rounded">{'{name}'}</code> and <code className="bg-slate-100 px-1 rounded">{'{company}'}</code>.</p>
        </GuideSection>

        {/* ── FILES & AI ────────────────────────────────────────────── */}
        <GuideSection id="files-tags" title="Files, Tags & AI Insights" icon={Tag}>
          <h3 className="font-semibold text-slate-900">File attachments</h3>
          <Steps steps={[
            'Open a Customer, Lead, or Deal detail page.',
            'Click the "Files" tab.',
            'Drag a file onto the upload area or click to browse (max 5 MB).',
            'Click any image or PDF thumbnail to open the Document Viewer.',
          ]} />
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Upload className="h-4 w-4 text-slate-400" />
            Supported: images (PNG, JPG, GIF, SVG), PDF, Word, Excel, and text files.
          </div>

          <h3 className="font-semibold text-slate-900">Document Viewer</h3>
          <p>The built-in viewer supports:</p>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li><strong>Images</strong> — zoom 25%–400%, pan, reset, fullscreen</li>
            <li><strong>PDFs</strong> — rendered inline with browser-native controls</li>
            <li><strong>Other files</strong> — metadata + Download button</li>
          </ul>

          <h3 className="font-semibold text-slate-900">Tags</h3>
          <p>8 color-coded tags (VIP, Enterprise, High Priority, Referral, At Risk, New Account, Renewal, Cold). Apply via the <strong>tag picker</strong> on Customer or Lead detail pages. Tags appear in list tables and can be used as segment conditions.</p>

          <h3 className="font-semibold text-slate-900">AI Insights panel</h3>
          <p>Every Customer, Lead, and Deal detail page has a collapsible <strong>✨ AI Insights</strong> panel. Each insight card shows a headline, explanation, and an <strong>action button that actually works</strong>:</p>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li>"Schedule discovery call" → opens the Log Activity modal (type: Call)</li>
            <li>"Send re-engagement email" → opens the Email Composer</li>
            <li>"Create proposal" → navigates to Quotes</li>
            <li>"Book closing call" → opens the Log Activity modal (type: Meeting)</li>
          </ul>
          <p>Once you act on a suggestion, it's <strong>removed from the panel</strong>. When all suggestions are actioned, a "All done ✓" state appears with a Reset button.</p>
        </GuideSection>

        {/* ── CLICKUP ──────────────────────────────────────────────── */}
        <GuideSection id="integrations" title="ClickUp Integration" icon={Code2}>
          <p>Push Help Desk tickets directly to your ClickUp dev workspace so engineers can work on them immediately.</p>

          <h3 className="font-semibold text-slate-900">Setup</h3>
          <Steps steps={[
            'Go to Integrations in the sidebar.',
            'Scroll to "Deep Integrations → ClickUp".',
            'Get your Personal API Token from ClickUp Settings → Apps.',
            'Paste the token and click Verify to confirm your identity.',
            'Enable the toggle and click Save settings.',
          ]} />

          <h3 className="font-semibold text-slate-900">Workspace pre-configured</h3>
          <div className="rounded-lg border border-border bg-slate-50 p-4 text-sm">
            <p><span className="font-medium">Workspace:</span> Your ClickUp workspace · ID <code className="bg-slate-200 px-1 rounded">8447923</code></p>
            <p className="mt-1"><span className="font-medium">Default list:</span> Fixes and Improvements (Eng space)</p>
            <p className="mt-1"><span className="font-medium">Dev workflow:</span> to do → in progress → dev testing → pull request → QA → done</p>
          </div>

          <h3 className="font-semibold text-slate-900">Pushing a ticket</h3>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li><strong>From the ticket list</strong> — click the violet Send icon (→) in the Actions column</li>
            <li><strong>From Ticket Details</strong> — click the "Push to ClickUp" button in the header</li>
          </ul>
          <p>After a successful push, the button turns green <strong>"In ClickUp →"</strong> and links directly to the ClickUp task. The ticket's info card shows a "ClickUp" row with the task link.</p>

          <Warning>ClickUp integration is visible to Admins and Support Agents. You need a valid Personal API Token — not an OAuth token.</Warning>
        </GuideSection>

        {/* ── NOTIFICATIONS ────────────────────────────────────────── */}
        <GuideSection id="notifications" title="Notifications" icon={Bell}>
          <p>The bell icon in the header shows a red badge when you have overdue or due-today tasks. Click to open the notification dropdown or navigate to <strong>/notifications</strong> for the full center.</p>

          <h3 className="font-semibold text-slate-900">Notifications Center</h3>
          <ul className="list-inside list-disc space-y-1 text-slate-600">
            <li>Filter by: All · Tasks · Deals · Leads</li>
            <li>Overdue tasks shown in red, due-today in yellow</li>
            <li>Click a task notification to mark it complete directly — no need to go to the Tasks page</li>
            <li>Hover any notification to reveal a Dismiss button (×)</li>
            <li>"Mark all read" and "Clear all" in the header</li>
          </ul>
        </GuideSection>

        {/* ── SHORTCUTS ────────────────────────────────────────────── */}
        <GuideSection id="shortcuts" title="Keyboard Shortcuts" icon={Command}>
          <p>Press <Kbd keys={['?']} /> anywhere (outside a form) to open the full shortcuts overlay. Common shortcuts:</p>

          <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Global</p>
            <ShortcutRow keys={['⌘', 'K']} description="Open global search (customers, leads, deals)" />
            <ShortcutRow keys={['?']}       description="Show keyboard shortcuts overlay" />
            <ShortcutRow keys={['Esc']}     description="Close modal, dropdown, or detail panel" />

            <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">Navigation (press G then a key)</p>
            <ShortcutRow keys={['G', 'then', 'D']} description="Go to Dashboard" />
            <ShortcutRow keys={['G', 'then', 'C']} description="Go to Customers" />
            <ShortcutRow keys={['G', 'then', 'L']} description="Go to Leads" />
            <ShortcutRow keys={['G', 'then', 'P']} description="Go to Pipeline (Deals)" />
            <ShortcutRow keys={['G', 'then', 'A']} description="Go to Activities" />
            <ShortcutRow keys={['G', 'then', 'T']} description="Go to Tasks" />
          </div>

          <h3 className="font-semibold text-slate-900">Theme toggle</h3>
          <p>Click the <strong>Sun / Moon / Monitor</strong> icon in the header to cycle Light → Dark → System. Dark mode adapts all colors, charts, tables, and modals. Your preference persists across sessions.</p>
        </GuideSection>

        {/* ── ROLES ────────────────────────────────────────────────── */}
        <GuideSection id="roles" title="Roles & Permissions" icon={Shield}>
          <p>PulseCRM has <strong>four roles</strong>. Each sees a tailored sidebar, dashboard, and action set.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { role: 'Admin',         color: 'border-purple-200 bg-purple-50 text-purple-900', desc: 'Full access: all features, user management, audit log, API & Webhooks.' },
              { role: 'Manager',       color: 'border-blue-200 bg-blue-50 text-blue-900',       desc: 'Sales + reports, team records, forecasting, lead conversion.' },
              { role: 'Sales Agent',   color: 'border-slate-200 bg-slate-50 text-slate-900',    desc: 'Own records only — customers, leads, deals, activities.' },
              { role: 'Support Agent', color: 'border-violet-200 bg-violet-50 text-violet-900', desc: 'Help Desk focus — full ticket access, customer view, ClickUp integration.' },
            ].map(r => (
              <div key={r.role} className={['rounded-lg border p-4', r.color].join(' ')}>
                <p className="font-semibold">{r.role}</p>
                <p className="mt-0.5 text-xs opacity-80">{r.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="font-semibold text-slate-900">Permissions matrix</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left">Capability</th>
                  <th className="px-4 py-2.5 text-center">Admin</th>
                  <th className="px-4 py-2.5 text-center">Manager</th>
                  <th className="px-4 py-2.5 text-center">Sales</th>
                  <th className="px-4 py-2.5 text-center">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ['View customers',              '✅','✅','✅','✅'],
                  ['Create/edit customers',        '✅','✅','✅','❌'],
                  ['Delete customers',             '✅','✅','❌','❌'],
                  ['Access Leads & Deals',         '✅','✅','✅','❌'],
                  ['Convert leads',                '✅','✅','❌','❌'],
                  ['Move deal stages',             '✅','✅','❌','❌'],
                  ['View Help Desk tickets',       '✅','✅','✅','✅'],
                  ['Create & reply to tickets',    '✅','✅','✅','✅'],
                  ['Push tickets to ClickUp',      '✅','✅','❌','✅'],
                  ['Access Reports & Analytics',   '✅','✅','❌','❌'],
                  ['Forecasting & Goals',          '✅','✅','❌','❌'],
                  ['Export CSV data',              '✅','✅','❌','❌'],
                  ['Manage workflows',             '✅','✅','❌','❌'],
                  ['Configure integrations',       '✅','❌','❌','✅'],
                  ['Manage team & users',          '✅','❌','❌','❌'],
                  ['View Audit Log',               '✅','❌','❌','❌'],
                ].map(([cap, ...vals]) => (
                  <tr key={cap as string} className="hover:bg-slate-50/30">
                    <td className="px-4 py-2 text-slate-700">{cap}</td>
                    {(vals as string[]).map((v, i) => (
                      <td key={i} className="px-4 py-2 text-center">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Warning>
            Frontend permissions control UI visibility only. When the Rails API is connected, all permissions are enforced server-side — the backend is the true security layer.
          </Warning>
        </GuideSection>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <GuideSection id="faq" title="FAQ" icon={HelpCircle}>
          {[
            {
              q: 'Why does my data disappear after refreshing?',
              a: "All data is stored in localStorage which persists across refreshes. If data is gone, go to Settings → Developer Tools → Reset Data to restore the original seed records.",
            },
            {
              q: "I'm a Support Agent — why can't I see Leads or Deals?",
              a: "The Support Agent role is focused on Help Desk and customer viewing. Sales modules (Leads, Deals, Quotes, Renewals, Reports) are only available to Sales Agents, Managers, and Admins. Log in as sarah@crm.com (Manager) to see the full CRM.",
            },
            {
              q: 'How do I push a ticket to ClickUp?',
              a: "First configure your ClickUp Personal API Token in Integrations → ClickUp. Then click 'Push to ClickUp' on any Ticket Details page or the icon button in the Help Desk list. The ticket is pushed to the 'Fixes and Improvements' list in the Eng space.",
            },
            {
              q: 'How do I reset all demo data?',
              a: "Go to Settings → Developer Tools → click 'Reset Data'. This clears localStorage and reloads with the original seed data. All custom records will be lost.",
            },
            {
              q: 'Can I invite a real team member?',
              a: "Go to Team (admin only) → '+ Invite Member'. In the demo, new members are added to the browser store. A real backend would send email invitations. Their login password is always 'password' for demo accounts.",
            },
            {
              q: 'How is the lead score calculated?',
              a: "Lead score (0–100) = value points (>$20k=+40, >$10k=+20, >$5k=+10) + status points (Qualified=+30, Contacted=+15, Converted=+50) + source points (Referral/Partner=+20, Trade Show=+10, Website=+5).",
            },
            {
              q: 'How does deal velocity work?',
              a: "Avg Deal Velocity = average days from deal creation to close (Won deals only). Found in Reports → Pipeline → KPI strip. Lower = faster sales cycles.",
            },
            {
              q: 'What is the Weighted Pipeline forecast?',
              a: "Weighted Pipeline = sum of (deal amount × probability %) across all open deals. More realistic than counting full value of every open deal. Found in Dashboard → Revenue Forecast and Forecasting page.",
            },
            {
              q: 'How do AI Insights work?',
              a: "AI Insights are computed from your actual CRM data — not random. For example, a deal in Negotiation for 40+ days triggers 'At risk' because the average Negotiation stage is 18 days. Action buttons open the right modal or page directly.",
            },
            {
              q: 'Why does the ClickUp push sometimes fail?',
              a: "Browser-to-ClickUp API calls may fail due to CORS in some network environments. Your API token and config are saved correctly — in production, requests go through a backend proxy (Rails API). Check your token is a Personal Access Token (pk_...) not an OAuth token.",
            },
            {
              q: 'How do I switch themes?',
              a: "Click the Sun / Moon / Monitor icon in the top header. This cycles Light → Dark → System. Dark mode adapts all colors, charts, dropdowns, and modals. Your preference is saved in localStorage.",
            },
            {
              q: 'Where are uploaded files stored?',
              a: "Files are stored as base64 in localStorage (up to ~10 MB). A production deployment would store files in cloud storage (AWS S3, Cloudflare R2) via the Rails API.",
            },
          ].map(({ q, a }) => (
            <details key={q} className="group rounded-lg border border-border bg-white shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 font-medium text-slate-900 list-none marker:hidden">
                {q}
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <p className="border-t border-border px-4 py-3 text-slate-600">{a}</p>
            </details>
          ))}
        </GuideSection>

        {/* Footer */}
        <div className="rounded-lg border border-border bg-slate-50 p-5 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <UserCheck className="h-4 w-4" />
            <span className="text-sm">
              Press <Kbd keys={['?']} /> for a quick shortcut reference · Press <Kbd keys={['⌘', 'K']} /> to search
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
