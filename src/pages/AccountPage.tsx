import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export default function AccountPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pwMessage, setPwMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
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

  if (!user) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Account Details</h1>

      {/* Profile Info */}
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Email</label>
            <Input value={user.email || ''} disabled className="bg-gray-50" />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Role</label>
            <Input value={role} disabled className="bg-gray-50 capitalize" />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Display Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {message && (
            <p className={`text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          <Button onClick={handleSaveName} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          {pwMessage && (
            <p className={`text-sm ${pwMessage.startsWith('Error') || pwMessage.includes('must') ? 'text-red-500' : 'text-green-600'}`}>
              {pwMessage}
            </p>
          )}

          <Button onClick={handleChangePassword} disabled={passwordLoading} variant="outline">
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Logout Section */}
      <Card>
        <CardHeader><CardTitle>Logout</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">End your current session safely.</p>
          <Button variant="destructive" onClick={handleLogout}>Logout</Button>
        </CardContent>
      </Card>
    </div>
  )
}