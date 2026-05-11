import { BarChart2, Download, Home, ListChecks } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/apartments', label: 'Apartments', icon: Home },
  { to: '/questions', label: 'Questions', icon: ListChecks },
  { to: '/compare', label: 'Compare', icon: BarChart2 },
  { to: '/export', label: 'Export', icon: Download }
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 sm:px-6">
        <Outlet />
      </main>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <ul
          className="mx-auto flex max-w-3xl items-stretch justify-around px-2"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <li key={tab.to} className="flex-1">
                <NavLink
                  to={tab.to}
                  className={({ isActive }) =>
                    cn(
                      'flex h-14 min-h-14 flex-col items-center justify-center gap-1 rounded-md px-2 text-xs font-medium transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )
                  }
                >
                  <Icon aria-hidden="true" className="size-5" />
                  <span>{tab.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
      <Toaster position="top-center" richColors />
    </div>
  )
}
