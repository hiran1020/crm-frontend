import { delay } from '@/lib/delay'
import { getDashboardMockData } from '@/mock/dashboard'
import type { DashboardData } from '@/types/dashboard'

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    await delay(600)
    return getDashboardMockData()
  },
}
