interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800"
      role="alert"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-800"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}
