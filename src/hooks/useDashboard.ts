import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboardService'

export const dashboardKeys = {
  all: ['dashboard'] as const,
}

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: dashboardService.getDashboard,
  })
}
