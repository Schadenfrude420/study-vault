import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

export default function MyUploadsPage() {
  const { user } = useAuth()
  const [uploads, setUploads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

    if (error) console.error('Error fetching uploads:', error)
    else setUploads(data || [])
    setLoading(false)
  }

  const handleDelete = async (resourceId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this upload? This cannot be undone.')) return

    // 1. Delete the physical file from Storage
    const path = fileUrl.split('/study-vault-files/')[1]
    if (path) {
      await supabase.storage.from('study-vault-files').remove([path])
    }

    // 2. Delete the database row
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('resource_id', resourceId)

    if (error) alert('Error deleting: ' + error.message)
    else fetchUploads()
  }

  const filtered = uploads.filter(r =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.subject?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Uploads</h1>
        <Input
          placeholder="Search my uploads..."
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading your uploads...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">You haven't uploaded any resources yet.</p>
      ) : (
        <div className="border rounded-md bg-white divide-y">
          {filtered.map((resource) => (
            <div
              key={resource.resource_id}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-base">{resource.title}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>{resource.degree}</span>
                  <span>Dept: {resource.department}</span>
                  <span>Semester: {resource.semester}</span>
                  <span>Subject: {resource.subject}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  resource.status === 'Approved' ? 'bg-green-100 text-green-700' :
                  resource.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {resource.status}
                </span>

                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={resource.file} target="_blank" rel="noopener noreferrer">View</a>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(resource.resource_id, resource.file)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}