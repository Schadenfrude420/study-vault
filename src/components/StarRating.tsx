import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'

interface Props {
  resourceId: string
  averageRating: number
  totalRatings: number
  onRatingChange: () => void
}

export default function StarRating({
  resourceId,
  averageRating,
  totalRatings,
  onRatingChange,
}: Props) {
  const { user } = useAuth()
  const [hover, setHover] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  // Optimistic rating — shows the user's click immediately, before the DB responds
  const [optimisticRating, setOptimisticRating] = useState<number | null>(null)

  const handleRate = async (value: number) => {
    if (!user) {
      toast.error('Please log in to rate resources.')
      return
    }
    if (submitting) return

    // 1. Instantly update the UI
    setOptimisticRating(value)
    setSubmitting(true)

    // 2. Fire the DB request
    const { error } = await supabase
      .from('ratings')
      .upsert(
        { user_id: user.id, resource_id: resourceId, rating_value: value },
        { onConflict: 'user_id, resource_id' }
      )

    if (error) {
      toast.error('Failed to save rating: ' + error.message)
      setOptimisticRating(null) // Revert on error
    } else {
      toast.success('Rating saved!')
      onRatingChange() // Tell parent to refresh aggregate in background
    }
    setSubmitting(false)
  }

  // Use the optimistic value if it exists, otherwise fall back to the average
  const currentRating = optimisticRating || Math.round(averageRating)

  return (
    <div
      className="flex items-center gap-1.5 whitespace-nowrap"
      aria-label={`Rated ${averageRating} out of 5`}
    >
      <div className="flex items-center" role="radiogroup" aria-label="Resource rating">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = (hover || currentRating) >= star
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={currentRating === star}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              disabled={submitting}
              className={`
                text-xl leading-none transition-all duration-200 ease-out
                outline-none focus:outline-none focus-visible:outline-none
                ring-0 focus:ring-0 focus-visible:ring-0
                shadow-none hover:shadow-none focus:shadow-none focus-visible:shadow-none
                bg-transparent hover:bg-transparent
                ${isFilled
                  ? 'text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.45)]'
                  : 'text-muted-foreground/30 hover:text-yellow-200/50'
                }
                ${submitting
                  ? 'cursor-wait'
                  : 'cursor-pointer hover:scale-125 active:scale-95'
                }
              `}
              onMouseEnter={() => !submitting && setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => handleRate(star)}
            >
              ★
            </button>
          )
        })}
      </div>
      <span className="min-w-[3ch] text-right text-sm font-medium text-muted-foreground">
        {averageRating ? averageRating.toFixed(1) : '0.0'}
        <span className="ml-0.5 text-xs font-normal opacity-70">
          ({totalRatings || 0})
        </span>
      </span>
    </div>
  )
}