import { api } from '@/lib/api'
import type { CrmUser, CrmUserInput } from '@/types/crmUser'

interface ApiUser {
  id: string
  name?: string
  email?: string
  role?: string
  status?: string
  phone?: string
  jobTitle?: string
  department?: string
  avatarInitials?: string
  createdAt?: string
  lastLoginAt?: string
}

function toInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function fromApi(d: ApiUser): CrmUser {
  const name = d.name ?? ''
  return {
    id: d.id,
    name,
    email: d.email ?? '',
    role: (d.role as CrmUser['role']) ?? 'sales_agent',
    avatarInitials: d.avatarInitials ?? toInitials(name),
    status: (d.status as CrmUser['status']) ?? 'active',
    phone: d.phone,
    jobTitle: d.jobTitle,
    department: d.department,
    createdAt: d.createdAt ?? new Date().toISOString(),
    lastLoginAt: d.lastLoginAt,
  }
}

interface ApiListResult {
  data: ApiUser[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const userService = {
  async getUsers(params: { role?: string; status?: string; page?: number; pageSize?: number } = {}): Promise<CrmUser[]> {
    const qs = new URLSearchParams()
    if (params.role)     qs.set('role', params.role)
    if (params.status)   qs.set('status', params.status)
    if (params.page)     qs.set('page', String(params.page))
    qs.set('pageSize', String(params.pageSize ?? 100))

    const res = await api.get<ApiListResult>(`/users?${qs}`)
    return res.data.map(fromApi)
  },

  async getUser(id: string): Promise<CrmUser> {
    const d = await api.get<ApiUser>(`/users/${id}`)
    return fromApi(d)
  },

  async createUser(input: CrmUserInput): Promise<CrmUser> {
    const d = await api.post<ApiUser>('/users', input)
    return fromApi(d)
  },

  async updateUser(id: string, input: Partial<CrmUserInput>): Promise<CrmUser> {
    const d = await api.patch<ApiUser>(`/users/${id}`, input)
    return fromApi(d)
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  async toggleUserStatus(id: string): Promise<CrmUser> {
    const current = await userService.getUser(id)
    const newStatus = current.status === 'active' ? 'inactive' : 'active'
    const d = await api.patch<ApiUser>(`/users/${id}`, { status: newStatus })
    return fromApi(d)
  },
}
