import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  getStoredAccounts,
  removeStoredAccount,
  type StoredAccount,
} from '../lib/accountSwitcher'
import { toast } from 'sonner'
import { Check, LogOut, Plus, User, ChevronDown } from 'lucide-react'

interface Props {
  compact?: boolean
}

function initialsOf(name: string | null, email: string): string {
  const source = (name || email || '?').trim()
  const parts = source.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export default function AccountSwitcher({ compact = false }: Props) {
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [switching, setSwitching] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Load + refresh accounts when storage changes
  useEffect(() => {
    const load = () => setAccounts(getStoredAccounts())
    load()
    window.addEventListener('sv-accounts-changed', load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener('sv-accounts-changed', load)
      window.removeEventListener('storage', load)
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (!user) return null

  const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  const displayEmail = user.email || ''

  const switchTo = async (acct: StoredAccount) => {
    if (acct.user_id === user.id) {
      setOpen(false)
      return
    }
    setSwitching(acct.user_id)

    const { error } = await supabase.auth.refreshSession({
      refresh_token: acct.refresh_token,
    })

    if (error) {
      // Token expired — remove from list and inform user
      removeStoredAccount(acct.user_id)
      toast.error(
        `${acct.email} session expired. Please log in again from the login page.`
      )
      setSwitching(null)
      return
    }

    toast.success(`Switched to ${acct.name || acct.email}`)
    setOpen(false)
    setSwitching(null)
    // Full reload so all contexts / pages pick up the new session
    window.location.href = '/browse'
  }

  const handleAddAccount = () => {
    setOpen(false)
    navigate('/login?addAccount=1')
  }

  const handleSignOutThis = async (acct: StoredAccount) => {
    if (acct.user_id === user.id) {
      // Signing out the current account — clear it and go to login
      removeStoredAccount(acct.user_id)
      await supabase.auth.signOut()
      navigate('/login')
    } else {
      // Just forget this stored account
      removeStoredAccount(acct.user_id)
      toast.success(`Removed ${acct.email}`)
    }
  }

  // ---------- Compact version (mobile top bar) ----------
  if (compact) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
          aria-label="Switch account"
        >
          {initialsOf(displayName, displayEmail)}
        </button>
        {open && (
          <DropdownBody
            accounts={accounts}
            currentUserId={user.id}
            currentRole={role}
            displayName={displayName}
            displayEmail={displayEmail}
            switching={switching}
            onSwitch={switchTo}
            onAdd={handleAddAccount}
            onSignOut={handleSignOutThis}
          />
        )}
      </div>
    )
  }

  // ---------- Full version (sidebar) ----------
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25 text-xs font-bold text-primary">
          {initialsOf(displayName, displayEmail)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {displayName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {displayEmail}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <DropdownBody
          accounts={accounts}
          currentUserId={user.id}
          currentRole={role}
          displayName={displayName}
          displayEmail={displayEmail}
          switching={switching}
          onSwitch={switchTo}
          onAdd={handleAddAccount}
          onSignOut={handleSignOutThis}
        />
      )}
    </div>
  )
}

// ---------- Shared dropdown body ----------
interface DropdownBodyProps {
  accounts: StoredAccount[]
  currentUserId: string
  currentRole: string | null
  displayName: string
  displayEmail: string
  switching: string | null
  onSwitch: (acct: StoredAccount) => void
  onAdd: () => void
  onSignOut: (acct: StoredAccount) => void
}

function DropdownBody({
  accounts,
  currentUserId,
  currentRole,
  displayName,
  displayEmail,
  switching,
  onSwitch,
  onAdd,
  onSignOut,
}: DropdownBodyProps) {
  const others = accounts.filter((a) => a.user_id !== currentUserId)

  return (
    <div className="absolute z-50 mt-2 w-72 right-0 sm:left-0 sm:right-auto rounded-xl border border-border bg-popover shadow-2xl shadow-black/40 overflow-hidden">
      <div className="p-2">
        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Currently signed in
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-accent/50 px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
            {initialsOf(displayName, displayEmail)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-[11px] text-muted-foreground">{displayEmail}</p>
          </div>
          {currentRole === 'admin' && (
            <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              ADMIN
            </span>
          )}
          <Check size={14} className="shrink-0 text-primary" />
        </div>
      </div>

      {others.length > 0 && (
        <div className="border-t border-border p-2">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Other accounts
          </p>
          <div className="space-y-1">
            {others.map((acct) => (
              <div
                key={acct.user_id}
                className="group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
              >
                <button
                  onClick={() => onSwitch(acct)}
                  disabled={switching === acct.user_id}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:opacity-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {initialsOf(acct.name, acct.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {acct.name || acct.email.split('@')[0]}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {acct.email}
                    </p>
                  </div>
                  {switching === acct.user_id && (
                    <span className="text-[10px] text-muted-foreground">Switching…</span>
                  )}
                </button>
                <button
                  onClick={() => onSignOut(acct)}
                  title="Remove account"
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border p-2">
        <button
          onClick={onAdd}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border">
            <Plus size={14} />
          </div>
          <span>Add another account</span>
        </button>
      </div>

      <div className="border-t border-border p-2">
        <button
          onClick={() => onSignOut({ user_id: currentUserId, email: displayEmail, name: displayName, role: currentRole, access_token: '', refresh_token: '', added_at: '' })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut size={14} />
          <span>Sign out of this account</span>
        </button>
      </div>
    </div>
  )
}