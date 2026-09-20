import { ticketsSeed } from '@/mock/tickets'
import type {
  CommentInput,
  Ticket,
  TicketComment,
  TicketInput,
  TicketListParams,
  TicketListResult,
} from '@/types/ticket'

const STORAGE_KEY = 'crm_tickets_v1'

function parseTicketId(id: string): number {
  return parseInt(id.replace('TKT-', ''), 10) || 0
}
function parseCommentId(id: string): number {
  return parseInt(id.replace('C-', ''), 10) || 0
}

function loadDb(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Ticket[]) : structuredClone(ticketsSeed)
  } catch {
    return structuredClone(ticketsSeed)
  }
}

function saveDb(data: Ticket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* quota */ }
}

let ticketsDb: Ticket[] = loadDb()
let nextTicketId = Math.max(0, ...ticketsDb.map((t) => parseTicketId(t.id))) + 1
let nextCommentId = Math.max(
  0,
  ...ticketsDb.flatMap((t) => t.comments.map((c) => parseCommentId(c.id))),
) + 1

export const ticketStore = {
  list(params: TicketListParams = {}): TicketListResult {
    const {
      search = '',
      status = 'All',
      priority = 'All',
      assignedTo = 'All',
      page = 1,
      pageSize = 15,
    } = params

    const q = search.trim().toLowerCase()

    let filtered = ticketsDb.filter((t) => {
      const matchSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.customerName ?? '').toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      const matchStatus   = status === 'All'     || t.status === status
      const matchPriority = priority === 'All'   || t.priority === priority
      const matchAssigned = assignedTo === 'All' || t.assignedTo === assignedTo
      return matchSearch && matchStatus && matchPriority && matchAssigned
    })

    // Sort: open critical first, then by updatedAt desc
    filtered = [...filtered].sort((a, b) => {
      const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 }
      const statusOrder   = { Open: 0, 'In Progress': 1, Pending: 2, Resolved: 3, Closed: 4 }
      if (statusOrder[a.status] !== statusOrder[b.status])
        return statusOrder[a.status] - statusOrder[b.status]
      if (priorityOrder[a.priority] !== priorityOrder[b.priority])
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      return b.updatedAt.localeCompare(a.updatedAt)
    })

    const total      = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage   = Math.min(Math.max(page, 1), totalPages)
    const start      = (safePage - 1) * pageSize

    return {
      data: filtered.slice(start, start + pageSize),
      total,
      page: safePage,
      pageSize,
      totalPages,
    }
  },

  getById(id: string): Ticket | undefined {
    return ticketsDb.find((t) => t.id === id)
  },

  getOpenCount(): number {
    return ticketsDb.filter((t) => t.status === 'Open' || t.status === 'In Progress').length
  },

  create(input: TicketInput): Ticket {
    const id = `TKT-${String(nextTicketId).padStart(3, '0')}`
    nextTicketId++
    const now = new Date().toISOString()
    const ticket: Ticket = { ...input, id, createdAt: now, updatedAt: now, comments: [] }
    ticketsDb = [ticket, ...ticketsDb]
    saveDb(ticketsDb)
    return ticket
  },

  update(id: string, input: Partial<TicketInput>): Ticket {
    const idx = ticketsDb.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error(`Ticket ${id} not found`)
    const now = new Date().toISOString()
    const updated: Ticket = {
      ...ticketsDb[idx],
      ...input,
      id,
      updatedAt: now,
      ...(input.status === 'Resolved' || input.status === 'Closed'
        ? { resolvedAt: now }
        : {}),
    }
    ticketsDb = [...ticketsDb.slice(0, idx), updated, ...ticketsDb.slice(idx + 1)]
    saveDb(ticketsDb)
    return updated
  },

  /** Record the ClickUp task that was created for this ticket */
  linkClickUpTask(id: string, taskId: string, taskUrl: string): Ticket {
    const idx = ticketsDb.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error(`Ticket ${id} not found`)
    const updated: Ticket = {
      ...ticketsDb[idx],
      clickupTaskId: taskId,
      clickupTaskUrl: taskUrl,
      clickupPushedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    ticketsDb = [...ticketsDb.slice(0, idx), updated, ...ticketsDb.slice(idx + 1)]
    saveDb(ticketsDb)
    return updated
  },

  remove(id: string): void {
    if (!ticketsDb.some((t) => t.id === id)) throw new Error(`Ticket ${id} not found`)
    ticketsDb = ticketsDb.filter((t) => t.id !== id)
    saveDb(ticketsDb)
  },

  addComment(ticketId: string, input: CommentInput): TicketComment {
    const idx = ticketsDb.findIndex((t) => t.id === ticketId)
    if (idx === -1) throw new Error(`Ticket ${ticketId} not found`)
    const comment: TicketComment = {
      ...input,
      id: `C-${String(nextCommentId).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    }
    nextCommentId++
    const now = new Date().toISOString()
    const updated: Ticket = {
      ...ticketsDb[idx],
      comments: [...ticketsDb[idx].comments, comment],
      updatedAt: now,
    }
    ticketsDb = [...ticketsDb.slice(0, idx), updated, ...ticketsDb.slice(idx + 1)]
    saveDb(ticketsDb)
    return comment
  },
}
