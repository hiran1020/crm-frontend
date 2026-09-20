import { UploadCloud, X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { parseCSV } from '@/lib/csv'

export interface CSVImportModalProps {
  open: boolean
  entityType: 'customer' | 'lead'
  onClose: () => void
  onImport: (
    rows: Record<string, string>[],
    mapping: Record<string, string>,
  ) => Promise<{ imported: number; skipped: number; errors: string[] }>
}

const CUSTOMER_FIELDS = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'status', label: 'Status' },
  { value: 'owner', label: 'Owner' },
]

const LEAD_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'company', label: 'Company' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'source', label: 'Source' },
  { value: 'value', label: 'Value' },
  { value: 'owner', label: 'Owner' },
  { value: 'status', label: 'Status' },
  { value: 'notes', label: 'Notes' },
]

type Step = 1 | 2 | 3

export function CSVImportModal({ open, entityType, onClose, onImport }: CSVImportModalProps) {
  const [step, setStep] = useState<Step>(1)
  const [headers, setHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([])
  const [allRows, setAllRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const crmFields = entityType === 'customer' ? CUSTOMER_FIELDS : LEAD_FIELDS

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', handler)
    }
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setStep(1)
      setHeaders([])
      setPreviewRows([])
      setAllRows([])
      setMapping({})
      setResult(null)
    }
  }, [open])

  if (!open) return null

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers: h, rows } = parseCSV(text)
      setHeaders(h)
      setPreviewRows(rows.slice(0, 5))
      setAllRows(rows)
      // Auto-map columns by name similarity
      const autoMap: Record<string, string> = {}
      h.forEach((header) => {
        const normalized = header.toLowerCase().replace(/\s+/g, '')
        const match = crmFields.find(
          (f) =>
            f.value.toLowerCase() === normalized ||
            f.label.toLowerCase().replace(/\s+/g, '') === normalized,
        )
        autoMap[header] = match?.value ?? '__skip__'
      })
      setMapping(autoMap)
      setStep(2)
    }
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      handleFile(file)
    }
  }

  async function handleImport() {
    setBusy(true)
    try {
      const res = await onImport(allRows, mapping)
      setResult(res)
      setStep(3)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="csv-import-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 id="csv-import-title" className="text-lg font-semibold text-slate-900">
              Import {entityType === 'customer' ? 'Customers' : 'Leads'} from CSV
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Step {step} of 3 —{' '}
              {step === 1 ? 'Upload file' : step === 2 ? 'Map fields' : 'Import results'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Step indicator */}
        <div className="mt-4 flex items-center gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                  step >= s
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-400',
                ].join(' ')}
              >
                {s}
              </div>
              {s < 3 && <div className={['h-px w-8', step > s ? 'bg-brand-600' : 'bg-slate-200'].join(' ')} />}
            </div>
          ))}
        </div>

        <div className="mt-6">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div
              className={[
                'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors',
                dragging ? 'border-brand-500 bg-brand-50' : 'border-border hover:border-brand-400',
              ].join(' ')}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <UploadCloud className="h-10 w-10 text-slate-400" aria-hidden />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Drop your CSV file here
              </p>
              <p className="mt-1 text-xs text-slate-500">or click to select a file</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Select File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
            </div>
          )}

          {/* Step 2: Map Fields */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Map CSV columns to CRM fields</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {allRows.length} rows detected. Select "Skip" to ignore a column.
                </p>
              </div>

              <div className="space-y-3">
                {headers.map((header) => (
                  <div key={header} className="flex items-center gap-3">
                    <div className="w-40 shrink-0 rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-slate-700 truncate">
                      {header}
                    </div>
                    <span className="text-slate-400">→</span>
                    <select
                      value={mapping[header] ?? '__skip__'}
                      onChange={(e) =>
                        setMapping((prev) => ({ ...prev, [header]: e.target.value }))
                      }
                      className="h-9 flex-1 rounded-md border border-border bg-white px-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    >
                      <option value="__skip__">Skip this column</option>
                      {crmFields.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview table */}
              {previewRows.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Preview (first {previewRows.length} rows)
                  </h3>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          {headers.map((h) => (
                            <th
                              key={h}
                              className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-600"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {previewRows.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            {headers.map((h) => (
                              <td key={h} className="whitespace-nowrap px-3 py-2 text-slate-700">
                                {row[h] ?? ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={busy}
                  className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {busy ? 'Importing…' : `Import ${allRows.length} rows`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && result && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      {result.imported} imported
                    </p>
                    <p className="text-xs text-emerald-700">Records created successfully</p>
                  </div>
                </div>
                {result.skipped > 0 && (
                  <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        {result.skipped} skipped
                      </p>
                      <p className="text-xs text-amber-700">Rows skipped (duplicates or missing required fields)</p>
                    </div>
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
                      <p className="text-sm font-semibold text-red-900">
                        {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ul className="space-y-1">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i} className="text-xs text-red-700">• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
