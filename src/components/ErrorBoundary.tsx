import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react'
import Logo from './Logo'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console for debugging
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.setState({ errorInfo })

    // Optional: send to Sentry / LogRocket / your own endpoint here
    // fetch('/api/log-error', { method: 'POST', body: JSON.stringify({ ... }) })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/browse'
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const { error, errorInfo, showDetails } = this.state
    const isDev = import.meta.env.DEV

    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-destructive/10 blur-[120px]" />

        <div className="relative z-10 w-full max-w-lg space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 ring-1 ring-destructive/25">
              <AlertTriangle className="text-destructive" size={28} />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Something went wrong
            </h1>
            <p className="max-w-md text-sm text-muted-foreground">
              An unexpected error occurred. Reloading the page usually fixes it. If
              this keeps happening, please let an admin know.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:bg-primary/90"
            >
              <RefreshCw size={16} />
              Reload page
            </button>
            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Home size={16} />
              Go to Browse
            </button>
          </div>

          {/* Dev-only error details */}
          {isDev && error && (
            <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
              <button
                onClick={() => this.setState({ showDetails: !showDetails })}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
              >
                <span>Show error details (dev only)</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}
                />
              </button>
              {showDetails && (
                <div className="border-t border-border px-4 py-3">
                  <p className="mb-2 text-xs font-semibold text-destructive">
                    {error.name}: {error.message}
                  </p>
                  {errorInfo?.componentStack && (
                    <pre className="max-h-60 overflow-auto rounded bg-background/60 p-2 text-[10px] leading-tight text-muted-foreground">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Logo size={14} className="text-primary" />
            <span>Study Vault</span>
          </div>
        </div>
      </div>
    )
  }
}