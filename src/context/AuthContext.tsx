import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { upsertStoredAccount } from '../lib/accountSwitcher'

type AuthContextType = {
  user: User | null
  role: string | null
  warningCount: number
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  warningCount: 0,
  loading: true,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [warningCount, setWarningCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const persistSession = (session: Session | null) => {
    if (!session) return
    upsertStoredAccount({
      user_id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || null,
      role: null, // will be filled after profile fetch if you want
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      added_at: new Date().toISOString(),
    })
  }

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('role, is_banned, banned_reason')
      .eq('user_id', userId)
      .single()

    if (data?.is_banned) {
      localStorage.setItem(
        'sv_banned_reason',
        data.banned_reason || 'Your account has been suspended.'
      )
      await supabase.auth.signOut()
      return
    }

    setRole(data?.role ?? 'student')

    const { count } = await supabase
      .from('warnings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('acknowledged', false)
    setWarningCount(count ?? 0)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      persistSession(session)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      persistSession(session)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setRole(null)
        setWarningCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, role, warningCount, loading, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)