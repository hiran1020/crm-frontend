import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customerService } from '@/services/customerService'
import { userService } from '@/services/userService'
import type {
  CustomerInput,
  CustomerListParams,
  CustomerListResult,
} from '@/types/customer'

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: CustomerListParams) =>
    [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  owners: () => [...customerKeys.all, 'owners'] as const,
}

export function useCustomers(params: CustomerListParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customerService.getCustomers(params),
    placeholderData: (previous) => previous,
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerService.getCustomer(id),
    enabled: Boolean(id),
  })
}

export function useCustomerOwners() {
  return useQuery({
    queryKey: ['crmUsers', 'list'] as const,
    queryFn: () => userService.getUsers(),
    select: (users) => users.map((u) => u.name),
    staleTime: 10 * 60_000,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CustomerInput) => customerService.createCustomer(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerInput }) =>
      customerService.updateCustomer(id, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all })
      await queryClient.invalidateQueries({
        queryKey: customerKeys.detail(variables.id),
      })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: customerKeys.all })
      const snapshots = queryClient.getQueriesData<CustomerListResult>({ queryKey: customerKeys.lists() })
      queryClient.setQueriesData<CustomerListResult>({ queryKey: customerKeys.lists() }, (old) => {
        if (!old) return old
        return { ...old, data: old.data.filter((c) => c.id !== id), total: old.total - 1 }
      })
      return { snapshots }
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  })
}

export function useBulkDeleteCustomers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => customerService.bulkDeleteCustomers(ids),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}
