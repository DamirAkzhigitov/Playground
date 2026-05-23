import { Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <div className="flex min-h-[calc(100dvh_-_var(--global-header-height))] flex-col bg-background">
      <Outlet />
    </div>
  )
}
