import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { Bookmark } from 'lucide-react'

interface Props {
  resourceId: string
  initialSaved?: boolean
  onToggle?: (saved: boolean) => void
  size?: number
  className?: string
}

export default function BookmarkButton({
  resourceId,
  initialSaved = false,
  onToggle,
  size = 16,
  className = '',
}: Props) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  // Sync with prop when parent fetches fresh data
  useEffect(() => {
    setSaved(initialSaved)
  }, [initialSaved])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast.error('Please log in to save resources.')
      return
    }
    if (loading) return

    const next = !saved
    setSaved(next) // optimistic
    setLoading(true)

    let error
    if (next) {
      const res = await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, resource_id: resourceId })
      error = res.error
    } else {
      const res = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('resource_id', resourceId)
      error = res.error
    }

    if (error) {
      setSaved(!next) // revert
      toast.error(error.message)
    } else {
      onToggle?.(next)
      // Silent success — the filled heart is feedback enough
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Remove from saved' : 'Save for later'}
      aria-label={saved ? 'Remove from saved' : 'Save for later'}
      className={`
        inline-flex items-center justify-center rounded-md p-1.5
        transition-all duration-200
        outline-none focus:outline-none focus-visible:outline-none
        ring-0 focus:ring-0 focus-visible:ring-0
        shadow-none hover:shadow-none focus:shadow-none focus-visible:shadow-none
        ${
          saved
            ? 'text-yellow-400 hover:bg-yellow-400/10'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }
        ${loading ? 'cursor-wait opacity-70' : 'cursor-pointer'}
        ${className}
      `}
    >
      <Bookmark
        size={size}
        fill={saved ? 'currentColor' : 'none'}
        className={`transition-transform duration-200 ${saved ? 'scale-110' : ''}`}
      />
    </button>
  )
}