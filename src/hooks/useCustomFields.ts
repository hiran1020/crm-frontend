import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customFieldService } from '@/services/customFieldService'
import type { CustomField } from '@/types/customField'

export const customFieldKeys = {
  all: ['customFields'] as const,
  lists: () => [...customFieldKeys.all, 'list'] as const,
  list: (entityType?: CustomField['entityType']) =>
    [...customFieldKeys.lists(), entityType ?? 'all'] as const,
  detail: (id: string) => [...customFieldKeys.all, 'detail', id] as const,
}

export function useCustomFields(entityType?: CustomField['entityType']) {
  return useQuery({
    queryKey: customFieldKeys.list(entityType),
    queryFn: () => customFieldService.getCustomFields(entityType),
  })
}

export function useCreateCustomField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Omit<CustomField, 'id' | 'createdAt'>) =>
      customFieldService.createCustomField(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customFieldKeys.all })
    },
  })
}

export function useUpdateCustomField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<Omit<CustomField, 'id' | 'createdAt'>>
    }) => customFieldService.updateCustomField(id, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: customFieldKeys.all })
      await queryClient.invalidateQueries({
        queryKey: customFieldKeys.detail(variables.id),
      })
    },
  })
}

export function useDeleteCustomField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => customFieldService.deleteCustomField(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customFieldKeys.all })
    },
  })
}
