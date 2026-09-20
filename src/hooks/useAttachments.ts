import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attachmentService } from '@/services/attachmentService'

export const attachmentKeys = {
  all: ['attachments'] as const,
  byRelated: (relatedTo: string, relatedType: string) =>
    [...attachmentKeys.all, relatedTo, relatedType] as const,
}

export function useAttachments(
  relatedTo: string,
  relatedType: 'customer' | 'lead' | 'deal',
) {
  return useQuery({
    queryKey: attachmentKeys.byRelated(relatedTo, relatedType),
    queryFn: () => attachmentService.getAttachments(relatedTo, relatedType),
    enabled: Boolean(relatedTo),
  })
}

interface UploadAttachmentArgs {
  file: File
  relatedTo: string
  relatedType: 'customer' | 'lead' | 'deal'
  uploadedBy: string
  description?: string
}

export function useUploadAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, relatedTo, relatedType, uploadedBy, description }: UploadAttachmentArgs) =>
      attachmentService.uploadAttachment(file, relatedTo, relatedType, uploadedBy, description),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: attachmentKeys.byRelated(variables.relatedTo, variables.relatedType),
      })
    },
  })
}

export function useDeleteAttachment(relatedTo?: string, relatedType?: 'customer' | 'lead' | 'deal') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => attachmentService.deleteAttachment(id),
    onSuccess: async () => {
      if (relatedTo && relatedType) {
        await queryClient.invalidateQueries({
          queryKey: attachmentKeys.byRelated(relatedTo, relatedType),
        })
      } else {
        await queryClient.invalidateQueries({ queryKey: attachmentKeys.all })
      }
    },
  })
}
