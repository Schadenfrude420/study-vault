import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'reports' | 'uploads'>('reports')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    // 1. Fetch KPIs
    const { data: statsData } = await supabase.rpc('get_admin_dashboard_stats')
    setStats(statsData)

    // 2. Fetch Reports
    const { data: reportsData } = await supabase
      .from('reports')
      .select(`
        report_id, reason, status, created_at,
        resources!reports_resource_id_fkey (resource_id, title, file, status),
        users!reports_user_id_fkey (email)
      `)
      .order('created_at', { ascending: false })
    setReports(reportsData || [])

    // 3. Fetch All Resources for "Recent Uploads" tab
    const { data: resourcesData } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })
    setResources(resourcesData || [])

    setLoading(false)
  }

  // --- Report Tab Actions ---
  const handleDismiss = async (reportId: number) => {
    await supabase.from('reports').update({ status: 'Resolved' }).eq('report_id', reportId)
    fetchData()
  }

  const handleHideFromReport = async (reportId: number, resourceId: string | undefined) => {
    if (!resourceId) return alert('This resource no longer exists.')
    if (!confirm('Hide this resource? It will be removed from Browse.')) return
    await supabase.from('reports').update({ status: 'Resolved' }).eq('report_id', reportId)
    await supabase.from('resources').update({ status: 'Rejected' }).eq('resource_id', resourceId)
    fetchData()
  }

  const handleRestore = async (resourceId: string | undefined) => {
    if (!resourceId) return
    if (!confirm('Restore this resource? It will be visible on the Browse page again.')) return
    await supabase.from('resources').update({ status: 'Approved' }).eq('resource_id', resourceId)
    fetchData()
  }

  // --- Uploads Tab Actions ---
  const updateResourceStatus = async (resourceId: string, status: 'Approved' | 'Rejected') => {
    await supabase.from('resources').update({ status }).eq('resource_id', resourceId)
    fetchData()
  }

  if (loading) return <div className="p-8">Loading dashboard...</div>

  const totalUsers = stats?.total_users || stats?.users || 0
  const totalResources = stats?.total_resources || stats?.resources || 0
  const pendingReports = stats?.pending_reports || reports.filter((r) => r.status === 'Pending').length || 0

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalUsers}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Resources</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalResources}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending Reports</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-red-500">{pendingReports}</p></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b space-x-4">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === 'reports' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Manage Reports ({reports.filter(r => r.status === 'Pending').length})
        </button>
        <button
          onClick={() => setActiveTab('uploads')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === 'uploads' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Recent Uploads ({resources.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'reports' ? (
        <Card>
          <CardHeader><CardTitle>Manage Reports</CardTitle></CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-gray-500">No reports submitted yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Resource</th>
                    <th className="p-2">Reason</th>
                    <th className="p-2">Reported By</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.report_id} className="border-b">
                      <td className="p-2 font-medium">
                        {r.resources?.title || 'Deleted Resource'}
                        {r.resources?.status === 'Rejected' && (
                          <span className="ml-2 text-xs text-red-500 font-normal">(Hidden)</span>
                        )}
                      </td>
                      <td className="p-2 text-gray-600 break-words max-w-xs">{r.reason}</td>
                      <td className="p-2 text-gray-500">{r.users?.email || 'Unknown'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          r.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{r.status}</span>
                      </td>
                      <td className="p-2 space-x-2">
                        {r.status !== 'Resolved' && (
                          <Button size="sm" variant="outline" onClick={() => handleDismiss(r.report_id)}>
                            Dismiss
                          </Button>
                        )}
                        {r.resources && (
                          r.resources.status === 'Rejected' ? (
                            <Button size="sm" variant="secondary" onClick={() => handleRestore(r.resources?.resource_id)}>
                              Restore
                            </Button>
                          ) : (
                            <Button size="sm" variant="destructive" onClick={() => handleHideFromReport(r.report_id, r.resources?.resource_id)}>
                              Hide
                            </Button>
                          )
                        )}
                        {r.resources?.file && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={r.resources.file} target="_blank" rel="noopener noreferrer">View File</a>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Recent Uploads</CardTitle></CardHeader>
          <CardContent>
            {resources.length === 0 ? (
              <p className="text-gray-500">No resources uploaded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Title</th>
                    <th className="p-2">Department</th>
                    <th className="p-2">Subject</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((res) => (
                    <tr key={res.resource_id} className="border-b">
                      <td className="p-2 font-medium">{res.title}</td>
                      <td className="p-2 text-gray-600">{res.department}</td>
                      <td className="p-2 text-gray-600">{res.subject}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          res.status === 'Approved' ? 'bg-green-100 text-green-700' :
                          res.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{res.status}</span>
                      </td>
                      <td className="p-2 space-x-2">
                        {res.status === 'Pending' && (
                          <>
                            <Button size="sm" onClick={() => updateResourceStatus(res.resource_id, 'Approved')}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => updateResourceStatus(res.resource_id, 'Rejected')}>Reject</Button>
                          </>
                        )}
                        {res.status === 'Rejected' && (
                          <Button size="sm" variant="secondary" onClick={() => updateResourceStatus(res.resource_id, 'Approved')}>Restore</Button>
                        )}
                        {res.status === 'Approved' && (
                          <Button size="sm" variant="destructive" onClick={() => updateResourceStatus(res.resource_id, 'Rejected')}>Hide</Button>
                        )}
                        <Button size="sm" variant="ghost" asChild>
                          <a href={res.file} target="_blank" rel="noopener noreferrer">View File</a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}