/**
 * Simulates network latency so the UI can practice loading states.
 * Real HTTP calls will replace this later via the service layer.
 */
export function delay(ms = 500): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
