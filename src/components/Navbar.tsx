import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  User,
  Menu,
  X,
  Compass,
  Upload,
  FolderOpen,
  Bookmark,
  LayoutDashboard,
} from 'lucide-react'
import Logo from './Logo'
import AccountSwitcher from './AccountSwitcher'
import SidebarStats from './SidebarStats'

export default function Navbar() {
  const { user, role, warningCount } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const linkClass = (path: string) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'nav-active'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`

  const close = () => setOpen(false)

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b bg-card p-4 md:hidden">
        <Link
          to="/browse"
          onClick={close}
          className="flex items-center gap-2 font-display text-lg font-bold"
        >
          <Logo className="text-primary" size={20} />
          <span>Study Vault</span>
        </Link>
        <div className="flex items-center gap-2">
          <AccountSwitcher compact />
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 transform flex-col border-r bg-card p-4 transition-transform duration-200 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <Link
          to="/browse"
          onClick={close}
          className="hidden items-center gap-2 px-1 font-display text-xl font-bold tracking-tight text-foreground md:flex"
        >
          <Logo className="text-primary" size={22} />
          <span>Study Vault</span>
        </Link>

        {/* Profile card */}
        <div className="mt-6 hidden md:block">
          <AccountSwitcher />
        </div>

        {/* Main nav */}
        <nav className="mt-6 flex flex-col gap-0.5 pt-14 md:pt-0">
          <p className="hidden px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:block">
            Main
          </p>
          <Link to="/browse" onClick={close} className={linkClass('/browse')}>
            <Compass size={16} />
            <span>Browse</span>
          </Link>
          <Link to="/upload" onClick={close} className={linkClass('/upload')}>
            <Upload size={16} />
            <span>Upload</span>
          </Link>
          <Link
            to="/my-uploads"
            onClick={close}
            className={linkClass('/my-uploads')}
          >
            <FolderOpen size={16} />
            <span>My Uploads</span>
          </Link>
          <Link to="/saved" onClick={close} className={linkClass('/saved')}>
            <Bookmark size={16} />
            <span>Saved</span>
          </Link>
        </nav>

        {/* Stats card */}
        <div className="mt-6 hidden md:block">
          <SidebarStats />
        </div>

        {/* Admin nav */}
        {role === 'admin' && (
          <nav className="mt-6 flex flex-col gap-0.5">
            <p className="hidden px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:block">
              Admin
            </p>
            <Link to="/admin" onClick={close} className={linkClass('/admin')}>
              <LayoutDashboard size={16} />
              <span>Admin Dashboard</span>
            </Link>
          </nav>
        )}

        {/* Account link pinned to bottom */}
        <div className="mt-auto pt-4">
          <Link to="/account" onClick={close} className={linkClass('/account')}>
            <User size={16} />
            <span>Account</span>
            {warningCount > 0 && (
              <span className="ml-auto rounded-full bg-destructive/15 px-1.5 py-0.5 text-xs font-medium text-destructive">
                {warningCount}
              </span>
            )}
          </Link>
        </div>
      </aside>
    </>
  )
}