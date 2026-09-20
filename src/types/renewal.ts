export type RenewalStatus = 'upcoming' | 'in_negotiation' | 'renewed' | 'churned' | 'at_risk'

export interface Renewal {
  id: string
  customerId: string
  customerName: string
  contractValue: number
  renewalDate: string        // YYYY-MM-DD
  status: RenewalStatus
  owner: string
  probability: number        // 0-100
  notes?: string
  lastContactDate?: string
  createdAt: string
}
