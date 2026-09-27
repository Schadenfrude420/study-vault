import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

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
    setWarningCount(count ?? 0)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
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