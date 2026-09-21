import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Tag } from '@/types/tag'

async function fetchTags(): Promise<Tag[]> {
  const res = await api.get<{ data: Tag[] }>('/tags')
  return res.data
}

export function useTags(): Tag[] {
  const { data } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 5 * 60 * 1000,
  })
  return data ?? []
}
