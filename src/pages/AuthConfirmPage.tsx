import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import Logo from '../components/Logo'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

type Status = 'checking' | 'success' | 'error'

export default function AuthConfirmPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const trySession = async (): Promise<boolean> => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return !!session
    }

    const run = async () => {
      // Give Supabase a tick to parse the URL fragment
      await new Promise((r) => setTimeout(r, 400))
      if (cancelled) return

      if (await trySession()) {
        setStatus('success')
        setTimeout(() => !cancelled && navigate('/browse'), 1600)
        return
      }

      // Second chance — the fragment sometimes lands a moment later
      await new Promise((r) => setTimeout(r, 1500))
      if (cancelled) return

      if (await trySession()) {
        setStatus('success')
        setTimeout(() => !cancelled && navigate('/browse'), 1600)
      } else {
        setStatus('error')
        setError(
          'We could not verify your email. The link may have expired or already been used.'
        )
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25">
            <Logo className="text-primary" size={28} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Study Vault
          </h1>
        </div>

        <Card className="card-glow">
          <CardContent className="space-y-4 pt-6 text-center">
            {status === 'checking' && (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Confirming your email…
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Email confirmed</p>
                  <p className="text-sm text-muted-foreground">
                    Taking you to Browse…
                  </p>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Confirmation failed</p>
                  <p className="text-sm text-muted-foreground">
                    {error || 'The link may have expired.'}
                  </p>
                </div>
                <Link to="/login" className="block pt-2">
                  <Button variant="outline" className="w-full">
                    Back to login
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}