import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { toast } from 'sonner'
import { Flag } from 'lucide-react'

interface Props {
  resourceId: string
}

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export default function ReportButton({ resourceId }: Props) {
  const { user } = useAuth()
  const [category, setCategory] = useState('Inappropriate Content')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const submitReport = async () => {
    if (!user) return toast.error('You must be logged in to report a resource.')

    const finalReason = category === 'Other' ? customReason.trim() : category
    if (category === 'Other' && !finalReason) {
      return toast.error('Please describe the issue.')
    }

    setLoading(true)

    const { data: existingReport } = await supabase
      .from('reports')
      .select('report_id')
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
      .maybeSingle()

    if (existingReport) {
      toast.error('You have already reported this resource.')
      setOpen(false)
      setLoading(false)
      return
    }

    const { error } = await supabase.from('reports').insert({
      resource_id: resourceId,
      user_id: user.id,
      reason: finalReason,
      status: 'Pending',
    })

    if (error) {
      if (error.code === '23505') toast.error('You have already reported this resource.')
      else toast.error('Error submitting report: ' + error.message)
    } else {
      toast.success('Report submitted successfully.')
      setOpen(false)
      setCategory('Inappropriate Content')
      setCustomReason('')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Flag size={14} />
          Report
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display">Report Resource</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <select
            className={selectClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Inappropriate Content">Inappropriate Content</option>
            <option value="Spam or Duplicate">Spam or Duplicate</option>
            <option value="Wrong Information">Wrong Information</option>
            <option value="Other">Other (please describe)</option>
          </select>

          {category === 'Other' && (
            <div>
              <textarea
                maxLength={250}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Describe the issue..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {customReason.length}/250
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submitReport} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}