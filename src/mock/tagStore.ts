import { tagsSeed } from '@/mock/tags'
import type { Tag } from '@/types/tag'

const STORAGE_KEY = 'crm_tags_v1'

function loadDb(): Tag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Tag[]) : structuredClone(tagsSeed)
  } catch {
    return structuredClone(tagsSeed)
  }
}

function saveDb(data: Tag[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

function parseId(id: string): number {
  return parseInt(id.replace('TAG-', ''), 10) || 0
}

let tagsDb: Tag[] = loadDb()
let nextId = Math.max(0, ...tagsDb.map((t) => parseId(t.id))) + 1

export const tagStore = {
  getAll(): Tag[] {
    return [...tagsDb]
  },

  create(input: Omit<Tag, 'id'>): Tag {
    const id = `TAG-${String(nextId).padStart(3, '0')}`
    nextId += 1
    const tag: Tag = { ...input, id }
    tagsDb = [...tagsDb, tag]
    saveDb(tagsDb)
    return tag
  },

  remove(id: string): void {
    tagsDb = tagsDb.filter((t) => t.id !== id)
    saveDb(tagsDb)
  },
}
