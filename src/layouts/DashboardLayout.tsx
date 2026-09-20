import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/customers': 'Customers',
  '/leads': 'Leads',
  '/deals': 'Deals',
  '/activities': 'Activities',
  '/calendar': 'Calendar',
  '/tasks': 'Tasks',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/team': 'Team Members',
  '/guide': 'User Guide',
  '/notifications': 'Notifications',
  '/helpdesk': 'Help Desk',
  '/audit-log': 'Audit Log',
  '/segments': 'Segments',
  '/workflows': 'Workflows',
  '/analytics': 'Analytics',
  '/forecasting': 'Forecasting',
  '/integrations': 'Integrations',
  '/email-automation': 'Email Automation',
  '/quotes': 'Quotes',
  '/renewals': 'Renewals',
  '/smart-lists': 'Smart Lists',
  '/sales-goals': 'Sales Goals',
  '/api-webhooks': 'API & Webhooks',
  '/data-quality': 'Data Quality',
}

function resolveTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith('/customers/')) return 'Customer Details'
  if (pathname.startsWith('/leads/')) return 'Lead Details'
  if (pathname.startsWith('/deals/')) return 'Deal Details'
  if (pathname.startsWith('/quotes/')) return 'Quote Details'
  if (pathname.startsWith('/team/'))     return 'Team Member'
  if (pathname.startsWith('/helpdesk/')) return 'Ticket Details'
  return 'CRM'
}

export function DashboardLayout() {
  const { pathname } = useLocation()
  const title = resolveTitle(pathname)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-full min-h-screen bg-surface">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
