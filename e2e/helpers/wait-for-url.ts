export async function waitForUrl(
  url: string,
  opts: { timeoutMs?: number; expectBody?: string } = {}
): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? 120_000
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        await sleep(400)
        continue
      }
      if (opts.expectBody) {
        const body = await response.text()
        if (!body.includes(opts.expectBody)) {
          await sleep(400)
          continue
        }
      }
      return
    } catch {
      await sleep(400)
    }
  }

  throw new Error(`Timed out waiting for ${url}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
