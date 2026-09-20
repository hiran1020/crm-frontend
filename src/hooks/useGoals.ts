import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goalService } from '@/services/goalService'
import type { SalesGoal } from '@/types/salesGoal'

export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
}

export function useGoals() {
  return useQuery({
    queryKey: goalKeys.lists(),
    queryFn: goalService.getAll,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<SalesGoal, 'id' | 'createdAt' | 'current'>) =>
      goalService.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<Omit<SalesGoal, 'id' | 'createdAt'>>
    }) => goalService.update(id, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalService.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: goalKeys.all })
    },
  })
}
