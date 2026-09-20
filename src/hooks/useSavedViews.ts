import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { savedViewService } from '@/services/savedViewService'
import type { SavedView, SavedViewEntity } from '@/types/savedView'

export const savedViewKeys = {
  all: ['savedViews'] as const,
  byEntity: (entityType: SavedViewEntity) =>
    [...savedViewKeys.all, entityType] as const,
}

export function useSavedViews(entityType: SavedViewEntity) {
  return useQuery({
    queryKey: savedViewKeys.byEntity(entityType),
    queryFn: () => savedViewService.getByEntity(entityType),
  })
}

export function useCreateSavedView() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<SavedView, 'id' | 'createdAt'>) =>
      savedViewService.create(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: savedViewKeys.all })
    },
  })
}

export function useDeleteSavedView() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => savedViewService.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: savedViewKeys.all })
    },
  })
}
