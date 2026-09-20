export interface Attachment {
  id: string
  name: string
  size: number // bytes
  mimeType: string
  dataUrl?: string // base64 for images/PDF; undefined if too large
  relatedTo: string
  relatedType: 'customer' | 'lead' | 'deal'
  uploadedBy: string
  uploadedAt: string
  description?: string
}

export type AttachmentInput = Omit<Attachment, 'id' | 'uploadedAt'>
