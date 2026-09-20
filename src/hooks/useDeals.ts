import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dealService } from '@/services/dealService'
import type { DealInput, DealListParams, DealStage } from '@/types/deal'

export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (params: DealListParams) => [...dealKeys.lists(), params] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
  byCustomer: (customerId: string) =>
    [...dealKeys.all, 'byCustomer', customerId] as const,
}

export function useDeals(params: DealListParams = {}) {
  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => dealService.getDeals(params),
    placeholderData: (previous) => previous,
  })
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => dealService.getDeal(id),
    enabled: Boolean(id),
  })
}

export function useCustomerDeals(customerId: string) {
  return useQuery({
    queryKey: dealKeys.byCustomer(customerId),
    queryFn: () => dealService.getDealsByCustomer(customerId),
    enabled: Boolean(customerId),
  })
}

export function useCreateDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DealInput) => dealService.createDeal(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dealKeys.all })
    },
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DealInput }) =>
      dealService.updateDeal(id, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: dealKeys.all })
      await queryClient.invalidateQueries({
        queryKey: dealKeys.detail(variables.id),
      })
    },
  })
}

export function useDeleteDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => dealService.deleteDeal(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dealKeys.all })
    },
  })
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      dealService.updateStage(id, stage),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dealKeys.all })
    },
  })
}

export function useUpdateDealStageWithReason() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      stage,
      reason,
    }: {
      id: string
      stage: DealStage
      reason: string
    }) => dealService.updateDealWithReason(id, stage, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dealKeys.all })
    },
  })
}
