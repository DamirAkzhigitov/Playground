import { registerGlobalHeader } from '@playground/global-header'

registerGlobalHeader()

function initYear() {
  const year = document.getElementById('year')
  if (year) {
    year.textContent = String(new Date().getFullYear())
  }
}

function initLocalProjectLinks() {
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(
    window.location.hostname
  )

  if (!isLocalHost) return

  const projectLinks = document.querySelectorAll('a[data-local-href]')
  for (const link of projectLinks) {
    if (!(link instanceof HTMLAnchorElement)) continue

    const localHref = link.dataset.localHref
    if (localHref) {
      link.href = localHref
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initYear()
  initLocalProjectLinks()
})
