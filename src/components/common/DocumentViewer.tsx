import {
  Download,
  FileText,
  Image,
  Maximize2,
  Minimize2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface DocumentViewerProps {
  /** File name shown in the header */
  name: string
  /** MIME type — drives how the file is rendered */
  mimeType: string
  /**
   * Base-64 data URL for images (data:image/png;base64,…) or PDFs
   * (data:application/pdf;base64,…). Pass undefined to show a
   * "Preview not available" placeholder.
   */
  dataUrl?: string
  /** Byte size (optional — shown in the header) */
  size?: number
  onClose: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIconLarge({ mimeType }: { mimeType: string }) {
  const isImage = mimeType.startsWith('image/')
  const Icon = isImage ? Image : FileText
  const color = isImage ? 'text-blue-400' : 'text-slate-400'
  return <Icon className={['h-20 w-20', color].join(' ')} aria-hidden />
}

export function DocumentViewer({
  name,
  mimeType,
  dataUrl,
  size,
  onClose,
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const isImage = mimeType.startsWith('image/')
  const isPdf   = mimeType === 'application/pdf'
  const canPreview = Boolean(dataUrl) && (isImage || isPdf)

  // Escape key closes
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Download helper
  function handleDownload() {
    if (!dataUrl) return
    const a = Object.assign(document.createElement('a'), {
      href: dataUrl,
      download: name,
    })
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const panelCls = fullscreen
    ? 'fixed inset-0 z-50 flex flex-col bg-white'
    : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4'

  const dialogCls = fullscreen
    ? 'flex flex-1 flex-col w-full h-full bg-white'
    : 'flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden'

  return (
    <div className={panelCls} onClick={fullscreen ? undefined : onClose}>
      <div
        ref={containerRef}
        className={dialogCls}
        role="dialog"
        aria-modal="true"
        aria-label={`Document viewer: ${name}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {isImage
              ? <Image className="h-5 w-5 shrink-0 text-blue-500" aria-hidden />
              : <FileText className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
              {size ? (
                <p className="text-xs text-slate-400">{formatBytes(size)} · {mimeType}</p>
              ) : (
                <p className="text-xs text-slate-400">{mimeType}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {/* Zoom — images only */}
            {isImage && canPreview ? (
              <>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                  disabled={zoom <= 0.25}
                  aria-label="Zoom out"
                  title="Zoom out"
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-xs text-slate-500">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(4, z + 0.25))}
                  disabled={zoom >= 4}
                  aria-label="Zoom in"
                  title="Zoom in"
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                >
                  Reset
                </button>
                <div className="mx-1 h-5 w-px bg-border" />
              </>
            ) : null}

            {/* Fullscreen */}
            <button
              type="button"
              onClick={() => setFullscreen(f => !f)}
              aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            >
              {fullscreen
                ? <Minimize2 className="h-4 w-4" />
                : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Download */}
            {dataUrl ? (
              <button
                type="button"
                onClick={handleDownload}
                aria-label="Download"
                title="Download file"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
              </button>
            ) : null}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close viewer"
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Preview area ─────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-100 p-4">
          {!canPreview ? (
            /* No preview available */
            <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-10 shadow-sm">
              <FileIconLarge mimeType={mimeType} />
              <div className="text-center">
                <p className="font-semibold text-slate-700">{name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  Preview not available for this file type.
                </p>
              </div>
              {dataUrl ? (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Download file
                </button>
              ) : (
                <p className="text-xs text-slate-400">File stored as metadata only (no binary data)</p>
              )}
            </div>
          ) : isImage ? (
            /* Image preview with zoom */
            <div className="flex items-center justify-center" style={{ minWidth: 0 }}>
              <img
                src={dataUrl}
                alt={name}
                draggable={false}
                className="max-w-full rounded shadow-md select-none"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease',
                }}
              />
            </div>
          ) : isPdf ? (
            /* PDF — rendered in an iframe */
            <iframe
              src={dataUrl}
              title={name}
              className="h-full w-full rounded shadow-md"
              style={{ minHeight: '60vh' }}
            />
          ) : null}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        {isImage && canPreview ? (
          <div className="flex shrink-0 items-center justify-center gap-3 border-t border-border bg-white py-2">
            <p className="text-xs text-slate-400">
              Scroll to zoom · Click and drag to pan
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
