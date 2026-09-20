import {
  Activity,
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Code2,
  DatabaseZap,
  FileText,
  Filter,
  GitBranch,
  Headphones,
  Layers,
  LayoutDashboard,
  LineChart,
  Mail,
  Plug,
  RefreshCw,
  Settings,
  Target,
  TrendingUp,
  Users,
  Users2,
  UserPlus,
  X,
} from 'lucide-react'
import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { APP_NAME } from '@/constants/auth'
import { useTasks } from '@/hooks/useActivities'
import { usePermissions } from '@/hooks/usePermissions'
import { PinnedRecordsPanel } from '@/components/common/PinButton'
import { useTicketOpenCount } from '@/hooks/useTickets'

/**
 * Nav item visibility flags:
 *   adminOnly     — only admin
 *   managerOnly   — admin + manager
 *   salesOnly     — admin + manager + sales_agent (not support)
 *   supportOnly   — admin + support (not manager/sales)
 *   supportVisible — support can see this (plus all others)
 *
 * Default (no flag) = visible to all roles.
 */
const navItems: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  adminOnly?: boolean
  managerOnly?: boolean
  salesOnly?: boolean      // hidden for support role
  supportVisible?: boolean // explicitly visible for support
}[] = [
  // ── Core (all roles)
  { to: '/',            label: 'Dashboard',       icon: LayoutDashboard, end: true },
  { to: '/customers',   label: 'Customers',        icon: Users },
  { to: '/helpdesk',    label: 'Help Desk',        icon: Headphones },
  { to: '/activities',  label: 'Activities',       icon: Activity },
  { to: '/calendar',    label: 'Calendar',         icon: CalendarDays },
  { to: '/tasks',       label: 'Tasks',            icon: CheckSquare },

  // ── Sales (hidden from support)
  { to: '/leads',       label: 'Leads',            icon: UserPlus,    salesOnly: true },
  { to: '/deals',       label: 'Deals',            icon: Briefcase,   salesOnly: true },
  { to: '/quotes',      label: 'Quotes',           icon: FileText,    salesOnly: true },
  { to: '/renewals',    label: 'Renewals',         icon: RefreshCw,   salesOnly: true },

  // ── Intelligence (manager+ only)
  { to: '/reports',         label: 'Reports',          icon: BarChart3,    managerOnly: true },
  { to: '/analytics',       label: 'Analytics',        icon: TrendingUp,   managerOnly: true },
  { to: '/forecasting',     label: 'Forecasting',      icon: LineChart,    managerOnly: true },
  { to: '/sales-goals',     label: 'Sales Goals',      icon: Target,       managerOnly: true },

  // ── Automation (hidden from support)
  { to: '/segments',        label: 'Segments',         icon: Filter,       salesOnly: true },
  { to: '/smart-lists',     label: 'Smart Lists',      icon: Layers,       salesOnly: true },
  { to: '/workflows',       label: 'Workflows',        icon: GitBranch,    salesOnly: true },
  { to: '/email-automation',label: 'Email Automation', icon: Mail,         managerOnly: true },

  // ── Admin & Settings
  { to: '/settings',    label: 'Settings',         icon: Settings },
  { to: '/integrations',label: 'Integrations',     icon: Plug,        supportVisible: true },
  { to: '/team',        label: 'Team',             icon: Users2,      adminOnly: true },
  { to: '/audit-log',   label: 'Audit Log',        icon: ClipboardList, adminOnly: true },
  { to: '/data-quality',label: 'Data Quality',     icon: DatabaseZap, adminOnly: true },
  { to: '/api-webhooks',label: 'API & Webhooks',   icon: Code2,       adminOnly: true },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

function useTaskBadgeCount(): number {
  const tasksQuery = useTasks()
  const tasks = tasksQuery.data ?? []
  const today = new Date().toISOString().slice(0, 10)
  return tasks.filter(
    (t) => !t.completed && t.dueDate && t.dueDate <= today,
  ).length
}

function SidebarContent({
  taskBadge,
  helpdeskBadge,
  onNavClick,
  permissions,
}: {
  taskBadge: number
  helpdeskBadge: number
  onNavClick?: () => void
  permissions: ReturnType<typeof usePermissions>
}) {

  return (
    <>
      <div className="border-b border-slate-700 px-5 py-5">
        <p className="text-lg font-semibold tracking-tight text-white">
          {APP_NAME}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">Sales CRM</p>
      </div>

      {/* Support role indicator */}
      {permissions.isSupport ? (
        <div className="border-b border-slate-700 px-4 py-2">
          <div className="flex items-center gap-2 rounded-md bg-violet-900/50 px-2.5 py-1.5">
            <Headphones className="h-3.5 w-3.5 text-violet-300" aria-hidden />
            <span className="text-xs font-medium text-violet-200">Support Agent</span>
          </div>
        </div>
      ) : null}

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3 sidebar-scroll" aria-label="Main">
        {navItems.map(({ to, label, icon: Icon, end, adminOnly, managerOnly, salesOnly }) => {
          const { isSupport, canAccessReports, canManageTeam } = permissions

          // Admin-only: only admins see this
          if (adminOnly && !canManageTeam) return null
          // Manager-only: admin + manager only
          if (managerOnly && !canAccessReports) return null
          // Sales-only: support agents don't see sales-focused items
          if (salesOnly && isSupport) return null
          const badge =
            to === '/tasks' && taskBadge > 0 ? taskBadge :
            to === '/helpdesk' && helpdeskBadge > 0 ? helpdeskBadge : 0
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavClick}
              className={({ isActive }) =>
                [
                  'flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-300 hover:bg-sidebar-hover hover:text-white',
                ].join(' ')
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </span>
              {badge > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {badge > 9 ? '9+' : badge}
                </span>
              ) : null}
            </NavLink>
          )
        })}

        {/* Pinned records quick access */}
        <PinnedRecordsPanel onNavClick={onNavClick} />

        {/* User Guide — pinned at bottom of nav, always visible */}
        <div className="mt-2 border-t border-slate-700 pt-2">
          <NavLink
            to="/guide"
            onClick={onNavClick}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:bg-sidebar-hover hover:text-white',
              ].join(' ')
            }
          >
            <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
            User Guide
          </NavLink>
        </div>
      </nav>
    </>
  )
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const taskBadge     = useTaskBadgeCount()
  const helpdeskQuery = useTicketOpenCount()
  const helpdeskBadge = helpdeskQuery.data ?? 0
  const permissions   = usePermissions()
  const location      = useLocation()

  // Close mobile sidebar on navigation
  useEffect(() => {
    onMobileClose?.()
  }, [location.pathname, onMobileClose])

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-sidebar text-slate-200">
        <SidebarContent
          taskBadge={taskBadge}
          helpdeskBadge={helpdeskBadge}
          permissions={permissions}
        />
      </aside>

      {/* Mobile sidebar — slide in drawer */}
      {mobileOpen ? (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
            aria-hidden
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-slate-200 shadow-2xl lg:hidden">
            <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
              <p className="text-lg font-semibold tracking-tight text-white">
                {APP_NAME}
              </p>
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close navigation"
                className="rounded-md p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3 sidebar-scroll" aria-label="Main">
              {navItems.map(({ to, label, icon: Icon, end, adminOnly, managerOnly, salesOnly }) => {
                const { isSupport, canAccessReports, canManageTeam } = permissions
                if (adminOnly && !canManageTeam) return null
                if (managerOnly && !canAccessReports) return null
                if (salesOnly && isSupport) return null
                const badge =
                  to === '/tasks' && taskBadge > 0 ? taskBadge :
                  to === '/helpdesk' && helpdeskBadge > 0 ? helpdeskBadge : 0
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onMobileClose}
                    className={({ isActive }) =>
                      [
                        'flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-brand-600 text-white'
                          : 'text-slate-300 hover:bg-sidebar-hover hover:text-white',
                      ].join(' ')
                    }
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {label}
                    </span>
                    {badge > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    ) : null}
                  </NavLink>
                )
              })}

              {/* User Guide */}
              <div className="mt-2 border-t border-slate-700 pt-2">
                <NavLink
                  to="/guide"
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-400 hover:bg-sidebar-hover hover:text-white',
                    ].join(' ')
                  }
                >
                  <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                  User Guide
                </NavLink>
              </div>
            </nav>
          </aside>
        </>
      ) : null}
    </>
  )
}
