import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import TableSkeleton from '../components/TableSkeleton'
import Pagination from '../components/Pagination'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { toast } from 'sonner'
import { Search, Trash2, FolderOpen, X, ExternalLink } from 'lucide-react'

const PAGE_SIZE = 10

type StatusFilter = 'All' | 'Approved' | 'Rejected'

const FILTER_LABELS: Record<StatusFilter, string> = {
  All: 'All',
  Approved: 'Live',
  Rejected: 'Hidden',
}

export default function MyUploadsPage() {
  const { user } = useAuth()
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const topRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  const fetchMyUploads = async () => {
    if (!user) return
    setLoading(true)

    let query = supabase
      .from('resources')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'All') {
      query = query.eq('status', statusFilter)
    }

    if (debouncedSearch.trim()) {
      query = query.ilike('title', `%${debouncedSearch.trim()}%`)
    }

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      toast.error(error.message)
    } else {
      setResources(data || [])
      setTotalCount(count ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMyUploads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, statusFilter, debouncedSearch])

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [page])

  const handleDelete = async () => {
    if (!deleteTarget) return

    if (deleteTarget.file) {
      const urlParts = deleteTarget.file.split('/')
      const fileName = urlParts[urlParts.length - 1]
      if (fileName) {
        await supabase.storage
          .from('study-vault-files')
          .remove([`${user?.id}/${fileName}`])
      }
    }

    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('resource_id', deleteTarget.resource_id)

    if (error) {
      toast.error('Failed to delete: ' + error.message)
    } else {
      toast.success('Resource deleted.')
      setDeleteTarget(null)
      if (resources.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        fetchMyUploads()
      }
    }
  }

  const hasActiveFilters = !!search || statusFilter !== 'All'

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('All')
  }

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount)

  return (
    <div className="p-4 md:p-8" ref={topRef}>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            My Uploads
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the resources you have shared.
          </p>
        </header>

        <Card className="card-glow">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search my uploads by title…"
                  className="bg-background pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1 text-muted-foreground"
                >
                  <X className="h-4 w-4" /> Clear
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(['All', 'Approved', 'Rejected'] as StatusFilter[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(s)}
                  className="h-8"
                >
                  {FILTER_LABELS[s]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <TableSkeleton rows={PAGE_SIZE} cols={5} />
        ) : resources.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={hasActiveFilters ? 'No uploads match your filters' : 'No uploads yet'}
            description={
              hasActiveFilters
                ? 'Try clearing your filters or searching for something else.'
                : "You haven't uploaded any resources yet."
            }
            action={
              <Button asChild size="sm" className="mt-1">
                <Link to="/upload">Upload a resource</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {rangeStart}–{rangeEnd} of {totalCount}{' '}
                {totalCount === 1 ? 'upload' : 'uploads'}
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[45%]" />
                    <col className="w-[15%]" />
                    <col className="w-[14%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                  </colgroup>
                  <thead className="border-b border-border bg-muted font-medium text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Uploaded</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {resources.map((r) => (
                      <tr key={r.resource_id} className="transition-colors hover:bg-muted/50">
                        <td className="px-4 py-3 align-middle">
                          <div
                            className="truncate font-medium text-foreground"
                            title={r.title}
                          >
                            {r.title}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {r.subject} • Sem {r.semester}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span className="inline-block max-w-full truncate rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {r.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                          {r.created_at
                            ? new Date(r.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                              title="View file"
                            >
                              <a
                                href={r.file}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink size={14} />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteTarget(r)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this resource?"
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete"
        destructive
      />
    </div>
  )
}