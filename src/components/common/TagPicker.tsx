import { ChevronDown, Tag as TagIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { TagBadge } from '@/components/common/TagBadge'
import type { Tag } from '@/types/tag'

interface TagPickerProps {
  selectedTagIds: string[]
  allTags: Tag[]
  onChange: (tagIds: string[]) => void
}

export function TagPicker({ selectedTagIds, allTags, onChange }: TagPickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id))
  const availableTags = allTags.filter((t) => !selectedTagIds.includes(t.id))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleAdd(tagId: string) {
    onChange([...selectedTagIds, tagId])
  }

  function handleRemove(tagId: string) {
    onChange(selectedTagIds.filter((id) => id !== tagId))
  }

  return (
    <div ref={containerRef} className="relative flex flex-wrap items-center gap-1.5">
      {selectedTags.map((tag) => (
        <TagBadge key={tag.id} tag={tag} onRemove={() => handleRemove(tag.id)} />
      ))}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          <TagIcon className="h-3 w-3" aria-hidden />
          Add tag
          <ChevronDown className="h-3 w-3" aria-hidden />
        </button>
        {open && availableTags.length > 0 ? (
          <div className="absolute left-0 top-full z-30 mt-1 min-w-36 rounded-lg border border-border bg-white shadow-lg">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  handleAdd(tag.id)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50"
              >
                <TagBadge tag={tag} />
              </button>
            ))}
          </div>
        ) : open && availableTags.length === 0 ? (
          <div className="absolute left-0 top-full z-30 mt-1 rounded-lg border border-border bg-white p-3 text-xs text-slate-400 shadow-lg">
            All tags added
          </div>
        ) : null}
      </div>
    </div>
  )
}
