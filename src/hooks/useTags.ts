import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Tag } from '@/types/tag'

const TAGS_KEY = ['tags'] as const

async function fetchTags(): Promise<Tag[]> {
  const res = await api.get<{ data: Tag[] }>('/tags')
  return res.data
}

export function useTags(): Tag[] {
  const { data } = useQuery({
    queryKey: TAGS_KEY,
    queryFn: fetchTags,
    staleTime: 5 * 60 * 1000,
  })
  return data ?? []
}

export function useTagsQuery() {
  return useQuery({ queryKey: TAGS_KEY, queryFn: fetchTags, staleTime: 5 * 60 * 1000 })
}

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; color?: string }) =>
      api.post<Tag>('/tags', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TAGS_KEY }),
  })
}

export function useUpdateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; color?: string }) =>
      api.patch<Tag>(`/tags/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: TAGS_KEY }),
  })
}

export function useDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: TAGS_KEY }),
  })
}
