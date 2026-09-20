import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { quoteService } from '@/services/quoteService'
import type { QuoteInput } from '@/types/quote'

export const quoteKeys = {
  all: ['quotes'] as const,
  lists: () => [...quoteKeys.all, 'list'] as const,
  details: () => [...quoteKeys.all, 'detail'] as const,
  detail: (id: string) => [...quoteKeys.details(), id] as const,
  byDeal: (dealId: string) => [...quoteKeys.all, 'byDeal', dealId] as const,
  byCustomer: (customerId: string) => [...quoteKeys.all, 'byCustomer', customerId] as const,
}

export function useQuotes() {
  return useQuery({
    queryKey: quoteKeys.lists(),
    queryFn: quoteService.getAll,
  })
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: quoteKeys.detail(id),
    queryFn: () => quoteService.getById(id),
    enabled: Boolean(id),
  })
}

export function useQuotesByDeal(dealId: string) {
  return useQuery({
    queryKey: quoteKeys.byDeal(dealId),
    queryFn: () => quoteService.getByDeal(dealId),
    enabled: Boolean(dealId),
  })
}

export function useQuotesByCustomer(customerId: string) {
  return useQuery({
    queryKey: quoteKeys.byCustomer(customerId),
    queryFn: () => quoteService.getByCustomer(customerId),
    enabled: Boolean(customerId),
  })
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: QuoteInput) => quoteService.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: quoteKeys.all })
    },
  })
}

export function useUpdateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<QuoteInput> }) =>
      quoteService.update(id, input),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: quoteKeys.all })
      await qc.invalidateQueries({ queryKey: quoteKeys.detail(vars.id) })
    },
  })
}

export function useDeleteQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => quoteService.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: quoteKeys.all })
    },
  })
}
