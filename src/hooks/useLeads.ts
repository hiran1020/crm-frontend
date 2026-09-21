import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leadService } from '@/services/leadService'
import { userService } from '@/services/userService'
import type { LeadInput, LeadListParams, LeadListResult } from '@/types/lead'

export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (params: LeadListParams) => [...leadKeys.lists(), params] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
  owners: () => [...leadKeys.all, 'owners'] as const,
}

export function useLeads(params: LeadListParams = {}) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => leadService.getLeads(params),
    placeholderData: (previous) => previous,
  })
}

export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => leadService.getLead(id),
    enabled: Boolean(id),
  })
}

export function useLeadOwners() {
  return useQuery({
    queryKey: ['crmUsers', 'list'] as const,
    queryFn: () => userService.getUsers(),
    select: (users) => users.map((u) => u.name),
    staleTime: 10 * 60_000,
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LeadInput) => leadService.createLead(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LeadInput }) =>
      leadService.updateLead(id, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: leadKeys.all })
      await queryClient.invalidateQueries({
        queryKey: leadKeys.detail(variables.id),
      })
    },
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => leadService.deleteLead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: leadKeys.all })
      const snapshots = queryClient.getQueriesData<LeadListResult>({ queryKey: leadKeys.lists() })
      queryClient.setQueriesData<LeadListResult>({ queryKey: leadKeys.lists() }, (old) => {
        if (!old) return old
        return { ...old, data: old.data.filter((l) => l.id !== id), total: old.total - 1 }
      })
      return { snapshots }
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  })
}

export function useBulkDeleteLeads() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => leadService.bulkDeleteLeads(ids),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

export function useConvertLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => leadService.convertLead(id),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: leadKeys.all })
      await queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) })
    },
  })
}
