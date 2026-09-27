import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { toast } from 'sonner'
import { Search, FileX2, FolderOpen, Trash2, Eye, X } from 'lucide-react'

function UploadListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-md border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

function statusBadgeClass(status: string) {
  if (status === 'Approved') return 'bg-green-500/15 text-green-500'
  if (status === 'Rejected') return 'bg-red-500/15 text-red-500'
  return 'bg-yellow-500/15 text-yellow-500'
}

type StatusFilter = 'all' | 'Approved' | 'Rejected'

export default function MyUploadsPage() {
  const { user } = useAuth()
  const [uploads, setUploads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [confirm, setConfirm] = useState<{
    open: boolean
    resourceId: string
    fileUrl: string
    title: string
  }>({ open: false, resourceId: '', fileUrl: '', title: '' })

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching uploads:', error)
      toast.error('Failed to load your uploads.')
    } else {
      setUploads(data || [])
    }
    setLoading(false)
  }

  const requestDelete = (resourceId: string, fileUrl: string, title: string) => {
    setConfirm({ open: true, resourceId, fileUrl, title })
  }

  const handleDelete = async () => {
    const { resourceId, fileUrl } = confirm

    const path = fileUrl.split('/study-vault-files/')[1]
    if (path) {
      const { error: storageErr } = await supabase.storage
        .from('study-vault-files')
        .remove([path])
      if (storageErr) console.error('Storage delete failed:', storageErr)
    }

    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('resource_id', resourceId)

    if (error) {
      toast.error('Failed to delete: ' + error.message)
    } else {
      toast.success('Upload deleted.')
      setUploads((prev) => prev.filter((u) => u.resource_id !== resourceId))
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return uploads.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!q) return true
      const haystack = [r.title, r.subject, r.department, r.degree, r.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [uploads, debouncedSearch, statusFilter])

  const hasFilter = !!search.trim()

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            My Uploads
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the resources you've shared with the community.
          </p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search my uploads…"
              className="bg-background pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearch('')}
              className="gap-1 self-start text-muted-foreground sm:self-auto"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'Approved', label: 'Live' },
              { key: 'Rejected', label: 'Hidden' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === opt.key
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <UploadListSkeleton rows={4} />
        ) : uploads.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No uploads yet"
            description="Share notes, PYQs, or lab materials to help your peers — and yourself."
            action={
              <Button asChild size="sm" className="mt-1">
                <Link to="/upload">Upload a resource</Link>
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileX2}
            title={
              statusFilter === 'Approved'
                ? 'No live uploads'
                : statusFilter === 'Rejected'
                ? 'No hidden uploads'
                : 'No matching uploads'
            }
            description={
              hasFilter
                ? 'Try a different keyword or clear the search.'
                : 'Try a different status filter.'
            }
            action={
              hasFilter ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearch('')}
                  className="mt-1"
                >
                  Clear search
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="mt-1"
                >
                  Show all
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'upload' : 'uploads'}
              {(hasFilter || statusFilter !== 'all') && ` (of ${uploads.length})`}
            </div>

            <div className="divide-y divide-border rounded-md border border-border bg-card">
              {filtered.map((resource) => (
                <div
                  key={resource.resource_id}
                  className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-muted/50 md:flex-row md:items-center"
                >
                  <div className="flex-1 space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {resource.title}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{resource.degree}</span>
                      <span>Dept: {resource.department}</span>
                      <span>Semester: {resource.semester}</span>
                      <span>Subject: {resource.subject}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(
                        resource.status
                      )}`}
                    >
                      {resource.status}
                    </span>

                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline" className="h-8 gap-1">
                        <a href={resource.file} target="_blank" rel="noopener noreferrer">
                          <Eye size={14} /> View
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 gap-1"
                        onClick={() =>
                          requestDelete(
                            resource.resource_id,
                            resource.file,
                            resource.title
                          )
                        }
                      >
                        <Trash2 size={14} /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
        onConfirm={handleDelete}
        title="Delete this upload?"
        description={`"${confirm.title}" will be permanently removed — both the file and its record. This cannot be undone.`}
        confirmText="Delete"
        destructive
      />
    </div>
  )
}