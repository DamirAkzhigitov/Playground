type LoadingStateProps = {
  label?: string
}

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
      {label}
    </div>
  )
}
