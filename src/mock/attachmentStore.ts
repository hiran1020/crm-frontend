import type { Attachment, AttachmentInput } from '@/types/attachment'

const STORAGE_KEY = 'crm_attachments_v1'
const MAX_STORAGE_MB = 10

const attachmentsSeed: Attachment[] = [
  {
    id: 'ATT-001',
    name: 'Contract_NovaGames_2026.pdf',
    size: 245760,
    mimeType: 'application/pdf',
    relatedTo: 'CUS-001',
    relatedType: 'customer',
    uploadedBy: 'Sarah Wilson',
    uploadedAt: '2026-03-10T14:00:00Z',
    description: 'Signed enterprise contract',
  },
  {
    id: 'ATT-002',
    name: 'NovaGames_Logo.png',
    size: 52000,
    mimeType: 'image/png',
    dataUrl:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzJiN2ZlNCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjM2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tkc8L3RleHQ+PC9zdmc+',
    relatedTo: 'CUS-001',
    relatedType: 'customer',
    uploadedBy: 'Sarah Wilson',
    uploadedAt: '2026-03-11T09:00:00Z',
  },
  {
    id: 'ATT-003',
    name: 'Proposal_Apex.docx',
    size: 128000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    relatedTo: 'DEAL-003',
    relatedType: 'deal',
    uploadedBy: 'Sarah Wilson',
    uploadedAt: '2026-03-15T11:00:00Z',
    description: 'Enterprise analytics proposal v2',
  },
  {
    id: 'ATT-004',
    name: 'Q1_Pipeline_Report.pdf',
    size: 310000,
    mimeType: 'application/pdf',
    relatedTo: 'DEAL-001',
    relatedType: 'deal',
    uploadedBy: 'David Chen',
    uploadedAt: '2026-04-01T10:00:00Z',
    description: 'Q1 pipeline summary for review',
  },
]

function loadDb(): Attachment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Attachment[]) : structuredClone(attachmentsSeed)
  } catch {
    return structuredClone(attachmentsSeed)
  }
}

function saveDb(data: Attachment[]): void {
  try {
    const serialized = JSON.stringify(data)
    const sizeMB = serialized.length / (1024 * 1024)
    if (sizeMB > MAX_STORAGE_MB) {
      console.warn(`Attachment storage is ${sizeMB.toFixed(1)}MB — approaching limit of ${MAX_STORAGE_MB}MB`)
    }
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch {
    /* quota */
  }
}

function parseId(id: string): number {
  return parseInt(id.replace('ATT-', ''), 10) || 0
}

let attachmentsDb: Attachment[] = loadDb()
let nextId = Math.max(0, ...attachmentsDb.map((a) => parseId(a.id))) + 1

export const attachmentStore = {
  getAll(): Attachment[] {
    return [...attachmentsDb]
  },

  getByRelated(relatedTo: string, relatedType: 'customer' | 'lead' | 'deal'): Attachment[] {
    return attachmentsDb
      .filter((a) => a.relatedTo === relatedTo && a.relatedType === relatedType)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
  },

  create(input: AttachmentInput): Attachment {
    const id = `ATT-${String(nextId).padStart(3, '0')}`
    nextId += 1
    const attachment: Attachment = {
      ...input,
      id,
      uploadedAt: new Date().toISOString(),
    }
    attachmentsDb = [...attachmentsDb, attachment]
    saveDb(attachmentsDb)
    return attachment
  },

  remove(id: string): void {
    attachmentsDb = attachmentsDb.filter((a) => a.id !== id)
    saveDb(attachmentsDb)
  },
}
