import { Download, Eye, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DocumentViewer } from '@/components/common/DocumentViewer'
import { FileIcon } from '@/components/common/FileIcon'
import { formatRelativeDate } from '@/lib/format'
import type { Attachment } from '@/types/attachment'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileRow({
  attachment,
  onDelete,
  deleteBusy,
}: {
  attachment: Attachment
  onDelete?: (id: string) => void
  deleteBusy?: boolean
}) {
  const [viewerOpen, setViewerOpen] = useState(false)

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    if (!attachment.dataUrl) return
    const a = Object.assign(document.createElement('a'), {
      href: attachment.dataUrl,
      download: attachment.name,
    })
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const canPreview =
    Boolean(attachment.dataUrl) &&
    (attachment.mimeType.startsWith('image/') || attachment.mimeType === 'application/pdf')

  return (
    <>
      {/* File card — click to open viewer */}
      <div
        className={[
          'flex items-start gap-3 rounded-lg border border-border bg-white p-3 transition-shadow',
          canPreview ? 'cursor-pointer hover:shadow-md hover:border-brand-200' : '',
        ].join(' ')}
        onClick={() => canPreview && setViewerOpen(true)}
        role={canPreview ? 'button' : undefined}
        tabIndex={canPreview ? 0 : undefined}
        aria-label={canPreview ? `Open ${attachment.name}` : undefined}
        onKeyDown={(e) => {
          if (canPreview && (e.key === 'Enter' || e.key === ' ')) setViewerOpen(true)
        }}
      >
        <div className="shrink-0">
          <FileIcon
            mimeType={attachment.mimeType}
            dataUrl={attachment.dataUrl}
            className="h-10 w-10 rounded"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900" title={attachment.name}>
            {attachment.name}
          </p>
          <p className="text-xs text-slate-500">
            {formatSize(attachment.size)}
            {attachment.description ? ` · ${attachment.description}` : ''}
          </p>
          <p className="text-xs text-slate-400">
            Uploaded {formatRelativeDate(attachment.uploadedAt)} by {attachment.uploadedBy}
          </p>
          {canPreview ? (
            <p className="mt-1 text-[11px] text-brand-500 font-medium">
              Click to preview
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1" onClick={e => e.stopPropagation()}>
          {canPreview ? (
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              title="Preview"
              className="rounded p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
            >
              <Eye className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!attachment.dataUrl}
            title={attachment.dataUrl ? 'Download' : 'No file data available'}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" aria-hidden />
          </button>
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(attachment.id)}
              disabled={deleteBusy}
              title="Delete file"
              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {/* Document viewer modal */}
      {viewerOpen ? (
        <DocumentViewer
          name={attachment.name}
          mimeType={attachment.mimeType}
          dataUrl={attachment.dataUrl}
          size={attachment.size}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </>
  )
}

export function FileListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-slate-100" />
      ))}
    </div>
  )
}

export function FileList({ attachments, onDelete, deleteBusy }: FileListProps) {
  if (attachments.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No files attached</p>
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <FileRow
          key={attachment.id}
          attachment={attachment}
          onDelete={onDelete}
          deleteBusy={deleteBusy}
        />
      ))}
    </div>
  )
}

interface FileListProps {
  attachments: Attachment[]
  onDelete?: (id: string) => void
  deleteBusy?: boolean
}
