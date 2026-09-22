import { UploadCloud, X, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { parseCSV } from '@/lib/csv'
import { downloadImportErrors } from '@/lib/api'

export interface CSVImportModalProps {
  open: boolean
  entityType: 'customer' | 'lead'
  onClose: () => void
  onImport: (
    rows: Record<string, string>[],
    mapping: Record<string, string>,
    onProgress: (done: number, total: number) => void,
  ) => Promise<{ imported: number; skipped: number; errors: string[]; jobId?: string }>
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
  { value: 'name', label: 'Full Name' },
  { value: 'company', label: 'Company' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'source', label: 'Source' },
  { value: 'value', label: 'Value' },
  { value: 'owner', label: 'Owner' },
  { value: 'status', label: 'Status' },
  { value: 'notes', label: 'Notes' },
]

// Comprehensive alias map — keys are CRM field values, values are normalized header synonyms
const FIELD_ALIASES: Record<string, string[]> = {
  firstName:  ['first', 'firstname', 'givenname', 'fname', 'forename'],
  lastName:   ['last', 'lastname', 'surname', 'familyname', 'lname'],
  name:       ['name', 'fullname', 'contactname', 'personname', 'leadname', 'customername'],
  email:      ['email', 'emailaddress', 'emailid', 'mail', 'e-mail', 'emai'],
  phone:      ['phone', 'phonenumber', 'telephone', 'tel', 'mobile', 'cell', 'cellphone', 'contactnumber', 'mobilenumber'],
  company:    ['company', 'companyname', 'organization', 'organisation', 'org', 'business', 'businessname', 'employer'],
  jobTitle:   ['jobtitle', 'title', 'position', 'role', 'jobrole', 'designation', 'profession'],
  status:     ['status', 'leadstatus', 'customerstatus', 'accountstatus'],
  source:     ['source', 'leadsource', 'channel', 'origin', 'referralsource', 'howdidyouhear'],
  value:      ['value', 'dealvalue', 'revenue', 'amount', 'budget', 'expectedvalue', 'estimatedvalue', 'worth'],
  owner:      ['owner', 'assignedto', 'salesrep', 'rep', 'accountmanager', 'am', 'assigned', 'salesperson', 'assignee'],
  notes:      ['notes', 'description', 'comments', 'note', 'comment', 'details', 'remarks', 'memo'],
}

function autoMap(header: string, fields: { value: string; label: string }[]): string {
  const norm = header.toLowerCase().replace(/[\s_\-().]+/g, '')
  for (const field of fields) {
    // exact value match
    if (field.value.toLowerCase() === norm) return field.value
    // exact label match (normalized)
    if (field.label.toLowerCase().replace(/\s+/g, '') === norm) return field.value
    // alias match
    const aliases = FIELD_ALIASES[field.value] ?? []
    if (aliases.some((a) => a.replace(/[-\s]/g, '') === norm)) return field.value
  }
  return '__skip__'
}

type Step = 1 | 2 | 3

export function CSVImportModal({ open, entityType, onClose, onImport }: CSVImportModalProps) {
  const [step, setStep] = useState<Step>(1)
  const [headers, setHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([])
  const [allRows, setAllRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressTotal, setProgressTotal] = useState(0)
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[]; jobId?: string } | null>(null)
  const [downloading, setDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const crmFields = entityType === 'customer' ? CUSTOMER_FIELDS : LEAD_FIELDS

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setStep(1); setHeaders([]); setPreviewRows([]); setAllRows([])
      setMapping({}); setResult(null); setProgress(0); setProgressTotal(0); setDownloading(false)
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
      const autoMapping: Record<string, string> = {}
      h.forEach((header) => { autoMapping[header] = autoMap(header, crmFields) })
      setMapping(autoMapping)
      setStep(2)
    }
    reader.readAsText(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) handleFile(file)
  }

  async function handleImport() {
    setBusy(true)
    setProgress(0)
    setProgressTotal(allRows.length)
    try {
      const res = await onImport(allRows, mapping, (done, total) => {
        setProgress(done)
        setProgressTotal(total)
      })
      setResult(res)
      setStep(3)
    } finally {
      setBusy(false)
    }
  }

  const mappedCount = Object.values(mapping).filter((v) => v !== '__skip__').length
  const progressPct = progressTotal > 0 ? Math.round((progress / progressTotal) * 100) : 0

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="csv-import-title" className="text-lg font-semibold text-slate-900">
              Import {entityType === 'customer' ? 'Customers' : 'Leads'} from CSV
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Step {step} of 3 —{' '}
              {step === 1 ? 'Upload file' : step === 2 ? 'Map columns to CRM fields' : 'Import complete'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Step indicator */}
        <div className="mt-4 flex items-center gap-2">
          {(['Upload', 'Map fields', 'Results'] as const).map((label, idx) => {
            const s = (idx + 1) as Step
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={[
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                  step >= s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400',
                ].join(' ')}>{s}</div>
                <span className={['hidden text-xs sm:inline', step >= s ? 'text-slate-700' : 'text-slate-400'].join(' ')}>
                  {label}
                </span>
                {s < 3 && <div className={['h-px w-6 sm:w-8', step > s ? 'bg-brand-600' : 'bg-slate-200'].join(' ')} />}
              </div>
            )
          })}
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
              <p className="mt-3 text-sm font-medium text-slate-700">Drop your CSV file here</p>
              <p className="mt-1 text-xs text-slate-500">or click to browse — UTF-8 CSV only</p>
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
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
              <p className="mt-4 text-xs text-slate-400">
                Required column: <strong>email</strong>. Duplicate emails are skipped.
              </p>
            </div>
          )}

          {/* Step 2: Map fields */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Map CSV columns → CRM fields</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {allRows.length} rows · {mappedCount} of {headers.length} columns mapped
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const reset: Record<string, string> = {}
                    headers.forEach((h) => { reset[h] = autoMap(h, crmFields) })
                    setMapping(reset)
                  }}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Reset auto-mapping
                </button>
              </div>

              {/* Mapping rows */}
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <span>CSV column</span>
                  <span />
                  <span>CRM field</span>
                </div>
                {headers.map((header) => {
                  const isMapped = mapping[header] && mapping[header] !== '__skip__'
                  return (
                    <div key={header} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <div className={[
                        'truncate rounded-md border px-3 py-2 text-sm',
                        isMapped ? 'border-emerald-200 bg-emerald-50 text-slate-800' : 'border-border bg-slate-50 text-slate-500',
                      ].join(' ')} title={header}>
                        {header}
                      </div>
                      <span className={isMapped ? 'text-emerald-500' : 'text-slate-300'}>→</span>
                      <select
                        value={mapping[header] ?? '__skip__'}
                        onChange={(e) => setMapping((prev) => ({ ...prev, [header]: e.target.value }))}
                        className={[
                          'h-9 w-full rounded-md border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100',
                          isMapped
                            ? 'border-emerald-300 bg-white text-slate-800 focus:border-brand-500'
                            : 'border-border bg-white text-slate-400 focus:border-brand-500',
                        ].join(' ')}
                      >
                        <option value="__skip__">— Skip this column —</option>
                        {crmFields.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>

              {/* Preview table */}
              {previewRows.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Preview (first {previewRows.length} rows)
                  </h4>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          {headers.map((h) => (
                            <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-600">
                              <div>{h}</div>
                              {mapping[h] && mapping[h] !== '__skip__' && (
                                <div className="font-normal text-brand-600">
                                  → {crmFields.find(f => f.value === mapping[h])?.label}
                                </div>
                              )}
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

              {/* Progress bar (shown while importing) */}
              {busy && (
                <div className="rounded-lg border border-border bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                    <span>Importing rows…</span>
                    <span className="font-medium">{progress} / {progressTotal}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-150"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-center text-xs text-slate-400">{progressPct}% complete</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={busy}
                  className="rounded-md border border-border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={busy || mappedCount === 0}
                  className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {busy ? `Importing… ${progress}/${progressTotal}` : `Import ${allRows.length} row${allRows.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && result && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">{result.imported} imported</p>
                    <p className="text-xs text-emerald-700">Records created successfully</p>
                  </div>
                </div>
                {result.skipped > 0 && (
                  <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">{result.skipped} skipped</p>
                      <p className="text-xs text-amber-700">Duplicates or rows missing required fields</p>
                    </div>
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
                        <p className="text-sm font-semibold text-red-900">
                          {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {result.jobId && (
                        <button
                          type="button"
                          disabled={downloading}
                          onClick={() => {
                            setDownloading(true)
                            downloadImportErrors(result.jobId!)
                              .finally(() => setDownloading(false))
                          }}
                          className="flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden />
                          {downloading ? 'Downloading…' : 'Download error log'}
                        </button>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i} className="text-xs text-red-700">• {err}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-xs text-red-500">…and {result.errors.length - 5} more</li>
                      )}
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
