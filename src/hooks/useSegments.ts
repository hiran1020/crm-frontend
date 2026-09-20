import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { segmentService } from '@/services/segmentService'
import type { Segment } from '@/types/segment'

export const segmentKeys = {
  all: ['segments'] as const,
  lists: () => [...segmentKeys.all, 'list'] as const,
  detail: (id: string) => [...segmentKeys.all, 'detail', id] as const,
}

export function useSegments() {
  return useQuery({
    queryKey: segmentKeys.lists(),
    queryFn: () => segmentService.getSegments(),
  })
}

export function useSegment(id: string) {
  return useQuery({
    queryKey: segmentKeys.detail(id),
    queryFn: () => segmentService.getSegment(id),
    enabled: Boolean(id),
  })
}

export function useCreateSegment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Omit<Segment, 'id' | 'createdAt'>) =>
      segmentService.createSegment(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: segmentKeys.all })
    },
  })
}

export function useUpdateSegment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<Omit<Segment, 'id' | 'createdAt'>>
    }) => segmentService.updateSegment(id, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: segmentKeys.all })
      await queryClient.invalidateQueries({
        queryKey: segmentKeys.detail(variables.id),
      })
    },
  })
}

export function useDeleteSegment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => segmentService.deleteSegment(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: segmentKeys.all })
    },
  })
}
