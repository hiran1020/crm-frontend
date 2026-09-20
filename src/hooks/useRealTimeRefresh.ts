import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Periodically invalidates specified query keys to simulate real-time updates.
 */
export function useRealTimeRefresh(
  queryKeys: readonly (readonly unknown[])[],
  intervalMs = 30_000,
) {
  const qc = useQueryClient()

  useEffect(() => {
    const id = setInterval(() => {
      queryKeys.forEach((key) => {
        void qc.invalidateQueries({ queryKey: key })
      })
    }, intervalMs)
    return () => clearInterval(id)
  }, [qc, intervalMs]) // eslint-disable-line react-hooks/exhaustive-deps
}
