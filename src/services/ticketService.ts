import { delay } from '@/lib/delay'
import { ticketStore } from '@/mock/ticketStore'
import type {
  CommentInput,
  Ticket,
  TicketComment,
  TicketInput,
  TicketListParams,
  TicketListResult,
} from '@/types/ticket'

export const ticketService = {
  async getTickets(params: TicketListParams = {}): Promise<TicketListResult> {
    await delay(400)
    return ticketStore.list(params)
  },

  async getTicket(id: string): Promise<Ticket> {
    await delay(300)
    const ticket = ticketStore.getById(id)
    if (!ticket) throw new Error('Ticket not found')
    return ticket
  },

  async getOpenCount(): Promise<number> {
    await delay(150)
    return ticketStore.getOpenCount()
  },

  async createTicket(input: TicketInput): Promise<Ticket> {
    await delay(500)
    return ticketStore.create(input)
  },

  async updateTicket(id: string, input: Partial<TicketInput>): Promise<Ticket> {
    await delay(400)
    return ticketStore.update(id, input)
  },

  async deleteTicket(id: string): Promise<void> {
    await delay(400)
    ticketStore.remove(id)
  },

  async addComment(ticketId: string, input: CommentInput): Promise<TicketComment> {
    await delay(350)
    return ticketStore.addComment(ticketId, input)
  },

  async linkClickUpTask(id: string, taskId: string, taskUrl: string): Promise<Ticket> {
    await delay(200)
    return ticketStore.linkClickUpTask(id, taskId, taskUrl)
  },
}
