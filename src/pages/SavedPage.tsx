import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import StarRating from '../components/StarRating'
import ReportButton from '../components/ReportButton'
import BookmarkButton from '../components/BookmarkButton'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import { toast } from 'sonner'
import { Bookmark, Download, Eye, FolderOpen } from 'lucide-react'

const PAGE_SIZE = 12

function inlineUrl(url: string): string {
  if (!url) return url
  return url.includes('?') ? `${url}&download=false` : `${url}?download=false`
}

function getFileType(url: string): string {
  if (!url) return 'FILE'
  const clean = url.split('?')[0].split('#')[0]
  const parts = clean.split('.')
  if (parts.length < 2) return 'FILE'
  const ext = parts.pop()?.toLowerCase() || ''
  if (!ext || ext.length > 5) return 'FILE'
  return ext.toUpperCase()
}

function fileTypeColor(ext: string): string {
  switch (ext) {
    case 'PDF':
      return 'bg-red-500/15 text-red-500 border-red-500/25'
    case 'DOC':
    case 'DOCX':
      return 'bg-blue-500/15 text-blue-500 border-blue-500/25'
    case 'PPT':
    case 'PPTX':
      return 'bg-orange-500/15 text-orange-500 border-orange-500/25'
    case 'JPG':
    case 'JPEG':
    case 'PNG':
      return 'bg-purple-500/15 text-purple-500 border-purple-500/25'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

export default function SavedPage() {
  const { user } = useAuth()
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const fetchSaved = async () => {
    if (!user) return
    setLoading(true)

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error, count } = await supabase
      .from('bookmarks')
      .select(
        `
        created_at,
        resources:resource_id (
          *,
          resource_ratings_view (average_rating, total_ratings)
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      toast.error(error.message)
    } else {
      // Flatten: each row is { created_at, resources: {...} }
      const items = (data || [])
        .map((row: any) => row.resources)
        .filter(Boolean)
      setResources(items)
      setTotalCount(count ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSaved()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page])

  const handleRemove = (resourceId: string) => {
    // Remove from local list immediately
    setResources((prev) => prev.filter((r) => r.resource_id !== resourceId))
    setTotalCount((c) => Math.max(0, c - 1))
  }

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount)

  if (loading && resources.length === 0) {
    return (
      <div className="p-6 md:p-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="space-y-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Saved Resources
            </h1>
            <p className="text-sm text-muted-foreground">
              Resources you've bookmarked for later.
            </p>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-lg border border-border bg-card"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-foreground">
              <Bookmark className="h-6 w-6 text-primary" fill="currentColor" />
              Saved Resources
            </h1>
            <p className="text-sm text-muted-foreground">
              Resources you've bookmarked for later.
            </p>
          </div>
          {totalCount > 0 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {totalCount} saved
            </span>
          )}
        </header>

        {totalCount === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Nothing saved yet"
            description="Tap the bookmark icon on any resource to save it here for later."
            action={
              <Button asChild size="sm" className="mt-1">
                <Link to="/browse">Browse resources</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {rangeStart}–{rangeEnd} of {totalCount}{' '}
              {totalCount === 1 ? 'resource' : 'resources'}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => {
                const fileType = getFileType(resource.file)
                return (
                  <Card
                    key={resource.resource_id}
                    className="flex flex-col overflow-hidden"
                  >
                    <CardContent className="flex flex-1 flex-col gap-3 p-4">
                      {/* Header: title + bookmark + type */}
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="min-w-0 flex-1 break-all text-sm font-semibold leading-snug text-foreground line-clamp-2"
                          title={resource.title}
                        >
                          {resource.title}
                        </h3>
                        <BookmarkButton
                          resourceId={resource.resource_id}
                          initialSaved={true}
                          onToggle={(saved) => {
                            if (!saved) handleRemove(resource.resource_id)
                          }}
                        />
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${fileTypeColor(
                            fileType
                          )}`}
                        >
                          {fileType}
                        </span>
                        <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                          {resource.degree}
                        </span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {resource.category}
                        </span>
                      </div>

                      {/* Meta */}
                      <p className="text-xs text-muted-foreground">
                        {resource.department}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {resource.subject}{' '}
                        <span className="opacity-60">• Sem {resource.semester}</span>
                      </p>

                      {/* Footer: rating + views */}
                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                        <StarRating
                          resourceId={resource.resource_id}
                          averageRating={
                            resource.resource_ratings_view?.[0]?.average_rating || 0
                          }
                          totalRatings={
                            resource.resource_ratings_view?.[0]?.total_ratings || 0
                          }
                          onRatingChange={fetchSaved}
                        />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye size={12} />
                          <span>{resource.views ?? 0}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          asChild
                          variant="outline"
                          className="h-8 flex-1 gap-1"
                        >
                          <a
                            href={inlineUrl(resource.file)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download size={14} /> View
                          </a>
                        </Button>
                        <ReportButton resourceId={resource.resource_id} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}