import { LogOut, User } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const navItems = [
    { to: '/actions', label: 'Browse actions' },
    ...(user ? [{ to: '/my', label: 'My guides' }] : [])
  ]

  return (
    <div className="min-h-[calc(100dvh_-_var(--global-header-height))] bg-background text-foreground">
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <NavLink
              to="/"
              className="font-semibold tracking-tight text-lg text-foreground hover:text-primary transition-colors"
            >
              Steps
            </NavLink>
            <nav aria-label="Primary" className="hidden sm:block">
              <ul className="flex items-center gap-1 text-sm">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'rounded-lg px-3 py-1.5 transition-colors',
                          isActive
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.role === 'contributor' || user.role === 'admin' ? (
                  <NavLink
                    to="/contributor"
                    className={({ isActive }) =>
                      cn(
                        'hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )
                    }
                  >
                    Contributor
                  </NavLink>
                ) : null}
                <span className="hidden md:inline text-xs text-muted-foreground max-w-[12rem] truncate">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-1.5 text-muted-foreground"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                <User aria-hidden="true" className="size-4 mr-1.5" />
                Sign in
              </Button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <nav
          aria-label="Primary mobile"
          className="sm:hidden border-t px-4 py-2"
        >
          <ul className="flex items-center justify-around text-sm">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-1 transition-colors',
                      isActive
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            {user && (user.role === 'contributor' || user.role === 'admin') && (
              <li>
                <NavLink
                  to="/contributor"
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-1 transition-colors',
                      isActive
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                    )
                  }
                >
                  Contributor
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
