import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import StarRating from '../components/StarRating'
import ReportButton from '../components/ReportButton'
import BookmarkButton from '../components/BookmarkButton'
import TableSkeleton from '../components/TableSkeleton'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { Download, Search, FileX2, FolderOpen, X, Eye, Filter, ChevronDown } from 'lucide-react'

const PAGE_SIZE = 10

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

// Select style for the sort dropdown (no native arrow)
const sortSelectClass =
  'h-9 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer'

type SortKey = 'newest' | 'oldest' | 'rating' | 'views' | 'title'

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  rating: 'Most rated',
  views: 'Most viewed',
  title: 'Title A–Z',
}

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

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/\./g, '')
    .split(/\s+/)
    .map((t) => t.replace(/[,()%*]/g, ''))
    .filter(Boolean)
}

export default function BrowsePage() {
  const { user } = useAuth()
  const [resources, setResources] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refetching, setRefetching] = useState(false)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const [categoryFilter, setCategoryFilter] = useState('')
  const [degreeFilter, setDegreeFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')

  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const topRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const activeFilterCount = [
    categoryFilter,
    degreeFilter,
    departmentFilter,
    semesterFilter,
  ].filter(Boolean).length

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoryFilter, degreeFilter, departmentFilter, semesterFilter, sort])

  const fetchResources = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefetching(true)

    let query = supabase
      .from('resources')
      .select(
        '*, resource_ratings_view(average_rating, total_ratings)',
        { count: 'exact' }
      )
      .eq('status', 'Approved')

    if (categoryFilter) query = query.eq('category', categoryFilter)
    if (degreeFilter) query = query.eq('degree', degreeFilter)
    if (departmentFilter) query = query.eq('department', departmentFilter)
    if (semesterFilter) query = query.eq('semester', Number(semesterFilter))

    const tokens = tokenize(debouncedSearch)
    for (const t of tokens) {
      query = query.or(
        `title.ilike.%${t}%,subject.ilike.%${t}%,department.ilike.%${t}%,degree.ilike.%${t}%,category.ilike.%${t}%`
      )
    }

    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'views':
        query = query.order('views', { ascending: false })
        break
      case 'title':
        query = query.order('title', { ascending: true })
        break
      case 'rating':
        query = query.order('average_rating', {
          foreignTable: 'resource_ratings_view',
          ascending: false,
          nullsFirst: false,
        })
        break
    }

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) console.error('Error fetching resources:', error)
    else {
      setResources(data || [])
      setTotalCount(count ?? 0)
    }
    setLoading(false)
    setRefetching(false)
  }

  useEffect(() => {
    fetchResources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, categoryFilter, degreeFilter, departmentFilter, semesterFilter, sort])

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [page])

  useEffect(() => {
    if (!user) return

    const fetchViewed = async () => {
      const { data } = await supabase
        .from('resource_views')
        .select('resource_id')
        .eq('user_id', user.id)
      setViewedIds(new Set((data || []).map((v: any) => v.resource_id)))
    }
    fetchViewed()

    const fetchSaved = async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('resource_id')
        .eq('user_id', user.id)
      setSavedIds(new Set((data || []).map((b: any) => b.resource_id)))
    }
    fetchSaved()
  }, [user])

  const [degreeOptions, setDegreeOptions] = useState<string[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([])
  const [semesterOptions, setSemesterOptions] = useState<string[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('resources')
        .select('degree, department, semester, category')
        .eq('status', 'Approved')

      const degs = new Set<string>()
      const depts = new Set<string>()
      const sems = new Set<string>()
      const cats = new Set<string>()

      ;(data || []).forEach((r: any) => {
        if (r.degree) degs.add(r.degree)
        if (r.category) cats.add(r.category)
        if (!degreeFilter || r.degree === degreeFilter) {
          if (r.department) depts.add(r.department)
          if (r.semester) sems.add(String(r.semester))
        }
      })

      setDegreeOptions(Array.from(degs).sort())
      setCategoryOptions(Array.from(cats).sort())
      setDepartmentOptions(Array.from(depts).sort())
      setSemesterOptions(Array.from(sems).sort((a, b) => Number(a) - Number(b)))
    }
    load()
  }, [degreeFilter])

  const hasActiveFilters =
    !!search || !!categoryFilter || !!degreeFilter || !!departmentFilter || !!semesterFilter

  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('')
    setDegreeFilter('')
    setDepartmentFilter('')
    setSemesterFilter('')
  }

  const handleDegreeChange = (value: string) => {
    setDegreeFilter(value)
    setDepartmentFilter('')
    setSemesterFilter('')
  }

  const handleView = async (resourceId: string) => {
    if (viewedIds.has(resourceId)) return

    setViewedIds((prev) => {
      const next = new Set(prev)
      next.add(resourceId)
      return next
    })

    setResources((prev) =>
      prev.map((r) =>
        r.resource_id === resourceId ? { ...r, views: (r.views || 0) + 1 } : r
      )
    )

    await supabase.rpc('increment_resource_views', {
      resource_id_input: resourceId,
    })
  }

  const handleBookmarkToggle = (resourceId: string, saved: boolean) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (saved) next.add(resourceId)
      else next.delete(resourceId)
      return next
    })
  }

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount)

  return (
    <div className="p-4 md:p-10" ref={topRef}>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Browse Resources
          </h1>
          <p className="text-sm text-muted-foreground">
            Search and filter approved study materials shared by your peers.
          </p>
        </header>

        <Card className="card-glow">
          <CardContent className="space-y-4 p-4 md:p-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, subject, degree…"
                className="bg-background pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="default"
                onClick={() => setShowFilters((s) => !s)}
                className="gap-2 sm:w-auto"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                      showFilters
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    showFilters ? 'rotate-180' : ''
                  }`}
                />
              </Button>

              {/* 👇 Sort dropdown — custom chevron hugs the text */}
              <div className="relative sm:w-auto sm:inline-block">
                <select
                  className={sortSelectClass}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                    <option key={k} value={k}>
                      {SORT_LABELS[k]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            </div>

            {showFilters && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="f-category" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Category
                    </label>
                    <select
                      id="f-category"
                      className={selectClass}
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">All categories</option>
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="f-degree" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Degree
                    </label>
                    <select
                      id="f-degree"
                      className={selectClass}
                      value={degreeFilter}
                      onChange={(e) => handleDegreeChange(e.target.value)}
                    >
                      <option value="">All degrees</option>
                      {degreeOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="f-dept" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Department
                    </label>
                    <select
                      id="f-dept"
                      className={selectClass}
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      disabled={departmentOptions.length === 0}
                    >
                      <option value="">All departments</option>
                      {departmentOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="f-sem" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Semester
                    </label>
                    <select
                      id="f-sem"
                      className={selectClass}
                      value={semesterFilter}
                      onChange={(e) => setSemesterFilter(e.target.value)}
                      disabled={semesterOptions.length === 0}
                    >
                      <option value="">All semesters</option>
                      {semesterOptions.map((s) => (
                        <option key={s} value={s}>Sem {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="gap-1 text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                      Clear all
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <TableSkeleton rows={PAGE_SIZE} cols={5} />
        ) : totalCount === 0 && !hasActiveFilters ? (
          <EmptyState
            icon={FolderOpen}
            title="No resources yet"
            description="Be the first to share notes, PYQs, or lab materials with your peers."
            action={
              <Button asChild size="sm" className="mt-1">
                <Link to="/upload">Upload a resource</Link>
              </Button>
            }
          />
        ) : totalCount === 0 ? (
          <EmptyState
            icon={FileX2}
            title="No matching resources"
            description={`No results for "${search}". Try fewer or different words.`}
            action={
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-1">
                Clear filters
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
              {refetching && (
                <span className="text-xs text-muted-foreground/70">Updating…</span>
              )}
            </div>

            {/* MOBILE / TABLET CARDS */}
            <div className="space-y-3 xl:hidden">
              {resources.map((resource) => {
                const fileType = getFileType(resource.file)
                return (
                  <div
                    key={resource.resource_id}
                    className="rounded-lg border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 flex-1 break-all text-sm font-semibold leading-snug text-foreground">
                        {resource.title}
                      </h3>
                      <div className="flex shrink-0 items-center gap-1">
                        <span
                          className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${fileTypeColor(
                            fileType
                          )}`}
                        >
                          {fileType}
                        </span>
                        <BookmarkButton
                          resourceId={resource.resource_id}
                          initialSaved={savedIds.has(resource.resource_id)}
                          onToggle={(saved) =>
                            handleBookmarkToggle(resource.resource_id, saved)
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                        {resource.degree}
                      </span>
                      <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                        {resource.department}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {resource.category}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {resource.subject} <span className="opacity-60">• Sem {resource.semester}</span>
                    </p>

                    <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <StarRating
                          resourceId={resource.resource_id}
                          averageRating={
                            resource.resource_ratings_view?.[0]?.average_rating || 0
                          }
                          totalRatings={
                            resource.resource_ratings_view?.[0]?.total_ratings || 0
                          }
                          onRatingChange={() => fetchResources(true)}
                        />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye size={12} />
                          <span>{resource.views ?? 0}</span>
                        </div>
                      </div>

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
                            onClick={() => handleView(resource.resource_id)}
                          >
                            <Download size={14} /> View
                          </a>
                        </Button>
                        <ReportButton resourceId={resource.resource_id} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden xl:block overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[44px]" />
                    <col />
                    <col className="w-[110px]" />
                    <col className="w-[180px]" />
                    <col className="w-[200px]" />
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
                              initialSaved={savedIds.has(resource.resource_id)}
                              onToggle={(saved) =>
                                handleBookmarkToggle(resource.resource_id, saved)
                              }
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
                                onRatingChange={() => fetchResources(true)}
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
                                  onClick={() => handleView(resource.resource_id)}
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