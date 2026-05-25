import type { ReactNode } from 'react'

type AuthFormLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthFormLayout({
  title,
  subtitle,
  children,
  footer
}: AuthFormLayoutProps) {
  return (
    <div className="flex min-h-[calc(100dvh_-_var(--global-header-height))] items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="space-y-6 p-6">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          {footer}
        </div>
      </div>
    </div>
  )
}
