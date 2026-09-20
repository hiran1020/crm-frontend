/**
 * Monthly revenue goal stored in localStorage.
 */

const KEY = 'crm_revenue_goal'

export function getRevenueGoal(): number {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? Number(raw) : 0
  } catch {
    return 0
  }
}

export function setRevenueGoal(amount: number) {
  try {
    localStorage.setItem(KEY, String(amount))
  } catch {
    /* quota */
  }
}
