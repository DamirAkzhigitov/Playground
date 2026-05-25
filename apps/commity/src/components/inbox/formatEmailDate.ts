export function formatEmailDate(raw: string): string {
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}
