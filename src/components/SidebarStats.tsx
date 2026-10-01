import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Upload, Eye, Star, ArrowRight } from 'lucide-react'

interface Stats {
  uploads: number
  views: number
  avgRating: number
  totalRatings: number
}

export default function SidebarStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const load = async () => {
      // 1. Get the user's resources
      const { data: resources } = await supabase
        .from('resources')
        .select('resource_id, views')
        .eq('user_id', user.id)

      if (cancelled) return

      const uploads = resources?.length || 0
      const views = (resources || []).reduce((sum, r) => sum + (r.views || 0), 0)

      // 2. Get all ratings for those resources
      let avgRating = 0
      let totalRatings = 0

      if (resources && resources.length > 0) {
        const ids = resources.map((r) => r.resource_id)
        const { data: ratings } = await supabase
          .from('ratings')
          .select('rating_value')
          .in('resource_id', ids)

        if (cancelled) return

        totalRatings = ratings?.length || 0
        if (totalRatings > 0) {
          const sum = (ratings || []).reduce(
            (s, r) => s + (r.rating_value || 0),
            0
          )
          avgRating = sum / totalRatings
        }
      }

      setStats({ uploads, views, avgRating, totalRatings })
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user])

  if (loading || !stats) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-3">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="mt-3 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  // New user with nothing uploaded — show a friendly hint
  if (stats.uploads === 0) {
    return (
      <Link
        to="/upload"
        className="group block rounded-lg border border-dashed border-border bg-card/50 p-3 transition-colors hover:border-primary/40 hover:bg-accent"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Upload size={14} className="text-primary" />
            <span>Upload a resource</span>
          </div>
          <ArrowRight
            size={14}
            className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Share notes, PYQs, or lab materials
        </p>
      </Link>
    )
  }

  const hasRatings = stats.totalRatings > 0

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Your Activity
      </p>
      <div className="mt-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Upload size={12} />
            Uploads
          </span>
          <span className="font-semibold text-foreground">{stats.uploads}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Eye size={12} />
            Total views
          </span>
          <span className="font-semibold text-foreground">
            {stats.views.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Star size={12} />
            Avg rating
          </span>
          {hasRatings ? (
            <span className="font-semibold text-foreground">
              {stats.avgRating.toFixed(1)}
              <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                ({stats.totalRatings})
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </div>
    </div>
  )
}