import { api } from '@/lib/api'
import type {
  CommentInput,
  Ticket,
  TicketComment,
  TicketInput,
  TicketListParams,
  TicketListResult,
} from '@/types/ticket'

// Backend uses In_Progress; frontend uses "In Progress"
const STATUS_FROM_API: Record<string, Ticket['status']> = {
  Open: 'Open',
  In_Progress: 'In Progress',
  Pending: 'Pending',
  Resolved: 'Resolved',
  Closed: 'Closed',
}
const STATUS_TO_API: Record<string, string> = {
  Open: 'Open',
  'In Progress': 'In_Progress',
  Pending: 'Pending',
  Resolved: 'Resolved',
  Closed: 'Closed',
}

interface ApiTicket {
  id: string
  subject?: string
  description?: string
  status?: string
  priority?: string
  category?: string
  customerId?: string
  customerName?: string
  assigneeId?: string
  assigneeName?: string
  createdAt?: string
  updatedAt?: string
  resolvedAt?: string
  clickupTaskId?: string
  clickupTaskUrl?: string
  clickupPushedAt?: string
}

interface ApiComment {
  id: string
  ticketId?: string
  author?: string
  body?: string
  createdAt?: string
  isInternal?: boolean
}

interface ApiListResult {
  data: ApiTicket[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function fromApi(d: ApiTicket, comments: TicketComment[] = []): Ticket {
  return {
    id: d.id,
    title: d.subject ?? '',
    description: d.description ?? '',
    status: STATUS_FROM_API[d.status ?? 'Open'] ?? 'Open',
    priority: (d.priority as Ticket['priority']) ?? 'Medium',
    category: (d.category as Ticket['category']) ?? 'General Inquiry',
    customerId: d.customerId,
    customerName: d.customerName,
    assignedTo: d.assigneeName ?? '',
    createdBy: d.assigneeId ?? '',
    createdAt: d.createdAt ?? new Date().toISOString(),
    updatedAt: d.updatedAt ?? new Date().toISOString(),
    resolvedAt: d.resolvedAt,
    comments,
    clickupTaskId: d.clickupTaskId,
    clickupTaskUrl: d.clickupTaskUrl,
    clickupPushedAt: d.clickupPushedAt,
  }
}

function commentFromApi(c: ApiComment, ticketId: string): TicketComment {
  return {
    id: c.id,
    ticketId,
    author: c.author ?? '',
    body: c.body ?? '',
    createdAt: c.createdAt ?? new Date().toISOString(),
    isInternal: c.isInternal ?? false,
  }
}

function toApi(input: Partial<TicketInput>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (input.title !== undefined)       payload.subject     = input.title
  if (input.description !== undefined) payload.description = input.description
  if (input.status !== undefined)      payload.status      = STATUS_TO_API[input.status] ?? input.status
  if (input.priority !== undefined)    payload.priority    = input.priority
  if (input.category !== undefined)    payload.category    = input.category
  if (input.customerId !== undefined)  payload.customerId  = input.customerId
  if (input.customerName !== undefined) payload.customerName = input.customerName
  if (input.assignedTo !== undefined)  payload.assigneeName = input.assignedTo
  if (input.assigneeId !== undefined)  payload.assigneeId   = input.assigneeId
  return payload
}

export const ticketService = {
  async getTickets(params: TicketListParams = {}): Promise<TicketListResult> {
    const qs = new URLSearchParams()
    if (params.search)   qs.set('search', params.search)
    if (params.status && params.status !== 'All') qs.set('status', STATUS_TO_API[params.status] ?? params.status)
    if (params.priority && params.priority !== 'All') qs.set('priority', params.priority)
    if (params.page)     qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))

    const res = await api.get<ApiListResult>(`/tickets?${qs}`)
    return { ...res, data: res.data.map((t) => fromApi(t)) }
  },

  async getTicket(id: string): Promise<Ticket> {
    const [d, commentsRes] = await Promise.all([
      api.get<ApiTicket>(`/tickets/${id}`),
      api.get<{ data: ApiComment[] }>(`/tickets/${id}/comments`).catch(() => ({ data: [] })),
    ])
    const comments = commentsRes.data.map((c) => commentFromApi(c, id))
    return fromApi(d, comments)
  },

  async getOpenCount(): Promise<number> {
    const res = await api.get<ApiListResult>('/tickets?status=Open&pageSize=1')
    return res.total
  },

  async createTicket(input: TicketInput): Promise<Ticket> {
    const d = await api.post<ApiTicket>('/tickets', toApi(input))
    return fromApi(d)
  },

  async updateTicket(id: string, input: Partial<TicketInput>): Promise<Ticket> {
    const d = await api.patch<ApiTicket>(`/tickets/${id}`, toApi(input))
    return fromApi(d)
  },

  async deleteTicket(id: string): Promise<void> {
    await api.delete(`/tickets/${id}`)
  },

  async addComment(ticketId: string, input: CommentInput): Promise<TicketComment> {
    const c = await api.post<ApiComment>(`/tickets/${ticketId}/comments`, {
      author: input.author,
      body: input.body,
      isInternal: input.isInternal,
    })
    return commentFromApi(c, ticketId)
  },

  async linkClickUpTask(id: string, taskId: string, taskUrl: string): Promise<Ticket> {
    const d = await api.patch<ApiTicket>(`/tickets/${id}`, {
      clickupTaskId: taskId,
      clickupTaskUrl: taskUrl,
      clickupPushedAt: new Date().toISOString(),
    })
    return fromApi(d)
  },
}
