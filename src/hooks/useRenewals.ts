import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { renewalService } from '@/services/renewalService'
import type { Renewal } from '@/types/renewal'

export const renewalKeys = {
  all: ['renewals'] as const,
  lists: () => [...renewalKeys.all, 'list'] as const,
  byCustomer: (customerId: string) =>
    [...renewalKeys.all, 'byCustomer', customerId] as const,
}

export function useRenewals() {
  return useQuery({
    queryKey: renewalKeys.lists(),
    queryFn: renewalService.getAll,
  })
}

export function useRenewalsByCustomer(customerId: string) {
  return useQuery({
    queryKey: renewalKeys.byCustomer(customerId),
    queryFn: () => renewalService.getByCustomer(customerId),
    enabled: Boolean(customerId),
  })
}

export function useCreateRenewal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<Renewal, 'id' | 'createdAt'>) =>
      renewalService.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: renewalKeys.all })
    },
  })
}

export function useUpdateRenewal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<Omit<Renewal, 'id' | 'createdAt'>>
    }) => renewalService.update(id, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: renewalKeys.all })
    },
  })
}

export function useDeleteRenewal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => renewalService.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: renewalKeys.all })
    },
  })
}
