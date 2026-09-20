/** Quick-access pinned records stored in localStorage. Max 10 per entity type. */

export type PinnedEntityType = 'customer' | 'lead' | 'deal'

export interface PinnedRecord {
  id: string
  type: PinnedEntityType
  label: string
  sub: string
  href: string
  pinnedAt: string
}

const KEY = 'crm_pinned_v1'
const MAX = 10

function load(): PinnedRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PinnedRecord[]) : []
  } catch {
    return []
  }
}

function save(items: PinnedRecord[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* quota */ }
}

export function getPinned(): PinnedRecord[] {
  return load()
}

export function isPinned(id: string): boolean {
  return load().some(p => p.id === id)
}

export function pinRecord(record: Omit<PinnedRecord, 'pinnedAt'>) {
  const items = load().filter(p => p.id !== record.id)
  save([{ ...record, pinnedAt: new Date().toISOString() }, ...items].slice(0, MAX))
}

export function unpinRecord(id: string) {
  save(load().filter(p => p.id !== id))
}

export function togglePin(record: Omit<PinnedRecord, 'pinnedAt'>): boolean {
  if (isPinned(record.id)) {
    unpinRecord(record.id)
    return false
  }
  pinRecord(record)
  return true
}
