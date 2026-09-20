interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: PaginationProps) {
  if (total === 0) {
    return null
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (pageNumber) => {
      if (totalPages <= 7) {
        return true
      }
      return (
        pageNumber === 1 ||
        pageNumber === totalPages ||
        Math.abs(pageNumber - page) <= 1
      )
    },
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ←
        </button>
        {pages.map((pageNumber, index) => {
          const previous = pages[index - 1]
          const showEllipsis = previous !== undefined && pageNumber - previous > 1

          return (
            <span key={pageNumber} className="contents">
              {showEllipsis ? (
                <span className="px-1 text-slate-400" aria-hidden>
                  …
                </span>
              ) : null}
              <button
                type="button"
                aria-label={`Page ${pageNumber}`}
                aria-current={pageNumber === page ? 'page' : undefined}
                onClick={() => onPageChange(pageNumber)}
                className={[
                  'min-w-9 rounded-md px-3 py-1.5 text-sm',
                  pageNumber === page
                    ? 'bg-brand-600 text-white'
                    : 'border border-border text-slate-700 hover:bg-slate-50',
                ].join(' ')}
              >
                {pageNumber}
              </button>
            </span>
          )
        })}
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  )
}
