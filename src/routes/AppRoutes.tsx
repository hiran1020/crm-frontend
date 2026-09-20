import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { AuthProvider } from '@/context/AuthContext'
import { DashboardLayout } from '@/layouts/DashboardLayout'

/* ── Lazy-loaded pages ──────────────────────────────────────────────────────
   Each page is a separate code-split chunk. The browser downloads a page's
   JS only on first visit — cuts initial bundle from ~2 MB to ~150 KB.
   ────────────────────────────────────────────────────────────────────────── */
const lazy$ = <T extends { [K in E]: React.ComponentType }, E extends string>(
  fn: () => Promise<T>,
  key: E,
) => lazy(() => fn().then(m => ({ default: m[key] as React.ComponentType })))

const LoginPage           = lazy$(() => import('@/pages/Login'),           'LoginPage')
const NotFoundPage        = lazy$(() => import('@/pages/NotFound'),        'NotFoundPage')
const DashboardPage       = lazy$(() => import('@/pages/Dashboard'),       'DashboardPage')
const CustomersPage       = lazy$(() => import('@/pages/Customers'),       'CustomersPage')
const CustomerDetailsPage = lazy$(() => import('@/pages/CustomerDetails'), 'CustomerDetailsPage')
const LeadsPage           = lazy$(() => import('@/pages/Leads'),           'LeadsPage')
const LeadDetailsPage     = lazy$(() => import('@/pages/LeadDetails'),     'LeadDetailsPage')
const DealsPage           = lazy$(() => import('@/pages/Deals'),           'DealsPage')
const DealDetailsPage     = lazy$(() => import('@/pages/DealDetails'),     'DealDetailsPage')
const QuotesPage          = lazy$(() => import('@/pages/Quotes'),          'QuotesPage')
const QuoteDetailsPage    = lazy$(() => import('@/pages/QuoteDetails'),    'QuoteDetailsPage')
const ActivitiesPage      = lazy$(() => import('@/pages/Activities'),      'ActivitiesPage')
const CalendarPage        = lazy$(() => import('@/pages/Calendar'),        'CalendarPage')
const TasksPage           = lazy$(() => import('@/pages/Tasks'),           'TasksPage')
const HelpdeskPage        = lazy$(() => import('@/pages/Helpdesk'),        'HelpdeskPage')
const TicketDetailsPage   = lazy$(() => import('@/pages/TicketDetails'),   'TicketDetailsPage')
const RenewalsPage        = lazy$(() => import('@/pages/Renewals'),        'RenewalsPage')
const ReportsPage         = lazy$(() => import('@/pages/Reports'),         'ReportsPage')
const AnalyticsPage       = lazy$(() => import('@/pages/Analytics'),       'AnalyticsPage')
const ForecastingPage     = lazy$(() => import('@/pages/Forecasting'),     'ForecastingPage')
const SalesGoalsPage      = lazy$(() => import('@/pages/SalesGoals'),      'SalesGoalsPage')
const SegmentsPage        = lazy$(() => import('@/pages/Segments'),        'SegmentsPage')
const SmartListsPage      = lazy$(() => import('@/pages/SmartLists'),      'SmartListsPage')
const WorkflowsPage       = lazy$(() => import('@/pages/Workflows'),       'WorkflowsPage')
const EmailAutomationPage = lazy$(() => import('@/pages/EmailAutomation'), 'EmailAutomationPage')
const SettingsPage        = lazy$(() => import('@/pages/Settings'),        'SettingsPage')
const UsersPage           = lazy$(() => import('@/pages/Users'),           'UsersPage')
const UserDetailsPage     = lazy$(() => import('@/pages/UserDetails'),     'UserDetailsPage')
const AuditLogPage        = lazy$(() => import('@/pages/AuditLog'),        'AuditLogPage')
const IntegrationsPage    = lazy$(() => import('@/pages/Integrations'),    'IntegrationsPage')
const APIWebhooksPage     = lazy$(() => import('@/pages/APIWebhooks'),     'APIWebhooksPage')
const NotificationsPage   = lazy$(() => import('@/pages/Notifications'),   'NotificationsPage')
const UserGuidePage       = lazy$(() => import('@/pages/UserGuide'),       'UserGuidePage')
const DataQualityPage     = lazy$(() => import('@/pages/DataQuality'),     'DataQualityPage')

/** Spinner shown during lazy chunk download */
function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center p-16" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  )
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<S><LoginPage /></S>} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<S><DashboardPage /></S>} />

              {/* Customers */}
              <Route path="customers" element={<S><CustomersPage /></S>} />
              <Route path="customers/:customerId" element={<S><CustomerDetailsPage /></S>} />

              {/* Leads */}
              <Route path="leads" element={<S><LeadsPage /></S>} />
              <Route path="leads/:leadId" element={<S><LeadDetailsPage /></S>} />

              {/* Deals & Quotes */}
              <Route path="deals" element={<S><DealsPage /></S>} />
              <Route path="deals/:dealId" element={<S><DealDetailsPage /></S>} />
              <Route path="quotes" element={<S><QuotesPage /></S>} />
              <Route path="quotes/:quoteId" element={<S><QuoteDetailsPage /></S>} />

              {/* Time & Activities */}
              <Route path="activities" element={<S><ActivitiesPage /></S>} />
              <Route path="calendar" element={<S><CalendarPage /></S>} />
              <Route path="tasks" element={<S><TasksPage /></S>} />

              {/* Support */}
              <Route path="helpdesk" element={<S><HelpdeskPage /></S>} />
              <Route path="helpdesk/:ticketId" element={<S><TicketDetailsPage /></S>} />
              <Route path="renewals" element={<S><RenewalsPage /></S>} />

              {/* Intelligence */}
              <Route path="reports" element={<S><ReportsPage /></S>} />
              <Route path="analytics" element={<S><AnalyticsPage /></S>} />
              <Route path="forecasting" element={<S><ForecastingPage /></S>} />
              <Route path="sales-goals" element={<S><SalesGoalsPage /></S>} />

              {/* Automation */}
              <Route path="segments" element={<S><SegmentsPage /></S>} />
              <Route path="smart-lists" element={<S><SmartListsPage /></S>} />
              <Route path="workflows" element={<S><WorkflowsPage /></S>} />
              <Route path="email-automation" element={<S><EmailAutomationPage /></S>} />

              {/* Admin */}
              <Route path="settings" element={<S><SettingsPage /></S>} />
              <Route path="team" element={<S><UsersPage /></S>} />
              <Route path="team/:userId" element={<S><UserDetailsPage /></S>} />
              <Route path="audit-log" element={<S><AuditLogPage /></S>} />
              <Route path="integrations" element={<S><IntegrationsPage /></S>} />
              <Route path="api-webhooks" element={<S><APIWebhooksPage /></S>} />
              <Route path="data-quality" element={<S><DataQualityPage /></S>} />

              {/* Help */}
              <Route path="notifications" element={<S><NotificationsPage /></S>} />
              <Route path="guide" element={<S><UserGuidePage /></S>} />
            </Route>
          </Route>

          <Route path="*" element={<S><NotFoundPage /></S>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
