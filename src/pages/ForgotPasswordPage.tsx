import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import Logo from '../components/Logo'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) toast.error(error.message)
    else setSent(true)
    setLoading(false)
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
              Reset password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {sent
                ? "We've sent you a recovery link"
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>
        </div>

        <Card className="card-glow">
          <CardContent className="pt-6">
            {sent ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                  <MailCheck className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Check your inbox at{' '}
                  <span className="font-medium text-foreground">{email}</span>.
                  The link expires in 1 hour.
                </p>
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
                <Link
                  to="/login"
                  className="block text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Back to login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}