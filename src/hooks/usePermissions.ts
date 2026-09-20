import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types/user'

/**
 * Role-based permission system.
 * Frontend-only — actual security enforcement happens in the Rails backend.
 * Controls UI visibility and available actions only.
 *
 * Roles:
 *   admin       — full access to everything
 *   manager     — manage team records, reports, forecasting, convert leads
 *   sales_agent — create/manage own records, pipeline, activities
 *   support     — help desk focus: view customers, full ticket access, own activities
 */

interface Permissions {
  // ── Role checks ──────────────────────────────────────────────────
  isAdmin:   boolean
  isManager: boolean
  isSalesAgent: boolean
  isSupport: boolean

  // ── Customers ────────────────────────────────────────────────────
  canViewCustomers: boolean
  canCreateCustomer: boolean
  canEditCustomer:   (ownerName: string) => boolean
  canDeleteCustomer: (ownerName: string) => boolean

  // ── Leads ────────────────────────────────────────────────────────
  canViewLeads: boolean
  canCreateLead: boolean
  canEditLead:   (ownerName: string) => boolean
  canDeleteLead: (ownerName: string) => boolean
  canConvertLead: boolean
  canBulkDeleteLeads: boolean

  // ── Deals ────────────────────────────────────────────────────────
  canViewDeals: boolean
  canCreateDeal: boolean
  canEditDeal:   (ownerName: string) => boolean
  canDeleteDeal: (ownerName: string) => boolean
  canMoveDealStage: boolean

  // ── Help Desk / Tickets ──────────────────────────────────────────
  canViewHelpdesk: boolean
  canCreateTicket: boolean
  canEditTicket:   boolean
  canDeleteTicket: boolean
  canReplyToTicket: boolean
  canChangeTicketStatus: boolean
  canAddInternalNote: boolean
  canPushToClickUp: boolean

  // ── Activities ───────────────────────────────────────────────────
  canViewActivities: boolean
  canCreateActivity: boolean
  canDeleteActivity: (ownerName: string) => boolean

  // ── Navigation / Sections ────────────────────────────────────────
  canAccessReports:    boolean   // Reports, Analytics
  canAccessForecasting: boolean  // Forecasting, Sales Goals
  canAccessSalesTools: boolean   // Leads, Deals, Quotes, Renewals, Segments
  canManageTeam:       boolean   // Team, Audit Log, Data Quality, Admin
  canExportData:       boolean
  canAccessSettings:   boolean
  canAccessIntegrations: boolean
}

function buildPermissions(role: UserRole | undefined, userName: string): Permissions {
  const isAdmin    = role === 'admin'
  const isManager  = role === 'manager'
  const isAgent    = role === 'sales_agent'
  const isSupport  = role === 'support'

  const isOwner = (ownerName: string) => ownerName === userName

  // Support agents can't own customers/deals, but can view them
  const canEditOwned   = (o: string) => isAdmin || isManager || (isAgent && isOwner(o))
  const canDeleteOwned = (o: string) => isAdmin || (isManager && isOwner(o))

  return {
    // Role flags
    isAdmin,
    isManager,
    isSalesAgent: isAgent,
    isSupport,

    // ── Customers
    canViewCustomers:  true,  // all roles
    canCreateCustomer: !isSupport,
    canEditCustomer:   (o) => isSupport ? false : canEditOwned(o),
    canDeleteCustomer: (o) => isSupport ? false : canDeleteOwned(o),

    // ── Leads (support has no access)
    canViewLeads:      !isSupport,
    canCreateLead:     !isSupport,
    canEditLead:       (o) => isSupport ? false : canEditOwned(o),
    canDeleteLead:     (o) => isSupport ? false : canDeleteOwned(o),
    canConvertLead:    isAdmin || isManager,
    canBulkDeleteLeads: isAdmin || isManager,

    // ── Deals (support has no access)
    canViewDeals:    !isSupport,
    canCreateDeal:   !isSupport,
    canEditDeal:     (o) => isSupport ? false : canEditOwned(o),
    canDeleteDeal:   (o) => isSupport ? false : canDeleteOwned(o),
    canMoveDealStage: isAdmin || isManager,

    // ── Help Desk (support has FULL access; others have limited)
    canViewHelpdesk:       true,
    canCreateTicket:       true,
    canEditTicket:         true,
    canDeleteTicket:       isAdmin || isManager || isSupport,
    canReplyToTicket:      true,
    canChangeTicketStatus: true,
    canAddInternalNote:    true,
    canPushToClickUp:      isAdmin || isManager || isSupport,

    // ── Activities
    canViewActivities:  true,
    canCreateActivity:  true,
    canDeleteActivity:  (o) => isAdmin || isManager || isSupport || isOwner(o),

    // ── Navigation / Sections
    canAccessReports:     isAdmin || isManager,
    canAccessForecasting: isAdmin || isManager,
    canAccessSalesTools:  !isSupport,   // leads, deals, quotes, renewals, segments
    canManageTeam:        isAdmin,
    canExportData:        isAdmin || isManager,
    canAccessSettings:    true,
    canAccessIntegrations: isAdmin || isSupport,  // support needs ClickUp integration
  }
}

export function usePermissions(): Permissions {
  const { user } = useAuth()
  return buildPermissions(user?.role, user?.name ?? '')
}
