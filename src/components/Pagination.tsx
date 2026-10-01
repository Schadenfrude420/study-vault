import { Button } from './ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page: number
  totalPages: number
  onChange: (p: number) => void
}

function pageList(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const out: (number | '...')[] = [1]
  if (current > 3) out.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) out.push(i)

  if (current < total - 2) out.push('...')
  out.push(total)
  return out
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  const safeTotal = Math.max(1, totalPages)

  return (
    <nav
      className="flex items-center justify-center gap-1 pt-2"
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pageList(page, safeTotal).map((p, i) =>
        p === '...' ? (
          <span
            key={`e-${i}`}
            className="select-none px-1.5 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            className="h-8 min-w-8 px-2"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        disabled={page === safeTotal}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}