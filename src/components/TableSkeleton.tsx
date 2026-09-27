import { Skeleton } from './ui/skeleton'

interface TableSkeletonProps {
  rows?: number
  cols?: number
  className?: string
}

export default function TableSkeleton({
  rows = 6,
  cols = 6,
  className,
}: TableSkeletonProps) {
  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-card shadow-sm ${className ?? ''}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted">
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-4 py-3">
                    <Skeleton
                      className="h-4"
                      style={{ width: `${50 + ((r + c) % 4) * 12}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}