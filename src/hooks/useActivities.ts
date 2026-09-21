import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activityService } from '@/services/activityService'
import type { ActivityInput } from '@/types/activity'

export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  byCustomer: (customerId: string) =>
    [...activityKeys.all, 'byCustomer', customerId] as const,
  byLead: (leadId: string) =>
    [...activityKeys.all, 'byLead', leadId] as const,
  byDeal: (dealId: string) =>
    [...activityKeys.all, 'byDeal', dealId] as const,
  tasks: () => [...activityKeys.all, 'tasks'] as const,
}

export function useActivities() {
  return useQuery({
    queryKey: activityKeys.lists(),
    queryFn: activityService.getActivities,
  })
}

export function useCustomerActivities(customerId: string) {
  return useQuery({
    queryKey: activityKeys.byCustomer(customerId),
    queryFn: () => activityService.getActivitiesByCustomer(customerId),
    enabled: Boolean(customerId),
  })
}

export function useLeadActivities(leadId: string) {
  return useQuery({
    queryKey: activityKeys.byLead(leadId),
    queryFn: () => activityService.getActivitiesByLead(leadId),
    enabled: Boolean(leadId),
  })
}

export function useDealActivities(dealId: string) {
  return useQuery({
    queryKey: activityKeys.byDeal(dealId),
    queryFn: () => activityService.getActivitiesByDeal(dealId),
    enabled: Boolean(dealId),
  })
}

export function useTasks() {
  return useQuery({
    queryKey: activityKeys.tasks(),
    queryFn: activityService.getTasks,
    staleTime: 60_000,
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ActivityInput) => activityService.createActivity(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: activityKeys.all })
    },
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => activityService.deleteActivity(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: activityKeys.all })
    },
  })
}

export function useMarkActivityComplete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => activityService.markComplete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: activityKeys.all })
    },
  })
}
