type ErrorStateProps = {
  message?: string
}

export function ErrorState({
  message = 'Something went wrong'
}: ErrorStateProps) {
  return (
    <>
      <span>{message}</span>
    </>
  )
}
