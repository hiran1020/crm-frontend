import { firebaseAuth } from '@/lib/firebase'

const BASE = import.meta.env.VITE_API_URL as string

/** Convert Firestore Timestamp-like objects to ISO strings, recursively. */
function fixTimestamps<T>(val: T): T {
  if (val === null || val === undefined) return val
  if (Array.isArray(val)) return val.map(fixTimestamps) as unknown as T
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>
    // Firestore Timestamp: { seconds: N, nanoseconds: N } or { _seconds, _nanoseconds }
    const secs = (obj['seconds'] ?? obj['_seconds']) as number | undefined
    if (typeof secs === 'number' && ('nanoseconds' in obj || '_nanoseconds' in obj)) {
      return new Date(secs * 1000).toISOString() as unknown as T
    }
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = fixTimestamps(v)
    }
    return result as unknown as T
  }
  return val
}

async function getToken(): Promise<string> {
  const user = firebaseAuth.currentUser
  if (!user) throw new Error('Not authenticated')
  return user.getIdToken()
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as Record<string, string>).error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  const data = await res.json()
  return fixTimestamps(data)
}

export async function uploadFile(path: string, formData: FormData): Promise<unknown> {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as Record<string, string>).error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
}
