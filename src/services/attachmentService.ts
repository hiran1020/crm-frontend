import { delay } from '@/lib/delay'
import { attachmentStore } from '@/mock/attachmentStore'
import type { Attachment, AttachmentInput } from '@/types/attachment'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export const attachmentService = {
  async getAttachments(
    relatedTo: string,
    relatedType: 'customer' | 'lead' | 'deal',
  ): Promise<Attachment[]> {
    await delay(350)
    return attachmentStore.getByRelated(relatedTo, relatedType)
  },

  async uploadAttachment(
    file: File,
    relatedTo: string,
    relatedType: 'customer' | 'lead' | 'deal',
    uploadedBy: string,
    description?: string,
  ): Promise<Attachment> {
    await delay(500)
    const MAX_DATA_URL_MB = 5
    let dataUrl: string | undefined
    if (file.size <= MAX_DATA_URL_MB * 1024 * 1024) {
      dataUrl = await readFileAsDataUrl(file)
    }

    const input: AttachmentInput = {
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      dataUrl,
      relatedTo,
      relatedType,
      uploadedBy,
      description,
    }
    return attachmentStore.create(input)
  },

  async deleteAttachment(id: string): Promise<void> {
    await delay(350)
    attachmentStore.remove(id)
  },
}
