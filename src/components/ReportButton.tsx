import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'

interface Props {
  resourceId: string
}

export default function ReportButton({ resourceId }: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('Inappropriate Content')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)

  const submitReport = async () => {
    if (!user) return alert('You must be logged in to report a resource.')
    
    const finalReason = category === 'Other' ? customReason.trim() : category
    if (category === 'Other' && !finalReason) {
      return alert('Please describe the issue.')
    }

    setLoading(true)

    const { data: existingReport } = await supabase
      .from('reports')
      .select('report_id')
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
      .maybeSingle()

    if (existingReport) {
      alert('You have already reported this resource. Our admins are reviewing it.')
      setOpen(false)
      setCategory('Inappropriate Content')
      setCustomReason('')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('reports').insert({
      resource_id: resourceId,
      user_id: user.id,
      reason: finalReason,
      status: 'Pending'
    })

    if (error) {
      if (error.code === '23505') {
        alert('You have already reported this resource.')
      } else {
        alert('Error submitting report: ' + error.message)
      }
    } else {
      alert('Report submitted successfully.')
      setOpen(false)
      setCategory('Inappropriate Content')
      setCustomReason('')
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="w-full mt-2 text-red-500 hover:text-red-700" onClick={() => setOpen(true)}>
        🚩 Report Resource
      </Button>
    )
  }

  return (
    <div className="space-y-3 mt-2 border p-4 rounded-md bg-gray-50">
      <div>
        <label className="text-sm font-medium mb-1 block">Reason for report</label>
        <select 
          className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="Inappropriate Content">Inappropriate Content</option>
          <option value="Spam or Duplicate">Spam or Duplicate</option>
          <option value="Wrong Information">Wrong Information</option>
          <option value="Other">Other (please describe)</option>
        </select>
      </div>

      {category === 'Other' && (
        <div>
          <textarea
            maxLength={250}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Please describe the issue in detail..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {customReason.length}/250
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={submitReport} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}