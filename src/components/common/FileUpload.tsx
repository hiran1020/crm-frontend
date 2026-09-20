import { UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>
  busy: boolean
  accept?: string
  maxMB?: number
}

export function FileUpload({ onUpload, busy, accept, maxMB = 5 }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleFile(file: File) {
    setErrorMsg(null)
    if (file.size > maxMB * 1024 * 1024) {
      setErrorMsg(`File must be under ${maxMB}MB`)
      return
    }
    try {
      await onUpload(file)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch {
      setErrorMsg('Upload failed. Please try again.')
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!busy) inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors cursor-pointer',
          dragOver
            ? 'border-brand-400 bg-brand-50'
            : 'border-border hover:border-brand-300 hover:bg-slate-50',
          busy ? 'opacity-60 cursor-not-allowed' : '',
          success ? 'border-emerald-400 bg-emerald-50' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <UploadCloud
          className={[
            'h-8 w-8',
            success ? 'text-emerald-500' : 'text-slate-400',
          ].join(' ')}
          aria-hidden
        />
        {busy ? (
          <p className="text-sm text-slate-500">Uploading…</p>
        ) : success ? (
          <p className="text-sm font-medium text-emerald-700">File uploaded!</p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700">
              Drag files here or click to browse
            </p>
            <p className="text-xs text-slate-400">Maximum file size: {maxMB}MB</p>
          </>
        )}
      </div>
      {errorMsg ? (
        <p className="mt-1.5 text-xs text-red-600">{errorMsg}</p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleChange}
        aria-hidden
      />
    </div>
  )
}
