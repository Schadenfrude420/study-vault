import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'

export default function Sidebar() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2.5 text-sm rounded-md transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-medium'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <aside className="w-64 bg-white border-r flex flex-col justify-between hidden md:flex h-full">
      <div>
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Study Vault</h1>
        </div>
        <nav className="px-3 space-y-1">
          <NavLink to="/browse" className={linkClass}>Browse Resources</NavLink>
          <NavLink to="/upload" className={linkClass}>Upload Resource</NavLink>
          <NavLink to="/my-uploads" className={linkClass}>My Uploads</NavLink>
          
          {role === 'admin' && (
            <>
              <div className="pt-6 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </div>
              <NavLink to="/admin" className={linkClass}>Dashboard</NavLink>
            </>
          )}
        </nav>
      </div>
      
      <div className="p-4 border-t space-y-3">
        <p className="text-xs text-gray-500 truncate px-2">{user?.email}</p>
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </aside>
  )
}