import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { toast } from 'sonner'
import { Trash2, AlertTriangle, AlertOctagon } from 'lucide-react'

export default function AccountPage() {
  const { user, warningCount, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pwMessage, setPwMessage] = useState<string | null>(null)

  const [warnings, setWarnings] = useState<any[]>([])

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchWarnings()
  }, [])

  const fetchProfile = async () => {
    if (!user) return
    const { data } = await supabase
      .from('users')
      .select('name, role')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setName(data.name || '')
      setRole(data.role || 'student')
    }
  }

  const fetchWarnings = async () => {
    if (!user) return
    const { data } = await supabase
      .from('warnings')
      .select('warning_id, reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setWarnings(data || [])
  }

  const handleSaveName = async () => {
    if (!user || !name.trim()) return
    setLoading(true)
    setMessage(null)

    const { error } = await supabase
      .from('users')
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (error) setMessage('Error: ' + error.message)
    else setMessage('Name updated successfully.')
    setLoading(false)
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPwMessage('Password must be at least 6 characters.')
      return
    }
    setPasswordLoading(true)
    setPwMessage(null)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) setPwMessage('Error: ' + error.message)
    else {
      setPwMessage('Password updated successfully.')
      setNewPassword('')
    }
    setPasswordLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    if (confirmEmail.trim().toLowerCase() !== (user.email ?? '').toLowerCase()) {
      toast.error('Email does not match.')
      return
    }

    setDeleting(true)
    const { error } = await supabase.rpc('delete_my_account')

    if (error) {
      toast.error('Failed to delete account: ' + error.message)
      setDeleting(false)
      return
    }

    toast.success('Account deleted. Goodbye!')
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!user) return <div className="p-8 text-muted-foreground">Loading...</div>

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Account Details</h1>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-destructive">
              <AlertOctagon className="h-4 w-4" />
              Warnings ({warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              An admin has issued you the following warnings. Please review and adjust
              your uploads accordingly.
            </p>
            <div className="space-y-2">
              {warnings.map((w) => (
                <div
                  key={w.warning_id}
                  className="rounded-md border border-destructive/30 bg-destructive/5 p-3"
                >
                  <p className="text-sm text-foreground">{w.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(w.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
            <Input value={user.email || ''} disabled className="bg-muted" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Role</label>
            <Input value={role} disabled className="bg-muted capitalize" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Display Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.startsWith('Error') ? 'text-destructive' : 'text-green-500'
              }`}
            >
              {message}
            </p>
          )}

          <Button onClick={handleSaveName} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          {pwMessage && (
            <p
              className={`text-sm ${
                pwMessage.startsWith('Error') || pwMessage.includes('must')
                  ? 'text-destructive'
                  : 'text-green-500'
              }`}
            >
              {pwMessage}
            </p>
          )}

          <Button onClick={handleChangePassword} disabled={passwordLoading} variant="outline">
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Logout</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            End your current session safely.
          </p>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">Delete account</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently removes your account, uploaded resources, reports, and ratings.
              This action cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmEmail('')
              setDeleteOpen(true)
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete my account
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) setDeleteOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Delete your account?
            </DialogTitle>
            <DialogDescription>
              This permanently removes your account and all associated data — uploads,
              reports, and ratings. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label htmlFor="confirm-email" className="text-sm font-medium text-foreground">
              Type <span className="font-semibold">{user.email}</span> to confirm:
            </label>
            <Input
              id="confirm-email"
              type="email"
              autoComplete="off"
              placeholder={user.email ?? ''}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={deleting}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={
                deleting ||
                confirmEmail.trim().toLowerCase() !== (user.email ?? '').toLowerCase()
              }
            >
              {deleting ? 'Deleting…' : 'Delete account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}