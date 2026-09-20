import { tagStore } from '@/mock/tagStore'
import type { Tag } from '@/types/tag'

export function useTags(): Tag[] {
  return tagStore.getAll()
}
