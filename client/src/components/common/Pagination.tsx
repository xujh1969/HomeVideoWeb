import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const canGoFirst = currentPage > 1
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages
  const canGoLast = currentPage < totalPages

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 2) {
        pages.push(1, 2, 3, '...', totalPages)
      } else if (currentPage >= totalPages - 1) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    
    return pages
  }

  return (
    <nav className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(1)}
        disabled={!canGoFirst}
        className="p-2 rounded-lg hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="第一页"
      >
        <SkipBack className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        className="p-2 rounded-lg hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="上一页"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div className="flex items-center gap-1 px-2">
        {getPageNumbers().map((page, index) => (
          <span key={index}>
            {page === '...' ? (
              <span className="px-2 text-caption text-ink-dim">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-body-sm font-medium transition-all ${
                  currentPage === page
                    ? 'bg-primary text-ink'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-elevated'
                }`}
              >
                {page}
              </button>
            )}
          </span>
        ))}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className="p-2 rounded-lg hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="下一页"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={!canGoLast}
        className="p-2 rounded-lg hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="最后一页"
      >
        <SkipForward className="w-4 h-4" />
      </button>
    </nav>
  )
}
