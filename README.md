# PulseCRM — Frontend

A production-quality CRM web application built with React, TypeScript, and Tailwind CSS. Designed with a clean service-layer architecture so the mock data can be replaced by a real Rails API without touching any UI components.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build tool | Vite 6 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 |
| Server state | TanStack Query v5 |
| Forms | React Hook Form v7 + Zod v4 |
| Charts | Recharts v3 |
| Drag & drop | @dnd-kit/core |
| Icons | Lucide React |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type-check
npm run lint

# Production build
npm run build
```

The app runs at **http://localhost:5173**.

---

## Demo Accounts

All accounts use the password `password`.

| Email | Role | Access |
|---|---|---|
| `admin@crm.com` | Admin | Full access to every feature and setting |
| `sarah@crm.com` | Manager | Sales + reports, team records, forecasting |
| `david@crm.com` | Sales Agent | Own customers, leads, deals, activities |
| `alex@crm.com` | Support Agent | Help Desk focus — tickets, customer view |

> **Tip:** Log in as `admin@crm.com` to see all 34 pages and all admin-only features.

---

## Features

### Core CRM Modules

| Module | Route | Description |
|---|---|---|
| Dashboard | `/` | Role-adaptive — sales forecast view or support queue view |
| Customers | `/customers` | Table with bulk actions, CSV import/export, avatar, tags |
| Customer Details | `/customers/:id` | 7 tabs: Deals, Activities, Notes, Files, Timeline, 360°, Onboarding |
| Leads | `/leads` | Score badges, inline status change, bulk actions |
| Lead Details | `/leads/:id` | Score breakdown, convert to customer, email composer |
| Deals | `/deals` | Kanban board with drag-and-drop, win/loss reason |
| Deal Details | `/deals/:id` | Stage changer, clone deal, activities, AI Insights |
| Quotes | `/quotes` | Professional quote documents with line items |
| Quote Details | `/quotes/:id` | Printable quote, status workflow |

### Help Desk

| Module | Route | Description |
|---|---|---|
| Help Desk | `/helpdesk` | Ticket queue — expandable rows, ClickUp push |
| Ticket Details | `/helpdesk/:id` | Conversation thread, internal notes, ClickUp integration |
| Renewals | `/renewals` | Contract renewal tracking with urgency color coding |

### Activities & Time

| Module | Route | Description |
|---|---|---|
| Activities | `/activities` | Grouped list, click to open detail slide-over panel |
| Calendar | `/calendar` | Monthly grid with colored event dots, click-day panel |
| Tasks | `/tasks` | Grouped by urgency, expandable cards with inline actions |
| Notifications | `/notifications` | Task and ticket alerts, mark-complete from notification |

### Intelligence

| Module | Route | Description |
|---|---|---|
| Reports | `/reports` | Pipeline, lead sources, monthly revenue, win rate (3 tabs) |
| Analytics | `/analytics` | Conversion funnel, pipeline velocity, team leaderboard |
| Forecasting | `/forecasting` | 3-scenario forecast + deal-by-deal breakdown |
| Sales Goals | `/sales-goals` | Goal cards with progress bars per metric |

### Automation

| Module | Route | Description |
|---|---|---|
| Segments | `/segments` | Segment builder with AND/OR filter conditions |
| Smart Lists | `/smart-lists` | 8 auto-maintained dynamic lists (Overdue Tasks, Hot Leads…) |
| Workflows | `/workflows` | Visual workflow builder |
| Email Automation | `/email-automation` | Drip sequence builder with step editor |

### Admin & Settings

| Module | Route | Description |
|---|---|---|
| Settings | `/settings` | Profile, team, permissions matrix, custom fields, dev tools |
| Team | `/team` | Full user management — invite, roles, activate/deactivate |
| User Details | `/team/:id` | Per-user stats and recent activity |
| Audit Log | `/audit-log` | Change history timeline (admin only) |
| Data Quality | `/data-quality` | Score ring, find & fix incomplete records |
| Integrations | `/integrations` | Integration cards + real ClickUp API configuration |
| API & Webhooks | `/api-webhooks` | API reference, webhook config, API key management |
| User Guide | `/guide` | 20-section in-app documentation |

---

## Architecture

```
UI Components
     ↓
Pages  (React components — React.lazy code-split)
     ↓
Hooks  (TanStack Query — useQuery / useMutation)
     ↓
Services  (delay() simulates network latency)
     ↓
Mock Stores  (in-memory + localStorage persistence)
```

When the Rails API is ready, **only the service layer changes** — all hooks, components, and pages stay identical. Replace each service method body with a `fetch('/api/...')` call.

### Key architectural rules

- Pages **never** import directly from `src/mock/*`
- Data always flows: `Page → Hook → Service → Store`
- Every service method calls `await delay()` to simulate network latency
- TanStack Query handles caching, invalidation, and loading/error states
- React Hook Form + Zod handles all form validation with `mode: 'onBlur'`
- All modals slide up from the bottom on mobile (bottom-sheet pattern)

---

## Project Structure

```
src/
├── components/
│   ├── activities/      # ActivityItem, ActivityList, EmailComposerModal, ActivityDetailPanel
│   ├── common/          # EmptyState, ErrorBoundary, TabNav, FileList, DocumentViewer,
│   │                    # AccessGuard, Breadcrumbs, PinButton, BulkEmailModal …
│   ├── customers/       # CustomerTable, CustomerFormModal, AvatarUpload,
│   │                    # CustomerHealthScoreCard, CustomerOnboarding …
│   ├── dashboard/       # StatCard, PipelineChart, RevenueGoal, SupportDashboard
│   ├── deals/           # KanbanBoard, KanbanColumn, DealCard, WinLossModal …
│   ├── helpdesk/        # TicketFormModal, TicketStatusBadge, PushToClickUp, ClickUpPanel …
│   ├── leads/           # LeadTable, LeadFormModal, LeadStatusBadge, ConvertLeadModal …
│   ├── layout/          # Header, Sidebar, GlobalSearch, NotificationsDropdown, ThemeToggle
│   ├── quotes/          # QuoteFormModal
│   └── users/           # UserTable, UserFormModal, UserRoleBadge
│
├── context/
│   ├── AuthContext.tsx  # Mock auth — 4 roles, localStorage session
│   └── ThemeContext.tsx # Light / Dark / System theme toggle
│
├── hooks/               # One hook file per domain
│   ├── useCustomers.ts  # useCustomers, useCustomer, useCreateCustomer …
│   ├── useLeads.ts
│   ├── useDeals.ts
│   ├── useTickets.ts    # + useLinkClickUpTask
│   ├── useActivities.ts
│   ├── usePermissions.ts  # Role-based permission checks
│   └── ...
│
├── layouts/
│   └── DashboardLayout.tsx
│
├── lib/
│   ├── clickupConfig.ts   # ClickUp API configuration + localStorage
│   ├── csv.ts             # CSV parse (import) + download (export)
│   ├── delay.ts           # Network simulation helper
│   ├── format.ts          # formatCurrency, formatDate, formatRelativeDate
│   ├── goal.ts            # Revenue goal localStorage helper
│   ├── healthScore.ts     # Customer health score algorithm
│   ├── leadScore.ts       # Lead scoring algorithm (Hot/Warm/Cold)
│   ├── pinnedRecords.ts   # Pinned records localStorage
│   └── recentlyViewed.ts  # Recently viewed records localStorage
│
├── mock/                  # In-memory stores with localStorage persistence
│   ├── customerStore.ts   # Full CRUD + search/filter/sort/paginate
│   ├── leadStore.ts
│   ├── dealStore.ts
│   ├── ticketStore.ts     # + linkClickUpTask()
│   ├── activityStore.ts
│   ├── attachmentStore.ts
│   └── ...
│
├── pages/                 # 34 pages — all React.lazy code-split
│
├── routes/
│   └── AppRoutes.tsx      # All routes with React.lazy + Suspense fallback
│
├── schemas/               # Zod validation schemas per domain
│   ├── customer.ts
│   ├── lead.ts
│   ├── deal.ts
│   ├── ticket.ts
│   └── ...
│
├── services/              # API service layer — swap here for real API
│   ├── customerService.ts
│   ├── leadService.ts
│   ├── dealService.ts
│   ├── ticketService.ts
│   ├── clickupService.ts  # Real ClickUp REST API v2 calls
│   └── ...
│
└── types/                 # TypeScript interfaces per domain
    ├── customer.ts
    ├── lead.ts
    ├── deal.ts
    ├── ticket.ts          # includes clickupTaskId, clickupTaskUrl
    ├── user.ts            # UserRole: admin | manager | sales_agent | support
    └── ...
```

---

## Roles & Permissions

| Capability | Admin | Manager | Sales | Support |
|---|:---:|:---:|:---:|:---:|
| View customers | ✅ | ✅ | ✅ | ✅ (read-only) |
| Create / edit customers | ✅ | ✅ | ✅ | ❌ |
| Delete customers | ✅ | ✅ | ❌ | ❌ |
| Access Leads & Deals | ✅ | ✅ | ✅ | ❌ |
| Convert leads to customers | ✅ | ✅ | ❌ | ❌ |
| Move deal stages | ✅ | ✅ | ❌ | ❌ |
| Full Help Desk access | ✅ | ✅ | ✅ | ✅ |
| Push tickets to ClickUp | ✅ | ✅ | ❌ | ✅ |
| Reports & Analytics | ✅ | ✅ | ❌ | ❌ |
| Forecasting & Goals | ✅ | ✅ | ❌ | ❌ |
| Export CSV data | ✅ | ✅ | ❌ | ❌ |
| Configure integrations | ✅ | ❌ | ❌ | ✅ |
| Manage team & users | ✅ | ❌ | ❌ | ❌ |
| Audit Log | ✅ | ❌ | ❌ | ❌ |

> Frontend permissions control **UI visibility only**. The Rails backend enforces actual security server-side.

---

## ClickUp Integration

The Help Desk integrates directly with the FleetPanda ClickUp workspace for dev team escalation.

| Config | Value |
|---|---|
| Workspace ID | `8447923` |
| Target list | Fixes and Improvements (Eng space) |
| List ID | `900700247859` |
| Dev workflow | to do → in progress → dev testing → pull request → QA → done |

### Setup
1. Go to **Integrations** in the sidebar
2. Scroll to **ClickUp** under "Deep Integrations"
3. Get your Personal API Token from [ClickUp Settings → Apps](https://app.clickup.com/settings/apps)
4. Paste the token → click **Verify** → **Enable** → **Save**

### Usage
- **Ticket list** — violet Send icon on each row
- **Ticket Details** — "Push to ClickUp" button in the header

After a successful push the button turns green with a direct link to the task, and the ticket info card shows a "ClickUp" row.

---

## Data Persistence (localStorage keys)

| Key | Contents |
|---|---|
| `crm_customers_v1` | Customer records |
| `crm_leads_v1` | Lead records |
| `crm_deals_v1` | Deal records |
| `crm_tickets_v1` | Support tickets + comments |
| `crm_activities_v1` | Activity log |
| `crm_users_v1` | Team member records |
| `crm_quotes_v1` | Quotes & proposals |
| `crm_renewals_v1` | Contract renewals |
| `crm_segments_v1` | Saved segments |
| `crm_tags_v1` | Tag definitions |
| `crm_attachments_v1` | File attachments (base64) |
| `crm_pinned_v1` | Pinned records sidebar |
| `crm_recently_viewed` | Recently viewed records |
| `crm_theme` | Light / Dark / System preference |
| `crm_auth` | Current session user |
| `crm_clickup_config` | ClickUp API token + list config |

**Reset all data:** Settings → Developer Tools → **Reset Data**

---

## Keyboard Shortcuts

| Keys | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Global search |
| `?` | Keyboard shortcuts panel |
| `Esc` | Close modal / dropdown / panel |
| `G` then `D` | Go to Dashboard |
| `G` then `C` | Go to Customers |
| `G` then `L` | Go to Leads |
| `G` then `P` | Go to Pipeline |
| `G` then `A` | Go to Activities |
| `G` then `T` | Go to Tasks |

---

## Notable Implementation Details

| Feature | Detail |
|---|---|
| **Code splitting** | All 34 pages use `React.lazy()` — initial JS bundle ≈ 150 KB |
| **Dark mode** | Full `html.dark` CSS variable overrides; Recharts charts adapt via `useTheme()` |
| **Drag & drop** | @dnd-kit with `distance: 8px` activation — clicks still open modals |
| **Print styles** | `@media print` hides chrome; Quote Details prints as a clean document |
| **Bottom-sheet modals** | All form modals slide up from the bottom on mobile |
| **Progressive columns** | Customer/Lead tables hide columns progressively (sm/md/lg) |
| **Accordion rows** | Customer, Lead, and Help Desk tables expand inline |
| **AI Insights** | Computed from real CRM data (deal age, lead score, ticket count) |
| **Lead scoring** | Hot/Warm/Cold badge from value + status + source algorithm |
| **Customer Health Score** | 0–100 from activity recency, deal status, open tickets, account status |
| **Document Viewer** | Images: zoom 25–400% + pan + fullscreen. PDFs: inline iframe |
| **Sidebar scrollable** | Scrolls when nav items exceed screen height (thin dark scrollbar) |
| **Real-time simulation** | `useRealTimeRefresh` invalidates TanStack Query every 30s |

---

## Moving to Production (Rails API)

Only the **service layer** changes. All other files stay identical.

```ts
// src/services/customerService.ts

// Current (mock)
async getCustomers(params: CustomerListParams): Promise<CustomerListResult> {
  await delay(450)
  return customerStore.list(params)
}

// Replace with (Rails API)
async getCustomers(params: CustomerListParams): Promise<CustomerListResult> {
  const response = await fetch('/api/v1/customers?' + new URLSearchParams(params as Record<string, string>), {
    headers: { Authorization: `Bearer ${getAuthToken()}` }
  })
  if (!response.ok) throw new Error('Failed to fetch customers')
  return response.json() as Promise<CustomerListResult>
}
```

### Migration checklist

- [ ] Replace service method bodies with `fetch` calls
- [ ] Implement JWT authentication (Devise Token Auth recommended)
- [ ] Point ClickUp push through a Rails backend proxy (avoids CORS + hides token)
- [ ] Move file uploads to S3 / Cloudflare R2 via Active Storage
- [ ] Add ActionCable WebSocket for real-time ticket updates
- [ ] Enforce all permissions server-side (backend is the real security layer)
- [ ] Add proper error handling for 401 / 403 / 422 / 500 responses
- [ ] Implement pagination cursors instead of page-number offsets

---

## Scripts

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # TypeScript check + Vite production build
npm run lint     # TypeScript type-check only (no emit)
npm run preview  # Preview production build locally
```

---

## License

Private — FleetPanda internal tooling.
