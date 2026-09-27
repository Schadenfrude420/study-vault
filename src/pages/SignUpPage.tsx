import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Logo from '../components/Logo'
import { MailCheck, ArrowLeft } from 'lucide-react'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const navigate = useNavigate()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) {
      setError(error.message)
    } else if (data.session) {
      navigate('/browse')
    } else {
      setEmailSent(true)
    }
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
            <p className="mt-1 text-sm text-muted-foreground">
              {emailSent ? 'One more step' : 'Create your account to get started'}
            </p>
          </div>
        </div>

        <Card className="card-glow">
          {emailSent ? (
            <CardContent className="space-y-4 pt-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to{' '}
                <span className="font-medium text-foreground">{email}</span>. Click it
                to activate your account.
              </p>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
                </Button>
              </Link>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="font-display text-lg">Sign Up</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <Input
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
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
                    minLength={6}
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Creating account…' : 'Sign Up'}
                  </Button>
                </form>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-primary hover:underline">
                    Log In
                  </Link>
                </p>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}