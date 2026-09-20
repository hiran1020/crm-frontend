import type { Lead } from '@/types/lead'

export function computeLeadScore(lead: Lead): number {
  let score = 0

  if (lead.value > 20000) score += 40
  else if (lead.value > 10000) score += 20
  else if (lead.value > 5000) score += 10

  const statusPts: Record<string, number> = {
    Qualified: 30,
    Contacted: 15,
    New: 0,
    Lost: -10,
    Converted: 50,
  }
  score += statusPts[lead.status] ?? 0

  const sourcePts: Record<string, number> = {
    Referral: 20,
    Partner: 20,
    'Trade Show': 10,
    Website: 5,
  }
  score += sourcePts[lead.source] ?? 0

  return Math.max(0, Math.min(100, score))
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Hot', color: 'bg-red-100 text-red-700' }
  if (score >= 40) return { label: 'Warm', color: 'bg-orange-100 text-orange-700' }
  return { label: 'Cold', color: 'bg-blue-100 text-blue-700' }
}
