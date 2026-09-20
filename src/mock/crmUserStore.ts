import { crmUsersSeed } from '@/mock/crmUsers'
import type { CrmUser, CrmUserInput } from '@/types/crmUser'

const STORAGE_KEY = 'crm_users_v1'

function loadDb(): CrmUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CrmUser[]) : structuredClone(crmUsersSeed)
  } catch {
    return structuredClone(crmUsersSeed)
  }
}

function saveDb(data: CrmUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

function parseId(id: string): number {
  return parseInt(id.replace('USR-', ''), 10) || 0
}

function generateInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

let usersDb: CrmUser[] = loadDb()
let nextId = Math.max(0, ...usersDb.map((u) => parseId(u.id))) + 1

export const crmUserStore = {
  getAll(): CrmUser[] {
    return [...usersDb].sort((a, b) => a.name.localeCompare(b.name))
  },

  getById(id: string): CrmUser | undefined {
    return usersDb.find((u) => u.id === id)
  },

  getActive(): CrmUser[] {
    return usersDb.filter((u) => u.status === 'active').sort((a, b) => a.name.localeCompare(b.name))
  },

  create(input: CrmUserInput): CrmUser {
    const id = `USR-${String(nextId).padStart(3, '0')}`
    nextId += 1
    const user: CrmUser = {
      ...input,
      id,
      avatarInitials: generateInitials(input.name),
      createdAt: new Date().toISOString().slice(0, 10),
    }
    usersDb = [...usersDb, user]
    saveDb(usersDb)
    return user
  },

  update(id: string, input: CrmUserInput): CrmUser {
    const index = usersDb.findIndex((u) => u.id === id)
    if (index === -1) throw new Error(`User ${id} not found`)
    const updated: CrmUser = {
      ...usersDb[index],
      ...input,
      id,
      avatarInitials: generateInitials(input.name),
    }
    usersDb = usersDb.map((u) => (u.id === id ? updated : u))
    saveDb(usersDb)
    return updated
  },

  toggleStatus(id: string): CrmUser {
    const index = usersDb.findIndex((u) => u.id === id)
    if (index === -1) throw new Error(`User ${id} not found`)
    const updated: CrmUser = {
      ...usersDb[index],
      status: usersDb[index].status === 'active' ? 'inactive' : 'active',
    }
    usersDb = usersDb.map((u) => (u.id === id ? updated : u))
    saveDb(usersDb)
    return updated
  },

  remove(id: string): void {
    usersDb = usersDb.filter((u) => u.id !== id)
    saveDb(usersDb)
  },
}
