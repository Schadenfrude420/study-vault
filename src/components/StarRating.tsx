import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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
  const [loading, setLoading] = useState(false)

  const handleRate = async (value: number) => {
    if (!user) return alert('You must be logged in to rate.')
    setLoading(true)

    const { error } = await supabase
      .from('ratings')
      .upsert(
        { user_id: user.id, resource_id: resourceId, rating_value: value },
        { onConflict: 'user_id, resource_id' }
      )

    if (error) alert(error.message)
    else onRatingChange()
    setLoading(false)
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={loading}
            className={`text-xl transition-colors ${
              (hover || Math.round(averageRating)) >= star
                ? 'text-yellow-500'
                : 'text-muted-foreground/40'
            }`}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleRate(star)}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {averageRating ? averageRating.toFixed(1) : '0.0'} ({totalRatings || 0})
      </span>
    </div>
  )
}