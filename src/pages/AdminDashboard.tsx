import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import TableSkeleton from '../components/TableSkeleton'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import AdminUsersPanel from '../components/AdminUsersPanel'
import { toast } from 'sonner'
import {
  Users,
  FileText,
  Flag,
  Eye,
  X,
  RotateCcw,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Loader2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'

const CHART_COLORS = {
  primary: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  purple: '#a855f7',
  cyan: '#06b6d4',
  orange: '#f97316',
  pink: '#ec4899',
}

const AXIS_STROKE = '#94a3b8'
const GRID_STROKE = 'rgba(148, 163, 184, 0.12)'

type TimeRange = 'week' | 'month' | 'year'

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-xl">
      {label !== undefined && label !== '' && (
        <p className="mb-1.5 font-medium text-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: p.payload?.color || p.color || p.fill }}
            />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto pl-3 font-medium text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeleton({ height = 256 }: { height?: number }) {
  return (
    <div style={{ height }} className="flex items-end gap-2 pt-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1"
          style={{ height: `${30 + Math.sin(i) * 20 + Math.random() * 40}%` }}
        />
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'reports' | 'uploads' | 'users'>('reports')
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [pendingId, setPendingId] = useState<string | null>(null)

  const [confirm, setConfirm] = useState<{
    open: boolean
    title: string
    description: string
    confirmText: string
    destructive: boolean
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    description: '',
    confirmText: '',
    destructive: false,
    onConfirm: () => {},
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const { data: statsData } = await supabase.rpc('get_admin_dashboard_stats')
    setStats(statsData)

    const { data: reportsData } = await supabase
      .from('reports')
      .select(`
        report_id, reason, status, created_at,
        resources!reports_resource_id_fkey (resource_id, title, file, status),
        users!reports_user_id_fkey (email)
      `)
      .order('created_at', { ascending: false })
    setReports(reportsData || [])

    const { data: resourcesData } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })
    setResources(resourcesData || [])

    setLoading(false)
  }

  const rangeStart = useMemo(() => {
    const now = new Date()
    if (timeRange === 'week') {
      const d = new Date(now)
      d.setDate(d.getDate() - 6)
      d.setHours(0, 0, 0, 0)
      return d
    }
    if (timeRange === 'month') {
      const d = new Date(now)
      d.setDate(d.getDate() - 29)
      d.setHours(0, 0, 0, 0)
      return d
    }
    return new Date(now.getFullYear(), now.getMonth() - 11, 1)
  }, [timeRange])

  const resourcesInRange = useMemo(() => {
    return resources.filter(
      (r) => r.created_at && new Date(r.created_at) >= rangeStart
    )
  }, [resources, rangeStart])

  const uploadActivity = useMemo(() => {
    const now = new Date()

    if (timeRange === 'week') {
      const buckets: { key: string; label: string; count: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        buckets.push({
          key: d.toISOString().split('T')[0],
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          count: 0,
        })
      }
      resourcesInRange.forEach((r) => {
        const key = r.created_at?.split('T')[0]
        const bucket = buckets.find((b) => b.key === key)
        if (bucket) bucket.count++
      })
      return buckets
    }

    if (timeRange === 'month') {
      const buckets: { key: string; label: string; count: number }[] = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        buckets.push({
          key: d.toISOString().split('T')[0],
          label: d.getDate().toString(),
          count: 0,
        })
      }
      resourcesInRange.forEach((r) => {
        const key = r.created_at?.split('T')[0]
        const bucket = buckets.find((b) => b.key === key)
        if (bucket) bucket.count++
      })
      return buckets
    }

    const buckets: { key: string; label: string; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        count: 0,
      })
    }
    resourcesInRange.forEach((r) => {
      if (!r.created_at) return
      const key = r.created_at.slice(0, 7)
      const bucket = buckets.find((b) => b.key === key)
      if (bucket) bucket.count++
    })
    return buckets
  }, [resourcesInRange, timeRange])

  const statusData = useMemo(() => {
    const counts = { Approved: 0, Rejected: 0 }
    resourcesInRange.forEach((r) => {
      if (r.status === 'Approved') counts.Approved++
      else if (r.status === 'Rejected') counts.Rejected++
    })
    return [
      { name: 'Live', value: counts.Approved, color: CHART_COLORS.green },
      { name: 'Hidden', value: counts.Rejected, color: CHART_COLORS.red },
    ]
  }, [resourcesInRange])

  const topDepartments = useMemo(() => {
    const counts: Record<string, number> = {}
    resourcesInRange.forEach((r) => {
      if (r.department) counts[r.department] = (counts[r.department] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [resourcesInRange])

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    resourcesInRange.forEach((r) => {
      if (r.category) counts[r.category] = (counts[r.category] || 0) + 1
    })
    const palette = [
      CHART_COLORS.primary,
      CHART_COLORS.purple,
      CHART_COLORS.cyan,
      CHART_COLORS.orange,
      CHART_COLORS.pink,
      CHART_COLORS.green,
    ]
    return Object.entries(counts)
      .map(([name, value], i) => ({ name, value, color: palette[i % palette.length] }))
      .sort((a, b) => b.value - a.value)
  }, [resourcesInRange])

  const handleDismiss = (reportId: number) => {
    setConfirm({
      open: true,
      title: 'Dismiss Report?',
      description:
        'This report will be marked as resolved, but the resource will stay visible.',
      confirmText: 'Dismiss',
      destructive: false,
      onConfirm: async () => {
        setPendingId(`report-${reportId}`)
        const { error } = await supabase
          .from('reports')
          .update({ status: 'Resolved' })
          .eq('report_id', reportId)
        if (error) toast.error(error.message)
        else toast.success('Report dismissed.')
        await fetchData()
        setPendingId(null)
      },
    })
  }

  const handleHideFromReport = (reportId: number, resourceId: string | undefined) => {
    if (!resourceId) return toast.error('This resource no longer exists.')
    setConfirm({
      open: true,
      title: 'Hide Resource?',
      description:
        'The resource will be removed from Browse. The report will be marked as resolved.',
      confirmText: 'Hide',
      destructive: true,
      onConfirm: async () => {
        setPendingId(resourceId)
        await supabase.from('reports').update({ status: 'Resolved' }).eq('report_id', reportId)
        const { error } = await supabase
          .from('resources')
          .update({ status: 'Rejected' })
          .eq('resource_id', resourceId)
        if (error) toast.error(error.message)
        else toast.success('Resource hidden.')
        await fetchData()
        setPendingId(null)
      },
    })
  }

  const handleRestore = (resourceId: string | undefined) => {
    if (!resourceId) return
    setConfirm({
      open: true,
      title: 'Restore Resource?',
      description: 'The resource will become visible on the Browse page again.',
      confirmText: 'Restore',
      destructive: false,
      onConfirm: async () => {
        setPendingId(resourceId)
        const { error } = await supabase
          .from('resources')
          .update({ status: 'Approved' })
          .eq('resource_id', resourceId)
        if (error) toast.error(error.message)
        else toast.success('Resource restored.')
        await fetchData()
        setPendingId(null)
      },
    })
  }

  const handleRejectUpload = (resourceId: string) => {
    setConfirm({
      open: true,
      title: 'Hide this Resource?',
      description:
        'It will be removed from the Browse page. You can restore it later from this same tab.',
      confirmText: 'Hide',
      destructive: true,
      onConfirm: async () => {
        setPendingId(resourceId)
        const { error } = await supabase
          .from('resources')
          .update({ status: 'Rejected' })
          .eq('resource_id', resourceId)
        if (error) toast.error(error.message)
        else toast.success('Resource hidden.')
        await fetchData()
        setPendingId(null)
      },
    })
  }

  const totalUsers = stats?.total_users || stats?.users || 0
  const totalResources = stats?.total_resources || stats?.resources || 0
  const pendingReports = reports.filter((r) => r.status === 'Pending').length

  const totalStatusCount = statusData.reduce((sum, d) => sum + d.value, 0)
  const rangeLabel = TIME_RANGE_LABELS[timeRange].toLowerCase()
  const busy = pendingId !== null

  return (
    <div className="p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Platform activity, resource health, and moderation at a glance.
            </p>
          </div>

          <div className="inline-flex shrink-0 items-center gap-1 self-start rounded-lg border border-border bg-card p-1 sm:self-auto">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {loading ? (
            <>
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
            </>
          ) : (
            <>
              <Card className="card-glow card-glow-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="mt-1 text-3xl font-bold text-foreground">{totalUsers}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                      <Users className="text-primary" size={22} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glow card-glow-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Resources</p>
                      <p className="mt-1 text-3xl font-bold text-foreground">
                        {totalResources}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                      <FileText className="text-primary" size={22} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`card-glow card-glow-hover ${
                  pendingReports > 0 ? 'ring-1 ring-destructive/30' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Reports</p>
                      <p
                        className={`mt-1 text-3xl font-bold ${
                          pendingReports > 0 ? 'text-destructive' : 'text-foreground'
                        }`}
                      >
                        {pendingReports}
                      </p>
                    </div>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        pendingReports > 0 ? 'bg-destructive/15' : 'bg-muted'
                      }`}
                    >
                      <Flag
                        className={
                          pendingReports > 0 ? 'text-destructive' : 'text-muted-foreground'
                        }
                        size={22}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Uploads · {TIME_RANGE_LABELS[timeRange]}
              </CardTitle>
              <p className="mt-1 text-xs font-normal text-muted-foreground">
                How many resources were uploaded each{' '}
                {timeRange === 'year' ? 'month' : 'day'}
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton height={240} />
              ) : (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={uploadActivity}
                      margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={GRID_STROKE}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        stroke={AXIS_STROKE}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        interval={timeRange === 'month' ? 4 : 0}
                      />
                      <YAxis
                        stroke={AXIS_STROKE}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ stroke: GRID_STROKE, strokeWidth: 1 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Uploads"
                        stroke={CHART_COLORS.primary}
                        strokeWidth={2}
                        fill="url(#uploadGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <PieIcon className="h-4 w-4 text-primary" />
                Resource Breakdown
              </CardTitle>
              <p className="mt-1 text-xs font-normal text-muted-foreground">
                Live vs hidden · {TIME_RANGE_LABELS[timeRange]}
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton height={220} />
              ) : totalStatusCount === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  No resources {rangeLabel}
                </div>
              ) : (
                <>
                  <div className="relative h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData.filter((s) => s.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={48}
                          outerRadius={68}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {statusData
                            .filter((s) => s.value > 0)
                            .map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold text-foreground">{totalStatusCount}</p>
                      <p className="text-xs text-muted-foreground">in period</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {statusData.map((s) => (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="text-muted-foreground">{s.name}</span>
                        </div>
                        <span className="font-medium text-foreground">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <BarChart3 className="h-4 w-4 text-primary" />
                Top Departments
              </CardTitle>
              <p className="mt-1 text-xs font-normal text-muted-foreground">
                Where resources came from · {TIME_RANGE_LABELS[timeRange]}
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton height={240} />
              ) : topDepartments.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                  No data {rangeLabel}
                </div>
              ) : (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topDepartments}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={GRID_STROKE}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        stroke={AXIS_STROKE}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke={AXIS_STROKE}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={110}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ fill: 'rgba(148, 163, 184, 0.06)' }}
                      />
                      <Bar
                        dataKey="count"
                        name="Resources"
                        fill={CHART_COLORS.primary}
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <PieIcon className="h-4 w-4 text-primary" />
                Category Breakdown
              </CardTitle>
              <p className="mt-1 text-xs font-normal text-muted-foreground">
                Category mix · {TIME_RANGE_LABELS[timeRange]}
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton height={240} />
              ) : categoryData.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                  No data {rangeLabel}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-44 w-44 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={40}
                          outerRadius={68}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {categoryData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {categoryData.map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="truncate text-muted-foreground">{c.name}</span>
                        </div>
                        <span className="shrink-0 font-medium text-foreground">{c.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'reports'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            Manage Reports
            {pendingReports > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                  activeTab === 'reports'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-destructive/15 text-destructive'
                }`}
              >
                {pendingReports}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'uploads'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            Manage Uploads
            <span className="text-xs opacity-70">({resources.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            Manage Users
          </button>
        </div>

        {activeTab === 'users' ? (
          <AdminUsersPanel />
        ) : activeTab === 'reports' ? (
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <TableSkeleton rows={5} cols={5} className="rounded-none border-0 shadow-none" />
              ) : reports.length === 0 ? (
                <EmptyState
                  icon={Flag}
                  title="No reports submitted yet"
                  description="When students report a resource, it will appear here for review."
                  className="border-0 bg-transparent"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Resource</th>
                        <th className="px-4 py-3 text-left font-medium">Reason</th>
                        <th className="px-4 py-3 text-left font-medium">Reported By</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {reports.map((r) => {
                        const isPending =
                          pendingId === `report-${r.report_id}` ||
                          pendingId === r.resources?.resource_id
                        return (
                          <tr key={r.report_id} className="transition-colors hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">
                                {r.resources?.title || 'Deleted Resource'}
                              </div>
                              {r.resources?.status === 'Rejected' && (
                                <span className="text-xs text-destructive">Hidden</span>
                              )}
                            </td>
                            <td className="max-w-xs px-4 py-3 text-muted-foreground">
                              <span className="line-clamp-2">{r.reason}</span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {r.users?.email || 'Unknown'}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={r.status} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                {r.status !== 'Resolved' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDismiss(r.report_id)}
                                    disabled={busy}
                                    className="h-8"
                                  >
                                    {pendingId === `report-${r.report_id}` ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      'Dismiss'
                                    )}
                                  </Button>
                                )}
                                {r.resources &&
                                  (r.resources.status === 'Rejected' ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRestore(r.resources?.resource_id)}
                                      disabled={busy}
                                      className="h-8 gap-1"
                                    >
                                      {isPending ? (
                                        <>
                                          <Loader2 size={14} className="animate-spin" /> Working…
                                        </>
                                      ) : (
                                        <>
                                          <RotateCcw size={14} /> Restore
                                        </>
                                      )}
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        handleHideFromReport(
                                          r.report_id,
                                          r.resources?.resource_id
                                        )
                                      }
                                      disabled={busy}
                                      className="h-8 gap-1"
                                    >
                                      {isPending ? (
                                        <>
                                          <Loader2 size={14} className="animate-spin" /> Hiding…
                                        </>
                                      ) : (
                                        <>
                                          <X size={14} /> Hide
                                        </>
                                      )}
                                    </Button>
                                  ))}
                                {r.resources?.file && (
                                  <Button size="sm" variant="ghost" asChild className="h-8 gap-1">
                                    <a
                                      href={r.resources.file}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Eye size={14} /> View
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <TableSkeleton rows={5} cols={5} className="rounded-none border-0 shadow-none" />
              ) : resources.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No resources uploaded yet"
                  description="All uploaded resources will appear here."
                  className="border-0 bg-transparent"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Title</th>
                        <th className="px-4 py-3 text-left font-medium">Department</th>
                        <th className="px-4 py-3 text-left font-medium">Subject</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {resources.map((res) => {
                        const isPending = pendingId === res.resource_id
                        return (
                          <tr key={res.resource_id} className="transition-colors hover:bg-muted/50">
                            <td className="px-4 py-3 font-medium text-foreground">{res.title}</td>
                            <td className="px-4 py-3 text-muted-foreground">{res.department}</td>
                            <td className="px-4 py-3 text-muted-foreground">{res.subject}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={res.status} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                {res.status === 'Rejected' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRestore(res.resource_id)}
                                    disabled={busy}
                                    className="h-8 gap-1"
                                  >
                                    {isPending ? (
                                      <>
                                        <Loader2 size={14} className="animate-spin" /> Working…
                                      </>
                                    ) : (
                                      <>
                                        <RotateCcw size={14} /> Restore
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectUpload(res.resource_id)}
                                    disabled={busy}
                                    className="h-8 gap-1"
                                  >
                                    {isPending ? (
                                      <>
                                        <Loader2 size={14} className="animate-spin" /> Hiding…
                                      </>
                                    ) : (
                                      <>
                                        <X size={14} /> Hide
                                      </>
                                    )}
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" asChild className="h-8 gap-1">
                                  <a
                                    href={res.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Eye size={14} /> View
                                  </a>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        description={confirm.description}
        confirmText={confirm.confirmText}
        destructive={confirm.destructive}
      />
    </div>
  )
}