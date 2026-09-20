import { X } from 'lucide-react'
import type { Tag } from '@/types/tag'

const COLOR_CLASSES: Record<Tag['color'], string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  pink: 'bg-pink-100 text-pink-700',
  slate: 'bg-slate-100 text-slate-700',
}

interface TagBadgeProps {
  tag: Tag
  onRemove?: () => void
}

export function TagBadge({ tag, onRemove }: TagBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        COLOR_CLASSES[tag.color],
      ].join(' ')}
    >
      {tag.name}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove tag ${tag.name}`}
          className="ml-0.5 rounded-full p-0.5 hover:opacity-70"
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      ) : null}
    </span>
  )
}
