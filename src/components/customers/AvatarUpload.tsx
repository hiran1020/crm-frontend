import { Camera } from 'lucide-react'
import { useRef } from 'react'

interface AvatarUploadProps {
  avatar?: string
  name: string
  onUpload: (dataUrl: string) => void
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-16 w-16 text-lg',
  lg: 'h-24 w-24 text-2xl',
}

const ICON_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

export function AvatarUpload({ avatar, name, onUpload, size = 'md' }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_MB = 2
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`Image must be under ${MAX_MB}MB`)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpload(reader.result)
      }
    }
    reader.readAsDataURL(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="relative inline-block group">
      <div
        className={[
          'relative flex shrink-0 items-center justify-center rounded-full overflow-hidden',
          SIZE_CLASSES[size],
          avatar ? '' : 'bg-brand-100 text-brand-700 font-semibold',
        ].join(' ')}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}

        {/* Hover overlay */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Change photo"
        >
          <Camera className={`text-white ${ICON_CLASSES[size]}`} aria-hidden />
          {size === 'lg' ? (
            <span className="mt-0.5 text-[10px] font-medium text-white leading-tight">
              Change
            </span>
          ) : null}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden
      />
    </div>
  )
}
