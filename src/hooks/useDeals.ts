import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dealService } from '@/services/dealService'
import type { Deal, DealInput, DealListParams, DealListResult, DealStage } from '@/types/deal'

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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: dealKeys.all })
      const snapshots = queryClient.getQueriesData<DealListResult>({ queryKey: dealKeys.lists() })
      queryClient.setQueriesData<DealListResult>({ queryKey: dealKeys.lists() }, (old) => {
        if (!old) return old
        return { ...old, data: old.data.filter((d) => d.id !== id), total: old.total - 1 }
      })
      return { snapshots }
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: dealKeys.all }),
  })
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      dealService.updateStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: dealKeys.all })
      const snapshots = queryClient.getQueriesData<DealListResult>({ queryKey: dealKeys.lists() })
      queryClient.setQueriesData<DealListResult>({ queryKey: dealKeys.lists() }, (old) => {
        if (!old) return old
        return { ...old, data: old.data.map((d) => (d.id === id ? { ...d, stage } : d)) }
      })
      const detailSnap = queryClient.getQueryData<Deal>(dealKeys.detail(id))
      if (detailSnap) queryClient.setQueryData(dealKeys.detail(id), { ...detailSnap, stage })
      return { snapshots, detailSnap }
    },
    onError: (_err, { id }, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
      if (ctx?.detailSnap) queryClient.setQueryData(dealKeys.detail(id), ctx.detailSnap)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: dealKeys.all }),
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
