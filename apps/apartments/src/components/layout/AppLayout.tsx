import { BarChart2, Home, ListChecks, LogOut, Settings } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  const tabs = [
    { to: '/apartments', labelKey: 'nav.apartments' as const, icon: Home },
    { to: '/questions', labelKey: 'nav.questions' as const, icon: ListChecks },
    { to: '/compare', labelKey: 'nav.compare' as const, icon: BarChart2 },
    // TODO: not ready yet
    // { to: '/export', labelKey: 'nav.export' as const, icon: Download },
    { to: '/settings', labelKey: 'nav.settings' as const, icon: Settings }
  ] as const

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-[calc(100dvh_-_var(--global-header-height))] bg-background text-foreground">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-3 sm:px-6">
        <span className="truncate text-xs text-muted-foreground">
          {user?.email}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-1 text-xs text-muted-foreground"
        >
          <LogOut aria-hidden="true" className="size-3.5" />
          <span className="sr-only sm:not-sr-only">{t('auth.logout')}</span>
        </Button>
      </header>
      <main className="pb-page-tabs mx-auto w-full max-w-3xl px-4 pt-2 print:max-w-none print:pb-4 sm:px-6">
        <Outlet />
      </main>
      <nav
        aria-label="Primary"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 print:hidden"
      >
        <div
          className="pointer-events-auto mx-3 mb-3 rounded-3xl border border-border/60 bg-card/95 shadow-lg shadow-black/10 backdrop-blur-md supports-[backdrop-filter]:bg-card/90 sm:mx-4"
          style={{
            paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))'
          }}
        >
          <ul className="mx-auto flex max-w-3xl items-stretch justify-around px-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <li
                  key={tab.to}
                  className="flex min-h-14 min-w-0 flex-1 flex-col justify-end pb-1"
                >
                  <NavLink
                    to={tab.to}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium leading-tight transition-colors sm:text-xs',
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )
                    }
                  >
                    <Icon aria-hidden="true" className="size-5 shrink-0" />
                    <span className="line-clamp-2 text-center">
                      {t(tab.labelKey)}
                    </span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </div>
  )
}
