import type { Renewal } from '@/types/renewal'

const STORAGE_KEY = 'crm_renewals_v1'

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const seed: Renewal[] = [
  {
    id: 'REN-001',
    customerId: 'CUS-001',
    customerName: 'Nova Games',
    contractValue: 25000,
    renewalDate: daysFromNow(15),
    status: 'at_risk',
    owner: 'Sarah Wilson',
    probability: 40,
    lastContactDate: daysFromNow(-10),
    notes: 'Customer expressed concerns about pricing.',
    createdAt: '2026-01-15',
  },
  {
    id: 'REN-002',
    customerId: 'CUS-002',
    customerName: 'GreenLeaf Wellness',
    contractValue: 8000,
    renewalDate: daysFromNow(22),
    status: 'upcoming',
    owner: 'David Chen',
    probability: 80,
    lastContactDate: daysFromNow(-5),
    createdAt: '2026-01-20',
  },
  {
    id: 'REN-003',
    customerId: 'CUS-003',
    customerName: 'Harmony Health',
    contractValue: 22000,
    renewalDate: daysFromNow(35),
    status: 'in_negotiation',
    owner: 'Emily Rodriguez',
    probability: 65,
    lastContactDate: daysFromNow(-3),
    notes: 'Negotiating a multi-year deal.',
    createdAt: '2026-02-01',
  },
  {
    id: 'REN-004',
    customerId: 'CUS-005',
    customerName: 'Paws & Care Vet',
    contractValue: 7500,
    renewalDate: daysFromNow(45),
    status: 'upcoming',
    owner: 'David Chen',
    probability: 90,
    createdAt: '2026-02-10',
  },
  {
    id: 'REN-005',
    customerId: 'CUS-007',
    customerName: 'Apex Analytics',
    contractValue: 42000,
    renewalDate: daysFromNow(60),
    status: 'renewed',
    owner: 'Sarah Wilson',
    probability: 100,
    lastContactDate: daysFromNow(-2),
    createdAt: '2026-03-01',
  },
  {
    id: 'REN-006',
    customerId: 'CUS-008',
    customerName: 'TerraWater',
    contractValue: 32000,
    renewalDate: daysFromNow(8),
    status: 'at_risk',
    owner: 'David Chen',
    probability: 30,
    lastContactDate: daysFromNow(-14),
    notes: 'No response to last two outreach attempts.',
    createdAt: '2026-01-05',
  },
  {
    id: 'REN-007',
    customerId: 'CUS-010',
    customerName: 'BuildRight',
    contractValue: 18500,
    renewalDate: daysFromNow(55),
    status: 'in_negotiation',
    owner: 'Sarah Wilson',
    probability: 70,
    lastContactDate: daysFromNow(-7),
    createdAt: '2026-03-15',
  },
  {
    id: 'REN-008',
    customerId: 'CUS-011',
    customerName: 'BrightAd',
    contractValue: 9500,
    renewalDate: daysFromNow(75),
    status: 'upcoming',
    owner: 'Emily Rodriguez',
    probability: 85,
    createdAt: '2026-04-01',
  },
]

function loadDb(): Renewal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Renewal[]) : structuredClone(seed)
  } catch {
    return structuredClone(seed)
  }
}

function saveDb(data: Renewal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

let renewalsDb: Renewal[] = loadDb()
let nextId = Math.max(0, ...renewalsDb.map((r) => parseInt(r.id.replace('REN-', ''), 10) || 0)) + 1

export const renewalStore = {
  getAll(): Renewal[] {
    return renewalsDb
  },

  getByCustomer(customerId: string): Renewal[] {
    return renewalsDb.filter((r) => r.customerId === customerId)
  },

  getDueWithin(days: number): Renewal[] {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + days)
    return renewalsDb.filter((r) => new Date(r.renewalDate) <= cutoff)
  },

  create(input: Omit<Renewal, 'id' | 'createdAt'>): Renewal {
    const renewal: Renewal = {
      ...input,
      id: `REN-${String(nextId).padStart(3, '0')}`,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    nextId += 1
    renewalsDb = [renewal, ...renewalsDb]
    saveDb(renewalsDb)
    return renewal
  },

  update(id: string, input: Partial<Omit<Renewal, 'id' | 'createdAt'>>): Renewal {
    const index = renewalsDb.findIndex((r) => r.id === id)
    if (index === -1) throw new Error(`Renewal ${id} not found`)
    const updated: Renewal = { ...renewalsDb[index], ...input, id }
    renewalsDb = [
      ...renewalsDb.slice(0, index),
      updated,
      ...renewalsDb.slice(index + 1),
    ]
    saveDb(renewalsDb)
    return updated
  },

  remove(id: string): void {
    const exists = renewalsDb.some((r) => r.id === id)
    if (!exists) throw new Error(`Renewal ${id} not found`)
    renewalsDb = renewalsDb.filter((r) => r.id !== id)
    saveDb(renewalsDb)
  },
}
