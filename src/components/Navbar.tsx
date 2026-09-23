import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User } from 'lucide-react'

export default function Navbar() {
  const { user, role } = useAuth()
  const location = useLocation()

  if (!user) return null

  const linkClass = (path: string) => 
    `flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
      location.pathname === path 
        ? 'bg-gray-200 font-medium text-gray-900' 
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <aside className="w-64 border-r bg-white flex flex-col justify-between p-4 h-full shrink-0">
      <div className="space-y-6">
        <Link to="/browse" className="font-bold text-xl block px-4">Study Vault</Link>
        
        <nav className="flex flex-col gap-1">
          <Link to="/browse" className={linkClass('/browse')}>Browse</Link>
          <Link to="/upload" className={linkClass('/upload')}>Upload</Link>
          <Link to="/my-uploads" className={linkClass('/my-uploads')}>My Uploads</Link>
          {role === 'admin' && (
            <Link to="/admin" className={linkClass('/admin')}>Admin Dashboard</Link>
          )}
        </nav>
      </div>

      {/* Account is pinned to the bottom */}
      <div>
        <Link to="/account" className={linkClass('/account')}>
          <User size={16} />
          <span>Account</span>
        </Link>
      </div>
    </aside>
  )
}