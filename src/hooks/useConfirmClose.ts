import { useCallback } from 'react'

/**
 * Returns a close handler that warns the user if the form has unsaved changes.
 * Pass `isDirty` from React Hook Form's formState.
 */
export function useConfirmClose(onClose: () => void, isDirty: boolean) {
  return useCallback(() => {
    if (!isDirty) {
      onClose()
      return
    }
    if (window.confirm('You have unsaved changes. Discard them?')) {
      onClose()
    }
  }, [isDirty, onClose])
}
