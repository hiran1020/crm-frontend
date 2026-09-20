import type { Quote, QuoteInput } from '@/types/quote'

const STORAGE_KEY = 'crm_quotes_v1'

function computeTotals(quote: Quote): Quote {
  const subtotal = quote.lineItems.reduce((s, item) => s + item.total, 0)
  const discountAmount = quote.lineItems.reduce((s, item) => {
    const discPct = item.discount ?? 0
    return s + item.quantity * item.unitPrice * (discPct / 100)
  }, 0)
  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * (quote.tax / 100)
  return {
    ...quote,
    subtotal,
    discountAmount,
    total: afterDiscount + taxAmount,
  }
}

const seed: Quote[] = [
  computeTotals({
    id: 'Q-001',
    quoteNumber: 'Q-2026-001',
    title: 'Nova Games Enterprise License',
    dealId: 'DEAL-001',
    customerId: 'CUS-001',
    customerName: 'Nova Games',
    status: 'Sent',
    validUntil: '2026-10-31',
    lineItems: [
      { id: 'li-001', description: 'Enterprise License (Annual)', quantity: 1, unitPrice: 25000, total: 25000 },
    ],
    subtotal: 25000,
    discountAmount: 0,
    tax: 0,
    total: 25000,
    notes: 'Annual enterprise license including all modules.',
    terms: 'Net 30',
    createdBy: 'Sarah Wilson',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
    sentAt: '2026-09-02',
  }),
  computeTotals({
    id: 'Q-002',
    quoteNumber: 'Q-2026-002',
    title: 'Apex Analytics Suite',
    dealId: 'DEAL-003',
    customerId: 'CUS-007',
    customerName: 'Apex Analytics',
    status: 'Accepted',
    validUntil: '2026-10-15',
    lineItems: [
      { id: 'li-002', description: 'Analytics Platform', quantity: 1, unitPrice: 40000, total: 40000 },
      { id: 'li-003', description: 'Custom Integration Setup', quantity: 1, unitPrice: 2000, total: 2000 },
    ],
    subtotal: 42000,
    discountAmount: 0,
    tax: 0,
    total: 42000,
    terms: 'Net 30',
    createdBy: 'Sarah Wilson',
    createdAt: '2026-08-15',
    updatedAt: '2026-08-20',
    sentAt: '2026-08-16',
    acceptedAt: '2026-08-20',
  }),
  computeTotals({
    id: 'Q-003',
    quoteNumber: 'Q-2026-003',
    title: 'BuildRight Engineering Tools',
    dealId: 'DEAL-006',
    customerId: 'CUS-010',
    customerName: 'BuildRight',
    status: 'Draft',
    validUntil: '2026-11-30',
    lineItems: [
      { id: 'li-004', description: 'Engineering Toolkit License', quantity: 5, unitPrice: 3700, total: 18500 },
    ],
    subtotal: 18500,
    discountAmount: 0,
    tax: 0,
    total: 18500,
    notes: 'Draft pending internal approval.',
    createdBy: 'Sarah Wilson',
    createdAt: '2026-09-05',
    updatedAt: '2026-09-05',
  }),
  computeTotals({
    id: 'Q-004',
    quoteNumber: 'Q-2026-004',
    title: 'Children First EMR System',
    dealId: 'DEAL-015',
    customerId: 'CUS-020',
    customerName: 'Children First',
    status: 'Viewed',
    validUntil: '2026-10-20',
    lineItems: [
      { id: 'li-005', description: 'EMR System License', quantity: 1, unitPrice: 50000, total: 50000 },
      { id: 'li-006', description: 'Implementation Services', quantity: 1, unitPrice: 5000, total: 5000 },
    ],
    subtotal: 55000,
    discountAmount: 0,
    tax: 0,
    total: 55000,
    terms: 'Net 45',
    createdBy: 'David Chen',
    createdAt: '2026-09-03',
    updatedAt: '2026-09-03',
    sentAt: '2026-09-04',
    viewedAt: '2026-09-05',
  }),
  computeTotals({
    id: 'Q-005',
    quoteNumber: 'Q-2026-005',
    title: 'Harmony Health Records',
    dealId: 'DEAL-008',
    customerId: 'CUS-003',
    customerName: 'Harmony Health',
    status: 'Expired',
    validUntil: '2026-08-01',
    lineItems: [
      { id: 'li-007', description: 'Health Records Platform', quantity: 1, unitPrice: 22000, total: 22000 },
    ],
    subtotal: 22000,
    discountAmount: 0,
    tax: 0,
    total: 22000,
    createdBy: 'Emily Rodriguez',
    createdAt: '2026-07-01',
    updatedAt: '2026-07-01',
    sentAt: '2026-07-02',
  }),
]

function loadDb(): Quote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Quote[]) : structuredClone(seed)
  } catch {
    return structuredClone(seed)
  }
}

function saveDb(data: Quote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

let quotesDb: Quote[] = loadDb()
let nextNum = Math.max(0, ...quotesDb.map((q) => parseInt(q.quoteNumber.split('-')[2] ?? '0', 10) || 0)) + 1

export const quoteStore = {
  getAll(): Quote[] {
    return quotesDb
  },

  getById(id: string): Quote | undefined {
    return quotesDb.find((q) => q.id === id)
  },

  getByDeal(dealId: string): Quote[] {
    return quotesDb.filter((q) => q.dealId === dealId)
  },

  getByCustomer(customerId: string): Quote[] {
    return quotesDb.filter((q) => q.customerId === customerId)
  },

  create(input: QuoteInput): Quote {
    const year = new Date().getFullYear()
    const quoteNumber = `Q-${year}-${String(nextNum).padStart(3, '0')}`
    nextNum += 1

    const subtotal = input.lineItems.reduce((s, item) => s + item.total, 0)
    const discountAmount = input.lineItems.reduce((s, item) => {
      const d = item.discount ?? 0
      return s + item.quantity * item.unitPrice * (d / 100)
    }, 0)
    const afterDiscount = subtotal - discountAmount
    const taxAmount = afterDiscount * (input.tax / 100)

    const quote: Quote = {
      ...input,
      id: `Q-${String(Date.now()).slice(-6)}`,
      quoteNumber,
      subtotal,
      discountAmount,
      total: afterDiscount + taxAmount,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    quotesDb = [quote, ...quotesDb]
    saveDb(quotesDb)
    return quote
  },

  update(id: string, input: Partial<QuoteInput>): Quote {
    const index = quotesDb.findIndex((q) => q.id === id)
    if (index === -1) throw new Error(`Quote ${id} not found`)
    const existing = quotesDb[index]
    const merged = { ...existing, ...input, id, updatedAt: new Date().toISOString().slice(0, 10) }
    const updated = computeTotals(merged as Quote)
    quotesDb = [
      ...quotesDb.slice(0, index),
      updated,
      ...quotesDb.slice(index + 1),
    ]
    saveDb(quotesDb)
    return updated
  },

  remove(id: string): void {
    const exists = quotesDb.some((q) => q.id === id)
    if (!exists) throw new Error(`Quote ${id} not found`)
    quotesDb = quotesDb.filter((q) => q.id !== id)
    saveDb(quotesDb)
  },
}
