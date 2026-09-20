import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { auditService, type AuditLogParams } from '@/services/auditService'
import type { AuditEntity, AuditLogEntry } from '@/types/auditLog'

export const auditKeys = {
  all: ['auditLog'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (params: AuditLogParams) => [...auditKeys.lists(), params] as const,
  entity: (entity: AuditEntity, entityId: string) =>
    [...auditKeys.all, 'entity', entity, entityId] as const,
}

export function useAuditLog(params: AuditLogParams = {}) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => auditService.getAuditLog(params),
    placeholderData: (previous) => previous,
  })
}

export function useEntityAuditLog(entity: AuditEntity, entityId: string) {
  return useQuery({
    queryKey: auditKeys.entity(entity, entityId),
    queryFn: () => auditService.getEntityAuditLog(entity, entityId),
    enabled: Boolean(entityId),
  })
}

export function useLogAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) =>
      auditService.logAction(entry),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: auditKeys.all })
    },
  })
}
