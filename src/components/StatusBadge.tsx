interface Props {
  status: string
}

export default function StatusBadge({ status }: Props) {
  const styles: Record<string, string> = {
    Pending: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/25',
    Approved: 'bg-green-500/15 text-green-500 border-green-500/25',
    Rejected: 'bg-red-500/15 text-red-500 border-red-500/25',
    Resolved: 'bg-green-500/15 text-green-500 border-green-500/25',
    Dismissed: 'bg-muted text-muted-foreground border-border',
  }

  const cls = styles[status] || 'bg-muted text-muted-foreground border-border'

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  )
}