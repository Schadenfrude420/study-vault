import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Menu, X } from 'lucide-react'
import Logo from './Logo'
import AccountSwitcher from './AccountSwitcher'

export default function Navbar() {
  const { user, role, warningCount } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const linkClass = (path: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
      location.pathname === path
        ? 'nav-active font-medium'
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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 transform flex-col justify-between border-r bg-card p-4 transition-transform duration-200 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <Link
            to="/browse"
            onClick={close}
            className="hidden items-center gap-2 px-4 font-display text-xl font-bold tracking-tight text-foreground md:flex"
          >
            <Logo className="text-primary" size={22} />
            <span>Study Vault</span>
          </Link>

          {/* Account Switcher — desktop only (mobile has its own compact one) */}
          <div className="hidden md:block">
            <AccountSwitcher />
          </div>

          <nav className="flex flex-col gap-1 pt-14 md:pt-0">
            <Link to="/browse" onClick={close} className={linkClass('/browse')}>
              Browse
            </Link>
            <Link to="/upload" onClick={close} className={linkClass('/upload')}>
              Upload
            </Link>
            <Link to="/my-uploads" onClick={close} className={linkClass('/my-uploads')}>
              My Uploads
            </Link>
            {role === 'admin' && (
              <Link to="/admin" onClick={close} className={linkClass('/admin')}>
                Admin Dashboard
              </Link>
            )}
          </nav>
        </div>

        <div>
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