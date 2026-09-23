import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import StarRating from '../components/StarRating'
import ReportButton from '../components/ReportButton'

export default function BrowsePage() {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [degreeFilter, setDegreeFilter] = useState('All')
  const [semesterFilter, setSemesterFilter] = useState('All')

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('resources')
      .select('*, resource_ratings_view(average_rating, total_ratings)')
      .eq('status', 'Approved')

    if (error) console.error('Error fetching resources:', error)
    else setResources(data || [])
    setLoading(false)
  }

  const filtered = resources.filter(r => {
    const matchesSearch = 
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.subject?.toLowerCase().includes(search.toLowerCase()) ||
      r.department?.toLowerCase().includes(search.toLowerCase())
    
    const matchesCategory = categoryFilter === 'All' || r.category === categoryFilter
    const matchesDegree = degreeFilter === 'All' || r.degree === degreeFilter
    const matchesSemester = semesterFilter === 'All' || r.semester === semesterFilter

    return matchesSearch && matchesCategory && matchesDegree && matchesSemester
  })

  const categories = ['All', 'Notes', 'Assignments', 'PYQs', 'Lab Materials', 'Reference Books', 'Syllabus']
  const degrees = ['All', 'B.Tech', 'B.Arch', 'B.Sc', 'B.A', 'B.A. LL.B (Hons)', 'BBA', 'B.Com', 'BCA', 'BTTM', 'M.Tech', 'M.Sc', 'M.A', 'M.Com', 'MBA', 'MCA', 'LL.M', 'M.Ed', 'Int. M.Sc', 'Int. M.A', 'Int. M.Tech']

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Browse Resources</h1>
      </div>

      {/* Filters Section */}
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
        <Input
          placeholder="Search by title, subject, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="flex gap-4">
          <select
            className="flex h-9 w-full max-w-xs rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
            value={degreeFilter}
            onChange={(e) => setDegreeFilter(e.target.value)}
          >
            {degrees.map((deg) => (
              <option key={deg} value={deg}>{deg === 'All' ? 'All Degrees' : deg}</option>
            ))}
          </select>

          <select
            className="flex h-9 w-full max-w-xs rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
          >
            <option value="All">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
              <option key={s} value={s.toString()}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <p>Loading resources...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No resources found matching your filters.</p>
      ) : (
        <div className="border rounded-md bg-white divide-y">
          {filtered.map((resource) => (
            <div 
              key={resource.resource_id} 
              className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 hover:bg-gray-50 transition-colors"
            >
              {/* Left side: File Info */}
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-base">{resource.title}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>{resource.degree}</span>
                  <span>Dept: {resource.department}</span>
                  <span>Semester: {resource.semester}</span>
                  <span>Subject: {resource.subject}</span>
                  <span className="font-medium text-blue-600">Category: {resource.category}</span>
                </div>
              </div>

              {/* Right side: Actions */}
              <div className="flex items-center gap-6">
                <div className="hidden md:block">
                  <StarRating
                    resourceId={resource.resource_id}
                    averageRating={resource.resource_ratings_view?.[0]?.average_rating || 0}
                    totalRatings={resource.resource_ratings_view?.[0]?.total_ratings || 0}
                    onRatingChange={fetchResources}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild size="sm">
                    <a href={resource.file} target="_blank" rel="noopener noreferrer">View File</a>
                  </Button>
                  <ReportButton resourceId={resource.resource_id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}