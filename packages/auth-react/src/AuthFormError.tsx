import { AlertTriangle } from 'lucide-react'

import { cn } from './cn.js'

type AuthFormErrorProps = {
  message: string | null
  className?: string
}

export function AuthFormError({ message, className }: AuthFormErrorProps) {
  if (!message) return null
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive',
        className
      )}
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
