import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ticketService } from '@/services/ticketService'
import type { CommentInput, TicketInput, TicketListParams } from '@/types/ticket'

export const ticketKeys = {
  all:      ['tickets'] as const,
  lists:    () => [...ticketKeys.all, 'list'] as const,
  list:     (params: TicketListParams) => [...ticketKeys.lists(), params] as const,
  details:  () => [...ticketKeys.all, 'detail'] as const,
  detail:   (id: string) => [...ticketKeys.details(), id] as const,
  openCount: () => [...ticketKeys.all, 'openCount'] as const,
}

export function useTickets(params: TicketListParams = {}) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () => ticketService.getTickets(params),
    placeholderData: (prev) => prev,
  })
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => ticketService.getTicket(id),
    enabled: Boolean(id),
  })
}

export function useTicketOpenCount() {
  return useQuery({
    queryKey: ticketKeys.openCount(),
    queryFn: ticketService.getOpenCount,
    staleTime: 60_000,
  })
}

export function useCreateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: TicketInput) => ticketService.createTicket(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ticketKeys.all })
    },
  })
}

export function useUpdateTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TicketInput> }) =>
      ticketService.updateTicket(id, input),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ticketKeys.all })
      await qc.invalidateQueries({ queryKey: ticketKeys.detail(vars.id) })
    },
  })
}

export function useDeleteTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ticketService.deleteTicket(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ticketKeys.all })
    },
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, input }: { ticketId: string; input: CommentInput }) =>
      ticketService.addComment(ticketId, input),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ticketKeys.detail(vars.ticketId) })
      await qc.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

export function useLinkClickUpTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, taskId, taskUrl }: { id: string; taskId: string; taskUrl: string }) =>
      ticketService.linkClickUpTask(id, taskId, taskUrl),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: ticketKeys.detail(vars.id) })
      await qc.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}
