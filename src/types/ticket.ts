export type TicketStatus   = 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed'
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical'
export type TicketCategory =
  | 'Bug'
  | 'Feature Request'
  | 'Billing'
  | 'Technical Support'
  | 'General Inquiry'
  | 'Delivery Issue'
  | 'Fuel Quality'

export interface TicketComment {
  id: string
  ticketId: string
  author: string
  body: string
  createdAt: string
  isInternal: boolean // internal note vs customer-visible reply
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  customerId?: string
  customerName?: string
  assignedTo: string
  assigneeId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  comments: TicketComment[]
  /** Set when the ticket has been pushed to ClickUp */
  clickupTaskId?: string
  clickupTaskUrl?: string
  clickupPushedAt?: string
}

export type TicketInput   = Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'comments'>
export type CommentInput  = Omit<TicketComment, 'id' | 'createdAt'>

export interface TicketListParams {
  search?:   string
  status?:   TicketStatus | 'All'
  priority?: TicketPriority | 'All'
  assignedTo?: string | 'All'
  page?:     number
  pageSize?: number
}

export interface TicketListResult {
  data:       Ticket[]
  total:      number
  page:       number
  pageSize:   number
  totalPages: number
}
