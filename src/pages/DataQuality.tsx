import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useCustomers } from '@/hooks/useCustomers'
import { useLeads } from '@/hooks/useLeads'
import { useDeals } from '@/hooks/useDeals'
import { useTickets } from '@/hooks/useTickets'

interface QualityIssue {
  id: string
  entity: string
  entityLabel: string
  href: string
  field: string
  severity: 'high' | 'medium' | 'low'
}

function SeverityBadge({ severity }: { severity: QualityIssue['severity'] }) {
  const styles = {
    high:   'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low:    'bg-slate-100 text-slate-600',
  }
  return (
    <span className={['rounded px-2 py-0.5 text-xs font-medium capitalize', styles[severity]].join(' ')}>
      {severity}
    </span>
  )
}

function ScoreRing({ score }: { score: number }) {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626'

  return (
    <svg width="88" height="88" className="-rotate-90">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle
        cx="44" cy="44" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x="44" y="44" textAnchor="middle" dominantBaseline="central"
        className="rotate-90" fill={color}
        fontSize="18" fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: '44px 44px' }}
      >
        {score}
      </text>
    </svg>
  )
}

export function DataQualityPage() {
  usePageTitle('Data Quality')

  const customersQuery = useCustomers({ pageSize: 1000 })
  const leadsQuery     = useLeads({ pageSize: 1000 })
  const dealsQuery     = useDeals({ pageSize: 1000 })
  const ticketsQuery   = useTickets({ pageSize: 1000 })

  const customers = customersQuery.data?.data ?? []
  const leads     = leadsQuery.data?.data ?? []
  const deals     = dealsQuery.data?.data ?? []

  const issues = useMemo<QualityIssue[]>(() => {
    const list: QualityIssue[] = []

    // Customer issues
    for (const c of customers) {
      const name = `${c.firstName} ${c.lastName}`
      if (!c.phone || c.phone.trim() === '')
        list.push({ id: `c-phone-${c.id}`, entity: 'Customer', entityLabel: name, href: `/customers/${c.id}`, field: 'Missing phone number', severity: 'medium' })
      if (!c.email || c.email.trim() === '')
        list.push({ id: `c-email-${c.id}`, entity: 'Customer', entityLabel: name, href: `/customers/${c.id}`, field: 'Missing email address', severity: 'high' })
      if (!c.company || c.company.trim() === '')
        list.push({ id: `c-company-${c.id}`, entity: 'Customer', entityLabel: name, href: `/customers/${c.id}`, field: 'Missing company name', severity: 'low' })
      if (!c.jobTitle || c.jobTitle.trim() === '')
        list.push({ id: `c-job-${c.id}`, entity: 'Customer', entityLabel: name, href: `/customers/${c.id}`, field: 'Missing job title', severity: 'low' })
    }

    // Lead issues
    for (const l of leads) {
      if (!l.phone || l.phone.trim() === '')
        list.push({ id: `l-phone-${l.id}`, entity: 'Lead', entityLabel: l.name, href: `/leads/${l.id}`, field: 'Missing phone number', severity: 'medium' })
      if (!l.notes || l.notes.trim() === '')
        list.push({ id: `l-notes-${l.id}`, entity: 'Lead', entityLabel: l.name, href: `/leads/${l.id}`, field: 'No notes recorded', severity: 'low' })
    }

    // Deal issues
    for (const d of deals) {
      if (!d.description || d.description.trim() === '')
        list.push({ id: `d-desc-${d.id}`, entity: 'Deal', entityLabel: d.title, href: `/deals/${d.id}`, field: 'Missing description', severity: 'low' })
      const daysToClose = Math.floor((new Date(d.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysToClose < 0 && d.stage !== 'Won' && d.stage !== 'Lost')
        list.push({ id: `d-overdue-${d.id}`, entity: 'Deal', entityLabel: d.title, href: `/deals/${d.id}`, field: `Expected close date passed (${Math.abs(daysToClose)} days ago)`, severity: 'high' })
    }

    return list.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.severity] - order[b.severity]
    })
  }, [customers, leads, deals])

  const total = customers.length + leads.length + deals.length
  const highCount = issues.filter(i => i.severity === 'high').length
  const medCount  = issues.filter(i => i.severity === 'medium').length
  const score = total > 0
    ? Math.round(Math.max(0, 100 - (highCount * 10 + medCount * 4 + (issues.length - highCount - medCount)) / total * 10))
    : 100

  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Needs Work' : 'Poor'

  const isLoading = customersQuery.isLoading || leadsQuery.isLoading || dealsQuery.isLoading || ticketsQuery.isLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Data Quality</h2>
          <p className="mt-1 text-sm text-slate-500">
            Find and fix incomplete or inconsistent records across your CRM.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void customersQuery.refetch()
            void leadsQuery.refetch()
            void dealsQuery.refetch()
          }}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Refresh
        </button>
      </div>

      {/* Score + summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm sm:col-span-1 flex flex-col items-center justify-center">
          <ScoreRing score={score} />
          <p className="mt-2 text-sm font-semibold text-slate-700">{label}</p>
          <p className="text-xs text-slate-400">Data quality score</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-2xl font-bold text-red-700">{highCount}</p>
          <p className="text-sm font-medium text-red-600">Critical issues</p>
          <p className="mt-1 text-xs text-red-500">Missing email, overdue deals</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-2xl font-bold text-yellow-700">{medCount}</p>
          <p className="text-sm font-medium text-yellow-600">Medium issues</p>
          <p className="mt-1 text-xs text-yellow-500">Missing phone numbers</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-700">{issues.length - highCount - medCount}</p>
          <p className="text-sm font-medium text-slate-600">Minor issues</p>
          <p className="mt-1 text-xs text-slate-400">Missing descriptions, notes</p>
        </div>
      </div>

      {/* Issues table */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg border border-border bg-slate-100" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" aria-hidden />
          <h3 className="mt-3 text-lg font-semibold text-emerald-700">All records look great!</h3>
          <p className="mt-1 text-sm text-emerald-600">No data quality issues detected across your customers, leads, and deals.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {issues.length} issue{issues.length !== 1 ? 's' : ''} found
            </h3>
            <p className="text-xs text-slate-400">
              Across {customers.length} customers · {leads.length} leads · {deals.length} deals
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Record</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Issue</th>
                <th className="px-5 py-3 text-left">Severity</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {issues.map(issue => (
                <tr key={issue.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{issue.entityLabel}</td>
                  <td className="px-5 py-3 text-slate-500">{issue.entity}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-hidden />
                      {issue.field}
                    </div>
                  </td>
                  <td className="px-5 py-3"><SeverityBadge severity={issue.severity} /></td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={issue.href}
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                    >
                      Fix <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
