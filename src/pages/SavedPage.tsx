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
import TableSkeleton from '../components/TableSkeleton'
import Pagination from '../components/Pagination'
import { toast } from 'sonner'
import { Bookmark, Download, Eye, FolderOpen } from 'lucide-react'

const PAGE_SIZE = 10

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
    setResources((prev) => prev.filter((r) => r.resource_id !== resourceId))
    setTotalCount((c) => Math.max(0, c - 1))
  }

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount)

  return (
    <div className="p-4 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
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

        {loading ? (
          <TableSkeleton rows={PAGE_SIZE} cols={5} />
        ) : totalCount === 0 ? (
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
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {rangeStart}–{rangeEnd} of {totalCount}{' '}
                {totalCount === 1 ? 'resource' : 'resources'}
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[44px]" />
                    <col />
                    <col className="w-[110px]" />
                    <col className="w-[180px]" />
                    <col className="w-[170px]" />
                  </colgroup>
                  <thead className="border-b border-border bg-muted font-medium text-muted-foreground">
                    <tr>
                      <th className="px-2 py-3"></th>
                      <th className="px-4 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Rating</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {resources.map((resource) => {
                      const fileType = getFileType(resource.file)
                      return (
                        <tr
                          key={resource.resource_id}
                          className="transition-colors hover:bg-muted/50"
                        >
                          <td className="px-2 py-3 align-middle">
                            <BookmarkButton
                              resourceId={resource.resource_id}
                              initialSaved={true}
                              onToggle={(saved) => {
                                if (!saved) handleRemove(resource.resource_id)
                              }}
                              size={15}
                            />
                          </td>

                          <td className="min-w-0 px-4 py-3 align-middle">
                            <div className="flex items-start gap-2">
                              <span
                                className={`mt-0.5 inline-block shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${fileTypeColor(
                                  fileType
                                )}`}
                              >
                                {fileType}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div
                                  className="line-clamp-1 font-medium text-foreground"
                                  title={resource.title}
                                >
                                  {resource.title}
                                </div>
                                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {resource.degree} · {resource.department} ·{' '}
                                  {resource.subject} · Sem {resource.semester}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-middle">
                            <span className="inline-block max-w-full truncate rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              {resource.category}
                            </span>
                          </td>

                          <td className="px-4 py-3 align-middle">
                            <div className="flex flex-col gap-1">
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
                              <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Eye size={11} />
                                <span>{resource.views ?? 0} views</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                asChild
                                variant="outline"
                                className="h-8 gap-1"
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
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}