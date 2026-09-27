import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import Logo from '../components/Logo'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setReady(true)
        return
      }
      setTimeout(async () => {
        const {
          data: { session: s },
        } = await supabase.auth.getSession()
        if (s) setReady(true)
        else {
          toast.error('Invalid or expired link. Request a new one.')
          navigate('/forgot-password')
        }
      }, 2000)
    }
    check()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) return toast.error('Password must be at least 6 characters.')
    if (password !== confirm) return toast.error('Passwords do not match.')

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success('Password updated. Please log in.')
      await supabase.auth.signOut()
      navigate('/login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25">
            <Logo className="text-primary" size={28} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Set a new password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose something memorable and secure
            </p>
          </div>
        </div>

        <Card className="card-glow">
          <CardContent className="pt-6">
            {!ready ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Verifying your reset link…
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}