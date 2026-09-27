import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import StarRating from '../components/StarRating'
import ReportButton from '../components/ReportButton'
import TableSkeleton from '../components/TableSkeleton'
import EmptyState from '../components/EmptyState'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { Download, Search, FileX2, FolderOpen, X, Eye } from 'lucide-react'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

type SortKey = 'newest' | 'oldest' | 'rating' | 'title'

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  rating: 'Most rated',
  title: 'Title A–Z',
}

export default function BrowsePage() {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refetching, setRefetching] = useState(false)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const [categoryFilter, setCategoryFilter] = useState('')
  const [degreeFilter, setDegreeFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')

  const fetchResources = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefetching(true)

    const { data, error } = await supabase
      .from('resources')
      .select('*, resource_ratings_view(average_rating, total_ratings)')
      .eq('status', 'Approved')

    if (error) console.error('Error fetching resources:', error)
    else setResources(data || [])
    setLoading(false)
    setRefetching(false)
  }

  useEffect(() => {
    fetchResources()
  }, [])

  const degreeOptions = useMemo(() => {
    const s = new Set<string>()
    resources.forEach((r) => r.degree && s.add(r.degree))
    return Array.from(s).sort()
  }, [resources])

  const departmentOptions = useMemo(() => {
    const s = new Set<string>()
    resources.forEach((r) => {
      if (!degreeFilter || r.degree === degreeFilter) {
        if (r.department) s.add(r.department)
      }
    })
    return Array.from(s).sort()
  }, [resources, degreeFilter])

  const semesterOptions = useMemo(() => {
    const s = new Set<string>()
    resources.forEach((r) => {
      if (!degreeFilter || r.degree === degreeFilter) {
        if (r.semester) s.add(String(r.semester))
      }
    })
    return Array.from(s).sort((a, b) => Number(a) - Number(b))
  }, [resources, degreeFilter])

  const categoryOptions = useMemo(() => {
    const s = new Set<string>()
    resources.forEach((r) => r.category && s.add(r.category))
    return Array.from(s).sort()
  }, [resources])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const result = resources.filter((r) => {
      if (categoryFilter && r.category !== categoryFilter) return false
      if (degreeFilter && r.degree !== degreeFilter) return false
      if (departmentFilter && r.department !== departmentFilter) return false
      if (semesterFilter && String(r.semester) !== semesterFilter) return false
      if (q) {
        const haystack = [r.title, r.subject, r.department, r.degree, r.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    const sorted = [...result]
    switch (sort) {
      case 'newest':
        sorted.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        )
        break
      case 'oldest':
        sorted.sort(
          (a, b) =>
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
        )
        break
      case 'rating':
        sorted.sort(
          (a, b) =>
            (b.resource_ratings_view?.[0]?.average_rating || 0) -
            (a.resource_ratings_view?.[0]?.average_rating || 0)
        )
        break
      case 'title':
        sorted.sort((a, b) =>
          (a.title || '').localeCompare(b.title || '', undefined, {
            sensitivity: 'base',
          })
        )
        break
    }
    return sorted
  }, [
    resources,
    debouncedSearch,
    categoryFilter,
    degreeFilter,
    departmentFilter,
    semesterFilter,
    sort,
  ])

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
    setResources((prev) =>
      prev.map((r) =>
        r.resource_id === resourceId ? { ...r, views: (r.views || 0) + 1 } : r
      )
    )
    await supabase.rpc('increment_resource_views', {
      resource_id_input: resourceId,
    })
  }

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Browse Resources
          </h1>
          <p className="text-sm text-muted-foreground">
            Search and filter approved study materials shared by your peers.
          </p>
        </header>

        <Card>
          <CardContent className="space-y-4 p-4 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, subject, department…"
                  className="bg-background pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  className={`${selectClass} sm:w-40`}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                    <option key={k} value={k}>
                      {SORT_LABELS[k]}
                    </option>
                  ))}
                </select>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-1 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          </CardContent>
        </Card>

        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : resources.length === 0 ? (
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
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileX2}
            title="No matching resources"
            description="Try a different keyword or clear your filters."
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
                {filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}
                {hasActiveFilters && ` (of ${resources.length})`}
              </span>
              {refetching && (
                <span className="text-xs text-muted-foreground/70">Updating…</span>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted font-medium text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Subject / Sem</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Views</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((resource) => (
                      <tr
                        key={resource.resource_id}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {resource.title}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {resource.department}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {resource.subject}{' '}
                          <span className="text-muted-foreground/70">
                            • Sem {resource.semester}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {resource.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
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
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="inline-flex items-center gap-1">
                            <Eye size={14} />
                            <span>{resource.views ?? 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              asChild
                              variant="outline"
                              className="h-8 gap-1"
                            >
                              <a
                                href={resource.file}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}