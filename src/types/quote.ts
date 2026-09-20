export type QuoteStatus = 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Declined' | 'Expired'

export interface QuoteLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount?: number  // percentage
  total: number
}

export interface Quote {
  id: string
  quoteNumber: string       // e.g. Q-2026-001
  title: string
  dealId?: string
  customerId?: string
  customerName?: string
  status: QuoteStatus
  validUntil: string
  lineItems: QuoteLineItem[]
  subtotal: number
  discountAmount: number
  tax: number               // percentage
  total: number
  notes?: string
  terms?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  sentAt?: string
  viewedAt?: string
  acceptedAt?: string
}

export type QuoteInput = Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt' | 'subtotal' | 'total'>
