import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Logo from '../components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [banReason, setBanReason] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const reason = localStorage.getItem('sv_banned_reason')
    if (reason) {
      setBanReason(reason)
      localStorage.removeItem('sv_banned_reason')
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setBanReason(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) setError(error.message)
    else navigate('/browse')
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
              Study Vault
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to continue</p>
          </div>
        </div>

        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="font-display text-lg">Log In</CardTitle>
          </CardHeader>
          <CardContent>
            {banReason && (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <p className="font-medium">Account suspended</p>
                <p className="mt-0.5 text-xs opacity-90">{banReason}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Logging in…' : 'Log In'}
              </Button>
            </form>

            <div className="mt-4 flex flex-col items-center gap-2 text-center text-sm">
              <Link
                to="/forgot-password"
                className="text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-primary hover:underline">
                  Sign Up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}