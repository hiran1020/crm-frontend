import { File, FileText, Image, Sheet } from 'lucide-react'

interface FileIconProps {
  mimeType: string
  dataUrl?: string
  className?: string
}

export function FileIcon({ mimeType, dataUrl, className = 'h-8 w-8' }: FileIconProps) {
  if (mimeType.startsWith('image/') && dataUrl) {
    return (
      <img
        src={dataUrl}
        alt=""
        className={`object-cover rounded ${className}`}
        aria-hidden
      />
    )
  }

  if (mimeType.startsWith('image/')) {
    return <Image className={`text-blue-500 ${className}`} aria-hidden />
  }

  if (mimeType === 'application/pdf') {
    return <FileText className={`text-red-500 ${className}`} aria-hidden />
  }

  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return <FileText className={`text-blue-600 ${className}`} aria-hidden />
  }

  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return <Sheet className={`text-green-600 ${className}`} aria-hidden />
  }

  if (mimeType.startsWith('text/')) {
    return <FileText className={`text-slate-500 ${className}`} aria-hidden />
  }

  return <File className={`text-slate-400 ${className}`} aria-hidden />
}
