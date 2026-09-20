/**
 * Tracks recently-viewed records in localStorage.
 * Max 8 entries; newest first; deduplicates by id.
 */

export type EntityType = 'customer' | 'lead' | 'deal'

export interface RecentItem {
  id: string
  type: EntityType
  label: string      // primary text: full name / deal title
  sub: string        // secondary text: company / stage
  href: string
  viewedAt: string   // ISO timestamp
}

const KEY = 'crm_recently_viewed'
const MAX = 8

function load(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as RecentItem[]) : []
  } catch {
    return []
  }
}

function save(items: RecentItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /* quota */
  }
}

export function trackView(item: Omit<RecentItem, 'viewedAt'>) {
  const items = load().filter((r) => r.id !== item.id)
  const next: RecentItem[] = [
    { ...item, viewedAt: new Date().toISOString() },
    ...items,
  ].slice(0, MAX)
  save(next)
}

export function getRecentlyViewed(): RecentItem[] {
  return load()
}

export function clearRecentlyViewed() {
  localStorage.removeItem(KEY)
}
