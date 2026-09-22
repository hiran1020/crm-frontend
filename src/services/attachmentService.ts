import { api, uploadFile } from '@/lib/api'
import type { Attachment } from '@/types/attachment'

interface ApiAttachment {
  id: string
  filename?: string
  mimetype?: string
  size?: number
  url?: string
  entityType?: string
  entityId?: string
  uploadedBy?: string
  createdAt?: string
  description?: string
}

function fromApi(d: ApiAttachment): Attachment {
  return {
    id: d.id,
    name: d.filename ?? '',
    size: d.size ?? 0,
    mimeType: d.mimetype ?? 'application/octet-stream',
    dataUrl: d.url,
    relatedTo: d.entityId ?? '',
    relatedType: (d.entityType as Attachment['relatedType']) ?? 'customer',
    uploadedBy: d.uploadedBy ?? '',
    uploadedAt: d.createdAt ?? new Date().toISOString(),
    description: d.description,
  }
}

export const attachmentService = {
  async getAttachments(
    relatedTo: string,
    relatedType: 'customer' | 'lead' | 'deal',
  ): Promise<Attachment[]> {
    const res = await api.get<{ data: ApiAttachment[] }>(
      `/attachments?entityId=${relatedTo}&entityType=${relatedType}&pageSize=100`,
    )
    return res.data.map(fromApi)
  },

  async uploadAttachment(
    file: File,
    relatedTo: string,
    relatedType: 'customer' | 'lead' | 'deal',
    _uploadedBy: string,
    description?: string,
  ): Promise<Attachment> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('entityId', relatedTo)
    formData.append('entityType', relatedType)
    if (description) formData.append('description', description)
    const d = (await uploadFile('/attachments', formData)) as ApiAttachment
    return fromApi(d)
  },

  async deleteAttachment(id: string): Promise<void> {
    await api.delete(`/attachments/${id}`)
  },
}
