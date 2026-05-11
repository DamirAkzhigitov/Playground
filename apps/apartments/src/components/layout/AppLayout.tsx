import { BarChart2, Download, Home, ListChecks } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/apartments', label: 'Apartments', icon: Home },
  { to: '/questions', label: 'Questions', icon: ListChecks },
  { to: '/compare', label: 'Compare', icon: BarChart2 },
  { to: '/export', label: 'Export', icon: Download }
] as const

export function AppLayout() {
  return (
    <div className="min-h-[calc(100dvh_-_var(--global-header-height))] bg-background text-foreground">
      <main className="pb-page-tabs mx-auto w-full max-w-3xl px-4 pt-4 print:max-w-none print:pb-4 sm:px-6">
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
                      {tab.label}
                    </span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
      <Toaster
        position="top-center"
        richColors
        className="toaster group print:hidden"
      />
    </div>
  )
}
