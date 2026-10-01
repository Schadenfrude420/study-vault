import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import EmptyState from '../components/EmptyState'
import Pagination from '../components/Pagination'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { toast } from 'sonner'
import {
  UserX,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Ban,
  Users as UsersIcon,
} from 'lucide-react'

const PAGE_SIZE = 10

export default function AdminUsersPanel() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const [warnOpen, setWarnOpen] = useState(false)
  const [warnTarget, setWarnTarget] = useState<{ id: string; email: string } | null>(null)
  const [warnReason, setWarnReason] = useState('')
  const [warnSubmitting, setWarnSubmitting] = useState(false)

  const [banConfirm, setBanConfirm] = useState<{
    open: boolean
    id: string
    email: string
    reason: string
  }>({ open: false, id: '', email: '', reason: '' })

  const fetchUsers = async (targetPage = page) => {
    setLoading(true)
    const from = (targetPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error, count } = await supabase
      .from('users')
      .select('user_id, name, email, role, is_banned, banned_reason, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) toast.error(error.message)
    else {
      setUsers(data || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const openWarn = (id: string, email: string) => {
    setWarnTarget({ id, email })
    setWarnReason('')
    setWarnOpen(true)
  }

  const handleWarn = async () => {
    if (!warnTarget || !me) return
    if (!warnReason.trim()) return toast.error('Reason is required.')

    setWarnSubmitting(true)
    const { error } = await supabase.from('warnings').insert({
      user_id: warnTarget.id,
      issued_by: me.id,
      reason: warnReason.trim(),
    })
    if (error) toast.error(error.message)
    else {
      toast.success('Warning issued.')
      setWarnOpen(false)
    }
    setWarnSubmitting(false)
  }

  const handleBan = async () => {
    if (!banConfirm.id) return
    if (!banConfirm.reason.trim()) return toast.error('Reason is required.')

    setPendingId(banConfirm.id)
    const { error } = await supabase
      .from('users')
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        banned_reason: banConfirm.reason.trim(),
      })
      .eq('user_id', banConfirm.id)
    if (error) toast.error(error.message)
    else {
      toast.success('User banned.')
      await fetchUsers(page)
    }
    setPendingId(null)
  }

  const handleUnban = async (userId: string) => {
    setPendingId(userId)
    const { error } = await supabase
      .from('users')
      .update({ is_banned: false, banned_at: null, banned_reason: null })
      .eq('user_id', userId)
    if (error) toast.error(error.message)
    else {
      toast.success('User unbanned.')
      await fetchUsers(page)
    }
    setPendingId(null)
  }

  if (loading) {
    return (
      <div className="divide-y divide-border rounded-md border border-border bg-card">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="No users"
        description="Users will appear here once they sign up."
      />
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Joined</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const isMe = u.user_id === me?.id
                const isAdmin = u.role === 'admin'
                const protectedRow = isMe || isAdmin
                const isPending = pendingId === u.user_id
                const busy = pendingId !== null

                return (
                  <tr key={u.user_id} className="transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {u.name || 'Unnamed'}
                        {isMe && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          isAdmin
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_banned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-1 text-xs font-medium text-destructive">
                          <Ban size={12} /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-1 text-xs font-medium text-green-500">
                          <ShieldCheck size={12} /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={protectedRow || busy}
                          onClick={() => openWarn(u.user_id, u.email)}
                          className="h-8 gap-1"
                        >
                          <AlertTriangle size={14} /> Warn
                        </Button>
                        {u.is_banned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={protectedRow || busy}
                            onClick={() => handleUnban(u.user_id)}
                            className="h-8 gap-1"
                          >
                            {isPending ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <ShieldCheck size={14} />
                            )}
                            Unban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={protectedRow || busy}
                            onClick={() =>
                              setBanConfirm({
                                open: true,
                                id: u.user_id,
                                email: u.email,
                                reason: '',
                              })
                            }
                            className="h-8 gap-1"
                          >
                            <UserX size={14} /> Ban
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <Dialog open={warnOpen} onOpenChange={(o) => !o && setWarnOpen(false)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-display">Issue warning</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Sending a warning to <span className="text-foreground">{warnTarget?.email}</span>.
              They'll see it on their Account page.
            </p>
            <textarea
              maxLength={300}
              rows={3}
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              placeholder="Explain what they did wrong…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-right text-xs text-muted-foreground">
              {warnReason.length}/300
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarnOpen(false)} disabled={warnSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleWarn} disabled={warnSubmitting}>
              {warnSubmitting ? 'Sending…' : 'Send warning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={banConfirm.open}
        onOpenChange={(o) => !o && setBanConfirm((c) => ({ ...c, open: false }))}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-destructive">
              <UserX className="h-4 w-4" />
              Ban user?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">{banConfirm.email}</span> will be
              immediately logged out and blocked from signing in. Their uploads stay
              visible unless you hide them separately.
            </p>
            <textarea
              maxLength={300}
              rows={3}
              value={banConfirm.reason}
              onChange={(e) =>
                setBanConfirm((c) => ({ ...c, reason: e.target.value }))
              }
              placeholder="Reason for the ban (shown to the user)…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanConfirm((c) => ({ ...c, open: false }))}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBan}>
              Ban user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}